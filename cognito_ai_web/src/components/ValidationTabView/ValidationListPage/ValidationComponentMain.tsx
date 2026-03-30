"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Button } from "../ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { MoreHorizontal, Plus, RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { toast } from "sonner"
import { getAllValidations, deleteValidation } from "../API/validationApi"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import type { Validation } from "../types"
import ValidationTabView from ".."
import CustomTableData from "../../../utils/CustomTableData"
import DropdownV2 from "../../../utils/DropdownV2"
import ValidationExecutionPage from "../ValidationExecutionPage"
import SearchBar from "../../../utils/SearchBar"
import { motion, AnimatePresence } from "framer-motion"

const ValidationListPage = () => {
  const [view, setView] = useState<"list" | "add" | "edit" | "view" | "execute">("list")
  const [validations, setValidations] = useState<Validation[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedObject, setSelectedObject] = useState<string>("all")
  const [selectedApplication, setSelectedApplication] = useState<string>("all")
  const [selectedModule, setSelectedModule] = useState<string>("all")
  const [selectedSubModule, setSelectedSubModule] = useState<string>("all")
  const [selectedObjectType, setSelectedObjectType] = useState<string>("all")
  const [selectedValidationId, setSelectedValidationId] = useState<string>("all")
  const [editingValidation, setEditingValidation] = useState<Validation | null>(null)
  const [idToDelete, setIdToDelete] = useState<string | null>(null)

  const [pagination, setPagination] = useState({ currentPage: 1, limit: 10, sortedColumns: {} })
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Ref to track if initial load has been done
  const hasLoadedInitialData = useRef(false)

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const uniqueObjects = useMemo(() => {
    const allValidationsForFilter = validations
    const objects = allValidationsForFilter.map((validation) => String(validation.object_label)).filter(Boolean)
    return [...new Set(objects)].sort()
  }, [validations])

  const uniqueApplications = useMemo(() => {
    const allValidationsForFilter = validations
    const applications = allValidationsForFilter.map((validation) => String(validation.application_label)).filter(Boolean)
    return [...new Set(applications)].sort()
  }, [validations])

  const uniqueModules = useMemo(() => {
    const allValidationsForFilter = validations
    const modules = allValidationsForFilter.map((validation) => String(validation.module_label)).filter(Boolean)
    return [...new Set(modules)].sort()
  }, [validations])

  const uniqueSubModules = useMemo(() => {
    const allValidationsForFilter = validations
    const subModules = allValidationsForFilter.map((validation) => String(validation.sub_module_label)).filter(Boolean)
    return [...new Set(subModules)].sort()
  }, [validations])

  const uniqueObjectTypes = useMemo(() => {
    const allValidationsForFilter = validations
    const objectTypes = allValidationsForFilter.map((validation) => String(validation.object_type_label)).filter(Boolean)
    return [...new Set(objectTypes)].sort()
  }, [validations])

  const uniqueValidationIds = useMemo(() => {
    const allValidationsForFilter = validations
    const validationIds = allValidationsForFilter.map((validation) => String(validation.validation_id)).filter(Boolean)
    return [...new Set(validationIds)].sort()
  }, [validations])

  const fetchValidations = useCallback(async () => {
    setIsLoading(true)
    try {
      const skip = Math.max(0, pagination.currentPage - 1)

      // Build search_text with selected dropdown values (no prefixes)
      const searchParts = []
      if (debouncedSearchTerm) searchParts.push(debouncedSearchTerm)
      if (selectedApplication !== "all") searchParts.push(selectedApplication)
      if (selectedModule !== "all") searchParts.push(selectedModule)
      if (selectedSubModule !== "all") searchParts.push(selectedSubModule)
      if (selectedObjectType !== "all") searchParts.push(selectedObjectType)
      if (selectedObject !== "all") searchParts.push(selectedObject)
      if (selectedValidationId !== "all") searchParts.push(selectedValidationId)

      const searchText = searchParts.length > 0 ? searchParts.join(' ') : undefined

      const response = await getAllValidations({
        search_text: searchText,
        skip,
        limit: pagination.limit,
        sort: { created_at: "desc" },
      })

      const data = response?.data || []
      const total = response?.total || data.length

      setValidations(data)
      setTotalItems(total)
    } catch (error) {
      console.error("API Error:", error)
      setValidations([])
      setTotalItems(0)
      toast.error("Failed to fetch validations")
    } finally {
      setIsLoading(false)
    }
  }, [pagination.currentPage, pagination.limit, debouncedSearchTerm, selectedObject, selectedApplication, selectedModule, selectedSubModule, selectedObjectType, selectedValidationId])

  useEffect(() => {
    if (view === "list") {
        fetchValidations()
    }
  }, [view, pagination.currentPage, pagination.limit, debouncedSearchTerm, selectedObject, selectedApplication, selectedModule, selectedSubModule, selectedObjectType, selectedValidationId, fetchValidations])

  // Reset to first page when search term or filter changes
  useEffect(() => {
    // Only reset if not already on page 1 to avoid triggering unnecessary re-renders
    setPagination((p) => {
      if (p.currentPage !== 1) {
        return { ...p, currentPage: 1 }
      }
      return p
    })
  }, [debouncedSearchTerm, selectedObject, selectedApplication, selectedModule, selectedSubModule, selectedObjectType, selectedValidationId])

  const handleBackToList = () => {
    setView("list")
    setEditingValidation(null)
    // fetchValidations() is automatically called by useEffect when view changes to "list"
  }

  const handleAddNew = () => {
    setEditingValidation(null)
    setView("add")
  }

  const handleEdit = useCallback(
    (id: string) => {
      const validationToEdit = validations.find((v) => v.id === id)
      if (validationToEdit) {
        setEditingValidation(validationToEdit)
        setView("edit")
      } else {
        toast.error("Could not find the selected validation to edit.")
      }
    },
    [validations],
  )

  const handleView = useCallback(
    (id: string) => {
      const validationToView = validations.find((v) => v.id === id)
      if (validationToView) {
        setEditingValidation(validationToView)
        setView("view")
      } else {
        toast.error("Could not find the selected validation to view.")
      }
    },
    [validations],
  )

  const handleExecute = useCallback(
    (id: string) => {
      const validationToExecute = validations.find((v) => v.id === id)
      if (validationToExecute) {
        setEditingValidation(validationToExecute)
        setView("execute")
      } else {
        toast.error("Could not find the selected validation to execute.")
      }
    },
    [validations],
  )

  const initiateDelete = useCallback((id: string) => {
    setIdToDelete(id)
  }, [])

  const handleConfirmDelete = async () => {
    if (!idToDelete) return
    try {
      await deleteValidation(idToDelete)
      toast.success("Validation deleted successfully.")
      fetchValidations()
    } catch (error) {
      toast.error("Failed to delete validation.")
    } finally {
      setIdToDelete(null)
    }
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setSelectedObject("all")
    setSelectedApplication("all")
    setSelectedModule("all")
    setSelectedSubModule("all")
    setSelectedObjectType("all")
    setSelectedValidationId("all")
  }

  const handleScheduler = useCallback(
    (id: string) => {
      const validationToSchedule = validations.find((v) => v.id === id)
      if (validationToSchedule) {
        setEditingValidation(validationToSchedule)
        // For now, just show a toast - can be extended later
        toast.info("Scheduler functionality will be implemented soon.")
      } else {
        toast.error("Could not find the selected validation to schedule.")
      }
    },
    [validations],
  )

  // Convert validations to CustomTableData format
  const tableData = useMemo(() => {
    return validations.map((validation) => ({
      id: validation.id,
      validation_id: (
        <button
          onClick={() => handleEdit(validation.id)}
          className="text-sky-700 font-medium hover:underline cursor-pointer text-left"
        >
          {validation.validation_id}
        </button>
      ),
      application_label: validation.application_label,
      object_type_label: validation.object_type_label,
      module_label: validation.module_label,
      sub_module_label: validation.sub_module_label,
      object_label: validation.object_label,
      tcode_label: validation.tcode_label,
      validation_description: validation.validation_description,
      created_at: validation.created_at ? new Date(validation.created_at).toLocaleDateString("en-GB") + " " + new Date(validation.created_at).toLocaleTimeString("en-GB") : "N/A",
      updated_at: validation.updated_at ? new Date(validation.updated_at).toLocaleDateString("en-GB") + " " + new Date(validation.updated_at).toLocaleTimeString("en-GB") : "N/A",
      actions: (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleView(validation.id)}>View</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(validation.id)}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExecute(validation.id)}>Execute</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleScheduler(validation.id)}>Scheduler</DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-100"
                onClick={() => initiateDelete(validation.id)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
    }))
  }, [validations, handleEdit, handleExecute, handleView, handleScheduler, initiateDelete])

  const columns = useMemo(() => [
    { key: "validation_id", header: "VC ID", sortable: true, filterable: true },
    { key: "application_label", header: "Application", sortable: true, filterable: true },
    { key: "object_type_label", header: "Object Type", sortable: true, filterable: true },
    { key: "module_label", header: "Module", sortable: true, filterable: true },
    { key: "sub_module_label", header: "Sub Module", sortable: true, filterable: true },
    { key: "object_label", header: "Object", sortable: true, filterable: true },
    { key: "tcode_label", header: "Tcode", sortable: true, filterable: true },
    { key: "validation_description", header: "VC Description", sortable: true, filterable: true, TruncateData: true },
    { key: "created_at", header: "Created", sortable: true, filterable: true },
    { key: "updated_at", header: "Updated", sortable: true, filterable: true },
    { key: "actions", header: "Actions", sortable: false, filterable: false, align: "right" as const, colWidth: 100, colClassName: "fixed-actions-col" },
  ], [])

  if (view === "add" || view === "edit" || view === "view" || view === "execute") {
    if (view === "execute") {
      return (
        <ValidationExecutionPage
          validationId={editingValidation?.id || null}
          validationData={editingValidation}
          onBack={handleBackToList}
          
        />
      )
    }

    return (
      <ValidationTabView
        key={editingValidation?.id || "add"}
        mode={view}
        validationId={editingValidation?.id || null}
        initialData={editingValidation}
        onCancel={handleBackToList}
        onSave={handleBackToList}
      />
    )
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

  const filterVariants = {
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
      className="space-y-2 bg-white p-2"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex flex-col gap-4">
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
          variants={itemVariants}
        >
          <h2 className="text-lg font-semibold shrink-0">Validation Components</h2>
          <motion.div
            className="flex flex-col sm:flex-row sm:items-center gap-2 sm:flex-wrap sm:justify-end"
            variants={itemVariants}
          >
            <div className="w-full sm:w-auto sm:max-w-xs">
              <SearchBar
                currentValue={searchTerm}
                onSearch={setSearchTerm}
                size="small"
              />
            </div>
            <Button
              variant="outline"
              className="!h-7 !w-7 bg-transparent"
              size="icon"
              onClick={() => fetchValidations()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <AnimatePresence>
              {(searchTerm || selectedObject !== "all" || selectedApplication !== "all" || selectedModule !== "all" || selectedSubModule !== "all" || selectedObjectType !== "all" || selectedValidationId !== "all") && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button variant="outline" className="!h-7" onClick={handleClearFilters}>
                    Clear
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                className="!h-7" 
                onClick={handleAddNew}
              >
                <span className="text-xs sm:text-sm">Add Validation</span>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
        
        {/* Filter Dropdowns */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="flex flex-col gap-1" variants={filterVariants}>
            <label className="text-xs font-medium text-gray-700">Application</label>
            <DropdownV2
              value={selectedApplication}
              onChange={(value) => setSelectedApplication(value as string)}
              options={[
                { label: "All Applications", value: "all" },
                ...uniqueApplications.map(app => ({ label: app, value: app }))
              ]}
              placeholder="Application"
              searchable={true}
              size="small"
            />
          </motion.div>

          <motion.div className="flex flex-col gap-1" variants={filterVariants}>
            <label className="text-xs font-medium text-gray-700">Module</label>
            <DropdownV2
              value={selectedModule}
              onChange={(value) => setSelectedModule(value as string)}
              options={[
                { label: "All Modules", value: "all" },
                ...uniqueModules.map(module => ({ label: module, value: module }))
              ]}
              placeholder="Module"
              searchable={true}
              size="small"
            />
          </motion.div>

          <motion.div className="flex flex-col gap-1" variants={filterVariants}>
            <label className="text-xs font-medium text-gray-700">Sub Module</label>
            <DropdownV2
              value={selectedSubModule}
              onChange={(value) => setSelectedSubModule(value as string)}
              options={[
                { label: "All Sub Modules", value: "all" },
                ...uniqueSubModules.map(subModule => ({ label: subModule, value: subModule }))
              ]}
              placeholder="Sub Module"
              searchable={true}
              size="small"
            />
          </motion.div>

          <motion.div className="flex flex-col gap-1" variants={filterVariants}>
            <label className="text-xs font-medium text-gray-700">Object Type</label>
            <DropdownV2
              value={selectedObjectType}
              onChange={(value) => setSelectedObjectType(value as string)}
              options={[
                { label: "All Object Types", value: "all" },
                ...uniqueObjectTypes.map(objectType => ({ label: objectType, value: objectType }))
              ]}
              placeholder="Object Type"
              searchable={true}
              size="small"
            />
          </motion.div>

          <motion.div className="flex flex-col gap-1" variants={filterVariants}>
            <label className="text-xs font-medium text-gray-700">Object</label>
            <DropdownV2
              value={selectedObject}
              onChange={(value) => setSelectedObject(value as string)}
              options={[
                { label: "All Objects", value: "all" },
                ...uniqueObjects.map(object => ({ label: object, value: object }))
              ]}
              placeholder="Object"
              searchable={true}
              size="small"
            />
          </motion.div>

          <motion.div className="flex flex-col gap-1" variants={filterVariants}>
            <label className="text-xs font-medium text-gray-700">Validation ID</label>
            <DropdownV2
              value={selectedValidationId}
              onChange={(value) => setSelectedValidationId(value as string)}
              options={[
                { label: "All Validation IDs", value: "all" },
                ...uniqueValidationIds.map(validationId => ({ label: validationId, value: validationId }))
              ]}
              placeholder="Validation ID"
              searchable={true}
              size="small"
            />
          </motion.div>
        </motion.div>
      </div>
      <motion.div
        className="relative"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
      >
        <style>{`
          /* Fix Actions column */
          table th:last-child,
          table td:last-child {
            position: sticky !important;
            right: 0 !important;
            background-color: white !important;
            z-index: 10 !important;
          }
          table thead th:last-child {
            position: sticky !important;
            top: 0 !important;
            right: 0 !important;
            background-color: #F7F7F7 !important;
            z-index: 31 !important;
          }
          table tbody tr:hover td:last-child {
            background-color: #FAFAFA !important;
          }

          /* General data cell styling - regular weight, sans-serif */
          table tbody td {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            font-weight: 400;
            color: #374151;
          }

          /* VC ID column - dark grey/black */
          table tbody td:nth-child(1) {
            color: #1f2937;
            font-weight: 400;
          }

          /* Application column - dark grey/black */
          table tbody td:nth-child(2) {
            color: #374151;
            font-weight: 400;
          }

          /* Object Type column - dark grey/black */
          table tbody td:nth-child(3) {
            color: #374151;
            font-weight: 400;
          }

          /* Module column - dark grey/black */
          table tbody td:nth-child(4) {
            color: #374151;
            font-weight: 400;
          }

          /* Sub Module column - dark grey/black */
          table tbody td:nth-child(5) {
            color: #374151;
            font-weight: 400;
          }

          /* Object column - dark grey/black */
          table tbody td:nth-child(6) {
            color: #374151;
            font-weight: 400;
          }

          /* Tcode column - dark grey/black */
          table tbody td:nth-child(7) {
            color: #374151;
            font-weight: 400;
          }

          /* VC Description column - dark grey/black */
          table tbody td:nth-child(8) {
            color: #374151;
            font-weight: 400;
          }

          /* Created column - dark grey/black */
          table tbody td:nth-child(9) {
            color: #374151;
            font-weight: 400;
          }

          /* Updated column - dark grey/black */
          table tbody td:nth-child(10) {
            color: #374151;
            font-weight: 400;
          }

          /* Actions column - blue links */
          table tbody td:last-child button {
            color: #2563eb !important;
            font-weight: 400;
          }
          table tbody td:last-child button:hover {
            color: #1d4ed8 !important;
          }

          /* Header styling - keep existing */
          table thead th {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            font-weight: 600;
            color: #374151;
          }
        `}</style>
        <CustomTableData
          data={tableData}
          columns={columns}
          rowKey="id"
          scrollHeightClass="max-h-[550px]"
          emptyState={<div className="p-8 text-center text-slate-500">Data not found. Please adjust the filter criteria.</div>}
          showSpinnerFlag={isLoading}
          spinnerLabel="Loading validations..."
          HorizontalScroll={true}
        />

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
          <div className="text-sm text-gray-600">
            Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, totalItems)} of {totalItems} results
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(p => ({ ...p, currentPage: 1 }))}
              disabled={pagination.currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(p => ({ ...p, currentPage: Math.max(1, p.currentPage - 1) }))}
              disabled={pagination.currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="px-3 py-1.5 text-sm text-gray-700">
              Page {pagination.currentPage} of {Math.ceil(totalItems / pagination.limit) || 1}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(p => ({ ...p, currentPage: p.currentPage + 1 }))}
              disabled={pagination.currentPage >= Math.ceil(totalItems / pagination.limit)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(p => ({ ...p, currentPage: Math.ceil(totalItems / pagination.limit) }))}
              disabled={pagination.currentPage >= Math.ceil(totalItems / pagination.limit)}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
            
            <Select
              value={String(pagination.limit)}
              onValueChange={(value) => setPagination(p => ({ ...p, limit: Number(value), currentPage: 1 }))}
            >
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      </motion.div>

      <Dialog open={!!idToDelete} onOpenChange={(open) => !open && setIdToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this validation rule? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end pt-2">
            <Button variant="outline" onClick={() => setIdToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

export default ValidationListPage
