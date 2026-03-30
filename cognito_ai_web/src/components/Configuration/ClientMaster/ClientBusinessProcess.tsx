// src/components/ClientBusinessProcess
/* :contentReference[oaicite:0]{index=0} */
import React, {
    useEffect,
    useReducer,
    useRef,
    forwardRef,
    useImperativeHandle,
    useState,
} from "react";
import {
    ChevronLeft,
    CircleAlert,
    Plus,
    RefreshCcw,
    Save,
    SquarePen,
    Trash2,
    X,
} from "lucide-react";
import { apiRequest } from "../../../utils/helpers/ApiHelper";
import SpinnerV2 from "../../../utils/SpinnerV2";
import ErrorScreen from "../../../utils/ErrorScreen";
import Toast from "../../../utils/Toast";
import useDebounce from "../../../utils/helpers/useDebounce";
import Dropdown from "../../../utils/Dropdown";
import ConfirmPopup from "../../../utils/ConfirmPopup";
import ClientSubProcessTree from "./ClientSubProcessTree";
import CustomTable from "../../../utils/CustomTable";
import Pagination from "../../../utils/Pagination";

// ----------------------------- Types -----------------------------

interface CurrClientDetails {
    ClientId: string | number;
    [key: string]: unknown;
}

interface CurrBusinessUnit {
    BusinessUnitId: string | number;
    [key: string]: unknown;
}

export interface ClientBusinessProcessItem {
    ClientBusinessProcessId?: string | number;
    ClientId?: string | number;
    BusinessUnitId?: string | number;
    BusinessProcessId?: string | number;
    BusinessProcessName?: string;
    Description?: string;
    ClientName?: string;
    BusinessUnitName?: string;
    [key: string]: unknown;
}

interface DropdownOption {
    label: string;
    value: string;
    [key: string]: unknown;
}

interface ValidateFieldsShape {
    BusinessUnitId: string;
    BusinessProcessId: string;
    [key: string]: string;
}

interface FormErrorsShape {
    [key: string]: string;
}

interface State {
    ActionType: string;
    Error: string;
    SearchQuery: string;
    CurrentPage: number;
    ViewSubProcess: boolean;
    TotalRecords: number;
    ClientBusinessProcessMaster: ClientBusinessProcessItem[];
    BusinessUnitsList: unknown[]; // Not used in this file; leave wide
    BusinessProcessList: DropdownOption[];
    Countries: unknown[];
    CountryCodes: unknown[];
    States: unknown[];
    Cities: unknown[];
    ViewClientDetails: boolean;
    IsLoading: boolean;
    showToast: boolean;
    SavingLoader: boolean;
    isDataExist: string | boolean | null | undefined;
    ClientBusinessUnitActionType: string;
    CurrAddEditObj: ClientBusinessProcessItem;
    ValidateFields: ValidateFieldsShape;
    FormErrors: FormErrorsShape;
}

type ReducerSetState = (newState: Partial<State>) => void;

type Props = {
    CurrClientDetails?: CurrClientDetails;
    CurrBusinessUnit: CurrBusinessUnit;
    onViewProcessDetails?: (item: ClientBusinessProcessItem) => void;
    [key: string]: unknown;
};

export type ClientBusinessProcessRef = {
    handleView: (item: ClientBusinessProcessItem) => void;
};

// ----------------------------- Component -----------------------------

