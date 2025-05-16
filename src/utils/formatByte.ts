export function formatByte(
  data: number,
  noPrefix?: boolean,
  noLeadingZero?: boolean,
): string {
  if (data > 255) {
    return "OVERFLOW";
  }
  return `${noPrefix ? "" : "0x"}${data > 15 || noLeadingZero ? data.toString(16) : "0" + data.toString(16)}`;
}
