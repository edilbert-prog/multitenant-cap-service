import React, { useEffect, useReducer, useRef } from 'react';
import CustomTable from "../../../utils/CustomTable.jsx";
import { CircleAlert, Plus, Save, Trash2, X, SquarePen } from "lucide-react";
import { apiRequest } from "../../../utils/helpers/ApiHelper.js";
import SpinnerV2 from "../../../utils/SpinnerV2.jsx";
import ErrorScreen from "../../../utils/ErrorScreen.jsx";
import Toast from "../../../utils/Toast.jsx";
import ConfirmPopup from "../../../utils/ConfirmPopup.jsx";
import useDebounce from '../../../utils/helpers/useDebounce.js';
import SearchBar from "../../../utils/SearchBar.jsx";

interface ComponentKeyTestCaseMapping {
    CKTCMID: string;
    TestCaseId: string;
    TestStepsId: string;
    StepNo: string;
    ComponentType: string;
    ComponentId: string;
    KeyType: string;
    KeyName: string;
    SourceComponent: string;
    SourceComponentKeyType: string;
    SourceComponentKeyName: string;
    Status: number;
    isNew?: boolean;
    tempId?: number;
}

type EditingMap = Record<string | number, boolean>;
type FieldErrors = Partial<Record<keyof ComponentKeyTestCaseMapping, string>>;
type RowErrorsMap = Record<string | number, FieldErrors | undefined>;

interface State {
    Error: string;
    Mappings: ComponentKeyTestCaseMapping[];
    SearchQuery: string;
    IsLoading: boolean;
    showToast: boolean;
    SavingLoader: boolean;
    editingRows: EditingMap;
    newRows: ComponentKeyTestCaseMapping[];
    rowErrors: RowErrorsMap;
}

interface Column {
    title: string;
    key: string;
    className?: string;
}

type TableRow = Record<string, React.ReactNode>;

