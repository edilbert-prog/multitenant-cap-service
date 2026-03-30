// import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
// import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable';
// import { ConnectionsPanel } from '../ConnectionsPanel';
// import { OperationChainPanel } from '../OperationChainPanel';
// import { SampleOutputPanel } from '../SampleOutputPanel';
// import { FieldRule, FieldValidationConfig, OperationCategory, RuleSideConfig, TableData } from '../types/validation';
// import { Button } from '../ui/button';
// import { Check, Code, Copy, PanelLeftOpen, PanelRightClose } from 'lucide-react';
// import { ImperativePanelHandle } from 'react-resizable-panels';
// import { StepResult, Column, AppliedOperation } from '../types/deriveColumn';
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
// import { ScrollArea } from '../ui/scroll-area';
// import { toast } from 'sonner';
// import { convertToSnakeCase } from '../lib/utils';
// import { applyOperation } from '../OperationExecutor';
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
// import { AgGridReact } from 'ag-grid-react';
// import { useValidationStore } from '../Stores/validationStore';
// import { executeValidationComponent } from '../API/validationApi';


// export interface TableFieldRuleBuilderRef {
//   getConfigs: () => Record<string, Partial<FieldValidationConfig>>;
// }

// interface TableFieldRuleBuilderProps {
//   field: FieldRule;
//   field_rules: FieldRule[];
//   tableData: TableData[];
//   initialState: { fieldRuleConfigs?: Record<string, Partial<FieldValidationConfig>> };
//   onSave: (state: { fieldRuleConfigs: Record<string, Partial<FieldValidationConfig>> }) => void;
//   onCancel: () => void;
//   hideFooter?: boolean;
//   onConstantValueChange: (value: string) => void;
//   expectedValue: string;
// }

// interface Selection {
//   ruleId: string;
//   type: 'key' | 'validation';
//   side?: 'left' | 'right';
//   operationMode?: boolean;
// }

// const executeChain = (
//     initialValue: any, 
//     config: RuleSideConfig | undefined,
//     availableColumns: Column[]
// ): StepResult[] => {
//     if (!config || !config.operations || config.operations.length === 0) {
//         return [{ id: 'initial', operation_name: 'Initial Value', result: initialValue }];
//     }

//     if (config.operationCategory === 'aggregation') {
//         const results: StepResult[] = [];
//         results.push({ id: 'initial', operation_name: 'Initial Value', result: initialValue });
//         for (const op of config.operations) {
//             if (!op.operation_name) continue;
//             const { result, error } = applyOperation(op, initialValue, 0, availableColumns);
//             results.push({ id: op.id, operation_name: op.operation_name, result, error });
//         }
//         return results;
//     }

//     const steps: StepResult[] = [];
//     let currentValue = initialValue;
//     steps.push({ id: 'initial', operation_name: 'Initial Value', result: currentValue });

//     for (const op of config.operations) {
//         if (!op.operation_name) {
//             steps.push({ id: op.id, operation_name: 'Unconfigured', parameters: op.parameters, result: currentValue, error: 'Select an operation' });
//             continue;
//         }
//         const { result, error } = applyOperation(op, currentValue, 0, availableColumns);
//         steps.push({ id: op.id, operation_name: op.operation_name, parameters: op.parameters, result, error });
//         if (error) break;
//         currentValue = result;
//     }
//     return steps;
// };

// export const TableFieldRuleBuilder = React.forwardRef<TableFieldRuleBuilderRef, TableFieldRuleBuilderProps>(({ 
//     field,
//     field_rules, 
//     tableData,
//     initialState, 
//     onSave, 
//     onCancel, 
//     hideFooter = false, 
//     onConstantValueChange,
//     expectedValue
// }, ref) => {
//   const [selection, setSelection] = useState<Selection | null>(null);
//   const [configs, setConfigs] = useState<Record<string, Partial<FieldValidationConfig>>>({});
//   const [isOutputCollapsed, setIsOutputCollapsed] = useState(false);
//   const outputPanelRef = useRef<ImperativePanelHandle>(null);
  
//   const [key1Results, setKey1Results] = useState<StepResult[] | null>(null);
//   const [key2Results, setKey2Results] = useState<StepResult[] | null>(null);

//   const { isAggregateMode, leftRowData, rightRowData, leftAggregateData, rightAggregateData } = useValidationStore();

