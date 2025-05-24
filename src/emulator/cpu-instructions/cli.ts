import { CPU, StatusPosition } from "../cpu";

export default function cli(this: CPU) {
  this.setStatus(StatusPosition.irqDisabled, false);
}
