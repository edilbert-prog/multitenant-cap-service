// import React from 'react';
// import { CardTitle } from '../ui/card';
// import { ScrollArea } from '../ui/scroll-area';
// import { FieldRule } from '../types/validation';
// import { cn } from '../lib/utils';
// import { ArrowRight, Settings } from 'lucide-react';
// import { Badge } from '../ui/badge';
// import { Button } from '../ui/button';
// import { useValidationStore } from '../Stores/validationStore';

// interface Selection {
//   ruleId: string;
//   type: 'key' | 'validation';
//   side?: 'left' | 'right';
//   operationMode?: boolean;
// }

// interface ConnectionsPanelProps {
//   rules: FieldRule[];
//   selection: Selection | null;
//   onSelect: (selection: Selection) => void;
// }

// const ColumnDisplay: React.FC<{ 
//     name: string; 
//     isSelected: boolean;
//     isParentSelected?: boolean;
//     onClick?: () => void;
//     rowData: any | null;
//     aggregateData: any[] | null;
//     isAggregateMode: boolean;
// }> = ({ name, isSelected, isParentSelected, onClick, rowData, aggregateData, isAggregateMode }) => {
    
//     const fieldName = name.split('.')[1];
//     const displayValue = rowData && fieldName && rowData[fieldName] !== undefined ? String(rowData[fieldName]) : null;

//     return (
//         <div 
//           className={cn(
//             "flex-1 flex flex-col items-start gap-1 p-2 rounded-md transition-all",
//             !isParentSelected && "bg-background",
//             onClick && "cursor-pointer hover:bg-accent",
//             isSelected && "bg-blue-100"
//           )}
//           onClick={onClick}
//         >
//             <Badge variant="outline" className="font-mono bg-white truncate max-w-full border-gray-300">{name.toUpperCase()}</Badge>
//             <div className="text-xs text-muted-foreground pl-1 truncate max-w-full h-auto flex items-center">
//                 {isAggregateMode && aggregateData ? (
//                     <ScrollArea className="h-16 w-full">
//                         <div className="flex flex-col items-start">
//                             {aggregateData.map((item, index) => (
//                                 <span key={index} className="font-mono text-primary font-bold">{String(item)}</span>
//                             ))}
//                         </div>
//                     </ScrollArea>
//                 ) : displayValue !== null ? (
//                     <span className="font-mono text-primary font-bold">{displayValue}</span>
//                 ) : (
//                     <span className="italic text-gray-400">- no data -</span>
//                 )}
//             </div>
//         </div>
//     );
// };

// const MappingRow: React.FC<{
//     rule: FieldRule;
//     selection: Selection | null;
//     onSelect: (selection: Selection) => void;
//     type: 'key' | 'validation';
// }> = ({ rule, selection, onSelect, type }) => {
//     const { 
//         isAggregateMode, 
//         aggregateFieldId, 
//         leftAggregateData, 
//         rightAggregateData,
//         leftRowData,
//         rightRowData
//     } = useValidationStore();

//     const isRowSelected = selection?.ruleId === rule.unique_id;
//     const isKeyRowSelected = type === 'key' && isRowSelected;
//     const isCurrentFieldInAggregateMode = isAggregateMode && aggregateFieldId === rule.unique_id;

//     const sourceField = `${rule.TableName}.${rule.FieldName}`;
//     const targetField = Array.isArray(rule.relationKeys) ? rule.relationKeys[0] || 'N/A' : rule.relationKeys || 'N/A';

//     const handleSettingsClick = (e: React.MouseEvent) => {
//         e.stopPropagation();
//         onSelect({ 
//             ruleId: rule.unique_id, 
//             type: 'key', 
//             side: selection?.side || 'left',
//             operationMode: !selection?.operationMode 
//         });
//     };

//     const isThisRowActive = selection?.ruleId === rule.unique_id;
//     const leftDataToShow = isThisRowActive ? leftRowData : null;
//     const rightDataToShow = isThisRowActive ? rightRowData : null;

