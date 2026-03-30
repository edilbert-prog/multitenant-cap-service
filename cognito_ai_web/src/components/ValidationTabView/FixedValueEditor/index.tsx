import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../ui/button';
import { FieldValidationConfig, FromSourceConfig, FixedValueConfig } from '../types/validation';
import { Minus, MinusCircle, Plus, PlusCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { DialogClose } from '@radix-ui/react-dialog';


interface FixedValueEditorProps {
  config: Partial<FieldValidationConfig>;
  setConfig: React.Dispatch<React.SetStateAction<Partial<FieldValidationConfig>>>;
  tableNames: string[];
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

export const FixedValueEditor: React.FC<FixedValueEditorProps> = ({ config, setConfig, tableNames }) => {
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
  const [selectedMaster, setSelectedMaster] = useState<string>(config.fromSourceConfig?.sourceTable || ((tableNames || [])[0] || ''));
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
