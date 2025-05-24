import { CPU, StatusPosition } from "../cpu";

export default function cld(this: CPU) {
  this.setStatus(StatusPosition.decimal, false);
}
