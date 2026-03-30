// /src/components/BusinessProcessMaster
// Source: :contentReference[oaicite:0]{index=0}
import React, { useEffect, useReducer, useRef, useState } from 'react';
import CustomTable from "../../utils/CustomTable";
import { ChevronLeft, CircleAlert, Database, Plus, RefreshCcw, Save, Sparkles, SquarePen, Trash2, X } from "lucide-react";
import { apiRequest } from "../../utils/helpers/ApiHelper";
import SpinnerV2 from "../../utils/SpinnerV2";
import ErrorScreen from "../../utils/ErrorScreen";
import Pagination from "../../utils/Pagination";
import Toast from "../../utils/Toast";
import useDebounce from "../../utils/helpers/useDebounce";
import ConfirmPopup from "../../utils/ConfirmPopup";
import MasterSubProcessTree from "./MasterSubProcessTree";
import CustomModal from "../../utils/CustomModal";

interface BusinessProcess {
    BusinessProcessId: string;
    BusinessProcessName: string;
    Description: string;
    [key: string]: unknown;
}

interface State {
    ActionType: string;
    Error: string;
    SearchQuery: string;
    CurrentPage: number;
    TotalRecords: number;
    BusinessProcessMaster: BusinessProcess[];
    Countries: unknown[];
    CountryCodes: unknown[];
    States: unknown[];
    Cities: unknown[];
    ViewClientDetails: boolean;
    openEditModal: boolean;
    IsLoading: boolean;
    ViewSubProcess: boolean;
    showToast: boolean;
    SavingLoader: boolean;
    isDataExist: string;
    ClientBusinessUnitActionType: string;
    CurrAddEditObj: {
        BusinessProcessId: string;
        BusinessProcessName: string;
        Description: string;
        [key: string]: unknown;
    };
    ValidateFields: Record<string, string | number>;
    FormErrors: Record<string, string>;
}

const initialState: State = {
    ActionType: "",
    Error: "",
    SearchQuery: "",
    CurrentPage: 1,
    TotalRecords: 0,
    BusinessProcessMaster: [],
    Countries: [],
    CountryCodes: [],
    States: [],
    Cities: [],
    ViewClientDetails: false,
    openEditModal: false,
    IsLoading: true,
    ViewSubProcess: false,
    showToast: false,
    SavingLoader: false,
    isDataExist: "",
    ClientBusinessUnitActionType: "",
    CurrAddEditObj: {
        BusinessProcessId: "",
        BusinessProcessName: "",
        Description: "",
    },
    ValidateFields: {
        BusinessProcessName: "",
    },
    FormErrors: {} as Record<string, string>,
};

type Props = {};

