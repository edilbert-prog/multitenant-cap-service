import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Trash2, ChevronDown, ChevronUp, Save, Edit } from 'lucide-react';
import { DataSourceSelector } from './DataSourceSelector';
import { SAPTableSelector } from './SAPTableSelector';
import { apiClient } from '@/api/validation/client';
import type { SourceDefinition, DataSource } from '../types/index';

interface EnhancedSourceItemProps {
  source: SourceDefinition;
  index: number;
  datasources: DataSource[];
  onUpdate: (index: number, field: keyof SourceDefinition, value: any) => void;
  onRemove: (index: number) => void;
  onDataSourceSelect: (index: number, datasource: DataSource) => void;
}

export function EnhancedSourceItem({
  source,
  index,
  datasources,
  onUpdate,
  onRemove,
  onDataSourceSelect,
}: EnhancedSourceItemProps) {
  // Start collapsed if source is already configured, expanded if new
  const isNewSource = !source.connection_id && !source.uploaded_datasource_id;
  const [isExpanded, setIsExpanded] = useState(isNewSource);
  const [isEditing, setIsEditing] = useState(isNewSource); // Auto-edit if new

  // SAP table selector state
  const [showSAPTableSelector, setShowSAPTableSelector] = useState(false);
  const [sapConnectionId, setSapConnectionId] = useState<number | null>(null);
  const [sapConnectionName, setSapConnectionName] = useState<string>('');
  const [isLoadingColumns, setIsLoadingColumns] = useState(false);

  // Find the current datasource
  const currentDatasource = datasources.find((ds) => {
    // For uploaded datasources
    if (source.uploaded_datasource_id) {
      return ds.uploaded_datasource_id === source.uploaded_datasource_id;
    }
    // For connection-based datasources (including SAP)
    if (source.connection_id && ds.connection_id === source.connection_id) {
      // For SAP, also match by table name if available
      if (ds.source_type === 'sap' && ds.table_name) {
        return source.query?.includes(ds.table_name) || source.query?.includes(ds.display_name);
      }
      // For MySQL/Postgres, match by table name in query
      return source.query?.includes(ds.table_name || '') || source.query?.includes(ds.display_name);
    }
    return false;
  });

  const currentDatasourceId = currentDatasource?.id;

  // Get columns from source itself (preferred) or fallback to datasource
  // This allows columns to persist even when datasource is stale
  const availableColumns = (source as any).available_columns || currentDatasource?.columns || [];

  // Debug logging
  console.log('[EnhancedSourceItem] Source:', source.source_id);
  console.log('[EnhancedSourceItem] Source available_columns:', (source as any).available_columns);
  console.log('[EnhancedSourceItem] Current datasource:', currentDatasource);
  console.log('[EnhancedSourceItem] Datasource columns:', currentDatasource?.columns);
  console.log('[EnhancedSourceItem] Available columns (final):', availableColumns);

  // Detect SAP datasource selection without table
  useEffect(() => {
    if (
      currentDatasource &&
      currentDatasource.source_type === 'sap' &&
      !currentDatasource.table_name &&
      currentDatasource.connection_id &&
      isEditing
    ) {
      // SAP datasource selected but no table chosen yet - open table selector
      setSapConnectionId(currentDatasource.connection_id);
      setSapConnectionName(currentDatasource.connection_name || 'SAP Connection');
      setShowSAPTableSelector(true);
    }
  }, [currentDatasource, isEditing]);

  const handleDataSourceChange = (datasource: DataSource) => {
    onDataSourceSelect(index, datasource);
  };

  const handleSAPTableSelect = async (tableName: string) => {
    if (!sapConnectionId) return;

    try {
      setIsLoadingColumns(true);

      console.log('[handleSAPTableSelect] Fetching columns for table:', tableName);

      // Fetch columns for the selected SAP table
      const response = await apiClient.get(
        `/validation-api/connections/${sapConnectionId}/tables/${tableName}/columns`
      );
      const columns = response.data.data || [];

      console.log('[handleSAPTableSelect] Fetched columns:', columns);

      // Create updated datasource with table and columns
      const updatedDatasource: DataSource = {
        id: `sap_${sapConnectionId}_${tableName}`,
        display_name: `${sapConnectionName} - ${tableName}`,
        connection_id: sapConnectionId,
        connection_name: sapConnectionName,
        source_type: 'sap',
        database_name: undefined,
        table_name: tableName,
        columns: columns,
      };

      console.log('[handleSAPTableSelect] Created updated datasource:', updatedDatasource);

      // Update the source with the selected table
      onDataSourceSelect(index, updatedDatasource);

      console.log('[handleSAPTableSelect] Called onDataSourceSelect');

      // Close dialog
      setShowSAPTableSelector(false);
    } catch (error: any) {
      console.error('Failed to fetch SAP table columns:', error);
      alert(`Failed to fetch columns: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoadingColumns(false);
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    setIsExpanded(false);
  };

  const handleColumnToggle = (column: string) => {
    // If undefined (SELECT *), convert to array of all columns first
    const current = source.selected_columns === undefined
      ? [...availableColumns]
      : source.selected_columns;

    const updated = current.includes(column)
      ? current.filter((c) => c !== column)
      : [...current, column];

    // Keep as array even if empty - don't convert to undefined
    onUpdate(index, 'selected_columns', updated);
  };

  const handleSelectAllColumns = () => {
    // If undefined or all columns selected, clear selection
    // Otherwise select all columns
    const allSelected = !source.selected_columns ||
                       source.selected_columns.length === availableColumns.length;

    if (allSelected) {
      onUpdate(index, 'selected_columns', []); // Empty array = none selected
    } else {
      onUpdate(index, 'selected_columns', [...availableColumns]); // Array with all columns
    }
  };

  const isColumnSelected = (column: string) => {
    // undefined = all selected (SELECT *)
    if (!source.selected_columns) return true;
    // Empty array = none selected
    if (source.selected_columns.length === 0) return false;
    // Otherwise check if column is in the list
    return source.selected_columns.includes(column);
  };

  // Render collapsed card view
  if (!isExpanded && !isEditing) {
    return (
      <div className="border rounded-lg p-3 bg-card hover:bg-accent/5 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{source.source_id}</span>
              <span className="text-xs text-muted-foreground">
                ({currentDatasource?.display_name || 'No source selected'})
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {!source.selected_columns
                ? 'All columns'
                : source.selected_columns.length === 0
                ? 'No columns selected'
                : `${source.selected_columns.length} columns selected`}
              {source.where_clause && ` • Filtered`}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="h-8 w-8 p-0"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(index)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render expanded/editing view
  return (
    <div className="border rounded-lg p-4 space-y-4 bg-card">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Source {index + 1}</h4>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={
                !source.source_id ||
                (!source.connection_id && !source.uploaded_datasource_id)
              }
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Source ID */}
      <div className="space-y-2">
        <Label htmlFor={`source_id_${index}`}>Source ID *</Label>
        <Input
          id={`source_id_${index}`}
          value={source.source_id}
          onChange={(e) => onUpdate(index, 'source_id', e.target.value)}
          placeholder="e.g., employees, addresses"
          required
          disabled={!isEditing}
        />
        <p className="text-xs text-muted-foreground">
          Used to reference this source in pipeline operations
        </p>
      </div>

      {/* Data Source Selector */}
      <div className="space-y-2">
        <Label htmlFor={`datasource_${index}`}>Data Source *</Label>
        <DataSourceSelector
          datasources={datasources}
          value={currentDatasourceId}
          onChange={handleDataSourceChange}
          placeholder="Search for a table or file..."
          disabled={!isEditing}
        />
      </div>

      {/* No sheet selector needed - all data in MySQL temp table */}

      {/* Column Selection */}
      {availableColumns.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Select Columns (Optional)</Label>
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={handleSelectAllColumns}
              className="h-auto p-0 text-xs"
              disabled={!isEditing}
            >
              {(!source.selected_columns ||
                source.selected_columns.length === availableColumns.length)
                ? 'Clear Selection'
                : 'Select All'}
            </Button>
          </div>
          <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableColumns.map((column) => (
                <label key={column} className="flex items-center space-x-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isColumnSelected(column)}
                    onChange={() => handleColumnToggle(column)}
                    disabled={!isEditing}
                    className="rounded border-gray-300"
                  />
                  <span className="truncate">{column}</span>
                </label>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {!source.selected_columns
              ? 'All columns selected (SELECT *)'
              : source.selected_columns.length === 0
              ? 'No columns selected'
              : `${source.selected_columns.length} of ${availableColumns.length} columns selected`}
          </p>
        </div>
      )}

      {/* WHERE Clause Filter */}
      <div className="space-y-2">
        <Label htmlFor={`where_${index}`}>Filter (WHERE clause)</Label>
        <Input
          id={`where_${index}`}
          value={source.where_clause || ''}
          onChange={(e) => onUpdate(index, 'where_clause', e.target.value || undefined)}
          placeholder="e.g., department = 'Engineering' AND status = 'active'"
          disabled={!isEditing}
        />
        <p className="text-xs text-muted-foreground">
          Optional SQL WHERE condition (without the WHERE keyword)
        </p>
      </div>

      {/* Generated Query Preview or Excel/SAP Info */}
      {currentDatasource && (
        <div className="space-y-2">
          {source.uploaded_datasource_id ? (
            // Show Excel file info
            <>
              <Label>Excel Source Info</Label>
              <div className="bg-muted p-3 rounded-md text-xs">
                <div className="space-y-1">
                  <div><strong>File:</strong> {currentDatasource.database_name}</div>
                  <div><strong>Table:</strong> {currentDatasource.table_name}</div>
                  <div><strong>Columns:</strong> {
                    !source.selected_columns
                      ? 'All'
                      : source.selected_columns.length === 0
                      ? 'None selected'
                      : source.selected_columns.join(', ')
                  }</div>
                </div>
              </div>
            </>
          ) : currentDatasource.source_type === 'sap' ? (
            // Show SAP source info
            <>
              <Label>SAP Source Info</Label>
              <div className="bg-muted p-3 rounded-md text-xs">
                <div className="space-y-1">
                  <div><strong>Connection:</strong> {currentDatasource.connection_name}</div>
                  <div><strong>Table:</strong> {currentDatasource.table_name || 'No table selected'}</div>
                  <div><strong>Columns:</strong> {
                    !source.selected_columns
                      ? 'All'
                      : source.selected_columns.length === 0
                      ? 'None selected'
                      : source.selected_columns.join(', ')
                  }</div>
                  {source.where_clause && (
                    <div><strong>Filter:</strong> {source.where_clause}</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            // Show SQL query preview for MySQL/Postgres
            <>
              <Label>Generated Query (Preview)</Label>
              {source.selected_columns?.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md text-xs text-yellow-800">
                  ⚠️ No columns selected - please select at least one column
                </div>
              ) : (
                <div className="bg-muted p-3 rounded-md text-xs font-mono">
                  <code>
                    SELECT{' '}
                    {!source.selected_columns
                      ? '*'
                      : source.selected_columns.join(', ')}
                    <br />
                    FROM {currentDatasource.database_name}.{currentDatasource.table_name}
                    {source.where_clause && (
                      <>
                        <br />
                        WHERE {source.where_clause}
                      </>
                    )}
                  </code>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* SAP Table Selector Dialog */}
      {sapConnectionId && (
        <SAPTableSelector
          open={showSAPTableSelector}
          connectionId={sapConnectionId}
          connectionName={sapConnectionName}
          onClose={() => setShowSAPTableSelector(false)}
          onSelect={handleSAPTableSelect}
        />
      )}
    </div>
  );
}
