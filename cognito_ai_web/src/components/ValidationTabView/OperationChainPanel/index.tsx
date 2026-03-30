// // import React, { useCallback, useState } from 'react';
// // import { CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
// // import { Button } from '../ui/button';
// // import { ScrollArea } from '../ui/scroll-area';
// // import { Plus, Play } from 'lucide-react';
// // import { AppliedOperation, Column, TRANSFORMATION_OPERATIONS } from '../types/deriveColumn';
// // import { RuleSideConfig, OperationCategory, FieldValidationConfig, FieldRule } from '../types/validation';
// // import { OperationBlock } from '../OperationBlock';
// // import { cn } from '../lib/utils';
// // import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
// // import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
// // import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
// // import { Label } from '../ui/label';
// // import { Badge } from '../ui/badge';
// // import { ConstantValueEditor } from '../ConstantValueEditor';
// // import { useValidationStore } from '../Stores/validationStore';
// // import { MultiSelectCombobox } from '../MultiSelectCombobox';

// // interface OperationChainPanelProps {
// //   title: string;
// //   config: RuleSideConfig | undefined;
// //   initialValue: any;
// //   availableColumns: Column[];
// //   onOperationsChange: (newOperations: AppliedOperation[]) => void;
// //   onSetCategory: (category: OperationCategory) => void;
// //   onExecute: () => void;
// //   isOperationMode: boolean;
// //   field: FieldRule;
// //   onConstantValueChange: (value: string) => void;
// //   expectedValue: string;
// // }

// // export const OperationChainPanel: React.FC<OperationChainPanelProps> = ({
// //   title,
// //   config,
// //   initialValue,
// //   availableColumns,
// //   onOperationsChange,
// //   onSetCategory,
// //   onExecute,
// //   isOperationMode,
// //   field,
// //   onConstantValueChange,
// //   expectedValue,
// // }) => {
// //   const { isAggregateMode } = useValidationStore();

// //   const operations = config?.operations || [];
// //   const category = isAggregateMode ? 'aggregation' : (config?.operationCategory || 'string');

// //   const handleAddOperation = () => {
// //     const newOp: AppliedOperation = {
// //       id: `op-${Date.now()}`,
// //       operation_name: '',
// //       parameters: {},
// //     };
// //     onOperationsChange([...operations, newOp]);
// //   };

// //   const handleUpdateOperation = (id: string, updates: Partial<AppliedOperation>) => {
// //     onOperationsChange(operations.map(op => (op.id === id ? { ...op, ...updates } : op)));
// //   };

// //   const handleAggregationSelectionChange = (selectedOpNames: (string | number)[]) => {
// //     const newOps: AppliedOperation[] = selectedOpNames.map(name => ({
// //         id: `op-${name}-${Date.now()}`,
// //         operation_name: String(name),
// //         parameters: {},
// //     }));
// //     onOperationsChange(newOps);
// //   };

// //   if (!isOperationMode) {
// //     return (
// //       <div className="h-full flex items-center justify-center text-muted-foreground p-4 text-center border border-gray-300 rounded-lg">
// //         Select a validation field or click the settings icon on a key mapping to configure operations.
// //       </div>
// //     );
// //   }
  
// //   if (field.expectedValueType === 'constant_value') {
// //     return (
// //         <div className="h-full flex flex-col p-2 min-h-0 border border-gray-300 rounded-lg">
// //             <CardHeader className="p-2 flex-shrink-0">
// //                 <CardTitle className="text-base font-semibold truncate">{title}</CardTitle>
// //             </CardHeader>
// //             <CardContent className="p-2 flex-grow">
// //                 <ConstantValueEditor 
// //                     value={expectedValue} 
// //                     onChange={onConstantValueChange} 
// //                 />
// //             </CardContent>
// //         </div>
// //     );
// //   }

// //   const renderInitialValue = () => {
// //     if (Array.isArray(initialValue)) {
// //         return (
// //             <ScrollArea className="h-24 font-mono p-2 bg-background rounded-md border">
// //                 <div className="flex flex-col">
// //                     {initialValue.map((item, index) => (
// //                         <span key={index}>{String(item)}</span>
// //                     ))}
// //                 </div>
// //             </ScrollArea>
// //         );
// //     }
// //     return (
// //         <div id="initial-value-display" className="font-mono p-2 bg-background border-gray-300 rounded-md border min-h-[40px]">
// //             {initialValue || <span className="text-muted-foreground italic">No value</span>}
// //         </div>
// //     );
// //   };