//   useEffect(() => {
//     setConfigs(initialState.fieldRuleConfigs || {});
//   }, [initialState]);

//   useEffect(() => {
//     if (field) {
//         const type = field.isValidation ? 'validation' : 'key';
//         if (selection?.ruleId !== field.unique_id) {
//             setSelection({ ruleId: field.unique_id, type, side: 'left' });
//         }
//     }
//   }, [field, selection?.ruleId]);

//   const selectedRule = useMemo(() => {
//     return field_rules.find(r => r.unique_id === selection?.ruleId);
//   }, [selection, field_rules]);
  
//   const relatedFieldInfo = useMemo(() => {
//     if (!selectedRule || !selectedRule.relationKeys || !selectedRule.relationKeys[0]) return undefined;
    
//     const targetFieldFullName = Array.isArray(selectedRule.relationKeys) ? selectedRule.relationKeys[0] : selectedRule.relationKeys;
//     const [tableName, fieldName] = targetFieldFullName.split('.');

//     const table = tableData.find(t => t.TableName === tableName);
//     const fieldData = table?.Fields.find(f => f.FieldName === fieldName);

//     if (fieldData) {
//         return {
//             TableName: tableName,
//             FieldName: fieldData.FieldName,
//             sampleValue: fieldData.sampleValue,
//             dataType: fieldData.dataType
//         };
//     }

//     return undefined;
//   }, [selectedRule, tableData]);

//   const handleSetCategory = useCallback((category: OperationCategory) => {
//     if (!selection || (!selection.side && !selection.operationMode)) return;
//     const { ruleId, side } = selection;

//     const configKey = side === 'left' ? 'key1Config' : 'key2Config';

//     setConfigs(prev => ({
//         ...prev,
//         [ruleId]: {
//             ...(prev[ruleId] || { uniqueId: ruleId }),
//             [configKey]: {
//                 ...(prev[ruleId]?.[configKey] || { operations: [] }),
//                 operationCategory: category,
//                 operations: [],
//             },
//         },
//     }));
//   }, [selection]);

//   const handleOperationsChange = useCallback((newOperations: AppliedOperation[]) => {
//     if (!selection || (!selection.side && !selection.operationMode)) return;
//     const { ruleId, side } = selection;

//     const configKey = side === 'left' ? 'key1Config' : 'key2Config';
    
//     setConfigs(prev => ({
//       ...prev,
//       [ruleId]: {
//         ...(prev[ruleId] || { uniqueId: ruleId }),
//         [configKey]: {
//           ...(prev[ruleId]?.[configKey] || { operations: [], operationCategory: 'string' }),
//           operations: newOperations,
//         },
//       },
//     }));
//   }, [selection]);

//   React.useImperativeHandle(ref, () => ({
//     getConfigs: () => configs,
//   }));

//   const currentConfig = selection ? configs[selection.ruleId] : undefined;
  
//   const activeSide = selection?.operationMode ? selection.side : selection?.side;
//   const activeSideConfig = activeSide ? currentConfig?.[activeSide === 'left' ? 'key1Config' : 'key2Config'] : undefined;
  
//   const getActiveTitle = () => {
//     if (!selection || !selectedRule) return 'No selection';
//     if (selection.type === 'key' && !selection.operationMode) return 'Key Mapping (Read-Only)';
//     if (activeSide === 'left') return `${selectedRule.TableName}.${selectedRule.FieldName}`;
//     if (activeSide === 'right' && Array.isArray(selectedRule.relationKeys)) return selectedRule.relationKeys.join(', ');
//     return 'Select a field';
//   };
//   const activeTitle = getActiveTitle();

//   const getInitialValue = useCallback(() => {
//     if (!selection || !selectedRule) return '';

//     if (isAggregateMode) {
//         return activeSide === 'left' ? leftAggregateData : rightAggregateData;
//     }
    
//     if (activeSide === 'left') {
//       return leftRowData && selectedRule.FieldName in leftRowData 
//         ? leftRowData[selectedRule.FieldName] 
//         : selectedRule.sampleValue || '';
//     }
    
//     if (activeSide === 'right' && relatedFieldInfo) {
//       return rightRowData && relatedFieldInfo.FieldName in rightRowData
//         ? rightRowData[relatedFieldInfo.FieldName]
//         : relatedFieldInfo.sampleValue || 'N/A';
//     }
    
