// import { FieldRule, Validation } from '../types';
// import { StepResult } from '../types/deriveColumn';
// import { create } from 'zustand';

// interface TableMapping {
//   primary_table: string;
//   primary_table_field: string;
//   foriegn_table: string;
//   foriegn_table_field: string;
//   cardinality: string;
// }

// interface ValidationState {
//   primary_table: string;
//   primary_key_fields: string;
//   primary_key_value: string;
//   selected_secondary_tables: string;
//   field_rules: FieldRule[];
//   table_mappings: TableMapping[];
//   leftRowData: any | null;
//   rightRowData: any | null;
//   isAggregateMode: boolean;
//   aggregateFieldId: string | null;
//   leftAggregateData: any[] | null;
//   rightAggregateData: any[] | null;
//   key1Results: StepResult[] | null;
//   key2Results: StepResult[] | null;
//   setPrimaryTable: (table: string) => void;
//   setPrimaryKeyFields: (fields: string) => void;
//   setPrimaryKeyValue: (value: string) => void;
//   setSelectedSecondaryTables: (tables: string) => void;
//   setFieldRules: (rules: FieldRule[]) => void;
//   setTableMappings: (mappings: TableMapping[]) => void;
//   setLeftRowData: (data: any | null) => void;
//   setRightRowData: (data: any | null) => void;
//   setAggregateMode: (fieldId: string | null) => void;
//   setLeftAggregateData: (data: any[] | null) => void;
//   setRightAggregateData: (data: any[] | null) => void;
//   setKey1Results: (results: StepResult[] | null) => void;
//   setKey2Results: (results: StepResult[] | null) => void;
//   setInitialState: (data: Validation) => void;
//   reset: () => void;
// }

// const initialState: Omit<ValidationState, 'setPrimaryTable' | 'setPrimaryKeyFields' | 'setPrimaryKeyValue' | 'setSelectedSecondaryTables' | 'setFieldRules' | 'setTableMappings' | 'setLeftRowData' | 'setRightRowData' | 'setAggregateMode' | 'setLeftAggregateData' | 'setRightAggregateData' | 'setKey1Results' | 'setKey2Results' | 'setInitialState' | 'reset'> = {
//   primary_table: '',
//   primary_key_fields: '',
//   primary_key_value: '',
//   selected_secondary_tables: '',
//   field_rules: [],
//   table_mappings: [],
//   leftRowData: null,
//   rightRowData: null,
//   isAggregateMode: false,
//   aggregateFieldId: null,
//   leftAggregateData: null,
//   rightAggregateData: null,
//   key1Results: null,
//   key2Results: null,
// };

// export const useValidationStore = create<ValidationState>((set) => ({
//   ...initialState,
//   setPrimaryTable: (table) => set({ 
//     primary_table: table, 
//     primary_key_fields: '', 
//     primary_key_value: '', 
//     selected_secondary_tables: '',
//     table_mappings: [] // Reset mappings when primary table changes
//   }),
//   setPrimaryKeyFields: (fields) => set({ primary_key_fields: fields }),
//   setPrimaryKeyValue: (value) => set({ primary_key_value: value }),
//   setSelectedSecondaryTables: (tables) => set({ selected_secondary_tables: tables }),
//   setFieldRules: (rules) => set({ field_rules: rules }),
//   setTableMappings: (mappings) => set({ table_mappings: mappings }),
//   setLeftRowData: (data) => set({ leftRowData: data }),
//   setRightRowData: (data) => set({ rightRowData: data }),
//   setAggregateMode: (fieldId) => set({ isAggregateMode: !!fieldId, aggregateFieldId: fieldId }),
//   setLeftAggregateData: (data) => set({ leftAggregateData: data }),
//   setRightAggregateData: (data) => set({ rightAggregateData: data }),
//   setKey1Results: (results) => set({ key1Results: results }),
//   setKey2Results: (results) => set({ key2Results: results }),
//   setInitialState: (data) => set({
//     primary_table: data.primary_table || '',
//     primary_key_fields: data.primary_key_fields?.join(',') || '',
//     primary_key_value: data.primary_key_value || '',
//     selected_secondary_tables: data.selected_secondary_tables?.join(',') || '',
//     field_rules: data.field_rules || [],
//     table_mappings: data.table_mappings || [],
//     leftRowData: null, // Reset sample data on new initial state
//     rightRowData: null,
//     key1Results: null,
//     key2Results: null,
//   }),
//   reset: () => set(initialState),
// }));
import type { FieldRule, Validation } from "../types"
import type { StepResult } from "../types/deriveColumn"
import { create } from "zustand"

