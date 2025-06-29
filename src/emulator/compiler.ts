import { formatByte } from "@/utils/formatByte";
import { tokenize as kindaTokenize } from "./compiler-new";
import {
  AddressingMode,
  cmdToByte,
  CommandType,
  getAddressingModes,
  getArgumentLength,
  testBranchInstruction,
} from "./instructions";
import { DoubleWord, Word } from "./memory";

interface Line {
  line: string;
  position: number;
}

const tokenRegex = /((?:\*[+-])?[{};:a-zA-Z0-9$(#)_]+(?:,\s?[XY])?)\)?/gm;
const byteRegex = /[0-9a-f]{1,2}/gm;
const signRegex = /^\*([+-])/;

const labelReferenceRegex =
  /^[a-zA-Z]{3}\s#?([a-zA-Z_][a-zA-Z_0-9]+)(?:,\s?[XY])?$/;
const ambiguosReferenceRegex =
  /^[a-zA-Z]{3}\s#?\$?([a-fA-F0-9]+)(?:,\s?[XY])?$/;

const labelDeclarationRegex = /^([a-zA-Z_][a-zA-Z0-9_]*):$/;
const definitionRegex = /^define\s+([a-zA-Z_][a-zA-Z0-9_]*)\s[\$][a-zA-Z0-9]+$/;

const accumulatorAddressRegex = /^A$/;
const zeroPageAddressRegex = /\$[0-9a-f]{1,2}$/;
const absoluteAddressRegex = /\$[0-9a-f]{4}$/;
const zeroPageXAddressRegex = /^(?!\()\$[0-9a-f]{1,2},\s?[xX]/;
const zeroPageYAddressRegex = /\$[0-9a-f]{1,2},\s?[yY]/;
const absoluteXAddressRegex = /\$[0-9a-f]{4},\s?[xX]/;
const indirectAddressRegex = /\(\$[0-9a-f]{4}\)$/;
const absoluteYAddressRegex = /\$[0-9a-f]{4},\s?[yY]/;
const indirectXAddressRegex = /[0-9a-f]{1,2},\s?[xX]/;
const indirectYAddressRegex = /\(\$[0-9a-f]{2}\),\s?Y/;

export function compile(
  source: string,
  programStart: DoubleWord,
  log?: boolean,
): Array<Word> {
  const { lines, labels } = preassemble(source);
  kindaTokenize(source);
  /*
  if (log) {
    console.log(`Trying to assemble source:\n ${source}`);
    console.log(`Indexed source:\n ${lines.join("\n")}`);
  }
  return assemble(lines, labels, programStart);
  */
  return [];
}

function preassemble(source: string): {
  lines: string[];
  labels: { [key: string]: number };
} {
  const result: string[] = [];
  const lines = source.split("\n");
  const labels: { [key: string]: number } = {};
  const constants: { [key: string]: string } = {};

  const tempLines: string[] = [];
  let offset = 0;
  lines
    .filter((l) => !!l)
    .forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const {
        label: labelDefs,
        constants: constantDefs,
        raw,
      } = parseDefinitions(trimmed);
      if (labelDefs) labels[labelDefs] = index - offset;
      if (constantDefs) Object.assign(constants, constantDefs);
      if (raw) tempLines.push(raw);
      else offset++;
    });

  tempLines.forEach((line, index) => {
    const trimmed = line.trim();
    const tokens = tokenize(line);
    const { hasReference } = getLineType(trimmed);
    if (hasReference) {
      tokens[1] = processReference(tokens[1], labels, constants);
      result.push(tokens.join(" "));
      return;
    }
    result.push(trimmed);
  });
  return { lines: result, labels };
}

function assemble(
  lines: string[],
  labels: { [key: string]: number },
  programStart: DoubleWord,
): Array<Word> {
  const labeledLines: { [key: number]: string[] } = {};
  Object.entries(labels).forEach(([label, index]) => {
    if (!labeledLines[index]) labeledLines[index] = [];
    labeledLines[index].push(label);
  });
  const labelAddresses: { [key: string]: DoubleWord } = {};
  const result: Word[] = [];
  let estimatedLength = 0;
  lines.forEach((line, index) => {
    const tokens = tokenize(line);
    if (index in labeledLines) {
      labeledLines[index].forEach((item) => {
        labelAddresses[item] = new DoubleWord(
          estimatedLength + programStart.value,
        );
      });
    } else {
      try {
        const cmd = getCmdFromToken(tokens[0]);
        if (cmd !== undefined) {
          const addressingMode = getAddressMode(cmd, tokens[1]);
          const argumentLength = getArgumentLength(addressingMode);
          estimatedLength += argumentLength + 1;
        }
      } catch (e) {
        console.log(e);
      }
    }
  });
  lines.forEach((line, index) => {
    if (line.startsWith(";")) return;
    const compiled = lineToBytes(
      line,
      index,
      new DoubleWord(programStart.value + result.length),
      labelAddresses,
    );
    result.push(...compiled);
  });
  return result;
}

function lineToBytes(
  line: string,
  position: number,
  offset: DoubleWord,
  labelAddresses: { [key: string]: DoubleWord },
): Word[] {
  const result: Word[] = [];
  const tokens = line.match(tokenRegex);
  if (tokens) {
    let instruction: CommandType | undefined;
    let addressingMode: AddressingMode | undefined;

    instruction = getCmdFromToken(tokens[0]);

    if (instruction === undefined)
      throw new Error(
        `Unknown instruction at line ${position + 1}: ${tokens[0]}`,
      );

    const isBranchInstruction = testBranchInstruction(instruction);
    let addressToken = tokens.length > 1 ? tokens[1] : undefined;
    if (addressToken)
      addressToken = replaceLabels(
        addressToken,
        labelAddresses,
        offset,
        isBranchInstruction,
      );
    try {
      addressingMode = getAddressMode(instruction, addressToken);
    } catch (e) {
      throw new Error(
        `Can't determine addressing mode at  line ${position} (byte 0x${(offset.value + 1).toString(16)})\n${e}`,
      );
    }

    const command = cmdToByte({
      commandType: instruction,
      addressingMode: addressingMode,
    });
    let trailingBytes: Word[] = [];
    if (addressToken) trailingBytes = getArgumentBytes(addressToken);
    if (command) {
      result.push(command);
      result.push(...trailingBytes);
    }
    /*
    console.log(
      `line: ${position + 1}`,
      CommandType[instruction],
      AddressingMode[addressingMode],
      `${addressToken} as ${trailingBytes.map((b) => formatByte(b)).join(", ")}`,
    );
    */
  }
  return result;
}

export function getCmdFromToken(token: string): CommandType | undefined {
  return CommandType[token.toLowerCase() as keyof typeof CommandType];
}

export function getAddressMode(
  commandType: CommandType,
  addressToken?: string,
): AddressingMode {
  if (!addressToken) {
    const addressingModes = getAddressingModes(commandType);
    return Number(Object.entries(addressingModes[0]));
  }
  const trimmed = addressToken.trim();
  if (accumulatorAddressRegex.test(trimmed)) return AddressingMode.accumulator;
  if (trimmed.startsWith("#")) return AddressingMode.immediate;
  if (zeroPageAddressRegex.test(trimmed)) return AddressingMode.zeroPage;
  if (absoluteAddressRegex.test(trimmed)) return AddressingMode.absolute;
  if (zeroPageXAddressRegex.test(trimmed)) return AddressingMode.zeroPageX;
  if (zeroPageYAddressRegex.test(trimmed)) return AddressingMode.zeroPageY;
  if (trimmed.startsWith("*")) return AddressingMode.relative;
  if (indirectAddressRegex.test(trimmed)) return AddressingMode.indirect;
  if (absoluteXAddressRegex.test(trimmed)) return AddressingMode.absoluteX;
  if (absoluteYAddressRegex.test(trimmed)) return AddressingMode.absoluteY;
  if (indirectXAddressRegex.test(trimmed)) return AddressingMode.indirectX;
  if (indirectYAddressRegex.test(trimmed)) return AddressingMode.indirectY;
  throw new AddressingError(`Unknown addressing mode: ${trimmed}`);
}

class AddressingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AddressingError";
  }
}

