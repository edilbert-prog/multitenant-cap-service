import React, { useEffect, useReducer, useRef } from "react";
import CustomTable from "../../../utils/CustomTable";
import { CircleAlert, Plus, Trash2 } from "lucide-react";
import { apiRequest } from "../../../utils/helpers/ApiHelper";
import Spinner from "../../../utils/Spinner";
import ErrorScreen from "../../../utils/ErrorScreen";
import Pagination from "../../../utils/Pagination";
import Modal from "../../../utils/Modal";
import Toast from "../../../utils/Toast";
import useDebounce from "../../../utils/helpers/useDebounce";
import ConfirmPopup from "../../../utils/ConfirmPopup";
import Dropdown from "../../../utils/Dropdown";

type Option = {
  label: string;
  value: string;
  [key: string]: unknown;
};

type Props = {
  CurrAppDetails: {
    ApplicationId: string;
    [key: string]: unknown;
  };
};

type CurrAppDetails = {
  ApplicationId: string;
  FeatureId: string;
  ApplicationName?: string;
  [key: string]: unknown;
};

type State = {
  Error: string;
  SearchQuery: string;
  ApplicationFeatures: any[];
  FeaturesMasterList: Option[];
  getApplicationsList: any[];
  ApplicationsList: any[];
  States: any[];
  Cities: any[];

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
  ApplicationValidateFields: Record<string, string>;
  ApplicationErrors: Record<string, string>;
  BusinessUnitErrors: Record<string, string>;
  BusinessUnitProcessErrors: Record<string, string>;
  BusinessUnitSubProcessErrors: Record<string, string>;
  BusinessUnitSubProcessAppErrors: Record<string, string>;
  BusinessUnitSubProcessAppIntegrationsErrors: Record<string, string>;
  pillItems: { key: string; label: string }[];
  CurrTab: string;
  TotalRecords?: number;
  CurrentPage?: number;
};