//     return (
//         <div
//             onClick={type === 'key' ? () => onSelect({ ruleId: rule.unique_id, type: 'key', operationMode: false }) : undefined}
//             className={cn(
//                 "p-2 rounded-md border flex items-center justify-between gap-2 border-gray-300 bg-muted/50",
//                 type === 'key' && "cursor-pointer hover:bg-accent transition-all",
//                 isKeyRowSelected && !selection.operationMode && "bg-blue-100"
//             )}
//         >
//             <ColumnDisplay 
//                 name={sourceField}
//                 isSelected={isRowSelected && selection?.type === 'validation' && selection?.side === 'left'}
//                 isParentSelected={isKeyRowSelected && !selection.operationMode}
//                 onClick={type === 'validation' ? () => onSelect({ ruleId: rule.unique_id, type: 'validation', side: 'left' }) : undefined}
//                 rowData={leftDataToShow}
//                 aggregateData={isCurrentFieldInAggregateMode ? leftAggregateData : null}
//                 isAggregateMode={isCurrentFieldInAggregateMode}
//             />
//             <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mx-2" />
//             <ColumnDisplay 
//                 name={targetField}
//                 isSelected={isRowSelected && selection?.type === 'validation' && selection?.side === 'right'}
//                 isParentSelected={isKeyRowSelected && !selection.operationMode}
//                 onClick={type === 'validation' ? () => onSelect({ ruleId: rule.unique_id, type: 'validation', side: 'right' }) : undefined}
//                 rowData={rightDataToShow}
//                 aggregateData={isCurrentFieldInAggregateMode ? rightAggregateData : null}
//                 isAggregateMode={isCurrentFieldInAggregateMode}
//             />
//             {type === 'key' && (
//                  <Button variant="ghost" size="icon" className={cn("h-8 w-8 flex-shrink-0 ml-2", isRowSelected && selection.operationMode && "bg-blue-200")} onClick={handleSettingsClick}>
//                     <Settings className="h-4 w-4 text-muted-foreground" />
//                 </Button>
//             )}
//         </div>
//     );
// };

// export const ConnectionsPanel: React.FC<ConnectionsPanelProps> = ({ rules, selection, onSelect }) => {
//   const getMappingIdentifier = (rule: FieldRule) => {
//     const source = `${rule.TableName}.${rule.FieldName}`;
//     const target = Array.isArray(rule.relationKeys) ? rule.relationKeys[0] || 'N/A' : rule.relationKeys || 'N/A';
//     return `${source}->${target}`;
//   };

//   const uniqueMappings = new Map<string, FieldRule>();

//   for (const rule of rules) {
//     if (rule.isValidation && rule.relationKeys && (Array.isArray(rule.relationKeys) ? rule.relationKeys.length > 0 : rule.relationKeys)) {
//       const identifier = getMappingIdentifier(rule);
//       uniqueMappings.set(identifier, rule);
//     }
//   }

//   for (const rule of rules) {
//     if (rule.isKey && rule.relationKeys && (Array.isArray(rule.relationKeys) ? rule.relationKeys.length > 0 : rule.relationKeys)) {
//       const identifier = getMappingIdentifier(rule);
//       if (!uniqueMappings.has(identifier)) {
//         uniqueMappings.set(identifier, rule);
//       }
//     }
//   }

//   const allUniqueRules = Array.from(uniqueMappings.values());

//   const validationMappings = allUniqueRules.filter(r => r.isValidation);
//   const keyMappings = allUniqueRules.filter(r => r.isKey && !r.isValidation);

//   return (
//     <div className="h-full flex flex-col p-2 min-h-0 border border-gray-300 rounded-lg">
//       <CardTitle className="p-2 text-base font-semibold flex-shrink-0">Connections & Rules</CardTitle>
//       <ScrollArea className="flex-grow p-1">
//         <div className="space-y-4">
//           <div>
//             <h4 className="font-semibold text-sm mb-2 text-muted-foreground px-1">Key Mappings ({keyMappings.length})</h4>
//             <div className="space-y-2">
//               {keyMappings.length > 0 ? keyMappings.map(rule => (
//                 <MappingRow
//                     key={rule.unique_id + '-key'}
//                     rule={rule}
//                     selection={selection}
//                     onSelect={onSelect}
//                     type="key"
//                 />
//               )) : <p className="text-xs text-muted-foreground text-center p-2">No key-only mappings with relations defined.</p>}
//             </div>
//           </div>

