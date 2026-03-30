import React, { useEffect, useReducer, useRef } from 'react';
import CustomTable from '../../../utils/CustomTable';
import { CircleAlert, Plus, Save, SquarePen, Trash2, X } from 'lucide-react';
import { apiRequest } from '../../../utils/helpers/ApiHelper';
import Spinner from '../../../utils/Spinner';
import ErrorScreen from '../../../utils/ErrorScreen';
import Toast from '../../../utils/Toast';
import useDebounce from '../../../utils/helpers/useDebounce';
import ConfirmPopup from '../../../utils/ConfirmPopup';
import Dropdown from '../../../utils/Dropdown';

type Props = {
    children?: React.ReactNode;
};

interface CurrAddEditObj {
    IntegrationId: string;
    IntegrationName: string;
    Source: string;
    Target: string;
    IntegrationModeId: string;
    ApplicationId: string;
    ClientName?: string;
    Contact?: string;
    [key: string]: unknown;
}

interface ValidateFields {
    IntegrationName: string;
    Source: string;
    Target: string;
    IntegrationModeId: string;
    [key: string]: string;
}

interface State {
    ActionType: string;
    Error: string;
    SearchQuery: string;
    CurrentPage: number;
    TotalRecords: number;
    IntegrationsMaster: any[];
    IntegrationModeMasterList: any[];
    ApplicationsList: any[];
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
    ValidateFields: ValidateFields;
    FormErrors: Record<string, string>;
}

type DropdownName = 'Source' | 'Target' | 'IntegrationModeId' | 'ApplicationId';

export default function IntegrationsMaster(_props: Props) {
    const initialState: State = {
        ActionType: '',
        Error: '',
        SearchQuery: '',
        CurrentPage: 1,
        TotalRecords: 1,
        IntegrationsMaster: [],
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
            IntegrationId: '',
            IntegrationName: '',
            Source: '',
            Target: '',
            IntegrationModeId: '',
            ApplicationId: '',
        },
        ValidateFields: {
            IntegrationName: '',
            Source: '',
            Target: '',
            IntegrationModeId: '',
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

            await Promise.all([getData(''), getIntegrationModeMaster(), getApplicationsList('')]);

            setState({ IsLoading: false });
        };

        void init();
    }, []);

    const getData = async (SearchQuery: string = ''): Promise<void> => {
        try {
            const resp: any = await apiRequest('/GetIntegrationsMasterPaginationFilterSearch', {
                StartDate: '',
                EndDate: '',
                SearchString: SearchQuery,
            });
            if (resp.ResponseData.length > 0) {
                setState({ IntegrationsMaster: resp.ResponseData, TotalRecords: resp.TotalRecords, CurrentPage: 1 });
            } else {
                setState({ IntegrationsMaster: [], TotalRecords: 0, CurrentPage: 1 });
            }
        } catch (err: any) {
            setState({ Error: err.toString() });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const getIntegrationModeMaster = async (): Promise<void> => {
        try {
            const resp: any = await apiRequest('/GetIntegrationModesMaster', {});
            setState({
                IntegrationModeMasterList: resp.ResponseData,
            });
        } catch (err) {
            console.error('Error loading Country/State/City:', err);
        }
    };

    const getApplicationsList = async (SearchString: string = ''): Promise<void> => {
        try {
            const resp: any = await apiRequest('/GetApplicationsMaster', { SearchString });
            setState({
                ApplicationsList: resp.ResponseData,
            });
        } catch (err) {
            console.error('Error loading Country/State/City:', err);
        }
    };

    const handleAddClient = (): void => {
        const CurrAddEditObj: CurrAddEditObj = {
            IntegrationId: '',
            IntegrationName: '',
            Source: '',
            Target: '',
            IntegrationModeId: '',
            ApplicationId: '',
        };
        setState({ ActionType: 'Add', CurrAddEditObj });
    };

    const handleEdit = (item: any): void => {
        setState({ ActionType: 'Update', CurrAddEditObj: item });
    };

    const handleCancel = (): void => {
        const CurrAddEditObj: CurrAddEditObj = {
            IntegrationId: '',
            IntegrationName: '',
            Source: '',
            Target: '',
            IntegrationModeId: '',
            ApplicationId: '',
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

    const handleChangeClientInfo = (e: React.ChangeEvent<HTMLInputElement>, name: keyof CurrAddEditObj): void => {
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

    const handleDropdownClientInfo = (val: string, _options: any, name: DropdownName): void => {
        const CurrAddEditObj = { ...state.CurrAddEditObj };
        CurrAddEditObj[name] = val;
        setState({ CurrAddEditObj });
    };

    const handleDeleteItem = async (item: any): Promise<void> => {
        const resp: any = await apiRequest('/DeleteIntegrationsMaster', item);
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
        const resp: any = await apiRequest('/AddUpdateIntegrationsMaster ', state.CurrAddEditObj);
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
        { title: 'Integration Name', key: 'IntegrationName' },
        { title: 'Source', key: 'Source' },
        { title: 'Target', key: 'Target' },
        { title: 'Integration Mode', key: 'IntegrationMode' },
    ];

    const data: any[] = state.IntegrationsMaster.map((v: any, _i: number) => ({
        IntegrationId: v.IntegrationId,
        IntegrationName: v.IntegrationName,
        Source: v.SourceName,
        Target: v.TargetName,
        IntegrationMode: v.IntegrationMode,
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
        <div className="pt-0 pb-6 px-6 ">
            <Toast message="Saved successfully!" show={state.showToast} onClose={() => {}} />
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                        <div className="">
                            <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                Integration Name <span className="text-red-500">*</span>
                            </label>

                            <input
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChangeClientInfo(e, 'IntegrationName')}
                                value={state.CurrAddEditObj.IntegrationName}
                                type="text"
                                id="client"
                                name="client"
                                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter IntegrationName"
                                required
                            />
                            {state.FormErrors.IntegrationName && (
                                <div className="flex items-center mt-1 ml-2">
                                    <CircleAlert size={14} className="text-red-500" />
                                    <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.IntegrationName}</p>
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
                                Source <span className="text-red-500">*</span>
                            </label>

                            <Dropdown
                                mode="single"
                                options={state.ApplicationsList}
                                value={state.CurrAddEditObj.Source}
                                onChange={(val: string, item: any) => handleDropdownClientInfo(val, item, 'Source')}
                                onSearch={(q: string) => console.log('Search (Multi):', q)}
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

                            <Dropdown
                                mode="single"
                                options={state.ApplicationsList}
                                value={state.CurrAddEditObj.Target}
                                onChange={(val: string, item: any) => handleDropdownClientInfo(val, item, 'Target')}
                                onSearch={(q: string) => console.log('Search (Multi):', q)}
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
                                Integration Mode <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                mode="single"
                                options={state.IntegrationModeMasterList}
                                value={state.CurrAddEditObj.IntegrationModeId}
                                onChange={(val: string, item: any) => handleDropdownClientInfo(val, item, 'IntegrationModeId')}
                                onSearch={(q: string) => console.log('Search (Multi):', q)}
                            />

                            {state.FormErrors.IntegrationModeId && (
                                <div className="flex items-center mt-1 ml-2">
                                    <CircleAlert size={14} className="text-red-500" />
                                    <p className="text-red-500 text-sm ">{state.FormErrors.IntegrationModeId}</p>
                                </div>
                            )}
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
                                <span>Add</span>
                            </button>
                        </div>
                    </div>
                    <CustomTable columns={columns} data={data} responsive={true} />
                </>
            )}
        </div>
    );
}
