import React, { useEffect, useReducer } from "react";
import CustomTable from "../../../../utils/CustomTable.js";
import { CircleAlert, Plus, Save, Trash2, X, SquarePen } from "lucide-react";
import { apiRequest } from "../../../../utils/helpers/ApiHelper.js";
import SpinnerV2 from "../../../../utils/SpinnerV2.js";
import Toast from "../../../../utils/Toast.js";
import ConfirmPopup from "../../../../utils/ConfirmPopup.js";
import Dropdown from "../../../../utils/Dropdown.js";

type ReactNodeRecord = Record<string, React.ReactNode>;

interface Option {
    value: string;
    label: string;
}

interface TestCaseResult {
    TestCaseResultId: string;
    TestStepsId: string;
    StepNo: number | string;
    Result: "none" | "pass" | "fail";
    ResponseData: string;
    Status: number;
    isNew?: boolean;
    tempId?: number;
}

interface State {
    TestCaseResults: TestCaseResult[];
    IsLoading: boolean;
    showToast: boolean;
    SavingLoader: boolean;
    editingRows: Record<string | number, boolean>;
    newRows: TestCaseResult[];
    rowErrors: Record<string | number, Record<string, string>>;
}

type Action = Partial<State>;

type Props = {
    TestStepsId: string;
};

