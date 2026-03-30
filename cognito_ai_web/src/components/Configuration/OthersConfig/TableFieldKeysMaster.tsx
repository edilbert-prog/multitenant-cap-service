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
import Dropdown from "../../../utils/DropdownV2.jsx";

interface TableFieldKey {
    TFKMID: number | null;
    TableName: string;
    FieldName: string;
    KeyName: string;
    Status: number;
    isNew?: boolean;
    tempId?: number;
}

type EditingMap = Record<string | number, boolean>;
type FieldErrors = Partial<Record<keyof TableFieldKey, string>>;
type RowErrorsMap = Record<string | number, FieldErrors | undefined>;

interface DropdownOption {
    value: string;
    label: string;
    [key: string]: any;
}

interface State {
    Error: string;
    TableFieldKeys: TableFieldKey[];
    SearchQuery: string;
    IsLoading: boolean;
    showToast: boolean;
    SavingLoader: boolean;
    editingRows: EditingMap;
    newRows: TableFieldKey[];
    rowErrors: RowErrorsMap;
    tableNameOptions: DropdownOption[];
    fieldNameOptionsMap: Record<string | number, DropdownOption[]>; // Per-row field options
    loadingTableNames: boolean;
    loadingFieldNames: Record<string | number, boolean>;
    tableNameSearchQuery: string;
    fieldNameSearchQueryMap: Record<string | number, string>; // Per-row search query
}

interface Column {
    title: string;
    key: string;
    className?: string;
}

type TableRow = Record<string, React.ReactNode>;