const ClientBusinessProcess = forwardRef<ClientBusinessProcessRef, Props>(
    (props, ref) => {
        const [state, setState] = useReducer(
            (prev: State, next: Partial<State>): State => ({ ...prev, ...next }),
            {
                ActionType: "",
                Error: "",
                SearchQuery: "",
                CurrentPage: 1,
                ViewSubProcess: false,
                TotalRecords: 0,
                ClientBusinessProcessMaster: [],
                BusinessUnitsList: [],
                BusinessProcessList: [],
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
                    ClientBusinessProcessId: "",
                    ClientId: "",
                    BusinessUnitId: "",
                    BusinessProcessId: "",
                    BusinessProcessName: "",
                    Description: "",
                },
                ValidateFields: {
                    BusinessUnitId: "",
                    BusinessProcessId: "",
                },
                FormErrors: {},
            } satisfies State
        );

        useImperativeHandle(ref, () => ({
            handleView,
        }));

        const didFetchData = useRef<boolean>(false);

        useEffect(() => {
            if (didFetchData.current) return;
            didFetchData.current = true;

            const init = async () => {
                setState({ IsLoading: true });

                await Promise.all([getData(""), getBusinessProcessMaster()]);

                setState({ IsLoading: false });
            };

            void init();
        }, []);

        // ---------------------------------------- Removed all breadcrumb logic --------------------------------------

        const getBusinessProcessMaster = async (): Promise<void> => {
            try {
                const resp: any = await apiRequest("/GetBusinessProcessMaster", {});
                setState({
                    BusinessProcessList: (resp?.ResponseData ?? []) as DropdownOption[],
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
                    "/GetClientBusinessProcessMasterByClientIdBusinessId",
                    {
                        ClientId: props?.CurrClientDetails?.ClientId,
                        BusinessUnitId: props?.CurrBusinessUnit?.BusinessUnitId,
                    }
                );
                if (Array.isArray(resp?.ResponseData) && resp.ResponseData.length > 0) {
                    setState({
                        ClientBusinessProcessMaster:
                            resp.ResponseData as ClientBusinessProcessItem[],
                        TotalRecords: (resp.TotalRecords as number) ?? 0,
                    });
                } else {
                    setState({ ClientBusinessProcessMaster: [], TotalRecords: 0 });
                }
            } catch (err: unknown) {
                setState({ Error: String(err) });
            } finally {
                setState({ IsLoading: false });
            }
        };

        const handlePageChange = (page: number): void => {
            // eslint-disable-next-line no-console
            console.log("page", page);
            setState({ CurrentPage: page });
            void getData(state.SearchQuery, page);
        };

        const handleAddClient = (): void => {
            const CurrAddEditObj: ClientBusinessProcessItem = {
                ClientBusinessProcessId: "",
                ClientId: "",
                BusinessUnitId: props.CurrBusinessUnit.BusinessUnitId,
                BusinessProcessId: "",
                BusinessProcessName: "",
                Description: "",
            };
            setState({ ActionType: "Add", CurrAddEditObj });
        };

        const handleEdit = (item: ClientBusinessProcessItem): void => {
            setState({ ActionType: "Update", CurrAddEditObj: item });
        };

        const handleCancel = (): void => {
            const CurrAddEditObj: ClientBusinessProcessItem = {
                ClientBusinessProcessId: "",
                ClientId: "",
                BusinessUnitId: "",
                BusinessProcessId: "",
                BusinessProcessName: "",
                Description: "",
            };
            setState({ ActionType: "", CurrAddEditObj });
            void getData("", 1);
        };

        const debouncedSearchQuery: string = (useDebounce(
            state.SearchQuery,
            300
        ) as unknown) as string;
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

        const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
            const value = e.target.value;
            setState({ SearchQuery: value });
            if (value.trim() === "") {
                void getData("");
            }
        };

        const handleChangeClientInfo = (
            e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
            name: keyof ClientBusinessProcessItem
        ): void => {
            const CurrAddEditObj: ClientBusinessProcessItem = {
                ...state.CurrAddEditObj,
                [name]: e.target.value,
            };
            setState({ CurrAddEditObj });
        };

        const validateClientInfoForm = (): boolean => {
            const FormErrors: FormErrorsShape = {};
            let formIsValid = true;
            for (const name in state.ValidateFields) {
                const key = name as keyof ClientBusinessProcessItem;
                const value = state.CurrAddEditObj[key];
                // Required field check
                if (value === "" || value === 0 || value === undefined || value === null) {
                    formIsValid = false;
                    FormErrors[name] = "This field is required";
                } else {
                    FormErrors[name] = "";
                }
            }
            setState({
                FormErrors,
            });
            return formIsValid;
        };

        const handleDeleteItem = async (
            item: ClientBusinessProcessItem
        ): Promise<void> => {
            const resp: any = await apiRequest(
                "/DeleteClientBusinessProcessMaster",
                item
            );
            if (resp) {
                setState({ showToast: true });
                void getData();
                setTimeout(() => {
                    setState({ showToast: false });
                }, 3000);
            }
        };

        function handleView(item: ClientBusinessProcessItem): void {
            // Call parent callback to update breadcrumb
            if (props.onViewProcessDetails) {
                props.onViewProcessDetails(item);
            }
            setState({ ViewSubProcess: !state.ViewSubProcess, CurrAddEditObj: item });
        }

        const handleDropdownClientInfo = (
            val: string,
            _options: unknown,
            name: keyof ClientBusinessProcessItem
        ): void => {
            const CurrAddEditObj: ClientBusinessProcessItem = {
                ...state.CurrAddEditObj,
                [name]: val,
            };
            setState({ CurrAddEditObj });
        };

        const handleSubmitClientInfo = async (): Promise<void> => {
            if (!validateClientInfoForm()) {
                return;
            }
            setState({ SavingLoader: true });
            const CurrAddEditObj: ClientBusinessProcessItem = {
                ...state.CurrAddEditObj,
                ClientId: props?.CurrClientDetails?.ClientId,
            };

            const resp: any = await apiRequest(
                "/AddUpdateClientBusinessProcessMaster ",
                CurrAddEditObj
            );
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

        if (state.Error) return <ErrorScreen message={state.Error as string} />;

        const columns = [
            { title: "Business Process Name", key: "BusinessProcessName" },
            { title: "Description", key: "Description", className: "min-w-[400px]" },
        ];

        const data = state.ClientBusinessProcessMaster.map((v) => ({
            ClientName: v.ClientName,
            BusinessUnitName: v.BusinessUnitName,
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
                        <button className=" pr-4 flex items-center">
                            <Trash2 className="text-[#1A1A1A] cursor-pointer " />
                        </button>
                    </ConfirmPopup>
                    <button onClick={() => handleEdit(v)} className=" ">
                        <SquarePen className="text-[#1A1A1A] cursor-pointer" />
                    </button>
                </div>
            ),
        }));

        return (
            <div className="pt-0 pb-6 ">
                {/* Conditional rendering for subprocess view */}
                {state.ViewSubProcess ? (
                    <div className="mt-4">
                        <ClientSubProcessTree CurrBP={state.CurrAddEditObj} />
                    </div>
                ) : (
                    // Main Business Process View
                    <>
                        <Toast message="Saved successfully!" show={state.showToast} onClose={() => null} />
                        {state.ActionType !== "" ? (
                            <div className=" w-full pt-2">
                                <div className="flex justify-end">
                                    <div className="flex items-center">
                                        {state.ActionType !== "" && (
                                            <button
                                                onClick={handleCancel}
                                                className="bg-white border border-[#2196F3] mr-6 text[0.89rem] cursor-pointer text-[#0582E5] font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
                                            >
                                                <X className="w-5 h-5" />
                                                <span>CANCEL</span>
                                            </button>
                                        )}

                                        <button
                                            onClick={state.SavingLoader ? undefined : handleSubmitClientInfo}
                                            className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2 text-[0.89rem] cursor-pointer text-gray-950 font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                                    <div className="">
                                        <label
                                            htmlFor=""
                                            className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1"
                                        >
                                            Business Process <span className="text-red-500">*</span>
                                        </label>
                                        <Dropdown
                                            mode="single"
                                            options={state.BusinessProcessList}
                                            value={String(state.CurrAddEditObj.BusinessProcessId ?? "")}
                                            onChange={(val: string, item: unknown) =>
                                                handleDropdownClientInfo(val, item, "BusinessProcessId")
                                            }
                                            onSearch={(q: string) => console.log("Search (Multi):", q)}
                                        />

                                        {state.FormErrors.BusinessProcessId && (
                                            <div className="flex items-center mt-1 ml-2">
                                                <CircleAlert size={14} className="text-red-500" />
                                                <p className="text-red-500 text-sm ">
                                                    {state.FormErrors.BusinessProcessId}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className=" ">
                                        <div className="flex justify-between items-center mb-1">
                                            <label
                                                htmlFor="name"
                                                className=" text-[0.90rem] text-[#2C3E50] font-medium"
                                            >
                                                Description
                                            </label>
                                        </div>

                                        <div className="relative">
                      <textarea
                          onChange={(e) => handleChangeClientInfo(e, "Description")}
                          value={String(state.CurrAddEditObj.Description ?? "")}
                          id="name"
                          name="name"
                          rows={4}
                          maxLength={2000}
                          placeholder="Description"
                          className="w-full px-4 shadow text-[0.85rem] py-2 pr-10 text-gray-700 border border-blue-300 rounded-md  bg-[#f8f8f8]    resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
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
                                <div className="flex justify-between items-center pb-4 mt-2">
                                    <div className="flex items-center w-full max-w-md px-4 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg shadow-sm">
                                        <svg
                                            className="w-4 h-4 text-black"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
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
                                            className="ml-3 text-[0.89rem] text bg-transparent outline-none  placeholder-gray-500 w-full"
                                        />
                                    </div>

                                    <div className="flex item-center gap-4 items-center">
                                        <div className="ml-6 cursor-pointer border border-[#0071E9] rounded-full px-3 py-1">
                                            <p className="text-[#0071E9] font-semibold text-sm flex items-center">
                                                <RefreshCcw className="mr-1" size={15} />
                                                Sync with SAP
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleAddClient}
                                            className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2 text-[0.89rem] cursor-pointer text-gray-950 font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
                                        >
                                            <Plus className="w-5 h-5" />
                                            <span>Add </span>
                                        </button>
                                    </div>
                                </div>
                                <CustomTable
                                    onSelectionChange={(item: unknown) => {
                                        // eslint-disable-next-line no-console
                                        console.log(item);
                                    }}
                                    columns={columns}
                                    data={data}
                                    responsive={true}
                                />
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
                    </>
                )}
            </div>
        );
    }
);

export default ClientBusinessProcess;
