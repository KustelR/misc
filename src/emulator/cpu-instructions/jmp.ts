import { CPU, getMemoryAddress } from "../cpu";
import { Instruction } from "../instructions";
import { DoubleWord } from "../memory";

export default function jmp(this: CPU, instruction: Instruction) {
  const address = getMemoryAddress(
    this.reg,
    this.mem,
    instruction.command.addressingMode,
    instruction.trailingBytes,
  );
  this.pc = address;
}
