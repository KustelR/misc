import { describe, expect, it } from "vitest";
import { statusFromReg, statusToReg } from "./cpu";
import { Word } from "./memory";

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
