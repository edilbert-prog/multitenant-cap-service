import React, { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Loader2, PlayCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import type { FormFieldOption } from "../types"
import DropdownV2 from "../../../utils/DropdownV2"

interface PrimaryTableSelectorProps {
  // Store values
  primary_table: string
  primary_key_fields: string
  primary_key_value: string
  sourceApplication: string
  sourceApplicationOptions: FormFieldOption[]
  
  // Store setters
  setPrimaryTable: (table: string) => void
  setPrimaryKeyFields: (fields: string) => void
  setPrimaryKeyValue: (value: string) => void
  setSourceApplication: (app: string) => void
  
  // Computed values
  primaryTableOptions: FormFieldOption[]
  primaryKeyFieldOptions: FormFieldOption[]
  primaryKeyFieldsArray: string[]
  
  // Actions
  onExecute: () => void
  
  // State
  isExecuting: boolean
  mode: "add" | "edit" | "view" | "execute"
}

export const PrimaryTableSelector: React.FC<PrimaryTableSelectorProps> = ({
  primary_table,
  primary_key_fields,
  primary_key_value,
  sourceApplication,
  sourceApplicationOptions,
  setPrimaryTable,
  setPrimaryKeyFields,
  setPrimaryKeyValue,
  setSourceApplication,
  primaryTableOptions,
  primaryKeyFieldOptions,
  primaryKeyFieldsArray,
  onExecute,
  isExecuting,
  mode,
}) => {
  const [isExecuteClicked, setIsExecuteClicked] = useState(false)

  const handleExecuteClick = () => {
    setIsExecuteClicked(true)
    onExecute()
    // Keep clicked state to show default button styling
  }

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

  const fieldVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
      },
    },
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Card className="p-2 gap-2">
        <motion.div variants={itemVariants}>
          <CardHeader className="p-0">
            <CardTitle>1. Select Primary Table</CardTitle>
          </CardHeader>
        </motion.div>
        <CardContent className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_2fr_auto_2.5fr_3fr] gap-3 items-end p-0 pt-2">
          <motion.div className="flex flex-col gap-1 w-[200px]" variants={fieldVariants}>
            <label htmlFor="source-application" className="text-xs font-medium text-gray-700">Source Application</label>
            <DropdownV2
              options={sourceApplicationOptions.map(opt => ({ label: opt.label, value: String(opt.value) }))}
              value={sourceApplication}
              onChange={(v) => { 
                setSourceApplication((v as string) || "")
              }}
              placeholder="Select Source Application..."
              Disabled={mode === "view" || mode === "execute"}
              searchable={true}
              size="small"
            />
          </motion.div>
          <motion.div className="flex flex-col gap-1 w-[300px]" variants={fieldVariants}>
            <label htmlFor="primary-table" className="text-xs font-medium text-gray-700">Primary Table</label>
            <DropdownV2
              options={primaryTableOptions.map(opt => ({ label: opt.label, value: String(opt.value) }))}
              value={primary_table}
              onChange={(value) => setPrimaryTable(value as string)}
              placeholder="Select Table..."
              Disabled={mode === "view" || mode === "execute"}
              searchable={true}
              size="small"
            />
          </motion.div>
          <motion.div className="flex flex-col gap-1 w-[300px]" variants={fieldVariants}>
            <label htmlFor="primary-key" className="text-xs font-medium text-gray-700">Primary Key Field(s)</label>
            <DropdownV2
              options={[
                { label: "Select All", value: "SELECT_ALL" },
                ...primaryKeyFieldOptions.map(opt => ({ label: opt.label, value: String(opt.value) }))
              ]}
              value={primary_key_fields}
              onChange={(v) => {
                const values = v.split(",").filter(val => val.trim())
                if (values.includes("SELECT_ALL")) {
                  // If "Select All" is clicked, select all real options
                  const allValues = primaryKeyFieldOptions.map(opt => String(opt.value)).join(",")
                  setPrimaryKeyFields(allValues)
                } else {
                  // Filter out "SELECT_ALL" if it exists
                  const filteredValues = values.filter(val => val !== "SELECT_ALL")
                  setPrimaryKeyFields(filteredValues.join(","))
                }
              }}
              placeholder="Select Key(s)..."
              Disabled={!primary_table || mode === "view" || mode === "execute"}
              searchable={true}
              size="small"
              mode="multiple"
            />
          </motion.div>
          <motion.div className="flex gap-2" variants={fieldVariants}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={handleExecuteClick}
                      disabled={
                        isExecuting ||
                        !primary_table ||
                        primaryKeyFieldsArray.length === 0 ||
                        mode === "view" ||
                        mode === "execute"
                      }
                      variant={isExecuteClicked ? "default" : "outline"}
                      className="!h-9 !w-8 mb-0.5"
                    >
                      {isExecuting ? <Loader2 className="animate-spin" /> : <PlayCircle className="!h-6"/>}
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent className="bg-white border border-gray-300 rounded-md shadow-md px-2 py-1">
                  <p>Execute Query to Get Sample Values</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.div>
          <motion.div className="flex flex-col gap-1" variants={fieldVariants}>
            <label htmlFor="primary-key-value" className="text-xs font-medium text-gray-700">Primary Key Value</label>
            <Input
              id="primary-key-value"
              placeholder="e.g. 0000123456 (click cell in grid to set)"
              value={primary_key_value}
              onChange={(e) => setPrimaryKeyValue(e.target.value)}
              className="w-full mb-0.5"
              disabled={mode === "view" || mode === "execute"}
            />
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
