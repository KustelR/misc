import { describe, expect, it, vi } from "vitest";
import {
  arithmeticResultFlags,
  ByteRegister,
  CPURegisters,
  getMemoryAddress,
  statusFromReg,
  statusToReg,
} from "./cpu";
import { DoubleWord, Memory, Word } from "./memory";
import { AddressingMode } from "./instructions";
import { MemoryError } from "./errors";

describe("testing statusToReg()", () => {
  it("should convert status flags to register", () => {
    const status = {
      negative: true,
      overflow: false,
      break: false,
      decimal: false,
      interrupt: false,
      zero: false,
      carry: true,
    };
    const reg = statusToReg(status);
    expect(reg.value).toBe(0b01000001);
  });
});

describe("testing statusFromReg()", () => {
  it("should convert register to status flags", () => {
    const reg = new Word(0b01000001);
    const status = statusFromReg(reg);
    expect(status.negative).toBe(true);
    expect(status.overflow).toBe(false);
    expect(status.break).toBe(false);
    expect(status.decimal).toBe(false);
    expect(status.interrupt).toBe(false);
    expect(status.zero).toBe(false);
    expect(status.carry).toBe(true);
  });
});

const fakeMemory = vi.fn(function () {
  const result: Memory = {} as Memory;
  result.readByte = vi.fn((address: DoubleWord) => new Word(0x42));
  result.writeByte = vi.fn((address: DoubleWord, value: Word) => {});
  return result;
});
const fakeCPURegisters = vi.fn(function (): CPURegisters {
  const result: CPURegisters = {} as CPURegisters;
  result[ByteRegister.ida] = new Word(0x0);
  result[ByteRegister.idx] = new Word(0x0);
  result[ByteRegister.idy] = new Word(0x0);
  result[ByteRegister.sp] = new Word(0x0);
  result[ByteRegister.ps] = new Word(0x0);
  return result;
});
describe("testing getMemoryAddress()", () => {
  it("[immediate] should throw an error. Immediate addressing mode handled in instructions", () => {
    expect(() =>
      getMemoryAddress(
        fakeCPURegisters(),
        fakeMemory(),
        AddressingMode.immediate,
        [new Word(0x1)],
      ),
    ).toThrowError(MemoryError);
  });
  it("[relative] should throw an error. Relative addressing mode handled in getValue()", () => {
    expect(() =>
      getMemoryAddress(
        fakeCPURegisters(),
        fakeMemory(),
        AddressingMode.relative,
        [new Word(0x1)],
      ),
    ).toThrowError(MemoryError);
  });
  it("[implied] should throw an error. Implied addressing mode handled in instructions", () => {
    expect(() =>
      getMemoryAddress(
        fakeCPURegisters(),
        fakeMemory(),
        AddressingMode.implied,
        [],
      ),
    ).toThrowError(MemoryError);
  });
  it("[accumulator] should throw an error. Accumulator addressing mode handled in instructions", () => {
    expect(() =>
      getMemoryAddress(
        fakeCPURegisters(),
        fakeMemory(),
        AddressingMode.accumulator,
        [],
      ),
    ).toThrowError(MemoryError);
  });
  it("[zeroPage] should resolve as 0x0002 address", () => {
    const address = getMemoryAddress(
      fakeCPURegisters(),
      fakeMemory(),
      AddressingMode.zeroPage,
      [new Word(0x2)],
    );
    expect(address.value).toBe(0x2);
  });
  it("[absolute] should resolve as 0x0102 address", () => {
    const address = getMemoryAddress(
      fakeCPURegisters(),
      fakeMemory(),
      AddressingMode.absolute,
      [new Word(0x2), new Word(0x1)],
    );
    expect(address.value).toBe(0x0102);
  });
  it("[absoluteX] should resolve as 0x0104 address", () => {
    const aXRegisters = fakeCPURegisters();
    aXRegisters[ByteRegister.idx] = new Word(0x2);
    const address = getMemoryAddress(
      aXRegisters,
      fakeMemory(),
      AddressingMode.absoluteX,
      [new Word(0x2), new Word(0x1)],
    );
    expect(address.value).toBe(0x0104);
  });
  it("[absoluteY] should resolve as 0x0104 address", () => {
    const aYRegisters = fakeCPURegisters();
    aYRegisters[ByteRegister.idy] = new Word(0x2);
    const address = getMemoryAddress(
      aYRegisters,
      fakeMemory(),
      AddressingMode.absoluteY,
      [new Word(0x2), new Word(0x1)],
    );
    expect(address.value).toBe(0x0104);
  });
  it("[zeroPageX] should resolve as 0x0004 address", () => {
    const zpXRegisters = fakeCPURegisters();
    zpXRegisters[ByteRegister.idx] = new Word(0x2);
    const address = getMemoryAddress(
      zpXRegisters,
      fakeMemory(),
      AddressingMode.zeroPageX,
      [new Word(0x2)],
    );
    expect(address.value).toBe(0x0004);
  });
  it("[zeroPageY] should resolve as 0x0004 address", () => {
    const zpYRegisters = fakeCPURegisters();
    zpYRegisters[ByteRegister.idy] = new Word(0x2);
    const address = getMemoryAddress(
      zpYRegisters,
      fakeMemory(),
      AddressingMode.zeroPageY,
      [new Word(0x2)],
    );
    expect(address.value).toBe(0x0004);
  });
  it("[indirect] should resolve as 0x0102 address", () => {
    const iMemory = fakeMemory();
    iMemory.readByte = vi.fn((address: DoubleWord) => {
      if (address.value === 0x0000) {
        return new Word(0x02);
      } else if (address.value === 0x0001) {
        return new Word(0x01);
      } else {
        throw new Error(
          `Trying to access wrong address: 0x${address.value.toString(16)}`,
        );
      }
    });
    const address = getMemoryAddress(
      fakeCPURegisters(),
      iMemory,
      AddressingMode.indirect,
      [new Word(0x0), new Word(0x0)],
    );
    expect(address.value).toBe(0x0102);
  });
  it("[indirectX] should resolve as 0x0102 address", () => {
    const iXMemory = fakeMemory();
    const iXRegisters = fakeCPURegisters();
    iXRegisters[ByteRegister.idx] = new Word(0x2);
    iXMemory.readByte = vi.fn((address: DoubleWord) => {
      if (address.value === 0x0002) {
        return new Word(0x02);
      } else if (address.value === 0x0003) {
        return new Word(0x01);
      } else {
        throw new Error(
          `Trying to access wrong address: 0x${address.value.toString(16)}`,
        );
      }
    });
    const address = getMemoryAddress(
      iXRegisters,
      iXMemory,
      AddressingMode.indirectX,
      [new Word(0x0)],
    );
    expect(address.value).toBe(0x0102);
  });
  it("[indirectY] should resolve as 0x0104 address", () => {
    const iYMemory = fakeMemory();
    const iYRegisters = fakeCPURegisters();
    iYRegisters[ByteRegister.idy] = new Word(0x2);
    iYMemory.readByte = vi.fn((address: DoubleWord) => {
      switch (address.value) {
        case 0x0002:
          return new Word(0x0004);
        case 0x0003:
          return new Word(0x0001);
        default:
          throw new Error(
            `Trying to access wrong address: 0x${address.value.toString(16)}`,
          );
      }
    });
    const address = getMemoryAddress(
      iYRegisters,
      iYMemory,
      AddressingMode.indirectY,
      [new Word(0x0)],
    );
    expect(address.value).toBe(0x0104);
  });
});

describe("testing arithmeticResultFlags()", () => {
  it("should return negative flag when result is negative", () => {
    const result = new Word(0xff);
    const flags = arithmeticResultFlags(result);
    expect(flags).toHaveProperty("negative", true);
  });
  it("should return zero flag when result is zero", () => {
    const result = new Word(0x00);
    const flags = arithmeticResultFlags(result);
    expect(flags).toHaveProperty("zero", true);
  });
  it("should return overflow flag when result is overflown", () => {
    const result = 0x100;
    const flags = arithmeticResultFlags(result);
    expect(flags).toHaveProperty("carry", true);
  });
});
