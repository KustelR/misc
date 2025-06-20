import { describe, expect, it, vi, afterEach } from "vitest";
import adc from "./adc";
import { AddressingMode, CommandType, Instruction } from "../instructions";
import { DoubleWord, Word } from "../memory";
import {
  ByteRegister,
  CPU,
  statusFromReg,
  StatusPosition,
  statusToReg,
} from "../cpu";
import and from "./and";
import asl from "./asl";
import bcs from "./bcs";
import bcc from "./bcc";
import beq from "./beq";
import bit from "./bit";
import bmi from "./bmi";
import bne from "./bne";
import bpl from "./bpl";
import bvc from "./bvc";
import bvs from "./bvs";
import clc from "./clc";
import cld from "./cld";
import cli from "./cli";
import clv from "./clv";
import cmp from "./cmp";
import cpx from "./cpx";
import cpy from "./cpy";
import dec from "./dec";
import dex from "./dex";
import dey from "./dey";
import eor from "./eor";
import inc from "./inc";
import inx from "./inx";
import iny from "./iny";
import jmp from "./jmp";
import jsr from "./jsr";
import lda from "./lda";
import ldx from "./ldx";
import ldy from "./ldy";
import lsr from "./lsr";
import ora from "./ora";
import pha from "./pha";
import php from "./php";
import pla from "./pla";
import plp from "./plp";
import rol from "./rol";
import ror from "./ror";
import rts from "./rts";
import sbc from "./sbc";
import sec from "./sec";
import sed from "./sed";
import sei from "./sei";
import sta from "./sta";
import stx from "./stx";
import sty from "./sty";
import tax from "./tax";
import tay from "./tay";
import tsx from "./tsx";
import txa from "./txa";
import txs from "./txs";
import tya from "./tya";

const MockCPU = vi.fn(function (this: CPU): CPU {
  this.getValue = (addressingMode: AddressingMode, data: Word[]) => {
    switch (addressingMode) {
      case AddressingMode.immediate:
      case AddressingMode.relative:
        return data[0];
      case AddressingMode.accumulator:
        return this.reg[ByteRegister.ida];
      default:
        return new Word(0x42);
    }
  };
  this.reg = {
    [ByteRegister.ida]: new Word(0x00),
    [ByteRegister.idx]: new Word(0x00),
    [ByteRegister.idy]: new Word(0x00),
    [ByteRegister.sp]: new Word(0x00),
    [ByteRegister.ps]: new Word(0x00),
  };
  this.pc = new DoubleWord(0x0000);

  this.updateArithmeticStatuses = (data: {
    negative: boolean;
    carry: boolean;
    zero: boolean;
  }) => {
    this.reg[ByteRegister.ps] = statusToReg({
      ...this.getProcessorStatus(),
      ...data,
    });
  };

  this.getProcessorStatus = () => {
    return statusFromReg(this.reg[ByteRegister.ps]);
  };
  this.setStatus = (position: StatusPosition, value: boolean) => {
    const status = this.reg[ByteRegister.ps];
    if (value) {
      status.value |= 1 << position;
    } else {
      status.value &= ~(1 << position);
    }
    this.reg[ByteRegister.ps] = status;
  };

  const mockStack: Array<Word> = [];
  this.pushStack = vi.fn((value: Word) => {
    mockStack.push(value);
    this.reg[ByteRegister.sp].increment();
  });

  this.pullStack = vi.fn(() => {
    this.reg[ByteRegister.sp].decrement();
    return mockStack.pop() || new Word(0);
  });

  return this;
});

function instruction(
  instructionType: CommandType,
  addressingMode: AddressingMode,
  tail: Word[],
): Instruction {
  return {
    command: {
      commandType: instructionType,
      addressingMode: addressingMode,
    },
    trailingBytes: tail,
  };
}

