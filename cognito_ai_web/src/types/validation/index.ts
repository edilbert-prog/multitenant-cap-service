// Type definitions matching the backend data comparator types

export type SourceType = 'excel' | 'mysql' | 'postgres' | 'sap' | 'csv' | 'api';
export type MatchStrategy = 'exact' | 'fuzzy';
export type ValidationStatus = 'active' | 'inactive' | 'archived';
export type ExecutionStatus = 'running' | 'success' | 'failed' | 'timeout';
export type TestStatus = 'success' | 'failed' | 'pending';

// Connection interface
export interface Connection {
  connection_id: number;
  connection_name: string;
  description: string;
  source_type: SourceType;
  host?: string;
  port?: number;
  database_name?: string;
  username?: string;
  connection_config?: Record<string, any>;
  is_active: boolean;
  last_tested_at?: string;
  last_test_status?: TestStatus;
}

// Source definition for multi-source configuration
export interface SourceDefinition {
  source_id: string;

  // Option 1: Connection-based source (database/Excel connection)
  connection_id?: number;
  query?: string;

  // Option 2: Uploaded datasource (Excel file parsed and stored in DB)
  uploaded_datasource_id?: number;
  selected_sheet?: string; // Which sheet to use from uploaded Excel

  // Common fields
  selected_columns?: string[];
  where_clause?: string;

  // Legacy Excel-specific metadata (deprecated, use uploaded_datasource_id instead)
  excel_config?: {
    file_path: string;
    sheet_name: string;
    range?: string; // e.g., "A:H1900" or "A1:H1900"
    has_header: boolean;
    columns?: string[]; // Selected columns (either names or A, B, C...)
  };
}

// Folder interface
export interface Folder {
  folder_id: number;
  folder_name: string;
  parent_folder_id: number | null;
  description: string | null;
  color: string | null;
  icon: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Computed fields
  children?: Folder[];
  validation_count?: number;
}

// Validation interface
export interface Validation {
  validation_id: number;
  validation_name: string;
  folder_id?: number | null; // Folder this validation belongs to
  description: string;

  // Legacy single-source fields
  left_connection_id?: number;
  right_connection_id?: number;
  left_query?: string;
  right_query?: string;

  // New multi-source fields
  left_sources?: SourceDefinition[];
  right_sources?: SourceDefinition[];

  left_pipeline?: any;
  right_pipeline?: any;
  key_fields: string[];
  compare_fields: string[];
  match_strategy: MatchStrategy;
  fuzzy_threshold?: number;
  schedule_cron?: string;
  status: ValidationStatus;
}

// Validation result interface
export interface ValidationResult {
  result_id: number;
  validation_id: number;
  execution_timestamp: string;
  execution_status: ExecutionStatus;
  execution_time_ms: number;
  total_left: number;
  total_right: number;
  matched: number;
  left_only: number;
  right_only: number;
  differences: number;
  match_percentage: number;
  summary_json?: any;
  error_message?: string;
}

// Comparison summary
export interface ComparisonSummary {
  total_left: number;
  total_right: number;
  matched: number;
  left_only: number;
  right_only: number;
  differences: number;
}

// Comparison result details
export interface ComparisonDetails {
  matched_records: any[];
  matched_with_differences: any[];
  left_only_records: any[];
  right_only_records: any[];
  differences_by_record: Record<string, any>;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form data types
export interface ConnectionFormData {
  connection_name: string;
  description: string;
  source_type: SourceType;
  host?: string;
  port?: number;
  database_name?: string;
  username?: string;
  password?: string;
  connection_config?: any; // For SAP: { ashost, sysnr, client, vault_path, lang }
}

export interface ValidationFormData {
  validation_name: string;
  description: string;
  left_connection_id: number;
  right_connection_id: number;
  left_query: string;
  right_query: string;
  key_fields: string;
  compare_fields: string;
  match_strategy: MatchStrategy;
  fuzzy_threshold?: number;
}

// Pipeline operation types
export type JoinType = 'inner' | 'left' | 'right' | 'outer';
export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null';
export type LogicOperator = 'and' | 'or';
export type AggregateFunction = 'sum' | 'avg' | 'min' | 'max' | 'count';

// Join operation
export interface JoinOperation {
  operation: 'join';
  output_name?: string; // Name for the result (e.g., "joined_data")
  left: string;
  right: string;
  join_type: JoinType;
  condition: {
    left_key: string;
    right_key: string;
  };
  // Column selection (optional - if not specified, selects all columns)
  left_columns?: string[]; // Columns to select from left table
  right_columns?: string[]; // Columns to select from right table
}

// Filter operation
export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: any;
}

export interface FilterOperation {
  operation: 'filter';
  output_name?: string; // Name for referencing in later operations
  source_id?: string; // Source to operate on (required if first operation)
  conditions: FilterCondition[];
  logic: LogicOperator;
}

// Consolidate operation
export interface Aggregation {
  field: string;
  function: AggregateFunction;
  alias?: string;
}

export interface ConsolidateOperation {
  operation: 'consolidate';
  output_name?: string; // Name for the aggregated result
  group_by: string[];
  aggregations: Aggregation[];
}

// Map operation
export interface FieldMapping {
  type: 'rename' | 'derive' | 'drop';
  source_field?: string;
  target_field: string;
  expression?: string;
}

export interface MapOperation {
  operation: 'map';
  output_name?: string; // Name for the transformed result
  mappings: FieldMapping[];
}

// Lookup operation
export interface LookupOperation {
  operation: 'lookup';
  output_name?: string; // Name for the filtered result
  source_id?: string; // Source to operate on (required if first operation)
  filter_column: string; // Column in current pipeline to filter
  lookup_source_id: string; // Source ID to lookup against (e.g., "source_3")
  lookup_column: string; // Column in lookup source to match against
  match_type: 'include' | 'exclude'; // Keep matches or remove them
}

// Deduplicate operation
export type DeduplicationStrategyType = 'first' | 'last';

export interface DeduplicateOperation {
  operation: 'deduplicate';
  output_name?: string; // Name for the deduplicated result
  source_id?: string; // Source to operate on (required if first operation)
  keys: string[]; // Columns to identify duplicates
  strategy: DeduplicationStrategyType; // Which duplicate to keep
}

// Union of all operation types
export type TransformOperation =
  | JoinOperation
  | FilterOperation
  | ConsolidateOperation
  | MapOperation
  | LookupOperation
  | DeduplicateOperation;

// Pipeline configuration
export interface PipelineConfig {
  operations: TransformOperation[];
}

// Excel metadata
export interface ExcelSheetInfo {
  sheet_name: string;
  row_count: number;
  column_count: number;
}

export interface ExcelMetadata {
  file_path: string;
  sheets: ExcelSheetInfo[];
  has_header: boolean;
  columns: string[]; // Either header names or A, B, C...
}

// Unified DataSource
export interface DataSource {
  id: string; // Unique identifier: "connection_name.table_name"
  display_name: string; // Table/Sheet name
  connection_id: number;
  connection_name: string;
  source_type: SourceType;

  // Database-specific
  database_name?: string;
  table_name?: string;

  // Excel-specific
  file_path?: string;
  sheet_name?: string;

  // Uploaded datasource
  uploaded_datasource_id?: number;
  sheets?: Array<{
    sheet_name: string;
    columns: string[];
    data: any[];
  }>;

  // Metadata
  row_count?: number;
  column_count?: number;
  columns?: string[];
}
