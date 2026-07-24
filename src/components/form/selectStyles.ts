type DropdownItemState = {
  isSelected?: boolean;
  isFocused?: boolean;
};

/** Native & custom select trigger — matches InputField theme */
export const selectTriggerClasses =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-11 text-sm shadow-theme-xs transition-colors focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

/** Compact trigger for tables and dense layouts */
export const selectTriggerCompactClasses =
  "w-full appearance-none rounded-md border border-gray-300 bg-white px-2 py-1.5 pr-8 text-sm shadow-theme-xs transition-colors focus:border-brand-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

export const selectTriggerDisabledClasses =
  "cursor-not-allowed opacity-50 bg-gray-100 dark:bg-gray-800";

export const selectPlaceholderTextClasses =
  "text-gray-400 dark:text-gray-500";

export const selectValueTextClasses =
  "text-gray-800 dark:text-white/90";

/** Custom dropdown panel (SearchableSelect, MultiSelect, etc.) */
export const selectDropdownPanelClasses =
  "absolute z-[9999] mt-1 max-h-60 w-full overflow-y-auto custom-scrollbar rounded-lg border border-gray-200 bg-white py-1 shadow-theme-lg dark:border-gray-700 dark:bg-gray-900";

export const selectDropdownEmptyClasses =
  "px-4 py-3 text-sm text-gray-500 dark:text-gray-400";

export function selectDropdownItemClasses({
  isSelected = false,
  isFocused = false,
}: DropdownItemState = {}): string {
  const base =
    "cursor-pointer px-4 py-2.5 text-sm transition-colors text-gray-800 dark:text-white/90";

  if (isFocused) {
    return `${base} bg-brand-50 dark:bg-brand-500/10`;
  }

  if (isSelected) {
    return `${base} bg-brand-50 font-medium text-brand-600 dark:bg-brand-500/15 dark:text-brand-400`;
  }

  return `${base} hover:bg-gray-50 dark:hover:bg-white/5`;
}

export function buildSelectTriggerClassName({
  size = "md",
  disabled = false,
  hasValue = true,
  className = "",
}: {
  size?: "md" | "sm";
  disabled?: boolean;
  hasValue?: boolean;
  className?: string;
}): string {
  const sizeClass =
    size === "sm" ? selectTriggerCompactClasses : selectTriggerClasses;
  const valueClass = hasValue
    ? selectValueTextClasses
    : selectPlaceholderTextClasses;

  return [
    sizeClass,
    valueClass,
    disabled ? selectTriggerDisabledClasses : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}
