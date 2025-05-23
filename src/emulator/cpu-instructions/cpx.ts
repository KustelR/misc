import { ByteRegister, CPU, StatusPosition } from "../cpu";
import { Instruction } from "../instructions";

export default function cpx(this: CPU, instruction: Instruction) {
  let value;
  value = this.getValue(
    instruction.command.addressingMode,
    instruction.trailingBytes,
  );
  const result = this.reg[ByteRegister.idx].sub(value);
  this.setStatus(StatusPosition.carry, result.raw >= 0);
  this.setStatus(StatusPosition.zero, result.raw === 0);
  this.setStatus(StatusPosition.negative, result.value.bit(7) === 1);
}
