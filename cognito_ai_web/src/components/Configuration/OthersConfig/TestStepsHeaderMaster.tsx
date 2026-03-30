import React, { useEffect, useReducer, useRef } from 'react';
import CustomTable from "../../../utils/CustomTable.jsx";
import {
    ChevronLeft,
    CircleAlert,
    Plus,
    Save,
    Trash2,
    X,
    SquarePen,
    Home,
    RefreshCcw
} from "lucide-react";
import { apiRequest } from "../../../utils/helpers/ApiHelper.js";
import SpinnerV2 from "../../../utils/SpinnerV2.jsx";
import ErrorScreen from "../../../utils/ErrorScreen.jsx";
import Pagination from "../../../utils/Pagination.jsx";
import Toast from "../../../utils/Toast.jsx";
import ConfirmPopup from "../../../utils/ConfirmPopup.jsx";
import TestStepsDetailsMaster from "./TestStepsDetailsMaster.jsx";
import useDebounce from '../../../utils/helpers/useDebounce.js';
import SearchBar from "../../../utils/SearchBar.jsx";
import Dropdown from "../../../utils/DropdownV2.jsx";
import Breadcrumb from "../../../utils/Breadcrumb.jsx";

type IdKey = string | number;

interface SelectOption {
    value: string;
    label: string;
}

interface FilterObj {
    TestLevel: string;
    TestCaseId: string;
    ObjectId: string;
}

interface BreadCrumbItem {
    id: string;
    label: string;
    icon: React.ReactNode | string;
    show: boolean;
}

interface TestStepsHeaderRow {
    TestStepsHeaderId: string;
    TestCaseId: string;
    TestStepsId: string;
    ObjectId: string;
    TestLevel: string;
    ExecutionComponentId: string;
    Description: string;
    Status: number;
    isNew?: boolean;
    tempId?: number;
}

type RowError = Record<string, string>;

interface State {
    Error: string;
    TestStepsHeader: TestStepsHeaderRow[];
    ApplicationsList: unknown[];
    TestCaseList: SelectOption[];
    TestStepsList: SelectOption[];
    ObjectList: SelectOption[];
    TestLevelList: SelectOption[];
    BreadCrumbData: BreadCrumbItem[];
    ViewAppDetails: boolean;
    SearchQuery: string;
    CurrAddEditDetails: TestStepsHeaderRow | Record<string, never>;
    ActiveBCItem: string;
    CurrentPage: number;
    TotalRecords: number;
    IsLoading: boolean;
    showToast: boolean;
    SavingLoader: boolean;
    FilterObj: FilterObj;
    editingRows: Record<IdKey, boolean>;
    newRows: TestStepsHeaderRow[];
    rowErrors: Record<IdKey, RowError | undefined>;
}

type Action = Partial<State>;

type Props = {};

const reducer: (state: State, newState: Action) => State = (state, newState) => ({ ...state, ...newState });

const initialState: State = {
    Error: "",
    TestStepsHeader: [],
    ApplicationsList: [],
    TestCaseList: [
        { value: "TC001", label: "TC001 - Login Test" },
        { value: "TC002", label: "TC002 - Logout Test" },
        { value: "TC003", label: "TC003 - User Registration" }
    ],
    TestStepsList: [
        { value: "TS001", label: "TS001 - Step 1" },
        { value: "TS002", label: "TS002 - Step 2" },
        { value: "TS003", label: "TS003 - Step 3" }
    ],
    ObjectList: [],
    TestLevelList: [
        { value: "Unit", label: "Unit" },
        { value: "Integration", label: "Integration" },
        { value: "System", label: "System" },
        { value: "User Acceptance", label: "User Acceptance" }
    ],
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
    SavingLoader: false,
    FilterObj: {
        TestLevel: "",
        TestCaseId: "",
        ObjectId: ""
    },
    editingRows: {},
    newRows: [],
    rowErrors: {},
};

type TableColumn = { title: string; key: string; className?: string };
type TableRow = Record<string, React.ReactNode>;

