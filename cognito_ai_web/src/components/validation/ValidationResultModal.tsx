import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Eye, Edit } from 'lucide-react';
import FailedWorkflowUI from './FailedWorkflowUI';

interface ValidationResult {
  result_id: number;
  validation_id: number;
  validation_name?: string;
  execution_status: 'success' | 'failed';
  execution_time_ms: number;
  total_left: number;
  total_right: number;
  matched: number;
  left_only: number;
  right_only: number;
  differences: number;
  match_percentage: number;
  message?: string;
  error_code?: string;
}

interface ValidationResultModalProps {
  open: boolean;
  onClose: () => void;
  result: ValidationResult | null;
  validationError?: any; // validation_error object from summary_json
  errorMessage?: string;
}

export default function ValidationResultModal({
  open,
  onClose,
  result,
  validationError,
  errorMessage,
}: ValidationResultModalProps) {
  const navigate = useNavigate();

  if (!result) return null;

  const isSuccess = result.execution_status === 'success';
  const hasFailed = result.execution_status === 'failed';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSuccess ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Validation Completed Successfully
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-destructive" />
                Validation Failed
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Success Summary */}
          {isSuccess && (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Execution Time</p>
                      <p className="text-2xl font-bold">{result.execution_time_ms}ms</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Compared</p>
                      <p className="text-2xl font-bold">
                        {result.total_left.toLocaleString()} vs {result.total_right.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Match Rate</p>
                      <p className="text-2xl font-bold">{result.match_percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Fully Matched</p>
                    <p className="text-3xl font-bold text-green-600">
                      {(result.matched - result.differences).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Differences</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {result.differences.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Left Only</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {result.left_only.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Right Only</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {result.right_only.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button onClick={() => navigate(`/validation/results/${result.result_id}`)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Full Results
                </Button>
              </div>
            </>
          )}

          {/* Failed Validation UI */}
          {hasFailed && validationError && (
            <>
              <FailedWorkflowUI
                validationError={validationError}
                errorMessage={errorMessage || result.message || 'Validation failed'}
                validationId={result.validation_id}
              />

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button onClick={() => navigate(`/validation/edit/${result.validation_id}`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Workflow
                </Button>
              </div>
            </>
          )}

          {/* Generic Failed Message (for non-validation errors) */}
          {hasFailed && !validationError && (
            <>
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Error Message</p>
                      <p className="text-base font-medium text-destructive">
                        {result.message || 'An unknown error occurred'}
                      </p>
                    </div>
                    {result.error_code && (
                      <div>
                        <p className="text-sm text-muted-foreground">Error Code</p>
                        <Badge variant="destructive">{result.error_code}</Badge>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Execution Time</p>
                      <p className="text-base font-medium">{result.execution_time_ms}ms</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button onClick={() => navigate(`/validation/edit/${result.validation_id}`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Workflow
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
