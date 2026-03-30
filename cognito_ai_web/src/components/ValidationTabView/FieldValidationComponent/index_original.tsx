import { useState, useMemo, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { Button } from "../ui/button"
import { Copy, Loader2, Save, Play } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog"
import { ScrollArea } from "../ui/scroll-area"
import { Sheet, SheetContent } from "../ui/sheet"
import type { FieldData, TableData, Validation, FieldRule, FormFieldOption } from "../types"
import { toast } from "sonner"
import { getSapValidationParams, runDatabaseAction } from "../API/apiService"
import { FieldRulesEditor } from "./FieldRulesEditor"
import { useValidationStore } from "../Stores/validationStore"
import {
  executeValidationComponent,
  getSapSystemNumbersNew,
  getSapClientIdsNew,
  getSapConnectionBySysClient,
  getUniqueApplicationsApi,
} from "../API/validationApi"
import ValidationResultsModal from "../ValidationResultsModal"
import type { ColumnDef } from "@tanstack/react-table"
import TableWithPagination from "../ui/tableWithPagination"
import { PrimaryTableSelector } from "./PrimaryTableSelector"
import { TableMappingConfig } from "./TableMappingConfig"
import { ExecutionSheet } from "./ExecutionSheet"

// FilterRule type definition (previously imported from PrimaryKeyRulesModal)
export interface FilterRule {
  id: string
  field: string
  operator: string
  value: string
}

interface QueryCondition {
  id: string
  field: string
  operator: string
  value: string
}

interface FilterValues {
  module_label: any
  id?: string
  validation_id?: string
  application_id: string
  application_label?: string
  object_type: string
  module_id: string
  sub_module_id: string
  object_id: string
  tcode: string
  validation_description: string
  database_connection: string
}

interface FieldValidationProps {
  tableData: TableData[]
  filterValues: FilterValues
  initialData?: Validation | null
  onSave: (payload: any) => void
  isSaving: boolean
  onCancel: () => void
  setIsRuleConfigScreenOpen: (isOpen: boolean) => void
  mode: "add" | "edit" | "view" | "execute" // Add view mode
  onValidationTypeSelect?: (type: string) => void
  selectedValidationType?: string | null
  onNext?: () => void
}

interface RunResult {
  rowData: any[]
  columns: string[]
  rows_count: number
  total_rows?: number
  execution_time?: string
}


const FieldValidationComponent = forwardRef<any, FieldValidationProps>(
  (
    {
      tableData,
      filterValues,
      onSave,
      isSaving,
      onCancel,
      initialData,
      setIsRuleConfigScreenOpen,
      mode,
      onValidationTypeSelect,
      selectedValidationType,
      onNext,
    },
    ref,
  ) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const {
      primary_table,
      setPrimaryTable,
      primary_key_fields,
      setPrimaryKeyFields,
      primary_key_value,
      setPrimaryKeyValue,
      selected_secondary_tables,
      setSelectedSecondaryTables,
      setFieldRules,
      table_mappings,
      setTableMappings,
      system_number,
      system_number_label,
      setSystemNumber,
      setSystemNumberLabel,
      client_id,
      client_id_label,
      setClientId,
      setClientIdLabel,
      database_connection,
      setDatabaseConnection,
    } = useValidationStore()

    const [foreignTables, setForeignTables] = useState<FormFieldOption[]>([])
    const [isExecutingValidation, setIsExecutingValidation] = useState(false)
    const [validationResults, setValidationResults] = useState<any>(null)
    const [isValidationResultsOpen, setIsValidationResultsOpen] = useState(false)

    // Query Builder State
    const [queryConditions, setQueryConditions] = useState<QueryCondition[]>([])
    const [currentQuery, setCurrentQuery] = useState({
      field: "",
      operator: "",
      value: "",
    })

    const [isLoading, setIsLoading] = useState({ foreignTables: false, mappings: false, fields: false })
    const [isExecuting, setIsExecuting] = useState(false)

    const [isJsonViewerOpen, setIsJsonViewerOpen] = useState(false)
    const [jsonToView, setJsonToView] = useState("")

    const [isViewModalOpen, setIsViewModalOpen] = useState(false)
    const [activeViewData, setActiveViewData] = useState<RunResult | null>(null)

    const [selectedCell, setSelectedCell] = useState<{ rowIndex: number; colId: string; value: any } | null>(null)
    const [selectedRow, setSelectedRow] = useState<any>(null)

    // Source Application state
    const [sourceApplication, setSourceApplication] = useState("")
    const [sourceApplicationOptions, setSourceApplicationOptions] = useState<FormFieldOption[]>([])

    // Modal connection state for re-executing queries
    const [modalSystemNumber, setModalSystemNumber] = useState("")
    const [modalClientId, setModalClientId] = useState("")
    const [modalConnection, setModalConnection] = useState("")
    const [modalSystemNumbers, setModalSystemNumbers] = useState<FormFieldOption[]>([])
    const [modalClientIds, setModalClientIds] = useState<FormFieldOption[]>([])
    const [modalConnections, setModalConnections] = useState<FormFieldOption[]>([])
    const [isModalReExecuting, setIsModalReExecuting] = useState(false)

    // Primary Key Rules state
    const [primaryKeyRules, setPrimaryKeyRules] = useState<FilterRule[]>([])
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false)

    // Inline filter rules state for sheet
    const [inlineFilterRules, setInlineFilterRules] = useState<FilterRule[]>([])

    // Primary Keys array (for multiple key fields - row-based selection)
    const [primaryKeys, setPrimaryKeys] = useState<Array<{ field: string; value: string }>>([])

    // Primary Key connection parameters
    const [pkeySystemNumber, setPkeySystemNumber] = useState("")
    const [pkeyClientId, setPkeyClientId] = useState("")
    const [pkeyConnection, setPkeyConnection] = useState("")

    // Table pagination state
    const [tablePagination, setTablePagination] = useState({
      steps: [20, 50, 100],
      currentPage: 1,
      pageSize: 20,
    })

    // Table search state
    const [tableSearchQuery, setTableSearchQuery] = useState("")

    // Store selected values for display
    const [storeSelectedValues, setStoreSelectedValues] = useState<Array<{field: string, value: string}>>([])

    // Operator options for query builder
    const operatorOptions = [
      { value: "=", label: "Equals (=)" },
      { value: "!=", label: "Not Equals (!=)" },
      { value: ">", label: "Greater Than (>)" },
      { value: "<", label: "Less Than (<)" },
      { value: ">=", label: "Greater Than or Equal (>=)" },
      { value: "<=", label: "Less Than or Equal (<=)" },
      { value: "LIKE", label: "Contains (LIKE)" },
      { value: "NOT LIKE", label: "Does Not Contain (NOT LIKE)" },
      { value: "IN", label: "In List (IN)" },
      { value: "NOT IN", label: "Not In List (NOT IN)" },
      { value: "IS NULL", label: "Is Null" },
      { value: "IS NOT NULL", label: "Is Not Null" },
    ]

    const tableColumns = useMemo<ColumnDef<any>[]>(() => {
      if (!activeViewData?.columns) return []

      return activeViewData.columns.map((column: string) => ({
        id: column,
        accessorKey: column,
        header: column,
        cell: ({ row, column: col }: { row: any; column: any }) => {
          const value = row.getValue(col.id)
          const rowIndex = row.index
          const isSelected = selectedCell && selectedCell.rowIndex === rowIndex && selectedCell.colId === col.id

          return (  
            <ClickableCellRenderer
              value={value ?? ""}
              onClick={() => handleCellClick(rowIndex, col.id as string, value, row.original)}
              isSelected={isSelected}
            />
          )
        },
      }))
    }, [activeViewData?.columns, selectedCell])

    const handleTablePaginationChange = ({ currentPage, limit }: { currentPage: number; limit: number }) => {
      setTablePagination((prev) => ({
        ...prev,
        currentPage: currentPage + 1, // TableWithPagination uses 0-based indexing
        pageSize: limit,
      }))
    }

    // Filter table data based on search query
    const filteredTableData = useMemo(() => {
      if (!activeViewData?.rowData || !tableSearchQuery.trim()) {
        return activeViewData?.rowData || []
      }

      const searchLower = tableSearchQuery.toLowerCase().trim()
      return activeViewData.rowData.filter((row) => {
        return Object.values(row).some((value) => {
          if (value == null) return false
          return String(value).toLowerCase().includes(searchLower)
        })
      })
    }, [activeViewData?.rowData, tableSearchQuery])

    useEffect(() => {  
      if (initialData) {  
        console.log("[v0] Initializing edit mode with data:", initialData)

        setPrimaryTable(initialData.primary_table || "")
        setPrimaryKeyFields(initialData.primary_key_fields?.map(String).join(",") || "")
        setPrimaryKeyValue(initialData.primary_key_value || "")
        setSelectedSecondaryTables(initialData.selected_secondary_tables?.map(String).join(",") || "")

        // Initialize source application from saved data
        if ((initialData as any).source_application) {
          setSourceApplication((initialData as any).source_application)
        }

        // Initialize primary key rules from saved data
        if ((initialData as any).primary_key_rules) {
          setPrimaryKeyRules((initialData as any).primary_key_rules)
        }

        // Initialize primary_keys array from saved data
        if ((initialData as any).primary_keys) {
          setPrimaryKeys((initialData as any).primary_keys)
        }

        // Initialize primary key connection parameters from saved data
        if ((initialData as any).pkey_system_number) {
          setPkeySystemNumber((initialData as any).pkey_system_number)
        }
        if ((initialData as any).pkey_client_id) {
          setPkeyClientId((initialData as any).pkey_client_id)
        }
        if ((initialData as any).pkey_connection) {
          setPkeyConnection((initialData as any).pkey_connection)
        }

        // Initialize store connection parameters from saved data
        if ((initialData as any).system_number) {
          setSystemNumber((initialData as any).system_number)
        }
        if ((initialData as any).system_number_label) {
          setSystemNumberLabel((initialData as any).system_number_label)
        }
        if ((initialData as any).client_id) {
          setClientId((initialData as any).client_id)
        }
        if ((initialData as any).client_id_label) {
          setClientIdLabel((initialData as any).client_id_label)
        }
        if ((initialData as any).database_connection) {
          setDatabaseConnection((initialData as any).database_connection)
        }

        // Transform and populate field rules for edit mode
        if (initialData.field_rules && Array.isArray(initialData.field_rules)) {
          const transformedRules: FieldRule[] = initialData.field_rules.map((rule: any) => ({
            ui_id: rule.ui_id || crypto.randomUUID(),
            unique_id: rule.unique_id || `${rule.table_name}.${rule.field_name}`,
            TableName: rule.table_name || rule.TableName || "",
            FieldName: rule.field_name || rule.FieldName || "",
            Description: rule.description || rule.Description || "",
            isKey: rule.is_key !== undefined ? rule.is_key : rule.isKey || false,
            isValidation: rule.is_validation !== undefined ? rule.is_validation : rule.isValidation || false,
            isDisplay: rule.is_display !== undefined ? rule.is_display : rule.isDisplay || false,
            isComparative: rule.is_comparative !== undefined ? rule.is_comparative : rule.isComparative || false,
            expectedValueType: rule.expected_value_type || rule.expectedValueType || "constant_value",
            expectedValue: rule.expected_value || rule.expectedValue || "",
            primaryKeyValue: rule.primary_key_value || rule.primaryKeyValue || "",
            relationKeys: rule.relation_keys
              ? typeof rule.relation_keys === "string"
                ? rule.relation_keys.split(",")
                : rule.relation_keys
              : rule.relationKeys || [],
            dataType: rule.data_type || rule.dataType || "string",
            sampleValue: rule.sample_value || rule.sampleValue || "",
            config: rule.config || {},
            displayValue: rule.display_value || rule.displayValue || "",
            leftField: rule.left_field || rule.leftField || "",
            operator: rule.operator || "",
            rightField: rule.right_field || rule.rightField || "",
            KeyField: rule.key_field || rule.KeyField || "",
            VerificationField: rule.verification_field || rule.VerificationField || "",
            TableId: rule.table_id || rule.TableId || "",
            FieldId: rule.field_id || rule.FieldId || "",
          }))

          console.log("[v0] Setting transformed field rules:", transformedRules)
          setFieldRules(transformedRules)
        }

        if (initialData.table_mappings) {
          setTableMappings(initialData.table_mappings)
        }

        // Initialize query conditions from existing data if available
        if (initialData.query_conditions) {
          setQueryConditions(initialData.query_conditions)
        }
      }

      if (mode === "view" && initialData) {
        console.log("[v0] Initializing view mode with data:", initialData)
      }
    }, [
      initialData,
      mode,
      setPrimaryTable,
      setPrimaryKeyFields,
      setPrimaryKeyValue,
      setSelectedSecondaryTables,
      setFieldRules,
      setTableMappings,
    ])

    // Ref to track last fetched filter values to prevent duplicate API calls
    const lastFetchedFilters = useRef<string | null>(null)
    const isLoadingApplications = useRef(false)

    // Fetch unique applications for Source Application dropdown
    useEffect(() => {
      const fetchSourceApplications = async () => {
        console.log("fetchSourceApplications - filterValues:", filterValues)
        // Only fetch if we have all required filter values
        const hasAllRequiredValues = (
          filterValues.application_label &&
          filterValues.module_id &&
          filterValues.object_type &&
          filterValues.tcode &&
          filterValues.object_id
        )
        console.log("hasAllRequiredValues:", hasAllRequiredValues)
        
        if (hasAllRequiredValues) {
          // Create a unique key for current filter values
          const currentFilterKey = `${filterValues.application_label}_${filterValues.module_id}_${filterValues.object_type}_${filterValues.tcode}_${filterValues.object_id}`
          
          // Prevent duplicate calls: check if already loaded this key or currently loading
          if (lastFetchedFilters.current === currentFilterKey || isLoadingApplications.current) {
            return
          }
          
          lastFetchedFilters.current = currentFilterKey
          isLoadingApplications.current = true

          try {
            const response = await getUniqueApplicationsApi({
              app_name: filterValues.application_label || "",
              app_module: filterValues.module_id || "",
              object_type: filterValues.object_type || "",
              tcode: filterValues.tcode || "",
              object_id: filterValues.object_id || "",
            })

            console.log("getUniqueApplicationsApi response:", response)

            // The API function returns res.data directly, so response should be the array
            if (Array.isArray(response)) {
              console.log("applicationsData:", response)
              const options = response.map((app: { application_name: string; application_id: string }) => ({
                value: app.application_name,
                label: app.application_name,
              }))
              console.log("mapped options:", options)
              setSourceApplicationOptions(options)
            } else {
              console.log("No valid data in response, setting empty options")
              console.log("Response structure:", response)
              setSourceApplicationOptions([])
            }
          } catch (error) {
            console.error("Failed to fetch source applications:", error)
            setSourceApplicationOptions([])
          } finally {
            isLoadingApplications.current = false
          }
        } else {
          // If required fields are missing, clear the options
          console.log("Missing required filter values, clearing options")
          console.log("Missing values:", {
            application_label: !filterValues.application_label,
            module_id: !filterValues.module_id,
            object_type: !filterValues.object_type,
            tcode: !filterValues.tcode,
            object_id: !filterValues.object_id
          })
          lastFetchedFilters.current = null
          setSourceApplicationOptions([])
        }
      }

      fetchSourceApplications()
    }, [
      filterValues.application_label,
      filterValues.module_id,
      filterValues.object_type,
      filterValues.tcode,
      filterValues.object_id,
    ])

    const primaryTableOptions = useMemo(
      () => tableData.map((t) => ({ value: t.TableName, label: t.TableName })),
      [tableData],
    )

    const primaryKeyFieldOptions = useMemo(() => {
      const table = tableData.find((t) => t.TableName === primary_table)
      if (!table) return []
      return table.Fields.filter((f: FieldData) => f.KeyField === "Yes" || f.VerificationField === "Yes").map(
        (f: FieldData) => ({
          value: f.FieldName,
          label: f.FieldName,
          isKey: f.KeyField === "Yes",
          isVerification: f.VerificationField === "Yes",
          description: f.Description || f.description || "",
        }),
      )
    }, [primary_table, tableData])

    const primaryKeyFieldsArray = useMemo(
      () => (primary_key_fields ? primary_key_fields.split(",") : []),
      [primary_key_fields],
    )
    const selectedSecondaryTablesArray = useMemo(
      () => (selected_secondary_tables ? selected_secondary_tables.split(",") : []),
      [selected_secondary_tables],
    )

    // Query Builder Functions


    const generateQueryString = () => {
      if (queryConditions.length === 0) return ""

      const conditions = queryConditions.map((condition) => {
        if (["IS NULL", "IS NOT NULL"].includes(condition.operator)) {
          return `${condition.field} ${condition.operator}`
        }

        if (["IN", "NOT IN"].includes(condition.operator)) {
          const values = condition.value
            .split(",")
            .map((v) => `'${v.trim()}'`)
            .join(", ")
          return `${condition.field} ${condition.operator} (${values})`
        }

        if (["LIKE", "NOT LIKE"].includes(condition.operator)) {
          return `${condition.field} ${condition.operator} '%${condition.value}%'`
        }

        return `${condition.field} ${condition.operator} '${condition.value}'`
      })

      return conditions.join(" AND ")
    }
    // Get all field options from primary table and selected secondary tables
    const allFieldOptions = useMemo(() => {
      const options: FormFieldOption[] = []

      // Primary table fields
      if (primary_table) {
        const primaryTableData = tableData.find((t) => t.TableName === primary_table)
        if (primaryTableData) {
          primaryTableData.Fields.forEach((field: FieldData) => {
            options.push({
              value: `${primary_table}.${field.FieldName}`,
              label: `${primary_table}.${field.FieldName}`,
            })
          })
        }
      }

      // Secondary table fields
      selectedSecondaryTablesArray.forEach((tableName) => {
        const tableData_item = tableData.find((t) => t.TableName === tableName)
        if (tableData_item) {
          tableData_item.Fields.forEach((field: FieldData) => {
            options.push({
              value: `${tableName}.${field.FieldName}`,
              label: `${tableName}.${field.FieldName}`,
            })
          })
        }
      })

      return options
    }, [primary_table, selectedSecondaryTablesArray, tableData])

    useEffect(() => {  
      if (primary_table) {  
        const fetchForeignTables = async () => {
          setIsLoading((prev) => ({ ...prev, foreignTables: true }))
          try {
            const payload = {
              operation: "get_foreign_tables" as const,
              app_name: filterValues.application_label || filterValues.application_id,
              app_module: filterValues.module_id,
              tcode: filterValues.tcode,
              table: primary_table,
            }
            const response = await getSapValidationParams(payload)
            const foreignTablesList = Array.isArray(response) ? response : response.data || []
            const formattedTables: FormFieldOption[] = foreignTablesList.map((tableName: string) => ({
              value: tableName,
              label: tableName,
            }))
            setForeignTables(formattedTables)
          } catch (error) {
            toast.error("Failed to fetch foreign tables.")
            setForeignTables([])
          } finally {
            setIsLoading((prev) => ({ ...prev, foreignTables: false }))
          }
        }
        fetchForeignTables()
      } else {
        setPrimaryKeyFields("")
        setSelectedSecondaryTables("")
        setTableMappings([])
        setForeignTables([])
        setQueryConditions([])
      }
    }, [
      primary_table,
      filterValues.application_label,
      filterValues.application_id,
      filterValues.module_id,
      filterValues.tcode,
      setPrimaryKeyFields,
      setSelectedSecondaryTables,
      setTableMappings,
    ])

    useEffect(() => {
      if (selectedSecondaryTablesArray.length > 0 && primary_table) {
        const fetchMappings = async () => {
          setIsLoading((prev) => ({ ...prev, mappings: true }))
          try {
            const payload = {
              operation: "get_foreign_table_field_mapping" as const,
              app_name: filterValues.application_label || filterValues.application_id,
              app_module: filterValues.module_id,
              tcode: filterValues.tcode,
              primary_table: primary_table,
            }
            const response = await getSapValidationParams(payload)
            const mappingsList = Array.isArray(response) ? response : response.data || []
            // API returns "foriegn_table" (misspelled) not "foreign_table"
            const filteredMappings = mappingsList.filter((m: any) =>
              selectedSecondaryTablesArray.includes(m.foriegn_table || m.foreign_table),
            )
            setTableMappings(filteredMappings)
          } catch (error) {
            toast.error("Failed to fetch table mappings.")
            setTableMappings([])
          } finally {
            setIsLoading((prev) => ({ ...prev, mappings: false }))
          }
        }
        fetchMappings()
      } else {
        setTableMappings([])
      }
    }, [
      selected_secondary_tables,
      primary_table,
      filterValues.application_label,
      filterValues.application_id,
      filterValues.module_id,
      filterValues.tcode,
      setTableMappings,
    ])

    const handleExecute = async () => {
      if (!primary_table || primaryKeyFieldsArray.length === 0) {
        toast.error("Please select a primary table and at least one key field.")
        return
      }

      // Reset modal state and clear previous data
      setActiveViewData(null)
      
      // Pre-populate from store if available
      const initialSystemNumber = system_number || ""
      const initialSystemNumberLabel = system_number_label || ""
      const initialClientId = client_id || ""
      const initialClientIdLabel = client_id_label || ""
      const initialConnection = database_connection || ""
      
      setModalSystemNumber(initialSystemNumber)
      setModalClientId(initialClientId)
      setModalConnection(initialConnection)
      setModalClientIds([])
      setModalConnections([])

      // Fetch system numbers for dropdown
      try {
        const sysNumResponse = await getSapSystemNumbersNew({
          payload: {
            data: { application: "" },
            actions: "get_system_numbers",
          },
        })
        if (sysNumResponse.status && Array.isArray(sysNumResponse.data)) {
          setModalSystemNumbers(sysNumResponse.data)
          
          // If we have a stored system number, fetch client IDs
          if (initialSystemNumber) {
            try {
              const clientResponse = await getSapClientIdsNew({
                payload: {
                  data: { system_number: initialSystemNumber },
                  actions: "get_client_ids",
                },
              })
              if (clientResponse.status && Array.isArray(clientResponse.data)) {
                setModalClientIds(clientResponse.data)
                
                // If we have a stored client ID, fetch connections
                if (initialClientId) {
                  try {
                    const connResponse = await getSapConnectionBySysClient({
                      payload: {
                        data: { client_id: initialClientId, system_number: initialSystemNumber },
                        actions: "get_connection_client_sysnr",
                      },
                    })
                    if (connResponse.status && Array.isArray(connResponse.data)) {
                      setModalConnections(connResponse.data)
                    }
                  } catch (error) {
                    console.error("Error fetching connections:", error)
                  }
                }
              }
            } catch (error) {
              console.error("Error fetching client IDs:", error)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching system numbers:", error)
        toast.error("Failed to fetch system numbers")
      }

      // Open modal immediately
      setIsViewModalOpen(true)
      
      // Populate store selected values for display
      const selectedValues: Array<{field: string, value: string}> = []
      
      // Handle multiple primary keys (from primaryKeys array)
      if (primaryKeys.length > 0) {
        primaryKeys.forEach(keyItem => {
          selectedValues.push({
            field: `${primary_table}.${keyItem.field}`,
            value: keyItem.value
          })
        })
      } else if (primary_key_value) {
        // Handle single primary key value
        primaryKeyFieldsArray.forEach(field => {
          selectedValues.push({
            field: `${primary_table}.${field}`,
            value: primary_key_value
          })
        })
      }
      
      setStoreSelectedValues(selectedValues)
      
      // Directly execute the query using stored connection parameters
      if (initialConnection) {
        // Use stored connection parameters
        setModalSystemNumber(initialSystemNumber)
        setModalClientId(initialClientId)
        setModalConnection(initialConnection)
        
        // Execute query directly
        setTimeout(() => {
          executeQueryDirectly(initialConnection)
        }, 100)
      } else {
        // If no stored connection, show modal for user to select
        toast.info("Please select connection parameters to execute the query.")
      }
    }

 

    // Handle modal system number change
    const handleModalSystemNumberChange = async (value: string) => {
      setModalSystemNumber(value)
      setSystemNumber(value) // Update store
      
      // Find and set the label for the selected system number
      const selectedSystemNumber = modalSystemNumbers.find(option => option.value === value)
      if (selectedSystemNumber) {
        setSystemNumberLabel(selectedSystemNumber.label)
      }
      
      setModalClientId("")
      setModalConnection("")
      setModalClientIds([])
      setModalConnections([])

      if (value) {
        try {
          const clientResponse = await getSapClientIdsNew({
            payload: {
              data: { system_number: value },
              actions: "get_client_ids",
            },
          })
          if (clientResponse.status && Array.isArray(clientResponse.data)) {
            setModalClientIds(clientResponse.data)
          }
        } catch (error) {
          console.error("Error fetching client IDs:", error)
          toast.error("Failed to fetch client IDs")
        }
      }
    }

    // Handle modal client ID change
    const handleModalClientIdChange = async (value: string) => {
      setModalClientId(value)
      setClientId(value) // Update store
      
      // Find and set the label for the selected client ID
      const selectedClientId = modalClientIds.find(option => option.value === value)
      if (selectedClientId) {
        setClientIdLabel(selectedClientId.label)
      }
      
      setModalConnection("")
      setModalConnections([])

      if (value && modalSystemNumber) {
        try {
          const connResponse = await getSapConnectionBySysClient({
            payload: {
              data: { client_id: value, system_number: modalSystemNumber },
              actions: "get_connection_client_sysnr",
            },
          })
          if (connResponse.status && Array.isArray(connResponse.data)) {
            setModalConnections(connResponse.data)
          }
        } catch (error) {
          console.error("Error fetching connections:", error)
          toast.error("Failed to fetch connections")
        }
      }
    }

    // Auto-select matching row based on store values
    const autoSelectMatchingRow = (tableData: any[]) => {
      if (!tableData || tableData.length === 0) return

      // Get the current store values
      const currentPrimaryKeys = primaryKeys.length > 0 ? primaryKeys : 
        primaryKeyFieldsArray.map(field => ({ field, value: primary_key_value }))

      if (currentPrimaryKeys.length === 0) return

      // Find matching row
      const matchingRowIndex = tableData.findIndex(row => {
        return currentPrimaryKeys.every(keyItem => {
          const rowValue = String(row[keyItem.field] || "")
          const storeValue = String(keyItem.value || "")
          return rowValue === storeValue
        })
      })

      if (matchingRowIndex !== -1) {
        const matchingRow = tableData[matchingRowIndex]
        
        // Select the first primary key field of the matching row
        const firstKeyField = currentPrimaryKeys[0].field
        const cellValue = matchingRow[firstKeyField]
        
        // Set the selected cell and row
        setSelectedCell({
          rowIndex: matchingRowIndex,
          colId: firstKeyField,
          value: cellValue
        })
        setSelectedRow(matchingRow)
        
        console.log(`Auto-selected row ${matchingRowIndex + 1} with values:`, currentPrimaryKeys)
      }
    }

    // Execute query directly with connection parameter
    const executeQueryDirectly = async (connection: string) => {
      if (!primary_table || primaryKeyFieldsArray.length === 0) {
        toast.error("Please select a primary table and at least one key field.")
        return
      }

      setIsModalReExecuting(true)
      try {
        // Build where_clause array from inline filter rules
        const whereClause: string[] = inlineFilterRules
          .filter(rule => rule.field && rule.operator && rule.value)
          .map(rule => {
            // Format the where clause string based on operator
            const field = rule.field
            const operator = rule.operator
            const value = rule.value

            // For operators that need special formatting
            if (operator === 'LIKE' || operator === 'NOT LIKE') {
              return `${field} ${operator} '%${value}%'`
            } else if (operator === 'IN' || operator === 'NOT IN') {
              // Assume value is comma-separated
              const values = value.split(',').map(v => `'${v.trim()}'`).join(', ')
              return `${field} ${operator} (${values})`
            } else if (operator === 'IS NULL' || operator === 'IS NOT NULL') {
              return `${field} ${operator}`
            } else {
              // For =, !=, >, <, >=, <=
              return `${field} ${operator} '${value}'`
            }
          })

        const response = await runDatabaseAction({
          payload: {
            actions: "get_data",
            connection: connection,
            protocol_type: "RFC",
            data: {
              table: primary_table,
              columns: primaryKeyFieldsArray,
              where_clause: whereClause,
            },
          },
        })

        const dataArray = response.data || []
        const dataLength = dataArray.length || 0

        if (dataLength > 500) {
          toast.warning(`Large dataset detected (${dataLength} rows). Displaying first 500 rows for performance.`)
        }

        const limitedData = dataArray.slice(0, 500)

        // Use only the requested columns from primaryKeyFieldsArray
        const columns = primaryKeyFieldsArray

        // Filter data to include only requested columns
        const filteredData = limitedData.map((row: any) => {
          const filteredRow: any = {}
          primaryKeyFieldsArray.forEach((col: string) => {
            if (col in row) {
              filteredRow[col] = row[col]
            }
          })
          return filteredRow
        })

        const resultData = {
          rowData: filteredData,
          columns: columns,
          rows_count: filteredData.length,
          total_rows: dataLength,
          execution_time: response.execution_time,
        }
        setActiveViewData(resultData)
        setTablePagination((prev) => ({ ...prev, currentPage: 1 }))
        
        // Auto-select matching row based on store values
        setTimeout(() => {
          autoSelectMatchingRow(filteredData)
        }, 100)
        
      } catch (error: any) {
        console.error("Query execution error:", error)
        toast.error(`Query execution failed: ${error?.message || "Unknown error"}`)
      } finally {
        setIsModalReExecuting(false)
      }
    }

    // Re-execute query with new connection parameters
    const handleModalReExecute = async () => {
      if (!modalConnection || !primary_table || primaryKeyFieldsArray.length === 0) {
        toast.error("Please select all connection parameters and ensure table/fields are selected.")
        return
      }

      setIsModalReExecuting(true)
      try {
        // Build where_clause array from inline filter rules
        const whereClause: string[] = inlineFilterRules
          .filter(rule => rule.field && rule.operator && rule.value)
          .map(rule => {
            // Format the where clause string based on operator
            const field = rule.field
            const operator = rule.operator
            const value = rule.value

            // For operators that need special formatting
            if (operator === 'LIKE' || operator === 'NOT LIKE') {
              return `${field} ${operator} '%${value}%'`
            } else if (operator === 'IN' || operator === 'NOT IN') {
              // Assume value is comma-separated
              const values = value.split(',').map(v => `'${v.trim()}'`).join(', ')
              return `${field} ${operator} (${values})`
            } else if (operator === 'IS NULL' || operator === 'IS NOT NULL') {
              return `${field} ${operator}`
            } else {
              // For =, !=, >, <, >=, <=
              return `${field} ${operator} '${value}'`
            }
          })

        const response = await runDatabaseAction({
          payload: {
            actions: "get_data",
            connection: modalConnection,
            protocol_type: "RFC",
            data: {
              table: primary_table,
              columns: primaryKeyFieldsArray,
              where_clause: whereClause,
            },
          },
        })

        const dataArray = response.data || []
        const dataLength = dataArray.length || 0

        if (dataLength > 500) {
          toast.warning(`Large dataset detected (${dataLength} rows). Displaying first 500 rows for performance.`)
        }

        const limitedData = dataArray.slice(0, 500)

        // Use only the requested columns from primaryKeyFieldsArray
        const columns = primaryKeyFieldsArray

        // Filter data to include only requested columns
        const filteredData = limitedData.map((row: any) => {
          const filteredRow: any = {}
          primaryKeyFieldsArray.forEach((col: string) => {
            if (col in row) {
              filteredRow[col] = row[col]
            }
          })
          return filteredRow
        })

        const resultData = {
          rowData: filteredData,
          columns: columns,
          rows_count: filteredData.length,
          total_rows: dataLength,
          execution_time: response.execution_time,
        }
        setActiveViewData(resultData)
        setTablePagination((prev) => ({ ...prev, currentPage: 1 }))
        
        // Auto-select matching row based on store values
        setTimeout(() => {
          autoSelectMatchingRow(filteredData)
        }, 100)
        
      } catch (error: any) {
        console.error("Re-execution error:", error)
        toast.error(`Re-execution failed: ${error?.message || "Unknown error"}`)
      } finally {
        setIsModalReExecuting(false)
      }
    }

    const handleExecuteValidation = async () => {
      // Validation checks
      if (!filterValues.validation_id) {
        toast.error("Validation ID is required to execute validation.")
        return
      }

      if (!primary_table) {
        toast.error("Please select a primary table.")
        return
      }

      if (primaryKeyFieldsArray.length === 0) {
        toast.error("Please select at least one primary key field.")
        return
      }

      if (!primary_key_value) {
        toast.error("Please provide a primary key value.")
        return
      }

      setIsExecutingValidation(true)

      try {
        // Construct the parameters object
        const parameters: Record<string, any> = {}

        // Create parameter key in format "TABLE.FIELD" and set the value
        primaryKeyFieldsArray.forEach((field) => {
          const parameterKey = `${primary_table}.${field}`
          parameters[parameterKey] = primary_key_value
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
        console.error("Validation execution failed:", error)
        toast.error(`Validation execution failed: ${error.message || "Unknown error"}`)
      } finally {
        setIsExecutingValidation(false)
      }
    }

    const foreignTablesWithKeyAndVerification = foreignTables.map((table) => ({
      ...table,
      isKey: false,
      isVerification: false,
    }))

    const handleCellClick = (rowIndex: number, colId: string, value: any, rowData: any) => {
      setSelectedCell({ rowIndex, colId, value })
      setSelectedRow(rowData)

      // Check if multiple primary key fields are selected
      const primaryKeyFieldsArray = primary_key_fields ? primary_key_fields.split(",").map((f) => f.trim()) : []

      if (primaryKeyFieldsArray.length > 1) {
        toast.info(`Row ${rowIndex + 1} selected (${primaryKeyFieldsArray.length} key fields)`)
      } else {
        toast.info(`Selected: ${colId} = ${value}`)
      }
    }

    const handleUseGridValue = () => {
      if (!selectedCell || !selectedRow) {
        toast.error("Please select a cell from the table.")
        return
      }

      const primaryKeyFieldsArray = primary_key_fields ? primary_key_fields.split(",").map((f) => f.trim()) : []

      // Check if multiple primary key fields are selected
      if (primaryKeyFieldsArray.length > 1) {
        // Row-based selection: capture all primary key fields from the selected row
        const rowKeys = primaryKeyFieldsArray.map((field) => ({
          field,
          value: String(selectedRow[field] || ""),
        }))

        setPrimaryKeys(rowKeys)

        // Also set the first field's value for backward compatibility
        if (rowKeys.length > 0) {
          setPrimaryKeyValue(rowKeys[0].value)
        }

        // Set connection parameters from modal
        setPkeySystemNumber(modalSystemNumber)
        setPkeyClientId(modalClientId)
        setPkeyConnection(modalConnection)

        // Update store selected values for display
        const updatedSelectedValues = rowKeys.map(keyItem => ({
          field: `${primary_table}.${keyItem.field}`,
          value: keyItem.value
        }))
        setStoreSelectedValues(updatedSelectedValues)

        toast.success(`Primary key row selected with ${rowKeys.length} fields`)
        setIsViewModalOpen(false)
        setSelectedCell(null)
        setSelectedRow(null)
      } else {
        // Single field selection (backward compatibility)
        setPrimaryKeyValue(selectedCell.value)
        setPrimaryKeys([]) // Clear array for single field mode
        
        // Update store selected values for display
        const updatedSelectedValues = primaryKeyFieldsArray.map(field => ({
          field: `${primary_table}.${field}`,
          value: selectedCell.value
        }))
        setStoreSelectedValues(updatedSelectedValues)
        
        toast.success(`Primary key value set to: ${selectedCell.value} (from ${selectedCell.colId})`)
        setIsViewModalOpen(false)
        setSelectedCell(null)
        setSelectedRow(null)
      }
    }

    const getFinalPayload = () => {

      const {
        primary_table,
        primary_key_fields,
        primary_key_value,
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
        primary_table: primary_table || "",
        selected_secondary_tables: selected_secondary_tables ? selected_secondary_tables.split(",") : [],
        primary_key_fields: primary_key_fields ? primary_key_fields.split(",") : [],
        primary_key_value: primary_key_value,
        primary_key_rules: primaryKeyRules, // ✅ Save primary key rules
        query: generateQueryString(),
        query_conditions: queryConditions,
        field_rules: field_rules,
        table_mappings: table_mappings,
        source_application: sourceApplication || "",
        system_number: system_number || "",
        system_number_label: system_number_label || "",
        client_id: client_id || "",
        client_id_label: client_id_label || "",
        database_connection: database_connection || "",
      }

      // Add primary_keys array if multiple key fields are selected
      if (primaryKeys.length > 0) {
        payload.primary_keys = primaryKeys
      }

      // Add connection parameters for primary key selection
      if (pkeySystemNumber) {
        payload.pkey_system_number = pkeySystemNumber
      }
      if (pkeyClientId) {
        payload.pkey_client_id = pkeyClientId
      }
      if (pkeyConnection) {
        payload.pkey_connection = pkeyConnection
      }

      return payload
    }

    useImperativeHandle(ref, () => ({ getFinalPayload }))

    const handleShowJson = () => {
      const payload = getFinalPayload()
      setJsonToView(JSON.stringify(payload, null, 2))
      setIsJsonViewerOpen(true)
    }
    
    const handleConfigureRules = () => {  
      if (!primary_table) {  
        toast.warning("Please select a primary table first.")
        return
      }

      if (mode === "edit") {  
        const storeState = useValidationStore.getState()
        const savedRules = storeState.field_rules || []
        console.log("[v0] Edit mode - current field rules in store:", savedRules)

        // For edit mode, the rules should already be populated from initialData
        // We just need to ensure they have the latest metadata from tableData
        const populatedRules: FieldRule[] = savedRules.map((savedRule) => {  
          if (!savedRule.unique_id) return savedRule

          const [tableName, fieldName] = savedRule.unique_id.split(".")
          const table = tableData.find((t) => t.TableName === tableName)
          const field = table?.Fields.find((f) => f.FieldName === fieldName)

          const finalRule = { ...savedRule }
          finalRule.ui_id = finalRule.ui_id || crypto.randomUUID()

          if (field) {   
            if (!finalRule.Description) finalRule.Description = field.Description
            if (!finalRule.sampleValue) finalRule.sampleValue = field.sampleValue
            if (!finalRule.dataType) finalRule.dataType = field.dataType
          }

          return finalRule
        })

        console.log("[v0] Populated rules for edit mode:", populatedRules)
        setFieldRules(populatedRules)
      }

      setIsDrawerOpen(true)
      setIsRuleConfigScreenOpen(true)
    }

    const handleDrawerClose = () => {  
      setIsDrawerOpen(false)
      setIsRuleConfigScreenOpen(false)
    }

    const handleRulesSave = () => {
      toast.success("Rules saved locally. Click 'Save Validation' to persist all changes.")
    }

    const handleSaveClick = () => {
      const payload = getFinalPayload()
      console.log("[v0] Saving validation with payload:", payload)
      onSave(payload)
    }

    // Check if execute validation should be enabled
    const canExecuteValidation = Boolean(
      filterValues.validation_id && primary_table && primaryKeyFieldsArray.length > 0 && primary_key_value,
    )

    return ( 
      <>
        <div className="space-y-2">
          <Card className="p-2 gap-2">
            <CardHeader className="p-0">
              <CardTitle>1. Select Primary Table</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1.5fr_auto_1.5fr_3fr] gap-4 items-end p-0 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="source-application">Source Application</Label>
                <SingleSelectCombobox
                  options={sourceApplicationOptions}
                  value={sourceApplication}
                  onChange={(v) => { 
                    setSourceApplication((v as string) || "")
                  }}
                  placeholder="Select Source Application..."
                  disabled={mode === "view" || mode === "execute"}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="primary-table">Primary Table</Label>
                <SingleSelectCombobox
                  options={primaryTableOptions}
                  value={primary_table}
                  onChange={(value) => setPrimaryTable(value as string)}
                  placeholder="Select Table..."
                  disabled={mode === "view" || mode === "execute"} // Disable in view mode too
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="primary-key">Primary Key Field(s)</Label>
                <KeyValidationCombobox
                  options={primaryKeyFieldOptions}
                  value={primaryKeyFieldsArray}
                  onChange={(v) => setPrimaryKeyFields(v.join(","))}
                  placeholder="Select Key(s)..."
                  disabled={!primary_table || mode === "view" || mode === "execute"} // Disable in view mode too
                  showIndicators={true}
                  onlyAllowKeyFields={true} 
                />
              </div>
              <div className="flex gap-2 ">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleExecute}
                        disabled={
                          isExecuting ||
                          !primary_table ||
                          primaryKeyFieldsArray.length === 0 ||
                          mode === "view" ||
                          mode === "execute"
                        } // Disable in view mode too
                        variant="outline"
className="!h-9 !w-8"                      >
                        {isExecuting ? <Loader2 className="animate-spin" /> : <PlayCircle className="!h-6"/>}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white border border-gray-300 rounded-md shadow-md px-2 py-1">
                      <p>Execute Query to Get Sample Values</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="primary-key-value">Primary Key Value</Label>
                <Input
                  id="primary-key-value"
                  placeholder="e.g. 0000123456 (click cell in grid to set)"
                  value={primary_key_value}
                  onChange={(e) => setPrimaryKeyValue(e.target.value)}
                  className="w-full"
                  disabled={mode === "view" || mode === "execute"} // Disable in view mode too
                />
                {/* Show primary keys array when multiple fields are selected */}
              </div>
            </CardContent>
          </Card>

          <Card className="p-2 gap-2">
            <CardHeader className="flex flex-row items-center justify-between p-0">
              <CardTitle className="p-0">2. Map Key Fields Between Tables</CardTitle>
              {mode !== "view" && mode !== "execute" && (  
                <Button onClick={handleConfigureRules} className="!h-8">
                  Configure Rules
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-2 p-0 pt-2">
              <div className="space-y-1.5 w-[200px]">
                <Label htmlFor="secondary-tables">Validation Fields</Label>
                <MultiSelectCombobox
                  options={foreignTablesWithKeyAndVerification}
                  value={selectedSecondaryTablesArray}
                  onChange={(v) => setSelectedSecondaryTables(v.join(","))}
                  placeholder="Select..."
                  disabled={isLoading.foreignTables || !primary_table || mode === "view" || mode === "execute"} // Disable in execute mode too
                />
              </div>
              {isLoading.mappings && (  
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="animate-spin" />
                  <span className="ml-2">Loading Mappings...</span>
                </div>
              )}
              {table_mappings.length > 0 && ( 
                <ScrollArea className="h-48 rounded-md border border-gray-300">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-300">
                        <TableHead>Secondary Table</TableHead>
                        <TableHead>Links (Primary → Secondary)</TableHead>
                        {/* <TableHead>Cardinality</TableHead> */}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {table_mappings.map((m, i) => {
                        // API returns "foriegn_table" (misspelled), handle both cases
                        const foreignTable = m.foreign_table || m.foreign_table
                        const foreignTableField = m.foreign_table_field || m.foreign_table_field
                        return ( 
                          <TableRow className="border-gray-300" key={`${m.primary_table}-${foreignTable}-${i}`}>
                            <TableCell className="font-medium">{foreignTable}</TableCell>
                            <TableCell className="flex items-center gap-2 font-mono text-xs">
                              <span>
                                {m.primary_table}.{m.primary_table_field}
                              </span>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {foreignTable}.{foreignTableField}
                              </span>
                          </TableCell>
                          {/* <TableCell>{m.cardinality}</TableCell> */}
                        </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}             
            </CardContent>
          </Card>

          {mode !== "execute" && (
            <div className="flex justify-end items-center pt-4">
              <div className="flex gap-2">
                <Button variant="primary" onClick={onCancel} disabled={isSaving}>
                  Cancel
                </Button>
                {mode !== "view" && (  
                  <>
                    <Button onClick={handleSaveClick} disabled={isSaving}>
                      {isSaving && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                      <Save className="mr-2 h-4 w-4" /> Save Validation
                    </Button>
                    <Button onClick={handleExecuteValidation} disabled={isExecutingValidation || !canExecuteValidation}>
                      {isExecutingValidation && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                      <Play className="mr-2 h-4 w-4" /> Execute Validation
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <Sheet open={isDrawerOpen} onOpenChange={handleDrawerClose}>
          <SheetContent
            side="right"
            className="w-[95vw] max-w-[1400px] min-w-[800px] sm:max-w-[1400px] p-0 rounded-l-xl flex flex-col"
          >
            <FieldRulesEditor
              selectedRow={selectedRow}
              tableData={tableData}
              onBack={handleDrawerClose}
              onSaveRules={handleRulesSave}
              isSaving={isSaving}
              filterValues={filterValues}
            />
          </SheetContent>
        </Sheet>

        <AlertDialog open={isJsonViewerOpen} onOpenChange={setIsJsonViewerOpen}>
          <AlertDialogContent className="max-w-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Final Configuration JSON</AlertDialogTitle>
              <AlertDialogDescription>
                This is the final JSON payload representing all configured fields and table mappings.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <ScrollArea className="h-[500px] w-full rounded-md border p-4 bg-slate-900 text-slate-50">
              <pre>
                <code>{jsonToView}</code>
              </pre>
            </ScrollArea>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {  
                  navigator.clipboard.writeText(jsonToView).then(
                    () => toast.success("Copied!"),
                    () => toast.error("Failed to copy."),
                  )
                }}
              >
                <Copy className="mr-2 h-4 w-4" /> Copy
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Sheet open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
  <SheetContent
            side="right"
            className="w-[95vw] max-w-[1400px] min-w-[800px] sm:max-w-[1400px] p-2 rounded-l-xl flex flex-col"
          >        
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setIsViewModalOpen(false)}>
                    <ArrowLeft />
                  </Button>
                  <SheetTitle className="text-base font-semibold p-2">Execution Results</SheetTitle>
                </div>
                <div className="flex items-center gap-2">
                  {/* Display store selected values as badges */}
                  {/* {storeSelectedValues.map((item, index) => (
                    <div key={index} className="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap max-w-[200px] truncate bg-green-100 border border-green-300 text-green-700">
                      {item.field} = {item.value}
                    </div>
                  ))} */}
                  
                  {/* Display currently selected cell */}
                  {selectedCell && (
                    <div className="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap max-w-[200px] truncate" style={{ backgroundColor: '#F3F0FF', borderColor: '#DDD6FE', color: '#A78BFA', border: '1px solid' }}>
                      Selected: {selectedCell.colId} = {String(selectedCell.value)}
                    </div>
                  )}
                  
                  <Button
                    onClick={handleUseGridValue}
                    disabled={!selectedCell || mode === "view" || mode === "execute"}
                    className="h-7 flex-shrink-0 text-xs px-2"
                  >
                    Use Selected Value
                  </Button>
                </div>
              </div>


            {/* Connection parameters row with dropdowns */}
            <div className="grid grid-cols-6 gap-2">
              <div className="space-y-1">
                <Label htmlFor="modal-system-number" className="text-xs font-medium">
                  System Number
                </Label>
                <SingleSelectCombobox
                  options={modalSystemNumbers}
                  value={modalSystemNumber}
                  onChange={(v) => handleModalSystemNumberChange((v as string) || "")}
                  placeholder="Select..."
                  disabled={isModalReExecuting}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="modal-client-id" className="text-xs font-medium">
                  Client ID
                </Label>
                <SingleSelectCombobox
                  options={modalClientIds}
                  value={modalClientId}
                  onChange={(v) => handleModalClientIdChange((v as string) || "")}
                  placeholder="Select..."
                  disabled={!modalSystemNumber || isModalReExecuting}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="modal-connection" className="text-xs font-medium">
                  Connection
                </Label>
                <SingleSelectCombobox
                  options={modalConnections}
                  value={modalConnection}
                  onChange={(v) => {
                    const connectionValue = (v as string) || ""
                    setModalConnection(connectionValue)
                    setDatabaseConnection(connectionValue) // Update store
                  }}
                  placeholder="Select..."
                  disabled={!modalClientId || isModalReExecuting}
                />
              </div>
            </div>
            {/* Build Filters Section */}
            <div className="border border-gray-200 rounded p-2 bg-gray-50">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <Label className="text-xs font-semibold">Build Filters</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setInlineFilterRules([
                        ...inlineFilterRules,
                        { id: crypto.randomUUID(), field: "", operator: "", value: "" }
                      ])
                    }}
                    disabled={isModalReExecuting}
                    className="h-6 w-6 p-0"
                    title="Add filter"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <Button
                  onClick={handleModalReExecute}
                  disabled={!modalConnection || isModalReExecuting}
                  className="h-7 text-xs px-3"
                  size="sm"
                >
                  {isModalReExecuting ? (
                    <>
                      <Loader2 className="animate-spin mr-1 h-3 w-3" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="mr-1 h-3 w-3" />
                      Execute
                    </>
                  )}
                </Button>
              </div>

              {/* Inline filter rules - 2 per row */}
              <div className="grid grid-cols-2 gap-2">
                {inlineFilterRules.map((rule, index) => (
                  <div key={rule.id} className="flex gap-1 items-center">
                    <SingleSelectCombobox
                      options={primaryKeyFieldOptions}
                      value={rule.field}
                      onChange={(v) => {
                        const newRules = [...inlineFilterRules]
                        newRules[index] = { ...rule, field: (v as string) || "" }
                        setInlineFilterRules(newRules)
                      }}
                      placeholder="Field"
                      disabled={isModalReExecuting}
                    />
                    <SingleSelectCombobox
                      options={operatorOptions}
                      value={rule.operator}
                      onChange={(v) => {
                        const newRules = [...inlineFilterRules]
                        newRules[index] = { ...rule, operator: (v as string) || "" }
                        setInlineFilterRules(newRules)
                      }}
                      placeholder="Operator"
                      disabled={isModalReExecuting}
                    />
                    <Input
                      value={rule.value}
                      onChange={(e) => {
                        const newRules = [...inlineFilterRules]
                        newRules[index] = { ...rule, value: e.target.value }
                        setInlineFilterRules(newRules)
                      }}
                      placeholder="Value"
                      className="h-8 text-xs"
                      disabled={isModalReExecuting}
                    />
                    <div className="flex gap-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newRules = [...inlineFilterRules]
                          newRules.splice(index + 1, 0, { id: crypto.randomUUID(), field: "", operator: "", value: "" })
                          setInlineFilterRules(newRules)
                        }}
                        disabled={isModalReExecuting}
                        className="h-7 w-7 p-0"
                        title="Add filter"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setInlineFilterRules(inlineFilterRules.filter((_, i) => i !== index))
                          toast.success("Filter removed")
                        }}
                        disabled={isModalReExecuting}
                        className="h-7 w-7 p-0"
                        title="Remove filter"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

         
            {/* Search bar */}
            {activeViewData && (
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search table..."
                  value={tableSearchQuery}
                  onChange={(e) => setTableSearchQuery(e.target.value)}
                  className="h-7 pl-8 pr-8 text-xs"
                />
                {tableSearchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTableSearchQuery("")}
                    className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-transparent"
                  >
                    <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                  </Button>
                )}
              </div>
            )}

            {/* Data table */}
            <div className="flex-grow min-h-[250px] border border-gray-300 rounded">
              {activeViewData ? (
                <TableWithPagination
                  data={filteredTableData}
                  columns={tableColumns}
                  totalRows={filteredTableData.length}
                  pagination={tablePagination}
                  loading={false}
                  onChangePagination={handleTablePaginationChange}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <p className="text-sm">Select connection parameters and click Execute to view data</p>
                  </div>
                </div>
              )}
            </div>

          </SheetContent>
        </Sheet>

        <ValidationResultsModal
          isOpen={isValidationResultsOpen}
          onClose={() => setIsValidationResultsOpen(false)}
          results={validationResults}
        />

      </>
    )
  },
)


FieldValidationComponent.displayName = "FieldValidationComponent"
export default FieldValidationComponent

