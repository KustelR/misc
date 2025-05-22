import { arithmeticResultFlags, ByteRegister, CPU } from "../cpu";

export default function tax(this: CPU) {
  this.reg[ByteRegister.idx] = this.reg[ByteRegister.ida];
  this.updateArithmeticStatuses(
    arithmeticResultFlags(this.reg[ByteRegister.idx]),
  );
}
