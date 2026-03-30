import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ValidationTabView/ui/button";
import { Input } from "@/components/ValidationTabView/ui/input";
import { Label } from "@/components/ValidationTabView/ui/label";
import { Textarea } from "@/components/ValidationTabView/ui/textarea";
import { Checkbox } from "@/components/ValidationTabView/ui/checkbox";
import { Eye, EyeOff } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ValidationTabView/ui/select";



interface FormField {
  name: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  info?: string;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  default?: any;
  depends_on?: string[];
  depends_value?: any;
  visible?: boolean;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  dynamic_placeholder?: {
    depends_on: string;
    values: Record<string, string>;
  };
}

interface FormSchema {
  name: string;
  display_name: string;
  group?: string;
  icon?: string;
  description: string;
  enabled?: boolean;
  fields: FormField[];
  save_connection?: {
    name: string;
    klass: string;
    module: string;
    params: Record<string, any>;
  };
}


interface DynamicFormProps {
  formSchema: FormSchema;
  onSubmit: (formData: Record<string, any>) => void;
  onCancel: () => void;
  title?: string;
  initialData?: Record<string, any>;
  layout?: 1 | 2 | 3;
  submitButtonText?: string;
  // New generic props for handling custom button actions
  onCustomAction?: (actionField: FormField, formData: Record<string, any>) => void;
  isActionLoading?: Record<string, boolean>;
  formId?: string;
  hideFooter?: boolean;
}



