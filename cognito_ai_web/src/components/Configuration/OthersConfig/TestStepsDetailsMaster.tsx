import React, { useEffect, useReducer, useRef } from "react";
import CustomTable from "../../../utils/CustomTable.jsx";
import { CircleAlert, Plus, Save, Trash2, X, SquarePen } from "lucide-react";
import { apiRequest } from "../../../utils/helpers/ApiHelper.js";
import SpinnerV2 from "../../../utils/SpinnerV2.jsx";
import ErrorScreen from "../../../utils/ErrorScreen.jsx";
import Pagination from "../../../utils/Pagination.jsx";
import Toast from "../../../utils/Toast.jsx";
import ConfirmPopup from "../../../utils/ConfirmPopup.jsx";
import useDebounce from "../../../utils/helpers/useDebounce.js";
import SearchBar from "../../../utils/SearchBar.jsx";
import Dropdown from "../../../utils/Dropdown.jsx";

type ReactNodeRecord = Record<string, React.ReactNode>;

interface Option {
    value: string;
    label: string;
}

interface CurrAddEditDetails {
    TestStepsId: string;
    TestCaseId: string;
}

type RowErrorMap = Record<string | number, Record<string, string>>;

interface TestStepDetail {
    TestStepDetailId: string;
    TestCaseId: string;
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
}

interface State {
    Error: string;
    TestStepsDetails: TestStepDetail[];
    TestCaseList: Option[];
    TestStepsList: Option[];
    ComponentTypeList: Option[];
    SearchQuery: string;
    CurrentPage: number;
    TotalRecords: number;
    IsLoading: boolean;
    showToast: boolean;
    SavingLoader: boolean;
    editingRows: Record<string | number, boolean>;
    newRows: TestStepDetail[];
    rowErrors: RowErrorMap;
}

type Action = Partial<State>;

type Props = {
    CurrAddEditDetails: CurrAddEditDetails;
    children?: React.ReactNode;
};

const initialState: State = {
    Error: "",
    TestStepsDetails: [],
    TestCaseList: [
        { value: "TC001", label: "TC001 - Login Test" },
        { value: "TC002", label: "TC002 - Logout Test" },
        { value: "TC003", label: "TC003 - User Registration" },
    ],
    TestStepsList: [
        { value: "TS001", label: "TS001 - Step 1" },
        { value: "TS002", label: "TS002 - Step 2" },
        { value: "TS003", label: "TS003 - Step 3" },
    ],
    ComponentTypeList: [],
    SearchQuery: "",
    CurrentPage: 1,
    TotalRecords: 0,
    IsLoading: true,
    showToast: false,
    SavingLoader: false,
    editingRows: {},
    newRows: [],
    rowErrors: {},
};

function reducer(state: State, newState: Action): State {
    return { ...state, ...newState };
}

