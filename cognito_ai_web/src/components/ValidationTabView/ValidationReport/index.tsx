// import { useState, Fragment } from "react";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "../ui/card";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "../ui/table";
// import { Badge } from "../ui/badge";
// import { Eye, Search } from "lucide-react";
// import { Button } from "../ui/button";
// import { Input } from "../ui/input";
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

// interface ValidationReportProps {
//   data: any;
// }

// const ValidationReport = ({ data }: ValidationReportProps) => {
//   if (!data) return null;
//   const [openDrilldown, setOpenDrilldown] = useState<number | null>(null);
//   const [summarySearch, setSummarySearch] = useState("");
//   const [fieldSummarySearch, setFieldSummarySearch] = useState("");
//   const [lineItemsSearch, setLineItemsSearch] = useState("");

//   const summaryKeys = data.summary?.rows?.length > 0 ? Object.keys(data.summary.rows[0]) : [];
//   const fieldSummaryKeys = data.field_summary?.rows?.length > 0 ? Object.keys(data.field_summary.rows[0]) : [];
//   const lineItemKeys = data.line_items?.length > 0 ? Object.keys(data.line_items[0]).filter(key => key !== 'drilldown') : [];

//   const handleToggleDrilldown = (index: number) => {
//     setOpenDrilldown(prev => (prev === index ? null : index));
//   };

//   // Filter functions
//   const filteredSummaryRows = data.summary?.rows?.filter((row: any) => 
//     summaryKeys.some(key => 
//       String(row[key]).toLowerCase().includes(summarySearch.toLowerCase())
//     )
//   ) || [];

//   const filteredFieldSummaryRows = data.field_summary?.rows?.filter((row: any) => 
//     fieldSummaryKeys.some(key => 
//       String(row[key]).toLowerCase().includes(fieldSummarySearch.toLowerCase())
//     )
//   ) || [];

//   const filteredLineItems = data.line_items?.filter((item: any) => 
//     lineItemKeys.some(key => 
//       String(item[key]).toLowerCase().includes(lineItemsSearch.toLowerCase())
//     )
//   ) || [];

//   return (
//     <div className="w-full p-2 space-y-4 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
//       {/* Header Section */}
//       <Card className="p-2 gap-0 shadow-lg rounded-xl bg-gradient-to-br from-white via-blue-50/20 to-purple-50/20 backdrop-blur-sm border border-blue-200/30 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
//         {/* Background Pattern */}
//         <div className="absolute inset-0 bg-gradient-to-r from-blue-500/3 via-purple-500/3 to-pink-500/3 opacity-40"></div>
//         <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/8 to-purple-400/8 rounded-full -translate-y-10 translate-x-10"></div>
//         <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-400/8 to-pink-400/8 rounded-full translate-y-8 -translate-x-8"></div>
        
//         <div className="relative z-10">
//           <CardTitle className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
//             <div className="flex items-center gap-1">
//             </div>
//             <span className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
//               Validation Report Dashboard
//             </span>
//           </CardTitle>

//           <CardContent className="p-0">
//             <div className="grid grid-cols-7 gap-1">
//               {data.header &&
//                 Object.entries(data.header).map(([key, value]) => (
//                   <div
//                     key={key}
//                     className="group flex flex-col p-2 bg-white/60 backdrop-blur-sm rounded-lg border border-slate-200/40 hover:border-blue-300/60 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/80"
//                   >
//                     <span className="text-slate-500 capitalize font-semibold text-xs tracking-wide mb-1 flex items-center gap-1">
//                       <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
//                       {key.replace(/_/g, ' ')}
//                     </span>

//                     <TooltipProvider>
//                       <Tooltip>
//                         <TooltipTrigger asChild>
//                           <span
//                             className="text-slate-800 font-bold text-xs truncate w-full cursor-pointer group-hover:text-blue-600 transition-colors leading-tight"
//                             title={String(value)}
//                           >
//                             {String(value)}
//                           </span>
//                         </TooltipTrigger>
//                         <TooltipContent className="bg-slate-900 text-white border-0 rounded-lg shadow-xl">
//                           <p className="max-w-xs break-words font-medium">{String(value)}</p>
//                         </TooltipContent>
//                       </Tooltip>
//                     </TooltipProvider>
//                   </div>
//                 ))}
//             </div>
//           </CardContent>
//         </div>
//       </Card>


