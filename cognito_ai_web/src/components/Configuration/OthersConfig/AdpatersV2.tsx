import React, { useEffect, useReducer, useRef } from 'react';
import {
  ChevronLeft,
  CircleAlert,
  Save,
  Settings2,
  SquarePen,
  Trash2,
} from 'lucide-react';
import Spinner from '../../../utils/Spinner';
import ErrorScreen from '../../../utils/ErrorScreen';
import Toast from '../../../utils/Toast';
import useDebounce from '../../../utils/helpers/useDebounce';
import { motion } from 'framer-motion';
import { apiRequest } from '../../../utils/helpers/ApiHelper';
import GridTileV3 from "../../../utils/GridTilesV3";
import GenTSCSignavio from '../../../assets/icons/GenTSCSignavio.svg';
import GenTSCABAPProgram from '../../../assets/icons/GenTSCABAPProgram.svg';
import GenTSCJIRA from '../../../assets/icons/GenTSCJIRA.svg';
import GenTSCSAPConfig from '../../../assets/icons/GenTSCSAPConfig.svg';
import GenTSCDocument from '../../../assets/icons/GenTSCDocument.svg';
import LLMEnginesMaster from "./LLMEnginesMaster.tsx";
// import GenTSCLLMConfig from '../../../assets/icons/GenTSCLLMConfig.svg';
type Props = {};

interface Adapter {
  AdapterId: string;
  HostName: string;
  BaseURL: string;
  Email: string;
  APIToken: string;
  [key: string]: unknown;
}

interface GetAdaptersResponse {
  ResponseData: Adapter[];
  TotalRecords: number;
}

interface SAPConfig {
  Host: string;
  Port: string;
  UserName: string;
  Password: string;
  DATABASE: string;
}

interface SimpleCreds {
  Email: string;
  Password: string;
  APIToken: string;
}

type FieldNames = 'HostName' | 'BaseURL' | 'Email' | 'APIToken' | 'EmailId';

type FormErrors = Partial<Record<FieldNames, string>>;

interface CurrAddEditObj {
  AdapterId: string;
  HostName: string;
  BaseURL: string;
  Email: string;
  APIToken: string;
  ClientName?: string;
  Contact?: string;
  CountryCode?: string;
}

interface State {
  ActionType: string;
  Error: string;
  SearchQuery: string;
  CurrentAdapter: string;
  CurrentPage: number;
  TotalRecords: number;
  AdpatersV2: Adapter[];
  IntegrationModeMasterList: unknown[];
  ApplicationsList: unknown[];
  Countries: unknown[];
  CountryCodes: unknown[];
  States: unknown[];
  Cities: unknown[];
  ViewClientDetails: boolean;
  IsLoading: boolean;
  showToast: boolean;
  SavingLoader: boolean;
  isDataExist: string;
  ClientBusinessUnitActionType: string;
  SFDCAddEditObj: SimpleCreds;
  SignavioAddEditObj: SimpleCreds;
  SAPConfigAddEditObj: SAPConfig;
  CurrAddEditObj: CurrAddEditObj;
  ValidateFields: Partial<Record<FieldNames, string>>;
  FormErrors: FormErrors;
}

type PartialState = Partial<State>;

type Tile = {
  icon: React.ReactNode;
  key: number;
  // title: 'JIRA' | 'Signavio' | 'SAP Config' | 'SFDC';
  title: 'JIRA' | 'Signavio' | 'LLM Config' | 'SAP Config';
  subtitle: string;
  route: string;
};

const apiRequestTyped = apiRequest as <T>(url: string, body: unknown) => Promise<T>;
const useDebounceTyped = useDebounce as <T>(value: T, delay: number) => T;

