import { MemoryError } from "./errors";
import { AddressingMode, CommandType, Instruction } from "./instructions";
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

function statusToReg(status: ProcessorStatus) {
  const register = new Word(0);
  register.value = status.carry ? 1 : 0;
  register.value |= status.zero ? 1 << 1 : 0;
  register.value |= status.irqDisabled ? 1 << 2 : 0;
  register.value |= status.decimal ? 1 << 3 : 0;
  register.value |= status.brkCommand ? 1 << 4 : 0;
  register.value |= status.overflow ? 1 << 5 : 0;
  register.value |= status.negative ? 1 << 6 : 0;
  return register;
}

function statusFromReg(register: Word) {
  return {
    carry: !!register.bit(0),
    zero: !!register.bit(1),
    irqDisabled: !!register.bit(2),
    decimal: !!register.bit(3),
    brkCommand: !!register.bit(4),
    overflow: !!register.bit(5),
    negative: !!register.bit(6),
  };
}

export class CPU {
  registers: Word[];
  programCounter: DoubleWord;
  registerListeners: ((cpu: CPU) => void)[];

  memory: Memory;
  memoryListeners: ((m: Memory) => void)[];
  constructor() {
    this.registers = [
      new Word(0x0), // IDA
      new Word(0x0), // IDX
      new Word(0x0), // IDY
      new Word(0x0), // SP
      new Word(0x0), // PS
    ];
    this.programCounter = new DoubleWord(0x0);

    this.memory = new Memory();

    this.memoryListeners = [];
    this.registerListeners = [];
  }

  getProcessorStatus(): ProcessorStatus {
    return statusFromReg(this.registers[ByteRegister.ps]);
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
      default:
        throw new MemoryError(`Invalid addressing mode for read: ${mode}`);
    }
  }

  getMemoryAddress(mode: AddressingMode, data: Word[]): DoubleWord {
    switch (mode) {
      case AddressingMode.zeroPage:
        return new DoubleWord(data[0].toNumber());
      default:
        throw new MemoryError(`Invalid addressing mode for write: ${mode}`);
    }
  }

  perform(instruction: Instruction) {
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
      case CommandType.sda: {
        const address = this.getMemoryAddress(
          instruction.command.addressingMode,
          instruction.trailingBytes,
        );
        this.writeMemory(address, this.registers[ByteRegister.ida]);
        break;
      }
    }
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
