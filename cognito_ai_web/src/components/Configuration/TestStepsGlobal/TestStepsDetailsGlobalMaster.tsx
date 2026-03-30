import React, { useEffect, useReducer, useRef, useState } from "react";
import CustomTable from "../../../utils/CustomTable.js";
import { CircleAlert, Plus, Save, Trash2, X, SquarePen, Info } from "lucide-react";
import { apiRequest } from "../../../utils/helpers/ApiHelper.js";
import SpinnerV2 from "../../../utils/SpinnerV2.js";
import ErrorScreen from "../../../utils/ErrorScreen.js";
import Pagination from "../../../utils/Pagination.js";
import Toast from "../../../utils/Toast.js";
import ConfirmPopup from "../../../utils/ConfirmPopup.js";
import useDebounce from "../../../utils/helpers/useDebounce.js";
import SearchBar from "../../../utils/SearchBar.js";
import Dropdown from "../../../utils/Dropdown.js";
import CustomModal from "../../../utils/CustomModal.js";
import {IoMdPlayCircle} from "react-icons/io";

type ReactNodeRecord = Record<string, React.ReactNode>;

interface Option {
    value: string;
    label: string;
}

interface DropdownOption {
    value: string;
    label: string;
    Component?: string;
    ComponentTypeName?: string;
    validation_description?: string;
}

interface CurrAddEditDetails {
    TestStepsId: string;
}

type RowErrorMap = Record<string | number, Record<string, string>>;

interface ApiDetails {
    ApiId: string;
    ServiceName: string;
    ApiMethod: string;
    EndPoint: string;
    Version: string;
    RequestSchema: any;
    Headers: any;
    ResponseData: any;
    ApiNotes: string;
    ApiType?: string;
    ValidationKey?: string;
    ValidationPath?: string;
    UsePadding?: string;
    IsFinalStep?: string;
}

interface TestStepDetail {
    TestStepDetailId: string;
    TestStepsId: string;
    StepNo: number | string;
    Description: string;
    ExpectedResult: string;
    ComponentType: string;
    Component: string;
    Data: string;
    Status: number;
    isNew?: boolean;
    tempId?: number;
    ComponentTypeName?: string;
    ComponentIdLabel?: string;
    // API Details
    ApiId?: string;
    ServiceName?: string;
    ApiMethod?: string;
    EndPoint?: string;
    Version?: string;
    RequestSchema?: any;
    Headers?: any;
    ResponseData?: any;
    ApiNotes?: string;
    ApiType?: string;
    ValidationKey?: string;
    ValidationPath?: string;
    UsePadding?: string;
    IsFinalStep?: string;
}

interface State {
    Error: string;
    TestStepsDetails: TestStepDetail[];
    TestStepsList: Option[];
    ComponentTypeList: Option[];
    SearchQuery: string;
    CurrentPage: number;
    TotalRecords: number;
    IsLoading: boolean;
    showToast: boolean;
    SavingLoader: boolean;
    isModalOpen: boolean;
    currentEditItem: TestStepDetail | null;
    modalErrors: Record<string, string>;
    isApiDetailsModalOpen: boolean;
    currentApiDetails: ApiDetails | null;
    afterStepNo: string;
    itemToDelete: TestStepDetail | null;
    showSequentialUpdateConfirm: boolean;
    showSequenceRefreshConfirm: boolean;
    isRefreshingSequence: boolean;
    executionComponentOptions: DropdownOption[];
    validationComponentOptions: DropdownOption[];
    loadingComponentIds: Record<string | number, boolean>;
}

type Action = Partial<State>;

type Props = {
    CurrAddEditDetails: CurrAddEditDetails;
    handleBreadcrumbClick: (id: string, label?: string) => void;
    ActiveBCItem: string;
};

const initialState: State = {
    Error: "",
    TestStepsDetails: [],
    TestStepsList: [],
    ComponentTypeList: [],
    SearchQuery: "",
    CurrentPage: 1,
    TotalRecords: 0,
    IsLoading: true,
    showToast: false,
    SavingLoader: false,
    isModalOpen: false,
    currentEditItem: null,
    modalErrors: {},
    isApiDetailsModalOpen: false,
    currentApiDetails: null,
    afterStepNo: "",
    itemToDelete: null,
    showSequentialUpdateConfirm: false,
    showSequenceRefreshConfirm: false,
    isRefreshingSequence: false,
    executionComponentOptions: [],
    validationComponentOptions: [],
    loadingComponentIds: {},
};

