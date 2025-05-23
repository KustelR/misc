import { ByteRegister, CPU, StatusPosition } from "../cpu";
import { Instruction } from "../instructions";
import { Word } from "../memory";

export default function sbc(this: CPU, instruction: Instruction) {
  let value;
  value = this.getValue(
    instruction.command.addressingMode,
    instruction.trailingBytes,
  );
  const result = this.reg[ByteRegister.ida].sub(value);
  result.value = result.value.sub(
    new Word(this.reg[ByteRegister.ps].bit(StatusPosition.carry ? 0 : 1)),
  ).value;

  this.setStatus(StatusPosition.overflow, result.isOverflown);
  this.setStatus(StatusPosition.zero, this.reg[ByteRegister.ida].value === 0);
  this.setStatus(StatusPosition.negative, result.value.bit(7) === 1);
  this.setStatus(StatusPosition.carry, !result.isOverflown);
  this.reg[ByteRegister.ida] = result.value;
}
