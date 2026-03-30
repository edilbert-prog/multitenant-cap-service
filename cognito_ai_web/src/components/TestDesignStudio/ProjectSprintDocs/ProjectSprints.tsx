import React, { useEffect, useReducer, useRef } from 'react';
import { apiRequest } from "../../../utils/helpers/ApiHelper";
import Modal from "../../../utils/Modal";
import { CircleAlert, GitPullRequestArrow, Plus } from "lucide-react";
import DatePicker from "../../../utils/DatePicker";
import SprintTimeline from "../../../utils/SprintTimeline";
import SprintDetails from "./SprintDetails";
// import {useSidebar} from "@/utils/SidebarNav/SidebarContext";

type Status = 'wait' | 'success';

interface SprintItem {
    id: string;
    ProjectId: string;
    ProjectName: string;
    BusinessUnitName: string;
    BusinessUnitId: string;
    ClientId: string;
    TotalSessions: number;
    SprintId: string;
    SprintName: string;
    StartDate: string;
    EndDate: string;
    status: Status;
    time: string;
    action: React.ReactNode;
    ProjectTypeId?: string;
}

interface CurrAddEditObj {
    ClientId: string;
    ProjectId: string;
    SprintId: string;
    SprintName: string;
    StartDate: string | Date;
    EndDate: string | Date;
    InputFileURL: string;
    MarkdownFileURL: string;
    DataParseStatus: string;
    [key: string]: string | number | Date;
}

type Props = {
    CurrProject: {
        ClientId: string;
        ProjectId: string;
        BusinessUnitId: string;
        ProjectTypeId: string;
    };
    children?: React.ReactNode;
};

interface State {
    ActionType: string;
    Error: string;
    SearchQuery: string;
    tab: string;
    CurrentPage: number;
    ViewSummary: boolean;
    TotalRecords: number;
    CurrentSprint: any;
    ProjectSprintList: SprintItem[];
    existingMarkdownList: unknown[];
    ViewClientDetails: boolean;
    ViewSprintDetails: boolean;
    IsLoading: boolean;
    showToast: boolean;
    openModal: boolean;
    SavingLoader: boolean;
    isDataExist: string;
    ClientBusinessUnitActionType: string;
    CurrAddEditObj: CurrAddEditObj;
    ValidateFields: Record<string, string>;
    FormErrors: Record<string, string>;
    selectedMarkdown: Record<string, unknown>;
}

const initialState: State = {
    ActionType: "",
    Error: "",
    SearchQuery: "",
    tab: 'upload',
    CurrentPage: 1,
    ViewSummary: false,
    TotalRecords: 1,
    CurrentSprint: {},
    ProjectSprintList: [],
    existingMarkdownList: [],
    ViewClientDetails: false,
    ViewSprintDetails: false,
    IsLoading: true,
    showToast: false,
    openModal: false,
    SavingLoader: false,
    isDataExist: "",
    ClientBusinessUnitActionType: "",
    CurrAddEditObj: {
        ClientId: "",
        ProjectId: "",
        SprintId: "",
        SprintName: "",
        StartDate: "",
        EndDate: "",
        InputFileURL: "",
        MarkdownFileURL: "",
        DataParseStatus: "",
    },
    ValidateFields: {
        SprintName: "",
    },
    FormErrors: {},
    selectedMarkdown: {},
};

