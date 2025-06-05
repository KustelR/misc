import { arithmeticResultFlags, ByteRegister, CPU } from "../cpu";

export default function pla(this: CPU) {
  this.reg[ByteRegister.ida] = this.pullStack();
  this.updateArithmeticStatuses(
    arithmeticResultFlags(this.reg[ByteRegister.ida]),
  );
}
