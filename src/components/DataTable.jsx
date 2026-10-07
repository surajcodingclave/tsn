"use client";

import { useMemo, useState } from "react";
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { cn, Button, Card, CardContent, EmptyState } from "@/components/ui";

/**
 * Reusable, responsive DataTable.
 *
 * columns: [{ key, header, accessor?(row), render?(row), sortable?, align?, className? }]
 * filters: [{ key, label?, value, onChange, options:[{value,label}] }]  (controlled by parent)
 * rowActions: (row) => ReactNode
 */
export function DataTable({
  title,
  description,
  columns,
  data = [],
  loading = false,
  searchable = true,
  searchPlaceholder = "Search…",
  filters = [],
  toolbar,
  pagination = true,
  pageSize: initialPageSize = 10,
  rowActions,
  onRowClick,
  emptyTitle = "No records found",
  emptyDescription = "Nothing to show here yet.",
  emptyIcon: EmptyIcon = Inbox,
  getRowId = (row, i) => row._id || row.id || i,
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const accessorFor = (col) => col.accessor || ((row) => row[col.key]);

  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const v = accessorFor(col)(row);
        return v != null && String(v).toLowerCase().includes(q);
      })
    );
  }, [data, query, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filtered;
    const acc = accessorFor(col);
    const copy = [...filtered];
    copy.sort((a, b) => {
      const va = acc(a); const vb = acc(b);
      if (va == null && vb == null) return 0;
      if (va == null) return -1;
      if (vb == null) return 1;
      if (typeof va === "number" && typeof vb === "number") return va - vb;
      return String(va).localeCompare(String(vb), undefined, { numeric: true });
    });
    return sortDir === "asc" ? copy : copy.reverse();
  }, [filtered, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const rows = pagination ? sorted.slice(start, start + pageSize) : sorted;

  const toggleSort = (col) => {
    if (col.sortable === false) return;
    if (sortKey === col.key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(col.key); setSortDir("asc"); }
  };

  return (
    <div>
      {(title || toolbar || searchable || filters.length > 0) && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {title && (
            <div className="mr-auto">
              <h2 className="text-lg font-semibold">{title}</h2>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
          )}
          {searchable && (
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder={searchPlaceholder}
                className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}
          {filters.map((f) => (
            <select
              key={f.key}
              value={f.value}
              onChange={(e) => { f.onChange(e.target.value); setPage(1); }}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {(f.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ))}
          {toolbar}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col)}
                    className={cn(
                      "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                      col.sortable !== false && "cursor-pointer select-none hover:text-foreground",
                      col.align === "right" && "text-right",
                      col.className
                    )}
                  >
                    <span className={cn("inline-flex items-center gap-1", col.align === "right" && "flex-row-reverse")}>
                      {col.header}
                      {sortKey === col.key && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </span>
                  </th>
                ))}
                {rowActions && <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={columns.length + (rowActions ? 1 : 0)} className="px-4 py-10 text-center text-sm text-muted-foreground">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (rowActions ? 1 : 0)}>
                    <EmptyState icon={EmptyIcon} title={emptyTitle} description={emptyDescription} />
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr
                    key={getRowId(row, i)}
                    className={cn("transition-colors hover:bg-muted/40", onRowClick && "cursor-pointer")}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={cn("px-4 py-3 text-sm", col.align === "right" && "text-right", col.className)}>
                        {col.render ? col.render(row) : accessorFor(col)(row) ?? "—"}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">{rowActions(row)}</div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && !loading && sorted.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Rows</span>
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="rounded-md border border-input bg-background px-2 py-1 text-sm">
                {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <span>· {start + 1}–{Math.min(start + pageSize, sorted.length)} of {sorted.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-muted-foreground">Page {currentPage} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}