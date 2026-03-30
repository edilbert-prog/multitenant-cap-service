import React, { useEffect, useReducer, useRef } from 'react';
import CustomTable from '../../../utils/CustomTable';
import { CircleAlert, Plus, Save, SquarePen, Trash2, X } from 'lucide-react';
import { apiRequest } from '../../../utils/helpers/ApiHelper';
import Spinner from '../../../utils/Spinner';
import ErrorScreen from '../../../utils/ErrorScreen';
import Pagination from '../../../utils/Pagination';
import Toast from '../../../utils/Toast';
import ConfirmPopup from '../../../utils/ConfirmPopup';
import Dropdown from '../../../utils/Dropdown';
import { hasChanges } from '../../../utils/helpers/dataComparison';

// Type declaration for JS module without types
declare module '../../../utils/helpers/useDebounce' {
  export default function useDebounce<T>(value: T, delay: number): T;
}
import useDebounce from '../../../utils/helpers/useDebounce';

interface TestingTypeItem {
  TestingTypeId: string;
  TestingType: string;
  Description: string;
  ClientName?: string;
  [key: string]: string | number | undefined;
}

interface GetTestingTypesResponse {
  ResponseData: TestingTypeItem[];
  TotalRecords: number;
}

interface BaseApiResponse {
  [key: string]: unknown;
}

type ValidateFieldKeys = 'TestingType';
type FormErrors = Partial<Record<ValidateFieldKeys, string>>;

interface State {
  ActionType: '' | 'Add' | 'Update';
  Error: string;
  SearchQuery: string;
  CurrentPage: number;
  TotalRecords: number;
  TestingTypesMaster: TestingTypeItem[];
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
  toastMessage: string;
  toastType: 'success' | 'fail' | 'warning' | 'info';
  originalCurrAddEditObj: TestingTypeItem | null;
  isDataExist: string;
  ClientBusinessUnitActionType: string;
  CurrAddEditObj: TestingTypeItem;
  ValidateFields: Record<ValidateFieldKeys, string>;
  FormErrors: FormErrors;
}

type Props = {
  children?: React.ReactNode;
};

interface TableColumn {
  title: string;
  key: string;
  className?: string;
}

interface DataRow {
  TestingTypeId: string;
  TestingType: string;
  Description: string;
  actions: React.ReactNode;
}

