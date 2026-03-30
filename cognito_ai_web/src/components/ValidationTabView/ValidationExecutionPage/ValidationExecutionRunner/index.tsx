import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "../../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { Label } from "../../ui/label"
import { Input } from "../../ui/input"
import { Checkbox } from "../../ui/checkbox"
import { Loader2, Settings, Plus, Trash2, Eye } from "lucide-react"
import type { Validation } from "../../types"
import { toast } from "sonner"
import {
  executeValidationComponent,
  getSapApplications,
  getSapSystemNumbers,
  getSapClientIds,
  getSapConnectionsList,
  getSapTables,
  getSapTableData
} from "../../API/validationApi"
import { useValidationStore } from "../../Stores/validationStore"
import ValuePickerDialog from "./ValuePickerDialog"
import ValidationResultsModal from "../../ValidationResultsModal"
import ExistingConnectionsCard from "./ExistingConnectionsCard"
import { AlternativeSelect } from "../../ui/alternative-select"
import ViewDataModal from "./ViewDataModal"

interface ValidationExecutionRunnerProps {
    validationId: string | null
    validationData: Validation | null
    validationType: string | null
    onBack: () => void
    tableData?: any[]
    onValidationResults?: (results: any) => void
}

interface CrossConnection {
    id: string
    sourceTable: string
    sourceField: string
    targetTable: string
    targetField: string
}

