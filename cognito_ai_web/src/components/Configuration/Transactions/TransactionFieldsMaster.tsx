// src/components/TransactionFieldsMaster
// :contentReference[oaicite:0]{index=0}
import React, {
    useEffect,
    useReducer,
    useRef,
    useState,
    type ReactNode,
} from "react";
import CustomTable from "../../../utils/CustomTable";
import {
    ChevronLeft,
    CircleAlert,
    Plus,
    Save,
    SquarePen,
    Trash2,
    X,
} from "lucide-react";
import { apiRequest } from "../../../utils/helpers/ApiHelper";
import SpinnerV2 from "../../../utils/SpinnerV2";
import ErrorScreen from "../../../utils/ErrorScreen";
import Pagination from "../../../utils/Pagination";
import Toast from "../../../utils/Toast";
import ConfirmPopup from "../../../utils/ConfirmPopup";
import TransactionFieldValues from "./TransactionFieldValues";
import Dropdown from "../../../utils/Dropdown";
import useDebounce from "../../../utils/helpers/useDebounce";
import SearchBar from "../../../utils/SearchBar";

/** ----------------------
 * Types
 * ---------------------- */

type YesNo = "Yes" | "No";
type UpperYesNo = "YES" | "NO";

interface CurrAddEditDetails {
    TableName: string;
    TransactionId: string | number;
    [key: string]: unknown;
}

type BreadcrumbHandler = (key: string, label?: string) => void;

interface Props {
    CurrAddEditDetails: CurrAddEditDetails;
    ActiveBCItem?: string;
    handleBreadcrumbClick: BreadcrumbHandler;
    [key: string]: unknown;
}

interface BaseRow {
    TransactionId: string | number;
    FieldId?: string | number;
    ScreenName?: string;
    FieldType?: string;
    FieldName?: string;
    KeyField?: YesNo;
    VerificationField?: YesNo;
    ComparativeField?: YesNo;
    DisplayField?: YesNo;
    Description?: string;
    MarkedFlag?: UpperYesNo;
    [key: string]: unknown;
}

interface NewRow extends BaseRow {
    isNew: true;
    tempId: number;
}

type ExistingRow = BaseRow & {
    isNew?: false;
};

type AnyRow = NewRow | ExistingRow;

type EditingRows = Record<string | number, boolean>;
type RowFieldErrors = Record<string, string | undefined>;
type RowErrors = Record<string | number, RowFieldErrors | undefined>;

interface State {
    Error: string;
    TransactionFieldsMaster: ExistingRow[];
    FieldTypesMasterList: unknown[];
    ViewAppDetails: boolean;
    SearchQuery: string;
    CurrentPage: number;
    TotalRecords: any; // preserved to match original logic where it could be []
    IsLoading: boolean;
    showToast: boolean;
    SavingLoader: boolean;
    isDataExist: string;
    editingRows: EditingRows;
    newRows: NewRow[];
    rowErrors: RowErrors;
    pillItems: Array<{ key: string; label: string }>;
    CurrPillActive: string;
    CurrAddEditDetails?: ExistingRow;
    FilterObj?: Record<string, unknown>;
}

/** ----------------------
 * Component
 * ---------------------- */

