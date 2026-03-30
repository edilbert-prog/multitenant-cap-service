import React, { useState, useMemo } from "react"
import { Sheet, SheetContent, SheetTitle } from "../ui/sheet"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { ArrowLeft, Check, Loader2, PlayCircle, Plus, Search, X, Trash2 } from "lucide-react"
import DropdownV2 from "../../../utils/DropdownV2"
import CustomTableData from "../../../utils/CustomTableData"
import SearchBar from "../../../utils/SearchBar"
import type { FormFieldOption } from "../types"
import { ColumnDef } from "@tanstack/react-table"

// ClickableCellRenderer component
const ClickableCellRenderer = ({ value, onClick, isSelected }: any) => (
  <div
    className={`cursor-pointer p-2 rounded transition-colors flex items-center justify-center text-left ${isSelected ? "" : ""}`}
    style={isSelected ? { backgroundColor: '#E6F2FF', borderColor: '#0071E9', color: '#005ABA', border: '1px solid' } : {}}
    onMouseEnter={(e) => {
      if (!isSelected) {
        e.currentTarget.style.backgroundColor = '#E6F2FF'
        e.currentTarget.style.borderColor = '#0071E9'
        e.currentTarget.style.color = '#005ABA'
        e.currentTarget.style.border = '1px solid'
      }
    }}
    onMouseLeave={(e) => {
      if (!isSelected) {
        e.currentTarget.style.backgroundColor = ''
        e.currentTarget.style.borderColor = ''
        e.currentTarget.style.color = ''
        e.currentTarget.style.border = ''
      }
    }}
    onClick={onClick}
    title="Click to select this value"
  >
    <span className="flex-grow text-left">{value}</span>
    {isSelected && <Check className="h-4 w-4 ml-2 flex-shrink-0" style={{ color: '#005ABA' }} />}
  </div>
)

interface ExecutionSheetProps {
  // Sheet state
  isViewModalOpen: boolean
  setIsViewModalOpen: (open: boolean) => void
  
  // Connection parameters
  modalSystemNumber: string
  modalClientId: string
  modalConnection: string
  modalSystemNumbers: FormFieldOption[]
  modalClientIds: FormFieldOption[]
  modalConnections: FormFieldOption[]
  
  // Connection handlers
  handleModalSystemNumberChange: (value: string) => void
  handleModalClientIdChange: (value: string) => void
  setModalConnection: (value: string) => void
  setDatabaseConnection: (connection: string) => void
  
  // Filter rules
  inlineFilterRules: any[]
  setInlineFilterRules: (rules: any[]) => void
  primaryKeyFieldOptions: FormFieldOption[]
  operatorOptions: FormFieldOption[]
  
  // Table data
  activeViewData: any
  filteredTableData: any[]
  tableColumns: ColumnDef<any>[]
  tableSearchQuery: string
  setTableSearchQuery: (query: string) => void
  
  // Selection
  selectedCell: any
  storeSelectedValues: Array<{field: string, value: string}>
  
  // Actions
  handleModalReExecute: () => void
  handleUseGridValue: () => void
  handleCellClick: (rowIndex: number, colId: string, value: any, rowData: any) => void
  
  // State
  isModalReExecuting: boolean
  mode: "add" | "edit" | "view" | "execute"
}

