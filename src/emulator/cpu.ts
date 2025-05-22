import { sta, inx, adc, lda, ldx, ldy } from "./cpu-instructions";
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

export function statusToReg(status: ProcessorStatus) {
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

export function statusFromReg(register: Word) {
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
  private registers: CPURegisters;
  get reg() {
    return this.registers;
  }
  set reg(value: CPURegisters) {
    this.registers = value;
    this.registerListeners.forEach((listener) => listener(this));
  }
  private programCounter: DoubleWord;
  set pc(value: DoubleWord) {
    this.programCounter = value;
    this.registerListeners.forEach((listener) => listener(this));
  }
  get pc() {
    return this.programCounter;
  }
  private registerListeners: ((cpu: CPU) => void)[];

  private memory: Memory;
  get mem() {
    return this.memory;
  }
  set mem(value: Memory) {
    this.memory = value;
    this.memoryListeners.forEach((listener) => listener(this.memory));
  }
  private memoryListeners: ((m: Memory) => void)[];
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
  updateArithmeticStatuses(data: {
    negative: boolean;
    carry: boolean;
    zero: boolean;
  }) {
    this.reg[ByteRegister.ps] = statusToReg({
      ...this.getProcessorStatus(),
      ...data,
    });
  }

  toggleStatus(position: StatusPosition) {
    if (position < 0 || position > 7) return;
    const status = this.reg[ByteRegister.ps];
    status.value ^= 1 << position;
    this.reg[ByteRegister.ps] = status;
  }
  writeMemory(address: DoubleWord, value: Word) {
    this.memory.writeByte(address, value);
    this.memoryListeners.forEach((listener) => listener(this.memory));
  }
  addMemoryListener(listener: (m: Memory) => void) {
    this.memoryListeners.push(listener);
  }
  addRegisterListener(listener: (cpu: CPU) => void) {
    this.registerListeners.push(listener);
  }
  setProgramCounter(value: DoubleWord) {
    this.programCounter = value;
    this.registerListeners.forEach((listener) => listener(this));
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
        adc.call(this, instruction);
        break;
      }
      case CommandType.sta:
        sta.call(this, instruction);
        break;
      case CommandType.inx:
        inx.call(this);
        break;
      case CommandType.lda:
        lda.call(this, instruction);
        break;
      case CommandType.ldx:
        ldx.call(this, instruction);
        break;
      case CommandType.ldy:
        ldy.call(this, instruction);
        break;
      default: {
        throw new Error(
          `Unknown instruction: ${CommandType[instruction.command.commandType]}`,
        );
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

export function getMemoryAddress(
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
      throw new MemoryError(`Invalid addressing mode: ${AddressingMode[mode]}`);
  }
}

export function arithmeticResultFlags(value: number | Word) {
  const result = value instanceof Word ? value.value : value;
  return {
    negative: (result & 0x80) !== 0,
    zero: result === 0,
    carry: result > 0xff,
  };
}
