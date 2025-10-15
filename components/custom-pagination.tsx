"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CustomPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  itemsPerPage?: number
  totalItems?: number
  showInfo?: boolean
  className?: string
  t?: (key: any) => string
  itemName?: string
}

export function CustomPagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 10,
  totalItems = 0,
  showInfo = true,
  className = "",
  t,
  itemName = "items"
}: CustomPaginationProps) {
  const startIndex = (currentPage - 1) * itemsPerPage

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page)
    }
  }

  if (totalPages <= 1) return null

  return (
    <div className={`flex items-center justify-center sm:justify-between ${className}`}>
      {showInfo && (
        <div className="text-sm text-muted-foreground hidden sm:block">
          {t ? `${t("common.showing")} ${startIndex + 1} ${t("common.to")} ${Math.min(startIndex + itemsPerPage, totalItems)} ${t("common.of")} ${totalItems} ${itemName}` : `Showing ${startIndex + 1} to ${Math.min(startIndex + itemsPerPage, totalItems)} of ${totalItems} ${itemName}`}
        </div>
      )}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="border-2 border-red-200 hover:bg-red-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1">
          {(() => {
            const pages = []
            const maxVisible = 3
            let start = Math.max(1, currentPage - 1)
            let end = Math.min(totalPages, currentPage + 1)

            if (end - start < maxVisible - 1) {
              if (start === 1) {
                end = Math.min(totalPages, start + maxVisible - 1)
              } else if (end === totalPages) {
                start = Math.max(1, end - maxVisible + 1)
              }
            }

            if (start > 1) {
              pages.push(
                <Button
                  key={1}
                  variant={currentPage === 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(1)}
                  className="w-8 h-8 p-0"
                >
                  1
                </Button>
              )
              if (start > 2) {
                pages.push(
                  <span key="start-ellipsis" className="px-1 text-gray-500">
                    ...
                  </span>
                )
              }
            }

            for (let page = start; page <= end; page++) {
              pages.push(
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              )
            }

            if (end < totalPages) {
              if (end < totalPages - 1) {
                pages.push(
                  <span key="end-ellipsis" className="px-1 text-gray-500">
                    ...
                  </span>
                )
              }
              pages.push(
                <Button
                  key={totalPages}
                  variant={currentPage === totalPages ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(totalPages)}
                  className="w-8 h-8 p-0"
                >
                  {totalPages}
                </Button>
              )
            }

            return pages
          })()}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="border-2 border-red-200 hover:bg-red-50"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}