import { ChangeEventHandler } from "react";

interface TextInputProps {
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder: string;
}

export default function TextInput(props: TextInputProps) {
  const { onChange, placeholder } = props;
  return (
    <input
      className="block w-1/2 bg-white/5"
      placeholder={placeholder}
      type="text"
      onChange={onChange}
    />
  );
}
