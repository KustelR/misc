import { describe, expect, it, vi } from "vitest";
import adc from "./adc";
import { AddressingMode, CommandType, Instruction } from "../instructions";
import { Word } from "../memory";
import {
  ByteRegister,
  CPU,
  statusFromReg,
  StatusPosition,
  statusToReg,
} from "../cpu";
import and from "./and";

const MockCPU = vi.fn(function (this: CPU): CPU {
  this.getValue = (addressingMode: AddressingMode, data: Word[]) => {
    if (addressingMode === AddressingMode.immediate) {
      return data[0];
    } else {
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

const mockCPU = new MockCPU();

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
