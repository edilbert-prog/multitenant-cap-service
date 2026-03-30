// import type React from "react"
// import { useState, useEffect, useMemo } from "react"
// import { Button } from "../../../ui/button"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/select"
// import { Label } from "../../../ui/label"
// import { Input } from "../../../ui/input"
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../ui/dialog"
// import { Loader2, Search } from "lucide-react"
// import type { Validation } from "../../../types"
// import { toast } from "sonner"
// import { runDatabaseAction } from "../../../API/apiService"
// import type { ColumnDef } from "@tanstack/react-table"
// import TableWithPagination from "../../../ui/tableWithPagination"

// interface ValuePickerDialogProps {
//   isOpen: boolean
//   onClose: () => void
//   selectedTable: string
//   validationData: Validation | null
//   onValueSelected: (value: any, column: string) => void
//   selectedValue: { value: any; column: string } | null
// }

// const ValuePickerDialog: React.FC<ValuePickerDialogProps> = ({
//   isOpen,
//   onClose,
//   selectedTable,
//   validationData,
//   onValueSelected,
//   selectedValue
// }) => {
//   const [isLoading, setIsLoading] = useState(false)
//   const [pickerData, setPickerData] = useState<{ rows: any[]; columns: string[] }>({ rows: [], columns: [] })
//   const [pickerSearch, setPickerSearch] = useState<string>("")
//   const [pickerColumn, setPickerColumn] = useState<string>("")
//   const [pickerPagination, setPickerPagination] = useState<{ currentPage: number; pageSize: number; steps: number[] }>({ 
//     currentPage: 1, 
//     pageSize: 10, 
//     steps: [10, 20, 50] 
//   })
//   const [selectedCell, setSelectedCell] = useState<{ value: any; column: string; rowIndex: number } | null>(null)

//   // Load data when dialog opens
//   useEffect(() => {
//     if (isOpen && selectedTable) {
//       loadPickerData()
//     }
//   }, [isOpen, selectedTable])

//   const loadPickerData = async () => {
//     if (!selectedTable) {
//       toast.error("Please select a primary table first")
//       return
//     }
    
//     setIsLoading(true)
//     try {
//       const response = await runDatabaseAction({
//         payload: {
//           key: "on-submit",
//           mode: "read",
//           name: "S4 Hana",
//           query: "",
//           table: selectedTable,
//           actions: "get_data",
//           columns: [],
//           database: "pipeline",
//           is_pandas: false,
//           is_polars: false,
//           connection: validationData?.database_connection,
//           actions_write: "write_data",
//           response_type: "json",
//         },
//       })
//       const cols: string[] = response.columns || []
//       setPickerData({ rows: response.data || [], columns: cols })
//       setPickerColumn(cols[0] || "")
//     } catch (e: any) {
//       toast.error(`Failed to load picker data: ${e.message}`)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   // Reset selected cell when dialog closes
//   useEffect(() => {
//     if (!isOpen) {
//       setSelectedCell(null)
//       setPickerSearch("")
//     }
//   }, [isOpen])

//   const filteredPickerRows = useMemo(() => {
//     if (!pickerSearch) return pickerData.rows
//     const s = pickerSearch.toLowerCase()
//     return pickerData.rows.filter((r) =>
//       Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(s)),
//     )
//   }, [pickerData.rows, pickerSearch])

//   const paginatedPickerRows = useMemo(() => {
//     const start = (pickerPagination.currentPage - 1) * pickerPagination.pageSize
//     const end = start + pickerPagination.pageSize
//     return filteredPickerRows.slice(start, end)
//   }, [filteredPickerRows, pickerPagination])

//   const pickerColumns = useMemo<ColumnDef<Record<string, any>>[]>(() => {
//     const cols: ColumnDef<Record<string, any>>[] = pickerData.columns.map((c) => ({
//       accessorKey: c,
//       header: c,
//       cell: ({ row, getValue }) => {
//         const value = getValue()
//         const rowIndex = row.index
//         const isSelected = selectedCell?.value === value && selectedCell?.column === c && selectedCell?.rowIndex === rowIndex
        
