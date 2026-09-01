import React from "react";

export interface Column<T> {
  header: string;
  accessor?: keyof T;
  render?: (row: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Table<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  error = null,
  emptyMessage = "No data found.",
  page,
  totalPages,
  onPageChange,
}: TableProps<T>) {
  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                {columns.map((col, i) => (
                  <th
                    key={i}
                    className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading &&
                !error &&
                data.map((row) => (
                  <tr
                    key={keyExtractor(row)}
                    className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                  >
                    {columns.map((col, i) => (
                      <td key={i} className="px-5 py-4">
                        {col.render
                          ? col.render(row)
                          : col.accessor !== undefined
                          ? String(row[col.accessor] ?? "")
                          : null}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Loading */}
        {loading && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="px-6 py-4">
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && data.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-gray-900">{emptyMessage}</p>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && data.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Table;
