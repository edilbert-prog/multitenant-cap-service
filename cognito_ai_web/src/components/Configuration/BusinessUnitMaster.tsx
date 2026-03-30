import React, { useEffect, useReducer, useRef } from 'react';
import CustomTable from "../../utils/CustomTable";
import { ChevronLeft, CircleAlert, Plus, Save, SquarePen, Trash2 } from "lucide-react";
import { apiRequest } from "../../utils/helpers/ApiHelper";
import Spinner from "../../utils/Spinner";
import ErrorScreen from "../../utils/ErrorScreen";
import Pagination from "../../utils/Pagination";
import Toast from "../../utils/Toast";
import useDebounce from "../../utils/helpers/useDebounce";
import Dropdown from "../../utils/Dropdown";
import PhoneNumberInput from "../../utils/PhoneNumberInput";
import ConfirmPopup from "../../utils/ConfirmPopup";

interface Country {
    CountryId: string;
    iso2: string;
    phonecode: string;
}

interface StateItem {
    StateId: string;
    StateName?: string;
}

interface CityItem {
    CityId: string;
    CityName?: string;
}

interface CountryCodeOption {
    value: string;
    label: string;
}

interface BusinessUnitMasterItem {
    BusinessUnitId: string;
    BusinessUnitName: string;
    CompanyCodeERP: string;
    CountryId: string;
    StateId: string;
    CityId: string;
    CountryCode: string;
    Contact: string;
    Email: string;
    Address1: string;
    Address2: string;
    Description: string;
    Zip: string;
    ClientName?: string;
    CityName?: string;
    StateName?: string;
    CountryName?: string;
}

interface ValidateFields {
    BusinessUnitName: string;
    CountryId: string;
    StateId: string;
    CityId: string;
    Email: string;
}

type FormErrors = Partial<Record<keyof ValidateFields, string>>;

interface CountryStateCityResponse {
    Countries: Country[];
    States: StateItem[];
    Cities: CityItem[];
}

interface BusinessUnitPaginationResponse {
    ResponseData: BusinessUnitMasterItem[];
    TotalRecords: number;
}

interface CheckClientsMasterResponse {
    ClientsMaster: unknown[];
}

interface State {
    ActionType: "" | "Add" | "Update";
    Error: string;
    SearchQuery: string;
    CurrentPage: number;
    TotalRecords: number;
    BusinessUnitsMaster: BusinessUnitMasterItem[];
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
    CurrAddEditObj: BusinessUnitMasterItem;
    ValidateFields: ValidateFields;
    FormErrors: FormErrors;
}

