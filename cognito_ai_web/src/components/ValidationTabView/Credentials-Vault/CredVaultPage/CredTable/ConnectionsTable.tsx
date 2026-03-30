import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ValidationTabView/ui/table";
import { Button } from '@/components/ValidationTabView/ui/button';
import { Badge } from '@/components/ValidationTabView/ui/badge';
import { Input } from '@/components/ValidationTabView/ui/input';
import { MoreHorizontal, Edit, Trash2, ArrowUpDown, Search, ChevronLeft, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ValidationTabView/ui/dropdown-menu";
import ForwardedIconComponent from '@/components/ValidationTabView/Credentials-Vault/components/common/genericIconComponent';

interface Connection {
  id: string;
  name: string;
  connection_type: string;
  group_type: string;
  connection_config?: {
    host?: string;
    port?: string | number;
    username?: string;
    database?: string;
    base_url?: string;
    [key: string]: any;
  };
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

interface ConnectionsTableProps {
  connections: Connection[];
  onEdit: (connection: Connection, module: string) => void;
  onDelete: (id: string, module: string) => void;
  loading?: boolean;
}

const ConnectionsTable: React.FC<ConnectionsTableProps> = ({
  connections,
  onEdit,
  onDelete,
  loading = false
}) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');

  const getIconNameForConnector = (connectionType: string): string => {
    const iconMapping: { [key: string]: string } = {
      'postgres': 'postgres-sql',
      'postgresql': 'postgres-sql',
      'mysql': 'Mysql',
      'jira': 'Jira',
      'signaveo': 'Signaveo',
      'sap-odata': 'SAP-Hana',
      'sap-database': 'SAP-Hana',
      'sap-bapi': 'SAP-Hana',
      'sap-soap': 'SAP-Hana',
    };
    return iconMapping[connectionType?.toLowerCase()] || connectionType;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge
        variant={isActive ? "default" : "secondary"}
        className={isActive ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-gray-100 text-gray-800 hover:bg-gray-100"}
      >
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const getGroupBadge = (groupType: string) => {
    const colorMap: Record<string, string> = {
      'databases': 'bg-blue-100 text-blue-800',
      'erp': 'bg-purple-100 text-purple-800',
      'project_management': 'bg-orange-100 text-orange-800',
      'workflow': 'bg-teal-100 text-teal-800',
    };
    return (
      <Badge variant="outline" className={`text-xs ${colorMap[groupType] || 'bg-gray-100 text-gray-800'}`}>
        {groupType?.replace('_', ' ')}
      </Badge>
    );
  };

  const columns = useMemo<ColumnDef<Connection>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0 font-semibold"
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
      },
      {
        accessorKey: 'connection_type',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0 font-semibold"
          >
            Type
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const type = row.getValue('connection_type') as string;
          return (
            <div className="flex items-center gap-2">
              <ForwardedIconComponent
                name={getIconNameForConnector(type)}
                className="w-6 h-6 flex-shrink-0"
              />
              <Badge variant="outline" className="text-xs font-mono">
                {type}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: 'group_type',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0 font-semibold"
          >
            Group
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => getGroupBadge(row.getValue('group_type')),
      },
      {
        accessorKey: 'host',
        header: 'Host / URL',
        cell: ({ row }) => {
          const config = row.original.connection_config || {};
          const host = config.host || config.base_url;
          return <div className="max-w-[200px] truncate text-sm">{host || 'N/A'}</div>;
        },
      },
      {
        accessorKey: 'port',
        header: 'Port',
        cell: ({ row }) => {
          const config = row.original.connection_config || {};
          return <div className="text-sm">{config.port || 'N/A'}</div>;
        },
      },
      {
        accessorKey: 'username',
        header: 'Username',
        cell: ({ row }) => {
          const config = row.original.connection_config || {};
          const username = config.username;
          return <div className="max-w-[120px] truncate text-sm">{username || 'N/A'}</div>;
        },
      },
      {
        accessorKey: 'database',
        header: 'Database',
        cell: ({ row }) => {
          const config = row.original.connection_config || {};
          const database = config.database;
          return <div className="max-w-[120px] truncate text-sm text-gray-700">{database || 'N/A'}</div>;
        },
      },
      {
        accessorKey: 'is_active',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0 font-semibold"
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => getStatusBadge(row.getValue('is_active') !== false),
      },
      {
        accessorKey: 'updated_at',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0 font-semibold"
          >
            Updated
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-sm text-gray-600">{formatDate(row.getValue('updated_at'))}</div>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const connection = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[140px]">
                <DropdownMenuItem
                  onClick={() => onEdit(connection, connection.group_type)}
                  className="cursor-pointer"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(connection.id, connection.group_type)}
                  className="cursor-pointer text-red-600 hover:text-red-700 focus:text-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [onEdit, onDelete]
  );

  const table = useReactTable({
    data: connections,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (loading) {
    return (
      <div className="w-full">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="text-center p-12 border-2 border-dashed border-gray-300 rounded-lg">
        <div className="text-gray-500 text-xl mb-2">No connections found</div>
        <div className="text-gray-400 text-sm">Click "Add Source" to create your first connection</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search connections..."
            value={globalFilter ?? ''}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-gray-600">
          {table.getFilteredRowModel().rows.length} connection{table.getFilteredRowModel().rows.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-gray-50">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionsTable;