describe("testing ADC instruction", () => {
  const mockCPU = new MockCPU();
  it("should add two numbers correctly", () => {
    adc.call(
      mockCPU,
      instruction(CommandType.adc, AddressingMode.immediate, [new Word(0x80)]),
    );
    expect(mockCPU.reg[ByteRegister.ida].value).toBe(0x80);
  });
  it("should flag overflow, carry but not negative as result is zero", () => {
    mockCPU.reg[ByteRegister.ida] = new Word(0x80);
    adc.call(
      mockCPU,
      instruction(CommandType.adc, AddressingMode.immediate, [new Word(0x80)]),
    );
    expect(mockCPU.reg[ByteRegister.ida].value).toBe(0x00);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.overflow)).toBe(1);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.carry)).toBe(1);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(0);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
  });
  it("should flag negative only", () => {
    mockCPU.reg[ByteRegister.ida] = new Word(0x7f);
    adc.call(
      mockCPU,
      instruction(CommandType.adc, AddressingMode.immediate, [new Word(0x80)]),
    );
    expect(mockCPU.reg[ByteRegister.ida].value).toBe(0xff);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.overflow)).toBe(0);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.carry)).toBe(0);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(0);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(1);
  });
  it("should flag zero only", () => {
    mockCPU.reg[ByteRegister.ida] = new Word(0x00);
    adc.call(
      mockCPU,
      instruction(CommandType.adc, AddressingMode.immediate, [new Word(0x00)]),
    );
    expect(mockCPU.reg[ByteRegister.ida].value).toBe(0x0);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(0);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.overflow)).toBe(0);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.carry)).toBe(0);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
  });
});
describe("testing AND instruction", () => {
  const mockCPU = new MockCPU();
  it("should and words correctly", () => {
    mockCPU.reg[ByteRegister.ida] = new Word(0x1);
    and.call(
      mockCPU,
      instruction(CommandType.and, AddressingMode.immediate, [new Word(0x1)]),
    );
    expect(mockCPU.reg[ByteRegister.ida].value).toBe(0x1);
  });
  it("should set zero flag if accumulator = 0", () => {
    mockCPU.reg[ByteRegister.ida] = new Word(0x0);
    and.call(
      mockCPU,
      instruction(CommandType.and, AddressingMode.immediate, [new Word(0x1)]),
    );
    expect(mockCPU.reg[ByteRegister.ida].value).toBe(0x0);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(0);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.overflow)).toBe(0);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.carry)).toBe(0);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
  });
  it("should set negative flag if result's bit 7 set", () => {
    mockCPU.reg[ByteRegister.ida] = new Word(0xff);
    and.call(
      mockCPU,
      instruction(CommandType.and, AddressingMode.immediate, [new Word(0x80)]),
    );
    expect(mockCPU.reg[ByteRegister.ida].value).toBe(0x80);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(1);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.overflow)).toBe(0);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.carry)).toBe(0);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(0);
  });
});
describe("testing ASL instruction", () => {
  const mockCPU = new MockCPU();
  it("should correctly shift to left", () => {
    mockCPU.reg[ByteRegister.ida] = new Word(0b01000000);
    asl.call(
      mockCPU,
      instruction(CommandType.asl, AddressingMode.accumulator, []),
    );
    expect(mockCPU.reg[ByteRegister.ida].value).toBe(0b10000000);
  });
  it("should set zero flag if accumulator = 0", () => {
    mockCPU.reg[ByteRegister.ida] = new Word(0x0);
    asl.call(
      mockCPU,
      instruction(CommandType.asl, AddressingMode.accumulator, []),
    );
    expect(mockCPU.reg[ByteRegister.ida].value).toBe(0x0);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(0);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.overflow)).toBe(0);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.carry)).toBe(0);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
  });
  it("should set negative flag if result's bit 7 set", () => {
    mockCPU.reg[ByteRegister.ida] = new Word(0b01000000);
    asl.call(
      mockCPU,
      instruction(CommandType.asl, AddressingMode.accumulator, []),
    );
    expect(mockCPU.reg[ByteRegister.ida].value).toBe(0b10000000);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(1);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.overflow)).toBe(0);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.carry)).toBe(0);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(0);
  });
  it("should set carry to old contents of bit 7", () => {
    mockCPU.reg[ByteRegister.ida] = new Word(0b10000000);
    asl.call(
      mockCPU,
      instruction(CommandType.asl, AddressingMode.accumulator, []),
    );
    expect(mockCPU.reg[ByteRegister.ida].value).toBe(0x00);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(0);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.overflow)).toBe(0);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.carry)).toBe(1);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
  });
});
describe("testing BCC instruction", () => {
  const mockCPU = new MockCPU();
  it("should branch if carry flag is set", () => {
    mockCPU.setStatus(StatusPosition.carry, false);
    bcc.call(
      mockCPU,
      instruction(CommandType.bcc, AddressingMode.relative, [new Word(0x10)]),
    );
    expect(mockCPU.pc.value).toBe(0x10);
  });
  it("should branch with negative address if carry flag is set", () => {
    mockCPU.setStatus(StatusPosition.carry, false);
    mockCPU.pc = new DoubleWord(0x20);
    bcc.call(
      mockCPU,
      instruction(CommandType.bcc, AddressingMode.relative, [new Word(0x90)]),
    );
    expect(mockCPU.pc.value).toBe(0x10);
  });
});
describe("testing BCS instruction", () => {
  const mockCPU = new MockCPU();
  it("should branch if carry flag is set", () => {
    mockCPU.setStatus(StatusPosition.carry, true);
    bcs.call(
      mockCPU,
      instruction(CommandType.bcs, AddressingMode.relative, [new Word(0x10)]),
    );
    expect(mockCPU.pc.value).toBe(0x10);
  });
});
describe("testing BEQ instruction", () => {
  const mockCPU = new MockCPU();
  it("should branch if zero flag is set", () => {
    mockCPU.setStatus(StatusPosition.zero, true);
    beq.call(
      mockCPU,
      instruction(CommandType.beq, AddressingMode.relative, [new Word(0x10)]),
    );
    expect(mockCPU.pc.value).toBe(0x10);
  });
});
describe("testing BIT instruction", () => {
  let mockCPU = new MockCPU();
  it("should correctly bit test", () => {
    mockCPU.reg[ByteRegister.ida] = new Word(0x02);
    bit.call(
      mockCPU,
      instruction(CommandType.bit, AddressingMode.absolute, [
        new Word(0x10),
        new Word(0x00),
      ]),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(0);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(0);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.overflow)).toBe(1);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.carry)).toBe(0);
  });
  it("should set negative to bit 7 of memory", () => {
    mockCPU.getValue = () => {
      return new Word(0x80);
    };
    bit.call(
      mockCPU,
      instruction(CommandType.bit, AddressingMode.absolute, [
        new Word(0x10),
        new Word(0x00),
      ]),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(1);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.overflow)).toBe(0);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.carry)).toBe(0);
  });
  it("should set zero if and result is zero", () => {
    mockCPU.getValue = () => {
      return new Word(0x00);
    };
    bit.call(
      mockCPU,
      instruction(CommandType.bit, AddressingMode.absolute, [
        new Word(0x10),
        new Word(0x00),
      ]),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(0);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.overflow)).toBe(0);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.carry)).toBe(0);
  });
  afterEach(() => {
    mockCPU = new MockCPU();
  });
});

