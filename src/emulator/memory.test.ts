import { DoubleWord, Memory, Word } from "./memory";
import { describe, it, expect } from "vitest";

describe("testing Word class", () => {
  it("should create a Word instance with a positive value", () => {
    const word = new Word(0x1);
    expect(word.value).toBe(0x1);
  });
  it("should create a Word instance with a negative value", () => {
    const word = new Word(-0x1);
    expect(word.value).toBe(0x81);
  });
  it("should throw an error for overflown value", () => {
    expect(() => new Word(111111)).toThrow("Invalid word: 111111");
  });
  it("should return 1 on set bits", () => {
    const word = new Word(0x1);
    expect(word.bit(0)).toBe(1);
  });
  it("should increment", () => {
    const word = new Word(0x1);
    word.increment();
    expect(word.value).toBe(0x2);
  });
  it("should decrement", () => {
    const word = new Word(0x2);
    word.decrement();
    expect(word.value).toBe(0x1);
  });
  it("should sum correctly", () => {
    const word1 = new Word(0x1);
    const word2 = new Word(0x2);
    expect(word1.sum(word2).value.value).toBe(0x3);
  });
  it("should return correct values after sum overflown", () => {
    const word1 = new Word(0xff);
    const word2 = new Word(0x1);
    const sumRes = word1.sum(word2);
    expect(sumRes.isOverflown).toBe(true);
    expect(sumRes.value.value).toBe(0x00);
    expect(sumRes.raw).toBe(0x100);
  });
  it("should subtract correctly", () => {
    const word1 = new Word(0x2);
    const word2 = new Word(0x1);
    expect(word1.sub(word2).value.value).toBe(0x1);
  });
  it("should return correct values after subtraction overflown", () => {
    const word1 = new Word(0x0);
    const word2 = new Word(0x1);
    const subRes = word1.sub(word2);
    expect(subRes.isOverflown).toBe(true);
    expect(subRes.value.value).toBe(0x81);
    expect(subRes.raw).toBe(-0x1);
  });
  it("should return correct and result", () => {
    const word1 = new Word(0x1);
    const word2 = new Word(0x1);
    const andRes = word1.and(word2);
    expect(andRes.value).toBe(0x01);
    const word3 = new Word(0x1);
    const word4 = new Word(0x2);
    const andRes2 = word3.and(word4);
    expect(andRes2.value).toBe(0x00);
  });
  it("should return correct xor result", () => {
    const word1 = new Word(0x1);
    const word2 = new Word(0x1);
    const xorRes = word1.xor(word2);
    expect(xorRes.value).toBe(0x00);
    const word3 = new Word(0x1);
    const word4 = new Word(0x3);
    const xorRes2 = word3.xor(word4);
    expect(xorRes2.value).toBe(0x02);
  });
  it("should return correct or result", () => {
    const word1 = new Word(0x1);
    const word2 = new Word(0x1);
    const orRes = word1.or(word2);
    expect(orRes.value).toBe(0x01);
    const word3 = new Word(0x1);
    const word4 = new Word(0x2);
    const orRes2 = word3.or(word4);
    expect(orRes2.value).toBe(0x03);
  });
  it("should return true if negative", () => {
    const word = new Word(-0x1);
    expect(word.isNegative()).toBe(true);
  });
});
describe("testing DoubleWord class", () => {
  it("should create a DoubleWord instance with a given value", () => {
    const doubleWord = new DoubleWord(0x1234);
    expect(doubleWord.value).toBe(0x1234);
  });
  it("should throw an error for invalid DoubleWord value", () => {
    expect(() => new DoubleWord(0x123456)).toThrow("Invalid double word");
  });
  it("should return the least significant byte", () => {
    const doubleWord = new DoubleWord(0x1234);
    expect(doubleWord.least().value).toBe(0x34);
  });
  it("should return the most significant byte", () => {
    const doubleWord = new DoubleWord(0x1234);
    expect(doubleWord.most().value).toBe(0x12);
  });
  it("should increment correctly", () => {
    const doubleWord = new DoubleWord(0x1234);
    doubleWord.increment();
    expect(doubleWord.value).toBe(0x1235);
  });
  it("should sum correctly", () => {
    const doubleWord = new DoubleWord(0x1234);
    const word = new Word(0x1);
    const result = doubleWord.sum(word);
    expect(result.value.value).toBe(0x1235);
  });
  it("should sum with sign correctly", () => {
    const doubleWord = new DoubleWord(0x1234);
    const word = new Word(0x81);
    const result = doubleWord.sumSigned(word);
    expect(result.value.value).toBe(0x1233);
  });
  it("should return true if negative", () => {
    const word = new DoubleWord(0xffff);
    expect(word.isNegative()).toBe(true);
  });
});
describe("testing class memory", () => {
  it("should create a Memory instance", () => {
    const memory = new Memory();
    expect(memory).toBeInstanceOf(Memory);
  });
  it("should read and write bytes correctly", () => {
    const memory = new Memory();
    const address = new DoubleWord(0x1234);
    const value = new Word(0x42);
    memory.writeByte(address, value);
    expect(memory.readByte(address).value).toBe(value.value);
  });
});
