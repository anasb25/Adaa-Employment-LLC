type SelectChevronProps = {
  className?: string;
  size?: "sm" | "md";
};

export function SelectChevron({
  className = "",
  size = "md",
}: SelectChevronProps) {
  const dimension = size === "sm" ? 16 : 20;

  return (
    <svg
      className={`stroke-current text-gray-500 dark:text-gray-400 ${className}`}
      width={dimension}
      height={dimension}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4.79175 7.39551L10.0001 12.6038L15.2084 7.39551"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
