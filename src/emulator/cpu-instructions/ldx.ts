import { arithmeticResultFlags, ByteRegister, CPU } from "../cpu";
import { Instruction } from "../instructions";

export default function ldx(this: CPU, instruction: Instruction) {
  const value = this.getValue(
    instruction.command.addressingMode,
    instruction.trailingBytes,
  );
  this.reg[ByteRegister.idx] = value;
  this.updateArithmeticStatuses(arithmeticResultFlags(value));
}
