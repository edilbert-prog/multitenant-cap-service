import React from 'react';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

interface SubstringSelectorProps {
  offset: number;
  length: number;
  sampleValue?: string;
  onChange: (values: { offset: number; length: number }) => void;
}

const SubstringSelector: React.FC<SubstringSelectorProps> = ({
  offset,
  length,
  sampleValue: providedSampleValue = 'Select a field or enter a value for a preview.',
  onChange,
}) => {
  const sampleValue = providedSampleValue;
  const max = sampleValue.length > 0 ? sampleValue.length : 40;

  const safeOffset = Math.min(offset, max);
  const safeLength = Math.min(length, max - safeOffset);
  const end = safeOffset + safeLength;

  const handleSliderChange = (value: [number, number]) => {
    const newOffset = value[0];
    const newLength = value[1] - newOffset;
    onChange({ offset: newOffset, length: newLength });
  };

  const handleInputChange = (field: 'offset' | 'length', value: number) => {
    if (isNaN(value)) return;

    if (field === 'offset') {
      const newOffset = Math.max(0, Math.min(value, max - safeLength));
      onChange({ offset: newOffset, length: safeLength });
    } else {
      const newLength = Math.max(0, Math.min(value, max - safeOffset));
      onChange({ offset: safeOffset, length: newLength });
    }
  };

  const displayString = sampleValue.padEnd(max, '·');
  const prefix = displayString.slice(0, safeOffset);
  const selected = displayString.slice(safeOffset, end);
  const suffix = displayString.slice(end);

  return (
    <div className="space-y-4 rounded-lg border p-2 shadow-inner">
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium text-muted-foreground">Visual Selector</Label>
        <div className="mt-2 w-full select-none overflow-hidden text-ellipsis whitespace-nowrap rounded-md bg-white p-2 text-center font-mono text-sm tracking-wider shadow-sm">
          <span className="text-slate-400">{prefix}</span>
          <span className="rounded bg-blue-100 px-1 text-blue-800">{selected}</span>
          <span className="text-slate-400">{suffix}</span>
        </div>
        <Slider
          value={[safeOffset, end]}
          onValueChange={handleSliderChange}
          max={max}
          step={1}
          className="mt-3"
          disabled={!sampleValue || sampleValue.length === 0}
        />
      </div>
      <div className="grid grid-cols-2 gap-4 pt-2">
        <div>
          <Label htmlFor={`offset-input-${safeOffset}`} className="text-xs">Offset</Label>
          <Input
            id={`offset-input-${safeOffset}`}
            type="number"
            value={safeOffset}
            onChange={(e) => handleInputChange('offset', e.target.valueAsNumber)}
            className="w-full h-8"
            min={0}
            max={max - safeLength}
          />
        </div>
        <div>
          <Label htmlFor={`length-input-${safeLength}`} className="text-xs">Length</Label>
          <Input
            id={`length-input-${safeLength}`}
            type="number"
            value={safeLength}
            onChange={(e) => handleInputChange('length', e.target.valueAsNumber)}
            className="w-full h-8"
            min={0}
            max={max - safeOffset}
          />
        </div>
      </div>
    </div>
  );
};

export default SubstringSelector;
