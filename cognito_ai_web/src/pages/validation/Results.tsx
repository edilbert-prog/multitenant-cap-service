import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useValidationResults, useDownloadResultCsv, useValidations, useFolderTree } from '@/api/validation/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FilterPill, FilterPills } from '@/components/ui/filter-pills';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, Download, Loader2, X } from 'lucide-react';
import ValidationLayout from './ValidationLayout';

export default function Results() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const validationIdFromUrl = searchParams.get('validation_id');
  const folderId = searchParams.get('folder');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [workflowFilter, setWorkflowFilter] = useState<string>(validationIdFromUrl || 'all');

  const { data: allResults = [], isLoading: loading, error } = useValidationResults(
    validationIdFromUrl ? Number(validationIdFromUrl) : undefined
  );
  const { data: validations = [] } = useValidations();
  const { data: folderTree = [] } = useFolderTree();
  const downloadMutation = useDownloadResultCsv();

  // Filter results by folder if folder parameter is present
  const filteredByFolder = useMemo(() => {
    if (!folderId) return allResults;

    // Get all validation IDs that belong to this folder
    const validationIdsInFolder = validations
      .filter(v => v.folder_id === Number(folderId))
      .map(v => v.validation_id);

    return allResults.filter(result =>
      validationIdsInFolder.includes(result.validation_id)
    );
  }, [allResults, folderId, validations]);

  // Filter by workflow
  const filteredByWorkflow = useMemo(() => {
    if (workflowFilter === 'all') return filteredByFolder;
    return filteredByFolder.filter(result =>
      result.validation_id === Number(workflowFilter)
    );
  }, [filteredByFolder, workflowFilter]);

  // Filter results based on status
  const results = filteredByWorkflow.filter(result =>
    statusFilter === 'all' ? true : result.execution_status === statusFilter
  );

  // Get unique workflows from filtered results for the dropdown
  const availableWorkflows = useMemo(() => {
    const uniqueValidationIds = [...new Set(filteredByFolder.map(r => r.validation_id))];
    return uniqueValidationIds
      .map(id => {
        const validation = validations.find(v => v.validation_id === id);
        const resultForName = filteredByFolder.find(r => r.validation_id === id);
        return {
          id,
          name: validation?.validation_name || (resultForName as any)?.validation_name || `Workflow #${id}`,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredByFolder, validations]);

  // Find folder name for display
  const selectedFolderName = useMemo(() => {
    if (!folderId) return null;
    const findFolder = (folders: any[]): string | null => {
      for (const folder of folders) {
        if (folder.folder_id === Number(folderId)) {
          return folder.folder_name;
        }
        if (folder.children) {
          const found = findFolder(folder.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findFolder(folderTree);
  }, [folderTree, folderId]);

  // Count by status (use workflow-filtered results)
  const statusCounts = {
    all: filteredByWorkflow.length,
    success: filteredByWorkflow.filter(r => r.execution_status === 'success').length,
    failed: filteredByWorkflow.filter(r => r.execution_status === 'failed').length,
    running: filteredByWorkflow.filter(r => r.execution_status === 'running').length,
  };

  const handleDownload = async (resultId: number, type: 'matched' | 'mismatched' | 'all') => {
    try {
      const blob = await downloadMutation.mutateAsync({ id: resultId, type });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `workflow_result_${resultId}_${type}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'failed':
        return 'destructive';
      case 'running':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
          <h1 className="text-3xl font-bold tracking-tight">
            {validationIdFromUrl ? `Results for Workflow #${validationIdFromUrl}` : 'Workflow Results'}
          </h1>
          <p className="text-muted-foreground mt-2">
            View and download workflow execution results
            {selectedFolderName && (
              <span className="ml-2">
                · in folder: <span className="font-medium">{selectedFolderName}</span>
              </span>
            )}
          </p>
        </div>
        {folderId && !validationIdFromUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/validation/results')}
          >
            Clear Filter
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load results'}
          </AlertDescription>
        </Alert>
      )}

      {/* Workflow Filter */}
      {!validationIdFromUrl && availableWorkflows.length > 1 && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Label htmlFor="workflow-filter" className="whitespace-nowrap text-sm font-medium">
              Filter by Workflow:
            </Label>
            <Select value={workflowFilter} onValueChange={setWorkflowFilter}>
              <SelectTrigger id="workflow-filter" className="flex-1">
                <SelectValue placeholder="All Workflows" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workflows ({filteredByFolder.length} results)</SelectItem>
                {availableWorkflows.map((workflow) => {
                  const count = filteredByFolder.filter(r => r.validation_id === workflow.id).length;
                  return (
                    <SelectItem key={workflow.id} value={workflow.id.toString()}>
                      {workflow.name} ({count} {count === 1 ? 'result' : 'results'})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {workflowFilter !== 'all' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setWorkflowFilter('all')}
                title="Clear workflow filter"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Filter Pills */}
      <FilterPills>
        <FilterPill
          active={statusFilter === 'all'}
          count={statusCounts.all}
          onClick={() => setStatusFilter('all')}
        >
          All results
        </FilterPill>
        <FilterPill
          active={statusFilter === 'success'}
          count={statusCounts.success}
          variant="success"
          onClick={() => setStatusFilter('success')}
        >
          Success
        </FilterPill>
        <FilterPill
          active={statusFilter === 'failed'}
          count={statusCounts.failed}
          variant="destructive"
          onClick={() => setStatusFilter('failed')}
        >
          Failed
        </FilterPill>
        <FilterPill
          active={statusFilter === 'running'}
          count={statusCounts.running}
          variant="info"
          onClick={() => setStatusFilter('running')}
        >
          Running
        </FilterPill>
      </FilterPills>

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg">Workflow Results ({results.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Result ID</TableHead>
                <TableHead>Workflow ID</TableHead>
                <TableHead>Workflow Name</TableHead>
                <TableHead>Execution Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total Left</TableHead>
                <TableHead className="text-right">Total Right</TableHead>
                <TableHead className="text-right">Fully Matched</TableHead>
                <TableHead className="text-right">Differences</TableHead>
                <TableHead className="text-right">Left Only</TableHead>
                <TableHead className="text-right">Right Only</TableHead>
                <TableHead className="text-right">Match %</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length > 0 ? (
                results.map((result) => (
                  <TableRow key={result.result_id}>
                    <TableCell className="font-medium">
                      <button
                        onClick={() => navigate(`/validation/results/${result.result_id}`)}
                        className="text-primary hover:underline cursor-pointer"
                      >
                        #{result.result_id}
                      </button>
                    </TableCell>
                    <TableCell className="font-medium">#{result.validation_id}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => navigate(`/validation/results/${result.result_id}`)}
                        className="font-medium text-primary hover:underline cursor-pointer text-left"
                      >
                        {(result as any).validation_name || 'N/A'}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(result.execution_timestamp)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(result.execution_status) as any}>
                        {result.execution_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{result.total_left}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{result.total_right}</TableCell>
                    <TableCell className="text-right font-semibold text-[hsl(var(--color-success))]">
                      {result.matched - result.differences}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={result.differences > 0 ? 'font-medium text-destructive' : 'text-muted-foreground'}>
                        {result.differences}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={result.left_only > 0 ? 'font-medium text-[hsl(var(--color-warning))]' : 'text-muted-foreground'}>
                        {result.left_only}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={result.right_only > 0 ? 'font-medium text-[hsl(var(--color-warning))]' : 'text-muted-foreground'}>
                        {result.right_only}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-semibold ${result.match_percentage >= 90 ? 'text-[hsl(var(--color-success))]' : 'text-[hsl(var(--color-warning))]'}`}>
                        {result.match_percentage.toFixed(2)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{result.execution_time_ms}ms</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/validation/results/${result.result_id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(result.result_id, 'all')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          CSV
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={14} className="h-32 text-center text-muted-foreground">
                    No results found{statusFilter !== 'all' && ` with status "${statusFilter}"`}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
    </ValidationLayout>
  );
}
