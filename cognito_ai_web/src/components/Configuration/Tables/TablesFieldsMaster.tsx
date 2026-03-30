// /mnt/data/TablesFieldsMaster
import React, { useEffect, useReducer, useRef } from 'react';
import CustomTable from "../../../utils/CustomTable";
import { ChevronLeft, CircleAlert, Plus, Save, SquarePen, Trash2, X } from "lucide-react";
import { apiRequest } from "../../../utils/helpers/ApiHelper";
import SpinnerV2 from "../../../utils/SpinnerV2";
import ErrorScreen from "../../../utils/ErrorScreen";
import Pagination from "../../../utils/Pagination";
import Toast from "../../../utils/Toast";
import ConfirmPopup from "../../../utils/ConfirmPopup";
import Dropdown from "../../../utils/Dropdown";
import useDebounce from "../../../utils/helpers/useDebounce";
import SearchBar from "../../../utils/SearchBar";

interface CurrAddEditDetails {
    TableName: string;
    [key: string]: unknown;
}

interface TablesFieldsMasterProps {
    CurrAddEditDetails: CurrAddEditDetails;
    children?: React.ReactNode;
    [key: string]: unknown;
}

type YesNo = "Yes" | "No";
type YesNoUpper = "YES" | "NO";

interface BaseFieldRow {
    TableName: string;
    FieldId?: string;
    FieldName: string;
    FieldType: string;
    ComparativeField: YesNo;
    DisplayField: YesNo;
    KeyField: YesNo;
    VerificationField: YesNo;
    MarkedFlag: YesNoUpper;
    Description: string;
    isNew?: boolean;
}

interface ExistingFieldRow extends BaseFieldRow {
    FieldId: string;
    isNew?: false;
}

interface NewFieldRow extends BaseFieldRow {
    isNew: true;
    tempId: number;
    FieldId: ""; // as per existing logic for new rows
}

type TableFieldRow = ExistingFieldRow | NewFieldRow;

interface ColumnDef {
    title: string;
    key: string;
    className?: string;
    [key: string]: unknown;
}

interface State {
    Error: string;
    TablesFieldsMaster: TableFieldRow[];
    FieldTypesMasterList: unknown[];
    ViewAppDetails: boolean;
    SearchQuery: string;
    CurrentPage: number;
    TotalRecords: number;
    IsLoading: boolean;
    showToast: boolean;
    SavingLoader: boolean;
    isDataExist: string;
    editingRows: Record<string | number, boolean>;
    newRows: NewFieldRow[];
    rowErrors: Record<string | number, Record<string, string>>;
    CurrPillActive: "TableFields" | (string & {});
}

const initialState: State = {
    Error: "",
    TablesFieldsMaster: [],
    FieldTypesMasterList: [],
    ViewAppDetails: false,
    SearchQuery: "",
    CurrentPage: 1,
    TotalRecords: 0,
    IsLoading: true,
    showToast: false,
    SavingLoader: false,
    isDataExist: "",
    editingRows: {},
    newRows: [],
    rowErrors: {},
    CurrPillActive: "TableFields",
};