//           <div>
//             <h4 className="font-semibold text-sm mt-4 mb-2 text-muted-foreground px-1">Validation Mappings ({validationMappings.length})</h4>
//             <div className="space-y-2">
//               {validationMappings.length > 0 ? validationMappings.map(rule => (
//                  <MappingRow
//                     key={rule.unique_id + '-validation'}
//                     rule={rule}
//                     selection={selection}
//                     onSelect={onSelect}
//                     type="validation"
//                 />
//               )) : <p className="text-xs text-muted-foreground text-center p-2">No validation mappings with relations defined.</p>}
//             </div>
//           </div>
//         </div>
//       </ScrollArea>
//     </div>
//   );
// };
"use client"

import type React from "react"
import { CardTitle } from "../ui/card"
import { ScrollArea } from "../ui/scroll-area"
import type { FieldRule } from "../types"
import { cn } from "../lib/utils"
import { ArrowRight, Settings } from "lucide-react"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { useValidationStore } from "../Stores/validationStore"

interface Selection {
  ruleId: string
  type: "key" | "validation"
  side?: "left" | "right"
  operationMode?: boolean
}

interface ConnectionsPanelProps {
  rules: FieldRule[]
  selection: Selection | null
  onSelect: (selection: Selection) => void
}

const ColumnDisplay: React.FC<{
  name: string
  isSelected: boolean
  isParentSelected?: boolean
  onClick?: () => void
  rowData: any | null
  aggregateData: any[] | null
  isAggregateMode: boolean
}> = ({ name, isSelected, isParentSelected, onClick, rowData, aggregateData, isAggregateMode }) => {
  const fieldName = name.split(".")[1]
  const displayValue = rowData && fieldName && rowData[fieldName] !== undefined ? String(rowData[fieldName]) : null

  return (
    <div
      className={cn(
        "flex-1 flex flex-col items-start gap-1 p-2 rounded-md transition-all",
        !isParentSelected && "bg-background",
        onClick && "cursor-pointer hover:bg-accent"
      )}
      style={isSelected ? { backgroundColor: '#F3F0FF' } : {}}
      onClick={onClick}
    >
      <Badge variant="outline" className="font-mono bg-white truncate max-w-full border-gray-300">
        {name.toUpperCase()}
      </Badge>
      <div className="text-xs text-muted-foreground pl-1 truncate max-w-full h-auto flex items-center">
        {isAggregateMode && aggregateData ? (
          <ScrollArea className="h-16 w-full">
            <div className="flex flex-col items-start">
              {aggregateData.map((item, index) => (
                <span key={index} className="font-mono text-primary font-bold">
                  {String(item)}
                </span>
              ))}
            </div>
          </ScrollArea>
        ) : displayValue !== null ? (
          <span className="font-mono text-primary font-bold">{displayValue}</span>
        ) : (
          <span className="italic text-gray-400">- no data -</span>
        )}
      </div>
    </div>
  )
}

const MappingRow: React.FC<{
  rule: FieldRule
  selection: Selection | null
  onSelect: (selection: Selection) => void
  type: "key" | "validation"
}> = ({ rule, selection, onSelect, type }) => {
  const { isAggregateMode, aggregateFieldId, leftAggregateData, rightAggregateData, leftRowData, rightRowData } =
    useValidationStore()

  const isRowSelected = selection?.ruleId === rule.unique_id
  const isKeyRowSelected = type === "key" && isRowSelected
  const isCurrentFieldInAggregateMode = isAggregateMode && aggregateFieldId === rule.unique_id

  const sourceField = `${rule.TableName}.${rule.FieldName}`
  const targetField = Array.isArray(rule.relationKeys) ? rule.relationKeys[0] || "N/A" : rule.relationKeys || "N/A"

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect({
      ruleId: rule.unique_id,
      type: "key",
      side: selection?.side || "left",
      operationMode: !selection?.operationMode,
    })
  }

  const isThisRowActive = selection?.ruleId === rule.unique_id
  const leftDataToShow = isThisRowActive ? leftRowData : null
  const rightDataToShow = isThisRowActive ? rightRowData : null

  return (
    <div
      onClick={
        type === "key" ? () => onSelect({ ruleId: rule.unique_id, type: "key", operationMode: false }) : undefined
      }
      className={cn(
        "p-2 rounded-md border flex items-center justify-between gap-2 border-gray-300 bg-muted/50",
        type === "key" && "cursor-pointer hover:bg-accent transition-all"
      )}
      style={isKeyRowSelected && !selection.operationMode ? { backgroundColor: '#F3F0FF' } : {}}
    >
      <ColumnDisplay
        name={sourceField}
        isSelected={isRowSelected && selection?.type === "validation" && selection?.side === "left"}
        isParentSelected={isKeyRowSelected && !selection.operationMode}
        onClick={
          type === "validation"
            ? () => onSelect({ ruleId: rule.unique_id, type: "validation", side: "left" })
            : undefined
        }
        rowData={leftDataToShow}
        aggregateData={isCurrentFieldInAggregateMode ? leftAggregateData : null}
        isAggregateMode={isCurrentFieldInAggregateMode}
      />
      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mx-2" />
      <ColumnDisplay
        name={targetField}
        isSelected={isRowSelected && selection?.type === "validation" && selection?.side === "right"}
        isParentSelected={isKeyRowSelected && !selection.operationMode}
        onClick={
          type === "validation"
            ? () => onSelect({ ruleId: rule.unique_id, type: "validation", side: "right" })
            : undefined
        }
        rowData={rightDataToShow}
        aggregateData={isCurrentFieldInAggregateMode ? rightAggregateData : null}
        isAggregateMode={isCurrentFieldInAggregateMode}
      />
      {type === "key" && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0 ml-2"
          style={isRowSelected && selection.operationMode ? { backgroundColor: '#E9E5FF' } : {}}
          onClick={handleSettingsClick}
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
        </Button>
      )}
    </div>
  )
}

