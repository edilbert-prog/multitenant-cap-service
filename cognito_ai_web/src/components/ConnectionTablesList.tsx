import { useState } from 'react';
import { Database, Server, Trash2, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useConnections } from '@/api/validation/hooks';
import { SAPTableSelector } from './SAPTableSelector';
import { apiClient } from '@/api/validation/client';

interface ConnectionTable {
  id: string;
  connectionId: number;
  connectionName: string;
  connectionType: string;
  tableName: string;
  columns: string[];
}

interface ConnectionTablesListProps {
  validationId: number;
  tables: ConnectionTable[];
  onTablesChange: (tables: ConnectionTable[]) => void;
}

export function ConnectionTablesList({
  validationId,
  tables,
  onTablesChange,
}: ConnectionTablesListProps) {
  const { data: connections = [] } = useConnections();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);
  const [showSAPTableSelector, setShowSAPTableSelector] = useState(false);
  const [showMySQLTableSelector, setShowMySQLTableSelector] = useState(false);
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [isLoadingColumns, setIsLoadingColumns] = useState(false);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  const selectedConnection = connections.find(c => c.connection_id === selectedConnectionId);

  const handleConnectionSelect = async (connectionId: string) => {
    const id = parseInt(connectionId);
    setSelectedConnectionId(id);
    setSelectedTable('');

    const conn = connections.find(c => c.connection_id === id);
    if (!conn) return;

    if (conn.source_type === 'sap-bapi' || conn.source_type === 'sap') {
      // For SAP, open the table selector dialog
      setShowSAPTableSelector(true);
    } else {
      // For MySQL/Postgres, fetch table list
      setIsLoadingTables(true);
      try {
        const response = await apiClient.get(`/validation-api/connections/${id}/tables`);
        setAvailableTables(response.data.data || []);
        setShowMySQLTableSelector(true);
      } catch (error) {
        console.error('Failed to fetch tables:', error);
        alert('Failed to fetch tables from connection');
      } finally {
        setIsLoadingTables(false);
      }
    }
  };

  const handleSAPTableSelect = async (tableName: string) => {
    if (!selectedConnectionId || !selectedConnection) return;

    setIsLoadingColumns(true);
    try {
      // Fetch columns for the selected table
      const response = await apiClient.get(
        `/validation-api/connections/${selectedConnectionId}/tables/${tableName}/columns`
      );
      const columns = response.data.data || [];

      // Add the table to the list
      const newTable: ConnectionTable = {
        id: `conn_${selectedConnectionId}_${tableName}`,
        connectionId: selectedConnectionId,
        connectionName: selectedConnection.connection_name,
        connectionType: selectedConnection.source_type,
        tableName,
        columns,
      };

      onTablesChange([...tables, newTable]);

      // Close dialogs
      setShowSAPTableSelector(false);
      setAddDialogOpen(false);
      setSelectedConnectionId(null);
    } catch (error: any) {
      console.error('Failed to fetch columns:', error);
      alert(`Failed to fetch columns: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoadingColumns(false);
    }
  };

  const handleMySQLTableSelect = async () => {
    if (!selectedTable || !selectedConnectionId || !selectedConnection) return;

    setIsLoadingColumns(true);
    try {
      // Fetch columns for the selected table
      const response = await apiClient.get(
        `/validation-api/connections/${selectedConnectionId}/tables/${selectedTable}/columns`
      );
      const columns = response.data.data || [];

      // Add the table to the list
      const newTable: ConnectionTable = {
        id: `conn_${selectedConnectionId}_${selectedTable}`,
        connectionId: selectedConnectionId,
        connectionName: selectedConnection.connection_name,
        connectionType: selectedConnection.source_type,
        tableName: selectedTable,
        columns,
      };

      onTablesChange([...tables, newTable]);

      // Close dialogs
      setShowMySQLTableSelector(false);
      setAddDialogOpen(false);
      setSelectedConnectionId(null);
      setSelectedTable('');
    } catch (error: any) {
      console.error('Failed to fetch columns:', error);
      alert(`Failed to fetch columns: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoadingColumns(false);
    }
  };

  const handleRemoveTable = (tableId: string) => {
    onTablesChange(tables.filter(t => t.id !== tableId));
  };

  const toggleTableExpand = (tableId: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableId)) {
      newExpanded.delete(tableId);
    } else {
      newExpanded.add(tableId);
    }
    setExpandedTables(newExpanded);
  };

  const handleOpenAddDialog = () => {
    setAddDialogOpen(true);
    setSelectedConnectionId(null);
    setSelectedTable('');
    setShowSAPTableSelector(false);
    setShowMySQLTableSelector(false);
  };

  if (tables.length === 0) {
    return (
      <>
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No connection tables added yet</p>
          <p className="text-sm mt-1 mb-3">Add tables from existing connections (SAP, MySQL, Postgres)</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenAddDialog}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Connection Table
          </Button>
        </div>

        {/* Add Connection Table Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Table from Connection</DialogTitle>
              <DialogDescription>
                Select a connection and table to add to this validation
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Connection</Label>
                <Select value={selectedConnectionId?.toString()} onValueChange={handleConnectionSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a connection..." />
                  </SelectTrigger>
                  <SelectContent>
                    {connections.map((conn) => (
                      <SelectItem key={conn.connection_id} value={conn.connection_id.toString()}>
                        <div className="flex items-center gap-2">
                          {conn.source_type === 'sap-bapi' || conn.source_type === 'sap' ? (
                            <Server className="h-4 w-4" />
                          ) : (
                            <Database className="h-4 w-4" />
                          )}
                          {conn.connection_name} ({conn.source_type})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* SAP Table Selector */}
        {selectedConnectionId && showSAPTableSelector && (
          <SAPTableSelector
            open={showSAPTableSelector}
            connectionId={selectedConnectionId}
            connectionName={selectedConnection?.connection_name || ''}
            onClose={() => {
              setShowSAPTableSelector(false);
              setAddDialogOpen(true);
            }}
            onSelect={handleSAPTableSelect}
          />
        )}

        {/* MySQL/Postgres Table Selector */}
        <Dialog open={showMySQLTableSelector} onOpenChange={setShowMySQLTableSelector}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Table</DialogTitle>
              <DialogDescription>
                Choose a table from {selectedConnection?.connection_name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Table</Label>
                <Select value={selectedTable} onValueChange={setSelectedTable} disabled={isLoadingTables}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingTables ? "Loading tables..." : "Select a table..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTables.map((table) => (
                      <SelectItem key={table} value={table}>
                        {table}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMySQLTableSelector(false)}>
                Cancel
              </Button>
              <Button onClick={handleMySQLTableSelect} disabled={!selectedTable || isLoadingColumns}>
                {isLoadingColumns ? 'Adding...' : 'Add Table'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-end mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenAddDialog}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Connection Table
        </Button>
      </div>

      <div className="space-y-3">
        {tables.map((table) => (
          <Card key={table.id} className="p-4">
            <div className="flex items-start gap-3">
              {table.connectionType === 'sap-bapi' || table.connectionType === 'sap' ? (
                <Server className="h-5 w-5 text-orange-500 mt-1 shrink-0" />
              ) : (
                <Database className="h-5 w-5 text-blue-500 mt-1 shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{table.tableName}</h4>
                    <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{table.connectionName}</span>
                      <span>{table.columns.length} columns</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0 capitalize">
                    {table.connectionType}
                  </Badge>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleTableExpand(table.id)}
                  >
                    {expandedTables.has(table.id) ? (
                      <>
                        <ChevronDown className="h-3.5 w-3.5 mr-1" />
                        Hide Columns
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-3.5 w-3.5 mr-1" />
                        Show Columns
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveTable(table.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Remove
                  </Button>
                </div>

                {expandedTables.has(table.id) && table.columns.length > 0 && (
                  <div className="mt-4 p-2 bg-muted rounded-md">
                    <div className="flex flex-wrap gap-1">
                      {table.columns.map((column, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {column}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Dialogs same as above */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Table from Connection</DialogTitle>
            <DialogDescription>
              Select a connection and table to add to this validation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Connection</Label>
              <Select value={selectedConnectionId?.toString()} onValueChange={handleConnectionSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a connection..." />
                </SelectTrigger>
                <SelectContent>
                  {connections.map((conn) => (
                    <SelectItem key={conn.connection_id} value={conn.connection_id.toString()}>
                      <div className="flex items-center gap-2">
                        {conn.source_type === 'sap-bapi' || conn.source_type === 'sap' ? (
                          <Server className="h-4 w-4" />
                        ) : (
                          <Database className="h-4 w-4" />
                        )}
                        {conn.connection_name} ({conn.source_type})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedConnectionId && showSAPTableSelector && (
        <SAPTableSelector
          open={showSAPTableSelector}
          connectionId={selectedConnectionId}
          connectionName={selectedConnection?.connection_name || ''}
          onClose={() => {
            setShowSAPTableSelector(false);
            setAddDialogOpen(true);
          }}
          onSelect={handleSAPTableSelect}
        />
      )}

      <Dialog open={showMySQLTableSelector} onOpenChange={setShowMySQLTableSelector}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Table</DialogTitle>
            <DialogDescription>
              Choose a table from {selectedConnection?.connection_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Table</Label>
              <Select value={selectedTable} onValueChange={setSelectedTable} disabled={isLoadingTables}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingTables ? "Loading tables..." : "Select a table..."} />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.map((table) => (
                    <SelectItem key={table} value={table}>
                      {table}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMySQLTableSelector(false)}>
              Cancel
            </Button>
            <Button onClick={handleMySQLTableSelect} disabled={!selectedTable || isLoadingColumns}>
              {isLoadingColumns ? 'Adding...' : 'Add Table'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
