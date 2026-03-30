import { useState } from 'react';
import { Upload, FileSpreadsheet, Check } from 'lucide-react';
import { Button } from './ui/button';
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
import { Alert, AlertDescription } from './ui/alert';
import { useUploadExcel } from '@/api/validation/hooks';
import { Badge } from './ui/badge';

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: () => void; // Simplified - just refresh the list
  validationId: number;
}

export function FileUploadDialog({ open, onOpenChange, onUploadComplete, validationId }: FileUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const uploadMutation = useUploadExcel();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    console.log('[FileUploadDialog] Uploading all sheets with validationId:', validationId);

    try {
      const result = await uploadMutation.mutateAsync({
        file: selectedFile,
        validationId,
        datasourceName: undefined, // Backend will auto-name based on sheet names
      });

      setUploadResult(result);
    } catch (error: any) {
      console.error('Upload failed:', error);
    }
  };

  const handleConfirm = () => {
    if (uploadResult) {
      // Reset local state first, then close
      setSelectedFile(null);
      setUploadResult(null);
      uploadMutation.reset();

      // Close dialog and notify parent
      onOpenChange(false);
      onUploadComplete();
    }
  };

  const handleClose = () => {
    // Only called when user cancels or clicks outside
    setSelectedFile(null);
    setUploadResult(null);
    uploadMutation.reset();
    onOpenChange(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Data File</DialogTitle>
          <DialogDescription>
            Upload an Excel (.xlsx, .xls) or CSV (.csv) file to use as a data source in your validation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Selection */}
          {!uploadResult && (
            <>
              <div className="space-y-2">
                <Label htmlFor="file">Data File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="flex-1"
                  />
                  {selectedFile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileSpreadsheet className="h-4 w-4" />
                      {formatFileSize(selectedFile.size)}
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Excel files: All sheets uploaded as separate datasources. CSV files: Single datasource.
                </p>
              </div>

              {uploadMutation.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Upload failed: {(uploadMutation.error as any)?.message || 'Unknown error'}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {/* Upload Result - All Sheets */}
          {uploadResult && (
            <div className="space-y-4">
              <Alert>
                <Check className="h-4 w-4" />
                <AlertDescription>
                  <strong>Upload successful!</strong> Created {uploadResult.sheet_count} datasource(s) from {uploadResult.filename}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>{uploadResult.file_type === 'csv' ? 'CSV Data' : 'Sheets Loaded'}</Label>
                <div className="border rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
                  {uploadResult.datasources?.map((ds: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                      <FileSpreadsheet className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{ds.datasource_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {ds.sheet_name ? `${ds.sheet_name} • ` : ''}{ds.column_count} columns • {ds.row_count?.toLocaleString()} rows
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                          {ds.temp_table_name}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {uploadResult.file_type === 'csv' ? 'CSV' : `Sheet ${idx + 1}`}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  {uploadResult.file_type === 'csv'
                    ? 'CSV file is now available as a datasource in your validation. Click "Done" to continue.'
                    : 'All sheets are now available as datasources in your validation. Click "Done" to continue.'}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {!uploadResult ? (
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload File
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleConfirm}>
              <Check className="mr-2 h-4 w-4" />
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
