import React, { useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog"
import { Loader2 } from "lucide-react"
import TableWithPagination from "../../ui/tableWithPagination"
import type { ColumnDef } from "@tanstack/react-table"

interface ViewDataModalProps {
  isOpen: boolean
  onClose: () => void
  tableName: string
  tableData: any[]
  isLoading: boolean
}

const ViewDataModal: React.FC<ViewDataModalProps> = ({
  isOpen,
  onClose,
  tableName,
  tableData,
  isLoading,
}) => {
  // Generate column definitions from the first row of data
  const columns = useMemo<ColumnDef<any>[]>(() => {
    if (!tableData || tableData.length === 0) return []

    const firstRow = tableData[0]
    return Object.keys(firstRow).map((key) => ({
      accessorKey: key,
      header: key,
      cell: ({ row }) => {
        const value = row.original[key]
        return <span className="text-sm">{value !== null && value !== undefined ? String(value) : ""}</span>
      },
    }))
  }, [tableData])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Table Data: {tableName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">Loading table data...</span>
          </div>
        ) : tableData && tableData.length > 0 ? (
          <div className="flex-1 overflow-hidden">
            <TableWithPagination
              data={tableData}
              columns={columns}
              totalRows={tableData.length}
              loading={false}
              pagination={{
                currentPage: 0,
                pageSize: 20,
                steps: [10, 20, 50, 100],
              }}
              onChangePagination={() => {}}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-[60vh] text-gray-500">
            No data available for this table
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ViewDataModal
