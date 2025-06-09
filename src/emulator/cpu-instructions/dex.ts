import { ByteRegister, CPU, StatusPosition } from "../cpu";
import { Word } from "../memory";

export default function dex(this: CPU) {
  const result = new Word(this.reg[ByteRegister.idx].value);
  result.decrement();
  this.reg[ByteRegister.idx] = result;
  this.setStatus(StatusPosition.zero, result.value === 0);
  this.setStatus(StatusPosition.negative, result.bit(7) === 1);
}
