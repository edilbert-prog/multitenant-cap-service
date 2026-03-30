import React, { useEffect, useReducer, useRef } from 'react';
import CustomTable from "../../../utils/CustomTable.jsx";
import { CircleAlert, Plus, Save, Trash2, X, SquarePen } from "lucide-react";
import { apiRequest } from "../../../utils/helpers/ApiHelper.js";
import SpinnerV2 from "../../../utils/SpinnerV2.jsx";
import ErrorScreen from "../../../utils/ErrorScreen.jsx";
import Pagination from "../../../utils/Pagination.jsx";
import Toast from "../../../utils/Toast.jsx";
import ConfirmPopup from "../../../utils/ConfirmPopup.jsx";
import useDebounce from '../../../utils/helpers/useDebounce.js';
import SearchBar from "../../../utils/SearchBar.jsx";
import CustomInput from "../../../utils/CustomInput.js";
import { hasChanges } from "../../../utils/helpers/dataComparison.ts";

interface ComponentType {
    ComponentTypeId: string;
    ComponentTypeName: string;
    Description: string;
    Status: number;
    isNew?: boolean;
    tempId?: number;
    SortKey?: number;
}

type EditingMap = Record<string | number, boolean>;
type FieldErrors = Partial<Record<keyof ComponentType | 'ComponentTypeName' | 'Description', string>>;
type RowErrorsMap = Record<string | number, FieldErrors | undefined>;

interface State {
    Error: string;
    ComponentTypes: ComponentType[];
    OriginalComponentTypes: ComponentType[]; // To store the pristine data
    SearchQuery: string;
    CurrentPage: number;
    TotalRecords: number;
    IsLoading: boolean;
    showToast: boolean;
    SavingLoader: boolean;
    editingRows: EditingMap;
    newRows: ComponentType[];
    rowErrors: RowErrorsMap;
}

interface Column {
    title: string;
    key: string;
    className?: string;
}

type TableRow = Record<string, React.ReactNode>;

export default function ComponentTypesMaster(): JSX.Element {
    const initialState: State = {
        Error: "",
        ComponentTypes: [],
        OriginalComponentTypes: [],
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

    const getData = async (SearchQuery: string = "", PageNo: number = 1) => {
        try {
            const resp: any = await apiRequest("/GetComponentTypesMasterPaginationFilterSearch", {
                PageNo,
                StartDate: "",
                EndDate: "",
                SearchString: SearchQuery
            });

            if (resp.ResponseData.length > 0) {
                const componentTypes = resp.ResponseData as ComponentType[];
                setState({
                    ComponentTypes: componentTypes,
                    OriginalComponentTypes: JSON.parse(JSON.stringify(componentTypes)), // Deep copy for comparison
                    TotalRecords: resp.TotalRecords as number
                });
            } else {
                setState({ ComponentTypes: [], OriginalComponentTypes: [], TotalRecords: 0 });
            }
        } catch (err) {
            setState({ Error: (err as Error).toString() });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const handleAddNew = () => {
        const newRow: ComponentType = {
            ComponentTypeId: "",
            ComponentTypeName: "",
            Description: "",
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

    const handleEdit = (item: ComponentType) => {
        setState({
            editingRows: {
                ...state.editingRows,
                [item.isNew ? (item.tempId as number) : item.ComponentTypeId]: true
            },
            rowErrors: {
                ...state.rowErrors,
                [item.isNew ? (item.tempId as number) : item.ComponentTypeId]: {}
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
        const requiredFields: Array<keyof ComponentType> = ["ComponentTypeName"];
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
                const row = state.ComponentTypes.find((t) => t.ComponentTypeId === id);
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
                .map((id) => state.ComponentTypes.find((row) => row.ComponentTypeId === id))
                .filter((r): r is ComponentType => {
                    if (!r) return false;
                    const originalRow = state.OriginalComponentTypes.find(o => o.ComponentTypeId === r.ComponentTypeId);
                    if (!originalRow) return true; 
                    return hasChanges(originalRow, r);
                });
            
            const rowsToSend: ComponentType[] = [...editedRows, ...state.newRows];

            if (rowsToSend.length > 0) {
                for (const row of rowsToSend) {
                    await apiRequest("/AddUpdateComponentTypesMaster", row as any);
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
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
        name: keyof Pick<ComponentType, 'ComponentTypeName' | 'Description' | 'SortKey'>,
        item: ComponentType
    ) => {
        if (item.isNew) {
            const updatedNewRows = state.newRows.map((row) => {
                if (row.tempId === item.tempId) {
                    return { ...row, [name]: e.target.value } as ComponentType;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedTypes = state.ComponentTypes.map((t) => {
                if (t.ComponentTypeId === item.ComponentTypeId) {
                    return { ...t, [name]: e.target.value } as ComponentType;
                }
                return t;
            });
            setState({ ComponentTypes: updatedTypes });
        }
    };

    const handlePageChange = (page: number) => {
        setState({ CurrentPage: page });
        void getData(state.SearchQuery, page);
    };

    const handleDeleteItem = async (item: ComponentType) => {
        if (item.ComponentTypeId) {
            const resp: any = await apiRequest("/DeleteComponentTypesMaster", item as any);
            if (resp) {
                setState({ showToast: true });
                void getData(state.SearchQuery, state.CurrentPage);
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
            void getData("", 1);
        }
    };

    const columns: Column[] = [
        { title: 'Component Type Name', key: 'ComponentTypeName' },
        { title: 'Description', key: 'Description', className: 'min-w-[300px]' },
        // {title: 'Sort Key', key: 'SortKey'},
    ];

    const allRows: ComponentType[] = [...state.newRows, ...state.ComponentTypes];

    const data: TableRow[] = allRows.map((item) => {
        const rowId = item.isNew ? (item.tempId as number) : item.ComponentTypeId;
        const isEditing = state.editingRows[rowId];
        const errors: FieldErrors = state.rowErrors[rowId] || {};

        if (isEditing) {
            return {
                ComponentTypeName: (
                    <CustomInput
                        value={item.ComponentTypeName || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            handleChange(e, "ComponentTypeName", item);
                        }}
                        dataType="alphanumeric"
                        maxLength={100}
                        placeholder="Enter Component Type Name"
                        error={errors.ComponentTypeName}
                    />
                ),
                Description: (
                    <CustomInput
                        inputType="textarea"
                        value={item.Description || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                            handleChange(e, "Description", item);
                        }}
                        dataType="text"
                        maxLength={500}
                        rows={2}
                        placeholder="Enter Description"
                    />
                ),
                /* SortKey: (
                    <div>
                        <input
                            defaultValue={item.SortKey || 0}
                            onBlur={(e) => {
                                if (item.SortKey !== e.target.value) {
                                    handleChange(e, "SortKey", item);
                                }
                            }}
                            type="number"
                            min="0"
                            className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Sort Key"
                        />
                    </div>
                ), */
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
            ComponentTypeName: item.ComponentTypeName,
            Description: item.Description,
            // SortKey: item.SortKey,
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
