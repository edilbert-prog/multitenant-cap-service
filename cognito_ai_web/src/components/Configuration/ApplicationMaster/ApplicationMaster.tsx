import React, { useEffect, useReducer, useRef } from 'react';
import CustomTable from '../../../utils/CustomTable';
import { ChevronLeft, CircleAlert, Plus, Trash2 } from 'lucide-react';
import { apiRequest } from '../../../utils/helpers/ApiHelper';
import Spinner from '../../../utils/Spinner';
import ErrorScreen from '../../../utils/ErrorScreen';
import Pagination from '../../../utils/Pagination';
import PillGroup from '../../../utils/PillGroup';
import Modal from '../../../utils/Modal';
import Toast from '../../../utils/Toast';
import useDebounce from '../../../utils/helpers/useDebounce';
import ApplicationFeatures from './ApplicationFeatures';
import ApplicationTransactions from './ApplicationTransactions';
import ApplicationPrograms from './ApplicationPrograms';
import ApplicationIntegrations from './ApplicationIntegrations';
import ConfirmPopup from '../../../utils/ConfirmPopup';

type Props = {};

type PillKey =
    | 'ApplicationsInfo'
    | 'ApplicationTransactions'
    | 'ApplicationFeatures'
    | 'ApplicationPrograms'
    | 'ApplicationIntegrations';

interface PillItem {
  key: PillKey;
  label: string;
}

interface ApplicationDetails {
  ApplicationId: string;
  ApplicationName: string;
  Description: string;
  [key: string]: any;
}

interface ApplicationValidateFields {
  ApplicationName: string;
  [key: string]: string;
}

interface State {
  Error: string;
  SearchQuery: string;
  ApplicationMaster: ApplicationDetails[];
  ViewAppDetails: boolean;
  CurrentPage: number;
  TotalRecords: number;
  IsLoading: boolean;
  ViewDetails: boolean;
  openModal: boolean;
  showToast: boolean;
  SavingLoader: boolean;
  isDataExist: string;
  ClientBusinessUnitActionType: string;
  CurrPillActive: PillKey;
  CurrAppDetails: ApplicationDetails;
  ApplicationValidateFields: ApplicationValidateFields;
  ApplicationErrors: Record<string, string>;
  pillItems: PillItem[];
  CurrTab: string;
}

