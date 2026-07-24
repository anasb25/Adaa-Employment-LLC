import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { employeesApi } from "../../services/api/employeesApi";
import { useDebounce } from "../../hooks/useDebounce";
import { SelectChevron } from "../form/SelectChevron";
import {
  buildSelectTriggerClassName,
  selectDropdownEmptyClasses,
  selectDropdownItemClasses,
  selectDropdownPanelClasses,
  selectPlaceholderTextClasses,
  selectValueTextClasses,
} from "../form/selectStyles";

interface EmployeeSearchSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const SEARCH_LIMIT = 10;

export default function EmployeeSearchSelect({
  value,
  onChange,
  placeholder = "Search employee by name or ID...",
  disabled = false,
  className = "",
}: EmployeeSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(searchInput.trim(), 300);

  const { data: searchData, isFetching: isSearching } = useQuery({
    queryKey: ["employees", "search", debouncedSearch],
    queryFn: () => employeesApi.searchEmployees(debouncedSearch, 1, SEARCH_LIMIT),
    enabled: debouncedSearch.length >= 1,
  });

  const { data: selectedEmployee } = useQuery({
    queryKey: ["employee", value],
    queryFn: () => employeesApi.getEmployee(Number(value)),
    enabled: !!value,
  });

  const options =
    searchData?.data?.map((emp) => ({
      value: String(emp.id),
      label: `${emp.name} (${emp.adaa_emp_code})`,
    })) ?? [];

  const selectedLabel = value
    ? selectedEmployee
      ? `${selectedEmployee.name} (${selectedEmployee.adaa_emp_code})`
      : options.find((o) => o.value === value)?.label ?? `ID ${value}`
    : "";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchInput("");
        setFocusedIndex(-1);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-option]");
      items[focusedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedIndex]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchInput("");
    setFocusedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchInput("");
    setFocusedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setFocusedIndex(-1);
    if (!isOpen) setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) setIsOpen(true);
        else
          setFocusedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : 0
          );
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isOpen)
          setFocusedIndex((prev) =>
            prev > 0 ? prev - 1 : options.length - 1
          );
        break;
      case "Enter":
        e.preventDefault();
        if (isOpen && focusedIndex >= 0 && options[focusedIndex])
          handleSelect(options[focusedIndex].value);
        else if (!isOpen) setIsOpen(true);
        break;
      case "Escape":
        setIsOpen(false);
        setSearchInput("");
        setFocusedIndex(-1);
        break;
      case "Tab":
        setIsOpen(false);
        setSearchInput("");
        setFocusedIndex(-1);
        break;
    }
  };

  const openDropdown = () => {
    if (!disabled) {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <div
        onClick={openDropdown}
        className={`${buildSelectTriggerClassName({
          disabled,
          hasValue: Boolean(selectedLabel),
        })} flex cursor-pointer items-center focus-within:border-brand-300 focus-within:ring-3 focus-within:ring-brand-500/20 dark:focus-within:border-brand-800 ${
          disabled ? "cursor-not-allowed" : ""
        }`}
      >
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent outline-none text-gray-800 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30"
            value={searchInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus
          />
        ) : (
          <span
            className={`flex-1 truncate ${
              selectedLabel ? selectValueTextClasses : selectPlaceholderTextClasses
            }`}
          >
            {selectedLabel || placeholder}
          </span>
        )}

        <div className="flex items-center gap-1 ml-2 shrink-0">
          {selectedLabel && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Clear selection"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M3.40717 4.46881C3.11428 4.17591 3.11428 3.70104 3.40717 3.40815C3.70006 3.11525 4.17494 3.11525 4.46783 3.40815L6.99943 5.93975L9.53095 3.40822C9.82385 3.11533 10.2987 3.11533 10.5916 3.40822C10.8845 3.70112 10.8845 4.17599 10.5916 4.46888L8.06009 7.00041L10.5916 9.53193C10.8845 9.82482 10.8845 10.2997 10.5916 10.5926C10.2987 10.8855 9.82385 10.8855 9.53095 10.5926L6.99943 8.06107L4.46783 10.5927C4.17494 10.8856 3.70006 10.8856 3.40717 10.5927C3.11428 10.2998 3.11428 9.8249 3.40717 9.53201L5.93877 7.00041L3.40717 4.46881Z" fill="currentColor" />
              </svg>
            </button>
          )}
          <SelectChevron
            size="sm"
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {isOpen && (
        <div
          ref={listRef}
          className={selectDropdownPanelClasses}
          role="listbox"
        >
          {searchInput.trim().length === 0 ? (
            <div className={selectDropdownEmptyClasses}>
              Type to search for an employee
            </div>
          ) : isSearching ? (
            <div className={selectDropdownEmptyClasses}>Searching...</div>
          ) : options.length === 0 ? (
            <div className={selectDropdownEmptyClasses}>No employees found</div>
          ) : (
            options.map((option, index) => {
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
}
