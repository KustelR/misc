"use client";

import CPUStateView from "@/components/CPUStateView";
import Editor from "@/components/Editor";
import { CPU, ByteRegister } from "@/emulator/cpu";
import { DoubleWord, Word } from "@/emulator/memory";
import { useEffect, useState } from "react";

const PROGRAM_START = 0x600;

export default function () {
  const [speed, setSpeed] = useState(10);
  const [cpu, setCpu] = useState(new CPU());
  useEffect(() => {}, [cpu]);
  return (
    <main className="flex flex-col md:flex-row space-x-6 flex-1 space-y-4">
      <CodeView
        onSubmit={(bytes) => {
          loadProgram(bytes, new DoubleWord(PROGRAM_START), cpu);
          cpu.start(speed);
        }}
      />
      <CPUStateView cpu={cpu} onSpeedChange={(s) => setSpeed(s)} />
    </main>
  );
}

function CodeView(props: { onSubmit: (bytes: Word[], error?: Error) => void }) {
  const [bytes, setBytes] = useState<Word[]>([]);
  const [isExportable, setIsExportable] = useState<boolean>(false);
  return (
    <div className="h-screen flex-grow md:h-full md:flex-4 flex flex-col bg-neutral-800">
      <header className="bg-white/10 w-full px-2">Code</header>
      <Editor
        setIsExportable={setIsExportable}
        onChange={(bytes, error) => {
          if (bytes) {
            setBytes(bytes);
          }
          if (error) {
            console.error(error);
          }
        }}
      />
      <button
        className="w-full bg-white/10 my-1 enabled:cursor-pointer disabled:bg-red-600"
        disabled={!isExportable}
        onClick={() => {
          if (isExportable) props.onSubmit(bytes);
        }}
      >
        Assemble
      </button>
    </div>
  );
}

function loadProgram(program: Word[], programStart: DoubleWord, cpu: CPU) {
  cpu.pc = new DoubleWord(programStart.value);
  cpu.reg[ByteRegister.ps] = new Word(0x0);
  cpu.unpause();

  program.forEach((byte, index) => {
    cpu.writeMemory(new DoubleWord(programStart.value + index), byte);
  });
}
