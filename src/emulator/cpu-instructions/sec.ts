import { CPU, StatusPosition } from "../cpu";

export default function sec(this: CPU) {
  this.setStatus(StatusPosition.carry, true);
}
