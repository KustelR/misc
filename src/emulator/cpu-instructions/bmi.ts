import { ByteRegister, CPU, StatusPosition } from "../cpu";
import { Instruction } from "../instructions";

export default function bmi(this: CPU, instruction: Instruction) {
  const value = this.getValue(
    instruction.command.addressingMode,
    instruction.trailingBytes,
  );
  if (this.reg[ByteRegister.ps].bit(StatusPosition.negative) === 1) return;
  const newAddress = this.pc.sum(value).value;
  this.pc = newAddress;
}
