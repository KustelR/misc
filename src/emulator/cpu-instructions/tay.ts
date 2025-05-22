import { arithmeticResultFlags, ByteRegister, CPU } from "../cpu";

export default function tay(this: CPU) {
  this.reg[ByteRegister.idy] = this.reg[ByteRegister.ida];
  this.updateArithmeticStatuses(
    arithmeticResultFlags(this.reg[ByteRegister.idy]),
  );
}
