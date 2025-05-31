import { Word } from "@/emulator/memory";

export function formatByte(
  data: number | Word,
  noPrefix?: boolean,
  noLeadingZero?: boolean,
): string {
  const value = data instanceof Word ? data.value : data;
  if (value > 255) {
    return "OVERFLOW";
  }
  return `${noPrefix ? "" : "0x"}${value > 15 || noLeadingZero ? value.toString(16) : "0" + value.toString(16)}`;
}
