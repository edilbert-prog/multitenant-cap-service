import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Search, Server, Database } from 'lucide-react';
import { Badge } from './ui/badge';
import { apiClient } from '@/api/validation/client';

interface SAPTable {
  tableName: string;
  description?: string;
  module?: string;
  subModule?: string;
  tableType?: string;
  connectionId: string;
  connectionName: string;
}

interface SAPTableSelectorProps {
  open: boolean;
  connectionId: string;
  connectionName: string;
  onClose: () => void;
  onSelect: (tableName: string) => void;
}

export const SAPTableSelector: React.FC<SAPTableSelectorProps> = ({
  open,
  connectionId,
  connectionName,
  onClose,
  onSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTable, setSelectedTable] = useState<SAPTable | null>(null);
  const [tables, setTables] = useState<SAPTable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch tables when search term changes (debounced)
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(
          `/validation-api/connections/${connectionId}/tables/search`,
          { params: { q: searchTerm } }
        );
        setTables(response.data.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch SAP tables');
        setTables([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm, connectionId, open]);

  // Create unique key for each table entry
  const getTableKey = (table: SAPTable) => {
    return `${table.tableName}-${table.description || ''}-${table.module || ''}-${table.subModule || ''}`;
  };

  const handleSelect = () => {
    if (selectedTable) {
      onSelect(selectedTable.tableName);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-orange-600" />
            Select SAP Table
          </DialogTitle>
          <DialogDescription>
            Choose a table from SAP connection "{connectionName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Bar */}
          <div className="space-y-2">
            <Label htmlFor="table-search">Search Tables</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="table-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search SAP tables..."
                className="pl-8"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Table Count Badge */}
          <div className="flex items-center justify-between">
            <Badge variant="secondary">
              {tables.length} table{tables.length !== 1 ? 's' : ''} found
            </Badge>
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
              >
                Clear search
              </Button>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Table List */}
          {!isLoading && !error && tables.length > 0 && (
            <div className="border border-border rounded-md overflow-hidden">
              <div className="max-h-[400px] overflow-y-auto">
                {tables.map((table) => {
                  const tableKey = getTableKey(table);
                  const isSelected = selectedTable ? getTableKey(selectedTable) === tableKey : false;

                  return (
                    <button
                      key={tableKey}
                      onClick={() => setSelectedTable(table)}
                      className={`
                        w-full flex items-start gap-3 px-4 py-3 text-left
                        hover:bg-muted/50 transition-colors border-b border-border last:border-0
                        ${isSelected ? 'bg-primary/10 border-l-4 border-l-primary' : ''}
                      `}
                    >
                      <Database className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{table.tableName}</div>
                        {table.description && (
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {table.description}
                          </div>
                        )}
                        <div className="flex gap-2 mt-1.5 flex-wrap">
                          {table.tableType && (
                            <Badge variant="outline" className="text-xs">
                              {table.tableType}
                            </Badge>
                          )}
                          {table.module && (
                            <Badge variant="secondary" className="text-xs">
                              {table.module}
                            </Badge>
                          )}
                          {table.subModule && (
                            <Badge variant="secondary" className="text-xs">
                              {table.subModule}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <Badge variant="default" className="text-xs flex-shrink-0">
                          Selected
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* No Results */}
          {!isLoading && !error && tables.length === 0 && (
            <Alert>
              <AlertDescription>
                {searchTerm
                  ? `No tables found matching "${searchTerm}". Try searching for table names like MARA, VBAK, or KNA1.`
                  : 'Enter a search term to find SAP tables (e.g., MARA, VBAK, KNA1)'}
              </AlertDescription>
            </Alert>
          )}

          {/* Help Text */}
          <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/30 rounded-md">
            <p className="font-medium">Common SAP Tables:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li><strong>VBAK/VBAP</strong>: Sales Documents</li>
              <li><strong>EKKO/EKPO</strong>: Purchase Documents</li>
              <li><strong>KNA1/LFA1</strong>: Customer/Vendor Master</li>
              <li><strong>MARA/MARC</strong>: Material Master</li>
              <li><strong>BKPF/BSEG</strong>: Accounting Documents</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSelect}
            disabled={!selectedTable || isLoading}
          >
            Select Table
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
