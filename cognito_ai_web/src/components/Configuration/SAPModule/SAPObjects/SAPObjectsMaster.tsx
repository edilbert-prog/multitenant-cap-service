import React, { useEffect, useReducer, useRef } from 'react';
import CustomTable from "../../../../utils/CustomTable.jsx";
import { ChevronLeft, CircleAlert, Home, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { apiRequest } from "../../../../utils/helpers/ApiHelper.js";
import SpinnerV2 from "../../../../utils/SpinnerV2.jsx";
import ErrorScreen from "../../../../utils/ErrorScreen.jsx";
import Pagination from "../../../../utils/Pagination.jsx";
import PillGroup from "../../../../utils/PillGroup.jsx";
import Modal from "../../../../utils/Modal.jsx";
import Toast from "../../../../utils/Toast.jsx";
import useDebounce from "../../../../utils/helpers/useDebounce.js";
import Dropdown from "../../../../utils/Dropdown.jsx";
import ConfirmPopup from "../../../../utils/ConfirmPopup.jsx";
import CustomModal from "../../../../utils/CustomModal.jsx";
// import TransactionTablesMaster from "../../Transactions/TransactionTablesMaster.jsx";
import TestStepsHeaderMaster from "./TestStepsHeaderMaster.js";
import ObjectBPSPMapping from "./ObjectBPSPMapping.jsx";
import SearchBar from "../../../../utils/SearchBar.jsx";
import Breadcrumb from "../../../../utils/Breadcrumb.jsx";
import SAPObjectApisMaster from "./SAPObjectApisMaster.jsx";
import SAPObjectTableFieldsMaster from "./SAPObjectTableFieldsMaster.tsx";
import TransactionTablesFieldsView from "./TransactionTablesFieldsView.tsx";
import ExecutionComponentMain from "@/components/TestExecution/ExecutionComponentMain";
import APITableFieldKeyMapping from "@/components/Configuration/SAPModule/SAPObjects/APITableFieldKeyMapping";

type Props = {};

type Option = {
    label: string;
    value: string | number;
    [key: string]: any;
};

interface SAPObjectItem {
    ObjectId: string | number;
    ApplicationId: string | number;
    ApplicationName?: string;
    Module: string;
    SubModule: string;
    ObjectType: string;
    ObjectName: string;
    TransactionCode: string;
    ProgramId?: string;
    InterfaceId?: string;
    Description?: string;
    [key: string]: any;
}

interface BreadcrumbItem {
    id: string;
    label: string;
    icon?: React.ReactNode | string;
    show: boolean;
}

interface FilterObj {
    ObjectType: string;
    Module: string;
    SubModule: string;
}

interface AddEditObj {
    ObjectId: string | number | "";
    ApplicationId: string | number | "";
    Module: string;
    SubModule: string;
    ObjectType: string;
    ObjectName: string;
    TransactionCode: string;
    ProgramId: string;
    InterfaceId: string;
    Description: string;
    ApplicationName?: string;
}

interface State {
    Error: string;
    SearchQuery: string;
    ActiveBCItem: string;
    SAPObjectsMaster: SAPObjectItem[];
    CurrObject: Partial<SAPObjectItem>;
    ApplicationsList: any[];
    SAPModuleList: any[];
    SAPSubModuleList: any[];
    SAPTransactions: any[];
    TransactionTablesMaster: any[];
    BreadCrumbData: BreadcrumbItem[];
    ObjectTypes: Option[];
    FilterObj: FilterObj;
    ViewAppDetails: boolean;
    CurrentPage: number;
    TotalRecords: number;
    IsLoading: boolean;
    ViewDetails: boolean;
    openModal: boolean;
    showToast: boolean;
    TableDetailsModal: boolean;
    ShowTableDetailsLoader: boolean;
    SavingLoader: boolean;
    isDataExist: string;
    ClientBusinessUnitActionType: string;
    CurrPillActive: string;
    CurrPillActive2: string;
    CurrAddEditObj: AddEditObj;
    ValidateFields: Record<string, string | number>;
    FormErrors: Record<string, string>;
    pillItems: { key: string; label: string }[];
    pillItems2: { key: string; label: string }[];
    CurrTab: string;
    OriginalAddEditObj: AddEditObj | null;
    HasFormChanged: boolean;
    ToastMessage: string;
}
export default function SAPObjectsMaster(props: Props): JSX.Element {
    const [state, setState] = useReducer(
        (prev: State, newState: Partial<State>): State => ({ ...prev, ...newState }),
        {
            Error: "",
            SearchQuery: "",
            ActiveBCItem: "TableFields",
            SAPObjectsMaster: [],
            CurrObject: {},
            ApplicationsList: [],
            SAPModuleList: [],
            SAPSubModuleList: [],
            SAPTransactions: [],
            TransactionTablesMaster: [],
            BreadCrumbData: [
                { id: "Tables", label: "Tables", icon: <Home size={16} />, show: true },
                { id: "Fields", label: "Fields", icon: "", show: false },
                { id: "FieldValues", label: "FieldValues", icon: "", show: false },
            ],
            ObjectTypes: [],
            FilterObj: {
                ObjectType: "",
                Module: "",
                SubModule: "",
            },
            ViewAppDetails: false,
            CurrentPage: 1,
            TotalRecords: 0,
            IsLoading: true,
            ViewDetails: false,
            openModal: false,
            showToast: false,
            TableDetailsModal: false,
            ShowTableDetailsLoader: false,
            SavingLoader: false,
            isDataExist: "",
            ClientBusinessUnitActionType: "",
            CurrPillActive: "ObjectInfo",
            // CurrPillActive2: "Tables",
            CurrPillActive2: "TableFields",
            CurrAddEditObj: {
                ObjectId: "",
                ApplicationId: "",
                Module: "",
                SubModule: "",
                ObjectType: "",
                ObjectName: "",
                TransactionCode: "",
                ProgramId: "",
                InterfaceId: "",
                Description: "",
            },
            ValidateFields: {
                ApplicationId: "",
                Module: "",
                SubModule: "",
                TransactionCode: "",
                ObjectType: "",
                ObjectName: "",
            },
            FormErrors: {},
            pillItems: [
                { key: 'ObjectInfo', label: 'Object Info' },
                { key: 'Tables', label: 'Tables' },
            ],
            pillItems2: [
                // { key: 'Tables', label: 'Tables' },
                { key: 'TableFields', label: 'Table Fields' },        
                { key: 'ObjectTableFields', label: 'Object Table Fields' },
                { key: 'API', label: 'API' },
                { key: 'Test Steps', label: 'Test Steps' },
                { key: 'Execution Components', label: 'Execution Components' },
                { key: 'APITableFieldKeyMapping', label: 'API Table Field Key Mapping' },
            ],
            CurrTab: "Client Details",
            OriginalAddEditObj: null,
            HasFormChanged: false,
            ToastMessage: "",
        }
    );

    const didFetchData = useRef<boolean>(false);
    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;

        const init = async () => {
            setState({ IsLoading: true });

            await Promise.all([
                getData(""),
                getApplicationsList(""),
                GetSAPModulesMaster(""),
                GetObjectTypes(""),
            ]);

            setState({ IsLoading: false });
        };

        init();
    }, []);

    const getApplicationsList = async (SearchString: string = "") => {
        try {
            const resp: any = await apiRequest("/GetApplicationsMaster", { SearchString });
            setState({
                ApplicationsList: resp.ResponseData,
            });
        } catch (err) {
            console.error("Error loading Country/State/City:", err);
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

    const GetObjectTypes = async (SearchString: string = "") => {
        try {
            const resp: any = await apiRequest("/GetObjectsTypes", { SearchString });
            const objectTypes: Option[] = (resp.ResponseData || []).map((item: any) => ({
                label: item.ObjectType,
                value: item.ObjectType,
            }));
            setState({
                ObjectTypes: objectTypes,
            });
        } catch (err) {
            console.error("Error loading Object Types:", err);
        }
    };

    const GetSAPModulesMasterByApplicationId = async (SearchString: string = "", ApplicationId: string | number | "" = "") => {
        try {
            const resp: any = await apiRequest("/GetSAPModulesMasterByApplicationId", { SearchString, ApplicationId });
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

    const GetModuleSubModuleTransactionsByModuleSubModule = async (SearchString: string = "", Module: string = "", SubModule: string = "") => {
        try {
            const resp: any = await apiRequest("/GetModuleSubModuleTransactionsByModuleSubModule", {
                SearchString,
                Module,
                SubModule
            });
            setState({
                SAPTransactions: resp.ResponseData,
            });
        } catch (err) {
            console.error("Error loading Country/State/City:", err);
        }
    };

    const getData = async (SearchQuery: string = "", PageNo: number = 1, FilterObj: Partial<FilterObj> = { Module: "", SubModule: "" }) => {
        try {
            const resp: any = await apiRequest("/GetSAPObjectsMasterPaginationFilterSearchNewV2", {
                "PageNo": PageNo,
                "StartDate": "",
                "EndDate": "",
                "ObjectType": (FilterObj as any).ObjectType,
                "Module": FilterObj.Module,
                "SubModule": FilterObj.SubModule,
                "SearchString": SearchQuery
            });
            if (resp.ResponseData.length > 0) {
                setState({ SAPObjectsMaster: resp.ResponseData, TotalRecords: resp.TotalRecords });
            } else {
                setState({ SAPObjectsMaster: [], TotalRecords: 0 });
            }
        } catch (err: any) {
            setState({ Error: err.toString() });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const debouncedSearchQuery: string = useDebounce(state.SearchQuery, 300) as any;
    const didSearchRun = useRef<boolean>(false);
    useEffect(() => {
        if (!didSearchRun.current) {
            didSearchRun.current = true;
            return;
        }
        if (debouncedSearchQuery.trim() === "") return;
        getData(debouncedSearchQuery);
    }, [debouncedSearchQuery]);

    const isSameForm = (a: AddEditObj | null, b: AddEditObj | null) => {
        if (!a || !b) return false;
        const keys = [
            "ApplicationId", "Module", "SubModule", "ObjectType", "ObjectName",
            "TransactionCode", "ProgramId", "InterfaceId", "Description"
        ] as const;
        return keys.every((k) => ((a as any)[k] ?? "") === ((b as any)[k] ?? ""));
    };

    const handleSearch = (value: string) => {
        setState({ SearchQuery: value });
        if (value.trim() === "") {
            getData("", 1, state.FilterObj);
        }
    };

    const handleAddClient = () => {
        const CurrAddEditObj: AddEditObj = {
            "ObjectId": "",
            "ApplicationId": "",
            "Module": "",
            "SubModule": "",
            "ObjectType": "Transaction",
            "ObjectName": "",
            "TransactionCode": "",
            "ProgramId": "",
            "InterfaceId": "",
            "Description": "",
        };
        setState({
            ViewAppDetails: true,
            CurrAddEditObj,
            OriginalAddEditObj: JSON.parse(JSON.stringify(CurrAddEditObj)),
            HasFormChanged: false,
        });
    };

    const handleViewClientDetails = (item: SAPObjectItem) => {
        setState({
            ViewAppDetails: true,
            CurrAddEditObj: item as unknown as AddEditObj,
            SAPModuleList: [],
            OriginalAddEditObj: JSON.parse(JSON.stringify(item)),
            HasFormChanged: false,
        });
        GetSAPModulesMasterByApplicationId("", item.ApplicationId);
        GetSAPSubModulesMasterByModule(item.Module);
        GetModuleSubModuleTransactionsByModuleSubModule("", item.Module, item.SubModule);
    };

    const handleCloseClientDetails = () => {
        const CurrAddEditObj: AddEditObj = {
            "ObjectId": "",
            "ApplicationId": "",
            "Module": "",
            "SubModule": "",
            "ObjectType": "Transaction",
            "ObjectName": "",
            "TransactionCode": "",
            "ProgramId": "",
            "InterfaceId": "",
            "Description": "",
        };
        setState({ ViewAppDetails: false, CurrAddEditObj });
        getData("", state.CurrentPage, state.FilterObj);
    };

    const handlePillClick = (item: { key: string; label: string }) => {
        if (state.CurrAddEditObj.ApplicationId === "" && item.key !== "SAPObjectsMaster") {
            setState({ openModal: true });
        } else {
            setState({ CurrPillActive: item.key });
        }
    };

    const handlePillClick2 = (item: { key: string; label: string }) => {
        setState({ CurrPillActive2: item.key });
    };

    const debouncedQuery: string = useDebounce(state.CurrAddEditObj.ApplicationName as any, 500) as any;

    const checkIfDataExist = async (q: string) => {
        const resp: any = await apiRequest("/CheckClientsMaster", {
            "ApplicationName": q
        });
        if (resp.ClientsMaster.length > 0) {
            setState({ isDataExist: "Client already existed" });
        } else {
            setState({ isDataExist: "" });
        }
    };

    const handleDropdownFilter = (val: any, _options: any, name: keyof FilterObj | "ObjectType") => {
        const FilterObj = { ...state.FilterObj };
        (FilterObj as any)[name] = val;
        setState({ FilterObj });
        if (name === "Module") {
            (FilterObj as any)["SubModule"] = "";
            setState({ FilterObj });
            GetSAPSubModulesMasterByModule((FilterObj as any)[name] as string);
        }
        getData(state.SearchQuery, state.CurrentPage, FilterObj);
    };

    const handleDropdownClientInfo = (val: any, _options: any, name: keyof AddEditObj) => {
        const CurrAddEditObj: AddEditObj = { ...state.CurrAddEditObj };
        (CurrAddEditObj as any)[name] = val;
        setState({
            CurrAddEditObj,
            HasFormChanged: !isSameForm(CurrAddEditObj, state.OriginalAddEditObj),
        });

        if (name === "ApplicationId") {
            GetSAPModulesMasterByApplicationId("", val);
        }
        if (name === "Module") {
            GetSAPSubModulesMasterByModule(val as any);
        }
        if (name === "SubModule") {
            GetModuleSubModuleTransactionsByModuleSubModule("", CurrAddEditObj.Module, val as any);
        }
    };

    const handleChangeObjectForm = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, name: keyof AddEditObj) => {
        const CurrAddEditObj: AddEditObj = { ...state.CurrAddEditObj };
        (CurrAddEditObj as any)[name] = e.target.value;
        setState({
            CurrAddEditObj,
            HasFormChanged: !isSameForm(CurrAddEditObj, state.OriginalAddEditObj),
        });
    };

    const validateApplicationForm = () => {
        const FormErrors: Record<string, string> = {};
        let formIsValid = true;
        for (const name in state.ValidateFields) {
            const value = (state.CurrAddEditObj as any)[name];
            if (value === "" || value === 0) {
                formIsValid = false;
                FormErrors[name] = "This field is required";
            }
        }
        setState({
            FormErrors
        });
        return formIsValid;
    };

    const handlePageChange = (page: number) => {
        setState({ CurrentPage: page });
        getData(state.SearchQuery, page, state.FilterObj);
    };

    const handleSubmitApplication = async () => {
        if (!validateApplicationForm()) {
            return;
        }

        if (!state.HasFormChanged) {
            setState({ showToast: true, ToastMessage: "No form data changes to save." });
            setTimeout(() => setState({ showToast: false }), 2500);
            return;
        }

        setState({ SavingLoader: true });
        const resp: any = await apiRequest("/AddUpdateSAPObjectsMasterNew", state.CurrAddEditObj);
        if (resp) {
            const CurrAddEditObj: AddEditObj = { ...state.CurrAddEditObj };
            if (CurrAddEditObj.ApplicationId === "") {
                (CurrAddEditObj as any).ApplicationId = resp.addApplicationsMaster.insertId;
            }
            setState({
                CurrAddEditObj,
                OriginalAddEditObj: JSON.parse(JSON.stringify(CurrAddEditObj)),
                HasFormChanged: false,
                SavingLoader: false,
                showToast: true,
                ToastMessage: "Saved successfully!",
            });
            setTimeout(() => setState({ showToast: false }), 3000);
        }
    };

    const handleDeleteItem = async (item: SAPObjectItem) => {
        const resp: any = await apiRequest("/DeleteSAPObjectsMasterNew", item);
        if (resp) {
            setState({ showToast: true, ToastMessage: "Deleted successfully!" });
            getData(state.SearchQuery, state.CurrentPage, state.FilterObj);
            setTimeout(() => {
                setState({ showToast: false });
            }, 3000);
        }
    };

    const originalBreadcrumbRef = useRef<{ id: string; label: string }[]>([]);
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

    const handleViewTableFields = (item: SAPObjectItem) => {
        setState({ CurrObject: item, TableDetailsModal: true });
        getSAPTablesByTCODE("", 1, item.TransactionCode);
    };

    const getSAPTablesByTCODE = async (SearchQuery: string = "", PageNo: number = 1, TransactionCode: string = "") => {
        setState({ ShowTableDetailsLoader: true });
        try {
            const resp: any = await apiRequest("/GetSAPTcodeTablesMasterPaginationFilterSearchV2", {
                "PageNo": PageNo,
                "StartDate": "",
                "EndDate": "",
                "TransactionCode": TransactionCode,
                "SearchString": SearchQuery
            });
            if (resp.ResponseData.length > 0) {
                setState({ TransactionTablesMaster: resp.ResponseData, TotalRecords: resp.TotalRecords });
            } else {
                setState({ TransactionTablesMaster: [], TotalRecords: [] as unknown as number });
            }
            setState({ ShowTableDetailsLoader: false });
        } catch (err: any) {
            setState({ Error: err.toString() });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const columns: any[] = [
        { title: '#ID', key: 'ObjectId' },
        { title: 'Application', key: 'ApplicationName' },
        ...(!state.FilterObj.Module ? [{ title: 'Module', key: 'Module' }] : []),
        ...(!state.FilterObj.SubModule ? [{ title: 'SubModule', key: 'SubModule' }] : []),
        ...(!state.FilterObj.ObjectType ? [{ title: 'ObjectType', key: 'ObjectType' }] : []),
        { title: 'Object Name', key: 'ObjectName' },
        { title: 'TCODE', key: 'TransactionCode' },
        { title: 'Description', key: 'Description', className: '-w-[100px]' },
    ];

    const data: any[] = state.SAPObjectsMaster.map((v) => ({
        ObjectId: v.ObjectId,
        ApplicationName: v.ApplicationName,
        Module: v.Module,
        SubModule: v.SubModule,
        ObjectType: v.ObjectType,
        ObjectName: v.ObjectName,
        TransactionCode: (
            <div>
                <p>{v.TransactionCode}</p>
            </div>
        ),
        Description: v.Description,
        actions: (
            <>
                <button
                    onClick={() => handleViewClientDetails(v)}
                    className="bg-[#0071E9] cursor-pointer text-gray-50 px-3 py-1 rounded text-sm"
                >
                    View
                </button>
                <ConfirmPopup
                    message="Are you sure you want to delete this item?"
                    onConfirm={() => handleDeleteItem(v)}
                >
                    <button className=" pr-4 flex items-center">
                        <Trash2 className="text-[#1A1A1A] cursor-pointer " />
                    </button>
                </ConfirmPopup>
            </>
        ),
    }));

    if (state.IsLoading) return <div className="h-96 py-20"><SpinnerV2 {...{ text: "Fetching data..." }} /></div>;
    if (state.Error) return <ErrorScreen message={state.Error} />;

    return (
        <div className="pt-0 pb-6 px-6">
            <CustomModal
                modalZIndex={1000}
                width="max-w-6xl"
                isOpen={state.TableDetailsModal}
                onClose={() => setState({ TableDetailsModal: false })}
                title={(
                    <div>
                        <p>TCODE: {state.CurrObject.TransactionCode}</p>
                        <p className="font-normal text-sm text-gray-500">Tables</p>
                    </div>
                )}
                footerContent={[
                    <button
                        key="close"
                        onClick={() => setState({ TableDetailsModal: false })}
                        className="mt-2 px-5 cursor-pointer py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg"
                    >
                        Close
                    </button>
                ]}
            >
               {/*  <div className="flex flex-col">
                    <div className="">
                        <div className="overflow-x-auto min-h-72">
                            <TransactionTablesMaster CurrAddEditDetails={state.CurrObject} />
                        </div>
                    </div>
                </div> */}
            </CustomModal>

            <Toast
                message={state.ToastMessage || "Saved successfully!"}
                show={state.showToast}
                onClose={() => setState({ showToast: false })}
            />

            <Modal
                isOpen={state.openModal}
                onClose={() => setState({ openModal: false })}
                title="Alert"
            >
                <p>Please save App info to proceed.</p>
                <div className="flex justify-end items-center">
                    <button
                        onClick={() => setState({ openModal: false })}
                        className="mt-6 right-0 px-4 text-[0.88rem] py-1.5 cursor-pointer bg-green-600 text-white rounded-lg"
                    >
                        Close
                    </button>
                </div>
            </Modal>

            {state.ViewAppDetails ? (
                <div>
                    <div className="flex items-center justify-between">
                        <div
                            onClick={handleCloseClientDetails}
                            className="flex items-center cursor-pointer bg-[#f3f3f3] w-fit px-4 py-1 rounded-full"
                        >
                            <ChevronLeft className="text-gray-700" /> <span className="font-medium text-sm text-gray-700"> Back</span>
                        </div>
                        <p className="ml-4 font-semibold text-lg">
                            {state.CurrAddEditObj.ObjectId === "" ? "Add" : state.CurrAddEditObj.ObjectName}
                        </p>
                        <p className="ml-4 font-semibold text-lg"></p>
                    </div>
                    <div className="border-b pb-2 pt-4 border-b-gray-200">
                    </div>

                    {state.CurrPillActive === "ObjectInfo" && (
                        <div className="w-full pt-2">
                            <div className="flex justify-end">
                                <button
                                    onClick={state.SavingLoader ? (null as any) : handleSubmitApplication}
                                    className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
                                >
                                    {state.SavingLoader ? (
                                        <>
                                            <SpinnerV2 {...{ text: "Saving..." }} />
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-5 h-5" />
                                            <span>{state.CurrAddEditObj.ObjectId === "" ? "Save" : "Update"}</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="">
                                    <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                        Applications <span className="text-red-500">*</span>
                                    </label>
                                    <Dropdown
                                        mode="single"
                                        options={state.ApplicationsList}
                                        value={state.CurrAddEditObj.ApplicationId}
                                        onChange={(val: any, item: any) => handleDropdownClientInfo(val, item, "ApplicationId")}
                                        onSearch={(q: string) => console.log("Search (Multi):", q)}
                                    />
                                    {state.FormErrors.ApplicationId && (
                                        <div className="flex items-center mt-1 ml-2">
                                            <CircleAlert size={14} className="text-red-500" />
                                            <p className="text-red-500 text-sm ">{state.FormErrors.ApplicationId}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="">
                                    <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                        Module <span className="text-red-500">*</span>
                                    </label>
                                    <Dropdown
                                        mode="single"
                                        options={state.SAPModuleList}
                                        value={state.CurrAddEditObj.Module}
                                        onChange={(val: any, item: any) => handleDropdownClientInfo(val, item, "Module")}
                                        onSearch={(q: string) => console.log("Search (Multi):", q)}
                                    />
                                    {state.FormErrors.Module && (
                                        <div className="flex items-center mt-1 ml-2">
                                            <CircleAlert size={14} className="text-red-500" />
                                            <p className="text-red-500 text-sm ">{state.FormErrors.Module}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="">
                                    <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                        Sub Module <span className="text-red-500">*</span>
                                    </label>
                                    <Dropdown
                                        mode="single"
                                        options={state.SAPSubModuleList}
                                        value={state.CurrAddEditObj.SubModule}
                                        onChange={(val: any, item: any) => handleDropdownClientInfo(val, item, "SubModule")}
                                        onSearch={(q: string) => console.log("Search (Multi):", q)}
                                    />
                                    {state.FormErrors.SubModule && (
                                        <div className="flex items-center mt-1 ml-2">
                                            <CircleAlert size={14} className="text-red-500" />
                                            <p className="text-red-500 text-sm ">{state.FormErrors.SubModule}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="">
                                    <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                        Object Type <span className="text-red-500">*</span>
                                    </label>
                                    <Dropdown
                                        mode="single"
                                        options={state.ObjectTypes}
                                        value={state.CurrAddEditObj.ObjectType}
                                        onChange={(val: any, item: any) => handleDropdownClientInfo(val, item, "ObjectType")}
                                        onSearch={(q: string) => console.log("Search (Multi):", q)}
                                    />
                                    {state.FormErrors.ObjectType && (
                                        <div className="flex items-center mt-1 ml-2">
                                            <CircleAlert size={14} className="text-red-500" />
                                            <p className="text-red-500 text-sm ">{state.FormErrors.ObjectType}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="">
                                    <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                        TCODE <span className="text-red-500">*</span>
                                    </label>
                                    <Dropdown
                                        mode="single"
                                        options={state.SAPTransactions}
                                        value={state.CurrAddEditObj.TransactionCode}
                                        onChange={(val: any, item: any) => handleDropdownClientInfo(val, item, "TransactionCode")}
                                        onSearch={(q: string) => console.log("Search (Multi):", q)}
                                    />
                                    {state.FormErrors.TransactionCode && (
                                        <div className="flex items-center mt-1 ml-2">
                                            <CircleAlert size={14} className="text-red-500" />
                                            <p className="text-red-500 text-sm ">{state.FormErrors.TransactionCode}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="">
                                    <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                        Object Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        onChange={(e) => handleChangeObjectForm(e, "ObjectName")}
                                        value={state.CurrAddEditObj.ObjectName}
                                        type="text"
                                        className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter Object Name"
                                    />
                                    {state.FormErrors.ObjectName && (
                                        <div className="flex items-center mt-1 ml-2">
                                            <CircleAlert size={14} className="text-red-500" />
                                            <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.ObjectName}</p>
                                        </div>
                                    )}
                                </div>

                                <div className=" ">
                                    <div className="flex justify-between items-center mb-1">
                                        <label htmlFor="name" className=" text-[0.90rem] text-[#2C3E50] font-medium">
                                            Description
                                        </label>
                                    </div>
                                    <div className="relative">
                                        <textarea
                                            onChange={(e) => handleChangeObjectForm(e, "Description")}
                                            value={state.CurrAddEditObj.Description}
                                            id="name"
                                            name="name"
                                            rows={3}
                                            maxLength={2000}
                                            placeholder="Description"
                                            className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8]   resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                                        />
                                        <div className="absolute bottom-2 right-2">
                                            <svg
                                                className="w-4 h-4 text-gray-500"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M4 13l4 4L16 7" stroke="currentColor" strokeWidth="2" fill="none" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {state.CurrAddEditObj.ObjectType === "Transaction" && state.CurrAddEditObj.TransactionCode && (
                        <>
                            <div className="border-b pb-2 pt-4 border-b-gray-200 mb-4">
                                <PillGroup
                                    items={state.pillItems2}
                                    primaryKey={state.CurrPillActive2}
                                    onClick={handlePillClick2}
                                />
                            </div>

                            {(state.ActiveBCItem === "Tables" || state.ActiveBCItem === "Fields" || state.ActiveBCItem === "FieldValues") &&
                                (state.CurrPillActive2 === "Tables" && state.CurrAddEditObj.TransactionCode) &&
                                <div className="pl-4 py-2">
                                    <Breadcrumb
                                        data={state.BreadCrumbData}
                                        activeItem={state.ActiveBCItem}
                                        onItemClick={handleBreadcrumbClick}
                                    />
                                </div>
                            }
                        </>
                    )}

                    {/* (state.ActiveBCItem === "Tables" || state.ActiveBCItem === "Fields" || state.ActiveBCItem === "FieldValues") &&
                        (state.CurrPillActive2 === "Tables" && state.CurrAddEditObj.TransactionCode) &&
                        <TransactionTablesMaster 
                            handleBreadcrumbClick={handleBreadcrumbClick} 
                            ActiveBCItem={state.ActiveBCItem} 
                            CurrAddEditDetails={state.CurrAddEditObj} 
                        />
                    */}

                    {state.CurrPillActive2 === "TableFields" && state.CurrAddEditObj.TransactionCode &&
                        <TransactionTablesFieldsView CurrAddEditDetails={state.CurrAddEditObj} />
                    }

                    {state.CurrPillActive2 === "ObjectTableFields" && state.CurrAddEditObj.TransactionCode &&
                        <SAPObjectTableFieldsMaster CurrAddEditDetails={state.CurrAddEditObj} />
                    }

                    {state.CurrPillActive2 === "API" &&
                        <SAPObjectApisMaster CurrAddEditDetails={state.CurrAddEditObj} />
                    }

                    {state.CurrPillActive2 === "Test Steps" &&
                        <TestStepsHeaderMaster CurrAddEditDetails={state.CurrAddEditObj} />
                    }
                    {state.CurrPillActive2 === "Execution Components" &&
                        <ExecutionComponentMain CurrAddEditDetails={state.CurrAddEditObj} />
                    }
                    {state.CurrPillActive2 === "APITableFieldKeyMapping" &&
                        <APITableFieldKeyMapping CurrAddEditDetails={state.CurrAddEditObj} />
                    }
                    {state.CurrPillActive2 === "BP_SP" &&
                        <ObjectBPSPMapping
                            CurrentSprint={{
                                ClientId: "CLID-1",
                                SprintId: "",
                                BusinessUnitId: "BUID-31",
                                ProjectId: "",
                            }} 
                            Sprint={true} 
                        />
                    }
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center pb-4">
                        <div className="w-1/3">
                            <SearchBar currentValue={state.SearchQuery} onSearch={handleSearch} size="medium" />
                        </div>

                        <div className="flex w-full gap-5 ml-10 items-center">
                            <div className="w-[20%]">
                                <p className="text-[0.80rem] font-semibold">Object Type</p>
                                <Dropdown
                                    size="small"
                                    mode="single"
                                    options={[
                                        { label: "Transaction", value: "Transaction" },
                                        { label: "Program", value: "Program" },
                                        { label: "Interface", value: "Interface" },
                                    ]}
                                    value={state.FilterObj.ObjectType}
                                    onChange={(val: any, item: any) => handleDropdownFilter(val, item, "ObjectType")}
                                    onSearch={(q: string) => console.log("Search (Multi):", q)}
                                />
                            </div>

                            <div className="w-[20%]">
                                <p className="text-[0.80rem] font-semibold">Module</p>
                                <Dropdown
                                    size="small"
                                    mode="single"
                                    options={state.SAPModuleList}
                                    value={state.FilterObj.Module}
                                    onChange={(val: any, item: any) => handleDropdownFilter(val, item, "Module")}
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
                                    onChange={(val: any, item: any) => handleDropdownFilter(val, item, "SubModule")}
                                    onSearch={(q: string) => console.log("Search (Multi):", q)}
                                />
                            </div>

                            <div className="ml-6 cursor-pointer border border-[#0071E9] rounded-full px-3 py-1">
                                <p className="text-[#0071E9] font-semibold text-sm flex items-center">
                                    <RefreshCcw className="mr-1" size={15} />Sync with SAP
                                </p>
                            </div>
                        </div>

                        <div>
                            <button
                                onClick={handleAddClient}
                                className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2 text-nowrap"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Create Object</span>
                            </button>
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
                </>
            )}
        </div>
    );
}