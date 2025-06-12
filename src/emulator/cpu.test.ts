import { describe, expect, it, vi } from "vitest";
import {
  arithmeticResultFlags,
  ByteRegister,
  CPU,
  CPURegisters,
  getMemoryAddress,
  statusFromReg,
  StatusPosition,
  statusToReg,
} from "./cpu";
import { DoubleWord, Memory, Word } from "./memory";
import { AddressingMode, cmdToByte, CommandType } from "./instructions";
import { MemoryError } from "./errors";
import { Stack } from "./stack";

describe("testing statusToReg()", () => {
  it("should convert status flags to register", () => {
    const status = {
      negative: true,
      overflow: false,
      brk: false,
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
    expect(status.brk).toBe(false);
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
describe("testing CPU class", () => {
  describe("testing .updateArithmeticStatuses()", () => {
    it("should set everything correctly", () => {
      const cpu = new CPU();
      cpu.updateArithmeticStatuses({
        negative: true,
        zero: true,
        carry: true,
      });
      const status = cpu.getProcessorStatus();
      expect(status).toHaveProperty("negative", true);
      expect(status).toHaveProperty("zero", true);
      expect(status).toHaveProperty("carry", true);
    });
  });
  describe("testing .reset()", () => {
    it("should set PS to 0x00", () => {
      const cpu = new CPU();
      cpu.reg[ByteRegister.ps] = new Word(0xff);
      cpu.reset();
      expect(cpu.reg[ByteRegister.ps]).toEqual(new Word(0x00));
    });
    it("should set PC to 0x00", () => {
      const cpu = new CPU();
      cpu.pc = new DoubleWord(0xffff);
      cpu.reset();
      expect(cpu.pc).toEqual(new DoubleWord(0x0000));
    });
    it("should set SP to 0x00 and clear stack", () => {
      const cpu = new CPU();
      cpu.reg[ByteRegister.sp] = new Word(0xff);
      cpu.reset();
      expect(cpu.reg[ByteRegister.sp]).toEqual(new Word(0x00));
      expect(cpu["stack"]).toEqual(new Stack());
    });
    it("should clear cycles", () => {
      const cpu = new CPU();
      cpu["cycles"] = 1000;
      cpu.reset();

      expect(cpu["cycles"]).toEqual(0);
    });
    it("should NOT clear listeners", () => {
      const cpu = new CPU();
      cpu.addCyclesListener(() => {});
      cpu.addMemoryListener(() => {});
      cpu.addRegisterListener(() => {});
      cpu.reset();
      expect(cpu["memoryListeners"].length).toEqual(1);
      expect(cpu["registerListeners"].length).toEqual(1);
      expect(cpu["cyclesListeners"].length).toEqual(1);
    });
  });
  describe("testing .pushStack()", () => {
    it("should push value onto stack and increment SP", () => {
      const cpu = new CPU();
      cpu.pushStack(new Word(0x42));
      expect(cpu.reg[ByteRegister.sp]).toEqual(new Word(0x01));
      expect(cpu.pullStack()).toEqual(new Word(0x42));
    });
    it("should pull value from stack and decrement SP", () => {
      const cpu = new CPU();
      cpu.pushStack(new Word(0x42));
      expect(cpu.reg[ByteRegister.sp]).toEqual(new Word(0x01));
      expect(cpu.pullStack()).toEqual(new Word(0x42));
      expect(cpu.reg[ByteRegister.sp]).toEqual(new Word(0x00));
    });
  });
  describe("testing .setStatus()", () => {
    it("should set carry", () => {
      const cpu = new CPU();
      cpu.setStatus(StatusPosition.carry, true);
      expect(cpu.getProcessorStatus()).toHaveProperty("carry", true);
    });
    it("should clear carry", () => {
      const cpu = new CPU();
      cpu.setStatus(StatusPosition.carry, true);
      cpu.setStatus(StatusPosition.carry, false);
      expect(cpu.getProcessorStatus()).toHaveProperty("carry", false);
    });
  });
  describe("testing .toggleStatus()", () => {
    it("should toggle carry", () => {
      const cpu = new CPU();
      cpu.setStatus(StatusPosition.carry, false);
      cpu.toggleStatus(StatusPosition.carry);
      cpu.toggleStatus(StatusPosition.carry);
      cpu.toggleStatus(StatusPosition.carry);
      expect(cpu.getProcessorStatus()).toHaveProperty("carry", true);
    });
  });
  describe("testing .writeMemory()", () => {
    it("should write to memory", () => {
      const cpu = new CPU();
      cpu.writeMemory(new DoubleWord(0x0000), new Word(0x42));
      expect(cpu.mem.readByte(new DoubleWord(0x0000))).toEqual(new Word(0x42));
    });
  });
  describe("testing listeners", () => {
    const cpu = new CPU();
    const cycleListener = vi.fn();
    const memoryListener = vi.fn();
    const registerListener = vi.fn();
    it("should add listener to cycles", () => {
      cpu.addCyclesListener(cycleListener);
      expect(cpu["cyclesListeners"]).toContain(cycleListener);
    });
    it("should add listener to memory", () => {
      cpu.addMemoryListener(memoryListener);
      expect(cpu["memoryListeners"]).toContain(memoryListener);
    });
    it("should add listener to registers", () => {
      cpu.addRegisterListener(registerListener);
      expect(cpu["registerListeners"]).toContain(registerListener);
    });
    it("should run only cycles listener if memory and registers did not change", () => {
      cpu.step();
      expect(cycleListener).toHaveBeenCalled();
      expect(memoryListener).not.toHaveBeenCalled();
      expect(registerListener).not.toHaveBeenCalled();
    });
  });
  describe("testing .setProgramCounter()", () => {
    it("should set the program counter", () => {
      const cpu = new CPU();
      cpu.setProgramCounter(new DoubleWord(0x1234));
      expect(cpu.pc).toEqual(new DoubleWord(0x1234));
    });
    it("should call register listeners", () => {
      const cpu = new CPU();
      const registerListener = vi.fn();
      cpu.addRegisterListener(registerListener);
      cpu.setProgramCounter(new DoubleWord(0x1234));
      expect(registerListener).toHaveBeenCalled();
    });
  });
  describe("testing .getValue()", () => {
    it("[accumulator] should return accumulator", () => {
      const cpu = new CPU();
      cpu.reg[ByteRegister.ida] = new Word(0x42);
      expect(cpu.getValue(AddressingMode.accumulator, [])).toEqual(
        new Word(0x42),
      );
    });
    it("[immediate] should return first byte of the instruction", () => {
      const cpu = new CPU();
      expect(cpu.getValue(AddressingMode.immediate, [new Word(0x42)])).toEqual(
        new Word(0x42),
      );
    });
    it("[relative] should return first byte of the instruction", () => {
      const cpu = new CPU();
      expect(cpu.getValue(AddressingMode.relative, [new Word(0x42)])).toEqual(
        new Word(0x42),
      );
    });
    it("[others] should return same result as getMemoryAddress()", () => {
      const cpu = new CPU();
      expect(cpu.getValue(AddressingMode.zeroPage, [new Word(0x00)])).toEqual(
        getMemoryAddress(cpu.reg, cpu["memory"], AddressingMode.zeroPage, [
          new Word(0x00),
        ]),
      );
      expect(cpu.getValue(AddressingMode.zeroPageX, [new Word(0x00)])).toEqual(
        getMemoryAddress(cpu.reg, cpu["memory"], AddressingMode.zeroPageX, [
          new Word(0x00),
        ]),
      );
      expect(cpu.getValue(AddressingMode.zeroPageY, [new Word(0x00)])).toEqual(
        getMemoryAddress(cpu.reg, cpu["memory"], AddressingMode.zeroPageY, [
          new Word(0x00),
        ]),
      );
      expect(
        cpu.getValue(AddressingMode.absolute, [new Word(0x00), new Word(0x00)]),
      ).toEqual(
        getMemoryAddress(cpu.reg, cpu["memory"], AddressingMode.absolute, [
          new Word(0x00),
          new Word(0x00),
        ]),
      );
      expect(
        cpu.getValue(AddressingMode.absoluteX, [
          new Word(0x00),
          new Word(0x00),
        ]),
      ).toEqual(
        getMemoryAddress(cpu.reg, cpu["memory"], AddressingMode.absoluteX, [
          new Word(0x00),
          new Word(0x00),
        ]),
      );
      expect(
        cpu.getValue(AddressingMode.absoluteY, [
          new Word(0x00),
          new Word(0x00),
        ]),
      ).toEqual(
        getMemoryAddress(cpu.reg, cpu["memory"], AddressingMode.absoluteY, [
          new Word(0x00),
          new Word(0x00),
        ]),
      );

      expect(
        cpu.getValue(AddressingMode.indirect, [new Word(0x00), new Word(0x00)]),
      ).toEqual(
        getMemoryAddress(cpu.reg, cpu["memory"], AddressingMode.indirect, [
          new Word(0x00),
          new Word(0x00),
        ]),
      );
      expect(
        cpu.getValue(AddressingMode.indirectX, [
          new Word(0x00),
          new Word(0x00),
        ]),
      ).toEqual(
        getMemoryAddress(cpu.reg, cpu["memory"], AddressingMode.indirectX, [
          new Word(0x00),
          new Word(0x00),
        ]),
      );
      expect(
        cpu.getValue(AddressingMode.indirectY, [
          new Word(0x00),
          new Word(0x00),
        ]),
      ).toEqual(
        getMemoryAddress(cpu.reg, cpu["memory"], AddressingMode.indirectY, [
          new Word(0x00),
          new Word(0x00),
        ]),
      );
    });
  });
  describe("testing .readInstruction()", () => {
    it("should read instruction from memory", () => {
      const cpu = new CPU();
      const command = {
        commandType: CommandType.lda,
        addressingMode: AddressingMode.immediate,
      };
      cpu.writeMemory(cpu["programCounter"], cmdToByte(command));
      cpu.writeMemory(cpu["programCounter"].sum(1).value, new Word(0x1));
      const { instruction, offset } = cpu.readInstruction();
      expect(instruction).toEqual({
        command: command,
        trailingBytes: [new Word(0x1)],
      });
      expect(offset).toBe(1);
    });
  });
});
