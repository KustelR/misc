import { ByteRegister, CPU } from "../cpu";

export default function php(this: CPU) {
  this.pushStack(this.reg[ByteRegister.ps]);
}