export function getArgumentBytes(token: string): Word[] {
  const match = token.match(byteRegex);
  const sign = token.match(signRegex);
  const isNegative = sign && sign[1] === "-";
  if (!match) throw new Error(`Invalid argument: ${token}`);
  return match
    .map(
      (byte) =>
        new Word(isNegative ? 0x80 | parseInt(byte, 16) : parseInt(byte, 16)),
    )
    .reverse();
}

export function getLineType(line: string): {
  isDefinition: boolean;
  isLabel: boolean;
  hasReference: boolean;
} {
  const isLabel = labelDeclarationRegex.test(line);
  const isDefinition = definitionRegex.test(line);
  const hasReference = labelReferenceRegex.test(line);

  return { isDefinition, isLabel, hasReference };
}

export function tokenize(raw: string): Array<string> {
  const tokens = raw.trim().match(tokenRegex)!;
  return tokens;
}

export function replaceLabels(
  token: string,
  labels: { [key: string]: DoubleWord },
  offset: DoubleWord,
  relative?: boolean,
): string {
  const label = token.slice(1, -1);
  const address = labels[label];
  if (!address) return token;

  if (relative) {
    let distance = address.value - offset.value;
    return `*${distance > 0 ? "+" : ""}${distance.toString(16)}`;
  } else {
    return `$${formatByte(address.most(), true)}${formatByte(address.least(), true)}`;
  }
}

function parseDefinitions(source: string): {
  label?: string;
  constants?: { [key: string]: string };
  raw?: string;
} {
  const { isDefinition, isLabel } = getLineType(source);
  const tokens = tokenize(source);

  if (isLabel) {
    const match = source.match(labelDeclarationRegex)![0];
    return {
      label: match.slice(0, -1),
      constants: undefined,
      raw: undefined,
    };
  } else if (isDefinition) {
    if (tokens && tokens.length > 1) {
      return {
        label: undefined,
        constants: { [tokens[1]]: tokens[2] },
        raw: undefined,
      };
    }
  }
  return { label: undefined, constants: undefined, raw: source };
}

export function processReference(
  token: string,
  labels: { [key: string]: number },
  constants: { [key: string]: string },
): string {
  const label = token.match(/[a-zA-Z_][a-zA-Z_0-9]*/)![0];
  if (labels[label] !== undefined) return `{${label}}`;
  if (constants[label]) {
    if (!/^[$#]/.test(token[0])) {
      throw new Error("Reference should start with # or $");
    }
    return `${token[0]}${constants[label]}`;
  }

  throw new Error(`Undefined label or constant: ${token}`);
}
