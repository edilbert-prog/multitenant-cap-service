// import React, { useState, useEffect } from 'react';
// import { FieldRule, FieldValidationConfig, TableData } from '../types/validation';
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
// import { ArrowLeft } from 'lucide-react';
// import { ValidationKeyEditor } from '../ValidationKeyEditor';
// import { CombinationKeyEditor } from '../CombinationKeyEditor';
// import { GlobalKeyEditor } from '../GlobalKeyEditor';
// import { FixedValueEditor } from '../FixedValueEditor';
// import { Button } from '../ui/button';

// interface ValueTypeConfigurationProps {
//   field: FieldRule;
//   initialConfig?: Partial<FieldValidationConfig>;
//   tableData: TableData[];
//   onSave: (updates: Partial<FieldRule>) => void;
//   onClose: () => void;
//   filterValues: any;
//   isReadOnly?: boolean;
// }
// export const ValueTypeConfiguration: React.FC<ValueTypeConfigurationProps> = ({
//   field,
//   initialConfig,
//   tableData,
//   onSave,
//   onClose,
//   filterValues,
//   isReadOnly = false,
// }) => {
//   const [updates, setUpdates] = useState<Partial<FieldRule>>({});

//   useEffect(() => {
//     const initialUpdates: Partial<FieldRule> = {
//       config: { ...initialConfig },
//       expectedValue: field.expectedValue,
//       relationKeys: field.relationKeys,
//     };
//     setUpdates(initialUpdates);
//   }, [initialConfig, field]);

//   const handleSave = () => {
//     if (isReadOnly) return;
//     onSave(updates);
//   };

//   const handleConfigChange = (newConfig: Partial<FieldValidationConfig>) => {
//     if (isReadOnly) return;
//     setUpdates((prev) => ({ ...prev, config: { ...prev.config, ...newConfig } }));
//   };

//   const renderEditor = () => {
//     switch (field.expectedValueType) {
//       case 'global_key':
//         return <GlobalKeyEditor config={updates.config || {}} setConfig={handleConfigChange} />;
//       case 'fixed_value':
//         return (
//           <FixedValueEditor
//             config={updates.config || {}}
//             setConfig={handleConfigChange}
//             tableNames={(tableData || []).map((t) => t.TableName)}
//           />
//         );
//       case 'combination_key':
//         return <CombinationKeyEditor config={updates.config || {}} setConfig={handleConfigChange} tableData={tableData} />;
//       case 'validation_key':
//         return <ValidationKeyEditor config={updates.config || {}} setConfig={handleConfigChange} />;
//       default:
//         return null; // 👈 if unknown type, don’t render anything
//     }
//   };

//   // 👇 If no valid expectedValueType, return null (don’t render card at all)
//   if (!field.expectedValueType || !renderEditor()) {
//     return null;
//   }

//   return (
//     <Card className="w-full h-full flex flex-col gap-0 px-0 pt-2 pb-0 shadow-md bg-white border">
//       <CardHeader className="flex-shrink-0 border-b !pb-2 px-4">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-4">
//             <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground">
//               <ArrowLeft className="h-5 w-5" />
//             </Button>
//             <div>
//               <CardTitle className="text-base">
//                 Configure: {(field.expectedValueType || 'Unknown Type')
//                   .replace(/_/g, ' ')
//                   .replace(/\b\w/g, (l) => l.toUpperCase())}
//               </CardTitle>
//               <CardDescription>
//                 <span className="font-semibold text-blue-600 text-xs">
//                   {field.TableName}.{field.FieldName}
//                 </span>
//               </CardDescription>
//             </div>
//           </div>
//         </div>
//       </CardHeader>
//       <CardContent className="p-4 flex-grow overflow-y-auto">{renderEditor()}</CardContent>
//       {!isReadOnly && (
//         <CardFooter className="flex items-end justify-end border-t pt-4 p-4">
//           <Button size="sm" onClick={handleSave}>
//             Save Configuration
//           </Button>
//         </CardFooter>
//       )}
//     </Card>
//   );
// };


import React, { useState, useEffect, useCallback } from 'react';
import { FieldRule, FieldValidationConfig, TableData } from '../types/validation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft } from 'lucide-react';
import { ValidationKeyEditor } from '../ValidationKeyEditor';
import { CombinationKeyEditor } from '../CombinationKeyEditor';
import { GlobalKeyEditor } from '../GlobalKeyEditor';
import { FixedValueEditor } from '../FixedValueEditor';
import { Button } from '../ui/button';

interface ValueTypeConfigurationProps { 
  field: FieldRule;
  initialConfig?: Partial<FieldValidationConfig>;
  tableData: TableData[];
  onSave: (updates: Partial<FieldRule>) => void;
  onClose: () => void;
  filterValues: any;
  isReadOnly?: boolean;
}
export const ValueTypeConfiguration: React.FC<ValueTypeConfigurationProps> = ({
  field,
  initialConfig,
  tableData,
  onSave,
  onClose,
  filterValues,
  isReadOnly = false,
}) => {
  const [updates, setUpdates] = useState<Partial<FieldRule>>({});

  useEffect(() => {
    const initialUpdates: Partial<FieldRule> = {
      config: { ...initialConfig },
      expectedValue: field.expectedValue,
      relationKeys: field.relationKeys,
    };
    setUpdates(initialUpdates);
  }, [initialConfig, field]);

  const handleSave = () => {
    if (isReadOnly) return;
    onSave(updates);
  };

  const handleConfigChange = useCallback((newConfig: Partial<FieldValidationConfig>) => {
    if (isReadOnly) return;
    setUpdates((prev) => ({ ...prev, config: { ...prev.config, ...newConfig } }));
  }, [isReadOnly]);

  const renderEditor = () => {      //renderEditor in the maintainer fielder =man
    switch (field.expectedValueType) {  
      case 'global_key':
        return <GlobalKeyEditor config={updates.config || {}} setConfig={handleConfigChange} />;
      // case 'fixed_value':
      //   return (
      //     <FixedValueEditor
      //       config={updates.config || {}}
      //       setConfig={handleConfigChange}
      //       tableNames={(tableData || []).map((t) => t.TableName)}
      //     />
      //   );
      case 'combination_key': 
        return <CombinationKeyEditor config={updates.config || {}} setConfig={handleConfigChange} tableData={tableData} />;
      case 'validation_key':
        return <ValidationKeyEditor config={updates.config || {}} setConfig={handleConfigChange} />;
      default:
        return null; // 👈 if unknown type, don’t render anything
    }
  };

  // 👇 If no valid expectedValueType, return null (don’t render card at all)
  if (!field.expectedValueType || !renderEditor()) {  
    return null;
  }

  return (
    <Card className="w-full h-full flex flex-col gap-0 px-0 pt-2 pb-0 shadow-md bg-white border">
      <CardHeader className="flex-shrink-0 border-b border-gray-300 !pb-2 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <CardTitle className="text-base">
                Configure: {(field.expectedValueType || 'Unknown Type')
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </CardTitle>
              <CardDescription>
                <span className="font-semibold text-blue-600 text-xs">
                  {field.TableName}.{field.FieldName}
                </span>
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow overflow-y-auto">{renderEditor()}</CardContent>
      {!isReadOnly && (
        <CardFooter className="flex items-end justify-end border-t pt-4 p-4">
          <Button size="sm" onClick={handleSave}>
            Save Configuration
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