export default function AdpatersV2(_: Props) {
  const [state, setState] = useReducer(
    (prev: State, next: PartialState): State => ({ ...prev, ...next }),
    {
      ActionType: '',
      Error: '',
      SearchQuery: '',
      CurrentAdapter: '',
      CurrentPage: 1,
      TotalRecords: 1,
      AdpatersV2: [],
      IntegrationModeMasterList: [],
      ApplicationsList: [],
      Countries: [],
      CountryCodes: [],
      States: [],
      Cities: [],
      ViewClientDetails: false,
      IsLoading: true,
      showToast: false,
      SavingLoader: false,
      isDataExist: '',
      ClientBusinessUnitActionType: '',
      SFDCAddEditObj: {
        Email: '',
        Password: '',
        APIToken: '',
      },
      SignavioAddEditObj: {
        Email: '',
        Password: '',
        APIToken: '',
      },
      SAPConfigAddEditObj: {
        Host: '',
        Port: '',
        UserName: '',
        Password: '',
        DATABASE: '',
      },
      CurrAddEditObj: {
        AdapterId: '',
        HostName: '',
        BaseURL: '',
        Email: '',
        APIToken: '',
      },
      ValidateFields: {
        HostName: '',
        BaseURL: '',
        Email: '',
        APIToken: '',
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

      await Promise.all([getData('')]);

      setState({ IsLoading: false });
    };

    void init();
  }, []);

  const getData = async (SearchQuery: string = ''): Promise<void> => {
    try {
      const resp = await apiRequestTyped<GetAdaptersResponse>('/adapters/GetAdaptersMasterPaginationFilterSearch', {
        StartDate: '',
        EndDate: '',
        SearchString: SearchQuery,
      });

      if (resp.ResponseData.length > 0) {
        setState({ CurrAddEditObj: resp.ResponseData[0], TotalRecords: resp.TotalRecords, CurrentPage: 1 });
      } else {
        setState({ AdpatersV2: [], TotalRecords: 0, CurrentPage: 1 });
      }
    } catch (err) {
      setState({ Error: (err as Error).toString() });
    } finally {
      setState({ IsLoading: false });
    }
  };

  const handleEdit = (item: Adapter): void => {
    setState({ ActionType: 'Update', CurrAddEditObj: item });
  };

  const handleCancel = (): void => {
    const CurrAddEditObj: CurrAddEditObj = {
      AdapterId: '',
      HostName: '',
      BaseURL: '',
      Email: '',
      APIToken: '',
    };
    setState({ ActionType: '', CurrAddEditObj });
    void getData('');
  };

  const debouncedSearchQuery: string = useDebounceTyped<string>(state.SearchQuery, 300);
  const didSearchRun = useRef<boolean>(false);

  useEffect(() => {
    if (!didSearchRun.current) {
      didSearchRun.current = true;
      return;
    }
    if (debouncedSearchQuery.trim() === '') return;
    void getData(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  const validateClientInfoForm = (): boolean => {
    const FormErrors: FormErrors = {};
    let formIsValid = true;

    const emailRegex = "";
    (Object.keys(state.ValidateFields) as FieldNames[]).forEach((name) => {
      const value = (state.CurrAddEditObj as Record<string, unknown>)[name];
      if (value === '' || value === 0 || value === undefined || value === null) {
        formIsValid = false;
        FormErrors[name] = 'This field is required';
      } else {
        if (name === 'EmailId' && typeof value === 'string' && !emailRegex.test(value)) {
          formIsValid = false;
          FormErrors[name] = 'Please enter a valid email address';
        } else {
          FormErrors[name] = '';
        }
      }
    });

    setState({ FormErrors });
    return formIsValid;
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setState({ SearchQuery: value });
    if (value.trim() === '') {
      void getData('');
    }
  };

  const handleChangeClientInfo = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    name: keyof CurrAddEditObj
  ): void => {
    const CurrAddEditObj = { ...state.CurrAddEditObj, [name]: e.target.value };
    setState({ CurrAddEditObj });
  };

  const handleDeleteItem = async (item: Adapter): Promise<void> => {
    const resp = await apiRequestTyped<unknown>('/DeleteAdaptersMaster', item);
    if (resp) {
      setState({ showToast: true });
      void getData();
      window.setTimeout(() => {
        setState({ showToast: false });
      }, 3000);
    }
  };

  const handleSubmitClientInfo = async (): Promise<void> => {
    if (!validateClientInfoForm()) {
      return;
    }
    setState({ SavingLoader: true });
    const resp = await apiRequestTyped<unknown>('/AddUpdateAdaptersMaster', state.CurrAddEditObj);
    if (resp) {
      setState({ SavingLoader: false, showToast: true, ActionType: '' });
      void getData();
      window.setTimeout(() => {
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

  const tiles = [
    // {
    //   icon: <img src={GenTSCDocument} alt="" className="w-38"/>,
    //   key: 1,
    //   title: "Document",
    //   subtitle: "Upload in .docx, .txt, .png format",
    //   route: "/performance"
    // },
    {
      icon: <img src={GenTSCJIRA} className="w-38"/>,
      key: 2,
      title: "JIRA",
      subtitle: "Extract JIRA Story",
      route: "/settings"
    },
    {
      key: 3,
      icon: <img src={GenTSCSignavio} className="w-38"/>,
      title: "Signavio",
      subtitle: "Extract files from the signavio ",
      route: "/settings"
    },
    /* {
      key: 4,
      icon: <img src={GenTSCABAPProgram} className="w-38"/>,
      title: "ABAP Program",
      subtitle: "Select ABAP program.",
      route: "/settings"
    }, */
    {
      key: 4,
      icon: <img src={GenTSCABAPProgram} className="w-38"/>,
      title: "LLM Config",
      subtitle: "Configure LLM settings and parameters",
      route: "/settings"
    },
    {
      key: 5,
      icon: <img src={GenTSCSAPConfig} className="w-38"/>,
      title: "SAP Config",
      subtitle: "SAP Configuration",
      route: "/settings"
    },

  ];
  const handleCurrentAdapter = (tab): void => {
    setState({ CurrentAdapter: tab });
  };
  console.log("CurrentAdapter",state.CurrentAdapter)
  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  } as const;

  return (
    <div className="relative w-full  pt-0 pb-6 px-6 ">
      <Toast message="Saved successfully!" show={state.showToast} onClose={() => null} />

      {state.CurrentAdapter === '' && (
        <div className="flex items-center justify-center py-8 bg-gray-50 p-4">
          <motion.div
            className="grid grid-cols-4 place-items-center gap-6 p-10"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {tiles.map((tile, i) => (<GridTileV3
                onClick={tile.key === 1 || tile.key === 2 || tile.key === 3 || tile.key === 4 || tile.key === 5 ? () => handleCurrentAdapter(tile.title) : null}
                key={i}
                icon={tile.icon}
                title={tile.title}
                subtitle={tile.subtitle}
                route={tile.route}
                index={i}
                gradientOpacity={1}
                dark={0.2}
            />))}
          </motion.div>
        </div>
      )}

      {state.CurrentAdapter === 'JIRA' && (
        <div className=" w-full pt-2">
          <div className="flex justify-between items-center pb-4">
            <div
              onClick={() => setState({ CurrentAdapter: '' })}
              className="flex items-center cursor-pointer bg-[#f3f3f3]  w-fit px-4 py-1 rounded-full"
            >
              <ChevronLeft className="text-gray-700" /> <span className="font-medium text-sm text-gray-700"> Back</span>
            </div>
            <p className="font-semibold">{state.CurrentAdapter}</p>
            <div className="flex items-center">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            <div className="">
              <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                Host Name<span className="text-red-500">*</span>
              </label>
              <input
                onChange={(e) => handleChangeClientInfo(e, 'HostName')}
                value={state.CurrAddEditObj.HostName}
                type="text"
                id="client"
                name="client"
                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter HostName"
                required
              />
              {state.FormErrors.HostName && (
                <div className="flex items-center mt-1 ml-2">
                  <CircleAlert size={14} className="text-red-500" />
                  <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.HostName}</p>
                </div>
              )}
              {state.isDataExist && (
                <div className="flex items-center mt-1 ml-2">
                  <CircleAlert size={14} className="text-red-500" />
                  <p className="ml-2 text-red-500 text-sm ">{state.isDataExist}</p>
                </div>
              )}
            </div>
            <div className=" ">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="name" className=" text-[0.90rem] text-[#2C3E50] font-medium">
                  Jira Domain<span className="text-red-500">*</span>
                </label>
              </div>

              <div className="relative">
                <input
                  onChange={(e) => handleChangeClientInfo(e, 'BaseURL')}
                  value={state.CurrAddEditObj.BaseURL}
                  type="text"
                  id="client"
                  name="client"
                  className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter Base URL"
                  required
                />
                {state.FormErrors.BaseURL && (
                  <div className="flex items-center mt-1 ml-2">
                    <CircleAlert size={14} className="text-red-500" />
                    <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.BaseURL}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="">
              <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                Email<span className="text-red-500">*</span>
              </label>
              <input
                onChange={(e) => handleChangeClientInfo(e, 'Email')}
                value={state.CurrAddEditObj.Email}
                type="text"
                id="client"
                name="client"
                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Email"
                required
              />
              {state.FormErrors.Email && (
                <div className="flex items-center mt-1 ml-2">
                  <CircleAlert size={14} className="text-red-500" />
                  <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.Email}</p>
                </div>
              )}
            </div>
            <div className=" ">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="name" className=" text-[0.90rem] text-[#2C3E50] font-medium">
                  API Token<span className="text-red-500">*</span>
                </label>
              </div>

              <div className="relative">
                <textarea
                  onChange={(e) => handleChangeClientInfo(e, 'APIToken')}
                  value={state.CurrAddEditObj.APIToken}
                  id="name"
                  name="name"
                  rows={4}
                  maxLength={2000}
                  placeholder=" API Token"
                  className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8]   resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                ></textarea>
                {state.FormErrors.APIToken && (
                  <div className="flex items-center mt-1 ml-2">
                    <CircleAlert size={14} className="text-red-500" />
                    <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.APIToken}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {state.CurrentAdapter === 'Signavio' && (
        <div className=" w-full pt-2">
          <div className="flex justify-between items-center pb-4">
            <div
              onClick={() => setState({ CurrentAdapter: '' })}
              className="flex items-center cursor-pointer bg-[#f3f3f3]  w-fit px-4 py-1 rounded-full"
            >
              <ChevronLeft className="text-gray-700" /> <span className="font-medium text-sm text-gray-700"> Back</span>
            </div>
            <p className="font-semibold">{state.CurrentAdapter}</p>
            <div className="flex items-center">
              <button className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            <div className="">
              <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                User Name<span className="text-red-500">*</span>
              </label>
              <input
                value={state.SignavioAddEditObj.Email}
                type="text"
                id="client"
                name="client"
                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Email"
                required
              />
              {state.FormErrors.HostName && (
                <div className="flex items-center mt-1 ml-2">
                  <CircleAlert size={14} className="text-red-500" />
                  <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.HostName}</p>
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
                Password<span className="text-red-500">*</span>
              </label>
              <input
                onChange={(e) => handleChangeClientInfo(e, 'Email')}
                value={state.SignavioAddEditObj.Password}
                type="Password"
                id="client"
                name="client"
                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Email"
                required
              />
              {state.FormErrors.Email && (
                <div className="flex items-center mt-1 ml-2">
                  <CircleAlert size={14} className="text-red-500" />
                  <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.Email}</p>
                </div>
              )}
            </div>
            <div className=" ">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="name" className=" text-[0.90rem] text-[#2C3E50] font-medium">
                  API Token<span className="text-red-500">*</span>
                </label>
              </div>

              <div className="relative">
                <textarea
                  onChange={(e) => handleChangeClientInfo(e, 'APIToken')}
                  value={state.SignavioAddEditObj.APIToken}
                  id="name"
                  name="name"
                  rows={4}
                  maxLength={2000}
                  placeholder=" API Token"
                  className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8]   resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                ></textarea>
                {state.FormErrors.APIToken && (
                  <div className="flex items-center mt-1 ml-2">
                    <CircleAlert size={14} className="text-red-500" />
                    <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.APIToken}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {state.CurrentAdapter === 'LLM Config' && (
        <LLMEnginesMaster 
          onBack={() => setState({ CurrentAdapter: '' })}
        />
      )}

      {state.CurrentAdapter === 'SAP Config' && (
        <div className=" w-full pt-2">
          <div className="flex justify-between items-center pb-4">
            <div
              onClick={() => setState({ CurrentAdapter: '' })}
              className="flex items-center cursor-pointer bg-[#f3f3f3]  w-fit px-4 py-1 rounded-full"
            >
              <ChevronLeft className="text-gray-700" /> <span className="font-medium text-sm text-gray-700"> Back</span>
            </div>
            <p className="font-semibold">{state.CurrentAdapter}</p>
            <div className="flex items-center">
              <button className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            <div className="">
              <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                Host<span className="text-red-500">*</span>
              </label>
              <input
                value={state.SAPConfigAddEditObj.Host}
                type="text"
                id="client"
                name="client"
                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter HostName"
                required
              />
              {state.FormErrors.HostName && (
                <div className="flex items-center mt-1 ml-2">
                  <CircleAlert size={14} className="text-red-500" />
                  <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.HostName}</p>
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
                Port<span className="text-red-500">*</span>
              </label>
              <input
                value={state.SAPConfigAddEditObj.Port}
                type="text"
                id="client"
                name="client"
                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Port"
                required
              />
              {state.FormErrors.HostName && (
                <div className="flex items-center mt-1 ml-2">
                  <CircleAlert size={14} className="text-red-500" />
                  <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.HostName}</p>
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
                User Name<span className="text-red-500">*</span>
              </label>
              <input
                value={state.SAPConfigAddEditObj.UserName}
                type="text"
                id="client"
                name="client"
                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter UserName"
                required
              />
              {state.FormErrors.HostName && (
                <div className="flex items-center mt-1 ml-2">
                  <CircleAlert size={14} className="text-red-500" />
                  <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.HostName}</p>
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
                Password<span className="text-red-500">*</span>
              </label>
              <input
                value={state.SAPConfigAddEditObj.Password}
                type="Password"
                id="client"
                name="client"
                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Password"
                required
              />
              {state.FormErrors.Email && (
                <div className="flex items-center mt-1 ml-2">
                  <CircleAlert size={14} className="text-red-500" />
                  <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.Email}</p>
                </div>
              )}
            </div>
            <div className="">
              <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                Database<span className="text-red-500">*</span>
              </label>
              <input
                value={state.SAPConfigAddEditObj.DATABASE}
                type="text"
                id="client"
                name="client"
                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Database Name"
                required
              />
            </div>
          </div>
        </div>
      )}

      {state.CurrentAdapter === 'SFDC' && (
        <div className=" w-full pt-2">
          <div className="flex justify-between items-center pb-4">
            <div
              onClick={() => setState({ CurrentAdapter: '' })}
              className="flex items-center cursor-pointer bg-[#f3f3f3]  w-fit px-4 py-1 rounded-full"
            >
              <ChevronLeft className="text-gray-700" /> <span className="font-medium text-sm text-gray-700"> Back</span>
            </div>
            <p className="font-semibold">{state.CurrentAdapter}</p>
            <div className="flex items-center">
              <button className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            <div className="">
              <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                User Name<span className="text-red-500">*</span>
              </label>
              <input
                value={state.SFDCAddEditObj.Email}
                type="text"
                id="client"
                name="client"
                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Email"
                required
              />
              {state.FormErrors.HostName && (
                <div className="flex items-center mt-1 ml-2">
                  <CircleAlert size={14} className="text-red-500" />
                  <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.HostName}</p>
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
                Password<span className="text-red-500">*</span>
              </label>
              <input
                onChange={(e) => handleChangeClientInfo(e, 'Email')}
                value={state.SFDCAddEditObj.Password}
                type="Password"
                id="client"
                name="client"
                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Email"
                required
              />
              {state.FormErrors.Email && (
                <div className="flex items-center mt-1 ml-2">
                  <CircleAlert size={14} className="text-red-500" />
                  <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.Email}</p>
                </div>
              )}
            </div>
            <div className=" ">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="name" className=" text-[0.90rem] text-[#2C3E50] font-medium">
                  API Token<span className="text-red-500">*</span>
                </label>
              </div>

              <div className="relative">
                <textarea
                  onChange={(e) => handleChangeClientInfo(e, 'APIToken')}
                  value={state.SFDCAddEditObj.APIToken}
                  id="name"
                  name="name"
                  rows={4}
                  maxLength={2000}
                  placeholder=" API Token"
                  className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8]   resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                ></textarea>
                {state.FormErrors.APIToken && (
                  <div className="flex items-center mt-1 ml-2">
                    <CircleAlert size={14} className="text-red-500" />
                    <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.APIToken}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
