import React, { useEffect, useReducer, useRef, useState } from "react";
import CustomTable from "@/utils/CustomTable.js";
import { CircleAlert, Plus, Save, Trash2, X, SquarePen } from "lucide-react";
import { apiRequest } from "@/utils/helpers/ApiHelper";
import SpinnerV2 from "@/utils/SpinnerV2.js";
import Toast from "@/utils/Toast.js";
import ConfirmPopup from "@/utils/ConfirmPopup.js";
import Dropdown from "@/utils/DropdownV2.js";

interface Option {
    value: string;
    label: string;
}

interface Mapping {
    MappingId?: string;
    ApiId: string;
    TableName: string;
    FieldName: string;
    KeyName: string;
    isNew?: boolean;
    tempId?: number;
}

interface State {
    Mappings: Mapping[];
    ApiList: Option[];
    TableList: Option[];
    FieldList: Option[];
    IsLoading: boolean;
    showToast: boolean;
    ToastMessage: string;
    SavingLoader: boolean;
    editingRows: Record<string | number, boolean>;
    newRows: Mapping[];
    rowErrors: Record<string | number, Record<string, string>>;
}

const initialState: State = {
    Mappings: [],
    ApiList: [],
    TableList: [],
    FieldList: [],
    IsLoading: true,
    showToast: false,
    ToastMessage: "",
    SavingLoader: false,
    editingRows: {},
    newRows: [],
    rowErrors: {},
};

function reducer(state: State, newState: Partial<State>): State {
    return { ...state, ...newState };
}

