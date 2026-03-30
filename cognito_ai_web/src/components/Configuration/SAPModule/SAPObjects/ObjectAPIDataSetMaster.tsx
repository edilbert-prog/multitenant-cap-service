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
 * Local prop typings for JS utils
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
type ApiType = "ODATA" | "RFC";

interface CurrAddEditDetails {
    ObjectId?: string;
}

interface HeaderKeyValue {
    key: string;
    value: string;
}

interface BreadCrumbItem {
    id: string;
    label: string;
    icon: React.ReactNode | string;
    show: boolean;
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

interface State {
    ActionType: "" | "Add" | "Update";
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
            Status: 1,
        },
        HeadersArray: [],
        ValidateFields: {
            ServiceName: "",
            ApiType: "",
            ApiMethod: "",
            EndPoint: "",
        },
        FormErrors: {},
        ApiMethodOptions: [
            { label: "GET", value: "GET" },
            { label: "POST", value: "POST" },
            { label: "PUT", value: "PUT" },
            { label: "PATCH", value: "PATCH" },
            { label: "DELETE", value: "DELETE" },
        ],
        ApiTypeOptions: [
            { label: "ODATA", value: "ODATA" },
            { label: "RFC", value: "RFC" },
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

    const didFetchData = useRef(false);
    const debouncedSearch = useDebounce(state.SearchQuery, 500);

    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;
        void getData("");
    }, []);

    useEffect(() => {
        if (!didFetchData.current) return;
        void getData(debouncedSearch);
    }, [debouncedSearch]);

    const getData = async (searchQuery = "", pageNo = 1) => {
        setState({ IsLoading: true, Error: "" });
        try {
            const resp: any = await apiRequest("/GetSAPObjectApisMasterPaginationFilterSearch", {
                PageNo: pageNo,
                ObjectId: CurrAddEditDetails?.ObjectId || "",
                SearchString: searchQuery,
            });

            if (resp?.ResponseData) {
                setState({
                    SAPObjectApisMaster: resp.ResponseData,
                    TotalRecords: resp.TotalRecords || 0,
                    CurrentPage: pageNo,
                });
            } else {
                setState({ SAPObjectApisMaster: [], TotalRecords: 0 });
            }
        } catch (error) {
            setState({ Error: (error as Error).toString() });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setState({ SearchQuery: e.target.value, CurrentPage: 1 });
    };

    const handlePageChange = (page: number) => {
        void getData(state.SearchQuery, page);
    };

    const handleAddApi = () => {
        setState({
            ActionType: "Add",
            CurrAddEditObj: {
                ...initialState.CurrAddEditObj,
                ObjectId: CurrAddEditDetails?.ObjectId || "",
            },
            HeadersArray: [],
            FormErrors: {},
        });
    };

    const handleEditApi = (item: SAPObjectApi) => {
        let parsedHeaders: HeaderKeyValue[] = [];
        try {
            if (item.Headers) {
                const headersObj = JSON.parse(item.Headers);
                parsedHeaders = Object.entries(headersObj).map(([key, value]) => ({
                    key,
                    value: value as string,
                }));
            }
        } catch (err) {
            console.error("Error parsing headers:", err);
        }

        setState({
            ActionType: "Update",
            CurrAddEditObj: { ...item },
            HeadersArray: parsedHeaders,
            FormErrors: {},
        });
    };

    const handleCancelAddEdit = () => {
        setState({
            ActionType: "",
            CurrAddEditObj: initialState.CurrAddEditObj,
            HeadersArray: [],
            FormErrors: {},
        });
    };

    const validateForm = (): boolean => {
        const errors: Partial<Record<keyof ValidateFields, string>> = {};
        if (!state.CurrAddEditObj.ServiceName?.trim()) {
            errors.ServiceName = "Service Name is required";
        }
        if (!state.CurrAddEditObj.ApiType) {
            errors.ApiType = "API Type is required";
        }
        if (!state.CurrAddEditObj.ApiMethod) {
            errors.ApiMethod = "API Method is required";
        }
        if (!state.CurrAddEditObj.EndPoint?.trim()) {
            errors.EndPoint = "End Point is required";
        }

        setState({ FormErrors: errors });
        return Object.keys(errors).length === 0;
    };

    const handleSaveApi = async () => {
        if (!validateForm()) return;

        setState({ SavingLoader: true });
        try {
            const headersObj: Record<string, string> = {};
            state.HeadersArray.forEach((h) => {
                if (h.key && h.value) {
                    headersObj[h.key] = h.value;
                }
            });

            const payload = {
                ...state.CurrAddEditObj,
                Headers: JSON.stringify(headersObj),
                ObjectId: CurrAddEditDetails?.ObjectId || "",
            };

            const resp: any = await apiRequest("/AddUpdateSAPObjectApisMaster", payload);

            if (resp?.addSAPObjectApisMaster || resp?.updateSAPObjectApisMaster) {
                setState({ showToast: true, ActionType: "" });
                void getData(state.SearchQuery, state.CurrentPage);
            }
        } catch (error) {
            console.error("Error saving API:", error);
        } finally {
            setState({ SavingLoader: false });
        }
    };

    const handleDeleteApi = async (item: SAPObjectApi) => {
        try {
            await apiRequest("/DeleteSAPObjectApisMaster", {
                ApiId: item.ApiId,
                ObjectId: item.ObjectId,
            });
            setState({ showToast: true });
            void getData(state.SearchQuery, state.CurrentPage);
        } catch (error) {
            console.error("Error deleting API:", error);
        }
    };

    const handleChangeApiInfo = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
        field: keyof SAPObjectApi
    ) => {
        setState({
            CurrAddEditObj: {
                ...state.CurrAddEditObj,
                [field]: e.target.value,
            },
        });
    };

    const handleDropdownChange = (val: string, field: keyof SAPObjectApi) => {
        setState({
            CurrAddEditObj: {
                ...state.CurrAddEditObj,
                [field]: val,
            },
        });
    };

    const handleCheckboxChange = (field: "UsePadding" | "IsFinalStep") => {
        setState({
            CurrAddEditObj: {
                ...state.CurrAddEditObj,
                [field]: state.CurrAddEditObj[field] === 1 ? 0 : 1,
            },
        });
    };

    const addHeader = () => {
        setState({
            HeadersArray: [...state.HeadersArray, { key: "", value: "" }],
        });
    };

    const updateHeader = (index: number, field: "key" | "value", value: string) => {
        const updated = [...state.HeadersArray];
        updated[index][field] = value;
        setState({ HeadersArray: updated });
    };

    const removeHeader = (index: number) => {
        setState({
            HeadersArray: state.HeadersArray.filter((_, i) => i !== index),
        });
    };

    const handleViewDataset = (item: SAPObjectApi) => {
        setState({
            CurrAddEditObj: item,
            ActiveBCItem: "Dataset",
            BreadCrumbData: state.BreadCrumbData.map((bc) =>
                bc.id === "Dataset" ? { ...bc, show: true } : bc
            ),
        });
    };

    const handleBreadcrumbClick = (itemId: string) => {
        if (itemId === "APIs") {
            setState({
                ActiveBCItem: "APIs",
                BreadCrumbData: state.BreadCrumbData.map((bc) =>
                    bc.id === "Dataset" ? { ...bc, show: false } : bc
                ),
            });
        }
    };

    const columns: TableColumn[] = [
        { title: "Service Name", key: "ServiceName" },
        { title: "API Type", key: "ApiType" },
        { title: "API Method", key: "ApiMethod" },
        { title: "End Point", key: "EndPoint" },
        { title: "Version", key: "Version" },
        { title: "Actions", key: "actions", className: "text-center" },
    ];

    const data: RowData[] = state.SAPObjectApisMaster.map((item) => ({
        ServiceName: item.ServiceName,
        ApiType: (
            <span className="px-2 py-1 rounded text-sm bg-blue-100 text-blue-800">
                {item.ApiType}
            </span>
        ),
        ApiMethod: (
            <span
                className={`px-2 py-1 rounded text-sm ${
                    item.ApiMethod === "GET"
                        ? "bg-green-100 text-green-800"
                        : item.ApiMethod === "POST"
                        ? "bg-yellow-100 text-yellow-800"
                        : item.ApiMethod === "DELETE"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                }`}
            >
                {item.ApiMethod}
            </span>
        ),
        EndPoint: <span className="text-sm text-gray-700">{item.EndPoint}</span>,
        Version: item.Version || "-",
        actions: (
            <div className="flex items-center justify-center space-x-2">
                <button
                    onClick={() => handleViewDataset(item)}
                    className="bg-[#0071E9] cursor-pointer text-gray-50 px-3 py-1 rounded text-sm"
                >
                    Dataset
                </button>
                <button onClick={() => handleEditApi(item)} className="text-[#1A1A1A]">
                    <SquarePen className="w-5 h-5" />
                </button>
                <ConfirmPopupTyped
                    message="Are you sure you want to delete this API?"
                    onConfirm={() => void handleDeleteApi(item)}
                >
                    <button className="text-[#1A1A1A]">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </ConfirmPopupTyped>
            </div>
        ),
    }));

    if (state.IsLoading) {
        return (
            <div className="h-96 py-20">
                <SpinnerV2Typed text="Fetching data..." />
            </div>
        );
    }

    if (state.Error) {
        return <ErrorScreenTyped message={state.Error} />;
    }

    return (
        <div className="pt-0 pb-20">
            <ToastTyped
                message="Saved successfully!"
                show={state.showToast}
                onClose={() => setState({ showToast: false })}
            />

            <div className="pb-2.5 px-3.5">
                <Breadcrumb
                    data={state.BreadCrumbData}
                    activeItem={state.ActiveBCItem}
                    onItemClick={handleBreadcrumbClick}
                />
            </div>

            {state.ActiveBCItem === "Dataset" ? (
                <DatasetDetailsMaster
                    CurrAddEditDetails={state.CurrAddEditObj}
                    handleBreadcrumbClick={handleBreadcrumbClick}
                />
            ) : state.ActionType ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center pb-4 border-b">
                        <h2 className="text-xl font-semibold text-[#2C3E50]">
                            {state.ActionType === "Add" ? "Add New API" : "Update API"}
                        </h2>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handleCancelAddEdit}
                                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                            >
                                <X className="w-4 h-4 inline mr-1" />
                                Cancel
                            </button>
                            <button
                                onClick={() => void handleSaveApi()}
                                disabled={state.SavingLoader}
                                className="px-4 py-2 text-sm text-white bg-[#0071E9] hover:bg-[#005ABA] rounded-lg disabled:opacity-50"
                            >
                                {state.SavingLoader ? (
                                    <SpinnerV2Typed text="Saving..." />
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 inline mr-1" />
                                        Save
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-6">
                        <div>
                            <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                Service Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                onChange={(e) => handleChangeApiInfo(e, "ServiceName")}
                                value={state.CurrAddEditObj.ServiceName}
                                type="text"
                                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter Service Name"
                            />
                            {state.FormErrors.ServiceName && (
                                <p className="text-red-500 text-xs mt-1 flex items-center">
                                    <CircleAlert className="w-3 h-3 mr-1" />
                                    {state.FormErrors.ServiceName}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                API Type <span className="text-red-500">*</span>
                            </label>
                            <DropdownTyped
                                mode="single"
                                options={state.ApiTypeOptions}
                                value={state.CurrAddEditObj.ApiType}
                                onChange={(val) => handleDropdownChange(val as string, "ApiType")}
                                placeholder="Select API Type"
                            />
                            {state.FormErrors.ApiType && (
                                <p className="text-red-500 text-xs mt-1 flex items-center">
                                    <CircleAlert className="w-3 h-3 mr-1" />
                                    {state.FormErrors.ApiType}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                API Method <span className="text-red-500">*</span>
                            </label>
                            <DropdownTyped
                                mode="single"
                                options={state.ApiMethodOptions}
                                value={state.CurrAddEditObj.ApiMethod}
                                onChange={(val) => handleDropdownChange(val as string, "ApiMethod")}
                                placeholder="Select API Method"
                            />
                            {state.FormErrors.ApiMethod && (
                                <p className="text-red-500 text-xs mt-1 flex items-center">
                                    <CircleAlert className="w-3 h-3 mr-1" />
                                    {state.FormErrors.ApiMethod}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                End Point <span className="text-red-500">*</span>
                            </label>
                            <input
                                onChange={(e) => handleChangeApiInfo(e, "EndPoint")}
                                value={state.CurrAddEditObj.EndPoint}
                                type="text"
                                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter End Point"
                            />
                            {state.FormErrors.EndPoint && (
                                <p className="text-red-500 text-xs mt-1 flex items-center">
                                    <CircleAlert className="w-3 h-3 mr-1" />
                                    {state.FormErrors.EndPoint}
                                </p>
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
                                <label
                                    htmlFor="usePadding"
                                    className="ml-2 text-[0.90rem] text-[#2C3E50] font-medium"
                                >
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
                                <label
                                    htmlFor="isFinalStep"
                                    className="ml-2 text-[0.90rem] text-[#2C3E50] font-medium"
                                >
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
                                        style={{ borderColor: "#0071E9" }}
                                        value={header.key}
                                        onChange={(e) => updateHeader(index, "key", e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Value"
                                        className="p-2 border rounded-lg flex-1 text-sm"
                                        style={{ borderColor: "#0071E9" }}
                                        value={header.value}
                                        onChange={(e) => updateHeader(index, "value", e.target.value)}
                                    />
                                    <button
                                        className="px-3 py-2 rounded-lg text-white"
                                        style={{ backgroundColor: "#0071E9" }}
                                        onClick={() => removeHeader(index)}
                                        type="button"
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                            ))}
                            <button
                                className="mt-2 px-4 py-2 flex items-center gap-2 text-white rounded-lg text-sm"
                                style={{ backgroundColor: "#0071E9" }}
                                onClick={addHeader}
                                type="button"
                            >
                                <Plus className="w-4 h-4" /> Add Header
                            </button>
                        </div>

                        <div className="col-span-full">
                            <div className="flex justify-between items-center mb-1">
                                <label
                                    htmlFor="requestSchema"
                                    className="text-[0.90rem] text-[#2C3E50] font-medium"
                                >
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
                                <label
                                    htmlFor="responseData"
                                    className="text-[0.90rem] text-[#2C3E50] font-medium"
                                >
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
                            <svg
                                className="w-4 h-4 text-black"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
                                />
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
                                onClick={handleAddApi}
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
