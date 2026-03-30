// TablesMaster.tsx
import React, { useEffect, useReducer, useRef } from "react";
import CustomTable from "../../../utils/CustomTable.jsx";
import {
    ChevronLeft,
    CircleAlert,
    Edit,
    Plus,
    Save,
    Trash2,
    X,
    Eye,
    SquarePen,
    Home,
    Folder,
    File,
    Layers2,
    RefreshCcw,
} from "lucide-react";
import { apiRequest } from "../../../utils/helpers/ApiHelper.js";
import SpinnerV2 from "../../../utils/SpinnerV2.jsx";
import ErrorScreen from "../../../utils/ErrorScreen.jsx";
import Pagination from "../../../utils/Pagination.jsx";
import Toast from "../../../utils/Toast.jsx";
import ConfirmPopup from "../../../utils/ConfirmPopup.jsx";
import TablesFieldsMaster from "./TablesFieldsMaster.jsx";
import useDebounce from "../../../utils/helpers/useDebounce.js";
import SearchBar from "../../../utils/SearchBar.jsx";
import Dropdown from "../../../utils/Dropdown.jsx";
import Breadcrumb from "../../../utils/Breadcrumb.jsx";

interface BreadCrumbItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    show: boolean;
}

interface FilterObj {
    Module: string;
    SubModule: string;
    TableType: string;
}

interface SapTableBase {
    TableId?: string;
    TableName?: string;
    ApplicationName?: string;
    TableType?: string;
    Description?: string;
    Module?: string;
    SubModule?: string;
    isNew?: boolean;
    tempId?: number;
}

type EditingRows = Record<string | number, boolean>;
type RowErrors = Record<string | number, Record<string, string>>;

type TableColumn = { title: string; key?: string; className?: string };
type TableRowData = Record<string, React.ReactNode>;

interface State {
    Error: string;
    TablesMaster: SapTableBase[];
    SAPModuleList: any[];
    SAPSubModuleList: any[];
    TableTypeList: { value: string; label: string }[];
    BreadCrumbData: BreadCrumbItem[];
    ViewAppDetails: boolean;
    SearchQuery: string;
    CurrAddEditDetails: SapTableBase | Record<string, unknown>;
    ActiveBCItem: string;
    CurrentPage: number;
    TotalRecords: number | unknown;
    IsLoading: boolean;
    showToast: boolean;
    SavingLoader: boolean;
    isDataExist: string;
    FilterObj: FilterObj;
    editingRows: EditingRows;
    newRows: SapTableBase[];
    rowErrors: RowErrors;
    CurrPillActive: string;
}

