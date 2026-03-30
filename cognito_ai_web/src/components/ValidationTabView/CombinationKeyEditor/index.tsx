// import React, { useEffect, useState } from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
// import { Button } from '../ui/button';
// import { FieldValidationConfig, CombinationKeyPart, TableData, FieldData } from '../types/validation';
// import { PlusCircle, Trash2 } from 'lucide-react';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
// import { Input } from '../ui/input';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

// interface CombinationKeyEditorProps {
//   config: Partial<FieldValidationConfig>;
//   setConfig: React.Dispatch<React.SetStateAction<Partial<FieldValidationConfig>>>;
//   tableData: TableData[];
// }

// export const CombinationKeyEditor: React.FC<CombinationKeyEditorProps> = ({ config, setConfig, tableData }) => {
//   const [keyParts, setKeyParts] = useState<CombinationKeyPart[]>(config.combinationKey || []);
//   const tableNames = (tableData || []).map(t => t.TableName);

//   useEffect(() => {
//     setConfig(prev => ({ ...prev, combinationKey: keyParts }));
//   }, [keyParts, setConfig]);

//   const getFieldsForTable = (tableName: string) => {
//     if (!tableName || !tableData) return [];
//     const table = tableData.find(t => t.TableName === tableName);
//     return table ? table.Fields.map((f: FieldData) => f.FieldName) : [];
//   };

//   const handleAddPart = () => { 
//     const newPart: CombinationKeyPart = { 
//       id: crypto.randomUUID(), type: 'fixed', value: '', tableName: '', fieldName: '',
//       offset: 0, length: 0, identifier: `Row ${keyParts.length + 1}`,
//     };
//     setKeyParts([...keyParts, newPart]);
//   };

//   const handleUpdatePart = (id: string, updates: Partial<CombinationKeyPart>) => { 
//     setKeyParts(keyParts.map(p => (p.id === id ? { ...p, ...updates } : p)));
//   };

//   const handleRemovePart = (id: string) => { 
//     setKeyParts(keyParts.filter(p => p.id !== id));
//   };

//   return ( 
//     <Card className="p-2 gap-2 border-none shadow-none">
//       <CardHeader className="p-2 gap-2">
//         <CardTitle>Combination Key Builder</CardTitle>
//         <CardDescription>Add and arrange parts to build the key. Each part can be a fixed value or a dynamic value from a table field.</CardDescription>
//       </CardHeader>
//       <CardContent className="p-2 gap-2">
//         <div className="border rounded-lg overflow-hidden">
//           <Table>
//             <TableHeader>
//               <TableRow className="bg-slate-50">
//                 <TableHead className="w-[200px]">Type</TableHead>
//                 <TableHead>Value</TableHead>
//                 <TableHead className="w-[100px]">Offset</TableHead>
//                 <TableHead className="w-[100px]">Length</TableHead>
//                 <TableHead>Identifier</TableHead>
//                 <TableHead className="w-[50px]"> </TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {keyParts.map((part) => (
//                 <TableRow key={part.id}>
//                   <TableCell>
//                     <Select value={part.type} onValueChange={(v: 'fixed' | 'field') => handleUpdatePart(part.id, { type: v })}>
//                       <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="fixed">Fixed Value</SelectItem>
//                         <SelectItem value="field">Table Field</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </TableCell>
//                   <TableCell>
//                     {part.type === 'fixed' ? (
//                       <Input placeholder="Enter fixed value" value={part.value} onChange={(e) => handleUpdatePart(part.id, { value: e.target.value })} />
//                     ) : (
//                       <div className="flex gap-2">
//                         <Select value={part.tableName} onValueChange={(v) => handleUpdatePart(part.id, { tableName: v, fieldName: '' })}>
//                           <SelectTrigger className="w-full"><SelectValue placeholder="Table..." /></SelectTrigger>
//                           <SelectContent>{tableNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
//                         </Select>
//                         <Select value={part.fieldName} onValueChange={(v) => handleUpdatePart(part.id, { fieldName: v })} disabled={!part.tableName}>
//                           <SelectTrigger className="w-full"><SelectValue placeholder="Field..." /></SelectTrigger>
//                           <SelectContent>{getFieldsForTable(part.tableName).map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
//                         </Select>
//                       </div>
//                     )}
//                   </TableCell>
//                   <TableCell><Input type="number" value={part.offset} onChange={(e) => handleUpdatePart(part.id, { offset: parseInt(e.target.value, 10) || 0 })} /></TableCell>
//                   <TableCell><Input type="number" value={part.length} onChange={(e) => handleUpdatePart(part.id, { length: parseInt(e.target.value, 10) || 0 })} /></TableCell>
//                   <TableCell><Input placeholder="e.g., First Row" value={part.identifier} onChange={(e) => handleUpdatePart(part.id, { identifier: e.target.value })} /></TableCell>
//                   <TableCell><Button variant="ghost" size="icon" onClick={() => handleRemovePart(part.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </div>
//         <Button variant="outline" onClick={handleAddPart} className="mt-4 w-full border-dashed"><PlusCircle className="mr-2 h-4 w-4" /> Add Key Part</Button>
//       </CardContent>
//     </Card>
//   );
// };
// import React, { useEffect, useState, useCallback } from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
// import { Button } from '../ui/button';
// import { FieldValidationConfig, CombinationKeyPart, TableData, FieldData } from '../types/validation';
// import { PlusCircle, Trash2 } from 'lucide-react';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
// import { Input } from '../ui/input';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