describe("testing BMI instruction", () => {
  const mockCPU = new MockCPU();
  it("should branch if negative flag is set", () => {
    mockCPU.setStatus(StatusPosition.negative, true);
    bmi.call(
      mockCPU,
      instruction(CommandType.bmi, AddressingMode.relative, [new Word(0x10)]),
    );
    expect(mockCPU.pc.value).toBe(0x10);
  });
});
describe("testing BNE instruction", () => {
  const mockCPU = new MockCPU();
  it("should branch if zero flag is clear", () => {
    mockCPU.setStatus(StatusPosition.zero, false);
    bne.call(
      mockCPU,
      instruction(CommandType.bne, AddressingMode.relative, [new Word(0x10)]),
    );
    expect(mockCPU.pc.value).toBe(0x10);
  });
});
describe("testing BPL instruction", () => {
  const mockCPU = new MockCPU();
  it("should branch if negative flag is clear", () => {
    mockCPU.setStatus(StatusPosition.negative, false);
    bpl.call(
      mockCPU,
      instruction(CommandType.bpl, AddressingMode.relative, [new Word(0x10)]),
    );
    expect(mockCPU.pc.value).toBe(0x10);
  });
});
describe.skip("testing BRK instruction", () => {
  // Well interpreting this instruction is up to OS... At least it is what the docs says... ANYWAYS it handled in CPU class now, therefore i don't see the point in testing it here.
});
describe("testing BVC instruction", () => {
  const mockCPU = new MockCPU();
  it("should branch if overflow flag is clear", () => {
    mockCPU.setStatus(StatusPosition.overflow, false);
    bvc.call(
      mockCPU,
      instruction(CommandType.bvc, AddressingMode.relative, [new Word(0x10)]),
    );
    expect(mockCPU.pc.value).toBe(0x10);
  });
});
describe("testing BVS instruction", () => {
  const mockCPU = new MockCPU();
  it("should branch if overflow flag is set", () => {
    mockCPU.setStatus(StatusPosition.overflow, true);
    bvs.call(
      mockCPU,
      instruction(CommandType.bvs, AddressingMode.relative, [new Word(0x10)]),
    );
    expect(mockCPU.pc.value).toBe(0x10);
  });
});

describe("testing CLC instruction", () => {
  let mockCPU = new MockCPU();
  it("should clear carry", () => {
    mockCPU.setStatus(StatusPosition.carry, true);
    clc.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.carry)).toBe(0);
  });
});
describe("testing CLD instruction", () => {
  let mockCPU = new MockCPU();
  it("should clear decimal mode", () => {
    mockCPU.setStatus(StatusPosition.decimal, true);
    cld.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.decimal)).toBe(0);
  });
});

describe("testing CLI instruction", () => {
  let mockCPU = new MockCPU();
  it("should clear interrupt flag", () => {
    mockCPU.setStatus(StatusPosition.interrupt, true);
    cli.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.interrupt)).toBe(0);
  });
});

describe("testing CLV instruction", () => {
  let mockCPU = new MockCPU();
  it("should clear overflow flag", () => {
    mockCPU.setStatus(StatusPosition.overflow, true);
    clv.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.overflow)).toBe(0);
  });
});

describe("testing CMP instruction", () => {
  let mockCPU = new MockCPU();
  it("should set zero and carry if values same", () => {
    mockCPU.reg[ByteRegister.ida] = new Word(0x10);
    mockCPU.getValue = () => new Word(0x10);
    cmp.call(
      mockCPU,
      instruction(CommandType.cmp, AddressingMode.zeroPage, []),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.carry)).toBe(1);
  });
  it("should set carry if A > value", () => {
    mockCPU.reg[ByteRegister.ida] = new Word(0x11);
    mockCPU.getValue = () => new Word(0x10);
    cmp.call(
      mockCPU,
      instruction(CommandType.cmp, AddressingMode.zeroPage, []),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.carry)).toBe(1);
  });
  it("should set negative if 7th bit of A - value is set", () => {
    mockCPU.reg[ByteRegister.ida] = new Word(0xf);
    mockCPU.getValue = () => new Word(0x10);
    cmp.call(
      mockCPU,
      instruction(CommandType.cmp, AddressingMode.zeroPage, []),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(1);
  });
});

describe("testing CPX instruction", () => {
  let mockCPU = new MockCPU();
  it("should set zero and carry if values same", () => {
    mockCPU.reg[ByteRegister.idx] = new Word(0x10);
    mockCPU.getValue = () => new Word(0x10);
    cpx.call(
      mockCPU,
      instruction(CommandType.cpx, AddressingMode.zeroPage, []),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.carry)).toBe(1);
  });
  it("should set carry if X > value", () => {
    mockCPU.reg[ByteRegister.idx] = new Word(0x11);
    mockCPU.getValue = () => new Word(0x10);
    cpx.call(
      mockCPU,
      instruction(CommandType.cpx, AddressingMode.zeroPage, []),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.carry)).toBe(1);
  });
  it("should set negative if 7th bit of X - value is set", () => {
    mockCPU.reg[ByteRegister.idx] = new Word(0xf);
    mockCPU.getValue = () => new Word(0x10);
    cpx.call(
      mockCPU,
      instruction(CommandType.cpx, AddressingMode.zeroPage, []),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(1);
  });
});

