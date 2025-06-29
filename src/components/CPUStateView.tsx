"use client";

import MemoryView from "@/components/MemoryView";
import { CPU, ByteRegister, CPURegisters, ProcessorStatus } from "@/emulator/cpu";
import { DoubleWord, Word } from "@/emulator/memory";
import { formatByte } from "@/utils/formatByte";
import { useEffect, useState } from "react";
import TextButton from "./ui/TextButton";
import TextInput from "./ui/TextInput";

export default function CPUStateView(props: {
  cpu: CPU;
  onSpeedChange?: (speed: number) => void;
}) {
  const { cpu, onSpeedChange } = props;
  const [registers, setRegisters] = useState<CPURegisters>(cpu.reg);
  const [isDebug, setIsDebug] = useState(true);
  const [programCounter, setProgramCounter] = useState<DoubleWord>(cpu.pc);
  useEffect(() => {
    cpu.addRegisterListener((c) => {
      setRegisters({ ...c.reg });
      setProgramCounter(c.pc);
    });
  }, [cpu]);

  return (
    <div className="h-full flex-1/4 flex flex-col bg-neutral-800 space-y-2 overflow-y-auto">
      <header className="bg-white/10 w-full px-2">CPU State</header>
      <div className="flex flex-row flex-wrap p-2 space-x-2 space-y-2">
        {isDebug && (
          <>
            <ByteView header="IDA" value={registers[ByteRegister.ida].value} />
            <ByteView header="IDX" value={registers[ByteRegister.idx].value} />
            <ByteView header="IDY" value={registers[ByteRegister.idy].value} />
            <ProgramCounter value={programCounter.value} />
            <ByteView
              header="Stack Pointer"
              value={registers[ByteRegister.sp].value}
            />
            <Flags {...cpu.getProcessorStatus()} />
            <MemoryView cpu={cpu} height={16} />
          </>
        )}
        <Meta
          cpu={cpu}
          setIsDebug={setIsDebug}
          isDebug={isDebug}
          onSpeedChange={onSpeedChange || (() => {})}
        />
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

function Flags(props: ProcessorStatus) {
  const { carry, zero, interrupt, decimal, brk, overflow, negative } =
    props;
  return (
    <div className="space-y-1">
      <header className="bg-white/10 w-full flex justify-center items-center px-2">
        Flags
      </header>
      <div className="grid grid-cols-3 space-x-1 space-y-1">
        <FlagView header="Carry" value={carry} />
        <FlagView header="Zero" value={zero} />
        <FlagView header="IRQ dis" value={interrupt} />
        <FlagView header="Decimal" value={decimal} />
        <FlagView header="BRK cmd" value={brk} />
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

function Meta(props: {
  cpu: CPU;
  isDebug: boolean;
  setIsDebug: (arg: boolean) => void;
  onSpeedChange: (arg: number) => void;
}) {
  const { cpu, setIsDebug, isDebug, onSpeedChange: setSpeed } = props;
  const [cycles, setCycles] = useState(0);
  useEffect(() => {
    cpu.addCyclesListener((c) => {
      setCycles(c);
    });
  }, [cpu]);
  return (
    <div className="">
      <h2 className="bg-white/10 px-1">Meta</h2>
      <div className="flex flex-col w-full space-x-2 space-y-2  justify-center flex-wrap h-fit">
        <p className="">
          Cycles: {cycles} (
          {((cycles * 1000) / (Date.now() - cpu.started.getTime())).toFixed(2)}{" "}
          c/s)
        </p>
        <TextInput
          title="affected by hardware and browser"
          placeholder="Speed t/s"
          onChange={(e) => setSpeed(Number(e.target.value))}
        />
        <div className="flex flex-row space-x-2 space-y-2 flex-wrap h-fit w-full">
          <TextButton onClick={() => cpu.unpause()}>start</TextButton>
          <TextButton onClick={() => cpu.pause()}>stop</TextButton>
          <TextButton onClick={() => cpu.step()}>step</TextButton>
          <TextButton onClick={() => cpu.reset()}>reset</TextButton>
          <TextButton
            className={isDebug ? "bg-red-600/15" : "bg-green-600/15"}
            onClick={() => setIsDebug(!isDebug)}
          >
            debug
          </TextButton>
        </div>
      </div>
    </div>
  );
}