// interface CombinationKeyEditorProps {
//   config: Partial<FieldValidationConfig>;
//   setConfig: React.Dispatch<React.SetStateAction<Partial<FieldValidationConfig>>>;
//   tableData: TableData[];
// }

// export const CombinationKeyEditor: React.FC<CombinationKeyEditorProps> = ({ config, setConfig, tableData }) => {
//   const [keyParts, setKeyParts] = useState<CombinationKeyPart[]>(config.combinationKey || []);
//   const tableNames = (tableData || []).map(t => t.TableName);

//   // Use useCallback to memoize the setConfig function reference
//   const updateConfig = useCallback((newKeyParts: CombinationKeyPart[]) => {
//     setConfig(prev => ({ ...prev, combinationKey: newKeyParts }));
//   }, [setConfig]);

//   // Only update parent config when keyParts actually changes
//   useEffect(() => {
//     // Add a check to prevent unnecessary updates
//     const currentConfigKeyParts = config.combinationKey || [];
//     if (JSON.stringify(currentConfigKeyParts) !== JSON.stringify(keyParts)) {
//       updateConfig(keyParts);
//     }
//   }, [keyParts, updateConfig, config.combinationKey]);

//   const getFieldsForTable = (tableName: string) => {
//     if (!tableName || !tableData) return [];
//     const table = tableData.find(t => t.TableName === tableName);
//     return table ? table.Fields.map((f: FieldData) => f.FieldName) : [];
//   };

//   const handleAddPart = () => { 
//     const newPart: CombinationKeyPart = { 
//       id: crypto.randomUUID(), 
//       type: 'fixed', 
//       value: '', 
//       tableName: '', 
//       fieldName: '',
//       offset: 0, 
//       length: 0, 
//     };
//     const newKeyParts = [...keyParts, newPart];
//     setKeyParts(newKeyParts);
//   };

//   const handleUpdatePart = (id: string, updates: Partial<CombinationKeyPart>) => { 
//     const newKeyParts = keyParts.map(p => (p.id === id ? { ...p, ...updates } : p));
//     setKeyParts(newKeyParts);
//   };

//   const handleRemovePart = (id: string) => { 
//     const newKeyParts = keyParts.filter(p => p.id !== id);
//     setKeyParts(newKeyParts);
//   };

//   return ( 
//     <Card className="p-2 gap-2 border-none shadow-none">
//       <CardHeader className="p-2 gap-2">
//         <CardTitle>Combination Key Builder</CardTitle>
//         <CardDescription>Add and arrange parts to build the key. Each part can be a fixed value or a dynamic value from a table field.</CardDescription>
//       </CardHeader>
//       <CardContent className="p-2 gap-2">
//         <div className="border rounded-lg overflow-hidden">
//           <Table>
//             <TableHeader>
//               <TableRow className="bg-slate-50">
//                 <TableHead className="w-[200px]">Type</TableHead>
//                 <TableHead>Value</TableHead>
//                 <TableHead className="w-[100px]">Offset</TableHead>
//                 <TableHead className="w-[100px]">Length</TableHead>
//                 <TableHead className="w-[50px]"> </TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {keyParts.map((part) => (
//                 <TableRow key={part.id}>
//                   <TableCell>
//                     <Select value={part.type} onValueChange={(v: 'fixed' | 'field') => handleUpdatePart(part.id, { type: v })}>
//                       <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="fixed">Fixed Value</SelectItem>
//                         <SelectItem value="field">Table Field</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </TableCell>
//                   <TableCell>
//                     {part.type === 'fixed' ? (
//                       <Input placeholder="Enter fixed value" value={part.value} onChange={(e) => handleUpdatePart(part.id, { value: e.target.value })} />
//                     ) : (
//                       <div className="flex gap-2">
//                         <Select value={part.tableName} onValueChange={(v) => handleUpdatePart(part.id, { tableName: v, fieldName: '' })}>
//                           <SelectTrigger className="w-full"><SelectValue placeholder="Table..." /></SelectTrigger>
//                           <SelectContent>{tableNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
//                         </Select>
//                         <Select value={part.fieldName} onValueChange={(v) => handleUpdatePart(part.id, { fieldName: v })} disabled={!part.tableName}>
//                           <SelectTrigger className="w-full"><SelectValue placeholder="Field..." /></SelectTrigger>
//                           <SelectContent>{getFieldsForTable(part.tableName).map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
//                         </Select>
//                       </div>
//                     )}
//                   </TableCell>
//                   <TableCell><Input type="number" value={part.offset} onChange={(e) => handleUpdatePart(part.id, { offset: parseInt(e.target.value, 10) || 0 })} /></TableCell>
//                   <TableCell><Input type="number" value={part.length} onChange={(e) => handleUpdatePart(part.id, { length: parseInt(e.target.value, 10) || 0 })} /></TableCell>
//                   <TableCell><Button variant="ghost" size="icon" onClick={() => handleRemovePart(part.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </div>
//         <Button variant="outline" onClick={handleAddPart} className="mt-4 w-full border-dashed"><PlusCircle className="mr-2 h-4 w-4" /> Add Key Part</Button>
//       </CardContent>
//     </Card>
//   );
// };

