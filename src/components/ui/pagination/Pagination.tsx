import Button from "../button/Button";
import { ChevronLeftIcon, AngleRightIcon } from "../../../icons";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  showInfo = true,
  className = "",
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {showInfo && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {startItem} to {endItem} of {totalItems} items
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Previous
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {getVisiblePages().map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`dots-${index}`}
                  className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400"
                >
                  ...
                </span>
              );
            }

            const pageNumber = page as number;
            const isCurrentPage = pageNumber === currentPage;

            return (
              <Button
                key={pageNumber}
                variant={isCurrentPage ? "primary" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNumber)}
                className={`min-w-[40px] ${
                  isCurrentPage
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : ""
                }`}
              >
                {pageNumber}
              </Button>
            );
          })}
        </div>

        {/* Next Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1"
        >
          Next
          <AngleRightIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
