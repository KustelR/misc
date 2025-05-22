import { ByteRegister, CPU } from "../cpu";

export default function pla(this: CPU) {
  this.reg[ByteRegister.ps] = this.pullStack();
}