"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import type { FieldValidationConfig, CombinationKeyPart, TableData, FieldData } from "../types"
import { PlusCircle, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Input } from "../ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"

interface CombinationKeyEditorProps {
  config: Partial<FieldValidationConfig>
  setConfig: React.Dispatch<React.SetStateAction<Partial<FieldValidationConfig>>>
  tableData: TableData[]
}

export const CombinationKeyEditor: React.FC<CombinationKeyEditorProps> = ({ config, setConfig, tableData }) => {
  const [keyParts, setKeyParts] = useState<CombinationKeyPart[]>(config.combinationKey || [])
  const tableNames = (tableData || []).map((t) => t.TableName)

  // Use useCallback to memoize the setConfig function reference
  const updateConfig = useCallback(
    (newKeyParts: CombinationKeyPart[]) => {
      setConfig((prev) => ({ ...prev, combinationKey: newKeyParts }))
    },
    [setConfig],
  )

  // Only update parent config when keyParts actually changes
  useEffect(() => {
    // Add a check to prevent unnecessary updates
    const currentConfigKeyParts = config.combinationKey || []
    if (JSON.stringify(currentConfigKeyParts) !== JSON.stringify(keyParts)) {
      updateConfig(keyParts)
    }
  }, [keyParts, updateConfig, config.combinationKey])

  const getFieldsForTable = (tableName: string) => {
    if (!tableName || !tableData) return []
    const table = tableData.find((t) => t.TableName === tableName)
    return table ? table.Fields.map((f: FieldData) => f.FieldName) : []
  }

  const handleAddPart = () => {
    const newPart: CombinationKeyPart = {
      id: crypto.randomUUID(),
      type: "fixed",
      value: "",
      tableName: "",
      fieldName: "",
      offset: 0,
      length: 0,
    }
    const newKeyParts = [...keyParts, newPart]
    setKeyParts(newKeyParts)
  }

  const handleUpdatePart = (id: string, updates: Partial<CombinationKeyPart>) => {
    const newKeyParts = keyParts.map((p) => (p.id === id ? { ...p, ...updates } : p))
    setKeyParts(newKeyParts)
  }

  const handleRemovePart = (id: string) => {
    const newKeyParts = keyParts.filter((p) => p.id !== id)
    setKeyParts(newKeyParts)
  }

  return (
    <Card className="p-2 gap-2 border-none shadow-none">
    
      <CardContent className="p-2 gap-2">
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-[200px]">Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="w-[100px]">Offset</TableHead>
                <TableHead className="w-[100px]">Length</TableHead>
                <TableHead className="w-[50px]"> </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keyParts.map((part) => (
                <TableRow key={part.id}>
                  <TableCell>
                    <Select
                      value={part.type}
                      onValueChange={(v: "fixed" | "field") => handleUpdatePart(part.id, { type: v })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Value</SelectItem>
                        <SelectItem value="field">Table Field</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {part.type === "fixed" ? (
                      <Input
                        placeholder="Enter fixed value"
                        value={part.value}
                        onChange={(e) => handleUpdatePart(part.id, { value: e.target.value })}
                      />
                    ) : (
                      <div className="flex gap-2">
                        <Select
                          value={part.tableName}
                          onValueChange={(v) => handleUpdatePart(part.id, { tableName: v, fieldName: "" })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Table..." />
                          </SelectTrigger>
                          <SelectContent>
                            {tableNames.map((name) => (
                              <SelectItem key={name} value={name}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={part.fieldName}
                          onValueChange={(v) => handleUpdatePart(part.id, { fieldName: v })}
                          disabled={!part.tableName}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Field..." />
                          </SelectTrigger>
                          <SelectContent>
                            {getFieldsForTable(part.tableName).map((name) => (
                              <SelectItem key={name} value={name}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={part.offset}
                      onChange={(e) => handleUpdatePart(part.id, { offset: Number.parseInt(e.target.value, 10) || 0 })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={part.length}
                      onChange={(e) => handleUpdatePart(part.id, { length: Number.parseInt(e.target.value, 10) || 0 })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleRemovePart(part.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Button variant="outline" onClick={handleAddPart} className="mt-4 w-full border-dashed bg-transparent">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Key Part
        </Button>
      </CardContent>
    </Card>
  )
}
