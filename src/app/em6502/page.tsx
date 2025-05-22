"use client";

import CPUStateView from "@/components/CPUStateView";
import Editor from "@/components/Editor";
import { CPU, ByteRegister } from "@/emulator/cpu";
import { AddressingMode, CommandType } from "@/emulator/instructions";
import { DoubleWord, Word } from "@/emulator/memory";
import { useEffect, useState } from "react";

const PROGRAM_START = 0x1000;

export default function () {
  const [cpu, setCpu] = useState(new CPU());
  const [programCounter, setProgramCounter] = useState(
    new DoubleWord(PROGRAM_START),
  );
  function inc() {
    setProgramCounter(new DoubleWord(programCounter.value + 1));
  }
  useEffect(() => {
    cpu.pc = new DoubleWord(PROGRAM_START);
    let pc = new DoubleWord(PROGRAM_START);
    function inc() {
      pc = new DoubleWord(pc.value + 1);
    }
    cpu.writeMemory(pc, new Word(0xa9));
    inc();
    cpu.writeMemory(pc, new Word(0x2));
    inc();
    cpu.writeMemory(pc, new Word(0x85));
    inc();
    cpu.writeMemory(pc, new Word(0x0));
    inc();
    cpu.start();
  }, [cpu]);
  return (
    <main className="flex flex-row space-x-6 flex-1 space-y-4">
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
