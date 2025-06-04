import { ChangeEventHandler } from "react";

interface TextInputProps {
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder: string;
  title?: string;
}

export default function TextInput(props: TextInputProps) {
  const { onChange, placeholder, title } = props;
  return (
    <input
      className="block w-1/2 bg-white/5"
      placeholder={placeholder}
      type="text"
      onChange={onChange}
      title={title}
    />
  );
}
