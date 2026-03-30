import type React from "react"
import { useCallback } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { getApplicationsApi } from "../API/validationApi"
import { useEffect, useState, useRef } from "react"
import { toast } from "sonner"
import type { FormFieldOption } from "../types/form"
import { fetchDatabaseConnections } from "../API/apiService"
import { getSapSystemNumbersNew, getSapClientIdsNew, getSapConnectionBySysClient } from "../API/validationApi"
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import DropdownV2 from "../../../utils/DropdownV2"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { motion, AnimatePresence } from "framer-motion"

interface TableConfigurationFilterProps {
  onApply: (validationObject: any) => void
  onCancel: () => void
  validationObject: any
  onNext: () => Promise<void>
  mode?: "add" | "edit" | "view" | "execute"
  onCreateVcId?: () => Promise<void>
  isCreatingVcId?: boolean
}

const FormField = ({
  id,
  label,
  children,
  required = false,
}: {
  id: string
  label: string
  children: React.ReactNode
  className?: string
  required?: boolean
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
)

const TableConfigurationFilter = ({
  onApply,
  onCancel,
  validationObject,
  onNext,
  mode = "add",
  onCreateVcId,
  isCreatingVcId = false,
}: TableConfigurationFilterProps) => {
  const [applications, setApplications] = useState<FormFieldOption[]>([])
  const [modules, setModules] = useState<FormFieldOption[]>([])
  const [subModules, setSubModules] = useState<FormFieldOption[]>([])
  const [objects, setObjects] = useState<FormFieldOption[]>([])
  const [tcodes, setTcodes] = useState<FormFieldOption[]>([])
  const [databaseConnections, setDatabaseConnections] = useState<FormFieldOption[]>([])
  const [isLoadingConnections, setIsLoadingConnections] = useState(false)
  const [localValidationObject, setLocalValidationObject] = useState(validationObject || {})

  // New state for chained SAP dropdowns
  const [systemNumbers, setSystemNumbers] = useState<FormFieldOption[]>([])
  const [clientIds, setClientIds] = useState<FormFieldOption[]>([])
  const [connections, setConnections] = useState<FormFieldOption[]>([])
  const [isLoadingSystemNumbers, setIsLoadingSystemNumbers] = useState(false)
  const [isLoadingClientIds, setIsLoadingClientIds] = useState(false)
  const [isLoadingSapConnections, setIsLoadingSapConnections] = useState(false)
  const [isNextClicked, setIsNextClicked] = useState(false)

  // Refs to track if initial API calls have been made
  const hasLoadedAppsAndDatabases = useRef(false)
  const hasLoadedSystemNumbers = useRef(false)
  const isUserInteraction = useRef(false) // Track if update is from user interaction
  const hasLoadedDependentData = useRef(false) // Track if dependent data has been loaded

  const objectTypeOptions: FormFieldOption[] = [
    { value: "transaction", label: "Transaction" },
    { value: "program", label: "Program" },
    { value: "interface", label: "Interface" },
    { value: "api", label: "API" },
  ]

  const normalizeValidationObject = useCallback((obj: any) => {
    if (!obj) return {}
    return {
      application_id: obj.application_id || obj.application,
      application_label: obj.application_label,
      module_id: obj.module_id || obj.module,
      module_label: obj.module_label,
      sub_module_id: obj.sub_module_id || obj.sub_module,
      sub_module_label: obj.sub_module_label,
      object_id: obj.object_id || obj.object,
      object_label: obj.object_label,
      tcode: obj.tcode || obj.tcode_id,
      tcode_label: obj.tcode_label,
      object_type: obj.object_type,
      system_number: obj.system_number || "",
      system_number_label: obj.system_number_label || "",
      client_id: obj.client_id || "",
      client_id_label: obj.client_id_label || "",
      database_connection: obj.database_connection,
      database_connection_label: obj.database_connection_label || "",
      validation_id: obj.validation_id,
      validation_description: obj.validation_description,
      ...obj,
    }
  }, [])

  useEffect(() => {
    const normalizedObject = normalizeValidationObject(validationObject)
    setLocalValidationObject(normalizedObject)
    
    // Only load dependent data on initial mount or when mode changes to edit/view
    // Don't reload on every validationObject change (which happens during user interactions)
    if (validationObject && Object.keys(validationObject).length > 0 && !hasLoadedDependentData.current && !isUserInteraction.current) {
      hasLoadedDependentData.current = true
      loadAllDependentData(normalizedObject)
    }
    
    // Reset the user interaction flag after processing
    isUserInteraction.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validationObject])

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

  const loadAllDependentData = useCallback(async (validationData: any) => {
    try {
      if (validationData.application_id) {
        const moduleResponse = await getApplicationsApi({
          type: "module",
          application_id: validationData.application_id,
        })
        if (moduleResponse.status) setModules(transformApiResponse(moduleResponse.data))

        if (validationData.module_id) {
          const subModuleResponse = await getApplicationsApi({
            type: "sub_module",
            application_id: validationData.application_id,
            module: validationData.module_id,
          })
          if (subModuleResponse.status) setSubModules(transformApiResponse(subModuleResponse.data))

          if (validationData.sub_module_id) {
            const objectResponse = await getApplicationsApi({
              type: "object",
              application_id: validationData.application_id,
              module: validationData.module_id,
              sub_module: validationData.sub_module_id,
            })
            if (objectResponse.status) setObjects(transformApiResponse(objectResponse.data))

            if (validationData.object_id) {
              const tcodeResponse = await getApplicationsApi({
                type: "tcode",
                application_id: validationData.application_id,
                module: validationData.module_id,
                sub_module: validationData.sub_module_id,
                object: validationData.object_id,
              })
              if (tcodeResponse.status) setTcodes(transformApiResponse(tcodeResponse.data))
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to load dependent data", error)
      toast.error("Failed to load form options.")
    }
  }, [])

  const fetchDatabases = useCallback(async () => {
    setIsLoadingConnections(true)
    try {
      const options = await fetchDatabaseConnections()
      setDatabaseConnections(options)
    } catch (error) {
      toast.error("Failed to load database connections.")
    } finally {
      setIsLoadingConnections(false)
    }
  }, [])

  useEffect(() => {
    if (!hasLoadedAppsAndDatabases.current) {
      hasLoadedAppsAndDatabases.current = true
      const getApps = async () => {
        const response = await getApplicationsApi({ type: "application" })
        if (response.status) setApplications(transformApiResponse(response.data))
      }
      getApps()
      fetchDatabases()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelectionChange = async (
    field: string,
    value: string | undefined,
    getNextOptions: (val: string) => Promise<any>,
    dependentFieldsToReset: string[],
  ) => {
    // Mark as user interaction to prevent duplicate API calls in useEffect
    isUserInteraction.current = true
    // Also mark that dependent data has been loaded via user interaction
    hasLoadedDependentData.current = true
    
    const newObj = { ...localValidationObject, [field]: value }

    // Find label
    const optionsMap: { [key: string]: FormFieldOption[] } = {
      application_id: applications,
      module_id: modules,
      sub_module_id: subModules,
      object_id: objects,
      tcode: tcodes,
    }
    const options = optionsMap[field as keyof typeof optionsMap]
    const selectedOption = options?.find((opt) => String(opt.value) === String(value))
    newObj[`${field.replace("_id", "")}_label`] = selectedOption?.label || ""

    dependentFieldsToReset.forEach((f) => {
      newObj[f] = ""
      newObj[`${f.replace("_id", "")}_label`] = ""
    })

    setLocalValidationObject(newObj)
    onApply(newObj)

    if (value) {
      await getNextOptions(value)
    }
  }

  const getModules = async (applicationId: string) => {
    const response = await getApplicationsApi({ type: "module", application_id: applicationId })
    if (response.status) {
      setModules(transformApiResponse(response.data))
      setSubModules([])
      setObjects([])
      setTcodes([])
    }
  }

  const getSubModules = async (moduleId: string) => {
    const response = await getApplicationsApi({
      type: "sub_module",
      application_id: localValidationObject.application_id,
      module: moduleId,
    })
    if (response.status) {
      setSubModules(transformApiResponse(response.data))
      setObjects([])
      setTcodes([])
    }
  }

  const getObjects = async (subModuleId: string) => {
    const response = await getApplicationsApi({
      type: "object",
      application_id: localValidationObject.application_id,
      module: localValidationObject.module_id,
      sub_module: subModuleId,
    })
    if (response.status) {
      setObjects(transformApiResponse(response.data))
      setTcodes([])
    }
  }

  const getTcodes = async (objectId: string) => { 
    const response = await getApplicationsApi({   
      type: "tcode",
      application_id: localValidationObject.application_id,
      module: localValidationObject.module_id,
      sub_module: localValidationObject.sub_module_id,
      object: objectId,
    })
    if (response.status) {
      const transformedTcodes = transformApiResponse(response.data)
      setTcodes(transformedTcodes)
      
      // Auto-select TCode based on the number of available options
      if (transformedTcodes.length > 0) {
        let selectedTcode = ""
        
        if (transformedTcodes.length === 1) {
          // If only one TCode exists, automatically select it
          selectedTcode = transformedTcodes[0].value
        } else {
          // If multiple TCode values exist, select the first one (0th index)
          selectedTcode = transformedTcodes[0].value
        }
        
        // Update the validation object with the selected TCode
        const newValidationObject = { 
          ...localValidationObject, 
          tcode: selectedTcode,
          object_id: objectId
        }
        setLocalValidationObject(newValidationObject)
        onApply(newValidationObject)
      }
    }
  }

  const handleSimpleStateChange = (field: keyof typeof localValidationObject, value: string) => {
    // Mark as user interaction to prevent duplicate API calls
    isUserInteraction.current = true
    // Also mark that dependent data has been loaded via user interaction
    hasLoadedDependentData.current = true
    
    const newValidationObject = { ...localValidationObject, [field]: value }
    if (field === "object_type") {
      const selected = objectTypeOptions.find((o) => o.value === value)
      newValidationObject.object_type_label = selected?.label || ""
    } else if (field === "database_connection") {
      const selected = databaseConnections.find((c) => c.value === value)
      newValidationObject.database_connection_label = selected?.label || ""
    }
    setLocalValidationObject(newValidationObject)
    onApply(newValidationObject)
  }

  const fetchSystemNumbers = useCallback(async () => {  
    setIsLoadingSystemNumbers(true)
    try { 
      const response = await getSapSystemNumbersNew({
        payload: {   
          data: {
            application: "",
          },
          actions: "get_system_numbers",
        },
      })
      if (response.status && Array.isArray(response.data)) {
        setSystemNumbers(response.data)
      } else {
        toast.error("Failed to fetch system numbers.")
      }
    } catch (error) {
      console.error("Error fetching system numbers:", error)
      toast.error("Failed to fetch system numbers.")
    } finally {
      setIsLoadingSystemNumbers(false)
    }
  }, [])

  const fetchClientIds = async (systemNumber: string) => {
    setIsLoadingClientIds(true)
    setClientIds([])
    try {
      const response = await getSapClientIdsNew({
        payload: {
          data: {
            system_number: systemNumber,
          },
          actions: "get_client_ids",
        },
      })
      if (response.status && Array.isArray(response.data)) {
        setClientIds(response.data)
      } else {
        toast.error("Failed to fetch client IDs.")
      }
    } catch (error) {
      console.error("Error fetching client IDs:", error)
      toast.error("Failed to fetch client IDs.")
    } finally {
      setIsLoadingClientIds(false)
    }
  }

  const fetchSapConnections = async (systemNumber: string, clientId: string) => {
    setIsLoadingSapConnections(true)
    setConnections([])
    try {  
      const response = await getSapConnectionBySysClient({
        payload: {
          data: { 
            client_id: clientId,
            system_number: systemNumber,
          },
          actions: "get_connection_client_sysnr",
        },
      })
      if (response.status && Array.isArray(response.data)) {
        setConnections(response.data)
      } else {
        toast.error("Failed to fetch connections.")
      }
    } catch (error) {
      console.error("Error fetching connections:", error)
      toast.error("Failed to fetch connections.")
    } finally {
      setIsLoadingSapConnections(false)
    }
  }

  const handleSystemNumberChange = async (value: string) => {
    // Mark as user interaction to prevent duplicate API calls
    isUserInteraction.current = true
    // Also mark that dependent data has been loaded via user interaction
    hasLoadedDependentData.current = true
    
    const newObj = { ...localValidationObject, system_number: value, client_id: "", database_connection: "" }
    const selected = systemNumbers.find((opt) => String(opt.value) === String(value))
    newObj.system_number_label = selected?.label || ""
    newObj.client_id_label = ""
    newObj.database_connection_label = ""
    setLocalValidationObject(newObj)
    onApply(newObj)
    setClientIds([])
    setConnections([])
    if (value) {
      await fetchClientIds(value)
    }
  }

  const handleClientIdChange = async (value: string) => {
    // Mark as user interaction to prevent duplicate API calls
    isUserInteraction.current = true
    // Also mark that dependent data has been loaded via user interaction
    hasLoadedDependentData.current = true
    
    const newObj = { ...localValidationObject, client_id: value, database_connection: "" }
    const selected = clientIds.find((opt) => String(opt.value) === String(value))
    newObj.client_id_label = selected?.label || ""
    newObj.database_connection_label = ""
    setLocalValidationObject(newObj)
    onApply(newObj)
    setConnections([])
    if (value && localValidationObject.system_number) {
      await fetchSapConnections(localValidationObject.system_number, value)
    }
  }

  const handleConnectionChange = (value: string) => {
    // Mark as user interaction to prevent duplicate API calls
    isUserInteraction.current = true
    // Also mark that dependent data has been loaded via user interaction
    hasLoadedDependentData.current = true
    
    const newObj = { ...localValidationObject, database_connection: value }
    const selected = connections.find((opt) => String(opt.value) === String(value))
    newObj.database_connection_label = selected?.label || ""
    setLocalValidationObject(newObj)
    onApply(newObj)
  }

  // Fetch system numbers on mount
  useEffect(() => {
    if (!hasLoadedSystemNumbers.current) {
      hasLoadedSystemNumbers.current = true
      fetchSystemNumbers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isReadOnly = mode === "view" || mode === "execute"

  // Reset Next button state when validation object changes (new form started)
  useEffect(() => {
    if (!validationObject.validation_id && mode === "add") {
      setIsNextClicked(false)
    }
  }, [validationObject.validation_id, mode])

  const handleNextClick = async () => {
    setIsNextClicked(true)
    try {
      await onNext()
    } catch (error) {
      console.error("Error in next handler:", error)
    }
    // Keep the state as clicked to show normal button styling
  }

  const getTitle = () => {
    switch (mode) {
      case "edit":
        return "Edit Field Validation"
      case "view":
        return "View Field Validation"
      case "execute":
        return "Execute Field Validation"
      default:
        return "Create New Field Validation"
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
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

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Card className="w-full p-2 gap-0">
        <CardHeader className="flex flex-row items-center justify-between p-1 gap-0">
          <CardTitle>{getTitle()}</CardTitle>
          <AnimatePresence>
            {mode === "add" && onCreateVcId && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  onClick={onCreateVcId}
                  disabled={isCreatingVcId || !!validationObject.validation_id}
                  variant={isCreatingVcId ? "default" : "outline"}
                  className={`!h-7 ${
                    !isCreatingVcId && !validationObject.validation_id
                      ? "bg-white border-[#0071E9] text-[#0071E9] hover:bg-[#0071E9] hover:text-white"
                      : ""
                  }`}
                >
                  {isCreatingVcId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {validationObject.validation_id ? validationObject.validation_id : "Create VC ID"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 p-2">
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
            variants={containerVariants}
          >
        <motion.div variants={itemVariants}>
          <FormField id="application" label="Application" required>
          <DropdownV2
            options={applications as any}
            value={localValidationObject.application_id || ""}
            onChange={(v) =>
              handleSelectionChange("application_id", v as string, getModules, [
                "module_id",
                "sub_module_id",
                "object_id",
                "tcode",
              ])
            }
            placeholder="Application"
            Disabled={isReadOnly}
            searchable={true}
            size="small"
          />
        </FormField>
        </motion.div>
        <motion.div variants={itemVariants}>
          <FormField id="object-type" label="Object Type" required>
          <DropdownV2
            options={objectTypeOptions as any}
            value={localValidationObject.object_type || ""}
            onChange={(v) => handleSimpleStateChange("object_type", (v as string) || "")}
            placeholder="Object Type"
            Disabled={isReadOnly}
            searchable={true}
            size="small"
          />
        </FormField>
        </motion.div>
        <motion.div variants={itemVariants}>
          <FormField id="module" label="Module" required>
          <DropdownV2
            options={modules as any}
            value={localValidationObject.module_id || ""}
            onChange={(v) =>
              handleSelectionChange("module_id", v as string, getSubModules, ["sub_module_id", "object_id", "tcode"])
            }
            placeholder="Module"
            Disabled={isReadOnly || !localValidationObject.application_id || modules.length === 0}
            searchable={true}
            size="small"
          />
        </FormField>
        </motion.div>
        <motion.div variants={itemVariants}>
          <FormField id="sub-module" label="Sub Module" required>
          <DropdownV2
            options={subModules as any}
            value={localValidationObject.sub_module_id || ""}
            onChange={(v) => handleSelectionChange("sub_module_id", v as string, getObjects, ["object_id", "tcode"])}
            placeholder="Sub Module"
            Disabled={isReadOnly || !localValidationObject.module_id || subModules.length === 0}
            searchable={true}
            size="small"
          />
        </FormField>
        </motion.div>
        <motion.div variants={itemVariants}>
          <FormField id="object" label="Object" required>
          <DropdownV2
            options={objects as any}
            value={localValidationObject.object_id || ""}
            onChange={(v) => handleSelectionChange("object_id", v as string, getTcodes, ["tcode"])}
            placeholder="Object"
            Disabled={isReadOnly || !localValidationObject.sub_module_id || objects.length === 0}
            searchable={true}
            size="small"
          />
        </FormField>
        </motion.div>
        <motion.div variants={itemVariants}>
          <FormField id="tcode" label="Tcode" required>
          <DropdownV2
            options={tcodes as any}
            value={localValidationObject.tcode || ""}
            onChange={(v) => handleSelectionChange("tcode", v as string, async () => {}, [])}
            placeholder="Tcode"
            Disabled={isReadOnly || !localValidationObject.object_id || tcodes.length === 0}
            searchable={true}
            size="small"
          />
        </FormField>
        </motion.div>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end mb-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* <div className="lg:col-span-1">
          <FormField id="system-number" label="System Number" required>
            <SingleSelectCombobox
              options={systemNumbers}
              value={localValidationObject.system_number}
              onChange={(v) => handleSystemNumberChange((v as string) || "")}
              placeholder={isLoadingSystemNumbers ? "Loading..." : "Select system number..."}
              disabled={isReadOnly || isLoadingSystemNumbers}
            />
          </FormField>
        </div>
        <div className="lg:col-span-1">
          <FormField id="client-id" label="Client ID" required>
            <SingleSelectCombobox
              options={clientIds}
              value={localValidationObject.client_id}
              onChange={(v) => handleClientIdChange((v as string) || "")}
              placeholder={isLoadingClientIds ? "Loading..." : "Select client ID..."}
              disabled={isReadOnly || !localValidationObject.system_number || isLoadingClientIds}
            />
          </FormField>
        </div>
        <div className="lg:col-span-1">
          <FormField id="connection" label="Connection" required>
            <SingleSelectCombobox
              options={connections}
              value={localValidationObject.database_connection}
              onChange={(v) => handleConnectionChange((v as string) || "")}
              placeholder={isLoadingSapConnections ? "Loading..." : "Select connection..."}
              disabled={isReadOnly || !localValidationObject.client_id || isLoadingSapConnections}
            />
          </FormField>
        </div> */}
        <motion.div className="lg:col-span-1" variants={itemVariants}>
          <FormField id="vc-id" label="VC ID">
            <Input
              id="vc-id"
              placeholder="Generated after create"
              value={localValidationObject.validation_id || ""}
              disabled
              className="h-10"
            />
          </FormField>
        </motion.div>
        <motion.div className="lg:col-span-2" variants={itemVariants}>
          <FormField id="vc-description" label="VC Description" required>
            <Input
              id="vc-description"
              placeholder="Enter Description"
              value={localValidationObject.validation_description || ""}
              onChange={(e) => handleSimpleStateChange("validation_description", e.target.value)}
              className="h-10"
              disabled={isReadOnly}
            />
          </FormField>
        </motion.div>
        <motion.div className="lg:col-span-2" variants={itemVariants}>
        {mode !== "execute" && ( 
          <div className="flex items-center justify-end gap-2 col-span-full">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            {mode !== "view" && (
              <Button 
                onClick={handleNextClick} 
                size="sm" 
                variant={isNextClicked ? "default" : "outline"}
                className={`flex items-center gap-1 ${
                  !isNextClicked
                    ? "bg-white hover:bg-gray-50"
                    : ""
                }`}
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
        </motion.div>
      </motion.div>
      </CardContent>
    </Card>
    </motion.div>
  )
}

export default TableConfigurationFilter
