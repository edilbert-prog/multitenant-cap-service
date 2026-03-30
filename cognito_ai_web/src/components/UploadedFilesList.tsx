import { useState, useMemo } from 'react';
import { FileSpreadsheet, Trash2, RefreshCw, ChevronDown, ChevronRight, Upload, AlertTriangle, File } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useUploadedDatasources, useReplaceUploadedFile, useDeleteUploadedDatasource, useValidation } from '@/api/validation/hooks';
import { FileUploadDialog } from './FileUploadDialog';
import type { TransformOperation } from '@/types/validation';

interface UploadedFilesListProps {
  validationId: number;
}

interface FileGroup {
  filename: string;
  file_type: string;
  upload_timestamp: string;
  totalRows: number;
  sheets: Array<{
    datasource_id: number;
    datasource_name: string;
    sheet_name?: string;
    temp_table_name: string;
    row_count: number;
    column_count: number;
    columns: string[];
  }>;
}

/**
 * Extract all datasource IDs used in a pipeline
 */
function extractUsedDatasourceIds(operations: TransformOperation[] | undefined): Set<string> {
  const usedIds = new Set<string>();
  if (!operations) return usedIds;

  operations.forEach(op => {
    if (op.operation === 'join') {
      usedIds.add(op.left);
      usedIds.add(op.right);
    } else if (op.operation === 'filter' && op.source_id) {
      usedIds.add(op.source_id);
    } else if (op.operation === 'lookup') {
      if (op.source_id) usedIds.add(op.source_id);
      usedIds.add(op.lookup_source_id);
    }
  });

  return usedIds;
}