//     return '';
//   }, [selection, selectedRule, relatedFieldInfo, leftRowData, rightRowData, activeSide, isAggregateMode, leftAggregateData, rightAggregateData]);

//   const activeInitialValue = getInitialValue();

//   const availableColumns = useMemo((): Column[] => {
//     return field_rules.map(r => ({
//       id: `${r.TableName}.${r.FieldName}`,
//       name: `${r.TableName}.${r.FieldName}`,
//       type: (r.dataType === 'number' ? 'number' : r.dataType === 'boolean' ? 'boolean' : 'string') as 'string' | 'number' | 'boolean',
//       sampleData: [r.sampleValue || '', `${r.sampleValue}_2`, `${r.sampleValue}_3`],
//     }));
//   }, [field_rules]);
  
//   const runLocalExecution = useCallback(() => {
//     if (selectedRule) {
//         const currentConfigForExecution = selection ? configs[selection.ruleId] : undefined;
        
//         const getExecutionConfig = (sideConfig: RuleSideConfig | undefined): RuleSideConfig | undefined => {
//             if (!sideConfig) return undefined;
//             if (isAggregateMode) {
//                 return {
//                     ...sideConfig,
//                     operationCategory: 'aggregation',
//                 };
//             }
//             return sideConfig;
//         };

//         const key1Initial = isAggregateMode ? leftAggregateData : (leftRowData && selectedRule.FieldName in leftRowData ? leftRowData[selectedRule.FieldName] : selectedRule.sampleValue || '');
//         const key2Initial = isAggregateMode ? rightAggregateData : (relatedFieldInfo && rightRowData && relatedFieldInfo.FieldName in rightRowData ? rightRowData[relatedFieldInfo.FieldName] : relatedFieldInfo?.sampleValue || 'N/A');

//         setKey1Results(executeChain(key1Initial, getExecutionConfig(currentConfigForExecution?.key1Config), availableColumns));
//         if (relatedFieldInfo || isAggregateMode) {
//             setKey2Results(executeChain(key2Initial, getExecutionConfig(currentConfigForExecution?.key2Config), availableColumns));
//         }
//     }
//   }, [selection, configs, selectedRule, isAggregateMode, leftAggregateData, rightAggregateData, leftRowData, rightRowData, relatedFieldInfo, availableColumns]);

//   useEffect(() => {
//     if (selection && configs[selection.ruleId]) {
//         runLocalExecution();
//     }
//   }, [selection, configs, runLocalExecution]);

//   const handleCollapse = useCallback(() => setIsOutputCollapsed(true), []);
//   const handleExpand = useCallback(() => setIsOutputCollapsed(false), []);

//   const toggleOutputPanel = () => {
//     const panel = outputPanelRef.current;
//     if (panel) {
//       panel.isCollapsed() ? panel.expand() : panel.collapse();
//     }
//   };

