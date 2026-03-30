import React, { useEffect, useReducer, useRef } from 'react';
import CustomTable from "../../../utils/CustomTable.jsx";
import { CircleAlert, Plus, Save, SquarePen, Trash2, X } from "lucide-react";
import { apiRequest } from "../../../utils/helpers/ApiHelper.js";
import SpinnerV2 from "../../../utils/SpinnerV2.jsx";
import ErrorScreen from "../../../utils/ErrorScreen.jsx";
import Pagination from "../../../utils/Pagination.jsx";
import Toast from "../../../utils/Toast.jsx";
import useDebounce from "../../../utils/helpers/useDebounce.js";
import ConfirmPopup from "../../../utils/ConfirmPopup.jsx";

type Props = {
    CurrAppDetails?: {
        ApplicationId?: string | number;
    };
    children?: React.ReactNode;
};

type ObjectTypeItem = {
    ObjectTypeId: string;
    ObjectType: string;
    Description: string;
    ApplicationId?: string | number;
};

type ValidatableKeys = 'ObjectType';
type EditableField = 'ObjectType' | 'Description';

interface State {
    ActionType: '' | 'Add' | 'Update';
    Error: string;
    SearchQuery: string;
    CurrentPage: number;
    TotalRecords: number;
    ObjectsTypeMaster: ObjectTypeItem[];
    IsLoading: boolean;
    showToast: boolean;
    SavingLoader: boolean;
    isDataExist: string;
    CurrAddEditObj: ObjectTypeItem;
    ValidateFields: Record<ValidatableKeys, string>;
    FormErrors: Partial<Record<ValidatableKeys, string>>;
}

const initialState: State = {
    ActionType: "",
    Error: "",
    SearchQuery: "",
    CurrentPage: 1,
    TotalRecords: 1,
    ObjectsTypeMaster: [],
    IsLoading: true,
    showToast: false,
    SavingLoader: false,
    isDataExist: "",
    CurrAddEditObj: {
        ObjectTypeId: "",
        ObjectType: "",
        Description: "",
    },
    ValidateFields: {
        ObjectType: "",
    },
    FormErrors: {},
};

