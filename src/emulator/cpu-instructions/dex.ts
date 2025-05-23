import { ByteRegister, CPU } from "../cpu";
import { Word } from "../memory";

export default function dex(this: CPU) {
  const result = new Word(this.reg[ByteRegister.idx].value);
  result.decrement();
  this.reg[ByteRegister.idx] = result;
}