export default function ProjectSprints(props: Props) {
    // const { refreshSidebar } = useSidebar();
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
            await Promise.all([getData("")]);
            setState({ IsLoading: false });
        };

        init();
    }, []);

    const getData = async (SearchQuery: string = ""): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetClientProjectSprintPaginationFilterSearch", {
                StartDate: "",
                EndDate: "",
                SearchString: SearchQuery,
                ClientId: props.CurrProject.ClientId,
                ProjectId: props.CurrProject.ProjectId,
            });
            if (resp.ResponseData.length > 0) {
                const finalSessionList: SprintItem[] = [];
                (resp.ResponseData as any[]).map((v: any, _i: number) => {
                    finalSessionList.push({
                        id: v.SessionId,
                        ProjectId: v.ProjectId,
                        ProjectName: v.ProjectName,
                        BusinessUnitName: v.BusinessUnitName,
                        BusinessUnitId: props.CurrProject.BusinessUnitId,
                        ClientId: v.ClientId,
                        TotalSessions: v.TotalSessions,
                        SprintId: v.SprintId,
                        SprintName: v.SprintName,
                        StartDate: v.StartDate,
                        EndDate: v.EndDate,
                        status: v.DataParseStatustSprints?.includes("Analysing") ? 'wait' : 'success',
                        time: v.CreatedDate,
                        action: (
                            <button className="bg-[#0071E9] cursor-pointer text-gray-50 px-3 py-1 rounded text-sm">
                                Business Process Mapping
                            </button>
                        ),
                    });
                });

                setState({
                    ProjectSprintList: finalSessionList,
                    TotalRecords: resp.TotalRecords,
                    CurrentPage: 1,
                });
            } else {
                setState({ ProjectSprintList: [], TotalRecords: 0, CurrentPage: 1 });
            }
        } catch (err: any) {
            setState({ Error: err.toString() });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const handleViewSummary = (item: SprintItem): void => {
        item.ProjectTypeId = props.CurrProject.ProjectTypeId;
        setState({ ViewSprintDetails: true, CurrentSprint: item });
    };

    const handleAddClient = (): void => {
        const CurrAddEditObj: CurrAddEditObj = {
            ClientId: props.CurrProject.ClientId,
            ProjectId: props.CurrProject.ProjectId,
            SprintId: "",
            SprintName: "",
            StartDate: "",
            EndDate: "",
            InputFileURL: "",
            MarkdownFileURL: "",
            DataParseStatus: "",
        };
        setState({ openModal: true, ActionType: "Add", CurrAddEditObj, selectedMarkdown: {} });
    };

    const handleDateChange = (date: string | Date, name: keyof CurrAddEditObj): void => {
        const CurrAddEditObj = { ...state.CurrAddEditObj };
        CurrAddEditObj[name] = date;
        setState({ CurrAddEditObj });
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
            const value = state.CurrAddEditObj[name as keyof CurrAddEditObj];
            if (value === "" || value === 0) {
                formIsValid = false;
                FormErrors[name] = "This field is required";
            } else {
                if (name === "EmailId" && !emailRegex.test(String(value))) {
                    formIsValid = false;
                    FormErrors[name] = "Please enter a valid email address";
                } else {
                    FormErrors[name] = "";
                }
            }
        }
        setState({
            FormErrors,
        });
        return formIsValid;
    };

    const handleCancel = (): void => {
        const CurrAddEditObj: CurrAddEditObj = {
            ClientId: "",
            ProjectId: "",
            SprintId: "",
            SprintName: "",
            StartDate: "",
            EndDate: "",
            InputFileURL: "",
            MarkdownFileURL: "",
            DataParseStatus: "",
        };
        setState({ openModal: false, CurrAddEditObj });
    };

    const handleSubmitClientInfo = async (): Promise<void> => {
        if (!validateClientInfoForm()) {
            return;
        }
        setState({ SavingLoader: true, openModal: false });
        const resp: any = await apiRequest("/AddUpdateClientProjectSprint", state.CurrAddEditObj);
        if (resp) {
            setState({ SavingLoader: false, showToast: true, ActionType: "" });
            getData();
            props.refreshSidebar();
            setTimeout(() => {
                setState({ showToast: false });
            }, 3000);
        }
    };

    return (
        <div className="" style={{ height: "calc(100vh - 180px)" }}>
            <Modal
                width="max-w-2xl"
                isOpen={state.openModal}
                onClose={() => setState({ openModal: false })}
                title={state.ActionType === "Add" ? "New Sprint" : state.CurrAddEditObj.SprintName}
            >
                <div className="space-y-6">
                    <div className="">
                        <label htmlFor=""
                               className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                            Sprint Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            onChange={(e) => handleChangeClientInfo(e, "SprintName")}
                            value={state.CurrAddEditObj.SprintName as string}
                            type="text"
                            id="client"
                            name="client"
                            className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter SprintName"
                            required
                        />
                        {state.FormErrors.SprintName && (
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.SprintName}</p>
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
                        <label htmlFor=""
                               className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                            Start Date
                        </label>
                        <DatePicker
                            value={state.CurrAddEditObj.StartDate}
                            onChange={(date: string | Date) => handleDateChange(date, "StartDate")}
                        />
                    </div>

                    <div className="">
                        <label htmlFor=""
                               className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                            End Date
                        </label>
                        <DatePicker
                            value={state.CurrAddEditObj.EndDate}
                            onChange={(date: string | Date) => handleDateChange(date, "EndDate")}
                        />
                    </div>

                    <div className="flex justify-end items-center gap-6">
                        <button
                            onClick={handleCancel}
                            className="cursor-pointer mt-4 px-5 py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg "
                        >
                            Close
                        </button>
                        <button
                            onClick={handleSubmitClientInfo}
                            className="cursor-pointer mt-4 px-5 py-2 bg-[#0071E9] text-white text-sm rounded-lg"
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </Modal>

            {state.ViewSprintDetails ? (
                <SprintDetails refreshSidebar={props.refreshSidebar} CurrentSprint={state.CurrentSprint} />
            ) : (
                <div className="">
                    <div className="flex justify-between items-center ">
                        <div className="pb-5  flex items-center pl-4 pt-4">
                            <GitPullRequestArrow className="w-7 h-7 text-gray-700" />
                            <p className="ml-4 font-semibold text-xl"> Project Sprints</p>
                        </div>

                        <div>
                            <button
                                onClick={handleAddClient}
                                className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
                            >
                                <Plus className="w-5 h-5" />
                                <span>New Sprint</span>
                            </button>
                        </div>
                    </div>

                    <div className="mt-10">
                        <SprintTimeline
                            Title="Sprint Name"
                            sessions={state.ProjectSprintList}
                            onActionClick={(item: any) => handleViewSummary(item)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