export default function TablesFieldsMaster(props: TablesFieldsMasterProps) {
    const [state, setState] = useReducer(
        (s: State, ns: Partial<State>): State => ({ ...s, ...ns }),
        initialState
    );

    const debouncedSearchQuery = useDebounce(state.SearchQuery, 300) as string;
    const didFetchData = useRef<boolean>(false);

    useEffect(() => {
        const init = async () => {
            setState({ IsLoading: true });

            await Promise.all([
                getData(debouncedSearchQuery),
                getFieldTypesMaster(""),
            ]);

            setState({ IsLoading: false });
        };

        void init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchQuery]);

    const getFieldTypesMaster = async (_: unknown) => {
        try {
            const resp: any = await apiRequest("/GetFieldTypesMaster", {});
            setState({
                FieldTypesMasterList: resp.ResponseData,
            });
        } catch (err) {
            console.error("Error loading Field Types:", err);
        }
    };

    const getData = async (SearchQuery: string = "", PageNo: number = 1) => {
        try {
            const resp: any = await apiRequest("/GetSAPTableFieldsMasterPaginationFilterSearchV2", {
                "PageNo": PageNo,
                "StartDate": "",
                "EndDate": "",
                "TableName": props.CurrAddEditDetails.TableName,
                "SearchString": SearchQuery
            });
            console.log("resp.ResponseData SAPTableFieldsMaster", resp.ResponseData);
            if (Array.isArray(resp.ResponseData) && resp.ResponseData.length > 0) {
                setState({ TablesFieldsMaster: resp.ResponseData as TableFieldRow[], TotalRecords: resp.TotalRecords as number });
            } else {
                setState({ TablesFieldsMaster: [], TotalRecords: [] as unknown as number });
            }
        } catch (err) {
            setState({ Error: (err as Error).toString() });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const handleAddNew = () => {
        const newRow: NewFieldRow = {
            "TableName": props.CurrAddEditDetails.TableName,
            "FieldId": "",
            "FieldName": "",
            "FieldType": "",
            "ComparativeField": "No",
            "DisplayField": "No",
            "KeyField": "No",
            "VerificationField": "No",
            "MarkedFlag": "No" as unknown as YesNoUpper, // preserve existing initial logic
            "Description": "",
            "isNew": true,
            "tempId": Date.now()
        };
        setState({
            newRows: [...state.newRows, newRow],
            editingRows: {
                ...state.editingRows,
                [newRow.tempId]: true
            },
            rowErrors: {
                ...state.rowErrors,
                [newRow.tempId]: {}
            }
        });
    };

    const handleEdit = (item: TableFieldRow) => {
        setState({
            editingRows: {
                ...state.editingRows,
                [item.isNew ? (item as NewFieldRow).tempId : (item as ExistingFieldRow).FieldId]: true
            },
            rowErrors: {
                ...state.rowErrors,
                [item.isNew ? (item as NewFieldRow).tempId : (item as ExistingFieldRow).FieldId]: {}
            }
        });
    };

    const handleCancelAll = () => {
        setState({
            editingRows: {},
            newRows: [],
            rowErrors: {}
        });
    };

    const validateAllRows = (): boolean => {
        const requiredFields: Array<keyof Pick<BaseFieldRow, "FieldName" | "FieldType">> = ["FieldName", "FieldType"];
        const newRowErrors: Record<string | number, Record<string, string>> = {};
        let allValid = true;

        // Validate new rows
        state.newRows.forEach(row => {
            const rowId = row.tempId;
            newRowErrors[rowId] = {};

            requiredFields.forEach(field => {
                if (!row[field]) {
                    newRowErrors[rowId][field] = "This field is required";
                    allValid = false;
                }
            });
        });

        // Validate existing rows being edited
        Object.keys(state.editingRows).forEach((id) => {
            if (typeof id === 'string') {
                const row = state.TablesFieldsMaster.find(t => (t as ExistingFieldRow).FieldId === id);
                if (row) {
                    newRowErrors[id] = {};
                    requiredFields.forEach(field => {
                        if (!(row as BaseFieldRow)[field]) {
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

    const handleSaveUpdateSelectionFlag = async (_item: unknown) => {
        // await apiRequest("/UpdateSAPTableFieldSelectionFlagMaster", item);
        console.log("clicked updated all flag");
    };

    const handleSaveAll = async () => {
        if (!validateAllRows()) return;

        setState({ SavingLoader: true });

        try {
            // Prepare edited existing rows
            const editedRows = Object.keys(state.editingRows)
                .filter(id => typeof id === 'string') // existing rows
                .map(id => {
                    return state.TablesFieldsMaster.find(row => (row as ExistingFieldRow).FieldId === id);
                })
                .filter(Boolean) as TableFieldRow[];

            // Combine all rows to send
            const rowsToSend: TableFieldRow[] = [...editedRows, ...state.newRows];

            if (rowsToSend.length > 0) {
                console.log("Data being sent to API:", rowsToSend);
                await apiRequest("/AddUpdateSAPTableFieldsMasterV2", rowsToSend);
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

    const handleDropdownClientInfo = (
        val: unknown,
        _options: unknown,
        name: string,
        item: TableFieldRow
    ) => {
        if (item.isNew) {
            const updatedNewRows = state.newRows.map(row => {
                if (row.tempId === (item as NewFieldRow).tempId) {
                    return { ...row, [name]: val } as NewFieldRow;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedFields = state.TablesFieldsMaster.map(t => {
                if ((t as ExistingFieldRow).FieldId === (item as ExistingFieldRow).FieldId) {
                    return { ...t, [name]: val } as TableFieldRow;
                }
                return t;
            });
            setState({ TablesFieldsMaster: updatedFields });
        }
    };

    const ToggleFlagItem = (
        e: React.ChangeEvent<HTMLInputElement>,
        name: keyof Pick<BaseFieldRow, "ComparativeField" | "DisplayField" | "KeyField" | "VerificationField">,
        item: TableFieldRow
    ) => {
        if (item.isNew) {
            const updatedNewRows = state.newRows.map(row => {
                if (row.tempId === (item as NewFieldRow).tempId) {
                    const checked: YesNo = e.target.checked ? "Yes" : "No";
                    return { ...row, [name]: checked } as NewFieldRow;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedFields = state.TablesFieldsMaster.map(t => {
                if ((t as ExistingFieldRow).FieldId === (item as ExistingFieldRow).FieldId) {
                    const checked: YesNo = e.target.checked ? "Yes" : "No";
                    return { ...t, [name]: checked } as TableFieldRow;
                }
                return t;
            });
            setState({ TablesFieldsMaster: updatedFields });
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        name: keyof Pick<BaseFieldRow, "FieldName" | "FieldType" | "Description">,
        item: TableFieldRow
    ) => {
        if (item.isNew) {
            const updatedNewRows = state.newRows.map(row => {
                if (row.tempId === (item as NewFieldRow).tempId) {
                    return { ...row, [name]: e.target.value } as NewFieldRow;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedFields = state.TablesFieldsMaster.map(t => {
                if ((t as ExistingFieldRow).FieldId === (item as ExistingFieldRow).FieldId) {
                    return { ...t, [name]: e.target.value } as TableFieldRow;
                }
                return t;
            });
            setState({ TablesFieldsMaster: updatedFields });
        }
    };

    const handlePageChange = (page: number) => {
        setState({ CurrentPage: page });
        void getData(state.SearchQuery, page);
    };

    const handleDeleteItem = async (item: TableFieldRow) => {
        if ((item as ExistingFieldRow).FieldId) {
            console.log("todo item =>", item);
            // Existing item - call API to delete
            const resp: any = await apiRequest("/DeleteSAPTableFieldsMasterV2", item);
            if (resp) {
                setState({ showToast: true });
                void getData();
                setTimeout(() => {
                    setState({ showToast: false });
                }, 3000);
            }
        } else {
            // New item - just remove from state
            setState({
                newRows: state.newRows.filter(row => row.tempId !== (item as NewFieldRow).tempId),
                editingRows: {
                    ...state.editingRows,
                    [(item as NewFieldRow).tempId]: false
                },
                rowErrors: {
                    ...state.rowErrors,
                    [(item as NewFieldRow).tempId]: undefined as unknown as Record<string, string>
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

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleSelectionChange = (newList: Array<any> | null, item?: any) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            console.log("handleSelectionChange==>", newList, item);
            if (item) {
                if (item.checkFlag) {
                    void handleSaveUpdateSelectionFlag([{
                        TableName: item.TableName,
                        FieldName: item.FieldName,
                        MarkedFlag: "YES",
                    }]);
                } else {
                    void handleSaveUpdateSelectionFlag([{
                        TableName: item.TableName,
                        FieldName: item.FieldName,
                        MarkedFlag: "NO",
                    }]);
                }
            } else {
                if (newList) {
                    const FinalReqArra: Array<{ TableName: string; FieldName: string; MarkedFlag: YesNoUpper; }> = [];
                    newList.map((v: any) => {
                        if (v.checkFlag) {
                            v.MarkedFlag = "YES";
                        } else {
                            v.MarkedFlag = "NO";
                        }
                        FinalReqArra.push({
                            TableName: v.TableName as string,
                            FieldName: v.FieldName as string,
                            MarkedFlag: v.MarkedFlag as YesNoUpper,
                        });
                        return null;
                    });
                    if (FinalReqArra.length > 0) {
                        void handleSaveUpdateSelectionFlag(FinalReqArra);
                    }
                }
            }
        }, 200);
    };

    const columns: ColumnDef[] = [
        { title: 'Field Name', key: 'FieldName', className: 'min-w-[200px]' },
        { title: 'Field Type', key: 'FieldType' },
        { title: 'Key', key: 'KeyField' },
        { title: 'Verification', key: 'VerificationField' },
        { title: 'Comparative', key: 'ComparativeField' },
        { title: 'Display', key: 'DisplayField' },
        { title: 'Description', key: 'Description', className: 'min-w-[300px]' },
    ];

    // Combine existing data with new rows
    const allRows: TableFieldRow[] = [...state.newRows, ...state.TablesFieldsMaster];

    const data = allRows.map((item) => {
        const rowId: string | number = item.isNew ? (item as NewFieldRow).tempId : (item as ExistingFieldRow).FieldId;
        const isEditing = state.editingRows[rowId];
        const errors = state.rowErrors[rowId] || {};

        if (isEditing) {
            return {
                FieldId: (item as ExistingFieldRow).FieldId,
                FieldName: (
                    <div>
                        <input
                            // onChange={(e) => handleChange(e, "FieldName", item)}
                            // value={item.FieldName}
                            defaultValue={item.FieldName || ''}
                            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                if (item.FieldName !== e.target.value) {
                                    handleChange(
                                        { ...e, target: e.target } as unknown as React.ChangeEvent<HTMLInputElement>,
                                        "FieldName",
                                        item
                                    );
                                }
                            }}
                            type="text"
                            className={`w-full px-3 shadow text-[0.85rem] py-2 border ${errors.FieldName ? 'border-red-500' : 'border-gray-200'} rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Enter Field Name"
                            required
                        />
                        {errors.FieldName &&
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.FieldName}</p>
                            </div>
                        }
                    </div>
                ),
                FieldType: (
                    <div>
                        <input
                            // onChange={(e) => handleChange(e, "FieldType", item)}
                            // value={item.FieldType}

                            defaultValue={item.FieldType || ''}
                            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                if (item.FieldType !== e.target.value) {
                                    handleChange(
                                        { ...e, target: e.target } as unknown as React.ChangeEvent<HTMLInputElement>,
                                        "FieldType",
                                        item
                                    );
                                }
                            }}

                            type="text"
                            className={`w-full px-3 shadow text-[0.85rem] py-2 border ${errors.FieldType ? 'border-red-500' : 'border-gray-200'} rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Enter Field Type"
                            required
                        />
                        {errors.FieldType &&
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.FieldType}</p>
                            </div>
                        }
                    </div>
                ),
                ComparativeField: (
                    <div>
                        <label className="custom-checkbox cursor-pointer">
                            <input
                                type="checkbox"
                                checked={item.ComparativeField === "Yes"}
                                onChange={(e) => ToggleFlagItem(e, "ComparativeField", item)}
                                onClick={(e) => e.stopPropagation()}
                            />
                            <span className="checkmark" />
                        </label>
                    </div>
                ),
                DisplayField: (
                    <div>
                        <label className="custom-checkbox cursor-pointer">
                            <input
                                type="checkbox"
                                checked={item.DisplayField === "Yes"}
                                onChange={(e) => ToggleFlagItem(e, "DisplayField", item)}
                                onClick={(e) => e.stopPropagation()}
                            />
                            <span className="checkmark" />
                        </label>
                    </div>
                ),
                KeyField: (
                    <div>
                        <label className="custom-checkbox cursor-pointer">
                            <input
                                type="checkbox"
                                checked={item.KeyField === "Yes"}
                                onChange={(e) => ToggleFlagItem(e, "KeyField", item)}
                                onClick={(e) => e.stopPropagation()}
                            />
                            <span className="checkmark" />
                        </label>
                    </div>
                ),
                VerificationField: (
                    <div>
                        <label className="custom-checkbox cursor-pointer">
                            <input
                                type="checkbox"
                                checked={item.VerificationField === "Yes"}
                                onChange={(e) => ToggleFlagItem(e, "VerificationField", item)}
                                onClick={(e) => e.stopPropagation()}
                            />
                            <span className="checkmark" />
                        </label>
                    </div>
                ),
                Description: (
                    <div>
                        <input
                            onChange={(e) => handleChange(e, "Description", item)}
                            value={item.Description}
                            type="text"
                            className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Description"
                        />
                    </div>
                ),
                actions: (
                    <div className="relative flex items-center">
                        <ConfirmPopup
                            message="Are you sure you want to delete this item?"
                            onConfirm={() => handleDeleteItem(item)}
                        >
                            <button className="pr-4 flex items-center">
                                <Trash2 className="text-[#1A1A1A] cursor-pointer" />
                            </button>
                        </ConfirmPopup>
                    </div>
                ),
            };
        }
        // Normal read-only row
        return {
            id: (item as ExistingFieldRow).FieldId,
            FieldId: (item as ExistingFieldRow).FieldId,
            FieldName: item.FieldName,
            TableName: item.TableName,
            FieldType: item.FieldType,
            ComparativeField: item.ComparativeField === "Yes" ? "Yes" : "No",
            DisplayField: item.DisplayField === "Yes" ? "Yes" : "No",
            KeyField: item.KeyField === "Yes" ? "Yes" : "No",
            VerificationField: item.VerificationField === "Yes" ? "Yes" : "No",
            Description: item.Description,
            selected: item.MarkedFlag === "YES",
            actions: (
                <div className="relative flex items-center">
                    <button
                        onClick={() => handleEdit(item)}
                        className="ml-2 text-white px-3 py-1 rounded text-sm"
                    >
                        <SquarePen
                            className="text-[#1A1A1A] cursor-pointer" />
                    </button>
                    <ConfirmPopup
                        message="Are you sure you want to delete this item?"
                        onConfirm={() => handleDeleteItem(item)}
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
        <div className="pt-0 pb-6 px-2">
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
                        className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2 text-[0.89rem] cursor-pointer text-gray-950 font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
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

            <CustomTable onSelectionChange={handleSelectionChange} enableSelection={true} columns={columns}
                         data={data} responsive={true} />

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
