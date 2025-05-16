import CPUStateView from "@/components/CPUStateView";
import Editor from "@/components/Editor";

export default function () {
  return (
    <main className="flex flex-row space-x-6 h-full space-y-4">
      <CodeView />
      <CPUStateView />
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
