import { arithmeticResultFlags, ByteRegister, CPU } from "../cpu";

export default function pha(this: CPU) {
  this.updateArithmeticStatuses(
    arithmeticResultFlags(this.reg[ByteRegister.ida]),
  );
  this.pushStack(this.reg[ByteRegister.ida]);
}