export default function ApplicationFeatures(props: Props) {
  const [state, setState] = useReducer(
      (s: State, ns: Partial<State>): State => ({ ...s, ...ns }),
      {
        Error: "",
        SearchQuery: "",
        ApplicationFeatures: [],
        FeaturesMasterList: [],
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
          ApplicationId: "",
          FeatureId: "",
        },
        ApplicationValidateFields: {
          ApplicationId: "",
          FeatureId: "",
        },

        ApplicationErrors: {},
        BusinessUnitErrors: {},
        BusinessUnitProcessErrors: {},
        BusinessUnitSubProcessErrors: {},
        BusinessUnitSubProcessAppErrors: {},
        BusinessUnitSubProcessAppIntegrationsErrors: {},
        pillItems: [{ key: "TransactionFields", label: "Transaction Fields" }],
        CurrTab: "Client Details",
        TotalRecords: 0,
        CurrentPage: 1,
      }
  );

  const didFetchData = useRef<boolean>(false);

  useEffect(() => {
    if (didFetchData.current) return;
    didFetchData.current = true;

    const init = async () => {
      setState({ IsLoading: true });

      await Promise.all([getData(""), getFeaturesMasterList(""), getApplicationsList()]);

      setState({ IsLoading: false });
    };

    init();
  }, []);

  const debouncedSearchQuery = useDebounce(state.SearchQuery, 300) as string;
  const didSearchRun = useRef<boolean>(false);

  useEffect(() => {
    if (!didSearchRun.current) {
      didSearchRun.current = true;
      return;
    }
    if (debouncedSearchQuery.trim() === "") return;
    getData(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  const getFeaturesMasterList = async (SearchString: string = "") => {
    try {
      const resp: any = await apiRequest("/GetFeaturesMaster", { SearchString });
      setState({
        FeaturesMasterList: resp.ResponseData,
      });
    } catch (err) {
      console.error("Error loading Country/State/City:", err);
    }
  };

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

  const getData = async (SearchQuery: string = "", PageNo: number = 1) => {
    try {
      const resp: any = await apiRequest("/GetApplicationFeatureMasterPaginationFilterSearch", {
        PageNo,
        ApplicationId: props.CurrAppDetails.ApplicationId,
        StartDate: "",
        EndDate: "",
        SearchString: SearchQuery,
      });
      if (resp.ResponseData.length > 0) {
        setState({ ApplicationFeatures: resp.ResponseData, TotalRecords: resp.TotalRecords });
      } else {
        setState({ ApplicationFeatures: [], TotalRecords: 0 });
      }
    } catch (err: any) {
      setState({ Error: err.toString() });
    } finally {
      setState({ IsLoading: false });
    }
  };

  const handleAddClient = () => {
    const CurrAppDetails: CurrAppDetails = {
      ApplicationId: props.CurrAppDetails.ApplicationId,
      FeatureId: "",
    };
    setState({ openModal3: true, CurrAppDetails });
  };

  const handleViewClientDetails = (item: CurrAppDetails) => {
    setState({ ViewAppDetails: true, CurrAppDetails: item });
  };

  const handleCloseClientDetails = () => {
    const CurrAppDetails: CurrAppDetails = {
      ApplicationId: "",
      FeatureId: "",
    };
    setState({ ViewAppDetails: false, CurrAppDetails });
    getData();
  };

  const handlePillClick = (item: { key: string; label: string }) => {
    if (
        (state.CurrAppDetails as Record<string, unknown>)["ApplicationIdTransactionId"] === "" &&
        item.key !== "ApplicationFeatures"
    ) {
      setState({ openModal: true });
    } else {
      setState({ CurrPillActive: item.key });
    }
  };

  const debouncedQuery = useDebounce(
      (state.CurrAppDetails as CurrAppDetails).ApplicationName ?? "",
      500
  ) as string;

  const checkIfDataExist = async (query: string) => {
    const resp: any = await apiRequest("/CheckClientsMaster", {
      ApplicationName: query,
    });
    if (resp.ClientsMaster.length > 0) {
      setState({ isDataExist: "Client already existed" });
    } else {
      setState({ isDataExist: "" });
    }
  };
  // useEffect(() => {
  //   if (debouncedQuery) {
  //     checkIfDataExist(debouncedQuery);
  //   } else {
  //     setState({ isDataExist: "" });
  //   }
  // }, [debouncedQuery]);

  const validateApplicationForm = (): boolean => {
    const ApplicationErrors: Record<string, string> = {};
    let formIsValid = true;

    const emailRegex = "";
    for (const name in state.ApplicationValidateFields) {
      const value = (state.CurrAppDetails as Record<string, unknown>)[name];
      if (value === "" || value === 0) {
        formIsValid = false;
        ApplicationErrors[name] = "This field is required";
      } else {
        if (name === "EmailId" && typeof value === "string" && !emailRegex.test(value)) {
          formIsValid = false;
          ApplicationErrors[name] = "Please enter a valid email address";
        } else {
          ApplicationErrors[name] = "";
        }
      }
    }
    setState({
      ApplicationErrors,
    });
    return formIsValid;
  };

  const handleDropdownClientInfo = (
      val: string,
      _options: Option | Option[],
      name: keyof CurrAppDetails
  ) => {
    const CurrAppDetails = { ...state.CurrAppDetails };
    (CurrAppDetails as Record<string, unknown>)[name as string] = val;
    setState({ CurrAppDetails });
  };

  const handlePageChange = (page: number) => {
    setState({ CurrentPage: page });
    getData(state.SearchQuery, page);
  };

  const handleDeleteItem = async (item: any) => {
    const resp: any = await apiRequest("/DeleteApplicationFeatureMaster", item);
    if (resp) {
      setState({ showToast: true });
      getData();
      setTimeout(() => {
        setState({ showToast: false });
      }, 3000);
    }
  };

  const handleSubmitApplication = async () => {
    if (!validateApplicationForm()) {
      return;
    }
    setState({ SavingLoader: true, openModal3: false });
    const resp: any = await apiRequest("/AddUpdateApplicationFeatureMaster ", state.CurrAppDetails);
    if (resp) {
      getData();
      setState({ SavingLoader: false, showToast: true });
      setTimeout(() => {
        setState({ showToast: false });
      }, 3000);
    }
  };

  const columns = [
    { title: "Feature", key: "Feature" },
    { title: "Description", key: "Description" },
  ];

  const data = state.ApplicationFeatures.map((v: any) => ({
    Feature: v.Feature,
    Description: v.Description,
    actions: (
        <div className="relative flex items-center">
          <ConfirmPopup message="Are you sure you want to delete this item?" onConfirm={() => handleDeleteItem(v)}>
            <button className=" pr-4 flex items-center">
              <Trash2 className="text-[#1A1A1A] cursor-pointer " />
            </button>
          </ConfirmPopup>
        </div>
    ),
  }));

  const colorOptions: Option[] = [
    { label: "Red", value: "red" },
    { label: "Green", value: "green" },
    { label: "Blue", value: "blue" },
    { label: "Yellow", value: "yellow" },
  ];

  const handleSelect = (selected: unknown) => {
    console.log("Selected:", selected);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setState({ SearchQuery: value });
    if (value.trim() === "") {
      getData("");
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
        <Toast
            message="Saved successfully!"
            show={state.showToast}
            onClose={() => setState({ showToast: false })}
        />

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
                  options={state.FeaturesMasterList}
                  value={state.CurrAppDetails.FeatureId}
                  onChange={(val: string, item: Option | Option[]) =>
                      handleDropdownClientInfo(val, item, "FeatureId")
                  }
                  onSearch={(q: string) => console.log("Search (Multi):", q)}
              />

              {state.ApplicationErrors.FeatureId && (
                  <div className="flex items-center mt-1 ml-2">
                    <CircleAlert size={14} className="text-red-500" />
                    <p className="text-red-500 text-sm ">{state.ApplicationErrors.FeatureId}</p>
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
        <CustomTable columns={columns} data={data} responsive={true} />
        {state.TotalRecords && state.TotalRecords > 10 && (
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
      </div>
  );
}
