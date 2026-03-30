import React, { useEffect, useReducer, useRef } from 'react';
import CustomTable from "../../../utils/CustomTable.jsx";
import { ChevronLeft, CircleAlert, Plus, Save, SquarePen, Trash2, X } from "lucide-react";
import { apiRequest } from "../../../utils/helpers/ApiHelper.js";
import SpinnerV2 from "../../../utils/SpinnerV2.jsx";
import ErrorScreen from "../../../utils/ErrorScreen.jsx";
import Pagination from "../../../utils/Pagination.jsx";
import Toast from "../../../utils/Toast.jsx";
import ConfirmPopup from "../../../utils/ConfirmPopup.jsx";
import TransactionFieldsMaster from "./TransactionFieldsMaster.jsx";
import useDebounce from "../../../utils/helpers/useDebounce.js";
import Dropdown from "../../../utils/Dropdown.jsx";
import SearchBar from "../../../utils/SearchBar.jsx";

export type Props = {
    CurrAddEditDetails: { TransactionCode: string };
    ActiveBCItem?: string;
    handleBreadcrumbClick: (label: string, subtitle?: string) => void;
};

type Marked = "Yes" | "No";

interface BaseRow {
    TransactionCode: string;
    SourceApplication?: string;
    TableName: string;
    TableType?: string;
    Description?: string;
    MarkedFlag?: Marked;
    checkFlag?: boolean;
    isNew?: boolean;
}

interface ExistingRow extends BaseRow {
    isNew?: false;
}

interface NewRow extends BaseRow {
    isNew: true;
    tempId: number;
    TableName: string;
    SourceApplication: string;
}

type Row = ExistingRow | NewRow;

interface FieldErrorMap {
    [field: string]: string;
}

interface State {
    Error: string;
    TransactionTablesMaster: ExistingRow[];
    FieldTypesMasterList: unknown[];
    sapTableList: { value: string; label: string; TableName: string }[];
    applicationsList: { value: string; label: string; ApplicationName: string }[];
    loadingSapTables: boolean;
    loadingApplications: boolean;
    ViewAppDetails: boolean;
    SearchQuery: string;
    CurrentPage: number;
    TotalRecords: number;
    IsLoading: boolean;
    showToast: boolean;
    SavingLoader: boolean;
    isDataExist: string;
    CurrAddEditDetails: Record<string, unknown>;
    editingRows: Record<string | number, boolean>;
    newRows: NewRow[];
    rowErrors: Record<string | number, FieldErrorMap>;
    pillItems: { key: "TransactionInfo" | "TransactionFields"; label: string }[];
    CurrPillActive: "TransactionInfo" | "TransactionFields";
    FilterObj: {
        SourceApplication: string;
    };
}

