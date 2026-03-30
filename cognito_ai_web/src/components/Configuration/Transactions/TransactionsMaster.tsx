import React, { useEffect, useReducer, useRef, useState } from 'react';
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
    RefreshCcw
} from "lucide-react";
import { apiRequest } from "../../../utils/helpers/ApiHelper.js";
import SpinnerV2 from "../../../utils/SpinnerV2.jsx";
import ErrorScreen from "../../../utils/ErrorScreen.jsx";
import Pagination from "../../../utils/Pagination.jsx";
import PillGroup from "../../../utils/PillGroup.jsx";
import Toast from "../../../utils/Toast.jsx";
import ConfirmPopup from "../../../utils/ConfirmPopup.jsx";
import TransactionFieldsMaster from "./TransactionFieldsMaster.jsx";
import useDebounce from '../../../utils/helpers/useDebounce.js';
import TransactionTablesMaster from "./TransactionTablesMaster.jsx";
import SearchBar from "../../../utils/SearchBar.jsx";
import Dropdown from "../../../utils/Dropdown.jsx";
import Breadcrumb from "../../../utils/Breadcrumb.jsx";
import CustomModal from "@/utils/CustomModal";
import CustomTableData from "@/utils/CustomTableData";
import {ImportButton} from "@/utils/ImportButton";
import {fileToJson} from "@/utils/fileToJson";

type RowId = string | number;

interface DropdownOption {
    value: string;
    label: string;
    ApplicationName?: string;
}

interface BreadcrumbItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    show: boolean;
}

interface TransactionRow {
    TransactionId?: string;
    Transaction?: string;
    TransactionCode?: string;
    Description?: string;
    Module?: string;
    SubModule?: string;
    ApplicationName?: string;
    ApplicationIdTransactionId?: string;
    isNew?: boolean;
    tempId?: number;
    [key: string]: unknown;
}

interface State {
    Error: string;
    openSyncWithSAPModal: boolean;
    TransactionsMaster: TransactionRow[];
    SAPModuleList: DropdownOption[] | any[];
    SAPSubModuleList: DropdownOption[] | any[];
    applicationsList: DropdownOption[];
    loadingApplications: boolean;
    rowSubModuleLists: Record<RowId, DropdownOption[] | any[]>;
    rowApplicationsLists: Record<RowId, DropdownOption[] | any[]>;
    BreadCrumbData: BreadcrumbItem[];
    ViewAppDetails: boolean;
    SearchQuery: string;
    CurrAddEditDetails: TransactionRow | Record<string, unknown>;
    ActiveBCItem: string;
    CurrentPage: number;
    TCodeSyncData: any;
    SyncTCODECriteria: any;
    TCodeTablesSyncData: any;
    TotalRecords: number;
    IsLoading: boolean;
    showToast: boolean;
    toastMessage:string;
    toastType:string;
    SavingLoader: boolean;
    SyncTcodeLoader: boolean;
    isDataExist: string;
    FilterObj: {
        Module: string;
        SubModule: string;
        ApplicationName: string;
    };
    editingRows: Record<RowId, boolean>;
    newRows: TransactionRow[];
    rowErrors: Record<RowId, Record<string, string>>;
    pillItems: { key: string; label: string }[];
    CurrPillActive: string;
}

type NewState = Partial<State> & Record<string, unknown>;

interface EditableCellProps {
    item: TransactionRow;
    field: string;
    value?: string;
    onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string,
        name: string,
        item: TransactionRow
    ) => void;
    error?: string;
    placeholder?: string;
    type?: "input" | "textarea";
    rows?: number;
}

interface TableColumn {
    title: string;
    key?: string;
    className?: string;
}

type TableRow = Record<string, string | number | boolean | React.ReactNode | undefined>;

