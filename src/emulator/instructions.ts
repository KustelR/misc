import { Word } from "./memory";

export enum CommandType {
  adc,
  sda,
  inx,
}

export enum AddressingMode {
  implied,
  immediate,
  absolute,
  absoluteX,
  absoluteY,
  zeroPage,
  zeroPageX,
  zeroPageY,
}

export interface Command {
  commandType: CommandType;
  addressingMode: AddressingMode;
}

export interface Instruction {
  command: Command;
  trailingBytes: Word[];
}
