import { arithmeticResultFlags, ByteRegister, CPU } from "../cpu";
import { Instruction } from "../instructions";

export default function ldy(this: CPU, instruction: Instruction) {
  const value = this.getValue(
    instruction.command.addressingMode,
    instruction.trailingBytes,
  );
  this.reg[ByteRegister.idy] = value;
  this.updateArithmeticStatuses(arithmeticResultFlags(value));
}
