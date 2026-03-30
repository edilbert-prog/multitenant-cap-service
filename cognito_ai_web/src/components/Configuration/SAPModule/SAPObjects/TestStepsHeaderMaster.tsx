import React, { useEffect, useReducer, useRef, useState } from 'react';
import CustomTable from "../../../../utils/CustomTable.js";
import {
    ChevronLeft,
    CircleAlert,
    Plus,
    Save,
    Trash2,
    X,
    SquarePen,
    Home,
    RefreshCcw,
    ChevronDown,
    Copy,
    Eye,
    Check
} from "lucide-react";
import { apiRequest } from "../../../../utils/helpers/ApiHelper.js";
import SpinnerV2 from "../../../../utils/SpinnerV2.js";
import ErrorScreen from "../../../../utils/ErrorScreen.js";
import Pagination from "../../../../utils/Pagination.js";
import Toast from "../../../../utils/Toast.js";
import ConfirmPopup from "../../../../utils/ConfirmPopup.js";
import TestStepsDetailsMaster from "./TestStepsDetailsMaster.jsx";
import useDebounce from '../../../../utils/helpers/useDebounce.js';
import SearchBar from "../../../../utils/SearchBar.js";
import Dropdown from "../../../../utils/Dropdown.js";
import Breadcrumb from "../../../../utils/Breadcrumb.js";
import CustomModal from "../../../../utils/CustomModal.js";

type IdKey = string | number;

interface SelectOption {
    value: string;
    label: string;
}

interface FilterObj {
    TestLevel: string;
    result: string;
    Module: string;
    SubModule: string;
}

interface BreadCrumbItem {
    id: string;
    label: string;
    icon: React.ReactNode | string;
    show: boolean;
}

interface TestStepsHeaderRow {
    TestStepsId: string;
    ObjectId: string;
    TestLevel: string;
    ExecutionComponentId: string;
    Description: string;
    result: string;
    Module: string;
    SubModule: string;
    Status: number;
    isNew?: boolean;
    tempId?: number;
}

interface GlobalTestStep {
    TestStepsId: string;
    TestLevel: string;
    Description: string;
    Module: string;
    SubModule: string;
    TotalSteps: number;
    StepDetails: StepDetail[];
    StepsDetailsSummary?: string;
    StepsDetailsLabel?: string;
}

interface StepDetail {
    StepNo: number;
    Description: string;
    ExpectedResult: string;
    ComponentType: string;
    ComponentTypeName?: string;
    Component: string;
}

type RowError = Record<string, string>;

interface State {
    Error: string;
    TestStepsHeader: TestStepsHeaderRow[];
    ApplicationsList: unknown[];
    TestLevelList: SelectOption[];
    ResultList: SelectOption[];
    SAPModuleList: SelectOption[];
    SAPSubModuleList: SelectOption[];
    rowSubModuleLists: Record<IdKey, SelectOption[]>;
    BreadCrumbData: BreadCrumbItem[];
    ViewAppDetails: boolean;
    SearchQuery: string;
    CurrAddEditDetails: TestStepsHeaderRow | Record<string, never>;
    ActiveBCItem: string;
    CurrentPage: number;
    TotalRecords: number;
    IsLoading: boolean;
    showToast: boolean;
    toastMessage: string;
    toastType: string;
    SavingLoader: boolean;
    FilterObj: FilterObj;
    editingRows: Record<IdKey, boolean>;
    newRows: TestStepsHeaderRow[];
    rowErrors: Record<IdKey, RowError | undefined>;
    // Global Mapping States
    showMapModal: boolean;
    showAddDropdown: boolean;
    globalTestSteps: GlobalTestStep[];
    selectedGlobalSteps: string[];
    globalFilterModule: string;
    globalFilterSubModule: string;
    globalSubModuleList: SelectOption[];
    isLoadingGlobal: boolean;
    showStepDetailsModal: boolean;
    currentStepDetails: StepDetail[];
    currentStepHeader: string;
    isCopying: boolean;
}

type Action = Partial<State>;

type Props = {
    CurrAddEditDetails: any
    Details: any
};

const reducer: (state: State, newState: Action) => State = (state, newState) => ({ ...state, ...newState });

const initialState: State = {
    Error: "",
    TestStepsHeader: [],
    ApplicationsList: [],
    TestLevelList: [
        { value: "Unit", label: "Unit" },
        { value: "Integration", label: "Integration" },
        { value: "System", label: "System" },
        { value: "User Acceptance", label: "User Acceptance" }
    ],
    ResultList: [
        { value: "none", label: "None" },
        { value: "pass", label: "Pass" },
        { value: "fail", label: "Fail" }
    ],
    SAPModuleList: [],
    SAPSubModuleList: [],
    rowSubModuleLists: {},
    BreadCrumbData: [
        { id: "TestSteps", label: "Test Steps", icon: <Home size={16} />, show: true },
        { id: "Details", label: "Details", icon: "", show: false },
    ],
    ViewAppDetails: false,
    SearchQuery: "",
    CurrAddEditDetails: {},
    ActiveBCItem: "TestSteps",
    CurrentPage: 1,
    TotalRecords: 0,
    IsLoading: true,
    showToast: false,
    toastMessage: "",
    toastType: "success",
    SavingLoader: false,
    FilterObj: {
        TestLevel: "",
        result: "",
        Module: "",
        SubModule: ""
    },
    editingRows: {},
    newRows: [],
    rowErrors: {},
    // Global Mapping States
    showMapModal: false,
    showAddDropdown: false,
    globalTestSteps: [],
    selectedGlobalSteps: [],
    globalFilterModule: "",
    globalFilterSubModule: "",
    globalSubModuleList: [],
    isLoadingGlobal: false,
    showStepDetailsModal: false,
    currentStepDetails: [],
    currentStepHeader: "",
    isCopying: false,
};

