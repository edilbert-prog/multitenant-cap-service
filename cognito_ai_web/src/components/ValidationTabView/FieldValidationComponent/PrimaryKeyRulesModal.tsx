import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { SingleSelectCombobox } from '../SingleSelectCombobox';

export interface FilterRule {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface PrimaryKeyRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rules: FilterRule[]) => void;
  fieldOptions: { value: string; label: string }[];
  initialRules?: FilterRule[];
  title?: string;
}


const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'starts with', label: 'Starts With' },
  { value: 'ends with', label: 'Ends With' },
  { value: 'in', label: 'In' },
  { value: 'greater than', label: 'Greater Than' },
  { value: 'less than', label: 'Less Than' },
  { value: 'greater than or equal', label: 'Greater Than or Equal' },
  { value: 'less than or equal', label: 'Less Than or Equal' },
];



export const PrimaryKeyRulesModal: React.FC<PrimaryKeyRulesModalProps> = ({  
  isOpen,
  onClose,
  onSave,
  fieldOptions,
  initialRules = [],
  title = 'Build Filters',
}) => {  
  const [rules, setRules] = useState<FilterRule[]>(  
    initialRules.length > 0 ? initialRules : []
  );
  const [currentRule, setCurrentRule] = useState<Omit<FilterRule, 'id'>>({
    field: '',
    operator: '',
    value: '',
  });

  const handleAddRule = () => {
    if (!currentRule.field || !currentRule.operator || !currentRule.value) {
      toast.error('Please fill in all fields');
      return;
    }

    const newRule: FilterRule = {
      id: crypto.randomUUID(),
      ...currentRule,
    };

    setRules((prev) => [...prev, newRule]);
    setCurrentRule({ field: '', operator: '', value: '' });
    toast.success('Filter condition added');
  };

  const handleRemoveRule = (id: string) => {
    setRules((prev) => prev.filter((rule) => rule.id !== id));
    toast.success('Filter condition removed');
  };

  const handleClearAll = () => {
    setRules([]);
    setCurrentRule({ field: '', operator: '', value: '' });
    toast.success('All filters cleared');
  };

  const handleSave = () => {
    onSave(rules);
    onClose();
  };

  const getPreviewText = () => {
    if (rules.length === 0) return 'No filters applied';

    const previews = rules.map((rule) => {
      const operator = rule.operator.toUpperCase();
      return `${rule.field} ${operator} ${rule.value}`;
    });

    return previews.join(' AND ');
  };

  return ( 
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          <DialogDescription>
            Add conditions to filter records before fetching from the database.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Add New Condition Section */}
          <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Add Condition</h3>
              {rules.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleClearAll}>
                  Clear All
                </Button>
              )}
            </div>

            <div className="grid grid-cols-[2fr_1.5fr_2fr_auto] gap-3 items-end">
              <div className="space-y-2">
                <Label htmlFor="field">Field</Label>
                <SingleSelectCombobox
                  options={fieldOptions}
                  value={currentRule.field}
                  onChange={(value) =>
                    setCurrentRule((prev) => ({ ...prev, field: value as string }))
                  }
                  placeholder="Select field"
                  searchPlaceholder="Search fields..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="operator">Operator</Label>
                <SingleSelectCombobox
                  options={OPERATOR_OPTIONS}
                  value={currentRule.operator}
                  onChange={(value) =>
                    setCurrentRule((prev) => ({ ...prev, operator: value as string }))
                  }
                  placeholder="Select operator"
                  searchPlaceholder="Search operators..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                <Input
                  id="value"
                  value={currentRule.value}
                  onChange={(e) =>
                    setCurrentRule((prev) => ({ ...prev, value: e.target.value }))
                  }
                  placeholder="Enter value"
                  onKeyDown={(e) => {   
                    if (e.key === 'Enter') {
                      handleAddRule();
                    }
                  }}
                />
              </div>

              <Button onClick={handleAddRule} size="default" className="mb-0">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {/* Preview Section */}
          {/* {rules.length > 0 && (
            <div className="space-y-2">
              <Label>Preview:</Label>
              <div className="p-3 rounded-md bg-muted border text-sm font-mono">
                {getPreviewText()}
              </div>
            </div>
          )} */}

          {/* Applied Filters List */}
          {rules.length > 0 && ( //updated json including the primary_key_rules
            <div className="space-y-3">
              <Label>Applied Filters ({rules.length}):</Label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {rules.map((rule, index) => (  
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-primary">
                          {index + 1}.
                        </span>
                        <span className="font-medium">{rule.field}</span>
                        <span className="text-muted-foreground px-2 py-0.5 rounded bg-muted text-xs">
                          {rule.operator}
                        </span>
                        <span className="font-mono text-xs">{rule.value}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRule(rule.id)}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Apply Filters
            {rules.length > 0 && ` (${rules.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
