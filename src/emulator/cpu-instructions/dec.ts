import { CPU, getMemoryAddress, StatusPosition } from "../cpu";
import { Instruction } from "../instructions";

export default function dec(this: CPU, instruction: Instruction) {
  const address = getMemoryAddress(
    this.reg,
    this.mem,
    instruction.command.addressingMode,
    instruction.trailingBytes,
  );

  const result = this.mem.readByte(address).decrement().value;
  this.setStatus(StatusPosition.negative, result.value > 0x80);
  this.setStatus(StatusPosition.zero, result.value === 0x0);
  this.mem.writeByte(address, result);
}
