import { CPU, getMemoryAddress } from "../cpu";
import { Instruction } from "../instructions";
import { DoubleWord } from "../memory";

export default function jsr(this: CPU, instruction: Instruction) {
  const address = getMemoryAddress(
    this.reg,
    this.mem,
    instruction.command.addressingMode,
    instruction.trailingBytes,
  );
  const oldAddress = this.pc;
  this.pushStack(oldAddress.least());
  this.pushStack(oldAddress.most());
  this.pc = address;
}
