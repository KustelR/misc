import { ReactNode } from "react";

interface TextButtonProps {
  className?: string;
  onClick?: () => void;
  children?: ReactNode;
}

export default function TextButton(props: TextButtonProps) {
  const { className, onClick, children } = props;
  return (
    <button
      className={`${className ? className : "bg-white/5"} px-1 cursor-pointer size-fit`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
