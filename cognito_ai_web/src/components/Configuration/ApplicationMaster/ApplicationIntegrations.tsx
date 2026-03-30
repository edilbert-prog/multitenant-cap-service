import React, { useEffect, useReducer, useRef } from "react";
import CustomTable from "../../../utils/CustomTable";
import { CircleAlert, Plus, Save, SquarePen, Trash2, X } from "lucide-react";
import { apiRequest } from "../../../utils/helpers/ApiHelper";
import Spinner from "../../../utils/Spinner";
import ErrorScreen from "../../../utils/ErrorScreen";
import Pagination from "../../../utils/Pagination";
import Toast from "../../../utils/Toast";
import useDebounceImport from "../../../utils/helpers/useDebounce";
import Dropdown from "../../../utils/Dropdown";
import PhoneNumberInput from "../../../utils/PhoneNumberInput";
import ConfirmPopup from "../../../utils/ConfirmPopup";

type Props = {
  children?: React.ReactNode;
  CurrAppDetails?: {
    ApplicationId?: string;
  };
};

type IntegrationModeItem = {
  IntegrationModeId: string;
  IntegrationMode: string;
};

type ApplicationItem = {
  ApplicationId: string;
  ApplicationName?: string;
};

type IntegrationRecord = {
  IntegrationId: string;
  Source: string;
  Target: string;
  IntegrationMode: string;
  IntegrationModeId?: string;
  IntegrationApps: string;
  [k: string]: unknown;
};

type GetIntegrationsResponse = {
  ResponseData: IntegrationRecord[];
  TotalRecords: number;
};

type GetIntegrationModesResponse = {
  ResponseData: IntegrationModeItem[];
};

type GetApplicationsResponse = {
  ResponseData: ApplicationItem[];
};

type CurrAddEditObj = {
  ApplicationId: string;
  IntegrationId: string;
  Source: string;
  Target: string;
  IntegrationModeId: string;
  IntegrationApps: string;
  Contact?: string;
  CountryCode?: string;
  ClientName?: string;
};

type ValidateFields = {
  Source: string;
  Target: string;
  IntegrationModeId: string;
  IntegrationApps: string;
  EmailId?: string;
};

type FormErrors = Record<string, string>;

type State = {
  ActionType: "" | "Add" | "Update";
  Error: string;
  SearchQuery: string;
  CurrentPage: number;
  TotalRecords: number;
  ApplicationIntegrationsMaster: IntegrationRecord[];
  Countries: unknown[];
  CountryCodes: unknown[];
  States: unknown[];
  GetIntegrationModesList: IntegrationModeItem[];
  ApplicationsMasterList: ApplicationItem[];
  ViewClientDetails: boolean;
  IsLoading: boolean;
  showToast: boolean;
  SavingLoader: boolean;
  isDataExist: string;
  ClientBusinessUnitActionType: string;
  CurrAddEditObj: CurrAddEditObj;
  ValidateFields: ValidateFields;
  FormErrors: FormErrors;
};

type DataRow = {
  IntegrationId: string;
  Source: string;
  Target: string;
  IntegrationMode: string;
  IntegrationApps: string;
  actions: React.ReactNode;
};

const useDebounce = useDebounceImport as <T>(value: T, delay: number) => T;
const apiReq = apiRequest as <TReq, TRes>(url: string, body: TReq) => Promise<TRes>;

