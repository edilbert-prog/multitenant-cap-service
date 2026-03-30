// ClientInfo
import React, { useEffect, useReducer, useRef, useState } from 'react';
import CustomTable from "../../../utils/CustomTable";
import { ChevronLeft, CircleAlert, Plus, SquarePen, Trash2 } from "lucide-react";
import { apiRequest } from "../../../utils/helpers/ApiHelper";
import SpinnerV2 from "../../../utils/SpinnerV2";
import ErrorScreen from "../../../utils/ErrorScreen";
import Pagination from "../../../utils/Pagination";
import PillGroup from "../../../utils/PillGroup";
import Modal from "../../../utils/Modal";
import Toast from "../../../utils/Toast";
import useDebounce from "../../../utils/helpers/useDebounce";
import Dropdown from "../../../utils/Dropdown";
import PhoneNumberInput from "../../../utils/PhoneNumberInput";
import ClientBusinessUnits from "./ClientBusinessUnits";
import ClientBusinessProcess from "./ClientBusinessProcess";
// import Projects from "../../TestDesignStudio/ProjectSprintDocs/Projects";
import ConfirmPopup from "@/utils/ConfirmPopup";

void useState;
void SquarePen;

type Props = {};

type PillKey = 'ClientInfo' | 'business-units' | 'Projects' | 'business-process';

interface PillItem {
    key: PillKey;
    label: string;
}

interface Country {
    CountryId: string | number;
    iso2: string;
    phonecode: string;
    [k: string]: unknown;
}

interface CountryCodeOption {
    value: string;
    label: string;
}

interface StateItem {
    StateId: string | number;
    StateName?: string;
    [k: string]: unknown;
}

interface CityItem {
    CityId: string | number;
    CityName?: string;
    [k: string]: unknown;
}

interface ClientDetails {
    ClientId: string | number | "";
    ClientName: string;
    IndustryType: string | string[];
    CompanyIdERP: string;
    CountryId: string | number | "";
    StateId: string | number | "";
    CityId: string | number | "";
    CountryCode: string | number | "";
    Contact: string;
    Email: string;
    Address1: string;
    Address2: string;
    Zip: string;
    Description: string;
    CityName?: string;
    StateName?: string;
    CountryName?: string;
    [k: string]: unknown;
}

interface ClientInfoValidateFields {
    [key: string]: string;
    ClientName: string;
    Email: string;
    IndustryType: string;
    CountryId: string;
    StateId: string;
    CityId: string;
}

interface StateShape {
    Error: string;
    SearchQuery: string;
    ClientMaster: ClientDetails[];
    TotalRecords: number;
    CurrentPage: number;
    Countries: Country[];
    CountryCodes: CountryCodeOption[];
    States: StateItem[];
    Cities: CityItem[];
    IndustryTypes: Array<{ label: string; value: string }>;
    ViewClientDetails: boolean;
    IsLoading: boolean;
    ViewDetails: boolean;
    openModal: boolean;
    showToast: boolean;
    SavingLoader: boolean;
    isDataExist: string;
    ClientBusinessUnitActionType: string;
    CurrPillActive: PillKey;
    CurrClientDetails: ClientDetails;
    ClientInfoValidateFields: ClientInfoValidateFields;
    ClientInfoErrors: Record<string, string>;
    pillItems: PillItem[];
    CurrTab: string;
}

interface TableColumn {
    title: string;
    key: string;
    className?: string;
}