export default function ComponentKeyTestCaseMappingMaster(): JSX.Element {
    const initialState: State = {
        Error: "",
        Mappings: [],
        SearchQuery: "",
        IsLoading: true,
        showToast: false,
        SavingLoader: false,
        editingRows: {},
        newRows: [],
        rowErrors: {},
    };

    const [state, setState] = useReducer(
        (prev: State, next: Partial<State>): State => ({ ...prev, ...next }),
        initialState
    );

    const didFetchData = useRef<boolean>(false);

    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;

        const init = async () => {
            setState({ IsLoading: true });
            await getData("");
            setState({ IsLoading: false });
        };

        void init();
    }, []);

    const getData = async (SearchQuery: string = "") => {
        try {
            const resp: any = await apiRequest("/GetComponentKeyTestCaseMappings", {
                SearchString: SearchQuery
            });

            if (resp.ResponseData && resp.ResponseData.length > 0) {
                setState({ Mappings: resp.ResponseData as ComponentKeyTestCaseMapping[] });
            } else {
                setState({ Mappings: [] });
            }
        } catch (err) {
            setState({ Error: (err as Error).toString() });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const handleAddNew = () => {
        const newRow: ComponentKeyTestCaseMapping = {
            CKTCMID: "",
            TestCaseId: "",
            TestStepsId: "",
            StepNo: "",
            ComponentType: "",
            ComponentId: "",
            KeyType: "",
            KeyName: "",
            SourceComponent: "",
            SourceComponentKeyType: "",
            SourceComponentKeyName: "",
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

    const handleEdit = (item: ComponentKeyTestCaseMapping) => {
        setState({
            editingRows: {
                ...state.editingRows,
                [item.isNew ? (item.tempId as number) : item.CKTCMID]: true
            },
            rowErrors: {
                ...state.rowErrors,
                [item.isNew ? (item.tempId as number) : item.CKTCMID]: {}
            }
        });
    };

    const debouncedSearchQuery: string = useDebounce<string>(state.SearchQuery, 300);
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

    const validateAllRows = (): boolean => {
        const requiredFields: Array<keyof ComponentKeyTestCaseMapping> = [
            "TestCaseId",
            "TestStepsId",
            "StepNo",
            "ComponentType",
            "ComponentId",
            "KeyType",
            "KeyName"
        ];
        const newRowErrors: RowErrorsMap = {};
        let allValid = true;

        state.newRows.forEach((row) => {
            const rowId = row.tempId as number;
            newRowErrors[rowId] = {};

            requiredFields.forEach((field) => {
                const value = row[field];
                if (!value || (typeof value === 'string' && value.trim() === "")) {
                    if (!newRowErrors[rowId]) newRowErrors[rowId] = {};
                    (newRowErrors[rowId] as FieldErrors)[field] = "This field is required";
                    allValid = false;
                }
            });
        });

        Object.keys(state.editingRows).forEach((id) => {
            if (typeof id === 'string') {
                const row = state.Mappings.find((t) => t.CKTCMID === id);
                if (row) {
                    newRowErrors[id] = {};
                    requiredFields.forEach((field) => {
                        const value = row[field];
                        if (!value || (typeof value === 'string' && value.trim() === "")) {
                            if (!newRowErrors[id]) newRowErrors[id] = {};
                            (newRowErrors[id] as FieldErrors)[field] = "This field is required";
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
                .filter((id) => typeof id === 'string')
                .map((id) => {
                    return state.Mappings.find((row) => row.CKTCMID === id);
                })
                .filter((r): r is ComponentKeyTestCaseMapping => Boolean(r));

            const rowsToSend: ComponentKeyTestCaseMapping[] = [...editedRows, ...state.newRows];

            if (rowsToSend.length > 0) {
                for (const row of rowsToSend) {
                    await apiRequest("/AddUpdateComponentKeyTestCaseMapping", row as any);
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

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
        name: keyof ComponentKeyTestCaseMapping,
        item: ComponentKeyTestCaseMapping
    ) => {
        if (item.isNew) {
            const updatedNewRows = state.newRows.map((row) => {
                if (row.tempId === item.tempId) {
                    return { ...row, [name]: e.target.value } as ComponentKeyTestCaseMapping;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedMappings = state.Mappings.map((t) => {
                if (t.CKTCMID === item.CKTCMID) {
                    return { ...t, [name]: e.target.value } as ComponentKeyTestCaseMapping;
                }
                return t;
            });
            setState({ Mappings: updatedMappings });
        }
    };

    const handleDeleteItem = async (item: ComponentKeyTestCaseMapping) => {
        if (item.CKTCMID) {
            const resp: any = await apiRequest("/DeleteComponentKeyTestCaseMapping", item as any);
            if (resp) {
                setState({ showToast: true });
                void getData(state.SearchQuery);
                setTimeout(() => {
                    setState({ showToast: false });
                }, 3000);
            }
        } else {
            setState({
                newRows: state.newRows.filter((row) => row.tempId !== item.tempId),
                editingRows: {
                    ...state.editingRows,
                    [item.tempId as number]: false
                },
                rowErrors: {
                    ...state.rowErrors,
                    [item.tempId as number]: undefined
                }
            });
        }
    };

    const handleSearch = (value: string) => {
        setState({ SearchQuery: value });
        if (value.trim() === "") {
            void getData("");
        }
    };

    const columns: Column[] = [
        { title: 'Test Case ID', key: 'TestCaseId', className: 'min-w-[140px]' },
        { title: 'Test Steps ID', key: 'TestStepsId', className: 'min-w-[140px]' },
        { title: 'Step No', key: 'StepNo', className: 'min-w-[80px]' },
        { title: 'Component Type', key: 'ComponentType', className: 'min-w-[130px]' },
        { title: 'Component ID', key: 'ComponentId', className: 'min-w-[140px]' },
        { title: 'Key Type', key: 'KeyType', className: 'min-w-[100px]' },
        { title: 'Key Name', key: 'KeyName', className: 'min-w-[150px]' },
        { title: 'Source Component', key: 'SourceComponent', className: 'min-w-[140px]' },
        { title: 'Source Key Type', key: 'SourceComponentKeyType', className: 'min-w-[130px]' },
        { title: 'Source Key Name', key: 'SourceComponentKeyName', className: 'min-w-[150px]' },
    ];

    const componentTypeOptions = ["Execution", "Validation", "Transformation"];
    const keyTypeOptions = ["Input", "OutPut"];

    const allRows: ComponentKeyTestCaseMapping[] = [...state.newRows, ...state.Mappings];

    const data: TableRow[] = allRows.map((item) => {
        const rowId = item.isNew ? (item.tempId as number) : item.CKTCMID;
        const isEditing = state.editingRows[rowId];
        const errors: FieldErrors = state.rowErrors[rowId] || {};

        if (isEditing) {
            return {
                TestCaseId: (
                    <div>
                        <input
                            defaultValue={item.TestCaseId || ''}
                            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                if (item.TestCaseId !== e.target.value) {
                                    handleChange(e as unknown as React.ChangeEvent<HTMLInputElement>, "TestCaseId", item);
                                }
                            }}
                            type="text"
                            className={`w-full px-3 shadow text-[0.85rem] py-2 border ${errors.TestCaseId ? 'border-red-500' : 'border-gray-200'} rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Test Case ID"
                            required
                        />
                        {errors.TestCaseId &&
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.TestCaseId}</p>
                            </div>
                        }
                    </div>
                ),
                TestStepsId: (
                    <div>
                        <input
                            defaultValue={item.TestStepsId || ''}
                            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                if (item.TestStepsId !== e.target.value) {
                                    handleChange(e as unknown as React.ChangeEvent<HTMLInputElement>, "TestStepsId", item);
                                }
                            }}
                            type="text"
                            className={`w-full px-3 shadow text-[0.85rem] py-2 border ${errors.TestStepsId ? 'border-red-500' : 'border-gray-200'} rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Test Steps ID"
                            required
                        />
                        {errors.TestStepsId &&
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.TestStepsId}</p>
                            </div>
                        }
                    </div>
                ),
                StepNo: (
                    <div>
                        <input
                            defaultValue={item.StepNo || ''}
                            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                if (item.StepNo !== e.target.value) {
                                    handleChange(e as unknown as React.ChangeEvent<HTMLInputElement>, "StepNo", item);
                                }
                            }}
                            type="text"
                            className={`w-full px-3 shadow text-[0.85rem] py-2 border ${errors.StepNo ? 'border-red-500' : 'border-gray-200'} rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Step No"
                            required
                        />
                        {errors.StepNo &&
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.StepNo}</p>
                            </div>
                        }
                    </div>
                ),
                ComponentType: (
                    <div>
                        <select
                            defaultValue={item.ComponentType || ''}
                            onChange={(e) => handleChange(e, "ComponentType", item)}
                            className={`w-full px-3 shadow text-[0.85rem] py-2 border ${errors.ComponentType ? 'border-red-500' : 'border-gray-200'} rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            required
                        >
                            <option value="">Select Type</option>
                            {componentTypeOptions.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                        {errors.ComponentType &&
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.ComponentType}</p>
                            </div>
                        }
                    </div>
                ),
                ComponentId: (
                    <div>
                        <input
                            defaultValue={item.ComponentId || ''}
                            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                if (item.ComponentId !== e.target.value) {
                                    handleChange(e as unknown as React.ChangeEvent<HTMLInputElement>, "ComponentId", item);
                                }
                            }}
                            type="text"
                            className={`w-full px-3 shadow text-[0.85rem] py-2 border ${errors.ComponentId ? 'border-red-500' : 'border-gray-200'} rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Component ID"
                            required
                        />
                        {errors.ComponentId &&
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.ComponentId}</p>
                            </div>
                        }
                    </div>
                ),
                KeyType: (
                    <div>
                        <select
                            defaultValue={item.KeyType || ''}
                            onChange={(e) => handleChange(e, "KeyType", item)}
                            className={`w-full px-3 shadow text-[0.85rem] py-2 border ${errors.KeyType ? 'border-red-500' : 'border-gray-200'} rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            required
                        >
                            <option value="">Select Key Type</option>
                            {keyTypeOptions.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                        {errors.KeyType &&
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.KeyType}</p>
                            </div>
                        }
                    </div>
                ),
                KeyName: (
                    <div>
                        <input
                            defaultValue={item.KeyName || ''}
                            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                if (item.KeyName !== e.target.value) {
                                    handleChange(e as unknown as React.ChangeEvent<HTMLInputElement>, "KeyName", item);
                                }
                            }}
                            type="text"
                            className={`w-full px-3 shadow text-[0.85rem] py-2 border ${errors.KeyName ? 'border-red-500' : 'border-gray-200'} rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Key Name"
                            required
                        />
                        {errors.KeyName &&
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.KeyName}</p>
                            </div>
                        }
                    </div>
                ),
                SourceComponent: (
                    <div>
                        <input
                            defaultValue={item.SourceComponent || ''}
                            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                if (item.SourceComponent !== e.target.value) {
                                    handleChange(e as unknown as React.ChangeEvent<HTMLInputElement>, "SourceComponent", item);
                                }
                            }}
                            type="text"
                            className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Source Component"
                        />
                    </div>
                ),
                SourceComponentKeyType: (
                    <div>
                        <select
                            defaultValue={item.SourceComponentKeyType || ''}
                            onChange={(e) => handleChange(e, "SourceComponentKeyType", item)}
                            className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Type</option>
                            {keyTypeOptions.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                ),
                SourceComponentKeyName: (
                    <div>
                        <input
                            defaultValue={item.SourceComponentKeyName || ''}
                            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                if (item.SourceComponentKeyName !== e.target.value) {
                                    handleChange(e as unknown as React.ChangeEvent<HTMLInputElement>, "SourceComponentKeyName", item);
                                }
                            }}
                            type="text"
                            className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Source Key Name"
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
            };
        }

        return {
            TestCaseId: item.TestCaseId,
            TestStepsId: item.TestStepsId,
            StepNo: item.StepNo,
            ComponentType: item.ComponentType,
            ComponentId: item.ComponentId,
            KeyType: item.KeyType,
            KeyName: item.KeyName,
            SourceComponent: item.SourceComponent || '-',
            SourceComponentKeyType: item.SourceComponentKeyType || '-',
            SourceComponentKeyName: item.SourceComponentKeyName || '-',
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
        };
    });

    const hasEdits = Object.keys(state.editingRows).length > 0 || state.newRows.length > 0;

    if (state.IsLoading) return <div className="h-96 py-20"><SpinnerV2 {...{ text: "Fetching data..." }} /></div>;
    if (state.Error) return <ErrorScreen message={state.Error} />;

    return (
        <div className="pt-0 pb-6 px-6">
            <Toast
                message="Saved successfully!"
                show={state.showToast}
                onClose={() => setState({ showToast: false })}
            />

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

            <div className="overflow-x-auto">
                <CustomTable columns={columns} data={data} responsive={true} />
            </div>
        </div>
    );
}