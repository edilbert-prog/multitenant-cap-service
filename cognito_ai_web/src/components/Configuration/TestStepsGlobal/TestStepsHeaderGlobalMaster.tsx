import React, { useEffect, useReducer, useRef } from 'react';
import CustomTable from "../../../utils/CustomTable.js";
import {
    CircleAlert,
    Plus,
    Save,
    Trash2,
    X,
    SquarePen,
    Home,
} from "lucide-react";
import { apiRequest } from "../../../utils/helpers/ApiHelper.js";
import SpinnerV2 from "../../../utils/SpinnerV2.js";
import ErrorScreen from "../../../utils/ErrorScreen.js";
import Pagination from "../../../utils/Pagination.js";
import Toast from "../../../utils/Toast.js";
import ConfirmPopup from "../../../utils/ConfirmPopup.js";
import useDebounce from '../../../utils/helpers/useDebounce.js';
import SearchBar from "../../../utils/SearchBar.js";
import Dropdown from "../../../utils/Dropdown.js";
import Breadcrumb from "../../../utils/Breadcrumb.js";
import TestStepsDetailsGlobalMaster from "./TestStepsDetailsGlobalMaster.tsx";

type IdKey = string | number;

interface SelectOption {
    value: string;
    label: string;
}

interface FilterObj {
    TestLevel: string;
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
    TestLevel: string;
    Description: string;
    result: string;
    Module: string;
    SubModule: string;
    Status: number;
    isNew?: boolean;
    tempId?: number;
}

type RowError = Record<string, string>;

interface State {
    Error: string;
    TestStepsHeaderGlobal: TestStepsHeaderRow[];
    TestLevelList: SelectOption[];
    SAPModuleList: SelectOption[];
    SAPSubModuleList: SelectOption[];
    rowSubModuleLists: Record<IdKey, SelectOption[]>;
    BreadCrumbData: BreadCrumbItem[];
    ViewDetails: boolean;
    CurrAddEditDetails: TestStepsHeaderRow | Record<string, never>;
    SearchQuery: string;
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
}

type Action = Partial<State>;

const reducer: (state: State, newState: Action) => State = (state, newState) => ({ ...state, ...newState });

const initialState: State = {
    Error: "",
    TestStepsHeaderGlobal: [],
    TestLevelList: [
        { value: "Unit", label: "Unit" },
        { value: "Integration", label: "Integration" },
        { value: "System", label: "System" },
        { value: "User Acceptance", label: "User Acceptance" }
    ],
    SAPModuleList: [],
    SAPSubModuleList: [],
    rowSubModuleLists: {},
    BreadCrumbData: [
        { id: "TestStepsGlobal", label: "Global Test Steps", icon: <Home size={16} />, show: true },
        { id: "Details", label: "Details", icon: "", show: false },
    ],
    ViewDetails: false,
    CurrAddEditDetails: {},
    SearchQuery: "",
    ActiveBCItem: "TestStepsGlobal",
    CurrentPage: 1,
    TotalRecords: 0,
    IsLoading: true,
    showToast: false,
    toastMessage: "",
    toastType: "",
    SavingLoader: false,
    FilterObj: {
        TestLevel: "",
        Module: "",
        SubModule: ""
    },
    editingRows: {},
    newRows: [],
    rowErrors: {},
};

type TableColumn = { title: string; key: string; className?: string };
type TableRow = Record<string, React.ReactNode>;

export default function TestStepsHeaderGlobalMaster() {
    const [state, setState] = useReducer(reducer, initialState);

    const didFetchData = useRef<boolean>(false);
    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;

        const init = async () => {
            setState({ IsLoading: true });
            await GetSAPModulesMaster();
            await getData("");
            setState({ IsLoading: false });
        };

        void init();
    }, []);

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

    const getData = async (
        SearchQuery: string = "",
        PageNo: number = 1,
        FilterObj: FilterObj = { TestLevel: "", Module: "", SubModule: "" }
    ) => {
        try {
            const resp: any = await apiRequest("/GetTestStepsHeaderGlobalPaginationFilterSearch", {
                "PageNo": PageNo,
                "StartDate": "",
                "EndDate": "",
                "TestLevel": FilterObj.TestLevel,
                "Module": FilterObj.Module,
                "SubModule": FilterObj.SubModule,
                "SearchString": SearchQuery
            });

            if (resp.ResponseData && resp.ResponseData.length > 0) {
                setState({ 
                    TestStepsHeaderGlobal: resp.ResponseData as TestStepsHeaderRow[], 
                    TotalRecords: resp.TotalRecords as number 
                });
            } else {
                setState({ TestStepsHeaderGlobal: [], TotalRecords: 0 });
            }
        } catch (err) {
            setState({ Error: (err as Error).toString() });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const handleAddNew = () => {
        const newRow: TestStepsHeaderRow = {
            "TestStepsId": "",
            "TestLevel": "",
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
                const row = state.TestStepsHeaderGlobal.find(t => t.TestStepsId === id);
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
                    return state.TestStepsHeaderGlobal.find(row => row.TestStepsId === id);
                })
                .filter(Boolean) as TestStepsHeaderRow[];

            const rowsToSend: TestStepsHeaderRow[] = [...editedRows, ...state.newRows];

            if (rowsToSend.length > 0) {
                for (const row of rowsToSend) {
                    await apiRequest("/AddUpdateTestStepsHeaderGlobal", row as any);
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
            const updatedSteps = state.TestStepsHeaderGlobal.map(t => {
                if (t.TestStepsId === item.TestStepsId) {
                    return { ...t, [name]: e.target.value } as TestStepsHeaderRow;
                }
                return t;
            });
            setState({ TestStepsHeaderGlobal: updatedSteps });
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
            const updatedSteps = state.TestStepsHeaderGlobal.map(t => {
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
            setState({ TestStepsHeaderGlobal: updatedSteps });
        }
    };

    const handlePageChange = (page: number) => {
        setState({ CurrentPage: page });
        void getData(state.SearchQuery, page, state.FilterObj);
    };

    const handleDeleteItem = async (item: TestStepsHeaderRow) => {
        if (item.TestStepsId) {
            const resp: any = await apiRequest("/DeleteTestStepsHeaderGlobal", item as any);
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
        setState({ ViewDetails: true, CurrAddEditDetails: item });
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

    const allRows: TestStepsHeaderRow[] = [...state.newRows, ...state.TestStepsHeaderGlobal];

    const data: TableRow[] = allRows.map((item) => {
        const rowId: IdKey = item.isNew ? (item.tempId as number) : item.TestStepsId;
        const isEditing = !!state.editingRows[rowId];
        const errors: RowError = state.rowErrors[rowId] || {};

        if (isEditing) {
            return {
                ...(state.FilterObj.Module ? {} : {
                    Module: (
                        <div>
                            <p className="text-[0.75rem] font-semibold mb-1 text-gray-700">Module</p>
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
                            <p className="text-[0.75rem] font-semibold mb-1 text-gray-700">Sub Module</p>
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
                        <p className="text-[0.75rem] font-semibold mb-1 text-gray-700">Test Level <span className="text-red-500">*</span></p>
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
                        <p className="text-[0.75rem] font-semibold mb-1 text-gray-700">Description</p>
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
                    <TestStepsDetailsGlobalMaster
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
                                <div className="w-[25%]">
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
                                <div className="w-[25%]">
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
                                <div className="w-[25%]">
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