export default function TestStepsDetailsMaster(props: Props) {
    const [state, setState] = useReducer<typeof reducer, State>(reducer, initialState);
    const debouncedSearchQuery = useDebounce(state.SearchQuery, 300) as string;
    const didFetchData = useRef<boolean>(false);

    useEffect(() => {
        const init = async () => {
            setState({ IsLoading: true });
            await getComponentTypes();
            await getTestStepsHeader();
            await getData(debouncedSearchQuery);
            setState({ IsLoading: false });
        };

        init();
    }, [debouncedSearchQuery]);


    const getTestStepsHeader = async (): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetTestStepsHeader", {});
            if (resp.ResponseData && resp.ResponseData.length > 0) {
                setState({ TestStepsList: resp.ResponseData as Option[] });
            }
        } catch (err) {
            console.error("Error fetching test steps header:", err);
        }
    };

    const getComponentTypes = async (): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetComponentTypesMaster", {});
            if (resp.ResponseData && resp.ResponseData.length > 0) {
                setState({ ComponentTypeList: resp.ResponseData as Option[] });
            }
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error("Error fetching component types:", err);
        }
    };

    const getData = async (SearchQuery: string = "", PageNo: number = 1): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetTestStepsDetailsPaginationFilterSearch", {
                PageNo,
                StartDate: "",
                EndDate: "",
                TestStepsId: props.CurrAddEditDetails.TestStepsId,
                SearchString: SearchQuery,
            });
            if (resp.ResponseData.length > 0) {
                setState({ TestStepsDetails: resp.ResponseData as TestStepDetail[], TotalRecords: resp.TotalRecords as number });
            } else {
                setState({ TestStepsDetails: [], TotalRecords: 0 });
            }
        } catch (err) {
            setState({ Error: String(err) });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const handleAddNew = (): void => {
        const existingStepNos = [...state.TestStepsDetails, ...state.newRows].map((item) => parseInt(String(item.StepNo)) || 0);
        const nextStepNo = existingStepNos.length > 0 ? Math.max(...existingStepNos) + 1 : 1;

        const newRow: TestStepDetail = {
            TestStepDetailId: "",
            TestCaseId: props.CurrAddEditDetails.TestCaseId,
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
            newRows: [...state.newRows, newRow],
            editingRows: {
                ...state.editingRows,
                [newRow.tempId as number]: true,
            },
            rowErrors: {
                ...state.rowErrors,
                [newRow.tempId as number]: {},
            },
        });
    };

    const handleEdit = (item: TestStepDetail): void => {
        setState({
            editingRows: {
                ...state.editingRows,
                [item.isNew ? (item.tempId as number) : item.TestStepDetailId]: true,
            },
            rowErrors: {
                ...state.rowErrors,
                [item.isNew ? (item.tempId as number) : item.TestStepDetailId]: {},
            },
        });
    };

    const handleCancelAll = (): void => {
        setState({
            editingRows: {},
            newRows: [],
            rowErrors: {},
        });
    };

    const validateAllRows = (): boolean => {
        const requiredFields: Array<keyof Pick<TestStepDetail, "TestCaseId" | "TestStepsId" | "StepNo" | "ComponentType">> = [
            "TestCaseId",
            "TestStepsId",
            "StepNo",
            "ComponentType",
        ];
        const newRowErrors: RowErrorMap = {};
        let allValid = true;

        state.newRows.forEach((row) => {
            const rowId = row.tempId as number;
            newRowErrors[rowId] = {};

            requiredFields.forEach((field) => {
                const value = row[field];
                if (value === undefined || value === null || value === "" || (field === "StepNo" && Number(value) <= 0)) {
                    newRowErrors[rowId][field] = "This field is required";
                    allValid = false;
                }
            });

            if (row.Data) {
                try {
                    JSON.parse(row.Data);
                } catch {
                    newRowErrors[rowId]["Data"] = "Invalid JSON format";
                    allValid = false;
                }
            }
        });

        Object.keys(state.editingRows).forEach((idKey) => {
            const numericId = Number.isNaN(Number(idKey)) ? idKey : Number(idKey);
            if (typeof idKey === "string") {
                const row = state.TestStepsDetails.find((t) => t.TestStepDetailId === idKey);
                if (row) {
                    newRowErrors[numericId] = {};
                    requiredFields.forEach((field) => {
                        const value = row[field];
                        if (value === undefined || value === null || value === "" || (field === "StepNo" && Number(value) <= 0)) {
                            newRowErrors[numericId][field] = "This field is required";
                            allValid = false;
                        }
                    });

                    if (row.Data) {
                        try {
                            JSON.parse(row.Data);
                        } catch {
                            newRowErrors[numericId]["Data"] = "Invalid JSON format";
                            allValid = false;
                        }
                    }
                }
            }
        });

        setState({ rowErrors: newRowErrors });
        return allValid;
    };

   const handleSaveAll = async (): Promise<void> => {
        if (!validateAllRows()) return;
        // Validate TestStepsId format
        if (!props.CurrAddEditDetails.TestStepsId || !props.CurrAddEditDetails.TestStepsId.startsWith('TS')) {
            setState({ 
                Error: `Invalid TestStepsId format: "${props.CurrAddEditDetails.TestStepsId}". It must start with "TS" (e.g., TS001)`,
                SavingLoader: false 
            });
            return;
        }

        setState({ SavingLoader: true });

        try {
            const editedRows = Object.keys(state.editingRows)
                .filter((id) => typeof id === "string")
                .map((id) => {
                    return state.TestStepsDetails.find((row) => row.TestStepDetailId === id);
                })
                .filter(Boolean) as TestStepDetail[];

            const rowsToSend: TestStepDetail[] = [...editedRows, ...state.newRows];

            if (rowsToSend.length > 0) {
                for (const row of rowsToSend) {
                    // CRITICAL: Force the correct TestStepsId and TestCaseId
                    row.TestStepsId = props.CurrAddEditDetails.TestStepsId;
                    row.TestCaseId = props.CurrAddEditDetails.TestCaseId;
                    
                    if (row.Data && typeof row.Data === "string") {
                        try {
                            JSON.parse(row.Data);
                        } catch {
                            row.Data = "{}";
                        }
                    }
                    await apiRequest("/AddUpdateTestStepsDetails", row as any);
                }
            }

            setState({
                SavingLoader: false,
                showToast: true,
                editingRows: {},
                newRows: [],
                rowErrors: {},
            });

            await getData();
            setTimeout(() => setState({ showToast: false }), 3000);
        } catch (error) {
            setState({ SavingLoader: false, Error: String(error) });
        }
    };

    const handleDropdownChange = (val: string, _options: unknown, name: string, item: TestStepDetail): void => {
        if (item.isNew) {
            const updatedNewRows = state.newRows.map((row) => {
                if (row.tempId === item.tempId) {
                    return { ...row, [name]: val } as TestStepDetail;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedDetails = state.TestStepsDetails.map((t) => {
                if (t.TestStepDetailId === item.TestStepDetailId) {
                    return { ...t, [name]: val } as TestStepDetail;
                }
                return t;
            });
            setState({ TestStepsDetails: updatedDetails });
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
        name: string,
        item: TestStepDetail
    ): void => {
        if (item.isNew) {
            const updatedNewRows = state.newRows.map((row) => {
                if (row.tempId === item.tempId) {
                    return { ...row, [name]: e.target.value } as TestStepDetail;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedDetails = state.TestStepsDetails.map((t) => {
                if (t.TestStepDetailId === item.TestStepDetailId) {
                    return { ...t, [name]: e.target.value } as TestStepDetail;
                }
                return t;
            });
            setState({ TestStepsDetails: updatedDetails });
        }
    };

    const handlePageChange = (page: number): void => {
        setState({ CurrentPage: page });
        getData(state.SearchQuery, page);
    };

    const handleDeleteItem = async (item: TestStepDetail): Promise<void> => {
        if (item.TestStepDetailId) {
            const resp: any = await apiRequest("/DeleteTestStepsDetails", item as any);
            if (resp) {
                setState({ showToast: true });
                getData();
                setTimeout(() => {
                    setState({ showToast: false });
                }, 3000);
            }
        } else {
            const newRows = state.newRows.filter((row) => row.tempId !== item.tempId);
            const newEditing = { ...state.editingRows };
            if (item.tempId !== undefined) delete newEditing[item.tempId];
            const newErrors = { ...state.rowErrors };
            if (item.tempId !== undefined) delete newErrors[item.tempId];
            setState({
                newRows,
                editingRows: newEditing,
                rowErrors: newErrors,
            });
        }
    };

    const handleSearch = (value: string): void => {
        setState({ SearchQuery: value });
        if (value.trim() === "") {
            getData("");
        }
    };

    const columns: { title: string; key: string; className?: string }[] = [
        { title: "Step No", key: "StepNo", className: "min-w-[100px]" },
        { title: "Test Case ID", key: "TestCaseId", className: "min-w-[120px]" },
        { title: "Test Steps ID", key: "TestStepsId", className: "min-w-[120px]" },
        { title: "Component Type", key: "ComponentType", className: "min-w-[150px]" },
        { title: "Component", key: "Component", className: "min-w-[150px]" },
        { title: "Description", key: "Description", className: "min-w-[300px]" },
        { title: "Expected Result", key: "ExpectedResult", className: "min-w-[300px]" },
        { title: "Data (JSON)", key: "Data", className: "min-w-[200px]" },
    ];

    const allRows: TestStepDetail[] = [...state.newRows, ...state.TestStepsDetails].sort(
        (a, b) => parseInt(String(a.StepNo)) - parseInt(String(b.StepNo))
    );

    const data: ReactNodeRecord[] = allRows.map((item) => {
        const rowId: string | number = item.isNew ? (item.tempId as number) : item.TestStepDetailId;
        const isEditing = state.editingRows[rowId];
        const errors = state.rowErrors[rowId] || {};

        if (isEditing) {
            return {
                StepNo: (
                    <div>
                        <input
                            defaultValue={item.StepNo || ""}
                            onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
                                if (item.StepNo !== e.target.value) {
                                    handleChange(e, "StepNo", item);
                                }
                            }}
                            type="number"
                            min={1}
                            className={`w-full px-3 shadow text-[0.85rem] py-2 border ${errors.StepNo ? "border-red-500" : "border-gray-200"} rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Step No"
                            required
                        />
                        {errors.StepNo && (
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.StepNo}</p>
                            </div>
                        )}
                    </div>
                ),
                TestCaseId: (
                    <div>
                        <Dropdown
                            size="small"
                            mode="single"
                            options={state.TestCaseList}
                            value={item.TestCaseId}
                            onChange={(val: string, option: unknown) => handleDropdownChange(val, option, "TestCaseId", item)}
                            className={errors.TestCaseId ? "border-red-500" : ""}
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
                            className={errors.TestStepsId ? "border-red-500" : ""}
                            placeholder="Select Test Step"
                            disabled={true}  // Add this line
                        />
                        {errors.TestStepsId && (
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.TestStepsId}</p>
                            </div>
                        )}
                    </div>
                ),
                ComponentType: (
                    <div>
                        <Dropdown
                            size="small"
                            mode="single"
                            options={state.ComponentTypeList}
                            value={item.ComponentType}
                            onChange={(val: string, option: unknown) => handleDropdownChange(val, option, "ComponentType", item)}
                            className={errors.ComponentType ? "border-red-500" : ""}
                            placeholder="Select Component Type"
                        />
                        {errors.ComponentType && (
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.ComponentType}</p>
                            </div>
                        )}
                    </div>
                ),
                Component: (
                    <div>
                        <input
                            defaultValue={item.Component || ""}
                            onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
                                if (item.Component !== e.target.value) {
                                    handleChange(e, "Component", item);
                                }
                            }}
                            type="text"
                            className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Component"
                        />
                    </div>
                ),
                Description: (
                    <div>
            <textarea
                defaultValue={item.Description || ""}
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
                ExpectedResult: (
                    <div>
            <textarea
                defaultValue={item.ExpectedResult || ""}
                onBlur={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    if (item.ExpectedResult !== e.target.value) {
                        handleChange(e, "ExpectedResult", item);
                    }
                }}
                rows={2}
                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Expected Result"
            />
                    </div>
                ),
                Data: (
                    <div>
            <textarea
                defaultValue={item.Data || "{}"}
                onBlur={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    if (item.Data !== e.target.value) {
                        handleChange(e, "Data", item);
                    }
                }}
                rows={3}
                className={`w-full px-3 shadow text-[0.85rem] py-2 border ${errors.Data ? "border-red-500" : "border-gray-200"} rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder='{"key": "value"}'
            />
                        {errors.Data && (
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.Data}</p>
                            </div>
                        )}
                    </div>
                ),
                actions: (
                    <div className="relative flex items-center">
                        <ConfirmPopup message="Are you sure you want to delete this step?" onConfirm={() => handleDeleteItem(item)}>
                            <button className="pr-4 flex items-center">
                                <Trash2 className="text-[#1A1A1A] cursor-pointer" />
                            </button>
                        </ConfirmPopup>
                    </div>
                ),
            } as ReactNodeRecord;
        }

        return {
            StepNo: item.StepNo as React.ReactNode,
            TestCaseId: item.TestCaseId,
            TestStepsId: item.TestStepsId,
            ComponentType: state.ComponentTypeList.find(opt => opt.value === item.ComponentType)?.label || item.ComponentType,
            Component: item.Component,
            Description: item.Description,
            ExpectedResult: item.ExpectedResult,
            Data: (
                <div className="max-w-[200px]">
                <pre className="text-xs bg-gray-50 p-2 rounded border overflow-x-auto">
                    {JSON.stringify(JSON.parse(item.Data || "{}"), null, 2)}
                </pre>
                </div>
            ),
            actions: (
                <div className="relative flex items-center">
                    <button onClick={() => handleEdit(item)} className="ml-2 text-white px-3 py-1 rounded text-sm">
                        <SquarePen className="text-[#1A1A1A] cursor-pointer" />
                    </button>
                    <ConfirmPopup message="Are you sure you want to delete this step?" onConfirm={() => handleDeleteItem(item)}>
                        <button className="ml-2 pr-4 flex items-center">
                            <Trash2 className="text-[#1A1A1A] cursor-pointer" />
                        </button>
                    </ConfirmPopup>
                </div>
            ),
        } as ReactNodeRecord;
    });

    const hasEdits = Object.keys(state.editingRows).length > 0 || state.newRows.length > 0;

    if (state.IsLoading)
        return (
            <div className="h-96 py-20">
                <SpinnerV2 {...{ text: "Fetching data..." }} />
            </div>
        );
    if (state.Error) return <ErrorScreen message={state.Error} />;

    return (
        <div className="pt-0 pb-6 px-2">
            <Toast message="Saved successfully!" show={state.showToast} onClose={() => setState({ showToast: false })} />

            <div className="flex justify-between items-center pb-4">
                <div className="w-1/3">
                    <SearchBar currentValue={state.SearchQuery} onSearch={handleSearch} size="medium" />
                </div>

                <div className="flex items-center space-x-2 gap-4">
                    <button
                        onClick={handleAddNew}
                        className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Step</span>
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
        </div>
    );
}