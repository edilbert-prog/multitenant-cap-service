import { useState, useEffect, useRef } from "react"
import TableConfigurationFilter from "./TableConfigurationFilter"
import FieldValidationComponent from "./FieldValidationComponent"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { getTableFieldsDetailsApi, createValidation, updateValidation, createVcId } from "./API/validationApi"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import type { FieldRule, Validation } from "./types"
import { Button } from "./ui/button"
import { useValidationStore } from "./Stores/validationStore"

interface ValidationTabViewProps {
  mode: "add" | "edit" | "view" | "execute" // Add 'view' mode
  validationId: string | null
  onSave: () => void
  onCancel: () => void
  initialData?: Validation | null
  onValidationTypeSelect?: (type: string) => void
  selectedValidationType?: string | null
  onNext?: () => void
}

const transformFieldRulesForAPI = (rules: FieldRule[]): any[] => {
  if (!rules) return []

  const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)

  const transformObjectKeys = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map((v) => transformObjectKeys(v))
    } else if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
      return Object.keys(obj).reduce((acc, key) => {
        const snakeKey = toSnakeCase(key)
        ;(acc as any)[snakeKey] = transformObjectKeys(obj[key])
        return acc
      }, {} as any)
    }
    return obj
  }

  return rules.map((rule) => {
    const {
      unique_id,
      TableName,
      FieldName,
      Description,
      isKey,
      isValidation,
      isDisplay,
      isComparative,
      expectedValueType,
      expectedValue,
      primaryKeyValue,
      relationKeys,
      dataType,
      sampleValue,
      config,
    } = rule

    const transformedConfig = config ? transformObjectKeys(config) : null

    return {
      unique_id,
      table_name: TableName,
      field_name: FieldName,
      description: Description,
      is_key: isKey,
      is_validation: isValidation,
      is_display: isDisplay,
      is_comparative: isComparative,
      expected_value_type: expectedValueType,
      expected_value: expectedValue,
      primary_key_value: primaryKeyValue,
      relation_keys: Array.isArray(relationKeys) ? relationKeys.join(",") : relationKeys,
      data_type: dataType,
      sample_value: sampleValue,
      config: transformedConfig,
    }
  })
}

