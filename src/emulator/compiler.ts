import {
  AddressingMode,
  cmdToByte,
  CommandType,
  getAddressingModes,
} from "./instructions";
import { Word } from "./memory";

const tokenRegex = /([;:a-zA-Z0-9$(#)_]+(?:,\s?[XY])?)/gm;
const labelDeclarationRegex = /^([a-zA-Z_][a-zA-Z0-9_]*):$/;
const byteRegex = /[0-9a-f]{2}/gm;

const accumulatorAddressRegex = /^A$/;
const zeroPageAddressRegex = /\$[0-9a-f]{2}$/gm;
const absoluteAddressRegex = /\$[0-9a-f]{4}/gm;
const zeroPageXAddressRegex = /\$[0-9a-f]{2},\s?[X]/gm;
const zeroPageYAddressRegex = /\$[0-9a-f]{2},\s?[Y]/gm;

export function compile(source: string): Array<Word> {
  const precompiled = precompile(source);
  return assemble(precompiled);
}

function precompile(source: string): string {
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
  if (accumulatorAddressRegex.test(addressToken)) {
    return AddressingMode.accumulator;
  }
  if (addressToken.startsWith("#")) {
    return AddressingMode.immediate;
  }
  if (zeroPageAddressRegex.test(addressToken)) {
    return AddressingMode.zeroPage;
  }
  if (absoluteAddressRegex.test(addressToken)) {
    return AddressingMode.absolute;
  }
  if (zeroPageXAddressRegex.test(addressToken)) {
    return AddressingMode.zeroPageX;
  }
  if (zeroPageYAddressRegex.test(addressToken)) {
    return AddressingMode.zeroPageY;
  }
  if (addressToken.startsWith("*") || commandType === CommandType.jmp) {
    return AddressingMode.relative;
  }
  throw new Error("Can't determine addressing mode");
}

function getArgumentBytes(token: string): Word[] {
  const match = token.match(byteRegex);
  if (!match) throw new Error(`Invalid argument: ${token}`);
  return match.map((byte) => new Word(parseInt(byte, 16))).reverse();
}