//   return (
//     <>
//     <div className="h-[45vh] flex flex-col border border-gray-300 rounded-lg min-h-0">
//       <ResizablePanelGroup direction="horizontal" className="flex-grow rounded-lg overflow-hidden">
//         <ResizablePanel defaultSize={25} minSize={20}>
//           <ConnectionsPanel
//             rules={field_rules}
//             selection={selection}
//             onSelect={setSelection}
//           />
//         </ResizablePanel>
//         <ResizableHandle withHandle />
//         <ResizablePanel defaultSize={25} minSize={20}>
//           <OperationChainPanel
//             key={selection?.ruleId + (selection?.side || '') + (selection?.operationMode || '')} 
//             title={activeTitle}
//             config={activeSideConfig}
//             initialValue={activeInitialValue}
//             availableColumns={availableColumns}
//             onOperationsChange={handleOperationsChange}
//             onSetCategory={handleSetCategory}
//             onExecute={runLocalExecution}
//             isOperationMode={selection?.type === 'validation' || !!selection?.operationMode}
//             field={field}
//             onConstantValueChange={onConstantValueChange}
//             expectedValue={expectedValue}
//           />
//         </ResizablePanel>
//         <ResizableHandle withHandle />
//         <ResizablePanel 
//             ref={outputPanelRef}
//             defaultSize={45} 
//             minSize={30}
//             collapsible 
//             collapsedSize={0}
//             onCollapse={handleCollapse}
//             onExpand={handleExpand}
//         >
//           <SampleOutputPanel
//             key1Results={key1Results}
//             key2Results={key2Results}
//             ruleTitle1={selectedRule ? `${selectedRule.TableName}.${selectedRule.FieldName}` : ''}
//             ruleTitle2={
//               relatedFieldInfo ? `${relatedFieldInfo.TableName}.${relatedFieldInfo.FieldName}` : (Array.isArray(selectedRule?.relationKeys) ? selectedRule.relationKeys.join(', ') : '')
//             }
//           />
//         </ResizablePanel>
//       </ResizablePanelGroup>
//       {!hideFooter && (
//         <div className="flex justify-between items-center gap-2 pt-2 p-2 border-t flex-shrink-0">
//           <Button size="icon" variant="outline" onClick={toggleOutputPanel}>
//               {isOutputCollapsed ? <PanelLeftOpen /> : <PanelRightClose />}
//           </Button>
//           <div className="flex gap-2">
//               <Button variant="outline" onClick={onCancel}>Cancel</Button>
//               <Button onClick={() => onSave({ fieldRuleConfigs: configs })}>Save Rule Configuration</Button>
//           </div>
//         </div>
//       )}
//     </div>
//     </>
//   );
// });
// TableFieldRuleBuilder.displayName = 'TableFieldRuleBuilder';
"use client"

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../ui/resizable"
import { ConnectionsPanel } from "../ConnectionsPanel"
import { OperationChainPanel } from "../OperationChainPanel"
import { SampleOutputPanel } from "../SampleOutputPanel"
import type { FieldRule, FieldValidationConfig, OperationCategory, RuleSideConfig, TableData } from "../types"
import { Button } from "../ui/button"
import { PanelLeftOpen, PanelRightClose } from "lucide-react"
import type { ImperativePanelHandle } from "react-resizable-panels"
import type { StepResult, Column, AppliedOperation } from "../types/deriveColumn"
import { applyOperation } from "../OperationExecutor"
import { useValidationStore } from "../Stores/validationStore"

export interface TableFieldRuleBuilderRef {
  getConfigs: () => Record<string, Partial<FieldValidationConfig>>
}

interface TableFieldRuleBuilderProps {
  field: FieldRule
  field_rules: FieldRule[]
  tableData: TableData[]
  initialState: { fieldRuleConfigs?: Record<string, Partial<FieldValidationConfig>> }
  onSave: (state: { fieldRuleConfigs: Record<string, Partial<FieldValidationConfig>> }) => void
  onCancel: () => void
  hideFooter?: boolean
  onConstantValueChange: (value: string) => void
  expectedValue: string
}

interface Selection {
  ruleId: string
  type: "key" | "validation"
  side?: "left" | "right"
  operationMode?: boolean
}

const executeChain = (
  initialValue: any,
  config: RuleSideConfig | undefined,
  availableColumns: Column[],
): StepResult[] => {
  if (!config || !config.operations || config.operations.length === 0) {
    return [{ id: "initial", operation_name: "Initial Value", result: initialValue }]
  }

  if (config.operationCategory === "aggregation") {
    const results: StepResult[] = []
    results.push({ id: "initial", operation_name: "Initial Value", result: initialValue })
    for (const op of config.operations) {
      if (!op.operation_name) continue
      const { result, error } = applyOperation(op, initialValue, 0, availableColumns)
      results.push({ id: op.id, operation_name: op.operation_name, result, error })
    }
    return results
  }

  const steps: StepResult[] = []
  let currentValue = initialValue
  steps.push({ id: "initial", operation_name: "Initial Value", result: currentValue })

  for (const op of config.operations) {
    if (!op.operation_name) {
      steps.push({
        id: op.id,
        operation_name: "Unconfigured",
        parameters: op.parameters,
        result: currentValue,
        error: "Select an operation",
      })
      continue
    }
    const { result, error } = applyOperation(op, currentValue, 0, availableColumns)
    steps.push({ id: op.id, operation_name: op.operation_name, parameters: op.parameters, result, error })
    if (error) break
    currentValue = result
  }
  return steps
}

