import { ByteRegister, CPU } from "../cpu";
import { Word } from "../memory";

export default function inx(this: CPU) {
  const result = this.reg[ByteRegister.idx].sum(new Word(1));
  this.reg[ByteRegister.idx] = result.value;
}
