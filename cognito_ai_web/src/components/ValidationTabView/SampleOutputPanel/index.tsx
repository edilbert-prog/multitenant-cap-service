// import React, { useEffect, useState } from 'react';
// import { CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
// import { ScrollArea } from '../ui/scroll-area';
// import { ArrowDown, ArrowRight, CheckCircle, Info, XCircle } from 'lucide-react';
// import { StepResult, TRANSFORMATION_OPERATIONS } from '../types/deriveColumn';
// import { toast } from 'sonner';
// import { Button } from '../ui/button';
// import { Label } from '../ui/label';
// import { Badge } from '../ui/badge';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

// // interface SampleOutputPanelProps {
// //   key1Results: StepResult[] | null;
// //   key2Results: StepResult[] | null;
// //   ruleTitle1: string;
// //   ruleTitle2: string;
// // }

// const ResultTable: React.FC<{
//     title: string;
//     steps: StepResult[];
//     validationStatus: Record<string, 'success' | 'failure'>;
// }> = ({ title, steps, validationStatus }) => {
//     if (steps.length === 0) return null;

//     const initialStep = steps[0];
//     const operationSteps = steps.slice(1);

//     const renderValue = (value: any) => {
//         if (value === null) return <span className="text-muted-foreground italic">null</span>;
//         if (Array.isArray(value)) {
//             return `[${value.join(', ')}]`;
//         }
//         return String(value);
//     };

//     return (
//         <div className="flex-1">
//             <h4 className="font-semibold text-sm mb-2 text-muted-foreground px-1">{title}</h4>
//             <div className="border rounded-md border-gray-300">
//                 <Table>
//                     <TableHeader className='border-gray-300'>
//                         <TableRow className='border-gray-300'>
//                             <TableHead>Operation</TableHead>
//                             <TableHead>Result</TableHead>
//                             <TableHead className="w-[50px]">Status</TableHead>
//                         </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                         <TableRow className='border-gray-300'>
//                             <TableCell className="font-medium">Initial Value</TableCell>
//                             <TableCell className="font-mono text-xs">{renderValue(initialStep.result)}</TableCell>
//                             <TableCell />
//                         </TableRow>
//                         {operationSteps.map(step => (
//                             <TableRow className='border-gray-300' key={step.id}>
//                                 <TableCell className="font-medium">{step.operation_name}</TableCell>
//                                 <TableCell className="font-mono text-xs">
//                                     {step.error ? (
//                                         <span className="text-destructive">{step.error}</span>
//                                     ) : (
//                                         renderValue(step.result)
//                                     )}
//                                 </TableCell>
//                                 <TableCell className="text-center">
//                                     {validationStatus[step.operation_name] === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
//                                     {validationStatus[step.operation_name] === 'failure' && <XCircle className="h-4 w-4 text-destructive" />}
//                                 </TableCell>
//                             </TableRow>
//                         ))}
//                     </TableBody>
//                 </Table>
//             </div>
//         </div>
//     );
// };
// interface SampleOutputPanelProps {
//   key1Results: StepResult[] | null;
//   key2Results: StepResult[] | null;
//   ruleTitle1: string;
//   ruleTitle2: string;
//   expectedValueType: string;   // 🔹 new prop
// }

// export const SampleOutputPanel: React.FC<SampleOutputPanelProps> = ({ 
//   key1Results, 
//   key2Results, 
//   ruleTitle1, 
//   ruleTitle2, 
//   expectedValueType 
// }) => {
//   const [validationStatus, setValidationStatus] = useState<Record<string, 'success' | 'failure'>>({});

//   useEffect(() => {
//     setValidationStatus({});
//   }, [key1Results, key2Results, expectedValueType]);

//   const handleValidate = () => {
//     if (!key1Results || !key2Results) return;

//     const newStatus: Record<string, 'success' | 'failure'> = {};
//     const key1Ops = key1Results.slice(1);
//     const key2Ops = key2Results.slice(1);

//     key1Ops.forEach(op1 => {
//       const op2 = key2Ops.find(op => op.operation_name === op1.operation_name);
//       if (op1.error || (op2 && op2.error)) {
//         return;
//       }
//       if (op2) {
//         const isEqual = JSON.stringify(op1.result) === JSON.stringify(op2.result);
//         newStatus[op1.operation_name] = isEqual ? 'success' : 'failure';
//       }
//     });

//     setValidationStatus(newStatus);
//   };
  
