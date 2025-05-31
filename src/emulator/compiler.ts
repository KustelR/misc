import { formatByte } from "@/utils/formatByte";
import {
  AddressingMode,
  cmdToByte,
  CommandType,
  getAddressingModes,
} from "./instructions";
import { DoubleWord, Word } from "./memory";

const tokenRegex = /([{};:a-zA-Z0-9$(#)_]+(?:,\s?[XY])?)/gm;
const byteRegex = /[0-9a-f]{1,2}/gm;
const signRegex = /^[+-]/gm;

const labelReferenceRegex = /^[a-zA-Z]{3}\s#?([a-zA-Z_][a-zA-Z_0-9]+)$/gm;
const labelDeclarationRegex = /^([a-zA-Z_][a-zA-Z0-9_]*):$/gm;
const definitionRegex =
  /^define\s+([a-zA-Z_][a-zA-Z0-9_]*)\s[\$][a-zA-Z0-9]+$/gm;

const accumulatorAddressRegex = /^A$/;
const zeroPageAddressRegex = /\$[0-9a-f]{1,2}$/gm;
const absoluteAddressRegex = /^\$[0-9a-f]{4}$/gm;
const zeroPageXAddressRegex = /\$[0-9a-f]{1,2},\s?[xX]/gm;
const zeroPageYAddressRegex = /\$[0-9a-f]{1,2},\s?[yY]/gm;
const absoluteXAddressRegex = /\$[0-9a-f]{4},\s?[xX]/gm;
const indirectAddressRegex = /\(\$[0-9a-f]{4}\)/gm;
const absoluteYAddressRegex = /\$[0-9a-f]{4},\s?[yY]/gm;
const indirectXAddressRegex = /\$\([0-9a-f]{4},\s?X\)/gm;
const indirectYAddressRegex = /\$\([0-9a-f]{4}\),\s?Y/gm;

const markedForReplaceRegex = /\{.*\}/gm;

export function compile(
  source: string,
  programStart: DoubleWord,
  log?: boolean,
): Array<Word> {
  const { code, labels } = preassemble(source);
  if (log) {
    console.log(`Trying to assemble source:\n ${source}`);
    console.log(`Indexed source:\n ${code}`);
  }
  return assemble(code, labels, programStart);
}

function preassemble(source: string): {
  code: string;
  labels: { [key: string]: number };
} {
  const result: string[] = [];
  const lines = source.split("\n");
  const labels: { [key: string]: number } = {};
  const constants: { [key: string]: string } = {};
  lines.forEach((line, index) => {
    let resString = "";
    const trimmed = line.trim();
    const isLabel = labelDeclarationRegex.test(trimmed);
    const isDefinition = definitionRegex.test(trimmed);
    const hasReference = labelReferenceRegex.test(trimmed);

    if (isLabel) {
      const match = trimmed.match(labelDeclarationRegex)![0];
      labels[match.slice(0, -1)] =
        index - Object.keys(labels).length - Object.keys(constants).length;
      return;
    }
    if (isDefinition) {
      const tokens = trimmed.match(tokenRegex);
      if (tokens && tokens.length > 1) {
        constants[tokens[1]] = tokens[2];
      }
      return;
    }
    if (hasReference) {
      const tokens = trimmed.match(tokenRegex)!;
      const label = tokens[1].match(/[a-zA-Z_][a-zA-Z_0-9]*/)![0];
      if (label in labels) {
        resString = trimmed.replace(label, `{${label}}`);
      }
      if (label in constants) {
        resString = trimmed.replace(label, constants[label]);
      }
      console.log(trimmed, label, resString, labels, constants);
      result.push(resString);
      return;
    }
    result.push(trimmed);
  });
  return { code: result.join("\n"), labels };
}

function assemble(
  source: string,
  labels: { [key: string]: number },
  programStart: DoubleWord,
): Array<Word> {
  const labeledLines: { [key: number]: string } = {};
  Object.entries(labels).forEach(([label, number]) => {
    labeledLines[number] = label;
  });
  const labelAddresses: { [key: string]: DoubleWord } = {};
  const result: Word[] = [];
  const lines = source.split("\n");
  lines.forEach((line, index) => {
    if (index in labeledLines) {
      labelAddresses[labeledLines[index]] = new DoubleWord(
        result.length + programStart.value,
      );
    }
    if (line.startsWith(";")) return;
    const compiled = assembleLine(
      line,
      new DoubleWord(programStart.value + result.length),
      labelAddresses,
    );
    result.push(...compiled);
  });
  return result;
}

function assembleLine(
  line: string,
  offset: DoubleWord,
  labelAddresses: { [key: string]: DoubleWord },
): Word[] {
  const result: Word[] = [];
  const tokens = line.match(tokenRegex);
  if (tokens) {
    let instruction: CommandType | undefined;
    let addressingMode: AddressingMode | undefined;

    instruction = CommandType[tokens[0] as keyof typeof CommandType];

    if (!instruction) throw new Error(`Unknown instruction: ${tokens[0]}`);

    if (tokens[1] && markedForReplaceRegex.test(tokens[1])) {
      const target = tokens[1].slice(1, -1);
      if (target in labelAddresses) {
        tokens[1] =
          "$" +
          formatByte(labelAddresses[target].most(), true) +
          formatByte(labelAddresses[target].least(), true);
      }
    }

    try {
      addressingMode = getAddressMode(instruction, tokens.length, tokens[1]);
    } catch (e) {
      throw new Error(
        `Can't determine addressing mode at byte 0x${(offset.value + 1).toString(16)},
instruction: ${CommandType[instruction]}
argument: ${tokens[1]}
line: ${line}
error: ${e}`,
      );
    }

    const command = cmdToByte({
      commandType: instruction,
      addressingMode: addressingMode,
    });
    let trailingBytes: Word[] = [];
    if (tokens.length > 1) trailingBytes = getArgumentBytes(tokens[1]);
    if (command) {
      result.push(command);
      result.push(...trailingBytes);
    }
  }
  return result;
}

function getAddressMode(
  commandType: CommandType,
  tokensLength: number,
  addressToken: string,
): AddressingMode {
  if (tokensLength === 1) {
    const addressingModes = getAddressingModes(commandType);
    return Number(Object.entries(addressingModes[0]));
  }
  if (accumulatorAddressRegex.test(addressToken))
    return AddressingMode.accumulator;
  if (addressToken.startsWith("#")) return AddressingMode.immediate;
  if (zeroPageAddressRegex.test(addressToken)) return AddressingMode.zeroPage;
  if (absoluteAddressRegex.test(addressToken)) return AddressingMode.absolute;
  if (zeroPageXAddressRegex.test(addressToken)) return AddressingMode.zeroPageX;
  if (zeroPageYAddressRegex.test(addressToken)) return AddressingMode.zeroPageY;
  if (addressToken.startsWith("*")) return AddressingMode.relative;
  if (indirectAddressRegex.test(addressToken)) return AddressingMode.indirect;
  if (absoluteXAddressRegex.test(addressToken)) return AddressingMode.absoluteX;
  if (absoluteYAddressRegex.test(addressToken)) return AddressingMode.absoluteY;
  if (indirectXAddressRegex.test(addressToken)) return AddressingMode.indirectX;
  if (indirectYAddressRegex.test(addressToken)) return AddressingMode.indirectY;
  throw new AddressingError(`Unknown addressing mode: ${addressToken}`);
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
