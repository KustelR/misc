"use client";

import CodeMirror from "@uiw/react-codemirror";
import { tokyoNight } from "@uiw/codemirror-theme-tokyo-night";
import { androidstudio } from "@uiw/codemirror-theme-androidstudio";
import { useEffect, useState } from "react";
import { compile } from "@/emulator/compiler";

export default function Editor() {
  const [code, setCode] = useState("");
  useEffect(() => {
    try {
      console.log(compile(code));
    } catch (error) {
      console.warn("Compilation error:", error);
    }
  }, [code]);
  return (
    <div className="flex-1 p-2 md:min-w-64 overflow-hidden">
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