// //   const aggregationOptions = TRANSFORMATION_OPERATIONS.filter(op => op.category === 'aggregation').map(op => ({ value: op.name, label: op.name }));

// //   return (
// //     <div className="h-full flex flex-col p-2 min-h-0 border border-gray-300 rounded-lg">
// //       <CardHeader className="p-2 flex-shrink-0 flex flex-row items-center justify-between">
// //         <CardTitle className="text-base font-semibold truncate">{title}</CardTitle>
// //         <div className="flex items-center gap-2">
// //           <ToggleGroup
// //             type="single"
// //             size="sm"
// //             value={category}
// //             onValueChange={(value: OperationCategory) => {
// //               if (value && !isAggregateMode) onSetCategory(value);
// //             }}
// //             className="gap-1"
// //           >
// //             <ToggleGroupItem value="string" aria-label="String Operations" disabled={isAggregateMode} className={cn("h-7 px-2.5 rounded-md text-xs", category === 'string' && "bg-blue-500 text-white hover:bg-blue-600")}>String</ToggleGroupItem>
// //             <ToggleGroupItem value="aggregation" aria-label="Aggregation Operations" disabled={!isAggregateMode} className={cn("h-7 px-2.5 rounded-md text-xs", category === 'aggregation' && "bg-blue-500 text-white hover:bg-blue-600")}>Aggregate</ToggleGroupItem>
// //           </ToggleGroup>
// //           {!isAggregateMode && (
// //             <Button variant="outline" size="sm" onClick={handleAddOperation} className="!h-8">
// //                 <Plus className="mr-2 h-4 w-4" /> Add
// //             </Button>
// //           )}
// //         </div>
// //       </CardHeader>
// //       <CardContent className="p-2 flex-grow min-h-0 flex flex-col gap-4">
// //         <div className="flex-shrink-0">
// //             <Label className="text-sm text-muted-foreground">Initial Value:</Label>
// //             {renderInitialValue()}
// //         </div>
// //         <div className="flex-grow min-h-0">
// //             <ScrollArea className="h-full pr-2">
// //                 <div className="space-y-2">
// //                     {isAggregateMode ? (
// //                         <MultiSelectCombobox
// //                             options={aggregationOptions}
// //                             value={operations.map(op => op.operation_name)}
// //                             onChange={handleAggregationSelectionChange}
// //                             placeholder="Select aggregation(s)..."
// //                         />
// //                     ) : (
// //                         <>
// //                             {operations.map(op => (
// //                             <OperationBlock
// //                                 key={op.id}
// //                                 operation={op}
// //                                 onDelete={() => onOperationsChange(operations.filter(o => o.id !== op.id))}
// //                                 onUpdate={handleUpdateOperation}
// //                                 availableColumns={availableColumns}
// //                                 selectedRowIndex={0}
// //                                 operationCategory={category}
// //                             />
// //                             ))}
// //                             {operations.length === 0 && (<div className="text-center text-sm text-muted-foreground py-10">No operations. Click "Add" to begin.</div>)}
// //                         </>
// //                     )}
// //                 </div>
// //             </ScrollArea>
// //         </div>
// //       </CardContent>
// //       <CardFooter className="p-2 pt-2 flex justify-end flex-shrink-0">
// //         <Button size="sm" onClick={onExecute} className="w-auto"><Play className="mr-2 h-3 w-3" /> Execute</Button>
// //       </CardFooter>
// //     </div>
// //   );
// // };
// import React, { useCallback, useState } from 'react';
// import { CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
// import { Button } from '../ui/button';
// import { ScrollArea } from '../ui/scroll-area';
// import { Plus, Play } from 'lucide-react';
// import { AppliedOperation, Column, TRANSFORMATION_OPERATIONS } from '../types/deriveColumn';
// import { RuleSideConfig, OperationCategory, FieldValidationConfig, FieldRule } from '../types/validation';
// import { OperationBlock } from '../OperationBlock';
// import { cn } from '../lib/utils';
// import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
// import { Label } from '../ui/label';
// import { Badge } from '../ui/badge';
// import { ConstantValueEditor } from '../ConstantValueEditor';
// import { useValidationStore } from '../Stores/validationStore';
// import { MultiSelectCombobox } from '../MultiSelectCombobox';

