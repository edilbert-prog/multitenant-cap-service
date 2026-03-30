"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "../../.../../../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card"
import { Input } from "../../../ui/input"
import { Label } from "../../../ui/label"
import { Badge } from "../../../ui/badge"
import { Separator } from "../../../ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "../../../ui/popover"
import { Calendar } from "../../../ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/select"
import { Checkbox } from "../../../ui/checkbox"
import { ScrollArea } from "../../../ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../ui/table"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type PaginationState,
} from "@tanstack/react-table"
import {
  Search,
  Filter,
  X,
  CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  RefreshCw,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "../../../lib/utils"

// Types
interface ColumnFilter {
  id: string
  column: string
  type: "text" | "range" | "list" | "checkbox"
  value?: string
  rangeFrom?: string
  rangeTo?: string
  listValues?: string[]
  selectedValues?: string[]
}

interface ConditionalFilter {
  id: string
  column: string
  operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE" | "NOT LIKE" | "IN" | "NOT IN"
  value: string
  logicalOperator?: "AND" | "OR"
}

interface DateRangeFilter {
  column: string
  from?: Date
  to?: Date
}

interface AdvancedDataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData>[]
  title?: string
  searchPlaceholder?: string
  enableGlobalSearch?: boolean
  enableColumnFilters?: boolean
  enableDateRange?: boolean
  enableConditionalFilters?: boolean
  enableMultiColumnSearch?: boolean
  enableExport?: boolean
  onRefresh?: () => void
  onExport?: () => void
  onFiltersChange?: (filters: any) => void
  loading?: boolean
  pageSize?: number
  pageSizeOptions?: number[]
}

