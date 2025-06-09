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
    mockCPU.setStatus(StatusPosition.irqDisabled, true);
    cli.call(mockCPU);
    expect(mockCPU.reg[ByteRegister.ps].bit(StatusPosition.irqDisabled)).toBe(
      0,
    );
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