export const ExecutionSheet: React.FC<ExecutionSheetProps> = ({
  isViewModalOpen,
  setIsViewModalOpen,
  modalSystemNumber,
  modalClientId,
  modalConnection,
  modalSystemNumbers,
  modalClientIds,
  modalConnections,
  handleModalSystemNumberChange,
  handleModalClientIdChange,
  setModalConnection,
  setDatabaseConnection,
  inlineFilterRules,
  setInlineFilterRules,
  primaryKeyFieldOptions,
  operatorOptions,
  activeViewData,
  filteredTableData,
  tableColumns,
  tableSearchQuery,
  setTableSearchQuery,
  selectedCell,
  storeSelectedValues,
  handleModalReExecute,
  handleUseGridValue,
  handleCellClick,
  isModalReExecuting,
  mode,
}) => {
  const [isExecuteClicked, setIsExecuteClicked] = useState(false)
  const [isUseValueClicked, setIsUseValueClicked] = useState(false)
  const [showBuildFilters, setShowBuildFilters] = useState(false)
  const [isBuildFiltersClicked, setIsBuildFiltersClicked] = useState(false)

  const handleExecuteClick = () => {
    setIsExecuteClicked(true)
    handleModalReExecute()
  }

  // Transform table columns for CustomTableData
  const customTableColumns = useMemo(() => {
    return tableColumns.map((col, index) => ({
      key: (col as any).accessorKey || `col-${index}`,
      header: (col as any).header || `Column ${index + 1}`,
      sortable: true,
      filterable: true,
    }))
  }, [tableColumns])

  // Transform table data to include clickable cells with custom rendering
  const transformedTableData = useMemo(() => {
    return filteredTableData.map((row, rowIndex) => {
      const transformedRow: any = { id: `row-${rowIndex}` }
      
      tableColumns.forEach((col, colIndex) => {
        const accessorKey = (col as any).accessorKey || `col-${colIndex}`
        const cellValue = row[accessorKey]
        const colId = accessorKey
        
        // Create clickable cell renderer
        const isCellSelected = selectedCell?.rowIndex === rowIndex && selectedCell?.colId === colId
        
        transformedRow[accessorKey] = (
          <ClickableCellRenderer
            value={cellValue}
            onClick={() => handleCellClick(rowIndex, colId, cellValue, row)}
            isSelected={isCellSelected}
          />
        )
      })
      
      return transformedRow
    })
  }, [filteredTableData, tableColumns, selectedCell, handleCellClick])

  const handleUseValueClick = () => {
    setIsUseValueClicked(true)
    handleUseGridValue()
  }

  return (
    <Sheet open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
      <SheetContent
        side="right"
        className="w-[95vw] max-w-[1400px] min-w-[800px] sm:max-w-[1400px] p-2 rounded-l-xl flex flex-col"
      >        
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setIsViewModalOpen(false)}>
              <ArrowLeft />
            </Button>
            <SheetTitle className="text-base font-semibold p-2">Execution Results</SheetTitle>
          </div>
          
          {/* Connection parameters in the middle */}
          <div className="flex items-center gap-2 flex-1 justify-center">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-700">System Number</span>
              <div className="min-w-[160px]">
                <DropdownV2
                  options={modalSystemNumbers.map(opt => ({ label: opt.label, value: String(opt.value) }))}
                  value={modalSystemNumber}
                  onChange={(v) => handleModalSystemNumberChange((v as string) || "")}
                  placeholder="Select..."
                  Disabled={isModalReExecuting}
                  searchable={true}
                  size="small"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-700">Client ID</span>
              <div className="min-w-[160px]">
                <DropdownV2
                  options={modalClientIds.map(opt => ({ label: opt.label, value: String(opt.value) }))}
                  value={modalClientId}
                  onChange={(v) => handleModalClientIdChange((v as string) || "")}
                  placeholder="Select..."
                  Disabled={!modalSystemNumber || isModalReExecuting}
                  searchable={true}
                  size="small"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-700">Connection</span>
              <div className="min-w-[160px]">
                <DropdownV2
                  options={modalConnections.map(opt => ({ label: opt.label, value: String(opt.value) }))}
                  value={modalConnection}
                  onChange={(v) => {
                    const connectionValue = (v as string) || ""
                    setModalConnection(connectionValue)
                    setDatabaseConnection(connectionValue)
                  }}
                  placeholder="Select..."
                  Disabled={!modalClientId || isModalReExecuting}
                  searchable={true}
                  size="small"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Build Filters button */}
            <Button
              onClick={() => {
                setIsBuildFiltersClicked(true)
                const isOpening = !showBuildFilters
                if (isOpening && inlineFilterRules.length === 0) {
                  // Add initial filter rule when opening
                  setInlineFilterRules([
                    { id: crypto.randomUUID(), field: "", operator: "", value: "" }
                  ])
                }
                setShowBuildFilters(!showBuildFilters)
              }}
              variant={isBuildFiltersClicked ? "default" : "outline"}
              className={`!h-9 flex-shrink-0 text-xs px-2 ${
                !isBuildFiltersClicked
                  ? "bg-white"
                  : ""
              }`}
            >
              Build Filters
            </Button>
            
            {/* Execute button */}
            <Button
              onClick={handleExecuteClick}
              disabled={!modalConnection || isModalReExecuting}
              variant={isExecuteClicked ? "default" : "outline"}
              className={`!h-9 flex-shrink-0 text-xs px-2 ${
                !isExecuteClicked
                  ? "bg-white"
                  : ""
              }`}
            >
              {isModalReExecuting ? (
                <>
                  <Loader2 className="animate-spin mr-1 h-3 w-3" />
                  Executing...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-1 h-3 w-3" />
                  Execute
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Build Filters Section - Collapsible */}
        {showBuildFilters && (
          <div className="grid grid-cols-2 gap-2">
            {inlineFilterRules.map((rule, index) => (
              <div key={rule.id} className="flex gap-1 items-center">
                <DropdownV2
                  options={primaryKeyFieldOptions.map(opt => ({ label: opt.label, value: String(opt.value) }))}
                  value={rule.field}
                  onChange={(v) => {
                    const newRules = [...inlineFilterRules]
                    newRules[index] = { ...rule, field: (v as string) || "" }
                    setInlineFilterRules(newRules)
                  }}
                  placeholder="Select field"
                  Disabled={isModalReExecuting}
                  searchable={true}
                  size="small"
                />
                <DropdownV2
                  options={operatorOptions.map(opt => ({ label: opt.label, value: String(opt.value) }))}
                  value={rule.operator}
                  onChange={(v) => {
                    const newRules = [...inlineFilterRules]
                    newRules[index] = { ...rule, operator: (v as string) || "" }
                    setInlineFilterRules(newRules)
                  }}
                  placeholder="Select operator"
                  Disabled={isModalReExecuting}
                  searchable={true}
                  size="small"
                />
                <div className="min-w-[140px]">
                  <Input
                    value={rule.value}
                    onChange={(e) => {
                      const newRules = [...inlineFilterRules]
                      newRules[index] = { ...rule, value: e.target.value }
                      setInlineFilterRules(newRules)
                    }}
                    placeholder="Value"
                    className="h-10 text-sm"
                    disabled={isModalReExecuting}
                  />
                </div>
                <div className="flex gap-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newRules = [...inlineFilterRules]
                      newRules.splice(index + 1, 0, { id: crypto.randomUUID(), field: "", operator: "", value: "" })
                      setInlineFilterRules(newRules)
                    }}
                    disabled={isModalReExecuting}
                    className="h-7 w-7 p-0"
                    title="Add filter"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setInlineFilterRules(inlineFilterRules.filter((_, i) => i !== index))
                    }}
                    disabled={isModalReExecuting}
                    className="h-7 w-7 p-0"
                    title="Remove filter"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search bar with buttons */}
        {activeViewData && (
          <div className="flex items-center justify-end gap-2">
            <div className="w-96">
              <SearchBar
                currentValue={tableSearchQuery}
                onSearch={setTableSearchQuery}
                size="medium"
              />
            </div>
            
            {/* Display currently selected cell */}
            {selectedCell && (
              <div className="!h-9 px-2 flex items-center rounded-full text-xs font-medium whitespace-nowrap max-w-[200px] truncate" style={{ backgroundColor: '#E6F2FF', borderColor: '#0071E9', color: '#005ABA', border: '1px solid' }}>
                Selected: {selectedCell.colId} = {String(selectedCell.value)}
              </div>
            )}
            
            <Button
              onClick={handleUseValueClick}
              disabled={!selectedCell || mode === "view" || mode === "execute"}
              variant={isUseValueClicked ? "default" : "outline"}
              className={`!h-9 flex-shrink-0 text-xs px-2 ${
                !isUseValueClicked
                  ? "bg-white"
                  : ""
              }`}
            >
              Use Selected Value
            </Button>
          </div>
        )}

        {/* Data table */}
        <div className="flex-grow min-h-[250px] border border-gray-300 rounded">
          {activeViewData ? (
            <CustomTableData
              data={transformedTableData}
              columns={customTableColumns}
              rowKey="id"
              scrollHeightClass="max-h-[400px]"
              emptyState={<div className="p-8 text-center text-slate-500">No data available.</div>}
              showSpinnerFlag={false}
              spinnerLabel="Loading..."
              HorizontalScroll={false}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p className="text-sm">Select connection parameters and click Execute to view data</p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
