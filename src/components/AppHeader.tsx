import Link from "next/link";

export default function () {
  return (
    <header className="flex flex-row items-baseline space-x-4 p-2 bg-neutral-800 font-[family-name:var(--font-geist-mono)]">
      <Link href="/" className="hover:text-neutral-400">
        Home
      </Link>
      <Link href="/em6502" className="hover:text-neutral-400">
        6502 emulator
      </Link>
    </header>
  );
}
