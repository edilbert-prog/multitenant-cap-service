import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ValidationTabView/ui/table";
import { Button } from '@/components/ValidationTabView/ui/button';
import { Badge } from '@/components/ValidationTabView/ui/badge';
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {  
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ValidationTabView/ui/dropdown-menu";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ValidationTabView/ui/accordion";
import ForwardedIconComponent from '@/components/ValidationTabView/Credentials-Vault/components/common/genericIconComponent';

interface Connection {
  id: string;
  name: string;
  connection_type: string;
  host?: string;
  port?: string | number;
  user_name?: string;
  database_name?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

interface ConnectionsTableProps {
  connections: {
    databases: Connection[];
    files: Connection[];
    email: Connection[];
  };
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
  const getIconNameForConnector = (connectionType: string): string => {
    const iconMapping: { [key: string]: string } = {
      'email': 'Email',
      'sftp': 'SFTP',
      'postgresql': 'postgres-sql',
      'mysql': 'Mysql',
      'oracle': 'Oracle',
      'mssql': 'MSsql',
      's4hana': 'SAP-Hana',
      'salesforce': 'salesforce',
      's3': 'AmazonS3',
      'elasticsearch': 'ElasticSearch',
      'dynamodb': 'Dynamodb',
      'redis': 'Redis',
      'mongodb': 'MongoDB',
      'csv': 'CSV',
      'excel': 'Excel',
      'parquet': 'Parquet',
      'feather': 'FixedFormat',
      'json': 'Json',
      'slack': 'Slack',
      'sendgrid': 'Sendgrid',
      'teams': 'Teams'
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

  const renderConnectionsTable = (connectionsList: Connection[], module: string) => {
    if (!connectionsList || connectionsList.length === 0) {  
      return (
        <div className="text-center p-8 border border-gray-200 rounded-lg">
          <div className="text-gray-500 text-lg mb-2">No connections found</div>
          <div className="text-gray-400 text-sm">Click "Add Source" to create your first connection</div>
        </div>
      );
    }

    return ( 
      <div className="w-full border rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="">
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Host</TableHead>
                <TableHead className="font-semibold">Port</TableHead>
                <TableHead className="font-semibold">Username</TableHead>
                <TableHead className="font-semibold">Database</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Updated</TableHead>
                <TableHead className="font-semibold w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {connectionsList.map((connection) => ( 
                <TableRow key={connection.id} className=" transition-colors">
                  <TableCell className="font-medium">
                    {connection?.name || "N/A"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ForwardedIconComponent 
                        name={getIconNameForConnector(connection.connection_type)}
                        className="w-6 h-6 flex-shrink-0" 
                      />
                      <Badge variant="outline" className="text-xs font-mono">
                        {connection?.connection_type || "N/A"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">
                    {connection.host || "N/A"}
                  </TableCell>
                  <TableCell className="">
                    {connection.port || "N/A"}
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate">
                    {connection.user_name || connection.username || "N/A"}
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate text-gray-700">
                    {connection.database_name || connection.database || "N/A"}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(connection.is_active !== false)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(connection?.updated_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 ">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[140px]">
                        <DropdownMenuItem 
                          onClick={() => onEdit(connection, module)}
                          className="cursor-pointer "
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(connection.id, module)}
                          className="cursor-pointer text-red-600  hover:text-red-700  focus:text-red-700"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded mb-2"></div>
          ))}
        </div>
      </div>
    );
  }

  return ( 
    <div className="w-full">
      <Accordion type="multiple" className="w-full" defaultValue={["databases"]}>
        <AccordionItem value="databases">
          <AccordionTrigger className="text-lg font-semibold">
            Databases ({connections.databases?.length || 0})
          </AccordionTrigger>
          <AccordionContent>
            {renderConnectionsTable(connections.databases || [], "databases")}
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="files">
          <AccordionTrigger className="text-lg font-semibold">
            Files ({connections.files?.length || 0})
          </AccordionTrigger>
          <AccordionContent>
            <div className="text-center p-8 border border-gray-200 rounded-lg">
              <div className="text-gray-500 text-lg mb-2">Files module coming soon</div>
              <div className="text-gray-400 text-sm">APIs are being developed for this module</div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="email">
          <AccordionTrigger className="text-lg font-semibold">
            Email ({connections.email?.length || 0})
          </AccordionTrigger>
          <AccordionContent>
            <div className="text-center p-8 border border-gray-200 rounded-lg">
              <div className="text-gray-500 text-lg mb-2">Email module coming soon</div>
              <div className="text-gray-400 text-sm">APIs are being developed for this module</div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default ConnectionsTable;