import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { FieldData, FieldValidationConfig, FromSourceConfig, FixedValueConfig, CombinationKeyPart, FieldRule } from '../types/validation';
import { ArrowLeft, Minus, MinusCircle, Plus, PlusCircle, Search, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Checkbox } from '../ui/checkbox';
import { DialogClose } from '@radix-ui/react-dialog';

interface ConfigurationScreenProps {
  field: FieldRule;
  initialConfig?: Partial<FieldValidationConfig>;
  tableData: any[];
  onSave: (id: string, updates: Partial<FieldValidationConfig>) => void;
  onClose: () => void;
}

type Range = { id: string; from: string; to: string; };

const RangeListDialog: React.FC<{
  children: React.ReactNode;
  initialRanges?: Range[];
  initialLists?: string[];
  onSave: (data: { ranges: Range[]; lists: string[] }) => void;
}> = ({ children, initialRanges = [], initialLists = [], onSave }) => {
  const [open, setOpen] = useState(false);
  const [ranges, setRanges] = useState<Range[]>([]);
  const [lists, setLists] = useState<string[]>([]);
  const [listItemInput, setListItemInput] = useState('');

  const addRange = (index: number) => {
    const newRanges = [...ranges];
    newRanges.splice(index + 1, 0, { id: crypto.randomUUID(), from: '', to: '' });
    setRanges(newRanges);
  };
  const removeRange = (id: string) => {
    if (ranges.length > 1) {
      setRanges(ranges.filter(r => r.id !== id));
    } else {
      setRanges([{ id: crypto.randomUUID(), from: '', to: '' }]);
    }
  };
  const updateRange = (id: string, field: 'from' | 'to', value: string) => {
    setRanges(ranges.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addListItem = () => {
    if (listItemInput.trim() && !lists.includes(listItemInput.trim())) {
      setLists([...lists, listItemInput.trim()]);
      setListItemInput('');
    }
  };
  const removeListItem = (itemToRemove: string) => {
    setLists(lists.filter(item => item !== itemToRemove));
  };

  const handleDialogSave = () => {
    const validRanges = ranges.filter(r => r.from.trim() !== '' || r.to.trim() !== '');
    onSave({ ranges: validRanges, lists });
    setOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setRanges(initialRanges.length > 0 ? [...initialRanges] : [{ id: crypto.randomUUID(), from: '', to: '' }]);
      setLists(initialLists ? [...initialLists] : []);
      setListItemInput('');
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure Fixed Values</DialogTitle>
          <DialogDescription>Add ranges or specific values to include.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="range" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="range">Range</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
          <TabsContent value="range" className="pt-4">
            <div className="space-y-3">
              <Label>Define one or more ranges</Label>
              {ranges.map((range, index) => (
                <div key={range.id} className="flex items-center gap-2">
                  <Input placeholder="From" value={range.from} onChange={e => updateRange(range.id, 'from', e.target.value)} />
                  <Minus className="h-4 w-4 text-muted-foreground" />
                  <Input placeholder="To" value={range.to} onChange={e => updateRange(range.id, 'to', e.target.value)} />
                  <Button variant="ghost" size="icon" onClick={() => addRange(index)}><PlusCircle className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => removeRange(range.id)}><MinusCircle className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="list" className="pt-4">
            <div className="space-y-4">
              <Label>Define a list of values</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={listItemInput}
                  onChange={e => setListItemInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addListItem(); } }}
                  placeholder="Add value to the list..." />
                <Button onClick={addListItem} type="button">Add</Button>
              </div>
              {lists.length > 0 && (
                <ScrollArea className="h-40 border rounded-md p-2">
                  <div className="flex flex-wrap gap-2">
                    {lists.map(item => (
                      <Badge key={item} variant="secondary" className="flex items-center gap-1.5">
                        {item}
                        <button onClick={() => removeListItem(item)} className="rounded-full hover:bg-destructive/20 p-0.5">
                          <MinusCircle className="h-3.5 w-3.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleDialogSave}>Save Values</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const FixedValueCompactEditor: React.FC<{
  config: Partial<FieldValidationConfig>;
  setConfig: React.Dispatch<React.SetStateAction<Partial<FieldValidationConfig>>>;
  tableNames: string[];
}> = ({ config, setConfig, tableNames }) => {
  type Row = {
    id: string;
    includeSingle: string;
    includeRanges: Range[];
    includeLists: string[];
    excludeSingle: string;
    excludeRanges: Range[];
    excludeLists: string[];
  };

  const initialRules = config.fromSourceConfig?.rules as FixedValueConfig | undefined;

  const seedRows = useMemo<Row[]>(() => {
    const row: Row = {
      id: crypto.randomUUID(),
      includeSingle: initialRules?.includeSingle?.[0]?.value || '',
      includeRanges: initialRules?.includeRange?.map(r => ({ ...r, id: r.id || crypto.randomUUID() })) || [],
      includeLists: [],
      excludeSingle: initialRules?.excludeSingle?.[0]?.value || '',
      excludeRanges: initialRules?.excludeRange?.map(r => ({ ...r, id: r.id || crypto.randomUUID() })) || [],
      excludeLists: [],
    };
    return [row];
  }, [initialRules]);

  const [rows, setRows] = useState<Row[]>(seedRows);
  const [selectedMaster, setSelectedMaster] = useState<string>(config.fromSourceConfig?.sourceTable || (tableNames[0] || ''));
  const [masterDataList] = useState(['Sales Org', 'Company Code', 'Plant']);

  useEffect(() => {
    const toRules: FixedValueConfig = {
      includeSingle: rows.map(r => r.includeSingle).filter(Boolean).map(v => ({ id: crypto.randomUUID(), value: v })),
      includeRange: rows.flatMap(r => r.includeRanges).map(({ from, to }) => ({ id: crypto.randomUUID(), from, to })),
      excludeSingle: rows.map(r => r.excludeSingle).filter(Boolean).map(v => ({ id: crypto.randomUUID(), value: v })),
      excludeRange: rows.flatMap(r => r.excludeRanges).map(({ from, to }) => ({ id: crypto.randomUUID(), from, to })),
    };
    setConfig(prev => ({
      ...prev,
      fromSourceConfig: {
        ...(prev.fromSourceConfig || {}),
        sourceType: 'master-data-table',
        sourceTable: selectedMaster,
        rules: toRules,
      } as FromSourceConfig
    }));
  }, [rows, selectedMaster, setConfig]);

  const updateRow = (id: string, updates: Partial<Row>) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...updates } : r)));
  };
  
  const formatDisplay = (ranges: Range[], lists: string[]) => {
    if (ranges.length === 0 && lists.length === 0) {
      return <span className="text-xs text-muted-foreground">Not set</span>;
    }
    return (
      <div className="flex flex-wrap gap-1">
        {ranges.map(r => <Badge key={r.id} variant="secondary">{r.from}-{r.to}</Badge>)}
        {lists.map(l => <Badge key={l} variant="outline">{l}</Badge>)}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end">
        <div className="min-w-[220px]">
          <Label className="text-xs">Master Data</Label>
          <Select value={selectedMaster} onValueChange={setSelectedMaster}>
            <SelectTrigger className="h-8 w-[14rem]"><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>{masterDataList.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Single Value (Include)</TableHead>
              <TableHead>Range / List (Include)</TableHead>
              <TableHead>Exclude Value</TableHead>
              <TableHead>Exclude Range / List</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className='w-[220px]'>
                  <Input className="h-8" placeholder="type value..." value={r.includeSingle} onChange={(e) => updateRow(r.id, { includeSingle: e.target.value })} />
                </TableCell>
                <TableCell className='w-[280px]'>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-grow">{formatDisplay(r.includeRanges, r.includeLists)}</div>
                    <RangeListDialog 
                      initialRanges={r.includeRanges}
                      initialLists={r.includeLists}
                      onSave={({ ranges, lists }) => updateRow(r.id, { includeRanges: ranges, includeLists: lists })}
                    >
                      <Button variant="outline" size="icon"><Plus className="h-4 w-4" /></Button>
                    </RangeListDialog>
                  </div>
                </TableCell>
                <TableCell className='w-[220px]'>
                  <Input className="h-8" placeholder="type value..." value={r.excludeSingle} onChange={(e) => updateRow(r.id, { excludeSingle: e.target.value })} />
                </TableCell>
                <TableCell className='w-[280px]'>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-grow">{formatDisplay(r.excludeRanges, r.excludeLists)}</div>
                    <RangeListDialog
                      initialRanges={r.excludeRanges}
                      initialLists={r.excludeLists}
                      onSave={({ ranges, lists }) => updateRow(r.id, { excludeRanges: ranges, excludeLists: lists })}
                    >
                      <Button variant="outline" size="icon"><Plus className="h-4 w-4" /></Button>
                    </RangeListDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

type NewGlobalKey = {
  id: string;
  key: string;
  value: string;
  ranges: Range[];
  lists: string[];
}

const ConfigurationScreen: React.FC<ConfigurationScreenProps> = ({ field, initialConfig, tableData, onSave, onClose }) => {
  const itemToConfigure = useMemo(() => {
    return {
      id: field.unique_id,
      source: { id: field.unique_id, name: `${field.TableName}.${field.FieldName}` },
    };
  }, [field]);

  const [activeTab, setActiveTab] = useState(initialConfig?.sourceType || 'table_field');
  const [config, setConfig] = useState<Partial<FieldValidationConfig>>({});
  
  const [sapValidationMaster, setSapValidationMaster] = useState(false);
  const [masterDataList] = useState(['Sales Org', 'Company Code', 'Plant']);
  const [selectedMasterData, setSelectedMasterData] = useState('');
  const [globalKeySearchTerm, setGlobalKeySearchTerm] = useState('');
  const [newGlobalKeys, setNewGlobalKeys] = useState<NewGlobalKey[]>([]);

  const [validationKeys, setValidationKeys] = useState([
    { id: '01', label: 'Sales Document' }, { id: '02', label: 'Sales Document' },
    { id: '03', label: 'Doc. Condition' }, { id: '04', label: 'Customer Master' },
    { id: '05', label: 'Vendor Master' }, { id: '06', label: 'Material Master' },
  ]);
  const [newValidationKey, setNewValidationKey] = useState({ id: '', label: '' });
  const [validationKeySearchTerm, setValidationKeySearchTerm] = useState('');

  const tableNames = useMemo(() => tableData.map(t => t.table_name), [tableData]);

  useEffect(() => {
    const newConfig: Partial<FieldValidationConfig> = {
      id: field.unique_id,
      sourceType: initialConfig?.sourceType || 'table_field',
      globalKey: initialConfig?.globalKey,
      validationKey: initialConfig?.validationKey,
      combinationKey: initialConfig?.combinationKey?.map(p => ({ ...p, identifier: p.identifier || '' })) || [],
      fromSourceConfig: {
        sourceType: initialConfig?.fromSourceConfig?.sourceType || 'master-data-table',
        sourceTable: initialConfig?.fromSourceConfig?.sourceTable,
        sourceField: initialConfig?.fromSourceConfig?.sourceField,
        rules: {
          includeSingle: initialConfig?.fromSourceConfig?.rules?.includeSingle || [],
          excludeSingle: initialConfig?.fromSourceConfig?.rules?.excludeSingle || [],
          includeRange: initialConfig?.fromSourceConfig?.rules?.includeRange || [],
          excludeRange: initialConfig?.fromSourceConfig?.rules?.excludeRange || [],
        }
      },
      sourceTable: initialConfig?.sourceTable,
      sourceField: initialConfig?.sourceField,
      sourceOffset: initialConfig?.sourceOffset,
      sourceLength: initialConfig?.sourceLength,
    };
    setConfig(newConfig);
    setActiveTab(newConfig.sourceType!);
  }, [initialConfig, field]);

  const handleSave = () => {
    onSave(itemToConfigure.id, { ...config, sourceType: activeTab });
  };

  const getFieldsForTable = (tableName: string) => {
    if (!tableName) return [];
    const table = tableData.find(t => t.table_name === tableName);
    return table ? table.Fields.map((f: any) => f.field_name) : [];
  };

  const renderTableFieldTab = () => (
    <div className="space-y-1 max-w-xl">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Table Name</Label>
          <Select value={config.sourceTable} onValueChange={(v) => setConfig({ ...config, sourceTable: v, sourceField: '' })}>
            <SelectTrigger className='w-full'><SelectValue placeholder="Select table..." /></SelectTrigger>
            <SelectContent className='w-full'>{tableNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Field Name</Label>
          <Select value={config.sourceField} onValueChange={(v) => setConfig({ ...config, sourceField: v })} disabled={!config.sourceTable}>
            <SelectTrigger className='w-full'><SelectValue placeholder="Select field..." /></SelectTrigger>
            <SelectContent className='w-full'>{getFieldsForTable(config.sourceTable || '').map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
  
  const renderGlobalKeyTab = () => {
    const mockData: Record<string, { key: string; value: string; }[]> = {
      'Sales Org': [ { key: 'SO01', value: 'Sales Org US' }, { key: 'SO02', value: 'Sales Org EU' }, { key: 'SO03', value: 'Sales Org APJ' }, ],
      'Company Code': [ { key: '1000', value: 'IDES AG' }, { key: '2000', value: 'IDES UK' }, { key: '3000', value: 'IDES US' }, ],
      'Plant': [ { key: '1000', value: 'Plant Hamburg' }, { key: '1100', value: 'Plant Berlin' }, { key: '1200', value: 'Plant Dresden' }, ],
    };
    const tableDataForMasterData = selectedMasterData ? (mockData[selectedMasterData] || []) : [];
    const filteredData = tableDataForMasterData.filter(
      item => item.key.toLowerCase().includes(globalKeySearchTerm.toLowerCase()) ||
      item.value.toLowerCase().includes(globalKeySearchTerm.toLowerCase())
    );
    const handleSelectKey = (key: string) => {
      setConfig({ ...config, globalKey: config.globalKey === key ? '' : key });
    };
    const addNewGlobalKeyRow = () => {
      setNewGlobalKeys(prev => [...prev, { id: crypto.randomUUID(), key: '', value: '', ranges: [], lists: [] }]);
    };
    const removeNewGlobalKeyRow = (id: string) => {
      setNewGlobalKeys(prev => prev.filter(k => k.id !== id));
    };
    const updateNewGlobalKey = (id: string, field: keyof NewGlobalKey, value: any) => {
      setNewGlobalKeys(prev => prev.map(k => k.id === id ? { ...k, [field]: value } : k));
    };

    return (
      <Card className="p-0">
        <CardContent className="p-1 space-y-4">
          <div>
            <div className="flex items-center justify-between p-1 gap-4">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search existing keys..." value={globalKeySearchTerm} onChange={(e) => setGlobalKeySearchTerm(e.target.value)} className="pl-8 h-9" />
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Checkbox id="sap-validation-master" checked={sapValidationMaster} onCheckedChange={(checked) => setSapValidationMaster(Boolean(checked))} />
                <Label htmlFor="sap-validation-master" className="text-sm font-medium whitespace-nowrap">SAP Validation Master</Label>
                <Select onValueChange={setSelectedMasterData} value={selectedMasterData}>
                  <SelectTrigger className="w-[220px] h-9 flex-shrink-0"><SelectValue placeholder="Select Master Data List" /></SelectTrigger>
                  <SelectContent>{masterDataList.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="p-1 mt-2">
              <ScrollArea className="h-60 border rounded-md">
                <Table>
                  <TableHeader><TableRow><TableHead>Key</TableHead><TableHead>Value</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredData.length > 0 ? filteredData.map(item => (
                      <TableRow key={item.key} onClick={() => handleSelectKey(item.key)} className={cn("cursor-pointer", config.globalKey === item.key && "bg-blue-100 hover:bg-blue-200")}>
                        <TableCell>{item.key}</TableCell><TableCell>{item.value}</TableCell>
                      </TableRow>
                    )) : (<TableRow><TableCell colSpan={2} className="text-center h-24">{selectedMasterData ? 'No results found.' : 'Select a master data list.'}</TableCell></TableRow>)}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>
          <Separator />
          <div className="px-1">
            <div className='flex items-center justify-between mb-2'>
              <h3 className="text-base font-semibold">Add New Global Keys</h3>
              <Button variant="outline" size="sm" onClick={addNewGlobalKeyRow}><PlusCircle className="mr-2 h-4 w-4" /> Add Key</Button>
            </div>
            <div className="border rounded-md">
              <Table>
                <TableHeader><TableRow><TableHead>Key</TableHead><TableHead>Value</TableHead><TableHead className="w-[80px]">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {newGlobalKeys.length === 0 && ( 
                    <TableRow><TableCell colSpan={4} className='text-center text-muted-foreground h-24'>Click "Add Key" to start.</TableCell></TableRow>
                  )}
                  {newGlobalKeys.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell><Input value={row.key} onChange={(e) => updateNewGlobalKey(row.id, 'key', e.target.value)} placeholder="New Key"/></TableCell>
                      <TableCell><Input value={row.value} onChange={(e) => updateNewGlobalKey(row.id, 'value', e.target.value)} placeholder="New Value"/></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeNewGlobalKeyRow(row.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="flex justify-end space-x-2 p-1 pt-4">
            <Button variant="outline" size="sm">Sync to Master</Button>
            <Button size="sm" onClick={() => console.log("Saving new keys:", newGlobalKeys)}>Save New Keys</Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCombinationKeyTab = () => { 
    const keyParts = config.combinationKey || [];
    const setKeyParts = (parts: CombinationKeyPart[]) => setConfig({ ...config, combinationKey: parts });
    const handleAddPart = () => { 
      const newPart: CombinationKeyPart = { 
        id: crypto.randomUUID(), type: 'fixed', value: '', tableName: '', fieldName: '',
        offset: 0, length: 0, identifier: `Row ${keyParts.length + 1}`,
      };
      setKeyParts([...keyParts, newPart]);
    };
    const handleUpdatePart = (id: string, updates: Partial<CombinationKeyPart>) => { 
      setKeyParts(keyParts.map(p => (p.id === id ? { ...p, ...updates } : p)));
    };
    const handleRemovePart = (id: string) => { 
      setKeyParts(keyParts.filter(p => p.id !== id));
    };

    return ( 
      <Card className="p-2 gap-2">
        <CardHeader className="p-2 gap-2">
          <CardTitle>Combination Key Builder</CardTitle>
          <CardDescription>Add and arrange parts to build the key. Each part can be a fixed value or a dynamic value from a table field.</CardDescription>
        </CardHeader>
        <CardContent className="p-2 gap-2">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-[200px]">Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="w-[100px]">Offset</TableHead>
                  <TableHead className="w-[100px]">Length</TableHead>
                  <TableHead>Identifier</TableHead>
                  <TableHead className="w-[50px]"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keyParts.map((part) => (
                  <TableRow key={part.id}>
                    <TableCell>
                      <Select value={part.type} onValueChange={(v: 'fixed' | 'field') => handleUpdatePart(part.id, { type: v })}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed Value</SelectItem>
                          <SelectItem value="field">Table Field</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {part.type === 'fixed' ? (
                        <Input placeholder="Enter fixed value" value={part.value} onChange={(e) => handleUpdatePart(part.id, { value: e.target.value })} />
                      ) : (
                        <div className="flex gap-2">
                          <Select value={part.tableName} onValueChange={(v) => handleUpdatePart(part.id, { tableName: v, fieldName: '' })}>
                            <SelectTrigger className="w-full"><SelectValue placeholder="Table..." /></SelectTrigger>
                            <SelectContent>{tableNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
                          </Select>
                          <Select value={part.fieldName} onValueChange={(v) => handleUpdatePart(part.id, { fieldName: v })} disabled={!part.tableName}>
                            <SelectTrigger className="w-full"><SelectValue placeholder="Field..." /></SelectTrigger>
                            <SelectContent>{getFieldsForTable(part.tableName).map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      )}
                    </TableCell>
                    <TableCell><Input type="number" value={part.offset} onChange={(e) => handleUpdatePart(part.id, { offset: parseInt(e.target.value, 10) || 0 })} /></TableCell>
                    <TableCell><Input type="number" value={part.length} onChange={(e) => handleUpdatePart(part.id, { length: parseInt(e.target.value, 10) || 0 })} /></TableCell>
                    <TableCell><Input placeholder="e.g., First Row" value={part.identifier} onChange={(e) => handleUpdatePart(part.id, { identifier: e.target.value })} /></TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => handleRemovePart(part.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button variant="outline" onClick={handleAddPart} className="mt-4 w-full border-dashed"><PlusCircle className="mr-2 h-4 w-4" /> Add Key Part</Button>
        </CardContent>
      </Card>
    );
  };

  const renderFixedValueTab = () => <FixedValueCompactEditor config={config} setConfig={setConfig} tableNames={tableNames} />;
  
  const renderValidationKeyTab = () => {
    const filteredKeys = validationKeys.filter(key =>
      key.label.toLowerCase().includes(validationKeySearchTerm.toLowerCase()) ||
      key.id.toLowerCase().includes(validationKeySearchTerm.toLowerCase())
    );
    const selectedKey = config.validationKey;
    const handleSelectKey = (keyId: string) => {
      setConfig({ ...config, validationKey: keyId });
    };
    const handleAddKey = () => {
      if (newValidationKey.id && newValidationKey.label) {
        setValidationKeys(prev => [...prev, newValidationKey]);
        setNewValidationKey({ id: '', label: '' });
      }
    };

    return (
      <div className="space-y-3">
        <Card className='gap-2'>
          <CardHeader><CardTitle>Add New Validation Key</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Key ID (e.g., 07)" value={newValidationKey.id} onChange={(e) => setNewValidationKey({ ...newValidationKey, id: e.target.value })} />
            <Input placeholder="Key Label" value={newValidationKey.label} onChange={(e) => setNewValidationKey({ ...newValidationKey, label: e.target.value })} className="md:col-span-2" />
          </CardContent>
          <CardFooter><Button onClick={handleAddKey}><PlusCircle className="mr-2 h-4 w-4" /> Add Key</Button></CardFooter>
        </Card>
        <Card className='gap-2'>
          <CardHeader>
            <CardTitle>Available Validation Keys</CardTitle>
            <div className="flex items-center justify-between pt-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by key or label..." value={validationKeySearchTerm} onChange={(e) => setValidationKeySearchTerm(e.target.value)} className="pl-8" />
              </div>
              <Button variant="link" onClick={() => handleSelectKey('')} disabled={!selectedKey}>Clear Selection</Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <Table>
                <TableHeader><TableRow><TableHead className="w-[100px]">Key</TableHead><TableHead>Label</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredKeys.map((key) => (
                    <TableRow key={key.id} onClick={() => handleSelectKey(key.id)} className={cn("cursor-pointer", selectedKey === key.id && "bg-blue-100 hover:bg-blue-200")}>
                      <TableCell className="font-medium">{key.id}</TableCell><TableCell>{key.label}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredKeys.length === 0 && <div className="text-center p-8 text-muted-foreground">No keys found for "{validationKeySearchTerm}"</div>}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Card className="w-full h-full flex flex-col gap-0 px-0 pt-2 pb-0 shadow-inner bg-white">
      <CardHeader className="flex-shrink-0 border-b !pb-0 px-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <CardTitle className="text-sm">Configure Field Source</CardTitle>
              <CardDescription><span className="font-semibold text-blue-600 text-xs">{itemToConfigure.source.name}</span></CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 flex-grow overflow-hidden">
        <div className="flex h-full">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} orientation="vertical" className="flex">
            <TabsList className="flex flex-col h-full justify-start items-stretch w-40 rounded-md gap-2 mt-2 mr-4">
              <TabsTrigger value="table_field" className="justify-start hover:bg-blue-50 data-[state=active]:!bg-blue-200 data-[state=active]:!text-gray-800">Table Field</TabsTrigger>
              <TabsTrigger value="global_key" className="justify-start hover:bg-blue-50 data-[state=active]:!bg-blue-200 data-[state=active]:!text-gray-800">Global Key</TabsTrigger>
              <TabsTrigger value="combination-key" className="justify-start hover:bg-blue-50 data-[state=active]:!bg-blue-200 data-[state=active]:!text-gray-800">Combination Key</TabsTrigger>
              <TabsTrigger value="fixed_value" className="justify-start hover:bg-blue-50 data-[state=active]:!bg-blue-200 data-[state=active]:!text-gray-800">Fixed Value</TabsTrigger>
              <TabsTrigger value="validation-key" className="justify-start hover:bg-blue-50 data-[state=active]:!bg-blue-200 data-[state=active]:!text-gray-800">Validation Key</TabsTrigger>
            </TabsList>
            <ScrollArea className="flex-grow h-full">
              <div className="px-0 py-3">
                {activeTab === 'table_field' && renderTableFieldTab()}
                {activeTab === 'global_key' && renderGlobalKeyTab()}
                {activeTab === 'combination_key' && renderCombinationKeyTab()}
                {activeTab === 'fixed_value' && renderFixedValueTab()}
                {activeTab === 'validation_key' && renderValidationKeyTab()}
              </div>
            </ScrollArea>
          </Tabs>
        </div>
      </CardContent>
      <CardFooter className='flex items-end justify-end border-t pt-4'>
        <Button size="sm" onClick={handleSave}>Save Configuration</Button>
      </CardFooter>
    </Card>
  );
};

export default ConfigurationScreen;
