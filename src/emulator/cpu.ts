import { MemoryError } from "./errors";
import {
  AddressingMode,
  byteToCmd,
  Command,
  CommandType,
  getArgumentLength,
  Instruction,
} from "./instructions";
import { DoubleWord, Memory, Word } from "./memory";

export enum ByteRegister {
  ida,
  idx,
  idy,
  sp,
  ps,
}

export interface ProcessorStatus {
  carry: boolean;
  zero: boolean;
  irqDisabled: boolean;
  decimal: boolean;
  brkCommand: boolean;
  overflow: boolean;
  negative: boolean;
}

enum StatusPosition {
  carry,
  zero,
  irqDisabled,
  decimal,
  brkCommand,
  overflow,
  negative,
}

function statusToReg(status: ProcessorStatus) {
  const register = new Word(0);
  register.value = status.carry ? 1 << StatusPosition.carry : 0;
  register.value |= status.zero ? 1 << StatusPosition.zero : 0;
  register.value |= status.irqDisabled ? 1 << StatusPosition.irqDisabled : 0;
  register.value |= status.decimal ? 1 << StatusPosition.decimal : 0;
  register.value |= status.brkCommand ? 1 << StatusPosition.brkCommand : 0;
  register.value |= status.overflow ? 1 << StatusPosition.overflow : 0;
  register.value |= status.negative ? 1 << StatusPosition.negative : 0;
  return register;
}

function statusFromReg(register: Word) {
  return {
    carry: !!register.bit(StatusPosition.carry),
    zero: !!register.bit(StatusPosition.zero),
    irqDisabled: !!register.bit(StatusPosition.irqDisabled),
    decimal: !!register.bit(StatusPosition.decimal),
    brkCommand: !!register.bit(StatusPosition.brkCommand),
    overflow: !!register.bit(StatusPosition.overflow),
    negative: !!register.bit(StatusPosition.negative),
  };
}

export type CPURegisters = {
  [key in ByteRegister]: Word;
};

export class CPU {
  registers: CPURegisters;
  programCounter: DoubleWord;
  registerListeners: ((cpu: CPU) => void)[];

  memory: Memory;
  memoryListeners: ((m: Memory) => void)[];
  constructor() {
    this.registers = {
      [ByteRegister.ida]: new Word(0x0),
      [ByteRegister.idx]: new Word(0x0),
      [ByteRegister.idy]: new Word(0x0),
      [ByteRegister.sp]: new Word(0x0),
      [ByteRegister.ps]: new Word(0x0),
    };
    this.programCounter = new DoubleWord(0x0);

    this.memory = new Memory();

    this.memoryListeners = [];
    this.registerListeners = [];
  }

  getProcessorStatus(): ProcessorStatus {
    return statusFromReg(this.registers[ByteRegister.ps]);
  }

  toggleStatus(position: number) {
    if (position < 0 || position > 7) return;
    const status = this.registers[ByteRegister.ps];
    status.value ^= 1 << position;
    this.setByteRegister(ByteRegister.ps, status);
  }
  writeMemory(address: DoubleWord, value: Word) {
    this.memory.writeByte(address, value);
    this.memoryListeners.forEach((listener) => listener(this.memory));
  }
  addMemoryListener(listener: (m: Memory) => void) {
    this.memoryListeners.push(listener);
  }

  setByteRegister(register: ByteRegister, value: Word) {
    this.registers[register] = value;
    this.registerListeners.forEach((listener) => listener(this));
  }
  setProgramCounter(value: DoubleWord) {
    this.programCounter = value;
    this.registerListeners.forEach((listener) => listener(this));
  }
  addRegisterListener(listener: (cpu: CPU) => void) {
    this.registerListeners.push(listener);
  }

  getValue(mode: AddressingMode, data: Word[]) {
    switch (mode) {
      case AddressingMode.immediate:
        return data[0];
      case AddressingMode.zeroPage:
      default:
        return this.memory.readByte(
          getMemoryAddress(this.registers, this.memory, mode, data),
        );
    }
  }

