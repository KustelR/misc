import { Word } from "./memory";
import { describe, it, expect } from "vitest";

describe("testing Word class", () => {
  it("should create a Word instance with a given value", () => {
    const word = new Word(0x1);
    expect(word.value).toBe(0x1);
  });
  it("should throw an error for overflown value", () => {
    expect(() => new Word(111111)).toThrow("Invalid word: 111111");
  });
});
