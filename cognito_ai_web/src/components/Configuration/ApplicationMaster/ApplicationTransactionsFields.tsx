import React, { useEffect, useReducer, useRef } from 'react';
import CustomTable from '../../../utils/CustomTable';
import { CircleAlert, Plus, Save, SquarePen, Trash2, X } from 'lucide-react';
import { apiRequest } from '../../../utils/helpers/ApiHelper';
import Spinner from '../../../utils/Spinner';
import ErrorScreen from '../../../utils/ErrorScreen';
import Pagination from '../../../utils/Pagination';
import Toast from '../../../utils/Toast';
import useDebounce from '../../../utils/helpers/useDebounce';
import Dropdown from '../../../utils/Dropdown';
import PhoneNumberInput from '../../../utils/PhoneNumberInput';
import ConfirmPopup from '../../../utils/ConfirmPopup';

type Props = {
  CurrClientDetails: any;
  children?: React.ReactNode;
};

interface CurrAddEditObj {
  ClientId: string;
  BusinessUnitId: string;
  CompanyCodeERP?: string;
  CountryId?: string;
  StateId?: string;
  CityId?: string;
  CountryCode?: string;
  Contact?: string;
  Email?: string;
  Zip?: string;
  Address1?: string;
  Address2?: string;
  ClientName?: string;
  [key: string]: unknown;
}

interface State {
  ActionType: string;
  Error: string;
  SearchQuery: string;
  CurrentPage: number;
  TotalRecords: number;
  ClientBusinessUnitsMaster: any[];
  BusinessUnitsList: any[];
  Countries: any[];
  CountryCodes: any[];
  States: any[];
  Cities: any[];
  ViewClientDetails: boolean;
  IsLoading: boolean;
  showToast: boolean;
  SavingLoader: boolean;
  isDataExist: string;
  ClientBusinessUnitActionType: string;
  CurrAddEditObj: CurrAddEditObj;
  ValidateFields: Record<string, string>;
  FormErrors: Record<string, string>;
}

