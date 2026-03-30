/**
 * Add SAP Table Dialog
 * Dialog for adding a global SAP table datasource
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle2, Info, Search, Database, Check } from 'lucide-react';
import { apiClient } from '@/api/validation/client';
import { useConnections, useCreateSAPDatasource, useSyncSAPDatasource } from '@/api/validation/hooks';

interface AddSAPTableDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AddSAPTableDialog({ open, onClose }: AddSAPTableDialogProps) {
  const { data: connections = [] } = useConnections();
  const createMutation = useCreateSAPDatasource();
  const syncMutation = useSyncSAPDatasource();

  const [connectionId, setConnectionId] = useState<string>('');
  const [tableName, setTableName] = useState('');
  const [selectedTableMetadata, setSelectedTableMetadata] = useState<any>(null);
  const [datasourceName, setDatasourceName] = useState('');
  const [createdDatasourceId, setCreatedDatasourceId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [stage, setStage] = useState<'form' | 'creating' | 'syncing' | 'complete'>('form');

  // Table search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Filter for SAP connections (flexible matching for different naming conventions)
  const sapConnections = connections.filter(c => {
    const sourceType = (c.source_type || '').toLowerCase();
    return sourceType.includes('sap') || sourceType === 'sap-bapi';
  });

  // Debounced search for SAP tables
  useEffect(() => {
    if (!connectionId || !searchTerm) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await apiClient.get(
          `/validation-api/connections/${connectionId}/tables/search`,
          { params: { q: searchTerm } }
        );
        setSearchResults(response.data.data || []);
      } catch (err) {
        console.error('Failed to search SAP tables:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, connectionId]);

  const handleTableSelect = (selectedTable: any) => {
    setTableName(selectedTable.tableName);
    setSelectedTableMetadata(selectedTable);
    setSearchTerm(''); // Clear search after selection
    setSearchResults([]); // Clear results after selection

    // Auto-generate datasource name with table metadata to distinguish duplicates
    const connName = sapConnections.find(c => c.connection_id.toString() === connectionId)?.connection_name || 'SAP';

    // Build descriptive name: "MARA - Material Master (QAS)" or "MARA - SD Module (QAS)"
    let nameParts = [selectedTable.tableName];

    if (selectedTable.description) {
      // Use description if available (most descriptive)
      const shortDesc = selectedTable.description.substring(0, 50); // Limit length
      nameParts.push(shortDesc);
    } else if (selectedTable.module) {
      // Fallback to module if no description
      nameParts.push(selectedTable.module);
    }

    nameParts.push(`(${connName})`);
    setDatasourceName(nameParts.join(' - ').replace(' - (', ' ('));
  };

  const handleSubmit = async () => {
    setError('');

    if (!connectionId || !tableName || !datasourceName) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      // Step 1: Create datasource (metadata only)
      setStage('creating');
      const datasource = await createMutation.mutateAsync({
        name: datasourceName,
        source_type: 'sap-bapi',
        connection_id: connectionId,
        table_name: tableName,
      });

      setCreatedDatasourceId(datasource.id);

      // Step 2: Trigger sync (async operation)
      setStage('syncing');
      await syncMutation.mutateAsync(datasource.id);

      setStage('complete');

      // Close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to add SAP table');
      setStage('form');
    }
  };

  const handleClose = () => {
    setConnectionId('');
    setTableName('');
    setSelectedTableMetadata(null);
    setDatasourceName('');
    setCreatedDatasourceId(null);
    setError('');
    setStage('form');
    setSearchTerm('');
    setSearchResults([]);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add SAP Table</DialogTitle>
            <DialogDescription>
              Add a global SAP table that can be reused across all validations
            </DialogDescription>
          </DialogHeader>

          {stage === 'form' && (
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>SAP Connection *</Label>
                {sapConnections.length > 0 ? (
                  <>
                    <Select value={connectionId} onValueChange={setConnectionId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select SAP connection" />
                      </SelectTrigger>
                      <SelectContent>
                        {sapConnections.map((conn) => (
                          <SelectItem key={conn.connection_id} value={conn.connection_id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{conn.connection_name}</span>
                              {conn.description && (
                                <span className="text-xs text-muted-foreground">{conn.description}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {sapConnections.length} SAP connection{sapConnections.length > 1 ? 's' : ''} available from ConnectionsMaster
                    </p>
                  </>
                ) : (
                  <Alert>
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">No SAP connections found</p>
                        <p className="text-sm">
                          {connections.length > 0 ? (
                            <>Found {connections.length} connection(s), but none are SAP type.</>
                          ) : (
                            <>No connections available. Create a SAP connection in the external ConnectionsMaster system.</>
                          )}
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label>SAP Table *</Label>

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search SAP tables (e.g., VBAK, MARA, KNA1)..."
                    className="pl-9"
                    disabled={!connectionId}
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {/* Search Results - Inline, scrollable */}
                {searchTerm && (
                  <div className="border rounded-md bg-muted/30">
                    {isSearching ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Searching...</span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="max-h-[320px] overflow-y-auto">
                        {searchResults.map((table) => {
                          const tableKey = `${table.tableName}-${table.description || ''}-${table.module || ''}`;
                          const isSelected = tableName === table.tableName &&
                            selectedTableMetadata?.description === table.description;

                          return (
                            <button
                              key={tableKey}
                              onClick={() => handleTableSelect(table)}
                              className={`
                                w-full flex items-start gap-3 px-3 py-3 text-left
                                hover:bg-accent transition-colors border-b last:border-0
                                ${isSelected ? 'bg-primary/10 border-l-4 border-l-primary' : ''}
                              `}
                            >
                              <Database className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{table.tableName}</span>
                                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                                </div>
                                {table.description && (
                                  <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                    {table.description}
                                  </div>
                                )}
                                <div className="flex gap-1 mt-1.5 flex-wrap">
                                  {table.tableType && (
                                    <Badge variant="outline" className="text-xs h-5">
                                      {table.tableType}
                                    </Badge>
                                  )}
                                  {table.module && (
                                    <Badge variant="secondary" className="text-xs h-5">
                                      {table.module}
                                    </Badge>
                                  )}
                                  {table.subModule && (
                                    <Badge variant="secondary" className="text-xs h-5">
                                      {table.subModule}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        No tables found matching "{searchTerm}"
                      </div>
                    )}
                  </div>
                )}

                {/* Show selected table metadata to distinguish duplicates */}
                {selectedTableMetadata && !searchTerm && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <div className="font-medium">{selectedTableMetadata.tableName}</div>
                        {selectedTableMetadata.description && (
                          <div className="text-xs text-muted-foreground">
                            {selectedTableMetadata.description}
                          </div>
                        )}
                        <div className="flex gap-1 flex-wrap mt-1">
                          {selectedTableMetadata.tableType && (
                            <Badge variant="outline" className="text-xs">
                              {selectedTableMetadata.tableType}
                            </Badge>
                          )}
                          {selectedTableMetadata.module && (
                            <Badge variant="secondary" className="text-xs">
                              {selectedTableMetadata.module}
                            </Badge>
                          )}
                          {selectedTableMetadata.subModule && (
                            <Badge variant="secondary" className="text-xs">
                              {selectedTableMetadata.subModule}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label>Display Name *</Label>
                <Input
                  value={datasourceName}
                  onChange={(e) => setDatasourceName(e.target.value)}
                  placeholder="e.g., Sales Orders (QAS)"
                />
                <p className="text-xs text-muted-foreground">
                  Friendly name to identify this datasource in validations
                </p>
              </div>
            </div>
          )}

          {stage === 'creating' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center">
                <div className="font-medium">Creating datasource...</div>
                <div className="text-sm text-muted-foreground">Setting up metadata</div>
              </div>
            </div>
          )}

          {stage === 'syncing' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center">
                <div className="font-medium">Syncing from SAP...</div>
                <div className="text-sm text-muted-foreground">
                  Fetching data from {tableName}. This may take a moment.
                </div>
              </div>
            </div>
          )}

          {stage === 'complete' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <div className="text-center">
                <div className="font-medium text-green-900">SAP table added successfully!</div>
                <div className="text-sm text-muted-foreground mt-2">
                  {datasourceName} is now available as a datasource
                </div>
              </div>
            </div>
          )}

          {stage === 'form' && (
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!connectionId || !tableName || !datasourceName || createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add & Sync'
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
