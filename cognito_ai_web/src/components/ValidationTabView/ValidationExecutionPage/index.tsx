"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { ArrowLeft } from "lucide-react"
import type { Validation } from "../types"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb"
import ValidationTabView from ".."
import ValidationExecutionRunner from "./ValidationExecutionRunner"
import { getTableFieldsDetailsApi } from "../API/validationApi"

interface ValidationExecutionPageProps {
  validationId: string | null
  validationData: Validation | null
  onBack: () => void
}

const ValidationExecutionPage: React.FC<ValidationExecutionPageProps> = ({ validationId, validationData, onBack }) => {
  const [tableData, setTableData] = useState<any[]>([])
  const [isBackClicked, setIsBackClicked] = useState(false)
  
  // Always use "validation" type
  const selectedValidationType = "validation"

  useEffect(() => {
    const fetchTableData = async () => {
      if (validationData) {
        try {
          const payload: any = {
            app_name: validationData.application_label,
            app_module: validationData.module_id,
            object_type: validationData.object_type,
            tcode: validationData.tcode,
          }
          
          // Only include cred_id if it's not empty
          if (validationData.database_connection && validationData.database_connection.trim() !== "") {
            payload.cred_id = validationData.database_connection
          }
          
          const response = await getTableFieldsDetailsApi(payload)
          if (response.status && response.data.length > 0) {
            setTableData(response.data)
          }
        } catch (error) {
          console.log("[v0] Failed to fetch table data for execution:", error)
        }
      }
    }

    fetchTableData()
  }, [validationData])

  const handleBackToSelection = () => {}

  const enhancedValidationData = validationData
    ? {
        ...validationData,
        tableData: tableData.length > 0 ? tableData : validationData.tableData || [], // Use fetched data or fallback
        primary_table: validationData.primary_table,
        primary_key_fields: validationData.primary_key_fields,
        primary_key_value: validationData.primary_key_value,
        selected_secondary_tables: validationData.selected_secondary_tables,
      }
    : null

  return (
    <div className="min-h-screen bg-gray-50 p-1">
      {/* Header */}
    <div className="bg-white border-b border-gray-200 p-2">
  <div className="flex items-center justify-between">
    {/* Left side (Back + Divider) */}
    <div className="flex items-center gap-4">
      <Button
        variant={isBackClicked ? "default" : "outline"}
        size="sm"
        onClick={() => {
          setIsBackClicked(true)
          onBack()
        }}
        className={`flex items-center gap-2 ${!isBackClicked ? "bg-white" : ""}`}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to List
      </Button>
      <div className="h-6 w-px bg-gray-300" />
    </div>

    {/* Right side (Heading) */}
    <div className="flex items-center justify-between flex-1">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Execute Validation</h1>
      </div>
    </div>
  </div>
</div>

      {/* Main Content */}
      <div className="p-2 space-y-3">
        <ValidationTabView
          key={validationData?.id || "execute"}
          mode="execute"
          validationId={validationId}
          initialData={validationData}
          onCancel={onBack}
          onSave={() => {}}
          selectedValidationType={selectedValidationType}
        />
        <ValidationExecutionRunner
          validationId={validationId}
          validationData={enhancedValidationData}
          validationType={selectedValidationType}
          onBack={handleBackToSelection}
          tableData={tableData}
        />
      </div>
    </div>
  )
}

export default ValidationExecutionPage
