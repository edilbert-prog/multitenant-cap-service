import React, { useEffect, useReducer, useRef } from "react";
import CustomTable from "../../../utils/CustomTable";
import { Plus, Trash2, CircleAlert } from "lucide-react";
import { apiRequest } from "../../../utils/helpers/ApiHelper";
import Spinner from "../../../utils/Spinner";
import ErrorScreen from "../../../utils/ErrorScreen";
import Pagination from "../../../utils/Pagination";
import Modal from "../../../utils/Modal";
import Toast from "../../../utils/Toast";
import useDebounceImport from "../../../utils/helpers/useDebounce";
import ConfirmPopup from "../../../utils/ConfirmPopup";
import Dropdown from "../../../utils/Dropdown";

type Props = {
  children?: React.ReactNode;
  CurrAppDetails: {
    ApplicationId: string;
    ApplicationName?: string;
    Description?: string;
  };
};

type ProgramMasterItem = {
  ProgramId: string;
  ProgramName: string;
  Description?: string;
};

type ApplicationProgramItem = {
  ProgramId: string;
  ProgramName: string;
  Description: string;
  [k: string]: unknown;
};

type GetProgramsMasterResponse = {
  ResponseData: ProgramMasterItem[];
};

type GetApplicationsMasterResponse = {
  ResponseData: Array<{
    ApplicationId: string;
    ApplicationName: string;
    Description?: string;
  }>;
};

type GetApplicationProgramResponse = {
  ResponseData: ApplicationProgramItem[];
  TotalRecords: number;
};

type DeleteResponse = unknown;

type AddUpdateResponse = unknown;

type CurrAppDetails = {
  ApplicationId: string;
  ProgramId: string | string[];
};

type ApplicationValidateFields = {
  ApplicationId: string;
  ProgramId: string | string[];
  // EmailId?: string; // Not present in UI but retained for logic compatibility
};

type ApplicationErrors = Record<string, string>;

type State = {
  Error: string;
  SearchQuery: string;
  ApplicationPrograms: ApplicationProgramItem[];
  ProgramsMasterList: ProgramMasterItem[];
  getApplicationsList: unknown[];
  ApplicationsList: unknown[];
  States: unknown[];
  Cities: unknown[];
  ViewAppDetails: boolean;
  IsLoading: boolean;
  ViewDetails: boolean;
  openModal3: boolean;
  openModal: boolean;
  showToast: boolean;
  SavingLoader: boolean;
  isDataExist: string;
  ClientBusinessUnitActionType: string;
  CurrPillActive: string;
  CurrAppDetails: CurrAppDetails;
  ApplicationValidateFields: ApplicationValidateFields;
  ApplicationErrors: ApplicationErrors;
  TotalRecords?: number;
  CurrentPage?: number;
};

type DataRow = {
  ProgramName: string;
  Description: string;
  actions: React.ReactNode;
};

const useDebounce = useDebounceImport as <T>(value: T, delay: number) => T;
const apiReq = apiRequest as <TReq, TRes>(url: string, body: TReq) => Promise<TRes>;

