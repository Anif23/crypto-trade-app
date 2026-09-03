import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
  className?: string;
  showInfo?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  className,
  showInfo = true,
}: PaginationProps) {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-3", className)}>
      {showInfo && totalItems !== undefined && itemsPerPage !== undefined ? (
        <p className="text-sm text-muted-foreground order-2 sm:order-1">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{" "}
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
        </p>
      ) : showInfo ? (
        <p className="text-sm text-muted-foreground order-2 sm:order-1">
          Page {currentPage} of {totalPages}
        </p>
      ) : (
        <div className="order-2 sm:order-1" />
      )}

      <div className="flex items-center gap-2 order-1 sm:order-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          className="h-8"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        {/* Page numbers - show on larger screens */}
        <div className="hidden md:flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className="h-8 w-8 p-0"
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        {/* Mobile - show current page */}
        <div className="md:hidden">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
          >
            {currentPage}
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className="h-8"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