//       {/* Summary Section */}
//       <Card className="p-2 gap-0 shadow-lg rounded-2xl bg-white/80 backdrop-blur-sm border-0 hover:shadow-xl transition-all duration-300">
//         <CardHeader className="p-0 mb-3">
//           <CardTitle className="text-xl font-bold text-slate-800 flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <div className="w-2 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
//               Summary Overview
//             </div>
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
//               <Input
//                 placeholder="Search..."
//                 value={summarySearch}
//                 onChange={(e) => setSummarySearch(e.target.value)}
//                 className="pl-10 pr-4 py-2 w-64 text-xs border-slate-200 focus:border-purple-500 focus:ring-purple-500"
//               />
//             </div>
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="p-0">
//           <div className="overflow-x-auto rounded-xl border border-slate-200">
//             <Table className="border-collapse">
//               <TableHeader>
//                 <TableRow className="bg-gradient-to-r from-slate-100 to-slate-200 border-0">
//                   {summaryKeys.map((key) => (
//                     <TableHead key={key} className="capitalize font-bold text-slate-700 border-0 py-3 px-4 text-xs">{key.replace(/_/g, ' ')}</TableHead>
//                   ))}
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filteredSummaryRows.map((row: any, index: number) => (
//                   <TableRow key={index} className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 border-0 transition-all duration-200">
//                     {summaryKeys.map(key => (
//                        <TableCell key={key} className="text-slate-700 border-0 py-3 px-4 font-medium">{String(row[key as keyof typeof row])}</TableCell>
//                     ))}
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Field Summary Section */}
//       <Card className="p-2 gap-0 shadow-lg rounded-2xl bg-white/80 backdrop-blur-sm border-0 hover:shadow-xl transition-all duration-300">
//         <CardHeader className="p-0 mb-3">
//           <CardTitle className="text-xl font-bold text-slate-800 flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <div className="w-2 h-6 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full"></div>
//               Field Summary Analysis
//             </div>
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
//               <Input
//                 placeholder="Search..."
//                 value={fieldSummarySearch}
//                 onChange={(e) => setFieldSummarySearch(e.target.value)}
//                 className="pl-10 pr-4 py-2 w-64 text-xs border-slate-200 focus:border-purple-500 focus:ring-purple-500"
//               />
//             </div>
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="p-0">
//           <div className="overflow-x-auto rounded-xl border border-slate-200">
//             <Table className="border-collapse">
//               <TableHeader>
//                 <TableRow className="bg-gradient-to-r from-slate-100 to-slate-200 border-0">
//                   {fieldSummaryKeys.map((key) => (
//                     <TableHead key={key} className="font-bold text-slate-700 border-0 py-3 px-4 text-xs">{key}</TableHead>
//                   ))}
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filteredFieldSummaryRows.map((row: any, index: number) => (
//                   <TableRow key={index} className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 border-0 transition-all duration-200">
//                     {fieldSummaryKeys.map((key) => (
                        
//                       <TableCell key={key} className="text-slate-700 border-0 py-3 px-4 font-medium">
//                         {key === 'Overall Status' && row[key as keyof typeof row] === 'Passed' ? (
//                             <Badge variant="outline" className="text-emerald-600 border-emerald-500 bg-emerald-50 px-2 py-1 font-semibold rounded-full text-xs">{String(row[key as keyof typeof row])}</Badge>
//                         ) : key === 'Overall Status' && row[key as keyof typeof row] === 'Failed' ? (
//                             <Badge variant="outline" className="text-red-600 border-red-500 bg-red-50 px-2 py-1 font-semibold rounded-full text-xs">{String(row[key as keyof typeof row])}</Badge>
//                         ) : (
//                             String(row[key as keyof typeof row])
//                         )}
//                       </TableCell>
//                     ))}
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Line Items Section */}
//       <Card className="p-2 gap-0 shadow-lg rounded-2xl bg-white/80 backdrop-blur-sm border-0 hover:shadow-xl transition-all duration-300">
//         <CardHeader className="p-0 mb-3">
//           <CardTitle className="text-xl font-bold text-slate-800 flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <div className="w-2 h-6 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></div>
//               Detailed Line Items
//             </div>
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
//               <Input
//                 placeholder="Search..."
//                 value={lineItemsSearch}
//                 onChange={(e) => setLineItemsSearch(e.target.value)}
//                 className="pl-10 pr-4 py-2 w-64 text-xs border-slate-200 focus:border-purple-500 focus:ring-purple-500"
//               />
//             </div>
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="p-0">
//           <div className="overflow-x-auto rounded-xl border border-slate-200">
//             <Table className="border-collapse">
//               <TableHeader>
//                 <TableRow className="bg-gradient-to-r from-slate-100 to-slate-200 border-0">
//                   {lineItemKeys.map((key) => (
//                     <TableHead key={key} className="capitalize font-bold text-slate-700 border-0 py-3 px-4 text-xs">{key.replace(/_/g, ' ')}</TableHead>
//                   ))}
//                   <TableHead className="font-bold text-slate-700 border-0 py-3 px-4 text-xs">Actions</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filteredLineItems.map((item: any, index: number) => {
//                   const drilldownKeys = item.drilldown && item.drilldown.rows.length > 0 ? Object.keys(item.drilldown.rows[0]) : [];
//                   return (
//                                     <Fragment key={index}>
//                     <TableRow className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 border-0 transition-all duration-200">
//                       {lineItemKeys.map((key) => (
//                         <TableCell key={key} className="text-slate-700 border-0 py-3 px-4 font-medium">
//                          {key === 'status' ? (
//                              <Badge className={item[key as keyof typeof item] === 'pass' ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-2 py-1 font-semibold rounded-full shadow-sm text-xs' : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-2 py-1 font-semibold rounded-full shadow-sm text-xs'}>
//                               {String(item[key as keyof typeof item])}
//                             </Badge>
//                           ) : (
//                             String(item[key as keyof typeof item])
//                           )}
//                        </TableCell>
//                       ))}
//                       <TableCell className="text-slate-700 border-0 py-3 px-4">
//                         {item.drilldown && (
//                           <Button variant="ghost" size="icon" onClick={() => handleToggleDrilldown(index)} className="hover:bg-purple-100 hover:text-purple-600 transition-all duration-200 rounded-full h-8 w-8">
//                             <Eye className="h-3 w-3" />
//                           </Button>
//                         )}
//                       </TableCell>
//                     </TableRow>
//                     {openDrilldown === index && item.drilldown && (
//                       <TableRow className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 border-0">
//                         <TableCell colSpan={lineItemKeys.length + 1} className="p-0 border-0">
//                           <div className="p-3">
//                              <Card className="gap-0 shadow-md rounded-xl border border-purple-200 bg-white/90">
//                                                                     <CardHeader className="p-3">
//                                     <CardTitle className="text-base font-bold text-purple-800 flex items-center gap-2">
//                                       <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></div>
//                                       Drilldown Details
//                                     </CardTitle>
//                                 </CardHeader>
//                                 <CardContent className="p-0">
//                                     <div className="overflow-x-auto rounded-lg border border-purple-100">
//                                       <Table className="border-collapse">
//                                     <TableHeader>
//                                         <TableRow className="bg-gradient-to-r from-purple-100 to-pink-100 border-0">
//                                         {drilldownKeys.map(key => (
//                                             <TableHead key={key} className="capitalize font-bold text-purple-700 border-0 py-2 px-3 text-xs">{key.replace(/_/g, ' ')}</TableHead>
//                                         ))}
//                                         </TableRow>
//                                     </TableHeader>
//                                     <TableBody>
//                                         {item.drilldown.rows.map((drilldownRow: any, drilldownIndex: number) => (
//                                         <TableRow key={drilldownIndex} className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 border-0 transition-all duration-200">
//                                             {drilldownKeys.map(key => (
//                                                 <TableCell key={key} className="text-purple-700 border-0 py-2 px-3 font-medium text-xs">{String(drilldownRow[key as keyof typeof drilldownRow])}</TableCell>
//                                             ))}
//                                         </TableRow>
//                                         ))}
//                                     </TableBody>
//                                     </Table>
//                                     </div>
//                                 </CardContent>
//                               </Card>
//                           </div>
//                         </TableCell>
//                       </TableRow>
//                     )}
//                   </Fragment>
//                 )})}
//               </TableBody>
//             </Table>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default ValidationReport;
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { X, Eye } from 'lucide-react';
import CustomTableData from '../../../utils/CustomTableData';

interface TableWiseReportProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

interface DrilldownData {
  field: any;
  tableName: string;
  tableDesc: string;
  sourceInfo: string;
  sourceField: string;
  targetInfo: string;
  targetField: string;
}

const formatValue = (value: any): string => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
};

const formatDateTime = (dateStr: string | undefined): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

const TableWiseValidationReport: React.FC<TableWiseReportProps> = ({ isOpen, onClose, data }) => {
  const [filter, setFilter] = useState<'all' | 'pass' | 'fail'>('all');
  const [drilldownModal, setDrilldownModal] = useState<DrilldownData | null>(null);

  // Reset filter to 'all' whenever the dialog opens
  useEffect(() => {
    if (isOpen) {
      setFilter('all');
    }
  }, [isOpen]);

  const filterResults = (filterType: 'all' | 'pass' | 'fail') => {
    setFilter(filterType);
  };

  if (!data || !isOpen) return null;

  const header = data.header || {};
  const tableWiseData = data.table_wise_data || [];
  const fieldSummary = data.field_summary?.rows || [];
  const ruleWiseSummary = data.rule_wise_summary?.rows || [];

  // Calculate summary stats from rule_wise_summary instead of counting fields
  let totalCount = 0;
  let passedCount = 0;
  let failedCount = 0;

  ruleWiseSummary.forEach((rule: any) => {
    totalCount++;
    if (rule.overall_status === 'PASS') passedCount++;
    else if (rule.overall_status === 'FAIL') failedCount++;
  });

  const hasFailed = fieldSummary.some((row: any) => row['Overall Status'] === 'Failed');
  const overallResult = hasFailed ? 'fail' : 'pass';

  const parseSourceVsTarget = (svt: string, tableName: string, targetTables: string) => {
    if (!svt || !svt.includes('_vs_')) {
      return { sourceInfo: tableName, targetInfo: targetTables || '-', sourceField: '', targetField: '' };
    }

    const parts = svt.split('_vs_');
    let sourceInfo = tableName;
    let targetInfo = targetTables || '-';
    let sourceField = '';
    let targetField = '';

    if (parts[0].includes('.')) {
      const sourceParts = parts[0].split('.');
      sourceInfo = sourceParts[0];
      sourceField = sourceParts[1];
    } else {
      sourceField = parts[0];
    }

    if (parts[1].includes('.')) {
      const targetParts = parts[1].split('.');
      targetInfo = targetParts[0];
      targetField = targetParts[1];
    } else if (parts[1] === 'CONSTANT') {
      targetInfo = 'CONSTANT';
      targetField = 'Fixed Value';
    } else {
      targetField = parts[1];
    }

    return { sourceInfo, targetInfo, sourceField, targetField };
  };

  const openDrilldown = (field: any, tableData: any) => {
    const svt = field.source_vs_target || '';
    const parsed = parseSourceVsTarget(svt, tableData.table_name, tableData.target_tables);

    setDrilldownModal({
      field,
      tableName: tableData.table_name,
      tableDesc: tableData.table_description,
      sourceInfo: parsed.sourceInfo,
      sourceField: parsed.sourceField,
      targetInfo: parsed.targetInfo,
      targetField: parsed.targetField,
    });
  };

  // Get rule IDs to show based on filter
  const getVisibleRuleIds = (): Set<string> => {
    if (filter === 'all') {
      return new Set(ruleWiseSummary.map((rule: any) => rule.rule_id));
    }
    return new Set(
      ruleWiseSummary
        .filter((rule: any) => filter === 'pass' ? rule.overall_status === 'PASS' : rule.overall_status === 'FAIL')
        .map((rule: any) => rule.rule_id)
    );
  };

  const visibleRuleIds = getVisibleRuleIds();

  const shouldShowTable = (tableData: any): boolean => {
    if (filter === 'all') return true;

    const fields = tableData.fields || [];
    const hasMatch = fields.some((field: any) => {
      const ruleId = field.rule_name || '';
      return visibleRuleIds.has(ruleId);
    });

    return hasMatch;
  };

  const shouldShowRow = (field: any): boolean => {
    if (filter === 'all') return true;
    const ruleId = field.rule_name || '';
    return visibleRuleIds.has(ruleId);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[98vw] h-[96vh] p-0 gap-0 flex flex-col overflow-hidden bg-gray-100">
          {/* Header with Filter Buttons */}
          <DialogHeader className="px-4 py-3 bg-blue-50 flex-shrink-0 border-b border-[#F1F1F1]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <DialogTitle className="text-base font-bold text-[#0071E9]">Validation Results</DialogTitle>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => filterResults('all')}
                    className={`px-2 rounded-lg text-xs font-semibold transition-all border-2 ${
                      filter === 'all' 
                        ? 'bg-[#0071E9] text-white border-[#0071E9] shadow-md' 
                        : 'bg-blue-50 border-[#0071E9] text-[#0071E9] hover:bg-blue-50'
                    }`}
                  >
                    ALL - {totalCount}
                  </button>
                  <button
                    onClick={() => filterResults('pass')}
                    className={`px-2 rounded-lg text-xs font-semibold transition-all border-2 ${
                      filter === 'pass' 
                        ? 'bg-green-600 text-white border-green-700 shadow-md' 
                        : 'bg-blue-50 border-green-600 text-green-700 hover:bg-green-50'
                    }`}
                  >
                    PASSED - {passedCount}
                  </button>
                  <button
                    onClick={() => filterResults('fail')}
                    className={`px-2 rounded-lg text-xs font-semibold transition-all border-2 ${
                      filter === 'fail' 
                        ? 'bg-red-500 text-white border-red-600 shadow-md' 
                        : 'bg-blue-50 border-red-500 text-red-600 hover:bg-red-50'
                    }`}
                  >
                    FAILED - {failedCount}
                  </button>
                </div>
              </div>
            
            </div>
          </DialogHeader>

          {/* General Info - Compact */}
          <Card className="mx-2 my-2 flex-shrink-0 p-3 gap-0 bg-blue-50/30 border border-[#F1F1F1]">
            <CardContent className="p-2">
              <div className="grid grid-cols-4 gap-x-4 gap-y-1 text-xs">
                <div className="flex py-0">
                  <span className="font-semibold text-[#0071E9] min-w-[100px] text-xs">Validation ID:</span>
                  <span className="text-gray-800 text-xs font-medium">{header.validation_id || '-'}</span>
                </div>
                <div className="flex py-0">
                  <span className="font-semibold text-[#0071E9] min-w-[100px] text-xs">Description:</span>
                  <span className="text-gray-800 text-xs font-medium">{header.validation_description || '-'}</span>
                </div>
                <div className="flex py-0">
                  <span className="font-semibold text-[#0071E9] min-w-[100px] text-xs">Executed By:</span>
                  <span className="text-gray-800 text-xs font-medium">{header.executed_by || '-'}</span>
                </div>
                <div className="flex py-0">
                  <span className="font-semibold text-[#0071E9] min-w-[100px] text-xs">Date/Time:</span>
                  <span className="text-gray-800 text-xs font-medium">{formatDateTime(header.execution_date_time)}</span>
                </div>
                <div className="flex py-0">
                  <span className="font-semibold text-[#0071E9] min-w-[100px] text-xs">Application:</span>
                  <span className="text-gray-800 text-xs font-medium">{header.application_label || '-'}</span>
                </div>
                <div className="flex py-0">
                  <span className="font-semibold text-[#0071E9] min-w-[100px] text-xs">Module:</span>
                  <span className="text-gray-800 text-xs font-medium">{header.module || '-'}</span>
                </div>
                <div className="flex py-0">
                  <span className="font-semibold text-[#0071E9] min-w-[100px] text-xs">Transaction Code:</span>
                  <span className="text-gray-800 text-xs font-medium">{header.tcode || '-'}</span>
                </div>
                <div className="flex py-0">
                  <span className="font-semibold text-[#0071E9] min-w-[100px] text-xs">Input Document:</span>
                  <span className="text-gray-800 text-xs font-medium">{header.input_document || '-'}</span>
                </div>
                <div className="flex py-0">
                  <span className="font-semibold text-[#0071E9] min-w-[100px] text-xs">Execution Time:</span>
                  <span className="text-gray-800 text-xs font-medium">
                    {header.execution_time ? `${typeof header.execution_time === 'number' ? header.execution_time.toFixed(3) : header.execution_time}s` : '-'}
                  </span>
                </div>
                <div className="flex py-0">
                  <span className="font-semibold text-[#0071E9] min-w-[100px] text-xs">Job ID:</span>
                  <span className="text-gray-800 text-xs font-medium">{header.job_id || '-'}</span>
                </div>
                <div className="flex py-0">
                  <span className="font-semibold text-[#0071E9] min-w-[100px] text-xs">Test Cycle:</span>
                  <span className="text-gray-800 text-xs font-medium">{header.test_cycle || '-'}</span>
                </div>
                <div className="flex py-0">
                  <span className="font-semibold text-[#0071E9] min-w-[100px] text-xs">Overall Result:</span>
                  <Badge 
                    className={`ml-1 text-xs h-5 px-2 ${
                      overallResult === 'pass' 
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-300' 
                        : 'bg-red-100 text-red-700 border-red-300'
                    }`}
                  >
                    {overallResult.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-1 pb-2 pt-2 w-full">
            {tableWiseData.map((tableData: any, idx: number) => {
              if (!shouldShowTable(tableData)) return null;

              const tableKeys = Object.entries(tableData.table_keys || {})
                .map(([k, v]) => `${k}: ${v}`)
                .join(', ');
              const targetTables = tableData.target_tables || '-';

              return (
                <Card key={idx} className="mb-2 overflow-hidden p-0 gap-0 border border-[#F1F1F1] shadow-sm w-full">
                  {/* Table Header */}
                  <div className="bg-white px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                      <span className="font-bold text-[#0071E9]">Dataset {tableData.dataset} ({tableData.table_name})</span>
                      <span className="text-[#0071E9]">|</span>
                      <span className="text-[#0071E9]">{tableData.table_description}</span>
                      <span className="text-[#0071E9]">|</span>
                      <span className="text-sm italic text-[#0071E9]">Keys: {tableKeys}</span>
                    </div>
                  </div>

                  {/* Table Content */}
                  {(() => {
                    const visibleFields = (tableData.fields || []).filter((field: any) => shouldShowRow(field));
                    
                    const columns = (tableData.columns || []).map((col: string) => ({
                      key: col.toLowerCase().replace(/\s+/g, '_'),
                      header: col,
                      align: 'left' as const,
                      sortable: true,
                      colWidth: `${100 / (tableData.columns?.length || 1)}%`,
                    }));

                    const tableRows = visibleFields.map((field: any, fieldIdx: number) => {
                        const resultClass = field.result?.toLowerCase() || '';
                        const svt = field.source_vs_target || '';
                        const parsed = parseSourceVsTarget(svt, tableData.table_name, tableData.target_tables);

                        let actualValueCell: React.ReactNode = formatValue(field.actual_value);
                        if (field.drilldown && field.drilldown.rows && field.drilldown.rows.length > 0) {
                          actualValueCell = (
                            <button
                              onClick={() => openDrilldown(field, tableData)}
                              className="text-black underline hover:text-gray-700 cursor-pointer font-medium transition-colors"
                            >
                              {formatValue(field.actual_value)}
                            </button>
                          );
                        }

                        const sourceVsTarget = (
                          <div className="flex items-center gap-1.5 flex-wrap text-xs">
                            <Badge variant="outline" className="bg-white text-[#0071E9] border-[#0071E9] text-[11px] px-2 py-0.5 rounded-full">
                              {parsed.sourceInfo}.{parsed.sourceField}
                            </Badge>
                            <span className="text-[#6b7280] font-semibold text-[11px]">→</span>
                            {parsed.targetInfo === 'CONSTANT' ? (
                              <Badge variant="outline" className="bg-white text-[#0071E9] border-[#0071E9] text-[11px] px-2 py-0.5 rounded-full">
                                CONSTANT
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-white text-[#0071E9] border-[#0071E9] text-[11px] px-2 py-0.5 rounded-full">
                                {parsed.targetInfo}.{parsed.targetField}
                              </Badge>
                            )}
                          </div>
                        );

                        const resultBadge = (
                          <Badge
                            variant={resultClass === 'pass' ? 'secondary' : 'destructive'}
                            className={`text-xs px-1.5 py-0.5 ${
                              resultClass === 'pass'
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                : 'bg-red-100 text-red-700 border-red-300'
                            }`}
                          >
                            {field.result || '-'}
                          </Badge>
                        );

                        const validationBadge = (
                          <Badge variant="outline" className="bg-gray-50 text-black border-gray-300 text-xs font-mono px-1.5 py-0.5">
                            {field.validation || '-'}
                          </Badge>
                        );

                        const row: Record<string, any> = {};
                        (tableData.columns || []).forEach((col: string) => {
                          const key = col.toLowerCase().replace(/\s+/g, '_');
                          const norm = col.toLowerCase().trim();
                          if (norm === 'field' || norm.includes('source') || norm.includes('target')) {
                            row[key] = sourceVsTarget;
                          } else if (norm.includes('field')) {
                            row[key] = field.field_text || '-';
                          } else if (col.toLowerCase().includes('actual') || col.toLowerCase().includes('value')) {
                            row[key] = actualValueCell;
                          } else if (col.toLowerCase().includes('validation') || col.toLowerCase().includes('operator')) {
                            row[key] = validationBadge;
                          } else if (col.toLowerCase().includes('expected')) {
                            row[key] = formatValue(field.expected_value);
                          } else if (col.toLowerCase().includes('result') || col.toLowerCase().includes('status')) {
                            row[key] = resultBadge;
                          } else {
                            row[key] = field[col] || '-';
                          }
                        });
                        row._id = fieldIdx;
                        return row;
                      });

                    return (
                      <div className="w-full overflow-x-auto">
                        <CustomTableData
                          data={tableRows}
                          columns={columns}
                          rowKey="_id"
                          HorizontalScroll={false}
                        />
                      </div>
                    );
                  })()}
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Drilldown Modal */}
      {drilldownModal && (
        <Dialog open={!!drilldownModal} onOpenChange={() => setDrilldownModal(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col gap-1 [&>button]:hidden">
          <DialogHeader className="bg-blue-50 border-b border-[#F1F1F1] rounded-t-lg relative pr-10 pb-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDrilldownModal(null)}
                className="absolute right-4 top-2 h-7 w-7 text-[#0071E9] hover:bg-blue-50 rounded-lg border border-[#0071E9] bg-white"
              >
                <X className="h-4 w-4" />
              </Button>
              <DialogTitle className="text-[#0071E9] text-lg font-bold p-1">
                Validation Details: {drilldownModal.sourceInfo}.{drilldownModal.sourceField} →{' '}
                {drilldownModal.targetInfo}.{drilldownModal.targetField}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto">
              {/* Info Section - Side by Side Layout */}
            <Card className="mb-2 p-0 gap-0 border border-[#F1F1F1]">
                <CardContent className="p-4">
                  <div className="grid grid-cols-5 gap-4 text-xs">
                    {/* Row 1 */}
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-[#0071E9] text-xs">Source Table</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs">
                          {drilldownModal.sourceInfo}
                        </Badge>
                        <span className="text-gray-600 text-xs">({drilldownModal.tableDesc})</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-[#0071E9] text-xs">Field Name</span>
                      <span className="text-gray-800 font-medium text-xs">{drilldownModal.field.field || drilldownModal.sourceField}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-[#0071E9] text-xs">Field Text</span>
                      <span className="text-gray-800 text-xs">{drilldownModal.field.field_text || '-'}</span>
                    </div>
                    
                    {/* Row 2 */}
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-[#0071E9] text-xs">Source Field</span>
                      <span className="text-gray-800 text-xs">
                        {drilldownModal.sourceInfo}.{drilldownModal.sourceField}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-[#0071E9] text-xs">Source Aggregated</span>
                      <span className="text-gray-800 font-medium text-xs">{formatValue(drilldownModal.field.actual_value)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-[#0071E9] text-xs">Target Table</span>
                      <Badge variant="outline" className="bg-blue-50 text-[#0071E9] border-blue-400 text-xs w-fit">
                        {drilldownModal.targetInfo}
                      </Badge>
                    </div>
                    
                    {/* Row 3 */}
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-[#0071E9] text-xs">Target Field</span>
                      <span className="text-gray-800 text-xs">{drilldownModal.targetInfo}.{drilldownModal.targetField}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-[#0071E9] text-xs">Target Value</span>
                      <span className="text-gray-800 font-medium text-xs">{formatValue(drilldownModal.field.expected_value)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-[#0071E9] text-xs">Status</span>
                      <Badge
                        variant={drilldownModal.field.result === 'PASS' ? 'secondary' : 'destructive'}
                        className={`text-xs w-fit ${
                          drilldownModal.field.result === 'PASS'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                            : 'bg-red-100 text-red-700 border-red-300'
                        }`}
                      >
                        {drilldownModal.field.result}
                      </Badge>
                    </div>
                    
                    {/* Row 4 - Error Message if exists */}
                    {drilldownModal.field.error_message && (
                      <div className="flex flex-col gap-1 col-span-3">
                        <span className="font-semibold text-[#0071E9] text-xs">Error Message</span>
                        <span className="text-red-700 text-xs">{drilldownModal.field.error_message}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Drilldown Table */}
              {drilldownModal.field.drilldown && drilldownModal.field.drilldown.rows && drilldownModal.field.drilldown.rows.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-[#0071E9] mb-3 flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-200 rounded-full"></div>
                    Detailed Records
                  </h3>
                  {(() => {
                    const drilldownColumns = (drilldownModal.field.drilldown.columns || []).map((col: string) => ({
                      key: col.toLowerCase().replace(/\s+/g, '_'),
                      header: col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, ' '),
                      align: 'left' as const,
                      sortable: true,
                      colWidth: `${100 / (drilldownModal.field.drilldown.columns?.length || 1)}%`,
                    }));

                    const drilldownRows = (drilldownModal.field.drilldown.rows || []).map((row: any, rowIdx: number) => {
                        const normalizedRow: Record<string, any> = { _id: rowIdx };
                        (drilldownModal.field.drilldown.columns || []).forEach((col: string) => {
                          const normalizedCol = col.toLowerCase().trim();
                          const key = col.toLowerCase().replace(/\s+/g, '_');
                          
                          let rowValue = Object.keys(row).find(k => k.toLowerCase() === normalizedCol)
                            ? row[Object.keys(row).find(k => k.toLowerCase() === normalizedCol)!]
                            : undefined;
                          
                          if (rowValue === undefined) {
                            const variations = [
                              normalizedCol.replace(/\s+/g, '_'),
                              normalizedCol.replace(/\s+/g, ''),
                              normalizedCol.replace(/\s+/g, '-'),
                              normalizedCol.replace(/s$/, ''),
                              normalizedCol.replace(/s$/, '').replace(/\s+/g, '_'),
                            ];
                            
                            for (const variation of variations) {
                              if (row.hasOwnProperty(variation)) {
                                rowValue = row[variation];
                                break;
                              }
                              const matchingKey = Object.keys(row).find(k => 
                                k.toLowerCase() === variation
                              );
                              if (matchingKey) {
                                rowValue = row[matchingKey];
                                break;
                              }
                            }
                          }
                          
                          if (rowValue === undefined) {
                            const rowKeys = Object.keys(row);
                            const normalizedColNoSpaces = normalizedCol.replace(/[\s\-_]/g, '').replace(/s$/, '');
                            const matchingKey = rowKeys.find(k => {
                              const normalizedKey = k.toLowerCase().replace(/[\s\-_]/g, '').replace(/s$/, '');
                              return normalizedKey === normalizedColNoSpaces;
                            });
                            if (matchingKey) {
                              rowValue = row[matchingKey];
                            }
                          }
                          
                          if (rowValue === undefined) {
                            rowValue = row[col] ?? row[col.toLowerCase()] ?? '-';
                          }
                          
                           normalizedRow[key] = formatValue(rowValue);
                        });
                        return normalizedRow;
                      });

                    return (
                      <div className="overflow-x-auto rounded-xl border border-[#F1F1F1] bg-white shadow-sm w-full">
                        <CustomTableData
                          data={drilldownRows}
                          columns={drilldownColumns}
                          rowKey="_id"
                          HorizontalScroll={false}
                        />
                      </div>
                    );
                  })()}
                </div>
                
              )}

              {/* Summary Row - Show comparison result */}
              <div className="mt-3 p-3 bg-white border border-[#F1F1F1] rounded-lg text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#0071E9]">Comparison:</span>
                    <Badge variant="outline" className="bg-white px-3 py-1 border-[#F1F1F1] text-xs font-mono text-[#0071E9]">
                      {formatValue(drilldownModal.field.actual_value)} {drilldownModal.field.validation === 'EQ' ? '=' : drilldownModal.field.validation || ''} {formatValue(drilldownModal.field.expected_value)}
                    </Badge>
                  </div>
                  <Badge
                    variant={drilldownModal.field.result === 'PASS' ? 'secondary' : 'destructive'}
                    className={`text-xs ${
                      drilldownModal.field.result === 'PASS'
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                        : 'bg-red-100 text-red-700 border-red-300'
                    }`}
                  >
                    {drilldownModal.field.result}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 p-3 bg-white border border-[#F1F1F1] rounded text-xs">
                <strong className="text-[#0071E9]">Total Detail Records:</strong> <span className="text-[#0071E9] font-semibold">{drilldownModal.field.drilldown.rows.length}</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default TableWiseValidationReport;

