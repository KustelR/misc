import { CPU, StatusPosition } from "../cpu";

export default function cli(this: CPU) {
  this.setStatus(StatusPosition.interrupt, false);
}