describe("testing CPY instruction", () => {
  let mockCPU = new MockCPU();
  it("should set zero and carry if values same", () => {
    mockCPU.reg[ByteRegister.idy] = new Word(0x10);
    mockCPU.getValue = () => new Word(0x10);
    cpy.call(
      mockCPU,
      instruction(CommandType.cpy, AddressingMode.zeroPage, []),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.carry)).toBe(1);
  });
  it("should set carry if Y > value", () => {
    mockCPU.reg[ByteRegister.idy] = new Word(0x11);
    mockCPU.getValue = () => new Word(0x10);
    cpy.call(
      mockCPU,
      instruction(CommandType.cpy, AddressingMode.zeroPage, []),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.carry)).toBe(1);
  });
  it("should set negative if 7th bit of A - value is set", () => {
    mockCPU.reg[ByteRegister.ida] = new Word(0xf);
    mockCPU.getValue = () => new Word(0x10);
    cmp.call(
      mockCPU,
      instruction(CommandType.cmp, AddressingMode.zeroPage, []),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(1);
  });
});

describe("testing DEC instruction", () => {
  let mockCPU = new MockCPU();
  let opResult = 0x00;
  mockCPU.mem = {
    readByte: () => new Word(0x01),
    writeByte: (address: any, byte: Word) => {
      opResult = byte.value;
    },
    memory: new Uint8Array(),
  };
  it("should decrement value in memory", () => {
    mockCPU.mem.readByte = () => new Word(0x01);
    dec.call(
      mockCPU,
      instruction(CommandType.dec, AddressingMode.zeroPage, [new Word(0x00)]),
    );
    expect(opResult).toBe(0x0);
  });
  it("should set zero flag if result is zero", () => {
    mockCPU.mem.readByte = () => new Word(0x01);
    dec.call(
      mockCPU,
      instruction(CommandType.dec, AddressingMode.zeroPage, [new Word(0x00)]),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
  });
  it("should set negative flag if result's bit 7 is set", () => {
    mockCPU.mem.readByte = () => new Word(0x0);
    dec.call(
      mockCPU,
      instruction(CommandType.dec, AddressingMode.zeroPage, [new Word(0x00)]),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(1);
  });
});

describe("testing DEX instruction", () => {
  let mockCPU = new MockCPU();
  it("should decrement value in IDX", () => {
    mockCPU.reg[ByteRegister.idx] = new Word(0x0f);
    dex.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.idx].value).toBe(0x0e);
  });
  it("should set zero flag if result is zero", () => {
    mockCPU.reg[ByteRegister.idx] = new Word(0x01);
    dex.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
  });
  it("should set negative flag if result's bit 7 is set", () => {
    mockCPU.reg[ByteRegister.idx] = new Word(0x00);
    dex.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(1);
  });
});

describe("testing DEY instruction", () => {
  let mockCPU = new MockCPU();
  it("should decrement value in IDY", () => {
    mockCPU.reg[ByteRegister.idy] = new Word(0x0f);
    dey.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.idy].value).toBe(0x0e);
  });
  it("should set zero flag if result is zero", () => {
    mockCPU.reg[ByteRegister.idy] = new Word(0x01);
    dey.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
  });
  it("should set negative flag if result's bit 7 is set", () => {
    mockCPU.reg[ByteRegister.idy] = new Word(0x00);
    dey.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(1);
  });
});

