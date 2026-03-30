// ClientBusinessUnits
// :contentReference[oaicite:0]{index=0}
import React, { useEffect, useReducer, useRef } from "react";
import CustomTable from "../../../utils/CustomTable";
import {
    CircleAlert,
    Plus,
    Save,
    SquarePen,
    Trash2,
    X,
    Settings,
    ChevronRight,
    Home,
} from "lucide-react";
import { apiRequest } from "../../../utils/helpers/ApiHelper";
import SpinnerV2 from "../../../utils/SpinnerV2";
import ErrorScreen from "../../../utils/ErrorScreen";
import Pagination from "../../../utils/Pagination";
import Toast from "../../../utils/Toast";
import useDebounce from "../../../utils/helpers/useDebounce";
import Dropdown from "../../../utils/Dropdown";
import PhoneNumberInput from "../../../utils/PhoneNumberInput";
import ConfirmPopup from "../../../utils/ConfirmPopup";
import ClientBusinessProcess from "./ClientBusinessProcess";

// ---------- Local Types ----------
interface CurrClientDetails {
    ClientId: string | number;
    [key: string]: unknown;
}

type Mode = "single" | "multiple";

interface DropdownOption {
    [key: string]: unknown;
}

interface Country {
    CountryId: string;
    iso2: string;
    phonecode: string;
    [key: string]: unknown;
}

interface StateItem {
    StateId: string;
    [key: string]: unknown;
}

interface CityItem {
    CityId: string | number;
    [key: string]: unknown;
}

interface CountryCodeOption {
    value: string;
    label: string;
}

interface BusinessUnitItem {
    ClientId: string | number;
    ClientName?: string;
    BusinessUnitId: string | number;
    BusinessUnitName: string;
    CompanyCodeERP?: string;
    CountryId: string | number;
    StateId: string | number;
    CityId: string | number | string;
    CountryCode?: string | number;
    Contact?: string;
    Email: string;
    Address1?: string;
    Address2?: string;
    Zip?: string;
    Description?: string;
    CityName?: string;
    StateName?: string;
    CountryName?: string;
    [key: string]: unknown;
}

interface CurrAddEditObj {
    ClientId: string | number | "";
    BusinessUnitId: string | number | "";
    BusinessUnitName: string | "";
    CompanyCodeERP: string | "";
    CountryId: string | number | "";
    StateId: string | number | "";
    CityId: string | number | "";
    CountryCode: string | number | "";
    Contact: string | "";
    Email: string | "";
    Address1: string | "";
    Address2: string | "";
    Zip: string | "";
    Description: string | "";
    [key: string]: unknown;
}

interface ValidateFields {
    BusinessUnitName: string;
    CountryId: string;
    StateId: string;
    CityId: string;
    Email: string;
}

type FormErrors = Partial<Record<keyof ValidateFields, string>> & Record<string, string>;

interface BreadcrumbItem {
    id: string;
    label: string;
    icon?: React.ReactNode | "";
    show?: boolean;
}

interface BreadcrumbProps {
    data?: BreadcrumbItem[];
    activeItem?: string;
    onItemClick?: (id: string, label: string) => void;
    className?: string;
}

interface ColumnsConfig {
    title: string;
    key: string;
}

type ClientBusinessProcessRef = {
    handleView: (arg: unknown) => void;
};

interface Props {
    CurrClientDetails: CurrClientDetails;
}

interface State {
    ActionType: string;
    Error: string;
    SearchQuery: string;
    CurrentPage: number;
    TotalRecords: number;
    ClientBusinessUnitsMaster: BusinessUnitItem[];
    Countries: Country[];
    CountryCodes: CountryCodeOption[];
    States: StateItem[];
    Cities: CityItem[];
    ViewClientDetails: boolean;
    IsLoading: boolean;
    showToast: boolean;
    SavingLoader: boolean;
    isDataExist: string;
    ClientBusinessUnitActionType: string;
    showBusinessProcess: boolean;
    currentBusinessUnit: BusinessUnitItem | null;
    CurrAddEditObj: CurrAddEditObj;
    ValidateFields: ValidateFields;
    FormErrors: FormErrors;
    BreadCrumbData: BreadcrumbItem[];
    ActiveBCItem: string;
}

