import { Word } from "./memory";

export enum CommandType {
  adc,
  sda,
}

export enum AddressingMode {
  absolute,
  zeroPage,
  immediate,
}

export interface Command {
  commandType: CommandType;
  addressingMode: AddressingMode;
}

export interface Instruction {
  command: Command;
  trailingBytes: Word[];
}
