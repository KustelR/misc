import { arithmeticResultFlags, ByteRegister, CPU } from "../cpu";

export default function txa(this: CPU) {
  this.reg[ByteRegister.ida] = this.reg[ByteRegister.idx];
  this.updateArithmeticStatuses(
    arithmeticResultFlags(this.reg[ByteRegister.idx]),
  );
}
