/**
 * Delete Folder Dialog Component
 * Handles folder deletion with options to move validations
 */

import { useState } from 'react';
import { AlertTriangle, Folder } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { useDeleteFolder, useFolders } from '@/api/validation/hooks';
import type { Folder as FolderType } from '@/types';

interface DeleteFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: FolderType | null;
}

export function DeleteFolderDialog({ open, onOpenChange, folder }: DeleteFolderDialogProps) {
  const { data: folders = [] } = useFolders();
  const deleteMutation = useDeleteFolder();
  const [moveToFolderId, setMoveToFolderId] = useState<string>('root');

  if (!folder) return null;

  const hasValidations = folder.validation_count && folder.validation_count > 0;
  const hasChildren = folder.children && folder.children.length > 0;

  const availableFolders = folders.filter((f) => f.folder_id !== folder.folder_id);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({
        id: folder.folder_id,
        moveValidationsTo: moveToFolderId === 'root' ? null : parseInt(moveToFolderId),
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to delete folder:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Folder
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{folder.folder_name}"?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning about children */}
          {hasChildren && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Warning:</strong> This folder contains subfolders. All subfolders and their contents will also be deleted.
              </AlertDescription>
            </Alert>
          )}

          {/* Validation count */}
          {hasValidations && (
            <Alert>
              <AlertDescription>
                This folder contains <strong>{folder.validation_count} validation(s)</strong>.
                Choose where to move them:
              </AlertDescription>
            </Alert>
          )}

          {/* Move validations option */}
          {hasValidations && (
            <div className="space-y-2">
              <Label htmlFor="move-to">Move Validations To</Label>
              <Select value={moveToFolderId} onValueChange={setMoveToFolderId}>
                <SelectTrigger id="move-to">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      Root (Uncategorized)
                    </div>
                  </SelectItem>
                  {availableFolders.map((f) => (
                    <SelectItem key={f.folder_id} value={f.folder_id.toString()}>
                      <div className="flex items-center gap-2">
                        <Folder
                          className="h-4 w-4"
                          style={{ color: f.color || undefined }}
                        />
                        {f.folder_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!hasValidations && !hasChildren && (
            <p className="text-sm text-muted-foreground">
              This folder is empty and will be permanently deleted.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Folder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
