import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { ScrollArea, ScrollBar } from '../../../ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../ui/table';
import { CheckCircle2, XCircle, Download, ArrowLeft, Eye, BookText, ChartNoAxesGantt } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ValidationData {
  table: string;
  field: string;
  operation: string;
  value: number | string;
  data: {
    status: boolean;
    message: string;
    data: any[];
    columns: string[];
    rows_count: number;
    execution_time: string;
  };
}

interface ValidationResult {
  rule_id: string;
  description: string;
  status: 'PASS' | 'FAIL';
  operator: string;
  source: ValidationData;
  target: ValidationData;
}

interface RunDict {
  application_id?: string;
  object_type?: string;
  module?: string;
  sub_module?: string;
  object_label?: string;
  t_code?: string;
  validation_id?: string;
  validation_description?: string;
  job_id?: string;
  execution_date_time?: string;
  validation_execution_type?: string;
  executed_by?: string;
  execution_time?: number;
  application_label?: string;
  database_connection_label?: string;
  validation_execution_cycle?: string;
  run_cycle?: string;
}

interface ValidationResponse {
  status: boolean;
  message: string;
  data: {
    results: ValidationResult[];
    diagnosis: {
      success: number;
      failed: number;
      status: 'PASS' | 'FAIL';
    };
    rundict?: RunDict;
  };
}

interface InlineValidationResultsProps {
  results: ValidationResponse | null;
  onClose?: () => void;
}

const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'default' }> = ({ status, size = 'default' }) => {
  const isPass = status === 'PASS' || status === 'Pass';
  return (
    <Badge
      variant={isPass ? 'secondary' : 'destructive'}
      className={cn(
        'flex items-center gap-1.5',
        isPass 
          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
          : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
        size === 'sm' && 'text-xs px-2 py-1'
      )}
    >
      {isPass ? <CheckCircle2 size={size === 'sm' ? 12 : 14} /> : <XCircle size={size === 'sm' ? 12 : 14} />}
      {status}
    </Badge>
  );
};

const formatDateTime = (dateString: string | undefined) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return dateString;
  }
};

