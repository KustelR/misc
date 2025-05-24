import { CPU, StatusPosition } from "../cpu";

export default function clv(this: CPU) {
  this.setStatus(StatusPosition.overflow, false);
}
