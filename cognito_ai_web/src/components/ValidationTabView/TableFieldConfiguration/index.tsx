import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { FieldRule, FieldValidationConfig, TableData } from '../types';
import { TableFieldRuleBuilder, TableFieldRuleBuilderRef } from '../TableFieldRuleBuilder';
import { TableFieldEditor } from '../TableFieldEditor';
import { useValidationStore } from '../Stores/validationStore';

interface TableFieldConfigurationProps {
  field: FieldRule;
  field_rules: FieldRule[];
  tableData: TableData[];
  filterValues: any;
  onSave: (updates: Partial<FieldRule>) => void;
  onCancel: () => void;
  isReadOnly?: boolean;
}

export const TableFieldConfiguration: React.FC<TableFieldConfigurationProps> = ({
  field,
  field_rules,
  tableData,
  filterValues,
  onSave,
  onCancel,
  isReadOnly = false,
}) => {
  const builderRef = useRef<TableFieldRuleBuilderRef>(null);
  const checkDataTriggerRef = useRef<{ handleCheck: () => void } | null>(null);
  const { 
    setLeftRowData, setRightRowData, 
    isAggregateMode, aggregateFieldId,
    fieldOperations
  } = useValidationStore();

  const [localUpdates, setLocalUpdates] = useState<Partial<FieldRule>>({
    relationKeys: field.relationKeys,
    expectedValue: field.expectedValue,
  });

  const [connectionData, setConnectionData] = useState<{
    source: { application: string; system_number: string; client_id: string; connection: string }
    target: { application: string; system_number: string; client_id: string; connection: string }
  } | null>(null);

  // Operator selected between target and source in editor (equals, not equals, ...)
  const [selectedOperator, setSelectedOperator] = useState<string>(() => {
    const op = (field.config as any)?.key_config?.operator
    return op || "equals"
  })


  const isThisRuleInAggregateMode = isAggregateMode && aggregateFieldId === field.unique_id;

  useEffect(() => {
    setLocalUpdates({
        relationKeys: field.relationKeys,
        expectedValue: field.expectedValue,
    });
  }, [field.relationKeys, field.expectedValue]);

  const updatedFieldRules = useMemo(() => {
    return field_rules.map(r => {
      if (r.unique_id === field.unique_id) {
        return { ...r, ...localUpdates };
      }
      return r;
    });
  }, [field_rules, field.unique_id, localUpdates]);

  // Filter field rules to show only the current field for Connections Panel
  const currentFieldRules = useMemo(() => {
    const currentRule = updatedFieldRules.find(r => r.unique_id === field.unique_id);
    return currentRule ? [currentRule] : [];
  }, [updatedFieldRules, field.unique_id]);


  const handleSave = () => {
    if (isReadOnly) return;

    if (field.expectedValueType === 'table_field') {
        // Get the saved operations for this field
        const savedOperations = fieldOperations[field.unique_id]
        // Ensure operation arrays are always a single-level list of strings
        const toFlatArray = (val: any): string[] => {
          if (!val) return []
          if (Array.isArray(val)) return val.flat(Infinity).map(String).filter(Boolean)
          return [String(val)]
        }
        
        // Get the table field configuration
        const key_config = {
            unique_id: `${field.TableName}.${field.FieldName}_vs_${localUpdates.relationKeys?.[0] || ""}`,
            operation_category: isThisRuleInAggregateMode ? 'aggregation' : 'string',
            source: {
                table: field.TableName,
                field: field.FieldName,
                ...(savedOperations?.targetOperation && { operation: toFlatArray(savedOperations.targetOperation) }),
                ...(connectionData?.source && {
                    application: connectionData.source.application,
                    system_number: connectionData.source.system_number,
                    client_id: connectionData.source.client_id,
                    connection: connectionData.source.connection,
                }),
            },
            target: localUpdates.relationKeys?.[0] ? {
                table: (localUpdates.relationKeys as string[])[0].split('.')[0],
                field: (localUpdates.relationKeys as string[])[0].split('.')[1],
                ...(savedOperations?.sourceOperation && { operation: toFlatArray(savedOperations.sourceOperation) }),
                ...(connectionData?.target && {
                    application: connectionData.target.application,
                    system_number: connectionData.target.system_number,
                    client_id: connectionData.target.client_id,
                    connection: connectionData.target.connection,
                }),
            } : undefined,
            operator: selectedOperator
        };

        if (!key_config.target) {
            delete key_config.target;
        }

        const finalConfig: Partial<FieldValidationConfig> = {
            unique_id: field.unique_id,
            source_type: 'table_field',
            is_configured: true,
            key_config: key_config
        };
        
        onSave({ 
            config: finalConfig, 
            relationKeys: localUpdates.relationKeys
        });
        // Do not auto-trigger API; user will click Check buttons explicitly
    } else if (field.expectedValueType === 'constant_value') {
        onSave({
            expectedValue: localUpdates.expectedValue,
            config: { ...field.config, is_configured: true }
        });
    } else {
        const builderConfigs = builderRef.current?.getConfigs();
        onSave({ config: { ...(builderConfigs?.[field.unique_id] || {}), is_configured: true } });
    }
    toast.success("Configuration saved locally.");
  };

  const handleRowSelected = (side: 'left' | 'right', data: any | null) => {
    if (side === 'left') {
      setLeftRowData(data);
    } else {
      setRightRowData(data);
    }
  };

  const handleConnectionChange = (connData: {
    source: { application: string; system_number: string; client_id: string; connection: string }
    target: { application: string; system_number: string; client_id: string; connection: string }
  }) => {
    setConnectionData(connData);
  };

  return ( 
    <Card className="p-2 gap-2 mt-2">
      <CardHeader className='px-0 pb-2'>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onCancel} className="text-muted-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <CardTitle className="whitespace-nowrap">Configure: {field.expectedValueType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</CardTitle>
              <CardDescription>
                <span className="font-semibold text-xs" style={{ color: '#0071E9' }}>{field.TableName}.{field.FieldName}</span>
              </CardDescription>
            </div>
          </div>
          {field.expectedValueType === 'table_field' && (
            <div className="flex-1">
              <TableFieldEditor
                field={field}
                tableData={tableData}
                filterValues={filterValues}
                relationKeys={localUpdates.relationKeys || []}
                onRelationKeysChange={(keys) => setLocalUpdates(prev => ({ ...prev, relationKeys: keys }))}
                onRowSelected={handleRowSelected}
                onConnectionChange={handleConnectionChange}
                operatorValue={selectedOperator}
                onOperatorChange={(op) => setSelectedOperator(op)}
                isReadOnly={isReadOnly}
                applicationLabel={filterValues.application_label}
                triggerCheckData={checkDataTriggerRef}
                showDropdownsOnly={true}
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-2">
        {field.expectedValueType === 'table_field' && (
            <TableFieldEditor
              field={field}
              tableData={tableData}
              filterValues={filterValues}
              relationKeys={localUpdates.relationKeys || []}
              onRelationKeysChange={(keys) => setLocalUpdates(prev => ({ ...prev, relationKeys: keys }))}
              onRowSelected={handleRowSelected}
              onConnectionChange={handleConnectionChange}
              isReadOnly={isReadOnly}
              applicationLabel={filterValues.application_label}
              triggerCheckData={checkDataTriggerRef}
              showOperatorPanels={true}
            />
        )}
        <div>
          {/* <h3 className="mb-2 text-lg font-semibold">
            {field.expectedValueType === 'constant_value' ? 'Set Value' : 'Advanced Operation Builder'}
          </h3> */}
          {/* <TableFieldRuleBuilder
            ref={builderRef}
            key={`${field.unique_id}-builder`}
            field={field}
            field_rules={currentFieldRules}
            tableData={tableData}
            initialState={{ fieldRuleConfigs: field.config ? { [field.unique_id]: field.config } : {} }}
            onSave={() => {}}
            onCancel={onCancel}
            hideFooter={true}
            onConstantValueChange={(val) => setLocalUpdates(prev => ({ ...prev, expectedValue: val }))}
            expectedValue={localUpdates.expectedValue || ''}
          /> */}
        </div>

      </CardContent>
      {!isReadOnly && (
        <CardFooter className="justify-end">
            <Button onClick={handleSave}>Save Configuration</Button>
        </CardFooter>
      )}
    </Card>
  );
};
