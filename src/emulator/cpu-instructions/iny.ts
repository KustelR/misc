import { ByteRegister, CPU } from "../cpu";
import { Word } from "../memory";

export default function iny(this: CPU) {
  const result = this.reg[ByteRegister.idy].sum(new Word(1));
  this.reg[ByteRegister.idx] = result.value;
}