export const TableFieldRuleBuilder = React.forwardRef<TableFieldRuleBuilderRef, TableFieldRuleBuilderProps>(
  (
    {
      field,
      field_rules,
      tableData,
      initialState,
      onSave,
      onCancel,
      hideFooter = false,
      onConstantValueChange,
      expectedValue,
    },
    ref,
  ) => {
    console.log("[DEBUG-2] TableFieldRuleBuilder RENDER - Field:", field.unique_id, field.TableName, field.FieldName)

    const [selection, setSelection] = useState<Selection | null>(null)
    const [configs, setConfigs] = useState<Record<string, Partial<FieldValidationConfig>>>({})
    const [isOutputCollapsed, setIsOutputCollapsed] = useState(false)
    const outputPanelRef = useRef<ImperativePanelHandle>(null)

    const [key1Results, setKey1Results] = useState<StepResult[] | null>(null)
    const [key2Results, setKey2Results] = useState<StepResult[] | null>(null)

    const { isAggregateMode, leftRowData, rightRowData, leftAggregateData, rightAggregateData } = useValidationStore()

    useEffect(() => {
      console.log("[DEBUG-2] TableFieldRuleBuilder initialState useEffect - Setting configs")
      setConfigs(initialState.fieldRuleConfigs || {})
    }, [initialState])

    // Load operations from field config when in edit mode
    useEffect(() => {
      if (field?.config && field.config.key_config) {
        const keyConfig = field.config.key_config
        
        // Handle both single config and array of configs
        const configs = Array.isArray(keyConfig) ? keyConfig : [keyConfig]
        
        const newConfigs: Record<string, Partial<FieldValidationConfig>> = {}
        
        configs.forEach((config: any) => {
          if (config.source && config.target) {
            // Both source and target operations
            newConfigs[field.unique_id] = {
              uniqueId: field.unique_id,
              key1Config: {
                operations: config.source.operation ? [{
                  id: `op-${config.source.operation}-${Date.now()}`,
                  operation_name: config.source.operation,
                  parameters: {}
                }] : [],
                operationCategory: config.operation_category || 'string'
              },
              key2Config: {
                operations: config.target.operation ? [{
                  id: `op-${config.target.operation}-${Date.now()}`,
                  operation_name: config.target.operation,
                  parameters: {}
                }] : [],
                operationCategory: config.operation_category || 'string'
              }
            }
          } else if (config.source) {
            // Only source operations
            newConfigs[field.unique_id] = {
              uniqueId: field.unique_id,
              key1Config: {
                operations: config.source.operation ? [{
                  id: `op-${config.source.operation}-${Date.now()}`,
                  operation_name: config.source.operation,
                  parameters: {}
                }] : [],
                operationCategory: config.operation_category || 'string'
              }
            }
          }
        })
        
        if (Object.keys(newConfigs).length > 0) {
          setConfigs(newConfigs)
        }
      }
    }, [field?.config, field?.unique_id])

    useEffect(() => {
      if (field) {
        const type = field.isValidation ? "validation" : "key"
        if (selection?.ruleId !== field.unique_id) {
          setSelection({ ruleId: field.unique_id, type, side: "left" })
        }
      }
    }, [field, selection?.ruleId])

    const selectedRule = useMemo(() => {
      return field_rules.find((r) => r.unique_id === selection?.ruleId)
    }, [selection, field_rules])

    const relatedFieldInfo = useMemo(() => {
      if (!selectedRule || !selectedRule.relationKeys || !selectedRule.relationKeys[0]) return undefined

      const targetFieldFullName = Array.isArray(selectedRule.relationKeys)
        ? selectedRule.relationKeys[0]
        : selectedRule.relationKeys
      const [tableName, fieldName] = targetFieldFullName.split(".")

      const table = tableData.find((t) => t.TableName === tableName)
      const fieldData = table?.Fields.find((f) => f.FieldName === fieldName)

      if (fieldData) {
        return {
          TableName: tableName,
          FieldName: fieldData.FieldName,
          sampleValue: fieldData.sampleValue,
          dataType: fieldData.dataType,
        }
      }

      return undefined
    }, [selectedRule, tableData])

    const handleSetCategory = useCallback(
      (category: OperationCategory) => {
        if (!selection || (!selection.side && !selection.operationMode)) return
        const { ruleId, side } = selection

        const configKey = side === "left" ? "key1Config" : "key2Config"

        setConfigs((prev) => ({
          ...prev,
          [ruleId]: {
            ...(prev[ruleId] || { uniqueId: ruleId }),
            [configKey]: {
              ...(prev[ruleId]?.[configKey] || { operations: [] }),
              operationCategory: category,
              operations: [],
            },
          },
        }))
      },
      [selection],
    )

    const handleOperationsChange = useCallback(
      (newOperations: AppliedOperation[]) => {
        if (!selection || (!selection.side && !selection.operationMode)) return
        const { ruleId, side } = selection

        const configKey = side === "left" ? "key1Config" : "key2Config"

        setConfigs((prev) => ({
          ...prev,
          [ruleId]: {
            ...(prev[ruleId] || { uniqueId: ruleId }),
            [configKey]: {
              ...(prev[ruleId]?.[configKey] || { operations: [], operationCategory: "string" }),
              operations: newOperations,
            },
          },
        }))
      },
      [selection],
    )

    React.useImperativeHandle(ref, () => ({
      getConfigs: () => configs,
    }))

    const currentConfig = selection ? configs[selection.ruleId] : undefined

    const activeSide = selection?.operationMode ? selection.side : selection?.side
    const activeSideConfig = activeSide
      ? currentConfig?.[activeSide === "left" ? "key1Config" : "key2Config"]
      : undefined

    const getActiveTitle = () => {
      if (!selection || !selectedRule) return "No selection"
      if (selection.type === "key" && !selection.operationMode) return "Key Mapping (Read-Only)"
      if (activeSide === "left") return `${selectedRule.TableName}.${selectedRule.FieldName}`
      if (activeSide === "right" && Array.isArray(selectedRule.relationKeys))
        return selectedRule.relationKeys.join(", ")
      return "Select a field"
    }
    const activeTitle = getActiveTitle()

    const getInitialValue = useCallback(() => {
      if (!selection || !selectedRule) return ""

      if (isAggregateMode) {
        return activeSide === "left" ? leftAggregateData : rightAggregateData
      }

      if (activeSide === "left") {
        return leftRowData && selectedRule.FieldName in leftRowData
          ? leftRowData[selectedRule.FieldName]
          : selectedRule.sampleValue || ""
      }

      if (activeSide === "right" && relatedFieldInfo) {
        return rightRowData && relatedFieldInfo.FieldName in rightRowData
          ? rightRowData[relatedFieldInfo.FieldName]
          : relatedFieldInfo.sampleValue || "N/A"
      }

      return ""
    }, [
      selection,
      selectedRule,
      relatedFieldInfo,
      leftRowData,
      rightRowData,
      activeSide,
      isAggregateMode,
      leftAggregateData,
      rightAggregateData,
    ])

    const activeInitialValue = getInitialValue()

    const availableColumns = useMemo((): Column[] => {
      return field_rules.map((r) => ({
        id: `${r.TableName}.${r.FieldName}`,
        name: `${r.TableName}.${r.FieldName}`,
        type: (r.dataType === "number" ? "number" : r.dataType === "boolean" ? "boolean" : "string") as
          | "string"
          | "number"
          | "boolean",
        sampleData: [r.sampleValue || "", `${r.sampleValue}_2`, `${r.sampleValue}_3`],
      }))
    }, [field_rules])

    const runLocalExecution = useCallback(() => {
      console.log("[v0] Running local execution for rule:", selectedRule?.unique_id)

      if (selectedRule) {
        const currentConfigForExecution = selection ? configs[selection.ruleId] : undefined

        const getExecutionConfig = (sideConfig: RuleSideConfig | undefined): RuleSideConfig | undefined => {
          if (!sideConfig) return undefined
          if (isAggregateMode) {
            return {
              ...sideConfig,
              operationCategory: "aggregation",
            }
          }
          return sideConfig
        }

        const key1Initial = isAggregateMode
          ? leftAggregateData
          : leftRowData && selectedRule.FieldName in leftRowData
            ? leftRowData[selectedRule.FieldName]
            : selectedRule.sampleValue || ""
        const key2Initial = isAggregateMode
          ? rightAggregateData
          : relatedFieldInfo && rightRowData && relatedFieldInfo.FieldName in rightRowData
            ? rightRowData[relatedFieldInfo.FieldName]
            : relatedFieldInfo?.sampleValue || "N/A"

        const results1 = executeChain(
          key1Initial,
          getExecutionConfig(currentConfigForExecution?.key1Config),
          availableColumns,
        )
        const results2 =
          relatedFieldInfo || isAggregateMode
            ? executeChain(key2Initial, getExecutionConfig(currentConfigForExecution?.key2Config), availableColumns)
            : null

        console.log("[v0] Execution results:", { results1, results2 })

        setKey1Results(results1)
        setKey2Results(results2)
      }
    }, [
      selection,
      configs,
      selectedRule,
      isAggregateMode,
      leftAggregateData,
      rightAggregateData,
      leftRowData,
      rightRowData,
      relatedFieldInfo,
      availableColumns,
    ])

    // Track if we've already run execution for this selection to prevent infinite loops
    const hasRunExecutionRef = useRef(false)
    const previousSelectionIdRef = useRef<string | null>(null)

    useEffect(() => {
      console.log("[DEBUG-2] TableFieldRuleBuilder execution useEffect triggered")
      const currentSelectionId = selection?.ruleId || null
      console.log("[DEBUG-2] Current selection ID:", currentSelectionId)
      console.log("[DEBUG-2] Previous selection ID:", previousSelectionIdRef.current)
      console.log("[DEBUG-2] Has run execution:", hasRunExecutionRef.current)

      // Only run if selection changed to a new ruleId
      if (currentSelectionId !== previousSelectionIdRef.current) {
        console.log("[DEBUG-2] Selection changed, resetting execution flag")
        previousSelectionIdRef.current = currentSelectionId
        hasRunExecutionRef.current = false
      }

      // Run execution only once when selection has a valid ruleId and config
      if (currentSelectionId && configs[currentSelectionId] && !hasRunExecutionRef.current) {
        console.log("[DEBUG-2] Running local execution for:", currentSelectionId)
        hasRunExecutionRef.current = true
        runLocalExecution()
      } else {
        console.log("[DEBUG-2] Skipping execution - conditions not met")
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selection?.ruleId])

    const handleCollapse = useCallback(() => setIsOutputCollapsed(true), [])
    const handleExpand = useCallback(() => setIsOutputCollapsed(false), [])

    const toggleOutputPanel = () => {
      const panel = outputPanelRef.current
      if (panel) {
        panel.isCollapsed() ? panel.expand() : panel.collapse()
      }
    }

    return (
      <>
        <div className="h-[45vh] flex flex-col border border-gray-300 rounded-lg min-h-0">
          <ResizablePanelGroup direction="horizontal" className="flex-grow rounded-lg overflow-hidden">
            <ResizablePanel defaultSize={25} minSize={20}>
              <ConnectionsPanel rules={field_rules} selection={selection} onSelect={setSelection} />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={20}>
              <OperationChainPanel
                key={selection?.ruleId + (selection?.side || "") + (selection?.operationMode || "")}
                title={activeTitle}
                config={activeSideConfig}
                initialValue={activeInitialValue}
                availableColumns={availableColumns}
                onOperationsChange={handleOperationsChange}
                onSetCategory={handleSetCategory}
                onExecute={runLocalExecution}
                isOperationMode={selection?.type === "validation" || !!selection?.operationMode}
                field={field}
                onConstantValueChange={onConstantValueChange}
                expectedValue={expectedValue}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel
              ref={outputPanelRef}
              defaultSize={45}
              minSize={30}
              collapsible
              collapsedSize={0}
              onCollapse={handleCollapse}
              onExpand={handleExpand}
            >
              <SampleOutputPanel
                key1Results={key1Results}
                key2Results={key2Results}
                ruleTitle1={selectedRule ? `${selectedRule.TableName}.${selectedRule.FieldName}` : ""}
                ruleTitle2={
                  relatedFieldInfo
                    ? `${relatedFieldInfo.TableName}.${relatedFieldInfo.FieldName}`
                    : Array.isArray(selectedRule?.relationKeys)
                      ? selectedRule.relationKeys.join(", ")
                      : ""
                }
                expectedValueType={field.expectedValueType} // Pass expectedValueType prop
              />
            </ResizablePanel>
          </ResizablePanelGroup>
          {!hideFooter && (
            <div className="flex justify-between items-center gap-2 pt-2 p-2 border-t flex-shrink-0">
              <Button size="icon" variant="outline" onClick={toggleOutputPanel}>
                {isOutputCollapsed ? <PanelLeftOpen /> : <PanelRightClose />}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button onClick={() => onSave({ fieldRuleConfigs: configs })}>Save Rule Configuration</Button>
              </div>
            </div>
          )}
        </div>
      </>
    )
  },
)
TableFieldRuleBuilder.displayName = "TableFieldRuleBuilder"
