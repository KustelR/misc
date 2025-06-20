import { ByteRegister, CPU, StatusPosition } from "../cpu";
import { Instruction } from "../instructions";

export default function bvc(this: CPU, instruction: Instruction) {
  const value = this.getValue(
    instruction.command.addressingMode,
    instruction.trailingBytes,
  );
  if (this.reg[ByteRegister.ps].bit(StatusPosition.overflow) === 1) return;
  const newAddress = this.pc.sumSigned(value).value;
  this.pc = newAddress;
}