export const ConnectionsPanel: React.FC<ConnectionsPanelProps> = ({ rules, selection, onSelect }) => {
  const { isAggregateMode, aggregateFieldId, leftAggregateData, rightAggregateData, leftRowData, rightRowData } =
    useValidationStore()

  const getMappingIdentifier = (rule: FieldRule) => {
    const source = `${rule.TableName}.${rule.FieldName}`
    const target = Array.isArray(rule.relationKeys) ? rule.relationKeys[0] || "N/A" : rule.relationKeys || "N/A"
    return `${source}->${target}`
  }

  const uniqueMappings = new Map<string, FieldRule>()

  for (const rule of rules) {
    if (
      rule.isValidation &&
      rule.relationKeys &&
      (Array.isArray(rule.relationKeys) ? rule.relationKeys.length > 0 : rule.relationKeys)
    ) {
      const identifier = getMappingIdentifier(rule)
      uniqueMappings.set(identifier, rule)
    }
  }

  for (const rule of rules) {
    if (
      rule.isKey &&
      rule.relationKeys &&
      (Array.isArray(rule.relationKeys) ? rule.relationKeys.length > 0 : rule.relationKeys)
    ) {
      const identifier = getMappingIdentifier(rule)
      if (!uniqueMappings.has(identifier)) {
        uniqueMappings.set(identifier, rule)
      }
    }
  }

  const allUniqueRules = Array.from(uniqueMappings.values())

  const validationMappings = allUniqueRules.filter((r) => r.isValidation)
  const keyMappings = allUniqueRules.filter((r) => r.isKey && !r.isValidation)

  return (
    <div className="h-full flex flex-col p-2 min-h-0 border border-gray-300 rounded-lg">
      <CardTitle className="p-2 text-base font-semibold flex-shrink-0">Connections & Rules</CardTitle>
      <ScrollArea className="flex-grow p-1">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2 text-muted-foreground px-1">
              Key Mappings ({keyMappings.length})
            </h4>
            <div className="space-y-2">
              {keyMappings.length > 0 ? (
                keyMappings.map((rule) => (
                  <MappingRow
                    key={rule.unique_id + "-key"}
                    rule={rule}
                    selection={selection}
                    onSelect={onSelect}
                    type="key"
                  />
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center p-2">
                  No key-only mappings with relations defined.
                </p>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mt-4 mb-2 text-muted-foreground px-1">
              Validation Mappings ({validationMappings.length})
            </h4>
            <div className="space-y-2">
              {validationMappings.length > 0 ? (
                validationMappings.map((rule) => (
                  <MappingRow
                    key={rule.unique_id + "-validation"}
                    rule={rule}
                    selection={selection}
                    onSelect={onSelect}
                    type="validation"
                  />
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center p-2">
                  No validation mappings with relations defined.
                </p>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