export default function ApplicationIntegrations(props: Props) {
  const [state, setState] = useReducer(
    (s: State, a: Partial<State>): State => ({ ...s, ...a }),
    {
      ActionType: "",
      Error: "",
      SearchQuery: "",
      CurrentPage: 1,
      TotalRecords: 1,
      ApplicationIntegrationsMaster: [],
      Countries: [],
      CountryCodes: [],
      States: [],
      GetIntegrationModesList: [],
      ApplicationsMasterList: [],
      ViewClientDetails: false,
      IsLoading: true,
      showToast: false,
      SavingLoader: false,
      isDataExist: "",
      ClientBusinessUnitActionType: "",
      CurrAddEditObj: {
        ApplicationId: "",
        IntegrationId: "",
        Source: "",
        Target: "",
        IntegrationModeId: "",
        IntegrationApps: "",
      },
      ValidateFields: {
        Source: "",
        Target: "",
        IntegrationModeId: "",
        IntegrationApps: "",
      },
      FormErrors: {},
    }
  );

  const didFetchData = useRef<boolean>(false);
  useEffect(() => {
    if (didFetchData.current) return;
    didFetchData.current = true;

    const init = async (): Promise<void> => {
      setState({ IsLoading: true });

      await Promise.all([getData(""), getGetIntegrationModesList(), getGetApplicationsMasterList()]);

      setState({ IsLoading: false });
    };

    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getGetApplicationsMasterList = async (): Promise<void> => {
    try {
      const resp = await apiReq<Record<string, never>, GetApplicationsResponse>("/GetApplicationsMaster", {});
      setState({
        ApplicationsMasterList: resp.ResponseData,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error loading Country/State/City:", err);
    }
  };

  const getGetIntegrationModesList = async (): Promise<void> => {
    try {
      const resp = await apiReq<Record<string, never>, GetIntegrationModesResponse>(
        "/GetIntegrationModesMaster",
        {}
      );
      setState({
        GetIntegrationModesList: resp.ResponseData,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error loading Country/State/City:", err);
    }
  };

  const getData = async (SearchQuery: string = ""): Promise<void> => {
    try {
      const resp = await apiReq<
        { StartDate: string; EndDate: string; ApplicationId?: string; SearchString: string },
        GetIntegrationsResponse
      >("/GetApplicationIntegrationsMasterPaginationFilterSearch", {
        StartDate: "",
        EndDate: "",
        ApplicationId: props?.CurrAppDetails?.ApplicationId,
        SearchString: SearchQuery,
      });
      if (resp.ResponseData.length > 0) {
        setState({
          ApplicationIntegrationsMaster: resp.ResponseData,
          TotalRecords: resp.TotalRecords,
          CurrentPage: 1,
        });
      } else {
        setState({ ApplicationIntegrationsMaster: [], TotalRecords: 0, CurrentPage: 1 });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState({ Error: message });
    } finally {
      setState({ IsLoading: false });
    }
  };

  const handleAddClient = (): void => {
    const CurrAddEditObj: CurrAddEditObj = {
      ApplicationId: "",
      IntegrationId: "",
      Source: "",
      Target: "",
      IntegrationModeId: "",
      IntegrationApps: "",
    };
    setState({ ActionType: "Add", CurrAddEditObj });
  };

  const handleEdit = (item: CurrAddEditObj | IntegrationRecord): void => {
    setState({ ActionType: "Update", CurrAddEditObj: item as CurrAddEditObj });
  };

  const handleCancel = (): void => {
    const CurrAddEditObj: CurrAddEditObj = {
      ApplicationId: "",
      IntegrationId: "",
      Source: "",
      Target: "",
      IntegrationModeId: "",
      IntegrationApps: "",
    };
    setState({ ActionType: "", CurrAddEditObj });
    void getData("");
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

  const debouncedQuery = useDebounce<string>(state.CurrAddEditObj.ClientName ?? "", 500);

  const checkIfDataExist = async (query: string): Promise<void> => {
    const resp = await apiReq<{ ClientName: string }, { ClientsMaster: unknown[] }>("/CheckClientsMaster", {
      ClientName: query,
    });
    if (resp.ClientsMaster.length > 0) {
      setState({ isDataExist: "Client already existed" });
    } else {
      setState({ isDataExist: "" });
    }
  };

  // useEffect(() => {
  //   if (debouncedQuery) {
  //     void checkIfDataExist(debouncedQuery);
  //   } else {
  //     setState({ isDataExist: "" });
  //   }
  // }, [debouncedQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setState({ SearchQuery: value });
    if (value.trim() === "") {
      void getData("");
    }
  };

  const handleChangeClientInfo = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    name: keyof CurrAddEditObj
  ): void => {
    const CurrAddEditObj = { ...state.CurrAddEditObj, [name]: e.target.value };
    setState({ CurrAddEditObj });
  };

  const validateClientInfoForm = (): boolean => {
    const FormErrors: FormErrors = {};
    let formIsValid = true;

    const emailRegex = "";
    for (const name in state.ValidateFields) {
      const key = name as keyof ValidateFields & keyof CurrAddEditObj;
      const value = state.CurrAddEditObj[key];
      if (value === "" || (typeof value === "number" && value === 0)) {
        formIsValid = false;
        FormErrors[key as string] = "This field is required";
      } else {
        if (key === "EmailId" && typeof value === "string" && !emailRegex.test(value)) {
          formIsValid = false;
          FormErrors[key] = "Please enter a valid email address";
        } else {
          FormErrors[key as string] = "";
        }
      }
    }
    setState({
      FormErrors,
    });
    return formIsValid;
  };

  const handleClientInfoContactChange = (val: string): void => {
    const CurrAddEditObj = { ...state.CurrAddEditObj, Contact: val };
    setState({ CurrAddEditObj });
  };

  const handleClientInfoCountryCodeChange = (val: string): void => {
    const CurrAddEditObj = { ...state.CurrAddEditObj, CountryCode: val };
    setState({ CurrAddEditObj });
  };

  const handleDropdownClientInfo = (
    val: string | number | (string | number)[],
    _options: unknown,
    name: keyof CurrAddEditObj
  ): void => {
    const CurrAddEditObj = { ...state.CurrAddEditObj, [name]: val as never };
    setState({ CurrAddEditObj });
  };

  const handleDeleteItem = async (item: IntegrationRecord): Promise<void> => {
    const resp = await apiReq<IntegrationRecord, unknown>("/DeleteApplicationIntegrationsMaster", item);
    if (resp) {
      setState({ showToast: true });
      void getData();
      setTimeout(() => {
        setState({ showToast: false });
      }, 3000);
    }
  };

  const handleSubmitClientInfo = async (): Promise<void> => {
    if (!validateClientInfoForm()) {
      return;
    }
    setState({ SavingLoader: true });
    const CurrAddEditObj: CurrAddEditObj = {
      ...state.CurrAddEditObj,
      ApplicationId: props?.CurrAppDetails?.ApplicationId ?? "",
    };
    const resp = await apiReq<CurrAddEditObj, unknown>("/AddUpdateApplicationIntegrationsMaster", CurrAddEditObj);
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
        <Spinner size="lg" color="blue-500" text="Fetching data..." />
      </div>
    );
  if (state.Error) return <ErrorScreen message={state.Error} />;

  const columns: ReadonlyArray<{ title: string; key: keyof DataRow | string }> = [
    { title: "#ID", key: "IntegrationId" },
    { title: "Source", key: "Source" },
    { title: "Target", key: "Target" },
    { title: "Source", key: "IntegrationMode" },
    { title: "Integration App", key: "IntegrationApps" },
  ];

  const data: DataRow[] = state.ApplicationIntegrationsMaster.map((v) => ({
    IntegrationId: String(v.IntegrationId),
    Source: String(v.Source),
    Target: String(v.Target),
    IntegrationMode: String(v.IntegrationMode),
    IntegrationApps: String(v.IntegrationApps),
    actions: (
      <div className="relative flex items-center">
        <ConfirmPopup message="Are you sure you want to delete this item?" onConfirm={() => void handleDeleteItem(v)}>
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
    <div className="  pt-0 pb-6 px-6 ">
      <Toast message="Saved successfully!" show={state.showToast} onClose={() => null} />
      {state.ActionType !== "" ? (
        <div className=" w-full pt-2">
          <div className="flex justify-end">
            <div className="flex items-center">
              {state.ActionType !== "" && (
                <button
                  onClick={handleCancel}
                  className="bg-white border border-[#2196F3] mr-6 text-[0.89rem] cursor-pointer text-[#0582E5] font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
                >
                  <X className="w-5 h-5" />
                  <span>CANCEL</span>
                </button>
              )}

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
                    {" "}
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
                Source <span className="text-red-500">*</span>
              </label>
              <input
                onChange={(e) => handleChangeClientInfo(e, "Source")}
                value={state.CurrAddEditObj.Source}
                type="text"
                id="client"
                name="client"
                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder=" "
                required
              />
              {state.FormErrors.Source && (
                <div className="flex items-center mt-1 ml-2">
                  <CircleAlert size={14} className="text-red-500" />
                  <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.Source}</p>
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
                Target <span className="text-red-500">*</span>
              </label>
              <input
                onChange={(e) => handleChangeClientInfo(e, "Target")}
                value={state.CurrAddEditObj.Target}
                type="text"
                id="client"
                name="client"
                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder=" "
                required
              />
              {state.FormErrors.Target && (
                <div className="flex items-center mt-1 ml-2">
                  <CircleAlert size={14} className="text-red-500" />
                  <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.Target}</p>
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
                IntegrationModeId <span className="text-red-500">*</span>
              </label>
              <Dropdown
                mode="single"
                options={state.GetIntegrationModesList}
                value={state.CurrAddEditObj.IntegrationModeId}
                onChange={(val, item) => handleDropdownClientInfo(val as string, item, "IntegrationModeId")}
                onSearch={(q: string) => {
                  // eslint-disable-next-line no-console
                  console.log("Search (Multi):", q);
                }}
              />

              {state.FormErrors.BusinessProcessId && (
                <div className="flex items-center mt-1 ml-2">
                  <CircleAlert size={14} className="text-red-500" />
                  <p className="text-red-500 text-sm ">{state.FormErrors.BusinessProcessId}</p>
                </div>
              )}
            </div>
            <div className="">
              <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                Integration Apps <span className="text-red-500">*</span>
              </label>
              <Dropdown
                mode="single"
                options={state.ApplicationsMasterList}
                value={state.CurrAddEditObj.IntegrationApps}
                onChange={(val, item) => handleDropdownClientInfo(val as string, item, "IntegrationApps")}
                onSearch={(q: string) => {
                  // eslint-disable-next-line no-console
                  console.log("Search (Multi):", q);
                }}
              />

              {state.FormErrors.IntegrationApps && (
                <div className="flex items-center mt-1 ml-2">
                  <CircleAlert size={14} className="text-red-500" />
                  <p className="text-red-500 text-sm ">{state.FormErrors.IntegrationApps}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex mt-2 justify-between items-center pb-4">
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
          <CustomTable columns={columns as unknown as Record<string, unknown>} data={data} responsive={true} />
          {state.TotalRecords > 10 && (
            <div className="pt-4 flex justify-end">
              <Pagination
                total={952}
                current={2}
                pageSize={10}
                onChange={(_c: number) => {
                  // no-op as per original
                }}
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
