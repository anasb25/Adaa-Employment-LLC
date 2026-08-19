import { useState, useCallback, useEffect, useRef, useId } from "react";
import { createPortal } from "react-dom";
import { SelectChevron } from "./SelectChevron";
import {
  buildSelectTriggerClassName,
  selectDropdownItemClasses,
  selectDropdownPanelClasses,
  selectDropdownPanelPortalClasses,
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
  /** Render dropdown in a body portal (use inside overflow/scroll containers). */
  menuPortal?: boolean;
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
  menuPortal = false,
}) => {
  const [internalValue, setInternalValue] = useState<string>(
    value ?? defaultValue,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
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

  const updateDropdownPosition = useCallback(() => {
    if (!menuPortal || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const maxHeight = 240;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < maxHeight && rect.top > spaceBelow;

    setDropdownStyle({
      left: rect.left,
      width: rect.width,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.top + rect.height + 4 }),
    });
  }, [menuPortal]);

  useEffect(() => {
    if (!isOpen || !menuPortal) return;

    updateDropdownPosition();
    window.addEventListener("scroll", updateDropdownPosition, true);
    window.addEventListener("resize", updateDropdownPosition);

    return () => {
      window.removeEventListener("scroll", updateDropdownPosition, true);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [isOpen, menuPortal, updateDropdownPosition]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) {
        return;
      }
      if (menuPortal && listRef.current?.contains(target)) {
        return;
      }
      closeDropdown(true);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, closeDropdown, menuPortal]);

  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-option]");
      items[focusedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedIndex]);

  const openDropdown = () => {
    if (disabled) return;
    if (menuPortal) {
      updateDropdownPosition();
    }
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

  const dropdownPanel = isOpen ? (
    <div
      ref={listRef}
      id={listboxId}
      role="listbox"
      className={
        menuPortal ? selectDropdownPanelPortalClasses : selectDropdownPanelClasses
      }
      style={menuPortal ? dropdownStyle : undefined}
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
  ) : null;

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

      {menuPortal && dropdownPanel
        ? createPortal(dropdownPanel, document.body)
        : dropdownPanel}
    </div>
  );
};

export default Select;
