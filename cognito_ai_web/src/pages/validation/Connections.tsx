import { useConnections, useTestConnection, useDeleteConnection, useCreateConnection } from '@/api/validation/hooks';
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
import { Plus, Play, Pencil, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import ValidationLayout from './ValidationLayout';
import { SAPConnectionDialog, SAPConnectionFormData } from '@/components/SAPConnectionDialog';
import { useState } from 'react';

export default function Connections() {
  const { data: connections = [], isLoading: loading, error } = useConnections();
  const testConnectionMutation = useTestConnection();
  const deleteConnectionMutation = useDeleteConnection();
  const createConnectionMutation = useCreateConnection();

  const [showSAPDialog, setShowSAPDialog] = useState(false);

  const handleTestConnection = async (id: number) => {
    try {
      const result = await testConnectionMutation.mutateAsync(id);
      alert(result.success ? 'Connection successful!' : `Connection failed: ${result.message}`);
    } catch (err: any) {
      alert(`Test failed: ${err.message}`);
    }
  };

  const handleDeleteConnection = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete connection "${name}"?`)) {
      try {
        await deleteConnectionMutation.mutateAsync(id);
      } catch (err: any) {
        alert(`Failed to delete connection: ${err.message}`);
      }
    }
  };

  const handleCreateSAPConnection = async (data: SAPConnectionFormData) => {
    try {
      await createConnectionMutation.mutateAsync({
        connection_name: data.connection_name,
        description: data.description,
        source_type: 'sap',
        connection_config: {
          ashost: data.ashost,
          sysnr: data.sysnr,
          client: data.client,
          vault_path: data.vault_path,
          lang: data.lang || 'EN',
        },
      });
      alert('SAP connection created successfully!');
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create SAP connection');
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-[hsl(var(--color-success))]" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
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
          <h1 className="text-3xl font-bold tracking-tight">Connections</h1>
          <p className="text-muted-foreground mt-2">Manage your database connections</p>
        </div>
        <Button onClick={() => setShowSAPDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New SAP Connection
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load connections'}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg">Database Connections ({connections.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Database</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Tested</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {connections.length > 0 ? (
                connections.map((connection) => (
                  <TableRow key={connection.connection_id}>
                    <TableCell className="font-medium">#{connection.connection_id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{connection.connection_name}</div>
                        <div className="text-sm text-muted-foreground">{connection.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{connection.source_type}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{connection.host || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{connection.database_name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={connection.is_active ? 'success' : 'secondary'}>
                          {connection.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {getStatusIcon(connection.last_test_status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {connection.last_tested_at
                        ? new Date(connection.last_tested_at).toLocaleString()
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTestConnection(connection.connection_id)}
                          disabled={testConnectionMutation.isPending}
                          title="Test Connection"
                        >
                          {testConnectionMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => alert('Edit connection (TODO)')}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleDeleteConnection(connection.connection_id, connection.connection_name)
                          }
                          title="Delete"
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
                    No connections found. Create your first connection to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* SAP Connection Dialog */}
      <SAPConnectionDialog
        open={showSAPDialog}
        onClose={() => setShowSAPDialog(false)}
        onSubmit={handleCreateSAPConnection}
        isLoading={createConnectionMutation.isPending}
      />
    </div>
    </ValidationLayout>
  );
}
