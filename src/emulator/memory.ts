class Word {
  constructor(data: number) {
    if (data < -127 || data > 255) {
      throw new Error(`Invalid word: ${data}`, { cause: data });
    }
    if (data >= 0) {
      this.value = data;
    } else {
      this.value = Math.abs(data) | 0x80;
    }
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
  /*
  So this treats words as signed integers instead of unsigned as any other method. Yes, this is how 6502 works.
   */
  sub(val: Word): { value: Word; raw: number; isOverflown: boolean } {
    let res = this.value - val.value;
    if (res < -127) {
      return {
        value: new Word(this.value + 256 - val.value),
        raw: res,
        isOverflown: true,
      };
    }
    return {
      value: new Word(res % 256),
      raw: res,
      isOverflown: res < 0 !== this.isNegative(),
    };
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
  dropSign(): Word {
    return new Word(this.value & 0x7f);
  }
  isNegative(): boolean {
    return this.bit(7) === 1;
  }
  value: number;
}

class DoubleWord {
  constructor(data: number) {
    if (data < 0 || data > 0xffff) {
      throw new Error("Invalid double word");
    }
    this.value = data;
  }
  value: number;
  least(): Word {
    return new Word(this.value & 0xff);
  }
  most(): Word {
    return new Word(this.value >> 8);
  }
  increment(): { value: DoubleWord; isOverflown: boolean } {
    this.value = (this.value + 1) & 0xffff;
    return { value: this, isOverflown: this.value === 0 };
  }
  sum(val: DoubleWord | Word | number): {
    value: DoubleWord;
    isOverflown: boolean;
  } {
    const res = this.value + (typeof val == "number" ? val : val.value);
    return { value: new DoubleWord(res % 65536), isOverflown: res > 65535 };
  }
  dropSign(): DoubleWord {
    return new DoubleWord(this.value & 0x7fff);
  }
  sumSigned(val: DoubleWord | Word | number): {
    value: DoubleWord;
    isOverflown: boolean;
  } {
    let argument: number;
    if (typeof val === "number") argument = val;
    else {
      argument = (val.isNegative() ? -1 : 1) * val.dropSign().value;
    }
    const res = this.value + argument;
    return { value: new DoubleWord(res % 65536), isOverflown: res > 65535 };
  }
  isNegative(): boolean {
    return this.value >> 15 > 0;
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
