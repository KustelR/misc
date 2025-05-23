import AppHeader from "@/components/AppHeader";
import Link from "next/link";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen md:overflow-clip flex flex-col font-[family-name:var(--font-geist-mono)]">
      <AppHeader />
      <div className="flex flex-1 flex-col md:overflow-hidden md:flex-row p-3 md:space-x-4 space-y-4">
        <EmulatorNav />
        {children}
      </div>
    </div>
  );
}
function EmulatorNav() {
  return (
    <div className="space-y-2 bg-neutral-800 h-full">
      <header className="px-2 bg-white/10">Emulator</header>
      <ul className="[&_li]:px-2 [&_li]:hover:bg-white/5 [&_li]:cursor-pointer">
        <li>
          <Link className="w-full block" href="/em6502">
            Editor
          </Link>
        </li>
        <li>
          <Link className="w-full block" href="/em6502/memory">
            Inspect Memory
          </Link>
        </li>
        <li>
          <Link className="w-full block" href="/em6502/hardware">
            Inspect Hardware
          </Link>
        </li>
        <li>
          <Link className="w-full block" href="/em6502/faq">
            Help IDK
          </Link>
        </li>
      </ul>
    </div>
  );
}
