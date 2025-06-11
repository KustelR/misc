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
    new Word(1 - this.reg[ByteRegister.ps].bit(StatusPosition.carry)),
  ).value;

  this.setStatus(
    StatusPosition.overflow,
    value.bit(7) === this.reg[ByteRegister.ida].bit(7) && value.bit(7) === 1,
  );
  this.setStatus(StatusPosition.zero, this.reg[ByteRegister.ida].value === 0);
  this.setStatus(StatusPosition.negative, result.value.bit(7) === 1);
  this.setStatus(StatusPosition.carry, !result.isOverflown);
  this.reg[ByteRegister.ida] = result.value;
}
