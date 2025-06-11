import { describe, it } from "vitest";
import { Stack } from "./stack";
import { Word } from "./memory";

describe("testing stack object", () => {
  it("should push values onto the stack", () => {
    const stack = new Stack();
    stack.push(new Word(0x0), new Word(0x0));
  });

  it("should pull values off the stack", () => {
    const stack = new Stack();
    stack.push(new Word(0x1), new Word(0x0));
    stack.pull(new Word(0x0));
  });
});