  execute(instruction: Instruction) {
    switch (instruction.command.commandType) {
      case CommandType.adc: {
        let value;
        value = this.getValue(
          instruction.command.addressingMode,
          instruction.trailingBytes,
        );
        const result = this.registers[ByteRegister.ida].sum(value);

        let status = statusFromReg(this.registers[ByteRegister.ps]);
        status.overflow = result.isOverflown;
        this.setByteRegister(ByteRegister.ps, statusToReg(status));

        this.setByteRegister(ByteRegister.ida, result.value);
        break;
      }
      case CommandType.sta: {
        const address = getMemoryAddress(
          this.registers,
          this.memory,
          instruction.command.addressingMode,
          instruction.trailingBytes,
        );
        this.writeMemory(address, this.registers[ByteRegister.ida]);
        break;
      }
      case CommandType.inx: {
        const result = this.registers[ByteRegister.idx].sum(new Word(1));
        this.setByteRegister(ByteRegister.idx, result.value);
        break;
      }
    }
  }
  readInstruction(): { instruction: Instruction; offset: number } {
    const command = byteToCmd(this.memory.readByte(this.programCounter));
    if (command === undefined) {
      throw new Error("Invalid opcode");
    }
    const instruction: Instruction = { command, trailingBytes: [] };
    const argsLength = getArgumentLength(command.addressingMode);
    for (let i = 1; i < argsLength + 1; i++) {
      instruction.trailingBytes.push(
        this.memory.readByte(this.programCounter.sum(new DoubleWord(i)).value),
      );
    }
    return { instruction, offset: argsLength };
  }

  start() {
    while (true) {
      const { instruction, offset } = this.readInstruction();
      if (instruction.command.commandType == CommandType.brk) {
        this.toggleStatus(StatusPosition.brkCommand);
        this.programCounter.increment();
        break;
      }
      this.execute(instruction);
      this.programCounter = this.programCounter.sum(
        new DoubleWord(offset),
      ).value;
      this.programCounter.increment();
    }
    this.registerListeners.forEach((listener) => listener(this));
    this.memoryListeners.forEach((listener) => listener(this.memory));
  }
}

/**
 * Accepts word or dword as input and outputs word. Clamps most significant bits
 */
function clampWord(value: Word | DoubleWord): Word {
  if (value instanceof DoubleWord) {
    return value.least();
  }
  return value;
}

function getMemoryAddress(
  registers: CPURegisters,
  memory: Memory,
  mode: AddressingMode,
  data: Word[],
): DoubleWord {
  switch (mode) {
    case AddressingMode.zeroPage:
      return new DoubleWord(data[0].value);
    case AddressingMode.absolute:
      return new DoubleWord(data[0].value | (data[1].value << 8));

    case AddressingMode.absoluteX: {
      return new DoubleWord(
        data[0].value |
          ((data[1].value << 8) + registers[ByteRegister.idx].value),
      );
    }
    case AddressingMode.absoluteY: {
      return new DoubleWord(
        data[0].value |
          ((data[1].value << 8) + registers[ByteRegister.idy].value),
      );
    }

    case AddressingMode.zeroPageX:
      return new DoubleWord(data[0].value + registers[ByteRegister.idx].value);
    case AddressingMode.zeroPageY:
      return new DoubleWord(data[0].value + registers[ByteRegister.idy].value);
    case AddressingMode.indirect: {
      const loc = new DoubleWord(data[0].value | (data[1].value << 8));
      const least = memory.readByte(loc);
      const most = memory.readByte(loc.sum(1).value);
      return new DoubleWord(least.value | (most.value << 8));
    }
    case AddressingMode.indirectX: {
      const loc = new DoubleWord(
        data[0].sum(registers[ByteRegister.idx]).value.value,
      );
      const least = memory.readByte(loc);
      const most = memory.readByte(loc.sum(1).value);
      return new DoubleWord(least.value | (most.value << 8));
    }
    case AddressingMode.indirectY: {
      const locTemp = new DoubleWord(data[0].value);
      const { value, isOverflown } = locTemp.sum(
        registers[ByteRegister.idy].value,
      );
      const loc = new DoubleWord(value.value);
      const least = memory.readByte(loc);
      const most = memory
        .readByte(loc.sum(1).value)
        .sum(new Word(isOverflown ? 1 : 0)).value;
      return new DoubleWord(least.value | (most.value << 8));
    }
    default:
      throw new MemoryError(`Invalid addressing mode: ${mode}`);
  }
}
  