import { useState, useCallback, useEffect, useRef, useId } from "react";
import { SelectChevron } from "./SelectChevron";
import {
  buildSelectTriggerClassName,
  selectDropdownItemClasses,
  selectDropdownPanelClasses,
  selectPlaceholderTextClasses,
  selectValueTextClasses,
} from "./selectStyles";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  wrapperClassName?: string;
  defaultValue?: string;
  value?: string;
  disabled?: boolean;
  id?: string;
  size?: "md" | "sm";
  autoFocus?: boolean;
  onBlur?: () => void;
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Select an option",
  onChange,
  className = "",
  wrapperClassName = "",
  defaultValue = "",
  value,
  disabled = false,
  id,
  size = "md",
  autoFocus = false,
  onBlur,
}) => {
  const [internalValue, setInternalValue] = useState<string>(
    value ?? defaultValue,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  const selectedValue = value !== undefined ? value : internalValue;
  const selectedOption = options.find((option) => option.value === selectedValue);
  const hasEmptyOption = options.some((option) => option.value === "");
  const hasValue =
    Boolean(selectedOption) || (selectedValue === "" && hasEmptyOption);

  const closeDropdown = useCallback(
    (fireBlur = false) => {
      setIsOpen(false);
      setFocusedIndex(-1);
      if (fireBlur) {
        onBlur?.();
      }
    },
    [onBlur],
  );

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (!autoFocus || disabled) return;
    setIsOpen(true);
    triggerRef.current?.focus();
  }, [autoFocus, disabled]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeDropdown(true);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, closeDropdown]);

  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-option]");
      items[focusedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedIndex]);

  const openDropdown = () => {
    if (disabled) return;
    setIsOpen(true);
    setFocusedIndex(
      Math.max(
        0,
        options.findIndex((option) => option.value === selectedValue),
      ),
    );
  };

  const handleSelect = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onChange(newValue);
    closeDropdown(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!isOpen) {
          openDropdown();
        } else {
          setFocusedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : 0,
          );
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (isOpen) {
          setFocusedIndex((prev) =>
            prev > 0 ? prev - 1 : options.length - 1,
          );
        }
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (isOpen && focusedIndex >= 0 && options[focusedIndex]) {
          handleSelect(options[focusedIndex].value);
        } else if (!isOpen) {
          openDropdown();
        }
        break;
      case "Escape":
        event.preventDefault();
        closeDropdown(true);
        break;
      case "Tab":
        closeDropdown(true);
        break;
    }
  };

  const displayLabel = selectedOption?.label ?? placeholder;

  return (
    <div ref={containerRef} className={`relative w-full ${wrapperClassName}`}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => (isOpen ? closeDropdown(true) : openDropdown())}
        onKeyDown={handleKeyDown}
        className={`${buildSelectTriggerClassName({
          size,
          disabled,
          hasValue,
          className,
        })} flex items-center justify-between gap-2 text-left`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            hasValue ? selectValueTextClasses : selectPlaceholderTextClasses
          }`}
        >
          {displayLabel}
        </span>
        <SelectChevron
          size={size === "sm" ? "sm" : "md"}
          className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          ref={listRef}
          id={listboxId}
          role="listbox"
          className={selectDropdownPanelClasses}
        >
          {options.map((option, index) => {
            const isSelected = option.value === selectedValue;
            const isFocused = index === focusedIndex;

            return (
              <div
                key={option.value || "__empty__"}
                data-option
                role="option"
                aria-selected={isSelected}
                className={selectDropdownItemClasses({ isSelected, isFocused })}
                onMouseEnter={() => setFocusedIndex(index)}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Select;