// interface OperationChainPanelProps {
//   title: string;
//   config: RuleSideConfig | undefined;
//   initialValue: any;
//   availableColumns: Column[];
//   onOperationsChange: (newOperations: AppliedOperation[]) => void;
//   onSetCategory: (category: OperationCategory) => void;
//   onExecute: () => void;
//   isOperationMode: boolean;
//   field: FieldRule;
//   onConstantValueChange: (value: string) => void;
//   expectedValue: string;
// }

// export const OperationChainPanel: React.FC<OperationChainPanelProps> = ({
//   title,
//   config,
//   initialValue,
//   availableColumns,
//   onOperationsChange,
//   onSetCategory,
//   onExecute,
//   isOperationMode,
//   field,
//   onConstantValueChange,
//   expectedValue,
// }) => {
//   const { isAggregateMode } = useValidationStore();

//   const operations = config?.operations || [];
//   const category = isAggregateMode ? 'aggregation' : (config?.operationCategory || 'string');

//   const handleAddOperation = () => {
//     const newOp: AppliedOperation = {
//       id: `op-${Date.now()}`,
//       operation_name: '',
//       parameters: {},
//     };
//     onOperationsChange([...operations, newOp]);
//   };

//   const handleUpdateOperation = (id: string, updates: Partial<AppliedOperation>) => {
//     onOperationsChange(operations.map(op => (op.id === id ? { ...op, ...updates } : op)));
//   };

//   const handleAggregationSelectionChange = (selectedOpNames: (string | number)[]) => {
//     const newOps: AppliedOperation[] = selectedOpNames.map(name => ({
//         id: `op-${name}-${Date.now()}`,
//         operation_name: String(name),
//         parameters: {},
//     }));
//     onOperationsChange(newOps);
//   };

//   if (!isOperationMode) {
//     return (
//       <div className="h-full flex items-center justify-center text-muted-foreground p-4 text-center border border-gray-300 rounded-lg">
//         Select a validation field or click the settings icon on a key mapping to configure operations.
//       </div>
//     );
//   }
  
//   if (field.expectedValueType === 'constant_value') {
//     return (
//         <div className="h-full flex flex-col p-2 min-h-0 border border-gray-300 rounded-lg">
//             <CardHeader className="p-2 flex-shrink-0">
//                 <CardTitle className="text-base font-semibold truncate">{title}</CardTitle>
//             </CardHeader>
//             <CardContent className="p-2 flex-grow">
//                 <ConstantValueEditor 
//                     value={expectedValue} 
//                     onChange={onConstantValueChange} 
//                 />
//             </CardContent>
//         </div>
//     );
//   }

//   const renderInitialValue = () => {
//     if (Array.isArray(initialValue)) {
//         return (
//             <ScrollArea className="h-24 font-mono p-2 bg-background rounded-md border">
//                 <div className="flex flex-col">
//                     {initialValue.map((item, index) => (
//                         <span key={index}>{String(item)}</span>
//                     ))}
//                 </div>
//             </ScrollArea>
//         );
//     }
//     return (
//         <div id="initial-value-display" className="font-mono p-2 bg-background border-gray-300 rounded-md border min-h-[40px]">
//             {initialValue || <span className="text-muted-foreground italic">No value</span>}
//         </div>
//     );
//   };

//   const aggregationOptions = TRANSFORMATION_OPERATIONS.filter(op => op.category === 'aggregation').map(op => ({ value: op.name, label: op.name }));

