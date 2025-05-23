import {
  arithmeticResultFlags,
  ByteRegister,
  CPU,
  StatusPosition,
} from "../cpu";
import { Instruction } from "../instructions";

export default function adc(this: CPU, instruction: Instruction) {
  let value;
  value = this.getValue(
    instruction.command.addressingMode,
    instruction.trailingBytes,
  );
  const result = this.reg[ByteRegister.ida].sum(value);

  this.updateArithmeticStatuses(arithmeticResultFlags(result.raw));
  this.setStatus(StatusPosition.overflow, result.raw > 255);
  this.reg[ByteRegister.ida] = result.value;
}
