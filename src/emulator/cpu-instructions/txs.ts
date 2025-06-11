import { arithmeticResultFlags, ByteRegister, CPU } from "../cpu";

export default function txs(this: CPU) {
  this.reg[ByteRegister.sp] = this.reg[ByteRegister.idx];
  this.updateArithmeticStatuses(
    arithmeticResultFlags(this.reg[ByteRegister.idx]),
  );
}