export default function TransactionTablesMaster(props: Props) {
    const [state, setState] = useReducer(
        (prev: State, newState: Partial<State>): State => ({ ...prev, ...newState }),
        {
            Error: "",
            TransactionTablesMaster: [],
            FieldTypesMasterList: [],
            sapTableList: [],
            applicationsList: [],
            loadingSapTables: false,
            loadingApplications: false,
            ViewAppDetails: false,
            SearchQuery: "",
            CurrentPage: 1,
            TotalRecords: 0,
            IsLoading: true,
            showToast: false,
            SavingLoader: false,
            isDataExist: "",
            CurrAddEditDetails: {},
            editingRows: {},
            newRows: [],
            rowErrors: {},
            pillItems: [
                { key: 'TransactionInfo', label: 'ScreenName Info' },
                { key: 'TransactionFields', label: 'ScreenName Fields' },
            ],
            CurrPillActive: "TransactionInfo",
            FilterObj: {
                SourceApplication: "All"
            },
        } as State
    );

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const didFetchData = useRef<boolean>(false);
    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;

        const init = async () => {
            setState({ IsLoading: true });

            await Promise.all([
                getData("", 1, { SourceApplication: "All" }),
                getFieldTypesMaster(""),
                getSAPTableList(),
                getApplicationsList(),
            ]);

            setState({ IsLoading: false });
        };

        init();
    }, [props.CurrAddEditDetails.TransactionCode]);

    useEffect(() => {
        if (!didFetchData.current) return;
        didFetchData.current = true;
        getData("");
    }, [props.CurrAddEditDetails.TransactionCode]);

    const getFieldTypesMaster = async (_?: unknown) => {
        try {
            const resp: any = await apiRequest("/GetFieldTypesMaster", {});
            setState({
                FieldTypesMasterList: resp.ResponseData,
            });
        } catch (err) {
            console.error("Error loading Country/State/City:", err);
        }
    };

    const getApplicationsList = async () => {
        try {
            setState({ loadingApplications: true });
            const resp: any = await apiRequest("/GetApplicationsMasterPaginationFilterSearch", {
                PageNo: 1,
                SearchString: ""
            });

            const formattedData = (resp.ResponseData as Array<{ ApplicationName: string }>).map(app => ({
                value: app.ApplicationName,
                label: app.ApplicationName,
                ApplicationName: app.ApplicationName
            }));

            setState({
                applicationsList: formattedData,
                loadingApplications: false
            });
        } catch (err) {
            console.error("Error loading Applications List:", err);
            setState({ loadingApplications: false });
        }
    };

    const getSAPTableList = async () => {
        try {
            setState({ loadingSapTables: true });
            const resp: any = await apiRequest("/GetSAPTablesListV2", {});

            const formattedData = (resp.ResponseData as Array<{ TableName: string }>).map(table => ({
                value: table.TableName,
                label: table.TableName,
                TableName: table.TableName
            }));

            setState({
                sapTableList: formattedData,
                loadingSapTables: false
            });
        } catch (err) {
            console.error("Error loading SAP Table List:", err);
            setState({ loadingSapTables: false });
        }
    };

    const getData = async (SearchQuery: string = "", PageNo: number = 1, FilterObj: { SourceApplication?: string } = {}) => {
        try {
            const resp: any = await apiRequest("/GetSAPTcodeTablesMasterPaginationFilterSearchV2", {
                PageNo,
                StartDate: "",
                EndDate: "",
                TransactionCode: props.CurrAddEditDetails.TransactionCode,
                SearchString: SearchQuery,
                SourceApplication: FilterObj.SourceApplication === "All" ? "" : (FilterObj.SourceApplication || "")
            });
            if (resp.ResponseData.length > 0) {
                setState({ TransactionTablesMaster: resp.ResponseData as ExistingRow[], TotalRecords: resp.TotalRecords as number });
            } else {
                setState({ TransactionTablesMaster: [], TotalRecords: [] as unknown as number });
            }
        } catch (err: unknown) {
            setState({ Error: String(err) });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const handleFilterChange = (val: string) => {
        const newFilterObj = { SourceApplication: val };
        setState({ FilterObj: newFilterObj, CurrentPage: 1 });
        getData(state.SearchQuery, 1, newFilterObj);
    };

    const handleAddNew = () => {
        const newRow: NewRow = {
            TransactionCode: props.CurrAddEditDetails.TransactionCode,
            SourceApplication: "SAP",
            TableName: "",
            TableType: "",
            Description: "",
            isNew: true,
            tempId: Date.now()
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

    const handleEdit = (item: Row) => {
        const rowId: string | number = item.isNew ? (item as NewRow).tempId : item.TableName;
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
    };

    const handleCancelAll = () => {
        setState({
            editingRows: {},
            newRows: [],
            rowErrors: {}
        });
    };

    const validateAllRows = () => {
        const requiredFields: Array<keyof BaseRow> = ["TableName"];
        const newRowErrors: Record<string | number, FieldErrorMap> = {};
        let allValid = true;

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

        Object.keys(state.editingRows).forEach(id => {
            if (isNaN(Number(id))) {
                const row = state.TransactionTablesMaster.find(t => t.TableName === id);
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

    const handleSaveUpdateSelectionFlag = async (item: Array<{ TransactionCode?: string; TableName?: string; MarkedFlag?: Marked }>) => {
        await apiRequest("/UpdateTransactionTableSelectionFlagMasterV2", item as any);
    };

    const handleSaveAll = async () => {
        if (!validateAllRows()) return;

        setState({ SavingLoader: true });

        try {
            const editedRows: ExistingRow[] = Object.keys(state.editingRows)
                .filter(id => isNaN(Number(id)))
                .map(tableName => {
                    return state.TransactionTablesMaster.find(row => row.TableName === tableName) as ExistingRow | undefined;
                })
                .filter(Boolean) as ExistingRow[];

            const rowsToSend: Row[] = [...editedRows, ...state.newRows];

            if (rowsToSend.length > 0) {
                await apiRequest("/AddUpdateSAPTcodeTablesMasterV2", rowsToSend as any);
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
        } catch (error: unknown) {
            setState({ SavingLoader: false, Error: String(error) });
        }
    };

    const handleDropdownClientInfo = (val: string, options: unknown, name: keyof BaseRow, item: Row) => {
        if (name === "TableName" && options) {
            if (item.isNew) {
                const updatedNewRows = state.newRows.map(row => {
                    if (row.tempId === (item as NewRow).tempId) {
                        return {
                            ...row,
                            [name]: val
                        };
                    }
                    return row;
                });
                setState({ newRows: updatedNewRows });
            } else {
                const updatedTransactions = state.TransactionTablesMaster.map(t => {
                    if (t.TableName === item.TableName) {
                        return {
                            ...t,
                            [name]: val
                        };
                    }
                    return t;
                });
                setState({ TransactionTablesMaster: updatedTransactions });
            }
        } else {
            if (item.isNew) {
                const updatedNewRows = state.newRows.map(row => {
                    if (row.tempId === (item as NewRow).tempId) {
                        return { ...row, [name]: val };
                    }
                    return row;
                });
                setState({ newRows: updatedNewRows });
            } else {
                const updatedTransactions = state.TransactionTablesMaster.map(t => {
                    if (t.TableName === item.TableName) {
                        return { ...t, [name]: val };
                    }
                    return t;
                });
                setState({ TransactionTablesMaster: updatedTransactions });
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, name: keyof BaseRow, item: Row) => {
        if (item.isNew) {
            const updatedNewRows = state.newRows.map(row => {
                if (row.tempId === (item as NewRow).tempId) {
                    return { ...row, [name]: e.target.value };
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedTransactions = state.TransactionTablesMaster.map(t => {
                if (t.TableName === item.TableName) {
                    return { ...t, [name]: e.target.value };
                }
                return t;
            });
            setState({ TransactionTablesMaster: updatedTransactions });
        }
    };

    const handlePageChange = (page: number) => {
        setState({ CurrentPage: page });
        getData(state.SearchQuery, page);
    };

    const handleDeleteItem = async (item: Row) => {
        if (item.TableName && !item.isNew) {
            const resp: any = await apiRequest("/DeleteSAPTcodeTablesMasterV2", item as any);
            if (resp) {
                setState({ showToast: true });
                getData();
                setTimeout(() => {
                    setState({ showToast: false });
                }, 3000);
            }
        } else {
            setState({
                newRows: state.newRows.filter(row => row.tempId !== (item as NewRow).tempId),
                editingRows: {
                    ...state.editingRows,
                    [(item as NewRow).tempId]: false
                },
                rowErrors: {
                    ...state.rowErrors,
                    [(item as NewRow).tempId]: undefined as unknown as FieldErrorMap
                }
            });
        }
    };

    const handleViewClientDetails = (item: Row) => {
        setState({ ViewAppDetails: true, CurrAddEditDetails: item as unknown as Record<string, unknown> });
    };

    const handleCloseClientDetails = () => {
        setState({ ViewAppDetails: false });
        getData("", state.CurrentPage);
    };

    const debouncedSearchQuery: string = useDebounce<string>(state.SearchQuery, 300);
    const didSearchRun = useRef<boolean>(false);

    useEffect(() => {
        if (!didSearchRun.current) {
            didSearchRun.current = true;
            return;
        }
        if (debouncedSearchQuery.trim() === "") return;
        getData(debouncedSearchQuery);
    }, [debouncedSearchQuery]);

    const handleSearch = (value: string) => {
        setState({ SearchQuery: value });
        if (value.trim() === "") {
            getData("", 1, state.FilterObj);
        }
    };

    const handleSelectionChange = (
        newList: Array<Partial<Pick<BaseRow, "TransactionCode" | "TableName" | "MarkedFlag">> & { checkFlag?: boolean }> | null,
        item?: Partial<Pick<BaseRow, "TransactionCode" | "TableName">> & { checkFlag?: boolean }
    ) => {
        console.log("newList, item", newList, item);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            if (item) {
                if (item.checkFlag) {
                    handleSaveUpdateSelectionFlag([{
                        TransactionCode: item.TransactionCode,
                        TableName: item.TableName,
                        MarkedFlag: "Yes",
                    }]);
                } else {
                    handleSaveUpdateSelectionFlag([{
                        TransactionCode: item.TransactionCode,
                        TableName: item.TableName,
                        MarkedFlag: "No",
                    }]);
                }
            } else {
                if (newList) {
                    const FinalReqArra: Array<{ TransactionCode?: string; TableName?: string; MarkedFlag?: Marked }> = [];
                    newList.map((v) => {
                        const marked: Marked = v.checkFlag ? "Yes" : "No";
                        FinalReqArra.push({
                            TransactionCode: v.TransactionCode,
                            TableName: v.TableName,
                            MarkedFlag: marked,
                        });
                    });
                    if (FinalReqArra.length > 0) {
                        handleSaveUpdateSelectionFlag(FinalReqArra);
                    }
                }
            }
        }, 200);
    };

    const columns: { title: string; key: string; className?: string }[] = [
        { title: 'Source Application', key: 'SourceApplication' },
        { title: 'Table Name', key: 'TableName' },
        { title: 'TableType', key: 'TableType' },
        { title: 'Description', key: 'Description', className: 'min-w-[400px]' },
    ] as const;

    const allRows: Row[] = [...state.newRows, ...state.TransactionTablesMaster];

    const data: Array<Record<string, React.ReactNode | string | number | boolean | undefined>> = allRows.map((item) => {
        const rowId: string | number = item.isNew ? (item as NewRow).tempId : item.TableName;
        const isEditing = state.editingRows[rowId];
        const errors = state.rowErrors[rowId] || {};

        if (isEditing) {
            return {
                SourceApplication: (
                    <div>
                        <Dropdown
                            mode="single"
                            options={state.applicationsList}
                            value={item.SourceApplication || "SAP"}
                            onChange={(val: string, option: unknown) => handleDropdownClientInfo(val, option, "SourceApplication", item)}
                            onSearch={(q: string) => console.log("Search Applications:", q)}
                            placeholder="Select Application"
                            loading={state.loadingApplications}
                            searchable={true}
                            className={`w-full ${errors.SourceApplication ? 'border-red-500' : 'border-gray-200'}`}
                        />
                        {errors.SourceApplication &&
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.SourceApplication}</p>
                            </div>
                        }
                    </div>
                ),
                TableName: (
                    <div>
                        <Dropdown
                            mode="single"
                            options={state.sapTableList}
                            value={item.TableName}
                            onChange={(val: string, option: unknown) => handleDropdownClientInfo(val, option, "TableName", item)}
                            onSearch={(q: string) => console.log("Search SAP Tables:", q)}
                            placeholder="Select SAP Table"
                            loading={state.loadingSapTables}
                            searchable={true}
                            className={`w-full ${errors.TableName ? 'border-red-500' : 'border-gray-200'}`}
                        />
                        {errors.TableName &&
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.TableName}</p>
                            </div>
                        }
                    </div>
                ),
                TableType: (
                    <div>
                        <input
                            defaultValue={item.TableType || ''}
                            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                if (item.TableType !== e.target.value) {
                                    handleChange(e as unknown as React.ChangeEvent<HTMLInputElement>, "TableType", item);
                                }
                            }}
                            type="text"
                            className={`w-full px-3 shadow text-[0.85rem] py-2 border ${errors.TableType ? 'border-red-500' : 'border-gray-200'} rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Enter Table Type"
                            required
                        />
                        {errors.TableType &&
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.TableType}</p>
                            </div>
                        }
                    </div>
                ),
                Description: (
                    <div>
                        <input
                            defaultValue={item.Description || ''}
                            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                if (item.Description !== e.target.value) {
                                    handleChange(e as unknown as React.ChangeEvent<HTMLInputElement>, "Description", item);
                                }
                            }}
                            type="text"
                            className={`w-full px-3 shadow text-[0.85rem] py-2 border ${errors.Description ? 'border-red-500' : 'border-gray-200'} rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Enter Description"
                            required
                        />
                        {errors.Description &&
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.Description}</p>
                            </div>
                        }
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
        return {
            SourceApplication: item.SourceApplication || 'SAP',
            TableName: item.TableName,
            id: item.TableName,
            TransactionCode: item.TransactionCode,
            TableType: item.TableType || "",
            Description: item.Description || "",
            selected: item.MarkedFlag === "Yes",
            actions: (
                <div className="relative flex items-center">
                    <button onClick={() => {
                        handleViewClientDetails(item);
                        props?.handleBreadcrumbClick("Fields", `Table: ${item.TableName}`);
                    }}
                            className="bg-[#0071E9] cursor-pointer text-gray-50 px-3 py-1 rounded text-sm">
                        Fields
                    </button>
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

    console.log("ActiveBCItemActiveBCItemActiveBCItem", props.ActiveBCItem);
    return (
        <div className="pt-0 pb-6 px-2">
            {props.ActiveBCItem === "Fields" || props.ActiveBCItem === "FieldValues" ? (
                <div>
                    <TransactionFieldsMaster ActiveBCItem={props.ActiveBCItem} handleBreadcrumbClick={props.handleBreadcrumbClick} CurrAddEditDetails={state.CurrAddEditDetails} />
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

                        <div className="flex items-center space-x-2 gap-4">
                            <div className="min-w-[200px]">
                                <Dropdown
                                    mode="single"
                                    options={[
                                        { value: "All", label: "All Applications" },
                                        ...state.applicationsList
                                    ]}
                                    value={state.FilterObj?.SourceApplication || "All"}
                                    onChange={handleFilterChange}
                                    placeholder="Filter by Application"
                                    loading={state.loadingApplications}
                                    searchable={true}
                                    className="w-full"
                                />
                            </div>

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

                    <CustomTable onSelectionChange={handleSelectionChange} enableSelection={true} columns={columns} data={data} responsive={true} />
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