export default function BusinessUnitMaster(): JSX.Element {
    const [state, setState] = useReducer(
        (prev: State, next: Partial<State>): State => ({ ...prev, ...next }),
        {
            ActionType: "",
            Error: "",
            SearchQuery: "",
            CurrentPage: 1,
            TotalRecords: 1,
            BusinessUnitsMaster: [],
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
            CurrAddEditObj: {
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
                Description: "",
                Zip: "",
                ClientName: "",
            },
            ValidateFields: {
                BusinessUnitName: "",
                CountryId: "",
                StateId: "",
                CityId: "",
                Email: "",
            },
            FormErrors: {},
        } as State
);

    const didFetchData = useRef<boolean>(false);

    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;

        const init = async () => {
            setState({ IsLoading: true });

            await Promise.all([getData(""), getCountryStateCity()]);

            setState({ IsLoading: false });
        };

        init();
    }, []);

    const getCountryStateCity = async (CountryId: string = "", StateId: string = ""): Promise<void> => {
        try {
            const resp = (await apiRequest("/global-constants/GetCountriesStatesCities", {
                CountryId,
                StateId,
            })) as unknown as CountryStateCityResponse;

            const CountryCodes: CountryCodeOption[] = (resp.Countries ?? []).map((v) => {
                const phoneCode = v.phonecode.replace("+", "");
                return { value: `${v.CountryId}`, label: `${v.iso2} (+${phoneCode})` };
            });

            setState({
                Countries: resp.Countries || [],
                CountryCodes,
                States: resp.States || [],
                Cities: resp.Cities || [],
            });
        } catch (err) {
            console.error("Error loading Country/State/City:", err);
        }
    };

    const getData = async (SearchQuery: string = "", PageNo: number = 1): Promise<void> => {
        try {
            const resp = (await apiRequest("/GetBusinessUnitMasterPaginationFilterSearch", {
                PageNo,
                StartDate: "",
                EndDate: "",
                SearchString: SearchQuery,
            })) as unknown as BusinessUnitPaginationResponse;

            if (resp.ResponseData.length > 0) {
                setState({ BusinessUnitsMaster: resp.ResponseData, TotalRecords: resp.TotalRecords });
            } else {
                setState({ BusinessUnitsMaster: [], TotalRecords: 0 });
            }
        } catch (err) {
            setState({ Error: (err as Error).toString() });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const handleAddClient = (): void => {
        const CurrAddEditObj: BusinessUnitMasterItem = {
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
            Description: "",
            Zip: "",
            ClientName: "",
        };
        setState({ ActionType: "Add", CurrAddEditObj, FormErrors: {} });
    };

    const handleEdit = (item: BusinessUnitMasterItem): void => {
        getCountryStateCity(item.CountryId, item.StateId);
        setState({ ActionType: "Update", CurrAddEditObj: item });
    };

    const handleCancel = (): void => {
        const CurrAddEditObj: BusinessUnitMasterItem = {
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
            Description: "",
            Zip: "",
            ClientName: "",
        };
        setState({ ActionType: "", CurrAddEditObj });
        getData("");
    };

    const debouncedSearchQuery = useDebounce<string>(state.SearchQuery, 300);
    const didSearchRun = useRef<boolean>(false);

    useEffect(() => {
        if (!didSearchRun.current) {
            didSearchRun.current = true;
            return;
        }
        if (debouncedSearchQuery.trim() === "") return;
        getData(debouncedSearchQuery);
    }, [debouncedSearchQuery]);

    const debouncedQuery = useDebounce<string>(state.CurrAddEditObj.ClientName ?? "", 500);
    void debouncedQuery;

    const checkIfDataExist = async (query: string): Promise<void> => {
        const resp = (await apiRequest("/CheckClientsMaster", {
            ClientName: query,
        })) as unknown as CheckClientsMasterResponse;
        if ((resp.ClientsMaster ?? []).length > 0) {
            setState({ isDataExist: "Client already existed" });
        } else {
            setState({ isDataExist: "" });
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const value = e.target.value;
        setState({ SearchQuery: value });
        if (value.trim() === "") {
            getData("");
        }
    };

    const handleChangeClientInfo = (
            e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
        name: keyof BusinessUnitMasterItem
): void => {
        const CurrAddEditObj = { ...state.CurrAddEditObj };
        CurrAddEditObj[name] = e.target.value as unknown as BusinessUnitMasterItem[typeof name];
        setState({ CurrAddEditObj });
    };

    const validateClientInfoForm = (): boolean => {
        const FormErrors: FormErrors = {};
        let formIsValid = true;

        const emailRegex = "";
        for (const name in state.ValidateFields) {
            const key = name as keyof BusinessUnitMasterItem;
            const value = state.CurrAddEditObj[key] as unknown as string | number | undefined;

            if (value === "" || value === 0 || value === undefined) {
                formIsValid = false;
                FormErrors[key as keyof ValidateFields] = "This field is required";
            } else {
                if (name === "EmailId" && typeof value === "string" && !emailRegex.test(value)) {
                    formIsValid = false;
                    // @ts-expect-error EmailId is not a key of ValidateFields; kept to preserve original logic
                    FormErrors[name] = "Please enter a valid email address";
                } else if (key in state.ValidateFields) {
                    FormErrors[key as keyof ValidateFields] = "";
                }
            }
        }
        setState({ FormErrors });
        return formIsValid;
    };

    const handleClientInfoContactChange = (val: string): void => {
        const CurrAddEditObj = { ...state.CurrAddEditObj, Contact: val };
        setState({ CurrAddEditObj });
    };

    const handlePageChange = (page: number): void => {
        setState({ CurrentPage: page });
        getData(state.SearchQuery, page);
    };

    const handleClientInfoCountryCodeChange = (val: string): void => {
        const CurrAddEditObj = { ...state.CurrAddEditObj, CountryCode: val };
        setState({ CurrAddEditObj });
    };

    const handleDropdownClientInfo = (
            val: string | number,
        _options: unknown,
        name: keyof BusinessUnitMasterItem
): void => {
        const CurrAddEditObj = { ...state.CurrAddEditObj };
        const strVal = String(val) as unknown as BusinessUnitMasterItem[typeof name];
        CurrAddEditObj[name] = strVal;
        if (name === "CountryId") {
            CurrAddEditObj.CountryCode = String(val);
            getCountryStateCity(String(val));
        }
        if (name === "StateId") {
            getCountryStateCity(CurrAddEditObj.CountryId, CurrAddEditObj.StateId);
        }
        if (name === "CityId") {
            CurrAddEditObj[name] = String(val) as unknown as BusinessUnitMasterItem[typeof name];
        }
        setState({ CurrAddEditObj });
    };

    const handleSubmitClientInfo = async (): Promise<void> => {
        if (!validateClientInfoForm()) {
            return;
        }
        setState({ SavingLoader: true });
        const resp = await apiRequest("/AddUpdateBusinessUnitMaster ", state.CurrAddEditObj);
        if (resp) {
            setState({ SavingLoader: false, showToast: true, ActionType: "" });
            getData();
            setTimeout(() => {
                setState({ showToast: false });
            }, 3000);
        }
    };

    const handleDeleteItem = async (item: BusinessUnitMasterItem): Promise<void> => {
        const resp = await apiRequest("/DeleteBusinessUnitMaster", item);
        if (resp) {
            setState({ showToast: true });
            getData();
            setTimeout(() => {
                setState({ showToast: false });
            }, 3000);
        }
    };

    if (state.IsLoading)
        return (
            <div className="h-96 py-20">
                <Spinner size="lg" color="blue-500" text="Fetching data..." />
            </div>
        );
    if (state.Error) return <ErrorScreen message={state.Error} />;

    const columns = [
        { title: 'Business Unit Name', key: 'BusinessUnitName' },
        { title: 'Company Code in ERP', key: 'CompanyCodeERP' },
        { title: 'Email', key: 'Email' },
        { title: 'Location', key: 'Location' },
        { title: 'Address1', key: 'Address1', className: 'min-w-[400px]' },
    ] satisfies Array<{ title: string; key: string; className?: string }>;

    const data: Array<Record<string, React.ReactNode>> = state.BusinessUnitsMaster.map((v) => ({
        BusinessUnitName: v.BusinessUnitName,
        CompanyCodeERP: v.CompanyCodeERP,
        Email: v.Email,
        Location: `${v.CityName ?? ""}, ${v.StateName ?? ""}, ${v.CountryName ?? ""}.`,
        Address1: v.Address1,
        actions: (
            <>
                <button onClick={() => handleEdit(v)} className=" ">
                    <SquarePen className="text-[#1A1A1A] cursor-pointer" />
                </button>
                <ConfirmPopup message="Are you sure you want to delete this item?" onConfirm={() => handleDeleteItem(v)}>
                    <button className=" pr-4 flex items-center">
                        <Trash2 className="text-[#1A1A1A] cursor-pointer " />
                    </button>
                </ConfirmPopup>
            </>
        ),
    }));

    return (
        <div className="  pt-0 pb-6 px-6 ">
            <Toast message="Saved successfully!" show={state.showToast} onClose={() => null} />
            {state.ActionType !== "" ? (
                <div className=" w-full pt-2 ">
                    <div className="flex justify-between items-center pb-4">
                        <div
                            onClick={handleCancel}
                            className="flex items-center cursor-pointer bg-[#f3f3f3]  w-fit px-4 py-1 rounded-full"
                        >
                            <ChevronLeft className="text-gray-700" /> <span className="font-medium text-sm text-gray-700"> Back</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <button
                                onClick={state.SavingLoader ? undefined : handleSubmitClientInfo}
                                className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
                            >
                                {state.SavingLoader ? (
                                    <>
                                        <Spinner size="xs" color="white" text="" />
                                        <span>Saving..</span>
                                    </>
                                ) : (
                                    <>
                                        {' '}
                                        <Save className="w-5 h-5" />
                                        <span>SAVE</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="">
                            <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                Business Unit Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                onChange={(e) => handleChangeClientInfo(e, "BusinessUnitName")}
                                value={state.CurrAddEditObj.BusinessUnitName}
                                type="text"
                                id="client"
                                name="client"
                                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter business unit name"
                                required
                            />
                            {state.FormErrors.BusinessUnitName && (
                                <div className="flex items-center mt-1 ml-2">
                                    <CircleAlert size={14} className="text-red-500" />
                                    <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.BusinessUnitName}</p>
                                </div>
                            )}
                            {state.isDataExist && (
                                <div className="flex items-center mt-1 ml-2">
                                    <CircleAlert size={14} className="text-red-500" />
                                    <p className="ml-2 text-red-500 text-sm ">{state.isDataExist}</p>
                                </div>
                            )}
                        </div>
                        <div className="">
                            <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                Company Code <span className="text-[0.75rem]">(In ERP System)</span>
                            </label>
                            <input
                                onChange={(e) => handleChangeClientInfo(e, "CompanyCodeERP")}
                                value={state.CurrAddEditObj.CompanyCodeERP}
                                type="text"
                                id="client"
                                name="client"
                                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder=""
                                required
                            />
                        </div>
                        <div className="">
                            <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                Country <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                mode="single"
                                options={state.Countries}
                                value={state.CurrAddEditObj.CountryId}
                                onChange={(val: string | number, item: unknown) => handleDropdownClientInfo(val, item, "CountryId")}
                                onSearch={(q: string) => console.log("Search (Multi):", q)}
                            />

                            {state.FormErrors.CountryId && (
                                <div className="flex items-center mt-1 ml-2">
                                    <CircleAlert size={14} className="text-red-500" />
                                    <p className="text-red-500 text-sm ">{state.FormErrors.CountryId}</p>
                                </div>
                            )}
                        </div>
                        <div className="">
                            <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                State <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                mode="single"
                                options={state.States}
                                value={state.CurrAddEditObj.StateId}
                                onChange={(val: string | number, item: unknown) => handleDropdownClientInfo(val, item, "StateId")}
                                onSearch={(q: string) => console.log("Search (Multi):", q)}
                            />
                            {state.FormErrors.StateId && (
                                <div className="flex items-center mt-1 ml-2">
                                    <CircleAlert size={14} className="text-red-500" />
                                    <p className="text-red-500 text-sm ">{state.FormErrors.StateId}</p>
                                </div>
                            )}
                        </div>
                        <div className="">
                            <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                City <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                mode="single"
                                options={state.Cities}
                                value={state.CurrAddEditObj.CityId}
                                onChange={(val: string | number, item: unknown) => handleDropdownClientInfo(val, item, "CityId")}
                                onSearch={(q: string) => console.log("Search (Multi):", q)}
                            />
                            {state.FormErrors.CityId && (
                                <div className="flex items-center mt-1 ml-2">
                                    <CircleAlert size={14} className="text-red-500" />
                                    <p className="text-red-500 text-sm ">{state.FormErrors.CityId}</p>
                                </div>
                            )}
                        </div>
                        <div className="">
                            <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                Contact
                            </label>
                            <PhoneNumberInput
                                countryOptions={state.CountryCodes}
                                countryCode={state.CurrAddEditObj.CountryCode}
                                onCountryChange={handleClientInfoCountryCodeChange}
                                phoneNumber={state.CurrAddEditObj.Contact}
                                onPhoneChange={handleClientInfoContactChange}
                            />
                        </div>
                        <div className="">
                            <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                onChange={(e) => handleChangeClientInfo(e, "Email")}
                                value={state.CurrAddEditObj.Email}
                                type="text"
                                id="client"
                                name="client"
                                className="w-full px-4 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder=""
                                required
                            />
                            {state.FormErrors.Email && (
                                <div className="flex items-center mt-1 ml-2">
                                    <CircleAlert size={14} className="text-red-500" />
                                    <p className="text-red-500 text-sm ">{state.FormErrors.Email}</p>
                                </div>
                            )}
                        </div>
                        <div className="">
                            <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                Zipcode
                            </label>
                            <input
                                onChange={(e) => handleChangeClientInfo(e, "Zip")}
                                value={state.CurrAddEditObj.Zip}
                                type="text"
                                id="client"
                                name="client"
                                className="w-full px-4 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-300"
                                placeholder=""
                                required
                            />
                        </div>
                        <div className=" ">
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="name" className=" text-[0.90rem] text-[#2C3E50] font-medium">
                                    Address 1
                                </label>
                            </div>

                            <div className="relative">
                <textarea
                    onChange={(e) => handleChangeClientInfo(e, "Address1")}
                    value={state.CurrAddEditObj.Address1}
                    id="name"
                    name="name"
                    rows={1}
                    maxLength={2000}
                    placeholder="Address1"
                    className="w-full px-4 shadow text-[0.85rem] py-2 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8]   resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                ></textarea>

                                <div className="absolute bottom-2 right-2">
                                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M4 13l4 4L16 7" stroke="currentColor" strokeWidth={2} fill="none" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div className=" ">
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="name" className=" text-[0.90rem] text-[#2C3E50] font-medium">
                                    Address 2
                                </label>
                            </div>

                            <div className="relative">
                <textarea
                    onChange={(e) => handleChangeClientInfo(e, "Address2")}
                    value={state.CurrAddEditObj.Address2}
                    id="name"
                    name="name"
                    rows={4}
                    maxLength={2000}
                    placeholder="Address2"
                    className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8]   resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                ></textarea>

                                <div className="absolute bottom-2 right-2">
                                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M4 13l4 4L16 7" stroke="currentColor" strokeWidth={2} fill="none" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center pb-4">
                        <div className="flex items-center w-full max-w-md px-4 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg shadow-sm">
                            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
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
                                className="ml-3 text-[0.89rem] text bg-transparent outline-none  placeholder-gray-500 w-full"
                            />
                        </div>

                        <div>
                            <button
                                onClick={handleAddClient}
                                className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Add </span>
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
