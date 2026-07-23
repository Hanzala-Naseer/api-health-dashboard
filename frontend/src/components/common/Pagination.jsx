import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, total, onPageChange, itemLabel = 'items' }) {
  if (!totalPages || totalPages <= 1) {
    return total ? (
      <p className="text-sm text-text-secondary">
        Showing all {total} {itemLabel}
      </p>
    ) : null;
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-text-secondary">
        Page {page} of {totalPages}
        {total !== undefined && <span> · {total} {itemLabel}</span>}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="rounded-lg border border-border p-2 text-text-secondary hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40 focus-ring"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-8 rounded-lg bg-surface-container-high px-3 py-1.5 text-center text-sm font-medium text-text-primary">
          {page}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="rounded-lg border border-border p-2 text-text-secondary hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40 focus-ring"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
