import { ByteRegister, CPU, StatusPosition } from "../cpu";
import { Instruction } from "../instructions";

export default function beq(this: CPU, instruction: Instruction) {
  const value = this.getValue(
    instruction.command.addressingMode,
    instruction.trailingBytes,
  );
  if (this.reg[ByteRegister.ps].bit(StatusPosition.zero) === 0) return;
  const newAddress = this.pc.sum(value).value;
  this.pc = newAddress;
}
