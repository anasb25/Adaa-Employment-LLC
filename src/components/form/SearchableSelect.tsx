import { useState, useEffect, useRef, useMemo } from "react";
import { SelectChevron } from "./SelectChevron";
import {
  buildSelectTriggerClassName,
  selectDropdownEmptyClasses,
  selectDropdownItemClasses,
  selectDropdownPanelClasses,
  selectPlaceholderTextClasses,
  selectValueTextClasses,
} from "./selectStyles";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  value?: string;
  disabled?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  placeholder = "Search and select...",
  onChange,
  className = "",
  value,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Find the selected option's label
  const selectedOption = options.find((o) => o.value === value);

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const query = search.toLowerCase().trim();
    return options.filter((o) => o.label.toLowerCase().includes(query));
  }, [options, search]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-option]");
      items[focusedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedIndex]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearch("");
    setFocusedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
    setFocusedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setFocusedIndex(-1);
    if (!isOpen) setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
        }
        break;
      case "Enter":
        e.preventDefault();
        if (isOpen && focusedIndex >= 0 && filteredOptions[focusedIndex]) {
          handleSelect(filteredOptions[focusedIndex].value);
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSearch("");
        setFocusedIndex(-1);
        break;
      case "Tab":
        setIsOpen(false);
        setSearch("");
        setFocusedIndex(-1);
        break;
    }
  };

  const openDropdown = () => {
    if (!disabled) {
      setIsOpen(true);
      // Focus the search input after opening
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {/* Trigger / Display */}
      <div
        onClick={openDropdown}
        className={`${buildSelectTriggerClassName({
          disabled,
          hasValue: Boolean(selectedOption),
        })} flex cursor-pointer items-center focus-within:border-brand-300 focus-within:ring-3 focus-within:ring-brand-500/20 dark:focus-within:border-brand-800 ${
          disabled ? "cursor-not-allowed" : ""
        }`}
      >
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent outline-none text-gray-800 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30"
            value={search}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={selectedOption ? selectedOption.label : placeholder}
            autoFocus
          />
        ) : (
          <span
            className={`flex-1 truncate ${
              selectedOption ? selectValueTextClasses : selectPlaceholderTextClasses
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        )}

        <div className="flex items-center gap-1 ml-2 shrink-0">
          {/* Clear button */}
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Clear selection"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3.40717 4.46881C3.11428 4.17591 3.11428 3.70104 3.40717 3.40815C3.70006 3.11525 4.17494 3.11525 4.46783 3.40815L6.99943 5.93975L9.53095 3.40822C9.82385 3.11533 10.2987 3.11533 10.5916 3.40822C10.8845 3.70112 10.8845 4.17599 10.5916 4.46888L8.06009 7.00041L10.5916 9.53193C10.8845 9.82482 10.8845 10.2997 10.5916 10.5926C10.2987 10.8855 9.82385 10.8855 9.53095 10.5926L6.99943 8.06107L4.46783 10.5927C4.17494 10.8856 3.70006 10.8856 3.40717 10.5927C3.11428 10.2998 3.11428 9.8249 3.40717 9.53201L5.93877 7.00041L3.40717 4.46881Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          )}
          {/* Chevron */}
          <SelectChevron
            size="sm"
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={listRef}
          className={selectDropdownPanelClasses}
          role="listbox"
        >
          {filteredOptions.length === 0 ? (
            <div className={selectDropdownEmptyClasses}>No results found</div>
          ) : (
            filteredOptions.map((option, index) => {
              const isSelected = option.value === value;
              const isFocused = index === focusedIndex;

              return (
                <div
                  key={option.value}
                  data-option
                  className={selectDropdownItemClasses({ isSelected, isFocused })}
                  onClick={() => handleSelect(option.value)}
                  role="option"
                  aria-selected={isSelected}
                >
                  {option.label}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
