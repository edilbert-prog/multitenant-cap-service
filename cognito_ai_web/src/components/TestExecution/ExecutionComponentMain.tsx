import React, { useEffect, useReducer, useRef } from 'react';
import { useLocation } from "react-router-dom";
import CustomTable from "../../utils/CustomTable.jsx";
import {
    CircleAlert,
    Plus,
    Save,
    Trash2,
    X,
    SquarePen,
    Home,
} from "lucide-react";
import { apiRequest } from "../../utils/helpers/ApiHelper.js";
import SpinnerV2 from "../../utils/SpinnerV2.jsx";
import ErrorScreen from "../../utils/ErrorScreen.jsx";
import Pagination from "../../utils/Pagination.jsx";
import Toast from "../../utils/Toast.jsx";
import ConfirmPopup from "../../utils/ConfirmPopup.jsx";
import useDebounce from '../../utils/helpers/useDebounce.js';
import SearchBar from "../../utils/SearchBar.jsx";
import Dropdown from "../../utils/DropdownV2.jsx";
import Breadcrumb from "../../utils/Breadcrumb.jsx";

type IdKey = string | number;

interface SelectOption {
    value: string;
    label: string;
}

interface FilterObj {
    Type: string;
}

interface BreadCrumbItem {
    id: string;
    label: string;
    icon: React.ReactNode | string;
    show: boolean;
}

interface ExecutionComponentRow {
    ExecutionComponentId: string;
    Module: string;
    SubModule: string;
    ObjectId: string;
    Component: string;
    Type: string;
    ObjectType: string;
    ApiType: string;
    Status: number;
    isNew?: boolean;
    tempId?: number;
    ServiceName?: string;
    ApiId?: string;
    ApiTypeLabel?: string;
}

type RowError = Record<string, string>;

interface State {
    Error: string;
    ExecutionComponents: ExecutionComponentRow[];
    ObjectList: SelectOption[];
    TypeList: SelectOption[];
    ApiTypeList: SelectOption[];
    BreadCrumbData: BreadCrumbItem[];
    ViewDetails: boolean;
    SearchQuery: string;
    CurrAddEditDetails: Partial<ExecutionComponentRow>;
    ActiveBCItem: string;
    CurrentPage: number;
    TotalRecords: number;
    IsLoading: boolean;
    showToast: boolean;
    ToastMessage: string;
    SavingLoader: boolean;
    FilterObj: FilterObj;
    editingRows: Record<IdKey, boolean>;
    newRows: ExecutionComponentRow[];
    rowErrors: Record<IdKey, RowError | undefined>;
}

type Action = Partial<State>;

type Props = {
    CurrAddEditDetails?: Partial<ExecutionComponentRow>;
};

const reducer: (state: State, newState: Action) => State = (state, newState) => ({ ...state, ...newState });

const initialState: State = {
    Error: "",
    ExecutionComponents: [],
    ObjectList: [],
    TypeList: [
        { value: "API", label: "API" },
        { value: "Tosca", label: "Tosca" },
        { value: "Selenium", label: "Selenium" }
    ],
    ApiTypeList: [],
    BreadCrumbData: [
        { id: "ExecutionComponents", label: "Execution Components", icon: <Home size={16} />, show: true },
        { id: "Details", label: "Details", icon: "", show: false },
    ],
    ViewDetails: false,
    SearchQuery: "",
    CurrAddEditDetails: {},
    ActiveBCItem: "ExecutionComponents",
    CurrentPage: 1,
    TotalRecords: 0,
    IsLoading: true,
    showToast: false,
    ToastMessage: "",
    SavingLoader: false,
    FilterObj: {
        Type: ""
    },
    editingRows: {},
    newRows: [],
    rowErrors: {},
};

type TableColumn = { title: string; key: string; className?: string };
type TableRow = Record<string, React.ReactNode>;

