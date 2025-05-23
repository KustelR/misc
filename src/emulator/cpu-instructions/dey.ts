import { ByteRegister, CPU } from "../cpu";
import { Word } from "../memory";

export default function dey(this: CPU) {
  const result = new Word(this.reg[ByteRegister.idy].value);
  result.decrement();
  this.reg[ByteRegister.idy] = result;
}