function ValidationTabView({
  mode,
  validationId,
  onSave,
  onCancel,
  initialData: initialDataProp,
  onValidationTypeSelect,
  selectedValidationType,
  onNext,
}: ValidationTabViewProps) {
  const [tableData, setTableData] = useState<any[]>([])
  const [validationObject, setValidationObject] = useState<any>(initialDataProp || {})
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [initialData, setInitialData] = useState<Validation | null>(initialDataProp || null)
  const fieldValidationRef = useRef<any>(null)
  const [isRuleConfigScreenOpen, setIsRuleConfigScreenOpen] = useState(false)
  const [isCreatingVcId, setIsCreatingVcId] = useState(false)
  const [isNewlyCreated, setIsNewlyCreated] = useState(false) // Track if validation was just created via Create VC ID
  const lastLoadedValidationId = useRef<string | null>(null) // Track which validation was last loaded

  const { reset, setInitialState } = useValidationStore()

  useEffect(() => {
    if (mode === "add") {
      reset()
      lastLoadedValidationId.current = null
    }

    const loadInitialDataForEdit = async () => {
      const currentValidationId = initialDataProp?.id || null
      // Only load if we haven't loaded this specific validation yet
      if ((mode === "edit" || mode === "view" || mode === "execute") && initialDataProp && lastLoadedValidationId.current !== currentValidationId) {
        lastLoadedValidationId.current = currentValidationId
        setInitialState(initialDataProp)

        setIsLoading(true)
        try {
          const payload: any = {
            app_name: initialDataProp.application_label,
            app_module: initialDataProp.module_id,
            system_number: initialDataProp.system_number,
            client_id: initialDataProp.client_id,
            object_type: initialDataProp.object_type,
            tcode: initialDataProp.tcode,
          }
          
          // Only include cred_id if it's not empty
          if (initialDataProp.database_connection && initialDataProp.database_connection.trim() !== "") {
            payload.cred_id = initialDataProp.database_connection
          }
          
          const response = await getTableFieldsDetailsApi(payload)
          if (response.status && response.data.length > 0) {
            setTableData(response.data)
          } else {
            setTableData([])
            if (mode === "edit") {
              toast.error("Could not retrieve table fields for the existing validation.")
            }
          }
        } catch (error) {
          if (mode === "edit") {
            toast.error("Failed to load initial table data for editing.")
          }
          setTableData([])
        } finally {
          setIsLoading(false)
        }
      }
    }

    loadInitialDataForEdit()

    return () => {
      reset()
    }
  }, [mode, initialDataProp, reset, setInitialState])

  const handleFilterChange = (newValidationObject: any) => {
    setValidationObject(newValidationObject)
  }

  const validateRequiredFields = () => {
    const requiredFields = [
      "application_id",
      "object_type",
      "module_id",
      "sub_module_id",
      "object_id",
      "tcode",
      "validation_description",
    ]

    const missingFields = requiredFields.filter((field) => !validationObject[field as keyof typeof validationObject])

    if (missingFields.length > 0) { 
      const fieldLabels: { [key: string]: string } = {
        application_id: "Application",
        object_type: "Object Type",
        module_id: "Module",
        sub_module_id: "Sub Module",
        object_id: "Object",
        tcode: "Tcode",
        validation_description: "VC Description",
      }

      const missingFieldNames = missingFields.map((field) => fieldLabels[field]).join(", ")
      toast.error(`Please fill the following required fields: ${missingFieldNames}`)
      return false
    }
    return true
  }

  const handleNext = async () => {   

    if (!validateRequiredFields()) {   
      return
    }

    if (!validationObject.tcode) { 
      toast.error("Please select a T-code before proceeding to next step.")
      return
    }

    setTableData([])
    setIsLoading(true)
    try {
      const response = await getTableFieldsDetailsApi({  
        app_name: validationObject.application_label,
        app_module: validationObject.module_id,
        system_number: validationObject.system_number,
        client_id: validationObject.client_id,
        object_type: validationObject.object_type,
        tcode: validationObject.tcode,
        object_id: validationObject.object_id,
      })

      if (response.status && response.data.length > 0) { 
        setTableData(response.data)
        toast.success("Tables and fields loaded successfully.")
      }

       else {
        setTableData([])
        toast.error("Could not retrieve table fields for the selected criteria.")
      }
    } catch (error) {
      toast.error("Failed to load table data")
      setTableData([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (fieldValidationPayload: any) => { 
    setIsSaving(true)

    const allRules = fieldValidationPayload.field_rules || []

    const rulesToSave = allRules.filter(
      (rule: FieldRule) => rule.unique_id && (rule.isKey || rule.isValidation || rule.config?.is_configured),
    )

    // Allow saving even with no rules configured
    // if (rulesToSave.length === 0) {
    //   toast.warning("No rules have been configured. Nothing to save.")
    //   setIsSaving(false)
    //   return
    // }

    const transformedFieldRules = transformFieldRulesForAPI(rulesToSave)

    const inputData = {
      application_id: validationObject.application_id,
      application_label: validationObject.application_label,
      object_type: validationObject.object_type,
      object_type_label: validationObject.object_type_label,
      module_id: validationObject.module_id,
      module_label: validationObject.module_label,
      sub_module_id: validationObject.sub_module_id,
      sub_module_label: validationObject.sub_module_label,
      object_id: validationObject.object_id,
      object_label: validationObject.object_label,
      tcode_id: validationObject.tcode,
      tcode_label: validationObject.tcode_label,
      tcode: validationObject.tcode,
      validation_id: validationObject.validation_id,
      validation_description: validationObject.validation_description,
      database_connection: String(validationObject.database_connection || ""),
      database_connection_label: validationObject.database_connection_label,

      // Add system_number and client_id from validationObject
      system_number: validationObject.system_number || null,
      system_number_label: validationObject.system_number_label || null,
      client_id: validationObject.client_id || null,
      client_id_label: validationObject.client_id_label || null,
      source_application: validationObject.source_application || null,
      ...fieldValidationPayload,
      field_rules: transformedFieldRules,

      id: validationId || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      entity_id: "string",
    }

    const payload = { input_data: inputData }

    try {
      // Only update if in edit mode AND not newly created (newly created means user clicked "Create VC ID" but hasn't saved full validation yet)
      if (mode === "edit" && validationId && !isNewlyCreated) {
        await updateValidation(validationId, payload)
      } else {
        const response = await createValidation(payload)
        if (response.id) {
          setInitialData((prev) => ({ ...prev, id: response.id, validation_id: response.validation_id }) as Validation)
          setValidationObject((prev: any) => ({ ...prev, id: response.id, validation_id: response.validation_id }))
          // If we just created via "Create VC ID" button, mark as newly created
          if (validationObject.validation_id && !validationId) {
            setIsNewlyCreated(true)
          }
        }
      }
    } catch (error) {
      // Error toast is handled in the API layer
    } finally {
      setIsSaving(false)
    }
  }

  const handleInitialSave = async () => {
    const requiredFields = ["application_id", "object_type", "module_id", "sub_module_id", "object_id", "tcode"]
    const missingField = requiredFields.find((field) => !validationObject[field])

    if (missingField) {
      toast.error(`Please fill the "${missingField.replace("_", " ")}" field before saving.`)
      return
    }

    setIsCreatingVcId(true)
    try {  
      const payload = {  
        application_id: validationObject.application_id,
        application_label: validationObject.application_label,
        object_type: validationObject.object_type,
        object_type_label: validationObject.object_type_label,
        module: validationObject.module_id,
        module_label: validationObject.module_label,
        sub_module: validationObject.sub_module_id,
        sub_module_label: validationObject.sub_module_label,
        object: validationObject.object_id,
        object_label: validationObject.object_label,
        tcode: validationObject.tcode,
        tcode_label: validationObject.tcode_label,
        database_connection: String(validationObject.database_connection || ""),
        database_connection_label: validationObject.database_connection_label || "",
        system_number: validationObject.system_number || null,
        source_application: validationObject.source_application || null,
        system_number_label: validationObject.system_number_label || null,
        client_id: validationObject.client_id || null,
        client_id_label: validationObject.client_id_label || null,
        validation_description: validationObject.validation_description || "",
      }
      const response = await createVcId(payload)

      if (response.status && response.validation_id) {
        toast.success(`Validation created with ID: ${response.validation_id}`)
        const updatedValidationObject = {
          ...validationObject,
          validation_id: response.validation_id,
        }
        setValidationObject(updatedValidationObject)
        setInitialData(
          (prev) =>
            ({
              ...prev,
              ...updatedValidationObject,
            }) as Validation,
        )
        // Mark as newly created so that handleSave uses createValidation instead of updateValidation
        setIsNewlyCreated(true)
      } else {
        toast.error(response.message || "Failed to create validation ID.")
      }
    } catch (error) {
      toast.error("An error occurred while creating the validation ID.")
    } finally {
      setIsCreatingVcId(false)
    }
  }

  return (  
    <div className="overflow-visible mt-2 relative">
      <div className="max-w-full mx-auto space-y-2">
        <div className={isRuleConfigScreenOpen ? "hidden" : ""}>
          <TableConfigurationFilter
            onApply={handleFilterChange}
            onCancel={onCancel}
            validationObject={validationObject}
            onNext={handleNext}
            mode={mode}
            onCreateVcId={handleInitialSave}
            isCreatingVcId={isCreatingVcId}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (  
          (mode !== "execute") && (tableData.length > 0 || ((mode === "edit" || mode === "view") && initialData)) && (
            <FieldValidationComponent
              ref={fieldValidationRef}
              tableData={tableData}
              filterValues={validationObject}
              initialData={initialData}
              onSave={handleSave}
              isSaving={isSaving}
              onCancel={onCancel}
              setIsRuleConfigScreenOpen={setIsRuleConfigScreenOpen}
              mode={mode}
              onValidationTypeSelect={onValidationTypeSelect}
              selectedValidationType={selectedValidationType}
              onNext={onNext}
            />
          )
        )}
      </div>
    </div>
  )
}

export default ValidationTabView
