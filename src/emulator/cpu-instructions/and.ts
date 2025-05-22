import { arithmeticResultFlags, ByteRegister, CPU } from "../cpu";
import { Instruction } from "../instructions";

export default function and(this: CPU, instruction: Instruction) {
  const value = this.getValue(
    instruction.command.addressingMode,
    instruction.trailingBytes,
  );
  const result = this.reg[ByteRegister.ida].and(value);
  this.updateArithmeticStatuses(arithmeticResultFlags(result));
  this.reg[ByteRegister.ida] = result;
}
