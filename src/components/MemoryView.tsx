"use client";

import { DoubleWord, Memory, Word } from "@/emulator/memory";
import { useEffect, useState } from "react";

export default function MemoryView(props: {
  memory: Memory;
  height?: number;
  defaultOffsetY?: number;
}) {
  const { memory, height, defaultOffsetY } = props;

  const [cells, setCells] = useState<number[]>([]);
  const [offsetY, setOffsetY] = useState<number>(defaultOffsetY ?? 0);

  useEffect(() => {
    memory.writeByte(new DoubleWord(17), new Word(2));
    memory.writeByte(new DoubleWord(18), new Word(1));
    const newCells = [];
    for (let y = 0; y < (height ?? 16); y++) {
      for (let x = 0; x < 16; x++) {
        const address = new DoubleWord((y + offsetY) * 16 + x);
        const value = memory.readByte(address);
        newCells.push(value.toNumber());
      }
    }
    setCells(newCells);
  }, [memory, offsetY, height]);
  return (
    <div className="">
      <header className="bg-white/10 flex justify-center items-center px-2">
        Mem {offsetY}
      </header>

      <div className="grid grid-cols-16 w-fit">
        {cells.map((value, index) => (
          <MemoryCell key={index} value={value} />
        ))}
      </div>

      <input
        className="block w-[160px] bg-white/5"
        placeholder="Offset Y"
        type="text"
        onChange={(event) => {
          setOffsetY(Number(event.target.value));
        }}
      />
    </div>
  );
}

function MemoryCell(props: { value: number }) {
  const { value } = props;
  return (
    <div
      style={{
        backgroundColor: getColor(value),
        width: 20,
        height: 20,
      }}
      className="flex flex-row items-center justify-center"
    >
      <p className="mix-blend-exclusion">{value}</p>
    </div>
  );
}

function getColor(value: number) {
  switch (value) {
    case 0:
      return "#000000";
    case 1:
      return "#FFFFFF";
    case 2:
      return "#FF0000";
  }
}
