import React from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface ConstantValueEditorProps {
  value: string;
  onChange: (value: string) => void;
  isReadOnly?: boolean;
}

export const ConstantValueEditor: React.FC<ConstantValueEditorProps> = ({ value, onChange, isReadOnly = false }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="constant-value-input">Constant Value</Label>
      <Input
        id="constant-value-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter the constant value"
        disabled={isReadOnly}
      />
      <p className="text-xs text-muted-foreground">
        This value will be used for comparison against the field's value.
      </p>
    </div>
  );
};
