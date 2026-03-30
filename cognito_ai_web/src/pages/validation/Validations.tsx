import { useState, useMemo } from 'react';
import { useValidations, useRunValidation, useDeleteValidation, useCreateValidation } from '@/api/validation/hooks';
import type { Validation } from '@/types/validation';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Play, Pencil, Trash2, History, Loader2, List, FolderTree, FolderPlus } from 'lucide-react';
import ValidationLayout from './ValidationLayout';
import { FolderTreeView } from '@/components/FolderTreeView';
import { FolderDialog } from '@/components/FolderDialog';
import { DeleteFolderDialog } from '@/components/DeleteFolderDialog';
import { useMoveValidationToFolder, useFolders, useFolderTree } from '@/api/validation/hooks';
import type { Folder } from '@/types';

type ViewMode = 'table' | 'folder';

export default function Validations() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: validations = [], isLoading: loading, error } = useValidations();
  const { data: folders = [] } = useFolders();
  const { data: folderTree = [] } = useFolderTree();
  const runValidationMutation = useRunValidation();
  const deleteValidationMutation = useDeleteValidation();
  const createValidationMutation = useCreateValidation();
  const moveValidationMutation = useMoveValidationToFolder();

  // Get folder filter from URL
  const folderFilter = searchParams.get('folder');
  const filteredFolderId = folderFilter ? parseInt(folderFilter) : null;

  // Filter validations based on folder parameter
  const filteredValidations = useMemo(() => {
    if (filteredFolderId === null) {
      return validations;
    }
    return validations.filter(v => v.folder_id === filteredFolderId);
  }, [validations, filteredFolderId]);

  // Find the folder name for display
  const selectedFolderName = useMemo(() => {
    if (filteredFolderId === null) return null;
    const findFolder = (folders: any[]): string | null => {
      for (const folder of folders) {
        if (folder.folder_id === filteredFolderId) {
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
  }, [folderTree, filteredFolderId]);

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newValidationName, setNewValidationName] = useState('');
  const [newValidationDescription, setNewValidationDescription] = useState('');
  const [newValidationFolderId, setNewValidationFolderId] = useState<string>('root');
  const [createError, setCreateError] = useState('');
  const [runningValidationId, setRunningValidationId] = useState<number | null>(null);

  // Folder management state
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [showDeleteFolderDialog, setShowDeleteFolderDialog] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [folderDialogParentId, setFolderDialogParentId] = useState<number | null>(null);

  const handleRunValidation = async (id: number) => {
    setRunningValidationId(id);
    try {
      const result = await runValidationMutation.mutateAsync(id);
      alert(`Workflow completed! Match percentage: ${result.match_percentage.toFixed(2)}%`);
      navigate(`/validation/results/${result.result_id}`);
    } catch (err: any) {
      alert(`Workflow failed: ${err.message}`);
    } finally {
      setRunningValidationId(null);
    }
  };

  const handleDeleteValidation = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete workflow "${name}"?`)) {
      try {
        await deleteValidationMutation.mutateAsync(id);
      } catch (err: any) {
        alert(`Failed to delete workflow: ${err.message}`);
      }
    }
  };

  const handleCreateValidation = () => {
    setShowCreateDialog(true);
    setNewValidationName('');
    setNewValidationDescription('');
    setNewValidationFolderId('root');
    setCreateError('');
  };

  const handleConfirmCreate = async () => {
    setCreateError('');

    if (!newValidationName.trim()) {
      setCreateError('Workflow name is required');
      return;
    }

    try {
      // Create validation with minimal data
      const result = await createValidationMutation.mutateAsync({
        validation_name: newValidationName,
        description: newValidationDescription,
        folder_id: newValidationFolderId === 'root' ? null : parseInt(newValidationFolderId),
        left_sources: [],
        right_sources: [],
        left_pipeline: null,
        right_pipeline: null,
        key_fields: [],
        compare_fields: [],
        match_strategy: 'exact',
        status: 'active',
      } as any);

      setShowCreateDialog(false);

      // Navigate to the full editor with the new ID
      navigate(`/validation/workflows/${result.validation_id}/edit`);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create workflow');
    }
  };

  const handleEditValidation = (id: number) => {
    navigate(`/validation/workflows/${id}/edit`);
  };

  // Folder handlers
  const handleCreateFolder = (parentId?: number | null) => {
    setSelectedFolder(null);
    setFolderDialogParentId(parentId || null);
    setShowFolderDialog(true);
  };

  const handleRenameFolder = (folder: Folder) => {
    setSelectedFolder(folder);
    setFolderDialogParentId(null);
    setShowFolderDialog(true);
  };

  const handleDeleteFolder = (folder: Folder) => {
    setSelectedFolder(folder);
    setShowDeleteFolderDialog(true);
  };

  const handleMoveValidation = async (validation: Validation, targetFolderId: number | null) => {
    try {
      await moveValidationMutation.mutateAsync({
        validationId: validation.validation_id,
        folderId: targetFolderId,
      });
    } catch (error: any) {
      alert(`Failed to move validation: ${error.message}`);
    }
  };

  // Get pipeline summary for display
  const getPipelineSummary = (pipeline: any) => {
    if (!pipeline || !pipeline.operations || pipeline.operations.length === 0) {
      return null;
    }

    const operations = pipeline.operations;
    const summary = operations.map((op: any) => {
      switch (op.operation) {
        case 'join':
          return 'JOIN';
        case 'filter':
          return 'FILTER';
        case 'consolidate':
          return 'CONSOLIDATE';
        case 'map':
          return 'MAP';
        default:
          return op.operation.toUpperCase();
      }
    }).join(' → ');

    return `${operations.length} ops: ${summary}`;
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
          <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground mt-2">Manage your validation workflows and configurations</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-r-none"
            >
              <List className="mr-2 h-4 w-4" />
              Table
            </Button>
            <Button
              variant={viewMode === 'folder' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('folder')}
              className="rounded-l-none"
            >
              <FolderTree className="mr-2 h-4 w-4" />
              Folders
            </Button>
          </div>

          {/* Create Folder (only in folder view) */}
          {viewMode === 'folder' && (
            <Button variant="outline" onClick={() => handleCreateFolder()}>
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </Button>
          )}

          {/* Create Workflow */}
          <Button onClick={handleCreateValidation}>
            <Plus className="mr-2 h-4 w-4" />
            New Workflow
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load validations'}
          </AlertDescription>
        </Alert>
      )}

      {/* Folder View */}
      {viewMode === 'folder' && (
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="text-lg">Folder Structure</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <FolderTreeView
              onCreateFolder={handleCreateFolder}
              onRenameFolder={handleRenameFolder}
              onDeleteFolder={handleDeleteFolder}
              onMoveValidation={handleMoveValidation}
            />
          </CardContent>
        </Card>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Validation Workflows ({filteredValidations.length})
              {selectedFolderName && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  in folder: <span className="font-medium">{selectedFolderName}</span>
                </span>
              )}
            </CardTitle>
            {filteredFolderId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/validation/workflows')}
              >
                Clear Filter
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Match Strategy</TableHead>
                <TableHead>Key Fields</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredValidations.length > 0 ? (
                filteredValidations.map((validation) => (
                  <TableRow key={validation.validation_id}>
                    <TableCell>{validation.validation_id}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{validation.validation_name}</div>
                        {validation.description && (
                          <div className="text-sm text-muted-foreground">{validation.description}</div>
                        )}
                        {/* Pipeline summaries */}
                        <div className="flex gap-3 text-xs mt-1.5">
                          {getPipelineSummary(validation.left_pipeline) && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-blue-600">Left:</span>
                              <span className="font-mono text-muted-foreground">
                                {getPipelineSummary(validation.left_pipeline)}
                              </span>
                            </div>
                          )}
                          {getPipelineSummary(validation.right_pipeline) && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-green-600">Right:</span>
                              <span className="font-mono text-muted-foreground">
                                {getPipelineSummary(validation.right_pipeline)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="info">{validation.match_strategy}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{validation.key_fields.join(', ')}</TableCell>
                    <TableCell>
                      <Badge variant={validation.status === 'active' ? 'success' : 'default'}>
                        {validation.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRunValidation(validation.validation_id)}
                          disabled={runningValidationId !== null || validation.status !== 'active'}
                          title="Run Workflow"
                        >
                          {runningValidationId === validation.validation_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const params = new URLSearchParams();
                            params.set('validation_id', validation.validation_id.toString());
                            if (filteredFolderId) {
                              params.set('folder', filteredFolderId.toString());
                            }
                            navigate(`/validation/results?${params.toString()}`);
                          }}
                          title="View Workflow Results"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditValidation(validation.validation_id)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleDeleteValidation(validation.validation_id, validation.validation_name)
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
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No workflows found. Create your first workflow to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Create Workflow Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Workflow</DialogTitle>
            <DialogDescription>
              Enter a name and description. You'll configure sources and pipeline on the next page.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {createError && (
              <Alert variant="destructive">
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Workflow Name *</Label>
              <Input
                id="name"
                value={newValidationName}
                onChange={(e) => setNewValidationName(e.target.value)}
                placeholder="e.g., Employee Data Validation Workflow"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newValidationName.trim()) {
                    handleConfirmCreate();
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={newValidationDescription}
                onChange={(e) => setNewValidationDescription(e.target.value)}
                placeholder="Describe what this validation does"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="folder">Folder (Optional)</Label>
              <Select value={newValidationFolderId} onValueChange={setNewValidationFolderId}>
                <SelectTrigger id="folder">
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">
                    <div className="flex items-center gap-2">
                      <FolderTree className="h-4 w-4" />
                      Root (No Folder)
                    </div>
                  </SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.folder_id} value={folder.folder_id.toString()}>
                      <div className="flex items-center gap-2">
                        <FolderTree
                          className="h-4 w-4"
                          style={{ color: folder.color || undefined }}
                        />
                        {folder.folder_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={createValidationMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmCreate}
              disabled={createValidationMutation.isPending || !newValidationName.trim()}
            >
              {createValidationMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create & Configure'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Folder Dialogs */}
      <FolderDialog
        open={showFolderDialog}
        onOpenChange={setShowFolderDialog}
        folder={selectedFolder}
        parentFolderId={folderDialogParentId}
      />

      <DeleteFolderDialog
        open={showDeleteFolderDialog}
        onOpenChange={setShowDeleteFolderDialog}
        folder={selectedFolder}
      />
    </div>
    </ValidationLayout>
  );
}
