import {
  arithmeticResultFlags,
  ByteRegister,
  CPU,
  StatusPosition,
} from "../cpu";
import { Instruction } from "../instructions";

export default function tst(this: CPU, instruction: Instruction) {
  const value = this.getValue(
    instruction.command.addressingMode,
    instruction.trailingBytes,
  );
  const result = this.reg[ByteRegister.ida].and(value);
  this.updateArithmeticStatuses(arithmeticResultFlags(value.value));
  const isZero = result.value === 0;
  const isOverflown = value.bit(6) === 1;
  this.setStatus(StatusPosition.zero, isZero);
  this.setStatus(StatusPosition.overflow, isOverflown);
}
