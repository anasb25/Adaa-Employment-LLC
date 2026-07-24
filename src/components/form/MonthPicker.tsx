import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { CalenderIcon } from "../../icons";
import {
  buildSelectTriggerClassName,
  selectValueTextClasses,
} from "./selectStyles";
import {
  formatMonthLabel,
  formatMonthValue,
  getCurrentMonth,
  MONTH_SHORT_LABELS,
  parseMonthValue,
} from "../../utils/monthUtils";

type MonthPickerProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  wrapperClassName?: string;
  disabled?: boolean;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
};

const PANEL_WIDTH = 280;
const VIEWPORT_PADDING = 16;

export default function MonthPicker({
  value,
  onChange,
  id,
  className = "",
  wrapperClassName = "",
  disabled = false,
  placeholder = "Select month",
  minYear = 2000,
  maxYear = 2100,
}: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [panelAlign, setPanelAlign] = useState<"left" | "right">("left");
  const parsed = parseMonthValue(value || getCurrentMonth());
  const [viewYear, setViewYear] = useState(parsed.year);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentMonth = getCurrentMonth();
  const displayValue = value ? formatMonthLabel(value) : placeholder;

  const updatePanelAlign = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const overflowsRight =
      rect.left + PANEL_WIDTH > window.innerWidth - VIEWPORT_PADDING;
    const overflowsLeft =
      rect.right - PANEL_WIDTH < VIEWPORT_PADDING;

    if (overflowsRight && !overflowsLeft) {
      setPanelAlign("right");
    } else {
      setPanelAlign("left");
    }
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;

    updatePanelAlign();

    window.addEventListener("resize", updatePanelAlign);
    window.addEventListener("scroll", updatePanelAlign, true);

    return () => {
      window.removeEventListener("resize", updatePanelAlign);
      window.removeEventListener("scroll", updatePanelAlign, true);
    };
  }, [isOpen, updatePanelAlign]);

  useEffect(() => {
    if (value) {
      setViewYear(parseMonthValue(value).year);
    }
  }, [value]);

  const closePicker = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closePicker();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, closePicker]);

  const handleMonthSelect = (month: number) => {
    onChange(formatMonthValue(viewYear, month));
    closePicker();
  };

  const shiftYear = (delta: number) => {
    setViewYear((prev) => Math.min(maxYear, Math.max(minYear, prev + delta)));
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${wrapperClassName || "w-full"}`}
    >
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen((open) => !open)}
        className={`${buildSelectTriggerClassName({
          disabled,
          hasValue: Boolean(value),
          className,
        })} flex items-center justify-between gap-2 text-left`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            value ? selectValueTextClasses : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {displayValue}
        </span>
        <CalenderIcon className="size-5 shrink-0 text-gray-500 dark:text-gray-400" />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Choose month"
          className={`absolute z-[9999] mt-1 w-[280px] max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white p-4 shadow-theme-lg dark:border-gray-700 dark:bg-gray-900 ${
            panelAlign === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftYear(-1)}
              disabled={viewYear <= minYear}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-white/5"
              aria-label="Previous year"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M10 12L6 8L10 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
              {viewYear}
            </span>

            <button
              type="button"
              onClick={() => shiftYear(1)}
              disabled={viewYear >= maxYear}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-white/5"
              aria-label="Next year"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M6 4L10 8L6 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {MONTH_SHORT_LABELS.map((label, index) => {
              const month = index + 1;
              const monthValue = formatMonthValue(viewYear, month);
              const isSelected = value === monthValue;
              const isCurrent = currentMonth === monthValue;

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleMonthSelect(month)}
                  className={`rounded-lg px-2 py-2.5 text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-brand-500 text-white shadow-theme-xs"
                      : isCurrent
                        ? "border border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