function reducer(state: State, newState: Action): State {
    return { ...state, ...newState };
}

export default function TestStepsDetailsGlobalMaster(props: Props) {
    const [state, setState] = useReducer<typeof reducer, State>(reducer, initialState);
    const debouncedSearchQuery = useDebounce(state.SearchQuery, 300) as string;

    useEffect(() => {
        const init = async () => {
            setState({ IsLoading: true });
            await getComponentTypes();
            await getData(debouncedSearchQuery);
            setState({ IsLoading: false });
        };

        init();
    }, [debouncedSearchQuery]);

    const handleSequenceRefreshClick = (): void => {
        setState({ showSequenceRefreshConfirm: true });
    };

    const handleSequenceRefreshConfirm = async (): Promise<void> => {
        setState({ 
            showSequenceRefreshConfirm: false,
            isRefreshingSequence: true 
        });

        try {
            console.log("Refreshing sequence for TestStepsId:", props.CurrAddEditDetails.TestStepsId);
            
            const resp: any = await apiRequest("/RefreshTestStepsSequenceGlobal", {
                TestStepsId: props.CurrAddEditDetails.TestStepsId
            });
            
            console.log("Sequence refresh response:", resp);
            
            if (resp && resp.status === 'success') {
                setState({ 
                    isRefreshingSequence: false,
                    showToast: true
                });
                
                // Refresh the data
                await getData(state.SearchQuery, state.CurrentPage);
                
                setTimeout(() => {
                    setState({ showToast: false });
                }, 3000);
            } else {
                setState({ 
                    isRefreshingSequence: false,
                    Error: resp.error || "Failed to Refresh Step No(s)"
                });
            }
        } catch (error) {
            console.error("Error refreshing sequence:", error);
            setState({ 
                Error: String(error),
                isRefreshingSequence: false
            });
        }
    };

    const handleSequenceRefreshCancel = (): void => {
        setState({ showSequenceRefreshConfirm: false });
    };

    const getExecutionComponents = async () => {
        console.log("Fetching execution components...");
        try {
            const resp: any = await apiRequest("/GetExecutionComponents", {
                SearchString: ""
            });
            console.log("Execution components response:", resp);

            if (resp.ResponseData && resp.ResponseData.length > 0) {
                setState({ executionComponentOptions: resp.ResponseData as DropdownOption[] });
            } else {
                setState({ executionComponentOptions: [] });
            }
        } catch (err) {
            console.error("Error fetching execution components:", err);
        }
    };

    const getValidationComponents = async () => {
        console.log("Fetching validation components...");
        try {
            const resp: any = await apiRequest("/GetValidationInfo", {
                SearchString: ""
            });
            console.log("Validation components response:", resp);

            if (resp.ResponseData && resp.ResponseData.length > 0) {
                setState({ validationComponentOptions: resp.ResponseData as DropdownOption[] });
            } else {
                setState({ validationComponentOptions: [] });
            }
        } catch (err) {
            console.error("Error fetching validation components:", err);
        }
    };

    // Helper function to get component options based on component type
    const getComponentIdOptions = (componentType: string): DropdownOption[] => {
        const selectedTypeOption = state.ComponentTypeList.find(opt => opt.value === componentType);
        const componentTypeLabel = selectedTypeOption?.label || selectedTypeOption?.ComponentTypeName || "";
        
        console.log("Getting options for type label:", componentTypeLabel);
        
        if (componentTypeLabel.toLowerCase().includes('execution')) {
            console.log("Returning execution options:", state.executionComponentOptions);
            return state.executionComponentOptions || [];
        } else if (componentTypeLabel.toLowerCase().includes('validation')) {
            console.log("Returning validation options:", state.validationComponentOptions);
            return state.validationComponentOptions || [];
        }
        
        return [];
    };

    // Component Type Change Handler
    const handleComponentTypeChange = async (val: string): Promise<void> => {
        if (!state.currentEditItem) return;

        const newComponentType = val;
        const rowId = state.currentEditItem.isNew ? (state.currentEditItem.tempId as number) : state.currentEditItem.TestStepDetailId;
        
        console.log("Component type changed to:", newComponentType);
        console.log("Row ID:", rowId);

        // Find the selected component type option to get its label
        const selectedTypeOption = state.ComponentTypeList.find(opt => opt.value === newComponentType);
        console.log("Selected type option:", selectedTypeOption);
        
        const componentTypeLabel = selectedTypeOption?.label || selectedTypeOption?.ComponentTypeName || "";
        console.log("Component type label:", componentTypeLabel);

        // Update ComponentType and reset Component and Description
        setState({
            currentEditItem: {
                ...state.currentEditItem,
                ComponentType: newComponentType,
                Component: "",
                Description: ""
            },
        });

        // Fetch appropriate component options based on type label
        if (newComponentType) {
            console.log("Setting loading state for row:", rowId);
            setState({
                loadingComponentIds: {
                    ...state.loadingComponentIds,
                    [rowId]: true
                }
            });

            try {
                // Check against the label/name instead of the ID
                if (componentTypeLabel.toLowerCase().includes('execution')) {
                    console.log("Fetching Execution components...");
                    await getExecutionComponents();
                } else if (componentTypeLabel.toLowerCase().includes('validation')) {
                    console.log("Fetching Validation components...");
                    await getValidationComponents();
                } else {
                    console.log("Unknown component type:", componentTypeLabel);
                }
            } catch (error) {
                console.error("Error fetching component options:", error);
            } finally {
                console.log("Removing loading state for row:", rowId);
                setState({
                    loadingComponentIds: {
                        ...state.loadingComponentIds,
                        [rowId]: false
                    }
                });
            }
        }
    };

    // Component ID Change Handler
    const handleComponentIdChange = (val: string): void => {
        if (!state.currentEditItem) return;

        const selectedComponentId = val;
        
        console.log("Component ID changed to:", selectedComponentId);
        console.log("Current component type:", state.currentEditItem.ComponentType);
        
        // Find the component type label
        const selectedTypeOption = state.ComponentTypeList.find(opt => opt.value === state.currentEditItem.ComponentType);
        const componentTypeLabel = selectedTypeOption?.label || selectedTypeOption?.ComponentTypeName || "";
        console.log("Component type label:", componentTypeLabel);
        
        // Find the selected component to get its description
        const componentIdOptions = getComponentIdOptions(state.currentEditItem.ComponentType);
        console.log("Available options:", componentIdOptions);
        
        const selectedOption = componentIdOptions.find(opt => opt.value === selectedComponentId);
        console.log("Selected option:", selectedOption);
        
        // Get description based on component type label
        let description = "";
        if (selectedOption) {
            if (componentTypeLabel.toLowerCase().includes('execution')) {
                // For Execution components, use 'Component' field as description
                description = selectedOption.Component || selectedOption.label || "";
            } else if (componentTypeLabel.toLowerCase().includes('validation')) {
                // For Validation components, use 'validation_description' field
                description = selectedOption.validation_description || selectedOption.label || "";
            }
        }
        
        console.log("Auto-populated description:", description);

        // Update both Component and Description
        setState({
            currentEditItem: {
                ...state.currentEditItem,
                Component: selectedComponentId,
                Description: description
            },
        });
    };

    const handleModalDropdownChange = (val: string, field: string): void => {
        if (state.currentEditItem) {
            if (field === "Component") {
                // Use the new Component ID change handler
                handleComponentIdChange(val);
            } else {
                setState({
                    currentEditItem: {
                        ...state.currentEditItem,
                        [field]: val,
                    },
                });
            }
        }
    };

    const getComponentTypes = async (): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetComponentTypesMaster", {});
            if (resp.ResponseData && resp.ResponseData.length > 0) {
                setState({ ComponentTypeList: resp.ResponseData as Option[] });
            }
        } catch (err) {
            console.error("Error fetching component types:", err);
        }
    };

    const getData = async (SearchQuery: string = "", PageNo: number = 1): Promise<void> => {
        try {
            setState({ IsLoading: true });
            
            console.log("Fetching data with:", { 
                TestStepsId: props.CurrAddEditDetails.TestStepsId, 
                SearchQuery, 
                PageNo 
            });
            
            const resp: any = await apiRequest("/GetTestStepsDetailsGlobalPaginationFilterSearch", {
                PageNo,
                StartDate: "",
                EndDate: "",
                TestStepsId: props.CurrAddEditDetails.TestStepsId,
                SearchString: SearchQuery,
            });
            
            console.log("Received data:", resp);
            
            if (resp.ResponseData && resp.ResponseData.length > 0) {
                setState({ 
                    TestStepsDetails: resp.ResponseData as TestStepDetail[], 
                    TotalRecords: resp.TotalRecords as number,
                    IsLoading: false 
                });
            } else {
                setState({ 
                    TestStepsDetails: [], 
                    TotalRecords: 0,
                    IsLoading: false 
                });
            }
        } catch (err) {
            console.error("Error fetching data:", err);
            setState({ Error: String(err), IsLoading: false });
        }
    };

    const getAvailableStepNumbers = (): Option[] => {
        // Filter steps by current TestStepsId
        const currentTestSteps = state.TestStepsDetails
            .filter(item => item.TestStepsId === props.CurrAddEditDetails.TestStepsId)
            .sort((a, b) => parseInt(String(a.StepNo)) - parseInt(String(b.StepNo)))
            .map(item => ({
                value: String(item.StepNo),
                label: `After Step ${item.StepNo}`
            }));
        
        return [
            { value: "0", label: "At Beginning (Step 1)" },
            ...currentTestSteps
        ];
    };

    const handleAddNew = (): void => {
        const existingStepNos = state.TestStepsDetails
            .filter(item => item.TestStepsId === props.CurrAddEditDetails.TestStepsId)
            .map((item) => parseInt(String(item.StepNo)) || 0);
        
        const nextStepNo = existingStepNos.length > 0 ? Math.max(...existingStepNos) + 1 : 1;

        const newRow: TestStepDetail = {
            TestStepDetailId: "",
            TestStepsId: props.CurrAddEditDetails.TestStepsId,
            StepNo: nextStepNo,
            Description: "",
            ExpectedResult: "",
            ComponentType: "",
            Component: "",
            Data: "{}",
            Status: 1,
            isNew: true,
            tempId: Date.now(),
        };
        
        setState({
            currentEditItem: newRow,
            isModalOpen: true,
            modalErrors: {},
            afterStepNo: String(existingStepNos.length > 0 ? Math.max(...existingStepNos) : 0),
        });
    };

    const handleEdit = (item: TestStepDetail): void => {
        setState({
            currentEditItem: { ...item },
            isModalOpen: true,
            modalErrors: {},
            afterStepNo: "",
        });
    };

    const handleModalClose = (): void => {
        setState({
            isModalOpen: false,
            currentEditItem: null,
            modalErrors: {},
            afterStepNo: "",
        });
    };

    const handleShowApiDetails = (item: TestStepDetail): void => {
        if (item.ApiId) {
            const apiDetails: ApiDetails = {
                ApiId: item.ApiId || "",
                ServiceName: item.ServiceName || "",
                ApiMethod: item.ApiMethod || "",
                EndPoint: item.EndPoint || "",
                ApiType: item.ApiType || "",
                ValidationKey: item.ValidationKey || "",
                ValidationPath: item.ValidationPath || "",
                UsePadding: item.UsePadding || "",
                IsFinalStep: item.IsFinalStep || "",
                Version: item.Version || "",
                RequestSchema: item.RequestSchema || null,
                Headers: item.Headers || null,
                ResponseData: item.ResponseData || null,
                ApiNotes: item.ApiNotes || "",
            };
            setState({
                currentApiDetails: apiDetails,
                isApiDetailsModalOpen: true,
            });
        }
    };

    const handleCloseApiDetailsModal = (): void => {
        setState({
            isApiDetailsModalOpen: false,
            currentApiDetails: null,
        });
    };

    const validateModalForm = (): boolean => {
        const errors: Record<string, string> = {};
        const item = state.currentEditItem;

        if (!item) return false;

        if (!item.StepNo || Number(item.StepNo) <= 0) {
            errors.StepNo = "Step No is required and must be greater than 0";
        }

        if (!item.ComponentType) {
            errors.ComponentType = "Component Type is required";
        }

        if (item.Data) {
            try {
                JSON.parse(item.Data);
            } catch {
                errors.Data = "Invalid JSON format";
            }
        }

        setState({ modalErrors: errors });
        return Object.keys(errors).length === 0;
    };

    const handleModalSave = async (): Promise<void> => {
        if (!validateModalForm() || !state.currentEditItem) return;

        setState({ SavingLoader: true });

        try {
            const itemToSave = { ...state.currentEditItem };
            itemToSave.TestStepsId = props.CurrAddEditDetails.TestStepsId || "";
            
            if (itemToSave.Data && typeof itemToSave.Data === "string") {
                try {
                    JSON.parse(itemToSave.Data);
                } catch {
                    itemToSave.Data = "{}";
                }
            }

            await apiRequest("/AddUpdateTestStepsDetailsGlobal", itemToSave as any);

            setState({
                SavingLoader: false,
                showToast: true,
                isModalOpen: false,
                currentEditItem: null,
                modalErrors: {},
                afterStepNo: "",
            });

            await getData();
            setTimeout(() => setState({ showToast: false }), 3000);
        } catch (error) {
            setState({ SavingLoader: false, Error: String(error) });
        }
    };

    const handleModalFieldChange = (field: string, value: any): void => {
        if (state.currentEditItem) {
            if (field === "AfterStepNo") {
                const selectedStepNo = parseInt(value);
                let nextStepNo = 1;
                
                if (selectedStepNo === 0) {
                    // Insert at beginning
                    nextStepNo = 1;
                } else {
                    // Insert after selected step
                    nextStepNo = selectedStepNo + 1;
                }
                
                setState({
                    currentEditItem: {
                        ...state.currentEditItem,
                        StepNo: nextStepNo,
                    },
                    afterStepNo: value,
                });
            } else {
                setState({
                    currentEditItem: {
                        ...state.currentEditItem,
                        [field]: value,
                    },
                });
            }
        }
    };

    const handlePageChange = (page: number): void => {
        setState({ CurrentPage: page });
        getData(state.SearchQuery, page);
    };

    const performDeleteWithSequentialCheck = (item: TestStepDetail): void => {
        setState({
            itemToDelete: item,
            showSequentialUpdateConfirm: true,
        });
    };

    const handleSequentialUpdateConfirm = async (updateSequential: boolean): Promise<void> => {
        if (!state.itemToDelete) return;

        setState({ showSequentialUpdateConfirm: false, SavingLoader: true });

        try {
            if (state.itemToDelete.TestStepDetailId) {
                // Prepare the delete request with the flag
                const deleteRequest = {
                    TestStepDetailId: state.itemToDelete.TestStepDetailId,
                    TestStepsId: state.itemToDelete.TestStepsId,
                    StepNo: state.itemToDelete.StepNo,
                    updateSequential: updateSequential
                };

                console.log("Sending delete request:", deleteRequest);

                const resp: any = await apiRequest("/DeleteTestStepsDetailsGlobal", deleteRequest);
                
                console.log("Delete response:", resp);
                
                if (resp) {
                    setState({ 
                        itemToDelete: null,
                        SavingLoader: false,
                    });
                    
                    // Refresh the data with current search query and page
                    await getData(state.SearchQuery, state.CurrentPage);
                    
                    // Show success toast
                    setState({ showToast: true });
                    setTimeout(() => {
                        setState({ showToast: false });
                    }, 3000);
                }
            }
        } catch (error) {
            console.error("Error deleting item:", error);
            setState({ 
                Error: String(error),
                itemToDelete: null,
                SavingLoader: false,
            });
        }
    };

    const handleSequentialUpdateCancel = (): void => {
        setState({
            showSequentialUpdateConfirm: false,
            itemToDelete: null,
        });
    };

    const handleSearch = (value: string): void => {
        setState({ SearchQuery: value });
        if (value.trim() === "") {
            getData("");
        }
    };

    const columns: { title: string; key: string; className?: string }[] = [
        { title: "Step No", key: "StepNo", className: "min-w-[100px]" },
        { title: "Component Type", key: "ComponentType", className: "min-w-[150px]" },
        { title: "Component", key: "Component", className: "min-w-[150px]" },
        { title: "Description", key: "Description", className: "min-w-[300px]" },
        { title: "Expected Result", key: "ExpectedResult", className: "min-w-[300px]" },
    ];

    const allRows: TestStepDetail[] = [...state.TestStepsDetails].sort(
        (a, b) => parseInt(String(a.StepNo)) - parseInt(String(b.StepNo))
    );

    const data: ReactNodeRecord[] = allRows.map((item) => {
        const hasApiData = item.ComponentTypeName === "Execution" && item.ApiId && item.ServiceName;
        return {
            StepNo: item.StepNo as React.ReactNode,
            TestStepsId: item.TestStepsId,
            ComponentType: state.ComponentTypeList.find(opt => opt.value === item.ComponentType)?.label || item.ComponentType,
            Component: (
                <div className="flex items-center gap-2">
                    <span>
                        {item.ComponentIdLabel || item.Component || "-"}
                    </span>
                    {hasApiData && (
                        <button
                            onClick={() => handleShowApiDetails(item)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="View API Details"
                        >
                            <Info size={18} />
                        </button>
                    )}
                </div>
            ),
            Description: item.Description || "-",
            ExpectedResult: item.ExpectedResult || "-",
            actions: (
                <div className="relative flex items-center">
                    <button onClick={() => handleEdit(item)} className="ml-2 text-white px-3 py-1 rounded text-sm">
                        <SquarePen className="text-[#1A1A1A] cursor-pointer" />
                    </button>
                    <ConfirmPopup 
                        message="Are you sure you want to delete this step?" 
                        onConfirm={() => performDeleteWithSequentialCheck(item)}
                    >
                        <button className="ml-2 pr-4 flex items-center">
                            <Trash2 className="text-[#1A1A1A] cursor-pointer" />
                        </button>
                    </ConfirmPopup>
                </div>
            ),
        } as ReactNodeRecord;
    });

    if (state.IsLoading)
        return (
            <div className="h-96 py-20">
                <SpinnerV2 {...{ text: "Fetching data..." }} />
            </div>
        );
    if (state.Error) return <ErrorScreen message={state.Error} />;

    return (
        <div className="pt-0 pb-6">
            <Toast message="Saved successfully!" show={state.showToast} onClose={() => setState({ showToast: false })} />

            <div className="flex justify-between items-center pb-4">
                <div className="w-1/3">
                    <SearchBar currentValue={state.SearchQuery} onSearch={handleSearch} size="medium" />
                </div>

                <div className="flex items-center space-x-2 gap-4">
                    {/* Sequence Refresh Button */}
                    <button
                        onClick={handleSequenceRefreshClick}
                        disabled={state.isRefreshingSequence}
                        className="bg-blue-600 hover:bg-blue-700 text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Refresh step sequence numbers (1, 2, 3...)"
                    >
                        {state.isRefreshingSequence ? (
                            <>
                                <span className="animate-spin">⟳</span>
                                <span>Refreshing...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Refresh Step No(s)</span>
                            </>
                        )}
                    </button>

                    {/* Add Step Button */}
                    <button
                        onClick={handleAddNew}
                        className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Step</span>
                    </button>
                </div>
            </div>

            <CustomTable columns={columns} data={data} responsive={true} />

            {state.TotalRecords > 10 && (
                <div className="pt-4 flex justify-end">
                    <Pagination
                        total={state.TotalRecords}
                        current={state.CurrentPage}
                        pageSize={10}
                        onChange={handlePageChange}
                        showSizeChanger={false}
                    />
                </div>
            )}

            {/* Edit Modal */}
            <CustomModal
                isOpen={state.isModalOpen}
                onClose={handleModalClose}
                title={state.currentEditItem?.isNew ? "Add Test Step" : "Edit Test Step"}
                width="max-w-4xl"
                footerContent={
                    <>
                        <button
                            onClick={handleModalClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleModalSave}
                            disabled={state.SavingLoader}
                            className="px-4 py-2 bg-[#0071E9] text-white rounded-lg hover:bg-[#005ABA] transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {state.SavingLoader ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    Save
                                </>
                            )}
                        </button>
                    </>
                }
            >
                {state.currentEditItem && (
                    <div className="space-y-4">
                        {/* Row 1: Insert Position and Component Type */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Insert Step Position */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Insert Step <span className="text-red-500">*</span>
                                </label>
                                
                                {state.currentEditItem.isNew ? (
                                    <div className="space-y-2">
                                        <Dropdown
                                            size="medium"
                                            mode="single"
                                            options={getAvailableStepNumbers()}
                                            value={state.afterStepNo}
                                            onChange={(val: string) => handleModalFieldChange("AfterStepNo", val)}
                                            placeholder="Select position"
                                            className={state.modalErrors.StepNo ? "border-red-500" : ""}
                                        />
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-gray-600">New step will be:</span>
                                            <span className="font-semibold text-[#0071E9] bg-purple-50 px-2 py-1 rounded">
                                                Step {state.currentEditItem.StepNo}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <input
                                            type="number"
                                            min={1}
                                            value={state.currentEditItem.StepNo}
                                            disabled
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                                        />
                                        <p className="text-sm text-gray-500">Step number cannot be changed when editing</p>
                                    </div>
                                )}
                                
                                {state.modalErrors.StepNo && (
                                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                        <CircleAlert size={14} />
                                        {state.modalErrors.StepNo}
                                    </p>
                                )}
                            </div>

                            {/* Component Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Component Type <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    size="medium"
                                    mode="single"
                                    options={state.ComponentTypeList}
                                    value={state.currentEditItem.ComponentType}
                                    onChange={(val: string) => {
                                        console.log("ComponentType dropdown onChange called with:", val);
                                        handleComponentTypeChange(val);
                                    }}
                                    className={state.modalErrors.ComponentType ? "border-red-500" : ""}
                                    placeholder="Select Component Type"
                                />
                                {state.modalErrors.ComponentType && (
                                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                        <CircleAlert size={14} />
                                        {state.modalErrors.ComponentType}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Row 2: Component and Description */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Component */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Component
                                </label>
                                <Dropdown
                                    size="medium"
                                    mode="single"
                                    options={getComponentIdOptions(state.currentEditItem.ComponentType)}
                                    value={state.currentEditItem?.Component || ""}
                                    onChange={(val: string) => handleModalDropdownChange(val, "Component")}
                                    placeholder="Select Component"
                                    disabled={!state.currentEditItem.ComponentType || state.loadingComponentIds[state.currentEditItem.isNew ? (state.currentEditItem.tempId as number) : state.currentEditItem.TestStepDetailId]}
                                />
                                {state.loadingComponentIds[state.currentEditItem.isNew ? (state.currentEditItem.tempId as number) : state.currentEditItem.TestStepDetailId] && (
                                    <p className="mt-1 text-sm text-gray-500">Loading components...</p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={state.currentEditItem.Description}
                                    onChange={(e) => handleModalFieldChange("Description", e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071E9]"
                                    placeholder="Auto-populated from component selection"
                                />
                            </div>
                        </div>

                        {/* Expected Result - Full Width with More Height */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expected Result
                            </label>
                            <textarea
                                value={state.currentEditItem.ExpectedResult}
                                onChange={(e) => handleModalFieldChange("ExpectedResult", e.target.value)}
                                rows={5}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071E9]"
                                placeholder="Enter expected result"
                            />
                        </div>

                        {/* Data (JSON) - Full Width */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Data (JSON)
                            </label>
                            <textarea
                                value={state.currentEditItem.Data}
                                onChange={(e) => handleModalFieldChange("Data", e.target.value)}
                                rows={4}
                                className={`w-full px-3 py-2 border ${state.modalErrors.Data ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071E9] font-mono text-sm`}
                                placeholder='{"key": "value"}'
                            />
                            {state.modalErrors.Data && (
                                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                    <CircleAlert size={14} />
                                    {state.modalErrors.Data}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </CustomModal>

            {/* API Details Modal */}
            <CustomModal
                isOpen={state.isApiDetailsModalOpen}
                onClose={handleCloseApiDetailsModal}
                title="API Details"
                width="max-w-4xl"
                footerContent={
                    <button
                        onClick={handleCloseApiDetailsModal}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Close
                    </button>
                }
            >
                {state.currentApiDetails && (
                    <div className="space-y-4">
                        {/* Service Information */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">API ID</label>
                                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                    {state.currentApiDetails.ApiId || "-"}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                    {state.currentApiDetails.ServiceName || "-"}
                                </div>
                            </div>
                        </div>

                        {/* API Type and Version */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">API Type</label>
                                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                                        state.currentApiDetails.ApiType === 'ODATA' ? 'bg-blue-100 text-blue-800' :
                                        state.currentApiDetails.ApiType === 'RFC' ? 'bg-purple-100 text-purple-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {state.currentApiDetails.ApiType || "-"}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                    {state.currentApiDetails.Version || "-"}
                                </div>
                            </div>
                        </div>

                        {/* Method and Endpoint */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">API Method</label>
                                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                                        state.currentApiDetails.ApiMethod === 'GET' ? 'bg-green-100 text-green-800' :
                                        state.currentApiDetails.ApiMethod === 'POST' ? 'bg-blue-100 text-blue-800' :
                                        state.currentApiDetails.ApiMethod === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                                        state.currentApiDetails.ApiMethod === 'PATCH' ? 'bg-purple-100 text-purple-800' :
                                        state.currentApiDetails.ApiMethod === 'DELETE' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {state.currentApiDetails.ApiMethod || "-"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Endpoint */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint</label>
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm break-all">
                                {state.currentApiDetails.EndPoint || "-"}
                            </div>
                        </div>

                        {/* Validation Information */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Validation Key</label>
                                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                    {state.currentApiDetails.ValidationKey || "-"}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Validation Path</label>
                                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm break-all">
                                    {state.currentApiDetails.ValidationPath || "-"}
                                </div>
                            </div>
                        </div>

                        {/* Flags */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Use Padding</label>
                                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                                        state.currentApiDetails.UsePadding ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {state.currentApiDetails.UsePadding ? 'Yes' : 'No'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Is Final Step</label>
                                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                                        state.currentApiDetails.IsFinalStep ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {state.currentApiDetails.IsFinalStep ? 'Yes' : 'No'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Headers */}
                        {state.currentApiDetails.Headers && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Headers</label>
                                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                    <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                                        {JSON.stringify(state.currentApiDetails.Headers, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}

                        {/* Request Schema */}
                        {state.currentApiDetails.RequestSchema && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Request Schema</label>
                                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                                    <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                                        {JSON.stringify(state.currentApiDetails.RequestSchema, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}

                        {/* Response Data */}
                        {state.currentApiDetails.ResponseData && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Response Data</label>
                                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                                    <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                                        {JSON.stringify(state.currentApiDetails.ResponseData, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {state.currentApiDetails.ApiNotes && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                    {state.currentApiDetails.ApiNotes}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CustomModal>

            {/* Sequential Update Confirmation Modal */}
            <CustomModal
                isOpen={state.showSequentialUpdateConfirm}
                onClose={handleSequentialUpdateCancel}
                title="Update Step Numbers?"
                width="max-w-md"
                footerContent={
                    <>
                        <button
                            onClick={() => handleSequentialUpdateConfirm(false)}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            No, Keep As Is
                        </button>
                        <button
                            onClick={() => handleSequentialUpdateConfirm(true)}
                            className="px-4 py-2 bg-[#0071E9] text-white rounded-lg hover:bg-[#005ABA] transition-colors"
                        >
                            Yes, Update Sequential
                        </button>
                    </>
                }
            >
                <div className="py-2">
                    <p className="text-gray-700 mb-3">
                        Step <span className="font-semibold">{state.itemToDelete?.StepNo}</span> will be deleted.
                    </p>
                    <p className="text-gray-600">
                        Do you want to update the remaining step numbers sequentially?
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        If you choose "Yes", all steps after this will be decremented by 1.
                    </p>
                </div>
            </CustomModal>

            {/* Sequence Refresh Confirmation Modal */}
            <CustomModal
                isOpen={state.showSequenceRefreshConfirm}
                onClose={handleSequenceRefreshCancel}
                title="Refresh Step Sequence?"
                width="max-w-md"
                footerContent={
                    <>
                        <button
                            onClick={handleSequenceRefreshCancel}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSequenceRefreshConfirm}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh Step No(s)
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Info className="text-blue-600" size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-700 font-medium mb-2">
                                This will reorder all step numbers sequentially.
                            </p>
                            <p className="text-sm text-gray-600 mb-2">
                                Current steps will be renumbered as 1, 2, 3, 4... based on their current order.
                            </p>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                                <p className="text-sm text-yellow-800">
                                    <strong>Note:</strong> This will fix any gaps or duplicates in step numbers.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </CustomModal>

        </div>
    );
}