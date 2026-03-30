import type React from "react"
import { Card, CardContent } from "../../ui/card"
import { Label } from "../../ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table"

interface ExistingConnectionsCardProps {
  savedConnectionData?: {
    source_application?: string
    system_number?: string
    system_number_label?: string
    client_id?: string
    client_id_label?: string
    database_connection?: string
    database_connection_label?: string
  }
  connectionsList?: Array<{label: string, value: number}>
}

const ExistingConnectionsCard: React.FC<ExistingConnectionsCardProps> = ({
  savedConnectionData,
  connectionsList = [],
}) => {
  // Helper function to get connection name by ID
  const getConnectionName = (connectionId: string) => {
    if (!connectionId) return 'Not Selected'
    const conn = connectionsList.find(c => String(c.value) === connectionId)
    return conn ? conn.label : savedConnectionData?.database_connection_label || `Connection ${connectionId}`
  }
  
  // Build saved connection row data
  const savedConnectionRow = savedConnectionData && (
    savedConnectionData.source_application || 
    savedConnectionData.system_number || 
    savedConnectionData.client_id || 
    savedConnectionData.database_connection
  ) ? {
    application: savedConnectionData.source_application || '-',
    systemNumber: savedConnectionData.system_number || savedConnectionData.system_number_label || '-',
    clientId: savedConnectionData.client_id || savedConnectionData.client_id_label || '-',
    connection: savedConnectionData.database_connection || '-',
  } : null

  return (
    <Card className="p-2">
      <CardContent className="p-2">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Existing SAP Connections</Label>

          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-300">
                  <TableHead className="text-gray-900 font-semibold border-r border-gray-300 last:border-r-0">Source Application</TableHead>
                  <TableHead className="text-gray-900 font-semibold border-r border-gray-300 last:border-r-0">System Number</TableHead>
                  <TableHead className="text-gray-900 font-semibold border-r border-gray-300 last:border-r-0">Client ID</TableHead>
                  <TableHead className="text-gray-900 font-semibold border-r border-gray-300 last:border-r-0">Connection</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Show saved connection data if available */}
                {savedConnectionRow ? (
                  <TableRow className="hover:bg-gray-50 border-b border-gray-300">
                    <TableCell className="font-medium text-gray-900 border-r border-gray-300 last:border-r-0">{savedConnectionRow.application}</TableCell>
                    <TableCell className="text-gray-700 border-r border-gray-300 last:border-r-0">{savedConnectionRow.systemNumber}</TableCell>
                    <TableCell className="text-gray-700 border-r border-gray-300 last:border-r-0">{savedConnectionRow.clientId}</TableCell>
                    <TableCell className="text-gray-700 border-r border-gray-300 last:border-r-0">{getConnectionName(savedConnectionRow.connection)}</TableCell>
                  </TableRow>
                ) : (
                  <TableRow className="border-b border-gray-300">
                    <TableCell colSpan={4} className="text-center text-gray-500 py-8 border-r border-gray-300 last:border-r-0">
                      No saved connection data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ExistingConnectionsCard
