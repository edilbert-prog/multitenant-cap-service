import React, { useEffect, useReducer, useRef } from 'react';
import CustomTable from '../../../utils/CustomTable';
import { CircleAlert, Plus, Save, SquarePen, Trash2, X } from 'lucide-react';
import { apiRequest } from '../../../utils/helpers/ApiHelper';
import Spinner from '../../../utils/Spinner';
import ErrorScreen from '../../../utils/ErrorScreen';
import Toast from '../../../utils/Toast';
import ConfirmPopup from '../../../utils/ConfirmPopup';

// Type declaration for JS module without types
declare module '../../../utils/helpers/useDebounce' {
  export default function useDebounce<T>(value: T, delay: number): T;
}
import useDebounce from '../../../utils/helpers/useDebounce';

interface FieldTypeItem {
  FieldTypeId: string;
  FieldType: string;
  Description: string;
  ClientName?: string;
  Contact?: string;
  CountryCode?: string;
  [key: string]: string | number | undefined;
}

interface GetFieldTypesMasterResponse {
  ResponseData: FieldTypeItem[];
  TotalRecords: number;
}

interface BaseApiResponse {
  [key: string]: unknown;
}

type FormErrors = Partial<Record<string, string>>;

interface State {
  ActionType: '' | 'Add' | 'Update';
  Error: string;
  SearchQuery: string;
  CurrentPage: number;
  TotalRecords: number;
  FieldTypesMaster: FieldTypeItem[];
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
  CurrAddEditObj: FieldTypeItem;
  ValidateFields: Record<string, string>;
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
  FieldTypeId: string;
  FieldType: string;
  Description: string;
  actions: React.ReactNode;
}

export default function FieldTypesMaster(_: Props) {
  const initialState: State = {
    ActionType: '',
    Error: '',
    SearchQuery: '',
    CurrentPage: 1,
    TotalRecords: 1,
    FieldTypesMaster: [],
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
    CurrAddEditObj: {
      FieldTypeId: '',
      FieldType: '',
      Description: '',
    },
    ValidateFields: {
      FieldType: '',
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
      const resp = (await apiRequest('/GetFieldTypesMaster', {
        StartDate: '',
        EndDate: '',
        SearchString: SearchQuery,
      })) as GetFieldTypesMasterResponse;

      if (resp.ResponseData.length > 0) {
        setState({ FieldTypesMaster: resp.ResponseData, TotalRecords: resp.TotalRecords, CurrentPage: 1 });
      } else {
        setState({ FieldTypesMaster: [], TotalRecords: 0, CurrentPage: 1 });
      }
    } catch (err: unknown) {
      setState({ Error: err instanceof Error ? err.message : String(err) });
    } finally {
      setState({ IsLoading: false });
    }
  };

  const handleAddClient = (): void => {
    const CurrAddEditObj: FieldTypeItem = {
      FieldTypeId: '',
      FieldType: '',
      Description: '',
    };
    setState({ ActionType: 'Add', CurrAddEditObj });
  };

  const handleEdit = (item: FieldTypeItem): void => {
    setState({ ActionType: 'Update', CurrAddEditObj: item });
  };

  const handleCancel = (): void => {
    const CurrAddEditObj: FieldTypeItem = {
      FieldTypeId: '',
      FieldType: '',
      Description: '',
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
    name: keyof FieldTypeItem
  ): void => {
    const CurrAddEditObj: FieldTypeItem = { ...state.CurrAddEditObj, [name]: e.target.value };
    setState({ CurrAddEditObj });
  };

  const validateClientInfoForm = (): boolean => {
    const FormErrors: FormErrors = {};
    let formIsValid = true;

    const emailRegex = "";
    for (const name in state.ValidateFields) {
      const value = state.CurrAddEditObj[name];
      if (value === '' || value === 0 || value === undefined) {
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
    }
    setState({ FormErrors });
    return formIsValid;
  };

  const handleClientInfoContactChange = (val: string): void => {
    const CurrAddEditObj: FieldTypeItem = { ...state.CurrAddEditObj, Contact: val };
    setState({ CurrAddEditObj });
  };
  const handleClientInfoCountryCodeChange = (val: string): void => {
    const CurrAddEditObj: FieldTypeItem = { ...state.CurrAddEditObj, CountryCode: val };
    setState({ CurrAddEditObj });
  };

  const handleDropdownClientInfo = (val: string, _options: unknown, name: keyof FieldTypeItem): void => {
    const CurrAddEditObj: FieldTypeItem = { ...state.CurrAddEditObj, [name]: val };
    setState({ CurrAddEditObj });
  };

  const handleDeleteItem = async (item: FieldTypeItem): Promise<void> => {
    const resp = (await apiRequest('/DeleteFieldTypesMaster', item)) as BaseApiResponse | boolean | null;
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
    const resp = (await apiRequest('/AddUpdateFieldTypesMaster ', state.CurrAddEditObj)) as BaseApiResponse | null;
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
    { title: '#ID', key: 'FieldTypeId', className: 'max-w-[30px]' },
    { title: 'Field Type', key: 'FieldType' },
    { title: 'Description', key: 'Description' },
  ];

  const data: DataRow[] = state.FieldTypesMaster.map((v) => ({
    FieldTypeId: v.FieldTypeId,
    FieldType: v.FieldType,
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            <div className="">
              <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                Field Type <span className="text-red-500">*</span>
              </label>
              <input
                onChange={(e): void => handleChangeClientInfo(e, 'FieldType')}
                value={state.CurrAddEditObj.FieldType}
                type="text"
                id="client"
                name="client"
                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter FieldType"
                required
              />
              {state.FormErrors.FieldType && (
                <div className="flex items-center mt-1 ml-2">
                  <CircleAlert size={14} className="text-red-500" />
                  <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.FieldType}</p>
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
          {/*{
              state.TotalRecords > 10 && <div className="pt-4 flex justify-end">
                  <Pagination
                      total={952}
                      current={2}
                      pageSize={10}
                      onChange={(c) => {

                      }}
                      showSizeChanger={false}
                  />
              </div>
          }*/}
        </>
      )}
    </div>
  );
}
