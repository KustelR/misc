"use client";

import MemoryView from "@/components/MemoryView";
import { Memory } from "@/emulator/memory";
import { formatByte } from "@/utils/formatByte";
import { useState } from "react";

export default function CPUStateView() {
  const [mem, setMem] = useState<Memory>(new Memory());

  return (
    <div className="h-full flex flex-col bg-neutral-800 space-y-2 overflow-y-auto">
      <header className="bg-white/10 w-full px-2">CPU State</header>
      <div className="flex flex-row flex-wrap p-2 space-x-2 space-y-2">
        <ByteView header="IDA" value={255} />
        <ByteView header="IDX" value={11} />
        <ByteView header="IDY" value={0} />
        <ProgramCounter value={1000} />
        <ByteView header="Stack Pointer" value={22} />
        <Flags
          carry={true}
          zero={false}
          irqDisabled={false}
          decimal={false}
          brkCommand={false}
          overflow={false}
          negative={true}
        />
        <MemoryView memory={mem} height={16} />
      </div>
    </div>
  );
}

function ByteView(props: { header: string; value: number }) {
  const { header, value } = props;
  return (
    <div className=" flex flex-col bg-neutral-800">
      <header className="bg-white/10 w-full flex justify-center items-center px-2">
        {header}
      </header>
      <div
        className={`${value > 255 ? "bg-red-500" : ""} flex justify-center items-center`}
      >
        {formatByte(value)}
      </div>
    </div>
  );
}

function ProgramCounter(props: { value: number }) {
  const { value } = props;
  return (
    <div className="flex flex-col bg-neutral-800">
      <header className="bg-white/10 w-full flex justify-center items-center px-2">
        Program Counter
      </header>
      <div className={`flex justify-center items-center`}>
        {[
          "0x",
          formatByte(value >> 8, true),
          formatByte(value & 0xff, true),
        ].join("")}
      </div>
    </div>
  );
}

function Flags(props: {
  carry: boolean;
  zero: boolean;
  irqDisabled: boolean;
  decimal: boolean;
  brkCommand: boolean;
  overflow: boolean;
  negative: boolean;
}) {
  const { carry, zero, irqDisabled, decimal, brkCommand, overflow, negative } =
    props;
  return (
    <div className="space-y-1">
      <header className="bg-white/10 w-full flex justify-center items-center px-2">
        Flags
      </header>
      <div className="grid grid-cols-3 space-x-1 space-y-1">
        <FlagView header="Carry" value={carry} />
        <FlagView header="Zero" value={zero} />
        <FlagView header="IRQ dis" value={irqDisabled} />
        <FlagView header="Decimal" value={decimal} />
        <FlagView header="BRK cmd" value={brkCommand} />
        <FlagView header="Overflow" value={overflow} />
        <FlagView header="Negative" value={negative} />
      </div>
    </div>
  );
}

function FlagView(props: { header: string; value: boolean }) {
  const { header, value } = props;
  return (
    <div className=" flex flex-col bg-neutral-800">
      <header className="bg-white/10 w-full flex justify-center items-center px-2">
        {header}
      </header>
      <div
        className={`${value ? "bg-green-600/15" : "bg-red-600/15"} flex justify-center items-center`}
      >
        {value ? "true" : "false"}
      </div>
    </div>
  );
}
