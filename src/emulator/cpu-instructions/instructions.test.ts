import { describe, expect, it, vi } from "vitest";
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
import { afterEach, mock } from "node:test";
import bmi from "./bmi";

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
  const mockCPU = new MockCPU();
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
    mockCPU.reset();
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
