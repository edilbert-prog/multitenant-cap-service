import React, { useState, useMemo } from 'react';
import { Database, FileSpreadsheet, Search, Server } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from './ui/select';
import { Input } from './ui/input';
import type { DataSource, SourceType } from '../types/index';
import { cn } from '@/components/ValidationTabView/lib/utils';

interface DataSourceSelectorProps {
  datasources: DataSource[];
  value?: string; // datasource.id
  onChange: (datasource: DataSource) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// Icon mapping for source types
const getSourceTypeIcon = (type: SourceType) => {
  switch (type) {
    case 'mysql':
    case 'postgres':
      return <Database className="h-4 w-4 mr-2 text-blue-600" />;
    case 'excel':
    case 'csv':
      return <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />;
    case 'sap':
      return <Server className="h-4 w-4 mr-2 text-orange-600" />;
    default:
      return <Database className="h-4 w-4 mr-2" />;
  }
};

// Get source type label
const getSourceTypeLabel = (type: SourceType): string => {
  const labels: Record<SourceType, string> = {
    mysql: 'MySQL Databases',
    postgres: 'PostgreSQL Databases',
    excel: 'Excel Files',
    csv: 'CSV Files',
    sap: 'SAP Connections',
    api: 'API Connections',
  };
  return labels[type] || type;
};

export const DataSourceSelector: React.FC<DataSourceSelectorProps> = ({
  datasources,
  value,
  onChange,
  placeholder = 'Select data source...',
  className,
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Group datasources by source type
  const groupedDatasources = useMemo(() => {
    const filtered = datasources.filter((ds) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        ds.display_name.toLowerCase().includes(searchLower) ||
        ds.connection_name.toLowerCase().includes(searchLower) ||
        ds.database_name?.toLowerCase().includes(searchLower) ||
        ds.table_name?.toLowerCase().includes(searchLower)
      );
    });

    // Group by source_type
    const grouped: Record<SourceType, DataSource[]> = {
      mysql: [],
      postgres: [],
      excel: [],
      csv: [],
      sap: [],
      api: [],
    };

    filtered.forEach((ds) => {
      grouped[ds.source_type].push(ds);
    });

    return grouped;
  }, [datasources, searchTerm]);

  // Find selected datasource
  const selectedDatasource = useMemo(() => {
    return datasources.find((ds) => ds.id === value);
  }, [datasources, value]);

  // Handle selection
  const handleSelect = (datasourceId: string) => {
    const datasource = datasources.find((ds) => ds.id === datasourceId);
    if (datasource) {
      onChange(datasource);
    }
  };

  return (
    <Select value={value} onValueChange={handleSelect} disabled={disabled}>
      <SelectTrigger className={cn('w-full', className)}>
        <SelectValue placeholder={placeholder}>
          {selectedDatasource && (
            <div className="flex items-center">
              {getSourceTypeIcon(selectedDatasource.source_type)}
              <span className="truncate">
                {selectedDatasource.display_name}
                <span className="text-xs text-muted-foreground ml-2">
                  ({selectedDatasource.connection_name})
                </span>
              </span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>

      <SelectContent className="max-h-[400px]">
        {/* Search input */}
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search data sources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
              autoFocus
            />
          </div>
        </div>

        {/* Grouped datasources */}
        <div className="max-h-[300px] overflow-y-auto">
          {Object.entries(groupedDatasources).map(([type, sources]) => {
            if (sources.length === 0) return null;

            return (
              <SelectGroup key={type}>
                <SelectLabel className="flex items-center px-2 py-1.5">
                  {getSourceTypeIcon(type as SourceType)}
                  {getSourceTypeLabel(type as SourceType)}
                  <span className="ml-auto text-xs text-muted-foreground">
                    ({sources.length})
                  </span>
                </SelectLabel>

                {sources.map((ds) => (
                  <SelectItem key={ds.id} value={ds.id}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex-1">
                        <div className="font-medium">{ds.display_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {ds.connection_name}
                          {ds.database_name && ` • ${ds.database_name}`}
                          {ds.row_count !== undefined &&
                            ` • ${ds.row_count.toLocaleString()} rows`}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            );
          })}

          {/* No results message */}
          {Object.values(groupedDatasources).every((sources) => sources.length === 0) && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No data sources found matching "{searchTerm}"
            </div>
          )}
        </div>
      </SelectContent>
    </Select>
  );
};