export default function TransactionsMaster(): React.ReactNode {
    const [active, setActive] = useState<string>("file");
    const [state, setState] = useReducer(
        (prev: State, newState: NewState): State => ({ ...prev, ...newState } as State),
        {
            Error: "",
            openSyncWithSAPModal: false,
            SyncTcodeLoader: false,
            TCodeSyncData: [],
            SyncTCODECriteria: {},
            TransactionsMaster: [],
            TCodeTablesSyncData: [],
            SAPModuleList: [],
            SAPSubModuleList: [],
            applicationsList: [],
            loadingApplications: false,
            rowSubModuleLists: {},
            rowApplicationsLists: {},
            BreadCrumbData: [
                { id: "Transactions", label: "Transactions", icon: <Home size={16} />, show: true },
                { id: "Tables", label: "Tables", icon: "", show: false },
                { id: "Fields", label: "Fields", icon: "", show: false },
                { id: "FieldValues", label: "FieldValues", icon: "", show: false },
            ],
            ViewAppDetails: false,
            SearchQuery: "",
            CurrAddEditDetails: {},
            ActiveBCItem: "Transactions",
            CurrentPage: 1,
            TotalRecords: 0,
            IsLoading: true,
            showToast: false,
            toastMessage:"",
            toastType:"",
            SavingLoader: false,
            isDataExist: "",
            FilterObj: {
                Module: "",
                SubModule: "",
                ApplicationName: "",
            },
            editingRows: {},
            newRows: [],
            rowErrors: {},
            pillItems: [
                { key: 'TransactionInfo', label: 'Transaction Info' },
                { key: 'TransactionFields', label: 'Transaction Fields' },
            ],
            CurrPillActive: "TransactionInfo"
        } as State
    );

    const didFetchData = useRef<boolean>(false);
    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;

        const init = async () => {
            setState({ IsLoading: true });
            await getData("");
            await GetSAPModulesMaster("");
            await getApplicationsList();
            setState({ IsLoading: false });
        };

        init();
    }, []);

    const getApplicationsList = async () => {
        try {
            setState({ loadingApplications: true });
            const resp: any = await apiRequest("/GetApplicationsMasterPaginationFilterSearch", {
                "PageNo": 1,
                "SearchString": ""
            });

            const formattedData: DropdownOption[] = (resp.ResponseData || []).map((app: any) => ({
                value: String(app.ApplicationName ?? ""),
                label: String(app.ApplicationName ?? ""),
                ApplicationName: String(app.ApplicationName ?? "")
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

    const GetSAPModulesMaster = async () => {
        try {
            const resp: any = await apiRequest("/GetSAPModulesMaster", {});
            setState({
                SAPModuleList: resp.ResponseData,
            });
        } catch (err) {
            console.error("Error loading Country/State/City:", err);
        }
    };

    const GetSAPSubModulesMasterByModule = async (Module: string = "") => {
        try {
            const resp: any = await apiRequest("/GetSAPSubModulesMasterByModule", { Module });
            setState({
                SAPSubModuleList: resp.ResponseData,
            });
        } catch (err) {
            console.error("Error loading Country/State/City:", err);
        }
    };

    const GetSAPSubModulesMasterByModuleForRow = async (Module: string = "", rowId: RowId) => {
        try {
            const resp: any = await apiRequest("/GetSAPSubModulesMasterByModule", { Module });
            setState({
                rowSubModuleLists: {
                    ...state.rowSubModuleLists,
                    [rowId]: resp.ResponseData
                }
            });
        } catch (err) {
            console.error("Error loading SubModules for row:", err);
        }
    };

    const getData = async (SearchQuery: string = "", PageNo: number = 1, FilterObj: { Module: string; SubModule: string; ApplicationName: string } = { Module: "", SubModule: "", ApplicationName: "" }) => {
        try {
            const resp: any = await apiRequest("/GetTransactionsMasterPaginationFilterSearchV2", {
                "PageNo": PageNo,
                "StartDate": "",
                "EndDate": "",
                "Module": FilterObj.Module,
                "SubModule": FilterObj.SubModule,
                "ApplicationName": FilterObj.ApplicationName,
                "SearchString": SearchQuery
            });
            if ((resp.ResponseData || []).length > 0) {
                setState({ TransactionsMaster: resp.ResponseData as TransactionRow[], TotalRecords: Number(resp.TotalRecords ?? 0) });
            } else {
                setState({ TransactionsMaster: [], TotalRecords: [] });
            }
        } catch (err: unknown) {
            setState({ Error: String(err) });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const handleAddNew = () => {
        const newRow: TransactionRow = {
            "TransactionId": "",
            "Transaction": "",
            "TransactionCode": "",
            "Description": "",
            "Module": "",
            "SubModule": "",
            "ApplicationName": "",
            "ApplicationIdTransactionId": state.TransactionsMaster?.[0]?.ApplicationIdTransactionId || '',
            "isNew": true,
            "tempId": Date.now()
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

    const handleEdit = async (item: TransactionRow) => {
        const rowId: RowId = item.isNew ? (item.tempId as number) : (item.TransactionId as string);
        setState({
            editingRows: {
                ...state.editingRows,
                [item.isNew ? (item.tempId as number) : (item.TransactionId as string)]: true
            },
            rowErrors: {
                ...state.rowErrors,
                [item.isNew ? (item.tempId as number) : (item.TransactionId as string)]: {}
            }
        });

        if (item.Module) {
            await GetSAPSubModulesMasterByModuleForRow(item.Module, rowId);
        }
    };

    const debouncedSearchQuery = useDebounce(state.SearchQuery, 300);
    const didSearchRun = useRef<boolean>(false);

    useEffect(() => {
        if (!didSearchRun.current) {
            didSearchRun.current = true;
            return;
        }

        if (debouncedSearchQuery.trim() === "") return;

        getData(debouncedSearchQuery);
    }, [debouncedSearchQuery]);

    const handleCancelAll = () => {
        setState({
            editingRows: {},
            newRows: [],
            rowErrors: {},
            rowSubModuleLists: {},
            rowApplicationsLists: {}
        });
    };

    const originalBreadcrumbRef = useRef<Array<Pick<BreadcrumbItem, 'id' | 'label'>>>([]);
    useEffect(() => {
        if (originalBreadcrumbRef.current.length === 0) {
            originalBreadcrumbRef.current = state.BreadCrumbData.map(item => ({
                id: item.id,
                label: item.label,
            }));
        }
    }, [state.BreadCrumbData]);

    const handleBreadcrumbClick = (currentId: string, dynamicLabel: string | null = null) => {
        const currentIndex = state.BreadCrumbData.findIndex(item => item.id === currentId);
        if (currentIndex === -1) return;

        const updatedBreadcrumb: BreadcrumbItem[] = state.BreadCrumbData.map((item, idx) => {
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
                            ? (originalBreadcrumbRef.current[idx]?.label || item.label)
                            : isCurrent
                                ? (originalBreadcrumbRef.current[idx]?.label || item.label)
                                : item.label,
            };
        });
        setState({
            ActiveBCItem: currentId,
            BreadCrumbData: updatedBreadcrumb,
        });
    };

    const validateAllRows = () => {
        const requiredFields = ["Transaction", "TransactionCode", "Module", "ApplicationName"];

        const newRowErrors: Record<RowId, Record<string, string>> = {};
        let allValid = true;

        state.newRows.forEach(row => {
            const rowId = row.tempId as number;
            newRowErrors[rowId] = {};

            requiredFields.forEach(field => {
                if (!row[field]) {
                    newRowErrors[rowId][field] = "This field is required";
                    allValid = false;
                }
            });
        });

        Object.keys(state.editingRows).forEach(id => {
            if (typeof id === 'string') {
                const row = state.TransactionsMaster.find(t => t.TransactionId === id);
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

    const handleSaveAll = async () => {
        if (!validateAllRows()) return;

        setState({ SavingLoader: true });

        try {
            const editedRows: TransactionRow[] = Object.keys(state.editingRows)
                .filter(id => typeof id === 'string')
                .map(id => state.TransactionsMaster.find(row => row.TransactionId === id) as TransactionRow)
                .filter(Boolean);

            const rowsToSend: TransactionRow[] = [...editedRows, ...state.newRows];

            if (rowsToSend.length > 0) {
                await apiRequest("/AddUpdateTransactionsMaster", rowsToSend);

                const appTransactionMappings = rowsToSend.map(row => ({
                    ApplicationIdTransactionId: row.ApplicationIdTransactionId || '',
                    ApplicationName: row.ApplicationName,
                    TransactionCode: row.TransactionCode,
                    SortKey: 0,
                    Status: 1
                }));

                await apiRequest("/AddUpdateApplicationTransactionsMasterV2", appTransactionMappings);

                const lastSavedTransactionCode = rowsToSend[rowsToSend.length - 1].TransactionCode || "";

                setState({
                    SavingLoader: false,
                    showToast: true,
                    editingRows: {},
                    newRows: [],
                    rowErrors: {},
                    SearchQuery: String(lastSavedTransactionCode)
                });

                await getData(String(lastSavedTransactionCode), 1, state.FilterObj);
                setTimeout(() => setState({ showToast: false }), 3000);
            } else {
                setState({
                    SavingLoader: false,
                    editingRows: {},
                    newRows: [],
                    rowErrors: {}
                });
            }

        } catch (error: unknown) {
            setState({ SavingLoader: false, Error: String(error) });
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string,
        name: string,
        item: TransactionRow
    ) => {
        const value = typeof e === 'string' ? e : e.target ? e.target.value : "";

        if (item.isNew) {
            const updatedNewRows = state.newRows.map(row => {
                if (row.tempId === item.tempId) {
                    const updatedRow: TransactionRow = { ...row, [name]: value };
                    if (name === 'Module') {
                        updatedRow.SubModule = '';
                        if (value) {
                            GetSAPSubModulesMasterByModuleForRow(String(value), item.tempId as number);
                        }
                    }
                    return updatedRow;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedTransactions = state.TransactionsMaster.map(t => {
                if (t.TransactionId === item.TransactionId) {
                    const updatedTransaction: TransactionRow = { ...t, [name]: value };
                    if (name === 'Module') {
                        updatedTransaction.SubModule = '';
                        if (value) {
                            GetSAPSubModulesMasterByModuleForRow(String(value), item.TransactionId as string);
                        }
                    }
                    return updatedTransaction;
                }
                return t;
            });
            setState({ TransactionsMaster: updatedTransactions });
        }
    };

    const handlePageChange = (page: number) => {
        setState({ CurrentPage: page });
        getData(state.SearchQuery, page, state.FilterObj);
    };

    const handleSyncTransactionsSAP = async (Payload:any) => {
        let req={
            Transactions:state.TCodeSyncData,
            // RFC_Identifier:"YSBAI_GET_TCODES_BY_MOD",
            RFC_Identifier:"YSBAI_GET_TABLES_BY_TCODE",
        }
        setState({SyncTcodeLoader:true})
        // const resp=await apiRequest("/SyncTablesWithSAPSystemByTransactions", req);
        // const resp=await apiRequest("/SyncTcode_Tables_Fields_Obj_CMP_VC_WithSAP", req);
        const resp=await apiRequest("/SyncWithSAPSystemByRFC", req);
        setState({SyncTcodeLoader:false})
        console.log("respjadjaoiddjad",resp)
        setState({TCodeTablesSyncData:resp.Responses})
        //
    }

    const handleSyncMergeDataSAP = async () => {
    setState({ SyncTcodeLoader: true });
    
    try {
        const payload = {};
        
        const resp = await apiRequest("/SyncSAPMasterData", payload);
        setState({ SyncTcodeLoader: false });
        
        console.log("Sync Response:", resp);
        
        // Check the response structure properly
        if (resp && resp.status === 'success') {
            // Calculate total from ResponseData
            let totalRecords = 0;
            if (resp.ResponseData) {
                totalRecords = Object.values(resp.ResponseData).reduce(
                    (sum: number, table: any) => sum + (table.count || 0), 
                    0
                );
            }
            
            const message = totalRecords > 0 
                ? `Successfully synced ${totalRecords} record(s) from SAP Master data!`
                : resp.message || 'Sync completed. No new records found.';
            
            setState({ 
                showToast: true,
                toastMessage: message,
                toastType: 'success'
            });
            
            setTimeout(() => {
                setState({ showToast: false });
            }, 4000);
            
        } else if (resp && resp.status === 'partial_fail') {
            const message = resp.message || 'Some tables failed to sync. Please check logs.';
            
            setState({ 
                showToast: true,
                toastMessage: message,
                toastType: 'warning'
            });
            
            setTimeout(() => {
                setState({ showToast: false });
            }, 5000);
            
        } else {
            setState({ 
                showToast: true,
                toastMessage: resp?.message || 'Failed to sync SAP Master data. Please try again.',
                toastType: 'error'
            });
            
            setTimeout(() => {
                setState({ showToast: false });
            }, 4000);
        }
        
    } catch (error) {
        setState({ SyncTcodeLoader: false });
        console.error("Sync Error:", error);
        
        setState({ 
            showToast: true,
            toastMessage: 'An error occurred while syncing data.',
            toastType: 'error'
        });
        
        setTimeout(() => {
            setState({ showToast: false });
        }, 4000);
    }
};

const handleSyncTempDataSAP = async (Payload:any) => {
        setState({ SyncTcodeLoader: true });
    
    try {
        const payload = {};
        
        const resp = await apiRequest("/SyncTcode_Tables_Fields_Obj_CMP_VC_WithSAP", payload);
        setState({ SyncTcodeLoader: false });
        
        console.log("Sync Response:", resp);
        
        // Check the response structure properly
        if (resp && resp.status === 'success') {
            // Calculate total from ResponseData
            
            
            const message =  resp.message || 'Temporory Sync completed';
            
            setState({ 
                showToast: true,
                toastMessage: message,
                toastType: 'success'
            });
            
            setTimeout(() => {
                setState({ showToast: false });
            }, 4000);
            
        } else {
            setState({ 
                showToast: true,
                toastMessage: resp?.message || 'Failed to sync temporory SAP Master data. Please try again.',
                toastType: 'error'
            });
            
            setTimeout(() => {
                setState({ showToast: false });
            }, 4000);
        }
        
    } catch (error) {
        setState({ SyncTcodeLoader: false });
        console.error("Sync Error:", error);
        
        setState({ 
            showToast: true,
            toastMessage: 'An error occurred while syncing data.',
            toastType: 'error'
        });
        
        setTimeout(() => {
            setState({ showToast: false });
        }, 4000);
    }
}
    

    const handleSyncSAP = async (Payload:any) => {
        setState({openSyncWithSAPModal:true})
    }

    const handleDeleteItem = async (item: TransactionRow) => {
        if (item.TransactionId) {
            const resp: any = await apiRequest("/DeleteTransactionsMaster", item);
            if (resp) {
                setState({ showToast: true });
                getData(state.SearchQuery, state.CurrentPage, state.FilterObj);
                setTimeout(() => {
                    setState({ showToast: false });
                }, 3000);
            }
        } else {
            setState({
                newRows: state.newRows.filter(row => row.tempId !== item.tempId),
                editingRows: {
                    ...state.editingRows,
                    [item.tempId as number]: false
                },
                rowErrors: {
                    ...state.rowErrors,
                    [item.tempId as number]: undefined as unknown as Record<string, string>
                }
            });
        }
    };

    const handleViewClientDetails = (item: TransactionRow) => {
        setState({ ViewAppDetails: true, CurrAddEditDetails: item });
        handleBreadcrumbClick("Tables", `TCode: ${item.TransactionCode}`);
    };

    const handleSearch = (value: string) => {
        setState({ SearchQuery: value });
        if (value.trim() === "") {
            getData("", 1, state.FilterObj);
        }
    };
    const handleImportTcodes =async (file: File) => {
        console.log("User selected file:", file.name);
        let fileJSON= await fileToJson(file,{})
        console.log("fileJSON",fileJSON)
        setState({TCodeSyncData:fileJSON})

    };
    const handleDropdownSyncTcodeCriteria = (val: string, _options: unknown, name: "Module" | "SubModule" | "ApplicationName") => {
        const SyncTCODECriteria = state.SyncTCODECriteria;
        SyncTCODECriteria[name] = val;
        setState({ SyncTCODECriteria });

    }
    const handleDropdownClientInfo = (val: string, _options: unknown, name: "Module" | "SubModule" | "ApplicationName") => {
        const FilterObj = { ...state.FilterObj };
        FilterObj[name] = val;
        if (name === "Module") {
            FilterObj["SubModule"] = "";
            setState({ FilterObj });
            GetSAPSubModulesMasterByModule(FilterObj[name]);
        } else {
            setState({ FilterObj });
        }

        getData(state.SearchQuery, state.CurrentPage, FilterObj);
    };

    const EditableCell: React.FC<EditableCellProps> = ({ item, field, value, onChange, error, placeholder, type = "input", rows = 3 }) => {
        const [localValue, setLocalValue] = useState<string>(value || '');

        useEffect(() => {
            setLocalValue(value || '');
        }, [value]);

        const handleChangeLocal = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const newValue = e.target.value;
            setLocalValue(newValue);
            const key = `timeout_${item.isNew ? item.tempId : item.TransactionId}_${field}`;
            const timeouts = (globalThis as unknown as Record<string, number | undefined>);
            clearTimeout(timeouts[key]);
            timeouts[key] = window.setTimeout(() => {
                onChange(e, field, item);
            }, 100);
        };

        const handleBlur = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const key = `timeout_${item.isNew ? item.tempId : item.TransactionId}_${field}`;
            const timeouts = (globalThis as unknown as Record<string, number | undefined>);
            clearTimeout(timeouts[key]);
            onChange(e, field, item);
        };

        if (type === "textarea") {
            return (
                <div>
          <textarea
              value={localValue}
              onChange={handleChangeLocal}
              onBlur={handleBlur}
              rows={rows}
              className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={placeholder}
          />
                    {error && (
                        <div className="flex items-center mt-1 ml-2">
                            <CircleAlert size={14} className="text-red-500" />
                            <p className="ml-2 text-red-500 text-sm">{error}</p>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div>
                <input
                    value={localValue}
                    onChange={handleChangeLocal}
                    onBlur={handleBlur}
                    type="text"
                    className={`w-full px-3 shadow text-[0.85rem] py-2 border ${error ? 'border-red-500' : 'border-gray-200'} rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder={placeholder}
                    required={field === 'Transaction' || field === 'TransactionCode'}
                />
                {error && (
                    <div className="flex items-center mt-1 ml-2">
                        <CircleAlert size={14} className="text-red-500" />
                        <p className="ml-2 text-red-500 text-sm">{error}</p>
                    </div>
                )}
            </div>
        );
    };

    const columns: TableColumn[] = [
        ...(state.FilterObj.ApplicationName ? [] : [{ title: 'Application', key: 'ApplicationName' }]),
        ...(state.FilterObj.Module ? [] : [{ title: 'Module', key: 'Module' }]),
        ...(state.FilterObj.SubModule ? [] : [{ title: 'Sub Module', key: 'SubModule' }]),
        { title: 'Transaction', key: 'Transaction' },
        { title: 'Transaction Code', key: 'TransactionCode' },
        { title: 'Description', key: 'Description', className: 'min-w-[100px]' },
    ];

    const allRows: TransactionRow[] = [...state.newRows, ...state.TransactionsMaster];


    const TcodeSyncColums = [
        {
            key: "id",
            header: "#",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "8rem",
        },
        {
            key: "Module",
            header: "Module",
            sortable: false,
            filterable: true,
            TruncateData: false,
            colWidth: "20rem",
        },
        {
            key: "TransactionCode",
            header: "Transaction",
            sortable: false,
            filterable: true,
            TruncateData: false,
            colWidth: "20rem",
        },
        {
            key: "Description",
            header: "Description",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "20rem",
        },
    ];

    const TcodeTablesSyncColums = [
        {
            key: "id",
            header: "#",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "8rem",
        },
        {
            key: "TransactionCode",
            header: "Transaction",
            sortable: false,
            filterable: true,
            TruncateData: false,
            colWidth: "20rem",
        },
        {
            key: "TableName",
            header: "TableName",
            sortable: false,
            filterable: true,
            TruncateData: false,
            colWidth: "20rem",
        },
        {
            key: "Description",
            header: "Description",
            sortable: false,
            filterable: true,
            TruncateData: false,
            colWidth: "20rem",
        },
    ];

    const SyncData= state.TCodeSyncData.map((item,id) => {
        return {
            id:id+1,
            Module: item.Module,
            TransactionCode: item.TCODE,
            Description: item.Description,
        }
    });

    const SyncTcodeTableData= state.TCodeTablesSyncData.map((item,id) => {
        return {
            id:id+1,
            TableName: item.TableName,
            TransactionCode: item.TCODE,
            Description: item.Description,
        }
    });



    const data: TableRow[] = allRows.map((item: TransactionRow) => {
        const rowId: RowId = item.isNew ? (item.tempId as number) : (item.TransactionId as string);
        const isEditing = state.editingRows[rowId];
        const errors = state.rowErrors[rowId] || {};

        if (isEditing) {
            return {
                ...(state.FilterObj.ApplicationName ? {} : {
                    ApplicationName: (
                        <div>
                            <Dropdown
                                size="small"
                                mode="single"
                                options={state.applicationsList}
                                value={item.ApplicationName}
                                onChange={(val: string) => handleChange(val, "ApplicationName", item)}
                                placeholder="Select Application"
                            />
                            {errors.ApplicationName &&
                                <div className="flex items-center mt-1 ml-2">
                                    <CircleAlert size={14} className="text-red-500" />
                                    <p className="ml-2 text-red-500 text-sm">{errors.ApplicationName}</p>
                                </div>
                            }
                        </div>
                    )
                }),
                ...(state.FilterObj.Module ? {} : {
                    Module: (
                        <div>
                            <Dropdown
                                size="small"
                                mode="single"
                                options={state.SAPModuleList}
                                value={item.Module}
                                onChange={(val: string) => handleChange(val, "Module", item)}
                                placeholder="Select Module"
                            />
                            {errors.Module &&
                                <div className="flex items-center mt-1 ml-2">
                                    <CircleAlert size={14} className="text-red-500" />
                                    <p className="ml-2 text-red-500 text-sm">{errors.Module}</p>
                                </div>
                            }
                        </div>
                    )
                }),
                ...(state.FilterObj.SubModule ? {} : {
                    SubModule: (
                        <div>
                            <Dropdown
                                size="small"
                                mode="single"
                                options={state.rowSubModuleLists[rowId] || []}
                                value={item.SubModule}
                                onChange={(val: string) => handleChange(val, "SubModule", item)}
                                placeholder="Select Sub Module"
                                disabled={!item.Module}
                            />
                        </div>
                    )
                }),
                Transaction: (
                    <div>
                        <input
                            defaultValue={item.Transaction || ''}
                            onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
                                if (item.Transaction !== e.target.value) {
                                    handleChange(e, "Transaction", item);
                                }
                            }}
                            type="text"
                            className={`w-full px-3 shadow text-[0.85rem] py-2 border ${errors.Transaction ? 'border-red-500' : 'border-gray-200'} rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Enter Screen Name"
                            required
                        />
                        {errors.Transaction &&
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.Transaction}</p>
                            </div>
                        }
                    </div>
                ),
                TransactionCode: (
                    <div>
                        <input
                            defaultValue={item.TransactionCode || ''}
                            onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
                                if (item.TransactionCode !== e.target.value) {
                                    handleChange(e, "TransactionCode", item);
                                }
                            }}
                            type="text"
                            className={`w-full px-3 shadow text-[0.85rem] py-2 border ${errors.TransactionCode ? 'border-red-500' : 'border-gray-200'} rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Enter Transaction Code"
                            required
                        />
                        {errors.TransactionCode &&
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.TransactionCode}</p>
                            </div>
                        }
                    </div>
                ),
                Description: (
                    <textarea
                        defaultValue={item.Description || ''}
                        onBlur={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                            if (item.Description !== e.target.value) {
                                handleChange(e, "Description", item);
                            }
                        }}
                        rows={3}
                        className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter Description"
                    />
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
            } as TableRow;
        }

        return {
            ...(state.FilterObj.ApplicationName ? {} : { ApplicationName: item.ApplicationName || '-' }),
            ...(state.FilterObj.Module ? {} : { Module: item.Module || '-' }),
            ...(state.FilterObj.SubModule ? {} : { SubModule: item.SubModule || '-' }),
            TransactionCode: item.TransactionCode as string,
            Transaction: item.Transaction as string,
            Description: item.Description as string,
            actions: (
                <div className="relative flex items-center">
                    <button onClick={() => handleViewClientDetails(item)}
                            className="bg-[#0071E9] cursor-pointer text-gray-50 px-3 py-1 rounded text-sm">
                        Tables
                    </button>
                    <button
                        onClick={() => handleEdit(item)}
                        className="ml-2 text-white px-3 py-1 rounded text-sm"
                    >
                        <SquarePen className="text-[#1A1A1A] cursor-pointer" />
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
        } as TableRow;
    });

    const hasEdits = Object.keys(state.editingRows).length > 0 || state.newRows.length > 0;

    if (state.IsLoading) return <div className="h-96 py-20"><SpinnerV2 {...{ text: "Fetching data..." }} /></div>;
    if (state.Error) return <ErrorScreen message={state.Error} />;

    return (
        <div className="pt-0 pb-6 ">
            <div className="pb-2.5 px-3.5">
                <Breadcrumb
                    data={state.BreadCrumbData}
                    activeItem={state.ActiveBCItem}
                    onItemClick={handleBreadcrumbClick}
                />
            </div>
            <CustomModal
                modalZIndex={1005}
                width="max-w-6xl"
                isOpen={state.openSyncWithSAPModal}
                onClose={() => setState({ openSyncWithSAPModal: false })}
                title={
                    <div className="text-lg">
                        Sync Transactions from SAP
                    </div>
                }
                footerContent={[
                    <button
                        key="close"
                        onClick={() => setState({ openSyncWithSAPModal: false })}
                        className="mt-2 cursor-pointer px-5 py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg"
                    >
                        Close
                    </button>,
                ]}
            >
                <div className="relative">
                    <div className=" flex items-center justify-between">
                        {/*<div className="w-[40%] z-40">*/}
                        {/*    <p className=" ">Select Module</p>*/}
                        {/*    <Dropdown*/}
                        {/*        size="medium"*/}
                        {/*        mode="single"*/}
                        {/*        options={state.SAPModuleList}*/}
                        {/*        value={state.SyncTCODECriteria.Module}*/}
                        {/*        onChange={(val: string, item: unknown) => handleDropdownSyncTcodeCriteria(val, item, "Module")}*/}
                        {/*        onSearch={(q: string) => console.log("Search (Multi):", q)}*/}
                        {/*    />*/}
                        {/*</div>*/}
                        <div>
                            <ImportButton onSelect={handleImportTcodes} label="Import CSV / Excel" />
                        </div>
                        
                        <button
                            onClick={() => handleSyncMergeDataSAP({})} // Pass empty object or remove parameter
                            disabled={state.SyncTcodeLoader}
                            className={`${
                                state.SyncTcodeLoader 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-[#0071E9] hover:bg-[#005ABA] cursor-pointer'
                            } text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2 text-[0.89rem] transition-colors`}
                        >
                            {state.SyncTcodeLoader ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Syncing...</span>
                                </>
                            ) : (
                                <>
                                    <RefreshCcw className="w-5 h-5" />
                                    <span>Merge Sync Data</span>
                                </>
                            )}
                        </button>


                        <button
                            onClick={() => handleSyncTempDataSAP({})} // Pass empty object or remove parameter
                            disabled={state.SyncTcodeLoader}
                            className={`${
                                state.SyncTcodeLoader 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-[#0071E9] hover:bg-[#005ABA] cursor-pointer'
                            } text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2 text-[0.89rem] transition-colors`}
                        >
                            {state.SyncTcodeLoader ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Syncing...</span>
                                </>
                            ) : (
                                <>
                                    <RefreshCcw className="w-5 h-5" />
                                    <span>Sync Temp Data</span>
                                </>
                            )}
                        </button>

                        
                        <button
                            onClick={handleSyncTransactionsSAP}
                            className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.99rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2 text-[0.89rem] cursor-pointer text-gray-950 font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
                        >
                            <RefreshCcw className="w-5 h-5" />
                            <span>Sync Tables</span>
                        </button>
                    </div>

                    <div className="mt-4">
                        {
                            state.TCodeTablesSyncData.length>0?<CustomTableData
                                showSpinnerFlag={state.SyncTcodeLoader}
                                HorizontalScroll={false}
                                scrollHeightClass="h-[calc(100vh-340px)]"
                                truncateCharLimit={40}
                                data={SyncTcodeTableData}
                                columns={TcodeTablesSyncColums}
                                rowKey="id"
                            />:<CustomTableData
                                showSpinnerFlag={state.SyncTcodeLoader}
                                HorizontalScroll={false}
                                scrollHeightClass="h-[calc(100vh-340px)]"
                                truncateCharLimit={40}
                                data={SyncData}
                                columns={TcodeSyncColums}
                                rowKey="id"
                            />
                        }

                        {/*<CustomTable  columns={TcodeSyncColums} data={SyncData} responsive={true} />*/}
                    </div>

                </div>
            </CustomModal>
            {state.ActiveBCItem === "Tables" || state.ActiveBCItem === "Fields" || state.ActiveBCItem === "FieldValues" ? (
                <div>
                    <TransactionTablesMaster handleBreadcrumbClick={handleBreadcrumbClick} ActiveBCItem={state.ActiveBCItem} CurrAddEditDetails={state.CurrAddEditDetails} />
                </div>
            ) : (
                <>
                    <Toast
                        message={state.toastMessage || "Saved successfully!"}
                        show={state.showToast}
                        type={state.toastType || 'success'} // 'success', 'error', 'warning'
                        onClose={() => setState({ showToast: false })}
                    /> 
                    <div className="flex justify-between items-center pb-4">
                        <div className="w-1/3">
                            <SearchBar currentValue={state.SearchQuery} onSearch={handleSearch} size="medium" />
                        </div>

                        {!hasEdits && <div className="flex w-full items-center gap-5 ml-10">
                            <div className="w-[20%]">
                                <p className="text-[0.80rem] font-semibold">Application</p>
                                <Dropdown
                                    size="small"
                                    mode="single"
                                    options={state.applicationsList}
                                    value={state.FilterObj.ApplicationName}
                                    onChange={(val: string, item: unknown) => handleDropdownClientInfo(val, item, "ApplicationName")}
                                    onSearch={(q: string) => console.log("Search (Application):", q)}
                                />
                            </div>

                            <div className="w-[20%]">
                                <p className="text-[0.80rem] font-semibold">Module</p>
                                <Dropdown
                                    size="small"
                                    mode="single"
                                    options={state.SAPModuleList}
                                    value={state.FilterObj.Module}
                                    onChange={(val: string, item: unknown) => handleDropdownClientInfo(val, item, "Module")}
                                    onSearch={(q: string) => console.log("Search (Multi):", q)}
                                />
                            </div>

                            <div className="w-[20%]">
                                <p className="text-[0.80rem] font-semibold">Sub Module</p>
                                <Dropdown
                                    size="small"
                                    mode="single"
                                    options={state.SAPSubModuleList}
                                    value={state.FilterObj.SubModule}
                                    onChange={(val: string, item: unknown) => handleDropdownClientInfo(val, item, "SubModule")}
                                    onSearch={(q: string) => console.log("Search (Multi):", q)}
                                />
                            </div>

                            <div className="ml-6 cursor-pointer border border-[#0071E9] rounded-full px-3 py-1"
                                onClick={handleSyncSAP}
                            >
                                <p className="text-[#0071E9] font-semibold text-sm flex items-center" ><RefreshCcw className="mr-1" size={15} />Sync with SAP</p>
                            </div>
                        </div>
                        }

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

                    {(state.TotalRecords as number) > 10 && (
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
