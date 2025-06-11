import { CPU, StatusPosition } from "../cpu";

export default function sei(this: CPU) {
  this.setStatus(StatusPosition.interrupt, true);
}
