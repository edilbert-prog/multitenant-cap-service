"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { ScrollArea } from "../ui/scroll-area"
import { Search, Plus, Play } from "lucide-react"
import type { TableData, FieldData } from "../types"

interface Column {
  name: string
  type: string
  sampleData: string[]
}

interface AppliedOperation {
  id: string
  operation_name: string
  parameters: Record<string, any>
  output_target: { mode: "inplace" | "new_column"; column_name?: string }
}

interface TableFieldOperationInterfaceProps {
  tableData: TableData[]
  onFieldSelect: (tableName: string, fieldName: string) => void
  onOperationComplete?: (result: any) => void
  tableFieldData?: any[]
}

export const TableFieldOperationInterface: React.FC<TableFieldOperationInterfaceProps> = ({
  tableData,
  onFieldSelect,
  onOperationComplete,
  tableFieldData = [],
}) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedColumn, setSelectedColumn] = useState<Column | null>(null)
  const [selectedRowIndex, setSelectedRowIndex] = useState(0)
  const [appliedOperations, setAppliedOperations] = useState<AppliedOperation[]>([])
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null)
  const [sampleOutput, setSampleOutput] = useState("")

  // Generate columns from table data
  const allColumns: Column[] = tableData.flatMap((table) =>
    table.Fields.map((field: FieldData) => ({
      name: field.FieldName,
      type: field.DataType || "string",
      sampleData: generateSampleData(field.FieldName, field.DataType),
    })),
  )

  const filteredColumns = allColumns.filter((col) => col.name.toLowerCase().includes(searchTerm.toLowerCase()))

  function generateSampleData(fieldName: string, dataType?: string): string[] {
    // Use actual table field data if available
    if (tableFieldData.length > 0) {
      return tableFieldData
        .map((row) => row[fieldName] || "")
        .filter(Boolean)
        .slice(0, 3)
    }

    // Generate sample data based on field name and type
    if (fieldName.includes("id")) {
      return ["9558-5544321", "9558-5544322", "9558-5544323"]
    }
    if (fieldName.includes("number")) {
      return ["ORD-110015", "ORD-110016", "ORD-110017"]
    }
    if (fieldName.includes("material")) {
      return ["51000-74001", "51000-74002", "51000-74003"]
    }
    if (fieldName.includes("quantity")) {
      return ["10", "25", "15"]
    }
    if (fieldName.includes("price")) {
      return ["5325", "4200", "3850"]
    }
    return ["Sample Value 1", "Sample Value 2", "Sample Value 3"]
  }

  const handleColumnSelect = (column: Column) => {
    setSelectedColumn(column)
    setSelectedRowIndex(0)
    setSelection(null)
    setSampleOutput(column.name)

    // Find the table and field for this column
    for (const table of tableData) {
      const field = table.Fields.find((f: FieldData) => f.FieldName === column.name)
      if (field) {
        onFieldSelect(table.TableName, field.FieldName)
        break
      }
    }
  }

  const handleTextSelection = () => {
    const domSelection = window.getSelection()
    if (domSelection && domSelection.rangeCount > 0 && domSelection.toString().length > 0) {
      const range = domSelection.getRangeAt(0)
      const container = document.getElementById("selectable-input-string")

      if (container && container.contains(range.startContainer) && container.firstChild === range.startContainer) {
        const start = Math.min(domSelection.anchorOffset, domSelection.focusOffset)
        const end = Math.max(domSelection.anchorOffset, domSelection.focusOffset)

        if (start !== end) {
          setSelection({ start, end })
        }
      }
    }
  }

  const handleAddOperation = () => {
    const newOperation: AppliedOperation = {
      id: `op-${Date.now()}`,
      operation_name: "concat",
      parameters: {},
      output_target: { mode: "inplace" },
    }
    setAppliedOperations([...appliedOperations, newOperation])
  }

  const handleExecute = () => {
    if (selectedColumn && onOperationComplete) {
      const operationResult = {
        source: {
          targetColumn: selectedColumn.name,
          operations: appliedOperations.map((op) => ({
            id: op.id,
            operation_name: op.operation_name,
            parameters: {
              sources: [
                {
                  id: `concat-part-${Date.now()}`,
                  type: "column" as const,
                  value: "",
                  column_config: {
                    source_mode: "full" as const,
                    column_id: selectedColumn.name,
                  },
                },
              ],
            },
            output_target: op.output_target,
          })),
          generated_columns: [],
        },
      }

      console.log(`[v0] Generated operation result:`, operationResult)
      onOperationComplete(operationResult)
      setSampleOutput(selectedColumn.name)
    }
  }

  return (
    <div className="grid grid-cols-3 gap-4 h-[600px]">
      {/* Left Panel - Select Column */}
      <Card className="flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Select Column</CardTitle>
          <Badge variant="secondary" className="w-fit">
            string
          </Badge>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {filteredColumns.map((column) => (
                <div
                  key={column.name}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedColumn?.name === column.name
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                  onClick={() => handleColumnSelect(column)}
                >
                  <div className="font-medium">{column.name}</div>
                  <div className="text-sm text-muted-foreground">{column.type}</div>
                  <div className="text-xs text-muted-foreground mt-1">{column.sampleData[0]}</div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="border-t pt-3">
            <div className="text-sm font-medium mb-2">Preview Data</div>
            {selectedColumn && (
              <div className="space-y-1">
                {selectedColumn.sampleData.slice(0, 2).map((data, index) => (
                  <div key={index} className="text-xs">
                    <span className="font-medium">Row {index + 1}:</span> {data}
                  </div>
                ))}
                <div className="text-xs text-muted-foreground mt-2">
                  Sample rows: {selectedColumn.sampleData.length} Type: {selectedColumn.type}
                </div>
              </div>
            )}
          </div>

          <Button variant="outline" className="w-full border-dashed bg-transparent">
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Column
          </Button>
        </CardContent>
      </Card>

      {/* Center Panel - Operation Chain */}
      <Card className="flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Operation Chain</CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleAddOperation} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Operation
              </Button>
              <Button onClick={handleExecute} size="sm">
                <Play className="h-4 w-4 mr-1" />
                Execute
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4">
          {!selectedColumn ? (
            <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
              Configure your operations and click 'Execute' to see the results.
            </div>
          ) : (
            <>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Selected Column:</span>
                  <Badge variant="outline">{selectedColumn.name}</Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-2">Select text below to capture range:</div>
                <div
                  id="selectable-input-string"
                  onMouseUp={handleTextSelection}
                  className="font-mono p-2 bg-background rounded-md cursor-text select-text border"
                >
                  {selectedColumn.sampleData[selectedRowIndex]}
                </div>
                {selection && (
                  <div className="text-xs text-primary font-semibold mt-1">
                    Selected Range: {selection.start} - {selection.end}
                  </div>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Sample row:</label>
                  <select
                    value={selectedRowIndex}
                    onChange={(e) => setSelectedRowIndex(Number(e.target.value))}
                    className="text-xs bg-background border rounded px-2 py-1"
                  >
                    {selectedColumn.sampleData.map((_, index) => (
                      <option key={index} value={index}>
                        Row {index + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Operation Selection */}
              <div className="space-y-3">
                <div className="text-sm font-medium">Select Operation</div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">concat()</span>
                    <Button variant="ghost" size="sm">
                      ×
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    Joins multiple strings or column values to the end of this current string.
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">sources</div>
                    <div className="text-xs text-muted-foreground">
                      A list of strings or column values to join together.
                    </div>
                    <Button variant="outline" className="w-full border-dashed bg-transparent">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Part to Concatenate
                    </Button>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="text-sm font-medium">Output Target</div>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input type="radio" name="output" value="inplace" defaultChecked />
                        <span className="text-sm">Modify in-place</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="radio" name="output" value="new" />
                        <span className="text-sm">Create new column</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Right Panel - Sample Output */}
      <Card className="flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Sample Output</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-mono mb-2">{sampleOutput}</div>
            <div className="text-sm text-muted-foreground">
              Configure your operations and click 'Execute' to see the results.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
