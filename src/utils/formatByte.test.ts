import { describe, expect, it } from "vitest";
import { formatByte } from "./formatByte";
import { Word } from "@/emulator/memory";

describe("testing format byte function", () => {
  it("should format a byte with prefix by default", () => {
    const formatted = formatByte(0x42);
    expect(formatted).toBe("0x42");
  });
  it("should handle Word class instances", () => {
    const word = new Word(0x42);
    const formatted = formatByte(word);
    expect(formatted).toBe("0x42");
  });
  it("should not add prefix if specified", () => {
    const formatted = formatByte(0x42, true);
    expect(formatted).toBe("42");
  });
  it("should add leading zero", () => {
    const formatted = formatByte(0x2);
    expect(formatted).toBe("0x02");
  });
  it("should not add leading zero if specified", () => {
    const formatted = formatByte(0x2, false, true);
    expect(formatted).toBe("0x2");
  });
});
