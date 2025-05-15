class Word {
  constructor(data: number) {
    if (data < 0 || data > 255) {
      throw new Error("Invalid word");
    }
    this.value = data;
  }
  toNumber() {
    return this.value;
  }
  value: number;
}

class DoubleWord {
  constructor(data: number) {
    if (data < 0 || data > 65535) {
      throw new Error("Invalid double word");
    }
    this.value = data;
  }
  value: number;
  toNumber() {
    return this.value;
  }
}

class Memory {
  constructor() {
    this.memory = new Uint8Array(65536);
  }

  readByte(address: DoubleWord): Word {
    return new Word(this.memory[address.toNumber()]);
  }

  writeByte(address: DoubleWord, value: Word) {
    this.memory[address.toNumber()] = value.toNumber();
  }

  memory: Uint8Array;
}

export { Memory, DoubleWord, Word };
