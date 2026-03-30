import { useState, useMemo, startTransition, useDeferredValue } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useValidationResult, useValidationResultPaginated, useDownloadResultCsv, useValidation } from '@/api/validation/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Download, CheckCircle, AlertTriangle, XCircle, Loader2, ChevronLeft, ChevronRight, LayoutList, Workflow } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import ValidationLayout from './ValidationLayout';
import PipelineFlowDiagram from '@/components/validation/PipelineFlowDiagram';
import FailedWorkflowUI from '@/components/validation/FailedWorkflowUI';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ResultDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'fully_matched' | 'differences' | 'left_only' | 'right_only' | 'metrics'>('fully_matched');
  const [showOnlyMismatched, setShowOnlyMismatched] = useState(false);
  const [metricsView, setMetricsView] = useState<'flow' | 'table'>('flow');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50); // Reduced from 100 for better INP

  const resultId = id ? Number(id) : 0;
  const { data: result, isLoading: resultLoading, error: resultError } = useValidationResult(resultId);
  const { data: validation, isLoading: validationLoading } = useValidation(result?.validation_id || 0);
  const downloadMutation = useDownloadResultCsv();

  // Fetch paginated data only for the active tab (lazy loading)
  const {
    data: fullyMatchedData,
    isLoading: fullyMatchedLoading
  } = useValidationResultPaginated(resultId, 'fully_matched', page, pageSize, activeTab === 'fully_matched');

  const {
    data: differencesData,
    isLoading: differencesLoading
  } = useValidationResultPaginated(resultId, 'differences', page, pageSize, activeTab === 'differences');

  const {
    data: leftOnlyData,
    isLoading: leftOnlyLoading
  } = useValidationResultPaginated(resultId, 'left_only', page, pageSize, activeTab === 'left_only');

  const {
    data: rightOnlyData,
    isLoading: rightOnlyLoading
  } = useValidationResultPaginated(resultId, 'right_only', page, pageSize, activeTab === 'right_only');

  // Get the current tab's data
  const getCurrentTabData = () => {
    switch (activeTab) {
      case 'fully_matched': return fullyMatchedData;
      case 'differences': return differencesData;
      case 'left_only': return leftOnlyData;
      case 'right_only': return rightOnlyData;
    }
  };

  const getCurrentTabLoading = () => {
    switch (activeTab) {
      case 'fully_matched': return fullyMatchedLoading;
      case 'differences': return differencesLoading;
      case 'left_only': return leftOnlyLoading;
      case 'right_only': return rightOnlyLoading;
    }
  };

  const currentTabData = getCurrentTabData();
  const currentTabLoading = getCurrentTabLoading();

  // Defer expensive table rendering for better INP
  const deferredFullyMatchedData = useDeferredValue(fullyMatchedData);
  const deferredDifferencesData = useDeferredValue(differencesData);
  const deferredLeftOnlyData = useDeferredValue(leftOnlyData);
  const deferredRightOnlyData = useDeferredValue(rightOnlyData);

  const loading = resultLoading || validationLoading;
  const error = resultError;

  // Reset page when changing tabs (using startTransition for non-blocking)
  const handleTabChange = (newTab: string) => {
    startTransition(() => {
      setActiveTab(newTab as typeof activeTab);
      setPage(1);
    });
  };

  // Get key_fields and compare_fields from validation
  const keyFields = validation?.key_fields || [];
  const compareFields = validation?.compare_fields || [];

  // Union of key and compare fields, with key fields first
  const displayColumns = [...new Set([...keyFields, ...compareFields])];

  // Memoized column calculation helper
  const calculateColumns = useMemo(() => {
    return (data: any[] | undefined) => {
      if (!data || data.length === 0) return { allColumns: [], leftColumns: [], rightColumns: [], isFlatFormat: false };

      const firstRecord = data[0];
      const isFlatFormat = !firstRecord.left_record && !firstRecord.right_record;

      let allColumns: string[];
      let leftColumns: string[];
      let rightColumns: string[];

      if (isFlatFormat) {
        // SQL comparison format - infer from column names
        allColumns = Object.keys(firstRecord).filter(col => col !== 'has_differences'); // Keep id column
        leftColumns = allColumns.filter(col => !col.startsWith('right_'));
        rightColumns = allColumns.filter(col => col.startsWith('right_')).map(col => col.replace('right_', ''));
        allColumns = leftColumns; // Show only left columns in header (right_ columns are conflicts)
      } else {
        // In-memory comparison format
        leftColumns = Object.keys(firstRecord.left_record || {});
        rightColumns = Object.keys(firstRecord.right_record || {});
        allColumns = [...new Set([...leftColumns, ...rightColumns])];
      }

      // Filter columns to show only key_fields + compare_fields (preserves order)
      if (displayColumns.length > 0) {
        allColumns = displayColumns.filter(col => allColumns.includes(col));
      }

      return { allColumns, leftColumns, rightColumns, isFlatFormat };
    };
  }, [displayColumns]);

  // Memoized mismatched columns finder for differences tab
  const getMismatchedColumns = useMemo(() => {
    return (data: any[] | undefined, allColumns: string[]) => {
      if (!data || data.length === 0) return new Set<string>();

      const columnsWithMismatches = new Set<string>();

      data.forEach(row => {
        allColumns.forEach(col => {
          const hasRightVersion = row.hasOwnProperty(`right_${col}`);
          if (hasRightVersion) {
            const leftValue = row[col];
            const rightValue = row[`right_${col}`];
            if (leftValue !== rightValue) {
              columnsWithMismatches.add(col);
            }
          }
        });
      });

      return columnsWithMismatches;
    };
  }, []);

  const handleDownload = async (type: 'matched' | 'fully_matched' | 'differences' | 'left_only' | 'right_only' | 'all') => {
    if (!id) return;
    try {
      const blob = await downloadMutation.mutateAsync({ id: Number(id), type });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `validation_result_${id}_${type}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const renderMatchedTableData = (data: any[], filterColumns?: string[], showOnlyMismatchedColumns: boolean = false) => {
    if (!data || data.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
            No records found
          </TableCell>
        </TableRow>
      );
    }

    const firstRecord = data[0] || {};
    const columnMetadata = null; // No column metadata in paginated API

    // Check data format
    // 1. Set-based comparison: has 'source' column with 'left' or 'right'
    // 2. JOIN-based SQL: flat format with right_ prefixes
    // 3. In-memory: nested left_record/right_record
    const hasSourceColumn = 'source' in firstRecord;
    const isNestedFormat = firstRecord.left_record || firstRecord.right_record;
    const isFlatFormat = !hasSourceColumn && !isNestedFormat;

    let allColumns: string[];
    let leftColumns: string[];
    let rightColumns: string[];

    if (hasSourceColumn) {
      // Set-based comparison: rows have 'source' column
      // Use metadata for columns (exclude 'source' column)
      if (columnMetadata) {
        leftColumns = columnMetadata.leftColumns || [];
        rightColumns = columnMetadata.rightColumns || [];

        // Sort: Both → Left-only → Right-only (exclude 'source')
        const bothColumns = leftColumns.filter((col: string) => rightColumns.includes(col));
        const leftOnlyColumns = leftColumns.filter((col: string) => !rightColumns.includes(col));
        const rightOnlyColumns = rightColumns.filter((col: string) => !leftColumns.includes(col));

        allColumns = [...bothColumns, ...leftOnlyColumns, ...rightOnlyColumns];
      } else {
        // Fallback: infer from first record (exclude 'source' but keep id)
        allColumns = Object.keys(firstRecord).filter(col => col !== 'source');
        leftColumns = allColumns;
        rightColumns = allColumns;
      }
    } else if (isFlatFormat) {
      // JOIN-based SQL: flat with right_ prefixes
      if (columnMetadata) {
        leftColumns = columnMetadata.leftColumns || [];
        rightColumns = columnMetadata.rightColumns || [];

        const bothColumns = leftColumns.filter((col: string) => rightColumns.includes(col));
        const leftOnlyColumns = leftColumns.filter((col: string) => !rightColumns.includes(col));
        const rightOnlyColumns = rightColumns.filter((col: string) => !leftColumns.includes(col));

        allColumns = [...bothColumns, ...leftOnlyColumns, ...rightOnlyColumns];
      } else {
        const rawColumns = Object.keys(firstRecord).filter(col => col !== 'has_differences'); // Keep id column
        leftColumns = rawColumns.filter(col => !col.startsWith('right_'));
        rightColumns = rawColumns.filter(col => col.startsWith('right_')).map(col => col.replace('right_', ''));
        allColumns = rawColumns.filter(col => !col.startsWith('right_'));
      }
    } else {
      // In-memory comparison: nested left_record/right_record
      leftColumns = Object.keys(firstRecord.left_record || {});
      rightColumns = Object.keys(firstRecord.right_record || {});
      allColumns = [...new Set([...leftColumns, ...rightColumns])];
    }

    // Filter columns to display only key_fields + compare_fields
    if (filterColumns && filterColumns.length > 0) {
      allColumns = filterColumns.filter(col => allColumns.includes(col));
    }

    // NEW: Filter to show only mismatched columns (if enabled)
    if (showOnlyMismatchedColumns && isFlatFormat) {
      // Find columns that have mismatches in at least one row
      const columnsWithMismatches = new Set<string>();

      data.forEach(row => {
        allColumns.forEach(col => {
          const hasRightVersion = row.hasOwnProperty(`right_${col}`);
          if (hasRightVersion) {
            const leftValue = row[col];
            const rightValue = row[`right_${col}`];
            if (leftValue !== rightValue) {
              columnsWithMismatches.add(col);
            }
          }
        });
      });

      // Always include key fields + columns with mismatches
      allColumns = allColumns.filter(col =>
        keyFields.includes(col) || columnsWithMismatches.has(col)
      );
    }

    const displayData = data; // Show all data (already paginated from backend)

    // For set-based format, group rows by key fields
    // Each pair will have source='left' and source='right'
    let groupedData: any[][] = [];
    if (hasSourceColumn) {
      // Group by all columns except 'source' (assumes records with same keys are adjacent)
      for (let i = 0; i < displayData.length; i += 2) {
        const leftRow = displayData[i];
        const rightRow = displayData[i + 1];

        if (leftRow && rightRow) {
          groupedData.push([leftRow, rightRow]);
        } else if (leftRow) {
          groupedData.push([leftRow, null]);
        }
      }
    }

    return (
      <>
        {hasSourceColumn ? (
          // Set-based format: render grouped left/right rows
          groupedData.map(([leftRow, rightRow], idx) => (
            <TableRow key={idx}>
              {allColumns.map((col) => {
                const leftValue = leftRow?.[col];
                const rightValue = rightRow?.[col];
                const inLeft = leftColumns.includes(col);
                const inRight = rightColumns.includes(col);
                const hasDifference = inLeft && inRight && leftValue !== rightValue;
                const isKeyField = keyFields.includes(col);

                return (
                  <TableCell
                    key={col}
                    className={`text-sm ${hasDifference ? 'bg-red-50' : ''} ${isKeyField ? 'sticky bg-muted/30 z-10 font-medium' : ''}`}
                    style={isKeyField ? { left: `${keyFields.indexOf(col) * 150}px` } : {}}
                  >
                    {inLeft && inRight ? (
                      leftValue === rightValue ? (
                        String(leftValue ?? '')
                      ) : (
                        <div className="space-y-1">
                          <div className="text-blue-600">L: {String(leftValue ?? 'null')}</div>
                          <div className="text-green-600">R: {String(rightValue ?? 'null')}</div>
                        </div>
                      )
                    ) : inLeft ? (
                      String(leftValue ?? '')
                    ) : (
                      String(rightValue ?? '')
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))
        ) : (
          // JOIN-based or in-memory format
          displayData.map((row, idx) => (
            <TableRow key={idx}>
              {allColumns.map((col) => {
                const isKeyField = keyFields.includes(col);

                if (isFlatFormat) {
                  // SQL format: column exists directly OR as right_column
                  const hasRightVersion = row.hasOwnProperty(`right_${col}`);
                  const leftValue = row[col];
                  const rightValue = row[`right_${col}`];
                  const hasConflict = hasRightVersion && leftValue !== undefined;

                  return (
                    <TableCell
                      key={col}
                      className={`text-sm ${
                        hasConflict && leftValue !== rightValue ? 'bg-red-50' : ''
                      } ${isKeyField ? 'sticky bg-muted/30 z-10 font-medium' : ''}`}
                      style={isKeyField ? { left: `${keyFields.indexOf(col) * 150}px` } : {}}
                    >
                      {hasConflict ? (
                        leftValue === rightValue ? (
                          String(leftValue ?? '')
                        ) : (
                          <div className="space-y-1">
                            <div className="text-blue-600">L: {String(leftValue ?? 'null')}</div>
                            <div className="text-green-600">R: {String(rightValue ?? 'null')}</div>
                          </div>
                        )
                      ) : (
                        String(leftValue ?? rightValue ?? '')
                      )}
                    </TableCell>
                  );
                } else {
                  // In-memory format: nested structure
                  const inLeft = leftColumns.includes(col);
                  const inRight = rightColumns.includes(col);
                  const leftValue = row.left_record?.[col];
                  const rightValue = row.right_record?.[col];
                  const displayValue = leftValue ?? rightValue ?? '';
                  const hasDifference = row.differences?.some((d: any) => d.field === col);

                  return (
                    <TableCell
                      key={col}
                      className={`text-sm ${
                        hasDifference ? 'bg-red-50' :
                        inLeft && inRight ? '' :
                        inLeft ? 'bg-blue-50' : 'bg-green-50'
                      } ${isKeyField ? 'sticky bg-muted/30 z-10 font-medium' : ''}`}
                      style={isKeyField ? { left: `${keyFields.indexOf(col) * 150}px` } : {}}
                    >
                      {inLeft && inRight && leftValue !== rightValue ? (
                        <div className="space-y-1">
                          <div className="text-blue-600">L: {String(leftValue ?? 'null')}</div>
                          <div className="text-green-600">R: {String(rightValue ?? 'null')}</div>
                        </div>
                      ) : (
                        String(displayValue)
                      )}
                    </TableCell>
                  );
                }
              })}
            </TableRow>
          ))
        )}
      </>
    );
  };

  const renderDifferencesTableData = (data: any[]) => {
    if (!data || data.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
            No records with differences found
          </TableCell>
        </TableRow>
      );
    }

    return (
      <>
        {data.map((row, idx) => {
          const differences = row.differences || [];
          const keyField = typeof row.key === 'object' ? JSON.stringify(row.key) : String(row.key);

          return (
            <TableRow key={idx} className="border-b">
              <TableCell className="font-medium">{keyField}</TableCell>
              <TableCell colSpan={2}>
                <div className="space-y-2">
                  {differences.map((diff: any, diffIdx: number) => (
                    <div key={diffIdx} className="flex items-start gap-4 text-sm">
                      <span className="font-medium min-w-[120px]">{diff.field}:</span>
                      <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        Left: {String(diff.left_value ?? 'null')}
                      </span>
                      <span className="text-red-600 bg-red-50 px-2 py-1 rounded">
                        Right: {String(diff.right_value ?? 'null')}
                      </span>
                    </div>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </>
    );
  };

  const renderTableData = (data: any[], filterColumns?: string[]) => {
    if (!data || data.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
            No records found
          </TableCell>
        </TableRow>
      );
    }

    let columns = Object.keys(data[0]);

    // Filter columns to display only key_fields + compare_fields
    if (filterColumns && filterColumns.length > 0) {
      columns = filterColumns.filter(col => columns.includes(col));
    }

    return (
      <>
        {data.map((row, idx) => (
          <TableRow key={idx}>
            {columns.map((col) => (
              <TableCell key={col} className="text-sm">
                {String(row[col] ?? '')}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load result details'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!result) {
    return (
      <Alert variant="warning">
        <AlertDescription>Result not found</AlertDescription>
      </Alert>
    );
  }

  // Check if this is a failed validation with validation_error
  const isFailedValidation = result.execution_status === 'failed';
  const validationError = result.summary_json?.validation_error;

  return (
    <ValidationLayout>
      <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/validation/results')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Validation Result #{result.result_id}</h1>
        </div>
        {!isFailedValidation && (
          <Button variant="outline" onClick={() => handleDownload('all')}>
            <Download className="mr-2 h-4 w-4" />
            Download All
          </Button>
        )}
      </div>

      {/* Failed Workflow UI (if validation failed with validation_error) */}
      {isFailedValidation && validationError && (
        <FailedWorkflowUI
          validationError={validationError}
          errorMessage={result.error_message || 'Validation failed'}
          validationId={result.validation_id}
        />
      )}

      {/* Summary Cards (only show for successful validations or failed without validation_error) */}
      {(!isFailedValidation || !validationError) && (
        <>
      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Fully Matched</p>
              <p className="text-3xl font-bold">{result.fully_matched ?? (result.matched - result.differences)}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-[hsl(var(--color-success))]/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-[hsl(var(--color-success))]" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Perfect matches (no differences)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Differences</p>
              <p className="text-3xl font-bold">{result.differences}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Matched with differences</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Left Only</p>
              <p className="text-3xl font-bold">{result.left_only}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-[hsl(var(--color-warning))]/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-[hsl(var(--color-warning))]" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Records only in left source</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Right Only</p>
              <p className="text-3xl font-bold">{result.right_only}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-[hsl(var(--color-warning))]/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-[hsl(var(--color-warning))]" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Records only in right source</p>
          </CardContent>
        </Card>
      </div>

      {/* Execution Details */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Workflow Name</p>
              <p className="text-base font-medium">{validation?.validation_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Validation ID</p>
              <p className="text-base font-medium">{result.validation_id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Execution Time</p>
              <p className="text-base font-medium">{formatDate(result.execution_timestamp)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={result.execution_status === 'success' ? 'success' : 'destructive'}>
                {result.execution_status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="text-base font-medium">{result.execution_time_ms}ms</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Left Records</p>
              <p className="text-base font-medium">{result.total_left?.toLocaleString() || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Right Records</p>
              <p className="text-base font-medium">{result.total_right?.toLocaleString() || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="fully_matched">
                Fully Matched ({result.fully_matched ?? (result.matched - result.differences)})
              </TabsTrigger>
              <TabsTrigger value="differences">
                Differences ({result.differences})
              </TabsTrigger>
              <TabsTrigger value="left_only">
                Left Only ({result.left_only})
              </TabsTrigger>
              <TabsTrigger value="right_only">
                Right Only ({result.right_only})
              </TabsTrigger>
              <TabsTrigger value="metrics">
                Pipeline Metrics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fully_matched" className="mt-6">
              {/* Controls: Pagination + Download */}
              <div className="mb-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  {/* Page Size Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(value) => {
                        setPageSize(Number(value));
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="250">250</SelectItem>
                        <SelectItem value="500">500</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pagination Info */}
                  {deferredFullyMatchedData?.pagination && (
                    <span className="text-sm text-muted-foreground">
                      Showing {((deferredFullyMatchedData.pagination.page - 1) * deferredFullyMatchedData.pagination.limit) + 1} - {Math.min(deferredFullyMatchedData.pagination.page * deferredFullyMatchedData.pagination.limit, deferredFullyMatchedData.pagination.total)} of {deferredFullyMatchedData.pagination.total.toLocaleString()}
                    </span>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload('fully_matched')}
                  disabled={(result.fully_matched ?? (result.matched - result.differences)) === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download All
                </Button>
              </div>

              <div className="rounded-md border">
                {fullyMatchedLoading || !deferredFullyMatchedData ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {(() => {
                          const { allColumns } = calculateColumns(deferredFullyMatchedData?.records);
                          return allColumns.map((col) => {
                            const isKeyField = keyFields.includes(col);
                            return (
                              <TableHead
                                key={col}
                                className={`${isKeyField ? 'sticky bg-muted/50 z-10 font-semibold' : ''}`}
                                style={isKeyField ? { left: `${keyFields.indexOf(col) * 150}px` } : {}}
                              >
                                {col}
                              </TableHead>
                            );
                          });
                        })()}
                      </TableRow>
                    </TableHeader>
                    <TableBody>{renderMatchedTableData(deferredFullyMatchedData?.records || [], displayColumns)}</TableBody>
                  </Table>
                )}
              </div>

              {/* Pagination Controls */}
              {deferredFullyMatchedData?.pagination && deferredFullyMatchedData.pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1 || fullyMatchedLoading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    Page {deferredFullyMatchedData.pagination.page} of {deferredFullyMatchedData.pagination.totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === deferredFullyMatchedData.pagination.totalPages || fullyMatchedLoading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="differences" className="mt-6">
              {/* Controls: Filter + Pagination + Download */}
              <div className="mb-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  {/* Mismatched Columns Filter */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-mismatched"
                      checked={showOnlyMismatched}
                      onCheckedChange={(checked) => setShowOnlyMismatched(checked as boolean)}
                    />
                    <label
                      htmlFor="show-mismatched"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Show only mismatched columns
                    </label>
                  </div>

                  {/* Page Size Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(value) => {
                        setPageSize(Number(value));
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="250">250</SelectItem>
                        <SelectItem value="500">500</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pagination Info */}
                  {deferredDifferencesData?.pagination && (
                    <span className="text-sm text-muted-foreground">
                      Showing {((deferredDifferencesData.pagination.page - 1) * deferredDifferencesData.pagination.limit) + 1} - {Math.min(deferredDifferencesData.pagination.page * deferredDifferencesData.pagination.limit, deferredDifferencesData.pagination.total)} of {deferredDifferencesData.pagination.total.toLocaleString()}
                    </span>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload('differences')}
                  disabled={result.differences === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download All
                </Button>
              </div>

              <div className="rounded-md border">
                {differencesLoading || !deferredDifferencesData ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {(() => {
                          let { allColumns } = calculateColumns(deferredDifferencesData?.records);

                          // Apply mismatched columns filter if enabled
                          if (showOnlyMismatched && deferredDifferencesData?.records) {
                            const columnsWithMismatches = getMismatchedColumns(deferredDifferencesData.records, allColumns);
                            allColumns = allColumns.filter(col =>
                              keyFields.includes(col) || columnsWithMismatches.has(col)
                            );
                          }

                          return allColumns.map((col) => {
                            const isKeyField = keyFields.includes(col);
                            return (
                              <TableHead
                                key={col}
                                className={`${isKeyField ? 'sticky bg-muted/50 z-10 font-semibold' : ''}`}
                                style={isKeyField ? { left: `${keyFields.indexOf(col) * 150}px` } : {}}
                              >
                                {col}
                              </TableHead>
                            );
                          });
                        })()}
                      </TableRow>
                    </TableHeader>
                    <TableBody>{renderMatchedTableData(deferredDifferencesData?.records || [], displayColumns, showOnlyMismatched)}</TableBody>
                  </Table>
                )}
              </div>

              {/* Pagination Controls */}
              {deferredDifferencesData?.pagination && deferredDifferencesData.pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1 || differencesLoading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    Page {deferredDifferencesData.pagination.page} of {deferredDifferencesData.pagination.totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === deferredDifferencesData.pagination.totalPages || differencesLoading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="left_only" className="mt-6">
              {/* Controls: Pagination + Download */}
              <div className="mb-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  {/* Page Size Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(value) => {
                        setPageSize(Number(value));
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="250">250</SelectItem>
                        <SelectItem value="500">500</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pagination Info */}
                  {deferredLeftOnlyData?.pagination && (
                    <span className="text-sm text-muted-foreground">
                      Showing {((deferredLeftOnlyData.pagination.page - 1) * deferredLeftOnlyData.pagination.limit) + 1} - {Math.min(deferredLeftOnlyData.pagination.page * deferredLeftOnlyData.pagination.limit, deferredLeftOnlyData.pagination.total)} of {deferredLeftOnlyData.pagination.total.toLocaleString()}
                    </span>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload('left_only')}
                  disabled={result.left_only === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download All
                </Button>
              </div>

              <div className="rounded-md border">
                {leftOnlyLoading || !deferredLeftOnlyData ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {deferredLeftOnlyData?.records?.[0] && (() => {
                          let columns = Object.keys(deferredLeftOnlyData.records[0]);
                          // Filter to show only key_fields + compare_fields
                          if (displayColumns.length > 0) {
                            columns = displayColumns.filter(col => columns.includes(col));
                          }
                          return columns.map((col) => (
                            <TableHead key={col}>{col}</TableHead>
                          ));
                        })()}
                      </TableRow>
                    </TableHeader>
                    <TableBody>{renderTableData(deferredLeftOnlyData?.records || [], displayColumns)}</TableBody>
                  </Table>
                )}
              </div>

              {/* Pagination Controls */}
              {deferredLeftOnlyData?.pagination && deferredLeftOnlyData.pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1 || leftOnlyLoading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    Page {deferredLeftOnlyData.pagination.page} of {deferredLeftOnlyData.pagination.totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === deferredLeftOnlyData.pagination.totalPages || leftOnlyLoading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="right_only" className="mt-6">
              {/* Controls: Pagination + Download */}
              <div className="mb-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  {/* Page Size Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(value) => {
                        setPageSize(Number(value));
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="250">250</SelectItem>
                        <SelectItem value="500">500</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pagination Info */}
                  {deferredRightOnlyData?.pagination && (
                    <span className="text-sm text-muted-foreground">
                      Showing {((deferredRightOnlyData.pagination.page - 1) * deferredRightOnlyData.pagination.limit) + 1} - {Math.min(deferredRightOnlyData.pagination.page * deferredRightOnlyData.pagination.limit, deferredRightOnlyData.pagination.total)} of {deferredRightOnlyData.pagination.total.toLocaleString()}
                    </span>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload('right_only')}
                  disabled={result.right_only === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download All
                </Button>
              </div>

              <div className="rounded-md border">
                {rightOnlyLoading || !deferredRightOnlyData ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {deferredRightOnlyData?.records?.[0] && (() => {
                          let columns = Object.keys(deferredRightOnlyData.records[0]);
                          // Filter to show only key_fields + compare_fields
                          if (displayColumns.length > 0) {
                            columns = displayColumns.filter(col => columns.includes(col));
                          }
                          return columns.map((col) => (
                            <TableHead key={col}>{col}</TableHead>
                          ));
                        })()}
                      </TableRow>
                    </TableHeader>
                    <TableBody>{renderTableData(deferredRightOnlyData?.records || [], displayColumns)}</TableBody>
                  </Table>
                )}
              </div>

              {/* Pagination Controls */}
              {deferredRightOnlyData?.pagination && deferredRightOnlyData.pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1 || rightOnlyLoading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    Page {deferredRightOnlyData.pagination.page} of {deferredRightOnlyData.pagination.totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === deferredRightOnlyData.pagination.totalPages || rightOnlyLoading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="metrics" className="mt-6">
              <div className="space-y-6">
                {/* Workflow Snapshot Info */}
                {result.pipeline_metrics?.workflow && (
                  <div className="space-y-4">
                    <Card className="border-blue-200 bg-blue-50/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-blue-900">
                          Workflow Configuration (Snapshot at Execution)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Validation Name</p>
                            <p className="font-medium">{result.pipeline_metrics.workflow.validation_name}</p>
                          </div>
                          {result.pipeline_metrics.workflow.description && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Description</p>
                              <p className="font-medium">{result.pipeline_metrics.workflow.description}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Match Strategy</p>
                            <Badge variant="outline" className="text-xs">
                              {result.pipeline_metrics.workflow.match_strategy || 'exact'}
                            </Badge>
                          </div>
                          {result.pipeline_metrics.execution_timestamp && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Executed At</p>
                              <p className="font-medium text-xs">{new Date(result.pipeline_metrics.execution_timestamp).toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Datasources Used */}
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Left Datasources */}
                      {result.pipeline_metrics.workflow.left_sources_config && result.pipeline_metrics.workflow.left_sources_config.length > 0 && (
                        <Card className="border-blue-300">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">Left</Badge>
                              Data Sources
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {result.pipeline_metrics.workflow.left_sources_config.map((source: any, idx: number) => (
                                <div key={idx} className="bg-white p-3 rounded-md border border-blue-200">
                                  <div className="flex items-start gap-2">
                                    <Badge variant="secondary" className="text-xs shrink-0">{source.source_id}</Badge>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">{source.datasource_name}</p>
                                      {source.file_name && source.file_name !== source.datasource_name && (
                                        <p className="text-xs text-muted-foreground truncate">{source.file_name}</p>
                                      )}
                                      {source.where_clause && (
                                        <p className="text-xs text-orange-600 mt-1">Filter: {source.where_clause}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Right Datasources */}
                      {result.pipeline_metrics.workflow.right_sources_config && result.pipeline_metrics.workflow.right_sources_config.length > 0 && (
                        <Card className="border-green-300">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold text-green-900 flex items-center gap-2">
                              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">Right</Badge>
                              Data Sources
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {result.pipeline_metrics.workflow.right_sources_config.map((source: any, idx: number) => (
                                <div key={idx} className="bg-white p-3 rounded-md border border-green-200">
                                  <div className="flex items-start gap-2">
                                    <Badge variant="secondary" className="text-xs shrink-0">{source.source_id}</Badge>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">{source.datasource_name}</p>
                                      {source.file_name && source.file_name !== source.datasource_name && (
                                        <p className="text-xs text-muted-foreground truncate">{source.file_name}</p>
                                      )}
                                      {source.where_clause && (
                                        <p className="text-xs text-orange-600 mt-1">Filter: {source.where_clause}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Alert className="flex-1 mr-4">
                    <AlertDescription>
                      Pipeline Metrics show row counts at each transformation step for both left and right pipelines.
                    </AlertDescription>
                  </Alert>
                  <div className="flex items-center gap-2 border rounded-md p-1">
                    <Button
                      variant={metricsView === 'flow' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setMetricsView('flow')}
                      className="gap-2"
                    >
                      <Workflow className="h-4 w-4" />
                      Flow
                    </Button>
                    <Button
                      variant={metricsView === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setMetricsView('table')}
                      className="gap-2"
                    >
                      <LayoutList className="h-4 w-4" />
                      Table
                    </Button>
                  </div>
                </div>

                {result.pipeline_metrics ? (
                  metricsView === 'flow' ? (
                    <PipelineFlowDiagram
                      leftMetrics={result.pipeline_metrics.left}
                      rightMetrics={result.pipeline_metrics.right}
                      comparison={result.pipeline_metrics.comparison}
                      resultId={result.result_id}
                    />
                  ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Left Pipeline Metrics */}
                    {result.pipeline_metrics.left && result.pipeline_metrics.left.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Left Pipeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Step</TableHead>
                                <TableHead>Operation</TableHead>
                                <TableHead className="text-right">Row Count</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {result.pipeline_metrics.left.map((metric: any, idx: number) => (
                                <TableRow key={idx}>
                                  <TableCell className="font-medium">{metric.step}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{metric.operation}</Badge>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {metric.description}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-mono">
                                    {metric.row_count.toLocaleString()}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}

                    {/* Right Pipeline Metrics */}
                    {result.pipeline_metrics.right && result.pipeline_metrics.right.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Right Pipeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Step</TableHead>
                                <TableHead>Operation</TableHead>
                                <TableHead className="text-right">Row Count</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {result.pipeline_metrics.right.map((metric: any, idx: number) => (
                                <TableRow key={idx}>
                                  <TableCell className="font-medium">{metric.step}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{metric.operation}</Badge>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {metric.description}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-mono">
                                    {metric.row_count.toLocaleString()}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  )
                ) : (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center text-muted-foreground">
                        <p>No pipeline metrics available for this result.</p>
                        <p className="text-sm mt-2">Pipeline metrics are collected for workflows with transformation operations.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </>
      )}
    </div>
    </ValidationLayout>
  );
}
