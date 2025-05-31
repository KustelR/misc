import { formatByte } from "@/utils/formatByte";
import {
  AddressingMode,
  cmdToByte,
  CommandType,
  getAddressingModes,
} from "./instructions";
import { DoubleWord, Word } from "./memory";

interface Line {
  line: string;
  position: number;
}

const tokenRegex = /([{};:a-zA-Z0-9$(#)_]+(?:,\s?[XY])?)/gm;
const byteRegex = /[0-9a-f]{1,2}/gm;
const signRegex = /^[+-]/;

const labelReferenceRegex = /^[a-zA-Z]{3}\s#?([a-zA-Z_][a-zA-Z_0-9]+)$/;
const labelDeclarationRegex = /^([a-zA-Z_][a-zA-Z0-9_]*):$/;
const definitionRegex = /^define\s+([a-zA-Z_][a-zA-Z0-9_]*)\s[\$][a-zA-Z0-9]+$/;

const accumulatorAddressRegex = /^A$/;
const zeroPageAddressRegex = /\$[0-9a-f]{1,2}$/;
const absoluteAddressRegex = /\$[0-9a-f]{4}$/;
const zeroPageXAddressRegex = /\$[0-9a-f]{1,2},\s?[xX]/;
const zeroPageYAddressRegex = /\$[0-9a-f]{1,2},\s?[yY]/;
const absoluteXAddressRegex = /\$[0-9a-f]{4},\s?[xX]/;
const indirectAddressRegex = /\(\$[0-9a-f]{4}\)/;
const absoluteYAddressRegex = /\$[0-9a-f]{4},\s?[yY]/;
const indirectXAddressRegex = /\$\([0-9a-f]{4},\s?X\)/;
const indirectYAddressRegex = /\$\([0-9a-f]{4}\),\s?Y/;

const markedForReplaceRegex = /\{.*\}/gm;

export function compile(
  source: string,
  programStart: DoubleWord,
  log?: boolean,
): Array<Word> {
  const { lines, labels } = preassemble(source);
  if (log) {
    console.log(`Trying to assemble source:\n ${source}`);
    console.log(`Indexed source:\n ${lines.join("\n")}`);
  }
  return assemble(lines, labels, programStart);
}

function preassemble(source: string): {
  lines: string[];
  labels: { [key: string]: number };
} {
  const result: string[] = [];
  const lines = source.split("\n");
  const labels: { [key: string]: number } = {};
  const constants: { [key: string]: string } = {};
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const { isDefinition, isLabel, hasReference } = getLineType(trimmed);

    if (isLabel) {
      const match = trimmed.match(labelDeclarationRegex)![0];
      labels[match.slice(0, -1)] = index;
    }
    if (isDefinition) {
      const tokens = trimmed.match(tokenRegex);
      if (tokens && tokens.length > 1) {
        constants[tokens[1]] = tokens[2];
      }
    }

    if (hasReference) {
      let modifiedLine = "";
      const tokens = trimmed.match(tokenRegex)!;
      const label = tokens[1].match(/[a-zA-Z_][a-zA-Z_0-9]*/)![0];
      if (label in labels) {
        modifiedLine = trimmed.replace(label, `{${label}}`);
      }
      if (label in constants) {
        modifiedLine = trimmed.replace(label, constants[label]);
      }
      if (!modifiedLine) {
        throw new Error(`Undefined label or constant: ${label}`);
      }
      result.push(modifiedLine);
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
  const labeledLines: { [key: number]: string } = {};
  Object.entries(labels).forEach(([label, index]) => {
    labeledLines[index + 1] = label;
  });
  const labelAddresses: { [key: string]: DoubleWord } = {};
  const result: Word[] = [];
  lines.forEach((line, index) => {
    const { isDefinition, isLabel, hasReference } = getLineType(line);
    if (isDefinition || isLabel) return;
    if (index in labeledLines) {
      labelAddresses[labeledLines[index]] = new DoubleWord(
        result.length + programStart.value,
      );
    }
    if (line.startsWith(";")) return;
    const compiled = assembleLine(
      line,
      index,
      new DoubleWord(programStart.value + result.length),
      labelAddresses,
    );
    result.push(...compiled);
  });
  return result;
}

function assembleLine(
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

    instruction = CommandType[tokens[0] as keyof typeof CommandType];

    if (!instruction)
      throw new Error(`Unknown instruction at line ${position}: ${tokens[0]}`);

    let addressToken = "";
    if (tokens[1] && markedForReplaceRegex.test(tokens[1])) {
      const target = tokens[1].slice(1, -1);
      if (target in labelAddresses) {
        addressToken =
          "$" +
          formatByte(labelAddresses[target].most(), true) +
          formatByte(labelAddresses[target].least(), true);
      }
    } else if (tokens[1]) {
      addressToken = tokens[1];
    }

    try {
      addressingMode = getAddressMode(instruction, tokens.length, addressToken);
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
      CommandType[instruction],
      AddressingMode[addressingMode],
      `${addressToken} as ${trailingBytes.map((b) => formatByte(b)).join(", ")}`,
    );
    */
  }
  return result;
}

function getAddressMode(
  commandType: CommandType,
  tokensLength: number,
  addressToken: string,
): AddressingMode {
  const trimmed = addressToken.trim();
  if (tokensLength === 1) {
    const addressingModes = getAddressingModes(commandType);
    return Number(Object.entries(addressingModes[0]));
  }
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

function getArgumentBytes(token: string): Word[] {
  const match = token.match(byteRegex);
  const sign = token.match(signRegex);
  const isNegative = sign && sign[0] === "-";
  if (!match) throw new Error(`Invalid argument: ${token}`);
  return match
    .map(
      (byte) =>
        new Word(isNegative ? 0x80 | parseInt(byte, 16) : parseInt(byte, 16)),
    )
    .reverse();
}

function getLineType(line: string): {
  isDefinition: boolean;
  isLabel: boolean;
  hasReference: boolean;
} {
  const isLabel = labelDeclarationRegex.test(line);
  const isDefinition = definitionRegex.test(line);
  const hasReference = labelReferenceRegex.test(line);

  return { isDefinition, isLabel, hasReference };
}
