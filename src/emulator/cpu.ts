import {
  sta,
  inx,
  adc,
  lda,
  ldx,
  ldy,
  stx,
  sty,
  tax,
  tay,
  txa,
  tya,
  tsx,
  txs,
  plp,
  pla,
  php,
  pha,
  and,
  eor,
  ora,
  bit,
  sbc,
  cmp,
  cpx,
  cpy,
  inc,
  iny,
  dec,
  dex,
  dey,
  ror,
  rol,
  lsr,
  asl,
  jsr,
  jmp,
  rts,
  bcc,
  bcs,
  bvs,
  bvc,
  bpl,
  bne,
  bmi,
  beq,
  sec,
  sei,
  sed,
  clv,
  cli,
  cld,
  clc,
} from "./cpu-instructions";
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
import { Stack } from "./stack";

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

export enum StatusPosition {
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
    this.stack = new Stack();

    this.memoryListeners = [];
    this.registerListeners = [];
  }

  private cycles: number = 0;
  private cyclesListeners: ((cycles: number) => void)[] = [];
  addCyclesListener(listener: (cycles: number) => void) {
    this.cyclesListeners.push(listener);
  }

  private isForceStopped: boolean = false;
  stop() {
    this.isForceStopped = true;
  }

  private registers: CPURegisters;
  private programCounter: DoubleWord;
  private memoryListeners: ((m: Memory) => void)[];
  private registerListeners: ((cpu: CPU) => void)[];

  private memory: Memory;
  private stack: Stack;

  get reg() {
    return this.registers;
  }
  set reg(value: CPURegisters) {
    this.registers = value;
    this.registerListeners.forEach((listener) => listener(this));
  }

  set pc(value: DoubleWord) {
    this.programCounter = value;
    this.registerListeners.forEach((listener) => listener(this));
  }
  get pc() {
    return this.programCounter;
  }
  get mem() {
    return this.memory;
  }
  set mem(value: Memory) {
    this.memory = value;
    this.memoryListeners.forEach((listener) => listener(this.memory));
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

  pushStack(value: Word) {
    this.reg[ByteRegister.sp] = this.reg[ByteRegister.sp].increment().value;
    this.stack.push(value, this.reg[ByteRegister.sp]);
  }
  pullStack(): Word {
    const result = this.stack.pull(this.reg[ByteRegister.sp]);
    this.reg[ByteRegister.sp] = this.reg[ByteRegister.sp].decrement().value;
    return result;
  }

  setStatus(position: StatusPosition, value: boolean) {
    const status = this.reg[ByteRegister.ps];
    if (value) {
      status.value |= 1 << position;
    } else {
      status.value &= ~(1 << position);
    }
    this.reg[ByteRegister.ps] = status;
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
      case AddressingMode.relative:
        return data[0];
      case AddressingMode.accumulator:
        return this.reg[ByteRegister.ida];
      case AddressingMode.zeroPage:
      default:
        return this.memory.readByte(
          getMemoryAddress(this.registers, this.memory, mode, data),
        );
    }
  }

  async execute(instruction: Instruction): Promise<void | "break"> {
    return execute.call(this, instruction);
  }
  readInstruction(log?: boolean): { instruction: Instruction; offset: number } {
    const instructionByte = this.memory.readByte(this.programCounter);
    const command = byteToCmd(instructionByte);
    if (command === undefined) {
      throw new Error(`Invalid opcode: ${instructionByte.value}`);
    }
    const instruction: Instruction = { command, trailingBytes: [] };
    const argsLength = getArgumentLength(command.addressingMode);
    for (let i = 1; i < argsLength + 1; i++) {
      instruction.trailingBytes.push(
        this.memory.readByte(this.programCounter.sum(new DoubleWord(i)).value),
      );
    }
    if (log) {
      console.log(
        `Byte 0x${instructionByte.value.toString(16)} at pos 0x${this.programCounter.value.toString(16)} 
interpreted as  ${CommandType[command.commandType]} 
with addressing mode: ${AddressingMode[command.addressingMode]} (len: ${argsLength})
and arg bytes: ${JSON.stringify(instruction.trailingBytes.map((byte) => byte.value))}`,
      );
    }
    return { instruction, offset: argsLength };
  }

  async start(speed: number) {
    this.isForceStopped = false;
    const interval = setInterval(async () => {
      if (
        this.reg[ByteRegister.ps].bit(StatusPosition.brkCommand) ||
        this.isForceStopped
      ) {
        clearInterval(interval);
      }
      await this.step();
    }, speed);
  }

  async step() {
    this.cycles++;
    this.cyclesListeners.forEach((listener) => listener(this.cycles));

    this.programCounter = this.programCounter.sum(1).value;
    const { instruction, offset } = this.readInstruction();
    this.programCounter = this.programCounter.sum(new DoubleWord(offset)).value;
    const res = await this.execute(instruction);
    if (res === "break") {
      this.setStatus(StatusPosition.brkCommand, true);
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

function execute(this: CPU, instruction: Instruction) {
  switch (instruction.command.commandType) {
    case CommandType.adc: {
      adc.call(this, instruction);
      break;
    }
    case CommandType.sta:
      sta.call(this, instruction);
      break;
    case CommandType.inc:
      inc.call(this, instruction);
      break;
    case CommandType.inx:
      inx.call(this);
      break;
    case CommandType.iny:
      iny.call(this);
      break;
    case CommandType.dec:
      dec.call(this, instruction);
      break;
    case CommandType.dex:
      dex.call(this);
      break;
    case CommandType.dey:
      dey.call(this);
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
    case CommandType.stx:
      stx.call(this, instruction);
      break;
    case CommandType.sty:
      sty.call(this, instruction);
      break;
    case CommandType.tax:
      tax.call(this);
      break;
    case CommandType.tay:
      tay.call(this);
      break;
    case CommandType.txa:
      txa.call(this);
      break;
    case CommandType.tya:
      tya.call(this);
      break;
    case CommandType.tsx:
      tsx.call(this);
      break;
    case CommandType.txs:
      txs.call(this);
      break;
    case CommandType.pha:
      pha.call(this);
      break;
    case CommandType.php:
      php.call(this);
      break;
    case CommandType.pla:
      pla.call(this);
      break;
    case CommandType.plp:
      plp.call(this);
      break;
    case CommandType.and:
      and.call(this, instruction);
      break;
    case CommandType.eor:
      eor.call(this, instruction);
      break;
    case CommandType.ora:
      ora.call(this, instruction);
      break;
    case CommandType.bit:
      bit.call(this, instruction);
      break;
    case CommandType.sbc:
      sbc.call(this, instruction);
      break;
    case CommandType.cmp:
      cmp.call(this, instruction);
      break;
    case CommandType.cpx:
      cpx.call(this, instruction);
      break;
    case CommandType.cpy:
      cpy.call(this, instruction);
      break;
    case CommandType.asl:
      asl.call(this, instruction);
      break;
    case CommandType.lsr:
      lsr.call(this, instruction);
      break;
    case CommandType.rol:
      rol.call(this, instruction);
      break;
    case CommandType.ror:
      ror.call(this, instruction);
      break;
    case CommandType.jmp:
      jmp.call(this, instruction);
      break;
    case CommandType.jsr:
      jsr.call(this, instruction);
      break;
    case CommandType.rts:
      rts.call(this);
      break;
    case CommandType.bcc:
      bcc.call(this, instruction);
      break;
    case CommandType.bcs:
      bcs.call(this, instruction);
      break;
    case CommandType.beq:
      beq.call(this, instruction);
      break;
    case CommandType.bmi:
      bmi.call(this, instruction);
      break;
    case CommandType.bne:
      bne.call(this, instruction);
      break;
    case CommandType.bpl:
      bpl.call(this, instruction);
      break;
    case CommandType.bvc:
      bvc.call(this, instruction);
      break;
    case CommandType.bvs:
      bvs.call(this, instruction);
      break;
    case CommandType.sec:
      sec.call(this);
      break;
    case CommandType.sed:
      sed.call(this);
      break;
    case CommandType.sei:
      sei.call(this);
      break;
    case CommandType.clc:
      clc.call(this);
      break;
    case CommandType.cld:
      cld.call(this);
      break;
    case CommandType.cli:
      cli.call(this);
      break;
    case CommandType.clv:
      clv.call(this);
      break;
    case CommandType.nop:
      break;
    case CommandType.brk:
      return "break";
    default: {
      throw new Error(
        `Unknown instruction: ${CommandType[instruction.command.commandType]}`,
      );
    }
  }
}
