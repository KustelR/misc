import { ByteRegister, CPU, statusFromReg, statusToReg } from "../cpu";
import { Instruction } from "../instructions";

export default function adc(this: CPU, instruction: Instruction) {
  let value;
  value = this.getValue(
    instruction.command.addressingMode,
    instruction.trailingBytes,
  );
  const result = this.reg[ByteRegister.ida].sum(value);

  let status = statusFromReg(this.reg[ByteRegister.ps]);
  status.overflow = result.isOverflown;
  this.reg[ByteRegister.ps] = statusToReg(status);

  this.reg[ByteRegister.ida] = result.value;
}
