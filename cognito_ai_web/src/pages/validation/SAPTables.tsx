import { useSAPDatasources, useDeleteSAPDatasource, useSyncSAPDatasource } from '@/api/validation/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, RefreshCw, Trash2, Loader2, Database } from 'lucide-react';
import ValidationLayout from './ValidationLayout';
import { AddSAPTableDialog } from '@/components/AddSAPTableDialog';
import { useState } from 'react';

export default function SAPTables() {
  const { data: datasources = [], isLoading: loading, error } = useSAPDatasources({
    source_type: 'sap-bapi',
  });
  const deleteDatasourceMutation = useDeleteSAPDatasource();
  const syncDatasourceMutation = useSyncSAPDatasource();

  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleDeleteDatasource = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete SAP table "${name}"?\n\nThis will remove the table from all validations using it.`)) {
      try {
        await deleteDatasourceMutation.mutateAsync(id);
      } catch (err: any) {
        alert(`Failed to delete datasource: ${err.message}`);
      }
    }
  };

  const handleResync = async (id: string, name: string) => {
    if (window.confirm(`Re-sync SAP table "${name}"?\n\nThis will fetch the latest data from SAP.`)) {
      try {
        await syncDatasourceMutation.mutateAsync(id);
        alert('Sync started! Check the status column for progress.');
      } catch (err: any) {
        alert(`Failed to start sync: ${err.message}`);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge variant="success">Synced</Badge>;
      case 'syncing':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Syncing
          </Badge>
        );
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'stale':
        return <Badge variant="outline">Stale</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ValidationLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SAP Tables</h1>
            <p className="text-muted-foreground mt-2">
              Manage global SAP tables available across all validations
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add SAP Table
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error instanceof Error ? error.message : 'Failed to load SAP tables'}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="text-lg">SAP Tables ({datasources.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Connection</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Rows</TableHead>
                    <TableHead>Columns</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Synced</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datasources.length > 0 ? (
                    datasources.map((ds) => (
                      <TableRow key={ds.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-orange-500" />
                            <span className="font-medium">{ds.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {/* Show connection name - will need to fetch from connections API */}
                          {ds.connection_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-0.5 rounded">
                            {ds.table_name}
                          </code>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {ds.row_count?.toLocaleString() || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {ds.column_count || '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(ds.sync_status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {ds.last_synced_at
                            ? new Date(ds.last_synced_at).toLocaleDateString()
                            : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleResync(ds.id, ds.name)}
                              disabled={
                                ds.sync_status === 'syncing' ||
                                syncDatasourceMutation.isPending
                              }
                              title="Re-sync from SAP"
                            >
                              {ds.sync_status === 'syncing' ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteDatasource(ds.id, ds.name)}
                              title="Delete"
                              disabled={deleteDatasourceMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                        No SAP tables found. Add your first SAP table to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Add SAP Table Dialog */}
        <AddSAPTableDialog
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
        />
      </div>
    </ValidationLayout>
  );
}