export default function TestStepsHeaderMaster(_: Props) {
    const [state, setState] = useReducer(reducer, initialState);

    const didFetchData = useRef<boolean>(false);
    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;

        const init = async () => {
            setState({ IsLoading: true });
            await getApplicationsList();
            await getObjectsList();
            await getData("");
            setState({ IsLoading: false });
        };

        void init();
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

    const getObjectsList = async () => {
        try {
            const resp: any = await apiRequest("/GetSAPObjectsMaster", {});
            if (resp.ResponseData && resp.ResponseData.length > 0) {
                const formattedObjects: SelectOption[] = resp.ResponseData.map((obj: any) => ({
                    value: obj.ObjectId,
                    label: `${obj.ObjectId} - ${obj.ObjectName}`
                }));
                setState({ ObjectList: formattedObjects });
            }
        } catch (err) {
            console.error("Error fetching objects:", err);
        }
    };

    const getData = async (
        SearchQuery: string = "",
        PageNo: number = 1,
        FilterObj: FilterObj = { TestLevel: "", TestCaseId: "", ObjectId: "" }
    ) => {
        try {
            const resp: any = await apiRequest("/GetTestStepsHeaderPaginationFilterSearch", {
                "PageNo": PageNo,
                "StartDate": "",
                "EndDate": "",
                "TestLevel": FilterObj.TestLevel,
                "TestCaseId": FilterObj.TestCaseId,
                "ObjectId": FilterObj.ObjectId,
                "SearchString": SearchQuery
            });

            if (resp.ResponseData.length > 0) {
                setState({ TestStepsHeader: resp.ResponseData as TestStepsHeaderRow[], TotalRecords: resp.TotalRecords as number });
            } else {
                setState({ TestStepsHeader: [], TotalRecords: 0 });
            }
        } catch (err) {
            setState({ Error: (err as Error).toString() });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const handleAddNew = () => {
        const newRow: TestStepsHeaderRow = {
            "TestStepsHeaderId": "",
            "TestCaseId": "",
            "TestStepsId": "",
            "ObjectId": "",
            "TestLevel": "",
            "ExecutionComponentId": "",
            "Description": "",
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

    const handleEdit = (item: TestStepsHeaderRow) => {
        setState({
            editingRows: {
                ...state.editingRows,
                [(item.isNew ? item.tempId : item.TestStepsHeaderId) as IdKey]: true
            },
            rowErrors: {
                ...state.rowErrors,
                [(item.isNew ? item.tempId : item.TestStepsHeaderId) as IdKey]: {}
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

        if (debouncedSearchQuery.trim() === "") return;
        void getData(debouncedSearchQuery);
    }, [debouncedSearchQuery]);

    const handleCancelAll = () => {
        setState({
            editingRows: {},
            newRows: [],
            rowErrors: {}
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
        const requiredFields: Array<keyof Pick<TestStepsHeaderRow, "TestCaseId" | "TestStepsId" | "ObjectId" | "TestLevel">> = ["TestCaseId", "TestStepsId", "ObjectId", "TestLevel"];
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
                const row = state.TestStepsHeader.find(t => t.TestStepsHeaderId === id);
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
                    return state.TestStepsHeader.find(row => row.TestStepsHeaderId === id);
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
                editingRows: {},
                newRows: [],
                rowErrors: {}
            });

            await getData();
            setTimeout(() => setState({ showToast: false }), 3000);

        } catch (error) {
            setState({ SavingLoader: false, Error: (error as Error).toString() });
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
                if (t.TestStepsHeaderId === item.TestStepsHeaderId) {
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
        if (item.isNew) {
            const updatedNewRows = state.newRows.map(row => {
                if (row.tempId === item.tempId) {
                    return { ...row, [name]: val } as TestStepsHeaderRow;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedSteps = state.TestStepsHeader.map(t => {
                if (t.TestStepsHeaderId === item.TestStepsHeaderId) {
                    return { ...t, [name]: val } as TestStepsHeaderRow;
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
        if (item.TestStepsHeaderId) {
            const resp: any = await apiRequest("/DeleteTestStepsHeader", item as any);
            if (resp) {
                setState({ showToast: true });
                void getData(state.SearchQuery, state.CurrentPage, state.FilterObj);
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
        setState({ FilterObj });
        void getData(state.SearchQuery, state.CurrentPage, FilterObj);
    };

    const columns: TableColumn[] = [
        { title: 'Test Case ID', key: 'TestCaseId' },
        { title: 'Test Steps ID', key: 'TestStepsId' },
        { title: 'Object ID', key: 'ObjectId' },
        { title: 'Test Level', key: 'TestLevel' },
        { title: 'Execution Component ID', key: 'ExecutionComponentId' },
        { title: 'Description', key: 'Description', className: 'min-w-[300px]' },
    ];

    const allRows: TestStepsHeaderRow[] = [...state.newRows, ...state.TestStepsHeader];

    const data: TableRow[] = allRows.map((item) => {
        const rowId: IdKey = item.isNew ? (item.tempId as number) : item.TestStepsHeaderId;
        const isEditing = !!state.editingRows[rowId];
        const errors: RowError = state.rowErrors[rowId] || {};

        if (isEditing) {
            return {
                TestCaseId: (
                    <div>
                        <Dropdown
                            size="small"
                            mode="single"
                            options={state.TestCaseList}
                            value={item.TestCaseId}
                            onChange={(val: string, option: unknown) => handleDropdownChange(val, option, "TestCaseId", item)}
                            className={errors.TestCaseId ? 'border-red-500' : ''}
                            placeholder="Select Test Case"
                        />
                        {errors.TestCaseId && (
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.TestCaseId}</p>
                            </div>
                        )}
                    </div>
                ),
                TestStepsId: (
                    <div>
                        <Dropdown
                            size="small"
                            mode="single"
                            options={state.TestStepsList}
                            value={item.TestStepsId}
                            onChange={(val: string, option: unknown) => handleDropdownChange(val, option, "TestStepsId", item)}
                            className={errors.TestStepsId ? 'border-red-500' : ''}
                            placeholder="Select Test Step"
                        />
                        {errors.TestStepsId && (
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.TestStepsId}</p>
                            </div>
                        )}
                    </div>
                ),
                ObjectId: (
                    <div>
                        <Dropdown
                            size="small"
                            mode="single"
                            options={state.ObjectList}
                            value={item.ObjectId}
                            onChange={(val: string, option: unknown) => handleDropdownChange(val, option, "ObjectId", item)}
                            className={errors.ObjectId ? 'border-red-500' : ''}
                            placeholder="Select Object"
                        />
                        {errors.ObjectId && (
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.ObjectId}</p>
                            </div>
                        )}
                    </div>
                ),
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
                ExecutionComponentId: (
                    <div>
                        <input
                            defaultValue={item.ExecutionComponentId || ""}
                            onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
                                if (item.ExecutionComponentId !== e.target.value) {
                                    handleChange(e, "ExecutionComponentId", item);
                                }
                            }}
                            type="text"
                            className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Execution Component ID"
                        />
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
            TestCaseId: item.TestCaseId,
            TestStepsId: item.TestStepsId,
            ObjectId: item.ObjectId,
            TestLevel: item.TestLevel,
            ExecutionComponentId: item.ExecutionComponentId,
            Description: item.Description,
            actions: (
                <div className="relative flex items-center">
                    <button
                        onClick={() => handleViewDetails(item)}
                        className="bg-[#0071E9] cursor-pointer text-gray-50 px-3 py-1 rounded text-sm"
                    >
                        Details
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
                    <TestStepsDetailsMaster
                        handleBreadcrumbClick={handleBreadcrumbClick}
                        ActiveBCItem={state.ActiveBCItem}
                        CurrAddEditDetails={state.CurrAddEditDetails}
                    />
                </div>
            ) : (
                <>
                    <Toast
                        message="Saved successfully!"
                        show={state.showToast}
                        onClose={() => setState({ showToast: false })}
                    />

                    <div className="flex justify-between items-center pb-4">
                        <div className="w-1/3">
                            <SearchBar currentValue={state.SearchQuery} onSearch={handleSearch} size="medium" />
                        </div>

                        {!hasEdits &&
                            <div className="flex w-full items-center gap-5 ml-10">
                                <div className="w-[30%]">
                                    <p className="text-[0.80rem] font-semibold">Test Case</p>
                                    <Dropdown
                                        size="small"
                                        mode="single"
                                        options={state.TestCaseList}
                                        value={state.FilterObj.TestCaseId}
                                        onChange={(val: string, item: unknown) => handleDropdownFilter(val, item, "TestCaseId")}
                                        placeholder="All Test Cases"
                                    />
                                </div>
                                <div className="w-[30%]">
                                    <p className="text-[0.80rem] font-semibold">Object</p>
                                    <Dropdown
                                        size="small"
                                        mode="single"
                                        options={state.ObjectList}
                                        value={state.FilterObj.ObjectId}
                                        onChange={(val: string, item: unknown) => handleDropdownFilter(val, item, "ObjectId")}
                                        placeholder="All Objects"
                                    />
                                </div>
                                <div className="w-[30%]">
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