import * as React from "react";
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Search, X, Eye } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  locations?: string[];
  className?: string;
  getRowClassName?: (row: TData) => string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  locations,
  className,
  getRowClassName,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnsOpen, setColumnsOpen] = React.useState(false);
  const columnsRef = React.useRef<HTMLDivElement>(null);
  const locationFilter = columnFilters.find((f) => f.id === "location")?.value as string | undefined;

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) {
        setColumnsOpen(false);
      }
    }
    if (columnsOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [columnsOpen]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      columnVisibility,
    },
  });

  const allColumns = table.getAllColumns().filter((c) => c.getCanHide());

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="mb-4 flex flex-wrap items-center gap-2 bg-background px-4 pt-4 pb-2 sm:px-6">
        <div className="flex w-full items-center gap-2">
          <img src="/Job_Boards_Icon.svg" alt="" className="h-5 w-5" />
          <span className="text-sm font-semibold text-foreground">WalkScape Job Tiers</span>
          <span className="text-xs text-muted-foreground">(not a Not A Cult tool)</span>
        </div>
        <div className="relative min-w-0 flex-1 basis-[100%] sm:basis-0 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search across all fields..."
            value={globalFilter}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
            className="w-full pl-9"
          />
        </div>
        {locations && locations.length > 0 && (
          <div className="flex w-full flex-wrap items-center gap-1.5">
            <button
              onClick={() => setColumnFilters([])}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !locationFilter
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All
            </button>
            {locations.map((loc) => (
              <button
                key={loc}
                onClick={() => setColumnFilters(locationFilter === loc ? [] : [{ id: "location", value: loc }])}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  locationFilter === loc
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="mb-2 flex items-center gap-2">
        <div className="relative" ref={columnsRef}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setColumnsOpen(!columnsOpen)}
          >
            <Eye /> Columns
          </Button>
          {columnsOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-md border border-border bg-popover p-2 shadow-lg">
              {allColumns.map((col) => {
                const label = typeof col.columnDef.header === "string"
                  ? col.columnDef.header
                  : col.id;
                return (
                  <label
                    key={col.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs text-foreground hover:bg-muted"
                  >
                    <input
                      type="checkbox"
                      checked={col.getIsVisible()}
                      onChange={col.getToggleVisibilityHandler()}
                      className="accent-primary"
                    />
                    {label}
                  </label>
                );
              })}
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setGlobalFilter("");
            setSorting([]);
            setColumnVisibility({});
            setColumnFilters([]);
          }}
        >
          <X /> Clear all
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto rounded-md border border-border">
        <Table containerClassName="overflow-visible">
          <TableHeader className="sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={getRowClassName?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