describe("testing EOR instruction", () => {
  it("should perform EOR operation with accumulator", () => {
    let mockCPU = new MockCPU();
    mockCPU.reg[ByteRegister.ida] = new Word(0x03);
    mockCPU.getValue = () => new Word(0x01);
    eor.call(
      mockCPU,
      instruction(CommandType.eor, AddressingMode.immediate, []),
    );
    expect(mockCPU.reg[ByteRegister.ida].value).toBe(0x02);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(0);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(0);
  });
  it("should set zero if A is zero", () => {
    let mockCPU = new MockCPU();
    mockCPU.reg[ByteRegister.ida] = new Word(0x0f);
    mockCPU.getValue = () => new Word(0x0f);
    eor.call(
      mockCPU,
      instruction(CommandType.eor, AddressingMode.immediate, []),
    );
    expect(mockCPU.reg[ByteRegister.ida].value).toBe(0x00);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(0);
  });
  it("should set negative if 7th bit of the result is set", () => {
    let mockCPU = new MockCPU();
    mockCPU.reg[ByteRegister.ida] = new Word(0x80);
    mockCPU.getValue = () => new Word(0x0f);
    eor.call(
      mockCPU,
      instruction(CommandType.eor, AddressingMode.immediate, []),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(1);
  });
});

describe("testing INC instruction", () => {
  let mockCPU = new MockCPU();
  let opResult = 0x00;
  mockCPU.mem = {
    readByte: () => new Word(0x01),
    writeByte: (address: any, byte: Word) => {
      opResult = byte.value;
    },
    memory: new Uint8Array(),
  };
  it("should increment value in memory", () => {
    inc.call(
      mockCPU,
      instruction(CommandType.inc, AddressingMode.zeroPage, [new Word(0x00)]),
    );
    expect(opResult).toBe(0x02);
  });
  it("should set zero flag if result is zero", () => {
    mockCPU.mem.readByte = () => new Word(0xff);
    inc.call(
      mockCPU,
      instruction(CommandType.inc, AddressingMode.zeroPage, [new Word(0x00)]),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
  });
  it("should set negative flag if result's bit 7 is set", () => {
    mockCPU.mem.readByte = () => new Word(0x80);
    inc.call(
      mockCPU,
      instruction(CommandType.inc, AddressingMode.zeroPage, [new Word(0x00)]),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(1);
  });
});

describe("testing INX instruction", () => {
  let mockCPU = new MockCPU();
  it("should increment value in IDX", () => {
    mockCPU.reg[ByteRegister.idx] = new Word(0x0f);
    inx.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.idx].value).toBe(0x10);
  });
  it("should set zero flag if result is zero", () => {
    mockCPU.reg[ByteRegister.idx] = new Word(0xff);
    inx.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
  });
  it("should set negative flag if result's bit 7 is set", () => {
    mockCPU.reg[ByteRegister.idx] = new Word(0x80);
    inx.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(1);
  });
});

describe("testing INY instruction", () => {
  let mockCPU = new MockCPU();
  it("should decrement value in IDY", () => {
    mockCPU.reg[ByteRegister.idy] = new Word(0x0f);
    iny.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.idy].value).toBe(0x10);
  });
  it("should set zero flag if result is zero", () => {
    mockCPU.reg[ByteRegister.idy] = new Word(0xff);
    iny.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
  });
  it("should set negative flag if result's bit 7 is set", () => {
    mockCPU.reg[ByteRegister.idy] = new Word(0x80);
    iny.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(1);
  });
});
describe("testing JMP instruction", () => {
  let mockCPU = new MockCPU();
  it("should set pc to target address, treating first byte as least significant, and second byte as most significant", () => {
    mockCPU.pc = new DoubleWord(0x0000);
    jmp.call(
      mockCPU,
      instruction(CommandType.jmp, AddressingMode.absolute, [
        new Word(0x01),
        new Word(0x06),
      ]),
    );
    expect(mockCPU.pc.value).toBe(0x0601);
  });
});

describe("testing JSR instruction", () => {
  let mockCPU = new MockCPU();
  it("should set pc to target address, treating first byte as least significant, and second byte as most significant", () => {
    mockCPU.pc = new DoubleWord(0x0000);
    jsr.call(
      mockCPU,
      instruction(CommandType.jsr, AddressingMode.absolute, [
        new Word(0x01),
        new Word(0x06),
      ]),
    );
    expect(mockCPU.pc.value).toBe(0x0601);
  });
  it("should push return address to stack and increment stack pointer twice", () => {
    mockCPU.pc = new DoubleWord(0x0102);
    jsr.call(
      mockCPU,
      instruction(CommandType.jsr, AddressingMode.absolute, [
        new Word(0x01),
        new Word(0x06),
      ]),
    );
    expect(mockCPU.pullStack().value).toBe(0x01);
    expect(mockCPU.pullStack().value).toBe(0x02);
    expect(mockCPU.reg[ByteRegister.sp].value).toBe(0x02);
  });
});

