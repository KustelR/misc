import { ByteRegister, CPU, StatusPosition } from "../cpu";
import { Word } from "../memory";

export default function iny(this: CPU) {
  const result = this.reg[ByteRegister.idy].sum(new Word(1));
  this.reg[ByteRegister.idy] = result.value;
  this.setStatus(StatusPosition.zero, result.value.value === 0);
  this.setStatus(StatusPosition.negative, result.value.bit(7) === 1);
}