type TableColumn = { title: string; key: string; className?: string };
type TableRow = Record<string, React.ReactNode>;

export default function TestStepsHeaderMaster(props: Props) {
    const [state, setState] = useReducer(reducer, initialState);
    const addButtonRef = useRef<HTMLDivElement>(null);

    const didFetchData = useRef<boolean>(false);
    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;

        const init = async () => {
            setState({ IsLoading: true });
            await getApplicationsList();
            await GetSAPModulesMaster();
            await getData("");
            setState({ IsLoading: false });
        };

        void init();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (addButtonRef.current && !addButtonRef.current.contains(event.target as Node)) {
                setState({ showAddDropdown: false });
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getApplicationsList = async () => {
        try {
            const resp: any = await apiRequest("/GetApplicationsMaster", {});
            if (resp.ResponseData && resp.ResponseData.length > 0) {
                setState({ ApplicationsList: resp.ResponseData });
            }
        } catch (err) {
            console.error("Error fetching applications:", err);
        }
    };

    const GetSAPModulesMaster = async () => {
        try {
            const resp: any = await apiRequest("/GetSAPModulesMaster", {});
            setState({
                SAPModuleList: resp.ResponseData || [],
            });
        } catch (err) {
            console.error("Error loading SAP Modules:", err);
        }
    };

    const GetSAPSubModulesMasterByModule = async (Module: string = "") => {
        try {
            const resp: any = await apiRequest("/GetSAPSubModulesMasterByModule", { Module });
            setState({
                SAPSubModuleList: resp.ResponseData || [],
            });
        } catch (err) {
            console.error("Error loading SAP SubModules:", err);
        }
    };

    const GetSAPSubModulesMasterByModuleForRow = async (Module: string = "", rowId: IdKey) => {
        try {
            const resp: any = await apiRequest("/GetSAPSubModulesMasterByModule", { Module });
            setState({
                rowSubModuleLists: {
                    ...state.rowSubModuleLists,
                    [rowId]: resp.ResponseData || []
                }
            });
        } catch (err) {
            console.error("Error loading SubModules for row:", err);
        }
    };

    const GetGlobalSubModulesByModule = async (Module: string = "") => {
        try {
            const resp: any = await apiRequest("/GetSAPSubModulesMasterByModule", { Module });
            setState({
                globalSubModuleList: resp.ResponseData || [],
            });
        } catch (err) {
            console.error("Error loading Global SubModules:", err);
        }
    };

    const getData = async (
        SearchQuery: string = "",
        PageNo: number = 1,
        FilterObj: FilterObj = { TestLevel: "", result: "", Module: "", SubModule: "" }
    ) => {
        try {
            const resp: any = await apiRequest("/GetTestStepsHeaderPaginationFilterSearch", {
                "PageNo": PageNo,
                "StartDate": "",
                "EndDate": "",
                "ObjectId": props.CurrAddEditDetails.ObjectId,
                "TestLevel": FilterObj.TestLevel,
                "result": FilterObj.result,
                "Module": FilterObj.Module,
                "SubModule": FilterObj.SubModule,
                "SearchString": SearchQuery
            });

            if (resp.ResponseData.length > 0) {
                setState({ TestStepsHeader: resp.ResponseData as TestStepsHeaderRow[], TotalRecords: resp.TotalRecords as number });
            } else {
                setState({ TestStepsHeader: [], TotalRecords: 0 });
            }

            if (props.Details) {
                setState({ ActiveBCItem: "Steps" })
            }
        } catch (err) {
            setState({ Error: (err as Error).toString() });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const getGlobalTestSteps = async () => {
        if (!state.globalFilterModule) {
            setState({ 
                showToast: true, 
                toastMessage: "Please select a Module first", 
                toastType: "error" 
            });
            setTimeout(() => setState({ showToast: false }), 3000);
            return;
        }

        setState({ isLoadingGlobal: true });

        try {
            const resp: any = await apiRequest("/GetTestStepsHeaderGlobalPaginationFilterSearch", {
                PageNo: 1,
                StartDate: "",
                EndDate: "",
                Module: state.globalFilterModule,
                SubModule: state.globalFilterSubModule,
                SearchString: ""
            });

            if (resp.ResponseData && resp.ResponseData.length > 0) {
                // Get IDs to fetch with details
                const testStepsIds = resp.ResponseData.map((item: any) => item.TestStepsId);

                // Fetch with details
                const detailsResp: any = await apiRequest("/GetTestStepsHeaderGlobalByIdsWithDetails", {
                    testStepsIds: testStepsIds
                });

                if (detailsResp.status === 'success' && detailsResp.data) {
                    setState({ 
                        globalTestSteps: detailsResp.data as GlobalTestStep[],
                        isLoadingGlobal: false
                    });
                } else {
                    setState({ 
                        globalTestSteps: [],
                        isLoadingGlobal: false
                    });
                }
            } else {
                setState({ 
                    globalTestSteps: [],
                    isLoadingGlobal: false,
                    showToast: true,
                    toastMessage: "No global test steps found for selected filters",
                    toastType: "error"
                });
                setTimeout(() => setState({ showToast: false }), 3000);
            }
        } catch (err) {
            console.error("Error fetching global test steps:", err);
            setState({ 
                isLoadingGlobal: false,
                Error: (err as Error).toString()
            });
        }
    };

    const handleAddNew = () => {
        setState({ showAddDropdown: false });
        const newRow: TestStepsHeaderRow = {
            "TestStepsId": "",
            "ObjectId": props.CurrAddEditDetails.ObjectId || "",
            "TestLevel": "",
            "ExecutionComponentId": "",
            "Description": "",
            "result": "none",
            "Module": "",
            "SubModule": "",
            "Status": 1,
            "isNew": true,
            "tempId": Date.now()
        };
        setState({
            newRows: [...state.newRows, newRow],
            editingRows: {
                ...state.editingRows,
                [newRow.tempId as number]: true
            },
            rowErrors: {
                ...state.rowErrors,
                [newRow.tempId as number]: {}
            }
        });
    };

    const handleMapExisting = () => {
        setState({ 
            showMapModal: true,
            showAddDropdown: false,
            globalFilterModule: "",
            globalFilterSubModule: "",
            globalTestSteps: [],
            selectedGlobalSteps: []
        });
    };

    const handleCloseMapModal = () => {
        setState({ 
            showMapModal: false,
            globalFilterModule: "",
            globalFilterSubModule: "",
            globalTestSteps: [],
            selectedGlobalSteps: [],
            globalSubModuleList: []
        });
    };

    const handleGlobalModuleChange = async (val: string) => {
        setState({ 
            globalFilterModule: val,
            globalFilterSubModule: "",
            globalTestSteps: [],
            selectedGlobalSteps: [],
            isLoadingGlobal: val ? true : false // Show loading if module selected
        });
        
        if (val) {
            // Load sub modules
            await GetGlobalSubModulesByModule(val);
            
            // Automatically load test steps for the selected module
            await loadGlobalTestStepsData(val, "");
        } else {
            setState({ 
                globalSubModuleList: [],
                isLoadingGlobal: false
            });
        }
    };

    const handleGlobalSubModuleChange = async (val: string) => {
        setState({ 
            globalFilterSubModule: val,
            globalTestSteps: [],
            selectedGlobalSteps: [],
            isLoadingGlobal: true
        });
        
        // Automatically load test steps with the selected submodule filter
        await loadGlobalTestStepsData(state.globalFilterModule, val);
    };

    // New helper function for loading data
    const loadGlobalTestStepsData = async (module: string, subModule: string = "") => {
        if (!module) {
            setState({ isLoadingGlobal: false });
            return;
        }

        try {
            const resp: any = await apiRequest("/GetTestStepsHeaderGlobalPaginationFilterSearch", {
                PageNo: 1,
                StartDate: "",
                EndDate: "",
                Module: module,
                SubModule: subModule,
                SearchString: ""
            });

            if (resp.ResponseData && resp.ResponseData.length > 0) {
                // Get IDs to fetch with details
                const testStepsIds = resp.ResponseData.map((item: any) => item.TestStepsId);

                // Fetch with details
                const detailsResp: any = await apiRequest("/GetTestStepsHeaderGlobalByIdsWithDetails", {
                    testStepsIds: testStepsIds
                });

                if (detailsResp.status === 'success' && detailsResp.data) {
                    setState({ 
                        globalTestSteps: detailsResp.data as GlobalTestStep[],
                        isLoadingGlobal: false
                    });
                } else {
                    setState({ 
                        globalTestSteps: [],
                        isLoadingGlobal: false
                    });
                }
            } else {
                setState({ 
                    globalTestSteps: [],
                    isLoadingGlobal: false
                });
            }
        } catch (err) {
            console.error("Error fetching global test steps:", err);
            setState({ 
                isLoadingGlobal: false,
                globalTestSteps: []
            });
        }
    };

    const handleSelectGlobalStep = (testStepsId: string) => {
        const isSelected = state.selectedGlobalSteps.includes(testStepsId);
        if (isSelected) {
            setState({
                selectedGlobalSteps: state.selectedGlobalSteps.filter(id => id !== testStepsId)
            });
        } else {
            setState({
                selectedGlobalSteps: [...state.selectedGlobalSteps, testStepsId]
            });
        }
    };

    const handleSelectAllGlobalSteps = () => {
        if (state.selectedGlobalSteps.length === state.globalTestSteps.length) {
            // Deselect all
            setState({ selectedGlobalSteps: [] });
        } else {
            // Select all
            setState({
                selectedGlobalSteps: state.globalTestSteps.map(step => step.TestStepsId)
            });
        }
    };

    const handleViewStepDetails = (stepDetails: StepDetail[], header: string) => {
        setState({
            showStepDetailsModal: true,
            currentStepDetails: stepDetails,
            currentStepHeader: header
        });
    };

    const handleCloseStepDetailsModal = () => {
        setState({
            showStepDetailsModal: false,
            currentStepDetails: [],
            currentStepHeader: ""
        });
    };

    const handleCopyGlobalSteps = async () => {
        if (state.selectedGlobalSteps.length === 0) {
            setState({
                showToast: true,
                toastMessage: "Please select at least one test step to copy",
                toastType: "error"
            });
            setTimeout(() => setState({ showToast: false }), 3000);
            return;
        }

        setState({ isCopying: true });

        try {
            const resp: any = await apiRequest("/CopyGlobalTestStepsToObject", {
                globalTestStepsIds: state.selectedGlobalSteps,
                ObjectId: props.CurrAddEditDetails.ObjectId,
                CreatedBy: "CurrentUser" // Replace with actual logged-in user
            });

            if (resp.status === 'success') {
                const summary = resp.summary;
                setState({
                    isCopying: false,
                    showMapModal: false,
                    showToast: true,
                    toastMessage: `Successfully copied ${summary.copied} test steps! (Skipped: ${summary.skipped}, Errors: ${summary.errors})`,
                    toastType: "success",
                    selectedGlobalSteps: [],
                    globalTestSteps: [],
                    globalFilterModule: "",
                    globalFilterSubModule: ""
                });

                // Refresh the main table
                await getData("", state.CurrentPage, state.FilterObj);

                setTimeout(() => setState({ showToast: false }), 5000);
            } else {
                setState({
                    isCopying: false,
                    showToast: true,
                    toastMessage: `Error: ${resp.error}`,
                    toastType: "error"
                });
                setTimeout(() => setState({ showToast: false }), 3000);
            }
        } catch (error) {
            console.error("Error copying global steps:", error);
            setState({
                isCopying: false,
                showToast: true,
                toastMessage: `Error: ${error}`,
                toastType: "error"
            });
            setTimeout(() => setState({ showToast: false }), 3000);
        }
    };

    const handleEdit = async (item: TestStepsHeaderRow) => {
        const rowId: IdKey = item.isNew ? (item.tempId as number) : item.TestStepsId;
        
        setState({
            editingRows: {
                ...state.editingRows,
                [rowId]: true
            },
            rowErrors: {
                ...state.rowErrors,
                [rowId]: {}
            }
        });

        if (item.Module) {
            await GetSAPSubModulesMasterByModuleForRow(item.Module, rowId);
        }
    };

    const debouncedSearchQuery = useDebounce<string>(state.SearchQuery, 300);
    const didSearchRun = useRef<boolean>(false);

    useEffect(() => {
        if (!didSearchRun.current) {
            didSearchRun.current = true;
            return;
        }

        if (debouncedSearchQuery.trim() === "") return;
        void getData(debouncedSearchQuery);
    }, [debouncedSearchQuery]);

    const handleCancelAll = () => {
        setState({
            editingRows: {},
            newRows: [],
            rowErrors: {},
            rowSubModuleLists: {}
        });
    };

    const originalBreadcrumbRef = useRef<Array<Pick<BreadCrumbItem, "id" | "label">>>([]);
    useEffect(() => {
        if (originalBreadcrumbRef.current.length === 0) {
            originalBreadcrumbRef.current = state.BreadCrumbData.map(item => ({
                id: item.id,
                label: item.label,
            }));
        }
    }, [state.BreadCrumbData]);

    const handleBreadcrumbClick = (currentId: string, dynamicLabel: string | null = null) => {
        const currentIndex = state.BreadCrumbData.findIndex(item => item.id === currentId);
        if (currentIndex === -1) return;

        const updatedBreadcrumb: BreadCrumbItem[] = state.BreadCrumbData.map((item, idx) => {
            const isPrev = idx === currentIndex - 1;
            const isAfter = idx > currentIndex;
            const isCurrent = idx === currentIndex;
            const isCurrentOrBefore = idx <= currentIndex;

            return {
                ...item,
                show: isCurrentOrBefore,
                label:
                    isPrev && dynamicLabel
                        ? dynamicLabel
                        : isAfter
                            ? originalBreadcrumbRef.current[idx]?.label || item.label
                            : isCurrent
                                ? originalBreadcrumbRef.current[idx]?.label || item.label
                                : item.label,
            };
        });
        setState({
            ActiveBCItem: currentId,
            BreadCrumbData: updatedBreadcrumb,
        });
    };

    const validateAllRows = () => {
        const requiredFields: Array<keyof Pick<TestStepsHeaderRow, "TestLevel">> = ["TestLevel"];
        const newRowErrors: Record<IdKey, RowError> = {};
        let allValid = true;

        state.newRows.forEach(row => {
            const rowId = row.tempId as number;
            newRowErrors[rowId] = {};

            requiredFields.forEach(field => {
                if (!row[field]) {
                    newRowErrors[rowId][field] = "This field is required";
                    allValid = false;
                }
            });
        });

        Object.keys(state.editingRows).forEach(idKey => {
            const id = idKey as string;
            if (typeof id === 'string') {
                const row = state.TestStepsHeader.find(t => t.TestStepsId === id);
                if (row) {
                    newRowErrors[id] = {};
                    requiredFields.forEach(field => {
                        if (!row[field]) {
                            newRowErrors[id][field] = "This field is required";
                            allValid = false;
                        }
                    });
                }
            }
        });

        setState({ rowErrors: newRowErrors });
        return allValid;
    };

    const handleSaveAll = async () => {
        if (!validateAllRows()) return;

        setState({ SavingLoader: true });

        try {
            const editedRows = Object.keys(state.editingRows)
                .filter(id => typeof id === 'string')
                .map(id => {
                    return state.TestStepsHeader.find(row => row.TestStepsId === id);
                })
                .filter(Boolean) as TestStepsHeaderRow[];

            const rowsToSend: TestStepsHeaderRow[] = [...editedRows, ...state.newRows];

            if (rowsToSend.length > 0) {
                for (const row of rowsToSend) {
                    await apiRequest("/AddUpdateTestStepsHeader", row as any);
                }
            }

            setState({
                SavingLoader: false,
                showToast: true,
                toastMessage: "Saved successfully!",
                toastType: "success",
                editingRows: {},
                newRows: [],
                rowErrors: {},
                rowSubModuleLists: {}
            });

            await getData("", state.CurrentPage, state.FilterObj);
            setTimeout(() => setState({ showToast: false }), 3000);

        } catch (error) {
            setState({ 
                SavingLoader: false, 
                Error: (error as Error).toString(),
                showToast: true,
                toastMessage: "Failed to save!",
                toastType: "error"
            });
            setTimeout(() => setState({ showToast: false }), 3000);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>, name: keyof TestStepsHeaderRow, item: TestStepsHeaderRow) => {
        if (item.isNew) {
            const updatedNewRows = state.newRows.map(row => {
                if (row.tempId === item.tempId) {
                    return { ...row, [name]: e.target.value } as TestStepsHeaderRow;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedSteps = state.TestStepsHeader.map(t => {
                if (t.TestStepsId === item.TestStepsId) {
                    return { ...t, [name]: e.target.value } as TestStepsHeaderRow;
                }
                return t;
            });
            setState({ TestStepsHeader: updatedSteps });
        }
    };

    const handleDropdownChange = (
        val: string,
        _options: unknown,
        name: keyof TestStepsHeaderRow,
        item: TestStepsHeaderRow
    ) => {
        const rowId: IdKey = item.isNew ? (item.tempId as number) : item.TestStepsId;

        if (item.isNew) {
            const updatedNewRows = state.newRows.map(row => {
                if (row.tempId === item.tempId) {
                    const updatedRow = { ...row, [name]: val } as TestStepsHeaderRow;
                    
                    if (name === 'Module') {
                        updatedRow.SubModule = '';
                        if (val) {
                            GetSAPSubModulesMasterByModuleForRow(val, rowId);
                        }
                    }
                    
                    return updatedRow;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedSteps = state.TestStepsHeader.map(t => {
                if (t.TestStepsId === item.TestStepsId) {
                    const updatedStep = { ...t, [name]: val } as TestStepsHeaderRow;
                    
                    if (name === 'Module') {
                        updatedStep.SubModule = '';
                        if (val) {
                            GetSAPSubModulesMasterByModuleForRow(val, rowId);
                        }
                    }
                    
                    return updatedStep;
                }
                return t;
            });
            setState({ TestStepsHeader: updatedSteps });
        }
    };

    const handlePageChange = (page: number) => {
        setState({ CurrentPage: page });
        void getData(state.SearchQuery, page, state.FilterObj);
    };

    const handleDeleteItem = async (item: TestStepsHeaderRow) => {
        if (item.TestStepsId) {
            const resp: any = await apiRequest("/DeleteTestStepsHeader", item as any);
            if (resp) {
                setState({ 
                    showToast: true,
                    toastMessage: "Deleted successfully!",
                    toastType: "success"
                });
                void getData(state.SearchQuery, state.CurrentPage, state.FilterObj);
                setTimeout(() => {
                    setState({ showToast: false });
                }, 3000);
            }
        } else {
            const rowId = item.tempId as number;
            setState({
                newRows: state.newRows.filter(row => row.tempId !== item.tempId),
                editingRows: {
                    ...state.editingRows,
                    [rowId]: false
                },
                rowErrors: {
                    ...state.rowErrors,
                    [rowId]: undefined
                },
                rowSubModuleLists: {
                    ...state.rowSubModuleLists,
                    [rowId]: undefined as any
                }
            });
        }
    };

    const handleViewDetails = (item: TestStepsHeaderRow) => {
        setState({ ViewAppDetails: true, CurrAddEditDetails: item });
        handleBreadcrumbClick("Details", `Test Step: ${item.TestStepsId}`);
    };

    const handleSearch = (value: string) => {
        setState({ SearchQuery: value });
        if (value.trim() === "") {
            void getData("", 1, state.FilterObj);
        }
    };

    const handleDropdownFilter = (val: string, _options: unknown, name: keyof FilterObj) => {
        const FilterObj = { ...state.FilterObj };
        FilterObj[name] = val;
        
        if (name === "Module") {
            FilterObj["SubModule"] = "";
            setState({ FilterObj });
            GetSAPSubModulesMasterByModule(val);
        } else {
            setState({ FilterObj });
        }
        
        void getData(state.SearchQuery, state.CurrentPage, FilterObj);
    };

    const columns: TableColumn[] = [
        ...(state.FilterObj.Module ? [] : [{ title: 'Module', key: 'Module' }]),
        ...(state.FilterObj.SubModule ? [] : [{ title: 'Sub Module', key: 'SubModule' }]),
        { title: 'Test Level', key: 'TestLevel' },
        { title: 'Description', key: 'Description', className: 'min-w-[300px]' },
    ];

    const allRows: TestStepsHeaderRow[] = [...state.newRows, ...state.TestStepsHeader];

    const data: TableRow[] = allRows.map((item) => {
        const rowId: IdKey = item.isNew ? (item.tempId as number) : item.TestStepsId;
        const isEditing = !!state.editingRows[rowId];
        const errors: RowError = state.rowErrors[rowId] || {};

        if (isEditing) {
            return {
                ...(state.FilterObj.Module ? {} : {
                    Module: (
                        <div>
                            <Dropdown
                                size="small"
                                mode="single"
                                options={state.SAPModuleList}
                                value={item.Module}
                                onChange={(val: string, option: unknown) => handleDropdownChange(val, option, "Module", item)}
                                placeholder="Select Module"
                            />
                            {errors.Module && (
                                <div className="flex items-center mt-1 ml-2">
                                    <CircleAlert size={14} className="text-red-500" />
                                    <p className="ml-2 text-red-500 text-sm">{errors.Module}</p>
                                </div>
                            )}
                        </div>
                    )
                }),
                ...(state.FilterObj.SubModule ? {} : {
                    SubModule: (
                        <div>
                            <Dropdown
                                size="small"
                                mode="single"
                                options={state.rowSubModuleLists[rowId] || []}
                                value={item.SubModule}
                                onChange={(val: string, option: unknown) => handleDropdownChange(val, option, "SubModule", item)}
                                placeholder="Select Sub Module"
                                disabled={!item.Module}
                            />
                        </div>
                    )
                }),
                TestLevel: (
                    <div>
                        <Dropdown
                            size="small"
                            mode="single"
                            options={state.TestLevelList}
                            value={item.TestLevel}
                            onChange={(val: string, option: unknown) => handleDropdownChange(val, option, "TestLevel", item)}
                            className={errors.TestLevel ? 'border-red-500' : ''}
                            placeholder="Select Test Level"
                        />
                        {errors.TestLevel && (
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.TestLevel}</p>
                            </div>
                        )}
                    </div>
                ),
                Description: (
                    <div>
                        <textarea
                            defaultValue={item.Description || ''}
                            onBlur={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                if (item.Description !== e.target.value) {
                                    handleChange(e, "Description", item);
                                }
                            }}
                            rows={2}
                            className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Description"
                        />
                    </div>
                ),
                actions: (
                    <div className="relative flex items-center">
                        <ConfirmPopup
                            message="Are you sure you want to delete this item?"
                            onConfirm={() => void handleDeleteItem(item)}
                        >
                            <button className="pr-4 flex items-center">
                                <Trash2 className="text-[#1A1A1A] cursor-pointer" />
                            </button>
                        </ConfirmPopup>
                    </div>
                ),
            } satisfies TableRow;
        }

        return {
            ...(state.FilterObj.Module ? {} : { Module: item.Module || '-' }),
            ...(state.FilterObj.SubModule ? {} : { SubModule: item.SubModule || '-' }),
            TestLevel: item.TestLevel,
            Description: item.Description,
            actions: (
                <div className="relative flex items-center">
                    <button
                        onClick={() => handleViewDetails(item)}
                        className="bg-[#0071E9] cursor-pointer text-gray-50 px-3 py-1 rounded text-sm"
                    >
                         Steps
                    </button>
                    <button
                        onClick={() => handleEdit(item)}
                        className="ml-2 text-white px-3 py-1 rounded text-sm"
                    >
                        <SquarePen className="text-[#1A1A1A] cursor-pointer" />
                    </button>
                    <ConfirmPopup
                        message="Are you sure you want to delete this item?"
                        onConfirm={() => void handleDeleteItem(item)}
                    >
                        <button className="ml-2 pr-4 flex items-center">
                            <Trash2 className="text-[#1A1A1A] cursor-pointer" />
                        </button>
                    </ConfirmPopup>
                </div>
            ),
        } satisfies TableRow;
    });

    const hasEdits = Object.keys(state.editingRows).length > 0 || state.newRows.length > 0;

    if (state.IsLoading) return <div className="h-96 py-20"><SpinnerV2 {...{ text: "Fetching data..." }} /></div>;
    if (state.Error) return <ErrorScreen message={state.Error} />;

    return (
        <div className="pt-0 pb-20 ">
            <div className="pb-2.5 px-3.5">
                <Breadcrumb
                    data={state.BreadCrumbData}
                    activeItem={state.ActiveBCItem}
                    onItemClick={handleBreadcrumbClick}
                />
            </div>

            {state.ActiveBCItem === "Details" ? (
                <div>
                    <TestStepsDetailsMaster
                        Details={props.Details ? props.Details : ""}
                        handleBreadcrumbClick={handleBreadcrumbClick}
                        ActiveBCItem={state.ActiveBCItem}
                        CurrAddEditDetails={state.CurrAddEditDetails}
                    />
                </div>
            ) : (
                <>
                    <Toast
                        message={state.toastMessage}
                        show={state.showToast}
                        type={state.toastType as 'success' | 'error' | 'warning'}
                        onClose={() => setState({ showToast: false })}
                    />

                    <div className="flex justify-between items-center pb-4">
                        <div className="w-1/3">
                            <SearchBar currentValue={state.SearchQuery} onSearch={handleSearch} size="medium" />
                        </div>

                        {!hasEdits &&
                            <div className="flex w-full items-center gap-5 ml-10">
                                <div className="w-[20%]">
                                    <p className="text-[0.80rem] font-semibold">Module</p>
                                    <Dropdown
                                        size="small"
                                        mode="single"
                                        options={state.SAPModuleList}
                                        value={state.FilterObj.Module}
                                        onChange={(val: string, item: unknown) => handleDropdownFilter(val, item, "Module")}
                                        placeholder="All Modules"
                                    />
                                </div>
                                <div className="w-[20%]">
                                    <p className="text-[0.80rem] font-semibold">Sub Module</p>
                                    <Dropdown
                                        size="small"
                                        mode="single"
                                        options={state.SAPSubModuleList}
                                        value={state.FilterObj.SubModule}
                                        onChange={(val: string, item: unknown) => handleDropdownFilter(val, item, "SubModule")}
                                        placeholder="All Sub Modules"
                                        disabled={!state.FilterObj.Module}
                                    />
                                </div>
                                <div className="w-[20%]">
                                    <p className="text-[0.80rem] font-semibold">Test Level</p>
                                    <Dropdown
                                        size="small"
                                        mode="single"
                                        options={state.TestLevelList}
                                        value={state.FilterObj.TestLevel}
                                        onChange={(val: string, item: unknown) => handleDropdownFilter(val, item, "TestLevel")}
                                        placeholder="All Test Levels"
                                    />
                                </div>
                                <div className="w-[20%]">
                                    <p className="text-[0.80rem] font-semibold">Result</p>
                                    <Dropdown
                                        size="small"
                                        mode="single"
                                        options={state.ResultList}
                                        value={state.FilterObj.result}
                                        onChange={(val: string, item: unknown) => handleDropdownFilter(val, item, "result")}
                                        placeholder="All Results"
                                    />
                                </div>
                            </div>
                        }

                        <div className="flex items-center space-x-2 gap-4">
                            {/* Add Button with Dropdown */}
                            <div className="relative" ref={addButtonRef}>
                                <button
                                    onClick={() => setState({ showAddDropdown: !state.showAddDropdown })}
                                    onMouseEnter={() => setState({ showAddDropdown: true })}
                                    className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>Add</span>
                                    <ChevronDown className="w-4 h-4 ml-1" />
                                </button>

                                {/* Dropdown Menu */}
                                {state.showAddDropdown && (
                                    <div 
                                        className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                                        onMouseLeave={() => setState({ showAddDropdown: false })}
                                    >
                                        <div className="py-1">
                                            <button
                                                onClick={handleAddNew}
                                                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                                            >
                                                <Plus className="w-4 h-4 text-[#0071E9]" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">New</p>
                                                    <p className="text-xs text-gray-500">Create a new test step</p>
                                                </div>
                                            </button>
                                            <div className="border-t border-gray-100"></div>
                                            <button
                                                onClick={handleMapExisting}
                                                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                                            >
                                                <Copy className="w-4 h-4 text-green-600" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">Map Existing</p>
                                                    <p className="text-xs text-gray-500">Copy from global test steps</p>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {hasEdits && (
                                <>
                                    <button
                                        onClick={handleCancelAll}
                                        className="text-red-600 ml-10 px-3 py-2 rounded-lg text-sm flex items-center hover:bg-gray-100 cursor-pointer"
                                    >
                                        <X size={16} className="mr-1" />
                                        Cancel All
                                    </button>
                                    <button
                                        onClick={handleSaveAll}
                                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm flex cursor-pointer items-center"
                                        disabled={state.SavingLoader}
                                    >
                                        {state.SavingLoader ? (
                                            <SpinnerV2 {...{ text: "Saving..." }} />
                                        ) : (
                                            <>
                                                <Save size={16} className="mr-1" />
                                                Save All
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
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
                </>
            )}

            {/* Map Existing Global Test Steps Modal */}
            <CustomModal
                isOpen={state.showMapModal}
                onClose={handleCloseMapModal}
                title="Map Existing Global Test Steps"
                width="max-w-6xl"
                footerContent={
                    <>
                        <button
                            onClick={handleCloseMapModal}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCopyGlobalSteps}
                            disabled={state.selectedGlobalSteps.length === 0 || state.isCopying}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {state.isCopying ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    Copying...
                                </>
                            ) : (
                                <>
                                    <Copy size={16} />
                                    Copy Selected ({state.selectedGlobalSteps.length})
                                </>
                            )}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    {/* Filter Section with Standard UI */}
                    <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
                        <div>
                            <label className="block text-[0.80rem] font-semibold text-gray-700 mb-1.5">
                                Module <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                size="small"
                                mode="single"
                                options={state.SAPModuleList}
                                value={state.globalFilterModule}
                                onChange={(val: string) => handleGlobalModuleChange(val)}
                                placeholder="Select Module"
                            />
                        </div>
                        <div>
                            <label className="block text-[0.80rem] font-semibold text-gray-700 mb-1.5">
                                Sub Module
                            </label>
                            <Dropdown
                                size="small"
                                mode="single"
                                options={state.globalSubModuleList}
                                value={state.globalFilterSubModule}
                                onChange={(val: string) => handleGlobalSubModuleChange(val)}
                                placeholder="All Sub Modules"
                                disabled={!state.globalFilterModule}
                            />
                        </div>
                    </div>

                    {/* Results Section */}
                    {state.isLoadingGlobal ? (
                        <div className="py-20">
                            <SpinnerV2 text="Loading global test steps..." />
                        </div>
                    ) : !state.globalFilterModule ? (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                                <Copy className="w-8 h-8 text-blue-500" />
                            </div>
                            <p className="text-gray-600 text-sm">Please select a Module to view available global test steps</p>
                        </div>
                    ) : state.globalTestSteps.length > 0 ? (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto max-h-[500px]">
                                <table className="w-full">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr className="border-b border-gray-200">
                                            <th className="px-4 py-3 text-left w-12">
                                                <input
                                                    type="checkbox"
                                                    checked={state.selectedGlobalSteps.length === state.globalTestSteps.length && state.globalTestSteps.length > 0}
                                                    onChange={handleSelectAllGlobalSteps}
                                                    className="w-4 h-4 text-[#0071E9] border-gray-300 rounded focus:ring-[#0071E9] cursor-pointer"
                                                />
                                            </th>
                                            <th className="px-4 py-3 text-left text-[0.75rem] font-semibold text-gray-700 uppercase tracking-wider">
                                                Test Steps ID
                                            </th>
                                            <th className="px-4 py-3 text-left text-[0.75rem] font-semibold text-gray-700 uppercase tracking-wider">
                                                Module
                                            </th>
                                            <th className="px-4 py-3 text-left text-[0.75rem] font-semibold text-gray-700 uppercase tracking-wider">
                                                Sub Module
                                            </th>
                                            <th className="px-4 py-3 text-left text-[0.75rem] font-semibold text-gray-700 uppercase tracking-wider">
                                                Test Level
                                            </th>
                                            <th className="px-4 py-3 text-left text-[0.75rem] font-semibold text-gray-700 uppercase tracking-wider">
                                                Description
                                            </th>
                                            <th className="px-4 py-3 text-center text-[0.75rem] font-semibold text-gray-700 uppercase tracking-wider">
                                                Steps
                                            </th>
                                            <th className="px-4 py-3 text-center text-[0.75rem] font-semibold text-gray-700 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {state.globalTestSteps.map((step) => (
                                            <tr 
                                                key={step.TestStepsId}
                                                className={`hover:bg-gray-50 transition-colors ${
                                                    state.selectedGlobalSteps.includes(step.TestStepsId) ? 'bg-blue-50' : ''
                                                }`}
                                            >
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={state.selectedGlobalSteps.includes(step.TestStepsId)}
                                                        onChange={() => handleSelectGlobalStep(step.TestStepsId)}
                                                        className="w-4 h-4 text-[#0071E9] border-gray-300 rounded focus:ring-[#0071E9] cursor-pointer"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-[0.85rem] font-medium text-gray-900">
                                                        {step.TestStepsId}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-[0.85rem] text-gray-600">
                                                    {step.Module || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-[0.85rem] text-gray-600">
                                                    {step.SubModule || '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex px-2.5 py-0.5 text-[0.75rem] font-medium rounded-full bg-blue-100 text-blue-800">
                                                        {step.TestLevel}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-[0.85rem] text-gray-600 max-w-xs">
                                                    <div className="truncate" title={step.Description}>
                                                        {step.Description}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="inline-flex px-2.5 py-0.5 text-[0.75rem] font-medium rounded-full bg-purple-100 text-purple-800">
                                                        {step.TotalSteps}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {step.TotalSteps > 0 ? (
                                                        <button
                                                            onClick={() => handleViewStepDetails(
                                                                step.StepDetails, 
                                                                `${step.TestStepsId} - ${step.Description}`
                                                            )}
                                                            className="inline-flex items-center gap-1.5 text-[0.85rem] text-[#0071E9] hover:text-[#005ABA] font-medium transition-colors"
                                                        >
                                                            <Eye size={14} />
                                                            View
                                                        </button>
                                                    ) : (
                                                        <span className="text-[0.85rem] text-gray-400">No steps</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                <Copy className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-600 text-sm mb-1">No global test steps found</p>
                            <p className="text-gray-500 text-xs">Try selecting a different Module or Sub Module</p>
                        </div>
                    )}
                </div>
            </CustomModal>

            {/* Step Details Modal with Standard UI */}
            <CustomModal
                isOpen={state.showStepDetailsModal}
                onClose={handleCloseStepDetailsModal}
                title={`Step Details - ${state.currentStepHeader}`}
                width="max-w-5xl"
                footerContent={
                    <button
                        onClick={handleCloseStepDetailsModal}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-[0.85rem]"
                    >
                        Close
                    </button>
                }
            >
                {state.currentStepDetails.length > 0 ? (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto max-h-[600px]">
                            <table className="w-full">
                                <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr className="border-b border-gray-200">
                                        <th className="px-4 py-3 text-left text-[0.75rem] font-semibold text-gray-700 uppercase tracking-wider w-20">
                                            Step No
                                        </th>
                                        <th className="px-4 py-3 text-left text-[0.75rem] font-semibold text-gray-700 uppercase tracking-wider">
                                            Description
                                        </th>
                                        <th className="px-4 py-3 text-left text-[0.75rem] font-semibold text-gray-700 uppercase tracking-wider">
                                            Expected Result
                                        </th>
                                        <th className="px-4 py-3 text-left text-[0.75rem] font-semibold text-gray-700 uppercase tracking-wider">
                                            Component Type
                                        </th>
                                        <th className="px-4 py-3 text-left text-[0.75rem] font-semibold text-gray-700 uppercase tracking-wider">
                                            Component
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {state.currentStepDetails.map((step, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-[0.85rem] font-semibold">
                                                    {step.StepNo}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-[0.85rem] text-gray-900">
                                                {step.Description || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-[0.85rem] text-gray-600">
                                                {step.ExpectedResult || '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex px-2.5 py-0.5 text-[0.75rem] font-medium rounded-full bg-green-100 text-green-800">
                                                    {step.ComponentTypeName || step.ComponentType || '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-[0.85rem] text-gray-600">
                                                {step.Component || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-[0.85rem]">No step details available</p>
                    </div>
                )}
            </CustomModal>
            
        </div>
    );
}