// ---------- Inline Breadcrumb Component ----------
const Breadcrumb: React.FC<BreadcrumbProps> = ({
                                                   data = [],
                                                   activeItem = "",
                                                   onItemClick = () => {},
                                                   className = "",
                                               }) => {
    const visibleItems = data.filter((item) => item.show !== false);

    const handleItemClick = (item: BreadcrumbItem, index: number) => {
        if (index === visibleItems.length - 1) return;
        onItemClick?.(item.id, item.label);
    };

    if (visibleItems.length === 0) return null;

    return (
        <nav
            className={`flex items-center space-x-1 text-sm ${className}`}
            aria-label="Breadcrumb"
        >
            <ol className="flex items-center space-x-1">
                {visibleItems.map((item, index) => {
                    const isActive = item.id === activeItem;
                    const isLast = index === visibleItems.length - 1;
                    const isClickable = !isLast && !!onItemClick;

                    return (
                        <li key={item.id} className="flex items-center">
                            {/* Breadcrumb Item */}
                            <div
                                className={`
                                    flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200
                                    ${
                                    isClickable
                                        ? "cursor-pointer hover:bg-blue-50 hover:text-blue-600"
                                        : ""
                                }
                                    ${
                                    isActive
                                        ? "bg-blue-100 text-blue-700 font-medium"
                                        : isLast
                                            ? "text-gray-600 font-medium"
                                            : "text-gray-500 hover:text-gray-700"
                                }
                                `}
                                onClick={() => isClickable && handleItemClick(item, index)}
                                role={isClickable ? "button" : undefined}
                                tabIndex={isClickable ? 0 : undefined}
                                onKeyDown={(
                                    e: React.KeyboardEvent<HTMLDivElement>
                                ): void => {
                                    if (
                                        isClickable &&
                                        (e.key === "Enter" || e.key === " ")
                                    ) {
                                        e.preventDefault();
                                        handleItemClick(item, index);
                                    }
                                }}
                            >
                                {/* Icon */}
                                {item.icon && (
                                    <span
                                        className={`${
                                            isActive ? "text-blue-600" : "text-gray-400"
                                        }`}
                                    >
                    {item.icon}
                  </span>
                                )}

                                {/* Label */}
                                <span className="whitespace-nowrap">{item.label}</span>
                            </div>

                            {/* Separator */}
                            {!isLast && (
                                <span className="mx-2" aria-hidden="true">
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default function ClientBusinessUnits(props: Props) {
    const initialState: State = {
        ActionType: "",
        Error: "",
        SearchQuery: "",
        CurrentPage: 1,
        TotalRecords: 0,
        ClientBusinessUnitsMaster: [],
        Countries: [],
        CountryCodes: [],
        States: [],
        Cities: [],
        ViewClientDetails: false,
        IsLoading: true,
        showToast: false,
        SavingLoader: false,
        isDataExist: "",
        ClientBusinessUnitActionType: "",
        showBusinessProcess: false,
        currentBusinessUnit: null,
        CurrAddEditObj: {
            ClientId: "",
            BusinessUnitId: "",
            BusinessUnitName: "",
            CompanyCodeERP: "",
            CountryId: "",
            StateId: "",
            CityId: "",
            CountryCode: "",
            Contact: "",
            Email: "",
            Address1: "",
            Address2: "",
            Zip: "",
            Description: "",
        },
        ValidateFields: {
            BusinessUnitName: "",
        },
        FormErrors: {},
        BreadCrumbData: [
            { id: "BusinessUnit", label: "Business Unit", icon: <Home size={16} />, show: true },
            { id: "BusinessProcess", label: "Business Process", icon: "", show: false },
            { id: "BusinessProcessMapping", label: "Business Process Mapping", icon: "", show: false },
        ],
        ActiveBCItem: "BusinessUnit",
    };

    const [state, setState] = useReducer(
        (s: State, newState: Partial<State>): State => ({ ...s, ...newState }),
        initialState
    );

    const didFetchData = useRef<boolean>(false);
    const BusinessProcess = useRef<ClientBusinessProcessRef | null>(null);

    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;

        const init = async (): Promise<void> => {
            setState({ IsLoading: true });

            await Promise.all([getData(""), getCountryStateCity()]);

            setState({ IsLoading: false });
        };

        void init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---------------------------------------- BreadCrumb Logic------------------------------
    const originalBreadcrumbRef = useRef<BreadcrumbItem[]>([]);
    useEffect(() => {
        if (originalBreadcrumbRef.current.length === 0) {
            originalBreadcrumbRef.current = state.BreadCrumbData.map((item) => ({
                id: item.id,
                label: item.label,
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleBreadcrumbClick = (currentId: string): void => {
        // eslint-disable-next-line no-console
        console.log(
            "Breadcrumb clicked:",
            currentId,
            "state.currentBusinessUnit",
            state.currentBusinessUnit
        );

        if (currentId === "BusinessUnit") {
            setState({
                showBusinessProcess: false,
                currentBusinessUnit: null,
                ActiveBCItem: "BusinessUnit",
                BreadCrumbData: [
                    { id: "BusinessUnit", label: "Business Unit", icon: <Home size={16} />, show: true },
                    { id: "BusinessProcess", label: "Business Process", icon: "", show: false },
                    { id: "BusinessProcessMapping", label: "Business Process Mapping", icon: "", show: false },
                ],
            });
        } else if (currentId === "BusinessProcess" && state.currentBusinessUnit) {
            BusinessProcess?.current?.handleView({});
            handleShowBusinessProcess(state.currentBusinessUnit);
        }
    };

    // ---------------------------------------- BreadCrumb Logic------------------------------

    const getCountryStateCity = async (
        CountryId: string | number | "" = "",
        StateId: string | number | "" = ""
    ): Promise<void> => {
        try {
            const resp: any = await apiRequest("/global-constants/GetCountriesStatesCities", {
                CountryId,
                StateId,
            });
            const countries: Country[] = (resp?.Countries || []) as Country[];
            const CountryCodes: CountryCodeOption[] = countries.map((v) => {
                const phoneCode = String(v.phonecode).replace("+", "");
                return { value: `${v.CountryId}`, label: `${v.iso2} (+${phoneCode})` };
            });

            setState({
                Countries: countries || [],
                CountryCodes,
                States: (resp?.States || []) as StateItem[],
                Cities: (resp?.Cities || []) as CityItem[],
            });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error("Error loading Country/State/City:", err);
        }
    };

    const getData = async (
        SearchQuery: string = "",
        PageNo: number = 1
    ): Promise<void> => {
        try {
            const resp: any = await apiRequest(
                "/GetClientBusinessUnitMasterPaginationFilterSearch",
                {
                    ClientId: props.CurrClientDetails.ClientId,
                    PageNo,
                    StartDate: "",
                    EndDate: "",
                    SearchString: SearchQuery,
                }
            );
            if (resp.ResponseData && resp.ResponseData.length > 0) {
                setState({
                    ClientBusinessUnitsMaster: resp.ResponseData as BusinessUnitItem[],
                    TotalRecords: Number(resp.TotalRecords) || 0,
                });
            } else {
                setState({ ClientBusinessUnitsMaster: [], TotalRecords: 0 });
            }
        } catch (err: unknown) {
            setState({ Error: String(err) });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const handleAddClient = (): void => {
        const CurrAddEditObj: CurrAddEditObj = {
            ClientId: props.CurrClientDetails.ClientId,
            BusinessUnitId: "",
            BusinessUnitName: "",
            CompanyCodeERP: "",
            CountryId: "",
            StateId: "",
            CityId: "",
            CountryCode: "",
            Contact: "",
            Email: "",
            Address1: "",
            Address2: "",
            Zip: "",
            Description: "",
        };
        setState({ ActionType: "Add", CurrAddEditObj, FormErrors: {} });
    };

    const handleEdit = (item: BusinessUnitItem): void => {
        void getCountryStateCity(item.CountryId, item.StateId);

        const mappedItem: CurrAddEditObj = {
            ClientId: item.ClientId,
            BusinessUnitId: item.BusinessUnitId,
            BusinessUnitName: item.BusinessUnitName ?? "",
            CompanyCodeERP: item.CompanyCodeERP ?? "",
            CountryId: item.CountryId,
            StateId: item.StateId,
            CityId: item.CityId as string | number,
            CountryCode: (item.CountryCode ?? "") as string | number,
            Contact: item.Contact ?? "",
            Email: item.Email ?? "",
            Address1: item.Address1 ?? "",
            Address2: item.Address2 ?? "",
            Zip: item.Zip ?? "",
            Description: item.Description ?? "",
        };

        setState({ ActionType: "Update", CurrAddEditObj: mappedItem });
    };

    // Function to show business process
    const handleShowBusinessProcess = (item: BusinessUnitItem): void => {
        // eslint-disable-next-line no-console
        console.log("Business Process button clicked for:", item.BusinessUnitName);

        setState({
            showBusinessProcess: true,
            currentBusinessUnit: item,
            ActiveBCItem: "BusinessProcess",
            BreadCrumbData: [
                {
                    id: "BusinessUnit",
                    label: `Business Unit - ${item.BusinessUnitName}`,
                    icon: <Home size={16} />,
                    show: true,
                },
                { id: "BusinessProcess", label: "Business Process", icon: "", show: true },
                { id: "BusinessProcessMapping", label: "Business Process Mapping", icon: "", show: false },
            ],
        });
    };

    const handleCancel = (): void => {
        const CurrAddEditObj: CurrAddEditObj = {
            ClientId: "",
            BusinessUnitId: "",
            BusinessUnitName: "",
            CompanyCodeERP: "",
            CountryId: "",
            StateId: "",
            CityId: "",
            CountryCode: "",
            Contact: "",
            Email: "",
            Address1: "",
            Address2: "",
            Zip: "",
            Description: "",
        };
        setState({ ActionType: "", CurrAddEditObj });
        void getData("");
    };

    const debouncedSearchQuery = useDebounce(state.SearchQuery, 300) as string;
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

    const handlePageChange = (page: number): void => {
        // eslint-disable-next-line no-console
        console.log("page", page);
        setState({ CurrentPage: page });
        void getData(state.SearchQuery, page);
    };

    const handleChangeClientInfo = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
        name: string
    ): void => {
        const CurrAddEditObj = { ...state.CurrAddEditObj };
        (CurrAddEditObj as Record<string, unknown>)[name] = e.target.value;
        setState({ CurrAddEditObj });
    };

    const validateClientInfoForm = (): boolean => {
        const FormErrors: FormErrors = {};
        let formIsValid = true;

        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        for (const name in state.ValidateFields) {
            const value = (state.CurrAddEditObj as Record<string, unknown>)[name];
            if (value === "" || value === 0) {
                formIsValid = false;
                FormErrors[name] = "This field is required";
            } else {
                if (name === "Email" && typeof value === "string" && !emailRegex.test(value)) {
                    formIsValid = false;
                    FormErrors[name] = "Please enter a valid email address";
                } else {
                    FormErrors[name] = "";
                }
            }
        }
        setState({ FormErrors });
        return formIsValid;
    };

    const handleClientInfoContactChange = (val: string): void => {
        const CurrAddEditObj = { ...state.CurrAddEditObj };
        CurrAddEditObj.Contact = val;
        setState({ CurrAddEditObj });
    };

    const handleDeleteItem = async (item: BusinessUnitItem): Promise<void> => {
        const resp: any = await apiRequest("/DeleteClientBusinessUnitMaster ", item);
        if (resp) {
            setState({ showToast: true });
            void getData();
            setTimeout(() => {
                setState({ showToast: false });
            }, 3000);
        }
    };

    const handleClientInfoCountryCodeChange = (val: string | number): void => {
        const CurrAddEditObj = { ...state.CurrAddEditObj };
        CurrAddEditObj.CountryCode = val;
        setState({ CurrAddEditObj });
    };

    const handleDropdownClientInfo = (
        val: string | number,
        _options: DropdownOption,
        name: string
    ): void => {
        const CurrAddEditObj = { ...state.CurrAddEditObj };
        (CurrAddEditObj as Record<string, unknown>)[name] = val;

        if (name === "CountryId") {
            CurrAddEditObj.CountryCode = val;
            void getCountryStateCity(val);
        }
        if (name === "StateId") {
            void getCountryStateCity(CurrAddEditObj.CountryId, CurrAddEditObj.StateId);
        }
        if (name === "CityId") {
            (CurrAddEditObj as Record<string, unknown>)[name] = String(val);
        }

        setState({ CurrAddEditObj });
    };

    const handleSubmitClientInfo = async (): Promise<void> => {
        if (!validateClientInfoForm()) {
            return;
        }
        setState({ SavingLoader: true });

        const businessUnitData = {
            BusinessUnitId: state.CurrAddEditObj.BusinessUnitId,
            BusinessUnitName: state.CurrAddEditObj.BusinessUnitName,
            CompanyCodeERP: state.CurrAddEditObj.CompanyCodeERP,
            CountryId: state.CurrAddEditObj.CountryId,
            StateId: state.CurrAddEditObj.StateId,
            CityId: state.CurrAddEditObj.CityId,
            CountryCode: state.CurrAddEditObj.CountryCode,
            Contact: state.CurrAddEditObj.Contact,
            Email: state.CurrAddEditObj.Email,
            Address1: state.CurrAddEditObj.Address1,
            Address2: state.CurrAddEditObj.Address2,
            Description: state.CurrAddEditObj.Description,
            Zip: state.CurrAddEditObj.Zip,
            ClientId: props.CurrClientDetails.ClientId,
        };

        const resp: any = await apiRequest("/AddUpdateBusinessUnitMaster", businessUnitData);
        if (resp) {
            setState({ SavingLoader: false, showToast: true, ActionType: "" });
            void getData();
            setTimeout(() => {
                setState({ showToast: false });
            }, 3000);
        }
    };

    if (state.IsLoading)
        return (
            <div className="h-96 py-20">
                <SpinnerV2 {...{ text: "Fetching data..." }} />
            </div>
        );

    if (state.Error) return <ErrorScreen message={state.Error} />;

    // If showing business process, render that component with breadcrumb
    if (state.showBusinessProcess) {
        return (
            <div className="pt-0 pb-6 ">
                {/* Breadcrumb */}
                <div className="py-2.5 px-3.5">
                    <Breadcrumb
                        data={state.BreadCrumbData}
                        activeItem={state.ActiveBCItem}
                        onItemClick={handleBreadcrumbClick}
                    />
                </div>
                <ClientBusinessProcess
                    CurrClientDetails={props.CurrClientDetails}
                    CurrBusinessUnit={state.currentBusinessUnit}
                    activeBreadcrumbItem={state.ActiveBCItem}
                    ref={BusinessProcess as unknown as React.Ref<ClientBusinessProcessRef>}
                    onViewProcessDetails={(processItem: any) => {
                        // Update breadcrumb to show process details level
                        const updatedBreadcrumb = state.BreadCrumbData.map((bcItem, idx) => {
                            if (bcItem.id === "BusinessProcessMapping") {
                                return {
                                    ...bcItem,
                                    label: `Process Details - ${processItem?.BusinessProcessName as string}`,
                                    show: true,
                                };
                            }
                            return {
                                ...bcItem,
                                show: idx <= 2, // Show all three levels
                            };
                        });
                        setState({
                            ActiveBCItem: "BusinessProcessMapping",
                            BreadCrumbData: updatedBreadcrumb,
                        });
                    }}
                    onBackFromProcessDetails={(): void => {
                        // Update breadcrumb to go back to business process level
                        const updatedBreadcrumb = state.BreadCrumbData.map((bcItem, idx) => ({
                            ...bcItem,
                            show: idx <= 1, // Show only BusinessUnit and BusinessProcess
                        }));
                        setState({
                            ActiveBCItem: "BusinessProcess",
                            BreadCrumbData: updatedBreadcrumb,
                        });
                    }}
                />
            </div>
        );
    }

    const columns: ColumnsConfig[] = [
        { title: "Business Unit Name", key: "BusinessUnitName" },
        { title: "Company Code in ERP", key: "CompanyCodeERP" },
        { title: "Email", key: "Email" },
        { title: "Location", key: "Location" },
        { title: "Address1", key: "Address1" },
    ];

    const data = state.ClientBusinessUnitsMaster.map((v) => ({
        ClientName: v.ClientName,
        BusinessUnitName: v.BusinessUnitName,
        CompanyCodeERP: v.CompanyCodeERP,
        Email: v.Email,
        Location: `${v.CityName?`${v.CityName},`:""} ${v.StateName?`${v.StateName},`:""} ${v.CountryName?`${v.CountryName}.`:""}`,
        Address1: v.Address1,
        actions: (
            <div className="flex items-center gap-2">
                <button
                    onClick={() => handleShowBusinessProcess(v)}
                    className="bg-[#0071E9] text-white px-3 py-1.5 rounded text-sm flex items-center gap-2"
                    type="button"
                >
                    <Settings size={16} />
                    Business Process
                </button>

                <ConfirmPopup message="Are you sure you want to delete this item?" onConfirm={() => void handleDeleteItem(v)}>
                    <button className="p-2 hover:bg-red-50 rounded" title="Delete" type="button">
                        <Trash2 className="text-red-500 w-4 h-4" />
                    </button>
                </ConfirmPopup>

                <button
                    onClick={() => handleEdit(v)}
                    className="p-2 hover:bg-green-50 rounded"
                    title="Edit"
                    type="button"
                >
                    <SquarePen className="text-green-600 w-4 h-4" />
                </button>
            </div>
        ),
    }));

    return (
        <div className="pt-0 pb-6 ">
            {/* Breadcrumb */}
            <div className="py-2.5 px-3.5">
                <Breadcrumb
                    data={state.BreadCrumbData}
                    activeItem={state.ActiveBCItem}
                    onItemClick={handleBreadcrumbClick}
                />
            </div>

            {/* Toast */}
            <Toast message="Saved successfully!" show={state.showToast} onClose={() => null} />

            {/* Form View */}
            {state.ActionType !== "" ? (
                <div className="w-full pt-2">
                    {/* Buttons */}
                    <div className="flex justify-end mb-4">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleCancel}
                                className="bg-white border border-[#2196F3] text-[0.89rem] text-[#0582E5] font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
                            >
                                <X className="w-5 h-5" />
                                <span>CANCEL</span>
                            </button>

                            <button
                                onClick={handleSubmitClientInfo}
                                className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
                            >
                                {state.SavingLoader ? (
                                    <>
                                        <SpinnerV2 {...{ text: "Saving..." }} />
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        <span>SAVE</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Business Unit Name */}
                        <div>
                            <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                Business Unit Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                onChange={(e) => handleChangeClientInfo(e, "BusinessUnitName")}
                                value={(state.CurrAddEditObj.BusinessUnitName as string) || ""}
                                type="text"
                                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter business unit name"
                                required
                            />
                            {state.FormErrors.BusinessUnitName && (
                                <div className="flex items-center mt-1 ml-2">
                                    <CircleAlert size={14} className="text-red-500" />
                                    <p className="ml-2 text-red-500 text-sm">
                                        {state.FormErrors.BusinessUnitName}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Company Code */}
                        <div>
                            <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                Company Code <span className="text-[0.75rem]">(In ERP System)</span>
                            </label>
                            <input
                                onChange={(e) => handleChangeClientInfo(e, "CompanyCodeERP")}
                                value={(state.CurrAddEditObj.CompanyCodeERP as string) || ""}
                                type="text"
                                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder=""
                                required
                            />
                        </div>

                        {/* Country */}
                        <div>
                            <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                Country
                            </label>
                            <Dropdown
                                mode={"single" as Mode}
                                options={state.Countries}
                                value={state.CurrAddEditObj.CountryId}
                                onChange={(val: string | number, item: unknown) =>
                                    handleDropdownClientInfo(val, item as DropdownOption, "CountryId")
                                }
                                onSearch={(q: string) => {
                                    // eslint-disable-next-line no-console
                                    console.log("Search:", q);
                                }}
                            />
                            {state.FormErrors.CountryId && (
                                <div className="flex items-center mt-1 ml-2">
                                    <CircleAlert size={14} className="text-red-500" />
                                    <p className="text-red-500 text-sm">{state.FormErrors.CountryId}</p>
                                </div>
                            )}
                        </div>

                        {/* State */}
                        <div>
                            <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                State
                            </label>
                            <Dropdown
                                mode={"single" as Mode}
                                options={state.States}
                                value={state.CurrAddEditObj.StateId}
                                onChange={(val: string | number, item: unknown) =>
                                    handleDropdownClientInfo(val, item as DropdownOption, "StateId")
                                }
                                onSearch={(q: string) => {
                                    // eslint-disable-next-line no-console
                                    console.log("Search:", q);
                                }}
                            />
                            {state.FormErrors.StateId && (
                                <div className="flex items-center mt-1 ml-2">
                                    <CircleAlert size={14} className="text-red-500" />
                                    <p className="text-red-500 text-sm">{state.FormErrors.StateId}</p>
                                </div>
                            )}
                        </div>

                        {/* City */}
                        <div>
                            <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                City
                            </label>
                            <Dropdown
                                mode={"single" as Mode}
                                options={state.Cities}
                                value={state.CurrAddEditObj.CityId}
                                onChange={(val: string | number, item: unknown) =>
                                    handleDropdownClientInfo(val, item as DropdownOption, "CityId")
                                }
                                onSearch={(q: string) => {
                                    // eslint-disable-next-line no-console
                                    console.log("Search:", q);
                                }}
                            />
                            {state.FormErrors.CityId && (
                                <div className="flex items-center mt-1 ml-2">
                                    <CircleAlert size={14} className="text-red-500" />
                                    <p className="text-red-500 text-sm">{state.FormErrors.CityId}</p>
                                </div>
                            )}
                        </div>

                        {/* Contact */}
                        <div>
                            <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                Contact
                            </label>
                            <PhoneNumberInput
                                countryOptions={state.CountryCodes}
                                countryCode={state.CurrAddEditObj.CountryCode}
                                onCountryChange={handleClientInfoCountryCodeChange}
                                phoneNumber={state.CurrAddEditObj.Contact as string}
                                onPhoneChange={handleClientInfoContactChange}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                Email
                            </label>
                            <input
                                onChange={(e) => handleChangeClientInfo(e, "Email")}
                                value={(state.CurrAddEditObj.Email as string) || ""}
                                type="text"
                                className="w-full px-4 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder=""
                                required
                            />
                            {state.FormErrors.Email && (
                                <div className="flex items-center mt-1 ml-2">
                                    <CircleAlert size={14} className="text-red-500" />
                                    <p className="text-red-500 text-sm">{state.FormErrors.Email}</p>
                                </div>
                            )}
                        </div>

                        {/* Zipcode */}
                        <div>
                            <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                Zipcode
                            </label>
                            <input
                                onChange={(e) => handleChangeClientInfo(e, "Zip")}
                                value={(state.CurrAddEditObj.Zip as string) || ""}
                                type="text"
                                className="w-full px-4 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-300"
                                placeholder=""
                                required
                            />
                        </div>

                        {/* Address 1 */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[0.90rem] text-[#2C3E50] font-medium">
                                    Address 1
                                </label>
                            </div>
                            <div className="relative">
                <textarea
                    onChange={(e) => handleChangeClientInfo(e, "Address1")}
                    value={(state.CurrAddEditObj.Address1 as string) || ""}
                    rows={1}
                    maxLength={2000}
                    placeholder="Address1"
                    className="w-full px-4 shadow text-[0.85rem] py-2 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8] resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                ></textarea>
                                <div className="absolute bottom-2 right-2">
                                    <svg
                                        className="w-4 h-4 text-gray-500"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            d="M4 13l4 4L16 7"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                            fill="none"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Address 2 */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[0.90rem] text-[#2C3E50] font-medium">
                                    Address 2
                                </label>
                            </div>
                            <div className="relative">
                <textarea
                    onChange={(e) => handleChangeClientInfo(e, "Address2")}
                    value={(state.CurrAddEditObj.Address2 as string) || ""}
                    rows={4}
                    maxLength={2000}
                    placeholder="Address2"
                    className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8] resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                ></textarea>
                                <div className="absolute bottom-2 right-2">
                                    <svg
                                        className="w-4 h-4 text-gray-500"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            d="M4 13l4 4L16 7"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                            fill="none"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[0.90rem] text-[#2C3E50] font-medium">
                                    Description
                                </label>
                            </div>
                            <div className="relative">
                <textarea
                    onChange={(e) => handleChangeClientInfo(e, "Description")}
                    value={(state.CurrAddEditObj.Description as string) || ""}
                    rows={4}
                    maxLength={2000}
                    placeholder="Description"
                    className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8] resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                ></textarea>
                                <div className="absolute bottom-2 right-2">
                                    <svg
                                        className="w-4 h-4 text-gray-500"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            d="M4 13l4 4L16 7"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                            fill="none"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // Table View
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
                                placeholder="Search"
                                className="ml-3 text-[0.89rem] bg-transparent outline-none placeholder-gray-500 w-full"
                            />
                        </div>

                        <button
                            onClick={handleAddClient}
                            className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Add Business Unit</span>
                        </button>
                    </div>

                    <CustomTable columns={columns as unknown as any[]} data={data as unknown as any[]} responsive={true} />

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
