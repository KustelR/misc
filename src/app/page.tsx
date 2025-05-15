import AppHeader from "@/components/AppHeader";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="font-[family-name:var(--font-geist-mono)]">
      <AppHeader />
      <main className="flex flex-col h-screen"></main>
    </div>
  );
}