export default function ApplicationMaster(_props: Props) {
  const [state, setState] = useReducer(
      (s: State, ns: Partial<State>): State => ({ ...s, ...ns }),
      {
        Error: '',
        SearchQuery: '',
        ApplicationMaster: [],
        ViewAppDetails: false,
        CurrentPage: 1,
        TotalRecords: 0,
        IsLoading: true,
        ViewDetails: false,
        openModal: false,
        showToast: false,
        SavingLoader: false,
        isDataExist: '',
        ClientBusinessUnitActionType: '',
        CurrPillActive: 'ApplicationsInfo',
        CurrAppDetails: {
          ApplicationId: '',
          ApplicationName: '',
          Description: '',
        },
        ApplicationValidateFields: {
          ApplicationName: '',
        },
        ApplicationErrors: {},
        pillItems: [
          { key: 'ApplicationsInfo', label: 'Application Info' },
          { key: 'ApplicationTransactions', label: ' Transactions' },
          { key: 'ApplicationFeatures', label: ' Features' },
          { key: 'ApplicationPrograms', label: ' Programs' },
          // {key: 'ApplicationIntegrations', label: ' Integrations'},
        ],
        CurrTab: 'Client Details',
      } as State
  );

  const setShowToast = (show: boolean) => setState({ showToast: show });

  const didFetchData = useRef<boolean>(false);
  useEffect(() => {
    if (didFetchData.current) return;
    didFetchData.current = true;

    const init = async () => {
      setState({ IsLoading: true });

      await Promise.all([getData('')]);

      setState({ IsLoading: false });
    };

    init();
  }, []);

  const getData = async (SearchQuery: string = '', PageNo: number = 1) => {
    try {
      const resp: any = await apiRequest('/GetApplicationsMasterPaginationFilterSearch', {
        PageNo: PageNo,
        StartDate: '',
        EndDate: '',
        SearchString: SearchQuery,
      });
      if (resp.ResponseData.length > 0) {
        setState({ ApplicationMaster: resp.ResponseData, TotalRecords: resp.TotalRecords });
      } else {
        setState({ ApplicationMaster: [], TotalRecords: 0 });
      }
    } catch (err: any) {
      setState({ Error: err.toString() });
    } finally {
      setState({ IsLoading: false });
    }
  };

  const debouncedSearchQuery = useDebounce(state.SearchQuery, 300) as string;
  const didSearchRun = useRef<boolean>(false);
  useEffect(() => {
    if (!didSearchRun.current) {
      didSearchRun.current = true;
      return;
    }
    if (debouncedSearchQuery.trim() === '') return;
    getData(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setState({ SearchQuery: value });
    if (value.trim() === '') {
      getData('');
    }
  };

  const handleAddClient = () => {
    const CurrAppDetails: ApplicationDetails = {
      ApplicationId: '',
      ApplicationName: '',
      Description: '',
    };
    setState({ ViewAppDetails: true, CurrAppDetails });
  };

  const handleViewClientDetails = (item: ApplicationDetails) => {
    setState({ ViewAppDetails: true, CurrAppDetails: item });
  };

  const handleCloseClientDetails = () => {
    const CurrAppDetails: ApplicationDetails = {
      ApplicationId: '',
      ApplicationName: '',
      Description: '',
    };
    setState({ ViewAppDetails: false, CurrAppDetails });
    getData();
  };

  const handlePillClick = (item: PillItem) => {
    if (state.CurrAppDetails.ApplicationId === '') {
      setState({ openModal: true });
    } else {
      setState({ CurrPillActive: item.key });
    }
  };

  const handleChangeApplication = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      name: string
  ) => {
    const CurrAppDetails = { ...state.CurrAppDetails };
    CurrAppDetails[name] = e.target.value;
    setState({ CurrAppDetails });
  };

  const validateApplicationForm = (): boolean => {
    const ApplicationErrors: Record<string, string> = {};
    let formIsValid = true;
    for (const name in state.ApplicationValidateFields) {
      const value = (state.CurrAppDetails as Record<string, unknown>)[name];
      if (value === '' || value === 0) {
        formIsValid = false;
        ApplicationErrors[name] = 'This field is required';
      }
    }
    setState({
      ApplicationErrors,
    });
    return formIsValid;
  };

  const handlePageChange = (page: number) => {
    setState({ CurrentPage: page });
    getData(state.SearchQuery, page);
  };

  const handleSubmitApplication = async () => {
    if (!validateApplicationForm()) {
      return;
    }
    setState({ SavingLoader: true });
    const resp: any = await apiRequest('/AddUpdateApplicationsMaster ', state.CurrAppDetails);
    if (resp) {
      const CurrAppDetails = { ...state.CurrAppDetails };
      if (CurrAppDetails.ApplicationId === '') {
        CurrAppDetails.ApplicationId = resp.addApplicationsMaster.insertId;
        setState({ CurrAppDetails });
      }
      setState({ SavingLoader: false, showToast: true });
      setTimeout(() => {
        setState({ showToast: false });
      }, 3000);
    }
  };

  const handleDeleteItem = async (item: ApplicationDetails) => {
    const resp: any = await apiRequest('/DeleteApplicationsMaster', item);
    if (resp) {
      setState({ showToast: true });
      getData();
      setTimeout(() => {
        setState({ showToast: false });
      }, 3000);
    }
  };

  const columns = [
    { title: 'Application Name', key: 'ApplicationName' },
    { title: 'Description', key: 'Description', className: 'min-w-[400px]' },
  ];

  const data = state.ApplicationMaster.map((v: ApplicationDetails) => ({
    ApplicationId: v.ApplicationId,
    ApplicationName: v.ApplicationName,
    Description: v.Description,
    actions: (
        <>
          <button
              onClick={() => handleViewClientDetails(v)}
              className="bg-[#0071E9] cursor-pointer text-gray-50 px-3 py-1 rounded text-sm"
          >
            View
          </button>
          <ConfirmPopup message="Are you sure you want to delete this item?" onConfirm={() => handleDeleteItem(v)}>
            <button className=" pr-4 flex items-center">
              <Trash2 className="text-[#1A1A1A] cursor-pointer " />
            </button>
          </ConfirmPopup>
        </>
    ),
  }));

  if (state.IsLoading)
    return (
        <div className="h-96 py-20">
          <Spinner size="lg" color="blue-500" text="Fetching data..." />
        </div>
    );
  if (state.Error) return <ErrorScreen message={state.Error} />;

  return (
      <div className="  pt-0 pb-6 px-6 ">
        <Toast message="Saved successfully!" show={state.showToast} onClose={() => setShowToast(false)} />
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

        {state.ViewAppDetails ? (
            <div>
              <div className="flex  items-center   justify-between ">
                <div
                    onClick={handleCloseClientDetails}
                    className="flex items-center cursor-pointer bg-[#f3f3f3] w-fit px-4 py-1 rounded-full"
                >
                  <ChevronLeft className="text-gray-700" />{' '}
                  <span className="font-medium text-sm text-gray-700"> Back</span>
                </div>
                <p className="ml-4 font-semibold text-lg">
                  {state.CurrAppDetails.ApplicationId === '' ? 'Add' : state.CurrAppDetails.ApplicationName}
                </p>
                <p className="ml-4 font-semibold text-lg"></p>
              </div>
              <div className="border-b pb-2 pt-4 border-b-gray-200">
                <PillGroup items={state.pillItems} primaryKey={state.CurrPillActive} onClick={handlePillClick} />
              </div>

              {state.CurrPillActive === 'ApplicationsInfo' && (
                  <div className=" w-full pt-2">
                    <div className="flex justify-end">
                      <button
                          onClick={state.SavingLoader ? undefined : handleSubmitApplication}
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
                              <Plus className="w-5 h-5" />
                              <span>{state.CurrAppDetails.ApplicationId === '' ? 'Save' : 'Update'}</span>
                            </>
                        )}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                      <div className="">
                        <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                          Application Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            onChange={(e) => handleChangeApplication(e, 'ApplicationName')}
                            value={state.CurrAppDetails.ApplicationName}
                            type="text"
                            id="client"
                            name="client"
                            className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter client name"
                            required
                        />
                        {state.ApplicationErrors.ApplicationName && (
                            <div className="flex items-center mt-1 ml-2">
                              <CircleAlert size={14} className="text-red-500" />
                              <p className="ml-2 text-red-500 text-sm ">{state.ApplicationErrors.ApplicationName}</p>
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
                        onChange={(e) => handleChangeApplication(e, 'Description')}
                        value={state.CurrAppDetails.Description}
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
              )}

              {state.CurrPillActive === 'ApplicationFeatures' && (
                  <ApplicationFeatures CurrAppDetails={state.CurrAppDetails} />
              )}
              {state.CurrPillActive === 'ApplicationTransactions' && (
                  <ApplicationTransactions CurrAppDetails={state.CurrAppDetails} />
              )}
              {state.CurrPillActive === 'ApplicationPrograms' && (
                  <ApplicationPrograms CurrAppDetails={state.CurrAppDetails} />
              )}
              {state.CurrPillActive === 'ApplicationIntegrations' && (
                  <ApplicationIntegrations CurrAppDetails={state.CurrAppDetails} />
              )}
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
                    <span>Add Application</span>
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
