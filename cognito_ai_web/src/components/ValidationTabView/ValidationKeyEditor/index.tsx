import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { FieldValidationConfig } from '../types/validation';
import { PlusCircle, Search } from 'lucide-react';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { cn } from '../lib/utils';

interface ValidationKeyEditorProps {
  config: Partial<FieldValidationConfig>;
  setConfig: React.Dispatch<React.SetStateAction<Partial<FieldValidationConfig>>>;
}

export const ValidationKeyEditor: React.FC<ValidationKeyEditorProps> = ({ config, setConfig }) => {
  const [validationKeys, setValidationKeys] = useState([
    { id: '01', label: 'Sales Document' }, { id: '02', label: 'Sales Document' },
    { id: '03', label: 'Doc. Condition' }, { id: '04', label: 'Customer Master' },
    { id: '05', label: 'Vendor Master' }, { id: '06', label: 'Material Master' },
  ]);
  const [newValidationKey, setNewValidationKey] = useState({ id: '', label: '' });
  const [validationKeySearchTerm, setValidationKeySearchTerm] = useState('');

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
      <Card className='gap-2 border-none shadow-none'>
        <CardHeader>
          <CardTitle>Add New Validation Key</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Key ID (e.g., 07)"
            value={newValidationKey.id}
            onChange={(e) => setNewValidationKey({ ...newValidationKey, id: e.target.value })}
          />
          <Input
            placeholder="Key Label"
            value={newValidationKey.label}
            onChange={(e) => setNewValidationKey({ ...newValidationKey, label: e.target.value })}
            className="md:col-span-2"
          />
        </CardContent>
        <CardFooter>
          <Button onClick={handleAddKey}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Key
          </Button>
        </CardFooter>
      </Card>

      <Card className='gap-2 border-none shadow-none'>
        <CardHeader>
          <CardTitle>Available Validation Keys</CardTitle>
          <div className="flex items-center justify-between pt-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by key or label..."
                value={validationKeySearchTerm}
                onChange={(e) => setValidationKeySearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button
              variant="link"
              onClick={() => handleSelectKey('')}
              disabled={!selectedKey}
            >
              Clear Selection
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Key</TableHead>
                  <TableHead>Label</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKeys.map((key) => (
                  <TableRow
                    key={key.id}
                    onClick={() => handleSelectKey(key.id)}
                    className={cn(
                      "cursor-pointer",
                      selectedKey === key.id && "bg-blue-100 hover:bg-blue-200"
                    )}
                  >
                    <TableCell className="font-medium">{key.id}</TableCell>
                    <TableCell>{key.label}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredKeys.length === 0 && (
              <div className="text-center p-8 text-muted-foreground">
                No keys found for "{validationKeySearchTerm}"
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