//         return (
//           <div
//             className={`cursor-pointer p-2 transition-colors ${
//               isSelected 
//                 ? 'bg-blue-100 border border-blue-300' 
//                 : 'hover:bg-gray-100'
//             }`}
//             onClick={() => handleCellSelect(value, c, rowIndex)}
//             title="Click to select this cell value"
//           >
//             {String(value ?? "")}
//           </div>
//         )
//       },
//     }))
//     return cols
//   }, [pickerData.columns, selectedCell])

//   const handleCellSelect = (value: any, columnName: string, rowIndex: number) => {
//     if (value === undefined || value === null) {
//       toast.error("Selected cell has no value")
//       return
//     }
//     setSelectedCell({ value, column: columnName, rowIndex })
//   }

//   const handleUseSelectedValue = () => {
//     if (!selectedCell) {
//       toast.error("No cell selected")
//       return
//     }
    
//     onValueSelected(selectedCell.value, selectedCell.column)
//   }

//   const handleColumnChange = (column: string) => {
//     setPickerColumn(column)
//     setSelectedCell(null) // Clear selection when column changes
//   }

// return (
// <Dialog open={isOpen} onOpenChange={onClose}>
//   <DialogContent className="max-w-7xl h-[95vh]">
//     <DialogHeader>
//       {/* Top bar with title + column + search + selected + button */}
//       <div className="flex flex-wrap items-end justify-between gap-3">
//         {/* Title */}
//         <DialogTitle className="whitespace-nowrap">Select a value</DialogTitle>

//         {/* Column dropdown */}
//         <div className="w-[180px]">
//           <Label>Column</Label>
//           <Select value={pickerColumn} onValueChange={handleColumnChange}>
//             <SelectTrigger className="h-9 w-full">
//               <SelectValue placeholder="Select column" />
//             </SelectTrigger>
//             <SelectContent>
//               {pickerData.columns.map((c) => (
//                 <SelectItem key={c} value={String(c)}>
//                   {String(c)}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </div>

//         {/* Search box (reduced width) */}
//         <div className="w-[220px]">
//           <Label>Search</Label>
//           <div className="relative">
//             <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
//             <Input
//               className="pl-8"
//               placeholder="Search..."
//               value={pickerSearch}
//               onChange={(e) => setPickerSearch(e.target.value)}
//             />
//           </div>
//         </div>

//         {/* Selected value chip */}
//         {selectedCell && (
//           <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm shrink-0">
//             <strong>Selected:</strong> {selectedCell.column} = {String(selectedCell.value)}
//           </div>
//         )}

//         {/* Use button */}
//         <Button
//           onClick={handleUseSelectedValue}
//           disabled={!selectedCell}
//           className="bg-purple-600 hover:bg-purple-700 text-white"
//         >
//           Use Selected Value
//         </Button>
//       </div>
//     </DialogHeader>

//      {/* Data table */}
//         <div className="h-[610px] overflow-y-auto border-gray-300 rounded">
//           {isLoading ? (
//             <div className="flex items-center justify-center h-full">
//               <Loader2 className="h-6 w-6 animate-spin mr-2" />
//               <span>Loading data...</span>
//             </div>
//           ) : (
//             <TableWithPagination
//               data={paginatedPickerRows}
//               columns={pickerColumns}
//               totalRows={filteredPickerRows.length}
//               pagination={{
//                 currentPage: pickerPagination.currentPage,
//                 pageSize: pickerPagination.pageSize,
//                 steps: pickerPagination.steps,
//               }}
//               loading={isLoading}
//               onChangePagination={({ currentPage, limit }) =>
//                 setPickerPagination((p) => ({
//                   ...p,
//                   currentPage: currentPage + 1,
//                   pageSize: limit,
//                 }))
//               }     
//             />
            
//           )}
//         </div>

//   </DialogContent>
// </Dialog>

// )

// }

// export default ValuePickerDialog
import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Button } from "../../../ui/button"
import { Label } from "../../../ui/label"
import { Input } from "../../../ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../ui/dialog"
import { Loader2, Search } from "lucide-react"
import type { Validation } from "../../../types"
import { toast } from "sonner"
import { runDatabaseAction } from "../../../API/apiService"
import type { ColumnDef } from "@tanstack/react-table"
import TableWithPagination from "../../../ui/tableWithPagination"
import { MultiSelectCombobox } from "@/components/ValidationTabView/MultiSelectCombobox"