describe("testing LDA instruction", () => {
  let mockCPU = new MockCPU();
  it("should load value into accumulator", () => {
    lda.call(
      mockCPU,
      instruction(CommandType.lda, AddressingMode.immediate, [new Word(0x01)]),
    );
    expect(mockCPU.reg[ByteRegister.ida].value).toBe(0x01);
  });
  it("should set zero flag if result is zero", () => {
    lda.call(
      mockCPU,
      instruction(CommandType.lda, AddressingMode.immediate, [new Word(0x00)]),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
  });
  it("should set negative flag if result's bit 7 is set", () => {
    lda.call(
      mockCPU,
      instruction(CommandType.lda, AddressingMode.immediate, [new Word(0x80)]),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(1);
  });
});

describe("testing LDX instruction", () => {
  let mockCPU = new MockCPU();
  it("should load value into X register", () => {
    ldx.call(
      mockCPU,
      instruction(CommandType.ldx, AddressingMode.immediate, [new Word(0x01)]),
    );
    expect(mockCPU.reg[ByteRegister.idx].value).toBe(0x01);
  });
  it("should set zero flag if result is zero", () => {
    ldx.call(
      mockCPU,
      instruction(CommandType.ldx, AddressingMode.immediate, [new Word(0x00)]),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
  });
  it("should set negative flag if result's bit 7 is set", () => {
    ldx.call(
      mockCPU,
      instruction(CommandType.ldx, AddressingMode.immediate, [new Word(0x80)]),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(1);
  });
});

describe("testing LDY instruction", () => {
  let mockCPU = new MockCPU();
  it("should load value into Y register", () => {
    ldy.call(
      mockCPU,
      instruction(CommandType.ldy, AddressingMode.immediate, [new Word(0x01)]),
    );
    expect(mockCPU.reg[ByteRegister.idy].value).toBe(0x01);
  });
  it("should set zero flag if result is zero", () => {
    ldy.call(
      mockCPU,
      instruction(CommandType.ldy, AddressingMode.immediate, [new Word(0x00)]),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
  });
  it("should set negative flag if result's bit 7 is set", () => {
    ldy.call(
      mockCPU,
      instruction(CommandType.ldy, AddressingMode.immediate, [new Word(0x80)]),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(1);
  });
});

describe("testing LSR instruction", () => {
  let mockCPU = new MockCPU();
  it("should perform logical shift on accumulator", () => {
    mockCPU.reg[ByteRegister.ida].value = 0x01;
    lsr.call(
      mockCPU,
      instruction(CommandType.lsr, AddressingMode.accumulator, []),
    );
    expect(mockCPU.reg[ByteRegister.ida].value).toBe(0x00);
  });
  it("should set zero flag if result is zero", () => {
    mockCPU.reg[ByteRegister.ida].value = 0x01;
    lsr.call(
      mockCPU,
      instruction(CommandType.lsr, AddressingMode.accumulator, []),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
  });
  it.skip("should set negative flag if result's bit 7 is set", () => {
    // ? looks like it is impossible for this instruction result in number bigger than 0x7f therefore negative flag will be always off
    mockCPU.reg[ByteRegister.ida].value = 0xff;
    lsr.call(
      mockCPU,
      instruction(CommandType.lsr, AddressingMode.accumulator, []),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(1);
  });
});
describe.skip("testing nop operation... Well this is done in the emulator...");
describe("testing ORA instruction", () => {
  const mockCPU = new MockCPU();
  it("should perform OR operation with accumulator", () => {
    mockCPU.reg[ByteRegister.ida].value = 0x01;
    ora.call(
      mockCPU,
      instruction(CommandType.ora, AddressingMode.immediate, [new Word(0x01)]),
    );
    expect(mockCPU.reg[ByteRegister.ida].value).toBe(0x01);
  });
  it("should set zero flag if result is zero", () => {
    mockCPU.reg[ByteRegister.ida].value = 0x00;
    ora.call(
      mockCPU,
      instruction(CommandType.ora, AddressingMode.immediate, [new Word(0x00)]),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
  });
  it("should set negative flag if result's bit 7 is set", () => {
    mockCPU.reg[ByteRegister.ida].value = 0x80;
    ora.call(
      mockCPU,
      instruction(CommandType.ora, AddressingMode.immediate, [new Word(0x80)]),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(1);
  });
});
describe("testing PHA instruction", () => {
  const mockCPU = new MockCPU();
  it("should push accumulator onto stack", () => {
    mockCPU.reg[ByteRegister.ida].value = 0x01;
    pha.call(mockCPU);
    expect(mockCPU.pullStack().value).toBe(0x01);
  });
  it("should update stack pointer", () => {
    mockCPU.reg[ByteRegister.ida].value = 0x01;
    pha.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.sp].value).toBe(0x1);
  });
});

describe("testing PHP instruction", () => {
  const mockCPU = new MockCPU();
  it("should push processor status onto stack", () => {
    mockCPU.reg[ByteRegister.ps].value = 0x01;
    php.call(mockCPU);
    expect(mockCPU.pullStack().value).toBe(0x01);
  });
  it("should update stack pointer", () => {
    mockCPU.reg[ByteRegister.ps].value = 0x01;
    php.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.sp].value).toBe(0x1);
  });
});

describe("testing PLA instruction", () => {
  const mockCPU = new MockCPU();
  it("should pull accumulator from stack", () => {
    mockCPU.pushStack(new Word(0x01));
    pla.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ida].value).toBe(0x01);
  });
  it("should update stack pointer", () => {
    mockCPU.reg[ByteRegister.ida].value = 0x01;
    pla.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.sp].value).toBe(0xff);
  });
});

describe("testing PLP instruction", () => {
  const mockCPU = new MockCPU();
  it("should pull processor status from stack", () => {
    mockCPU.pushStack(new Word(0x01));
    plp.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].value).toBe(0x01);
  });
  it("should update stack pointer", () => {
    mockCPU.reg[ByteRegister.ps].value = 0x01;
    plp.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.sp].value).toBe(0xff);
  });
});

describe("testing ROL instuction", () => {
  it("should correctly rotate left accumulator", () => {
    const mockCPU = new MockCPU();
    mockCPU.reg[ByteRegister.ida].value = 0b10000001;
    mockCPU.setStatus(StatusPosition.carry, false);
    rol.call(
      mockCPU,
      instruction(CommandType.rol, AddressingMode.accumulator, []),
    );
    expect(mockCPU.reg[ByteRegister.ida].value).toBe(0b00000010);
  });
  it("should set carry to old contents of bit 7", () => {
    const mockCPU = new MockCPU();
    mockCPU.reg[ByteRegister.ida].value = 0b10000000;
    rol.call(
      mockCPU,
      instruction(CommandType.rol, AddressingMode.accumulator, []),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.carry)).toBe(1);
  });
  it("should set zero if A is zero", () => {
    const mockCPU = new MockCPU();
    mockCPU.reg[ByteRegister.ida].value = 0x0;
    rol.call(
      mockCPU,
      instruction(CommandType.rol, AddressingMode.accumulator, []),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
  });
});

