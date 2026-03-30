import type React from "react"
import { useState, useMemo, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { type ColumnDef } from "@tanstack/react-table"
import { Button } from "../ui/button"
import { ArrowLeft, Plus, Trash2, Filter, Save, Loader2, Settings, PlayCircle } from "lucide-react"
import type { FieldRule, ExpectedValueType, TableData } from "../types"
import { toast } from "sonner"
import { executeValidationComponent } from "../API/validationApi"
import ValidationResultsModal from "../ValidationResultsModal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { cn } from "../lib/utils"
import { ValueTypeConfiguration } from "../ValueTypeConfiguration"
import SearchBar from "../../../utils/SearchBar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import DropdownV2 from "../../../utils/DropdownV2"
import { useValidationStore } from "../Stores/validationStore"
import { Badge } from "../ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { TableFieldConfiguration } from "../TableFieldConfiguration"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { runDatabaseAction } from "../API/apiService"
import { Label } from "../ui/label"
import { Input } from "../ui/input"

interface FieldRulesEditorProps {
  selectedRow: any
  tableData: TableData[]
  onSaveRules: () => void
  onSaveValidation?: (payload: any) => void
  isSaving: boolean
  onBack: () => void
  filterValues: any
  isReadOnly?: boolean
  primary_table?: string
  primary_key_fields?: string
  primary_key_value?: string
  onExecuteValidation?: () => void
}

const expectedValueTypeOptions: { value: ExpectedValueType; label: string }[] = [
  { value: "constant_value", label: "Constant Value" },
  { value: "table_field", label: "Table Field" },
  { value: "global_key", label: "Global Key" },
  { value: "combination_key", label: "Combination Key" },
  { value: "formula", label: "Formula" },
]

export const FieldRulesEditor: React.FC<FieldRulesEditorProps> = ({
  selectedRow,
  tableData,
  onSaveRules,
  onSaveValidation,
  isSaving,
  onBack,
  filterValues,
  isReadOnly = false,
  primary_table,
  primary_key_fields,
  primary_key_value,
  onExecuteValidation,
}) => {
  const {
    field_rules,
    setFieldRules,
    setAggregateMode,
    primary_table: storePrimaryTable,
    primary_key_fields: storePrimaryKeyFields,
    primary_key_value: storePrimaryKeyValue,
    selected_secondary_tables,
    table_mappings,
    setKey1Results,
    setKey2Results,
    setLeftRowData,
    setRightRowData,
    setLeftAggregateData,
    setRightAggregateData,
  } = useValidationStore()
  
  // Use props if available, otherwise fall back to store values
  const currentPrimaryTable = primary_table || storePrimaryTable
  const currentPrimaryKeyFields = primary_key_fields || storePrimaryKeyFields
  const currentPrimaryKeyValue = primary_key_value || storePrimaryKeyValue
  const [configuringField, setConfiguringField] = useState<FieldRule | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTableFilter, setActiveTableFilter] = useState("")
  const [showAddTablesDialog, setShowAddTablesDialog] = useState(false)
  const [tablesFromApi, setTablesFromApi] = useState<Array<{value: string, label: string, description?: string}>>([])
  const [selectedTable, setSelectedTable] = useState("")
  const [isLoadingTables, setIsLoadingTables] = useState(false)
  const [fieldsFromApi, setFieldsFromApi] = useState<Array<{value: string, label: string, description?: string}>>([])
  const [selectedField, setSelectedField] = useState("")
  const [isLoadingFields, setIsLoadingFields] = useState(false)
  
  // Button click states
  const [isAddTablesClicked, setIsAddTablesClicked] = useState(false)
  const [isAddRuleClicked, setIsAddRuleClicked] = useState(false)
  const [isSaveRulesClicked, setIsSaveRulesClicked] = useState(false)
  const [isSaveValidationClicked, setIsSaveValidationClicked] = useState(false)
  const [isCancelClicked, setIsCancelClicked] = useState(false)
  const [isExecuteValidationClicked, setIsExecuteValidationClicked] = useState(false)
  const [isExecutingValidation, setIsExecutingValidation] = useState(false)
  const [validationResults, setValidationResults] = useState<any>(null)
  const [isValidationResultsOpen, setIsValidationResultsOpen] = useState(false)
  const [constantValue, setConstantValue] = useState("")
  const [isSaveConfigurationClicked, setIsSaveConfigurationClicked] = useState(false)
  const [isCancelConfigurationClicked, setIsCancelConfigurationClicked] = useState(false)
  const [formulaValue, setFormulaValue] = useState("")
  const [formulaOperation, setFormulaOperation] = useState("")
  const [isFormulaConfigClicked, setIsFormulaConfigClicked] = useState(false)
  
  const formulaOperationOptions = [
    { value: "empty", label: "Empty" },
    { value: "not_empty", label: "Not Empty" },
    { value: "contains", label: "Contains" },
    { value: "notnull", label: "Not Null" },
    { value: "isnull", label: "Is Null" },
    { value: "greater_than", label: "Greater Than" },
    { value: "less_than", label: "Less Than" },
  ]

  const handleConfigureClick = (rule: FieldRule) => {
    console.log("[DEBUG-1] ============ SETTINGS BUTTON CLICKED ============")
    console.log("[DEBUG-1] Rule:", rule.unique_id, rule.TableName, rule.FieldName)

    if (!rule.unique_id) {
      toast.error("Please select a Table.Field before configuring.")
      return
    }

    // Toggle behavior: if clicking the same field that's already being configured, close it
    if (configuringField?.ui_id === rule.ui_id) {
      console.log("[DEBUG-1] Closing configuration for:", rule.unique_id)
      setConfiguringField(null)
      setAggregateMode(null)
      return
    }

    const isPreviouslyAggregate = rule.config?.key_config
      ? Array.isArray(rule.config.key_config)
        ? rule.config.key_config.some((kc: any) => kc.operation_category === "aggregation")
        : rule.config.key_config.operation_category === "aggregation"
      : false

    console.log("[DEBUG-1] Checking if rule is aggregate:", isPreviouslyAggregate, rule.config)

    if (isPreviouslyAggregate) {
      console.log("[DEBUG-1] Setting aggregate mode for:", rule.unique_id)
      setAggregateMode(rule.unique_id)
    } else {
      console.log("[DEBUG-1] Clearing aggregate mode")
      setAggregateMode(null)
    }

    if (rule.expectedValueType === "constant_value") {
      console.log("[DEBUG-1] Resetting state for constant_value type")
      setKey1Results(null)
      setKey2Results(null)
      setLeftRowData(null)
      setRightRowData(null)
      setLeftAggregateData([])
      setRightAggregateData([])
      console.log("[DEBUG-1] Reset all connections and sample output data for constant value type")
      // Initialize constant value from rule
      setConstantValue(rule.expectedValue || "")
    }

    if (rule.expectedValueType === "formula") {
      console.log("[DEBUG-1] Resetting state for formula type")
      setKey1Results(null)
      setKey2Results(null)
      setLeftRowData(null)
      setRightRowData(null)
      setLeftAggregateData([])
      setRightAggregateData([])
      console.log("[DEBUG-1] Reset all connections and sample output data for formula type")
      // Initialize formula value and operation from rule config
      const config = rule.config || {}
      setFormulaValue(rule.expectedValue || "")
      setFormulaOperation((config as any).operation_category || (config as any).operationCategory || "")
      setIsSaveConfigurationClicked(false)
    }

    console.log("[DEBUG-1] Setting configuring field to:", rule.unique_id)
    setConfiguringField(rule)
    console.log("[DEBUG-1] ============ SETTINGS BUTTON HANDLER COMPLETE ============")
  }

  const handleAggregateClick = (rule: FieldRule) => {
    if (isReadOnly || !rule.unique_id) {
      return
    }

    const { isAggregateMode, aggregateFieldId } = useValidationStore.getState()
    const isThisRuleCurrentlyAggregate = isAggregateMode && aggregateFieldId === rule.unique_id

    if (isThisRuleCurrentlyAggregate) {
      setAggregateMode(null)
      // Update the rule config to remove aggregation
      setFieldRules(
        field_rules.map((r) => {
          if (r.ui_id === rule.ui_id) {
            const updatedConfig = { ...r.config }
            if (updatedConfig.key_config) {
              if (Array.isArray(updatedConfig.key_config)) {
                updatedConfig.key_config = updatedConfig.key_config.map((kc: any) => ({
                  ...kc,
                  operation_category:
                    kc.operation_category === "aggregation" ? "transformation" : kc.operation_category,
                }))
              } else {
                updatedConfig.key_config = {
                  ...updatedConfig.key_config,
                  operation_category:
                    updatedConfig.key_config.operation_category === "aggregation"
                      ? "transformation"
                      : updatedConfig.key_config.operation_category,
                }
              }
            }
            return { ...r, config: updatedConfig }
          }
          return r
        }),
      )
      toast.info("Aggregation mode disabled.")
    } else {
      setAggregateMode(rule.unique_id)
      toast.info("Aggregation mode enabled for this rule.")
    }
  }

  const uniqueTableNames = useMemo(() => { 
    // Get selected tables from validation configuration
    const selectedTables: string[] = []

    // Add primary table
    if (currentPrimaryTable) {  
      selectedTables.push(currentPrimaryTable)
    }

    // Add secondary tables
    if (selected_secondary_tables) {  
      const secondaryTables = typeof selected_secondary_tables === 'string'
        ? selected_secondary_tables.split(',').map((t: string) => t.trim()).filter(Boolean)
        : Array.isArray(selected_secondary_tables)
        ? selected_secondary_tables
        : []
      selectedTables.push(...secondaryTables)
    }

    // Remove duplicates and add "All" at the beginning
    return ["All", ...Array.from(new Set(selectedTables))]
  }, [currentPrimaryTable, selected_secondary_tables])
  
  // Handle Save Validation
  const handleSaveValidation = () => {
    if (!onSaveValidation) {
      toast.error("Save validation handler not available")
      return
    }
    
    setIsSaveValidationClicked(true)
    
    // Get all data from the store
    const {
      primary_table: storePrimaryTable,
      primary_key_fields: storePrimaryKeyFields,
      primary_key_value: storePrimaryKeyValue,
      selected_secondary_tables,
      field_rules,
      table_mappings,
      system_number,
      system_number_label,
      client_id,
      client_id_label,
      database_connection,
    } = useValidationStore.getState()
    
    const payload: any = {
      validation_id: filterValues.validation_id,
      primary_table: currentPrimaryTable || "",
      selected_secondary_tables: selected_secondary_tables ? (typeof selected_secondary_tables === 'string' ? selected_secondary_tables.split(',').map(t => t.trim()) : selected_secondary_tables) : [],
      primary_key_fields: currentPrimaryKeyFields ? currentPrimaryKeyFields.split(",") : [],
      primary_key_value: currentPrimaryKeyValue || "",
      field_rules: field_rules,
      table_mappings: table_mappings,
      system_number: system_number || "",
      system_number_label: system_number_label || "",
      client_id: client_id || "",
      client_id_label: client_id_label || "",
      database_connection: database_connection || "",
    }
    
    console.log("Saving validation with payload:", payload)
    onSaveValidation(payload)
  }
  
  // Handle Execute Validation
  const handleExecuteValidation = async () => {
    // Validation checks
    if (!filterValues.validation_id) {
      toast.error("Validation ID is required to execute validation.")
      return
    }

    if (!currentPrimaryTable) {
      toast.error("Please select a primary table.")
      return
    }

    const primaryKeyFieldsArray = currentPrimaryKeyFields ? currentPrimaryKeyFields.split(",").map((f) => f.trim()) : []
    if (primaryKeyFieldsArray.length === 0) {
      toast.error("Please select at least one primary key field.")
      return
    }

    if (!currentPrimaryKeyValue) {
      toast.error("Please provide a primary key value.")
      return
    }

    setIsExecuteValidationClicked(true)
    setIsExecutingValidation(true)

    try {
      // Construct the parameters object
      const parameters: Record<string, any> = {}

      // Create parameter key in format "TABLE.FIELD" and set the value
      primaryKeyFieldsArray.forEach((field) => {
        const parameterKey = `${currentPrimaryTable}.${field}`
        parameters[parameterKey] = currentPrimaryKeyValue
      })

      const payload = {
        validation_id: filterValues.validation_id,
        parameters,
      }

      console.log("Executing validation with payload:", payload)

      const response = await executeValidationComponent(payload)

      // Store the results and open the modal
      setValidationResults(response)
      setIsValidationResultsOpen(true)

      toast.success("Validation executed successfully!")
      console.log("Validation execution response:", response)
    } catch (error: any) {
      console.error("Error executing validation:", error)
      toast.error(error?.message || "Failed to execute validation.")
    } finally {
      setIsExecutingValidation(false)
    }
  }

  useEffect(() => {
    if (uniqueTableNames.length > 0 && !activeTableFilter) {
      setActiveTableFilter(uniqueTableNames[0])
    }
  }, [uniqueTableNames, activeTableFilter])

  const filteredRules = useMemo(() => {
    let rules = field_rules
    if (activeTableFilter && activeTableFilter !== "All") {
      rules = rules.filter((rule) => rule.TableName === activeTableFilter)
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      rules = rules.filter(
        (rule) =>
          rule.TableName?.toLowerCase().includes(query) ||
          rule.FieldName?.toLowerCase().includes(query) ||
          rule.Description?.toLowerCase().includes(query) ||
          String(rule.expectedValue)?.toLowerCase().includes(query) ||
          rule.expectedValueType?.toLowerCase().includes(query),
      )
    }
    return rules
  }, [field_rules, activeTableFilter, searchQuery])

  useEffect(() => {
    setConfiguringField(null)
  }, [activeTableFilter, searchQuery])

  const allPossibleFieldOptions = useMemo(
    () => {
      const allFields = (tableData || []).flatMap((table) =>
        table.Fields.map((field) => {
          const textValue = `${table.TableName}.${field.FieldName}`
          const desc = field.Description || field.description || ""
          const isKey = field.KeyField === "Yes"
          const isVerification = field.VerificationField === "Yes"
          
          // Use ReactNode label with styled K/V badges
          const label = (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span>{textValue}</span>
              {desc && <span className="text-gray-600">-</span>}
              {desc && <span className="text-gray-600">{desc}</span>}
              <div className="flex items-center gap-1">
                {isKey && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white bg-blue-500">K</span>}
                {isVerification && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white bg-green-500">V</span>}
              </div>
            </div>
          )
          
          return {
            value: textValue,
            label: label,
            text: textValue,
            isKey,
            isVerification,
            description: desc,
          }
        }),
      )
      
      // Remove duplicates based on value property
      const seen = new Set<string>()
      return allFields.filter((field) => {
        if (seen.has(field.value)) {
          return false
        }
        seen.add(field.value)
        return true
      })
    },
    [tableData],
  )

  const handleRuleChange = useCallback(
    (ui_id: string, field: keyof FieldRule, value: any) => {
      if (isReadOnly) return
      setFieldRules(
        field_rules.map((rule) => {
          if (rule.ui_id === ui_id) {
            return { ...rule, [field]: value }
          }
          return rule
        }),
      )
    },
    [field_rules, setFieldRules, isReadOnly],
  )

  const handleRemoveRule = useCallback(
    (ui_id: string) => {
      if (isReadOnly) return
      setFieldRules(field_rules.filter((rule) => rule.ui_id !== ui_id))
      toast.success("Field rule removed.")
    },
    [field_rules, setFieldRules, isReadOnly],
  )

  const handleSaveRuleConfig = useCallback(
    (ui_id: string, newUpdates: Partial<FieldRule>) => {
      setFieldRules(
        field_rules.map((rule) => {
          if (rule.ui_id === ui_id) {
            const updatedRule = {
              ...rule,
              ...newUpdates,
              config: { ...(rule.config || {}), ...newUpdates.config, is_configured: true },
            }
            return updatedRule
          }
          return rule
        }),
      )
      setConfiguringField(null)
      setAggregateMode(null)
      toast.success("Rule configuration saved locally.")
    },
    [field_rules, setFieldRules, setAggregateMode],
  )

  const handleSaveAndNext = useCallback(() => {
    // First save the current rules
    onSaveRules()
    
    // Then add a new rule
    if (!isReadOnly) {
      const newRule: FieldRule = {
        ui_id: crypto.randomUUID(),
        unique_id: "",
        TableName: "",
        FieldName: "",
        Description: "",
        isKey: true,
        isValidation: false,
        isDisplay: false,
        isComparative: false,
        expectedValueType: "" as ExpectedValueType,
        expectedValue: "",
        primaryKeyValue: "",
        relationKeys: [],
        dataType: "string",
        sampleValue: "NEW_SAMPLE",
        config: {},
        displayValue: "",
        leftField: "",
        operator: "",
        rightField: "",
        KeyField: "",
        VerificationField: "",
        TableId: "",
        FieldId: "",
      }
      setFieldRules([...field_rules, newRule])
      setConfiguringField(newRule)
      toast.success("Rules saved and new rule added. Configure the new field and validation settings.")
    }
  }, [onSaveRules, field_rules, setFieldRules, isReadOnly])

  const handleAddRule = useCallback(() => {
    if (isReadOnly) return
    const newRule: FieldRule = {
      ui_id: crypto.randomUUID(),
      unique_id: "",
      TableName: "",
      FieldName: "",
      Description: "",
      isKey: true,
      isValidation: false,
      isDisplay: false,
      isComparative: false,
      expectedValueType: "" as ExpectedValueType,
      expectedValue: "",
      primaryKeyValue: "",
      relationKeys: [],
      dataType: "string",
      sampleValue: "NEW_SAMPLE",
      config: {},
      displayValue: "",
      leftField: "",
      operator: "",
      rightField: "",
      KeyField: "",
      VerificationField: "",
      TableId: "",
      FieldId: "",
    }
    setFieldRules([...field_rules, newRule])
    setConfiguringField(newRule)
    toast.info("New rule added. Configure the field and validation settings.")
  }, [field_rules, setFieldRules, isReadOnly])

  const handleAddTablesClick = () => {
    // Show dialog immediately
    setShowAddTablesDialog(true)
    
    // Fetch tables in background
    fetchTablesData()
  }

  const fetchTablesData = async () => {
    setIsLoadingTables(true)
    try {
      // Get the TCode from the validation configuration
      const tcode = filterValues?.tcode || "VA01" // Default to VA01 if not available
      
      console.log("Fetching tables for TCode:", tcode)
      
      const response = await runDatabaseAction({
        payload: {
          actions: "execute_pyrfc",
          connection: filterValues?.database_connection || "18",
          protocol_type: "RFC",
          data: {
            function_name: "YSBAI_GET_TABLES_BY_TCODE",
            parameters: {
              IV_TCODE: tcode
            }
          }
        }
      })
      
      console.log("API Response:", response)
      
      if (response?.status && response?.data) {
        // Transform the API response to dropdown options format
        // The response contains ET_TABLES array with TABNAME and TABDESCRIPTION
        const etTables = response.data?.ET_TABLES || response.data || []
        console.log("ET_TABLES:", etTables)
        
        const tables = etTables.map((table: any) => ({
          value: table.TABNAME,
          label: table.TABNAME,
          description: table.TABDESCRIPTION || ""
        }))
        
        console.log("Transformed tables:", tables)
        setTablesFromApi(tables)
        toast.success("Tables loaded successfully")
      } else {
        console.error("Invalid response:", response)
        toast.error("Failed to load tables - Invalid response")
      }
    } catch (error) {
      console.error("Failed to fetch tables:", error)
      toast.error("Failed to fetch tables from API")
    } finally {
      setIsLoadingTables(false)
    }
  }

  const fetchFieldsData = async (tableName: string) => {
    setIsLoadingFields(true)
    setSelectedField("")
    setFieldsFromApi([])
    try {
      console.log("Fetching fields for table:", tableName)
      
      const response = await runDatabaseAction({
        payload: {
          actions: "execute_pyrfc",
          connection: filterValues?.database_connection || "18",
          protocol_type: "RFC",
          data: {
            function_name: "YSBAI_GET_FIELDS_BY_TABLE",
            parameters: {
              IV_TABNAME: tableName
            }
          }
        }
      })
      
      console.log("Fields API Response:", response)
      
      if (response?.status && response?.data) {
        // Transform the API response to dropdown options format
        const etFields = response.data?.ET_FIELDS || response.data || []
        console.log("ET_FIELDS:", etFields)
        
        const fields = etFields.map((field: any) => ({
          value: field.FIELDNAME || field.FIELD_NAME,
          label: field.FIELDNAME || field.FIELD_NAME,
          description: field.FIELDTEXT || field.FIELD_DESCRIPTION || ""
        }))
        
        console.log("Transformed fields:", fields)
        setFieldsFromApi(fields)
        toast.success("Fields loaded successfully")
      } else {
        console.error("Invalid response:", response)
        toast.error("Failed to load fields - Invalid response")
      }
    } catch (error) {
      console.error("Failed to fetch fields:", error)
      toast.error("Failed to fetch fields from API")
    } finally {
      setIsLoadingFields(false)
    }
  }

  const handleTableChange = (value: string) => {
    setSelectedTable(value)
    if (value) {
      fetchFieldsData(value)
    }
  }

  const handleFieldSelection = useCallback(
    (ui_id: string, selectedValue: string | number) => {
      if (isReadOnly) return
      const new_unique_id = selectedValue as string

      if (!new_unique_id) {
        setFieldRules(
          field_rules.map((r) =>
            r.ui_id === ui_id
              ? {
                  ...r,
                  unique_id: "",
                  TableName: "",
                  FieldName: "",
                  Description: "",
                  sampleValue: "NEW_SAMPLE",
                  dataType: "string",
                }
              : r,
          ),
        )
        return
      }

      const [tableName, fieldName] = new_unique_id.split(".")
      const table = tableData.find((t) => t.TableName === tableName)
      const field = table?.Fields.find((f) => f.FieldName === fieldName)

      if (table && field) {
        const updatedRule: Partial<FieldRule> = {
          unique_id: new_unique_id,
          TableName: tableName,
          FieldName: fieldName,
          Description: field.Description,
          isKey: field.KeyField === "Yes",
          isValidation: field.VerificationField === "Yes",
          dataType: field.dataType || "string",
          sampleValue: field.sampleValue || `SAMPLE-${fieldName}`,
        }
        setFieldRules(field_rules.map((r) => (r.ui_id === ui_id ? { ...r, ...updatedRule } : r)))
      }
    },
    [field_rules, tableData, setFieldRules, isReadOnly],
  )

  const handleExpectedValueTypeChange = useCallback(
    (ui_id: string, value: ExpectedValueType) => {
      handleRuleChange(ui_id, "expectedValueType", value)
    },
    [handleRuleChange],
  )

  const getRuleValueSummary = (rule: FieldRule): React.ReactNode => {
    if (rule.config?.is_configured) {
      return <Badge variant="secondary">Configured</Badge>
    }
    if (rule.expectedValueType === "constant_value") {
      return rule.expectedValue ? (
        <span className="font-mono text-foreground truncate max-w-24" title={rule.expectedValue}>
          {rule.expectedValue}
        </span>
      ) : (
        <span className="text-muted-foreground text-xs">Not Set</span>
      )
    }
    return "Not Configured"
  }

  const columns = useMemo<ColumnDef<FieldRule>[]>(
    () => [
      {
        id: "tableField",
        header: "Table.Field",
        size: 260,
        cell: ({ row }) => {  
          const rule = row.original
          const currentSelection = rule.unique_id || ""
          
          return (
            <div className="w-[250px]">
              <DropdownV2
              options={allPossibleFieldOptions}
              value={currentSelection}
              onChange={(value) => handleFieldSelection(rule.ui_id!, value)}
              placeholder="Select Field..."
                searchable={true}
                size="small"
                Disabled={isReadOnly}
              />
            </div>
          )
        },
      },
      { accessorKey: "Description", header: "Description", size: 150 },
      {
        id: "expectedValueType",
        header: "Expected Value Type",
        size: 250,
        cell: ({ row }) => {    
          const rule = row.original
          
          const { isAggregateMode, aggregateFieldId } = useValidationStore.getState()
          const isThisRuleInAggregateMode = isAggregateMode && aggregateFieldId === rule.unique_id

          const isSavedAsAggregate = rule.config?.key_config
            ? Array.isArray(rule.config.key_config)
              ? rule.config.key_config.some((kc: any) => kc.operation_category === "aggregation")
              : rule.config.key_config.operation_category === "aggregation"
            : false

          const shouldShowAsSelected = isThisRuleInAggregateMode || isSavedAsAggregate
          const showAggregateButton = rule.expectedValueType === "table_field"

          return (  
            <div className="flex items-center gap-1">
              <div className="w-[200px]">
                <DropdownV2
                  options={expectedValueTypeOptions.map(opt => ({ label: opt.label, value: opt.value }))}
                  value={rule.expectedValueType || ""}
                  onChange={(value) => handleExpectedValueTypeChange(rule.ui_id!, value as ExpectedValueType)}
                  placeholder="Select type"
                  searchable={true}
                  size="small"
                  Disabled={isReadOnly}
                />
              </div>
              {showAggregateButton && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                        variant={shouldShowAsSelected ? "default" : "outline"}
                    size="icon"
                    className={cn(
                          "h-8 w-8 flex-shrink-0 font-bold",
                          !shouldShowAsSelected
                            ? "bg-white"
                            : ""
                    )}
                    onClick={() => handleAggregateClick(rule)}
                    disabled={isReadOnly}
                  >
                    <span className="text-xs">A</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enable Aggregation Mode</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
              )}
            </div>
          )
        },
      },
      {
        id: "expectedValue",
        header: "Expected Value/Rule",
        size: 150,
        cell: ({ row }) => {   
          const rule = row.original
          return (   
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={rule.config?.is_configured ? "default" : "outline"}
                      size="icon"
                      className={cn(
                        "h-8 w-8 flex-shrink-0",
                        !rule.config?.is_configured
                          ? "bg-white"
                          : ""
                      )}
                      onClick={() => handleConfigureClick(rule)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Configure Rule</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="text-xs text-muted-foreground truncate max-w-32">{getRuleValueSummary(rule)}</div>
            </div>
          )
        },
      },
      {
        id: "actions",
        header: "Actions",
        size: 80,
        cell: ({ row }) => (
          <div className="flex justify-center">
            {!isReadOnly && (
              <Button variant="ghost" size="icon" onClick={() => handleRemoveRule(row.original.ui_id!)}>
                <Trash2 className="text-destructive h-4 w-4" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [allPossibleFieldOptions, handleFieldSelection, handleExpectedValueTypeChange, handleRemoveRule, handleAggregateClick, isReadOnly],
  )

  const handleBackPress = () => {
    setConfiguringField(null)
    setAggregateMode(null)
  }

  const renderConfigurationUI = useCallback(() => {
    if (!configuringField) return null
    
    // Handle constant_value with simple text field
    if (configuringField.expectedValueType === "constant_value") {
      return (
        <div className="p-4 border border-gray-300 rounded-md bg-white">
          <div className="space-y-4">
            <div>
              <Label htmlFor="constant-value">Constant Value</Label>
              <Input
                id="constant-value"
                value={constantValue}
                onChange={(e) => setConstantValue(e.target.value)}
                placeholder="Enter constant value..."
                className="mt-1 w-64"
                disabled={isReadOnly}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant={isCancelConfigurationClicked ? "default" : "outline"}
                onClick={() => {
                  setIsCancelConfigurationClicked(true)
                  handleBackPress()
                }}
                className={
                  !isCancelConfigurationClicked
                    ? "bg-white"
                    : ""
                }
              >
                Cancel
              </Button>
              <Button
                variant={isSaveConfigurationClicked ? "default" : "outline"}
                className={
                  !isSaveConfigurationClicked
                    ? "bg-white"
                    : ""
                }
                onClick={() => {
                  if (!isSaveConfigurationClicked) {
                    setIsSaveConfigurationClicked(true)
                    const updates = {
                      expectedValue: constantValue,
                      config: {
                        is_configured: true,
                        constant_value: constantValue
                      }
                    }
                    handleSaveRuleConfig(configuringField.ui_id!, updates)
                  }
                }}
                disabled={isReadOnly || !constantValue.trim()}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Configuration
              </Button>
            </div>
          </div>
        </div>
      )
    }
    
    // Handle formula with text field and operation dropdown
    if (configuringField.expectedValueType === "formula") {
      return (
        <div className="p-4 border border-gray-300 rounded-md bg-white">
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-48">
                <Label htmlFor="formula-operation">Operation</Label>
                <div className="mt-1">
                  <DropdownV2
                    value={formulaOperation}
                    onChange={(value) => setFormulaOperation(value)}
                    options={formulaOperationOptions.map(opt => ({ label: opt.label, value: opt.value }))}
                    placeholder="Select operation"
                    searchable={true}
                    size="small"
                    Disabled={isReadOnly}
                  />
                </div>
              </div>
              <div className="w-48">
                <Label htmlFor="formula-value">Formula Value</Label>
                <Input
                  id="formula-value"
                  value={formulaValue}
                  onChange={(e) => setFormulaValue(e.target.value)}
                  placeholder="Enter formula value..."
                  className="mt-1"
                  disabled={isReadOnly}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant={isCancelConfigurationClicked ? "default" : "outline"}
                onClick={() => {
                  setIsCancelConfigurationClicked(true)
                  handleBackPress()
                }}
                className={
                  !isCancelConfigurationClicked
                    ? "bg-white"
                    : ""
                }
              >
                Cancel
              </Button>
              <Button
                variant={isFormulaConfigClicked ? "default" : "outline"}
                className={
                  !isFormulaConfigClicked
                    ? "bg-white"
                    : ""
                }
                onClick={() => {
                  if (!isFormulaConfigClicked) {
                    setIsFormulaConfigClicked(true)
                    const updates = {
                      expectedValue: formulaValue,
                      expectedValueType: "formula" as ExpectedValueType,
                      config: {
                        is_configured: true,
                        source_type: "formula" as ExpectedValueType,
                        operationCategory: formulaOperation as any
                      } as any
                    }
                    handleSaveRuleConfig(configuringField.ui_id!, updates)
                  }
                }}
                  disabled={isReadOnly || !formulaOperation}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Configuration
              </Button>
            </div>
          </div>
        </div>
      )
    }
    
    if (configuringField.expectedValueType === "table_field") {
      return (
        <TableFieldConfiguration
          field={configuringField}
          field_rules={field_rules}
          tableData={tableData}
          filterValues={filterValues}
          onSave={(updates) => handleSaveRuleConfig(configuringField.ui_id!, updates)}
          onCancel={handleBackPress}
          isReadOnly={isReadOnly}
        />
      )
    }
    
    return (
      <ValueTypeConfiguration
        key={configuringField.ui_id}
        field={configuringField}
        initialConfig={configuringField.config}
        tableData={tableData}
        onSave={(updates) => handleSaveRuleConfig(configuringField.ui_id!, updates)}
        onClose={handleBackPress}
        filterValues={filterValues}
        isReadOnly={isReadOnly}
      />
    )
  }, [configuringField, constantValue, formulaValue, formulaOperation, isSaveConfigurationClicked, isFormulaConfigClicked, isCancelConfigurationClicked, isReadOnly, handleSaveRuleConfig, field_rules, tableData, filterValues, handleBackPress, formulaOperationOptions])

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
  }

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.2,
      },
    },
  }

  return ( 
    <motion.div 
      className="flex flex-col h-full"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <motion.div 
        className="flex items-center justify-between p-2 border-b border-gray-300 gap-2"
        variants={itemVariants}
      >
        {/* Left side: Back button + Title */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft />
            </Button>
            <h3 className="text-lg font-semibold p-0">Configure Field Validations</h3>
        </div>
        
        {/* Right side: Tables dropdown + Search and Add Tables */}
            <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Tables:</span>
            <div className="w-64">
              <DropdownV2
                options={uniqueTableNames.map(name => ({ label: name, value: name }))}
                value={activeTableFilter}
                onChange={(value) => setActiveTableFilter(value)}
                placeholder="Select table..."
                searchable={true}
                size="small"
              />
            </div>
          </div>
          <div className="w-80">
            <SearchBar
              currentValue={searchQuery}
              onSearch={setSearchQuery}
              size="medium"
            />
          </div>
            {!isReadOnly && (
              <Button 
              variant={isAddTablesClicked ? "default" : "outline"} 
                size="sm" 
              onClick={() => {
                setIsAddTablesClicked(true)
                handleAddTablesClick()
              }}
                disabled={isLoadingTables}
              className={`whitespace-nowrap ${
                !isAddTablesClicked
                  ? "bg-white"
                  : ""
              }`}
              >
                {isLoadingTables ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" /> Add Tables
                  </>
                )}
              </Button>
            )}
            </div>
      </motion.div>

      <AnimatePresence>
      {selectedRow && (
          <motion.div 
            className="p-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
          <div className="flex gap-3 p-2 bg-gray-50 rounded-xl shadow-sm">
            {Object.entries(selectedRow).map(([key, value]: any) => (
              <div key={key} className="flex items-center gap-2 px-3 py-1.5">
                <span className="text-xs font-bold text-gray-800 uppercase">{key}</span>
                <span className="text-sm font-medium text-gray-500">{value}</span>
              </div>
            ))}
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="flex-grow overflow-y-auto p-2"
        variants={itemVariants}
      >
        <div className="border border-gray-200 rounded-md max-h-[700px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-gray-100 z-10 border-b border-gray-200">
              <TableRow className="hover:bg-transparent border-b border-gray-200">
                      {columns.map((col) => (
                    <TableHead
                    key={col.id || (col as any).accessorKey || "header"} 
                    style={{ width: col.size }}
                    className="text-gray-700 font-semibold px-1 py-1.5"
                  >
                    {typeof col.header === "function" ? "" : col.header || ""}
                    </TableHead>
                  ))}
                </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100">
              {filteredRules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-48 text-center px-0 py-0">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Filter className="h-10 w-10" />
                      <h3 className="text-lg font-semibold">No Visible Rules</h3>
                      <p className="text-sm">Click "+ Rule" to add a new validation rule.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRules.flatMap((rule, rowIndex) => {
                  const isConfiguring = configuringField?.ui_id === rule.ui_id
                  const rows = [
                    <TableRow 
                      key={rule.ui_id || `row-${rowIndex}`} 
                      className={cn(
                        "hover:bg-gray-50 border-b border-gray-200",
                        isConfiguring && "bg-blue-50"
                      )}
                    >
                      {columns.map((col) => {
                        const colKey = col.id || (col as any).accessorKey || ""
                        let cellContent: React.ReactNode = null
                        
                        if (col.cell && typeof col.cell === 'function') {
                          const mockContext = {
                            row: {
                              original: rule,
                              index: rowIndex,
                              getValue: () => rule[colKey as keyof FieldRule]
                            }
                          }
                          cellContent = (col.cell as any)(mockContext)
                        } else if ((col as any).accessorKey) {
                          cellContent = rule[(col as any).accessorKey as keyof FieldRule]
                        } else {
                          cellContent = null
                        }
                        
                        return (
                          <TableCell key={colKey} className="px-1 py-1.5 text-sm text-gray-700">
                            {cellContent}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ]
                  
                  // If this rule is being configured, add a configuration row
                  if (isConfiguring && configuringField) {
                    rows.push(
                      <TableRow 
                        key={`${rule.ui_id || `row-${rowIndex}`}-config`}
                        className="bg-blue-50 border-b border-gray-200"
                      >
                        <TableCell colSpan={columns.length} className="px-0 py-0">
                          {renderConfigurationUI()}
                        </TableCell>
                    </TableRow>
                  )
                  }
                  
                  return rows
                })
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* + Rule button below table */}
        <AnimatePresence>
        {!isReadOnly && (
            <motion.div 
              className="flex justify-end mt-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant={isAddRuleClicked ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => {
                    setIsAddRuleClicked(true)
                    handleAddRule()
                  }} 
                  className={`!h-8 ${
                    !isAddRuleClicked
                      ? "bg-white"
                      : ""
                  }`}
                >
              <Plus className="mr-2 h-4 w-4" /> Rule
            </Button>
              </motion.div>
            </motion.div>
        )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
      {!isReadOnly && (
          <motion.div 
            className="flex-shrink-0 p-4 border-t border-gray-300 flex justify-end gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
          <Button 
            variant={isCancelClicked ? "default" : "outline"}
            onClick={() => {
              setIsCancelClicked(true)
              onBack()
            }}
            disabled={isSaving}
            className={
              !isCancelClicked
                ? "bg-white"
                : ""
            }
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              setIsSaveRulesClicked(true)
              onSaveRules()
            }} 
            disabled={isSaving}
            variant={isSaveRulesClicked ? "default" : "outline"}
            className={`${
              !isSaveRulesClicked
                ? "bg-white"
                : ""
            }`}
          >
            {isSaving && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
            <Save className="mr-2 h-4 w-4" />
            Save Rules
          </Button>
          <Button 
            onClick={handleSaveValidation}
            disabled={isSaving}
            variant={isSaveValidationClicked ? "default" : "outline"}
            className={`${
              !isSaveValidationClicked
                ? "bg-white"
                : ""
            }`}
          >
            {isSaving && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
            <Save className="mr-2 h-4 w-4" />
            Save Validation
          </Button>
          <Button
            onClick={handleExecuteValidation}
            disabled={isSaving || isExecutingValidation}
            variant={isExecuteValidationClicked ? "default" : "outline"}
            className={`${
              !isExecuteValidationClicked
                ? "bg-white"
                : ""
            }`}
          >
            {isExecutingValidation && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
            <PlayCircle className="mr-2 h-4 w-4" />
            Execute Validation
          </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Tables Dialog */}
      <Dialog open={showAddTablesDialog} onOpenChange={setShowAddTablesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Tables</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Table and Field dropdowns side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Select Table</Label>
                {isLoadingTables ? (
                  <div className="flex items-center gap-2 p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading tables...</span>
                  </div>
                ) : (
                  <DropdownV2
                    options={tablesFromApi.map(opt => ({ label: opt.label, value: String(opt.value) }))}
                    value={selectedTable}
                    onChange={(value) => handleTableChange(value as string)}
                    placeholder="Select a table..."
                    Disabled={isReadOnly || tablesFromApi.length === 0}
                    searchable={true}
                    size="small"
                  />
                )}
              </div>
              <div>
                <Label>Select Field</Label>
                {isLoadingFields ? (
                  <div className="flex items-center gap-2 p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading fields...</span>
                  </div>
                ) : (
                  <DropdownV2
                    options={fieldsFromApi.map(opt => ({ label: opt.label, value: String(opt.value) }))}
                    value={selectedField}
                    onChange={(value) => setSelectedField(value as string)}
                    placeholder="Select a field..."
                    Disabled={isReadOnly || !selectedTable || fieldsFromApi.length === 0}
                    searchable={true}
                    size="small"
                  />
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddTablesDialog(false)}>
                Close
              </Button>
              <Button onClick={() => {
                if (selectedTable) {
                  toast.success(`Added table: ${selectedTable}`)
                  // Here you can add logic to actually add the table
                  setShowAddTablesDialog(false)
                  setSelectedTable("")
                } else {
                  toast.error("Please select a table")
                }
              }}>
                Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Validation Results Modal */}
      {validationResults && (
        <ValidationResultsModal
          isOpen={isValidationResultsOpen}
          onClose={() => setIsValidationResultsOpen(false)}
          results={validationResults}
        />
      )}
    </motion.div>
  )
}