export function AdvancedDataTable<TData>({
  data,
  columns,
  title = "Data Table",
  searchPlaceholder = "Search all columns...",
  enableGlobalSearch = true,
  enableColumnFilters = true,
  enableDateRange = true,
  enableConditionalFilters = true,
  enableMultiColumnSearch = true,
  enableExport = true,
  onRefresh,
  onExport,
  onFiltersChange,
  loading = false,
  pageSize = 20,
  pageSizeOptions = [10, 20, 50, 100],
}: AdvancedDataTableProps<TData>) {
  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize,
  })

  // Filter states
  const [globalFilter, setGlobalFilter] = useState("")
  const [advancedColumnFilters, setAdvancedColumnFilters] = useState<ColumnFilter[]>([])
  const [conditionalFilters, setConditionalFilters] = useState<ConditionalFilter[]>([])
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>({ column: "" })
  const [searchType, setSearchType] = useState<"range" | "list">("range")

  // Column value caches for checkbox filters
  const [columnValueCache, setColumnValueCache] = useState<Record<string, string[]>>({})

  // Get unique values for each column
  const getUniqueColumnValues = useCallback(
    (columnId: string): string[] => {
      if (columnValueCache[columnId]) {
        return columnValueCache[columnId]
      }

      const values = data
        .map((row: any) => String(row[columnId] || ""))
        .filter(Boolean)
        .filter((value, index, array) => array.indexOf(value) === index)
        .sort()

      setColumnValueCache((prev) => ({ ...prev, [columnId]: values }))
      return values
    },
    [data, columnValueCache],
  )

  // Enhanced columns with individual search
  const enhancedColumns = useMemo(() => {
    return columns.map((column) => ({
      ...column,
      header: ({ table, column: tableColumn }: any) => {
        const columnId = tableColumn.id
        const uniqueValues = getUniqueColumnValues(columnId)
        const currentFilter = advancedColumnFilters.find((f) => f.column === columnId)

        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => tableColumn.toggleSorting(tableColumn.getIsSorted() === "asc")}
                className="h-auto p-0 font-semibold hover:bg-transparent"
              >
                {typeof column.header === "string" ? column.header : columnId}
                {tableColumn.getIsSorted() === "asc" ? (
                  <ArrowUp className="ml-2 h-3 w-3" />
                ) : tableColumn.getIsSorted() === "desc" ? (
                  <ArrowDown className="ml-2 h-3 w-3" />
                ) : (
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                )}
              </Button>
            </div>

            {enableColumnFilters && (
              <div className="flex gap-1">
                {/* Text Search */}
                <Input
                  placeholder={`Search ${columnId}...`}
                  value={(tableColumn.getFilterValue() as string) ?? ""}
                  onChange={(event) => tableColumn.setFilterValue(event.target.value)}
                  className="h-7 text-xs"
                />

                {/* Checkbox Filter Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 px-2 bg-transparent">
                      <Filter className="h-3 w-3" />
                      {currentFilter?.selectedValues?.length ? (
                        <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                          {currentFilter.selectedValues.length}
                        </Badge>
                      ) : null}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0" align="start">
                    <div className="p-3 border-b">
                      <h4 className="font-medium text-sm">Filter {columnId}</h4>
                    </div>
                    <ScrollArea className="h-64">
                      <div className="p-2 space-y-1">
                        {uniqueValues.map((value) => (
                          <div key={value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${columnId}-${value}`}
                              checked={currentFilter?.selectedValues?.includes(value) ?? false}
                              onCheckedChange={(checked) => {
                                const existingFilter = advancedColumnFilters.find((f) => f.column === columnId)
                                if (existingFilter) {
                                  const updatedFilters = advancedColumnFilters.map((f) => {
                                    if (f.column === columnId) {
                                      const selectedValues = f.selectedValues || []
                                      return {
                                        ...f,
                                        selectedValues: checked
                                          ? [...selectedValues, value]
                                          : selectedValues.filter((v) => v !== value),
                                      }
                                    }
                                    return f
                                  })
                                  setAdvancedColumnFilters(updatedFilters)
                                } else {
                                  setAdvancedColumnFilters([
                                    ...advancedColumnFilters,
                                    {
                                      id: Date.now().toString(),
                                      column: columnId,
                                      type: "checkbox",
                                      selectedValues: [value],
                                    },
                                  ])
                                }
                              }}
                            />
                            <label
                              htmlFor={`${columnId}-${value}`}
                              className="text-xs cursor-pointer flex-1 truncate"
                              title={value}
                            >
                              {value}
                            </label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="p-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-7 text-xs bg-transparent"
                        onClick={() => {
                          setAdvancedColumnFilters(advancedColumnFilters.filter((f) => f.column !== columnId))
                        }}
                      >
                        Clear Filter
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        )
      },
      filterFn: "includesString",
    }))
  }, [columns, advancedColumnFilters, enableColumnFilters, getUniqueColumnValues])

  // Create table instance
  const table = useReactTable({
    data,
    columns: enhancedColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
      globalFilter,
    },
  })

  // Get available columns for filters
  const availableColumns = useMemo(() => {
    return columns
      .map((col) => ({
        id: col.id || (col as any).accessorKey || "",
        label: typeof col.header === "string" ? col.header : col.id || (col as any).accessorKey || "",
      }))
      .filter((col) => col.id)
  }, [columns])

  // Filter management functions
  const addColumnFilter = () => {
    const newFilter: ColumnFilter = {
      id: Date.now().toString(),
      column: "",
      type: "text",
      value: "",
    }
    setAdvancedColumnFilters([...advancedColumnFilters, newFilter])
  }

  const updateColumnFilter = (id: string, updates: Partial<ColumnFilter>) => {
    setAdvancedColumnFilters((filters) =>
      filters.map((filter) => (filter.id === id ? { ...filter, ...updates } : filter)),
    )
  }

  const removeColumnFilter = (id: string) => {
    setAdvancedColumnFilters((filters) => filters.filter((filter) => filter.id !== id))
  }

  const addConditionalFilter = () => {
    const newFilter: ConditionalFilter = {
      id: Date.now().toString(),
      column: "",
      operator: "=",
      value: "",
      logicalOperator: conditionalFilters.length > 0 ? "AND" : undefined,
    }
    setConditionalFilters([...conditionalFilters, newFilter])
  }

  const updateConditionalFilter = (id: string, updates: Partial<ConditionalFilter>) => {
    setConditionalFilters((filters) => filters.map((filter) => (filter.id === id ? { ...filter, ...updates } : filter)))
  }

  const removeConditionalFilter = (id: string) => {
    setConditionalFilters((filters) => filters.filter((filter) => filter.id !== id))
  }

  // Apply advanced filters to table data
  useEffect(() => {
    const applyAdvancedFilters = () => {
      let filteredData = [...data]

      // Apply checkbox filters
      advancedColumnFilters.forEach((filter) => {
        if (filter.type === "checkbox" && filter.selectedValues?.length) {
          filteredData = filteredData.filter((row: any) => {
            const cellValue = String(row[filter.column] || "")
            return filter.selectedValues!.includes(cellValue)
          })
        }
      })

      // Apply range filters
      advancedColumnFilters.forEach((filter) => {
        if (filter.type === "range" && filter.rangeFrom && filter.rangeTo) {
          filteredData = filteredData.filter((row: any) => {
            const cellValue = row[filter.column]
            const numValue = Number(cellValue)
            const fromValue = Number(filter.rangeFrom)
            const toValue = Number(filter.rangeTo)

            if (!isNaN(numValue) && !isNaN(fromValue) && !isNaN(toValue)) {
              return numValue >= fromValue && numValue <= toValue
            }

            // For string comparison
            const strValue = String(cellValue || "")
            return strValue >= filter.rangeFrom! && strValue <= filter.rangeTo!
          })
        }
      })

      // Apply list filters
      advancedColumnFilters.forEach((filter) => {
        if (filter.type === "list" && filter.listValues?.length) {
          filteredData = filteredData.filter((row: any) => {
            const cellValue = String(row[filter.column] || "")
            return filter.listValues!.some((listValue) => cellValue.toLowerCase().includes(listValue.toLowerCase()))
          })
        }
      })

      // Apply date range filter
      if (dateRangeFilter.column && (dateRangeFilter.from || dateRangeFilter.to)) {
        filteredData = filteredData.filter((row: any) => {
          const cellValue = new Date(row[dateRangeFilter.column])
          if (isNaN(cellValue.getTime())) return false

          if (dateRangeFilter.from && cellValue < dateRangeFilter.from) return false
          if (dateRangeFilter.to && cellValue > dateRangeFilter.to) return false

          return true
        })
      }

      // Notify parent of filter changes
      if (onFiltersChange) {
        onFiltersChange({
          columnFilters: advancedColumnFilters,
          conditionalFilters,
          dateRangeFilter,
          globalFilter,
        })
      }
    }

    applyAdvancedFilters()
  }, [advancedColumnFilters, conditionalFilters, dateRangeFilter, globalFilter, data, onFiltersChange])

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (globalFilter) count++
    count += advancedColumnFilters.filter(
      (f) => f.value || f.selectedValues?.length || (f.rangeFrom && f.rangeTo) || f.listValues?.length,
    ).length
    count += conditionalFilters.filter((f) => f.column && f.value).length
    if (dateRangeFilter.column && (dateRangeFilter.from || dateRangeFilter.to)) count++
    return count
  }, [globalFilter, advancedColumnFilters, conditionalFilters, dateRangeFilter])

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            <div className="flex items-center gap-2">
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>
              )}
              {enableExport && onExport && (
                <Button variant="outline" size="sm" onClick={onExport}>
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Global Search */}
          {enableGlobalSearch && (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={globalFilter ?? ""}
                  onChange={(event) => setGlobalFilter(event.target.value)}
                  className="pl-8"
                />
              </div>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">
                  {activeFiltersCount} filter{activeFiltersCount !== 1 ? "s" : ""} active
                </Badge>
              )}
            </div>
          )}

          {/* Advanced Filters */}
          {(enableColumnFilters || enableDateRange || enableConditionalFilters || enableMultiColumnSearch) && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="text-sm font-medium">Advanced Filters</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Search Type:</Label>
                  <Select value={searchType} onValueChange={(value: "range" | "list") => setSearchType(value)}>
                    <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="range">Range</SelectItem>
                      <SelectItem value="list">List</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Tabs defaultValue="column" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  {enableColumnFilters && <TabsTrigger value="column">Column Filters</TabsTrigger>}
                  {enableDateRange && <TabsTrigger value="date">Date Range</TabsTrigger>}
                  {enableConditionalFilters && <TabsTrigger value="conditional">Conditional</TabsTrigger>}
                  {enableMultiColumnSearch && <TabsTrigger value="multi">Multi-Column</TabsTrigger>}
                </TabsList>

                {/* Column Filters Tab */}
                {enableColumnFilters && (
                  <TabsContent value="column" className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Add filters for individual columns</span>
                      <Button onClick={addColumnFilter} size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Filter
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {advancedColumnFilters.map((filter) => (
                        <div key={filter.id} className="flex items-center gap-2 p-2 border rounded-lg">
                          <Select
                            value={filter.column}
                            onValueChange={(value) => updateColumnFilter(filter.id, { column: value })}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue placeholder="Column" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.id} value={col.id}>
                                  {col.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={filter.type}
                            onValueChange={(value: any) => updateColumnFilter(filter.id, { type: value })}
                          >
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="range">Range</SelectItem>
                              <SelectItem value="list">List</SelectItem>
                            </SelectContent>
                          </Select>

                          {filter.type === "text" && (
                            <Input
                              placeholder="Search value..."
                              value={filter.value || ""}
                              onChange={(e) => updateColumnFilter(filter.id, { value: e.target.value })}
                              className="h-8"
                            />
                          )}

                          {filter.type === "range" && searchType === "range" && (
                            <>
                              <Input
                                placeholder="From"
                                value={filter.rangeFrom || ""}
                                onChange={(e) => updateColumnFilter(filter.id, { rangeFrom: e.target.value })}
                                className="h-8 w-24"
                              />
                              <Input
                                placeholder="To"
                                value={filter.rangeTo || ""}
                                onChange={(e) => updateColumnFilter(filter.id, { rangeTo: e.target.value })}
                                className="h-8 w-24"
                              />
                            </>
                          )}

                          {filter.type === "list" && searchType === "list" && (
                            <Input
                              placeholder="Comma separated values..."
                              value={filter.listValues?.join(",") || ""}
                              onChange={(e) =>
                                updateColumnFilter(filter.id, {
                                  listValues: e.target.value
                                    .split(",")
                                    .map((v) => v.trim())
                                    .filter(Boolean),
                                })
                              }
                              className="h-8 flex-1"
                            />
                          )}

                          <Button
                            onClick={() => removeColumnFilter(filter.id)}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                )}

                {/* Date Range Tab */}
                {enableDateRange && (
                  <TabsContent value="date" className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Date Column</Label>
                        <Select
                          value={dateRangeFilter.column}
                          onValueChange={(value) => setDateRangeFilter({ ...dateRangeFilter, column: value })}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableColumns.map((col) => (
                              <SelectItem key={col.id} value={col.id}>
                                {col.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>From Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="h-8 justify-start text-left font-normal bg-transparent"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateRangeFilter.from ? format(dateRangeFilter.from, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={dateRangeFilter.from}
                              onSelect={(date) => setDateRangeFilter({ ...dateRangeFilter, from: date })}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>To Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="h-8 justify-start text-left font-normal bg-transparent"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateRangeFilter.to ? format(dateRangeFilter.to, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={dateRangeFilter.to}
                              onSelect={(date) => setDateRangeFilter({ ...dateRangeFilter, to: date })}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </TabsContent>
                )}

                {/* Conditional Filters Tab */}
                {enableConditionalFilters && (
                  <TabsContent value="conditional" className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Add conditional filters with arithmetic and logical operations
                      </span>
                      <Button onClick={addConditionalFilter} size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Condition
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {conditionalFilters.map((filter) => (
                        <div key={filter.id} className="flex items-center gap-2 p-2 border rounded-lg">
                          {conditionalFilters.indexOf(filter) > 0 && (
                            <Select
                              value={filter.logicalOperator}
                              onValueChange={(value: "AND" | "OR") =>
                                updateConditionalFilter(filter.id, { logicalOperator: value })
                              }
                            >
                              <SelectTrigger className="w-16 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="AND">AND</SelectItem>
                                <SelectItem value="OR">OR</SelectItem>
                              </SelectContent>
                            </Select>
                          )}

                          <Select
                            value={filter.column}
                            onValueChange={(value) => updateConditionalFilter(filter.id, { column: value })}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue placeholder="Column" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.id} value={col.id}>
                                  {col.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={filter.operator}
                            onValueChange={(value: any) => updateConditionalFilter(filter.id, { operator: value })}
                          >
                            <SelectTrigger className="w-20 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="=">=</SelectItem>
                              <SelectItem value="!=">!=</SelectItem>
                              <SelectItem value="gt">&gt;</SelectItem>
                              <SelectItem value="lt">&lt;</SelectItem>
                              <SelectItem value="gte">&gt;=</SelectItem>
                              <SelectItem value="lte">&lt;=</SelectItem>
                              <SelectItem value="LIKE">LIKE</SelectItem>
                              <SelectItem value="NOT LIKE">NOT LIKE</SelectItem>
                              <SelectItem value="IN">IN</SelectItem>
                              <SelectItem value="NOT IN">NOT IN</SelectItem>
                            </SelectContent>
                          </Select>

                          <Input
                            placeholder="Value"
                            value={filter.value}
                            onChange={(e) => updateConditionalFilter(filter.id, { value: e.target.value })}
                            className="h-8 flex-1"
                          />

                          <Button
                            onClick={() => removeConditionalFilter(filter.id)}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                )}

                {/* Multi-Column Tab */}
                {enableMultiColumnSearch && (
                  <TabsContent value="multi" className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      Multi-column search combines all active filters with AND queries. Configure your filters in other
                      tabs to enable multi-column search.
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {advancedColumnFilters.filter(
                        (f) =>
                          f.value || f.selectedValues?.length || (f.rangeFrom && f.rangeTo) || f.listValues?.length,
                      ).length > 0 && (
                        <Badge variant="secondary">
                          {
                            advancedColumnFilters.filter(
                              (f) =>
                                f.value ||
                                f.selectedValues?.length ||
                                (f.rangeFrom && f.rangeTo) ||
                                f.listValues?.length,
                            ).length
                          }{" "}
                          Column Filter(s)
                        </Badge>
                      )}
                      {conditionalFilters.filter((f) => f.column && f.value).length > 0 && (
                        <Badge variant="secondary">
                          {conditionalFilters.filter((f) => f.column && f.value).length} Conditional Filter(s)
                        </Badge>
                      )}
                      {dateRangeFilter.column && (dateRangeFilter.from || dateRangeFilter.to) && (
                        <Badge variant="secondary">Date Range Filter</Badge>
                      )}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="p-2">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="p-2">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="flex items-center space-x-2">
              <p className="text-sm text-muted-foreground">
                Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length,
                )}{" "}
                of {table.getFilteredRowModel().rows.length} entries
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">Rows per page</p>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value))
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {pageSizeOptions.map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0 bg-transparent"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0 bg-transparent"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </div>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0 bg-transparent"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0 bg-transparent"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
