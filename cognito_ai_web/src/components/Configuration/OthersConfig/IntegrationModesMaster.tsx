import React, { useEffect, useReducer, useRef } from 'react';
import CustomTable from '../../../utils/CustomTable';
import { CircleAlert, Plus, Save, SquarePen, Trash2, X } from 'lucide-react';
import { apiRequest } from '../../../utils/helpers/ApiHelper';
import Spinner from '../../../utils/Spinner';
import ErrorScreen from '../../../utils/ErrorScreen';
import Pagination from '../../../utils/Pagination';
import Toast from '../../../utils/Toast';
import ConfirmPopup from '../../../utils/ConfirmPopup';

// Type declaration for JS module without types
declare module '../../../utils/helpers/useDebounce' {
  export default function useDebounce<T>(value: T, delay: number): T;
}
import useDebounce from '../../../utils/helpers/useDebounce';

type IntegrationModeKey = 'IntegrationModeId' | 'IntegrationMode';

interface IntegrationMode {
  IntegrationModeId: string;
  IntegrationMode: string;
  ApplicationId?: string | number;
}

interface GetIntegrationModesMasterResponse {
  ResponseData: IntegrationMode[];
  TotalRecords: number;
}

interface BaseApiResponse {
  [key: string]: unknown;
}

type FormErrors = Partial<Record<IntegrationModeKey | 'EmailId', string>>;

interface State {
  ActionType: '' | 'Add' | 'Update';
  Error: string;
  SearchQuery: string;
  CurrentPage: number;
  TotalRecords: number;
  IntegrationModesMaster: IntegrationMode[];
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
  CurrAddEditObj: IntegrationMode;
  ValidateFields: Record<'IntegrationMode', string>;
  FormErrors: FormErrors;
}

type Props = {
  CurrAppDetails?: {
    ApplicationId?: string | number;
  };
  children?: React.ReactNode;
};

interface TableColumn {
  title: string;
  key: string;
}

interface DataRow {
  IntegrationModeId: string;
  IntegrationMode: string;
  actions: React.ReactNode;
}