export default function SAP_API_TableFieldKeyMapping() {
    const [state, setState] = useReducer(reducer, initialState);
    const didFetchData = useRef(false);

    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;
        init();
    }, []);

    const init = async () => {
        setState({ IsLoading: true });
        await Promise.all([getApiList(), getTableList(), getData()]);
        setState({ IsLoading: false });
    };

    /** ---------------------- Fetch Lists ----------------------- */

    const getApiList = async () => {
        try {
            const resp: any = await apiRequest("/GetSAPObjectApisMasterByObjectId", {
                ObjectId: "OBJ-VA01-00555", ApiType: "API"
            });
            if (resp.ResponseData && resp.ResponseData.length > 0) {
                const apiOptions: Option[] = resp.ResponseData.map((item: any) => ({
                    value: String(item.ApiId || ""),
                    label: `${item.ServiceName || "Unknown Service"} - ${item.OperationType || ""} (${item.ApiMethod || ""})`
                })).filter(opt => opt.value !== "");

                setState({ ApiList: apiOptions });
            } else {
                setState({ ApiList: [] });
            }
        } catch (err) {
            console.error("Error fetching API list:", err);
            setState({ ApiList: [] });
        }
    };

    const getTableList = async (): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetSAP_API_UniqueParentTables", {});
            setState({ TableList: resp?.ResponseData || [] });
        } catch (err) {
            console.error("Error fetching table list:", err);
            setState({ TableList: [] });
        }
    };

    const getFieldList = async (tableName: string): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetSAP_API_ParentFieldList", {
                ParentTableName: tableName,
            });
            setState({ FieldList: resp?.ResponseData || [] });
        } catch (err) {
            console.error("Error fetching field list:", err);
            setState({ FieldList: [] });
        }
    };

    const getData = async (): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetSAP_API_TableFieldKeyMapping", {});
            setState({ Mappings: resp?.ResponseData || [] });
        } catch (err) {
            console.error("Error fetching mappings:", err);
            setState({ Mappings: [] });
        } finally {
            setState({ IsLoading: false });
        }
    };

    /** ---------------------- CRUD Actions ----------------------- */

    const handleAddNew = (): void => {
        const newRow: Mapping = {
            ApiId: "",
            TableName: "",
            FieldName: "",
            KeyName: "",
            isNew: true,
            tempId: Date.now(),
        };
        setState({
            newRows: [...state.newRows, newRow],
            editingRows: { ...state.editingRows, [newRow.tempId!]: true },
            rowErrors: { ...state.rowErrors, [newRow.tempId!]: {} },
        });
    };

    const handleEdit = (item: Mapping): void => {
        const rowId = item.isNew ? item.tempId! : item.MappingId!;
        setState({
            editingRows: { ...state.editingRows, [rowId]: true },
            rowErrors: { ...state.rowErrors, [rowId]: {} },
        });
    };

    const handleCancelAll = (): void => {
        setState({ editingRows: {}, newRows: [], rowErrors: {} });
    };

    const validateAllRows = (): boolean => {
        const requiredFields: Array<keyof Mapping> = [
            "ApiId",
            "TableName",
            "FieldName",
            "KeyName",
        ];
        const newRowErrors: Record<string | number, Record<string, string>> = {};
        let allValid = true;

        const allRows = [...state.newRows, ...state.Mappings];
        Object.entries(state.editingRows).forEach(([id, isEdit]) => {
            if (!isEdit) return;
            const row = allRows.find(
                (r) => r.MappingId === id || r.tempId === Number(id)
            );
            if (row) {
                newRowErrors[id] = {};
                requiredFields.forEach((field) => {
                    if (!row[field] || row[field].toString().trim() === "") {
                        newRowErrors[id][field] = "This field is required";
                        allValid = false;
                    }
                });
            }
        });

        setState({ rowErrors: newRowErrors });
        return allValid;
    };

    const handleSaveAll = async (): Promise<void> => {
        if (!validateAllRows()) {
            setState({
                showToast: true,
                ToastMessage: "Please fill all required fields",
            });
            setTimeout(() => setState({ showToast: false }), 3000);
            return;
        }

        setState({ SavingLoader: true });
        try {
            const editedIds = Object.keys(state.editingRows);
            const rowsToSave = [...state.newRows, ...state.Mappings].filter(
                (r) => r.isNew || editedIds.includes(r.MappingId!)
            );

            for (const row of rowsToSave) {
                await apiRequest("/AddUpdateSAP_API_TableFieldKeyMapping", row);
            }

            setState({
                SavingLoader: false,
                showToast: true,
                ToastMessage: "Saved successfully!",
                editingRows: {},
                newRows: [],
                rowErrors: {},
            });
            await getData();
            setTimeout(() => setState({ showToast: false }), 3000);
        } catch (err) {
            console.error("Error saving:", err);
            setState({
                SavingLoader: false,
                showToast: true,
                ToastMessage: "Error saving data.",
            });
            setTimeout(() => setState({ showToast: false }), 3000);
        }
    };

    const handleDelete = async (item: Mapping): Promise<void> => {
        if (item.MappingId) {
            try {
                await apiRequest("/DeleteSAP_API_TableFieldKeyMapping", item);
                setState({
                    showToast: true,
                    ToastMessage: "Deleted successfully!",
                });
                await getData();
                setTimeout(() => setState({ showToast: false }), 3000);
            } catch (err) {
                console.error("Error deleting:", err);
            }
        } else {
            setState({
                newRows: state.newRows.filter((r) => r.tempId !== item.tempId),
            });
        }
    };

    /** ---------------------- Field Change Handlers ----------------------- */

    const handleApiChange = (val: string, opt: any, item: Mapping): void => {
        if (item.isNew) {
            const updatedRows = state.newRows.map((r) =>
                r.tempId === item.tempId ? { ...r, ApiId: val } : r
            );
            setState({ newRows: updatedRows });
        } else {
            const updated = state.Mappings.map((r) =>
                r.MappingId === item.MappingId ? { ...r, ApiId: val } : r
            );
            setState({ Mappings: updated });
        }
    };

    const handleTableChange = async (val: string, opt: any, item: Mapping): Promise<void> => {
        if (item.isNew) {
            const updatedRows = state.newRows.map((r) =>
                r.tempId === item.tempId
                    ? { ...r, TableName: val, FieldName: "" }
                    : r
            );
            setState({ newRows: updatedRows });
        } else {
            const updated = state.Mappings.map((r) =>
                r.MappingId === item.MappingId
                    ? { ...r, TableName: val, FieldName: "" }
                    : r
            );
            setState({ Mappings: updated });
        }
        await getFieldList(val);
    };

    const handleFieldChange = (val: string, opt: any, item: Mapping): void => {
        if (item.isNew) {
            const updatedRows = state.newRows.map((r) =>
                r.tempId === item.tempId ? { ...r, FieldName: val } : r
            );
            setState({ newRows: updatedRows });
        } else {
            const updated = state.Mappings.map((r) =>
                r.MappingId === item.MappingId ? { ...r, FieldName: val } : r
            );
            setState({ Mappings: updated });
        }
    };

    const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>, item: Mapping): void => {
        if (item.isNew) {
            const updatedRows = state.newRows.map((r) =>
                r.tempId === item.tempId ? { ...r, KeyName: e.target.value } : r
            );
            setState({ newRows: updatedRows });
        } else {
            const updated = state.Mappings.map((r) =>
                r.MappingId === item.MappingId ? { ...r, KeyName: e.target.value } : r
            );
            setState({ Mappings: updated });
        }
    };

    /** ---------------------- Table Rendering ----------------------- */

    const allRows: Mapping[] = [...state.newRows, ...state.Mappings];
    const data = allRows.map((item) => {
        const rowId = item.isNew ? item.tempId! : item.MappingId!;
        const isEditing = state.editingRows[rowId];
        const errors = state.rowErrors[rowId] || {};

        if (isEditing) {
            return {
                ApiId: (
                    <div>
                        <Dropdown
                            size="small"
                            mode="single"
                            options={state.ApiList}
                            value={item.ApiId}
                            onChange={(val, opt) => handleApiChange(val, opt, item)}
                            placeholder="Select API"
                            className={errors.ApiId ? "border-red-500" : ""}
                        />
                        {errors.ApiId && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                                <CircleAlert size={12} className="mr-1" /> {errors.ApiId}
                            </p>
                        )}
                    </div>
                ),
                TableName: (
                    <div>
                        <Dropdown
                            size="small"
                            mode="single"
                            options={state.TableList}
                            value={item.TableName}
                            onChange={(val, opt) => handleTableChange(val, opt, item)}
                            placeholder="Select Table"
                            className={errors.TableName ? "border-red-500" : ""}
                        />
                        {errors.TableName && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                                <CircleAlert size={12} className="mr-1" /> {errors.TableName}
                            </p>
                        )}
                    </div>
                ),
                FieldName: (
                    <div>
                        <Dropdown
                            size="small"
                            mode="single"
                            options={state.FieldList}
                            value={item.FieldName}
                            onChange={(val, opt) => handleFieldChange(val, opt, item)}
                            placeholder={
                                !item.TableName ? "Select Table first" : "Select Field"
                            }
                            disabled={!item.TableName}
                            className={errors.FieldName ? "border-red-500" : ""}
                        />
                        {errors.FieldName && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                                <CircleAlert size={12} className="mr-1" /> {errors.FieldName}
                            </p>
                        )}
                    </div>
                ),
                KeyName: (
                    <div>
                        <input
                            type="text"
                            className={`w-full border rounded p-1 text-sm ${
                                errors.KeyName ? "border-red-500" : "border-gray-300"
                            }`}
                            value={item.KeyName}
                            onChange={(e) => handleKeyChange(e, item)}
                            placeholder="Enter Key Name"
                        />
                        {errors.KeyName && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                                <CircleAlert size={12} className="mr-1" /> {errors.KeyName}
                            </p>
                        )}
                    </div>
                ),
                actions: (
                    <ConfirmPopup
                        message="Are you sure you want to delete?"
                        onConfirm={() => handleDelete(item)}
                    >
                        <button className="pl-3">
                            <Trash2 className="text-[#1A1A1A]" />
                        </button>
                    </ConfirmPopup>
                ),
            };
        }

        return {
            ApiId: state.ApiList.find((x) => x.value === item.ApiId)?.label || "-",
            TableName: item.TableName,
            FieldName: item.FieldName,
            KeyName: item.KeyName,
            actions: (
                <div className="flex items-center">
                    <button onClick={() => handleEdit(item)} className="px-2">
                        <SquarePen className="text-[#1A1A1A]" />
                    </button>
                    <ConfirmPopup
                        message="Are you sure to delete?"
                        onConfirm={() => handleDelete(item)}
                    >
                        <button className="px-2">
                            <Trash2 className="text-[#1A1A1A]" />
                        </button>
                    </ConfirmPopup>
                </div>
            ),
        };
    });

    const columns = [
        { title: "API Name", key: "ApiId" },
        { title: "Table Name", key: "TableName" },
        { title: "Field Name", key: "FieldName" },
        { title: "Key Name", key: "KeyName" },
    ];

    const hasEdits =
        Object.keys(state.editingRows).length > 0 || state.newRows.length > 0;

    if (state.IsLoading)
        return (
            <div className="h-96 py-20">
                <SpinnerV2 {...{ text: "Fetching data..." }} />
            </div>
        );

    return (
        <div>
            <Toast
                message={state.ToastMessage}
                show={state.showToast}
                onClose={() => setState({ showToast: false })}
            />

            <div className="flex justify-end items-center pb-4">
                <div className="flex items-center space-x-2 gap-4">
                    <button
                        onClick={handleAddNew}
                        className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add</span>
                    </button>
                    {hasEdits && (
                        <>
                            <button
                                onClick={handleCancelAll}
                                className="text-red-600 ml-10 px-3 py-2 rounded-lg text-sm flex items-center hover:bg-gray-100"
                            >
                                <X size={16} className="mr-1" />
                                Cancel All
                            </button>
                            <button
                                onClick={handleSaveAll}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm flex items-center"
                                disabled={state.SavingLoader}
                            >
                                {state.SavingLoader ? (
                                    <SpinnerV2 {...{ text: "Saving..." }} />
                                ) : (
                                    <>
                                        <Save size={16} className="mr-1" /> Save All
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <CustomTable columns={columns} data={data} responsive />
        </div>
    );
}