//   return (
//     <div className="h-full flex flex-col p-2 min-h-0 border border-gray-300 rounded-lg">
//       <CardHeader className="p-2 flex-shrink-0 flex flex-row items-center justify-between">
//         <CardTitle className="text-base font-semibold truncate">{title}</CardTitle>
//         <div className="flex items-center gap-2">
//           <ToggleGroup
//             type="single"
//             size="sm"
//             value={category}
//             onValueChange={(value: OperationCategory) => {
//               if (value && !isAggregateMode) onSetCategory(value);
//             }}
//             className="gap-1"
//           >
//             <ToggleGroupItem value="string" aria-label="String Operations" disabled={isAggregateMode} className={cn("h-7 px-2.5 rounded-md text-xs", category === 'string' && "bg-blue-500 text-white hover:bg-blue-600")}>String</ToggleGroupItem>
//             <ToggleGroupItem value="aggregation" aria-label="Aggregation Operations" disabled={!isAggregateMode} className={cn("h-7 px-2.5 rounded-md text-xs", category === 'aggregation' && "bg-blue-500 text-white hover:bg-blue-600")}>Aggregate</ToggleGroupItem>
//           </ToggleGroup>
//           {!isAggregateMode && (
//             <Button variant="outline" size="sm" onClick={handleAddOperation} className="!h-8">
//                 <Plus className="mr-2 h-4 w-4" /> Add
//             </Button>
//           )}
//         </div>
//       </CardHeader>
//       <CardContent className="p-2 flex-grow min-h-0 flex flex-col gap-4">
//         <div className="flex-shrink-0">
//             <Label className="text-sm text-muted-foreground">Initial Value:</Label>
//             {renderInitialValue()}
//         </div>
//         <div className="flex-grow min-h-0">
//             <ScrollArea className="h-full pr-2">
//                 <div className="space-y-2">
//                     {isAggregateMode ? (
//                         <MultiSelectCombobox
//                             options={aggregationOptions}
//                             value={operations.map(op => op.operation_name)}
//                             onChange={handleAggregationSelectionChange}
//                             placeholder="Select aggregation(s)..."
//                         />
//                     ) : (
//                         <>
//                             {operations.map(op => (
//                             <OperationBlock
//                                 key={op.id}
//                                 operation={op}
//                                 onDelete={() => onOperationsChange(operations.filter(o => o.id !== op.id))}
//                                 onUpdate={handleUpdateOperation}
//                                 availableColumns={availableColumns}
//                                 selectedRowIndex={0}
//                                 operationCategory={category}
//                             />
//                             ))}
//                             {operations.length === 0 && (<div className="text-center text-sm text-muted-foreground py-10">No operations. Click "Add" to begin.</div>)}
//                         </>
//                     )}
//                 </div>
//             </ScrollArea>
//         </div>
//       </CardContent>
//       <CardFooter className="p-2 pt-2 flex justify-end flex-shrink-0">
//         <Button size="sm" onClick={onExecute} className="w-auto"><Play className="mr-2 h-3 w-3" /> Execute</Button>
//       </CardFooter>
//     </div>
//   );
// };
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { ScrollArea } from "../ui/scroll-area"
import { Plus, Play } from "lucide-react"
import { type AppliedOperation, type Column, TRANSFORMATION_OPERATIONS } from "../types/deriveColumn"
import type { RuleSideConfig, OperationCategory, FieldRule } from "../types"
import { OperationBlock } from "../OperationBlock"
import { cn } from "../lib/utils"
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group"
import { Label } from "../ui/label"
import { ConstantValueEditor } from "../ConstantValueEditor"
import { useValidationStore } from "../Stores/validationStore"
import { MultiSelectCombobox } from "../MultiSelectCombobox"

interface OperationChainPanelProps {
  title: string
  config: RuleSideConfig | undefined
  initialValue: any
  availableColumns: Column[]
  onOperationsChange: (newOperations: AppliedOperation[]) => void
  onSetCategory: (category: OperationCategory) => void
  onExecute: () => void
  isOperationMode: boolean
  field: FieldRule
  onConstantValueChange: (value: string) => void
  expectedValue: string
}