export default function ClientInfo(props: Props) {
    const initialState: StateShape = {
        Error: "",
        SearchQuery: "",
        ClientMaster: [],
        TotalRecords: 0,
        CurrentPage: 1,
        Countries: [],
        CountryCodes: [],
        States: [],
        Cities: [],
        IndustryTypes: [
            { "label": "Agriculture", "value": "agriculture" },
            { "label": "Automotive", "value": "automotive" },
            { "label": "Aviation & Aerospace", "value": "aviation_aerospace" },
            { "label": "Biotechnology", "value": "biotechnology" },
            { "label": "Construction", "value": "construction" },
            { "label": "Consumer Goods", "value": "consumer_goods" },
            { "label": "Defense & Military", "value": "defense_military" },
            { "label": "Education", "value": "education" },
            { "label": "Energy & Utilities", "value": "energy_utilities" },
            { "label": "Engineering", "value": "engineering" },
            { "label": "Entertainment & Media", "value": "entertainment_media" },
            { "label": "Environmental Services", "value": "environmental_services" },
            { "label": "Financial Services", "value": "financial_services" },
            { "label": "Food & Beverage", "value": "food_beverage" },
            { "label": "Government & Public Sector", "value": "government_public_sector" },
            { "label": "Healthcare & Medical", "value": "healthcare_medical" },
            { "label": "Hospitality & Tourism", "value": "hospitality_tourism" },
            { "label": "Information Technology (IT)", "value": "information_technology" },
            { "label": "Insurance", "value": "insurance" },
            { "label": "Legal Services", "value": "legal_services" },
            { "label": "Logistics & Supply Chain", "value": "logistics_supply_chain" },
            { "label": "Manufacturing", "value": "manufacturing" },
            { "label": "Maritime", "value": "maritime" },
            { "label": "Marketing & Advertising", "value": "marketing_advertising" },
            { "label": "Mining & Metals", "value": "mining_metals" },
            { "label": "Nonprofit & NGOs", "value": "nonprofit_ngos" },
            { "label": "Pharmaceuticals", "value": "pharmaceuticals" },
            { "label": "Real Estate", "value": "real_estate" },
            { "label": "Retail & E-commerce", "value": "retail_ecommerce" },
            { "label": "Sports & Recreation", "value": "sports_recreation" },
            { "label": "Telecommunications", "value": "telecommunications" },
            { "label": "Textiles & Apparel", "value": "textiles_apparel" },
            { "label": "Transportation", "value": "transportation" },
            { "label": "Utilities", "value": "utilities" },
            { "label": "Wholesale Trade", "value": "wholesale_trade" }
        ],
        ViewClientDetails: false,
        IsLoading: true,
        ViewDetails: false,
        openModal: false,
        showToast: false,
        SavingLoader: false,
        isDataExist: "",
        ClientBusinessUnitActionType: "",
        CurrPillActive: "ClientInfo",
        CurrClientDetails: {
            "ClientId": "",
            "ClientName": "",
            "IndustryType": "",
            "CompanyIdERP": "",
            "CountryId": "",
            "StateId": "",
            "CityId": "",
            "CountryCode": "",
            "Contact": "",
            "Email": "",
            "Address1": "",
            "Address2": "",
            "Zip": "",
            "Description": "",
        },
        ClientInfoValidateFields: {
            "ClientName": "",
            // "Email": "",
            // "IndustryType": "",
            // "CountryId": "",
            // "StateId": "",
            // "CityId": "",
        },
        ClientInfoErrors: {},
        pillItems: [
            { key: 'ClientInfo', label: 'Organisation Info' },
            { key: 'business-units', label: 'Business Units' },
            // { key: 'Projects', label: 'Projects' },
        ],
        CurrTab: "Organisation Details"
    };

    const [state, setState] = useReducer(
        (prev: StateShape, update: Partial<StateShape>): StateShape => ({ ...prev, ...update }),
        initialState
    );

    const didFetchData = useRef<boolean>(false);

    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;

        const init = async () => {
            setState({ IsLoading: true });

            await Promise.all([
                getData(""),
                getCountryStateCity()
            ]);
            setState({ IsLoading: false });
        };

        void init();
    }, []);

    const getCountryStateCity = async (CountryId: string | number | "" = "", StateId: string | number | "" = ""): Promise<void> => {
        const resp: any = await apiRequest("/global-constants/GetCountriesStatesCities", {
            "CountryId": CountryId,
            "StateId": StateId
        });

        if (resp.Countries && resp.Countries.length > 0) {
            const CountryCodes: CountryCodeOption[] = [];
            resp.Countries.map((v: Country) => {
                let phoneCode = "";
                if (String(v.phonecode).includes("+")) {
                    phoneCode = String(v.phonecode).replace("+", "");
                } else {
                    phoneCode = String(v.phonecode);
                }
                CountryCodes.push({ value: `${v.CountryId}`, label: `${v.iso2} (+${phoneCode})` });
                return null;
            });
            setState({ Countries: resp.Countries as Country[], CountryCodes });
        }
        if (resp.States && resp.States.length > 0) {
            setState({ States: resp.States as StateItem[] });
        }
        if (resp.Cities && resp.Cities.length > 0) {
            setState({ Cities: resp.Cities as CityItem[] });
        }
    };

    const getData = async (SearchQuery: string = "", PageNo: number = 1): Promise<void> => {
        try {
            const resp: any = await apiRequest("/clients/GetClientsMasterPaginationFilterSearch", {
                "PageNo": PageNo,
                "StartDate": "",
                "EndDate": "",
                "SearchString": SearchQuery
            });
            if (resp.ResponseData && resp.ResponseData.length > 0) {
                setState({ ClientMaster: resp.ResponseData as ClientDetails[], TotalRecords: Number(resp.TotalRecords ?? 0) });
            } else {
                setState({ ClientMaster: [], TotalRecords: 0 });
            }
        } catch (err: unknown) {
            setState({ Error: (err as Error).toString() });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const handlePageChange = (page: number): void => {
        console.log("page", page);
        setState({ CurrentPage: page });
        void getData(state.SearchQuery, page);
    };

    const handleAddClient = (): void => {
        const CurrClientDetails: ClientDetails = {
            "ClientId": "",
            "ClientName": "",
            "IndustryType": "",
            "CompanyIdERP": "",
            "CountryId": "",
            "StateId": "",
            "CityId": "",
            "CountryCode": "",
            "Contact": "",
            "Email": "",
            "Address1": "",
            "Address2": "",
            "Zip": "",
            "Description": "",
        };
        setState({ ViewClientDetails: true, CurrClientDetails });
    };

    const handleViewClientDetails = (item: ClientDetails): void => {
        void getCountryStateCity(item.CountryId, item.StateId);
        setState({ ViewClientDetails: true, CurrClientDetails: item });
    };

    const handleCloseClientDetails = (): void => {
        const CurrClientDetails: ClientDetails = {
            "ClientId": "",
            "ClientName": "",
            "IndustryType": "",
            "CompanyIdERP": "",
            "CountryCode": "",
            "Contact": "",
            "CountryId": "",
            "StateId": "",
            "CityId": "",
            "Email": "",
            "Address1": "",
            "Address2": "",
            "Zip": "",
            "Description": "",
        };
        setState({ ViewClientDetails: false, CurrClientDetails });
        void getData();
    };

    const handlePillClick = (item: PillItem): void => {
        if (state.CurrClientDetails.ClientId === "" && item.key !== "ClientInfo") {
            setState({ openModal: true });
        } else {
            setState({ CurrPillActive: item.key });
        }
    };

    const debouncedSearchQuery: string = useDebounce(state.SearchQuery, 300) as string;
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

    const handleChangeClientInfo = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
        name: keyof ClientDetails | string
    ): void => {
        const CurrClientDetails = { ...state.CurrClientDetails };
        (CurrClientDetails as Record<string, unknown>)[name as string] = e.target.value;
        setState({ CurrClientDetails });
    };

    const validateClientInfoForm = (): boolean => {
        const ClientInfoErrors: Record<string, string> = {};
        let formIsValid = true;

        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        for (const name in state.ClientInfoValidateFields) {
            const value = (state.CurrClientDetails as Record<string, unknown>)[name] as string | number | undefined;
            if (value === "" || value === 0 || value === undefined) {
                formIsValid = false;
                ClientInfoErrors[name] = "This field is required";
            } else {
                if (name === "EmailId" && typeof value === "string" && !emailRegex.test(value)) {
                    formIsValid = false;
                    ClientInfoErrors[name] = "Please enter a valid email address";
                } else {
                    ClientInfoErrors[name] = "";
                }
            }
        }
        setState({
            ClientInfoErrors
        });
        return formIsValid;
    };

    const handleSubmitClientInfo = async (): Promise<void> => {
        if (!validateClientInfoForm()) {
            return;
        }
        setState({ SavingLoader: true });
        const resp: any = await apiRequest("/clients/AddUpdateClientsMaster ", state.CurrClientDetails);
        if (resp) {
            const CurrClientDetails = { ...state.CurrClientDetails };
            if (CurrClientDetails.ClientId === "") {
                CurrClientDetails.ClientId = resp.addClientsMaster?.insertId ?? CurrClientDetails.ClientId;
                setState({ CurrClientDetails });
            }
            setState({ SavingLoader: false, showToast: true });
            setTimeout(() => {
                setState({ showToast: false });
            }, 3000);
        }
    };
    const handleDeleteItem = async (item): Promise<void> => {
        const resp: any = await apiRequest("/DeleteClientsMaster ", item);
        if (resp) {
            setState({ showToast: true });
            void getData();
            setTimeout(() => {
                setState({ showToast: false });
            }, 3000);
        }
    };

    const columns: TableColumn[] = [
        { title: 'Organisation Name', key: 'ClientName' },
        { title: 'Company Id (ERP)', key: 'CompanyIdERP' },
        { title: 'Email', key: 'Email' },
        { title: 'Location', key: 'Location' },
        { title: 'Address1', key: 'Address1', className: 'min-w-[400px]' },
    ];

    const data = state.ClientMaster.map((v: ClientDetails) => ({
        ClientName: v.ClientName,
        CompanyIdERP: v.CompanyIdERP,
        Email: v.Email,
        Location: `${v.CityName?`${v.CityName},`:""} ${v.StateName?`${v.StateName},`:""} ${v.CountryName?`${v.CountryName}.`:""}`,
        Address1: v.Address1,
        actions: (
            <>
                <button
                    onClick={() => handleViewClientDetails(v)}
                    className="bg-[#0071E9] cursor-pointer text-gray-50 px-3 py-1 rounded text-sm"
                >
                    View
                </button>
                <ConfirmPopup message="Are you sure you want to delete this item?" onConfirm={() => void handleDeleteItem(v)}>
                    <button className="p-2 hover:bg-red-50 rounded" title="Delete" type="button">
                        <Trash2 className="text-red-500 w-4 h-4" />
                    </button>
                </ConfirmPopup>
                {/*<button className=" " onClick={() => alert('Delete')}>*/}
                {/*    <Trash2 className="text-[#1A1A1A]" />*/}
                {/*</button>*/}
            </>
        ),
    })) as Array<Record<string, unknown>>;

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const value = e.target.value;
        setState({ SearchQuery: value });
        if (value.trim() === "") {
            void getData("");
        }
    };

    const handleClientInfoContactChange = (val: string): void => {
        const CurrClientDetails = { ...state.CurrClientDetails, Contact: val };
        setState({ CurrClientDetails });
    };

    const handleClientInfoCountryCodeChange = (val: string | number): void => {
        const CurrClientDetails = { ...state.CurrClientDetails, CountryCode: val };
        setState({ CurrClientDetails });
    };

    const handleDropdownClientInfo = (
        val: string | number,
        _options: unknown,
        name: 'IndustryType' | 'CountryId' | 'StateId' | 'CityId'
    ): void => {
        const CurrClientDetails = { ...state.CurrClientDetails };
        (CurrClientDetails as Record<string, unknown>)[name] = val;
        if (name === "CountryId") {
            (CurrClientDetails as Record<string, unknown>).CountryCode = val;
            void getCountryStateCity(val);
        }
        if (name === "StateId") {
            void getCountryStateCity(CurrClientDetails.CountryId, CurrClientDetails.StateId);
        }
        if (name === "CityId") {
            (CurrClientDetails as Record<string, unknown>)[name] = String(val);
        }
        setState({ CurrClientDetails });
    };

    if (state.IsLoading) return <div className="h-96 py-20"><SpinnerV2 {...{ text: "Fetching data..." }} /></div>;

    if (state.Error) return <ErrorScreen message={state.Error} />;
    return (
        <div className="  pt-0 pb-6 px-6 ">
            <Toast
                message="Saved successfully!"
                show={state.showToast}
                onClose={() => setState({ showToast: false })}
            />
            <Modal
                isOpen={state.openModal}
                onClose={() => setState({ openModal: false })}
                title="Alert"
            >
                <p>Please save org info to proceed.</p>
                <div className="flex justify-end items-center">
                    <button
                        onClick={() => setState({ openModal: false })}
                        className="mt-6 right-0 px-4 text-[0.88rem] py-1.5 cursor-pointer bg-[#0071E9] text-white rounded-lg"
                    >
                        Close
                    </button>
                </div>

            </Modal>
            {
                state.ViewClientDetails ? <div>
                    <div className="flex  items-center   justify-between ">

                        <div onClick={handleCloseClientDetails}
                             className="flex items-center cursor-pointer bg-[#f3f3f3]  w-fit px-4 py-1 rounded-full">
                            <ChevronLeft className="text-gray-700" /> <span
                            className="font-medium text-sm text-gray-700"> Back</span>
                        </div>
                        <p className="ml-4 font-semibold text-lg">{state.CurrClientDetails.ClientId === "" ? "Add" : state.CurrClientDetails.ClientName}</p>
                        <p className="ml-4 font-semibold text-lg"></p>
                    </div>
                    <div className="border-b pb-2 pt-4 border-b-gray-200">
                        <PillGroup
                            items={state.pillItems}
                            primaryKey={state.CurrPillActive}
                            onClick={handlePillClick}
                        />
                    </div>
                    {state.CurrPillActive === "ClientInfo" && <div className=" w-full pt-2">
                        <div className="flex justify-end">
                            <button
                                onClick={state.SavingLoader ? undefined : handleSubmitClientInfo}
                                className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2 text-[0.89rem] cursor-pointer text-gray-950 font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
                            >
                                {state.SavingLoader ? <><SpinnerV2 {...{ text: "Saving..." }} /></> : <> <Plus
                                    className="w-5 h-5" />
                                    <span>{state.CurrClientDetails.ClientId === "" ? "Save" : "Update"}</span></>}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="">
                                <label htmlFor=""
                                       className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                    Organisation Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    onChange={(e) => handleChangeClientInfo(e, "ClientName")}
                                    value={state.CurrClientDetails.ClientName}
                                    type="text"
                                    className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter Organisation name"
                                    required
                                />
                                {state.ClientInfoErrors.ClientName &&
                                    <div className="flex items-center mt-1 ml-2"><CircleAlert size={14}
                                                                                              className="text-red-500" />
                                        <p className="ml-2 text-red-500 text-sm ">{state.ClientInfoErrors.ClientName}</p>
                                    </div>}
                                {state.isDataExist &&
                                    <div className="flex items-center mt-1 ml-2"><CircleAlert size={14}
                                                                                              className="text-red-500" />
                                        <p className="ml-2 text-red-500 text-sm ">{state.isDataExist}</p></div>}
                            </div>

                            <div className="">
                                <label htmlFor=""
                                       className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                    Industry Type
                                </label>
                                <Dropdown
                                    mode="multiple"
                                    options={state.IndustryTypes}
                                    value={state.CurrClientDetails.IndustryType}
                                    onChange={(val: string | number, item: unknown) => handleDropdownClientInfo(val, item, "IndustryType")}
                                    onSearch={(q: string) => console.log("Search (Multi):", q)}
                                />

                                {state.ClientInfoErrors.IndustryType &&
                                    <div className="flex items-center mt-1 ml-2"><CircleAlert size={14}
                                                                                              className="text-red-500" />
                                        <p className="text-red-500 text-sm ">{state.ClientInfoErrors.IndustryType}</p>
                                    </div>}

                            </div>
                            <div className="">
                                <label htmlFor=""
                                       className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                    Company Id <span className="text-[0.75rem]">(In ERP System)</span>
                                </label>
                                <input
                                    onChange={(e) => handleChangeClientInfo(e, "CompanyIdERP")}
                                    value={state.CurrClientDetails.CompanyIdERP}
                                    type="text"
                                    className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder=""
                                    required
                                />
                            </div>
                            <div className="">
                                <label htmlFor=""
                                       className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                    Country
                                </label>
                                <Dropdown
                                    mode="single"
                                    options={state.Countries}
                                    value={(state.CurrClientDetails.CountryId === "" ? undefined : state.CurrClientDetails.CountryId) as string | number | undefined}
                                    onChange={(val: string | number, item: unknown) => handleDropdownClientInfo(val, item, "CountryId")}
                                    onSearch={(q: string) => console.log("Search (Multi):", q)}
                                />

                                {state.ClientInfoErrors.CountryId &&
                                    <div className="flex items-center mt-1 ml-2"><CircleAlert size={14}
                                                                                              className="text-red-500" />
                                        <p className="text-red-500 text-sm ">{state.ClientInfoErrors.CountryId}</p>
                                    </div>}

                            </div>
                            <div className="">
                                <label htmlFor=""
                                       className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                    State
                                </label>
                                <Dropdown
                                    mode="single"
                                    options={state.States}
                                    value={(state.CurrClientDetails.StateId === "" ? undefined : state.CurrClientDetails.StateId) as string | number | undefined}
                                    onChange={(val: string | number, item: unknown) => handleDropdownClientInfo(val, item, "StateId")}
                                    onSearch={(q: string) => console.log("Search (Multi):", q)}
                                />
                                {state.ClientInfoErrors.StateId &&
                                    <div className="flex items-center mt-1 ml-2"><CircleAlert size={14}
                                                                                              className="text-red-500" />
                                        <p className="text-red-500 text-sm ">{state.ClientInfoErrors.StateId}</p>
                                    </div>}
                            </div>
                            <div className="">
                                <label htmlFor=""
                                       className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                    City
                                </label>
                                <Dropdown
                                    mode="single"
                                    options={state.Cities}
                                    value={(state.CurrClientDetails.CityId === "" ? undefined : state.CurrClientDetails.CityId) as string | number | undefined}
                                    onChange={(val: string | number, item: unknown) => handleDropdownClientInfo(val, item, "CityId")}
                                    onSearch={(q: string) => console.log("Search (Multi):", q)}
                                />
                                {state.ClientInfoErrors.CityId &&
                                    <div className="flex items-center mt-1 ml-2"><CircleAlert size={14}
                                                                                              className="text-red-500" />
                                        <p className="text-red-500 text-sm ">{state.ClientInfoErrors.CityId}</p>
                                    </div>}
                            </div>
                            <div className="">
                                <label htmlFor=""
                                       className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                    Contact
                                </label>
                                <PhoneNumberInput
                                    countryOptions={state.CountryCodes}
                                    countryCode={state.CurrClientDetails.CountryCode}
                                    onCountryChange={handleClientInfoCountryCodeChange}
                                    phoneNumber={state.CurrClientDetails.Contact}
                                    onPhoneChange={handleClientInfoContactChange}
                                />
                            </div>
                            <div className="">
                                <label htmlFor=""
                                       className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                    Email

                                </label>
                                <input
                                    onChange={(e) => handleChangeClientInfo(e, "Email")}
                                    value={state.CurrClientDetails.Email}
                                    type="text"
                                    className="w-full px-4 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder=""
                                    required
                                />
                                {state.ClientInfoErrors.Email &&
                                    <div className="flex items-center mt-1 ml-2"><CircleAlert size={14}
                                                                                              className="text-red-500" />
                                        <p className="text-red-500 text-sm ">{state.ClientInfoErrors.Email}</p>
                                    </div>}
                            </div>
                            <div className="">
                                <label htmlFor=""
                                       className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                    Zipcode
                                </label>
                                <input
                                    onChange={(e) => handleChangeClientInfo(e, "Zip")}
                                    value={state.CurrClientDetails.Zip}
                                    type="text"
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
                      value={state.CurrClientDetails.Address1}
                      id="name"
                      name="name"
                      rows={4}
                      maxLength={2000}
                      placeholder="Address1"
                      className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8]   resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                  ></textarea>

                                    <div className="absolute bottom-2 right-2">
                                        <svg
                                            className="w-4 h-4 text-gray-500"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M4 13l4 4L16 7" stroke="currentColor" strokeWidth="2"
                                                  fill="none" />
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
                      value={state.CurrClientDetails.Address2}
                      id="name"
                      name="name"
                      rows={4}
                      maxLength={2000}
                      placeholder="Address2"
                      className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8]   resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                  ></textarea>

                                    <div className="absolute bottom-2 right-2">
                                        <svg
                                            className="w-4 h-4 text-gray-500"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M4 13l4 4L16 7" stroke="currentColor" strokeWidth="2"
                                                  fill="none" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>}
                    {state.CurrPillActive === "business-units" &&
                        <ClientBusinessUnits CurrClientDetails={state.CurrClientDetails} />}
                    {state.CurrPillActive === "business-process" &&
                        <ClientBusinessProcess CurrClientDetails={state.CurrClientDetails} />}
                    {/*{state.CurrPillActive === "Projects" && <Projects CurrClientDetails={state.CurrClientDetails} />}*/}
                </div> : <>
                    <div className="flex justify-between items-center pb-4">
                        <div
                            className="flex items-center w-full max-w-md px-4 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg shadow-sm">
                            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" strokeWidth="2"
                                 viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                            </svg>
                            <input onChange={handleSearch} value={state.SearchQuery} type="text" placeholder="Search"
                                   className="ml-3 text-[0.89rem] text bg-transparent outline-none  placeholder-gray-500 w-full" />
                        </div>

                        <div>
                            <button onClick={handleAddClient}
                                    className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2 text-[0.89rem] cursor-pointer text-gray-950 font-medium py-2 px-5 rounded-lg flex items-center space-x-2">
                                <Plus className="w-5 h-5" />
                                <span>Add Organisation</span>
                            </button>
                        </div>
                    </div>
                    <CustomTable columns={columns as unknown as any[]} data={data as unknown as any[]} responsive={true} />
                    {
                        state.TotalRecords > 10 && <div className="pt-4 flex justify-end">
                            <Pagination
                                total={state.TotalRecords}
                                current={state.CurrentPage}
                                pageSize={10}
                                onChange={handlePageChange}
                                showSizeChanger={false}
                            />
                        </div>
                    }
                </>
            }
        </div>
    );
}