//   const canValidate = key1Results && key1Results.length > 0 && key2Results && key2Results.length > 0;

//   return (
//     <div className="h-full flex flex-col p-2 min-h-0 border border-gray-300 rounded-lg">
//       <CardHeader className="p-2 flex flex-row items-center justify-between flex-shrink-0">
//         <CardTitle className="text-base">Sample Output</CardTitle>
//       </CardHeader>
//       <CardContent className="p-2 flex-grow min-h-0">
//         <ScrollArea className="h-full">
//           {expectedValueType === "constant_value" ? (
//             <div className="text-center text-sm text-muted-foreground h-full flex items-center justify-center">
//               No Sample output screen for expected value type <b>Constant value</b>.
//             </div>
//           ) : !key1Results && !key2Results ? (
//             <div className="text-center text-sm text-muted-foreground h-full flex items-center justify-center">
//               Click "Execute" to see results.
//             </div>
//           ) : (
//             <div className="flex gap-4 pr-4">
//               {key1Results && <ResultTable title={ruleTitle1} steps={key1Results} validationStatus={validationStatus} />}
//               {key2Results && <ResultTable title={ruleTitle2} steps={key2Results} validationStatus={validationStatus} />}
//             </div>
//           )}
//         </ScrollArea>
//       </CardContent>
//       {expectedValueType !== "constant_value" && (
//         <CardFooter className="p-2 pt-2 flex justify-end flex-shrink-0">
//           <Button onClick={handleValidate} size="sm" disabled={!canValidate}>
//             <CheckCircle className="mr-2 h-4 w-4" />
//             Validate
//           </Button>
//         </CardFooter>
//       )}
//     </div>
//   );
// };
"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { ScrollArea } from "../ui/scroll-area"
import { CheckCircle, XCircle } from "lucide-react"
import type { StepResult } from "../types/deriveColumn"
import { Button } from "../ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"

// interface SampleOutputPanelProps {
//   key1Results: StepResult[] | null;
//   key2Results: StepResult[] | null;
//   ruleTitle1: string;
//   ruleTitle2: string;
// }