export default function ApplicationPrograms(props: Props) {
  const [state, setState] = useReducer(
    (s: State, a: Partial<State>): State => ({ ...s, ...a }),
    {
      Error: "",
      SearchQuery: "",
      ApplicationPrograms: [],
      ProgramsMasterList: [],
      getApplicationsList: [],
      ApplicationsList: [],
      States: [],
      Cities: [],
      ViewAppDetails: false,
      IsLoading: true,
      ViewDetails: false,
      openModal3: false,
      openModal: false,
      showToast: false,
      SavingLoader: false,
      isDataExist: "",
      ClientBusinessUnitActionType: "",
      CurrPillActive: "TransactionFields",
      CurrAppDetails: {
        ApplicationId: props.CurrAppDetails.ApplicationId ?? "",
        ProgramId: "",
      },
      ApplicationValidateFields: {
        ApplicationId: props.CurrAppDetails.ApplicationId ?? "",
        ProgramId: "",
      },
      ApplicationErrors: {},
      TotalRecords: 0,
      CurrentPage: 1,
    }
  );

  const didFetchData = useRef<boolean>(false);
  useEffect(() => {
    if (didFetchData.current) return;
    didFetchData.current = true;

    const init = async (): Promise<void> => {
      setState({ IsLoading: true });

      await Promise.all([getData(""), getProgramsMasterList(""), getApplicationsList()]);

      setState({ IsLoading: false });
    };

    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const getProgramsMasterList = async (SearchString: string = ""): Promise<void> => {
    try {
      const resp = await apiReq<{ SearchString: string }, GetProgramsMasterResponse>("/GetProgramsMaster", {
        SearchString,
      });
      setState({
        ProgramsMasterList: resp.ResponseData,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error loading Country/State/City:", err);
    }
  };

  const getApplicationsList = async (SearchString: string = ""): Promise<void> => {
    try {
      const resp = await apiReq<{ SearchString: string }, GetApplicationsMasterResponse>("/GetApplicationsMaster", {
        SearchString,
      });
      setState({
        ApplicationsList: resp.ResponseData,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error loading Country/State/City:", err);
    }
  };

  const getData = async (SearchQuery: string = "", PageNo: number = 1): Promise<void> => {
    try {
      const resp = await apiReq<
        { PageNo: number; ApplicationId: string; StartDate: string; EndDate: string; SearchString: string },
        GetApplicationProgramResponse
      >("/GetApplicationProgramMasterPaginationFilterSearch", {
        PageNo,
        ApplicationId: props.CurrAppDetails.ApplicationId,
        StartDate: "",
        EndDate: "",
        SearchString: SearchQuery,
      });
      if (resp.ResponseData.length > 0) {
        setState({ ApplicationPrograms: resp.ResponseData, TotalRecords: resp.TotalRecords });
      } else {
        setState({ ApplicationPrograms: [], TotalRecords: 0 });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState({ Error: message });
    } finally {
      setState({ IsLoading: false });
    }
  };

  const handleAddClient = (): void => {
    const CurrAppDetails: CurrAppDetails = {
      ApplicationId: props.CurrAppDetails.ApplicationId,
      ProgramId: "",
    };
    setState({ openModal3: true, CurrAppDetails });
  };

  const validateApplicationForm = (): boolean => {
    const ApplicationErrors: ApplicationErrors = {};
    let formIsValid = true;

    const emailRegex = "";
    for (const name in state.ApplicationValidateFields) {
      const key = name as keyof ApplicationValidateFields & keyof CurrAppDetails;
      const value = state.CurrAppDetails[key];

      if (value === "" || (typeof value === "number" && value === 0)) {
        formIsValid = false;
        ApplicationErrors[key] = "This field is required";
      } else {
        if (key === ("EmailId" as unknown) && typeof value === "string" && !emailRegex.test(value)) {
          formIsValid = false;
          ApplicationErrors[key as string] = "Please enter a valid email address";
        } else {
          ApplicationErrors[key as string] = "";
        }
      }
    }
    setState({ ApplicationErrors });
    return formIsValid;
  };

  const handleDropdownClientInfo = (
    val: string | string[],
    _options: unknown,
    name: keyof CurrAppDetails
  ): void => {
    const CurrAppDetails = { ...state.CurrAppDetails, [name]: val };
    setState({ CurrAppDetails });
  };

  const handlePageChange = (page: number): void => {
    // eslint-disable-next-line no-console
    console.log("page", page);
    setState({ CurrentPage: page });
    void getData(state.SearchQuery, page);
  };

  const handleDeleteItem = async (item: ApplicationProgramItem): Promise<void> => {
    const resp = await apiReq<ApplicationProgramItem, DeleteResponse>("/DeleteApplicationProgramMaster", item);
    if (resp) {
      setState({ showToast: true });
      void getData();
      setTimeout(() => {
        setState({ showToast: false });
      }, 3000);
    }
  };

  const handleSubmitApplication = async (): Promise<void> => {
    if (!validateApplicationForm()) {
      return;
    }
    setState({ SavingLoader: true, openModal3: false });
    const resp = await apiReq<CurrAppDetails, AddUpdateResponse>(
      "/AddUpdateApplicationProgramsMaster ",
      state.CurrAppDetails
    );
    if (resp) {
      void getData();
      setState({ SavingLoader: false, showToast: true });
      setTimeout(() => {
        setState({ showToast: false });
      }, 3000);
    }
  };

  const columns: ReadonlyArray<{ title: string; key: keyof DataRow | string }> = [
    { title: "Program", key: "ProgramName" },
    { title: "Description", key: "Description" },
  ];

  const data: DataRow[] = state.ApplicationPrograms.map((v) => ({
    ProgramName: v.ProgramName,
    Description: v.Description,
    actions: (
      <div className="relative flex items-center">
        <ConfirmPopup message="Are you sure you want to delete this item?" onConfirm={() => void handleDeleteItem(v)}>
          <button className=" pr-4 flex items-center">
            <Trash2 className="text-[#1A1A1A] cursor-pointer " />
          </button>
        </ConfirmPopup>
      </div>
    ),
  }));

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setState({ SearchQuery: value });
    if (value.trim() === "") {
      void getData("");
    }
  };

  if (state.IsLoading)
    return (
      <div className="h-96 py-20">
        <Spinner size="lg" color="blue-500" text="Fetching data..." />
      </div>
    );
  if (state.Error) return <ErrorScreen message={state.Error} />;
  return (
    <div className="  pt-0 pb-6  ">
      <Toast message="Saved successfully!" show={state.showToast} onClose={() => setState({ showToast: false })} />

      <Modal isOpen={state.openModal} onClose={() => setState({ openModal: false })} title="Alert">
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

      <Modal
        DisableScroll={true}
        width="max-w-4xl"
        modalZIndex={1000}
        isOpen={state.openModal3}
        onClose={() => setState({ openModal3: false })}
        title={"Map Features"}
      >
        <div className="space-y-5  flex flex-col">
          <div className="py-6">
            <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
              Select Features <span className="text-red-500">*</span>
            </label>
            <Dropdown
              mode="multiple"
              options={state.ProgramsMasterList}
              value={state.CurrAppDetails.ProgramId}
              onChange={(val, item) => handleDropdownClientInfo(val as string[] | string, item, "ProgramId")}
              onSearch={(q: string) => {
                // eslint-disable-next-line no-console
                console.log("Search (Multi):", q);
              }}
            />

            {state.ApplicationErrors.ProgramId && (
              <div className="flex items-center mt-1 ml-2">
                <CircleAlert size={14} className="text-red-500" />
                <p className="text-red-500 text-sm ">{state.ApplicationErrors.ProgramId}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end items-center bottom-0 gap-6 border-t border-gray-300">
            <button
              onClick={() => setState({ openModal3: false })}
              className="cursor-pointer mt-4 px-5 py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg "
            >
              Close
            </button>
            <button
              onClick={handleSubmitApplication}
              className="cursor-pointer mt-4 px-5 py-2 bg-[#891be9] text-white   text-sm rounded-lg "
            >
              Save
            </button>
          </div>
        </div>
      </Modal>

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
      {state.TotalRecords !== undefined && state.TotalRecords > 10 && (
        <div className="pt-4 flex justify-end">
          <Pagination
            total={state.TotalRecords}
            current={state.CurrentPage ?? 1}
            pageSize={10}
            onChange={handlePageChange}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
}
