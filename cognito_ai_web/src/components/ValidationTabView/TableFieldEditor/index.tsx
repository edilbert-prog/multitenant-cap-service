// import React, { useState, useMemo, useEffect } from 'react';
// import { FieldRule, TableData } from '../types';
// import { Button } from '../ui/button';
// import { ArrowDown, Database, Loader2, PlayCircle, Settings } from 'lucide-react';
// import { runDatabaseAction } from '../API/apiService';
// import { toast } from 'sonner';
// import { useValidationStore } from '../Stores/validationStore';
// import ShadTooltip from '../ui/shadTooltipComponent';
// import { SingleSelectCombobox } from '../SingleSelectCombobox';

// interface TableFieldEditorProps {
//   field: FieldRule;
//   tableData: TableData[];
//   filterValues: { database_connection: string };
//   relationKeys: string[];
//   onRelationKeysChange: (keys: string[]) => void;
//   onRowSelected: (side: 'left' | 'right', data: any | null) => void;
//   isReadOnly?: boolean;
// }

// interface GridState {
//   data: any[] | null;
//   cols: string[] | null;
//   isLoading: boolean;
//   title: string;
// }

// interface TableProps {
//   data: any[];
//   columns: string[];
//   isMultiSelect: boolean;
//   selectedRows: Set<number>;
//   onSelectionChange: (selectedIndexes: Set<number>) => void;
//   onSelectAll: (isSelected: boolean) => void;
//   isReadOnly?: boolean;
// }

// const DataTable: React.FC<TableProps> = ({ 
//   data, 
//   columns, 
//   isMultiSelect, 
//   selectedRows, 
//   onSelectionChange,
//   onSelectAll,
//   isReadOnly = false,
// }) => {
//   const handleRowSelect = (index: number) => {
//     if (isReadOnly) return;
//     const newSelection = new Set(selectedRows);
//     if (isMultiSelect) {
//       if (newSelection.has(index)) {
//         newSelection.delete(index);
//       } else {
//         newSelection.add(index);
//       }
//     } else {
//       if (newSelection.has(index)) {
//         newSelection.clear();
//       } else {
//         newSelection.clear();
//         newSelection.add(index);
//       }
//     }
//     onSelectionChange(newSelection);
//   };

//   const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
//     if (isReadOnly) return;
//     onSelectAll(event.target.checked);
//   };

//   const isAllSelected = selectedRows.size === data.length && data.length > 0;
//   const isIndeterminate = selectedRows.size > 0 && selectedRows.size < data.length;

//   return (
//     <div className="overflow-auto max-h-[220px] w-full">
//       <table className="min-w-full text-xs border-collapse">
//         <thead className="bg-gray-50 sticky top-0">
//           <tr>
//             <th className="border border-gray-200 p-1 w-8 min-w-8">
//               {isMultiSelect && (
//                 <input
//                   type="checkbox"
//                   checked={isAllSelected}
//                   ref={input => {
//                     if (input) input.indeterminate = isIndeterminate;
//                   }}
//                   onChange={handleSelectAll}
//                   className="rounded"
//                   disabled={isReadOnly}
//                 />
//               )}
//             </th>
//             {columns.map((col, index) => (
//               <th key={index} className="border border-gray-200 p-1 text-left font-semibold text-gray-700 uppercase whitespace-nowrap min-w-20">
//                 {col}
//               </th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {data.map((row, rowIndex) => (
//             <tr 
//               key={rowIndex} 
//               className={`hover:bg-gray-50 ${!isReadOnly && 'cursor-pointer'} ${
//                 selectedRows.has(rowIndex) ? 'bg-blue-50' : ''
//               }`}
//               onClick={() => handleRowSelect(rowIndex)}
//             >
//               <td className="border border-gray-200 p-1 text-center">
//                 <input
//                   type="checkbox"
//                   checked={selectedRows.has(rowIndex)}
//                   onChange={() => handleRowSelect(rowIndex)}
//                   className="rounded"
//                   disabled={isReadOnly}
//                 />
//               </td>
//               {columns.map((col, colIndex) => (
//                 <td key={colIndex} className="border border-gray-200 p-1 text-gray-700 whitespace-nowrap">
//                   {row[col] !== null && row[col] !== undefined ? String(row[col]) : ''}
//                 </td>
//               ))}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export const TableFieldEditor: React.FC<TableFieldEditorProps> = ({
//   field,
//   tableData,
//   filterValues,
//   relationKeys,
//   onRelationKeysChange,
//   onRowSelected,
//   isReadOnly = false,
// }) => {
//   const [leftGrid, setLeftGrid] = useState<GridState>({ data: null, cols: null, isLoading: false, title: '' });
//   const [rightGrid, setRightGrid] = useState<GridState>({ data: null, cols: null, isLoading: false, title: '' });
//   const [leftSelectedRows, setLeftSelectedRows] = useState<Set<number>>(new Set());
//   const [rightSelectedRows, setRightSelectedRows] = useState<Set<number>>(new Set());
//   const { 
//     primary_key_fields, primary_key_value, isAggregateMode, aggregateFieldId, 
//     setLeftAggregateData, setRightAggregateData, leftRowData, rightRowData 
//   } = useValidationStore();

//   const isCurrentFieldInAggregateMode = isAggregateMode && aggregateFieldId === field.unique_id;

//   const leftField = `${field.TableName}.${field.FieldName}`;
//   const rightField = relationKeys[0] || '';

//   const fieldOptions = useMemo(() => {
//     return (tableData || [])
//       .flatMap(table =>
//         table.Fields.map(f => ({
//           value: `${table.TableName}.${f.FieldName}`,
//           label: `${table.TableName}.${f.FieldName}`,
//         }))
//       )
//       .filter(f => f.value !== leftField);
//   }, [tableData, leftField]);

//   const handleFetchData = async (side: 'left' | 'right', fetchMode: 'single' | 'all') => {
//     const primaryKeyField = primary_key_fields.split(',')[0];
//     const tableName = side === 'left' ? field.TableName : rightField.split('.')[0];
//     const setGrid = side === 'left' ? setLeftGrid : setRightGrid;
//     const setSelectedRows = side === 'left' ? setLeftSelectedRows : setRightSelectedRows;

//     if (!tableName) return;

//     if (fetchMode === 'single' && (!primaryKeyField || !primary_key_value)) {
//       toast.error("Primary key field and value must be set in Step 1 to fetch a specific record.");
//       return;
//     }

//     setGrid({ data: null, cols: null, isLoading: true, title: `Data for ${tableName}` });
//     setSelectedRows(new Set());
//     onRowSelected(side, null);

//     const query = fetchMode === 'single'
//       ? `select * from ${tableName} where ${primaryKeyField}='${primary_key_value}'`
//       : `select * from ${tableName}`;

//     try {
//       const response = await runDatabaseAction({
//         payload: {
//           key: "on-submit", mode: "read", name: "S4 Hana", query, table: tableName,
//           actions: "get_data", columns: [], database: "pipeline", is_pandas: false,
//           is_polars: false, connection: filterValues.database_connection, actions_write: "write_data",
//           response_type: "json",
//         },
//       });

//       if (response && response.data) {
//         setGrid({ data: response.data, cols: response.columns, isLoading: false, title: `Data for ${tableName}` });
//         toast.success(`Successfully fetched data for ${tableName}.`);
//       } else {
//         throw new Error('Invalid API response structure');
//       }
//     } catch (error) {
//       console.error('Failed to fetch data:', error);
//       toast.error(`Failed to fetch data for ${tableName}.`);
//       setGrid({ data: null, cols: null, isLoading: false, title: '' });
//     }
//   };
  
//   useEffect(() => {
//     if(field.TableName) {
//       handleFetchData('left', primary_key_value ? 'single' : 'all');
//     }
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [field.TableName, primary_key_value]);

//   useEffect(() => {
//     if (rightField) {
//       handleFetchData('right', primary_key_value ? 'single' : 'all');
//     } else {
//       setRightGrid({ data: null, cols: null, isLoading: false, title: '' });
//       setRightSelectedRows(new Set());
//       onRowSelected('right', null);
//     }
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [rightField, primary_key_value]);

//   useEffect(() => {
//     if (leftGrid.data && leftRowData) {
//       const index = leftGrid.data.findIndex(row => JSON.stringify(row) === JSON.stringify(leftRowData));
//       if (index > -1) setLeftSelectedRows(new Set([index]));
//     }
//   }, [leftGrid.data, leftRowData]);

