import { ByteRegister, CPU, getMemoryAddress, StatusPosition } from "../cpu";
import { AddressingMode, Instruction } from "../instructions";
import { Word } from "../memory";

export default function ror(this: CPU, instruction: Instruction) {
  const value = this.getValue(
    instruction.command.addressingMode,
    instruction.trailingBytes,
  );

  const res = new Word(value.value >> 1);
  res.value |= this.reg[ByteRegister.ps].bit(StatusPosition.carry) << 7;

  if (instruction.command.addressingMode === AddressingMode.accumulator) {
    this.reg[ByteRegister.ida] = res;
  } else {
    const address = getMemoryAddress(
      this.reg,
      this.mem,
      instruction.command.addressingMode,
      instruction.trailingBytes,
    );
    this.writeMemory(address, res);
  }

  this.setStatus(StatusPosition.carry, !!value.bit(0));
  this.setStatus(StatusPosition.negative, !!res.bit(7));
  this.setStatus(StatusPosition.zero, this.reg[ByteRegister.ida].value === 0);
}