export default function TestingTypesMaster(_: Props) {
  const initialState: State = {
    ActionType: '',
    Error: '',
    SearchQuery: '',
    CurrentPage: 1,
    TotalRecords: 1,
    TestingTypesMaster: [],
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
    toastMessage: '',
    toastType: 'success',
    originalCurrAddEditObj: null,
    isDataExist: '',
    ClientBusinessUnitActionType: '',
    CurrAddEditObj: {
      TestingTypeId: '',
      TestingType: '',
      Description: '',
    },
    ValidateFields: {
      TestingType: '',
    },
    FormErrors: {},
  };

  const [state, setState] = useReducer(
    (prev: State, next: Partial<State>): State => ({ ...prev, ...next }),
    initialState
  );

  const didFetchData = useRef<boolean>(false);
  useEffect((): void => {
    if (didFetchData.current) return;
    didFetchData.current = true;

    const init = async (): Promise<void> => {
      setState({ IsLoading: true });

      await Promise.all([getData('')]);

      setState({ IsLoading: false });
    };

    void init();
  }, []);

  const getData = async (SearchQuery = '', PageNo = 1): Promise<void> => {
    try {
      const resp = (await apiRequest('/GetTestingTypesMasterPaginationFilterSearch', {
        PageNo,
        StartDate: '',
        EndDate: '',
        SearchString: SearchQuery,
      })) as GetTestingTypesResponse;

      if (resp.ResponseData.length > 0) {
        setState({ TestingTypesMaster: resp.ResponseData, TotalRecords: resp.TotalRecords });
      } else {
        setState({ TestingTypesMaster: [], TotalRecords: 0 });
      }
    } catch (err: unknown) {
      setState({ Error: err instanceof Error ? err.message : String(err) });
    } finally {
      setState({ IsLoading: false });
    }
  };

  const handleAddClient = (): void => {
    const CurrAddEditObj: TestingTypeItem = {
      TestingTypeId: '',
      TestingType: '',
      Description: '',
    };
    setState({ ActionType: 'Add', CurrAddEditObj });
  };

  const handleEdit = (item: TestingTypeItem): void => {
    setState({
      ActionType: 'Update',
      CurrAddEditObj: { ...item }, // Create a shallow copy for editing
      originalCurrAddEditObj: item, // Store the original item for comparison
    });
  };

  const handleCancel = (): void => {
    const CurrAddEditObj: TestingTypeItem = {
      TestingTypeId: '',
      TestingType: '',
      Description: '',
    };
    setState({ ActionType: '', CurrAddEditObj, originalCurrAddEditObj: null });
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

  const debouncedQuery = useDebounce<string | undefined>(state.CurrAddEditObj.ClientName as string | undefined, 500);

  const checkIfDataExist = async (query: string | undefined): Promise<void> => {
    const resp = (await apiRequest('/CheckClientsMaster', {
      ClientName: query,
    })) as { ClientsMaster: unknown[] } | null;
    if (resp && Array.isArray(resp.ClientsMaster) && resp.ClientsMaster.length > 0) {
      setState({ isDataExist: 'Client already existed' });
    } else {
      setState({ isDataExist: '' });
    }
  };
  if (false) {
    void checkIfDataExist(debouncedQuery);
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setState({ SearchQuery: value });
    if (value.trim() === '') {
      void getData('');
    }
  };

  const handleChangeClientInfo = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    name: keyof TestingTypeItem
  ): void => {
    const CurrAddEditObj: TestingTypeItem = { ...state.CurrAddEditObj, [name]: e.target.value };
    setState({ CurrAddEditObj });
  };

  const validateClientInfoForm = (): boolean => {
    const FormErrors: FormErrors = {};
    let formIsValid = true;

    const emailRegex = "";
    for (const name in state.ValidateFields) {
      const key = name as ValidateFieldKeys;
      const value = state.CurrAddEditObj[key];

      if (value === '' || value === 0 || value === undefined) {
        formIsValid = false;
        FormErrors[key] = 'This field is required';
      } else {
        if (key === 'EmailId' && typeof value === 'string' && !emailRegex.test(value)) {
          formIsValid = false;
          // @ts-expect-error EmailId is not part of ValidateFieldKeys; preserved logic
          FormErrors[key] = 'Please enter a valid email address';
        } else {
          FormErrors[key] = '';
        }
      }
    }
    setState({ FormErrors });
    return formIsValid;
  };

  const handleDeleteItem = async (item: TestingTypeItem): Promise<void> => {
    const resp = (await apiRequest('/DeleteTestingTypesMaster', item)) as BaseApiResponse | boolean | null;
    if (resp) {
      setState({
        showToast: true,
        toastMessage: 'Deleted successfully!',
        toastType: 'success',
      });
      void getData();
      setTimeout((): void => {
        setState({ showToast: false, toastMessage: '', toastType: 'success' });
      }, 3000);
    } else {
      setState({ showToast: true, toastMessage: 'Deletion failed!', toastType: 'fail' });
    }
  };

  const handlePageChange = (page: number): void => {
    // eslint-disable-next-line no-console
    console.log('page', page);
    setState({ CurrentPage: page });
    void getData(state.SearchQuery, page);
  };

  const handleSubmitClientInfo = async (): Promise<void> => {
    if (!validateClientInfoForm()) {
      return;
    }

    // Check for changes if in 'Update' mode
    if (state.ActionType === 'Update' && state.originalCurrAddEditObj) {
      if (!hasChanges(state.originalCurrAddEditObj, state.CurrAddEditObj)) {
        setState({
          showToast: true,
          toastMessage: 'Data not changed',
          toastType: 'info',
        });
        setTimeout(() => setState({ showToast: false, toastMessage: '', toastType: 'success' }), 3000);
        return;
      }
    }

    setState({ SavingLoader: true });
    const resp = (await apiRequest('/AddUpdateTestingTypesMaster ', state.CurrAddEditObj)) as BaseApiResponse | null;
    if (resp) {
      setState({
        SavingLoader: false,
        showToast: true,
        toastMessage: 'Saved successfully!',
        toastType: 'success',
        ActionType: '',
        originalCurrAddEditObj: null,
      });
      void getData();
      setTimeout((): void => {
        setState({ showToast: false, toastMessage: '', toastType: 'success' });
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
    { title: '#ID', key: 'TestingTypeId', className: 'max-w-[30px]' },
    { title: 'Testing Type', key: 'TestingType' },
    { title: 'Description', key: 'Description' },
  ];

  const data: DataRow[] = state.TestingTypesMaster.map((v) => ({
    TestingTypeId: v.TestingTypeId,
    TestingType: v.TestingType,
    Description: v.Description,
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
      <Toast
        message={state.toastMessage}
        show={state.showToast}
        type={state.toastType}
        onClose={() => setState({ showToast: false })}
      />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            <div className="">
              <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                {' '}
                Testing Type <span className="text-red-500">*</span>
              </label>
              <input
                onChange={(e): void => handleChangeClientInfo(e, 'TestingType')}
                value={state.CurrAddEditObj.TestingType}
                type="text"
                id="client"
                name="client"
                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter TestingType"
                required
              />
              {state.FormErrors.TestingType && (
                <div className="flex items-center mt-1 ml-2">
                  <CircleAlert size={14} className="text-red-500" />
                  <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.TestingType}</p>
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
                  Description
                </label>
              </div>

              <div className="relative">
                <textarea
                  onChange={(e): void => handleChangeClientInfo(e, 'Description')}
                  value={state.CurrAddEditObj.Description}
                  id="name"
                  name="name"
                  rows={4}
                  maxLength={2000}
                  placeholder="Description"
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
                <span>Add</span>
              </button>
            </div>
          </div>
          <CustomTable columns={columns} data={data} responsive={true} />
          {state.TotalRecords > 10 && (
            <div className="pt-4 flex justify-end">
              <Pagination total={state.TotalRecords} current={state.CurrentPage} pageSize={10} onChange={handlePageChange} showSizeChanger={false} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