export function UploadedFilesList({ validationId }: UploadedFilesListProps) {
  const { data: datasources = [], isLoading } = useUploadedDatasources(validationId);
  const { data: validation } = useValidation(validationId);
  const replaceMutation = useReplaceUploadedFile();
  const deleteMutation = useDeleteUploadedDatasource();

  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [expandedSheets, setExpandedSheets] = useState<Set<number>>(new Set());
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileGroup | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [replaceResult, setReplaceResult] = useState<any>(null);
  const [schemaChanges, setSchemaChanges] = useState<{
    sheetsAdded: string[];
    sheetsRemoved: string[];
    columnsChanged: Array<{ sheet: string; added: string[]; removed: string[] }>;
  } | null>(null);

  // Group datasources by filename
  const fileGroups = useMemo((): FileGroup[] => {
    const groups = new Map<string, FileGroup>();

    datasources.forEach((ds) => {
      if (!groups.has(ds.filename)) {
        groups.set(ds.filename, {
          filename: ds.filename,
          file_type: ds.file_type,
          upload_timestamp: ds.upload_timestamp,
          totalRows: 0,
          sheets: [],
        });
      }

      const group = groups.get(ds.filename)!;
      group.totalRows += ds.row_count;
      group.sheets.push({
        datasource_id: ds.datasource_id,
        datasource_name: ds.datasource_name,
        temp_table_name: ds.temp_table_name,
        row_count: ds.row_count,
        column_count: ds.column_count,
        columns: ds.columns || [],
      });
    });

    return Array.from(groups.values());
  }, [datasources]);

  const toggleFileExpand = (filename: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(filename)) {
      newExpanded.delete(filename);
    } else {
      newExpanded.add(filename);
    }
    setExpandedFiles(newExpanded);
  };

  const toggleSheetExpand = (datasourceId: number) => {
    const newExpanded = new Set(expandedSheets);
    if (newExpanded.has(datasourceId)) {
      newExpanded.delete(datasourceId);
    } else {
      newExpanded.add(datasourceId);
    }
    setExpandedSheets(newExpanded);
  };

  const handleReplaceClick = (fileGroup: FileGroup) => {
    setSelectedFile(fileGroup);
    setReplaceDialogOpen(true);
    setReplaceResult(null);
    setSchemaChanges(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewFile(file);
    }
  };

  const handleReplace = async () => {
    if (!newFile || !selectedFile) return;

    try {
      const result = await replaceMutation.mutateAsync({
        validationId,
        oldFilename: selectedFile.filename,
        file: newFile,
      });

      setReplaceResult(result);

      // Extract datasources used in validation pipelines
      const usedDatasourceIds = new Set<string>();

      // Add datasources from left_sources and right_sources
      validation?.left_sources?.forEach(src => {
        if (src.source_id) usedDatasourceIds.add(src.source_id);
      });
      validation?.right_sources?.forEach(src => {
        if (src.source_id) usedDatasourceIds.add(src.source_id);
      });

      // Add datasources from left_pipeline and right_pipeline operations
      const leftPipelineIds = extractUsedDatasourceIds(validation?.left_pipeline?.operations);
      const rightPipelineIds = extractUsedDatasourceIds(validation?.right_pipeline?.operations);
      leftPipelineIds.forEach(id => usedDatasourceIds.add(id));
      rightPipelineIds.forEach(id => usedDatasourceIds.add(id));

      // Calculate schema changes by comparing sheet structure, not names
      // Extract sheet names (e.g., "Sheet1" from "Ecommerce - Sheet1")
      const extractSheetName = (datasourceName: string) => {
        const match = datasourceName.match(/ - (.+)$/);
        return match ? match[1] : datasourceName;
      };

      // Helper to check if a datasource is used in the validation
      // Match by checking if any used source references this file's datasources
      const isDatasourceUsed = (datasourceName: string): boolean => {
        // If no validation loaded or no sources defined, show all changes (safe default)
        if (!validation || usedDatasourceIds.size === 0) {
          return true;
        }

        // Check if this datasource is referenced in left_sources or right_sources
        const allSources = [
          ...(validation?.left_sources || []),
          ...(validation?.right_sources || [])
        ];

        // Match by uploaded_datasource_id - check if any source references a datasource from this file
        return allSources.some(src => {
          if (!src.uploaded_datasource_id) return false;

          // Check if this source's uploaded_datasource_id matches any datasource in the old file
          // (before replacement)
          return selectedFile.sheets.some(sheet =>
            sheet.datasource_id === src.uploaded_datasource_id
          );
        });
      };

      const oldSheetCount = selectedFile.sheets.length;
      const newSheetCount = result.datasources.length;

      // Build maps by sheet name (position) for comparison
      const oldSheetsMap = new Map(
        selectedFile.sheets.map(s => [extractSheetName(s.datasource_name), s])
      );
      const newSheetsMap = new Map(
        result.datasources.map((d: any) => [extractSheetName(d.datasource_name), d])
      );

      const oldSheetPositions = new Set(oldSheetsMap.keys());
      const newSheetPositions = new Set(newSheetsMap.keys());

      // Sheets that exist in new but not in old (by position/name)
      const sheetsAdded = Array.from(newSheetPositions)
        .filter(pos => !oldSheetPositions.has(pos))
        .map(pos => newSheetsMap.get(pos)!.datasource_name)
        .filter(name => isDatasourceUsed(name)); // Only show if used

      // Sheets that exist in old but not in new (by position/name)
      const sheetsRemoved = Array.from(oldSheetPositions)
        .filter(pos => !newSheetPositions.has(pos))
        .map(pos => oldSheetsMap.get(pos)!.datasource_name)
        .filter(name => isDatasourceUsed(name)); // Only show if used

      // Calculate column changes for sheets that exist in both
      const columnsChanged: Array<{ sheet: string; added: string[]; removed: string[] }> = [];

      Array.from(newSheetPositions)
        .filter(pos => oldSheetPositions.has(pos))
        .forEach(pos => {
          const oldSheet = oldSheetsMap.get(pos)!;
          const newSheet = newSheetsMap.get(pos)!;

          // Only check column changes for datasources used in the validation
          if (!isDatasourceUsed(newSheet.datasource_name)) {
            return;
          }

          const oldColumns = new Set(oldSheet.columns || []);
          const newColumns = new Set(newSheet.columns || []);

          const added = Array.from(newColumns).filter(col => !oldColumns.has(col));
          const removed = Array.from(oldColumns).filter(col => !newColumns.has(col));

          if (added.length > 0 || removed.length > 0) {
            columnsChanged.push({
              sheet: newSheet.datasource_name,
              added,
              removed,
            });
          }
        });

      // Only show schema changes if there are relevant changes to datasources used in the validation
      if (sheetsAdded.length > 0 || sheetsRemoved.length > 0 || columnsChanged.length > 0) {
        setSchemaChanges({ sheetsAdded, sheetsRemoved, columnsChanged });
      } else {
        // Check if this file is used at all
        const fileIsUsed = selectedFile.sheets.some(sheet => isDatasourceUsed(sheet.datasource_name));
        if (!fileIsUsed && validation) {
          // File replaced successfully but not used in validation - no need for warnings
          console.log('File replaced - not used in this validation');
        }
      }
    } catch (error: any) {
      console.error('Replace failed:', error);
    }
  };

  const handleDeleteFile = async (fileGroup: FileGroup) => {
    if (confirm(`Are you sure you want to delete "${fileGroup.filename}" and all its sheets? This action cannot be undone.`)) {
      try {
        // Delete all sheets from this file
        for (const sheet of fileGroup.sheets) {
          await deleteMutation.mutateAsync(sheet.datasource_id);
        }
      } catch (error: any) {
        console.error('Delete failed:', error);
      }
    }
  };

  const handleCloseReplaceDialog = () => {
    setReplaceDialogOpen(false);
    setSelectedFile(null);
    setNewFile(null);
    setReplaceResult(null);
    setSchemaChanges(null);
    replaceMutation.reset();
  };

  const handleUploadComplete = () => {
    // Upload creates datasources which will auto-refresh via useUploadedDatasources hook
    // Dialog is already closed by FileUploadDialog, no need to close again
    // Just let the React Query cache invalidation trigger a refresh
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading uploaded files...</div>
      </div>
    );
  }

  if (fileGroups.length === 0) {
    return (
      <>
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <FileSpreadsheet className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No files uploaded yet</p>
          <p className="text-sm mt-1 mb-3">Upload an Excel or CSV file to get started</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUploadDialogOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        </div>

        <FileUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          onUploadComplete={handleUploadComplete}
          validationId={validationId}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-end mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setUploadDialogOpen(true)}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload File
        </Button>
      </div>

      <div className="space-y-3">
        {fileGroups.map((fileGroup) => (
          <Card key={fileGroup.filename} className="p-4">
            <div className="flex items-start gap-3">
              {/* File Icon */}
              <File className="h-5 w-5 text-blue-500 mt-1 shrink-0" />

              {/* File Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{fileGroup.filename}</h4>
                    <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{fileGroup.sheets.length} sheet{fileGroup.sheets.length !== 1 ? 's' : ''}</span>
                      <span>{fileGroup.totalRows.toLocaleString()} total rows</span>
                      <span>Uploaded {formatTimestamp(fileGroup.upload_timestamp)}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {fileGroup.file_type === 'csv' ? 'CSV' : 'Excel'}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleFileExpand(fileGroup.filename)}
                  >
                    {expandedFiles.has(fileGroup.filename) ? (
                      <>
                        <ChevronDown className="h-3.5 w-3.5 mr-1" />
                        Hide Sheets
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-3.5 w-3.5 mr-1" />
                        Show Sheets
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReplaceClick(fileGroup)}
                    disabled={replaceMutation.isPending || deleteMutation.isPending}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    Replace File
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteFile(fileGroup)}
                    disabled={replaceMutation.isPending || deleteMutation.isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                </div>

                {/* Sheets (collapsible) */}
                {expandedFiles.has(fileGroup.filename) && (
                  <div className="mt-4 space-y-3 pl-4 border-l-2 border-blue-200">
                    {fileGroup.sheets.map((sheet) => (
                      <div key={sheet.datasource_id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-sm">{sheet.datasource_name}</h5>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {sheet.row_count.toLocaleString()} rows • {sheet.column_count} columns
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSheetExpand(sheet.datasource_id)}
                            className="text-xs"
                          >
                            {expandedSheets.has(sheet.datasource_id) ? (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Hide Columns
                              </>
                            ) : (
                              <>
                                <ChevronRight className="h-3 w-3 mr-1" />
                                Show Columns
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Columns */}
                        {expandedSheets.has(sheet.datasource_id) && sheet.columns.length > 0 && (
                          <div className="p-2 bg-muted rounded-md">
                            <div className="flex flex-wrap gap-1">
                              {sheet.columns.map((column, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {column}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Replace Dialog */}
      <Dialog open={replaceDialogOpen} onOpenChange={handleCloseReplaceDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Replace File</DialogTitle>
            <DialogDescription>
              Upload a new file to replace "{selectedFile?.filename}". All sheets will be replaced with the new file's sheets.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* File Selection */}
            {!replaceResult && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="replace-file">New Data File</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="replace-file"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileSelect}
                      className="flex-1"
                    />
                    {newFile && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileSpreadsheet className="h-4 w-4" />
                        {newFile.name}
                      </div>
                    )}
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> This will replace the entire file including all sheets. Schema changes (sheets added/removed, columns changed) will be shown after upload.
                  </AlertDescription>
                </Alert>

                {replaceMutation.isError && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Replace failed: {(replaceMutation.error as any)?.message || 'Unknown error'}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {/* Replace Result */}
            {replaceResult && (
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    <strong>File replaced successfully!</strong> Created {replaceResult.datasources.length} datasource(s).
                  </AlertDescription>
                </Alert>

                {/* No Schema Changes Info */}
                {!schemaChanges && validation && (
                  <Alert>
                    <AlertDescription>
                      No schema changes detected for datasources used in this validation. Unused sheets are ignored.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Schema Changes Warning */}
                {schemaChanges && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="space-y-3">
                      <strong>Schema Changes Detected (datasources used in this validation):</strong>

                      {schemaChanges.sheetsAdded.length > 0 && (
                        <div>
                          <span className="font-medium text-green-700">Sheets Added ({schemaChanges.sheetsAdded.length}):</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {schemaChanges.sheetsAdded.map((sheet, idx) => (
                              <Badge key={idx} variant="outline" className="text-green-700">
                                +{sheet}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {schemaChanges.sheetsRemoved.length > 0 && (
                        <div>
                          <span className="font-medium text-red-700">Sheets Removed ({schemaChanges.sheetsRemoved.length}):</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {schemaChanges.sheetsRemoved.map((sheet, idx) => (
                              <Badge key={idx} variant="outline" className="text-red-700">
                                -{sheet}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {schemaChanges.columnsChanged.length > 0 && (
                        <div className="space-y-2">
                          <span className="font-medium">Column Changes:</span>
                          {schemaChanges.columnsChanged.map((change, idx) => (
                            <div key={idx} className="pl-3 border-l-2 border-yellow-300">
                              <div className="font-medium text-sm">{change.sheet}</div>
                              {change.added.length > 0 && (
                                <div className="text-xs mt-1">
                                  <span className="text-green-700">Added: </span>
                                  {change.added.join(', ')}
                                </div>
                              )}
                              {change.removed.length > 0 && (
                                <div className="text-xs mt-1">
                                  <span className="text-red-700">Removed: </span>
                                  {change.removed.join(', ')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-sm mt-2">
                        Please review your validation configuration to ensure it still works correctly with the new schema.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Updated File Stats */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium">Updated File Information</h4>
                  {replaceResult.datasources.map((ds: any, idx: number) => (
                    <div key={idx} className="p-3 bg-muted rounded space-y-1 text-sm">
                      <div className="font-medium">{ds.datasource_name}</div>
                      <div className="text-muted-foreground">
                        {ds.row_count?.toLocaleString()} rows • {ds.column_count} columns
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseReplaceDialog}>
              {replaceResult ? 'Done' : 'Cancel'}
            </Button>
            {!replaceResult && (
              <Button
                onClick={handleReplace}
                disabled={!newFile || replaceMutation.isPending}
              >
                {replaceMutation.isPending ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Replacing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Replace File
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <FileUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadComplete={handleUploadComplete}
        validationId={validationId}
      />
    </>
  );
}