describe("testing ROR instruction", () => {
  it("should correctly rotate right accumulator", () => {
    const mockCPU = new MockCPU();
    mockCPU.reg[ByteRegister.ida].value = 0b10000001;
    mockCPU.setStatus(StatusPosition.carry, false);
    ror.call(
      mockCPU,
      instruction(CommandType.ror, AddressingMode.accumulator, []),
    );
    expect(mockCPU.reg[ByteRegister.ida].value).toBe(0b01000000);
  });
  it("should set carry to old contents of bit 0", () => {
    const mockCPU = new MockCPU();
    mockCPU.reg[ByteRegister.ida].value = 0b00000001;
    ror.call(
      mockCPU,
      instruction(CommandType.ror, AddressingMode.accumulator, []),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.carry)).toBe(1);
  });
  it("should set zero if A is zero", () => {
    const mockCPU = new MockCPU();
    mockCPU.reg[ByteRegister.ida].value = 0x0;
    ror.call(
      mockCPU,
      instruction(CommandType.ror, AddressingMode.accumulator, []),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
  });
});
describe.skip("here should be RTI, but it is not implemented here");
describe("testing RTS instruction", () => {
  const mockCPU = new MockCPU();
  it("should pull program counter from stack", () => {
    mockCPU.pushStack(new Word(0x01));
    rts.call(mockCPU);
    expect(mockCPU.pc.value).toBe(0x0001);
  });
  it("should update stack pointer", () => {
    mockCPU.reg[ByteRegister.sp].value = 0x00;
    rts.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.sp].value).toBe(0xfe);
  });
});

describe("testing SBC instruction", () => {
  it("should subtract two numbers correctly if carry set", () => {
    const mockCPU = new MockCPU();
    mockCPU.reg[ByteRegister.ida] = new Word(0x2);
    mockCPU.setStatus(StatusPosition.carry, true);
    sbc.call(
      mockCPU,
      instruction(CommandType.sbc, AddressingMode.immediate, [new Word(0x1)]),
    );
    expect(mockCPU.reg[ByteRegister.ida].value).toBe(0x1);
  });
  it("should set carry if there is no borrow", () => {
    const mockCPU = new MockCPU();
    mockCPU.reg[ByteRegister.ida] = new Word(0x2);
    mockCPU.setStatus(StatusPosition.carry, true);
    sbc.call(
      mockCPU,
      instruction(CommandType.sbc, AddressingMode.immediate, [new Word(0x1)]),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.carry)).toBe(1);
  });
  it("should unset carry if borrow occured", () => {
    const mockCPU = new MockCPU();
    mockCPU.reg[ByteRegister.ida] = new Word(0x0);
    mockCPU.setStatus(StatusPosition.carry, true);
    sbc.call(
      mockCPU,
      instruction(CommandType.sbc, AddressingMode.immediate, [new Word(0xff)]),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.carry)).toBe(0);
  });
  it("should correctly handle borrows", () => {
    const mockCPU = new MockCPU();
    mockCPU.reg[ByteRegister.ida] = new Word(0x0);
    mockCPU.setStatus(StatusPosition.carry, true);
    sbc.call(
      mockCPU,
      instruction(CommandType.sbc, AddressingMode.immediate, [new Word(0xff)]),
    );
    expect(mockCPU.reg[ByteRegister.ida].value).toBe(1);
  });
  it("should subtract two numbers and 1 if carry clear", () => {
    const mockCPU = new MockCPU();
    mockCPU.reg[ByteRegister.ida] = new Word(0x2);
    mockCPU.setStatus(StatusPosition.carry, false);
    sbc.call(
      mockCPU,
      instruction(CommandType.sbc, AddressingMode.immediate, [new Word(0x1)]),
    );
    expect(mockCPU.reg[ByteRegister.ida].value).toBe(0x0);
  });
  it("should flag overflow if sign bit is incorrect", () => {
    const mockCPU = new MockCPU();
    mockCPU.reg[ByteRegister.ida] = new Word(0x82);
    sbc.call(
      mockCPU,
      instruction(CommandType.sbc, AddressingMode.immediate, [new Word(0x81)]),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.overflow)).toBe(1);
  });
  it("should flag negative if bit 7 is set", () => {
    const mockCPU = new MockCPU();
    mockCPU.reg[ByteRegister.ida] = new Word(0x0);
    sbc.call(
      mockCPU,
      instruction(CommandType.sbc, AddressingMode.immediate, [new Word(0x1)]),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(1);
  });
  it("should flag zero only", () => {
    const mockCPU = new MockCPU();
    mockCPU.reg[ByteRegister.ida] = new Word(0x00);
    sbc.call(
      mockCPU,
      instruction(CommandType.sbc, AddressingMode.immediate, [new Word(0x00)]),
    );
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
  });
});
describe("testing SEC instruction", () => {
  const mockCPU = new MockCPU();
  it("should set carry flag", () => {
    mockCPU.setStatus(StatusPosition.carry, false);
    sec.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.carry)).toBe(1);
  });
});

describe("testing SED instruction", () => {
  const mockCPU = new MockCPU();
  it("should set decimal flag", () => {
    mockCPU.setStatus(StatusPosition.decimal, false);
    sed.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.decimal)).toBe(1);
  });
});

describe("testing SEI instruction", () => {
  const mockCPU = new MockCPU();
  it("should set interrupt flag", () => {
    mockCPU.setStatus(StatusPosition.interrupt, false);
    sei.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.interrupt)).toBe(1);
  });
});