interface TableMapping { 
  primary_table: string
  primary_table_field: string
  foreign_table: string
  foreign_table_field: string
  cardinality: string
}

interface FieldOperationState {
  targetOperation: string | string[]
  sourceOperation: string | string[]
  targetOperationParams: Record<string, any>
  sourceOperationParams: Record<string, any>
}

interface ValidationState {  
  primary_table: string
  primary_key_fields: string
  primary_key_value: string
  selected_secondary_tables: string
  field_rules: FieldRule[]
  table_mappings: TableMapping[]
  leftRowData: any | null
  rightRowData: any | null
  isAggregateMode: boolean
  aggregateFieldId: string | null
  leftAggregateData: any[] | null
  rightAggregateData: any[] | null
  key1Results: StepResult[] | null
  key2Results: StepResult[] | null
  system_number: string
  system_number_label: string
  client_id: string
  client_id_label: string
  database_connection: string
  fieldOperations: Record<string, FieldOperationState>
  setPrimaryTable: (table: string) => void
  setPrimaryKeyFields: (fields: string) => void
  setPrimaryKeyValue: (value: string) => void
  setSelectedSecondaryTables: (tables: string) => void
  setFieldRules: (rules: FieldRule[]) => void
  setTableMappings: (mappings: TableMapping[]) => void
  setLeftRowData: (data: any | null) => void
  setRightRowData: (data: any | null) => void
  setAggregateMode: (fieldId: string | null) => void
  setLeftAggregateData: (data: any[] | null) => void
  setRightAggregateData: (data: any[] | null) => void
  setKey1Results: (results: StepResult[] | null) => void
  setKey2Results: (results: StepResult[] | null) => void
  setSystemNumber: (systemNumber: string) => void
  setSystemNumberLabel: (systemNumberLabel: string) => void
  setClientId: (clientId: string) => void
  setClientIdLabel: (clientIdLabel: string) => void
  setDatabaseConnection: (connection: string) => void
  setFieldOperations: (fieldId: string, operations: FieldOperationState) => void
  setInitialState: (data: Validation) => void
  reset: () => void
}

const initialState: Omit<
  ValidationState,
  | "setPrimaryTable"
  | "setPrimaryKeyFields"
  | "setPrimaryKeyValue"
  | "setSelectedSecondaryTables"
  | "setFieldRules"
  | "setTableMappings"
  | "setLeftRowData"
  | "setRightRowData"
  | "setAggregateMode"
  | "setLeftAggregateData"
  | "setRightAggregateData"
  | "setKey1Results"
  | "setKey2Results"
  | "setSystemNumber"
  | "setSystemNumberLabel"
  | "setClientId"
  | "setClientIdLabel"
  | "setDatabaseConnection"
  | "setFieldOperations"
  | "setInitialState"
  | "reset"
> = {               
  primary_table: "",
  primary_key_fields: "",
  primary_key_value: "",
  selected_secondary_tables: "",
  field_rules: [],
  table_mappings: [],
  leftRowData: null,
  rightRowData: null,
  isAggregateMode: false,
  aggregateFieldId: null,
  leftAggregateData: null,
  rightAggregateData: null,
  key1Results: null,
  key2Results: null,
  system_number: "",
  system_number_label: "",
  client_id: "",
  client_id_label: "",
  database_connection: "",
  fieldOperations: {},
}

