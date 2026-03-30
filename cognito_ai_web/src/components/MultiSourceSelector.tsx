import { useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Plus } from 'lucide-react';
import { useDataSources, useUploadedDatasources, useSAPDatasources } from '../api/validation/hooks';
import { EnhancedSourceItem } from './EnhancedSourceItem';
import type { SourceDefinition, DataSource } from '../types/index';

interface MultiSourceSelectorProps {
  sources: SourceDefinition[];
  onChange: (sources: SourceDefinition[]) => void;
  label: string;
  validationId: number; // ✅ Required for validation-scoped datasources
}

export function MultiSourceSelector({
  sources,
  onChange,
  label,
  validationId,
}: MultiSourceSelectorProps) {
  const { data: datasources = [] } = useDataSources();
  const { data: uploadedDatasources = [] } = useUploadedDatasources(validationId); // ✅ Pass validationId
  const { data: sapDatasources = [] } = useSAPDatasources(); // ✅ Fetch global SAP tables

  console.log('[MultiSourceSelector] validationId:', validationId);
  console.log('[MultiSourceSelector] uploadedDatasources:', uploadedDatasources);
  console.log('[MultiSourceSelector] sapDatasources:', sapDatasources);

  // Merge uploaded Excel datasources + SAP datasources with regular datasources
  // ⚠️ Filter out SAP connections from regular datasources (they appear without table selected)
  const filteredDatasources = datasources.filter(ds => ds.source_type !== 'sap');

  const allDatasources: DataSource[] = [
    ...filteredDatasources,
    ...uploadedDatasources.map(ud => {
      console.log('[MultiSourceSelector] Mapping uploaded datasource:', {
        datasource_id: ud.datasource_id,
        datasource_name: ud.datasource_name,
        columns: ud.columns,
        column_count: ud.columns?.length || 0,
      });
      return {
        id: `uploaded_${ud.datasource_id}`,
        display_name: ud.datasource_name,
        connection_id: -1, // Special marker for uploaded
        connection_name: 'Uploaded Excel',
        source_type: 'excel' as const,
        database_name: ud.filename,
        table_name: ud.temp_table_name, // MySQL temp table name
        columns: ud.columns || [], // ✅ Use columns from API response
        uploaded_datasource_id: ud.datasource_id,
        // No sheets in new temp table architecture
      };
    }),
    // Add SAP datasources (only if sync is complete)
    ...sapDatasources
      .filter(sd => sd.sync_status === 'complete')
      .map(sd => ({
        id: `sap_${sd.id}`,
        display_name: sd.name,
        connection_id: sd.connection_id as any,
        connection_name: 'SAP',
        source_type: 'sap' as const, // ✅ Use 'sap' to match DataSourceSelector grouping
        database_name: undefined,
        table_name: sd.temp_table_name || sd.table_name,
        columns: sd.columns || [],
        sap_datasource_id: sd.id,
      })),
  ];

  // Add a new empty source
  const handleAddSource = () => {
    const newSource: SourceDefinition = {
      source_id: `source_${sources.length + 1}`,
      connection_id: 0,
      query: '',
    };
    onChange([...sources, newSource]);
  };

  // Remove a source by index
  const handleRemoveSource = (index: number) => {
    const updatedSources = sources.filter((_, i) => i !== index);
    onChange(updatedSources);
  };

  // Update a specific field in a source
  const handleUpdateSource = (
    index: number,
    field: keyof SourceDefinition,
    value: any
  ) => {
    const updatedSources = [...sources];
    const currentSource = updatedSources[index];

    // Update the field
    updatedSources[index] = {
      ...currentSource,
      [field]: value,
    };

    // Auto-regenerate query when selected_columns or where_clause changes
    if (field === 'selected_columns' || field === 'where_clause') {
      const datasource = allDatasources.find(
        (ds) =>
          ds.connection_id === currentSource.connection_id &&
          (currentSource.query.includes(ds.table_name || '') || currentSource.query.includes(ds.display_name))
      );

      if (datasource && (datasource.source_type === 'mysql' || datasource.source_type === 'postgres')) {
        const tableName = datasource.table_name || datasource.display_name;
        const fullTableName = datasource.database_name
          ? `${datasource.database_name}.${tableName}`
          : tableName;

        // Get updated values
        const selectedColumns = field === 'selected_columns' ? value : currentSource.selected_columns;
        const whereClause = field === 'where_clause' ? value : currentSource.where_clause;

        // Build query
        const columns = selectedColumns && selectedColumns.length > 0
          ? selectedColumns.join(', ')
          : '*';

        let query = `SELECT ${columns} FROM ${fullTableName}`;
        if (whereClause) {
          query += ` WHERE ${whereClause}`;
        }

        updatedSources[index].query = query;
      } else if (datasource && datasource.source_type === 'sap') {
        // For SAP, update the comment-based query
        updatedSources[index].query = `-- SAP table: ${datasource.table_name || 'No table selected'}`;
      }
    }

    onChange(updatedSources);
  };

  // Handle datasource selection (auto-fills connection_id and query)
  const handleDataSourceSelect = (index: number, datasource: DataSource) => {
    const updatedSources = [...sources];
    const currentSource = updatedSources[index];

    // Generate query based on source type
    let query = '';
    if (datasource.source_type === 'mysql' || datasource.source_type === 'postgres') {
      // For database sources - build query from selected columns and where clause
      const tableName = datasource.table_name || datasource.display_name;
      const fullTableName = datasource.database_name
        ? `${datasource.database_name}.${tableName}`
        : tableName;

      // Use selected_columns if available, otherwise SELECT *
      const columns = currentSource.selected_columns && currentSource.selected_columns.length > 0
        ? currentSource.selected_columns.join(', ')
        : '*';

      query = `SELECT ${columns} FROM ${fullTableName}`;

      // Add WHERE clause if present
      if (currentSource.where_clause) {
        query += ` WHERE ${currentSource.where_clause}`;
      }
    } else if (datasource.source_type === 'excel') {
      // For Excel sources, store in excel_config
      query = `-- Excel file: ${datasource.file_path || datasource.database_name}`;
    } else if (datasource.source_type === 'sap') {
      // For SAP sources, store table reference (backend will handle SAP BAPI calls)
      query = `-- SAP table: ${datasource.table_name || 'No table selected'}`;
    }

    // Determine if this is an uploaded datasource or connection-based
    const isUploadedDatasource = !!datasource.uploaded_datasource_id;

    updatedSources[index] = {
      ...updatedSources[index],
      connection_id: datasource.connection_id,
      query,
      // Preserve selected_columns and where_clause when changing datasource
      selected_columns: currentSource.selected_columns,
      where_clause: currentSource.where_clause,

      // Store available columns from the datasource (IMPORTANT for SAP!)
      available_columns: datasource.columns,

      // Store table name for reference
      table_name: datasource.table_name,

      // Set uploaded datasource fields if applicable
      ...(isUploadedDatasource
        ? {
            uploaded_datasource_id: datasource.uploaded_datasource_id,
            // No selected_sheet in temp table architecture
          }
        : {
            uploaded_datasource_id: undefined,
          }),

      // Store excel config if it's a connection-based Excel source
      ...(datasource.source_type === 'excel' && datasource.file_path && datasource.sheet_name
        ? {
            excel_config: {
              file_path: datasource.file_path,
              sheet_name: datasource.sheet_name,
              has_header: true,
              columns: datasource.columns,
            },
          }
        : {}),
    };
    onChange(updatedSources);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-lg font-semibold">{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddSource}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Source
        </Button>
      </div>

      {sources.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <p>No sources added yet</p>
          <p className="text-sm">Click "Add Source" to get started</p>
        </div>
      )}

      {sources.map((source, index) => (
        <EnhancedSourceItem
          key={index}
          source={source}
          index={index}
          datasources={allDatasources}
          onUpdate={handleUpdateSource}
          onRemove={handleRemoveSource}
          onDataSourceSelect={handleDataSourceSelect}
        />
      ))}
    </div>
  );
}
