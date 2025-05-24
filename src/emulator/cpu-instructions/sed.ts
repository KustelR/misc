import { CPU, StatusPosition } from "../cpu";

export default function sed(this: CPU) {
  this.setStatus(StatusPosition.decimal, true);
}
