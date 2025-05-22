class Word {
  constructor(data: number) {
    if (data < 0 || data > 255) {
      throw new Error("Invalid word");
    }
    this.value = data;
  }
  toDoubleWord() {
    return new DoubleWord(this.value);
  }

  bit(index: number) {
    if (index < 0 || index > 7) {
      throw new Error("Invalid bit index");
    }
    return (this.value >> index) & 1;
  }
  increment(): { value: Word; isOverflown: boolean } {
    this.value = (this.value + 1) & 0xff;
    return { value: this, isOverflown: this.value === 0 };
  }
  decrement(): { value: Word; isOverflown: boolean } {
    this.value = (this.value - 1) & 0xff;
    return { value: this, isOverflown: this.value === 255 };
  }
  sum(val: Word): { value: Word; raw: number; isOverflown: boolean } {
    const res = this.value + val.value;
    return { value: new Word(res % 256), raw: res, isOverflown: res > 255 };
  }
  and(val: Word): Word {
    return new Word(this.value & val.value);
  }
  xor(val: Word): Word {
    return new Word(this.value ^ val.value);
  }
  or(val: Word): Word {
    return new Word(this.value | val.value);
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
  least(): Word {
    return new Word(this.value & 0xff);
  }
  increment(): { value: DoubleWord; isOverflown: boolean } {
    this.value = (this.value + 1) & 0xffff;
    return { value: this, isOverflown: this.value === 0 };
  }
  sum(val: DoubleWord | number): { value: DoubleWord; isOverflown: boolean } {
    const res = this.value + (typeof val == "number" ? val : val.value);
    return { value: new DoubleWord(res % 65536), isOverflown: res > 65535 };
  }
}

class Memory {
  constructor() {
    this.memory = new Uint8Array(65536);
  }

  readByte(address: DoubleWord): Word {
    return new Word(this.memory[address.value]);
  }

  writeByte(address: DoubleWord, value: Word) {
    this.memory[address.value] = value.value;
  }

  memory: Uint8Array;
}

export { Memory, DoubleWord, Word };
