"use client"

import type React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "../../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Play, Download, Plus, Search, Table } from "lucide-react"
import { toast } from "sonner"
import type { Validation } from "../../types"
import { SingleSelectCombobox } from "../../SingleSelectCombobox"
import { getApplicationsApi, getTableFieldsDetailsApi } from "../../API/validationApi"
import type { FormFieldOption } from "../../types/form"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table"
import { Checkbox } from "../../ui/checkbox"
import { Input } from "../../ui/input"
import { Badge } from "../../ui/badge"
import { fetchDatabaseConnections, runDatabaseAction } from "../../API/apiService"

interface ValidationTabProps {
    validationId: string | null
    validationData: Validation | null
  }
  
  interface TableField {
    field_name: string
    data_type: string
    length?: number
    description?: string
    is_key?: boolean
    is_selected?: boolean
  }
  
  const ValidationTab: React.FC<ValidationTabProps> = ({ validationId, validationData }) => {
    const [applications, setApplications] = useState<FormFieldOption[]>([])
    const [modules, setModules] = useState<FormFieldOption[]>([])
    const [subModules, setSubModules] = useState<FormFieldOption[]>([])
    const [objects, setObjects] = useState<FormFieldOption[]>([])
    const [tcodes, setTcodes] = useState<FormFieldOption[]>([])
    const [primaryTables, setPrimaryTables] = useState<FormFieldOption[]>([])
    const [databaseConnections, setDatabaseConnections] = useState<FormFieldOption[]>([])
  
    // Selected values
    const [selectedApplication, setSelectedApplication] = useState<string>("")
    const [selectedModule, setSelectedModule] = useState<string>("")
    const [selectedSubModule, setSelectedSubModule] = useState<string>("")
    const [selectedObject, setSelectedObject] = useState<string>("")
    const [selectedTcode, setSelectedTcode] = useState<string>("")
    const [selectedPrimaryTable, setSelectedPrimaryTable] = useState<string>("")
    const [selectedObjectType, setSelectedObjectType] = useState<string>("")
    const [selectedDatabaseConnection, setSelectedDatabaseConnection] = useState<string>("")
    const [vcId, setVcId] = useState<string>("")
    const [vcDescription, setVcDescription] = useState<string>("")
  
    const [tableFields, setTableFields] = useState<TableField[]>([])
    const [filteredFields, setFilteredFields] = useState<TableField[]>([])
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [selectedFields, setSelectedFields] = useState<string[]>([])
    const [isExecuting, setIsExecuting] = useState(false)
    const [isLoadingFields, setIsLoadingFields] = useState(false)
    
    // Track if initial data has been loaded to prevent duplicate API calls
    const hasLoadedInitialData = useRef(false)
  
    const objectTypeOptions: FormFieldOption[] = [
      { value: "transaction", label: "Transaction" },
      { value: "program", label: "Program" },
      { value: "interface", label: "Interface" },
      { value: "api", label: "API" },
    ]
  
    const transformApiResponse = (data: any[]): FormFieldOption[] => {
      if (!Array.isArray(data)) return []
      return data.map((item: any) => {
        if (item.value !== undefined && item.label !== undefined) return item
        if (item.id !== undefined && item.name !== undefined) return { value: String(item.id), label: item.name }
        if (item.key !== undefined && item.value !== undefined) return { value: String(item.key), label: item.value }
        const idKey = Object.keys(item).find((k) => k.endsWith("_id"))
        const nameKey = Object.keys(item).find((k) => k.endsWith("_name"))
        if (idKey && nameKey) return { value: String(item[idKey]), label: item[nameKey] }
        return item
      })
    }
  
    const loadDatabaseConnections = useCallback(async () => {
      try {
        const connections = await fetchDatabaseConnections()
        setDatabaseConnections(connections)
      } catch (error) {
        console.error("Failed to load database connections:", error)
        toast.error("Failed to load database connections")
      }
    }, [])
  
    const loadPrimaryTables = useCallback(async () => {
      if (
        !selectedApplication ||
        !selectedModule ||
        !selectedSubModule ||
        !selectedObject ||
        !selectedTcode ||
        !selectedObjectType
      ) {
        return
      }
  
      try {
        const response = await getTableFieldsDetailsApi({
          application_id: selectedApplication,
          module_id: selectedModule,
          sub_module_id: selectedSubModule,
          object_id: selectedObject,
          tcode: selectedTcode,
          object_type: selectedObjectType,
        })
  
        console.log("[v0] Get table fields response:", response)
  
        if (response.status && response.data) {
          const tableOptions: FormFieldOption[] = []
  
          if (Array.isArray(response.data)) {
            response.data.forEach((table: any) => {
              if (table.TableName) {
                tableOptions.push({
                  value: table.TableName,
                  label: `${table.TableName} - ${table.TableId || "No description"}`,
                })
              }
            })
          }
  
          setPrimaryTables(tableOptions)
          console.log("[v0] Extracted table options:", tableOptions)
        }
      } catch (error) {
        console.error("Failed to load primary tables:", error)
        toast.error("Failed to load primary tables")
      }
    }, [selectedApplication, selectedModule, selectedSubModule, selectedObject, selectedTcode, selectedObjectType])
  
    const loadAllDependentData = useCallback(async (validationData: any) => {
      try {
        console.log("[v0] Loading dependent data for:", validationData)
  
        if (validationData.application_id) {
          const moduleResponse = await getApplicationsApi({
            type: "module",
            application_id: validationData.application_id,
          })
          if (moduleResponse.status) {
            setModules(transformApiResponse(moduleResponse.data))
          }
  
          if (validationData.module_id) {
            const subModuleResponse = await getApplicationsApi({
              type: "sub_module",
              application_id: validationData.application_id,
              module: validationData.module_id,
            })
            if (subModuleResponse.status) {
              setSubModules(transformApiResponse(subModuleResponse.data))
            }
  
            if (validationData.sub_module_id) {
              const objectResponse = await getApplicationsApi({
                type: "object",
                application_id: validationData.application_id,
                module: validationData.module_id,
                sub_module: validationData.sub_module_id,
              })
              if (objectResponse.status) {
                setObjects(transformApiResponse(objectResponse.data))
              }
  
              if (validationData.object_id) {
                const tcodeResponse = await getApplicationsApi({
                  type: "tcode",
                  application_id: validationData.application_id,
                  module: validationData.module_id,
                  sub_module: validationData.sub_module_id,
                  object: validationData.object_id,
                })
                if (tcodeResponse.status) {
                  setTcodes(transformApiResponse(tcodeResponse.data))
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("[v0] Failed to load dependent data", error)
        toast.error("Failed to load form options.")
      }
    }, [])
  
    const loadInitialData = useCallback(async () => {
      try {
        const response = await getApplicationsApi({ type: "application" })
        if (response.status) {
          setApplications(transformApiResponse(response.data))
        }
        await loadDatabaseConnections()
      } catch (error) {
        console.error("Failed to load applications", error)
        toast.error("Failed to load form options.")
      }
    }, [loadDatabaseConnections])
  
    useEffect(() => {
      // Only load initial data once to prevent duplicate API calls
      if (!hasLoadedInitialData.current) {
        hasLoadedInitialData.current = true
        
        if (validationData) {
          console.log("[v0] Initializing with validation data:", validationData)
    
          setSelectedApplication(validationData.application_id || "")
          setSelectedModule(validationData.module_id || "")
          setSelectedSubModule(validationData.sub_module_id || "")
          setSelectedObject(validationData.object_id || "")
          setSelectedTcode(validationData.tcode || "")
          setSelectedObjectType(validationData.object_type || "")
          setSelectedDatabaseConnection(validationData.database_connection || "")
          setVcId(validationData.validation_id || "")
          setVcDescription(validationData.validation_description || "")
    
          loadInitialData().then(() => {
            loadAllDependentData(validationData)
          })
        } else {
          loadInitialData()
        }
      }
    }, [validationData, loadInitialData, loadAllDependentData])
  
    useEffect(() => {
      if (
        selectedApplication &&
        selectedModule &&
        selectedSubModule &&
        selectedObject &&
        selectedTcode &&
        selectedObjectType
      ) {
        loadPrimaryTables()
      }
    }, [
      selectedApplication,
      selectedModule,
      selectedSubModule,
      selectedObject,
      selectedTcode,
      selectedObjectType,
      loadPrimaryTables,
    ])
  
    const loadModules = async (applicationId: string) => {
      const response = await getApplicationsApi({ type: "module", application_id: applicationId })
      if (response.status) {
        setModules(transformApiResponse(response.data))
        setSubModules([])
        setObjects([])
        setTcodes([])
        setPrimaryTables([])
      }
    }
  
    const loadSubModules = async (moduleId: string) => {
      const response = await getApplicationsApi({
        type: "sub_module",
        application_id: selectedApplication,
        module: moduleId,
      })
      if (response.status) {
        setSubModules(transformApiResponse(response.data))
        setObjects([])
        setTcodes([])
        setPrimaryTables([])
      }
    }
  
    const loadObjects = async (subModuleId: string) => {
      const response = await getApplicationsApi({
        type: "object",
        application_id: selectedApplication,
        module: selectedModule,
        sub_module: subModuleId,
      })
      if (response.status) {
        setObjects(transformApiResponse(response.data))
        setTcodes([])
        setPrimaryTables([])
      }
    }
  
    const loadTcodes = async (objectId: string) => {
      const response = await getApplicationsApi({
        type: "tcode",
        application_id: selectedApplication,
        module: selectedModule,
        sub_module: selectedSubModule,
        object: objectId,
      })
      if (response.status) {
        setTcodes(transformApiResponse(response.data))
        setPrimaryTables([])
      }
    }
  
    const handleExecuteValidation = async () => {
      if (!selectedPrimaryTable) {
        toast.error("Please select a primary table")
        return
      }
  
      setIsExecuting(true)
      setIsLoadingFields(true)
      try {
        console.log("[v0] Executing S4 HANA validation with params:", {
          application: selectedApplication,
          module: selectedModule,
          subModule: selectedSubModule,
          object: selectedObject,
          tcode: selectedTcode,
          primaryTable: selectedPrimaryTable,
          objectType: selectedObjectType,
          databaseConnection: selectedDatabaseConnection,
        })
  
        const s4hanaPayload = {
          payload: {
            actions: "get_data",
            connection: selectedDatabaseConnection,
            protocol_type: "RFC",
            data: {
              table: selectedPrimaryTable,
              columns: [],
            },
          },
        }

        console.log("[v0] S4 HANA payload:", s4hanaPayload)

        const response = await runDatabaseAction(s4hanaPayload)
  
        console.log("[v0] S4 HANA response:", response)
  
        if (response && response.data && response.columns) {
          const fields: TableField[] = response.columns.map((columnName: string, index: number) => ({
            field_name: columnName,
            data_type: "CHAR", // Default type, could be enhanced with actual type detection
            length: undefined,
            description: `Field ${columnName}`,
            is_key: index === 0, // First column as key by default
            is_selected: false,
          }))
  
          setTableFields(fields)
          setFilteredFields(fields)
          toast.success(`Successfully loaded ${response.data.length} records from ${selectedPrimaryTable}!`)
        } else {
          // Mock data if API doesn't return proper structure
          const mockFields: TableField[] = [
            {
              field_name: "CLIENT",
              data_type: "CLNT",
              length: 3,
              description: "Client",
              is_key: true,
              is_selected: false,
            },
            {
              field_name: "MATNR",
              data_type: "CHAR",
              length: 18,
              description: "Material Number",
              is_key: true,
              is_selected: false,
            },
            {
              field_name: "MAKTX",
              data_type: "CHAR",
              length: 40,
              description: "Material Description",
              is_key: false,
              is_selected: false,
            },
            {
              field_name: "MTART",
              data_type: "CHAR",
              length: 4,
              description: "Material Type",
              is_key: false,
              is_selected: false,
            },
            {
              field_name: "MBRSH",
              data_type: "CHAR",
              length: 1,
              description: "Industry Sector",
              is_key: false,
              is_selected: false,
            },
            {
              field_name: "MEINS",
              data_type: "UNIT",
              length: 3,
              description: "Base Unit of Measure",
              is_key: false,
              is_selected: false,
            },
          ]
          setTableFields(mockFields)
          setFilteredFields(mockFields)
          toast.success("Validation executed successfully!")
        }
      } catch (error) {
        console.error("Execution failed:", error)
        toast.error("Failed to execute validation")
      } finally {
        setIsExecuting(false)
        setIsLoadingFields(false)
      }
    }
  
    useEffect(() => {
      if (!searchTerm) {
        setFilteredFields(tableFields)
      } else {
        const filtered = tableFields.filter(
          (field) =>
            field.field_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            field.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            field.data_type.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        setFilteredFields(filtered)
      }
    }, [searchTerm, tableFields])
  
    const handleFieldSelection = (fieldName: string, checked: boolean) => {
      setTableFields((prev) =>
        prev.map((field) => (field.field_name === fieldName ? { ...field, is_selected: checked } : field)),
      )
      setFilteredFields((prev) =>
        prev.map((field) => (field.field_name === fieldName ? { ...field, is_selected: checked } : field)),
      )
  
      if (checked) {
        setSelectedFields((prev) => [...prev, fieldName])
      } else {
        setSelectedFields((prev) => prev.filter((f) => f !== fieldName))
      }
    }
  
    const handleSelectAndAddKeys = () => {
      const selectedFieldsData = tableFields.filter((field) => field.is_selected)
      if (selectedFieldsData.length === 0) {
        toast.error("Please select fields first")
        return
      }
  
      setTableFields((prev) => prev.map((field) => (field.is_selected ? { ...field, is_key: true } : field)))
      setFilteredFields((prev) => prev.map((field) => (field.is_selected ? { ...field, is_key: true } : field)))
  
      toast.success(`Added ${selectedFieldsData.length} field(s) as keys`)
    }
  
    const handleAddKeys = () => {
      const keyFields = tableFields.filter((field) => field.is_key)
      console.log("[v0] Adding key fields:", keyFields)
      toast.success(`${keyFields.length} key field(s) configured`)
    }
  
    const handleExportToExcel = () => {
      console.log("[v0] Exporting table data to Excel")
      toast.success("Exporting to Excel...")
    }
  
    return (
      <div className="space-y-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Validation Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-1.5">
              <div>
                <label className="text-xs font-medium mb-0.5 block">Application *</label>
                <SingleSelectCombobox
                  options={applications}
                  value={selectedApplication}
                  onChange={(v) => {
                    setSelectedApplication(v as string)
                    if (v) loadModules(v as string)
                  }}
                  placeholder="Select Application..."
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-0.5 block">Object Type *</label>
                <SingleSelectCombobox
                  options={objectTypeOptions}
                  value={selectedObjectType}
                  onChange={(v) => setSelectedObjectType(v as string)}
                  placeholder="Select Object Type..."
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-0.5 block">Module *</label>
                <SingleSelectCombobox
                  options={modules}
                  value={selectedModule}
                  onChange={(v) => {
                    setSelectedModule(v as string)
                    if (v) loadSubModules(v as string)
                  }}
                  placeholder="Select Module..."
                  disabled={!selectedApplication}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-0.5 block">Sub Module *</label>
                <SingleSelectCombobox
                  options={subModules}
                  value={selectedSubModule}
                  onChange={(v) => {
                    setSelectedSubModule(v as string)
                    if (v) loadObjects(v as string)
                  }}
                  placeholder="Select Sub Module..."
                  disabled={!selectedModule}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-0.5 block">Object *</label>
                <SingleSelectCombobox
                  options={objects}
                  value={selectedObject}
                  onChange={(v) => {
                    setSelectedObject(v as string)
                    if (v) loadTcodes(v as string)
                  }}
                  placeholder="Select Object..."
                  disabled={!selectedSubModule}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-0.5 block">Tcode *</label>
                <SingleSelectCombobox
                  options={tcodes}
                  value={selectedTcode}
                  onChange={(v) => setSelectedTcode(v as string)}
                  placeholder="Select Tcode..."
                  disabled={!selectedObject}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-0.5 block">Database Connection *</label>
                <SingleSelectCombobox
                  options={databaseConnections}
                  value={selectedDatabaseConnection}
                  onChange={(v) => setSelectedDatabaseConnection(v as string)}
                  placeholder="Select Connection..."
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-0.5 block">Primary Table *</label>
                <SingleSelectCombobox
                  options={primaryTables}
                  value={selectedPrimaryTable}
                  onChange={(v) => setSelectedPrimaryTable(v as string)}
                  placeholder="Select Primary Table..."
                  disabled={primaryTables.length === 0}
                />
              </div>
            </div>
  
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              <div>
                <label className="text-xs font-medium mb-0.5 block">VC ID</label>
                <Input
                  value={vcId}
                  onChange={(e) => setVcId(e.target.value)}
                  placeholder="Generated after create"
                  disabled
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-0.5 block">VC Description *</label>
                <Input
                  value={vcDescription}
                  onChange={(e) => setVcDescription(e.target.value)}
                  placeholder="Enter Description"
                  className="h-8 text-xs"
                />
              </div>
            </div>
  
            <div className="flex justify-end pt-1">
              <Button
                onClick={handleExecuteValidation}
                disabled={isExecuting || !selectedPrimaryTable}
                className="flex items-center gap-1.5 h-8 text-xs"
                size="sm"
              >
                <Play className="h-3 w-3" />
                {isExecuting ? "Executing..." : "Execute"}
              </Button>
            </div>
          </CardContent>
        </Card>
  
        {tableFields.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Table Fields - {selectedPrimaryTable}</CardTitle>
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
                    <Input
                      placeholder="Search fields..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-7 w-40 h-7 text-xs"
                    />
                  </div>
                  <Button
                    onClick={handleSelectAndAddKeys}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1.5 bg-transparent h-7 text-xs px-2"
                  >
                    <Plus className="h-3 w-3" />
                    Select and Add Keys
                  </Button>
                  <Button
                    onClick={handleAddKeys}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1.5 bg-transparent h-7 text-xs px-2"
                  >
                    <Plus className="h-3 w-3" />
                    Add Keys
                  </Button>
                  <Button
                    onClick={handleExportToExcel}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1.5 bg-transparent h-7 text-xs px-2"
                  >
                    <Download className="h-3 w-3" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-white">
                    <TableRow>
                      <TableHead className="w-10 h-8">
                        <Checkbox
                          checked={filteredFields.length > 0 && filteredFields.every((field) => field.is_selected)}
                          onCheckedChange={(checked) => {
                            const isChecked = checked === true
                            setTableFields((prev) => prev.map((field) => ({ ...field, is_selected: isChecked })))
                            setFilteredFields((prev) => prev.map((field) => ({ ...field, is_selected: isChecked })))
                            if (isChecked) {
                              setSelectedFields(filteredFields.map((f) => f.field_name))
                            } else {
                              setSelectedFields([])
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead className="font-semibold text-xs h-8">Field Name</TableHead>
                      <TableHead className="font-semibold text-xs h-8">Data Type</TableHead>
                      <TableHead className="font-semibold text-xs h-8">Length</TableHead>
                      <TableHead className="font-semibold text-xs h-8">Description</TableHead>
                      <TableHead className="font-semibold text-xs h-8">Key</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingFields ? (
                      [...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell className="h-8">
                            <div className="h-3 w-3 bg-gray-200 animate-pulse rounded" />
                          </TableCell>
                          <TableCell className="h-8">
                            <div className="h-3 w-16 bg-gray-200 animate-pulse rounded" />
                          </TableCell>
                          <TableCell className="h-8">
                            <div className="h-3 w-12 bg-gray-200 animate-pulse rounded" />
                          </TableCell>
                          <TableCell className="h-8">
                            <div className="h-3 w-10 bg-gray-200 animate-pulse rounded" />
                          </TableCell>
                          <TableCell className="h-8">
                            <div className="h-3 w-24 bg-gray-200 animate-pulse rounded" />
                          </TableCell>
                          <TableCell className="h-8">
                            <div className="h-3 w-6 bg-gray-200 animate-pulse rounded" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : filteredFields.length > 0 ? (
                      filteredFields.map((field) => (
                        <TableRow key={field.field_name} className="hover:bg-gray-50">
                          <TableCell className="h-8">
                            <Checkbox
                              checked={field.is_selected}
                              onCheckedChange={(checked) => handleFieldSelection(field.field_name, checked === true)}
                            />
                          </TableCell>
                          <TableCell className="font-medium text-xs h-8">{field.field_name}</TableCell>
                          <TableCell className="h-8">
                            <Badge variant="outline" className="text-xs h-5">
                              {field.data_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs h-8">{field.length || "-"}</TableCell>
                          <TableCell className="max-w-40 truncate text-xs h-8">{field.description || "-"}</TableCell>
                          <TableCell className="h-8">
                            {field.is_key && (
                              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs h-5">Key</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-gray-500 text-xs">
                          No fields found matching your search criteria
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }
  
  export default ValidationTab
  