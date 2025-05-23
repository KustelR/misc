import { CPU, getMemoryAddress } from "../cpu";
import { Instruction } from "../instructions";
import { DoubleWord } from "../memory";

export default function rts(this: CPU) {
  const least = this.pullStack();
  const most = this.pullStack();

  this.pc = new DoubleWord(least.value | (most.value << 8));
}
