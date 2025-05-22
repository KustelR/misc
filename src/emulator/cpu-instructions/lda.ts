import { ByteRegister, CPU, getMemoryAddress } from "../cpu";
import { Instruction } from "../instructions";

export default function lda(this: CPU, instruction: Instruction) {
  const value = this.getValue(
    instruction.command.addressingMode,
    instruction.trailingBytes,
  );
  this.reg[ByteRegister.ida] = value;
}
