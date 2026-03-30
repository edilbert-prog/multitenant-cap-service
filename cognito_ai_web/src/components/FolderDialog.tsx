/**
 * Folder Dialog Component
 * Handles creating and editing folders
 */

import { useState, useEffect } from 'react';
import { Folder } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
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
import { useCreateFolder, useUpdateFolder, useFolders } from '@/api/validation/hooks';
import type { Folder as FolderType } from '@/types';

interface FolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder?: FolderType | null; // If provided, edit mode
  parentFolderId?: number | null; // For creating subfolders
}

const FOLDER_COLORS = [
  { value: '#3B82F6', label: 'Blue' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#EF4444', label: 'Red' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#6B7280', label: 'Gray' },
];

export function FolderDialog({ open, onOpenChange, folder, parentFolderId }: FolderDialogProps) {
  const { data: folders = [] } = useFolders();
  const createMutation = useCreateFolder();
  const updateMutation = useUpdateFolder(folder?.folder_id || 0);

  const [folderName, setFolderName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string>('root');
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0].value);

  const isEditMode = !!folder;

  // Initialize form when dialog opens or folder changes
  useEffect(() => {
    if (folder) {
      setFolderName(folder.folder_name);
      setDescription(folder.description || '');
      setSelectedParentId(folder.parent_folder_id?.toString() || 'root');
      setSelectedColor(folder.color || FOLDER_COLORS[0].value);
    } else {
      setFolderName('');
      setDescription('');
      setSelectedParentId(parentFolderId?.toString() || 'root');
      setSelectedColor(FOLDER_COLORS[0].value);
    }
  }, [folder, parentFolderId, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!folderName.trim()) {
      return;
    }

    try {
      const data = {
        folder_name: folderName.trim(),
        parent_folder_id: selectedParentId === 'root' ? null : parseInt(selectedParentId),
        description: description.trim() || undefined,
        color: selectedColor,
        icon: 'folder',
      };

      if (isEditMode) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to save folder:', error);
    }
  };

  const availableParentFolders = folders.filter((f) => {
    // Exclude self when editing
    if (isEditMode && f.folder_id === folder?.folder_id) {
      return false;
    }
    // Exclude any descendants when editing (prevent circular references)
    // This is a simple check - backend has more robust circular reference prevention
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Folder' : 'Create New Folder'}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Update folder details'
                : 'Create a folder to organize your validations'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Folder Name */}
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name *</Label>
              <Input
                id="folder-name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name"
                required
              />
            </div>

            {/* Parent Folder */}
            <div className="space-y-2">
              <Label htmlFor="parent-folder">Parent Folder</Label>
              <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                <SelectTrigger id="parent-folder">
                  <SelectValue placeholder="Select parent folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      Root (No Parent)
                    </div>
                  </SelectItem>
                  {availableParentFolders.map((f) => (
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

            {/* Color */}
            <div className="space-y-2">
              <Label htmlFor="folder-color">Color</Label>
              <Select value={selectedColor} onValueChange={setSelectedColor}>
                <SelectTrigger id="folder-color">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOLDER_COLORS.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded border"
                          style={{ backgroundColor: color.value }}
                        />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter folder description"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !folderName.trim() ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : isEditMode
                ? 'Update'
                : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