export default function ApplicationTransactionsFields(props: Props) {
  const initialState: State = {
    ActionType: '',
    Error: '',
    SearchQuery: '',
    CurrentPage: 1,
    TotalRecords: 0,
    ClientBusinessUnitsMaster: [],
    BusinessUnitsList: [],
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
      ClientId: '',
      BusinessUnitId: '',
    },
    ValidateFields: {
      BusinessUnitId: '',
    },
    FormErrors: {},
  };

  const [state, setState] = useReducer(
      (s: State, ns: Partial<State>): State => ({ ...s, ...ns }),
      initialState
  );

  const didFetchData = useRef<boolean>(false);
  useEffect(() => {
    if (didFetchData.current) return;
    didFetchData.current = true;

    const init = async () => {
      setState({ IsLoading: true });

      await Promise.all([getData(''), getBusinessUnitsList()]);

      setState({ IsLoading: false });
    };

    void init();
  }, []);

  const getBusinessUnitsList = async (): Promise<void> => {
    try {
      const resp: any = await apiRequest('/GetBusinessUnitMaster', {});
      setState({
        BusinessUnitsList: resp.ResponseData,
      });
    } catch (err) {
      console.error('Error loading Country/State/City:', err);
    }
  };

  const getCountryStateCity = async (CountryId: string = '', StateId: string = ''): Promise<void> => {
    try {
      const resp: any = await apiRequest('/global-constants/GetCountriesStatesCities', {
        CountryId,
        StateId,
      });
      const CountryCodes = resp.Countries.map((v: any) => {
        const phoneCode = String(v.phonecode).replace('+', '');
        return { value: `${v.CountryId}`, label: `${v.iso2} (+${phoneCode})` };
      });

      setState({
        Countries: resp.Countries || [],
        CountryCodes,
        States: resp.States || [],
        Cities: resp.Cities || [],
      });
    } catch (err) {
      console.error('Error loading Country/State/City:', err);
    }
  };

  const getData = async (SearchQuery: string = '', PageNo: number = 1): Promise<void> => {
    try {
      const resp: any = await apiRequest('/GetClientBusinessUnitMasterPaginationFilterSearch', {
        ClientId: props.CurrClientDetails.ClientId,
        PageNo,
        StartDate: '',
        EndDate: '',
        SearchString: SearchQuery,
      });
      if (resp.ResponseData.length > 0) {
        setState({
          ClientBusinessUnitsMaster: resp.ResponseData,
          TotalRecords: resp.TotalRecords,
        });
      } else {
        setState({ ClientBusinessUnitsMaster: [], TotalRecords: 0 });
      }
    } catch (err: any) {
      setState({ Error: err.toString() });
    } finally {
      setState({ IsLoading: false });
    }
  };

  const handleAddClient = (): void => {
    const CurrAddEditObj: CurrAddEditObj = {
      ClientId: '',
      BusinessUnitId: '',
    };
    setState({ ActionType: 'Add', CurrAddEditObj });
  };

  const handleEdit = (item: any): void => {
    void getCountryStateCity(item.CountryId, item.StateId);
    setState({ ActionType: 'Update', CurrAddEditObj: item });
  };

  const handleCancel = (): void => {
    const CurrAddEditObj: CurrAddEditObj = {
      ClientId: '',
      BusinessUnitId: '',
    };
    setState({ ActionType: '', CurrAddEditObj });
    void getData('');
  };

  const debouncedSearchQuery: string = (useDebounce as <T>(v: T, d: number) => T)(state.SearchQuery, 300);
  const didSearchRun = useRef<boolean>(false);

  useEffect(() => {
    if (!didSearchRun.current) {
      didSearchRun.current = true;
      return;
    }
    if (debouncedSearchQuery.trim() === '') return;
    void getData(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  const debouncedQuery = (useDebounce as <T>(v: T, d: number) => T)(state.CurrAddEditObj.ClientName, 500);

  const checkIfDataExist = async (query: string): Promise<void> => {
    const resp: any = await apiRequest('/CheckClientsMaster', {
      ClientName: query,
    });
    if (resp.ClientsMaster.length > 0) {
      setState({ isDataExist: 'Client already existed' });
    } else {
      setState({ isDataExist: '' });
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setState({ SearchQuery: value });
    if (value.trim() === '') {
      void getData('');
    }
  };

  const handlePageChange = (page: number): void => {
    setState({ CurrentPage: page });
    void getData(state.SearchQuery, page);
  };

  const handleChangeClientInfo = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      name: keyof CurrAddEditObj
  ): void => {
    const CurrAddEditObj = { ...state.CurrAddEditObj };
    CurrAddEditObj[name] = e.target.value;
    setState({ CurrAddEditObj });
  };

  const validateClientInfoForm = (): boolean => {
    const FormErrors: Record<string, string> = {};
    let formIsValid = true;

    const emailRegex = "";
    for (const name in state.ValidateFields) {
      const value = state.CurrAddEditObj[name];
      if (value === '' || value === 0) {
        formIsValid = false;
        FormErrors[name] = 'This field is required';
      } else {
        if (name === 'EmailId' && !emailRegex.test(String(value))) {
          formIsValid = false;
          FormErrors[name] = 'Please enter a valid email address';
        } else {
          FormErrors[name] = '';
        }
      }
    }
    setState({
      FormErrors,
    });
    return formIsValid;
  };

  const handleClientInfoContactChange = (val: string): void => {
    const CurrAddEditObj = { ...state.CurrAddEditObj };
    CurrAddEditObj.Contact = val;
    setState({ CurrAddEditObj });
  };

  const handleDeleteItem = async (item: any): Promise<void> => {
    const resp: any = await apiRequest('/DeleteClientBusinessUnitMaster ', item);
    if (resp) {
      setState({ showToast: true });
      void getData();
      setTimeout(() => {
        setState({ showToast: false });
      }, 3000);
    }
  };

  const handleClientInfoCountryCodeChange = (val: string): void => {
    const CurrAddEditObj = { ...state.CurrAddEditObj };
    CurrAddEditObj.CountryCode = val;
    setState({ CurrAddEditObj });
  };

  const handleDropdownClientInfo = (val: string, options: any, _name: string): void => {
    let CurrAddEditObj = { ...state.CurrAddEditObj };
    CurrAddEditObj = options;
    setState({ CurrAddEditObj });
    void getCountryStateCity(options.CountryId, options.StateId);
  };

  const handleSubmitClientInfo = async (): Promise<void> => {
    if (!validateClientInfoForm()) {
      return;
    }
    setState({ SavingLoader: true });
    const reqObj = {
      ClientId: props?.CurrClientDetails?.ClientId,
      BusinessUnitMaster: [state.CurrAddEditObj],
    };
    const resp: any = await apiRequest('/AddClientBusinessUnitMaster ', reqObj);
    if (resp) {
      setState({ SavingLoader: false, showToast: true, ActionType: '' });
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
    { title: 'ClientName', key: 'ClientName' },
    { title: 'Business Unit Name', key: 'BusinessUnitName' },
    { title: 'Company Code in ERP', key: 'CompanyCodeERP' },
    { title: 'Email', key: 'Email' },
    { title: 'Location', key: 'Location' },
    { title: 'Address1', key: 'Address1', className: 'min-w-[400px]' },
  ];

  const data: any[] = state.ClientBusinessUnitsMaster.map((v: any) => ({
    ClientName: v.ClientName,
    BusinessUnitName: v.BusinessUnitName,
    CompanyCodeERP: v.CompanyCodeERP,
    Email: v.Email,
    Location: `${v.CityName}, ${v.StateName}, ${v.CountryName}.`,
    Address1: v.Address1,
    actions: (
        <div className="relative flex items-center">
          <ConfirmPopup message="Are you sure you want to delete this item?" onConfirm={() => handleDeleteItem(v)}>
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
                      onClick={() => {
                        if (!state.SavingLoader) handleSubmitClientInfo();
                      }}
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
                  <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                    Business Unit <span className="text-red-500">*</span>
                  </label>
                  <Dropdown
                      mode="single"
                      options={state.BusinessUnitsList}
                      value={state.CurrAddEditObj.BusinessUnitId as string}
                      onChange={(val: string, item: any) => handleDropdownClientInfo(val, item, 'BusinessUnitId')}
                      onSearch={(q: string) => console.log('Search (Multi):', q)}
                  />

                  {state.FormErrors.BusinessUnitId && (
                      <div className="flex items-center mt-1 ml-2">
                        <CircleAlert size={14} className="text-red-500" />
                        <p className="text-red-500 text-sm ">{state.FormErrors.BusinessUnitId}</p>
                      </div>
                  )}
                </div>

                <div className="">
                  <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                    Company Code <span className="text-[0.75rem]">(In ERP System)</span>
                  </label>
                  <input
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChangeClientInfo(e, 'CompanyCodeERP')}
                      value={(state.CurrAddEditObj.CompanyCodeERP as string) || ''}
                      type="text"
                      id="client"
                      name="client"
                      className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder=""
                      required
                  />
                </div>
                <div className="">
                  <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <Dropdown
                      Disabled={true}
                      mode="single"
                      options={state.Countries}
                      value={state.CurrAddEditObj.CountryId as string}
                      onChange={(val: string, item: any) => handleDropdownClientInfo(val, item, 'CountryId')}
                      onSearch={(q: string) => console.log('Search (Multi):', q)}
                  />

                  {state.FormErrors.CountryId && (
                      <div className="flex items-center mt-1 ml-2">
                        <CircleAlert size={14} className="text-red-500" />
                        <p className="text-red-500 text-sm ">{state.FormErrors.CountryId}</p>
                      </div>
                  )}
                </div>
                <div className="">
                  <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <Dropdown
                      Disabled={true}
                      mode="single"
                      options={state.States}
                      value={state.CurrAddEditObj.StateId as string}
                      onChange={(val: string, item: any) => handleDropdownClientInfo(val, item, 'StateId')}
                      onSearch={(q: string) => console.log('Search (Multi):', q)}
                  />
                  {state.FormErrors.StateId && (
                      <div className="flex items-center mt-1 ml-2">
                        <CircleAlert size={14} className="text-red-500" />
                        <p className="text-red-500 text-sm ">{state.FormErrors.StateId}</p>
                      </div>
                  )}
                </div>
                <div className="">
                  <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <Dropdown
                      Disabled={true}
                      mode="single"
                      options={state.Cities}
                      value={state.CurrAddEditObj.CityId as string}
                      onChange={(val: string, item: any) => handleDropdownClientInfo(val, item, 'CityId')}
                      onSearch={(q: string) => console.log('Search (Multi):', q)}
                  />
                  {state.FormErrors.CityId && (
                      <div className="flex items-center mt-1 ml-2">
                        <CircleAlert size={14} className="text-red-500" />
                        <p className="text-red-500 text-sm ">{state.FormErrors.CityId}</p>
                      </div>
                  )}
                </div>
                <div className="">
                  <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                    Contact
                  </label>
                  <PhoneNumberInput
                      disabled={true}
                      countryOptions={state.CountryCodes}
                      countryCode={state.CurrAddEditObj.CountryCode as string}
                      onCountryChange={handleClientInfoCountryCodeChange}
                      phoneNumber={state.CurrAddEditObj.Contact as string}
                      onPhoneChange={handleClientInfoContactChange}
                  />
                </div>
                <div className="">
                  <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                      disabled={true}
                      readOnly={true}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChangeClientInfo(e, 'Email')}
                      value={(state.CurrAddEditObj.Email as string) || ''}
                      type="text"
                      id="client"
                      name="client"
                      className="w-full px-4 shadow text-[0.85rem] text-[#6f6f6f] bg-[#ebebeb]    py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder=""
                      required
                  />
                  {state.FormErrors.Email && (
                      <div className="flex items-center mt-1 ml-2">
                        <CircleAlert size={14} className="text-red-500" />
                        <p className="text-red-500 text-sm ">{state.FormErrors.Email}</p>
                      </div>
                  )}
                </div>
                <div className="">
                  <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                    Zipcode
                  </label>
                  <input
                      disabled={true}
                      readOnly={true}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChangeClientInfo(e, 'Zip')}
                      value={(state.CurrAddEditObj.Zip as string) || ''}
                      type="text"
                      id="client"
                      name="client"
                      className="w-full px-4 shadow text-[0.85rem] text-[#6f6f6f] bg-[#ebebeb]   py-2 border border-gray-200 rounded-md    focus:outline-none focus:ring-2 focus:ring-blue-300"
                      placeholder=""
                      required
                  />
                </div>
                <div className=" ">
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="name" className=" text-[0.90rem] text-[#2C3E50] font-medium">
                      Address 1
                    </label>
                  </div>

                  <div className="relative">
                <textarea
                    disabled={true}
                    readOnly={true}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChangeClientInfo(e, 'Address1')}
                    value={(state.CurrAddEditObj.Address1 as string) || ''}
                    id="name"
                    name="name"
                    rows={1}
                    maxLength={2000}
                    placeholder="Address1"
                    className="w-full px-4 shadow text-[0.85rem] py-2 pr-10 text-gray-700 border border-blue-300 rounded-md text-[#6f6f6f] bg-[#ebebeb]    resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                ></textarea>

                    <div className="absolute bottom-2 right-2">
                      <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 13l4 4L16 7" stroke="currentColor" strokeWidth="2" fill="none" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className=" ">
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="name" className=" text-[0.90rem] text-[#2C3E50] font-medium">
                      Address 2
                    </label>
                  </div>

                  <div className="relative">
                <textarea
                    disabled={true}
                    readOnly={true}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChangeClientInfo(e, 'Address2')}
                    value={(state.CurrAddEditObj.Address2 as string) || ''}
                    id="name"
                    name="name"
                    rows={4}
                    maxLength={2000}
                    placeholder="Address2"
                    className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md text-[#6f6f6f] bg-[#ebebeb]     resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                ></textarea>

                    <div className="absolute bottom-2 right-2">
                      <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 13l4 4L16 7" stroke="currentColor" strokeWidth="2" fill="none" />
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
                  <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
      </div>
  );
}
