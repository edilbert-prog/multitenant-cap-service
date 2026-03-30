"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "../../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { Play, RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import type { Validation } from "../../types"
import { SingleSelectCombobox } from "../../SingleSelectCombobox"
import type { FormFieldOption } from "../../types/form"

interface RegressionTabProps {
  validationId: string | null
  validationData: Validation | null
}

interface RegressionResult {
  primary_key: string
  table1_value: any
  table2_value: any
  status: "success" | "fail" | "warning"
  differences: string[]
}

const RegressionTab: React.FC<RegressionTabProps> = ({ validationId, validationData }) => {
  const [table1, setTable1] = useState<string>("")
  const [table2, setTable2] = useState<string>("")
  const [primaryKeyField, setPrimaryKeyField] = useState<string>("")
  const [isExecuting, setIsExecuting] = useState(false)
  const [regressionResults, setRegressionResults] = useState<RegressionResult[]>([])
  const [summary, setSummary] = useState({
    total: 0,
    success: 0,
    fail: 0,
    warning: 0,
  })

  // Mock table options - replace with actual API call
  const tableOptions: FormFieldOption[] = [
    { value: "MARA_PROD", label: "Material Master (Production)" },
    { value: "MARA_TEST", label: "Material Master (Test)" },
    { value: "VBAK_PROD", label: "Sales Header (Production)" },
    { value: "VBAK_TEST", label: "Sales Header (Test)" },
    { value: "KNA1_PROD", label: "Customer Master (Production)" },
    { value: "KNA1_TEST", label: "Customer Master (Test)" },
  ]

  // Mock primary key options - replace with actual API call based on selected tables
  const primaryKeyOptions: FormFieldOption[] = [
    { value: "order_id", label: "Order ID" },
    { value: "material_number", label: "Material Number" },
    { value: "customer_id", label: "Customer ID" },
    { value: "document_number", label: "Document Number" },
  ]

  const handleExecuteRegression = async () => {
    if (!table1 || !table2 || !primaryKeyField) {
      toast.error("Please select both tables and primary key field")
      return
    }

    setIsExecuting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000)) // Simulate API call

      // Mock regression results
      const mockResults: RegressionResult[] = [
        {
          primary_key: "ORD001",
          table1_value: { amount: 1000, status: "Active", date: "2024-01-15" },
          table2_value: { amount: 1000, status: "Active", date: "2024-01-15" },
          status: "success",
          differences: [],
        },
        {
          primary_key: "ORD002",
          table1_value: { amount: 1500, status: "Active", date: "2024-01-16" },
          table2_value: { amount: 1600, status: "Active", date: "2024-01-16" },
          status: "fail",
          differences: ["Amount mismatch: 1500 vs 1600"],
        },
        {
          primary_key: "ORD003",
          table1_value: { amount: 2000, status: "Inactive", date: "2024-01-17" },
          table2_value: { amount: 2000, status: "Active", date: "2024-01-17" },
          status: "fail",
          differences: ["Status mismatch: Inactive vs Active"],
        },
        {
          primary_key: "ORD004",
          table1_value: { amount: 750, status: "Active", date: "2024-01-18" },
          table2_value: { amount: 750, status: "Active", date: "2024-01-19" },
          status: "warning",
          differences: ["Date mismatch: 2024-01-18 vs 2024-01-19"],
        },
        {
          primary_key: "ORD005",
          table1_value: { amount: 3000, status: "Active", date: "2024-01-19" },
          table2_value: { amount: 3000, status: "Active", date: "2024-01-19" },
          status: "success",
          differences: [],
        },
      ]

      setRegressionResults(mockResults)

      // Calculate summary
      const newSummary = {
        total: mockResults.length,
        success: mockResults.filter((r) => r.status === "success").length,
        fail: mockResults.filter((r) => r.status === "fail").length,
        warning: mockResults.filter((r) => r.status === "warning").length,
      }
      setSummary(newSummary)

      toast.success("Regression analysis completed!")
    } catch (error) {
      console.error("Regression execution failed:", error)
      toast.error("Failed to execute regression analysis")
    } finally {
      setIsExecuting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "fail":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      success: "bg-green-100 text-green-800",
      fail: "bg-red-100 text-red-800",
      warning: "bg-yellow-100 text-yellow-800",
    }

    return <Badge className={`${variants[status as keyof typeof variants]} border-0`}>{status.toUpperCase()}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Regression Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Table 1 *</label>
              <SingleSelectCombobox
                options={tableOptions}
                value={table1}
                onChange={(v) => setTable1(v as string)}
                placeholder="Select first table..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Table 2 *</label>
              <SingleSelectCombobox
                options={tableOptions}
                value={table2}
                onChange={(v) => setTable2(v as string)}
                placeholder="Select second table..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Primary Key Field *</label>
              <SingleSelectCombobox
                options={primaryKeyOptions}
                value={primaryKeyField}
                onChange={(v) => setPrimaryKeyField(v as string)}
                placeholder="Select primary key..."
                disabled={!table1 || !table2}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleExecuteRegression}
              disabled={isExecuting || !table1 || !table2 || !primaryKeyField}
              className="flex items-center gap-2"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Execute Regression
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Section */}
      {regressionResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Regression Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
                <div className="text-sm text-gray-600">Total Records</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{summary.success}</div>
                <div className="text-sm text-green-600">Success</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{summary.fail}</div>
                <div className="text-sm text-red-600">Failed</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{summary.warning}</div>
                <div className="text-sm text-yellow-600">Warnings</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {regressionResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Regression Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {regressionResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">
                        {primaryKeyField}: {result.primary_key}
                      </span>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Table 1 Data */}
                    <div className="border rounded p-3 bg-blue-50">
                      <h4 className="font-medium text-blue-900 mb-2">
                        {tableOptions.find((t) => t.value === table1)?.label || "Table 1"}
                      </h4>
                      <div className="space-y-1 text-sm">
                        {Object.entries(result.table1_value).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600">{key}:</span>
                            <span className="font-medium">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Table 2 Data */}
                    <div className="border rounded p-3 bg-green-50">
                      <h4 className="font-medium text-green-900 mb-2">
                        {tableOptions.find((t) => t.value === table2)?.label || "Table 2"}
                      </h4>
                      <div className="space-y-1 text-sm">
                        {Object.entries(result.table2_value).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600">{key}:</span>
                            <span className="font-medium">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Differences */}
                  {result.differences.length > 0 && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                      <h5 className="font-medium text-red-900 mb-1">Differences:</h5>
                      <ul className="text-sm text-red-800 space-y-1">
                        {result.differences.map((diff, diffIndex) => (
                          <li key={diffIndex} className="flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>{diff}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default RegressionTab
