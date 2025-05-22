"use client";

import { CPU } from "@/emulator/cpu";
import { DoubleWord, Memory, Word } from "@/emulator/memory";
import { formatByte } from "@/utils/formatByte";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";

export default function MemoryView(props: {
  cpu: CPU;
  height?: number;
  defaultOffsetY?: number;
}) {
  const { cpu, height, defaultOffsetY } = props;

  const [cells, setCells] = useState<number[]>([]);
  const [offsetY, setOffsetY] = useState<number>(defaultOffsetY ?? 0);

  useEffect(() => {
    const newCells = [];
    for (let y = 0; y < (height ?? 16); y++) {
      for (let x = 0; x < 16; x++) {
        if (x === 0) {
          newCells.push(999);
        }
        const address = new DoubleWord((y + offsetY) * 16 + x);
        const value = cpu.memory.readByte(address);
        newCells.push(value.value);
      }
    }
    setCells(newCells);
    cpu.addMemoryListener((m) => {
      const newCells = [];
      for (let y = 0; y < (height ?? 16); y++) {
        for (let x = 0; x < 16; x++) {
          if (x === 0) {
            newCells.push(999);
          }
          const address = new DoubleWord((y + offsetY) * 16 + x);
          const value = cpu.memory.readByte(address);
          newCells.push(value.value);
        }
      }
      setCells(newCells);
    });
  }, [cpu.memory, offsetY, height]);
  return (
    <div className="">
      <header className="bg-white/10 flex justify-center items-center px-2">
        Mem {formatByte(offsetY)}
      </header>

      <div className="grid grid-cols-17 w-fit">
        {Array.from({ length: 17 }, (_, colIndex) => {
          if (colIndex === 0) {
            return <ColRowIndex key={-1} value="X" />;
          }
          return (
            <ColRowIndex
              key={colIndex - 1}
              value={formatByte(colIndex - 1, true, true)}
            />
          );
        })}
        {cells.map((value, index) => {
          if (index % 17 === 0) {
            return (
              <ColRowIndex
                key={index}
                value={formatByte(
                  Math.floor((index + offsetY * 16) / 16),
                  true,
                  true,
                )}
              />
            );
          }
          return <MemoryCell key={nanoid()} value={value} />;
        })}
      </div>
      <div className="flex flex-row">
        <input
          className="block w-1/2 bg-white/5"
          placeholder="Offset Y (hex)"
          type="text"
          onChange={(event) => {
            if (
              event.target.value == "" ||
              Number.isNaN(Number(parseInt(event.target.value, 16)))
            ) {
              setOffsetY(0);
            } else {
              setOffsetY(Number(parseInt(event.target.value, 16)));
            }
          }}
        />
        <button
          className="w-1/2 bg-white/10 cursor-pointer"
          onClick={() => {
            setOffsetY(offsetY + 1);
          }}
        >
          increment
        </button>
      </div>
    </div>
  );
}

function ColRowIndex(props: { key?: any; value: string }) {
  const { value } = props;
  return (
    <div className="w-5 h-5 flex justify-center items-center">{value}</div>
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