export default function IntegrationModesMaster(props: Props) {
  const initialState: State = {
    ActionType: '',
    Error: '',
    SearchQuery: '',
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
    isDataExist: '',
    ClientBusinessUnitActionType: '',
    CurrAddEditObj: {
      IntegrationModeId: '',
      IntegrationMode: '',
    },
    ValidateFields: {
      IntegrationMode: '',
    },
    FormErrors: {},
  };

  const [state, setState] = useReducer(
    (prev: State, next: Partial<State>): State => ({ ...prev, ...next }),
    initialState
  );

  const didFetchData = useRef<boolean>(false);

  useEffect(() => {
    if (didFetchData.current) return;
    didFetchData.current = true;

    const init = async (): Promise<void> => {
      setState({ IsLoading: true });

      await Promise.all([getData('')]);

      setState({ IsLoading: false });
    };

    void init();
  }, []);

  const getData = async (SearchQuery = ''): Promise<void> => {
    try {
      const resp = (await apiRequest('/GetIntegrationModesMaster', {
        StartDate: '',
        EndDate: '',
        SearchString: SearchQuery,
      })) as GetIntegrationModesMasterResponse;

      if (resp.ResponseData.length > 0) {
        setState({
          IntegrationModesMaster: resp.ResponseData,
          TotalRecords: resp.TotalRecords,
          CurrentPage: 1,
        });
      } else {
        setState({ IntegrationModesMaster: [], TotalRecords: 0, CurrentPage: 1 });
      }
    } catch (err: unknown) {
      setState({ Error: (err instanceof Error ? err.message : String(err)) });
    } finally {
      setState({ IsLoading: false });
    }
  };

  const handleAddClient = (): void => {
    const CurrAddEditObj: IntegrationMode = {
      IntegrationModeId: '',
      IntegrationMode: '',
    };
    setState({ ActionType: 'Add', CurrAddEditObj });
  };

  const handleEdit = (item: IntegrationMode): void => {
    setState({ ActionType: 'Update', CurrAddEditObj: item });
  };

  const handleCancel = (): void => {
    const CurrAddEditObj: IntegrationMode = {
      IntegrationModeId: '',
      IntegrationMode: '',
    };
    setState({ ActionType: '', CurrAddEditObj });
    void getData('');
  };

  const debouncedSearchQuery = useDebounce<string>(state.SearchQuery, 300);
  const didSearchRun = useRef<boolean>(false);

  useEffect(() => {
    if (!didSearchRun.current) {
      didSearchRun.current = true;
      return;
    }
    if (debouncedSearchQuery.trim() === '') return;
    void getData(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setState({ SearchQuery: value });
    if (value.trim() === '') {
      void getData('');
    }
  };

  const handleChangeClientInfo = (
    e: React.ChangeEvent<HTMLInputElement>,
    name: keyof IntegrationMode
  ): void => {
    const CurrAddEditObj: IntegrationMode = { ...state.CurrAddEditObj, [name]: e.target.value };
    setState({ CurrAddEditObj });
  };

  const validateClientInfoForm = (): boolean => {
    const FormErrors: FormErrors = {};
    let formIsValid = true;

    const emailRegex = "";
    for (const name in state.ValidateFields) {
      const key = name as keyof State['ValidateFields'];
      const value = state.CurrAddEditObj[key as keyof IntegrationMode] as unknown as string | number | undefined;

      if (value === '' || value === 0 || value === undefined) {
        formIsValid = false;
        FormErrors[key] = 'This field is required';
      } else {
        if (key === 'EmailId' && typeof value === 'string' && !emailRegex.test(value)) {
          formIsValid = false;
          FormErrors[key] = 'Please enter a valid email address';
        } else {
          FormErrors[key] = '';
        }
      }
    }
    setState({ FormErrors });
    return formIsValid;
  };

  const handleDeleteItem = async (item: IntegrationMode): Promise<void> => {
    const resp = (await apiRequest('/DeleteIntegrationModesMaster', item)) as BaseApiResponse | boolean | null;
    if (resp) {
      setState({ showToast: true });
      void getData();
      setTimeout((): void => {
        setState({ showToast: false });
      }, 3000);
    }
  };

  const handleSubmitClientInfo = async (): Promise<void> => {
    if (!validateClientInfoForm()) {
      return;
    }
    setState({ SavingLoader: true });
    const CurrAddEditObj: IntegrationMode = {
      ...state.CurrAddEditObj,
      ApplicationId: props?.CurrAppDetails?.ApplicationId,
    };
    const resp = (await apiRequest('/AddUpdateIntegrationModesMaster', CurrAddEditObj)) as BaseApiResponse | null;
    if (resp) {
      setState({ SavingLoader: false, showToast: true, ActionType: '' });
      void getData();
      setTimeout((): void => {
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

  const columns: ReadonlyArray<TableColumn> = [
    { title: '#ID', key: 'IntegrationModeId' },
    { title: 'Integration Mode', key: 'IntegrationMode' },
  ];

  const data: DataRow[] = state.IntegrationModesMaster.map((v) => ({
    IntegrationModeId: v.IntegrationModeId,
    IntegrationMode: v.IntegrationMode,
    actions: (
      <div className="relative flex items-center">
        <ConfirmPopup message="Are you sure you want to delete this item?" onConfirm={(): void => void handleDeleteItem(v)}>
          <button className=" pr-4 flex items-center">
            <Trash2 className="text-[#1A1A1A] cursor-pointer " />
          </button>
        </ConfirmPopup>
        <button onClick={(): void => handleEdit(v)} className=" ">
          <SquarePen className="text-[#1A1A1A] cursor-pointer" />
        </button>
      </div>
    ),
  }));

  return (
    <div className="  pt-0 pb-6 px-6 ">
      <Toast message="Saved successfully!" show={state.showToast} onClose={(): void => null} />
      {state.ActionType !== '' ? (
        <div className=" w-full pt-2">
          <div className="flex justify-end">
            <div className="flex items-center">
              {state.ActionType !== '' && (
                <button
                  onClick={handleCancel}
                  className="bg-white border border-[#2196F3] mr-6 text-[0.89rem] cursor-pointer text-[#0582E5] font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
                >
                  <X className="w-5 h-5" />
                  <span>CANCEL</span>
                </button>
              )}

              <button
                onClick={state.SavingLoader ? undefined : (): void => void handleSubmitClientInfo()}
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
                Integration Mode <span className="text-red-500">*</span>
              </label>
              <input
                onChange={(e): void => handleChangeClientInfo(e, 'IntegrationMode')}
                value={state.CurrAddEditObj.IntegrationMode}
                type="text"
                id="client"
                name="client"
                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder=" "
                required
              />
              {state.FormErrors.IntegrationMode && (
                <div className="flex items-center mt-1 ml-2">
                  <CircleAlert size={14} className="text-red-500" />
                  <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.IntegrationMode}</p>
                </div>
              )}
              {state.isDataExist && (
                <div className="flex items-center mt-1 ml-2">
                  <CircleAlert size={14} className="text-red-500" />
                  <p className="ml-2 text-red-500 text-sm ">{state.isDataExist}</p>
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
                <span>Add </span>
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
                onChange={(_c: number): void => {
                  // pagination change handler (no-op to preserve logic)
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