const initialState: State = {
    TestCaseResults: [],
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

export default function TestCaseResultsMaster(props: Props) {
    // console.log("Test case result =>", props.TestStepsId);
    const [state, setState] = useReducer<typeof reducer, State>(reducer, initialState);

    const resultOptions: Option[] = [
        { value: "none", label: "None" },
        { value: "pass", label: "Pass" },
        { value: "fail", label: "Fail" },
    ];

    useEffect(() => {
        const init = async () => {
            setState({ IsLoading: true });
            await getData();
            setState({ IsLoading: false });
        };
        init();
    }, []);

    const getData = async (): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetTestCaseResults", {
                TestStepsId: props.TestStepsId,
            });
            if (resp.ResponseData && resp.ResponseData.length > 0) {
                setState({ TestCaseResults: resp.ResponseData as TestCaseResult[] });
            } else {
                setState({ TestCaseResults: [] });
            }
        } catch (err) {
            console.error("Error fetching test case results:", err);
        } finally {
            setState({ IsLoading: false });
        }
    };

    const handleAddNew = (): void => {
        const existingStepNos = [...state.TestCaseResults, ...state.newRows].map(
            (item) => parseInt(String(item.StepNo)) || 0
        );
        const nextStepNo = existingStepNos.length > 0 ? Math.max(...existingStepNos) + 1 : 1;

        const newRow: TestCaseResult = {
            TestCaseResultId: "",
            TestStepsId: props.TestStepsId,
            StepNo: nextStepNo,
            Result: "none",
            ResponseData: "",
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

    const handleEdit = (item: TestCaseResult): void => {
        setState({
            editingRows: {
                ...state.editingRows,
                [item.isNew ? (item.tempId as number) : item.TestCaseResultId]: true,
            },
            rowErrors: {
                ...state.rowErrors,
                [item.isNew ? (item.tempId as number) : item.TestCaseResultId]: {},
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
        const requiredFields: Array<keyof Pick<TestCaseResult, "StepNo">> = ["StepNo"];
        const newRowErrors: Record<string | number, Record<string, string>> = {};
        let allValid = true;

        state.newRows.forEach((row) => {
            const rowId = row.tempId as number;
            newRowErrors[rowId] = {};

            requiredFields.forEach((field) => {
                const value = row[field];
                if (
                    value === undefined ||
                    value === null ||
                    value === "" ||
                    (field === "StepNo" && Number(value) <= 0)
                ) {
                    newRowErrors[rowId][field] = "This field is required";
                    allValid = false;
                }
            });
        });

        Object.keys(state.editingRows).forEach((idKey) => {
            const numericId = Number.isNaN(Number(idKey)) ? idKey : Number(idKey);
            if (typeof idKey === "string") {
                const row = state.TestCaseResults.find((t) => t.TestCaseResultId === idKey);
                if (row) {
                    newRowErrors[numericId] = {};
                    requiredFields.forEach((field) => {
                        const value = row[field];
                        if (
                            value === undefined ||
                            value === null ||
                            value === "" ||
                            (field === "StepNo" && Number(value) <= 0)
                        ) {
                            newRowErrors[numericId][field] = "This field is required";
                            allValid = false;
                        }
                    });
                }
            }
        });

        setState({ rowErrors: newRowErrors });
        return allValid;
    };

    const handleSaveAll = async (): Promise<void> => {
        if (!validateAllRows()) return;

        setState({ SavingLoader: true });

        try {
            const editedRows = Object.keys(state.editingRows)
                .filter((id) => typeof id === "string")
                .map((id) => state.TestCaseResults.find((row) => row.TestCaseResultId === id))
                .filter(Boolean) as TestCaseResult[];

            const rowsToSend: TestCaseResult[] = [...editedRows, ...state.newRows];

            if (rowsToSend.length > 0) {
                for (const row of rowsToSend) {
                    // Ensure TestStepsId is set
                    const dataToSend = {
                        ...row,
                        TestStepsId: props.TestStepsId
                    };
                    await apiRequest("/AddUpdateTestCaseResults", dataToSend as any);
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
            setState({ SavingLoader: false });
            console.error("Error saving:", error);
        }
    };

    const handleDropdownChange = (val: string, _options: unknown, name: string, item: TestCaseResult): void => {
        if (item.isNew) {
            const updatedNewRows = state.newRows.map((row) => {
                if (row.tempId === item.tempId) {
                    return { ...row, [name]: val } as TestCaseResult;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedResults = state.TestCaseResults.map((t) => {
                if (t.TestCaseResultId === item.TestCaseResultId) {
                    return { ...t, [name]: val } as TestCaseResult;
                }
                return t;
            });
            setState({ TestCaseResults: updatedResults });
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
        name: string,
        item: TestCaseResult
    ): void => {
        if (item.isNew) {
            const updatedNewRows = state.newRows.map((row) => {
                if (row.tempId === item.tempId) {
                    return { ...row, [name]: e.target.value } as TestCaseResult;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedResults = state.TestCaseResults.map((t) => {
                if (t.TestCaseResultId === item.TestCaseResultId) {
                    return { ...t, [name]: e.target.value } as TestCaseResult;
                }
                return t;
            });
            setState({ TestCaseResults: updatedResults });
        }
    };

    const handleDeleteItem = async (item: TestCaseResult): Promise<void> => {
        if (item.TestCaseResultId) {
            const resp: any = await apiRequest("/DeleteTestCaseResults", item as any);
            if (resp) {
                setState({ showToast: true });
                getData();
                setTimeout(() => setState({ showToast: false }), 3000);
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

    const columns: { title: string; key: string; className?: string }[] = [
        { title: "Step No", key: "StepNo", className: "min-w-[100px]" },
        { title: "Result", key: "Result", className: "min-w-[120px]" },
        { title: "Response Data", key: "ResponseData", className: "min-w-[400px]" },
    ];

    const allRows: TestCaseResult[] = [...state.newRows, ...state.TestCaseResults].sort(
        (a, b) => parseInt(String(a.StepNo)) - parseInt(String(b.StepNo))
    );

    const data: ReactNodeRecord[] = allRows.map((item) => {
        const rowId: string | number = item.isNew ? (item.tempId as number) : item.TestCaseResultId;
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
                            className={`w-full px-3 shadow text-[0.85rem] py-2 border ${
                                errors.StepNo ? "border-red-500" : "border-gray-200"
                            } rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
                Result: (
                    <div>
                        <Dropdown
                            size="small"
                            mode="single"
                            options={resultOptions}
                            value={item.Result}
                            onChange={(val: string, option: unknown) =>
                                handleDropdownChange(val, option, "Result", item)
                            }
                            placeholder="Select Result"
                        />
                    </div>
                ),
                ResponseData: (
                    <div>
                        <textarea
                            defaultValue={item.ResponseData || ""}
                            onBlur={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                if (item.ResponseData !== e.target.value) {
                                    handleChange(e, "ResponseData", item);
                                }
                            }}
                            rows={3}
                            className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter Response Data"
                        />
                    </div>
                ),
                actions: (
                    <div className="relative flex items-center">
                        <ConfirmPopup
                            message="Are you sure you want to delete this result?"
                            onConfirm={() => handleDeleteItem(item)}
                        >
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
            Result: (
                <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                        item.Result === "pass"
                            ? "bg-green-100 text-green-800"
                            : item.Result === "fail"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                >
                    {item.Result.charAt(0).toUpperCase() + item.Result.slice(1)}
                </span>
            ),
            ResponseData: (
                <div className="max-w-[400px]">
                    <p className="text-sm text-gray-700 break-words whitespace-pre-wrap">
                        {item.ResponseData || "-"}
                    </p>
                </div>
            ),
            actions: (
                <div className="relative flex items-center">
                    <button
                        onClick={() => handleEdit(item)}
                        className="ml-2 text-white px-3 py-1 rounded text-sm"
                    >
                        <SquarePen className="text-[#1A1A1A] cursor-pointer" />
                    </button>
                    <ConfirmPopup
                        message="Are you sure you want to delete this result?"
                        onConfirm={() => handleDeleteItem(item)}
                    >
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

    return (
        <div className="pt-4">
            <Toast
                message="Saved successfully!"
                show={state.showToast}
                onClose={() => setState({ showToast: false })}
            />

            <div className="flex justify-end items-center pb-4">
                <div className="flex items-center space-x-2 gap-4">
                    <button
                        onClick={handleAddNew}
                        className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Result</span>
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
        </div>
    );
}