export default function TransactionFieldsMaster(props: Props) {
    const initialState: State = {
        Error: "",
        TransactionFieldsMaster: [],
        FieldTypesMasterList: [],
        ViewAppDetails: false,
        SearchQuery: "",
        CurrentPage: 1,
        TotalRecords: 0,
        IsLoading: true,
        showToast: false,
        SavingLoader: false,
        isDataExist: "",
        editingRows: {}, // { [id]: true } tracks all rows being edited
        newRows: [], // tracks all new rows being added
        rowErrors: {}, // { [rowId]: { field: "error message" } }
        pillItems: [
            { key: "TransactionInfo", label: "ScreenName Info" },
            { key: "TransactionFields", label: "ScreenName Fields" },
        ],
        CurrPillActive: "TransactionInfo",
    };

    const [state, setState] = useReducer(
        (s: State, ns: Partial<State>): State => ({ ...s, ...ns }),
        initialState
    );

    const debouncedSearchQuery =
        (useDebounce(state.SearchQuery, 300) as unknown as string) ?? "";
    const didFetchData = useRef<boolean>(false);

    useEffect(() => {
        const init = async () => {
            setState({ IsLoading: true });

            await Promise.all([getData(debouncedSearchQuery), getFieldTypesMaster("")]);

            setState({ IsLoading: false });
        };

        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchQuery]);

    const getFieldTypesMaster = async (_?: string) => {
        try {
            const resp: any = await apiRequest("/GetFieldTypesMaster", {});
            setState({
                FieldTypesMasterList: resp.ResponseData,
            });
        } catch (err) {
            console.error("Error loading Country/State/City:", err);
        }
    };

    const getData = async (SearchQuery: string = "", PageNo: number = 1) => {
        try {
            const resp: any = await apiRequest(
                "/GetSAPTableFieldsMasterPaginationFilterSearchV2",
                {
                    PageNo: PageNo,
                    StartDate: "",
                    EndDate: "",
                    TableName: props.CurrAddEditDetails.TableName,
                    SearchString: SearchQuery,
                }
            );
            if (Array.isArray(resp.ResponseData) && resp.ResponseData.length > 0) {
                setState({
                    TransactionFieldsMaster: resp.ResponseData as ExistingRow[],
                    TotalRecords: resp.TotalRecords,
                });
            } else {
                setState({ TransactionFieldsMaster: [], TotalRecords: [] });
            }
        } catch (err: unknown) {
            setState({ Error: String(err) });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const handleAddNew = () => {
        const newRow: NewRow = {
            TransactionId: props.CurrAddEditDetails.TransactionId,
            FieldId: "",
            ScreenName: "",
            FieldType: "",
            FieldName: "",
            KeyField: "No",
            VerificationField: "No",
            MarkedFlag: "NO",
            isNew: true,
            tempId: Date.now(), // Unique identifier for new rows
        };
        setState({
            newRows: [...state.newRows, newRow],
            editingRows: {
                ...state.editingRows,
                [newRow.tempId]: true,
            },
            rowErrors: {
                ...state.rowErrors,
                [newRow.tempId]: {},
            },
        });
    };

    const handleEdit = (item: AnyRow) => {
        setState({
            editingRows: {
                ...state.editingRows,
                [item.isNew ? item.tempId : (item.FieldName as string)]: true,
            },
            rowErrors: {
                ...state.rowErrors,
                [item.isNew ? item.tempId : (item.FieldName as string)]: {},
            },
        });
    };

    const handleCancelAll = () => {
        setState({
            editingRows: {},
            newRows: [],
            rowErrors: {},
        });
    };

    const validateAllRows = (): boolean => {
        const requiredFields = ["ScreenName", "FieldType", "FieldName"] as const;
        const newRowErrors: RowErrors = {};
        let allValid = true;

        // Validate new rows
        state.newRows.forEach((row) => {
            const rowId = row.tempId;
            newRowErrors[rowId] = {};

            requiredFields.forEach((field) => {
                if (!row[field]) {
                    (newRowErrors[rowId] as RowFieldErrors)[field] = "This field is required";
                    allValid = false;
                }
            });
        });

        // Validate existing rows being edited
        Object.keys(state.editingRows).forEach((id) => {
            if (typeof id === "string") {
                const row = state.TransactionFieldsMaster.find((t) => t.FieldName === id);
                if (row) {
                    newRowErrors[id] = {};
                    requiredFields.forEach((field) => {
                        if (!(row as Record<string, unknown>)[field]) {
                            (newRowErrors[id] as RowFieldErrors)[field] = "This field is required";
                            allValid = false;
                        }
                    });
                }
            }
        });

        setState({ rowErrors: newRowErrors });
        return allValid;
    };

    const handleSaveUpdateSelectionFlag = async (item: Array<Record<string, unknown>>) => {
        await apiRequest("/UpdateTransactionFieldSelectionFlagMasterV2", item);
    };

    const handleSaveAll = async () => {
        if (!validateAllRows()) return;

        setState({ SavingLoader: true });

        try {
            // Prepare edited existing rows
            const editedRows: ExistingRow[] = Object.keys(state.editingRows)
                .filter((id) => typeof id === "string")
                .map((id) => state.TransactionFieldsMaster.find((row) => row.FieldName === id)!)
                .filter(Boolean);

            // Combine all rows to send
            const rowsToSend: AnyRow[] = [...editedRows, ...state.newRows];

            if (rowsToSend.length > 0) {
                await apiRequest("/AddUpdateTransactionFieldsMasterNew", rowsToSend);
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
        } catch (error: unknown) {
            setState({ SavingLoader: false, Error: String(error) });
        }
    };

    const handleDropdownClientInfo = (
        val: unknown,
        _options: unknown,
        name: string,
        item: AnyRow
    ) => {
        if (item.isNew) {
            const updatedNewRows = state.newRows.map((row) => {
                if (row.tempId === item.tempId) {
                    return { ...row, [name]: val };
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedTransactions = state.TransactionFieldsMaster.map((t) => {
                if (t.FieldName === item.FieldName) {
                    return { ...t, [name]: val };
                }
                return t;
            });
            setState({ TransactionFieldsMaster: updatedTransactions });
        }
    };

    const ToggleFlagItem = (
        e: React.ChangeEvent<HTMLInputElement>,
        name: string,
        item: AnyRow
    ) => {
        if (item.isNew) {
            const updatedNewRows = state.newRows.map((row) => {
                if (row.tempId === item.tempId) {
                    const checked: YesNo = e.target.checked ? "Yes" : "No";
                    return { ...row, [name]: checked };
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedTransactions = state.TransactionFieldsMaster.map((t) => {
                if (t.FieldName === item.FieldName) {
                    const checked: YesNo = e.target.checked ? "Yes" : "No";
                    return { ...t, [name]: checked };
                }
                return t;
            });
            setState({ TransactionFieldsMaster: updatedTransactions });
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        name: string,
        item: AnyRow
    ) => {
        if (item.isNew) {
            const updatedNewRows = state.newRows.map((row) => {
                if (row.tempId === item.tempId) {
                    return { ...row, [name]: e.target.value };
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedTransactions = state.TransactionFieldsMaster.map((t) => {
                if (t.FieldName === item.FieldName) {
                    return { ...t, [name]: e.target.value };
                }
                return t;
            });
            setState({ TransactionFieldsMaster: updatedTransactions });
        }
    };

    const handlePageChange = (page: number) => {
        setState({ CurrentPage: page });
        getData(state.SearchQuery, page);
    };

    const handleDeleteItem = async (item: AnyRow) => {
        if (item.FieldName) {
            // Existing item - call API to delete
            const resp: any = await apiRequest("/DeleteTransactionFieldsMasterNew", item);
            if (resp) {
                setState({ showToast: true });
                getData();
                setTimeout(() => {
                    setState({ showToast: false });
                }, 3000);
            }
        } else {
            // New item - just remove from state
            setState({
                newRows: state.newRows.filter((row) => row.tempId !== (item as NewRow).tempId),
                editingRows: {
                    ...state.editingRows,
                    [(item as NewRow).tempId]: false,
                },
                rowErrors: {
                    ...state.rowErrors,
                    [(item as NewRow).tempId]: undefined,
                },
            });
        }
    };

    const handleViewClientDetails = (item: ExistingRow) => {
        setState({ ViewAppDetails: true, CurrAddEditDetails: item });
    };

    const handleCloseClientDetails = () => {
        setState({ ViewAppDetails: false });
        getData("", state.CurrentPage);
    };

    const handleSearch = (value: string) => {
        setState({ SearchQuery: value });
        if (value.trim() === "") {
            // @ts-expect-error preserving original call shape that referenced state.FilterObj
            getData("", 1, state.FilterObj);
        }
    };

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    type SelectionItem = {
        TransactionId?: string | number;
        FieldName?: string;
        MarkedFlag?: UpperYesNo;
        checkFlag?: boolean;
        [key: string]: unknown;
    };

    const handleSelectionChange = (newList?: SelectionItem[] | null, item?: SelectionItem) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            console.log("handleSelectionChange==>", newList, item);
            if (item) {
                if (item.checkFlag) {
                    handleSaveUpdateSelectionFlag([
                        {
                            TransactionId: item.TransactionId,
                            FieldName: item.FieldName,
                            MarkedFlag: "YES",
                        },
                    ]);
                } else {
                    handleSaveUpdateSelectionFlag([
                        {
                            TransactionId: item.TransactionId,
                            FieldName: item.FieldName,
                            MarkedFlag: "NO",
                        },
                    ]);
                }
            } else {
                if (newList) {
                    const FinalReqArra: Array<Record<string, unknown>> = [];
                    newList.map((v) => {
                        if (v.checkFlag) {
                            v.MarkedFlag = "YES";
                        } else {
                            v.MarkedFlag = "NO";
                        }
                        FinalReqArra.push({
                            TransactionId: v.TransactionId,
                            FieldName: v.FieldName,
                            MarkedFlag: v.MarkedFlag,
                        });
                        return null;
                    });
                    if (FinalReqArra.length > 0) {
                        handleSaveUpdateSelectionFlag(FinalReqArra);
                    }
                }
            }
        }, 200);
    };

    const columns: Array<{ title: string; key: string; className?: string }> = [
        { title: "Field Name", key: "FieldName", className: "min-w-[200px]" },
        { title: "Field Type", key: "FieldType" },
        { title: "Key", key: "KeyField" },
        { title: "Verification", key: "VerificationField" },
        { title: "Comparative", key: "ComparativeField" },
        { title: "Display", key: "DisplayField" },
        { title: "Description", key: "Description", className: "min-w-[300px]" },
    ];

    // Combine existing data with new rows
    const allRows: AnyRow[] = [...state.newRows, ...state.TransactionFieldsMaster];

    const data: Array<Record<string, unknown>> = allRows.map((item) => {
        const rowId = item.isNew ? (item as NewRow).tempId : (item.FieldName as string);
        const isEditing = state.editingRows[rowId];
        const errors = (state.rowErrors[rowId] as RowFieldErrors) || {};

        if (isEditing) {
            return {
                FieldType: (
                    <div>
                        <input
                            defaultValue={(item.FieldType as string) || ""}
                            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                if (item.FieldType !== e.target.value) {
                                    handleChange(
                                        // Cast to ChangeEvent to reuse the same handler signature
                                        e as unknown as React.ChangeEvent<HTMLInputElement>,
                                        "FieldType",
                                        item
                                    );
                                }
                            }}
                            type="text"
                            className={`w-full px-3 shadow text-[0.85rem] py-2 border ${
                                errors.FieldType ? "border-red-500" : "border-gray-200"
                            } rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Enter Field Type"
                            required
                        />
                        {errors.FieldType && (
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.FieldType}</p>
                            </div>
                        )}
                    </div>
                ),
                FieldName: (
                    <div>
                        <input
                            defaultValue={(item.FieldName as string) || ""}
                            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                if (item.FieldName !== e.target.value) {
                                    handleChange(
                                        e as unknown as React.ChangeEvent<HTMLInputElement>,
                                        "FieldName",
                                        item
                                    );
                                }
                            }}
                            type="text"
                            className={`w-full px-3 shadow text-[0.85rem] py-2 border ${
                                errors.FieldName ? "border-red-500" : "border-gray-200"
                            } rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Enter Field Name"
                            required
                        />
                        {errors.FieldName && (
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.FieldName}</p>
                            </div>
                        )}
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
                            value={(item.Description as string) ?? ""}
                            type="text"
                            className={`w-full px-3 shadow text-[0.85rem] py-2 border ${
                                errors.Description ? "border-red-500" : "border-gray-200"
                            } rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Description"
                            required
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
            id: item.FieldId,
            FieldName: item.FieldName,
            FieldType: item.FieldType,
            // FieldName: item.FieldName,
            ComparativeField: item.ComparativeField === "Yes" ? "Yes" : "No",
            DisplayField: item.DisplayField === "Yes" ? "Yes" : "No",
            KeyField: item.KeyField === "Yes" ? "Yes" : "No",
            VerificationField: item.VerificationField === "Yes" ? "Yes" : "No",

            Description: item.Description,
            selected: item.MarkedFlag === "YES",
            actions: (
                <div className="relative flex items-center">
                    <button
                        onClick={() => {
                            handleViewClientDetails(item as ExistingRow);
                            props.handleBreadcrumbClick("FieldValues", `Field: ${item.FieldName as string}`);
                        }}
                        className="bg-[#0071E9] cursor-pointer text-gray-50 px-3 py-1 rounded text-sm"
                    >
                        Values
                    </button>
                    {/*
          <button
              onClick={() => handleEdit(item)}
              className="ml-2 text-white px-3 py-1 rounded text-sm"
          >
              <SquarePen
                  className="text-[#1A1A1A] cursor-pointer"/>
          </button>
          */}
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

    const hasEdits =
        Object.keys(state.editingRows).length > 0 || state.newRows.length > 0;

    if (state.IsLoading)
        return (
            <div className="h-96 py-20">
                <SpinnerV2 {...{ text: "Fetching data..." }} />
            </div>
        );

    if (state.Error) return <ErrorScreen message={state.Error} />;

    return (
        <div className="pt-0 pb-6 px-2">
            {props.ActiveBCItem === "FieldValues" ? (
                <div>
                    <TransactionFieldValues
                        ActiveBCItem={props.ActiveBCItem}
                        handleBreadcrumbClick={props.handleBreadcrumbClick}
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
                            <SearchBar
                                currentValue={state.SearchQuery}
                                onSearch={handleSearch}
                                size="medium"
                            />
                        </div>

                        <div className="flex items-center space-x-2 gap-4">
                            {/*
              <button
                  onClick={handleAddNew}
                  className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2 text-[0.89rem] cursor-pointer text-gray-950 font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
              >
                  <Plus className="w-5 h-5"/>
                  <span>Add</span>
              </button>
              */}
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
                        onSelectionChange={handleSelectionChange}
                        enableSelection={true}
                        columns={columns}
                        data={data}
                        responsive={true}
                    />

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