interface ValuePickerDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedTable: string
  validationData: Validation | null
  onValueSelected: (value: any, column: string) => void
  selectedValue: { value: any; column: string } | null
  primaryKeyField?: string
}

const ValuePickerDialog: React.FC<ValuePickerDialogProps> = ({
  isOpen,
  onClose,
  selectedTable,
  validationData,
  onValueSelected,
  selectedValue,
  primaryKeyField
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [pickerData, setPickerData] = useState<{ rows: any[]; columns: string[] }>({ rows: [], columns: [] })
  const [pickerSearch, setPickerSearch] = useState<string>("")
  const [selectedColumns, setSelectedColumns] = useState<(string | number)[]>([])
  const [pickerPagination, setPickerPagination] = useState<{ currentPage: number; pageSize: number; steps: number[] }>({ 
    currentPage: 1, 
    pageSize: 10, 
    steps: [10, 20, 50] 
  })
  const [selectedCell, setSelectedCell] = useState<{ value: any; column: string; rowIndex: number } | null>(null)
  const [showAllFields, setShowAllFields] = useState<boolean>(false)

  // Load data when dialog opens
  useEffect(() => {
    if (isOpen && selectedTable) {
      loadPickerData()
    }
  }, [isOpen, selectedTable])

  // Initialize selected columns when data loads - restrict to primary key field only
  useEffect(() => {
    if (pickerData.columns.length > 0 && selectedColumns.length === 0) {
      if (!showAllFields && primaryKeyField && pickerData.columns.includes(primaryKeyField)) {
        // Only show the primary key field
        setSelectedColumns([primaryKeyField])
      } else {
        // Show all columns
        setSelectedColumns(pickerData.columns)
      }
    }
  }, [pickerData.columns, primaryKeyField, showAllFields])

  const loadPickerData = async () => {
    if (!selectedTable) {
      toast.error("Please select a primary table first")
      return
    }
    
    setIsLoading(true)
    try {
      const response = await runDatabaseAction({
        payload: {
          actions: "get_data",
          connection: validationData?.database_connection,
          protocol_type: "RFC",
          data: {
            table: selectedTable,
            columns: [],
          },
        },
      })
      const cols: string[] = response.columns || []
      setPickerData({ rows: response.data || [], columns: cols })
      
      // Restrict to primary key field only if not showing all fields
      if (!showAllFields && primaryKeyField && cols.includes(primaryKeyField)) {
        setSelectedColumns([primaryKeyField])
      } else {
        setSelectedColumns(cols) // Show all columns
      }
    } catch (e: any) {
      toast.error(`Failed to load picker data: ${e.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Reset selected cell when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedCell(null)
      setPickerSearch("")
      setSelectedColumns([])
      setShowAllFields(false) // Reset to Primary Key Data mode
    }
  }, [isOpen])

  // Column options for the multi-select combobox
  const columnOptions = useMemo(() => {
    return pickerData.columns.map(col => ({
      value: col,
      label: col
    }))
  }, [pickerData.columns])

  // Filter rows based on search across all columns
  const filteredPickerRows = useMemo(() => {
    if (!pickerSearch.trim()) return pickerData.rows
    const searchTerm = pickerSearch.toLowerCase()
    
    return pickerData.rows.filter((row) =>
      Object.entries(row).some(([key, value]) => {
        // When showing all fields, search across all columns
        // When showing selected fields only, search only in selected columns
        if (showAllFields) {
          return String(value ?? "").toLowerCase().includes(searchTerm)
        } else {
          // Only search in selected columns
          if (!selectedColumns.map(String).includes(key)) return false
          return String(value ?? "").toLowerCase().includes(searchTerm)
        }
      })
    )
  }, [pickerData.rows, pickerSearch, selectedColumns, showAllFields])

  const paginatedPickerRows = useMemo(() => {
    const start = (pickerPagination.currentPage - 1) * pickerPagination.pageSize
    const end = start + pickerPagination.pageSize
    return filteredPickerRows.slice(start, end)
  }, [filteredPickerRows, pickerPagination])

  // Only show selected columns in the table
  const pickerColumns = useMemo<ColumnDef<Record<string, any>>[]>(() => {
    // When showing all fields, show all columns without filtering
    const visibleColumns = showAllFields 
      ? pickerData.columns 
      : pickerData.columns.filter(col => selectedColumns.map(String).includes(col));
    
    const cols: ColumnDef<Record<string, any>>[] = visibleColumns.map((c) => ({
      accessorKey: c,
      header: c,
      cell: ({ row, getValue }) => {
        const value = getValue()
        const rowIndex = row.index
        const isSelected = selectedCell?.value === value && selectedCell?.column === c && selectedCell?.rowIndex === rowIndex
        
        return (
          <div
            className={`cursor-pointer p-2 transition-colors text-left ${
              isSelected 
                ? 'bg-blue-100 border border-blue-300' 
                : 'hover:bg-gray-100'
            }`}
            onClick={() => handleCellSelect(value, c, rowIndex)}
            title="Click to select this cell value"
          >
            {String(value ?? "")}
          </div>
        )
      },
    }))
    return cols
  }, [pickerData.columns, selectedColumns, selectedCell, showAllFields])

  const handleCellSelect = (value: any, columnName: string, rowIndex: number) => {
    if (value === undefined || value === null) {
      toast.error("Selected cell has no value")
      return
    }
    
    // Restrict selection to primary key field when showing all fields
    if (showAllFields && primaryKeyField && columnName !== primaryKeyField) {
      toast.error(`Please select a value from the primary key field: ${primaryKeyField}`)
      return
    }
    
    setSelectedCell({ value, column: columnName, rowIndex })
  }

  const handleUseSelectedValue = () => {
    if (!selectedCell) {
      toast.error("No cell selected")
      return
    }
    
    onValueSelected(selectedCell.value, selectedCell.column)
  }

  const handleColumnSelectionChange = (newSelectedColumns: (string | number)[]) => {
    setSelectedColumns(newSelectedColumns)
    setSelectedCell(null) // Clear selection when columns change
    // Reset pagination to first page when filtering changes
    setPickerPagination(prev => ({ ...prev, currentPage: 1 }))
  }

  const handleToggleShowAllFields = () => {
    setShowAllFields(!showAllFields)
    if (!showAllFields) {
      // Switching to show all fields
      setSelectedColumns(pickerData.columns)
    } else {
      // Switching to show only primary key field
      if (primaryKeyField && pickerData.columns.includes(primaryKeyField)) {
        setSelectedColumns([primaryKeyField])
      }
    }
  }
return (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="max-w-6xl h-[95vh] flex flex-col">
      <DialogHeader className="flex-shrink-0">
        {/* Top bar with search + selected + button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search box */}
          <div className="w-72">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search across selected columns..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Toggle between Primary Key Data and Primary Table Data */}
          <div className="flex items-center gap-2">
            {/* <span className="text-sm font-medium text-gray-700">View:</span> */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setShowAllFields(false)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  !showAllFields 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Primary Key Data
              </button>
              <button
                onClick={() => setShowAllFields(true)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  showAllFields 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Primary Table Data
              </button>
            </div>
          </div>

          {/* Selected value chip */}
          {selectedCell && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
              <strong>Selected:</strong> {selectedCell.column} ={" "}
              {String(selectedCell.value)}
            </div>
          )}

          {/* Use button */}
          <Button
            onClick={handleUseSelectedValue}
            disabled={!selectedCell}
            className="!h-9 text-white bg-purple-600 hover:bg-purple-700"
          >
            Use Selected Value
          </Button>
        </div>
      </DialogHeader>

      {/* Data table with flex-grow to take remaining space */}
      <div className="flex-grow min-h-0 h-[450px] border border-gray-300 rounded overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading data...</span>
          </div>
        ) : (
          <TableWithPagination
            data={paginatedPickerRows}
            columns={pickerColumns}
            totalRows={filteredPickerRows.length}
            pagination={{
              currentPage: pickerPagination.currentPage,
              pageSize: pickerPagination.pageSize,
              steps: pickerPagination.steps,
            }}
            loading={isLoading}
            onChangePagination={({ currentPage, limit }) =>
              setPickerPagination((p) => ({
                ...p,
                currentPage: currentPage + 1,
                pageSize: limit,
              }))
            }
          />
        )}
      </div>
    </DialogContent>
  </Dialog>
)

}

export default ValuePickerDialog