export default function ExecutionComponentMain(props: Props) {
    const location = useLocation();
    const [state, setState] = useReducer(reducer, initialState);

    const didFetchData = useRef<boolean>(false);
    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;

        const init = async () => {
            setState({ IsLoading: true });
            
            // Store inherited data from props FIRST
            let inheritedData = {};
            if (props.CurrAddEditDetails) {
                inheritedData = props.CurrAddEditDetails;
                setState({ CurrAddEditDetails: props.CurrAddEditDetails });
            }
            
            await getObjectsList();
            
            // Load API types if inherited data has ObjectId and Type is API
            if (inheritedData.ObjectId && inheritedData.Type === "API") {
                await getApiTypesByObjectIdAndType(inheritedData.ObjectId, "API");
            }
            
            // Pass inheritedData directly to getData
            await getData("", 1, state.FilterObj, inheritedData.ObjectId || "");
            setState({ IsLoading: false });
        };
        void init();
    }, []);

    const getObjectsList = async () => {
        try {
            const resp: any = await apiRequest("/GetSAPObjectsMaster", {});
            if (resp && resp.ResponseData && resp.ResponseData.length > 0) {
                const formattedObjects: SelectOption[] = resp.ResponseData.map((obj: any) => ({
                    value: obj.ObjectId,
                    label: `${obj.ObjectId} - ${obj.ObjectName}`
                }));
                setState({ ObjectList: formattedObjects });
            } else {
                setState({ ObjectList: [] });
            }
        } catch (err) {
            console.error("Error fetching objects:", err);
            setState({ ObjectList: [] });
        }
    };

    const getApiTypesByObjectIdAndType = async (objectId: string, type: string) => {
        if (!objectId || type !== "API") {
            setState({ ApiTypeList: [] });
            return;
        }

        try {
            const resp: any = await apiRequest("/GetSAPObjectApisMasterByObjectId", {
                ObjectId: objectId,
                ApiType: type
            });
            
            if (resp && resp.ResponseData && resp.ResponseData.length > 0) {
                const formattedApiTypes: SelectOption[] = resp.ResponseData.map((api: any) => ({
                    value: api.ApiId,
                    label: api.ServiceName,
                    ServiceName: api.ServiceName, 
                    ApiId: api.ApiId
                }));
                setState({ ApiTypeList: formattedApiTypes });
            } else {
                setState({ ApiTypeList: [] });
            }
        } catch (err) {
            console.error("Error fetching API types:", err);
            setState({ ApiTypeList: [] });
        }
    };

    const getData = async (
        SearchQuery: string = "",
        PageNo: number = 1,
        FilterObj: FilterObj = { Type: "" },
        ObjectId: string = "" // Add new parameter
    ) => {
        setState({ IsLoading: true });
        try {
            const resp: any = await apiRequest("/GetExecutionComponentsPaginationFilterSearch", {
                PageNo: PageNo,
                ComponentType: FilterObj.Type,
                SearchString: SearchQuery,
                ObjectId: ObjectId || state.CurrAddEditDetails?.ObjectId || ""
            });

            if (resp && resp.ResponseData && resp.ResponseData.length > 0) {
                const mappedData = resp.ResponseData.map((item: any) => ({
                    ExecutionComponentId: item.ExecutionComponentId,
                    Module: item.Module || "",
                    SubModule: item.SubModule || "",
                    ObjectId: item.ObjectId || "",
                    Component: item.Component || "",
                    Type: item.ComponentType || item.Type,
                    ObjectType: item.ObjectType || "",
                    ApiType: item.ObjectAPI || item.ApiType || "",
                    Status: item.Status,
                    ServiceName: item.ServiceName || "",
                    ApiId: item.ApiId || "",
                    ApiTypeLabel: item.ApiType || "" 
                }));
                
                setState({ 
                    ExecutionComponents: mappedData as ExecutionComponentRow[], 
                    TotalRecords: resp.TotalRecords as number,
                    Error: ""
                });
            } else {
                setState({ 
                    ExecutionComponents: [], 
                    TotalRecords: 0,
                    Error: ""
                });
            }
        } catch (err) {
            console.error("Error fetching execution components:", err);
            setState({ 
                Error: (err as Error).toString(),
                ExecutionComponents: [],
                TotalRecords: 0
            });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const handleAddNew = () => {
        const newRow: ExecutionComponentRow = {
            ExecutionComponentId: "",
            Module: state.CurrAddEditDetails?.Module || "",
            SubModule: state.CurrAddEditDetails?.SubModule || "",
            ObjectId: state.CurrAddEditDetails?.ObjectId || "",
            Component: "",
            Type: state.CurrAddEditDetails?.Type || "",
            ObjectType: state.CurrAddEditDetails?.ObjectType || "",
            ApiType: "",
            Status: 1,
            isNew: true,
            tempId: Date.now()
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

    const handleEdit = (item: ExecutionComponentRow) => {
        if (item.Type === "API" && item.ObjectId) {
            void getApiTypesByObjectIdAndType(item.ObjectId, item.Type);
        }
        setState({
            editingRows: {
                ...state.editingRows,
                [(item.isNew ? item.tempId : item.ExecutionComponentId) as IdKey]: true
            },
            rowErrors: {
                ...state.rowErrors,
                [(item.isNew ? item.tempId : item.ExecutionComponentId) as IdKey]: {}
            }
        });
    };

    const debouncedSearchQuery = useDebounce<string>(state.SearchQuery, 300);
    const didSearchRun = useRef<boolean>(false);

    useEffect(() => {
        if (!didSearchRun.current) {
            didSearchRun.current = true;
            return;
        }

        void getData(debouncedSearchQuery, 1, state.FilterObj);
    }, [debouncedSearchQuery]);

    const handleCancelAll = () => {
        setState({
            editingRows: {},
            newRows: [],
            rowErrors: {},
            ApiTypeList: []
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
        
        if (currentId === "ExecutionComponents") {
            setState({
                ActiveBCItem: currentId,
                BreadCrumbData: updatedBreadcrumb,
                ViewDetails: false,
                CurrAddEditDetails: props.CurrAddEditDetails || {}
            });
        } else {
            setState({
                ActiveBCItem: currentId,
                BreadCrumbData: updatedBreadcrumb,
            });
        }
    };

    const validateAllRows = () => {
        const requiredFields: Array<keyof Pick<ExecutionComponentRow, "Type" | "Component">> = ["Type", "Component"];
        const newRowErrors: Record<IdKey, RowError> = {};
        let allValid = true;

        state.newRows.forEach(row => {
            const rowId = row.tempId as number;
            newRowErrors[rowId] = {};

            requiredFields.forEach(field => {
                if (!row[field] || row[field].trim() === "") {
                    newRowErrors[rowId][field] = "This field is required";
                    allValid = false;
                }
            });

            if (row.Type === "API" && (!row.ApiType || row.ApiType.trim() === "")) {
                newRowErrors[rowId]["ApiType"] = "API Type is required when Type is API";
                allValid = false;
            }
        });

        Object.keys(state.editingRows).forEach(idKey => {
            const id = idKey as string;
            if (typeof id === 'string') {
                const row = state.ExecutionComponents.find(t => t.ExecutionComponentId === id);
                if (row) {
                    newRowErrors[id] = {};
                    requiredFields.forEach(field => {
                        if (!row[field] || row[field].trim() === "") {
                            newRowErrors[id][field] = "This field is required";
                            allValid = false;
                        }
                    });

                    if (row.Type === "API" && (!row.ApiType || row.ApiType.trim() === "")) {
                        newRowErrors[id]["ApiType"] = "API Type is required when Type is API";
                        allValid = false;
                    }
                }
            }
        });

        setState({ rowErrors: newRowErrors });
        return allValid;
    };

    const handleSaveAll = async () => {
        if (!validateAllRows()) {
            setState({ 
                showToast: true, 
                ToastMessage: "Please fill all required fields" 
            });
            setTimeout(() => setState({ showToast: false }), 3000);
            return;
        }

        setState({ SavingLoader: true });

        try {
            const editedRows = Object.keys(state.editingRows)
                .filter(id => typeof id === 'string')
                .map(id => {
                    return state.ExecutionComponents.find(row => row.ExecutionComponentId === id);
                })
                .filter(Boolean) as ExecutionComponentRow[];

            const rowsToSend: ExecutionComponentRow[] = [...editedRows, ...state.newRows];

            if (rowsToSend.length > 0) {
                for (const row of rowsToSend) {
                    const payload = {
                        ExecutionComponentId: row.ExecutionComponentId || "",
                        Module: row.Module || "",
                        SubModule: row.SubModule || null,
                        ObjectId: row.ObjectId || "",
                        Component: row.Component || "",
                        ComponentType: row.Type,
                        ObjectType: row.ObjectType || null,
                        ObjectAPI: row.Type === "API" ? row.ApiType : null,
                        Status: row.Status,
                        CreatedBy: null
                    };
                    
                    await apiRequest("/AddUpdateExecutionComponent", payload);
                }
            }

            setState({
                SavingLoader: false,
                showToast: true,
                ToastMessage: "Saved successfully!",
                editingRows: {},
                newRows: [],
                rowErrors: {},
                ApiTypeList: []
            });

            await getData(state.SearchQuery, state.CurrentPage, state.FilterObj);
            setTimeout(() => setState({ showToast: false }), 3000);

        } catch (error) {
            console.error("Error saving execution components:", error);
            setState({ 
                SavingLoader: false, 
                showToast: true,
                ToastMessage: "Error saving data. Please try again.",
                Error: (error as Error).toString() 
            });
            setTimeout(() => setState({ showToast: false }), 3000);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, name: keyof ExecutionComponentRow, item: ExecutionComponentRow) => {
        if (item.isNew) {
            const updatedNewRows = state.newRows.map(row => {
                if (row.tempId === item.tempId) {
                    return { ...row, [name]: e.target.value } as ExecutionComponentRow;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedComponents = state.ExecutionComponents.map(t => {
                if (t.ExecutionComponentId === item.ExecutionComponentId) {
                    return { ...t, [name]: e.target.value } as ExecutionComponentRow;
                }
                return t;
            });
            setState({ ExecutionComponents: updatedComponents });
        }
    };

    const handleDropdownChange = (
        val: string,
        _options: unknown,
        name: keyof ExecutionComponentRow,
        item: ExecutionComponentRow
    ) => {
        if (item.isNew) {
            const updatedNewRows = state.newRows.map(row => {
                if (row.tempId === item.tempId) {
                    const updatedRow = { ...row, [name]: val } as ExecutionComponentRow;
                    
                    if (name === "Type") {
                        updatedRow.ApiType = "";
                        if (val === "API" && updatedRow.ObjectId) {
                            void getApiTypesByObjectIdAndType(updatedRow.ObjectId, val);
                        } else {
                            setState({ ApiTypeList: [] });
                        }
                    }
                    
                    if (name === "ObjectId" && row.Type === "API") {
                        updatedRow.ApiType = "";
                        void getApiTypesByObjectIdAndType(val, row.Type);
                    }
                    
                    return updatedRow;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedComponents = state.ExecutionComponents.map(t => {
                if (t.ExecutionComponentId === item.ExecutionComponentId) {
                    const updatedRow = { ...t, [name]: val } as ExecutionComponentRow;
                    
                    if (name === "Type") {
                        updatedRow.ApiType = "";
                        if (val === "API" && updatedRow.ObjectId) {
                            void getApiTypesByObjectIdAndType(updatedRow.ObjectId, val);
                        } else {
                            setState({ ApiTypeList: [] });
                        }
                    }
                    
                    if (name === "ObjectId" && t.Type === "API") {
                        updatedRow.ApiType = "";
                        void getApiTypesByObjectIdAndType(val, t.Type);
                    }
                    
                    return updatedRow;
                }
                return t;
            });
            setState({ ExecutionComponents: updatedComponents });
        }
    };

    const handlePageChange = (page: number) => {
        setState({ CurrentPage: page });
        void getData(state.SearchQuery, page, state.FilterObj);
    };

    const handleDeleteItem = async (item: ExecutionComponentRow) => {
        if (item.ExecutionComponentId) {
            try {
                const resp: any = await apiRequest("/DeleteExecutionComponent", {
                    ExecutionComponentId: item.ExecutionComponentId
                });
                
                if (resp) {
                    setState({ 
                        showToast: true,
                        ToastMessage: "Deleted successfully!"
                    });
                    await getData(state.SearchQuery, state.CurrentPage, state.FilterObj);
                    setTimeout(() => {
                        setState({ showToast: false });
                    }, 3000);
                }
            } catch (error) {
                console.error("Error deleting execution component:", error);
                setState({ 
                    showToast: true,
                    ToastMessage: "Error deleting item. Please try again.",
                    Error: (error as Error).toString()
                });
                setTimeout(() => {
                    setState({ showToast: false });
                }, 3000);
            }
        } else {
            setState({
                newRows: state.newRows.filter(row => row.tempId !== item.tempId),
                editingRows: {
                    ...state.editingRows,
                    [(item.tempId as number)]: false
                },
                rowErrors: {
                    ...state.rowErrors,
                    [(item.tempId as number)]: undefined
                }
            });
        }
    };

    const handleViewDetails = (item: ExecutionComponentRow) => {
        setState({ ViewDetails: true, CurrAddEditDetails: item });
        handleBreadcrumbClick("Details", `Component: ${item.ExecutionComponentId}`);
    };

    const handleSearch = (value: string) => {
        setState({ SearchQuery: value, CurrentPage: 1 });
        if (value.trim() === "") {
            void getData("", 1, state.FilterObj);
        }
    };

    const handleDropdownFilter = (val: string, _options: unknown, name: keyof FilterObj) => {
        const FilterObj = { ...state.FilterObj };
        FilterObj[name] = val;
        setState({ FilterObj, CurrentPage: 1 });
        void getData(state.SearchQuery, 1, FilterObj);
    };

    const columns: TableColumn[] = [
        { title: 'Type', key: 'Type', className: 'min-w-[120px]' },
        { title: 'Component', key: 'Component', className: 'min-w-[200px]' },
        { title: 'API Type', key: 'ApiType', className: 'min-w-[150px]' },
    ];

    const allRows: ExecutionComponentRow[] = [...state.newRows, ...state.ExecutionComponents];

    const data: TableRow[] = allRows.map((item) => {
        const rowId: IdKey = item.isNew ? (item.tempId as number) : item.ExecutionComponentId;
        const isEditing = !!state.editingRows[rowId];
        const errors: RowError = state.rowErrors[rowId] || {};

        if (isEditing) {
            return {
                Type: (
                    <div>
                        <Dropdown
                            size="small"
                            mode="single"
                            options={state.TypeList}
                            value={item.Type}
                            onChange={(val: string, option: unknown) => handleDropdownChange(val, option, "Type", item)}
                            className={errors.Type ? 'border-red-500' : ''}
                            placeholder="Select Type"
                        />
                        {errors.Type && (
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.Type}</p>
                            </div>
                        )}
                    </div>
                ),
                Component: (
                    <div>
                        <input
                            defaultValue={item.Component || ''}
                            onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
                                if (item.Component !== e.target.value) {
                                    handleChange(e, "Component", item);
                                }
                            }}
                            type="text"
                            className={`w-full px-3 shadow text-[0.85rem] py-2 border ${
                                errors.Component ? "border-red-500" : "border-gray-200"
                            } rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Enter Component"
                        />
                        {errors.Component && (
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.Component}</p>
                            </div>
                        )}
                    </div>
                ),
                ApiType: (
                    <div>
                        <Dropdown
                            size="small"
                            mode="single"
                            options={state.ApiTypeList}
                            value={item.ApiType}
                            onChange={(val: string, option: unknown) => handleDropdownChange(val, option, "ApiType", item)}
                            className={errors.ApiType ? 'border-red-500' : ''}
                            placeholder={item.Type === "API" ? "Select API Type" : "N/A"}
                            disabled={item.Type !== "API"}
                        />
                        {errors.ApiType && (
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.ApiType}</p>
                            </div>
                        )}
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
            Type: item.Type,
            Component: item.Component,
            // ApiType: item.Type === "API" ? (item.ApiType || "-") : "N/A",'
            ApiType: item.Type === "API" 
                ? (item.ServiceName ? `${item.ServiceName} (${item.ApiId}) - ${item.ApiTypeLabel}` : (item.ApiType || "-"))
                : "N/A",
            actions: (
                <div className="relative flex items-center">
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
        <div className="pt-0 pb-6 px-6">
            <div className="pb-2.5 px-3.5">
                <Breadcrumb
                    data={state.BreadCrumbData}
                    activeItem={state.ActiveBCItem}
                    onItemClick={handleBreadcrumbClick}
                />
            </div>

            {state.ActiveBCItem === "Details" ? (
                <div>
                    <div className="p-4 bg-white rounded-lg">
                        <p>Details view for {state.CurrAddEditDetails.ExecutionComponentId}</p>
                    </div>
                </div>
            ) : (
                <>
                    <Toast
                        message={state.ToastMessage}
                        show={state.showToast}
                        onClose={() => setState({ showToast: false })}
                    />

                    {/* Inherited Data Labels */}
                    {state.CurrAddEditDetails && Object.keys(state.CurrAddEditDetails).length > 0 && (
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h3 className="text-sm font-semibold text-blue-900 mb-2">Context Information</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                {state.CurrAddEditDetails.Module && (
                                    <div>
                                        <span className="font-medium text-gray-700">Module:</span>
                                        <span className="ml-2 text-gray-900">{state.CurrAddEditDetails.Module}</span>
                                    </div>
                                )}
                                {state.CurrAddEditDetails.SubModule && (
                                    <div>
                                        <span className="font-medium text-gray-700">Sub Module:</span>
                                        <span className="ml-2 text-gray-900">{state.CurrAddEditDetails.SubModule}</span>
                                    </div>
                                )}
                                {state.CurrAddEditDetails.ObjectId && (
                                    <div>
                                        <span className="font-medium text-gray-700">Object ID:</span>
                                        <span className="ml-2 text-gray-900">{state.CurrAddEditDetails.ObjectId}</span>
                                    </div>
                                )}
                                {state.CurrAddEditDetails.ObjectType && (
                                    <div>
                                        <span className="font-medium text-gray-700">Object Type:</span>
                                        <span className="ml-2 text-gray-900">{state.CurrAddEditDetails.ObjectType}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center pb-4">
                        <div className="w-1/3">
                            <SearchBar currentValue={state.SearchQuery} onSearch={handleSearch} size="medium" />
                        </div>

                        {!hasEdits &&
                            <div className="flex w-full items-center gap-5 ml-10">
                                <div className="w-[30%]">
                                    <p className="text-[0.80rem] font-semibold">Type</p>
                                    <Dropdown
                                        size="small"
                                        mode="single"
                                        options={state.TypeList}
                                        value={state.FilterObj.Type}
                                        onChange={(val: string, item: unknown) => handleDropdownFilter(val, item, "Type")}
                                        placeholder="All Types"
                                    />
                                </div>
                            </div>
                        }

                        <div className="flex items-center space-x-2 gap-4">
                            <button
                                onClick={handleAddNew}
                                className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
                            >
                            <Plus className="w-5 h-5" />
                                <span>Add</span>
                            </button>
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
        </div>
    );
}