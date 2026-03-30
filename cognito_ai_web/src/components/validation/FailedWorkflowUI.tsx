import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, CheckCircle, XCircle, Lightbulb } from 'lucide-react';

interface ValidationError {
  error_code: string;
  error_type: string;
  key_fields: string[];
  left_validation: {
    total_rows: number;
    unique_keys: number;
    duplicates: number;
    sample_duplicates?: Array<Record<string, any>>;
  };
  right_validation: {
    total_rows: number;
    unique_keys: number;
    duplicates: number;
    sample_duplicates?: Array<Record<string, any>>;
  };
  suggestion: string;
}

interface FailedWorkflowUIProps {
  validationError: ValidationError;
  errorMessage: string;
  validationId: number;
}

export default function FailedWorkflowUI({ validationError, errorMessage, validationId }: FailedWorkflowUIProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      <Alert variant="destructive">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle>Validation Failed</AlertTitle>
        <AlertDescription className="whitespace-pre-wrap">
          {errorMessage}
        </AlertDescription>
      </Alert>

      {/* Key Uniqueness Validation Card */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            {validationError.error_type}
          </CardTitle>
          <CardDescription>
            The selected key fields [{validationError.key_fields.join(', ')}] are not unique in both sources
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Key Uniqueness Metrics Table */}
          <div>
            <h4 className="font-semibold mb-3">Key Uniqueness Metrics</h4>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Total Rows</TableHead>
                    <TableHead className="text-right">Unique Keys</TableHead>
                    <TableHead className="text-right">Duplicates</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* LEFT Source */}
                  <TableRow>
                    <TableCell className="font-medium">Left Source</TableCell>
                    <TableCell className="text-right font-mono">
                      {validationError.left_validation.total_rows.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {validationError.left_validation.unique_keys.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={validationError.left_validation.duplicates > 0 ? 'destructive' : 'success'}>
                        {validationError.left_validation.duplicates.toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {validationError.left_validation.duplicates === 0 ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Unique
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Not Unique
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>

                  {/* RIGHT Source */}
                  <TableRow>
                    <TableCell className="font-medium">Right Source</TableCell>
                    <TableCell className="text-right font-mono">
                      {validationError.right_validation.total_rows.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {validationError.right_validation.unique_keys.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={validationError.right_validation.duplicates > 0 ? 'destructive' : 'success'}>
                        {validationError.right_validation.duplicates.toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {validationError.right_validation.duplicates === 0 ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Unique
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Not Unique
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Duplicate Samples Table - LEFT */}
          {validationError.left_validation.sample_duplicates && validationError.left_validation.sample_duplicates.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Left Source: Duplicate Key Examples (Top 5)</h4>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {validationError.key_fields.map(field => (
                        <TableHead key={field}>{field}</TableHead>
                      ))}
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationError.left_validation.sample_duplicates.map((sample, idx) => (
                      <TableRow key={idx}>
                        {validationError.key_fields.map(field => (
                          <TableCell key={field} className="font-mono">
                            {String(sample[field])}
                          </TableCell>
                        ))}
                        <TableCell className="text-right">
                          <Badge variant="destructive">{sample.dup_count}×</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Duplicate Samples Table - RIGHT */}
          {validationError.right_validation.sample_duplicates && validationError.right_validation.sample_duplicates.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Right Source: Duplicate Key Examples (Top 5)</h4>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {validationError.key_fields.map(field => (
                        <TableHead key={field}>{field}</TableHead>
                      ))}
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationError.right_validation.sample_duplicates.map((sample, idx) => (
                      <TableRow key={idx}>
                        {validationError.key_fields.map(field => (
                          <TableCell key={field} className="font-mono">
                            {String(sample[field])}
                          </TableCell>
                        ))}
                        <TableCell className="text-right">
                          <Badge variant="destructive">{sample.dup_count}×</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Suggestion Alert */}
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Suggested Fix</AlertTitle>
            <AlertDescription>
              {validationError.suggestion}
            </AlertDescription>
          </Alert>
        </CardContent>

        <CardFooter>
          <Button onClick={() => navigate(`/validation/edit/${validationId}`)}>
            Edit Key Fields
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
