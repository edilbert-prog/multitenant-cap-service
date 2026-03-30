import React, { useEffect, useReducer, useRef } from 'react';
import CustomTable from "../../../utils/CustomTable";
import { CircleAlert, Plus, Save, SquarePen, Trash2, X } from "lucide-react";
import { apiRequest } from "../../../utils/helpers/ApiHelper";
import Spinner from "../../../utils/Spinner";
import ErrorScreen from "../../../utils/ErrorScreen";
import Pagination from "../../../utils/Pagination";
import Toast from "../../../utils/Toast";
import useDebounce from "../../../utils/helpers/useDebounce";

type Props = {};

interface Country {
  CountryId: string | number;
  iso2: string;
  phonecode: string;
}

interface CountryCodeOption {
  value: string;
  label: string;
}

interface CountryStateCityResponse {
  Countries: Country[];
  States: unknown[];
  Cities: unknown[];
}

interface PaginationResponse<T> {
  ResponseData: T[];
  TotalRecords: number;
}

interface BusinessUnitRow {
  BusinessUnitId: string | number;
  BusinessUnitName: string;
  CompanyCodeERP: string;
  Email: string;
  CityName: string;
  StateName: string;
  CountryName: string;
  Address1: string;
  CountryId?: string | number;
  StateId?: string | number;
  [k: string]: unknown;
}

type ValidateKeys = "IntegrationMode";

interface CurrAddEdit {
  ClientId: string | number | "";
  ProjectId: string | number | "";
  SessionId: string | number | "";
  InputFilePath: string;
  MarkdownFilePath: string;
  IntegrationModeId?: string | number | "";
  IntegrationMode?: string | "";
  CountryId?: string | number | "";
  StateId?: string | number | "";
  CityId?: string | number | "";
  CountryCode?: string | number | "";
  Contact?: string | "";
  ClientName?: string | "";
  [k: string]: string | number | "" | undefined;
}

interface State {
  ActionType: "" | "Add" | "Update";
  Error: string;
  SearchQuery: string;
  CurrentPage: number;
  TotalRecords: number;
  IntegrationModesMaster: BusinessUnitRow[];
  Countries: Country[];
  CountryCodes: CountryCodeOption[];
  States: unknown[];
  Cities: unknown[];
  ViewClientDetails: boolean;
  IsLoading: boolean;
  showToast: boolean;
  SavingLoader: boolean;
  isDataExist: string;
  ClientBusinessUnitActionType: string;
  CurrAddEditObj: CurrAddEdit;
  ValidateFields: Record<ValidateKeys, string>;
  FormErrors: Record<string, string>;
}

function reducer(state: State, newState: Partial<State>): State {
  return { ...state, ...newState };
}

const useDebounceTyped = useDebounce as <T>(value: T, delay: number) => T;

