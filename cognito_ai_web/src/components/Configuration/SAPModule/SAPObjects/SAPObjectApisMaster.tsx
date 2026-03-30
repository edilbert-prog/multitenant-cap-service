// SAPObjectApisMaster
import React, { useEffect, useReducer, useRef } from 'react';
import CustomTable from "../../../../utils/CustomTable";
import { CircleAlert, Plus, Save, SquarePen, Trash2, X, Home } from "lucide-react";
import { apiRequest } from "../../../../utils/helpers/ApiHelper";
import SpinnerV2 from "../../../../utils/SpinnerV2";
import ErrorScreen from "../../../../utils/ErrorScreen";
import Pagination from "../../../../utils/Pagination";
import Toast from "../../../../utils/Toast";
import useDebounce from "../../../../utils/helpers/useDebounce";
import ConfirmPopup from "../../../../utils/ConfirmPopup";
import Dropdown from "../../../../utils/Dropdown";
import { FiTrash2 } from "react-icons/fi";
import DatasetDetailsMaster from "./DatasetDetailsMaster";
import Breadcrumb from "../../../../utils/Breadcrumb";


/** ----------------------------------------------------------------
 * Local prop typings for JS utils (kept flexible, matching usage)
 * ---------------------------------------------------------------- */
interface DropdownProps {
    mode: "single" | "multiple";
    options: unknown[];
    value: string | number | null | undefined;
    onChange: (val: string | number, item: unknown) => void;
    onSearch?: (q: string) => void;
    [key: string]: unknown;
}
const DropdownTyped = Dropdown as React.ComponentType<DropdownProps>;

interface PaginationProps {
    total: number;
    current: number;
    pageSize: number;
    onChange: (page: number) => void;
    showSizeChanger?: boolean;
    [key: string]: unknown;
}
const PaginationTyped = Pagination as React.ComponentType<PaginationProps>;

interface ToastProps {
    message: string;
    show: boolean;
    onClose: () => void;
    [key: string]: unknown;
}
const ToastTyped = Toast as React.ComponentType<ToastProps>;

interface ConfirmPopupProps {
    message: string;
    onConfirm: () => void;
    children: React.ReactNode;
    [key: string]: unknown;
}
const ConfirmPopupTyped = ConfirmPopup as React.ComponentType<ConfirmPopupProps>;

interface BreadcrumbProps {
    data: BreadCrumbItem[];
    activeItem: string;
    onItemClick: (id: string) => void;
    [key: string]: unknown;
}
const BreadcrumbTyped = Breadcrumb as React.ComponentType<BreadcrumbProps>;

interface SpinnerV2Props {
    text?: string;
    [key: string]: unknown;
}
const SpinnerV2Typed = SpinnerV2 as React.ComponentType<SpinnerV2Props>;

interface ErrorScreenProps {
    message: string;
    [key: string]: unknown;
}
const ErrorScreenTyped = ErrorScreen as React.ComponentType<ErrorScreenProps>;

interface TableColumn {
    title: string;
    key: string;
    className?: string;
}
type RowData = Record<string, React.ReactNode>;
interface CustomTableProps {
    columns: TableColumn[];
    data: RowData[];
    responsive?: boolean;
    [key: string]: unknown;
}
const CustomTableTyped = CustomTable as React.ComponentType<CustomTableProps>;

/** ----------------------------------------------------------------
 * Domain models & component props
 * ---------------------------------------------------------------- */
type ApiMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type ApiType = "ODATA" | "RFC" | "TOSCA";

interface CurrAddEditDetails {
    ObjectId?: string;
}

interface HeaderKeyValue {
    key: string;
    value: string;
}

interface SAPObjectApi {
    ObjectId: string;
    ApiId: string | number;
    ServiceName: string;
    ApiType: ApiType;
    ApiMethod: ApiMethod;
    EndPoint: string;
    Version: string;
    RequestSchema: string;
    Headers: string;
    ResponseData: string;
    ValidationKey: string;
    ValidationPath: string;
    UsePadding: number;
    IsFinalStep: number;
    Notes: string;
    SortKey: number;
    Status: number;
    [key: string]: unknown;
}

interface ValidateFields {
    ServiceName: string;
    ApiType: string;
    ApiMethod: string;
    EndPoint: string;
}

