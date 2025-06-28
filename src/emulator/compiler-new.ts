import { getCmdFromToken } from "./compiler";
import {
  AddressingMode,
  cmdToByte,
  CommandType,
  getAddressingModes,
} from "./instructions";
import { Word } from "./memory";

interface Token {
  tokenType: "instruction" | "value" | "reference" | "definition" | "label";
  tokenText: string;
  result?: Word[];
}

interface AddressToken extends Token {
  tokenType: "value";
  addressingMode: AddressingMode | undefined;
}

interface InstructionToken extends Token {
  tokenType: "instruction";
  instruction: CommandType;
}

interface DefinitionToken extends Token {
  tokenType: "definition";
}

export function tokenize(raw: string): Array<Token> {
  const symbols = raw.split("");
  const tokens: Token[] = [];

  let hitComment: boolean = false;
  let hitComma: boolean = false;
  let tokenText: string = "";

  symbols.forEach((s) => {
    if (s === "\n") {
      const token = parseToken(tokenText);
      if (token) tokens.push(token);
      hitComma = false;
      hitComment = false;
      tokenText = "";
      return;
    }
    if (hitComment) return;
    if (s === ";") {
      hitComment = true;
    }
    if (s === ",") {
      hitComma = true;
    }
    if (/\s/.test(s) && !hitComma) {
      const token = parseToken(tokenText);
      if (token) tokens.push(token);
      tokenText = "";
      return;
    }
    if (/\s/.test(s) && hitComma) return;
    tokenText += s;
  });
  if (tokenText) {
    const token = parseToken(tokenText);
    if (token) tokens.push(token);
  }
  console.log(tokens);
  return tokens;
}

function parseToken(token: string): Token | undefined {
  const tokenInstruction = getCmdFromToken(token);
  const value = getValueFromToken(token);
  const isLabel = token.endsWith(":");
  const isDefinition = token === "define";
  const isReference =
    /^[a-zA-Z][a-zA-Z0-9]*$/.test(token) &&
    !value &&
    !tokenInstruction &&
    !isLabel &&
    !isDefinition;

  if (tokenInstruction) {
    return {
      tokenType: "instruction",
      tokenText: token,
      instruction: tokenInstruction,
    } as InstructionToken;
  }
  if (value) {
    console.log(token, value);
    const am = getAddressMode(token);
    if (!am) throw new Error(`Unknown addressing mode for token: ${token}`);
    return {
      addressingMode: am,
      tokenType: "value",
      tokenText: token,
      result: value,
    } as AddressToken;
  }
  if (isDefinition) {
    return {
      tokenType: "definition",
      tokenText: token,
    } as DefinitionToken;
  }
  if (isLabel) {
    return {
      tokenType: "label",
      tokenText: token.slice(0, -1),
    };
  }
  if (isReference) {
    return {
      tokenType: "reference",
      tokenText: token,
    };
  }
}

function getAddressMode(token: string): AddressingMode | undefined {
  if (accumulatorAddressRegex.test(token)) return AddressingMode.accumulator;
  if (token.startsWith("#")) return AddressingMode.immediate;
  if (zeroPageAddressRegex.test(token)) return AddressingMode.zeroPage;
  if (absoluteAddressRegex.test(token)) return AddressingMode.absolute;
  if (zeroPageXAddressRegex.test(token)) return AddressingMode.zeroPageX;
  if (zeroPageYAddressRegex.test(token)) return AddressingMode.zeroPageY;
  if (token.startsWith("*")) return AddressingMode.relative;
  if (indirectAddressRegex.test(token)) return AddressingMode.indirect;
  if (absoluteXAddressRegex.test(token)) return AddressingMode.absoluteX;
  if (absoluteYAddressRegex.test(token)) return AddressingMode.absoluteY;
  if (indirectXAddressRegex.test(token)) return AddressingMode.indirectX;
  if (indirectYAddressRegex.test(token)) return AddressingMode.indirectY;
  return;
}

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

export function getValueFromToken(token: string): Word[] | undefined {
  const value = token.match(valueRegex);
  if (!value) return;
  const match = value[0].match(byteRegex);
  const sign = token.match(signRegex);
  const isNegative = sign && sign[1] === "-";
  if (!match) return;
  return match
    .map(
      (byte) =>
        new Word(isNegative ? 0x80 | parseInt(byte, 16) : parseInt(byte, 16)),
    )
    .reverse();
}

const valueRegex = /^(?:\#?\$?\*?[+-]?)([0-9a-f]{1}$|(?:[0-9a-f]{2})+)$/gm;
const byteRegex = /([0-9a-f]{1}|[0-9a-f]{2})+/gm;
const signRegex = /^\*([+-])/;

export function getReferencedLabel() {}

function assemble(tokens: Token[]): Word[] {
  const result: Word[] = [];
  const labels: Record<string, number> = {};
  const constants: Record<string, Word[]> = {};
  let length = 0;
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    if (token.tokenType === "instruction") {
    }
  }
  return result;
}

function processInstruction(
  token: Token,
  nextToken: Token,
): { data: Word[]; offset: number } {
  const instruction = token as InstructionToken;
  const instructionType = instruction.instruction;
  let offset = 0;
  let addressingMode: AddressingMode | undefined = undefined;
  const addressingModes = getAddressingModes(instruction.instruction);
  if (Object.entries(addressingModes).length === 1) {
    addressingMode = Object.values(addressingModes)[0];
  } else {
    const argumentAM = getAddressMode(nextToken.tokenText);
    if (argumentAM) {
      addressingMode = argumentAM;
      if (!nextToken.result)
        throw new Error("No value for token: " + nextToken.tokenText);
      offset = nextToken.result.length;
    }
  }
  if (!addressingMode || !nextToken.result)
    throw new Error(
      "Can't determine addressing mode for: " +
        [instruction.tokenText, nextToken.tokenText].join(" "),
    );
  const command = { commandType: instruction.instruction, addressingMode };
  return {
    data: [cmdToByte(command), ...nextToken.result],
    offset,
  };
}
