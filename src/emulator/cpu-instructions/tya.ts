import { arithmeticResultFlags, ByteRegister, CPU } from "../cpu";

export default function tay(this: CPU) {
  this.reg[ByteRegister.ida] = this.reg[ByteRegister.idy];
  this.updateArithmeticStatuses(
    arithmeticResultFlags(this.reg[ByteRegister.ida]),
  );
}
