import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  if (totalPages <= 1 && totalItems <= 10) return null;

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const handlePageSelect = (p: number) => {
    if (p < 1 || p > totalPages || p === currentPage) return;
    onPageChange(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 text-xs sm:text-sm text-slate-600 border-t border-slate-200/80">
      <div className="flex items-center gap-3">
        <span>
          Showing <span className="font-semibold text-slate-800">{startItem}</span>-
          <span className="font-semibold text-slate-800">{endItem}</span> of{' '}
          <span className="font-semibold text-slate-800">{totalItems}</span>
        </span>

        <div className="flex items-center gap-1.5 ml-2">
          <span className="text-slate-400">Per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 focus:outline-hidden cursor-pointer shadow-2xs"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => handlePageSelect(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`p-1.5 rounded-lg border flex items-center justify-center transition cursor-pointer ${
            currentPage <= 1
              ? 'border-slate-200 text-slate-300 cursor-not-allowed opacity-60'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs'
          }`}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <span key={`dots-${index}`} className="px-2 py-1 text-slate-400">
                ...
              </span>
            );
          }
          const pageNum = Number(page);
          const isActive = pageNum === currentPage;
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => handlePageSelect(pageNum)}
              className={`min-w-[32px] h-8 px-2 rounded-lg font-medium transition cursor-pointer flex items-center justify-center text-xs ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => handlePageSelect(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`p-1.5 rounded-lg border flex items-center justify-center transition cursor-pointer ${
            currentPage >= totalPages
              ? 'border-slate-200 text-slate-300 cursor-not-allowed opacity-60'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs'
          }`}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

