"use client";

import CPUStateView from "@/components/CPUStateView";
import Editor from "@/components/Editor";
import { CPU, ByteRegister } from "@/emulator/cpu";
import { AddressingMode, CommandType } from "@/emulator/instructions";
import { DoubleWord, Word } from "@/emulator/memory";
import { useEffect, useState } from "react";

const PROGRAM_START = 0x600;

export default function () {
  const [cpu, setCpu] = useState(new CPU());
  const [programCounter, setProgramCounter] = useState(
    new DoubleWord(PROGRAM_START),
  );
  function inc() {
    setProgramCounter(new DoubleWord(programCounter.value + 1));
  }
  useEffect(() => {
    cpu.pc = new DoubleWord(PROGRAM_START - 1);
    let pc = new DoubleWord(PROGRAM_START);
    function writeAndInc(val: number) {
      cpu.writeMemory(pc, new Word(val));
      pc = new DoubleWord(pc.value + 1);
    }
    writeAndInc(0xa6);
    writeAndInc(0x0);
    writeAndInc(0xe8);
    writeAndInc(0x86);
    writeAndInc(0x0);
    writeAndInc(0x4c);
    writeAndInc(0xff);
    writeAndInc(0x5);
    inc();
    cpu.start(1);
  }, [cpu]);
  return (
    <main className="flex flex-col md:flex-row space-x-6 flex-1 space-y-4">
      <CodeView />
      <CPUStateView cpu={cpu} />
    </main>
  );
}

function CodeView() {
  return (
    <div className="h-screen w-full md:h-full md:flex-1 flex flex-col bg-neutral-800">
      <header className="bg-white/10 w-full px-2">Code</header>
      <Editor />
    </div>
  );
}