const ValidationExecutionRunner: React.FC<ValidationExecutionRunnerProps> = ({
  validationId,
  validationData,
  validationType,
  onBack,
  tableData = [],
  onValidationResults
}) => {
  const [selectedTable, setSelectedTable] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [executionResults, setExecutionResults] = useState<any>(null)
  const [availableTables, setAvailableTables] = useState<string[]>([])
  const [isExecuteClicked, setIsExecuteClicked] = useState(false)
  
  // Add state for validation results modal
  const [validationResults, setValidationResults] = useState<any>(null)
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false)

  // View data modal state
  const [isViewDataModalOpen, setIsViewDataModalOpen] = useState(false)
  const [viewDataTableName, setViewDataTableName] = useState<string>("")
  const [viewDataContent, setViewDataContent] = useState<any[]>([])
  const [isLoadingViewData, setIsLoadingViewData] = useState(false)

  // Execution params - support multiple primary key fields
  const [primaryKeyValues, setPrimaryKeyValues] = useState<Record<string, string>>({})
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false)
  const [selectedValue, setSelectedValue] = useState<{ value: any; column: string } | null>(null)

  // Cross connection state
  const [isCrossConnectionEnabled, setIsCrossConnectionEnabled] = useState<boolean>(false)
  const [crossConnections, setCrossConnections] = useState<CrossConnection[]>([])
  const [availableFields, setAvailableFields] = useState<Record<string, string[]>>({})

  // Dropdown groups state - each group represents a row of dropdowns
  interface DropdownGroup {
    id: string
    application: string
    systemNumber: string
    clientId: string
    connection: string
    table: string
    // Options for this specific group
    systemNumbers: Array<{label: string, value: string}>
    clientIds: Array<{label: string, value: string}>
    tables: string[]
    // Loading states for this group
    loadingSystemNumbers: boolean
    loadingClientIds: boolean
    loadingTables: boolean
  }

  const [dropdownGroups, setDropdownGroups] = useState<DropdownGroup[]>([
    {
      id: `initial-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      application: "",
      systemNumber: "",
      clientId: "",
      connection: "",
      table: "",
      systemNumbers: [],
      clientIds: [],
      tables: [],
      loadingSystemNumbers: false,
      loadingClientIds: false,
      loadingTables: false
    }
  ])

  // Global dropdown options (shared across all groups)
  const [applications, setApplications] = useState<Array<{label: string, value: string}>>([])
  const [connections, setConnections] = useState<Array<{label: string, value: number}>>([])
  const [isLoadingApplications, setIsLoadingApplications] = useState<boolean>(false)
  const [isLoadingConnections, setIsLoadingConnections] = useState<boolean>(false)

  const { primary_table } = useValidationStore()

  // Initialize tables and auto-select primary table
  useEffect(() => {
    let tables: string[] = []

    if (tableData && Array.isArray(tableData) && tableData.length > 0) {
      const tableDataTables = [...new Set(tableData.map((table: any) => table.TableName || table.table_name))]
      tables = [...tables, ...tableDataTables]
    }

    if (validationData?.primary_table && !tables.includes(validationData.primary_table)) {
      tables.push(validationData.primary_table)
    }

    if (validationData?.tableData && Array.isArray(validationData.tableData)) {
      const validationTableDataTables = validationData.tableData.map(
        (table: any) => table.TableName || table.table_name,
      )
      tables = [...new Set([...tables, ...validationTableDataTables])]
    }

    if (primary_table && !tables.includes(primary_table)) {
      tables.push(primary_table)
    }

    if (tables.length === 0) {
      tables = ["MARA", "MARC", "MARD", "MBEW", "MAKT"]
    }

    setAvailableTables(tables)

    // Auto-select primary table
    const primaryTableToSelect = validationData?.primary_table || primary_table
    if (primaryTableToSelect && tables.includes(primaryTableToSelect)) {
      setSelectedTable(primaryTableToSelect)
    }
  }, [validationData, primary_table, tableData])

  // Initialize available fields for each table
  useEffect(() => {
    const fields: Record<string, string[]> = {}
    
    // Get fields from tableData
    if (tableData && Array.isArray(tableData)) {
      tableData.forEach((table: any) => {
        const tableName = table.TableName || table.table_name
        if (tableName) {
          if (!fields[tableName]) {
            fields[tableName] = []
          }
          const fieldName = table.FieldName || table.field_name || table.column_name
          if (fieldName && !fields[tableName].includes(fieldName)) {
            fields[tableName].push(fieldName)
          }
        }
      })
    }

    // Get fields from validationData.tableData
    if (validationData?.tableData && Array.isArray(validationData.tableData)) {
      validationData.tableData.forEach((table: any) => {
        const tableName = table.TableName || table.table_name
        if (tableName) {
          if (!fields[tableName]) {
            fields[tableName] = []
          }
          const fieldName = table.FieldName || table.field_name || table.column_name
          if (fieldName && !fields[tableName].includes(fieldName)) {
            fields[tableName].push(fieldName)
          }
        }
      })
    }

    // Add default fields for common SAP tables if no fields found
    availableTables.forEach(tableName => {
      if (!fields[tableName] || fields[tableName].length === 0) {
        fields[tableName] = ["CLIENT", "MATNR", "WERKS", "LGORT", "VKORG", "VTWEG", "SPART"]
      }
    })

    setAvailableFields(fields)
  }, [tableData, validationData, availableTables])

  const openPicker = async () => {
    if (!selectedTable) {
      toast.error("Please select a primary table first")
      return
    }
    setIsPickerOpen(true)
  }

  const handleValueSelected = (value: any, column: string) => {
    setSelectedValue({ value, column })
    // Update the primary key value for the selected column
    setPrimaryKeyValues(prev => ({
      ...prev,
      [column]: String(value)
    }))
    setIsPickerOpen(false)
    toast.success("Value selected")
  }

  const handleCrossConnectionToggle = (checked: boolean) => {
    setIsCrossConnectionEnabled(checked)
    if (!checked) {
      setCrossConnections([])
    } else {
      // Add one empty connection when enabled
      setCrossConnections([{
        id: Date.now().toString(),
        sourceTable: "",
        sourceField: "",
        targetTable: "",
        targetField: ""
      }])
    }
  }

  const addCrossConnection = () => {
    const newConnection: CrossConnection = {
      id: Date.now().toString(),
      sourceTable: "",
      sourceField: "",
      targetTable: "",
      targetField: ""
    }
    setCrossConnections([...crossConnections, newConnection])
  }

  const removeCrossConnection = (id: string) => {
    setCrossConnections(crossConnections.filter(conn => conn.id !== id))
  }

  const updateCrossConnection = (id: string, field: keyof CrossConnection, value: string) => {
    setCrossConnections(crossConnections.map(conn => 
      conn.id === id ? { ...conn, [field]: value } : conn
    ))
  }

  const executeWithParams = async () => {
    setIsExecuteClicked(true)
    // Validation checks (matching FieldValidationComponent)
    if (!validationData?.validation_id && !validationId) {
      toast.error("Validation ID is required to execute validation.")
      return
    }

    // Get primary table
    const primaryTable = validationData?.primary_table || ""
    if (!primaryTable) {
      toast.error("Please select a primary table.")
      return
    }

    // Get primary key fields
    const primaryKeyFields = validationData?.primary_key_fields || []
    const primaryKeyFieldsArray = Array.isArray(primaryKeyFields)
      ? primaryKeyFields
      : (typeof primaryKeyFields === 'string' ? primaryKeyFields.split(',').map((f: string) => f.trim()) : [])

    if (primaryKeyFieldsArray.length === 0) {
      toast.error("Please select at least one primary key field.")
      return
    }

    // Check if all primary key values are filled
    const emptyFields = primaryKeyFieldsArray.filter((field: string) => !primaryKeyValues[field])
    if (emptyFields.length > 0) {
      toast.error(`Please fill in all primary key fields: ${emptyFields.join(', ')}`)
      return
    }

    setIsLoading(true)
    try {
      const vcId = (validationData as any)?.validation_id || validationId || ""

      // Construct the parameters object in format "TABLE.FIELD" = value (matching FieldValidationComponent)
      const parameters: Record<string, any> = {}
      primaryKeyFieldsArray.forEach((field: string) => {
        const parameterKey = `${primaryTable}.${field}`
        parameters[parameterKey] = primaryKeyValues[field]
      })

      // Payload matching FieldValidationComponent (just validation_id and parameters)
      const payload = {
        validation_id: vcId,
        parameters,
      }
      
      console.log("Executing validation with payload:", payload)

      const response = await executeValidationComponent(payload)

      // Store the results and open the modal (same as FieldValidationComponent)
      setValidationResults(response)
      setIsResultsModalOpen(true)

      toast.success("Validation executed successfully!")
      console.log("Validation execution response:", response)
    } catch (error: any) {
      console.error("Validation execution failed:", error)
      toast.error(`Validation execution failed: ${error.message || "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseResultsModal = () => {
    setIsResultsModalOpen(false)
    setValidationResults(null)
  }

  // Handler for viewing table data
  const handleViewData = async (groupId: string) => {
    const group = dropdownGroups.find(g => g.id === groupId)
    if (!group || !group.table || !group.connection) {
      toast.error("Please select a connection and table first")
      return
    }

    setViewDataTableName(group.table)
    setIsViewDataModalOpen(true)
    setIsLoadingViewData(true)
    setViewDataContent([])

    try {
      const response = await getSapTableData({
        payload: {
          data: {
            table: group.table,
            columns: [],
            maxnumber:10
          },
          actions: "get_data",
          connection: Number(group.connection),
          protocol_type: "RFC"
        }
      })
      if (response?.status && response?.data) {
        setViewDataContent(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch table data:", error)
      toast.error("Failed to load table data")
    } finally {
      setIsLoadingViewData(false)
    }
  }

  const handleCloseViewDataModal = () => {
    setIsViewDataModalOpen(false)
    setViewDataTableName("")
    setViewDataContent([])
  }

  // Handler for multiple connections selection from table
  const handleConnectionsSelect = async (selectedConnections: any[]) => {
    if (selectedConnections.length === 0) {
      // Reset to one empty group
      setDropdownGroups([{
        id: `reset-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        application: "",
        systemNumber: "",
        clientId: "",
        connection: "",
        table: "",
        systemNumbers: [],
        clientIds: [],
        tables: [],
        loadingSystemNumbers: false,
        loadingClientIds: false,
        loadingTables: false
      }])
      return
    }

    // Step 1: Immediately create groups with basic data (don't wait for any APIs)
    const initialGroups: DropdownGroup[] = selectedConnections.map((conn, index) => ({
      id: `conn-${conn.id}-${Date.now()}-${index}`,
      application: conn.application,
      systemNumber: conn.system_number,
      clientId: conn.client_id,
      connection: String(conn.id),
      table: "",
      systemNumbers: [],
      clientIds: [],
      tables: [],
      loadingSystemNumbers: true,  // Show loading
      loadingClientIds: true,       // Show loading
      loadingTables: true           // Show loading
    }))

    // Set groups immediately
    setDropdownGroups(initialGroups)

    // Step 2: Fetch data for each group in parallel (non-blocking)
    selectedConnections.forEach(async (conn, index) => {
      const groupId = initialGroups[index].id

      // Fetch system numbers
      try {
        const sysNumResponse = await getSapSystemNumbers({
          payload: {
            data: { application: conn.application },
            actions: "get_system_numbers"
          }
        })
        if (sysNumResponse?.status && sysNumResponse?.data) {
          updateDropdownGroup(groupId, 'systemNumbers', sysNumResponse.data)
        }
      } catch (error) {
        console.error(`Failed to fetch system numbers for ${conn.application}:`, error)
      } finally {
        updateDropdownGroup(groupId, 'loadingSystemNumbers', false)
      }

      // Fetch client IDs
      try {
        const clientIdsResponse = await getSapClientIds({
          payload: {
            data: {
              application: conn.application,
              system_number: conn.system_number
            },
            actions: "get_client_ids"
          }
        })
        if (clientIdsResponse?.status && clientIdsResponse?.data) {
          updateDropdownGroup(groupId, 'clientIds', clientIdsResponse.data)
        }
      } catch (error) {
        console.error(`Failed to fetch client IDs:`, error)
      } finally {
        updateDropdownGroup(groupId, 'loadingClientIds', false)
      }

      // Fetch tables (don't block on this)
      try {
        const response = await getSapTables({
          payload: {
            data: {
              schema: "",
              search: "",
              database: ""
            },
            actions: "get_tables",
            connection: conn.id,
            protocol_type: "RFC"
          }
        })
        if (response?.status && response?.data) {
          updateDropdownGroup(groupId, 'tables', response.data)
        }
      } catch (error) {
        console.error(`Failed to fetch tables for connection ${conn.id}:`, error)
      } finally {
        updateDropdownGroup(groupId, 'loadingTables', false)
      }
    })
  }

  // Add a new dropdown group
  const addDropdownGroup = () => {
    const newGroup: DropdownGroup = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      application: "",
      systemNumber: "",
      clientId: "",
      connection: "",
      table: "",
      systemNumbers: [],
      clientIds: [],
      tables: [],
      loadingSystemNumbers: false,
      loadingClientIds: false,
      loadingTables: false
    }
    setDropdownGroups(prev => [...prev, newGroup])
  }

  // Remove a dropdown group
  const removeDropdownGroup = (groupId: string) => {
    setDropdownGroups(prev => {
      if (prev.length > 1) {
        return prev.filter(g => g.id !== groupId)
      }
      return prev
    })
  }

  // Update a specific group's field
  const updateDropdownGroup = (groupId: string, field: keyof DropdownGroup, value: any) => {
    setDropdownGroups(prev => prev.map(group =>
      group.id === groupId ? { ...group, [field]: value } : group
    ))
  }

  // Fetch system numbers for a specific group
  const fetchSystemNumbersForGroup = async (groupId: string, application: string) => {
    updateDropdownGroup(groupId, 'loadingSystemNumbers', true)
    try {
      const response = await getSapSystemNumbers({
        payload: {
          data: { application },
          actions: "get_system_numbers"
        }
      })
      if (response?.status && response?.data) {
        updateDropdownGroup(groupId, 'systemNumbers', response.data)
      }
    } catch (error) {
      console.error("Failed to fetch system numbers:", error)
    } finally {
      updateDropdownGroup(groupId, 'loadingSystemNumbers', false)
    }
  }

  // Fetch client IDs for a specific group
  const fetchClientIdsForGroup = async (groupId: string, application: string, systemNumber: string) => {
    updateDropdownGroup(groupId, 'loadingClientIds', true)
    try {
      const response = await getSapClientIds({
        payload: {
          data: { application, system_number: systemNumber },
          actions: "get_client_ids"
        }
      })
      if (response?.status && response?.data) {
        updateDropdownGroup(groupId, 'clientIds', response.data)
      }
    } catch (error) {
      console.error("Failed to fetch client IDs:", error)
    } finally {
      updateDropdownGroup(groupId, 'loadingClientIds', false)
    }
  }

  // Fetch tables for a specific group
  const fetchTablesForGroup = async (groupId: string, connectionId: string) => {
    updateDropdownGroup(groupId, 'loadingTables', true)
    try {
      const response = await getSapTables({
        payload: {
          data: { schema: "", search: "", database: "" },
          actions: "get_tables",
          connection: Number(connectionId),
          protocol_type: "RFC"
        }
      })
      if (response?.status && response?.data) {
        updateDropdownGroup(groupId, 'tables', response.data)
      }
    } catch (error) {
      console.error("Failed to fetch tables:", error)
    } finally {
      updateDropdownGroup(groupId, 'loadingTables', false)
    }
  }

  // Handle application change for a group
  const handleApplicationChange = (groupId: string, value: string) => {
    updateDropdownGroup(groupId, 'application', value)
    updateDropdownGroup(groupId, 'systemNumber', "")
    updateDropdownGroup(groupId, 'clientId', "")
    updateDropdownGroup(groupId, 'systemNumbers', [])
    updateDropdownGroup(groupId, 'clientIds', [])
    if (value) {
      fetchSystemNumbersForGroup(groupId, value)
    }
  }

  // Handle system number change for a group
  const handleSystemNumberChange = (groupId: string, value: string, application: string) => {
    updateDropdownGroup(groupId, 'systemNumber', value)
    updateDropdownGroup(groupId, 'clientId', "")
    updateDropdownGroup(groupId, 'clientIds', [])
    if (value && application) {
      fetchClientIdsForGroup(groupId, application, value)
    }
  }

  // Handle connection change for a group
  const handleConnectionChange = (groupId: string, value: string) => {
    updateDropdownGroup(groupId, 'connection', value)
    updateDropdownGroup(groupId, 'table', "")
    updateDropdownGroup(groupId, 'tables', [])
    if (value) {
      fetchTablesForGroup(groupId, value)
    }
  }

  // Fetch applications and connections on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingApplications(true)
      setIsLoadingConnections(true)

      try {
        const [appsResponse, connsResponse] = await Promise.all([
          getSapApplications({
            payload: {
              data: {
                protocol_type: "RFC"
              },
              actions: "get_applications"
            }
          }),
          getSapConnectionsList({
            fields: '["id as value", "name as label"]',
            connection_type: "sap"
          })
        ])

        if (appsResponse?.status && appsResponse?.data) {
          setApplications(appsResponse.data)
        }
        if (connsResponse?.status && connsResponse?.data) {
          setConnections(connsResponse.data)
        }
      } catch (error) {
        console.error("Failed to fetch initial data:", error)
      } finally {
        setIsLoadingApplications(false)
        setIsLoadingConnections(false)
      }
    }

    fetchInitialData()
  }, [])

  return (
    <div className="space-y-2">
      {/* Header Section - Only show for validation type */}
      {validationType === "validation" && (
        <>
          {/* Existing Connections Card */}
          <ExistingConnectionsCard 
            savedConnectionData={{
              source_application: validationData?.source_application,
              system_number: validationData?.system_number,
              system_number_label: validationData?.system_number_label,
              client_id: validationData?.client_id,
              client_id_label: validationData?.client_id_label,
              database_connection: validationData?.database_connection,
              database_connection_label: validationData?.database_connection_label,
            }}
            connectionsList={connections}
          />
          {/* Card 2 - Remaining Controls */}
          <Card className="p-2">
            <CardContent className="p-2">
              <div className="flex flex-col gap-2">
                {/* Primary Key Fields - Multiple Inputs */}
                {(() => {
                  const primaryTable = validationData?.primary_table || selectedTable;
                  const primaryKeyFields = validationData?.primary_key_fields || []
                  const primaryKeyFieldsArray = Array.isArray(primaryKeyFields)
                    ? primaryKeyFields
                    : (typeof primaryKeyFields === 'string' ? primaryKeyFields.split(',').map((f: string) => f.trim()) : [])

                  if (primaryKeyFieldsArray.length === 0) {
                    return (
                      <div className="text-sm text-gray-500">No primary key fields defined</div>
                    )
                  }

                  return primaryKeyFieldsArray.map((fieldName: string, index: number) => {
                    // Find field description from tableData
                    let fieldDescription = fieldName
                    let specificMapping = null

                    // First try flat structure
                    specificMapping = tableData.find((item: any) =>
                      (item.TableName || item.table_name) === primaryTable &&
                      (item.FieldName || item.field_name) === fieldName
                    )

                    // If not found, try nested Fields structure
                    if (!specificMapping) {
                      const tableEntry = tableData.find((item: any) =>
                        (item.TableName || item.table_name) === primaryTable
                      )
                      if (tableEntry?.Fields && Array.isArray(tableEntry.Fields)) {
                        specificMapping = tableEntry.Fields.find((field: any) =>
                          field.FieldName === fieldName
                        )
                      }
                    }

                    if (specificMapping?.Description) {
                      fieldDescription = specificMapping.Description
                    }

                    return (
                      <div key={fieldName} className="flex items-center gap-2">
                        <Label className="text-sm font-medium whitespace-nowrap min-w-[140px]">
                          {fieldDescription}:
                        </Label>
                        <Input
                          placeholder={`Enter ${fieldDescription}`}
                          value={primaryKeyValues[fieldName] || ""}
                          onChange={(e) => {
                            setPrimaryKeyValues(prev => ({  
                              ...prev,
                              [fieldName]: e.target.value
                            }))
                          }}
                          className="h-9 w-[250px]"
                        />
                        {/* Execute Button - Only show beside first input */}
                        {index === 0 && (
                          <Button
                            variant={isExecuteClicked ? "default" : "outline"}
                            onClick={executeWithParams}
                            className={`!h-9 shrink-0 ${!isExecuteClicked ? "bg-white" : ""}`}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Execute
                          </Button>
                        )}
                      </div>
                    )
                  })
                })()}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Content Area */}
      {validationType !== "validation" ? (
        <Card className="p-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {validationType?.toUpperCase() || "Execution"} - Coming soon
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            This module is under construction. Please check back later.
          </CardContent>
        </Card>
      ) : (
        (isLoading || executionResults) && (
          <div className="p-4 text-sm text-gray-600">
            {isLoading ? "Loading results..." : "Execution completed."}
          </div>
        )
      )}

      {/* Value Picker Dialog */}
      <ValuePickerDialog
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        selectedTable={selectedTable}
        validationData={validationData}
        onValueSelected={handleValueSelected}
        selectedValue={selectedValue}
        primaryKeyField={(() => {
          // Get primary key field from validation data or table data
          const primaryTable = validationData?.primary_table || selectedTable;
          const primaryKeyFields = validationData?.primary_key_fields;
          
          if (primaryKeyFields && Array.isArray(primaryKeyFields) && primaryKeyFields.length > 0) {
            return primaryKeyFields[0]; // Use first primary key field
          }
          
          // Fallback: get first key field from table data
          const tableFields = tableData.filter((item: any) => 
            (item.TableName || item.table_name) === primaryTable &&
            (item.KeyField === 'Y' || item.KeyField === 'Yes' || item.is_key === true)
          );
          
          if (tableFields.length > 0) {
            return tableFields[0].FieldName || tableFields[0].field_name;
          }
          
          return "";
        })()}
      />

      {/* Validation Results Modal */}
      <ValidationResultsModal
        isOpen={isResultsModalOpen}
        onClose={handleCloseResultsModal}
        results={validationResults}
      />

      <ViewDataModal
        isOpen={isViewDataModalOpen}
        onClose={handleCloseViewDataModal}
        tableName={viewDataTableName}
        tableData={viewDataContent}
        isLoading={isLoadingViewData}
      />
    </div>
  )
}

export default ValidationExecutionRunner