export const OperationChainPanel: React.FC<OperationChainPanelProps> = ({
  title,
  config,
  initialValue,
  availableColumns,
  onOperationsChange,
  onSetCategory,
  onExecute,
  isOperationMode,
  field,
  onConstantValueChange,
  expectedValue,
}) => {
  const { isAggregateMode } = useValidationStore()
  const [operations, setOperations] = useState<AppliedOperation[]>(config?.operations || [])
  const category = isAggregateMode ? "aggregation" : config?.operationCategory || "string"

  const handleAddOperation = () => {
    const newOp: AppliedOperation = {
      id: `op-${Date.now()}`,
      operation_name: "",
      parameters: {},
    }
    setOperations([...operations, newOp])
    onOperationsChange([...operations, newOp])
  }

  const handleUpdateOperation = (id: string, updates: Partial<AppliedOperation>) => {
    const updatedOperations = operations.map((op) => (op.id === id ? { ...op, ...updates } : op))
    setOperations(updatedOperations)
    onOperationsChange(updatedOperations)
  }

  const handleAggregationSelectionChange = (selectedOpNames: (string | number)[]) => {
    const newOps: AppliedOperation[] = selectedOpNames.map((name) => ({
      id: `op-${name}-${Date.now()}`,
      operation_name: String(name),
      parameters: {},
    }))
    setOperations(newOps)
    onOperationsChange(newOps)

    console.log("[v0] Aggregate operations selected:", newOps)
  }

  useEffect(() => {
    const { isAggregateMode } = useValidationStore.getState()
    if (isAggregateMode && operations.length > 0) {
      console.log("[v0] Operations in aggregate mode:", operations)
    }
  }, [operations, isAggregateMode])

  if (!isOperationMode) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground p-4 text-center border border-gray-300 rounded-lg">
        Select a validation field or click the settings icon on a key mapping to configure operations.
      </div>
    )
  }

  if (field.expectedValueType === "constant_value") {
    return (
      <div className="h-full flex flex-col p-2 min-h-0 border border-gray-300 rounded-lg">
        <CardHeader className="p-2 flex-shrink-0">
          <CardTitle className="text-base font-semibold truncate">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-2 flex-grow">
          <ConstantValueEditor value={expectedValue} onChange={onConstantValueChange} />
        </CardContent>
      </div>
    )
  }

  const renderInitialValue = () => {
    if (Array.isArray(initialValue)) {
      return (
        <ScrollArea className="h-24 font-mono p-2 bg-background rounded-md border">
          <div className="flex flex-col">
            {initialValue.map((item, index) => (
              <span key={index}>{String(item)}</span>
            ))}
          </div>
        </ScrollArea>
      )
    }
    return (
      <div
        id="initial-value-display"
        className="font-mono p-2 bg-background border-gray-300 rounded-md border min-h-[40px]"
      >
        {initialValue || <span className="text-muted-foreground italic">No value</span>}
      </div>
    )
  }

  const aggregationOptions = TRANSFORMATION_OPERATIONS.filter((op) => op.category === "aggregation").map((op) => ({
    value: op.name,
    label: op.name,
  }))

  return (
    <div className="h-full flex flex-col p-2 min-h-0 border border-gray-300 rounded-lg">
      <CardHeader className="p-2 flex-shrink-0 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold truncate">{title}</CardTitle>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            size="sm"
            value={category}
            onValueChange={(value: OperationCategory) => {
              if (value && !isAggregateMode) onSetCategory(value)
            }}
            className="gap-1"
          >
            <ToggleGroupItem
              value="string"
              aria-label="String Operations"
              disabled={isAggregateMode}
              className={cn(
                "h-7 px-2.5 rounded-md text-xs",
                category === "string" && "bg-blue-500 text-white hover:bg-blue-600",
              )}
            >
              String
            </ToggleGroupItem>
            <ToggleGroupItem
              value="aggregation"
              aria-label="Aggregation Operations"
              disabled={!isAggregateMode}
              className={cn(
                "h-7 px-2.5 rounded-md text-xs",
                category === "aggregation" && "bg-blue-500 text-white hover:bg-blue-600",
              )}
            >
              Aggregate
            </ToggleGroupItem>
          </ToggleGroup>
          {!isAggregateMode && (
            <Button variant="outline" size="sm" onClick={handleAddOperation} className="!h-8 bg-transparent">
              <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-2 flex-grow min-h-0 flex flex-col gap-4">
        <div className="flex-shrink-0">
          <Label className="text-sm text-muted-foreground">Initial Value:</Label>
          {renderInitialValue()}
        </div>
        <div className="flex-grow min-h-0">
          <ScrollArea className="h-full pr-2">
            <div className="space-y-2">
              {isAggregateMode ? (
                <MultiSelectCombobox
                  options={aggregationOptions}
                  value={operations.map((op) => op.operation_name)}
                  onChange={handleAggregationSelectionChange}
                  placeholder="Select aggregation(s)..."
                />
              ) : (
                <>
                  {operations.map((op) => (
                    <OperationBlock
                      key={op.id}
                      operation={op}
                      onDelete={() => setOperations(operations.filter((o) => o.id !== op.id))}
                      onUpdate={handleUpdateOperation}
                      availableColumns={availableColumns}
                      selectedRowIndex={0}
                      operationCategory={category}
                    />
                  ))}
                  {operations.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-10">
                      No operations. Click "Add" to begin.
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
      <CardFooter className="p-2 pt-2 flex justify-end flex-shrink-0">
        <Button size="sm" onClick={onExecute} className="w-auto">
          <Play className="mr-2 h-3 w-3" /> Execute
        </Button>
      </CardFooter>
    </div>
  )
}
