import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";

import { Input } from "./input";
import { Button } from "./button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import {
  ChevronsRight,
  ChevronRight,
  ChevronsLeft,
  ChevronLeft,
} from "lucide-react";

type PaginationProps = {
  steps: number[];
  currentPage: number;
  pageSize: number;
};

type SortedColumns = Record<string, "asc" | "desc">;

interface TableComponentProps<T extends object> {
  data: T[];
  columns: ColumnDef<T, any>[];
  totalRows: number;
  pagination: PaginationProps;
  loading: boolean;
  onChangePagination: (params: {
    currentPage: number;
    limit: number;
    sortedColumns?: SortedColumns;
  }) => void;
}

const TableWithPagination = <T extends object>({
  data = [],
  columns = [],
  totalRows = 0,
  pagination = {
    steps: [20, 50, 100],
    currentPage: 1,
    pageSize: 20,
  },
  loading = false,
  onChangePagination = () => {},
}: TableComponentProps<T>) => {
  const [columnFilters, setColumnFilters] = React.useState<any>([]);

  const table = useReactTable({
    data,
    columns,
    filterFns: {},
    state: {
      columnFilters,
    },
    initialState: {
      pagination: {
        pageIndex: pagination.currentPage,
        pageSize: pagination.pageSize,
      },
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(totalRows / pagination.pageSize),
    autoResetPageIndex: false,
  });

  React.useEffect(() => {
    const { pageIndex, pageSize } = table.getState().pagination;
    const sorting = table.getState().sorting;

    const latestSort = sorting?.[sorting.length - 1];
    const sortedColumns: SortedColumns =
      latestSort && latestSort.id
        ? { [latestSort.id]: latestSort.desc ? "desc" : "asc" }
        : {};

    onChangePagination({
      currentPage: pageIndex,
      limit: pageSize,
      sortedColumns,
    });
  }, [
    table.getState().pagination.pageIndex,
    table.getState().pagination.pageSize,
    table.getState().sorting,
  ]);
  return ( 
    <div className="space-y-4 p-1 h-full w-full max-w-full">
      {/* Table Wrapper with Horizontal Scroll */}
      <div className="overflow-x-auto w-full max-h-[550px]">
        <table className="w-full min-w-[600px] text-sm border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-gray-200 bg-gray-50">
                {headerGroup.headers.map((header, index) => {
                  const isLast = index === headerGroup.headers.length - 1;
                  return (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className={`px-2 sm:px-4 py-2 font-semibold text-left text-gray-700 select-none cursor-pointer 
                      sticky top-0 z-20 bg-gray-50 ${isLast ? "right-0" : ""}`}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {(() => {
                        const sortState = header.column.getIsSorted();
                        if (sortState === "asc") return " 🔼";
                        if (sortState === "desc") return " 🔽";
                        return null;
                      })()}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  {columns.map((_, j) => (
                    <td key={j} className="px-2 sm:px-4 py-2 text-center">
                      <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded mx-auto" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => {
                const cells = row.getVisibleCells();
                return (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                    {cells.map((cell, index) => {
                      const isLast = index === cells.length - 1;
                      return (
                        <td
                          key={cell.id}
                          className={`px-2 sm:px-4 py-2 text-center text-gray-700 ${
                            isLast ? "sticky right-0 z-10 bg-white" : ""
                          }`}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-6 text-gray-500"
                >
                  Data not found. Please adjust the filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
  
      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
        <div className="text-sm text-gray-600">{totalRows} Rows</div>
  
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>Page</span>
          <strong>
            {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </strong>
  
          <span className="mx-2 hidden sm:inline">| Go to Page:</span>
          <Input
            type="number"
            min={1}
            max={table.getPageCount()}
            className="w-16 sm:w-20 border border-gray-300 rounded-md px-2 sm:px-3 py-1.5"
            defaultValue={table.getState().pagination.pageIndex + 1}
            onBlur={(e) => {
              const page = Number(e.target.value);
              if (!isNaN(page) && page >= 1 && page <= table.getPageCount()) {
                table.setPageIndex(page - 1);
              }
            }}
          />
  
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(val) => table.setPageSize(Number(val))}
          >
            <SelectTrigger className="w-[80px] sm:w-[100px]">
              <SelectValue placeholder="Rows" />
            </SelectTrigger>
            <SelectContent>
              {pagination.steps.map((step) => (
                <SelectItem key={step} value={String(step)}>
                  {step}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
  
          {/* Pagination Buttons */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
  
};

export default TableWithPagination;
