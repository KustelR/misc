import { ByteRegister, CPU, StatusPosition } from "../cpu";
import { Word } from "../memory";

export default function dey(this: CPU) {
  const result = new Word(this.reg[ByteRegister.idy].value);
  result.decrement();
  this.reg[ByteRegister.idy] = result;
  this.setStatus(StatusPosition.zero, result.value === 0);
  this.setStatus(StatusPosition.negative, result.bit(7) === 1);
}