//   useEffect(() => {
//     if (rightGrid.data && rightRowData) {
//       const index = rightGrid.data.findIndex(row => JSON.stringify(row) === JSON.stringify(rightRowData));
//       if (index > -1) setRightSelectedRows(new Set([index]));
//     }
//   }, [rightGrid.data, rightRowData]);

//   const handleLeftSelectionChange = (selectedIndexes: Set<number>) => {
//     setLeftSelectedRows(selectedIndexes);
    
//     if (isCurrentFieldInAggregateMode) {
//       const selectedData = Array.from(selectedIndexes).map(index => leftGrid.data![index]);
//       const fieldName = field.FieldName;
//       setLeftAggregateData(selectedData.map(d => d[fieldName]));
//     } else {
//       if (selectedIndexes.size > 0) {
//         const firstIndex = Array.from(selectedIndexes)[0];
//         onRowSelected('left', leftGrid.data![firstIndex]);
//       } else {
//         onRowSelected('left', null);
//       }
//     }
//   };

//   const handleRightSelectionChange = (selectedIndexes: Set<number>) => {
//     setRightSelectedRows(selectedIndexes);
    
//     if (isCurrentFieldInAggregateMode) {
//       const selectedData = Array.from(selectedIndexes).map(index => rightGrid.data![index]);
//       const fieldName = rightField.split('.')[1];
//       setRightAggregateData(selectedData.map(d => d[fieldName]));
//     } else {
//       if (selectedIndexes.size > 0) {
//         const firstIndex = Array.from(selectedIndexes)[0];
//         onRowSelected('right', rightGrid.data![firstIndex]);
//       } else {
//         onRowSelected('right', null);
//       }
//     }
//   };

//   const handleLeftSelectAll = (isSelected: boolean) => {
//     const newSelection = isSelected && leftGrid.data ? new Set(leftGrid.data.map((_, index) => index)) : new Set<number>();
//     handleLeftSelectionChange(newSelection);
//   };

//   const handleRightSelectAll = (isSelected: boolean) => {
//     const newSelection = isSelected && rightGrid.data ? new Set(rightGrid.data.map((_, index) => index)) : new Set<number>();
//     handleRightSelectionChange(newSelection);
//   };

//   const hasLeftData = leftGrid.data && leftGrid.data.length > 0;
//   const hasRightData = rightGrid.data && rightGrid.data.length > 0;

//   return (
//     <div className="flex flex-row gap-2">
//       <div className="flex flex-col gap-2 w-64 flex-shrink-0 border border-gray-300 rounded-md p-2">
//         <div className="flex flex-col gap-2">
//           <h4 className="text-sm font-semibold text-muted-foreground">Source Field</h4>
//           <div className="flex items-center gap-2 p-2 border border-gray-300 rounded-md">
//             <ShadTooltip content={leftField.toUpperCase()}><span className="font-mono text-xs px-2 truncate">{leftField.toUpperCase()}</span></ShadTooltip>
//             <div className="flex gap-1">
//               <ShadTooltip content="Fetch data for primary key value"><Button variant='outline' size="icon" className="hover:bg-gray-200 h-7 w-7" onClick={() => handleFetchData('left', 'single')} disabled={isReadOnly}><PlayCircle className="h-4 w-4" /></Button></ShadTooltip>
//               <ShadTooltip content="Fetch all data for this table"><Button variant='outline' size="icon" className="hover:bg-gray-200 h-7 w-7" onClick={() => handleFetchData('left', 'all')} disabled={isReadOnly}><Settings className="h-4 w-4" /></Button></ShadTooltip>
//             </div>
//           </div>
//         </div>
//         <div className="flex justify-center py-0"><ArrowDown className="h-4 w-4 text-muted-foreground" /></div>
//         <div className="flex flex-col gap-2">
//           <h4 className="text-sm font-semibold text-muted-foreground">Target Field</h4>
//           <SingleSelectCombobox 
//             options={fieldOptions.map(option => ({ value: option.value, label: option.label.toUpperCase() }))} 
//             value={rightField} 
//             onChange={(value) => { 
//               if (value) { 
//                 onRelationKeysChange([value as string]);
//               } 
//             }} 
//             placeholder="Select a field to compare..." 
//             disabled={isReadOnly}
//           />
//           {rightField && (
//             <div className="flex items-center gap-2 p-2 border border-gray-300 rounded-md">
//               <ShadTooltip content={rightField.toUpperCase()}><span className="font-mono text-xs px-2 truncate">{rightField.toUpperCase()}</span></ShadTooltip>
//               <div className="flex gap-1">
//                 <ShadTooltip content="Fetch data for primary key value"><Button variant='outline' size="icon" className="hover:bg-gray-200 h-7 w-7" onClick={() => handleFetchData('right', 'single')} disabled={isReadOnly}><PlayCircle className="h-4 w-4" /></Button></ShadTooltip>
//                 <ShadTooltip content="Fetch all data for this table"><Button variant='outline' size="icon" className="hover:bg-gray-200 h-7 w-7" onClick={() => handleFetchData('right', 'all')} disabled={isReadOnly}><Settings className="h-4 w-4" /></Button></ShadTooltip>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//       <div className="flex flex-row gap-2 flex-1">
//         <div className={`flex flex-col ${hasRightData ? 'w-1/2' : 'flex-1'}`}>
//           <h4 className="text-sm font-semibold mb-2 text-left text-muted-foreground">{leftGrid.title || 'Source Table'}</h4>
//           <div className="border border-gray-300 rounded-md overflow-hidden" style={{ height: '220px' , width: '450px'}}>
//           {leftGrid.isLoading ? (
//               <div className="flex flex-col items-center justify-center h-full gap-2" >
//                 <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
//                 <span className="text-sm text-muted-foreground">Loading data...</span>
//               </div>
//             ) : hasLeftData ? (
//               <DataTable
//                 data={leftGrid.data!}
//                 columns={leftGrid.cols!}
//                 isMultiSelect={isCurrentFieldInAggregateMode}
//                 selectedRows={leftSelectedRows}
//                 onSelectionChange={handleLeftSelectionChange}
//                 onSelectAll={handleLeftSelectAll}
//                 isReadOnly={isReadOnly}
//               />
//             ) : (
//               <div className="flex flex-col items-center justify-center h-full gap-3">
//                 <Database className="h-12 w-12 text-gray-300" />
//                 <div className="text-center">
//                   <p className="text-sm font-medium text-gray-600">No source data loaded</p>
//                   <p className="text-xs text-gray-400">Click the fetch buttons to load data</p>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//         {rightField && (
//           <div className="flex flex-col w-1/2">
//             <h4 className="text-sm font-semibold mb-2 text-left text-muted-foreground">{rightGrid.title || 'Target Table'}</h4>
//             <div className="border border-gray-300 rounded-md overflow-hidden" style={{ height: '220px' , width: '450px'}}>
//               {rightGrid.isLoading ? (
//                 <div className="flex flex-col items-center justify-center h-full gap-2">
//                   <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
//                   <span className="text-sm text-muted-foreground">Loading data...</span>
//                 </div>
//               ) : hasRightData ? (
//                 <DataTable
//                   data={rightGrid.data!}
//                   columns={rightGrid.cols!}
//                   isMultiSelect={isCurrentFieldInAggregateMode}
//                   selectedRows={rightSelectedRows}
//                   onSelectionChange={handleRightSelectionChange}
//                   onSelectAll={handleRightSelectAll}
//                   isReadOnly={isReadOnly}
//                 />
//               ) : (
//                 <div className="flex flex-col items-center justify-center h-full gap-3">
//                   <Database className="h-12 w-12 text-gray-300" />
//                   <div className="text-center">
//                     <p className="text-sm font-medium text-gray-600">No target data loaded</p>
//                     <p className="text-xs text-gray-400">Click the fetch buttons to load data</p>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };
"use client"

import type React from "react"
import { useState, useMemo, useEffect, useRef } from "react"
import type { FieldRule, TableData } from "../types"
import { Button } from "../ui/button"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { ArrowRight, Database, Loader2, PlayCircle, Settings, CheckCircle, TrendingUp } from "lucide-react"
import { runDatabaseAction } from "../API/apiService"
import { getApplicationsApi } from "../API/validationApi"
import { toast } from "sonner"
import { useValidationStore } from "../Stores/validationStore"
import ShadTooltip from "../ui/shadTooltipComponent"
import DropdownV2 from "../../../utils/DropdownV2"
import { TRANSFORMATION_OPERATIONS } from "../types/deriveColumn"