export default function TableFieldKeysMaster(): JSX.Element {
    const initialState: State = {
        Error: "",
        TableFieldKeys: [],
        SearchQuery: "",
        IsLoading: true,
        showToast: false,
        SavingLoader: false,
        editingRows: {},
        newRows: [],
        rowErrors: {},
        tableNameOptions: [],
        fieldNameOptionsMap: {}, // Changed from single array to map
        loadingTableNames: false,
        loadingFieldNames: {},
        tableNameSearchQuery: "",
        fieldNameSearchQueryMap: {}, // Changed from single string to map
    };

    const [state, setState] = useReducer(
        (prev: State, next: Partial<State>): State => ({ ...prev, ...next }),
        initialState
    );

    const didFetchData = useRef<boolean>(false);

    // Debounce for table name search
    const debouncedTableNameSearch = useDebounce(state.tableNameSearchQuery, 300);

    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;

        const init = async () => {
            setState({ IsLoading: true });
            await Promise.all([
                getData(""),
                getTableNames("")
            ]);
            setState({ IsLoading: false });
        };

        void init();
    }, []);

    // Dynamic search for table names
    useEffect(() => {
        if (!didFetchData.current) return;
        void getTableNames(debouncedTableNameSearch);
    }, [debouncedTableNameSearch]);

    const getTableNames = async (searchQuery: string = "") => {
        console.log("Fetching table names with search:", searchQuery);
        setState({ loadingTableNames: true });
        try {
            const resp: any = await apiRequest("/GetDistinctParentTableNames", {
                SearchString: searchQuery
            });
            console.log("Table names response:", resp);

            if (resp.ResponseData && resp.ResponseData.length > 0) {
                setState({ tableNameOptions: resp.ResponseData as DropdownOption[] });
            } else {
                setState({ tableNameOptions: [] });
            }
        } catch (err) {
            console.error("Error fetching table names:", err);
        } finally {
            setState({ loadingTableNames: false });
        }
    };

    const getFieldNames = async (tableName: string, rowId: string | number, searchQuery: string = "") => {
        console.log("Fetching field names for table:", tableName, "row:", rowId, "with search:", searchQuery);
        setState({
            loadingFieldNames: {
                ...state.loadingFieldNames,
                [rowId]: true
            }
        });
        try {
            const resp: any = await apiRequest("/GetParentFieldNamesByTable", {
                ParentTableName: tableName,
                SearchString: searchQuery
            });
            console.log("Field names response for row", rowId, ":", resp);

            if (resp.ResponseData && resp.ResponseData.length > 0) {
                // Store field options per row
                setState({ 
                    fieldNameOptionsMap: {
                        ...state.fieldNameOptionsMap,
                        [rowId]: resp.ResponseData as DropdownOption[]
                    }
                });
            } else {
                setState({ 
                    fieldNameOptionsMap: {
                        ...state.fieldNameOptionsMap,
                        [rowId]: []
                    }
                });
            }
        } catch (err) {
            console.error("Error fetching field names:", err);
        } finally {
            setState({
                loadingFieldNames: {
                    ...state.loadingFieldNames,
                    [rowId]: false
                }
            });
        }
    };

    const getData = async (SearchQuery: string = "") => {
        try {
            const resp: any = await apiRequest("/GetTableFieldKeys", {
                SearchString: SearchQuery
            });

            if (resp.ResponseData && resp.ResponseData.length > 0) {
                setState({ TableFieldKeys: resp.ResponseData as TableFieldKey[] });
            } else {
                setState({ TableFieldKeys: [] });
            }
        } catch (err) {
            setState({ Error: (err as Error).toString() });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const handleAddNew = () => {
        const newRow: TableFieldKey = {
            TFKMID: null,
            TableName: "",
            FieldName: "",
            KeyName: "",
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

    const handleTableNameChange = async (val: string, option: unknown, item: TableFieldKey) => {
        console.log("Table name changed:", val);
        const rowId = item.isNew ? item.tempId! : item.TFKMID!;

        // Update the table name and reset field name
        if (item.isNew) {
            const updatedNewRows = state.newRows.map(row =>
                row.tempId === item.tempId
                    ? { ...row, TableName: val, FieldName: "" }
                    : row
            );
            setState({ newRows: updatedNewRows });
        } else {
            const updatedKeys = state.TableFieldKeys.map(row =>
                row.TFKMID === item.TFKMID
                    ? { ...row, TableName: val, FieldName: "" }
                    : row
            );
            setState({ TableFieldKeys: updatedKeys });
        }

        // Clear field name error
        const currentErrors = state.rowErrors[rowId] || {};
        delete currentErrors.FieldName;
        setState({
            rowErrors: {
                ...state.rowErrors,
                [rowId]: currentErrors
            }
        });

        // Fetch field names for the selected table for THIS ROW ONLY
        if (val) {
            // Reset field search for this row
            const updatedFieldSearchMap = { ...state.fieldNameSearchQueryMap };
            updatedFieldSearchMap[rowId] = "";
            setState({ fieldNameSearchQueryMap: updatedFieldSearchMap });
            
            await getFieldNames(val, rowId, "");
        } else {
            // Clear field options for this row
            const updatedOptionsMap = { ...state.fieldNameOptionsMap };
            delete updatedOptionsMap[rowId];
            setState({ fieldNameOptionsMap: updatedOptionsMap });
        }
    };

    const handleFieldNameChange = (val: string, option: unknown, item: TableFieldKey) => {
        console.log("Field name changed:", val);
        if (item.isNew) {
            const updatedNewRows = state.newRows.map(row =>
                row.tempId === item.tempId
                    ? { ...row, FieldName: val }
                    : row
            );
            setState({ newRows: updatedNewRows });
        } else {
            const updatedKeys = state.TableFieldKeys.map(row =>
                row.TFKMID === item.TFKMID
                    ? { ...row, FieldName: val }
                    : row
            );
            setState({ TableFieldKeys: updatedKeys });
        }
    };

    const handleFieldNameSearch = (query: string, rowId: string | number, item: TableFieldKey) => {
        console.log("Field name search for row", rowId, ":", query);
        
        // Update search query for this row
        const updatedFieldSearchMap = { ...state.fieldNameSearchQueryMap };
        updatedFieldSearchMap[rowId] = query;
        setState({ fieldNameSearchQueryMap: updatedFieldSearchMap });

        // Debounced search - call API after user stops typing
        if (item.TableName) {
            // Use setTimeout to debounce per row
            setTimeout(() => {
                if (state.fieldNameSearchQueryMap[rowId] === query) {
                    void getFieldNames(item.TableName, rowId, query);
                }
            }, 300);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        field: keyof TableFieldKey,
        item: TableFieldKey
    ) => {
        const value = e.target.value;

        if (item.isNew) {
            const updatedNewRows = state.newRows.map(row =>
                row.tempId === item.tempId ? { ...row, [field]: value } : row
            );
            setState({ newRows: updatedNewRows });
        } else {
            const updatedKeys = state.TableFieldKeys.map(row =>
                row.TFKMID === item.TFKMID ? { ...row, [field]: value } : row
            );
            setState({ TableFieldKeys: updatedKeys });
        }
    };

    const validateRow = (item: TableFieldKey): FieldErrors => {
        const errors: FieldErrors = {};

        if (!item.TableName || item.TableName.trim() === '') {
            errors.TableName = 'Table Name is required';
        }
        if (!item.FieldName || item.FieldName.trim() === '') {
            errors.FieldName = 'Field Name is required';
        }
        if (!item.KeyName || item.KeyName.trim() === '') {
            errors.KeyName = 'Key Name is required';
        }

        return errors;
    };

    const handleSaveAll = async () => {
        setState({ SavingLoader: true });

        const allRows = [...state.newRows, ...state.TableFieldKeys.filter(key =>
            state.editingRows[key.TFKMID!]
        )];

        const newRowErrors: RowErrorsMap = {};
        let hasErrors = false;

        allRows.forEach(row => {
            const rowId = row.isNew ? row.tempId! : row.TFKMID!;
            const errors = validateRow(row);

            if (Object.keys(errors).length > 0) {
                newRowErrors[rowId] = errors;
                hasErrors = true;
            }
        });

        if (hasErrors) {
            setState({
                rowErrors: newRowErrors,
                SavingLoader: false
            });
            return;
        }

        try {
            const savePromises = allRows.map(async (row) => {
                const payload: any = {
                    TFKMID: row.isNew ? null : row.TFKMID,
                    TableName: row.TableName,
                    FieldName: row.FieldName,
                    KeyName: row.KeyName
                };

                const resp = await apiRequest("/AddUpdateTableFieldKey", payload);
                return resp;
            });

            await Promise.all(savePromises);

            setState({
                showToast: true,
                SavingLoader: false,
                editingRows: {},
                newRows: [],
                rowErrors: {},
                fieldNameOptionsMap: {}, // Clear all field options
                fieldNameSearchQueryMap: {} // Clear all field searches
            });

            await getData(state.SearchQuery);

        } catch (err) {
            console.error("Error saving:", err);
            setState({ SavingLoader: false });
        }
    };

    const handleCancelAll = () => {
        setState({
            editingRows: {},
            newRows: [],
            rowErrors: {},
            fieldNameOptionsMap: {},
            tableNameSearchQuery: "",
            fieldNameSearchQueryMap: {}
        });
        void getData(state.SearchQuery);
    };

    const handleEdit = (item: TableFieldKey) => {
        const rowId = item.TFKMID!;
        setState({
            editingRows: {
                ...state.editingRows,
                [rowId]: true
            }
        });

        // Load field names for the current table for this row
        if (item.TableName) {
            void getFieldNames(item.TableName, rowId, "");
        }
    };

    const handleDeleteItem = async (item: TableFieldKey) => {
        if (item.isNew) {
            const updatedNewRows = state.newRows.filter(row => row.tempId !== item.tempId);
            const updatedEditingRows = { ...state.editingRows };
            delete updatedEditingRows[item.tempId!];

            // Clean up field options for this row
            const updatedFieldOptionsMap = { ...state.fieldNameOptionsMap };
            delete updatedFieldOptionsMap[item.tempId!];

            const updatedFieldSearchMap = { ...state.fieldNameSearchQueryMap };
            delete updatedFieldSearchMap[item.tempId!];

            setState({
                newRows: updatedNewRows,
                editingRows: updatedEditingRows,
                fieldNameOptionsMap: updatedFieldOptionsMap,
                fieldNameSearchQueryMap: updatedFieldSearchMap
            });
        } else {
            try {
                await apiRequest("/DeleteTableFieldKey", {
                    TFKMID: item.TFKMID
                });
                
                // Clean up field options for this row
                const updatedFieldOptionsMap = { ...state.fieldNameOptionsMap };
                delete updatedFieldOptionsMap[item.TFKMID!];

                const updatedFieldSearchMap = { ...state.fieldNameSearchQueryMap };
                delete updatedFieldSearchMap[item.TFKMID!];

                setState({
                    fieldNameOptionsMap: updatedFieldOptionsMap,
                    fieldNameSearchQueryMap: updatedFieldSearchMap
                });

                await getData(state.SearchQuery);
            } catch (err) {
                console.error("Error deleting:", err);
            }
        }
    };

    const debouncedSearch = useDebounce(state.SearchQuery, 500);

    useEffect(() => {
        if (!didFetchData.current) return;
        void getData(debouncedSearch);
    }, [debouncedSearch]);

    const handleSearch = (query: string) => {
        setState({ SearchQuery: query });
    };

    const columns: Column[] = [
        { title: "Table Name", key: "TableName" },
        { title: "Field Name", key: "FieldName" },
        { title: "Key Name", key: "KeyName" },
        { title: "Actions", key: "actions", className: "text-right" },
    ];

    const combinedData = [...state.newRows, ...state.TableFieldKeys];

    
    const data: TableRow[] = combinedData.map((item: TableFieldKey) => {
        const rowId = item.isNew ? item.tempId! : item.TFKMID!;
        const isEditing = state.editingRows[rowId];
        const errors: FieldErrors = state.rowErrors[rowId] || {};
        const isLoadingFieldName = state.loadingFieldNames[rowId] || false;
        const fieldNameOptions = state.fieldNameOptionsMap[rowId] || [];

        if (isEditing) {
            return {
                TableName: (
                    <div>
                        <Dropdown
                            size="small"
                            mode="single"
                            options={state.tableNameOptions}
                            value={item.TableName}
                            onChange={(val: string, option: unknown) => {
                                console.log("Dropdown onChange triggered");
                                void handleTableNameChange(val, option, item);
                            }}
                            onSearch={(query: string) => {
                                console.log("Table name search:", query);
                                setState({ tableNameSearchQuery: query });
                            }}
                            className={errors.TableName ? 'border-red-500' : ''}
                            placeholder="Select Table"
                            showSearch={true}
                        />
                        {errors.TableName && (
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.TableName}</p>
                            </div>
                        )}
                    </div>
                ),
                FieldName: (
                    <div>
                        <Dropdown
                            size="small"
                            mode="single"
                            options={fieldNameOptions}
                            value={item.FieldName}
                            onChange={(val: string, option: unknown) => {
                                console.log("FieldName dropdown onChange triggered");
                                handleFieldNameChange(val, option, item);
                            }}
                            onSearch={(query: string) => {
                                handleFieldNameSearch(query, rowId, item);
                            }}
                            className={errors.FieldName ? 'border-red-500' : ''}
                            placeholder={
                                isLoadingFieldName ? "Loading..." : 
                                !item.TableName ? "Select Table first" : 
                                fieldNameOptions.length === 0 ? "No fields available" :
                                "Select Field"
                            }
                            disabled={!item.TableName || isLoadingFieldName}
                            showSearch={true}
                        />
                        {errors.FieldName && (
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.FieldName}</p>
                            </div>
                        )}
                    </div>
                ),
                KeyName: (
                    <div>
                        <input
                            value={item.KeyName || ''}
                            onChange={(e) => handleChange(e, "KeyName", item)}
                            type="text"
                            className={`w-full px-3 shadow text-[0.85rem] py-2 border ${errors.KeyName ? 'border-red-500' : 'border-gray-200'} rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Enter Key Name"
                            required
                        />
                        {errors.KeyName && (
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.KeyName}</p>
                            </div>
                        )}
                    </div>
                ),
                actions: (
                    <div className="relative flex items-center justify-end">
                        <ConfirmPopup
                            message="Are you sure you want to delete this item?"
                            onConfirm={() => void handleDeleteItem(item)}
                        >
                            <button className="flex items-center p-2 hover:bg-gray-100 rounded">
                                <Trash2 size={18} className="text-[#1A1A1A] cursor-pointer" />
                            </button>
                        </ConfirmPopup>
                    </div>
                ),
            };
        }

        // Non-editing mode - show edit and delete buttons
        return {
            TableName: item.TableName,
            FieldName: item.FieldName,
            KeyName: item.KeyName,
            actions: (
                <div className="relative flex items-center justify-end gap-2">
                    <button
                        onClick={() => void handleEdit(item)}
                        className="flex items-center p-2 hover:bg-gray-100 rounded"
                    >
                        <SquarePen size={18} className="text-[#1A1A1A] cursor-pointer" />
                    </button>
                    <ConfirmPopup
                        message="Are you sure you want to delete this item?"
                        onConfirm={() => void handleDeleteItem(item)}
                    >
                        <button className="flex items-center p-2 hover:bg-gray-100 rounded">
                            <Trash2 size={18} className="text-[#1A1A1A] cursor-pointer" />
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

            <CustomTable 
                columns={columns} 
                data={data} 
                responsive={true} 
                showActions={false}  // ← ADD THIS LINE
            />
        </div>
    );
}