export const useValidationStore = create<ValidationState>((set, get) => ({
  ...initialState,
  setPrimaryTable: (table) => {  
    set({  
      primary_table: table,
      primary_key_fields: "",
      primary_key_value: "",
      selected_secondary_tables: "",
      table_mappings: [],
    })
  },
  setPrimaryKeyFields: (fields) => {
    console.log("[v0] Setting primary key fields:", fields)
    set({ primary_key_fields: fields })
  },
  setPrimaryKeyValue: (value) => {
    console.log("[v0] Setting primary key value:", value)
    set({ primary_key_value: value })
  },
  setSelectedSecondaryTables: (tables) => {
    console.log("[v0] Setting secondary tables:", tables)
    set({ selected_secondary_tables: tables })
  },
  setFieldRules: (rules) => {
    console.log("[v0] Setting field rules:", rules.length, "rules")
    set({ field_rules: rules })
  },
  setTableMappings: (mappings) => {
    console.log("[v0] Setting table mappings:", mappings)
    set({ table_mappings: mappings })
  },
  setLeftRowData: (data) => {
    console.log("[v0] Setting left row data:", data)
    set({ leftRowData: data })
  },
  setRightRowData: (data) => {
    console.log("[v0] Setting right row data:", data)
    set({ rightRowData: data })
  },
  setAggregateMode: (fieldId) => {
    console.log("[v0] Setting aggregate mode:", fieldId)
    set({ isAggregateMode: !!fieldId, aggregateFieldId: fieldId })
  },
  setLeftAggregateData: (data) => {
    console.log("[v0] Setting left aggregate data:", data)
    set({ leftAggregateData: data })
  },
  setRightAggregateData: (data) => {
    console.log("[v0] Setting right aggregate data:", data)
    set({ rightAggregateData: data })
  },
  setKey1Results: (results) => {
    console.log("[v0] Setting key1 results:", results)
    set({ key1Results: results })
  },
  setKey2Results: (results) => {
    console.log("[v0] Setting key2 results:", results)
    set({ key2Results: results })
  },
  setSystemNumber: (systemNumber) => {
    console.log("[v0] Setting system number:", systemNumber)
    set({ system_number: systemNumber })
  },
  setSystemNumberLabel: (systemNumberLabel) => {
    console.log("[v0] Setting system number label:", systemNumberLabel)
    set({ system_number_label: systemNumberLabel })
  },
  setClientId: (clientId) => {
    console.log("[v0] Setting client ID:", clientId)
    set({ client_id: clientId })
  },
  setClientIdLabel: (clientIdLabel) => {
    console.log("[v0] Setting client ID label:", clientIdLabel)
    set({ client_id_label: clientIdLabel })
  },
  setDatabaseConnection: (connection) => {
    console.log("[v0] Setting database connection:", connection)
    set({ database_connection: connection })
  },
  setFieldOperations: (fieldId, operations) => {
    console.log("[v0] Setting field operations for:", fieldId, operations)
    const currentOps = get().fieldOperations
    set({ 
      fieldOperations: {
        ...currentOps,
        [fieldId]: operations
      }
    })
  },
  setInitialState: (data) => {
    console.log("[v0] Setting initial state from data:", data)
    set({
      primary_table: data.primary_table || "",
      primary_key_fields: data.primary_key_fields?.join(",") || "",
      primary_key_value: data.primary_key_value || "",
      selected_secondary_tables: data.selected_secondary_tables?.join(",") || "",
      field_rules: data.field_rules || [],
      table_mappings: data.table_mappings || [],
      leftRowData: null, // Reset sample data on new initial state
      rightRowData: null,
      key1Results: null,
      key2Results: null,
      system_number: data.system_number || "",
      system_number_label: data.system_number_label || "",
      client_id: data.client_id || "",
      client_id_label: data.client_id_label || "",
      database_connection: data.database_connection || "",
    })
  },
  reset: () => {
    console.log("[v0] Resetting validation store")
    set(initialState)
  },
}))
