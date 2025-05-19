"use client";

import CPUStateView from "@/components/CPUStateView";
import Editor from "@/components/Editor";
import { CPU, ByteRegister } from "@/emulator/cpu";
import { AddressingMode, CommandType } from "@/emulator/instructions";
import { DoubleWord, Word } from "@/emulator/memory";
import { useEffect, useState } from "react";

export default function () {
  const [cpu, setCpu] = useState(new CPU());
  useEffect(() => {
    cpu.writeMemory(new DoubleWord(0x1000), new Word(0x69));
    cpu.writeMemory(new DoubleWord(0x1001), new Word(0x1));
    cpu.writeMemory(new DoubleWord(0x1002), new Word(0x85));
    cpu.writeMemory(new DoubleWord(0x1003), new Word(0x0));
    cpu.programCounter = new DoubleWord(0x1000);
    cpu.setByteRegister(ByteRegister.ps, new Word(255));
    cpu.start();
  }, [cpu]);
  return (
    <main className="flex flex-row space-x-6 h-full space-y-4">
      <CodeView />
      <CPUStateView cpu={cpu} />
    </main>
  );
}

function CodeView() {
  return (
    <div className="h-full flex flex-col bg-neutral-800">
      <header className="bg-white/10 w-full px-2">Code</header>
      <Editor />
    </div>
  );
}
