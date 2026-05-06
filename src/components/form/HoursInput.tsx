import { useState, useRef, useEffect } from "react";
import { formatDecimalHours, parseTimeInput } from "../../utils/timeUtils";

interface HoursInputProps {
  value: number;
  onChange: (decimalHours: number) => void;
  onBlur?: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
  title?: string;
  className?: string;
  max?: number;
}

export default function HoursInput({
  value,
  onChange,
  onBlur,
  disabled = false,
  autoFocus = false,
  title,
  className = "",
  max = 24,
}: HoursInputProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [autoFocus]);

  const handleFocus = () => {
    setEditing(true);
    setText(formatDecimalHours(value));
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleBlur = () => {
    setEditing(false);
    const parsed = parseTimeInput(text);
    if (parsed !== null && parsed <= max) {
      onChange(parsed);
    }
    onBlur?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setText(formatDecimalHours(value));
      setEditing(false);
      onBlur?.();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={editing ? text : formatDecimalHours(value)}
      onChange={(e) => setText(e.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      autoFocus={autoFocus}
      title={title}
      placeholder="hours"
      className={className}
    />
  );
}
