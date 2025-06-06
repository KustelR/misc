import { ByteRegister, CPU, getMemoryAddress } from "../cpu";
import { Instruction } from "../instructions";

export default function sty(this: CPU, instruction: Instruction) {
  const address = getMemoryAddress(
    this.reg,
    this.mem,
    instruction.command.addressingMode,
    instruction.trailingBytes,
  );
  this.writeMemory(address, this.reg[ByteRegister.idy]);
}
