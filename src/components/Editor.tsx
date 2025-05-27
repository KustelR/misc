"use client";

import CodeMirror from "@uiw/react-codemirror";
import { androidstudio } from "@uiw/codemirror-theme-androidstudio";
import { useEffect, useState } from "react";
import { compile } from "@/emulator/compiler";
import { Word } from "@/emulator/memory";

export default function Editor(props: {
  onChange: (bytes: Word[] | null, error?: Error) => void;
}) {
  const { onChange } = props;
  const [code, setCode] = useState("");
  useEffect(() => {
    try {
      onChange(compile(code));
    } catch (error) {
      if (error instanceof Error) {
        onChange(null, error);
      } else {
        onChange([], new Error("Unknown error"));
      }
    }
  }, [code]);
  return (
    <div className="flex-1 w-full p-2 md:min-w-64 overflow-hidden">
      <div className="h-full overflow-auto">
        <CodeMirror
          className="w-full whitespace-pre"
          theme={androidstudio}
          value={code}
          onChange={setCode}
        />
      </div>
    </div>
  );
}