const CredDynamicForm: React.FC<DynamicFormProps> = ({
  formSchema,
  onSubmit,
  onCancel,
  title,
  initialData = {},
  layout = 3,
  submitButtonText = "Submit",
    // Destructure new props with defaults
    onCustomAction,
    isActionLoading = {},
    formId,
    hideFooter = false,

}) => { 
  const getInitialFormData = () => {
    const initialFormData: Record<string, any> = {};
    formSchema.fields.forEach(field => {
      if (initialData[field.name] !== undefined) {
        initialFormData[field.name] = initialData[field.name];
      } else if (field.default !== undefined) {
        initialFormData[field.name] = field.default;
      } else { 
        switch (field.type) {
          case 'checkbox':
            initialFormData[field.name] = false;
            break;
          case 'multiDropdown': // Assuming you might have this type
            initialFormData[field.name] = [];
            break;
          case 'number':
            initialFormData[field.name] = ''; // Or 0 if appropriate
            break;
          default:
            initialFormData[field.name] = '';
        }
      }
    });
    
    return initialFormData;
  };

  const [formData, setFormData] = useState(getInitialFormData);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  // const regularFields = formSchema.fields.filter(field => field.type !== 'button');
  // const actionButtons = formSchema.fields.filter(field => field.type === 'button');

  useEffect(() => {
    setFormData(getInitialFormData());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, formSchema]); // Dependencies for re-initializing form data

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (fieldName: string) => {
    setShowPassword(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => { 
    e.preventDefault(); // Prevent default form submission
    onSubmit(formData);
  };

  // const handleTestClick = () => {
  //   if (onTestConnection) {
  //     onTestConnection(formData);
  //   }
  // };


  const isFieldVisible = (field: FormField) => {
    if (field.visible === false) return false; // Explicitly hidden
    if (!field.depends_on || field.depends_on.length === 0) {
      return true;
    }

    return field.depends_on.every(dependency => {
      const dependencyValue = formData[dependency];
      // Ensure comparison handles various types correctly
      // For boolean dependencies_value, direct comparison is fine
      // For string/number, ensure types match or convert
      return String(dependencyValue) === String(field.depends_value);
    });
  };

  const groupFields = (fields: FormField[], fieldsPerRow: number) => {
    const visibleFields = fields.filter(isFieldVisible);
    const rows: FormField[][] = [];
    let currentRow: FormField[] = [];
    
    visibleFields.forEach(field => {
      if (field.type === 'textArea') { // Textarea always takes full width
        if (currentRow.length > 0) {
          rows.push([...currentRow]);
          currentRow = [];
        }
        rows.push([field]); // Push textarea as a single item row
      } else {
        currentRow.push(field);
        if (currentRow.length === fieldsPerRow) {
          rows.push([...currentRow]);
          currentRow = [];
        }
      }
    });
    
    if (currentRow.length > 0) {
      rows.push([...currentRow]);
    }
    
    return rows;
  };

  const renderFormField = (field: FormField, index: number) => {
    const { name, type, label, required, info } = field;
    const fieldId = `field-${name}-${index}`; // Ensure unique ID for label association

    // Calculate dynamic placeholder if configured
    let placeholder = field.placeholder;
    if (field.dynamic_placeholder) {
      const dependsOnField = field.dynamic_placeholder.depends_on;
      const dependsOnValue = formData[dependsOnField];
      if (dependsOnValue && field.dynamic_placeholder.values[dependsOnValue]) {
        placeholder = field.dynamic_placeholder.values[dependsOnValue];
      }
    }

    switch (type) {
      case 'text':
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId} className="text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={fieldId}
              name={name}
              placeholder={placeholder}
              value={formData[name] as string || ''}
              onChange={(e) => handleInputChange(name, e.target.value)}
              required={required}
              disabled={field.disabled}
              className="w-full p-3 border border-gray-300 text-sm rounded-lg focus:ring-2  "
            />
            {info && <p className="text-xs text-gray-500 pt-1">{info}</p>}
          </div>
        );
        
      case 'password':
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId} className="text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <div className="relative">
              <Input
                id={fieldId}
                name={name}
                type={showPassword[name] ? "text" : "password"}
                placeholder={placeholder}
                value={formData[name] as string || ''}
                onChange={(e) => handleInputChange(name, e.target.value)}
                required={required}
                className="w-full p-3 pr-12 border border-gray-300 text-sm rounded-lg focus:ring-2  "
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility(name)}
                className="absolute right-3 top-1/2 cursor-pointer transform -translate-y-1/2 text-gray-500 hover:text-gray-700 "
                tabIndex={-1}
              >
                {showPassword[name] ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {info && <p className="text-xs text-gray-500 pt-1">{info}</p>}
          </div>
        );

        
        
      case 'select':
      case 'dropdown':
        // If field is disabled, render as a text input to show the value
        if (field.disabled) {
          // Find the label for the current value
          const selectedOption = field.options?.find(opt => opt.value === formData[name]);
          const displayValue = selectedOption ? selectedOption.label : formData[name] || '';

          return (
            <div key={fieldId} className="space-y-2">
              <Label htmlFor={fieldId} className="text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id={fieldId}
                name={name}
                value={displayValue}
                disabled={true}
                className="w-full p-3 border border-gray-300 text-sm rounded-lg bg-gray-50 cursor-not-allowed"
              />
              {info && <p className="text-xs text-gray-500 pt-1">{info}</p>}
            </div>
          );
        }

        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId} className="text-sm font-medium text-gray-700"> {/* htmlFor should point to SelectTrigger's id if possible, or just be semantic */}
              {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <Select
              value={formData[name] as string || ''}
              onValueChange={(value) => handleInputChange(name, value)}
              required={required}
            >
              <SelectTrigger id={fieldId} className="w-full p-5.5 h-12 border border-gray-300 rounded-lg focus:ring-2   text-sm">
                <SelectValue placeholder={placeholder || "Select an option"} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value} >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {info && <p className="text-xs text-gray-500 pt-1">{info}</p>}
          </div>
        );
        
      case 'textArea': 
        return ( 
          <div key={fieldId} className="space-y-2 col-span-full"> {/* Make textarea span full width of grid */}
            <Label htmlFor={fieldId} className="text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={fieldId}
              name={name}
              placeholder={placeholder}
              value={formData[name] as string || ''}
              onChange={(e) => handleInputChange(name, e.target.value)}
              required={required}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2  resize-none text-sm"
              rows={4}
            />
            {info && <p className="text-xs text-gray-500 pt-1">{info}</p>}
          </div>
        );
        
      case 'checkbox':
        return ( 
          <div key={fieldId} className="flex items-center space-x-3 py-6"> 
            <Checkbox
              id={fieldId}
              checked={!!formData[name]} 
              onCheckedChange={(checked) => handleInputChange(name, checked)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label 
                htmlFor={fieldId} 
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                {label}
              </Label>
              {info && <p className="text-xs text-gray-500">{info}</p>} 
            </div>
          </div>
        );
        
      case 'number':
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId} className="text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={fieldId}
              name={name}
              type="number"
              placeholder={placeholder}
              value={formData[name] as number | string || ''}
              min={field.min}
              max={field.max}
              step={field.step}
              onChange={(e) => handleInputChange(name, e.target.value === '' ? '' : parseFloat(e.target.value))}
              required={required}
              className="w-full p-3 border border-gray-300 text-sm rounded-lg focus:ring-2  "
            />
            {info && <p className="text-xs text-gray-500 pt-1">{info}</p>}
          </div>
        );
        
      case 'upload':
        return (  
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId} className="text-sm font-medium text-gray-700">
              {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <div className="relative">
              <Input
                id={fieldId}
                name={name}
                type="file"
                accept={field.accept}
                multiple={field.multiple}
                onChange={(e) => {
                  const files = e.target.files;
                  if (field.multiple) {
                    handleInputChange(name, files ? Array.from(files) : []);
                  } else {
                    handleInputChange(name, files ? files[0] : null);
                  }
                }}
                required={required}
                className="w-full p-[0.469rem] border border-gray-300 text-sm rounded-lg focus:ring-2   file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            {info && <p className="text-xs text-gray-500 pt-1">{info}</p>}
          </div>
        );

        case 'button':
          return (
            <div key={fieldId} className="space-y-2 flex flex-col justify-end h-full pt-1">
              {/* This empty label helps align the button vertically with other fields that have labels */}
              <Label htmlFor={fieldId} className="text-sm font-medium text-gray-700"> </Label>
              <Button
                id={fieldId}
                type="button"
                onClick={() => onCustomAction && onCustomAction(field, formData)}
                disabled={isActionLoading[name]}
                className="w-[10rem] p-1 rounded-lg flex items-center justify-center gap-2"
              >
                {isActionLoading[name] ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Testing...
                  </>
                ) : (
                  label
                )}
              </Button>
            </div>
          );  
        
      default:
        return <div key={fieldId}>Unsupported field type: {type}</div>; 
    }
  };

  const getGridClass = (isTextAreaRow: boolean) => {
    if (isTextAreaRow) return 'grid grid-cols-1 gap-6'; 
    switch (layout) {
      case 1:
        return 'grid grid-cols-1 gap-6';
      case 2:
        return 'grid grid-cols-1 md:grid-cols-2 gap-6';
      case 3:
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
    }
  };

  const fieldRows = groupFields(formSchema.fields, layout);


  return (
    <form id={formId} onSubmit={handleSubmit} className="h-full flex flex-col bg-white" >
      {/* Form Content - Scrollable */}
      <div className="flex-1 ">
        <div className="space-y-8" >
          {fieldRows.map((row, rowIndex) => (
            <div key={rowIndex} className={getGridClass(row.length === 1 && row[0].type === 'textArea')}>
              {row.map((field, fieldIndex) => (
                // For textAreas, they will be the only item in 'row' and take col-span-full
                // For other fields, they fit into the grid layout.
                <div
                  key={`${field.name}-${fieldIndex}`}
                  className={`min-w-0 ${field.type === 'textArea' ? 'col-span-full' : ''}`}
                >
                  {renderFormField(field, fieldIndex)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Fixed Footer with Action Buttons */}
      {!hideFooter && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-8 py-4">
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-6 py-2  text-white rounded-lg"
            >
              {submitButtonText}
            </Button>
          </div>
        </div>
      )}
   </form>
  );
};

export default CredDynamicForm;