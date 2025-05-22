import { arithmeticResultFlags, ByteRegister, CPU } from "../cpu";
import { Instruction } from "../instructions";

export default function ora(this: CPU, instruction: Instruction) {
  const value = this.getValue(
    instruction.command.addressingMode,
    instruction.trailingBytes,
  );
  const result = this.reg[ByteRegister.ida].or(value);
  this.updateArithmeticStatuses(arithmeticResultFlags(result));
  this.reg[ByteRegister.ida] = result;
}
