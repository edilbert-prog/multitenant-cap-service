// Projects.tsx
import React, { useEffect, useReducer, useRef } from 'react';
import CustomTable from "../../../utils/CustomTable";
import { ChevronLeft, CircleAlert, Plus, Save, SquarePen, Trash2, X } from "lucide-react";
import { apiRequest } from "../../../utils/helpers/ApiHelper";
import SpinnerV2 from "../../../utils/SpinnerV2";
import ErrorScreen from "../../../utils/ErrorScreen";
import Pagination from "../../../utils/Pagination";
import Toast from "../../../utils/Toast";
import useDebounce from "../../../utils/helpers/useDebounce";
import Dropdown from "../../../utils/Dropdown";
import DatePicker from "../../../utils/DatePicker";
import ConfirmPopup from "../../../utils/ConfirmPopup";
import ProjectSprints from "./ProjectSprints";
import SprintDetails from "./SprintDetails";
// import { useSidebar } from "../../../utils/SidebarNav/SidebarContext";
import {getDecryptedData} from "../../../utils/helpers/storageHelper";

interface ProjectsProps {
    CurrClientDetails?: {
        ClientId?: string;
    };
}

interface CurrAddEditObj {
    ClientId: string;
    ProjectId: string;
    ProjectTypeId: string;
    ProjectName: string;
    BusinessUnitId: string;
    BusinessProcessId: string;
    StartDate: string;
    EndDate: string;
    Description: string;
}

interface State {
    ActionType: string;
    Error: string;
    SearchQuery: string;
    CurrentPage: number;
    CurrScreenTab: number;
    TotalRecords: number;
    CurrProject: Record<string, any>;
    ClientsProjectsList: any[];
    BusinessUnitsList: any[];
    BusinessProcessList: any[];
    ProjectTypesList: any[];
    ClientsList: any[];
    CurrClientDetails: { ClientId: string };
    IsLoading: boolean;
    showToast: boolean;
    SavingLoader: boolean;
    CurrAddEditObj: CurrAddEditObj;
    ValidateFields: Record<string, string>;
    FormErrors: Record<string, string>;
    isDataExist?: string;
}