describe("testing STA instruction", () => {
  const mockCPU = new MockCPU();
  mockCPU.writeMemory = vi.fn();
  it("should store accumulator", () => {
    mockCPU.reg[ByteRegister.ida] = new Word(0x42);
    sta.call(
      mockCPU,
      instruction(CommandType.sta, AddressingMode.zeroPage, [new Word(0x00)]),
    );
    expect(mockCPU.writeMemory).toHaveBeenCalledWith(
      new DoubleWord(0x00),
      new Word(0x42),
    );
  });
});

describe("testing STX instruction", () => {
  const mockCPU = new MockCPU();
  mockCPU.writeMemory = vi.fn();
  it("should store x register", () => {
    mockCPU.reg[ByteRegister.idx] = new Word(0x42);
    stx.call(
      mockCPU,
      instruction(CommandType.stx, AddressingMode.zeroPage, [new Word(0x00)]),
    );
    expect(mockCPU.writeMemory).toHaveBeenCalledWith(
      new DoubleWord(0x00),
      new Word(0x42),
    );
  });
});

describe("testing STY instruction", () => {
  const mockCPU = new MockCPU();
  mockCPU.writeMemory = vi.fn();
  it("should store y register", () => {
    mockCPU.reg[ByteRegister.idy] = new Word(0x42);
    sty.call(
      mockCPU,
      instruction(CommandType.sty, AddressingMode.zeroPage, [new Word(0x00)]),
    );
    expect(mockCPU.writeMemory).toHaveBeenCalledWith(
      new DoubleWord(0x00),
      new Word(0x42),
    );
  });
});
describe("testing TAX instruction", () => {
  const mockCPU = new MockCPU();
  it("should move A to X", () => {
    mockCPU.reg[ByteRegister.ida] = new Word(0x42);
    tax.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.idx].value).toBe(0x42);
  });
  it("should set zero flag if X = 0", () => {
    mockCPU.reg[ByteRegister.ida] = new Word(0x00);
    mockCPU.reg[ByteRegister.idx] = new Word(0x00);
    tax.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
  });
  it("should set negative flag if bit 7 is set", () => {
    mockCPU.reg[ByteRegister.ida] = new Word(0x80);
    tax.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(1);
  });
});

describe("testing TAY instruction", () => {
  const mockCPU = new MockCPU();
  it("should move A to Y", () => {
    mockCPU.reg[ByteRegister.ida] = new Word(0x42);
    tay.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.idy].value).toBe(0x42);
  });
  it("should set zero flag if Y = 0", () => {
    mockCPU.reg[ByteRegister.ida] = new Word(0x00);
    mockCPU.reg[ByteRegister.idy] = new Word(0x00);
    tay.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
  });
  it("should set negative flag if bit 7 is set", () => {
    mockCPU.reg[ByteRegister.ida] = new Word(0x80);
    tay.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(1);
  });
});

describe("testing TSX instruction", () => {
  const mockCPU = new MockCPU();
  it("should move SP to X", () => {
    mockCPU.reg[ByteRegister.sp] = new Word(0x42);
    tsx.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.idx].value).toBe(0x42);
  });
  it("should set zero flag if X = 0", () => {
    mockCPU.reg[ByteRegister.sp] = new Word(0x00);
    mockCPU.reg[ByteRegister.idx] = new Word(0x00);
    tsx.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
  });
  it("should set negative flag if bit 7 is set", () => {
    mockCPU.reg[ByteRegister.sp] = new Word(0x80);
    tsx.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(1);
  });
});

describe("testing TXA instruction", () => {
  const mockCPU = new MockCPU();
  it("should move X to A", () => {
    mockCPU.reg[ByteRegister.idx] = new Word(0x42);
    txa.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ida].value).toBe(0x42);
  });
  it("should set zero flag if X = 0", () => {
    mockCPU.reg[ByteRegister.idx] = new Word(0x00);
    txa.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
  });
  it("should set negative flag if bit 7 is set", () => {
    mockCPU.reg[ByteRegister.idx] = new Word(0x80);
    txa.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(1);
  });
});

describe("testing TXS instruction", () => {
  const mockCPU = new MockCPU();
  it("should move X to SP", () => {
    mockCPU.reg[ByteRegister.idx] = new Word(0x42);
    txs.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.sp].value).toBe(0x42);
  });
  it("should set zero flag if X = 0", () => {
    mockCPU.reg[ByteRegister.idx] = new Word(0x00);
    txs.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
  });
  it("should set negative flag if bit 7 is set", () => {
    mockCPU.reg[ByteRegister.idx] = new Word(0x80);
    txs.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(1);
  });
});

describe("testing TYA instruction", () => {
  const mockCPU = new MockCPU();
  it("should move Y to A", () => {
    mockCPU.reg[ByteRegister.idy] = new Word(0x42);
    tya.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ida].value).toBe(0x42);
  });
  it("should set zero flag if Y = 0", () => {
    mockCPU.reg[ByteRegister.idy] = new Word(0x00);
    tya.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.zero)).toBe(1);
  });
  it("should set negative flag if bit 7 is set", () => {
    mockCPU.reg[ByteRegister.idy] = new Word(0x80);
    tya.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.negative)).toBe(1);
  });
});
