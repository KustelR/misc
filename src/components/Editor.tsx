"use client";

import CodeMirror from "@uiw/react-codemirror";
import { androidstudio } from "@uiw/codemirror-theme-androidstudio";
import { useEffect, useState } from "react";
import { compile } from "@/emulator/compiler";
import { DoubleWord, Word } from "@/emulator/memory";

export default function Editor(props: {
  onChange: (bytes: Word[] | null, error?: Error) => void;
  setIsExportable: (isExportable: boolean) => void;
}) {
  const { onChange, setIsExportable } = props;
  const [code, setCode] = useState("");
  const [compileOutput, setCompileOutput] = useState<Error | null>(null);
  useEffect(() => {
    try {
      onChange(compile(code, new DoubleWord(0x600)));
      setCompileOutput(null);
    } catch (error) {
      if (error instanceof Error) {
        setCompileOutput(error);
      } else {
        setCompileOutput(
          new Error(
            `Compiler instance thrown unknown instance instead of error: ${error}`,
          ),
        );
      }
    }
  }, [code]);
  useEffect(() => {
    setIsExportable(compileOutput === null);
  }, [compileOutput]);
  return (
    <div className="flex-1 w-full p-2 md:min-w-64 overflow-hidden">
      <div className=" overflow-auto">
        <CodeMirror
          className="w-full whitespace-pre"
          theme={androidstudio}
          value={code}
          onChange={setCode}
        />
      </div>
      <p className="bg-red-500/10 whitespace-pre">{compileOutput?.message}</p>
    </div>
  );
}
