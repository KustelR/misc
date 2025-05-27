import {
  AddressingMode,
  cmdToByte,
  CommandType,
  getAddressingModes,
} from "./instructions";
import { Word } from "./memory";

const tokenRegex = /([;:a-zA-Z0-9$(#)_]+(?:,\s?[XY])?)/gm;
const labelDeclarationRegex = /^([a-zA-Z_][a-zA-Z0-9_]*):$/;
const byteRegex = /[0-9a-f]{1,2}/gm;
const signRegex = /^[+-]/gm;

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

export function compile(source: string): Array<Word> {
  const preassembled = preassemble(source);
  return assemble(preassembled);
}

function preassemble(source: string): string {
  // TODO: Replace labels here
  return source;
}

function assemble(source: string): Array<Word> {
  const result: Word[] = [];
  const lines = source.split("\n");
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(";")) return;

    const compiled = assembleLine(trimmed);
    result.push(...compiled);
  });
  return result;
}

function assembleLine(line: string) {
  const result: Word[] = [];
  const tokens = line.match(tokenRegex);
  if (tokens) {
    let instruction: CommandType | undefined;
    let addressingMode: AddressingMode | undefined;
    if (labelDeclarationRegex.test(tokens[0])) {
      throw new Error("Encountered label in assemble step");
    }
    instruction = CommandType[tokens[0] as keyof typeof CommandType];

    if (!instruction) throw new Error(`Unknown instruction: ${tokens[0]}`);
    addressingMode = getAddressMode(instruction, tokens.length, tokens[1]);

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
  throw new Error("Can't determine addressing mode");
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
