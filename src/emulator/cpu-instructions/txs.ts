import { arithmeticResultFlags, ByteRegister, CPU } from "../cpu";

export default function tsx(this: CPU) {
  this.reg[ByteRegister.sp] = this.reg[ByteRegister.idx];
  this.updateArithmeticStatuses(
    arithmeticResultFlags(this.reg[ByteRegister.sp]),
  );
}
