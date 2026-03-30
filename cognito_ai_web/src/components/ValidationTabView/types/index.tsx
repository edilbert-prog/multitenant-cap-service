import { AppliedOperation } from "./deriveColumn";
import { ReactNode } from "react";

export interface Validation {
    tableData: any;
  created_at: any;
  query_conditions: any;
  selected_secondary_tables: any;
  primary_table: any;
  primary_key_value: string;
  primary_key_fields: any;
  table_mappings: any;
    application_id: any;
    application_label: any;
    object_type: any;
    object_type_label: any;
    module_id: any;
    module_label: any;
    sub_module_id?: any;
    sub_module_label: any;
    object_id: any;
    object_label: any;
    tcode_label: any;
    system_number?: string;
    system_number_label?: string;
    client_id?: string;
    client_id_label?: string;
    database_connection: any;
    database_connection_label: any;
    validation_description: any;
    source_application?: string;
  field_rules: any[];
  primaryTable: string;
  primaryKeyFields: any[];
  primaryKeyValue: string;
  validationRules: any[];
  selectedSecondaryTables: any[];
  id: string;
  validation_id: number;
  object: string;
  tcode: string;
  updated_at: string;
  field_selector?: any[];
  field_configuration?: any[];
}

export interface CombinationKeyPart {
  id: string;
  type: 'fixed' | 'field';
  value: string;
  tableName: string;
  fieldName: string;
  offset: number;
  length: number;
}

export interface ManualFixedValueRule {
  id: string;
  from: string;
  to: string;
}

export interface ManualFixedValue {
  id: string;
  value: string;
}

export interface ManualFixedValueConfig {
  includeSingle: ManualFixedValue[];
  excludeSingle: ManualFixedValue[];
  includeRange: ManualFixedValueRule[];
  excludeRange: ManualFixedValueRule[];
}

export interface FixedValueRule {
  id: string;
  from: string;
  to: string;
}

export interface FixedValue {
  id: string;
  value: string;
}

export interface FixedValueConfig {
  includeSingle: FixedValue[];
  excludeSingle: FixedValue[];
  includeRange: FixedValueRule[];
  excludeRange: FixedValueRule[];
}

export interface FromSourceConfig {
  sourceType?: 'master-data-table' | 'manual';
  sourceTable?: string;
  sourceFile?: string;
  sourceField?: string;
  rules?: ManualFixedValueConfig;
}
export type OperationCategory = 'string' | 'logical' | 'aggregation';
export interface RuleSideConfig {
  operations: AppliedOperation[];
  operationCategory?: OperationCategory;

}


export interface FieldValidationConfig {
  id: string;
  unique_id?: string;
  source_type: ExpectedValueType;
  is_configured?: Boolean;
  globalKey?: string;
  validationKey?: string;
  combinationKey?: CombinationKeyPart[];
  fromSourceConfig?: FromSourceConfig;
  sourceTable?: string;
  sourceField?: string;
  sourceOffset?: number;
  sourceLength?: number;
  selectedFields?: string[];
  tableFieldConfig?: TableFieldConfig;
  logicalOperator?: string;
  operationCategory?: 'string' | 'logical' | 'aggregation';
  logicalValue?: string;
  aggregationFunction?: string;
  operations?: AppliedOperation[];
  key1Config?: RuleSideConfig;
  key2Config?: RuleSideConfig;
  key_config?: any;
  fieldRuleConfigs?: any;
  stored_left_row?: any;
  stored_right_row?: any;
  stored_left_aggregate?: any;
  stored_right_aggregate?: any;
}


export interface FieldData {
  Description: string;
  FieldName: string;
  description: any;
  unique_id: string;
  table_name: string;
  field_name: string;
  FieldId: string;
  KeyField: string;
  VerificationField: string;
  dataType: string;
  sampleValue: any;
}

export interface TableData {
  TableName: any;
  table_name: string;
  TableDesc?: string;
  Fields: FieldData[];
}
export interface SelectionRow {
  id: string;
  tableName: string;
  selectedFields: (string | number)[];
}
export type ExpectedValueType = 'constant_value' | 'table_field' | 'global_key' | 'fixed_value' | 'validation_key' | 'derive' | 'vlookup' | 'combination_key' | 'formula';
export interface FormFieldOption {
  value: string | number;
  label: string | React.ReactNode;
  text?: string; // Plain text version for chip display
}

export interface ValidationRule {
  id: string;
  leftField: string;
  operator: string;
  rightType: 'field' | 'value';
  rightValue: string;
  severity: 'error' | 'warn' | 'info';
  expectedValueType: ExpectedValueType;
  config?: Partial<FieldValidationConfig>;
}

export interface SideConfig {
  column?: string; // e.g., "EKKO.EBELN"
  operations: AppliedOperation[];
}

export interface TableFieldConfig {
  leftSide: SideConfig;
  rightSide: SideConfig;
  comparisonOperator: string;
}

export interface FieldRule {
  ui_id: string;
  // field_name: ReactNode;
  // uniqueId: any;
  TableName: any;
  dataType: string;
  unique_id: string;
  FieldName: string;
  Description: string;
  isKey: boolean;
  isValidation: boolean;
  isDisplay: boolean;
  displayValue: string;
  isComparative: boolean;
  leftField: string;
  operator: string;
  rightField: string;
  expectedValueType: ExpectedValueType;
  expectedValue: string;
  primaryKeyValue: string;
  KeyField: string;
  VerificationField: string;
  TableId: string;
  FieldId: string;
  relationKeys: string[];
  config?: Partial<FieldValidationConfig> & { xisConfigured?: boolean };
  sampleValue: any;
  line_match_item?: boolean;
}