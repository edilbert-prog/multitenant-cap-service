import React, { useMemo, useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Loader2, ArrowRight, Pencil, Lock } from "lucide-react"
import type { FormFieldOption } from "../types"
import DropdownV2 from "../../../utils/DropdownV2"
import CustomTableData from "../../../utils/CustomTableData"
import { toast } from "sonner"
import { getSapTables, getSapSystemNumbersNew, getSapClientIdsNew, getSapConnectionBySysClient } from "../API/validationApi"
import { useValidationStore } from "../Stores/validationStore"

interface TableMappingConfigProps {
  // Store values
  selected_secondary_tables: string
  table_mappings: any[]
  
  // Store setters
  setSelectedSecondaryTables: (tables: string) => void
  
  // Computed values
  foreignTablesWithKeyAndVerification: FormFieldOption[]
  selectedSecondaryTablesArray: string[]
  sourceApplicationOptions: FormFieldOption[]
  sourceApplication: string
  
  // Actions
  onConfigureRules: () => void
  
  // State
  isLoading: { foreignTables: boolean; mappings: boolean; fields: boolean }
  mode: "add" | "edit" | "view" | "execute"
}

export const TableMappingConfig: React.FC<TableMappingConfigProps> = ({
  selected_secondary_tables,
  table_mappings,
  setSelectedSecondaryTables,
  foreignTablesWithKeyAndVerification,
  selectedSecondaryTablesArray,
  sourceApplicationOptions,
  sourceApplication,
  onConfigureRules,
  isLoading,
  mode,
}) => {
  const [isConfigureClicked, setIsConfigureClicked] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState("")
  const [selectedTable, setSelectedTable] = useState("")
  const [selectedSystemNumber, setSelectedSystemNumber] = useState("")
  const [selectedClientId, setSelectedClientId] = useState("")
  const [selectedConnection, setSelectedConnection] = useState("")
  
  // Options states
  const [tableOptions, setTableOptions] = useState<FormFieldOption[]>([])
  const [systemNumberOptions, setSystemNumberOptions] = useState<FormFieldOption[]>([])
  const [clientIdOptions, setClientIdOptions] = useState<FormFieldOption[]>([])
  const [connectionOptions, setConnectionOptions] = useState<FormFieldOption[]>([])
  
  // Loading states
  const [isLoadingTables, setIsLoadingTables] = useState(false)
  const [isLoadingSystemNumbers, setIsLoadingSystemNumbers] = useState(false)
  const [isLoadingClientIds, setIsLoadingClientIds] = useState(false)
  const [isLoadingConnections, setIsLoadingConnections] = useState(false)
  
  // Edit mode state
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [editSystemNumber, setEditSystemNumber] = useState("")
  const [editClientId, setEditClientId] = useState("")
  const [editConnection, setEditConnection] = useState("")
  const [editApplication, setEditApplication] = useState("")
  
  // Edit mode options states
  const [editSystemNumberOptions, setEditSystemNumberOptions] = useState<FormFieldOption[]>([])
  const [editClientIdOptions, setEditClientIdOptions] = useState<FormFieldOption[]>([])
  const [editConnectionOptions, setEditConnectionOptions] = useState<FormFieldOption[]>([])
  const [editTableOptions, setEditTableOptions] = useState<FormFieldOption[]>([])
  
  // Edit mode loading states
  const [isLoadingEditSystemNumbers, setIsLoadingEditSystemNumbers] = useState(false)
  const [isLoadingEditClientIds, setIsLoadingEditClientIds] = useState(false)
  const [isLoadingEditConnections, setIsLoadingEditConnections] = useState(false)
  const [isLoadingEditTables, setIsLoadingEditTables] = useState(false)
  
  // Get store values for auto-selection
  const { system_number, client_id, database_connection, system_number_label, client_id_label, setTableMappings, table_mappings: storeTableMappings } = useValidationStore()
  
  // Use refs to track previous values and prevent unnecessary API calls
  const prevSelectedApplication = useRef<string>("")
  const prevSelectedSystemNumber = useRef<string>("")
  const prevSelectedClientId = useRef<string>("")
  const prevSelectedConnection = useRef<string>("")
  
  // Auto-select application from sourceApplication prop
  useEffect(() => {
    if (sourceApplication && !selectedApplication) {
      setSelectedApplication(sourceApplication)
    }
  }, [sourceApplication, selectedApplication])
  
  // Fetch system numbers when application changes
  useEffect(() => {
    // Only call API if the value actually changed
    if (selectedApplication && selectedApplication !== prevSelectedApplication.current) {
      prevSelectedApplication.current = selectedApplication
      
      // Call API to fetch system numbers
      const fetchData = async () => {
        setIsLoadingSystemNumbers(true)
        try {
          const response = await getSapSystemNumbersNew({
            payload: {
              data: { application: selectedApplication },
              actions: "get_system_numbers",
            },
          })
          if (response?.status && Array.isArray(response.data)) {
            setSystemNumberOptions(response.data)
            // Auto-select if it matches store value
            if (system_number) {
              const found = response.data.find((opt: FormFieldOption) => opt.value === system_number)
              if (found) {
                setSelectedSystemNumber(system_number)
              }
            }
          }
        } catch (error) {
          console.error("Error fetching system numbers:", error)
          toast.error("Failed to fetch system numbers")
        } finally {
          setIsLoadingSystemNumbers(false)
        }
      }
      
      fetchData()
    } else if (!selectedApplication) {
      prevSelectedApplication.current = ""
      setSystemNumberOptions([])
      setSelectedSystemNumber("")
      setClientIdOptions([])
      setSelectedClientId("")
      setConnectionOptions([])
      setSelectedConnection("")
      setTableOptions([])
      setSelectedTable("")
    }
  }, [selectedApplication, system_number])
  
  // Fetch client IDs when system number changes
  useEffect(() => {
    // Only call API if the value actually changed
    if (selectedSystemNumber && selectedSystemNumber !== prevSelectedSystemNumber.current) {
      prevSelectedSystemNumber.current = selectedSystemNumber
      
      // Call API to fetch client IDs
      const fetchData = async () => {
        setIsLoadingClientIds(true)
        try {
          const response = await getSapClientIdsNew({
            payload: {
              data: { system_number: selectedSystemNumber },
              actions: "get_client_ids",
            },
          })
          if (response?.status && Array.isArray(response.data)) {
            setClientIdOptions(response.data)
            // Auto-select if it matches store value
            if (client_id) {
              const found = response.data.find((opt: FormFieldOption) => opt.value === client_id)
              if (found) {
                setSelectedClientId(client_id)
              }
            }
          }
        } catch (error) {
          console.error("Error fetching client IDs:", error)
          toast.error("Failed to fetch client IDs")
        } finally {
          setIsLoadingClientIds(false)
        }
      }
      
      fetchData()
    } else if (!selectedSystemNumber) {
      prevSelectedSystemNumber.current = ""
      setClientIdOptions([])
      setSelectedClientId("")
      setConnectionOptions([])
      setSelectedConnection("")
      setTableOptions([])
      setSelectedTable("")
    }
  }, [selectedSystemNumber, client_id])
  
  // Fetch connections when client ID changes
  useEffect(() => {
    // Only call API if the value actually changed
    if (selectedClientId && selectedSystemNumber && 
        (selectedClientId !== prevSelectedClientId.current || selectedSystemNumber !== prevSelectedSystemNumber.current)) {
      prevSelectedClientId.current = selectedClientId
      prevSelectedSystemNumber.current = selectedSystemNumber
      
      // Call API to fetch connections
      const fetchData = async () => {
        setIsLoadingConnections(true)
        try {
          const response = await getSapConnectionBySysClient({
            payload: {
              data: { client_id: selectedClientId, system_number: selectedSystemNumber },
              actions: "get_connection_client_sysnr",
            },
          })
          if (response?.status && Array.isArray(response.data)) {
            setConnectionOptions(response.data)
            // Auto-select if it matches store value
            if (database_connection) {
              const found = response.data.find((opt: FormFieldOption) => String(opt.value) === String(database_connection))
              if (found) {
                setSelectedConnection(String(database_connection))
              }
            } else if (response.data.length > 0) {
              // Auto-select first connection if no store value
              setSelectedConnection(String(response.data[0].value))
            }
          }
        } catch (error) {
          console.error("Error fetching connections:", error)
          toast.error("Failed to fetch connections")
        } finally {
          setIsLoadingConnections(false)
        }
      }
      
      fetchData()
    } else if (!selectedClientId || !selectedSystemNumber) {
      prevSelectedClientId.current = ""
      setConnectionOptions([])
      setSelectedConnection("")
      setTableOptions([])
      setSelectedTable("")
    }
  }, [selectedClientId, selectedSystemNumber, database_connection])
  
  // Fetch tables when connection changes
  useEffect(() => {
    // Only call API if the value actually changed
    if (selectedConnection && selectedConnection !== prevSelectedConnection.current) {
      prevSelectedConnection.current = selectedConnection
      
      // Call API to fetch tables
      const fetchData = async () => {
        setIsLoadingTables(true)
        try {
          const connectionId = typeof selectedConnection === 'string' ? parseInt(selectedConnection) : selectedConnection
          const response = await getSapTables({
            payload: {
              data: {
                schema: "",
                search: "",
                database: ""
              },
              actions: "get_tables",
              connection: connectionId,
              protocol_type: "RFC"
            }
          })
          if (response?.status && response?.data) {
            const tables = Array.isArray(response.data) 
              ? response.data.map((table: any) => ({
                  label: table.TABNAME || table.table_name || table.name || String(table),
                  value: table.TABNAME || table.table_name || table.name || String(table)
                }))
              : []
            setTableOptions(tables)
          }
        } catch (error) {
          console.error("Error fetching tables:", error)
          toast.error("Failed to fetch tables")
        } finally {
          setIsLoadingTables(false)
        }
      }
      
      fetchData()
    } else if (!selectedConnection) {
      prevSelectedConnection.current = ""
      setTableOptions([])
      setSelectedTable("")
    }
  }, [selectedConnection])
  
  // Auto-populate from store when system numbers are loaded
  useEffect(() => {
    if (system_number && systemNumberOptions.length > 0 && selectedSystemNumber !== system_number) {
      const found = systemNumberOptions.find((opt: FormFieldOption) => opt.value === system_number)
      if (found) {
        setSelectedSystemNumber(system_number)
      }
    }
  }, [system_number, systemNumberOptions, selectedSystemNumber])
  
  // Auto-populate from store when client IDs are loaded
  useEffect(() => {
    if (client_id && clientIdOptions.length > 0 && selectedClientId !== client_id) {
      const found = clientIdOptions.find((opt: FormFieldOption) => opt.value === client_id)
      if (found) {
        setSelectedClientId(client_id)
      }
    }
  }, [client_id, clientIdOptions, selectedClientId])
  
  // Auto-populate from store when connections are loaded
  useEffect(() => {
    if (database_connection && connectionOptions.length > 0 && String(selectedConnection) !== String(database_connection)) {
      const found = connectionOptions.find((opt: FormFieldOption) => String(opt.value) === String(database_connection))
      if (found) {
        setSelectedConnection(String(database_connection))
      }
    } else if (!database_connection && connectionOptions.length > 0 && !selectedConnection) {
      // Auto-select first connection if no store value
      setSelectedConnection(String(connectionOptions[0].value))
    }
  }, [database_connection, connectionOptions, selectedConnection])
  
  const fetchSystemNumbers = async () => {
    setIsLoadingSystemNumbers(true)
    try {
      const response = await getSapSystemNumbersNew({
        payload: {
          data: { application: selectedApplication },
          actions: "get_system_numbers",
        },
      })
      if (response?.status && Array.isArray(response.data)) {
        setSystemNumberOptions(response.data)
        // Auto-select if it matches store value
        if (system_number) {
          const found = response.data.find((opt: FormFieldOption) => opt.value === system_number)
          if (found) {
            setSelectedSystemNumber(system_number)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching system numbers:", error)
      toast.error("Failed to fetch system numbers")
    } finally {
      setIsLoadingSystemNumbers(false)
    }
  }
  
  const fetchClientIds = async () => {
    setIsLoadingClientIds(true)
    try {
      const response = await getSapClientIdsNew({
        payload: {
          data: { system_number: selectedSystemNumber },
          actions: "get_client_ids",
        },
      })
      if (response?.status && Array.isArray(response.data)) {
        setClientIdOptions(response.data)
        // Auto-select if it matches store value
        if (client_id) {
          const found = response.data.find((opt: FormFieldOption) => opt.value === client_id)
          if (found) {
            setSelectedClientId(client_id)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching client IDs:", error)
      toast.error("Failed to fetch client IDs")
    } finally {
      setIsLoadingClientIds(false)
    }
  }
  
  const fetchConnections = async () => {
    if (!selectedClientId || !selectedSystemNumber) return
    
    setIsLoadingConnections(true)
    try {
      const response = await getSapConnectionBySysClient({
        payload: {
          data: { client_id: selectedClientId, system_number: selectedSystemNumber },
          actions: "get_connection_client_sysnr",
        },
      })
      if (response?.status && Array.isArray(response.data)) {
        setConnectionOptions(response.data)
        // Auto-select if it matches store value
        if (database_connection) {
          const found = response.data.find((opt: FormFieldOption) => String(opt.value) === String(database_connection))
          if (found) {
            setSelectedConnection(String(database_connection))
          }
        } else if (response.data.length > 0) {
          // Auto-select first connection if no store value
          setSelectedConnection(String(response.data[0].value))
        }
      }
    } catch (error) {
      console.error("Error fetching connections:", error)
      toast.error("Failed to fetch connections")
    } finally {
      setIsLoadingConnections(false)
    }
  }
  
  const fetchTables = async () => {
    if (!selectedConnection) return
    
    setIsLoadingTables(true)
    try {
      const connectionId = typeof selectedConnection === 'string' ? parseInt(selectedConnection) : selectedConnection
      const response = await getSapTables({
        payload: {
          data: {
            schema: "",
            search: "",
            database: ""
          },
          actions: "get_tables",
          connection: connectionId,
          protocol_type: "RFC"
        }
      })
      if (response?.status && response?.data) {
        const tables = Array.isArray(response.data) 
          ? response.data.map((table: any) => ({
              label: table.TABNAME || table.table_name || table.name || String(table),
              value: table.TABNAME || table.table_name || table.name || String(table)
            }))
          : []
        setTableOptions(tables)
      }
    } catch (error) {
      console.error("Error fetching tables:", error)
      toast.error("Failed to fetch tables")
    } finally {
      setIsLoadingTables(false)
    }
  }

  const handleConfigureClick = () => {
    setIsConfigureClicked(true)
    onConfigureRules()
    // Keep clicked state to show normal button styling
  }
  // Handle adding table to mappings
  const handleAddTable = () => {
    if (!selectedTable) {
      toast.error("Please select a table")
      return
    }
    if (!selectedApplication || !selectedSystemNumber || !selectedClientId || !selectedConnection) {
      toast.error("Please select all connection parameters")
      return
    }
    
    // Check if table already exists
    const tableExists = table_mappings.some(m => m.foreign_table === selectedTable)
    if (tableExists) {
      toast.error("This table is already mapped")
      return
    }
    
    // Get primary table from store or props
    const { primary_table } = useValidationStore.getState()
    if (!primary_table) {
      toast.error("Please select a primary table first")
      return
    }
    
    // Create a new mapping - you'll need to determine the primary_table_field and foreign_table_field
    // For now, we'll create a basic mapping that can be edited later
    const newMapping = {
      primary_table: primary_table,
      primary_table_field: "", // This should be set based on your logic
      foreign_table: selectedTable,
      foreign_table_field: "", // This should be set based on your logic
      cardinality: "",
      application: selectedApplication,
      system_number: selectedSystemNumber,
      client_id: selectedClientId,
      connection: selectedConnection,
    }
    
    // Add to mappings
    const updatedMappings = [...table_mappings, newMapping]
    setTableMappings(updatedMappings)
    toast.success(`Table ${selectedTable} added to mappings`)
    
    // Reset selections
    setSelectedTable("")
  }
  
  // Handle edit row
  const handleEditRow = async (mapping: any) => {
    // Get values from mapping with fallbacks
    const editApp = mapping.application || selectedApplication || ""
    const editSysNum = mapping.system_number || system_number || ""
    const editClient = mapping.client_id || client_id || ""
    const editConn = mapping.connection || database_connection || ""
    const editTable = mapping.foreign_table || selectedTable || ""
    
    // Set editing state
    setEditingRowId(mapping.id)
    setEditApplication(editApp)
    setEditSystemNumber(editSysNum)
    setEditClientId(editClient)
    setEditConnection(editConn)
    
    // Populate top dropdowns with values from the row being edited
    if (editApp) {
      setSelectedApplication(editApp)
    }
    if (editSysNum) {
      setSelectedSystemNumber(editSysNum)
    }
    if (editClient) {
      setSelectedClientId(editClient)
    }
    if (editConn) {
      setSelectedConnection(editConn)
    }
    if (editTable) {
      setSelectedTable(editTable)
    }
    
    // Fetch options for edit mode and populate main dropdowns
    if (editApp) {
      try {
        const sysResponse = await getSapSystemNumbersNew({
          payload: {
            data: { application: editApp },
            actions: "get_system_numbers",
          },
        })
        if (sysResponse?.status && Array.isArray(sysResponse.data)) {
          setEditSystemNumberOptions(sysResponse.data)
          setSystemNumberOptions(sysResponse.data)
        }
      } catch (error) {
        console.error("Error fetching system numbers for edit:", error)
      }
    }
    
    // Fetch client IDs if system number exists
    if (editSysNum) {
      try {
        const clientResponse = await getSapClientIdsNew({
          payload: {
            data: { system_number: editSysNum },
            actions: "get_client_ids",
          },
        })
        if (clientResponse?.status && Array.isArray(clientResponse.data)) {
          setEditClientIdOptions(clientResponse.data)
          setClientIdOptions(clientResponse.data)
        }
      } catch (error) {
        console.error("Error fetching client IDs for edit:", error)
      }
    }
    
    // Fetch connections if client ID exists
    if (editClient && editSysNum) {
      try {
        const connResponse = await getSapConnectionBySysClient({
          payload: {
            data: { client_id: editClient, system_number: editSysNum },
            actions: "get_connection_client_sysnr",
          },
        })
        if (connResponse?.status && Array.isArray(connResponse.data)) {
          setEditConnectionOptions(connResponse.data)
          setConnectionOptions(connResponse.data)
        }
      } catch (error) {
        console.error("Error fetching connections for edit:", error)
      }
    }
    
    // Fetch tables if connection exists
    if (editConn) {
      try {
        const connectionId = typeof editConn === 'string' ? parseInt(editConn) : editConn
        const tableResponse = await getSapTables({
          payload: {
            data: { schema: "", search: "", database: "" },
            actions: "get_tables",
            connection: connectionId,
            protocol_type: "RFC"
          }
        })
        if (tableResponse?.status && tableResponse?.data) {
          const tables = Array.isArray(tableResponse.data) 
            ? tableResponse.data.map((table: any) => ({
                label: table.TABNAME || table.table_name || table.name || String(table),
                value: table.TABNAME || table.table_name || table.name || String(table)
              }))
            : []
          setEditTableOptions(tables)
          setTableOptions(tables)
        }
      } catch (error) {
        console.error("Error fetching tables for edit:", error)
      }
    }
  }
  
  // Auto-edit when table is selected from dropdown
  useEffect(() => {
    if (selectedTable && mode !== "view" && mode !== "execute" && table_mappings.length > 0) {
      // Find the mapping with the selected table - use prop table_mappings for consistency
      const mappingIndex = table_mappings.findIndex(m => m.foreign_table === selectedTable)
      if (mappingIndex !== -1) {
        const mapping = table_mappings[mappingIndex]
        // Generate row ID that matches what's used in mappingTableData
        const rowId = `${mapping.primary_table}-${mapping.foreign_table}-${mappingIndex}`
        
        // Only trigger edit if not already editing this row
        if (editingRowId !== rowId) {
          // Create a mapping object similar to what handleEditRow expects
          const mappingRow = {
            id: rowId,
            application: (mapping as any).application || selectedApplication,
            system_number: (mapping as any).system_number || system_number,
            client_id: (mapping as any).client_id || client_id,
            connection: (mapping as any).database_connection || database_connection,
            foreign_table: mapping.foreign_table
          }
          handleEditRow(mappingRow)
        }
      }
    }
  }, [selectedTable, mode, table_mappings])
  
  // Fetch edit client IDs when edit system number changes
  useEffect(() => {
    if (editingRowId && editSystemNumber) {
      const fetchEditClientIds = async () => {
        setIsLoadingEditClientIds(true)
        try {
          const response = await getSapClientIdsNew({
            payload: {
              data: { system_number: editSystemNumber },
              actions: "get_client_ids",
            },
          })
          if (response?.status && Array.isArray(response.data)) {
            setEditClientIdOptions(response.data)
          }
        } catch (error) {
          console.error("Error fetching client IDs for edit:", error)
        } finally {
          setIsLoadingEditClientIds(false)
        }
      }
      fetchEditClientIds()
    }
  }, [editingRowId, editSystemNumber])
  
  // Fetch edit connections when edit client ID changes
  useEffect(() => {
    if (editingRowId && editClientId && editSystemNumber) {
      const fetchEditConnections = async () => {
        setIsLoadingEditConnections(true)
        try {
          const response = await getSapConnectionBySysClient({
            payload: {
              data: { client_id: editClientId, system_number: editSystemNumber },
              actions: "get_connection_client_sysnr",
            },
          })
          if (response?.status && Array.isArray(response.data)) {
            setEditConnectionOptions(response.data)
          }
        } catch (error) {
          console.error("Error fetching connections for edit:", error)
        } finally {
          setIsLoadingEditConnections(false)
        }
      }
      fetchEditConnections()
    }
  }, [editingRowId, editClientId, editSystemNumber])
  
  // Refresh options when table_mappings change to ensure dropdowns have correct options
  useEffect(() => {
    // This ensures that when a mapping's system_number, client_id, or connection changes,
    // the dropdowns will show the correct options
    // The mappingTableData useMemo will handle the re-rendering
  }, [table_mappings, systemNumberOptions, clientIdOptions, connectionOptions])
  
  // Handle save edit - save values from top dropdowns
  const handleSaveEdit = () => {
    if (!editingRowId) return
    
    // Update the mapping using values from top dropdowns
    const updatedMappings = table_mappings.map((m, i) => {
      const foreignTable = m.foreign_table || m.foreign_table
      const rowId = `${m.primary_table}-${foreignTable}-${i}`
      if (rowId === editingRowId) {
        return {
          ...m,
          application: selectedApplication || editApplication,
          system_number: selectedSystemNumber || editSystemNumber,
          client_id: selectedClientId || editClientId,
          connection: selectedConnection || editConnection,
        }
      }
      return m
    })
    
    // Update the store
    setTableMappings(updatedMappings)
    setEditingRowId(null)
    
    // Reset top dropdowns after save
    setSelectedApplication("")
    setSelectedSystemNumber("")
    setSelectedClientId("")
    setSelectedConnection("")
    setSelectedTable("")
    
    toast.success("Mapping updated")
  }
  
  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingRowId(null)
    setEditApplication("")
    setEditSystemNumber("")
    setEditClientId("")
    setEditConnection("")
    
    // Reset top dropdowns
    setSelectedApplication("")
    setSelectedSystemNumber("")
    setSelectedClientId("")
    setSelectedConnection("")
    setSelectedTable("")
  }
  
  // Helper function to get label from options
  const getLabelFromOptions = (value: string, options: FormFieldOption[]): string => {
    if (!value) return "-"
    const found = options.find(opt => String(opt.value) === String(value))
    return found?.label ? (typeof found.label === 'string' ? found.label : String(found.value)) : value
  }
  
  // Transform table mappings data for CustomTableData
  const mappingTableData = useMemo(() => {
    return table_mappings.map((m, i) => {
      const foreignTable = m.foreign_table || m.foreign_table
      const foreignTableField = m.foreign_table_field || m.foreign_table_field
      const rowId = `${m.primary_table}-${foreignTable}-${i}`
      const isEditing = editingRowId === rowId
      
      // Get default values from store if not set in mapping
      const rowApplication = m.application || selectedApplication || ""
      const rowSystemNumber = m.system_number || system_number || ""
      const rowClientId = m.client_id || client_id || ""
      const rowConnection = m.connection || database_connection || ""
      
      // Get labels for display
      const applicationLabel = isEditing ? "" : getLabelFromOptions(rowApplication, sourceApplicationOptions)
      const systemNumberLabel = isEditing ? "" : getLabelFromOptions(rowSystemNumber, systemNumberOptions)
      const clientIdLabel = isEditing ? "" : getLabelFromOptions(rowClientId, clientIdOptions)
      const connectionLabel = isEditing ? "" : getLabelFromOptions(rowConnection, connectionOptions)
      
      return {
        id: rowId,
        secondaryTable: foreignTable,
        links: (
          <div className="flex items-center gap-2 font-mono text-xs">
            <span>{m.primary_table}.{m.primary_table_field}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span>{foreignTable}.{foreignTableField}</span>
          </div>
        ),
        application: (
          <span className="text-sm">
            {isEditing ? (
              // Show value from top dropdown when editing
              getLabelFromOptions(selectedApplication || editApplication, sourceApplicationOptions) || "-"
            ) : (applicationLabel || "-")}
          </span>
        ),
        systemNumber: (
          <span className="text-sm">
            {isEditing ? (
              // Show value from top dropdown when editing
              getLabelFromOptions(selectedSystemNumber || editSystemNumber, systemNumberOptions) || "-"
            ) : (systemNumberLabel || "-")}
          </span>
        ),
        clientId: (
          <span className="text-sm">
            {isEditing ? (
              // Show value from top dropdown when editing
              getLabelFromOptions(selectedClientId || editClientId, clientIdOptions) || "-"
            ) : (clientIdLabel || "-")}
          </span>
        ),
        connection: (
          <span className="text-sm">
            {isEditing ? (
              // Show value from top dropdown when editing
              getLabelFromOptions(selectedConnection || editConnection, connectionOptions) || "-"
            ) : (connectionLabel || "-")}
          </span>
        ),
        actions: (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveEdit}
                  className="h-7 text-xs"
                >
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditRow({ ...m, id: rowId })}
                disabled={mode === "view" || mode === "execute"}
                className="h-7 w-7"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        ),
      }
    })
  }, [
    table_mappings, 
    editingRowId, 
    editSystemNumber, 
    editClientId, 
    editConnection, 
    editSystemNumberOptions, 
    editClientIdOptions,
    editConnectionOptions,
    systemNumberOptions,
    clientIdOptions,
    connectionOptions,
    sourceApplicationOptions,
    isLoadingEditSystemNumbers, 
    isLoadingEditClientIds, 
    isLoadingEditConnections, 
    mode,
    system_number,
    client_id,
    database_connection,
    selectedApplication,
    selectedSystemNumber,
    selectedClientId,
    selectedConnection,
    setTableMappings
  ])

  const mappingColumns = useMemo(() => [
    { key: "secondaryTable", header: "Secondary Table", sortable: true, filterable: true },
    { key: "links", header: "Links (Primary → Secondary)", sortable: false, filterable: false },
    { key: "application", header: "Application", sortable: true, filterable: true },
    { key: "systemNumber", header: "System Number", sortable: true, filterable: true },
    { key: "clientId", header: "Client ID", sortable: true, filterable: true },
    { key: "connection", header: "Connection", sortable: true, filterable: true },
    { key: "actions", header: "Actions", sortable: false, filterable: false },
  ], [])

  return (
    <Card className="p-2 gap-2">
      <CardHeader className="flex flex-row items-center justify-between p-0">
        <CardTitle className="p-0">2. Map Key Fields Between Tables</CardTitle>
        {mode !== "view" && mode !== "execute" && (  
          <Button 
            onClick={handleConfigureClick}
            variant={isConfigureClicked ? "default" : "outline"}
            className={`!h-8 ${
              !isConfigureClicked
                ? "bg-white "
                : ""
            }`}
          >
            Configure Rules
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2 p-0 pt-2">
        {/* Application, Table, System, Client, Connection dropdowns and Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-[0.8fr_0.9fr_0.8fr_0.8fr_0.9fr_auto] gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label htmlFor="application" className="text-xs font-medium text-gray-700">Application</label>
            <DropdownV2
              options={sourceApplicationOptions.map(opt => ({ label: opt.label, value: String(opt.value) }))}
              value={selectedApplication}
              onChange={(v) => setSelectedApplication((v as string) || "")}
              placeholder="Select Application..."
              Disabled={mode === "view" || mode === "execute"}
              searchable={true}
              size="small"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="table" className="text-xs font-medium text-gray-700">Table</label>
            <div className="relative">
              <DropdownV2
                options={foreignTablesWithKeyAndVerification.map(opt => ({ label: opt.label, value: String(opt.value) }))}
                value={selectedTable}
                onChange={(v) => setSelectedTable((v as string) || "")}
                placeholder="Select Table..."
                Disabled={mode === "view" || mode === "execute"}
                searchable={true}
                size="small"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="system-number" className="text-xs font-medium text-gray-700">System Number</label>
            <div className="relative">
              <DropdownV2
                options={systemNumberOptions.map(opt => ({ label: opt.label, value: String(opt.value) }))}
                value={selectedSystemNumber}
                onChange={(v) => setSelectedSystemNumber((v as string) || "")}
                placeholder={isLoadingSystemNumbers ? "Loading..." : "Select..."}
                Disabled={!selectedApplication || mode === "view" || mode === "execute" || isLoadingSystemNumbers}
                searchable={true}
                size="small"
              />
              {isLoadingSystemNumbers && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="client-id" className="text-xs font-medium text-gray-700">Client ID</label>
            <div className="relative">
              <DropdownV2
                options={clientIdOptions.map(opt => ({ label: opt.label, value: String(opt.value) }))}
                value={selectedClientId}
                onChange={(v) => setSelectedClientId((v as string) || "")}
                placeholder={isLoadingClientIds ? "Loading..." : "Select..."}
                Disabled={!selectedSystemNumber || mode === "view" || mode === "execute" || isLoadingClientIds}
                searchable={true}
                size="small"
              />
              {isLoadingClientIds && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="connection" className="text-xs font-medium text-gray-700">Connection</label>
            <div className="relative">
              <DropdownV2
                options={connectionOptions.map(opt => ({ label: opt.label, value: String(opt.value) }))}
                value={selectedConnection}
                onChange={(v) => setSelectedConnection((v as string) || "")}
                placeholder={isLoadingConnections ? "Loading..." : "Select..."}
                Disabled={!selectedClientId || mode === "view" || mode === "execute" || isLoadingConnections}
                searchable={true}
                size="small"
              />
              {isLoadingConnections && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          {mode !== "view" && mode !== "execute" && (
            <div className="flex items-end gap-2 pb-1">
              {editingRowId ? (
                <>
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    variant="default"
                    size="sm"
                    className="h-8 text-xs"
                  >
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleAddTable}
                  variant="outline"
                  size="sm"
                  disabled={!selectedTable || !selectedConnection}
                  className="h-8 text-xs"
                >
                  Add Table
                </Button>
              )}
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-1 w-[300px]">
          <label htmlFor="secondary-tables" className="text-xs font-medium text-gray-700">Validation Fields</label>
          <DropdownV2
            options={[
              { label: "Select All", value: "SELECT_ALL" },
              ...foreignTablesWithKeyAndVerification.map(opt => ({ label: opt.label, value: String(opt.value) }))
            ]}
            value={selected_secondary_tables}
            onChange={(v) => {
              const values = v.split(",").filter(val => val.trim())
              if (values.includes("SELECT_ALL")) {
                // If "Select All" is clicked, select all real options
                const allValues = foreignTablesWithKeyAndVerification.map(opt => String(opt.value)).join(",")
                setSelectedSecondaryTables(allValues)
              } else {
                // Filter out "SELECT_ALL" if it exists
                const filteredValues = values.filter(val => val !== "SELECT_ALL")
                setSelectedSecondaryTables(filteredValues.join(","))
              }
            }}
            placeholder="Select..."
            Disabled={isLoading.foreignTables || mode === "view" || mode === "execute"}
            searchable={true}
            size="small"
            mode="multiple"
          />
        </div>
        {isLoading.mappings && (  
          <div className="flex items-center justify-center p-4">
            <Loader2 className="animate-spin" />
            <span className="ml-2">Loading Mappings...</span>
          </div>
        )}
        {table_mappings.length > 0 && ( 
          <CustomTableData
            data={mappingTableData}
            columns={mappingColumns}
            rowKey="id"
            scrollHeightClass="max-h-[200px]"
            emptyState={<div className="p-8 text-center text-slate-500">No mappings available.</div>}
            showSpinnerFlag={isLoading.mappings}
            spinnerLabel="Loading Mappings..."
            HorizontalScroll={false}
          />
        )}             
      </CardContent>
    </Card>
  )
}
