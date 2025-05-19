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
    cpu.writeMemory(new DoubleWord(17), new Word(2));
    cpu.perform({
      command: {
        commandType: CommandType.adc,
        addressingMode: AddressingMode.immediate,
      },
      trailingBytes: [new Word(129)],
    });
    cpu.perform({
      command: {
        commandType: CommandType.adc,
        addressingMode: AddressingMode.immediate,
      },
      trailingBytes: [new Word(128)],
    });
    cpu.perform({
      command: {
        commandType: CommandType.sda,
        addressingMode: AddressingMode.zeroPage,
      },
      trailingBytes: [new Word(1)],
    });
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
