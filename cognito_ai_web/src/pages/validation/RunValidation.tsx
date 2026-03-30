import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useValidations, useRunValidation, useFolderTree, useValidationResult } from '@/api/validation/hooks';
import ValidationLayout from './ValidationLayout';
import ValidationResultModal from '@/components/validation/ValidationResultModal';

export default function RunValidation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedValidationId, setSelectedValidationId] = useState<string>('');
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [completedResultId, setCompletedResultId] = useState<number | null>(null);

  const { data: allValidations, isLoading } = useValidations();
  const { data: folderTree = [] } = useFolderTree();
  const runValidation = useRunValidation();

  // Fetch full result (including summary_json.validation_error) after validation completes
  const { data: fullResult } = useValidationResult(completedResultId || 0);

  // Get folder filter from URL
  const folderId = searchParams.get('folder');
  const filteredFolderId = folderId ? parseInt(folderId) : null;

  // Filter validations based on folder parameter
  const validations = useMemo(() => {
    if (filteredFolderId === null) {
      return allValidations;
    }
    return allValidations?.filter(v => v.folder_id === filteredFolderId);
  }, [allValidations, filteredFolderId]);

  // Find folder name for display
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

  const handleRunValidation = async () => {
    if (!selectedValidationId) return;

    try {
      const result = await runValidation.mutateAsync(parseInt(selectedValidationId));
      // Show modal with results instead of navigating
      setCompletedResultId(result.result_id);
      setResultModalOpen(true);
    } catch (error) {
      console.error('Failed to run validation:', error);
    }
  };

  const handleCloseModal = () => {
    setResultModalOpen(false);
    setCompletedResultId(null);
  };

  return (
    <ValidationLayout>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Run Workflow</h1>
          {selectedFolderName && (
            <p className="text-muted-foreground mt-2">
              Workflows in folder: <span className="font-medium">{selectedFolderName}</span>
            </p>
          )}
        </div>
        {filteredFolderId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/validation/run')}
          >
            Clear Filter
          </Button>
        )}
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Execute Workflow</CardTitle>
          <CardDescription>
            Select a workflow to run from the list below. You can also run workflows directly from the Workflows page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="info">
            <AlertDescription>
              Running a workflow will compare data from the configured sources and generate a new result report.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="validation-select">Select Workflow</Label>
            {isLoading ? (
              <div className="flex items-center justify-center h-10 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <Select value={selectedValidationId} onValueChange={setSelectedValidationId}>
                <SelectTrigger id="validation-select">
                  <SelectValue placeholder="Choose a workflow to run..." />
                </SelectTrigger>
                <SelectContent>
                  {validations?.map((validation) => (
                    <SelectItem key={validation.validation_id} value={validation.validation_id.toString()}>
                      {validation.validation_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-sm text-muted-foreground">
              {validations?.length || 0} workflow(s) available
            </p>
          </div>

          <Button
            size="lg"
            disabled={!selectedValidationId || runValidation.isPending}
            onClick={handleRunValidation}
          >
            {runValidation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Workflow...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Workflow
              </>
            )}
          </Button>

          {runValidation.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to run workflow. Please try again.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Validation Result Modal */}
      <ValidationResultModal
        open={resultModalOpen}
        onClose={handleCloseModal}
        result={fullResult || null}
        validationError={fullResult?.summary_json?.validation_error}
        errorMessage={fullResult?.error_message}
      />
    </div>
    </ValidationLayout>
  );
}