export default function TablesMaster(): JSX.Element {
    const [state, setState] = useReducer(
        (prev: State, next: Partial<State>): State => ({ ...prev, ...next }),
        {
            Error: "",
            TablesMaster: [],
            SAPModuleList: [],
            SAPSubModuleList: [],
            TableTypeList: [
                { value: "Configuration", label: "Configuration" },
                { value: "Transaction", label: "Transaction" },
                { value: "Master", label: "Master" },
            ] satisfies { value: string; label: string }[],
            BreadCrumbData: [
                { id: "Tables", label: "Tables", icon: <Home size={16} />, show: true },
                { id: "Fields", label: "Fields", icon: undefined, show: false },
            ],
            ViewAppDetails: false,
            SearchQuery: "",
            CurrAddEditDetails: {},
            ActiveBCItem: "Tables",
            CurrentPage: 1,
            TotalRecords: 0,
            IsLoading: true,
            showToast: false,
            SavingLoader: false,
            isDataExist: "",
            FilterObj: {
                Module: "",
                SubModule: "",
                TableType: "",
            },
            editingRows: {},
            newRows: [],
            rowErrors: {},
            CurrPillActive: "TableInfo",
        } as State
    );

    const didFetchData = useRef<boolean>(false);
    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;

        const init = async (): Promise<void> => {
            setState({ IsLoading: true });
            await getData("");
            await GetSAPModulesMaster("");
            setState({ IsLoading: false });
        };

        void init();
    }, []);

    const GetSAPModulesMaster = async (): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetSAPModulesMaster", {});
            setState({
                SAPModuleList: resp.ResponseData as any[],
            });
        } catch (err) {
            console.error("Error loading SAP Modules:", err);
        }
    };

    const GetSAPSubModulesMasterByModule = async (Module: string = ""): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetSAPSubModulesMasterByModule", { Module });
            setState({
                SAPSubModuleList: resp.ResponseData as any[],
            });
        } catch (err) {
            console.error("Error loading SAP Sub Modules:", err);
        }
    };

    const getData = async (
        SearchQuery: string = "",
        PageNo: number = 1,
        FilterObj: FilterObj = { Module: "", SubModule: "", TableType: "" }
    ): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetSAPTablesMasterPaginationFilterSearchV2", {
                PageNo,
                StartDate: "",
                EndDate: "",
                Module: FilterObj.Module,
                SubModule: FilterObj.SubModule,
                TableType: FilterObj.TableType,
                SearchString: SearchQuery,
            });
            if (resp.ResponseData.length > 0) {
                setState({ TablesMaster: resp.ResponseData as SapTableBase[], TotalRecords: resp.TotalRecords });
            } else {
                setState({ TablesMaster: [], TotalRecords: [] });
            }
        } catch (err: unknown) {
            setState({ Error: String(err) });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const handleAddNew = (): void => {
        const newRow: SapTableBase = {
            TableId: "",
            TableName: "",
            ApplicationName: "SAP S4 Hana",
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

    const handleEdit = (item: SapTableBase): void => {
        setState({
            editingRows: {
                ...state.editingRows,
                [(item.isNew ? item.tempId : item.TableId) as string | number]: true,
            },
            rowErrors: {
                ...state.rowErrors,
                [(item.isNew ? item.tempId : item.TableId) as string | number]: {},
            },
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

    const handleCancelAll = (): void => {
        setState({
            editingRows: {},
            newRows: [],
            rowErrors: {},
        });
    };

    const originalBreadcrumbRef = useRef<Array<Pick<BreadCrumbItem, "id" | "label">>>([]);
    useEffect(() => {
        if (originalBreadcrumbRef.current.length === 0) {
            originalBreadcrumbRef.current = state.BreadCrumbData.map((item) => ({
                id: item.id,
                label: item.label,
            }));
        }
    }, [state.BreadCrumbData]);

    const handleBreadcrumbClick = (currentId: string, dynamicLabel: string | null = null): void => {
        const currentIndex = state.BreadCrumbData.findIndex((item) => item.id === currentId);
        if (currentIndex === -1) return;

        const updatedBreadcrumb = state.BreadCrumbData.map((item, idx) => {
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

    const validateAllRows = (): boolean => {
        const requiredFields: Array<keyof Pick<SapTableBase, "TableName">> = ["TableName"];
        const newRowErrors: RowErrors = {};
        let allValid = true;

        state.newRows.forEach((row) => {
            const rowId = row.tempId as number;
            newRowErrors[rowId] = {};

            requiredFields.forEach((field) => {
                if (!row[field]) {
                    newRowErrors[rowId][String(field)] = "This field is required";
                    allValid = false;
                }
            });
        });

        Object.keys(state.editingRows).forEach((id) => {
            if (typeof id === "string") {
                const row = state.TablesMaster.find((t) => t.TableId === id);
                if (row) {
                    newRowErrors[id] = {};
                    requiredFields.forEach((field) => {
                        if (!row[field]) {
                            newRowErrors[id][String(field)] = "This field is required";
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
                .map((id) => {
                    return state.TablesMaster.find((row) => row.TableId === id);
                })
                .filter(Boolean) as SapTableBase[];

            const rowsToSend = [...editedRows, ...state.newRows];

            if (rowsToSend.length > 0) {
                await apiRequest("/AddUpdateSAPTablesMasterV2", rowsToSend);
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

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement> | string,
        name: keyof SapTableBase,
        item: SapTableBase
    ): void => {
        const value = (typeof e === "string" ? e : e.target ? e.target.value : "") as string;

        if (item.isNew) {
            const updatedNewRows = state.newRows.map((row) => {
                if (row.tempId === item.tempId) {
                    const updatedRow: SapTableBase = { ...row, [name]: value };
                    if (name === "Module") {
                        updatedRow.SubModule = "";
                    }
                    return updatedRow;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedTables = state.TablesMaster.map((t) => {
                if (t.TableId === item.TableId) {
                    const updatedTable: SapTableBase = { ...t, [name]: value };
                    if (name === "Module") {
                        updatedTable.SubModule = "";
                    }
                    return updatedTable;
                }
                return t;
            });
            setState({ TablesMaster: updatedTables });
        }
    };

    const handlePageChange = (page: number): void => {
        setState({ CurrentPage: page });
        void getData(state.SearchQuery, page, state.FilterObj);
    };

    const handleDeleteItem = async (item: SapTableBase): Promise<void> => {
        if (item.TableName) {
            const resp: any = await apiRequest("/DeleteSAPTablesMasterV2", item);
            if (resp) {
                setState({ showToast: true });
                void getData(state.SearchQuery, state.CurrentPage, state.FilterObj);
                setTimeout(() => {
                    setState({ showToast: false });
                }, 3000);
            }
        } else {
            setState({
                newRows: state.newRows.filter((row) => row.tempId !== item.tempId),
                editingRows: {
                    ...state.editingRows,
                    [item.tempId as number]: false,
                },
                rowErrors: {
                    ...state.rowErrors,
                    [item.tempId as number]: undefined as unknown as Record<string, string>,
                },
            });
        }
    };

    const handleViewClientDetails = (item: SapTableBase): void => {
        setState({ ViewAppDetails: true, CurrAddEditDetails: item });
        handleBreadcrumbClick("Fields", `Table: ${item.TableName ?? ""}`);
    };

    const handleCloseClientDetails = (): void => {
        setState({ ViewAppDetails: false, ActiveBCItem: "Tables" });
        void getData("", state.CurrentPage);
    };

    const handleSearch = (value: string): void => {
        setState({ SearchQuery: value });
        if (value.trim() === "") {
            void getData("", 1, state.FilterObj);
        }
    };

    const handleDropdownClientInfo = (val: string, _options: unknown, name: keyof FilterObj): void => {
        const FilterObjLocal: FilterObj = { ...state.FilterObj };
        FilterObjLocal[name] = val;
        if (name === "Module") {
            FilterObjLocal["SubModule"] = "";
            setState({ FilterObj: FilterObjLocal });
            void GetSAPSubModulesMasterByModule(FilterObjLocal[name]);
        } else {
            setState({ FilterObj: FilterObjLocal });
        }
        void getData(state.SearchQuery, state.CurrentPage, FilterObjLocal);
    };

    const handleDropdownChange = (
        val: string,
        _options: unknown,
        name: keyof SapTableBase,
        item: SapTableBase
    ): void => {
        if (item.isNew) {
            const updatedNewRows = state.newRows.map((row) => {
                if (row.tempId === item.tempId) {
                    return { ...row, [name]: val };
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedTables = state.TablesMaster.map((t) => {
                if (t.TableId === item.TableId) {
                    return { ...t, [name]: val };
                }
                return t;
            });
            setState({ TablesMaster: updatedTables });
        }
    };

    const columns: TableColumn[] = [
        ...(state.FilterObj.Module ? [] : [{ title: "Module", key: "Module" as const }]),
        ...(state.FilterObj.SubModule ? [] : [{ title: "Sub Module", key: "SubModule" as const }]),
        { title: "Table Name", key: "TableName" },
        { title: "Table Type", key: "TableType" },
        { title: "Description", key: "Description", className: "min-w-[400px]" },
    ];

    const allRows: SapTableBase[] = [...state.newRows, ...state.TablesMaster];

    const data: TableRowData[] = allRows.map((item) => {
        const rowId = (item.isNew ? item.tempId : item.TableId) as string | number;
        const isEditing = state.editingRows[rowId];
        const errors = state.rowErrors[rowId] || {};

        if (isEditing) {
            return {
                TableName: (
                    <div>
                        <input
                            defaultValue={item.TableName || ""}
                            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                if (item.TableName !== e.target.value) {
                                    handleChange(e as unknown as React.ChangeEvent<HTMLInputElement>, "TableName", item);
                                }
                            }}
                            type="text"
                            className={`w-full px-3 shadow text-[0.85rem] py-2 border ${
                                (errors as Record<string, string>).TableName ? "border-red-500" : "border-gray-200"
                            } rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Enter Table Name"
                            required
                        />
                        {(errors as Record<string, string>).TableName && (
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">
                                    {(errors as Record<string, string>).TableName}
                                </p>
                            </div>
                        )}
                    </div>
                ),
                TableType: (
                    <div>
                        <Dropdown
                            size="small"
                            mode="single"
                            options={state.TableTypeList}
                            value={item.TableType}
                            onChange={(val: string, option: unknown) => handleDropdownChange(val, option, "TableType", item)}
                            placeholder="Select Table Type"
                        />
                    </div>
                ),
                Description: <div />,
                actions: (
                    <div className="relative flex items-center">
                        <ConfirmPopup message="Are you sure you want to delete this item?" onConfirm={() => void handleDeleteItem(item)}>
                            <button className="pr-4 flex items-center">
                                <Trash2 className="text-[#1A1A1A] cursor-pointer" />
                            </button>
                        </ConfirmPopup>
                    </div>
                ),
            };
        }

        return {
            ...(state.FilterObj.Module ? {} : { Module: item.Module || "-" }),
            ...(state.FilterObj.SubModule ? {} : { SubModule: item.SubModule || "-" }),
            TableName: item.TableName as React.ReactNode,
            TableType: item.TableType as React.ReactNode,
            Description: item.Description as React.ReactNode,
            actions: (
                <div className="relative flex items-center">
                    <button
                        onClick={(): void => handleViewClientDetails(item)}
                        className="bg-[#0071E9] cursor-pointer text-gray-50 px-3 py-1 rounded text-sm"
                    >
                        Fields
                    </button>
                    <button onClick={(): void => handleEdit(item)} className="ml-2 text-white px-3 py-1 rounded text-sm">
                        <SquarePen className="text-[#1A1A1A] cursor-pointer" />
                    </button>
                    <ConfirmPopup message="Are you sure you want to delete this item?" onConfirm={() => void handleDeleteItem(item)}>
                        <button className="ml-2 pr-4 flex items-center">
                            <Trash2 className="text-[#1A1A1A] cursor-pointer" />
                        </button>
                    </ConfirmPopup>
                </div>
            ),
        };
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
        <div className="pt-0 pb-6 px-6">
            <div className="pb-2.5 px-3.5">
                <Breadcrumb data={state.BreadCrumbData} activeItem={state.ActiveBCItem} onItemClick={handleBreadcrumbClick} />
            </div>

            {state.ActiveBCItem === "Fields" ? (
                <div>
                    <TablesFieldsMaster
                        handleBreadcrumbClick={handleBreadcrumbClick}
                        ActiveBCItem={state.ActiveBCItem}
                        CurrAddEditDetails={state.CurrAddEditDetails}
                    />
                </div>
            ) : (
                <>
                    <Toast message="Saved successfully!" show={state.showToast} onClose={(): void => setState({ showToast: false })} />
                    <div className="flex justify-between items-center pb-4">
                        <div className="w-1/3">
                            <SearchBar currentValue={state.SearchQuery} onSearch={handleSearch} size="medium" />
                        </div>

                        {!hasEdits && (
                            <div className="flex w-full items-center gap-5 ml-10">
                                <div className="w-[20%]">
                                    <p className="text-[0.80rem] font-semibold">Module</p>
                                    <Dropdown
                                        size="small"
                                        mode="single"
                                        options={state.SAPModuleList}
                                        value={state.FilterObj.Module}
                                        onChange={(val: string, item: unknown): void => handleDropdownClientInfo(val, item, "Module")}
                                        placeholder="All Modules"
                                    />
                                </div>

                                <div className="w-[20%]">
                                    <p className="text-[0.80rem] font-semibold">Sub Module</p>
                                    <Dropdown
                                        size="small"
                                        mode="single"
                                        options={state.SAPSubModuleList}
                                        value={state.FilterObj.SubModule}
                                        onChange={(val: string, item: unknown): void => handleDropdownClientInfo(val, item, "SubModule")}
                                        placeholder="All Sub Modules"
                                    />
                                </div>

                                <div className="w-[20%]">
                                    <p className="text-[0.80rem] font-semibold">Table Type</p>
                                    <Dropdown
                                        size="small"
                                        mode="single"
                                        options={state.TableTypeList}
                                        value={state.FilterObj.TableType}
                                        onChange={(val: string, item: unknown): void => handleDropdownClientInfo(val, item, "TableType")}
                                        placeholder="All Table Types"
                                    />
                                </div>
                            </div>
                        )}

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

                    <CustomTable columns={columns} data={data} responsive={true} />

                    {(typeof state.TotalRecords === "number" ? state.TotalRecords : 0) > 10 && (
                        <div className="pt-4 flex justify-end">
                            <Pagination
                                total={state.TotalRecords as number}
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