export default function BusinessUnitMaster(_: Props): JSX.Element {
  const [state, setState] = useReducer(reducer, {
    ActionType: "",
    Error: "",
    SearchQuery: "",
    CurrentPage: 1,
    TotalRecords: 1,
    IntegrationModesMaster: [],
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
      ClientId: "",
      ProjectId: "",
      SessionId: "",
      InputFilePath: "/bin/ww/",
      MarkdownFilePath: "/d/tmp/CL007_ProjectId_1.md",
    },
    ValidateFields: {
      IntegrationMode: "",
    },
    FormErrors: {},
  });

  const didFetchData = useRef<boolean>(false);
  useEffect(() => {
    if (didFetchData.current) return;
    didFetchData.current = true;

    const init = async () => {
      setState({ IsLoading: true });

      await Promise.all([getData(""), getCountryStateCity()]);

      setState({ IsLoading: false });
    };

    void init();
  }, []);

  const getCountryStateCity = async (
    CountryId: string | number | "" = "",
    StateId: string | number | "" = ""
  ): Promise<void> => {
    try {
      const resp = (await apiRequest("/global-constants/GetCountriesStatesCities", {
        CountryId,
        StateId,
      })) as CountryStateCityResponse;

      const CountryCodes: CountryCodeOption[] = resp.Countries.map((v) => {
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

  const getData = async (SearchQuery: string = ""): Promise<void> => {
    try {
      const resp = (await apiRequest("/GetIntegrationModesMaster", {
        StartDate: "",
        EndDate: "",
        SearchString: SearchQuery,
      })) as PaginationResponse<BusinessUnitRow>;
      if (resp.ResponseData.length > 0) {
        setState({
          IntegrationModesMaster: resp.ResponseData,
          TotalRecords: resp.TotalRecords,
          CurrentPage: 1,
        });
      } else {
        setState({ IntegrationModesMaster: [], TotalRecords: 0, CurrentPage: 1 });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState({ Error: message });
    } finally {
      setState({ IsLoading: false });
    }
  };

  const handleAddClient = (): void => {
    const CurrAddEditObj: CurrAddEdit = {
      ClientId: "",
      ProjectId: "",
      SessionId: "",
      InputFilePath: "/bin/ww/",
      MarkdownFilePath: "/d/tmp/CL007_ProjectId_1.md",
      IntegrationModeId: "",
      IntegrationMode: "",
    };
    setState({ ActionType: "Add", CurrAddEditObj });
  };

  const handleEdit = (item: BusinessUnitRow): void => {
    void getCountryStateCity(item.CountryId ?? "", item.StateId ?? "");
    setState({ ActionType: "Update", CurrAddEditObj: item as unknown as CurrAddEdit });
  };

  const handleCancel = (): void => {
    const CurrAddEditObj: CurrAddEdit = {
      ClientId: "",
      ProjectId: "",
      SessionId: "",
      InputFilePath: "/bin/ww/",
      MarkdownFilePath: "/d/tmp/CL007_ProjectId_1.md",
      IntegrationModeId: "",
      IntegrationMode: "",
    };
    setState({ ActionType: "", CurrAddEditObj });
    void getData("");
  };

  const debouncedSearchQuery = useDebounceTyped<string>(state.SearchQuery, 300);
  const didSearchRun = useRef<boolean>(false);

  useEffect(() => {
    if (!didSearchRun.current) {
      didSearchRun.current = true;
      return;
    }
    if (debouncedSearchQuery.trim() === "") return;

    void getData(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  const debouncedQuery = useDebounceTyped<string | undefined>(state.CurrAddEditObj.ClientName, 500);

  const checkIfDataExist = async (query: string): Promise<void> => {
    const resp = (await apiRequest("/CheckClientsMaster", {
      ClientName: query,
    })) as { ClientsMaster: unknown[] };
    if (Array.isArray(resp.ClientsMaster) && resp.ClientsMaster.length > 0) {
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
    e: React.ChangeEvent<HTMLInputElement>,
    name: keyof CurrAddEdit
  ): void => {
    const CurrAddEditObj = { ...state.CurrAddEditObj, [name]: e.target.value };
    setState({ CurrAddEditObj });
  };

  const validateClientInfoForm = (): boolean => {
    const FormErrors: Record<string, string> = {};
    let formIsValid = true;

    const emailRegex = "";

    (Object.keys(state.ValidateFields) as ValidateKeys[]).forEach((name) => {
      const value = state.CurrAddEditObj[name];
      if (value === "" || value === 0 || value === undefined) {
        formIsValid = false;
        FormErrors[name] = "This field is required";
      } else {
        if (name === "IntegrationMode") {
          const maybeEmail = state.CurrAddEditObj["EmailId"];
          if (typeof maybeEmail === "string" && maybeEmail.length > 0 && !emailRegex.test(maybeEmail)) {
            formIsValid = false;
            FormErrors["EmailId"] = "Please enter a valid email address";
          } else {
            FormErrors[name] = "";
          }
        } else {
          FormErrors[name] = "";
        }
      }
    });

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
    val: string | number | null,
    _options: unknown,
    name: keyof CurrAddEdit
  ): void => {
    const CurrAddEditObj: CurrAddEdit = { ...state.CurrAddEditObj, [name]: val ?? "" };
    if (name === "CountryId") {
      CurrAddEditObj.CountryCode = val ?? "";
      void getCountryStateCity(val ?? "");
    }
    if (name === "StateId") {
      void getCountryStateCity(CurrAddEditObj.CountryId ?? "", CurrAddEditObj.StateId ?? "");
    }
    if (name === "CityId") {
      CurrAddEditObj[name] = String(val ?? "");
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

  const columns: Array<{ title: string; key: string; className?: string }> = [
    { title: '#ID', key: 'BusinessUnitId' },
    { title: 'Business Unit Name', key: 'BusinessUnitName' },
    { title: 'Company Code in ERP', key: 'CompanyCodeERP' },
    { title: 'Email', key: 'Email' },
    { title: 'Location', key: 'Location' },
    { title: 'Address1', key: 'Address1', className: 'min-w-[400px]' },
  ];

  const data = state.IntegrationModesMaster.map((v) => ({
    BusinessUnitId: v.BusinessUnitId,
    BusinessUnitName: v.BusinessUnitName,
    CompanyCodeERP: v.CompanyCodeERP,
    Email: v.Email,
    Location: `${v.CityName}, ${v.StateName}, ${v.CountryName}.`,
    Address1: v.Address1,
    actions: (
      <>
        <button onClick={() => handleEdit(v)} className=" ">
          <SquarePen className="text-[#1A1A1A] cursor-pointer" />
        </button>
        <button className=" " onClick={() => alert('Delete')}>
          <Trash2 className="text-[#1A1A1A]" />
        </button>
      </>
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
                    <Save className="w-5 h-5" />
                    <span>SAVE</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="">
              <label
                htmlFor=""
                className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1"
              >
                Integration Mode <span className="text-red-500">*</span>
              </label>
              <input
                onChange={(e) => handleChangeClientInfo(e, "IntegrationMode")}
                value={String(state.CurrAddEditObj.IntegrationMode ?? "")}
                type="text"
                id="client"
                name="client"
                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter business unit name"
                required
              />
              {state.FormErrors.IntegrationMode && (
                <div className="flex items-center mt-1 ml-2">
                  <CircleAlert size={14} className="text-red-500" />
                  <p className="ml-2 text-red-500 text-sm ">
                    {state.FormErrors.IntegrationMode}
                  </p>
                </div>
              )}
              {state.isDataExist && (
                <div className="flex items-center mt-1 ml-2">
                  <CircleAlert size={14} className="text-red-500" />
                  <p className="ml-2 text-red-500 text-sm ">
                    {state.isDataExist}
                  </p>
                </div>
              )}
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
                <span>Add Client</span>
              </button>
            </div>
          </div>
          <CustomTable columns={columns} data={data} responsive={true} />
          {state.TotalRecords > 10 && (
            <div className="pt-4 flex justify-end">
              <Pagination
                total={952}
                current={2}
                pageSize={10}
                onChange={(c: number) => {
                  // pagination handler
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