const RunDictionaryInfo: React.FC<{ runDict: RunDict }> = ({ runDict }) => (  
  <div className="bg-gradient-to-br rounded-xl border border-blue-200 shadow-lg mb-4">
    <div className="bg-gradient-to-r from-slate-100 to-blue-100 border-b border-blue-200 p-3 rounded-t-xl">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <BookText size={16} className="text-white" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-700">Run Dictionary Information</h3>
          <p className="text-slate-600 text-xs">Execution metadata and configuration details</p>
        </div>
      </div>
    </div>
    
    <div className="p-4 space-y-4">
      {/* Application and object details with vibrant tags */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-indigo-200 shadow-sm">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <ChartNoAxesGantt size={12} className="text-white" />
          </div>
          Application & Object Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-medium text-xs min-w-16">App ID:</span>
            <Badge className="bg-teal-100 text-teal-800 border-teal-300 font-mono text-xs">
              {runDict?.application_id || 'N/A'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-medium text-xs min-w-16">App Name:</span>
            <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-mono text-xs">
              {runDict?.application_label || 'N/A'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-medium text-xs min-w-16">Module:</span>
            <Badge className="bg-slate-100 text-slate-800 border-slate-300 font-mono text-xs">
              {runDict?.module || 'N/A'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-medium text-xs min-w-16">Submodule:</span>
            <Badge className="bg-pink-100 text-pink-800 border-pink-300 font-mono text-xs">
              {runDict?.sub_module || 'N/A'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-medium text-xs min-w-16">Object Type:</span>
            <Badge className="bg-purple-100 text-purple-800 border-purple-300 font-mono text-xs">
              {runDict?.object_type || 'N/A'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-medium text-xs min-w-16">T-Code:</span>
            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 font-mono text-xs">
              {runDict?.t_code || 'N/A'}
            </Badge>
          </div>
        </div>
        {runDict?.validation_description && ( 
          <div className="mt-3 p-3 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg">
            <span className="text-gray-800 font-semibold text-sm">Description: </span>
            <span className="text-gray-700 text-sm">{runDict.validation_description}</span>
          </div>
        )}
      </div>

      {/* Primary execution details with lighter colorful cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200 shadow-sm">
          <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Execution Time</div>
          <div className="text-base font-bold text-blue-700">
            {runDict?.execution_time ? `${runDict.execution_time}s` : 'N/A'}
          </div>
        </div>
        <div className="bg-gradient-to-br from-sky-50 to-cyan-100 p-3 rounded-lg border border-sky-200 shadow-sm">
          <div className="text-xs font-medium text-sky-600 uppercase tracking-wide mb-1">Validation ID</div>
          <div className="text-sm font-bold font-mono text-sky-700 truncate">
            {runDict?.validation_id || 'N/A'}
          </div>
        </div>
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-3 rounded-lg border border-teal-200 shadow-sm">
          <div className="text-xs font-medium text-teal-600 uppercase tracking-wide mb-1">Job ID</div>
          <div className="text-sm font-bold font-mono text-teal-700 truncate">
            {runDict?.job_id || 'N/A'}
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-green-100 p-3 rounded-lg border border-emerald-200 shadow-sm">
          <div className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-1">Execution Date</div>
          <div className="text-xs font-bold text-emerald-700">
            {formatDateTime(runDict?.execution_date_time)}
          </div>
        </div>
      </div>

      {/* Environment and execution context with accent colors */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-lg border-2 border-gray-300 shadow-sm">
          <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Environment</div>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs font-semibold">
            {runDict?.database_connection_label || 'N/A'}
          </Badge>
        </div>
        <div className="bg-white p-3 rounded-lg border-2 border-gray-300 shadow-sm">
          <div className="text-xs font-medium text-sky-600 uppercase tracking-wide mb-1">Execution Cycle</div>
          <Badge className="bg-sky-100 text-sky-800 border-sky-200 text-xs font-semibold">
            {runDict?.validation_execution_cycle || 'N/A'}
          </Badge>
        </div>
        <div className="bg-white p-3 rounded-lg border-2 border-gray-300 shadow-sm">
          <div className="text-xs font-medium text-teal-600 uppercase tracking-wide mb-1">Execution Type</div>
          <Badge className="bg-teal-100 text-teal-800 border-teal-200 text-xs font-semibold">
            {runDict?.validation_execution_type || 'N/A'}
          </Badge>
        </div>
        <div className="bg-white p-3 rounded-lg border-2 border-gray-300 shadow-sm">
          <div className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-1">Executed By</div>
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-semibold">
            {runDict?.executed_by || 'N/A'}
          </Badge>
        </div>
      </div>
    </div>
  </div>
);

const ValidationTableView: React.FC<{
  results: ValidationResult[];
  onViewActions: (result: ValidationResult) => void;
  runDict: RunDict;
}> = ({ results, onViewActions, runDict }) => {
  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Run Dictionary Information moved above */}
      <div className="flex-shrink-0">
        <RunDictionaryInfo runDict={runDict} />
      </div>
      
      {/* Validation Results Table */}
      <div className="flex-1 min-h-0 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-slate-100 to-blue-100 border-b border-slate-200 p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center">
              <Eye size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-700">Validation Results Table</h3>
              <p className="text-slate-600 text-xs">Detailed validation rules and their execution results</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 min-h-0 p-4">
          <ScrollArea className="h-[400px] w-full rounded-lg border border-slate-200 bg-white shadow-sm">
            <Table className="min-w-[1600px]">
              <TableHeader className="bg-gradient-to-r from-slate-100 to-blue-100">
                <TableRow className="border-slate-200">
                  <TableHead className="min-w-32 font-semibold text-slate-700">Source Table</TableHead>
                  <TableHead className="min-w-32 font-semibold text-slate-700">Source Field</TableHead>
                  <TableHead className="min-w-32 font-semibold text-slate-700">Source Operation</TableHead>
                  <TableHead className="min-w-28 font-semibold text-slate-700">Source Value</TableHead>
                  <TableHead className="min-w-32 font-semibold text-slate-700">Target Table</TableHead>
                  <TableHead className="min-w-32 font-semibold text-slate-700">Target Field</TableHead>
                  <TableHead className="min-w-32 font-semibold text-slate-700">Target Operation</TableHead>
                  <TableHead className="min-w-28 font-semibold text-slate-700">Target Value</TableHead>
                  <TableHead className="w-20 font-semibold text-slate-700">Operator</TableHead>
                  <TableHead className="min-w-40 font-semibold text-slate-700">Comparison</TableHead>
                  <TableHead className="w-20 font-semibold text-slate-700">Remarks</TableHead>
                  <TableHead className="sticky left-0 bg-gradient-to-r from-slate-100 to-blue-100 z-10 w-16 font-semibold text-slate-700">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result, index) => {
                  const isEven = index % 2 === 0;
                  return (
                    <TableRow 
                      key={`${result.rule_id}-${index}`} 
                      className={cn(
                        "group border-slate-100 transition-all duration-200",
                        isEven ? "bg-white hover:bg-blue-50/50" : "bg-slate-50/30 hover:bg-blue-50/70"
                      )}
                    >
                      <TableCell className="text-sm text-slate-600">{result.source?.table || 'N/A'}</TableCell>
                      <TableCell className="text-sm text-slate-600">{result.source?.field || 'N/A'}</TableCell>
                      <TableCell className="text-sm text-slate-600">{result.source?.operation || 'N/A'}</TableCell>
                      <TableCell className="font-mono text-sm text-slate-700 bg-slate-50 rounded px-2">
                        {result.source?.value || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{result.target?.table || 'N/A'}</TableCell>
                      <TableCell className="text-sm text-slate-600">{result.target?.field || 'N/A'}</TableCell>
                      <TableCell className="text-sm text-slate-600">{result.target?.operation || 'N/A'}</TableCell>
                      <TableCell className="font-mono text-sm text-slate-700 bg-slate-50 rounded px-2">
                        {result.target?.value || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-slate-700">{result.operator}</TableCell>
                      <TableCell className="font-mono text-xs">
                        <div className="flex items-center gap-1 bg-gradient-to-r from-blue-50 to-indigo-50 p-2 rounded-md border border-blue-200">
                          <span className="text-blue-700 font-semibold">{result.source?.value || 'N/A'}</span>
                          <span className="text-slate-500 mx-1">{result.operator}</span>
                          <span className="text-blue-700 font-semibold">{result.target?.value || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={result.status} size="sm" />
                      </TableCell>
                       <TableCell className={cn(
                        "sticky left-0 z-10 transition-colors duration-200",
                        isEven 
                          ? "bg-white group-hover:bg-blue-50/50" 
                          : "bg-slate-50/30 group-hover:bg-blue-50/70"
                      )}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-blue-100 hover:text-blue-700 transition-colors duration-200"
                          onClick={() => onViewActions(result)}
                        >
                          <Eye size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

const ValidationRuleCard: React.FC<{ 
  result: ValidationResult;
  runDict: RunDict;
}> = ({ result }) => {
  const isPass = result.status === 'PASS';
  
  // Create detailed data rows from source and target data
  const sourceData = result.source?.data?.data || [];
  const targetData = result.target?.data?.data || [];
  
  // Combine and format data for display
  const detailRows = [];
  
  // Add source data rows
  sourceData.forEach((row, index) => {
    detailRows.push({
      type: 'Source',
      table: result.source.table,
      field: result.source.field,
      operation: result.source.operation,
      value: row[result.source.field] || 'N/A',
      rowIndex: index + 1,
      additionalData: Object.keys(row)
        .filter(key => key !== result.source.field)
        .map(key => `${key}: ${row[key]}`)
        .join(', ')
    });
  });
  
  // Add target data rows  
  targetData.forEach((row, index) => {
    detailRows.push({
      type: 'Target',
      table: result.target.table,
      field: result.target.field,
      operation: result.target.operation,
      value: row[result.target.field] || 'N/A',
      rowIndex: index + 1,
      additionalData: Object.keys(row)
        .filter(key => key !== result.target.field)
        .map(key => `${key}: ${row[key]}`)
        .join(', ')
    });
  });

  const ResultBadge: React.FC<{ result: 'Pass' | 'Fail' | 'PASS' | 'FAIL' }> = ({ result }) => {
    const isPass = result === 'Pass' || result === 'PASS';
    return (
      <Badge variant={isPass ? 'secondary' : 'destructive'} className="text-xs">
        {result}
      </Badge>
    );
  };

  return ( 
    <div className="h-full flex flex-col space-y-3">
      {/* Validation Rule Summary Card with vibrant design */}
      <div className="flex-shrink-0 bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 rounded-xl border border-purple-200 shadow-lg">
        <div className="bg-gradient-to-r from-gray-100 to-slate-200 text-gray-800 p-3 rounded-t-xl border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gray-300 rounded-lg flex items-center justify-center">
                {isPass ? <CheckCircle2 size={14} className="text-green-600" /> : <XCircle size={14} className="text-red-600" />}
              </div>
              <div>
                <h3 className="text-sm font-semibold">{result.description || 'Validation Rule'}</h3>
                <p className="text-gray-600 text-xs">Rule ID: {result.rule_id}</p>
              </div>
            </div>
            <StatusBadge status={result.status} />
          </div>
        </div>
        
        {/* Summary Badges */}  
        <div className="p-4 flex items-center gap-3">
          <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-4 py-2 rounded-lg shadow-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span className="text-sm font-bold">{isPass ? 1 : 0} Passed</span>
            </div>
          </div>
          <div className="bg-gradient-to-r from-red-400 to-pink-500 text-white px-4 py-2 rounded-lg shadow-md">
            <div className="flex items-center gap-2">
              <XCircle size={16} />
              <span className="text-sm font-bold">{isPass ? 0 : 1} Failed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Data Table with enhanced design */}
      <div className="flex-1 min-h-0 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border border-slate-200 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-gray-100 to-slate-200 text-gray-800 p-3 border-b">
          <h3 className="text-sm font-semibold">Detailed Validation Data</h3>
          <p className="text-gray-600 text-xs">Source and target data analysis</p>
        </div>
        
        <div className="flex-1 min-h-0 p-4">
          <ScrollArea className="h-full w-full">
            <div className="bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-gradient-to-r from-gray-100 to-slate-100">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-700">Type</TableHead>
                    <TableHead className="font-semibold text-gray-700">Table</TableHead>
                    <TableHead className="font-semibold text-gray-700">Field</TableHead>
                    <TableHead className="font-semibold text-gray-700">Operation</TableHead>
                    <TableHead className="font-semibold text-gray-700">Value</TableHead>
                    <TableHead className="font-semibold text-gray-700">Row #</TableHead>
                    <TableHead className="font-semibold text-gray-700">Additional Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailRows.map((row, index) => {
                    const isEven = index % 2 === 0;
                    return (
                      <TableRow 
                        key={index} 
                        className={cn(
                          "transition-colors duration-200",
                          isEven ? "bg-white hover:bg-blue-50/30" : "bg-slate-50/40 hover:bg-blue-50/50"
                        )}
                      >
                        <TableCell>
                          <Badge 
                            variant={row.type === 'Source' ? 'secondary' : 'outline'} 
                            className={cn(
                              "text-xs font-semibold",
                              row.type === 'Source' 
                                ? "bg-blue-100 text-blue-800 border-blue-300" 
                                : "bg-purple-100 text-purple-800 border-purple-300"
                            )}
                          >
                            {row.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">{row.table}</TableCell>
                        <TableCell className="font-medium text-slate-700">{row.field}</TableCell>
                        <TableCell className="text-slate-600">{row.operation}</TableCell>
                        <TableCell className="font-mono text-slate-700 bg-slate-100 rounded px-2">{row.value}</TableCell>
                        <TableCell className="text-slate-600">{row.rowIndex}</TableCell>
                        <TableCell className="text-xs text-slate-500 max-w-xs truncate" title={row.additionalData}>
                          {row.additionalData || 'None'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Summary Row with gradient background */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">Comparison:</span>
                    <div className="bg-white px-3 py-1 rounded-md border border-blue-200 font-mono text-sm text-blue-800">
                      {result.source?.value || 'N/A'} {result.operator} {result.target?.value || 'N/A'}
                    </div>
                  </div>
                  <ResultBadge result={result.status} />
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default function InlineValidationResults({ results, onClose }: InlineValidationResultsProps) {
  const [currentView, setCurrentView] = useState<'table' | 'cards'>('table');
  const [selectedResult, setSelectedResult] = useState<ValidationResult | null>(null);

  if (!results?.data) {
    return null;
  }

  const { results: validationResults, diagnosis, rundict } = results.data;
  const runDict = rundict || {};

  const handleDownload = () => {
    if (!validationResults.length) return;

    const headers = ['Rule ID', 'Description', 'Status', 'Source Table', 'Source Field', 'Source Operation', 'Source Value', 'Target Table', 'Target Field', 'Target Operation', 'Target Value', 'Operator', 'Comparison'].join(',');
    
    const rows = validationResults.map((result) => [
      `"${result.rule_id}"`,
      `"${result.description}"`,
      `"${result.status}"`,
      `"${result.source?.table || 'N/A'}"`,
      `"${result.source?.field || 'N/A'}"`,
      `"${result.source?.operation || 'N/A'}"`,
      `"${result.source?.value || 'N/A'}"`,
      `"${result.target?.table || 'N/A'}"`,
      `"${result.target?.field || 'N/A'}"`,
      `"${result.target?.operation || 'N/A'}"`,
      `"${result.target?.value || 'N/A'}"`,
      `"${result.operator}"`,
      `"${result.source?.value || 'N/A'} ${result.operator} ${result.target?.value || 'N/A'}"`
    ].join(','));

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Validation_Results_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleViewActions = (result: ValidationResult) => {
    setSelectedResult(result);
    setCurrentView('cards');
  };

  const handleBackToTable = () => {
    setCurrentView('table');
    setSelectedResult(null);
  };

  const renderContent = () => { 
    switch (currentView) { 
      case 'cards':
        return selectedResult ? (
          <>
            <div className="flex-shrink-0 bg-gradient-to-r from-gray-400 to-gray-300 text-white p-2 rounded-t-xl">
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleBackToTable}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-white/20 hover:bg-white/30 text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Eye size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Validation Rule Details</h2>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 min-h-0 p-3">
              <ValidationRuleCard
                result={selectedResult}
                runDict={runDict}
              />
            </div>
          </>
        ) : null;
      case 'table':
      default:
        return (
          <>
            <div className="flex-1 min-h-0 p-3">
              <ValidationTableView 
                results={validationResults}
                onViewActions={handleViewActions}
                runDict={runDict}
              />
            </div>
          </>
        );
    }
  }; 

  return (
    <Card className="w-full">
      <CardHeader className="p-4 pb-2 border-b bg-gradient-to-r from-gray-50 to-slate-100 text-gray-800">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-gray-600" />
          Validation Results
          <span className="text-sm font-normal text-gray-600 ml-2">
            Complete validation analysis and data overview
          </span>
        </CardTitle>
        <div className="flex items-center gap-4 mt-2">
          <Badge variant="secondary" className="bg-gray-200 text-gray-700 border-gray-300">
            Total: {validationResults?.length || 0}
          </Badge>
          <Badge variant="secondary" className="bg-green-700 hover:bg-green-700 text-white border-green-700">
            Passed: {validationResults?.filter(r => r.status === 'PASS')?.length || 0}
          </Badge>
          <Badge variant="secondary" className="bg-red-700 hover:bg-red-700 text-white border-red-700">
            Failed: {validationResults?.filter(r => r.status === 'FAIL')?.length || 0}
          </Badge>
          <Button variant="ghost" size="sm" className="ml-auto text-gray-700 hover:bg-gray-200" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" className="text-gray-700 hover:bg-gray-200" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div style={{ height: '600px' }} className="overflow-auto">
          {renderContent()}
        </div>
      </CardContent>
    </Card>
  );
}