export default function Projects(props: ProjectsProps) {
    // const { refreshSidebar } = useSidebar();

    const [state, setState] = useReducer(
        (state: State, newState: Partial<State>): State => ({ ...state, ...newState }),
        {
            ActionType: "",
            Error: "",
            SearchQuery: "",
            CurrentPage: 1,
            CurrScreenTab: 1,
            TotalRecords: 1,
            CurrProject: {},
            ClientsProjectsList: [],
            BusinessUnitsList: [],
            BusinessProcessList: [],
            ProjectTypesList: [],
            ClientsList: [],
            CurrClientDetails: { ClientId: "" },
            IsLoading: true,
            showToast: false,
            SavingLoader: false,
            CurrAddEditObj: {
                ClientId: "",
                ProjectId: "",
                ProjectName: "",
                BusinessUnitId: "",
                BusinessProcessId: "",
                StartDate: "",
                EndDate: "",
                ProjectTypeId: "",
                Description: "",
            },
            ValidateFields: {
                ClientId: "",
                ProjectName: "",
                BusinessUnitId: "",
            },
            FormErrors: {},
        }
    );

    const didFetchData = useRef(false);

    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;

        const init = async () => {
            await Promise.all([
                setCurrentClient(),
                getData(""),
                GetProjectTypesMasterList(),
            ]);
        };
        init();
    }, []);

    const setCurrentClient = async () => {
        let UserSession: any = getDecryptedData("UserSession");
        if (UserSession) {
            setState({ CurrClientDetails: UserSession });
            getBusinessUnitsList(props?.CurrClientDetails?.ClientId?? state.CurrClientDetails.ClientId)
        }
    };

    const GetProjectTypesMasterList = async () => {
        try {
            let resp: any = await apiRequest("/getproject/GetProjectTypesMaster", {});
            setState({ ProjectTypesList: resp.ResponseData });
        } catch (err) {
            console.error("Error loading Project Types:", err);
        }
    };

    const getBusinessProcessList = async (reqObj: any, SearchString = "") => {
        try {
            let resp: any = await apiRequest("/GetBusinessProcessMaster", {
                ClientId: reqObj.ClientId,
                BusinessUnitId: reqObj.BusinessUnitId,
                SearchString,
            });
            setState({ BusinessProcessList: resp.ResponseData });
        } catch (err) {
            console.error("Error loading Business Processes:", err);
        }
    };

    const getClientsList = async () => {
        try {
            let resp: any = await apiRequest("/GetClientsMaster", {});
            setState({ ClientsList: resp.ResponseData });
        } catch (err) {
            console.error("Error loading Clients:", err);
        }
    };

    const getBusinessUnitsList = async (ClientId = "") => {
        try {
            let resp: any = await apiRequest("/api/GetBusinessUnitMasterByClientId", { ClientId });
            setState({ BusinessUnitsList: resp.ResponseData });
        } catch (err) {
            console.error("Error loading Business Units:", err);
        }
    };

    const getData = async (SearchQuery = "") => {
        setState({ IsLoading: true });
        try {
            let resp: any = await apiRequest("/client-projects/GetClientProjectsPaginationFilterSearch", {
                StartDate: "",
                EndDate: "",
                SearchString: SearchQuery,
            });
            if (resp.ResponseData.length > 0) {
                setState({ ClientsProjectsList: resp.ResponseData, TotalRecords: resp.TotalRecords, CurrentPage: 1 });
            } else {
                setState({ ClientsProjectsList: [], TotalRecords: 0, CurrentPage: 1 });
            }
        } catch (err: any) {
            setState({ Error: err.toString() });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const handleAddClient = () => {
        let CurrAddEditObj: CurrAddEditObj = {
            ClientId: props?.CurrClientDetails?.ClientId ?? state.CurrClientDetails.ClientId,
            ProjectId: "",
            ProjectTypeId: "Agile",
            ProjectName: "",
            BusinessProcessId: "",
            BusinessUnitId: "",
            StartDate: "",
            EndDate: "",
            Description: "",
        };
        setState({ ActionType: "Add", CurrAddEditObj, FormErrors: {} });
    };

    const handleEdit = (item: any) => {
        setState({ ActionType: "Update", CurrAddEditObj: item, FormErrors: {} });
        getBusinessUnitsList(item.ClientId);
    };

    const handleCancel = () => {
        let CurrAddEditObj: CurrAddEditObj = {
            ClientId: "",
            ProjectId: "",
            ProjectTypeId: "",
            ProjectName: "",
            BusinessUnitId: "",
            BusinessProcessId: "",
            StartDate: "",
            EndDate: "",
            Description: "",
        };
        setState({ ActionType: "", CurrAddEditObj });
        getData("");
    };

    const debouncedSearchQuery = useDebounce(state.SearchQuery, 300);
    const didSearchRun = useRef(false);

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

    const handleDateChange = (date: string, name: string) => {
        let CurrAddEditObj = { ...state.CurrAddEditObj, [name]: date };
        setState({ CurrAddEditObj });
    };

    const handleChangeClientInfo = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, name: string) => {
        let CurrAddEditObj = { ...state.CurrAddEditObj, [name]: e.target.value };
        setState({ CurrAddEditObj });
    };

    const validateClientInfoForm = () => {
        let FormErrors: Record<string, string> = {};
        let formIsValid = true;

        const emailRegex = "";
        for (let name in state.ValidateFields) {
            const value = (state.CurrAddEditObj as any)[name];
            if (value === "" || value === 0) {
                formIsValid = false;
                FormErrors[name] = "This field is required";
            } else {
                if (name === "EmailId" && !emailRegex.test(value)) {
                    formIsValid = false;
                    FormErrors[name] = "Please enter a valid email address";
                } else {
                    FormErrors[name] = "";
                }
            }
        }
        setState({ FormErrors });
        return formIsValid;
    };

    const handleCurrScreenTab = (tab: number, item: any) => {
        setState({ CurrScreenTab: tab, CurrProject: item });
    };

    const handleDropdownClientInfo = (val: string, _options: any, name: string) => {
        let CurrAddEditObj = { ...state.CurrAddEditObj, [name]: val };
        setState({ CurrAddEditObj });
        if (name === "ClientId") {
            getBusinessUnitsList(val);
        }
        if (name === "BusinessUnitId") {
            getBusinessProcessList(CurrAddEditObj);
        }
    };

    const handleDeleteItem = async (item: any) => {
        let resp: any = await apiRequest("/DeleteClientProject ", item);
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
        let CurrAddEditObj = state.CurrAddEditObj;
        let resp: any = await apiRequest("/AddUpdateClientProject", CurrAddEditObj);
        if (resp) {
            setState({ SavingLoader: false, showToast: true, ActionType: "" });

            if (CurrAddEditObj.ProjectTypeId === "Waterfall" && CurrAddEditObj.ProjectId === "") {
                let reqObj = {
                    ClientId: CurrAddEditObj.ClientId,
                    ProjectId: resp.addClientProject.insertId,
                    SprintId: "",
                    SprintName: "Sprint 1",
                    StartDate: "",
                    EndDate: "",
                    InputFileURL: "",
                    MarkdownFileURL: "",
                    DataParseStatus: "",
                };
                await apiRequest("/AddUpdateClientProjectSprint", reqObj);
            }
            setTimeout(() => {
                setState({ showToast: false });
            }, 3000);
            getData();
            props.refreshSidebar();
        }
    };

    if (state.IsLoading) return <div className="h-96 py-20"><SpinnerV2 text="Fetching data..." /></div>;
    if (state.Error) return <ErrorScreen message={state.Error} />;

    const columns = [
        { title: '#', key: 'ProjectId' },
        { title: 'Project Name', key: 'ProjectName', headerClassName: 'min-w-[400px]' },
        { title: 'Project Type', key: 'ProjectTypeId', headerClassName: 'min-w-[200px]' },
        { title: 'Description', key: 'Description', className: 'min-w-[200px] -[50%]' },
    ];

    const data = state.ClientsProjectsList.map((v: any, i: number) => ({
        ProjectId: i + 1,
        ClientName: v.ClientName,
        ProjectName: v.ProjectName,
        BusinessUnitName: v.BusinessUnitName,
        ProjectTypeId: v.ProjectTypeId,
        StartDate: v.StartDate,
        EndDate: v.EndDate,
        Description: v.Description,
        actions: (
            <div className="relative flex items-center">
                <button onClick={() => handleCurrScreenTab(2, v)} className="bg-[#0071E9] mr-4 cursor-pointer text-white px-3 py-1 rounded text-sm">Sprints</button>
                <ConfirmPopup message="Are you sure you want to delete this item?" onConfirm={() => handleDeleteItem(v)}>
                    <button className="pr-4 flex items-center"><Trash2 className="text-[#1A1A1A] cursor-pointer" /></button>
                </ConfirmPopup>
                <button onClick={() => handleEdit(v)}><SquarePen className="text-[#1A1A1A] cursor-pointer" /></button>
            </div>
        ),
    }));

    return (
        <div className=" ">
            <div className=" ">
                {state.CurrScreenTab === 1 && <div className=" rounded-lg bg-white">
                    {/*<div className="pb-5 pt-1">*/}
                    {/*    <p className="font-semibold text-xl">Projects</p>*/}
                    {/*</div>*/}
                    <div className="  ">
                        <Toast
                            message="Saved successfully!"
                            show={state.showToast}
                            onClose={() => setState({showToast:false})}
                        />
                        {state.ActionType !== "" ?
                            <div className=" w-full pt-2">
                                <div className="flex justify-end">
                                    <div className="flex items-center">
                                        { state.ActionType !== "" &&
                                            <button onClick={handleCancel} className="bg-white border border-[#2196F3] mr-6 text-[0.89rem] cursor-pointer text-[#0582E5] font-medium py-2 px-5 rounded-lg flex items-center space-x-2">
                                                <X className="w-5 h-5"/>
                                                <span>CANCEL</span>
                                            </button>
                                        }
                                        <button onClick={state.SavingLoader ? null : handleSubmitClientInfo}
                                                className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2 text-[0.89rem] cursor-pointer text-gray-950 font-medium py-2 px-5 rounded-lg flex items-center space-x-2">
                                            {state.SavingLoader ? <><SpinnerV2 {...{ text: "Saving..." }} /></> : <>
                                                <Save
                                                    className="w-5 h-5"/>
                                                <span>SAVE</span></>}
                                        </button>
                                    </div>

                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/*<div className="">*/}
                                    {/*    <label htmlFor=""*/}
                                    {/*           className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">*/}
                                    {/*        Client <span className="text-red-500">*</span>*/}
                                    {/*    </label>*/}
                                    {/*    <Dropdown*/}
                                    {/*        mode="single"*/}
                                    {/*        options={state.ClientsList}*/}
                                    {/*        value={state.CurrAddEditObj.ClientId}*/}
                                    {/*        onChange={(val, item) => handleDropdownClientInfo(val, item, "ClientId")}*/}
                                    {/*        onSearch={(q) => console.log("Search (Multi):", q)}*/}
                                    {/*    />*/}

                                    {/*    {state.FormErrors.ClientId &&*/}
                                    {/*        <div className="flex items-center mt-1 ml-2"><CircleAlert size={14}*/}
                                    {/*                                                                  className="text-red-500"/>*/}
                                    {/*            <p className="text-red-500 text-sm ">{state.FormErrors.ClientId}</p>*/}
                                    {/*        </div>}*/}

                                    {/*</div>*/}
                                    <div className="">
                                        <label htmlFor=""
                                               className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                            Project Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            onChange={(e) => handleChangeClientInfo(e, "ProjectName")}
                                            value={state.CurrAddEditObj.ProjectName}
                                            type="text"
                                            id="client"
                                            name="client"
                                            className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter ProjectName"
                                            required
                                        />
                                        {state.FormErrors.ProjectName &&
                                            <div className="flex items-center mt-1 ml-2"><CircleAlert size={14}
                                                                                                      className="text-red-500"/>
                                                <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.ProjectName}</p>
                                            </div>}
                                        {state.isDataExist &&
                                            <div className="flex items-center mt-1 ml-2"><CircleAlert size={14}
                                                                                                      className="text-red-500"/>
                                                <p className="ml-2 text-red-500 text-sm ">{state.isDataExist}</p></div>}
                                    </div>
                                    <div className="">
                                        <label htmlFor=""
                                               className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                            Business Unit <span className="text-red-500">*</span>
                                        </label>
                                        <Dropdown
                                            mode="single"
                                            options={state.BusinessUnitsList}
                                            value={state.CurrAddEditObj.BusinessUnitId}
                                            onChange={(val, item) => handleDropdownClientInfo(val, item, "BusinessUnitId")}
                                            onSearch={(q) => console.log("Search (Multi):", q)}
                                        />

                                        {state.FormErrors.BusinessUnitId &&
                                            <div className="flex items-center mt-1 ml-2"><CircleAlert size={14}
                                                                                                      className="text-red-500"/>
                                                <p className="text-red-500 text-sm ">{state.FormErrors.BusinessUnitId}</p>
                                            </div>}

                                    </div>
                                    <div className="">
                                        <label htmlFor=""
                                               className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                            Start Date
                                        </label>
                                        <DatePicker value={state.CurrAddEditObj.StartDate}
                                                    onChange={(date) => handleDateChange(date, "StartDate")}
                                        />

                                    </div>
                                    <div className="">
                                        <label htmlFor=""
                                               className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                            End Date
                                        </label>
                                        <DatePicker value={state.CurrAddEditObj.EndDate}
                                                    onChange={(date) => handleDateChange(date, "EndDate")}
                                        />

                                    </div>
                                    <div className="">
                                        <label htmlFor=""
                                               className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                            Project Type
                                        </label>
                                        <Dropdown
                                            mode="single"
                                            options={[
                                                {
                                                    label: "Agile", value: "Agile"
                                                },
                                                {
                                                    label: "Waterfall", value: "Waterfall"
                                                }
                                            ]}
                                            value={state.CurrAddEditObj.ProjectTypeId}
                                            onChange={(val, item) => handleDropdownClientInfo(val, item, "ProjectTypeId")}
                                            onSearch={(q) => console.log("Search (Multi):", q)}
                                        />



                                    </div>
                                    <div className=" ">
                                        <div className="flex justify-between items-center mb-1">
                                            <label htmlFor="name"
                                                   className=" text-[0.90rem] text-[#2C3E50] font-medium">
                                                Description
                                            </label>
                                            {/*<span className="text-gray-500 text-sm">0/100</span>*/}
                                        </div>

                                        <div className="relative">
                                    <textarea
                                        onChange={(e) => handleChangeClientInfo(e, "Description")}
                                        value={state.CurrAddEditObj.Description}
                                        id="name"
                                        name="name"
                                        rows="4"
                                        maxLength="2000"
                                        placeholder="Description"
                                        className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8]   resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    ></textarea>

                                            <div className="absolute bottom-2 right-2">
                                                <svg
                                                    className="w-4 h-4 text-gray-500"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path d="M4 13l4 4L16 7" stroke="currentColor" stroke-width="2"
                                                          fill="none"/>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div> :
                            <>
                                <div className="flex justify-between items-center pb-4">
                                    <div
                                        className="flex items-center w-full max-w-md px-4 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg shadow-sm">
                                        <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor"
                                             stroke-width="2"
                                             viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"/>
                                        </svg>
                                        <input onChange={handleSearch} value={state.SearchQuery} type="text"
                                               placeholder="Search"
                                               className="ml-3 text-[0.89rem] text bg-transparent outline-none  placeholder-gray-500 w-full"/>
                                    </div>

                                    <div>
                                        <button onClick={handleAddClient}
                                                className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2 text-[0.89rem] cursor-pointer text-gray-950 font-medium py-2 px-5 rounded-lg flex items-center space-x-2">
                                            <Plus className="w-5 h-5"/>
                                            <span>Add Project</span>
                                        </button>
                                    </div>
                                </div>
                                <CustomTable columns={columns} data={data} responsive={true}/>
                                {
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
                                }

                            </>
                        }
                    </div>
                </div>}
                {state.CurrScreenTab === 2 && <div className=" bg-white rounded-md">
                    <div className="pb-4">
                        <div onClick={() => setState({CurrScreenTab: 1})}
                             className="flex items-center cursor-pointer bg-[#f3f3f3]  w-fit px-4 py-1 rounded-full">
                            <ChevronLeft className="text-gray-700"/> <span
                            className="font-medium text-sm text-gray-700"> Back to Projects</span>
                        </div>
                    </div>
                    {state.CurrProject.ProjectTypeId==="Agile"?
                        <ProjectSprints refreshSidebar={props.refreshSidebar} CurrProject={state.CurrProject}/>:<SprintDetails CurrentSprint={state.CurrProject} />
                    }
                </div>
                }
            </div>
        </div>
    );
}