export default function ObjectsTypeMaster(props: Props) {
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

            await Promise.all([
                getData(""),
            ]);

            setState({ IsLoading: false });
        };

        init();
    }, []);

    const getData = async (SearchQuery: string = "") => {
        try {
            const resp: any = await apiRequest("/GetObjectsTypes", {
                StartDate: "",
                EndDate: "",
                SearchString: SearchQuery
            });
            if (resp.ResponseData.length > 0) {
                setState({ ObjectsTypeMaster: resp.ResponseData as ObjectTypeItem[], TotalRecords: resp.TotalRecords as number, CurrentPage: 1 });
            } else {
                setState({ ObjectsTypeMaster: [], TotalRecords: 0, CurrentPage: 1 });
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setState({ Error: message });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const handleAddClient = () => {
        const CurrAddEditObj: ObjectTypeItem = {
            ObjectTypeId: "",
            ObjectType: "",
            Description: "",
        };
        setState({ ActionType: "Add", CurrAddEditObj });
    };

    const handleEdit = (item: ObjectTypeItem) => {
        setState({ ActionType: "Update", CurrAddEditObj: item });
    };

    const handleCancel = () => {
        const CurrAddEditObj: ObjectTypeItem = {
            ObjectTypeId: "",
            ObjectType: "",
            Description: "",
        };
        setState({ ActionType: "", CurrAddEditObj });
        getData("");
    };

    const useDebounceTyped = useDebounce as unknown as <T>(value: T, delay: number) => T;
    const debouncedSearchQuery: string = useDebounceTyped<string>(state.SearchQuery, 300);
    const didSearchRun = useRef<boolean>(false);

    useEffect(() => {
        if (!didSearchRun.current) {
            didSearchRun.current = true;
            return;
        }
        if (debouncedSearchQuery.trim() === "") return;
        getData(debouncedSearchQuery);
    }, [debouncedSearchQuery]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setState({ SearchQuery: value });
        if (value.trim() === "") {
            getData("");
        }
    };

    const handleChangeClientInfo = (e: React.ChangeEvent<HTMLInputElement>, name: EditableField) => {
        const CurrAddEditObj = { ...state.CurrAddEditObj };
        CurrAddEditObj[name] = e.target.value;
        setState({ CurrAddEditObj });
    };

    const validateClientInfoForm = () => {
        const FormErrors: Partial<Record<ValidatableKeys, string>> = {};
        let formIsValid = true;

        for (const name of Object.keys(state.ValidateFields) as ValidatableKeys[]) {
            const value = state.CurrAddEditObj[name as ValidatableKeys];
            if (value === "" || (value as unknown as number) === 0) {
                formIsValid = false;
                FormErrors[name] = "This field is required";
            } else {
                FormErrors[name] = "";
            }
        }
        setState({ FormErrors });
        return formIsValid;
    };

    const handleDeleteItem = async (item: ObjectTypeItem) => {
        const resp: any = await apiRequest("/DeleteObjectsType", { ObjectTypeId: item.ObjectTypeId });
        if (resp) {
            setState({ showToast: true });
            getData();
            setTimeout(() => {
                setState({ showToast: false });
            }, 3000);
        }
    };

    const handleSubmitClientInfo = async () => {
        if (!validateClientInfoForm()) {
            return;
        }
        setState({ SavingLoader: true });
        const CurrAddEditObj: ObjectTypeItem = { ...state.CurrAddEditObj, ApplicationId: props?.CurrAppDetails?.ApplicationId };
        const resp: any = await apiRequest("/AddUpdateObjectsType", CurrAddEditObj);
        if (resp) {
            setState({ SavingLoader: false, showToast: true, ActionType: "" });
            getData();
            setTimeout(() => {
                setState({ showToast: false });
            }, 3000);
        }
    };

    if (state.IsLoading) return <div className="h-96 py-20"><SpinnerV2 {...{ text: "Fetching data..." }} /></div>;
    if (state.Error) return <ErrorScreen message={state.Error} />;

    interface TableRow {
        ObjectTypeId: string;
        ObjectType: string;
        Description: string;
        actions: React.ReactNode;
    }

    const columns: Array<{ title: string; key: keyof TableRow | string }> = [
        { title: '#ID', key: 'ObjectTypeId' },
        { title: 'Object Type', key: 'ObjectType' },
        { title: 'Description', key: 'Description' },
    ];

    const data: TableRow[] = state.ObjectsTypeMaster.map((v) => ({
        ObjectTypeId: v.ObjectTypeId,
        ObjectType: v.ObjectType,
        Description: v.Description,
        actions: (
            <div className="relative flex items-center">
                <ConfirmPopup
                    message="Are you sure you want to delete this item?"
                    onConfirm={() => handleDeleteItem(v)}
                >
                    <button className=" pr-4 flex items-center"><Trash2 className="text-[#1A1A1A] cursor-pointer " />
                    </button>
                </ConfirmPopup>
                <button onClick={() => handleEdit(v)} className=" "><SquarePen
                    className="text-[#1A1A1A] cursor-pointer" /></button>
            </div>
        ),
    }));

    return (
        <div className="  pt-0 pb-6 px-6 ">
            <Toast
                message="Saved successfully!"
                show={state.showToast}
                onClose={() => null}
            />
            {state.ActionType !== "" ?
                <div className=" w-full pt-2">
                    <div className="flex justify-end">
                        <div className="flex items-center">
                            {state.ActionType !== "" && <button onClick={handleCancel}
                                                                className="bg-white border border-[#2196F3] mr-6 text-[0.89rem] cursor-pointer text-[#0582E5] font-medium py-2 px-5 rounded-lg flex items-center space-x-2">
                                <X
                                    className="w-5 h-5" />
                                <span>CANCEL</span>
                            </button>}

                            <button onClick={state.SavingLoader ? undefined : handleSubmitClientInfo}
                                    className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2 text-[0.89rem] cursor-pointer text-gray-950 font-medium py-2 px-5 rounded-lg flex items-center space-x-2">
                                {state.SavingLoader ? <><SpinnerV2 {...{ text: "Saving..." }} /></> : <> <Save
                                    className="w-5 h-5" />
                                    <span>SAVE</span></>}
                            </button>
                        </div>

                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="">
                            <label htmlFor=""
                                   className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                Object Type <span className="text-red-500">*</span>
                            </label>
                            <input
                                onChange={(e) => handleChangeClientInfo(e, "ObjectType")}
                                value={state.CurrAddEditObj.ObjectType}
                                type="text"
                                id="objectType"
                                name="objectType"
                                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder=" "
                                required
                            />
                            {state.FormErrors.ObjectType &&
                                <div className="flex items-center mt-1 ml-2"><CircleAlert size={14}
                                                                                          className="text-red-500" />
                                    <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.ObjectType}</p>
                                </div>}
                            {state.isDataExist &&
                                <div className="flex items-center mt-1 ml-2"><CircleAlert size={14}
                                                                                          className="text-red-500" />
                                    <p className="ml-2 text-red-500 text-sm ">{state.isDataExist}</p></div>}
                        </div>

                        <div className="">
                            <label htmlFor=""
                                   className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                Description
                            </label>
                            <input
                                onChange={(e) => handleChangeClientInfo(e, "Description")}
                                value={state.CurrAddEditObj.Description}
                                type="text"
                                id="description"
                                name="description"
                                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder=" "
                            />
                        </div>
                    </div>
                </div> :
                <>
                    <div className="flex justify-between items-center pb-4">
                        <div
                            className="flex items-center w-full max-w-md px-4 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg shadow-sm">
                            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" strokeWidth={2}
                                 viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                            </svg>
                            <input onChange={handleSearch} value={state.SearchQuery} type="text" placeholder="Search"
                                   className="ml-3 text-[0.89rem] text bg-transparent outline-none  placeholder-gray-500 w-full" />
                        </div>

                        <div>
                            <button onClick={handleAddClient}
                                    className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2 text-[0.89rem] cursor-pointer text-gray-950 font-medium py-2 px-5 rounded-lg flex items-center space-x-2">
                                <Plus className="w-5 h-5" />
                                <span>Add </span>
                            </button>
                        </div>
                    </div>
                    <CustomTable columns={columns} data={data} responsive={true} />
                    {
                        state.TotalRecords > 10 && <div className="pt-4 flex justify-end">
                            <Pagination
                                total={state.TotalRecords}
                                current={state.CurrentPage}
                                pageSize={10}
                                onChange={(c: number) => {
                                    setState({ CurrentPage: c });
                                }}
                                showSizeChanger={false}
                            />
                        </div>
                    }
                </>
            }
        </div>
    );
}
