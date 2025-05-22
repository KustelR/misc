import { Word } from "./memory";

export class Stack {
  private memory: Uint8Array;
  constructor() {
    this.memory = new Uint8Array(256);
  }

  push(value: Word, pos: Word) {
    this.memory[pos.value] = value.value;
  }

  pull(pos: Word): Word {
    const value = this.memory[pos.value];
    return new Word(value);
  }
}