export default function BusinessProcessMaster(_: Props) {
    const [state, setState] = useReducer(
        (prev: State, patch: Partial<State>): State => ({ ...prev, ...patch }),
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
            ]);

            setState({ IsLoading: false });
        };

        void init();
    }, []);

    const getData = async (SearchQuery: string = "", PageNo: number = 1) => {
        try {
            const resp: any = await apiRequest("/GetBusinessProcessMasterPaginationFilterSearch", {
                PageNo,
                StartDate: "",
                EndDate: "",
                SearchString: SearchQuery,
            });
            if (resp.ResponseData.length > 0) {
                setState({ BusinessProcessMaster: resp.ResponseData as BusinessProcess[], TotalRecords: resp.TotalRecords as number });
            } else {
                setState({ BusinessProcessMaster: [], TotalRecords: 0 });
            }
        } catch (err) {
            setState({ Error: (err as Error).toString() });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const handleAddClient = () => {
        const CurrAddEditObj: State["CurrAddEditObj"] = {
            BusinessProcessId: "",
            BusinessProcessName: "",
            Description: "",
        };
        setState({ ActionType: "Add", CurrAddEditObj, FormErrors: {} });
    };

    const handleEdit = (item: BusinessProcess) => {
        setState({ ActionType: "Update", CurrAddEditObj: item });
    };

    const handleCancel = () => {
        const CurrAddEditObj: State["CurrAddEditObj"] = {
            BusinessProcessId: "",
            BusinessProcessName: "",
            Description: "",
        };
        setState({ ActionType: "", CurrAddEditObj });
        void getData("");
    };

    const debouncedSearchQuery = useDebounce(state.SearchQuery, 300) as string;
    const didSearchRun = useRef<boolean>(false);

    useEffect(() => {
        // Skip on initial render
        if (!didSearchRun.current) {
            didSearchRun.current = true;
            return;
        }

        // Skip if query is still empty string after debounce
        if (debouncedSearchQuery.trim() === "") return;

        void getData(debouncedSearchQuery);
    }, [debouncedSearchQuery]);

    const debouncedQuery = useDebounce(state.CurrAddEditObj.ClientName as string, 500) as string;

    const checkIfDataExist = async (debouncedQueryVal: string | undefined) => {
        const resp: any = await apiRequest("/CheckClientsMaster", {
            ClientName: debouncedQueryVal,
        });
        if (resp.ClientsMaster.length > 0) {
            setState({ isDataExist: "Client already existed" });
        } else {
            setState({ isDataExist: "" });
        }
    };
    // useEffect(() => {
    //     if (debouncedQuery) {
    //         checkIfDataExist(debouncedQuery);
    //     } else {
    //         setState({isDataExist: ""})
    //     }
    // }, [debouncedQuery]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setState({ SearchQuery: value });
        if (value.trim() === "") {
            void getData("");
        }
    };

    const handleChangeClientInfo = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
        name: string
    ) => {
        const CurrAddEditObj = { ...state.CurrAddEditObj };
        CurrAddEditObj[name] = e.target.value;
        setState({ CurrAddEditObj });
    };

    const validateClientInfoForm = () => {
        const FormErrors: Record<string, string> = {};
        let formIsValid = true;

        const emailRegex = "";
        for (const name in state.ValidateFields) {
            const value = state.CurrAddEditObj[name] as string | number | undefined;
            // Required field check
            if (value === "" || value === 0 || typeof value === "undefined") {
                formIsValid = false;
                FormErrors[name] = "This field is required";
            } else {
                // Specific check for EmailId
                if (name === "EmailId" && typeof value === "string" && !emailRegex.test(value)) {
                    formIsValid = false;
                    FormErrors[name] = "Please enter a valid email address";
                } else {
                    FormErrors[name] = "";
                }
            }
        }
        setState({
            FormErrors,
        });
        return formIsValid;
    };

    const handleClientInfoContactChange = (val: string) => {
        const CurrAddEditObj = { ...state.CurrAddEditObj };
        CurrAddEditObj.Contact = val;
        setState({ CurrAddEditObj });
    };

    const handleClientInfoCountryCodeChange = (val: string) => {
        const CurrAddEditObj = { ...state.CurrAddEditObj };
        CurrAddEditObj.CountryCode = val;
        setState({ CurrAddEditObj });
    };

    const handleDropdownClientInfo = (val: unknown, _options: unknown, name: string) => {
        const CurrAddEditObj = { ...state.CurrAddEditObj };
        CurrAddEditObj[name] = val;
        setState({ CurrAddEditObj });
    };

    const handleDeleteItem = async (item: BusinessProcess) => {
        // setState({SavingLoader: true})
        const resp: any = await apiRequest("/DeleteBusinessProcessMaster", item);
        if (resp) {
            setState({ showToast: true });
            void getData();
            setTimeout(() => {
                setState({ showToast: false });
            }, 3000);
        }
    };

    const handleSubmitClientInfo = async () => {
        if (!validateClientInfoForm()) {
            return;
        }
        setState({ SavingLoader: true });
        const resp: any = await apiRequest("/AddUpdateBusinessProcessMaster ", state.CurrAddEditObj);
        if (resp) {
            setState({ SavingLoader: false, showToast: true, ActionType: "" });
            void getData();
            setTimeout(() => {
                setState({ showToast: false });
            }, 3000);
        }
    };

    const [profileOpen, setProfileOpen] = useState<boolean>(false);
    const profileRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!profileRef.current?.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const handleProfileClick = () => setProfileOpen((prev: boolean) => !prev);
    const handleView = (item: BusinessProcess) => {
        setState({ ViewSubProcess: true, CurrAddEditObj: item });
    };

    const handlePageChange = (page: number) => {
        // eslint-disable-next-line no-console
        console.log("page", page);
        setState({ CurrentPage: page });
        void getData(state.SearchQuery, page);
    };

    if (state.IsLoading) return <div className="h-96 py-20"><SpinnerV2 {...{ text: "Fetching data..." }} /></div>;

    if (state.Error) return <ErrorScreen message={state.Error} />;

    const columns: Array<{ title: string; key: string; className?: string }> = [
        { title: 'Business Process', key: 'BusinessProcessName' },
        { title: 'Description', key: 'Description', className: 'min-w-[400px]' },
    ];

    const data = state.BusinessProcessMaster.map((v) => ({
        BusinessProcessId: v.BusinessProcessId,
        BusinessProcessName: v.BusinessProcessName,
        Description: v.Description,
        actions: (
            <div className="relative flex items-center">
                <div className="relative flex items-center mr-4">
                    <button
                        onClick={() => handleView(v)}
                        className="bg-[#0071E9] cursor-pointer text-gray-50 px-3 py-1 rounded text-sm"
                    >
                        View
                    </button>
                </div>
                <ConfirmPopup
                    message="Are you sure you want to delete this item?"
                    onConfirm={() => void handleDeleteItem(v)}
                >
                    <button className=" pr-4 flex items-center"><Trash2 className="text-[#1A1A1A] cursor-pointer " /></button>
                </ConfirmPopup>
                <button onClick={() => handleEdit(v)} className=" "><SquarePen className="text-[#1A1A1A] cursor-pointer" /></button>
            </div>
        ),
    }));

    return (
        <div className="  pt-0 pb-6 px-6 ">
            <CustomModal
                width="max-w-6xl"
                modalZIndex={1001}
                isOpen={state.openEditModal}
                onClose={() => setState({ openEditModal: false })}
                title={<div className="text-lg">Business Process from AI</div>}
                footerContent={[
                    <button
                        key="close"
                        onClick={() => setState({ openEditModal: false })}
                        className="mt-2 cursor-pointer px-5 py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg"
                    >
                        Close
                    </button>,
                    <button
                        key="confirm"
                        // onClick={handleSubmitTestCase}
                        className="mt-2 cursor-pointer px-5 py-2 bg-[#0071E9] text-white text-sm rounded-lg "
                    >
                        Confirm and Refresh
                    </button>,
                ]}
            >
                <div className="space-y-5  flex flex-col">
                    <div className="overflow-x-auto ">
                        <table className="min-w-full border border-gray-200 rounded-md">
                            <thead>
                            <tr className="bg-[#ebebeb] text-left">
                                <th className="px-2 py-1.5 text-center w-10">
                                    <label className="custom-checkbox">
                                        <input
                                            type="checkbox"
                                        />
                                        <span className="checkmark" />
                                    </label>
                                </th>
                                <th className="p-1.5 font-semibold text-sm text-gray-700">Business Process</th>
                                <th className="p-1.5 font-semibold text-sm text-gray-700">Description</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr className="border-t border-gray-200 ">
                                <td className="p-2">
                                    <label className="custom-checkbox">
                                        <input
                                            type="checkbox"
                                        />
                                        <span className="checkmark" />
                                    </label>
                                </td>

                                <td className="p-2 text-sm">
                                    OTC
                                </td>
                                <td className="p-2 text-sm">
                                    Order to cash
                                </td>

                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </CustomModal>
            {
                state.ViewSubProcess ? <div>
                    <div onClick={() => setState({ ViewSubProcess: false })}
                         className="flex items-center cursor-pointer bg-[#f3f3f3]  w-fit px-4 py-1 rounded-full">
                        <ChevronLeft className="text-gray-700" /> <span
                        className="font-medium text-sm text-gray-700"> Back</span>
                    </div>
                    <MasterSubProcessTree CurrBP={state.CurrAddEditObj} />
                </div> : <>
                    <Toast
                        message="Saved successfully!"
                        show={state.showToast}
                        onClose={() => null}
                    />
                    {state.ActionType !== "" ?
                        <div className=" w-full pt-2">
                            <div className="flex justify-between items-center pb-4">
                                <div onClick={handleCancel}
                                     className="flex items-center cursor-pointer bg-[#f3f3f3]  w-fit px-4 py-1 rounded-full">
                                    <ChevronLeft className="text-gray-700" /> <span
                                    className="font-medium text-sm text-gray-700"> Back</span>
                                </div>
                                <div className="flex items-center">
                                    {/*{state.ActionType !== "" && <button onClick={handleCancel}
                                    className="bg-white border border-[#2196F3] mr-6 text-[0.89rem] cursor-pointer text-[#0582E5] font-medium py-2 px-5 rounded-lg flex items-center space-x-2">
                                        <X
                                            className="w-5 h-5"/>
                                        <span>CANCEL</span>
                                    </button>}*/}

                                    <button onClick={state.SavingLoader ? undefined : handleSubmitClientInfo}
                                            className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2 text-[0.89rem] cursor-pointer text-gray-950 font-medium py-2 px-5 rounded-lg flex items-center space-x-2">
                                        {state.SavingLoader ? <><SpinnerV2 {...{ text: "Saving..." }} /></> : <> <Save
                                            className="w-5 h-5" />
                                            <span>SAVE</span></>}
                                    </button>
                                </div>

                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                                <div className="">
                                    <label htmlFor=""
                                           className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                        Business Process <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        onChange={(e) => handleChangeClientInfo(e, "BusinessProcessName")}
                                        value={(state.CurrAddEditObj.BusinessProcessName as string) ?? ""}
                                        type="text"
                                        id="client"
                                        name="client"
                                        className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter Business Process"
                                        required
                                    />
                                    {state.FormErrors.BusinessProcessName &&
                                        <div className="flex items-center mt-1 ml-2"><CircleAlert size={14}
                                                                                                  className="text-red-500" />
                                            <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.BusinessProcessName}</p>
                                        </div>}
                                    {state.isDataExist &&
                                        <div className="flex items-center mt-1 ml-2"><CircleAlert size={14}
                                                                                                  className="text-red-500" />
                                            <p className="ml-2 text-red-500 text-sm ">{state.isDataExist}</p></div>}
                                </div>

                                <div className=" ">
                                    <div className="flex justify-between items-center mb-1">
                                        <label htmlFor="name" className=" text-[0.90rem] text-[#2C3E50] font-medium">
                                            Description
                                        </label>
                                        {/*<span className="text-gray-500 text-sm">0/100</span>*/}
                                    </div>

                                    <div className="relative">
                    <textarea
                        onChange={(e) => handleChangeClientInfo(e, "Description")}
                        value={(state.CurrAddEditObj.Description as string) ?? ""}
                        id="name"
                        name="name"
                        rows={4}
                        maxLength={2000}
                        placeholder=""
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
                        </div> :
                        <>
                            <div className="flex justify-between items-center pb-4">
                                <div
                                    className="flex items-center w-full max-w-md px-4 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg shadow-sm">
                                    <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor"
                                         strokeWidth="2"
                                         viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                              d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                                    </svg>
                                    <input onChange={handleSearch} value={state.SearchQuery} type="text"
                                           placeholder="Search"
                                           className="ml-3 text-[0.89rem] text bg-transparent outline-none  placeholder-gray-500 w-full" />
                                </div>

                                <div className="flex item-center gap-4 items-center">
                                    <div className="ml-6 cursor-pointer border border-[#0071E9] rounded-full px-3 py-1">
                                        <p className="text-[#0071E9] font-semibold text-sm flex items-center" ><RefreshCcw className="mr-1" size={15} />Sync with SAP</p>
                                    </div>
                                    {/*<div
                                    className="flex items-center gap-2 cursor-pointer relative"
                                    onClick={handleProfileClick}
                                    ref={profileRef}
                                >
                                    <div className="flex item-center gap-4">
                                        <div
                                            className="flex items-center cursor-pointer bg-[#f3f3f3]  w-fit px-4 py-1 rounded-full">
                                            <Sparkles size={16} className="text-[#891be9] mr-2"/> <span
                                            className="font-medium text-sm text-[#891be9]"> Get Data From AI</span>
                                        </div>
                                    </div>
                                    {profileOpen && (
                                        <div
                                            className="absolute top-12 right-0 w-fit bg-white rounded-xl shadow-lg border border-gray-300 p-2 space-y-1 z-50">
                                            <button onClick={()=>setState({openEditModal: true})}
                                                className="flex cursor-pointer items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left"

                                            >
                                                <RefreshCcw className="w-4 h-4"/> Refresh All
                                            </button>
                                            <button
                                                className="flex text-nowrap cursor-pointer items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-left"
                                                onClick={() => {

                                                }
                                                }
                                            >
                                                <RefreshCcw className="w-4 h-4"/> Refresh Selected
                                            </button>
                                        </div>
                                    )}
                                </div>*/}
                                    {/*<div onClick={() => setState({ViewSubProcess: false})}
                                     className="flex items-center cursor-pointer bg-[#f3f3f3]  w-fit px-4 py-1 rounded-full">
                                    <Database size={16} className="text-[#891be9] mr-2"/> <span
                                    className="font-medium text-sm text-[#891be9]">  Get Data From Client Environment</span>
                                </div>*/}
                                    <button onClick={handleAddClient}
                                            className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2 text-[0.89rem] cursor-pointer text-gray-950 font-medium py-2 px-5 rounded-lg flex items-center space-x-2">
                                        <Plus className="w-5 h-5" />
                                        <span>Add </span>
                                    </button>
                                </div>
                            </div>
                            <CustomTable columns={columns} data={data} responsive={true} />
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
                </>
            }
        </div>
    );
}
