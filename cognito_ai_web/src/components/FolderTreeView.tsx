/**
 * Folder Tree View Component
 * Displays validations organized in a hierarchical folder structure
 */

import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, MoreVertical, Plus, MoveRight } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useFolderTree, useValidations } from '@/api/validation/hooks';
import type { Folder as FolderType, Validation } from '@/types';
import { useNavigate } from 'react-router-dom';

interface FolderTreeViewProps {
  onCreateFolder?: (parentId?: number | null) => void;
  onRenameFolder?: (folder: FolderType) => void;
  onDeleteFolder?: (folder: FolderType) => void;
  onMoveValidation?: (validation: Validation, targetFolderId: number | null) => void;
}

export function FolderTreeView({
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveValidation,
}: FolderTreeViewProps) {
  const { data: folderTree = [], isLoading: foldersLoading } = useFolderTree();
  const { data: validations = [], isLoading: validationsLoading } = useValidations();
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  // Group validations by folder
  const validationsByFolder = useMemo(() => {
    const grouped = new Map<number | null, Validation[]>();

    validations.forEach((validation) => {
      const folderId = validation.folder_id || null;
      if (!grouped.has(folderId)) {
        grouped.set(folderId, []);
      }
      grouped.get(folderId)!.push(validation);
    });

    return grouped;
  }, [validations]);

  // Root level validations (no folder)
  const rootValidations = validationsByFolder.get(null) || [];

  const toggleFolder = (folderId: number) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  // Helper function to get all folders in a flat list
  const getAllFoldersFlat = (folders: FolderType[]): FolderType[] => {
    const result: FolderType[] = [];
    const traverse = (folders: FolderType[]) => {
      folders.forEach(folder => {
        result.push(folder);
        if (folder.children) {
          traverse(folder.children);
        }
      });
    };
    traverse(folders);
    return result;
  };

  const allFolders = useMemo(() => getAllFoldersFlat(folderTree), [folderTree]);

  const renderValidation = (validation: Validation) => {
    const currentFolderId = validation.folder_id;

    return (
      <div
        key={validation.validation_id}
        className="flex items-center gap-2 py-2 px-3 hover:bg-accent rounded-md cursor-pointer group"
        onClick={() => navigate(`/validation/workflows/${validation.validation_id}/edit`)}
      >
        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="flex-1 text-sm truncate">{validation.validation_name}</span>
        <Badge variant={validation.status === 'active' ? 'default' : 'secondary'} className="text-xs">
          {validation.status}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              navigate(`/validation/workflows/${validation.validation_id}/edit`);
            }}>
              View Details
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Move to Folder submenu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <MoveRight className="h-3 w-3 mr-2" />
                Move to Folder
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {/* Move to Root */}
                {currentFolderId !== null && (
                  <>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onMoveValidation?.(validation, null);
                    }}>
                      <Folder className="h-3 w-3 mr-2" />
                      Root (No Folder)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* List all folders */}
                {allFolders.length === 0 ? (
                  <DropdownMenuItem disabled>
                    No folders available
                  </DropdownMenuItem>
                ) : (
                  allFolders.map((folder) => (
                    <DropdownMenuItem
                      key={folder.folder_id}
                      disabled={folder.folder_id === currentFolderId}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveValidation?.(validation, folder.folder_id);
                      }}
                    >
                      <Folder
                        className="h-3 w-3 mr-2"
                        style={{ color: folder.color || undefined }}
                      />
                      {folder.folder_name}
                      {folder.folder_id === currentFolderId && ' (current)'}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  const renderFolder = (folder: FolderType, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.folder_id);
    const folderValidations = validationsByFolder.get(folder.folder_id) || [];
    const hasChildren = (folder.children && folder.children.length > 0) || folderValidations.length > 0;
    const Icon = isExpanded ? FolderOpen : Folder;

    return (
      <div key={folder.folder_id} className="select-none">
        {/* Folder Header */}
        <div
          className="flex items-center gap-2 py-2 px-3 hover:bg-accent rounded-md cursor-pointer group"
          style={{ paddingLeft: `${level * 16 + 12}px` }}
        >
          {/* Expand/Collapse */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.folder_id);
              }}
              className="h-4 w-4 hover:bg-accent-foreground/10 rounded flex items-center justify-center"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
          {!hasChildren && <div className="h-4 w-4" />}

          {/* Folder Icon */}
          <Icon
            className="h-4 w-4 shrink-0"
            style={{ color: folder.color || undefined }}
          />

          {/* Folder Name */}
          <span className="flex-1 font-medium text-sm truncate">{folder.folder_name}</span>

          {/* Validation Count */}
          {folder.validation_count !== undefined && folder.validation_count > 0 && (
            <Badge variant="outline" className="text-xs">
              {folder.validation_count}
            </Badge>
          )}

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onCreateFolder?.(folder.folder_id);
              }}>
                <Plus className="h-3 w-3 mr-2" />
                New Subfolder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onRenameFolder?.(folder);
              }}>
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFolder?.(folder);
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Expanded Content */}
        {isExpanded && hasChildren && (
          <div className="mt-1">
            {/* Child Folders */}
            {folder.children?.map((child) => renderFolder(child, level + 1))}

            {/* Validations in this folder */}
            {folderValidations.length > 0 && (
              <div style={{ paddingLeft: `${(level + 1) * 16 + 12}px` }}>
                {folderValidations.map(renderValidation)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (foldersLoading || validationsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading folder structure...</div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Root Level Folders */}
      {folderTree.map((folder) => renderFolder(folder, 0))}

      {/* Root Level Validations (no folder) */}
      {rootValidations.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-semibold text-muted-foreground px-3 py-2">
            Uncategorized
          </div>
          {rootValidations.map(renderValidation)}
        </div>
      )}

      {/* Empty State */}
      {folderTree.length === 0 && rootValidations.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Folder className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No folders or validations yet</p>
          <p className="text-sm mt-1">Create a folder to get started</p>
        </div>
      )}
    </div>
  );
}
