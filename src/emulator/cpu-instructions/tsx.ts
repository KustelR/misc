import { arithmeticResultFlags, ByteRegister, CPU } from "../cpu";

export default function tsx(this: CPU) {
  this.reg[ByteRegister.idx] = this.reg[ByteRegister.sp];
  this.updateArithmeticStatuses(
    arithmeticResultFlags(this.reg[ByteRegister.idx]),
  );
}
