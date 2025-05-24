import { CPU, StatusPosition } from "../cpu";

export default function clc(this: CPU) {
  this.setStatus(StatusPosition.carry, false);
}