const ResultTable: React.FC<{
  title: string
  steps: StepResult[]
  validationStatus: Record<string, "success" | "failure">
}> = ({ title, steps, validationStatus }) => {
  if (steps.length === 0) return null

  const initialStep = steps[0]
  const operationSteps = steps.slice(1)

  const renderValue = (value: any) => {
    if (value === null) return <span className="text-muted-foreground italic">null</span>
    if (Array.isArray(value)) {
      return `[${value.join(", ")}]`
    }
    return String(value)
  }

  return (
    <div className="flex-1">
      <h4 className="font-semibold text-sm mb-3 text-gray-700 px-1">{title}</h4>
      <div className="space-y-2">
        {/* Initial Value */}
        <div className="p-3 rounded-lg border bg-gray-50 border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-600">1.</span>
              <span className="text-sm font-medium">Initial Value</span>
            </div>
            <div className="text-sm">
              <span className="font-mono bg-white px-2 py-1 rounded border text-xs">
                {typeof initialStep.result === 'string' ? `"${initialStep.result}"` : renderValue(initialStep.result)}
              </span>
            </div>
          </div>
        </div>

        {/* Operation Steps */}
        {operationSteps.map((step, index) => (
          <div
            key={step.id}
            className={`p-3 rounded-lg border ${
              step.error 
                ? 'bg-red-50 border-red-200' 
                : index === operationSteps.length - 1 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-600">
                  {index + 2}.
                </span>
                <span className="text-sm font-medium">
                  {step.operation_name}
                </span>
                {validationStatus[step.operation_name] === "success" && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {validationStatus[step.operation_name] === "failure" && (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="text-sm">
                {step.error ? (
                  <span className="text-red-600 text-xs">{step.error}</span>
                ) : (
                  <span className="font-mono bg-white px-2 py-1 rounded border text-xs">
                    {typeof step.result === 'string' ? `"${step.result}"` : renderValue(step.result)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
interface SampleOutputPanelProps {
  key1Results: StepResult[] | null
  key2Results: StepResult[] | null
  ruleTitle1: string
  ruleTitle2: string
  expectedValueType: string // 🔹 new prop
}

export const SampleOutputPanel: React.FC<SampleOutputPanelProps> = ({
  key1Results,
  key2Results,
  ruleTitle1,
  ruleTitle2,
  expectedValueType,
}) => {
  console.log("[DEBUG-4] SampleOutputPanel RENDER")

  const [validationStatus, setValidationStatus] = useState<Record<string, "success" | "failure">>({})

  useEffect(() => {
    console.log("[DEBUG-4] ============ SampleOutputPanel useEffect TRIGGERED ============")
    console.log("[DEBUG-4] key1Results:", key1Results ? "present" : "null")
    console.log("[DEBUG-4] key2Results:", key2Results ? "present" : "null")
    console.log("[DEBUG-4] expectedValueType:", expectedValueType)
    console.log("[DEBUG-4] Current validationStatus keys count:", Object.keys(validationStatus).length)
    // Only reset validationStatus if it's not already empty (prevents infinite loops)
    setValidationStatus((prev) => {
      const shouldReset = Object.keys(prev).length > 0
      console.log("[DEBUG-4] Should reset validationStatus:", shouldReset)
      if (shouldReset) {
        return {}
      }
      return prev
    })
    console.log("[DEBUG-4] ============ SampleOutputPanel useEffect END ============")
  }, [key1Results, key2Results, expectedValueType])

  const handleValidate = () => {
    if (!key1Results) return

    const newStatus: Record<string, "success" | "failure"> = {}
    const key1Ops = key1Results.slice(1)
    const key2Ops = key2Results ? key2Results.slice(1) : []

    // Get all unique operations from both sides
    const allOperations = [...new Set([
      ...key1Ops.map(op => op.operation_name),
      ...key2Ops.map(op => op.operation_name)
    ])]

    allOperations.forEach((operationName) => {
      const op1 = key1Ops.find(op => op.operation_name === operationName)
      const op2 = key2Ops.find(op => op.operation_name === operationName)

      if (op1?.error || op2?.error) {
        newStatus[operationName] = "failure"
        return
      }

      if (op1 && op2) {
        // Both sides have the operation - compare results
        const isEqual = JSON.stringify(op1.result) === JSON.stringify(op2.result)
        newStatus[operationName] = isEqual ? "success" : "failure"
      } else if (op1) {
        // Only left side has operation - compare with initial value
        const initialValue = key2Results?.[0]?.result
        const isEqual = JSON.stringify(op1.result) === JSON.stringify(initialValue)
        newStatus[operationName] = isEqual ? "success" : "failure"
      } else if (op2) {
        // Only right side has operation - compare with initial value
        const initialValue = key1Results[0]?.result
        const isEqual = JSON.stringify(op2.result) === JSON.stringify(initialValue)
        newStatus[operationName] = isEqual ? "success" : "failure"
      }
    })

    setValidationStatus(newStatus)
  }

  const canValidate = key1Results && key1Results.length > 0

  return (
    <div className="h-full flex flex-col p-2 min-h-0 border border-gray-300 rounded-lg">
      <CardHeader className="p-2 flex flex-row items-center justify-between flex-shrink-0">
        <CardTitle className="text-base">Sample Output</CardTitle>
      </CardHeader>
      <CardContent className="p-2 flex-grow min-h-0">
        <ScrollArea className="h-full">
          {expectedValueType === "constant_value" ? (
            <div className="text-center text-sm text-muted-foreground h-full flex items-center justify-center">
              No Sample output screen for expected value type <b>Constant value</b>.
            </div>
          ) : !key1Results && !key2Results ? (
            <div className="text-center text-sm text-muted-foreground h-full flex items-center justify-center">
              Click "Execute" to see results.
            </div>
          ) : (
            <div className="flex gap-4 pr-4">
              {key1Results && key1Results.length > 0 && (
                <ResultTable title={ruleTitle1} steps={key1Results} validationStatus={validationStatus} />
              )}
              {key2Results && key2Results.length > 0 && (
                <ResultTable title={ruleTitle2} steps={key2Results} validationStatus={validationStatus} />
              )}
              {(!key1Results || key1Results.length === 0) && (!key2Results || key2Results.length === 0) && (
                <div className="text-center text-sm text-muted-foreground h-full flex items-center justify-center">
                  No results to display. Try executing operations first.
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      {expectedValueType !== "constant_value" && (
        <CardFooter className="p-2 pt-2 flex justify-end flex-shrink-0">
          <Button onClick={handleValidate} size="sm" disabled={!canValidate}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Validate
          </Button>
        </CardFooter>
      )}
    </div>
  )
}