interface TableFieldEditorProps {
  field: FieldRule
  tableData: TableData[]
  filterValues: {
    database_connection: string
    application_label?: string
    system_number?: string
    client_id?: string
  }
  relationKeys: string[]
  onRelationKeysChange: (keys: string[]) => void
  onRowSelected: (side: "left" | "right", data: any | null) => void
  onConnectionChange?: (connectionData: {
    source: { application: string; system_number: string; client_id: string; connection: string }
    target: { application: string; system_number: string; client_id: string; connection: string }
  }) => void
  // New: lift operator state up
  operatorValue?: string
  onOperatorChange?: (op: string) => void
  isReadOnly?: boolean
  applicationLabel?: string
  triggerCheckData?: React.RefObject<{ handleCheck: () => void } | null>
  showDropdownsOnly?: boolean
  showOperatorPanels?: boolean
}

interface GridState {
  data: any[] | null
  cols: string[] | null
  isLoading: boolean
  title: string
}

interface TableProps {
  data: any[]
  columns: string[]
  isMultiSelect: boolean
  selectedRows: Set<number>
  onSelectionChange: (selectedIndexes: Set<number>) => void
  onSelectAll: (isSelected: boolean) => void
  isReadOnly?: boolean
}

const DataTable: React.FC<TableProps> = ({
  data,
  columns,
  isMultiSelect,
  selectedRows,
  onSelectionChange,
  onSelectAll,
  isReadOnly = false,
}) => {
  // Safety checks
  if (!columns || !Array.isArray(columns) || columns.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No columns available
      </div>
    )
  }

  if (!data || !Array.isArray(data)) {
    return (
      <div className="p-4 text-center text-gray-500">
        No data available
      </div>
    )
  }

  const handleRowSelect = (index: number) => {
    if (isReadOnly) return
    const newSelection = new Set(selectedRows)
    if (isMultiSelect) {
      if (newSelection.has(index)) {
        newSelection.delete(index)
      } else {
        newSelection.add(index)
      }
    } else {
      if (newSelection.has(index)) {
        newSelection.clear()
      } else {
        newSelection.clear()
        newSelection.add(index)
      }
    }
    onSelectionChange(newSelection)
  }

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return
    onSelectAll(event.target.checked)
  }

  const isAllSelected = selectedRows.size === data.length && data.length > 0
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < data.length

  return (
    <div className="overflow-auto max-h-[220px] w-full">
      <table className="min-w-full text-xs border-collapse">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="border border-gray-200 p-1 w-8 min-w-8">
              {isMultiSelect && (
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isIndeterminate
                  }}
                  onChange={handleSelectAll}
                  className="rounded"
                  disabled={isReadOnly}
                />
              )}
            </th>
            {columns.map((col, index) => (
              <th
                key={index}
                className="border border-gray-200 p-1 text-left font-semibold text-gray-700 uppercase whitespace-nowrap min-w-20"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`hover:bg-gray-50 ${!isReadOnly && "cursor-pointer"} ${
                selectedRows.has(rowIndex) ? "bg-blue-50" : ""
              }`}
              onClick={() => handleRowSelect(rowIndex)}
            >
              <td className="border border-gray-200 p-1 text-center">
                <input
                  type="checkbox"
                  checked={selectedRows.has(rowIndex)}
                  onChange={() => handleRowSelect(rowIndex)}
                  className="rounded"
                  disabled={isReadOnly}
                />
              </td>
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="border border-gray-200 p-1 text-gray-700 whitespace-nowrap">
                  {row[col] !== null && row[col] !== undefined ? String(row[col]) : ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const TableFieldEditor: React.FC<TableFieldEditorProps> = ({
  field,
  tableData,
  filterValues,
  relationKeys,
  onRelationKeysChange,
  onRowSelected,
  onConnectionChange,
  operatorValue,
  onOperatorChange,
  isReadOnly = false,
  applicationLabel,
  triggerCheckData,
  showDropdownsOnly = false,
  showOperatorPanels = false,
}) => {
  const [leftGrid, setLeftGrid] = useState<GridState>({ data: null, cols: null, isLoading: false, title: "" })
  const [rightGrid, setRightGrid] = useState<GridState>({ data: null, cols: null, isLoading: false, title: "" })
  const [leftSelectedRows, setLeftSelectedRows] = useState<Set<number>>(new Set())
  const [rightSelectedRows, setRightSelectedRows] = useState<Set<number>>(new Set())
  const [applications, setApplications] = useState<Array<{value: string, label: string}>>([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  const [selectedSourceApplication, setSelectedSourceApplication] = useState<string>("")
  const [selectedTargetApplication, setSelectedTargetApplication] = useState<string>("")
  const [selectedTargetSystemId, setSelectedTargetSystemId] = useState<string>("")
  const [selectedTargetClientId, setSelectedTargetClientId] = useState<string>("")
  const [selectedTargetTable, setSelectedTargetTable] = useState<string>("")
  
  // Track the last application label we loaded for to prevent duplicate API calls
  const lastLoadedApplicationLabel = useRef<string | null>(null)
  const [isRestoringSelections, setIsRestoringSelections] = useState(false)

  // Source connection state - only using store/filterValues, no local state needed
  // Connection settings will come from store (from TableMappingConfig) or filterValues

  // Operation Panel State
  const [targetOperation, setTargetOperation] = useState<string[]>([])
  const [sourceOperation, setSourceOperation] = useState<string[]>([])
  const [targetOperationParams, setTargetOperationParams] = useState<Record<string, any>>({})
  const [sourceOperationParams, setSourceOperationParams] = useState<Record<string, any>>({})
  const [targetCheckDataResults, setTargetCheckDataResults] = useState<any[]>([])
  const [sourceCheckDataResults, setSourceCheckDataResults] = useState<any[]>([])
  const [activeTargetTab, setActiveTargetTab] = useState<'aggregate' | 'string'>('aggregate')
  const [activeSourceTab, setActiveSourceTab] = useState<'aggregate' | 'string'>('aggregate')
  const [simulationResult, setSimulationResult] = useState<{
    validated: boolean, 
    message: string,
    targetInitialValues: any[],
    sourceInitialValues: any[],
    targetOperations: string[],
    sourceOperations: string[],
    targetResults: Record<string, any>,
    sourceResults: Record<string, any>,
    targetOperationStatus?: Record<string, boolean>,
    sourceOperationStatus?: Record<string, boolean>
  } | null>(null)

  // Get operations based on category (string vs aggregation)
  const aggregateOperationOptions = TRANSFORMATION_OPERATIONS
    .filter(op => op.category === 'aggregation')
    .map(op => ({ value: op.name, label: op.label }))

  const stringOperationOptions = TRANSFORMATION_OPERATIONS
    .filter(op => op.category === 'string')
    .map(op => ({ value: op.name, label: op.label }))

  // Track if connection initialization has already run to prevent infinite loops
  const hasInitializedConnectionsRef = useRef(false)
  const previousFieldConfigRef = useRef<string>("")

  // Field-specific selection state to preserve selections when switching between rules
  const [fieldSelectionState, setFieldSelectionState] = useState<{
    [fieldId: string]: {
      leftSelectedRows: Set<number>
      rightSelectedRows: Set<number>
      leftRowData: any
      rightRowData: any
      leftAggregateData: any[]
      rightAggregateData: any[]
    }
  }>({})
  const {
    primary_key_fields,
    primary_key_value,
    isAggregateMode,
    aggregateFieldId,
    setLeftAggregateData,
    setRightAggregateData,
    leftRowData,
    rightRowData,
    leftAggregateData,
    rightAggregateData,
    selected_secondary_tables,
    system_number,
    client_id,
    database_connection,
    fieldOperations,
    setFieldOperations,
  } = useValidationStore()

  const isCurrentFieldInAggregateMode = isAggregateMode && aggregateFieldId === field.unique_id

  // Use aggregate operations if in aggregate mode, otherwise string operations
  const operationOptions = isCurrentFieldInAggregateMode ? aggregateOperationOptions : stringOperationOptions

  const leftField = `${field.TableName}.${field.FieldName}`
  const rightField = relationKeys[0] || ""

  // Save current selection state when field changes
  useEffect(() => {
    if (field.unique_id) {
      setFieldSelectionState(prev => ({
        ...prev,
        [field.unique_id]: {
          leftSelectedRows: new Set(leftSelectedRows),
          rightSelectedRows: new Set(rightSelectedRows),
          leftRowData,
          rightRowData,
          leftAggregateData: leftAggregateData || [],
          rightAggregateData: rightAggregateData || []
        }
      }))
    }
  }, [field.unique_id, leftSelectedRows, rightSelectedRows, leftRowData, rightRowData, leftAggregateData, rightAggregateData])

  // Restore selection state when field changes
  useEffect(() => {
    if (field.unique_id && fieldSelectionState[field.unique_id]) {
      const savedState = fieldSelectionState[field.unique_id]
      setIsRestoringSelections(true)
      
      setLeftSelectedRows(new Set(savedState.leftSelectedRows))
      setRightSelectedRows(new Set(savedState.rightSelectedRows))
      
      // Restore store values
      if (savedState.leftRowData) {
        onRowSelected("left", savedState.leftRowData)
      }
      if (savedState.rightRowData) {
        onRowSelected("right", savedState.rightRowData)
      }
      if (savedState.leftAggregateData.length > 0) {
        setLeftAggregateData(savedState.leftAggregateData)
      }
      if (savedState.rightAggregateData.length > 0) {
        setRightAggregateData(savedState.rightAggregateData)
      }
      
      setIsRestoringSelections(false)
    }
  }, [field.unique_id])

  // Track if operations were loaded from config
  const operationsLoadedFromConfig = useRef(false)
  
  // Load field operations from store when field changes
  const previousFieldId = useRef<string>("")
  useEffect(() => {
    if (field.unique_id !== previousFieldId.current) {
      previousFieldId.current = field.unique_id
      operationsLoadedFromConfig.current = false
      
      // First try to get from store (for runtime changes)
      if (field.unique_id && fieldOperations[field.unique_id]) {
        const ops = fieldOperations[field.unique_id]
        const flatten = (v: any): string[] => Array.isArray(v) ? v.flat(Infinity).map(String).filter(Boolean) : (v ? [String(v)] : [])
        setTargetOperation(flatten(ops.targetOperation))
        setSourceOperation(flatten(ops.sourceOperation))
        setTargetOperationParams(ops.targetOperationParams || {})
        setSourceOperationParams(ops.sourceOperationParams || {})
      }
      // Otherwise, try to load from field.config (for saved data)
      else if (field.config && (field.config as any).key_config) {
        const keyConfig = (field.config as any).key_config
        const flatten = (v: any): string[] => Array.isArray(v) ? v.flat(Infinity).map(String).filter(Boolean) : (v ? [String(v)] : [])
        const targetOp = keyConfig.source?.operation
        const sourceOp = keyConfig.target?.operation
        setTargetOperation(flatten(targetOp))
        setSourceOperation(flatten(sourceOp))
        setTargetOperationParams({})
        setSourceOperationParams({})
        operationsLoadedFromConfig.current = true
      }
      // Otherwise reset
      else {
        setTargetOperation([])
        setSourceOperation([])
        setTargetOperationParams({})
        setSourceOperationParams({})
      }
    }
  }, [field.unique_id, fieldOperations, field.config])
  
  // Track if we've already checked data for this field
  const hasCheckedDataRef = useRef(false)
  
  // Removed auto-checking; API should only be called when user clicks "Check"
  
  // Reset the flag when the field changes
  useEffect(() => {
    hasCheckedDataRef.current = false
  }, [field.unique_id])
  
  // Store handleCheckData in ref so parent can call it
  const checkDataHandlerRef = useRef({ handleCheck: () => {} })
  
  useEffect(() => {
    checkDataHandlerRef.current = {
      handleCheck: () => {
        const effectiveConnection = database_connection || filterValues.database_connection
        if (targetOperation.length > 0 && sourceOperation.length > 0 && effectiveConnection && rightField) {
          handleCheckData("both") // Call once for both sides
        }
      }
    }
  }, [targetOperation, sourceOperation, rightField, database_connection, filterValues.database_connection])
  
  // Expose handleCheck function to parent
  useEffect(() => {
    if (triggerCheckData) {
      triggerCheckData.current = checkDataHandlerRef.current
    }
  }, [triggerCheckData, targetOperation, sourceOperation, rightField, database_connection, filterValues.database_connection])

  // Save operations to store whenever they change (with debouncing to prevent infinite loops)
  const previousOpsRef = useRef({
    targetOperation: [] as string[],
    sourceOperation: [] as string[],
    targetOperationParams: {},
    sourceOperationParams: {}
  })

  useEffect(() => {
    if (field.unique_id) {
      const currentOps = {
        targetOperation,
        sourceOperation,
        targetOperationParams,
        sourceOperationParams,
      }

      // Only save if values actually changed
      const prevOps = previousOpsRef.current
      const hasChanged = 
        JSON.stringify(targetOperation) !== JSON.stringify(prevOps.targetOperation) ||
        JSON.stringify(sourceOperation) !== JSON.stringify(prevOps.sourceOperation) ||
        JSON.stringify(targetOperationParams) !== JSON.stringify(prevOps.targetOperationParams) ||
        JSON.stringify(sourceOperationParams) !== JSON.stringify(prevOps.sourceOperationParams)

      if (hasChanged) {
        previousOpsRef.current = currentOps
        setFieldOperations(field.unique_id, currentOps)
      }
    }
  }, [targetOperation, sourceOperation, targetOperationParams, sourceOperationParams, field.unique_id, setFieldOperations])
  
  // Initialize selectedTargetTable with current rightField table
  useEffect(() => {
    if (rightField) {
      setSelectedTargetTable(rightField.split('.')[0] || '')
    }
  }, [rightField])

  // Clear target table selection if it matches the source table
  useEffect(() => {
    if (selectedTargetTable === field.TableName) {
      setSelectedTargetTable('')
      onRelationKeysChange([])
    }
  }, [field.TableName, selectedTargetTable, onRelationKeysChange])

  // Fetch applications on component mount - same as TableConfigurationFilter
  useEffect(() => {
    const currentLabel = filterValues.application_label || ''
    // Only fetch if we haven't loaded for this specific application label yet
    if (lastLoadedApplicationLabel.current !== currentLabel) {
      lastLoadedApplicationLabel.current = currentLabel
      
      const fetchApplications = async () => {
        try {
          setApplicationsLoading(true)
          const response = await getApplicationsApi({ type: "application" })
          if (response && response.data) {
            const transformedApps = response.data.map((item: any) => ({
              value: String(item.id || item.value),
              label: item.name || item.label
            }))
            setApplications(transformedApps)
            // Set source application from application_label if available
            const sourceApp = transformedApps.find((app: any) => 
              app.label === applicationLabel || 
              app.label === filterValues.application_label ||
              app.label === (field as any).application_label || 
              app.value === (field as any).application_id
            )
            if (sourceApp) {
              setSelectedSourceApplication(sourceApp.value)
              setSelectedTargetApplication(sourceApp.value)
            } else if (transformedApps.length > 0) {
              setSelectedSourceApplication(transformedApps[0].value)
              setSelectedTargetApplication(transformedApps[0].value)
            }
          }
        } catch (error) {
          console.error("Error fetching applications:", error)
          toast.error("Failed to load applications")
          // Fallback to default applications
          setApplications([
            { value: "SAP", label: "SAP" },
            { value: "ORACLE", label: "Oracle" },
            { value: "SQL_SERVER", label: "SQL Server" },
            { value: "POSTGRESQL", label: "PostgreSQL" }
          ])
        } finally {
          setApplicationsLoading(false)
        }
      }

      fetchApplications()
    }
  }, [filterValues.application_label, applicationLabel, field])

  // Get selected validation tables from the store
  const selectedValidationTables = useMemo(() => {
    return selected_secondary_tables ? selected_secondary_tables.split(',') : []
  }, [selected_secondary_tables])

  // Filter table data to only include selected validation tables
  const filteredTableData = useMemo(() => {
    if (selectedValidationTables.length === 0) {
      return tableData || []
    }
    return (tableData || []).filter(table => 
      selectedValidationTables.includes(table.TableName)
    )
  }, [tableData, selectedValidationTables])

  // Filter target table data to exclude the source table
  const filteredTargetTableData = useMemo(() => {
    return filteredTableData.filter(table => 
      table.TableName !== field.TableName
    )
  }, [filteredTableData, field.TableName])

  const fieldOptions = useMemo(() => {
    return filteredTableData
      .flatMap((table) =>
        table.Fields.map((f) => ({
          value: `${table.TableName}.${f.FieldName}`,
          label: `${table.TableName}.${f.FieldName}`,
        })),
      )
      .filter((f) => f.value !== leftField)
  }, [filteredTableData, leftField])

  // Connection settings are now only retrieved from store/filterValues, not via API calls

  const handleFetchData = async (side: "left" | "right", fetchMode: "single" | "all") => {
    const primaryKeyField = primary_key_fields.split(",")[0]
    const tableName = side === "left" ? field.TableName : rightField.split(".")[0]
    const setGrid = side === "left" ? setLeftGrid : setRightGrid
    const setSelectedRows = side === "left" ? setLeftSelectedRows : setRightSelectedRows

    if (!tableName) return

    if (fetchMode === "single" && (!primaryKeyField || !primary_key_value)) {
      toast.error("Primary key field and value must be set in Step 1 to fetch a specific record.")
      return
    }

    // Use connection settings from store/filterValues (from previous page)
    const requiredConnection = database_connection || filterValues.database_connection
    const requiredClientId = client_id || filterValues.client_id
    const requiredSystemNumber = system_number || filterValues.system_number

    if (!requiredConnection || !requiredClientId || !requiredSystemNumber) {
      toast.error(`Please configure connection settings before fetching data.`)
      return
    }

    setGrid({ data: null, cols: null, isLoading: true, title: `Data for ${tableName}` })
    setSelectedRows(new Set())
    onRowSelected(side, null)

    // Build where_clause as array if fetching single row
    const whereClause =
      fetchMode === "single"
        ? [`${primaryKeyField} = '${primary_key_value}'`]
        : []

    // Use connection settings (from component, store, or filterValues)
    const connectionId = requiredConnection
    const clientId = requiredClientId
    const sysNumber = requiredSystemNumber

    try {
      const response = await runDatabaseAction({
        payload: {
          actions: "get_data",
          connection: connectionId,
          protocol_type: "RFC",
          data: {
            table: tableName,
            columns: [],
            client_id: clientId,
            system_number: sysNumber,
            ...(whereClause.length > 0 && { where_clause: whereClause }),
          },
        },
      })

      if (response && response.data && Array.isArray(response.data)) {
        // Extract columns from first data row if data exists
        const columns = response.data.length > 0 ? Object.keys(response.data[0]) : []
        setGrid({ data: response.data, cols: columns, isLoading: false, title: `Data for ${tableName}` })
        toast.success(`Successfully fetched data for ${tableName}.`)
      } else {
        throw new Error("Invalid API response structure")
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
      toast.error(`Failed to fetch data for ${tableName}.`)
      setGrid({ data: null, cols: null, isLoading: false, title: "" })
    }
  }

  // Handler for "Check Data" button
  const handleCheckData = async (side: "left" | "right" | "both") => {
    const targetTableName = field.TableName
    const sourceTableName = selectedTargetTable
    const targetFieldName = field.FieldName
    const sourceFieldName = rightField.split(".")[1] || ""
    
    // Validate inputs
    if (side === "both") {
      if (!targetTableName || !sourceTableName || !targetFieldName || !sourceFieldName || 
          targetOperation.length === 0 || sourceOperation.length === 0) {
        toast.error("Please select tables, operations, and fields before checking data.")
        return
      }
    } else {
      const tableName = side === "left" ? targetTableName : sourceTableName
      const fieldName = side === "left" ? targetFieldName : sourceFieldName
      const operation = side === "left" ? targetOperation : sourceOperation
      
      if (!tableName || operation.length === 0 || !fieldName) {
        toast.error("Please select table, operation, and field before checking data.")
        return
      }
    }

    // Use connection settings from store/filterValues (from previous page)
    const connectionId = database_connection || filterValues.database_connection
    const clientId = client_id || filterValues.client_id
    const systemNumber = system_number || filterValues.system_number

    if (!connectionId || !clientId || !systemNumber) {
      toast.error("Please configure connection settings before checking data.")
      return
    }

    // Get primary key field and value for WHERE clause
    const primaryKeyField = primary_key_fields.split(",")[0]
    const whereConditions = primaryKeyField && primary_key_value
      ? [`${primaryKeyField} = '${primary_key_value}'`]
      : []
    
    try {
      if (side === "both") {
        // Fetch both target and source in parallel with a single API call
        toast.loading("Checking data for both target and source...")
        
        // Fetch target data
        const targetResponse = await runDatabaseAction({
          payload: {
            actions: "get_data",
            connection: connectionId,
            protocol_type: "RFC",
            data: {
              table: targetTableName,
              columns: [targetFieldName, primaryKeyField],
              client_id: clientId,
              system_number: systemNumber,
              ...(whereConditions.length > 0 && { where_clause: whereConditions }),
            },
          },
        })

        // Fetch source data
        const sourceResponse = await runDatabaseAction({
          payload: {
            actions: "get_data",
            connection: connectionId,
            protocol_type: "RFC",
            data: {
              table: sourceTableName,
              columns: [sourceFieldName, primaryKeyField],
              client_id: clientId,
              system_number: systemNumber,
              ...(whereConditions.length > 0 && { where_clause: whereConditions }),
            },
          },
        })

        toast.dismiss()
        
        // Process target results
        if (targetResponse && targetResponse.data && Array.isArray(targetResponse.data)) {
          const targetValues = targetResponse.data.map((row: any) => row[targetFieldName])
          
          if (isCurrentFieldInAggregateMode) {
            setTargetCheckDataResults(targetValues)
          } else {
            const singleValue = targetValues[0]
            setTargetCheckDataResults([singleValue])
          }
        }

        // Process source results
        if (sourceResponse && sourceResponse.data && Array.isArray(sourceResponse.data)) {
          const sourceValues = sourceResponse.data.map((row: any) => row[sourceFieldName])
          
          if (isCurrentFieldInAggregateMode) {
            setSourceCheckDataResults(sourceValues)
          } else {
            const singleValue = sourceValues[0]
            setSourceCheckDataResults([singleValue])
          }
        }

        toast.success("Successfully checked data for both target and source")
      } else {
        // Single side check (for manual button clicks)
        const tableName = side === "left" ? targetTableName : sourceTableName
        const operation = side === "left" ? targetOperation : sourceOperation
        const fieldName = side === "left" ? targetFieldName : sourceFieldName
        
        toast.loading(`Checking data with ${operation.join(", ")} operation...`)
        
        const response = await runDatabaseAction({
          payload: {
            actions: "get_data",
            connection: connectionId,
            protocol_type: "RFC",
            data: {
              table: tableName,
              columns: [fieldName, primaryKeyField],
              client_id: clientId,
              system_number: systemNumber,
              ...(whereConditions.length > 0 && { where_clause: whereConditions }),
            },
          },
        })

        toast.dismiss()
        
        if (response && response.data && Array.isArray(response.data)) {
          const values = response.data.map((row: any) => row[fieldName])
          
          if (isCurrentFieldInAggregateMode) {
            if (side === "left") {
              setTargetCheckDataResults(values)
            } else {
              setSourceCheckDataResults(values)
            }
            toast.success(`Successfully fetched ${values.length} values for ${fieldName}`)
          } else {
            const singleValue = values[0]
            if (side === "left") {
              setTargetCheckDataResults([singleValue])
            } else {
              setSourceCheckDataResults([singleValue])
            }
            toast.success(`Successfully fetched value: ${singleValue}`)
          }
        }
      }
    } catch (error) {
      toast.dismiss()
      console.error("Failed to check data:", error)
      toast.error(`Failed to check data${side === "both" ? " for target and source" : ""}`)
    }
  }

  // Handler for "Simulate" button
  const handleSimulate = async () => {
    if (targetCheckDataResults.length === 0 || sourceCheckDataResults.length === 0) {
      toast.error("Please check data for both target and source before simulating.")
      return
    }

    if (targetOperation.length === 0 || sourceOperation.length === 0) {
      toast.error("Please select at least one operation for both target and source.")
      return
    }

    try {
      // Store initial values
      const targetInitialValues = [...targetCheckDataResults]
      const sourceInitialValues = [...sourceCheckDataResults]
      
      // Perform operation function
      const performOperation = (values: any[], operation: string) => {
        switch (operation.toLowerCase()) {
          case 'sum':
            return values.reduce((sum, val) => sum + (Number(val) || 0), 0)
          case 'average':
            const sum = values.reduce((sum, val) => sum + (Number(val) || 0), 0)
            return values.length > 0 ? sum / values.length : 0
          case 'max':
            return Math.max(...values.map(v => Number(v) || 0))
          case 'min':
            return Math.min(...values.map(v => Number(v) || 0))
          case 'count':
            return values.length
          case 'equals':
            return values[0]
          case 'contains':
            return values[0]
          case 'startswith':
            return values[0]
          case 'endswith':
            return values[0]
          case 'notequals':
            return values[0]
          default:
            return values[0]
        }
      }
      
      // Perform all target operations
      const targetResults: Record<string, any> = {}
      targetOperation.forEach(op => {
        targetResults[op] = performOperation(targetInitialValues, op)
      })
      
      // Perform all source operations
      const sourceResults: Record<string, any> = {}
      sourceOperation.forEach(op => {
        sourceResults[op] = performOperation(sourceInitialValues, op)
      })
      
      // Track which operations passed/failed
      const targetOperationStatus: Record<string, boolean> = {}
      const sourceOperationStatus: Record<string, boolean> = {}
      
      // Compare results (all operations must pass for overall validation)
      let validated = true
      const failedComparisons: string[] = []
      
      targetOperation.forEach((targetOp, index) => {
        const sourceOp = sourceOperation[index]
        if (sourceOp) {
          const targetValue = targetResults[targetOp]
          const sourceValue = sourceResults[sourceOp]
          const operationPassed = targetValue === sourceValue
          
          targetOperationStatus[targetOp] = operationPassed
          sourceOperationStatus[sourceOp] = operationPassed
          
          if (!operationPassed) {
            validated = false
            failedComparisons.push(`${targetOp} (${targetValue}) vs ${sourceOp} (${sourceValue})`)
          }
        }
      })
      
      const message = validated
        ? `Validation Passed: All operations match`
        : `Validation Failed: ${failedComparisons.length} operation(s) do not match`
      
      setSimulationResult({ 
        validated, 
        message,
        targetInitialValues,
        sourceInitialValues,
        targetOperations: targetOperation,
        sourceOperations: sourceOperation,
        targetResults,
        sourceResults,
        targetOperationStatus,
        sourceOperationStatus
      })
      toast.dismiss()
      toast.success("Simulation completed")
    } catch (error) {
      toast.dismiss()
      console.error("Failed to simulate:", error)
      toast.error("Failed to run simulation")
    }
  }

  // Auto-fetch functionality removed - connections are now from store only
  // Data fetching is handled via handleCheckData and handleFetchData when explicitly called

  useEffect(() => {
    if (!leftGrid.data || isRestoringSelections) return

    setIsRestoringSelections(true)

    // Restore aggregate selections if in aggregate mode
    if (isCurrentFieldInAggregateMode && leftAggregateData && leftAggregateData.length > 0) {
      const fieldName = field.FieldName
      const selectedIndexes = new Set<number>()
      leftGrid.data.forEach((row, index) => {
        if (leftAggregateData.includes(row[fieldName])) {
          selectedIndexes.add(index)
        }
      })
      console.log("[v0] Restoring left aggregate selections:", selectedIndexes)
      setLeftSelectedRows(selectedIndexes)
      setIsRestoringSelections(false)
      return
    }

    // Restore single row selection if not in aggregate mode
    if (!isCurrentFieldInAggregateMode && leftRowData) {
      const index = leftGrid.data.findIndex((row) => {
        // More robust comparison - check primary key field if available
        if (primary_key_fields && primary_key_value) {
          const primaryKeyField = primary_key_fields.split(",")[0]
          return row[primaryKeyField] === leftRowData[primaryKeyField]
        }
        // Fallback to JSON comparison
        return JSON.stringify(row) === JSON.stringify(leftRowData)
      })
      if (index > -1) {
        console.log("[v0] Restoring left selection at index:", index)
        setLeftSelectedRows(new Set([index]))
      }
    }

    setIsRestoringSelections(false)
  }, [leftGrid.data, leftRowData, isCurrentFieldInAggregateMode, leftAggregateData, field.FieldName, primary_key_fields, primary_key_value])

  useEffect(() => {
    if (!rightGrid.data || isRestoringSelections) return

    setIsRestoringSelections(true)

    // Restore aggregate selections if in aggregate mode
    if (isCurrentFieldInAggregateMode && rightAggregateData && rightAggregateData.length > 0 && rightField) {
      const fieldName = rightField.split(".")[1]
      const selectedIndexes = new Set<number>()
      rightGrid.data.forEach((row, index) => {
        if (rightAggregateData.includes(row[fieldName])) {
          selectedIndexes.add(index)
        }
      })
      console.log("[v0] Restoring right aggregate selections:", selectedIndexes)
      setRightSelectedRows(selectedIndexes)
      setIsRestoringSelections(false)
      return
    }

    // Restore single row selection if not in aggregate mode
    if (!isCurrentFieldInAggregateMode && rightRowData) {
      const index = rightGrid.data.findIndex((row) => {
        // More robust comparison - check primary key field if available
        if (primary_key_fields && primary_key_value) {
          const primaryKeyField = primary_key_fields.split(",")[0]
          return row[primaryKeyField] === rightRowData[primaryKeyField]
        }
        // Fallback to JSON comparison
        return JSON.stringify(row) === JSON.stringify(rightRowData)
      })
      if (index > -1) {
        console.log("[v0] Restoring right selection at index:", index)
        setRightSelectedRows(new Set([index]))
      }
    }

    setIsRestoringSelections(false)
  }, [rightGrid.data, rightRowData, isCurrentFieldInAggregateMode, rightAggregateData, rightField, primary_key_fields, primary_key_value])

  const handleLeftSelectionChange = (selectedIndexes: Set<number>) => {
    if (isRestoringSelections) return
    
    setLeftSelectedRows(selectedIndexes)

    if (isCurrentFieldInAggregateMode) { 
      const selectedData = Array.from(selectedIndexes).map((index) => leftGrid.data![index])
      const fieldName = field.FieldName
      const aggregateValues = selectedData.map((d) => d[fieldName])
      console.log("[v0] Setting left aggregate data:", aggregateValues)
      setLeftAggregateData(aggregateValues)
    } else {
      if (selectedIndexes.size > 0) {
        const firstIndex = Array.from(selectedIndexes)[0]
        const rowData = leftGrid.data![firstIndex]
        console.log("[v0] Setting left row data:", rowData)
        onRowSelected("left", rowData)
      } else {
        onRowSelected("left", null)
      }
    }

  }

  const handleRightSelectionChange = (selectedIndexes: Set<number>) => {
    if (isRestoringSelections) return
    
    setRightSelectedRows(selectedIndexes)

    if (isCurrentFieldInAggregateMode) { 
      const selectedData = Array.from(selectedIndexes).map((index) => rightGrid.data![index])
      const fieldName = rightField.split(".")[1]
      const aggregateValues = selectedData.map((d) => d[fieldName])
      console.log("[v0] Setting right aggregate data:", aggregateValues)
      setRightAggregateData(aggregateValues)
    } else {
      if (selectedIndexes.size > 0) { 
        const firstIndex = Array.from(selectedIndexes)[0]
        const rowData = rightGrid.data![firstIndex]
        console.log("[v0] Setting right row data:", rowData)
        onRowSelected("right", rowData)
      } else {
        onRowSelected("right", null)
      }
    }
  }

  const handleLeftSelectAll = (isSelected: boolean) => {  
    const newSelection =
      isSelected && leftGrid.data ? new Set(leftGrid.data.map((_, index) => index)) : new Set<number>()
    handleLeftSelectionChange(newSelection)
  }

  const handleRightSelectAll = (isSelected: boolean) => {
    const newSelection =
      isSelected && rightGrid.data ? new Set(rightGrid.data.map((_, index) => index)) : new Set<number>()
    handleRightSelectionChange(newSelection)
  }

  const hasLeftData = leftGrid.data && leftGrid.data.length > 0
  const hasRightData = rightGrid.data && rightGrid.data.length > 0

  // Connection settings are now retrieved from store/filterValues only, no API calls needed
  // No initialization useEffect needed since we use store values directly

  // Render dropdowns only if showDropdownsOnly is true
  if (showDropdownsOnly) {
    // Local operator state
    const [joinOperator, setJoinOperator] = useState<string>(operatorValue || "equals")

    // Combined options with descriptions: table.field — description
    const buildCombinedOptions = (tables: any[]) =>
      (tables || [])
        .flatMap((t) => (t.Fields || []).map((f: any) => {
          const textValue = `${t.TableName}.${f.FieldName}`
          const desc = f.Description || f.description || ""
          const isKey = f.KeyField === "Yes"
          const isVerification = f.VerificationField === "Yes"
          const label = (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span>{textValue}</span>
              {desc && <span className="text-gray-600">-</span>}
              {desc && <span className="text-gray-600">{desc}</span>}
              <div className="flex items-center gap-1">
                {isKey && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white bg-blue-500">K</span>
                )}
                {isVerification && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white bg-green-500">V</span>
                )}
              </div>
            </div>
          )
          return { value: textValue, label, text: textValue }
        }))

    const combinedTargetOptions = buildCombinedOptions(filteredTableData)
    const combinedSourceOptions = buildCombinedOptions(filteredTargetTableData)

    const operatorOptions = [
      { label: "equals", value: "equals" },
      { label: "not equals", value: "not equals" },
      { label: "null", value: "null" },
      { label: "not null", value: "not null" },
      { label: "empty", value: "empty" },
      { label: "not empty", value: "not empty" },
      { label: "greater than", value: "Gt" },
      { label: "less than", value: "Lt" },
      { label: "greater than equal", value: "Gte" },
      { label: "less than equal", value: "Lte" },

    ]

    useEffect(() => {
      if (operatorValue) setJoinOperator(operatorValue)
    }, [operatorValue])

    return (
      <div className="flex flex-row items-end gap-2">
        {/* Target Application */}
        <div className="flex flex-col gap-1 w-36">
          <label className="text-xs text-gray-600 font-semibold">Target Application</label>
          <DropdownV2
            options={applications.map(opt => ({ label: opt.label, value: String(opt.value) }))}
            value={selectedSourceApplication}
            onChange={(value) => setSelectedSourceApplication(value)}
            placeholder={applicationsLoading ? "Loading..." : "Select application..."}
            Disabled={isReadOnly || applicationsLoading}
            searchable={true}
            size="small"
          />
        </div>

        {/* Target Table.Field (combined) */}
        <div className="flex flex-col gap-1 w-60">
          <label className="text-xs text-gray-600 font-semibold">Target Table.Field</label>
          <DropdownV2
            options={combinedTargetOptions.map(o => ({ label: o.label, value: o.value, description: o.description }))}
            value={`${field.TableName}.${field.FieldName}`}
            onChange={(value) => {
              // Target selection reflects rule's own field; usually fixed, but we keep callback for completeness
              console.log("Selected target table.field:", value)
            }}
            placeholder="Select table.field..."
            Disabled={isReadOnly}
            searchable={true}
            size="small"
            showClear={false}
          />
        </div>

        {/* Operator (between target table.field and source application) */}
        <div className="flex flex-col gap-1 w-40">
          <label className="text-xs text-gray-600 font-semibold">Operator</label>
          <div className="rounded border border-gray-300 bg-gray-50 p-0.5">
            <DropdownV2
              options={operatorOptions}
              value={joinOperator}
              onChange={(value) => {
                const v = String(value)
                setJoinOperator(v)
                onOperatorChange?.(v)
              }}
              placeholder="Select operator..."
              Disabled={isReadOnly}
              searchable={true}
              size="small"
            />
          </div>
        </div>

        {/* Source Application */}
        <div className="flex flex-col gap-1 w-36">
          <label className="text-xs text-gray-600 font-semibold">Source Application</label>
          <DropdownV2
            options={applications.map(opt => ({ label: opt.label, value: String(opt.value) }))}
            value={selectedTargetApplication}
            onChange={(value) => setSelectedTargetApplication(value)}
            placeholder={applicationsLoading ? "Loading..." : "Select application..."}
            Disabled={applicationsLoading}
            searchable={true}
            size="small"
          />
        </div>

        {/* Source Table.Field (combined) */}
        <div className="flex flex-col gap-1 w-60">
          <label className="text-xs text-gray-600 font-semibold">Source Table.Field</label>
          <DropdownV2
            options={combinedSourceOptions.map(o => ({ label: o.label, value: o.value, description: o.description }))}
            value={rightField || ""}
            onChange={(value) => {
              if (value) {
                onRelationKeysChange([String(value)])
              }
            }}
            placeholder="Select table.field..."
            Disabled={isReadOnly}
            searchable={true}
            size="small"
            showClear={false}
          />
        </div>
      </div>
    )
  }

  return (  
    <div className="flex flex-col gap-4">
 

      {/* Operator Panels Section */}
      {showOperatorPanels && (
        <div className="flex flex-row gap-4 items-start">
        {/* Left Column: Target and Source stacked */}
        <div className="flex flex-col gap-3 flex-1">
          {/* Target Row */}
          <div className="flex flex-row gap-3 items-stretch">
            {/* Target Operator Card */}
            <div className="flex flex-col gap-3 border border-gray-300 rounded-md p-3 w-[280px]">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-muted-foreground">Target Operator</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCheckData("left")}
                  disabled={isReadOnly || targetOperation.length === 0}
                  className="bg-white h-8"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Check
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-gray-500">Table.Field</Label>
                  <div className="text-sm font-mono bg-gray-50 p-2 rounded border">{field.TableName}.{field.FieldName}</div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-gray-500">Operation</Label>
                  <DropdownV2
                    options={operationOptions.map(opt => ({ label: opt.label, value: String(opt.value) }))}
                    value={targetOperation.join(",")}
                    onChange={(value) => {
                      setTargetOperation(typeof value === "string" ? value.split(",").filter(v => v) : [])
                      setTargetOperationParams({})
                    }}
                    placeholder="Select operation..."
                    Disabled={isReadOnly}
                    searchable={true}
                    mode="multiple"
                    size="small"
                />
              </div>
                {/* Dynamic parameters */}
                {targetOperation.length > 0 && TRANSFORMATION_OPERATIONS.find(op => op.name === targetOperation[0])?.parameters.map(param => (
                  <div key={param.name} className="flex flex-col gap-1">
                    <Label className="text-xs text-gray-500">{param.label}</Label>
                    {param.type === 'text' && (
                      <Input
                        type="text"
                        value={targetOperationParams[param.name] || ''}
                        onChange={e => setTargetOperationParams({...targetOperationParams, [param.name]: e.target.value})}
                        placeholder={param.placeholder}
                        className="h-8 text-sm"
                      />
                    )}
                    {param.type === 'number' && (
                      <Input
                        type="number"
                        value={targetOperationParams[param.name] || ''}
                        onChange={e => setTargetOperationParams({...targetOperationParams, [param.name]: e.target.value})}
                        placeholder={param.placeholder}
                        className="h-8 text-sm"
                      />
                    )}
                    {param.type === 'checkbox' && (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="checkbox"
                          checked={!!targetOperationParams[param.name]}
                          onChange={e => setTargetOperationParams({...targetOperationParams, [param.name]: e.target.checked})}
                          className="rounded"
                        />
                        <Label className="text-sm">{param.label}</Label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Target Results */}
            {targetCheckDataResults.length > 0 && (
              <div className="flex flex-col border border-gray-300 rounded-md p-3 bg-gray-50 self-stretch">
                <div className="flex gap-2 border-b border-gray-200 pb-2">
                  <button
                    onClick={() => setActiveTargetTab('aggregate')}
                    className={`px-3 py-1 text-sm font-medium ${
                      activeTargetTab === 'aggregate' 
                        ? 'border-b-2 border-[#0071E9] text-[#0071E9]' 
                        : 'text-gray-500'
                    }`}
                  >
                    Aggregate
                  </button>
                  <button
                    onClick={() => setActiveTargetTab('string')}
                    className={`px-3 py-1 text-sm font-medium ${
                      activeTargetTab === 'string' 
                        ? 'border-b-2 border-[#0071E9] text-[#0071E9]' 
                        : 'text-gray-500'
                    }`}
                  >
                    String
                  </button>
                </div>
                <div className="max-h-40 overflow-auto">
                  {activeTargetTab === 'aggregate' ? (
                    <div className="flex flex-col gap-1">
                      {targetCheckDataResults.map((value, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-mono text-gray-600">{index + 1}: {value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm font-mono text-gray-600">
                      {targetCheckDataResults[0] || 'No string value'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Source Row */}
          <div className="flex flex-row gap-3 items-stretch">
            {/* Source Operator Card */}
            <div className="flex flex-col gap-3 border border-gray-300 rounded-md p-3 w-[280px]">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-muted-foreground">Source Operator</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCheckData("right")}
                  disabled={isReadOnly || sourceOperation.length === 0}
                  className="bg-white h-8"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Check
                </Button>
            </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-gray-500">Table.Field</Label>
                  <div className="text-sm font-mono bg-gray-50 p-2 rounded border">
                    {rightField || "Select field"}
          </div>
              </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-gray-500">Operation</Label>
                  <DropdownV2
                    options={operationOptions.map(opt => ({ label: opt.label, value: String(opt.value) }))}
                    value={sourceOperation.join(",")}
                    onChange={(value) => {
                      setSourceOperation(typeof value === "string" ? value.split(",").filter(v => v) : [])
                      setSourceOperationParams({})
                    }}
                    placeholder="Select operation..."
                    Disabled={isReadOnly}
                    searchable={true}
                    mode="multiple"
                    size="small"
                  />
                </div>
                {/* Dynamic parameters */}
                {sourceOperation.length > 0 && TRANSFORMATION_OPERATIONS.find(op => op.name === sourceOperation[0])?.parameters.map(param => (
                  <div key={param.name} className="flex flex-col gap-1">
                    <Label className="text-xs text-gray-500">{param.label}</Label>
                    {param.type === 'text' && (
                      <Input
                        type="text"
                        value={sourceOperationParams[param.name] || ''}
                        onChange={e => setSourceOperationParams({...sourceOperationParams, [param.name]: e.target.value})}
                        placeholder={param.placeholder}
                        className="h-8 text-sm"
                      />
                    )}
                    {param.type === 'number' && (
                      <Input
                        type="number"
                        value={sourceOperationParams[param.name] || ''}
                        onChange={e => setSourceOperationParams({...sourceOperationParams, [param.name]: e.target.value})}
                        placeholder={param.placeholder}
                        className="h-8 text-sm"
                      />
                    )}
                    {param.type === 'checkbox' && (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="checkbox"
                          checked={!!sourceOperationParams[param.name]}
                          onChange={e => setSourceOperationParams({...sourceOperationParams, [param.name]: e.target.checked})}
                          className="rounded"
                        />
                        <Label className="text-sm">{param.label}</Label>
              </div>
            )}
                  </div>
                ))}
          </div>
        </div>

            {/* Source Results */}
            {sourceCheckDataResults.length > 0 && (
              <div className="flex flex-col border border-gray-300 rounded-md p-3 bg-gray-50 self-stretch">
                <div className="flex gap-2 border-b border-gray-200 pb-2">
                  <button
                    onClick={() => setActiveSourceTab('aggregate')}
                    className={`px-3 py-1 text-sm font-medium ${
                      activeSourceTab === 'aggregate' 
                        ? 'border-b-2 border-[#0071E9] text-[#0071E9]' 
                        : 'text-gray-500'
                    }`}
                  >
                    Aggregate
                  </button>
                  <button
                    onClick={() => setActiveSourceTab('string')}
                    className={`px-3 py-1 text-sm font-medium ${
                      activeSourceTab === 'string' 
                        ? 'border-b-2 border-[#0071E9] text-[#0071E9]' 
                        : 'text-gray-500'
                    }`}
                  >
                    String
                  </button>
              </div>
                <div className="max-h-40 overflow-auto">
                  {activeSourceTab === 'aggregate' ? (
                    <div className="flex flex-col gap-1">
                      {sourceCheckDataResults.map((value, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-mono text-gray-600">{index + 1}: {value}</span>
              </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm font-mono text-gray-600">
                      {sourceCheckDataResults[0] || 'No string value'}
                    </div>
                  )}
                </div>
              </div>
            )}
              </div>
            </div>

        {/* Right Column: Simulate and Output */}
        <div className="flex flex-col h-full w-full">
          {targetCheckDataResults.length > 0 && sourceCheckDataResults.length > 0 && (
            <>
              {/* Simulate Button - Top Right */}
              <div className="flex justify-end mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSimulate}
                  disabled={isReadOnly}
                  className="bg-white h-8 w-auto px-3"
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-xs">Simulate</span>
                </Button>
              </div>

              {/* Simulation Results Container */}
              {simulationResult && (
                <div className="flex flex-col h-[calc(100%-3rem)] overflow-hidden border border-gray-300 rounded">
                  {/* Header Badge */}
                  <div className={`p-2 border-b ${
                    simulationResult.validated ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                  }`}>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                      simulationResult.validated ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'
                    }`}>
                      {simulationResult.validated ? (
                        <>
                          <span className="text-sm">✓</span>
                          <span>Passed</span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm">✗</span>
                          <span>Failed</span>
                        </>
                      )}
            </div>
          </div>

                  {/* Side by Side Target and Source */}
                  <div className="flex flex-row h-full overflow-hidden">
                    {/* Left: Target */}
                    <div className="flex-1 border-r border-gray-300 p-2 overflow-auto">
                      <div className="flex items-center gap-1 mb-2">
                        <span className="bg-sky-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">TARGET</span>
              </div>
                      
                      <div className="mb-2">
                        <p className="text-[10px] font-semibold text-gray-700 mb-1">Initial</p>
                        <div className="flex flex-wrap gap-1">
                          {simulationResult.targetInitialValues.map((val, idx) => (
                            <span key={idx} className="bg-white px-2 py-0.5 rounded text-[10px] font-medium text-gray-800 border border-gray-300">
                              {val}
                            </span>
                          ))}
                </div>
              </div>
                      
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-gray-700 mb-1">Operations</p>
                        {simulationResult.targetOperations.map((op, idx) => {
                          const isPassed = simulationResult.targetOperationStatus?.[op] ?? true
                          const result = simulationResult.targetResults[op]
                          return (
                            <div key={idx} className={`rounded p-1.5 ${
                              isPassed 
                                ? 'bg-green-50 border border-green-200' 
                                : 'bg-red-50 border border-red-200'
                            }`}>
                              <div className="flex items-center gap-1">
                                <span className="bg-sky-600 text-white px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase">
                                  {op}
                                </span>
                                <span className="text-[10px] text-gray-500">→</span>
                                <span className={`text-xs font-bold ${
                                  isPassed ? 'text-green-700' : 'text-red-700'
                                }`}>
                                  {result}
                                </span>
                                {!isPassed && (
                                  <span className="ml-auto text-[10px] font-semibold text-red-600">
                                    ✗ Failed
                                  </span>
            )}
          </div>
        </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Right: Source */}
                    <div className="flex-1 p-2 overflow-auto">
                      <div className="flex items-center gap-1 mb-2">
                        <span className="bg-gray-700 text-white px-2 py-0.5 rounded text-[10px] font-bold">SOURCE</span>
                      </div>
                      
                      <div className="mb-2">
                        <p className="text-[10px] font-semibold text-gray-700 mb-1">Initial</p>
                        <div className="flex flex-wrap gap-1">
                          {simulationResult.sourceInitialValues.map((val, idx) => (
                            <span key={idx} className="bg-white px-2 py-0.5 rounded text-[10px] font-medium text-gray-800 border border-gray-300">
                              {val}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-gray-700 mb-1">Operations</p>
                        {simulationResult.sourceOperations.map((op, idx) => {
                          const isPassed = simulationResult.sourceOperationStatus?.[op] ?? true
                          const result = simulationResult.sourceResults[op]
                          return (
                            <div key={idx} className={`rounded p-1.5 ${
                              isPassed 
                                ? 'bg-green-50 border border-green-200' 
                                : 'bg-red-50 border border-red-200'
                            }`}>
                              <div className="flex items-center gap-1">
                                <span className="bg-gray-700 text-white px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase">
                                  {op}
                                </span>
                                <span className="text-[10px] text-gray-500">→</span>
                                <span className={`text-xs font-bold ${
                                  isPassed ? 'text-green-700' : 'text-red-700'
                                }`}>
                                  {result}
                                </span>
                                {!isPassed && (
                                  <span className="ml-auto text-[10px] font-semibold text-red-600">
                                    ✗ Failed
                                  </span>
                                )}
      </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Message Footer */}
                  <div className={`p-2 border-t text-center ${
                    simulationResult.validated ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                  }`}>
                    <p className={`text-[10px] font-medium ${
                      simulationResult.validated ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {simulationResult.message}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        </div>
      )}
    </div>
  )
}
