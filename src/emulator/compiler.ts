import {
  AddressingMode,
  cmdToByte,
  CommandType,
  getAddressingModes,
} from "./instructions";
import { Word } from "./memory";

const tokenRegex = /([;:a-zA-Z0-9$(#)_]+(?:,\s?[XY])?)/gm;
const labelDeclarationRegex = /^([a-zA-Z_][a-zA-Z0-9_]*):$/;
const numberRegex = /\$?([0-9a-f]+)/gm;

const accumulatorAddressRegex = /^A$/;
const zeroPageAddressRegex = /\$[0-9a-f]{2}$/gm;
const absoluteAddressRegex = /\$[0-9a-f]{4}/gm;
const zeroPageXAddressRegex = /\$[0-9a-f]{2},\s?[X]/gm;
const zeroPageYAddressRegex = /\$[0-9a-f]{2},\s?[Y]/gm;

export function compile(source: string): Array<Word> {
  const result: Word[] = [];
  const lines = source.split("\n");
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(";")) return; // Skip empty lines and comments
    const tokens = line.match(tokenRegex);
    if (tokens) {
      let instruction: CommandType | undefined;
      let trailingBytes: Word[] = [];
      let addressingMode: AddressingMode | undefined;
      if (labelDeclarationRegex.test(tokens[0])) {
        // Handle label definition
        throw new Error("Labels not implemented yet");
      }
      instruction = CommandType[tokens[0] as keyof typeof CommandType];
      if (!instruction) throw new Error(`Unknown instruction: ${tokens[0]}`);
      if (tokens.length === 1) {
        const addressingModes = getAddressingModes(instruction);
        const addrM = Number(Object.entries(addressingModes[0]));
        addressingMode = addrM;
      }
      if (addressingMode === undefined)
        throw new Error(
          `Unknown addressing mode: ${addressingMode ? AddressingMode[addressingMode] : "undefined"}`,
        );
      const command = cmdToByte({
        commandType: instruction,
        addressingMode: addressingMode,
      });
      if (command) {
        result.push(command);
      }
    }
  });
  return result;
}

function getAddressMode(
  commandType: CommandType,
  addressToken: string,
): AddressingMode | undefined {
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
  return;
}

function getNumber(token: string): number | undefined {
  const match = token.match(numberRegex);
  if (match) {
    return parseInt(match[1], 16);
  }
  return;
}