interface OptionItem {
    label: string;
    value: string;
}

interface BreadCrumbItem {
    id: string;
    label: string;
    icon: React.ReactNode | string;
    show: boolean;
}

interface State {
    ActionType: "" | "Add" | "Update" | "Dataset";
    Error: string;
    SearchQuery: string;
    CurrentPage: number;
    TotalRecords: number;
    SAPObjectApisMaster: SAPObjectApi[];
    IsLoading: boolean;
    showToast: boolean;
    SavingLoader: boolean;
    CurrAddEditObj: SAPObjectApi;
    HeadersArray: HeaderKeyValue[];
    ValidateFields: ValidateFields;
    FormErrors: Partial<Record<keyof ValidateFields, string>>;
    ApiMethodOptions: OptionItem[];
    ApiTypeOptions: OptionItem[];
    BreadCrumbData: BreadCrumbItem[];
    ActiveBCItem: string;
}

export type Props = {
    CurrAddEditDetails: {
        TransactionCode: string;
        ObjectId?: string;
        [key: string]: any;
    };
};

/** ----------------------------------------------------------------
 * Component
 * ---------------------------------------------------------------- */
export default function SAPObjectApisMaster(props: Props) {
    const { CurrAddEditDetails } = props;

    const initialState: State = {
        ActionType: "",
        Error: "",
        SearchQuery: "",
        CurrentPage: 1,
        TotalRecords: 1,
        SAPObjectApisMaster: [],
        IsLoading: true,
        showToast: false,
        SavingLoader: false,
        CurrAddEditObj: {
            ObjectId: CurrAddEditDetails?.ObjectId || "",
            ApiId: "",
            ServiceName: "",
            ApiType: "ODATA",
            ApiMethod: "GET",
            EndPoint: "",
            Version: "",
            RequestSchema: "",
            Headers: "",
            ResponseData: "",
            ValidationKey: "",
            ValidationPath: "",
            UsePadding: 0,
            IsFinalStep: 0,
            Notes: "",
            SortKey: 0,
            Status: 1
        },
        HeadersArray: [{ key: "", value: "" }],
        ValidateFields: {
            ServiceName: "",
            ApiType: "",
            ApiMethod: "",
            EndPoint: ""
        },
        FormErrors: {},
        ApiMethodOptions: [
            { label: "GET", value: "GET" },
            { label: "POST", value: "POST" },
            { label: "PUT", value: "PUT" },
            { label: "PATCH", value: "PATCH" },
            { label: "DELETE", value: "DELETE" }
        ],
        ApiTypeOptions: [
            { label: "ODATA", value: "ODATA" },
            { label: "RFC", value: "RFC" },
            { label: "TOSCA", value: "TOSCA" }
        ],
        BreadCrumbData: [
            { id: "APIs", label: "APIs", icon: <Home size={16} />, show: true },
            { id: "Dataset", label: "Dataset", icon: "", show: false },
        ],
        ActiveBCItem: "APIs",
    };

    const [state, setState] = useReducer(
        (prevState: State, newState: Partial<State>) => ({ ...prevState, ...newState }),
        initialState
    );

    const didFetchData = useRef<boolean>(false);

    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;
        void getData("");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getData = async (searchQuery = "", pageNo = 1): Promise<void> => {
        setState({ IsLoading: true, Error: "" });
        try {
            const resp: any = await apiRequest("/GetSAPObjectApisMasterPaginationFilterSearch", {
                PageNo: pageNo,
                ObjectId: CurrAddEditDetails?.ObjectId || "",
                SearchString: searchQuery
            });
            if (resp?.ResponseData) {
                setState({
                    SAPObjectApisMaster: resp.ResponseData,
                    TotalRecords: resp.TotalRecords || 0,
                    CurrentPage: pageNo,
                    IsLoading: false
                });
            } else {
                setState({
                    SAPObjectApisMaster: [],
                    TotalRecords: 0,
                    IsLoading: false
                });
            }
        } catch (error) {
            setState({ Error: (error as Error).toString(), IsLoading: false });
        }
    };

    const handleEdit = (item: SAPObjectApi): void => {
        let parsedHeaders: HeaderKeyValue[] = [{ key: "", value: "" }];
        try {
            if (item.Headers && item.Headers.trim() !== "") {
                const headersObj: Record<string, string> = JSON.parse(item.Headers);
                parsedHeaders = Object.entries(headersObj).map(([key, value]) => ({
                    key,
                    value
                }));
            }
        } catch (error) {
            console.error("Error parsing headers:", error);
        }
        setState({ ActionType: "Update", CurrAddEditObj: item, HeadersArray: parsedHeaders });
    };

    const handleAdd = (): void => {
        const CurrAddEditObj: SAPObjectApi = {
            ObjectId: CurrAddEditDetails?.ObjectId || "",
            ApiId: "",
            ServiceName: "",
            ApiType: "ODATA",
            ApiMethod: "GET",
            EndPoint: "",
            Version: "",
            RequestSchema: "",
            Headers: "",
            ResponseData: "",
            ValidationKey: "",
            ValidationPath: "",
            UsePadding: 0,
            IsFinalStep: 0,
            Notes: "",
            SortKey: 0,
            Status: 1
        };
        setState({ ActionType: "Add", CurrAddEditObj, HeadersArray: [{ key: "", value: "" }] });
    };

    const handleCancel = (): void => {
        const CurrAddEditObj: SAPObjectApi = {
            ObjectId: CurrAddEditDetails?.ObjectId || "",
            ApiId: "",
            ServiceName: "",
            ApiType: "ODATA",
            ApiMethod: "GET",
            EndPoint: "",
            Version: "",
            RequestSchema: "",
            Headers: "",
            ResponseData: "",
            ValidationKey: "",
            ValidationPath: "",
            UsePadding: 0,
            IsFinalStep: 0,
            Notes: "",
            SortKey: 0,
            Status: 1
        };
        setState({ ActionType: "", CurrAddEditObj, HeadersArray: [{ key: "", value: "" }] });
        void getData("");
    };

    const debouncedSearchQuery: string = (useDebounce(state.SearchQuery, 300) as string);
    const didSearchRun = useRef<boolean>(false);

    useEffect(() => {
        if (!didSearchRun.current) {
            didSearchRun.current = true;
            return;
        }
        if (debouncedSearchQuery.trim() === "") return;
        void getData(debouncedSearchQuery);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchQuery]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const value = e.target.value;
        setState({ SearchQuery: value });
        if (value.trim() === "") {
            void getData("");
        }
    };

    const handleChangeApiInfo = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
        name: keyof SAPObjectApi
    ): void => {
        const CurrAddEditObj: SAPObjectApi = { ...state.CurrAddEditObj };
        (CurrAddEditObj as Record<string, unknown>)[name as string] = e.target.value;
        setState({ CurrAddEditObj });
    };

    const handleDropdownChange = (
        val: string | number,
        _options: unknown,
        name: keyof SAPObjectApi
    ): void => {
        const CurrAddEditObj: SAPObjectApi = { ...state.CurrAddEditObj };
        (CurrAddEditObj as Record<string, unknown>)[name as string] = val as unknown;
        setState({ CurrAddEditObj });
    };

    const handleCheckboxChange = (name: keyof SAPObjectApi): void => {
        const CurrAddEditObj: SAPObjectApi = { ...state.CurrAddEditObj };
        (CurrAddEditObj as Record<string, unknown>)[name as string] = CurrAddEditObj[name] === 1 ? 0 : 1;
        setState({ CurrAddEditObj });
    };

    // Header management functions
    const updateHeader = (index: number, field: "key" | "value", value: string): void => {
        const updated = [...state.HeadersArray];
        updated[index][field] = value;
        setState({ HeadersArray: updated });
    };

    const addHeader = (): void => {
        setState({ HeadersArray: [...state.HeadersArray, { key: "", value: "" }] });
    };

    const removeHeader = (index: number): void => {
        const updated = state.HeadersArray.filter((_, i) => i !== index);
        setState({ HeadersArray: updated });
    };

    const validateApiForm = (): boolean => {
        const FormErrors: State["FormErrors"] = {};
        let formIsValid = true;

        for (const name in state.ValidateFields) {
            const key = name as keyof ValidateFields;
            const value = state.CurrAddEditObj[key as keyof SAPObjectApi];
            if (value === "" || value === 0) {
                formIsValid = false;
                FormErrors[key] = "This field is required";
            } else {
                FormErrors[key] = "";
            }
        }
        setState({ FormErrors });
        return formIsValid;
    };

    const handleDeleteItem = async (item: SAPObjectApi): Promise<void> => {
        const resp: any = await apiRequest("/DeleteSAPObjectApisMaster", item);
        if (resp) {
            setState({ showToast: true });
            void getData();
            setTimeout(() => {
                setState({ showToast: false });
            }, 3000);
        }
    };

    const handlePageChange = (page: number): void => {
        setState({ CurrentPage: page });
        void getData(state.SearchQuery, page);
    };

    const handleSubmitApiInfo = async (): Promise<void> => {
        if (!validateApiForm()) {
            return;
        }

        // Convert HeadersArray to JSON object
        const headerObj: Record<string, string> = {};
        state.HeadersArray.forEach((h) => {
            if (h.key.trim()) {
                headerObj[h.key] = h.value;
            }
        });

        const submitData = {
            ...state.CurrAddEditObj,
            Headers: JSON.stringify(headerObj) // Convert headers to JSON string
        };

        setState({ SavingLoader: true });
        const resp: any = await apiRequest("/AddUpdateSAPObjectApisMaster", submitData);
        if (resp) {
            setState({ SavingLoader: false, showToast: true, ActionType: "" });
            void getData();
            setTimeout(() => {
                setState({ showToast: false });
            }, 3000);
        }
    };

    const handleViewDataset = (item: SAPObjectApi): void => {
        const updatedBreadcrumb = state.BreadCrumbData.map(bc => ({
            ...bc,
            show: bc.id === "APIs" || bc.id === "Dataset"
        }));
        setState({
            ActionType: "Dataset",
            CurrAddEditObj: item,
            BreadCrumbData: updatedBreadcrumb,
            ActiveBCItem: "Dataset"
        });
    };

    const handleBackFromDataset = (): void => {
        const updatedBreadcrumb = state.BreadCrumbData.map(bc => ({
            ...bc,
            show: bc.id === "APIs"
        }));
        setState({
            ActionType: "",
            BreadCrumbData: updatedBreadcrumb,
            ActiveBCItem: "APIs"
        });
    };

    const handleBreadcrumbClick = (id: string): void => {
        if (id === "APIs") {
            handleBackFromDataset();
        }
    };

    if (state.IsLoading) {
        return (
            <div className="h-96 py-20">
                <SpinnerV2Typed {...{ text: "Fetching data..." }} />
            </div>
        );
    }
    if (state.Error) return <ErrorScreenTyped message={state.Error} />;

    if (state.ActionType === "Dataset") {
        return (
            <div className="pt-0 pb-20">
                <div className="pb-2.5 px-3.5">
                    <BreadcrumbTyped
                        data={state.BreadCrumbData}
                        activeItem={state.ActiveBCItem}
                        onItemClick={handleBreadcrumbClick}
                    />
                </div>
                <DatasetDetailsMaster
                    CurrAddEditDetails={state.CurrAddEditObj}
                    handleBreadcrumbClick={handleBreadcrumbClick}
                />
            </div>
        );
    }

    const columns: TableColumn[] = [
        { title: '#ID', key: 'ApiId', className: 'max-w-[30px]' },
        { title: 'Service Name', key: 'ServiceName' },
        { title: 'Type', key: 'ApiType', className: 'max-w-[80px]' },
        { title: 'Method', key: 'ApiMethod', className: 'max-w-[80px]' },
        { title: 'End Point', key: 'EndPoint' },
        { title: 'Version', key: 'Version', className: 'max-w-[80px]' },
        // { title: 'Actions', key: 'actions', className: 'text-center' }
    ];

    const data: RowData[] = state.SAPObjectApisMaster.map((v) => ({
        ApiId: v.ApiId as React.ReactNode,
        ServiceName: v.ServiceName,
        ApiType: (<span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">{v.ApiType}</span>),
        ApiMethod: (<span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">{v.ApiMethod}</span>),
        EndPoint: v.EndPoint,
        Version: v.Version || 'N/A',
        actions: (
            <div className="flex items-center justify-center space-x-2">
                <button
                    onClick={() => handleViewDataset(v)}
                    className="bg-[#0071E9] cursor-pointer text-gray-50 px-3 py-1 rounded text-sm hover:bg-[#005ABA]"
                >
                    Dataset
                </button>
                <button onClick={() => handleEdit(v)} className="text-[#1A1A1A]" type="button">
                    <SquarePen className="w-5 h-5" />
                </button>
                <ConfirmPopupTyped
                    message="Are you sure you want to delete this API?"
                    onConfirm={() => { void handleDeleteItem(v); }}
                >
                    <button className="text-[#1A1A1A]" type="button">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </ConfirmPopupTyped>
            </div>
        ),
    }));

    return (
        <div className="pt-0 pb-6 px-6">
            <ToastTyped
                message="Saved successfully!"
                show={state.showToast}
                onClose={() => null}
            />
            {state.ActionType !== "" ? (
                <div className="w/full pt-2">
                    <div className="flex justify-end">
                        <button
                            onClick={() => { void handleSubmitApiInfo(); }}
                            type="button"
                            disabled={state.SavingLoader}
                            className="px-4 mr-2 py-2 flex items-center gap-2 text-white text-sm bg-[#0071E9] rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {state.SavingLoader ? (
                                <>
                                    <SpinnerV2Typed {...{ text: "" }} />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleCancel}
                            type="button"
                            className="px-4 py-2 flex items-center gap-2 text-gray-700 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
                        >
                            <X className="w-4 h-4" />
                            Cancel
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mt-6">
                        <div>
                            <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                Service Name
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                                onChange={(e) => handleChangeApiInfo(e, "ServiceName")}
                                value={state.CurrAddEditObj.ServiceName}
                                type="text"
                                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter Service Name"
                            />
                            {state.FormErrors.ServiceName && (
                                <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                                    <CircleAlert className="w-4 h-4" />
                                    <span>{state.FormErrors.ServiceName}</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                API Type
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <DropdownTyped
                                mode="single"
                                options={state.ApiTypeOptions}
                                value={state.CurrAddEditObj.ApiType}
                                onChange={(val: string | number) => handleDropdownChange(val, null, "ApiType")}
                            />
                            {state.FormErrors.ApiType && (
                                <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                                    <CircleAlert className="w-4 h-4" />
                                    <span>{state.FormErrors.ApiType}</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                API Method
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <DropdownTyped
                                mode="single"
                                options={state.ApiMethodOptions}
                                value={state.CurrAddEditObj.ApiMethod}
                                onChange={(val: string | number) => handleDropdownChange(val, null, "ApiMethod")}
                            />
                            {state.FormErrors.ApiMethod && (
                                <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                                    <CircleAlert className="w-4 h-4" />
                                    <span>{state.FormErrors.ApiMethod}</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                Version
                            </label>
                            <input
                                onChange={(e) => handleChangeApiInfo(e, "Version")}
                                value={state.CurrAddEditObj.Version}
                                type="text"
                                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter Version"
                            />
                        </div>

                        <div className="col-span-full">
                            <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                End Point
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                                onChange={(e) => handleChangeApiInfo(e, "EndPoint")}
                                value={state.CurrAddEditObj.EndPoint}
                                type="text"
                                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter End Point URL"
                            />
                            {state.FormErrors.EndPoint && (
                                <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                                    <CircleAlert className="w-4 h-4" />
                                    <span>{state.FormErrors.EndPoint}</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                Validation Key
                            </label>
                            <input
                                onChange={(e) => handleChangeApiInfo(e, "ValidationKey")}
                                value={state.CurrAddEditObj.ValidationKey}
                                type="text"
                                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter Validation Key"
                            />
                        </div>

                        <div>
                            <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                Validation Path
                            </label>
                            <input
                                onChange={(e) => handleChangeApiInfo(e, "ValidationPath")}
                                value={state.CurrAddEditObj.ValidationPath}
                                type="text"
                                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter Validation Path"
                            />
                        </div>

                        <div className="flex items-center space-x-6">
                            <div className="flex items-center">
                                <input
                                    id="usePadding"
                                    type="checkbox"
                                    checked={state.CurrAddEditObj.UsePadding === 1}
                                    onChange={() => handleCheckboxChange("UsePadding")}
                                    className="w-4 h-4 text-[#0071E9] bg-gray-100 border-gray-300 rounded focus:ring-[#0071E9] focus:ring-2"
                                />
                                <label htmlFor="usePadding" className="ml-2 text-[0.90rem] text-[#2C3E50] font-medium">
                                    Use Padding
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    id="isFinalStep"
                                    type="checkbox"
                                    checked={state.CurrAddEditObj.IsFinalStep === 1}
                                    onChange={() => handleCheckboxChange("IsFinalStep")}
                                    className="w-4 h-4 text-[#0071E9] bg-gray-100 border-gray-300 rounded focus:ring-[#0071E9] focus:ring-2"
                                />
                                <label htmlFor="isFinalStep" className="ml-2 text-[0.90rem] text-[#2C3E50] font-medium">
                                    Is Final Step
                                </label>
                            </div>
                        </div>

                        <div className="col-span-full">
                            <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                Headers
                            </label>
                            {state.HeadersArray.map((header, index) => (
                                <div key={index} className="flex space-x-2 mb-2">
                                    <input
                                        type="text"
                                        placeholder="Key"
                                        className="p-2 border rounded-lg flex-1 text-sm"
                                        style={{ borderColor: '#0071E9' }}
                                        value={header.key}
                                        onChange={(e) => updateHeader(index, "key", e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Value"
                                        className="p-2 border rounded-lg flex-1 text-sm"
                                        style={{ borderColor: '#0071E9' }}
                                        value={header.value}
                                        onChange={(e) => updateHeader(index, "value", e.target.value)}
                                    />
                                    <button
                                        className="px-3 py-2 rounded-lg text-white"
                                        style={{ backgroundColor: '#0071E9' }}
                                        onClick={() => removeHeader(index)}
                                        type="button"
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                            ))}
                            <button
                                className="mt-2 px-4 py-2 flex items-center gap-2 text-white rounded-lg text-sm"
                                style={{ backgroundColor: '#0071E9' }}
                                onClick={addHeader}
                                type="button"
                            >
                                <Plus className="w-4 h-4" /> Add Header
                            </button>
                        </div>

                        <div className="col-span-full">
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="requestSchema" className="text-[0.90rem] text-[#2C3E50] font-medium">
                                    Request Schema (JSON)
                                </label>
                            </div>
                            <div className="relative">
                                <textarea
                                    onChange={(e) => handleChangeApiInfo(e, "RequestSchema")}
                                    value={state.CurrAddEditObj.RequestSchema}
                                    id="requestSchema"
                                    name="requestSchema"
                                    rows={4}
                                    placeholder='{"example": "schema"}'
                                    className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8] resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                                ></textarea>
                            </div>
                        </div>

                        <div className="col-span-full">
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="responseData" className="text-[0.90rem] text-[#2C3E50] font-medium">
                                    Response Data (JSON)
                                </label>
                            </div>
                            <div className="relative">
                                <textarea
                                    onChange={(e) => handleChangeApiInfo(e, "ResponseData")}
                                    value={state.CurrAddEditObj.ResponseData}
                                    id="responseData"
                                    name="responseData"
                                    rows={4}
                                    placeholder='{"statusCode": 200, "data": {}, "message": "Success"}'
                                    className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8] resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                                ></textarea>
                            </div>
                        </div>

                        <div className="col-span-full">
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="notes" className="text-[0.90rem] text-[#2C3E50] font-medium">
                                    Notes
                                </label>
                            </div>
                            <div className="relative">
                                <textarea
                                    onChange={(e) => handleChangeApiInfo(e, "Notes")}
                                    value={state.CurrAddEditObj.Notes}
                                    id="notes"
                                    name="notes"
                                    rows={3}
                                    maxLength={2000}
                                    placeholder="Notes"
                                    className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8] resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                                ></textarea>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center pb-4">
                        <div className="flex items-center w-full max-w-md px-4 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg shadow-sm">
                            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                            </svg>
                            <input
                                onChange={handleSearch}
                                value={state.SearchQuery}
                                type="text"
                                placeholder="Search APIs"
                                className="ml-3 text-[0.89rem] bg-transparent outline-none placeholder-gray-500 w-full"
                            />
                        </div>

                        <div>
                            <button
                                onClick={handleAdd}
                                className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
                                type="button"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Add API</span>
                            </button>
                        </div>
                    </div>
                    <CustomTableTyped columns={columns} data={data} responsive={true} />
                    {state.TotalRecords > 10 && (
                        <div className="pt-4 flex justify-end">
                            <PaginationTyped
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