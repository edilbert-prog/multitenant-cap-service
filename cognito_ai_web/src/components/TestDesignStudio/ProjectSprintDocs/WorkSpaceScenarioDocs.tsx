// /mnt/data/WorkSpaceScenarioDocs
import React, { useEffect, useReducer, useRef } from 'react';
import { apiRequest } from "../../../utils/helpers/ApiHelper";
import { ChevronLeft, Info, RefreshCcw } from "lucide-react";
import FileUpload from "../../../utils/FileUpload";
import ProjectSprintSessionBPSPMapping from "./ProjectSprintSessionBPSPMapping";
import ProjectSprintSessionDetails from "./ProjectSprintSessionDetails";
import SpinningGear from "../../../utils/SpinningGear";
import socket from "../../../utils/socket";
import ProgressBar from "../../../utils/ProgressBar";
import CustomModal from "../../../utils/CustomModal";
import Nodata from "../../../assets/Nodata.svg";
import SpinnerV2 from "../../../utils/SpinnerV2";
import Dropdown from "../../../utils/Dropdown";
import axios from "axios";
import JiraIssueDisplay from "../../../utils/JiraIssueDisplay";
import { HostConfig } from '../../../../HostConfig'
import { motion } from "framer-motion";
import GenTSCSignavio from "../../../assets/icons/GenTSCSignavio.svg";
import GenTSCABAPProgram from "../../../assets/icons/GenTSCABAPProgram.svg";
import GenTSCJIRA from "../../../assets/icons/GenTSCJIRA.svg";
import GenTSCSAPConfig from "../../../assets/icons/GenTSCSAPConfig.svg";
import GenTSCDocument from "../../../assets/icons/GenTSCDocument.svg";
import FolderExplorer from "../../../utils/FolderExplorer";
import Accordion from "../../../utils/Accordion";
import SprintSessionTimelineV3 from "./SprintSessionTimelineV3";
import {FolderLinksIcon, SparklesIcon} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import DropdownV2 from "../../../utils/DropdownV2";
import GridTileV3 from "../../../utils/GridTilesV3";
import SearchBar from "../../../utils/SearchBar";
import useDebounce from "../../../utils/helpers/useDebounce";
import { StatusMessage } from "../../../utils/StatusMessage";
import {apiRequestForm} from "@/utils/helpers/ApiHelperForm";
import Spinner from "@/utils/Spinner";
import {useSidebar} from "@/utils/SidebarNav/SidebarContext";
import Textarea from "@/utils/theme/forms/Textarea";

interface FileUploadRef {
    upload: (metadata: Record<string, unknown>) => void;
}

interface ProjectSprintSessionBPSPMappingRef {
    handleSaveToSprint: (sessionId: string) => void;
}

interface DropdownOption {
    label?: string;
    value?: string;
    key?: string | number;
    [key: string]: unknown;
}

interface DropdownPropsCompat {
    mode: "single" | "multiple";
    options: DropdownOption[];
    value: string | number | null | undefined;
    onChange: (val: string, item: DropdownOption) => void;
    onSearch?: (q: string) => void;
    placeholder?: string;
    size?: "small" | "medium" | "large";
    searchable?: boolean;
    [key: string]: unknown;
}

// These imports are JS/JSX; TypeScript will treat them as any. The local
// interfaces above are for typing our usage and callbacks safely.
/* eslint-disable @typescript-eslint/no-unused-vars */
const _DropdownTypeGuard: (props: DropdownPropsCompat) => null = () => null;
const _DropdownV2TypeGuard: (props: DropdownPropsCompat) => null = () => null;
const _FileUploadRefGuard: (ref: FileUploadRef | null) => void = () => {};
const _PssMappingRefGuard: (ref: ProjectSprintSessionBPSPMappingRef | null) => void = () => {};
/* eslint-enable @typescript-eslint/no-unused-vars */

/** ===== Domain models used in this component ===== */

interface CurrentSprintInfo {
    ClientId: string;
    ProjectId: string;
    SprintId: string;
    BusinessUnitId: string;
    BusinessUnitName?: string;
    DocumentId?: string;
    BusinessProcessId?: string;
    [key: string]: unknown;
}

interface JiraConfig {
    AdapterId: string;
    HostName: string;
    BaseURL: string;
    Email: string;
    APIToken: string;
    [key: string]: unknown;
}

interface JiraIssueItem {
    key: string;
    label?: string;
    value?: string | number;
    description?: {
        content?: unknown[];
    };
    fields?: Record<string, unknown>;
    [key: string]: unknown;
}

interface AbapProgramsData {
    LOGIC_LINES: string;
    SELECTIONS: string;
    OUTPUT_LINES: string;
    [key: string]: unknown;
}

interface AbapProgramObj {
    Program: string;
    [key: string]: unknown;
}

interface CurrAddEditObj {
    ClientId: string;
    ProjectId: string;
    SprintId: string;
    SessionId: string;
    InputFileURL: string;
    MarkdownFileURL: string;
    SessionStatus: string;
    InputDoc: string;
    ElapsedTime?: string;
    StatusInfo?: string;
    StoryId?: string;
    [key: string]: unknown;
}

interface SessionListItem {
    id: string;
    ProjectId: string;
    BusinessUnitId?: string;
    BusinessProcessId?: string;
    ClientId: string;
    SessionId: string;
    SprintId: string;
    DocumentId?: string;
    SprintName?: string;
    ElapsedTime?: string;
    Documents?: unknown[];
    CreatedDate?: string;
    Progress?: React.ReactNode;
    EndDate?: string;
    status?: React.ReactNode;
    time?: string;
    action?: React.ReactNode;
    [key: string]: unknown;
}

interface SAPModuleItem {
    ModuleName?: string;
    label?: string;
    value?: string;
    [key: string]: unknown;
}

interface SAPConfigRow {
    TableName: string;
    Description?: string;
    [key: string]: unknown;
}

interface FilterObj {
    SourceType: string;
    [key: string]: unknown;
}

interface State {
    ActionType: string;
    SelectedActionType: string; 
    Error: string;
    SearchQuery: string;
    tab: string;
    CurrentPage: number;
    ViewSummary: boolean;
    UploadedFlag: boolean;
    ShowJiraStoryLoad: boolean;
    ExistingRecordConfirm: boolean;
    StoryModal: boolean;
    TotalRecords: number;
    UploadDocTab: number;
    CurrABAP_ProgramOBJ: AbapProgramObj;
    CurrSAPModule: string;
    AdditionalPrompt: string;
    CurrSAPConfigData: SAPConfigRow[];
    SourceTypes: { label: string; value: string }[];
    SAPModuleList: SAPModuleItem[];
    FilterObj: FilterObj;
    CurrentSprint: Partial<CurrentSprintInfo>;
    ABAP_ProgramsData: AbapProgramsData;
    CurrJIRAObj: { Project: string; Board?: string; Sprint?: string; Issue?: string; Story?: string; [k: string]: unknown };
    CurrJIRAStoryAObj: Partial<JiraIssueItem>;
    CurrJIRAConfig: JiraConfig;
    CurrentSession: Partial<SessionListItem>;
    CustomFileObj: File | null;
    ExistingDocumentDetails: Record<string, any>;
    LLMConfig: Record<string, any>;
    ProjectSprintList: SessionListItem[];
    ABAP_Programs: DropdownOption[];
    ModuleList: DropdownOption[];
    existingMarkdownList: { FileName: string; FileURL: string; SessionId: string }[];
    JiraProjectIssuesList: JiraIssueItem[];
    JiraBoardsList: DropdownOption[];
    JiraSprintsList: DropdownOption[];
    JiraProjectList: DropdownOption[];
    ViewSprintDetails: boolean;
    AdditionalPromptFlag: boolean;
    IsLoading: boolean;
    IsWorkspaceLoading: boolean;
    resetDocUpload: boolean;
    showToast: boolean;
    openModal: boolean;
    SavingLoader: boolean;
    ExistingDocModal: boolean;
    ExistingDocMSG: string;
    ShowExistingDocLeader: boolean;
    DocError: string;
    MetaData: Record<string, any>;
    CurrAddEditObj: CurrAddEditObj;
    ValidateFields: Record<string, string>;
    FormErrors: Record<string, string>;
    selectedMarkdown?: Record<string, unknown>;
}

interface Props {
    CurrentSprint: CurrentSprintInfo;
}

/** ===== Component ===== */

export default function WorkSpaceScenarioDocs(props: Props) {
    const { toggleCollapse } = useSidebar();
    const uploadRef = useRef<FileUploadRef | null>(null);
    const ProjectSprintSessionBPSPMappingRef = useRef<ProjectSprintSessionBPSPMappingRef | null>(null);

    const [state, setState] = useReducer(
        (prev: State, newState: Partial<State>): State => ({ ...prev, ...newState }),
        {
            ActionType: "",
             SelectedActionType: "", 
            AdditionalPrompt: "",
            Error: "",
            SearchQuery: "",
            tab: 'upload',
            CurrentPage: 1,
            ViewSummary: false,
            UploadedFlag: false,
            ShowJiraStoryLoad: false,
            ExistingRecordConfirm: false,
            StoryModal: false,
            TotalRecords: 1,
            UploadDocTab: 0,
            CurrABAP_ProgramOBJ: {
                Program: ""
            },
            CurrSAPModule: "",
            CurrSAPConfigData: [],
            SourceTypes: [
                { label: 'Document', value: 'Document' },
                { label: 'JIRA', value: 'JIRA' },
                { label: 'Signavio', value: 'Signavio' },
                { label: 'ABAP_Program', value: 'ABAP_Program' },
                { label: 'SAPConfig', value: 'SAPConfig' },
            ],
            SAPModuleList: [],
            FilterObj: { SourceType: "" },
            CurrentSprint: {},
            ABAP_ProgramsData: { LOGIC_LINES: "", SELECTIONS: "", OUTPUT_LINES: "" },
            CurrJIRAObj: { Project: "", Board: "", Sprint: "", Issue: "", Story: "" },
            CurrJIRAStoryAObj: { key: "" },
            CurrJIRAConfig: { AdapterId: "", HostName: "", BaseURL: "", Email: "", APIToken: "" },
            CurrentSession: {},
            CustomFileObj: null,
            ExistingDocumentDetails: {},
            LLMConfig: {},
            ProjectSprintList: [],
            ABAP_Programs: [],
            ModuleList: [],
            existingMarkdownList: [],
            JiraProjectIssuesList: [],
            JiraBoardsList: [],
            JiraSprintsList: [],
            JiraProjectList: [],
            ViewSprintDetails: false,
            AdditionalPromptFlag: false,
            IsLoading: true,
            resetDocUpload: false,
            IsWorkspaceLoading: false,
            showToast: false,
            openModal: false,
            SavingLoader: false,
            ExistingDocModal: false,
            ExistingDocMSG: "",
            ShowExistingDocLeader: false,
            DocError: "",
            MetaData: {},
            CurrAddEditObj: {
                ClientId: "",
                ProjectId: "",
                SprintId: "",
                SessionId: "",
                InputFileURL: "",
                MarkdownFileURL: "",
                SessionStatus: "",
                InputDoc: "",
            },
            ValidateFields: { InputDoc: "" },
            FormErrors: {},
        }
    );

    const actionTypeOptions = [
        { label: "Test Scenarios", value: "TestScenarios" },
        { label: "Document Summary", value: "DocumentSummary" },
        { label: "Test Cases", value: "TestCases" }
    ];

    const handleActionTypeChange = (val: any, item: any): void => {
        // Handle if DropdownV2 passes object instead of string
        const selectedValue = typeof val === "string" ? val : (val?.value || item?.value || "");
        console.log("Setting ActionType to:", selectedValue);
        setState({ SelectedActionType: selectedValue, DocError: "" });
    };

    const containerVariants = {
        hidden: {},
        show: { transition: { staggerChildren: 0.1 } },
    } as const;

    const searchParams = new URLSearchParams(location.search);
    const ClientIdFromUrl = searchParams.get("CLId") || "";
    const BusinessUnitIdName = searchParams.get("BUNM") || "";
    const BusinessUnitId = searchParams.get("BUID") || "";
    const sprintIdFromUrl = searchParams.get("SPRID") || "";
    const ProjectIdFromUrl = searchParams.get("PJID") || "";
    const BusinessProcessIdFromUrl = searchParams.get("BPID") ?? "";

    useEffect(() => {
        handleBack();
        const handler = (data: { SprintId?: string }) => {
            const searchParams2 = new URLSearchParams(location.search);
            const sprintIdFromUrl2 = searchParams2.get("SPRID");
            if (data.SprintId === sprintIdFromUrl2) {
                void getData();
            }
        };

        socket.on('session_status_updated', handler);
        return () => {
            socket.off('session_status_updated', handler);
        };
    }, [location.search]);

    useEffect(() => {
        const init = async () => {
            setState({ IsLoading: true, IsWorkspaceLoading:true });
            await getData();
            await getJIRAConfig();
            // await GetDefaultLLMEngineConfig();
            setState({ IsLoading: false,IsWorkspaceLoading:false });
        };
        void init();
    }, [sprintIdFromUrl, BusinessProcessIdFromUrl]);

    const getData = async (SearchQuery: string = "", SourceType: string = ""): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetWorkspaceScenarioDocuments", {
                StartDate: "",
                EndDate: "",
                WorkspaceId: props.CurrentSprint.WorkspaceId,
                SourceType,
                SearchString: SearchQuery,
                BusinessProcessId: BusinessProcessIdFromUrl,
                BusinessUnitId: BusinessUnitId,
                ClientId: ClientIdFromUrl ,
                ProjectId: ProjectIdFromUrl ,
                SprintId: sprintIdFromUrl,
            });

            if (resp.ResponseData.length > 0) {
                const finalSessionList: SessionListItem[] = [];
                const existingMarkdownList: { FileName: string; FileURL: string; SessionId: string }[] = [];

                resp.ResponseData.forEach((v: any) => {
                    finalSessionList.push({
                        id: v.SessionId,
                        ProjectId: v.ProjectId,
                        BusinessUnitId: BusinessUnitId,
                        BusinessProcessId: BusinessProcessIdFromUrl as string | undefined,
                        ClientId: v.ClientId,
                        SessionId: v.SessionId,
                        SprintId: v.SprintId,
                        DocumentId: v.DocumentId,
                        SprintName: v.SprintName,
                        ElapsedTime: v.ElapsedTime,
                        Documents: v.Documents || [],
                        CreatedDate: v.CreatedDate,
                        Progress: (
                            <div>
                                <ProgressBar height="h-5" value={v.Progress} />
                            </div>
                        ),
                        EndDate: v.EndDate,
                        status:
                            v.SessionStatus === "Completed" ? (
                                <div className="px-4 py-1 bg-green-100 ">
                                    <p className="text-green-700">Completed</p>
                                </div>
                            ) : (
                                <div className=" ">
                                    <div className="px-2.5 py-1 rounded-md bg-orange-100 flex items-center">
                                        <SpinningGear className="text-orange-700" size={15} />{" "}
                                        <p className="ml-2 text-orange-700 tesxt-[0.55rem] ">{v.StatusInfo}</p>
                                    </div>
                                </div>
                            ),
                        time: v.CreatedDate,
                        action: (
                            <button className="bg-[#323232] text-nowrap hover:bg-[#323232] cursor-pointer text-gray-50 px-3 py-1 rounded text-sm">
                                Test Scenarios
                            </button>
                        ),
                    });

                    // Existing markdown handling intentionally preserved but commented as in original.
                });

                setState({
                    ProjectSprintList: finalSessionList,
                    existingMarkdownList,
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

    const GetDefaultLLMEngineConfig = async (): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetDefaultLLMEngineConfig", {});
            if (resp.ResponseData.length > 0) {
                setState({ LLMConfig: resp.ResponseData[0] });
            }
        } catch (err: any) {
            setState({ Error: err.toString() });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const getJIRAConfig = async (SearchQuery: string = ""): Promise<void> => {
        try {
            const resp: any = await apiRequest("/adapters/GetAdaptersMasterPaginationFilterSearch", {

                StartDate: "", EndDate: "", SearchString: SearchQuery
            });

            if (resp.ResponseData.length > 0) {
                const filteredObj = resp.ResponseData.filter((v: any) => v.BaseURL?.includes('atlassian'));
                if (filteredObj.length > 0) {
                    setState({ CurrJIRAConfig: filteredObj[0] });
                }
            }
        } catch (err: any) {
            setState({ Error: err.toString() });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const GetJiraSprintsByBoard = async (boardId: string): Promise<void> => {
        try {
            const reqObj = { credentials: CurrJIRAConfig, boardId };
            const resp: any = await apiRequest("/GetJiraSprintsByBoard", reqObj);
            setState({ JiraSprintsList: resp.ResponseData });
        } catch (err: any) {
            setState({ Error: err.toString() });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const GetJiraIssuesBySprint = async (CurrJIRAConfig: JiraConfig, sprintId: string): Promise<void> => {
        try {
            const reqObj = { credentials: CurrJIRAConfig, sprintId };
            const resp: any = await apiRequest("/GetJiraIssuesBySprint", reqObj);
            setState({ JiraProjectIssuesList: resp.ResponseData });
        } catch (err: any) {
            setState({ Error: err.toString() });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const GetJiraProjects = async () => {
        try {
            const resp: any = await apiRequest("/GetJiraProjects", {});
            if (resp.ResponseData.length > 0) {
                setState({ JiraProjectList: resp.ResponseData });
            }
        } catch (err: any) {
            setState({ Error: err.toString() });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const GetABAP_Programs = async (page_no: string = "1", limit: number = 50, search_string: string = ""): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetABAP_ProgramsList", { page_no, limit, search_string });
            if (resp.ResponseData.length > 0) {
                setState({ ABAP_Programs: resp.ResponseData });
            }
        } catch (err: any) {
            setState({ Error: err.toString() });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const GetABAP_ProgramData = async (program_name: string = ""): Promise<void> => {
        setState({ ShowJiraStoryLoad: true });
        try {
            const resp: any = await apiRequest("/GetABAP_ProgramsData", { program_name });
            if (resp.ResponseData) {
                setState({ ABAP_ProgramsData: resp.ResponseData });
                if (!Object.values(resp.ResponseData as AbapProgramsData).every(value => value === "")) {
                    handleCurrABAP_Program(resp.ResponseData as AbapProgramsData);
                }
            }
            setState({ ShowJiraStoryLoad: false });
        } catch (err: any) {
            setState({ Error: err.toString() });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const GetSAPModulesMaster = async (): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetSAPModulesMaster", {});
            setState({ SAPModuleList: resp.ResponseData });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error("Error loading Country/State/City:", err);
        }
    };

    const GetSAPConfigData = async (ModuleObj: SAPModuleItem = {}): Promise<void> => {
        setState({ ShowJiraStoryLoad: true });
        try {
            const resp: any = await apiRequest("/GetSAPModuleSubModuleTablesMaster", {
                Module: ModuleObj.ModuleName,
                TableType: "Configuration"
            });
            if (resp.ResponseData) {
                setState({ CurrSAPConfigData: resp.ResponseData as SAPConfigRow[] });
                if ((resp.ResponseData as SAPConfigRow[]).length > 0) {
                    handleCreateFileSAPConfigData(resp.ResponseData as SAPConfigRow[], ModuleObj);
                }
            }
            setState({ ShowJiraStoryLoad: false });
        } catch (err: any) {
            setState({ Error: err.toString() });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const handleRefreshData = async (): Promise<void> => {
        await getData(debouncedSearchQuery, state.FilterObj.SourceType);
    };

    const handleDeleteSession = async (reqObj: Record<string, unknown>): Promise<void> => {
        await apiRequest("/DeleteProjectSprintSessions", reqObj);
        await getData(debouncedSearchQuery, state.FilterObj.SourceType);
    };

    const GetJiraIssues = async (projectKey: string): Promise<void> => {
        try {
            setState({ ShowJiraStoryLoad: true });
            const reqObj = {  projectKey };
            const resp: any = await apiRequest("/GetJiraIssuesByProject", reqObj);
            if (resp.ResponseData.length > 0) {
                setState({ JiraProjectIssuesList: resp.ResponseData });
            }
        } catch (err: any) {
            setState({ Error: err.toString() });
        } finally {
            setState({ IsLoading: false });
            setState({ ShowJiraStoryLoad: false });
        }
    };

    const debouncedSearchQuery: string = useDebounce(state.SearchQuery, 300) as string;
    const didSearchRun = useRef<boolean>(false);

    useEffect(() => {
        if (!didSearchRun.current) {
            didSearchRun.current = true;
            return;
        }
        if (debouncedSearchQuery.trim() === "") return;
        void getData(debouncedSearchQuery, state.FilterObj.SourceType);
    }, [debouncedSearchQuery]);

    const handleSearch = (value: string): void => {
        setState({ SearchQuery: value });
        if (value.trim() === "") {
            void getData("", state.FilterObj.SourceType);
        }
    };

    const handleGetDataBySourceType = async (val: string, _item: DropdownOption, name: string): Promise<void> => {
        const FilterObj = { ...state.FilterObj };
        FilterObj[name] = val;
        setState({ FilterObj });
        await getData(debouncedSearchQuery, val);
    };

    const handleBack = (): void => {
        setState({ ViewSprintDetails: false, CurrentSession: {} });
    };

    const handleViewSummary = (item: SessionListItem): void => {
        setState({ ViewSprintDetails: true, CurrentSession: item });
        toggleCollapse()
    };

    const handleGenerateScenarios = (): void => {
        const CurrAddEditObj: CurrAddEditObj = {
            ClientId: ClientIdFromUrl ,
            ProjectId: ProjectIdFromUrl,
            SprintId: sprintIdFromUrl,
            SessionId: "",
            InputFileURL: "",
            MarkdownFileURL: "",
            SessionStatus: "",
            ElapsedTime: "",
            StatusInfo: "",
            InputDoc: "",
        };
        setState({
            openModal: true,AdditionalPrompt:"",AdditionalPromptFlag:false , UploadedFlag: false, ActionType: "Add", SelectedActionType: "", DocError: "", CurrAddEditObj, selectedMarkdown: {}
        });

        setState({ UploadDocTab: 0, DocError: "" });

        const CurrJIRAObj = { Project: "", Issue: "", Story: "" };
        const CurrJIRAStoryAObj: Record<string, unknown> = {};
        const CurrentSession: Record<string, unknown> = {};
        const ABAP_ProgramsData: AbapProgramsData = { LOGIC_LINES: "", SELECTIONS: "", OUTPUT_LINES: "" };
        const CurrABAP_ProgramOBJ: AbapProgramObj = { Program: "" };

        CurrAddEditObj.InputDoc = "";

        setState({
            CurrentSession,
            CurrJIRAStoryAObj,
            CurrABAP_ProgramOBJ,
            CurrAddEditObj,
            ABAP_ProgramsData,
            CurrJIRAObj,
            CurrSAPModule: "",
            CurrSAPConfigData: [],
            JiraProjectIssuesList: [],
            JiraProjectList: []
        });
    };

    const handleCancel = (): void => {
        const CurrAddEditObj: CurrAddEditObj = {
            ClientId: "",
            ProjectId: "",
            SprintId: "",
            SessionId: "",
            InputFileURL: "",
            MarkdownFileURL: "",
            SessionStatus: "",
            ElapsedTime: "",
            StatusInfo: "",
            InputDoc: "",
        };
        setState({ openModal: false, CurrAddEditObj,AdditionalPrompt:"",AdditionalPromptFlag:false });
    };

    function filterSelectedOrIndeterminate(processes: any[]): any[] {
        return (processes || [])
            .map((process: any) => {
                const filteredSubProcesses = filterSelectedOrIndeterminate(process.SubProcesses || []);
                const isSelected = process.selected || process.indeterminate || filteredSubProcesses.length > 0;
                if (!isSelected) return null;
                return { ...process, SubProcesses: filteredSubProcesses };
            })
            .filter(Boolean);
    }

//     const triggerUpload = (metaData: Record<string, unknown>, BPData: any, SessionId: string, SourceType: string): void => {
//     if (uploadRef.current) {
//         const metData: Record<string, unknown> = {
//             ClientId: ClientIdFromUrl ,
//             ProjectId: ProjectIdFromUrl ,
//             SprintId: sprintIdFromUrl ,
//             DocumentId: (props.CurrentSprint as any).DocumentId,
//             BusinessUnitId: props.CurrentSprint.BusinessUnitId,
//             BusinessUnitName: BusinessUnitIdName ? BusinessUnitIdName : props.CurrentSprint.BusinessUnitName,
//             ActionType: state.SelectedActionType,
//             AdditionalPrompt: state.AdditionalPrompt,
//             InputFilePath: "",
//             WorkspaceId: "",
//             SourceType,
//             MarkdownFilePath: "",
//             SessionId,
//             BusinessProcesses: JSON.stringify(filterSelectedOrIndeterminate(BPData?.BusinessProcesses))
//         };
//         console.log("metDatametDatametDatametDatametData",metData)
//         uploadRef.current.upload(metData);
//     }
// };



    // const handleInitiateSession = async (): Promise<void> => {
    //     const CurrAddEditObj = { ...state.CurrAddEditObj };
    //
    //     if (state.UploadDocTab > 0) {
    //         if (CurrAddEditObj.InputDoc !== "") {
    //             let SourceType = "";
    //             if (state.UploadDocTab === 1) SourceType = "Document";
    //             else if (state.UploadDocTab === 2) SourceType = "JIRA";
    //             else if (state.UploadDocTab === 3) SourceType = "Signavio";
    //             else if (state.UploadDocTab === 4) SourceType = "ABAP_Program";
    //             else if (state.UploadDocTab === 5) SourceType = "SAPConfig";
    //
    //             let StatusInfo = "";
    //             if (SourceType === "Document") StatusInfo = "Reading Document";
    //             else if (SourceType === "JIRA") StatusInfo = "Reading JIRA Story";
    //             else if (SourceType === "Signavio") StatusInfo = "Parsing Signavio Image";
    //             else if (SourceType === "ABAP_Program") StatusInfo = "Reading ABAP Program";
    //             else if (SourceType === "SAPConfig") StatusInfo = "Reading SAP Config Tables";
    //
    //             setState({ SavingLoader: true });
    //             CurrAddEditObj.SessionStatus = "Starting";
    //             CurrAddEditObj.StatusInfo = StatusInfo;
    //
    //             if (state.ExistingRecordConfirm) {
    //                 CurrAddEditObj.SessionStatus = "Starting";
    //                 CurrAddEditObj.SessionId = state.ExistingDocumentDetails.SessionId as string;
    //                 CurrAddEditObj.StatusInfo = StatusInfo;
    //             }
    //
    //             CurrAddEditObj.StoryId = state.CurrJIRAStoryAObj?.key;
    //
    //             const resp: any = await apiRequest("/AddUpdateProjectSprintSession", CurrAddEditObj);
    //             if (resp) {
    //                 const newSessionId: string = state.ExistingRecordConfirm ? (state.ExistingDocumentDetails.SessionId as string) : resp.addProjectSprintSessionDocs.insertId;
    //
    //                 if (ProjectSprintSessionBPSPMappingRef.current) {
    //                     ProjectSprintSessionBPSPMappingRef.current.handleSaveToSprint(newSessionId);
    //                 }
    //
    //                 if (state.UploadDocTab === 2 || state.UploadDocTab === 3 || state.UploadDocTab === 4 || state.UploadDocTab === 5) {
    //                     await handleUpload(
    //                         state.CustomFileObj as File,
    //                         state.MetaData,
    //                         newSessionId,
    //                         state.CurrJIRAStoryAObj?.key || "",
    //                         SourceType
    //                     );
    //                 } else {
    //                     triggerUpload({}, state.MetaData, newSessionId, SourceType);
    //                 }
    //
    //             }
    //         } else {
    //             setState({ DocError: "Select a document or JIRA story to proceed." });
    //         }
    //     } else {
    //         setState({ DocError: "Select a document or JIRA story to proceed." });
    //     }
    // };


    const handleChangeAdditionalText: (e: any) => void =  (e:any)=>{
        setState({AdditionalPrompt:e.target.value})
    }
//     const handleAdditonalPrompt: (e: any) => void =  (e:any)=>{
//             setState({AdditionalPromptFlag:e.target.checked,AdditionalPrompt:""})
//     }
//     const handleUpload = async (
//         file: File,
//         BPData: any,
//         SessionId: string,
//         fileName: string = "",
//         SourceType: string
//     ): Promise<void> => {
//         console.log("Upload triggered - ActionType:", state.SelectedActionType);
// console.log("Full state:", state);
//
//         if (!state.SelectedActionType) {
//             setState({ DocError: "Please select an Action Type before uploading" });
//             return;
//         }
//
//         if (!state.ExistingRecordConfirm) {
//             const metData: Record<string, unknown> = {
//                 ClientId: ClientIdFromUrl ? ClientIdFromUrl : props.CurrentSprint.ClientId,
//                 ProjectId: ProjectIdFromUrl ? ProjectIdFromUrl : props.CurrentSprint.ProjectId,
//                 SprintId: sprintIdFromUrl ? sprintIdFromUrl : props.CurrentSprint.SprintId,
//                 DocumentId: "",
//                 ExistingRecordConfirm: state.ExistingRecordConfirm,
//                 ExistingDocumentDetails: state.ExistingDocumentDetails,
//                 BusinessUnitId: props.CurrentSprint.BusinessUnitId,
//                 BusinessUnitName: BusinessUnitIdName ? BusinessUnitIdName : props.CurrentSprint.BusinessUnitName,
//                 ActionType: state.SelectedActionType,
//                 AdditionalPrompt: state.AdditionalPrompt,
//                 InputFilePath: "",
//                 WorkspaceId: "",
//                 SourceType,
//                 MarkdownFilePath: "",
//                 // LLMConfig: JSON.stringify(state.LLMConfig),
//                 SessionId,
//                 BusinessProcesses: JSON.stringify(BPData?.BusinessProcesses)
//             };
//             console.log("metDatametDatametDatametDatametData",metData)
//             const formData = new FormData();
//             formData.append('file', file);
//             Object.keys(metData).forEach((key) => {
//                 formData.append(key, metData[key] as string);
//             });
//
//             try {
//                 setTimeout(() => {
//                     void getData(debouncedSearchQuery, state.FilterObj.SourceType);
//                     setState({ SavingLoader: false, openModal: false, showToast: true, ActionType: "", SelectedActionType: "" });
//                 }, 500);
//                 await apiRequestForm('/cognito/api/llm/UploadDocumentNew',formData)
//             } catch (err) {
//                 // eslint-disable-next-line no-console
//                 console.error(err);
//             }
//         } else {
//             const metData: Record<string, unknown> = {
//                 ClientId: ClientIdFromUrl ? ClientIdFromUrl : props.CurrentSprint.ClientId,
//                 ProjectId: ProjectIdFromUrl ? ProjectIdFromUrl : props.CurrentSprint.ProjectId,
//                 SprintId: sprintIdFromUrl ? sprintIdFromUrl : props.CurrentSprint.SprintId,
//                 DocumentId: state.ExistingDocumentDetails.DocumentId,
//                 ExistingRecordConfirm: state.ExistingRecordConfirm,
//                 ExistingDocumentDetails: state.ExistingDocumentDetails,
//                 BusinessUnitId: state.ExistingDocumentDetails.BusinessUnitId,
//                 BusinessUnitName: BusinessUnitIdName ? BusinessUnitIdName : props.CurrentSprint.BusinessUnitName,
//                 // ActionType: "",
//                 ActionType: state.SelectedActionType,
//                 AdditionalPrompt: state.AdditionalPrompt,
//                 InputFileURL: state.ExistingDocumentDetails.InputFileURL,
//                 SourceType,
//                 MarkdownFileURL: state.ExistingDocumentDetails.MarkdownFileURL,
//                 // LLMConfig: JSON.stringify(state.LLMConfig),
//                 SessionId,
//                 BusinessProcesses: JSON.stringify(BPData?.BusinessProcesses)
//             };
//
//             setTimeout(() => {
//                 void getData(debouncedSearchQuery, state.FilterObj.SourceType);
//                 // setState({ SavingLoader: false, openModal: false, showToast: true, ActionType: "" });
//                 setState({ SavingLoader: false, openModal: false, showToast: true, ActionType: "", SelectedActionType: "" });
//             }, 500);
//             await axios.post("https://sirobilt.ai:8050/api/GenerateDataByExistingDocument", metData);
//         }
//     };
//
//     const handleUploadDocTab = async (tab: number): Promise<void> => {
//         setState({ UploadDocTab: tab, DocError: "", ExistingRecordConfirm: false, SelectedActionType: "" });
//
//         if (tab === 0) {
//             const CurrJIRAObj = { Project: "", Issue: "", Story: "" };
//             const CurrJIRAStoryAObj: Record<string, unknown> = {};
//             const CurrentSession: Record<string, unknown> = {};
//             const ABAP_ProgramsData: AbapProgramsData = { LOGIC_LINES: "", SELECTIONS: "", OUTPUT_LINES: "" };
//             const CurrABAP_ProgramOBJ: AbapProgramObj = { Program: "" };
//             const CurrAddEditObj = { ...state.CurrAddEditObj, InputDoc: "" };
//
//             setState({
//                 CurrentSession,
//                 CurrJIRAStoryAObj,
//                 CurrABAP_ProgramOBJ,
//                 CurrAddEditObj,
//                 ABAP_ProgramsData,
//                 CurrJIRAObj,
//                 CurrSAPModule: "",
//                 CurrSAPConfigData: [],
//                 JiraProjectIssuesList: [],
//                 JiraProjectList: []
//             });
//         }
//         if (tab === 2) {
//             await GetJiraProjects();
//         }
//         if (tab === 4) {
//             await GetABAP_Programs();
//         }
//         if (tab === 5) {
//             await GetSAPModulesMaster();
//         }
//
//         const CurrAddEditObj = { ...state.CurrAddEditObj, InputDoc: "" };
//         setState({ CurrAddEditObj });
//     };
//
//     const handlePayload = (Payload: Record<string, any>): void => {
//         if (Payload) {
//             setState({ MetaData: Payload });
//         }
//     };

    const extractTextFromJiraContent = (content: any[] = []): string => {
        let result = "";
        content.forEach((block: any) => {
            if (block.type === "paragraph" && Array.isArray(block.content)) {
                block.content.forEach((textNode: any) => {
                    if (textNode.type === "text") {
                        result += textNode.text;
                    } else if (textNode.type === "hardBreak") {
                        result += "\n";
                    }
                });
                result += "\n\n";
            }

            if (block.type === "bulletList" || block.type === "orderedList") {
                const isOrdered = block.type === "orderedList";
                block.content?.forEach((li: any, index: number) => {
                    const prefix = isOrdered ? `${index + 1}. ` : "- ";
                    result += prefix + extractTextFromJiraContent(li.content).trim() + "\n";
                });
                result += "\n";
            }
        });
        return result.trim();
    };

    function formatJsonToTextSections(json: AbapProgramsData): string {
        const sections = ['LOGIC_LINES', 'SELECTIONS', 'OUTPUT_LINES'] as const;
        let formattedText = '';
        for (const section of sections) {
            if ((json as Record<string, string>)[section]) {
                formattedText += `===== ${section} =====\n`;
                formattedText += `${(json as Record<string, string>)[section]}\n\n`;
            }
        }
        return formattedText.trim();
    }

    const createFileObject = async (filePath: string): Promise<File> => {
        const response = await fetch(`/${filePath}`);
        const data = await response.blob();
        const file = new File([data], filePath, { type: (data as Blob).type });
        return file;
    };

    const handleCurrentSignavioFileSelect = async (filePath: string): Promise<void> => {
        const CurrAddEditObj = { ...state.CurrAddEditObj, InputDoc: "CustomFile" };
        setState({ CurrAddEditObj });
        const file = await createFileObject(filePath);
        setState({ CustomFileObj: file });
    };

    const handleCurrIssue = async (item: JiraIssueItem): Promise<void> => {
        const CurrAddEditObj = { ...state.CurrAddEditObj, InputDoc: "CustomFile" };
        setState({ CurrAddEditObj, CurrJIRAStoryAObj: item });

        let plainText = "";
        const FileName = `StoryID-${item.key}.txt`;
        plainText = extractTextFromJiraContent((item as any)?.description?.content);

        // setState({ ShowExistingDocLeader: true, ExistingRecordConfirm: false });
        if (plainText) {
            const blob = new Blob([plainText], { type: 'text/plain' });
            const file = new File([blob], FileName, { type: 'text/plain' });
            setState({ CustomFileObj: file });
        }
        // const resp: any = await apiRequest("/CheckDocumentScenariosByName", {
        //     DocumentName: FileName,
        //     ClientId: ClientIdFromUrl,
        //     ProjectId: ProjectIdFromUrl,
        //     SprintId: sprintIdFromUrl,
        // });
        //
        // if (resp.ResponseData.length > 0) {
        //     setState({
        //         ExistingDocumentDetails: resp.ResponseData[0],
        //         ExistingDocMSG: "Scenarios have already been created for the selected story.\nWould you like to regenerate them?",
        //         ExistingDocModal: true
        //     });
        // } else {
        //     if (plainText) {
        //         const blob = new Blob([plainText], { type: 'text/plain' });
        //         const file = new File([blob], FileName, { type: 'text/plain' });
        //         setState({ CustomFileObj: file });
        //     }
        // }
        // setState({ ShowExistingDocLeader: false });
    };

    const handleCreateFileSAPConfigData = (item: SAPConfigRow[], ModuleObj: SAPModuleItem): void => {
        const CurrAddEditObj = { ...state.CurrAddEditObj, InputDoc: "CustomFile" };
        setState({ CurrAddEditObj });
        const FileName = `${ModuleObj.label}.txt`;
        const jsonString = JSON.stringify(item, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const file = new File([blob], FileName, { type: 'application/json' });
        setState({ CustomFileObj: file });
    };

    const handleCurrABAP_Program = (item: AbapProgramsData): void => {
        const CurrAddEditObj = { ...state.CurrAddEditObj, InputDoc: "CustomFile" };
        setState({ CurrAddEditObj });
        const CurrABAP_ProgramOBJ = { ...state.CurrABAP_ProgramOBJ };
        const FileName = `${CurrABAP_ProgramOBJ.Program}.txt`;
        const plainText = formatJsonToTextSections(item);
        if (plainText) {
            const blob = new Blob([plainText], { type: 'text/plain' });
            const file = new File([blob], FileName, { type: 'text/plain' });
            setState({ CustomFileObj: file });
        }
    };

    const handleDropdownClientInfo = (val: string, _options: DropdownOption, name: string): void => {
        const CurrJIRAObj = { ...state.CurrJIRAObj, [name]: val };
        setState({ CurrJIRAObj });
        if (name === "Project") {
            void GetJiraIssues( CurrJIRAObj.Project);
        }
    };

    const handleDropdownSAPConfigData = (val: string, options: SAPModuleItem): void => {
        let CurrSAPModule = state.CurrSAPModule;
        CurrSAPModule = val;
        setState({ CurrSAPModule });
        if (val) {
            void GetSAPConfigData(options);
        } else {
            setState({ CurrSAPConfigData: [] });
        }
    };

    const handleDropdownABAP_Program = (val: string, _options: DropdownOption, name: string): void => {
        const CurrABAP_ProgramOBJ = { ...state.CurrABAP_ProgramOBJ, [name]: val };
        setState({ CurrABAP_ProgramOBJ });
        void GetABAP_ProgramData(CurrABAP_ProgramOBJ.Program);
    };

    interface Tile {
        icon: React.ReactNode;
        key: number;
        title: string;
        subtitle: string;
        route: string;
    }

    const tiles: Tile[] = [
        { icon: <img src={GenTSCDocument} alt="" className="w-38" />, key: 1, title: "Document", subtitle: "Upload in .docx, .txt, .png format", route: "/performance" },
        { icon: <img src={GenTSCJIRA} className="w-38" />, key: 2, title: "JIRA", subtitle: "Extract JIRA Story", route: "/settings" },
        { key: 3, icon: <img src={GenTSCSignavio} className="w-38" />, title: "Signavio", subtitle: "Extract files from the signavio ", route: "/settings" },
        { key: 4, icon: <img src={GenTSCABAPProgram} className="w-38" />, title: "ABAP Program", subtitle: "Select ABAP program.", route: "/settings" },
        { key: 5, icon: <img src={GenTSCSAPConfig} className="w-38" />, title: "SAP Config", subtitle: "SAP Configuration", route: "/settings" },
    ];

    return (
        <div className="">
            <CustomModal
                modalZIndex={1000}
                width="max-w-6xl"
                isOpen={state.StoryModal}
                onClose={() => setState({ StoryModal: false })}
                title={state.CurrJIRAObj.Project}
                footerContent={[
                    <button
                        key="close"
                        onClick={() => setState({ StoryModal: false })}
                        className="mt-2 px-5 cursor-pointer py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg"
                    >
                        Close
                    </button>
                ]}
            >
                <div className="  flex flex-col">
                    <div className=" ">
                        <div>
                            <JiraIssueDisplay fields={state.CurrJIRAStoryAObj?.fields} />
                        </div>
                    </div>
                </div>
            </CustomModal>

            <CustomModal
                modalZIndex={1000}
                width="max-w-3xl"
                isOpen={state.ExistingDocModal}
                onClose={() => setState({ ExistingDocModal: false })}
                title={"Document Already Existing"}
                footerContent={[
                    <button
                        key="no"
                        onClick={() => setState({ ExistingDocModal: false })}
                        className=" px-5 cursor-pointer py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg"
                    >
                        No
                    </button>,
                    <button
                        key="yes"
                        onClick={() => { setState({ ExistingRecordConfirm: true, ExistingDocModal: false }) }}
                        className="bg-[#0071E9] text-nowrap font-semibold  hover:bg-[#005ABA]  cursor-pointer text-white  py-2 px-3 rounded-lg flex items-center space-x-2"
                    >
                        <span>Yes</span>
                    </button>
                ]}
            >
                <div className="  flex flex-col">
                    <div className=" ">
                        <div>
                            <StatusMessage className="bg-white" size={90} strokeWidth={5} status="fail" message={state.ExistingDocMSG} />
                        </div>
                        <div></div>
                    </div>
                </div>
            </CustomModal>

            {/*<CustomModal*/}
            {/*    DisableScroll={true}*/}
            {/*    width={`${state.UploadDocTab === 0 ? 'max-w-4xl' : 'max-w-7xl'}`}*/}
            {/*    isOpen={state.openModal}*/}
            {/*    onClose={() => setState({ openModal: false })}*/}
            {/*    title={*/}
            {/*        <div className="">*/}
            {/*            <p className="text-lg font-bold">Generate Test Scenarios</p>*/}
            {/*            {state.UploadDocTab === 0 && <p className="text-sm text-[#616161]">Select source to generate test scenarios</p>}*/}
            {/*        </div>*/}
            {/*    }*/}
            {/*    footerContent={[*/}
            {/*        <button*/}
            {/*            key="cancel"*/}
            {/*            onClick={handleCancel}*/}
            {/*            className="mt-2 px-5 cursor-pointer py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg"*/}
            {/*        >*/}
            {/*            Cancel*/}
            {/*        </button>,*/}
            {/*        <button*/}
            {/*            key="generate"*/}
            {/*            onClick={handleInitiateSession}*/}
            {/*            className={`${state.UploadDocTab === 0 ? 'hidden' : "block"} mt-2 cursor-pointer py-2 px-3 rounded-lg  bg-[#0071E9] text-white  space-x-2`}*/}
            {/*        >*/}
            {/*            <div>*/}
            {/*                {state.SavingLoader ? (*/}
            {/*                    <div className="flex items-center">*/}
            {/*                        <Spinner color="white" size="xs" />*/}
            {/*                        <div className="flex items-center">*/}
            {/*                            <span className="pl-2">Generating...</span>*/}
            {/*                        </div>*/}
            {/*                    </div>*/}
            {/*                ) : (*/}
            {/*                    <div className="flex items-center">*/}
            {/*                        <HugeiconsIcon size={19} icon={SparklesIcon} />*/}
            {/*                        <span className="pl-2">Generate Test Scenarios</span>*/}
            {/*                    </div>*/}
            {/*                )}*/}
            {/*            </div>*/}
            {/*        </button>,*/}
            {/*    ]}*/}
            {/*>*/}
            {/*    <div className="y-5 h-full relative flex flex-col">*/}
            {/*        <div className="grid grid-cols-12 gap-2">*/}
            {/*            <div className={state.UploadDocTab === 0 ? `col-span-12 --100` : `col-span-5  `}>*/}
            {/*                <div className="  ">*/}
            {/*                    {state.UploadDocTab === 0 && (*/}
            {/*                        <div className="w-full">*/}
            {/*                            <motion.div className="grid grid-cols-3 place-items-center gap-y-6 " variants={containerVariants} initial="hidden" animate="show">*/}
            {/*                                {tiles.map((tile, i) => (*/}
            {/*                                    <GridTileV3*/}
            {/*                                        // eslint-disable-next-line @typescript-eslint/no-empty-function*/}
            {/*                                        onClick={tile.key === 1 || tile.key === 2 || tile.key === 3 || tile.key === 4 || tile.key === 5 ? () => handleUploadDocTab(tile.key) : undefined}*/}
            {/*                                        key={i}*/}
            {/*                                        icon={tile.icon}*/}
            {/*                                        title={tile.title}*/}
            {/*                                        subtitle={tile.subtitle}*/}
            {/*                                        route={tile.route}*/}
            {/*                                        index={i}*/}
            {/*                                        gradientOpacity={1}*/}
            {/*                                        dark={0.2}*/}
            {/*                                    />*/}
            {/*                                ))}*/}
            {/*                            </motion.div>*/}
            {/*                        </div>*/}
            {/*                    )}*/}

            {/*                    {state.UploadDocTab === 1 && (*/}
            {/*                        <div className="">*/}
            {/*                            <div onClick={() => handleUploadDocTab(0)} className="flex items-center cursor-pointer bg-[#f3f3f3]  w-fit px-4 py-1 rounded-full">*/}
            {/*                                <ChevronLeft className="text-gray-700" /> <span className="font-medium text-sm text-gray-700"> Back</span>*/}
            {/*                            </div>*/}
            {/*                            <div className=" pt-3   rounded-lg ">*/}
            {/*                                /!* NEW: Action Item Dropdown *!/*/}
            {/*                                <div className="mb-4">*/}
            {/*                                    <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-2">*/}
            {/*                                        Action Item <span className="text-red-500">*</span>*/}
            {/*                                    </label>*/}
            {/*                                    <DropdownV2*/}
            {/*                                        size="medium"*/}
            {/*                                        mode="single"*/}
            {/*                                        searchable={false}*/}
            {/*                                        options={actionTypeOptions}*/}
            {/*                                        value={state.SelectedActionType}*/}
            {/*                                        onChange={handleActionTypeChange}*/}
            {/*                                        placeholder="Select Action Type"*/}
            {/*                                    />*/}
            {/*                                    {!state.SelectedActionType && state.DocError && (*/}
            {/*                                        <p className="text-red-600 text-sm mt-1">Please select an action type</p>*/}
            {/*                                    )}*/}
            {/*                                </div>*/}

            {/*                                <FileUpload*/}
            {/*                                    multi={true}*/}
            {/*                                    customFile={state.UploadDocTab === 2}*/}
            {/*                                    CustomFileObj={state.CustomFileObj as any}*/}
            {/*                                    onFileSelect={(fileName: string) => {*/}
            {/*                                        const CurrAddEditObj = { ...state.CurrAddEditObj, InputDoc: fileName };*/}
            {/*                                        setState({ CurrAddEditObj });*/}
            {/*                                    }}*/}
            {/*                                    ref={uploadRef as any}*/}
            {/*                                    url={`/cognito/api/llm/UploadDocumentNew`}*/}
            {/*                                    disabled={false}*/}
            {/*                                    reset={false}*/}
            {/*                                    onSuccess={(_UploadedFlag: boolean) => {*/}
            {/*                                        setTimeout(() => {*/}
            {/*                                            void getData(debouncedSearchQuery, state.FilterObj.SourceType);*/}
            {/*                                            setState({ SavingLoader: false, openModal: false, showToast: true, ActionType: "", SelectedActionType: "" });*/}
            {/*                                        }, 500);*/}
            {/*                                        setTimeout(() => { setState({ showToast: false }); }, 3000);*/}
            {/*                                    }}*/}
            {/*                                />*/}
            {/*                                <div className="bg-white pt-3 resi">*/}
            {/*                                    <label className="relative inline-flex items-center cursor-pointer">*/}
            {/*                                        <input*/}
            {/*                                            type="checkbox"*/}
            {/*                                            checked={state.AdditionalPromptFlag}*/}
            {/*                                            onChange={(e) => handleAdditonalPrompt(e)}*/}
            {/*                                            className="sr-only peer"*/}
            {/*                                        />*/}
            {/*                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>*/}
            {/*                                        <p className="ml-3">Additional Prompt</p>*/}
            {/*                                    </label>*/}
            {/*                                    {state.AdditionalPromptFlag && <Textarea value={state.AdditionalPrompt} placeholder="Enter prompt.." onChange={handleChangeAdditionalText}/>}*/}
            {/*                                </div>*/}
            {/*                            </div>*/}
            {/*                        </div>*/}
            {/*                    )}*/}

            {/*                    {state.UploadDocTab === 2 && (*/}
            {/*                        <div className="w-full">*/}
            {/*                            <div onClick={() => handleUploadDocTab(0)} className="flex items-center cursor-pointer bg-[#f3f3f3]  w-fit px-4 py-1 rounded-full">*/}
            {/*                                <ChevronLeft className="text-gray-700" /> <span className="font-medium text-sm text-gray-700"> Back</span>*/}
            {/*                            </div>*/}
            {/*                            <div className="  pt-4 border-gray-200 rounded-lg ">*/}
            {/*                                <div className="">*/}
            {/*                                    <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">*/}
            {/*                                        Select a JIRA Project <span className="text-red-500">*</span>*/}
            {/*                                    </label>*/}
            {/*                                    <Dropdown*/}
            {/*                                        mode="single"*/}
            {/*                                        options={state.JiraProjectList}*/}
            {/*                                        value={state.CurrJIRAObj.Project}*/}
            {/*                                        onChange={(val: string, item: DropdownOption) => handleDropdownClientInfo(val, item, "Project")}*/}
            {/*                                        onSearch={(_q: string) => null}*/}
            {/*                                    />*/}
            {/*                                </div>*/}

            {/*                                <div className=" ">*/}
            {/*                                    <p className="font-medium pb-4 pt-6">Select a Story</p>*/}
            {/*                                    {state.ShowJiraStoryLoad ? (*/}
            {/*                                        <div className="py-8">*/}
            {/*                                            <SpinnerV2 {...{ text: "Getting stories.." }} />*/}
            {/*                                        </div>*/}
            {/*                                    ) : (*/}
            {/*                                        <div className="overflow-y-auto h-[calc(50vh-10px)]">*/}
            {/*                                            {state.JiraProjectIssuesList.map((v, i) => (*/}
            {/*                                                <div*/}
            {/*                                                    key={i}*/}
            {/*                                                    onClick={() => handleCurrIssue(v)}*/}
            {/*                                                    className={`flex justify-between items-center shadow ${v.value == state.CurrJIRAStoryAObj.value ? 'border-2 border-sky-500' : 'border border-gray-200'} bg-gray-100 text-gray-700 rounded-md mb-2 px-4 py-3 cursor-pointer `}*/}
            {/*                                                >*/}
            {/*                                                    <div className=" w-full relative ">*/}
            {/*                                                        {v.value == state.CurrJIRAStoryAObj.value && (*/}
            {/*                                                            <p className="text-sm font-medium text-green-700 absolute right-0">selected</p>*/}
            {/*                                                        )}*/}
            {/*                                                        <div>*/}
            {/*                                                            <a href={`${state.CurrJIRAConfig.BaseURL}/browse/${v.key}`} target="_blank" rel="noreferrer" className="text-sm font-semibold">*/}
            {/*                                                                Story ID: <span className="text-blue-600"> {v.key}</span>*/}
            {/*                                                            </a>*/}
            {/*                                                        </div>*/}
            {/*                                                        <div className="flex  mt-1 text-sm w-full items-center justify-between">*/}
            {/*                                                            <p className="">{v.label}</p>*/}
            {/*                                                            <div*/}
            {/*                                                                onClick={() => { setState({ StoryModal: true }) }}*/}
            {/*                                                                className="text-blue-700 ml-2 right-0 cursor-pointer"*/}
            {/*                                                            >*/}
            {/*                                                                <Info size={22} />*/}
            {/*                                                            </div>*/}
            {/*                                                        </div>*/}
            {/*                                                    </div>*/}
            {/*                                                </div>*/}
            {/*                                            ))}*/}
            {/*                                        </div>*/}
            {/*                                    )}*/}
            {/*                                </div>*/}
            {/*                            </div>*/}
            {/*                        </div>*/}
            {/*                    )}*/}

            {/*                    {state.UploadDocTab === 3 && (*/}
            {/*                        <div className="w-full ">*/}
            {/*                            <div className="">*/}
            {/*                                <div onClick={() => handleUploadDocTab(0)} className="flex items-center cursor-pointer bg-[#f3f3f3]  w-fit px-4 py-1 rounded-full">*/}
            {/*                                    <ChevronLeft className="text-gray-700" /> <span className="font-medium text-sm text-gray-700"> Back</span>*/}
            {/*                                </div>*/}
            {/*                                <div className=" pt-3 mt-4 bg-gray-100   rounded-lg ">*/}
            {/*                                    <div className="pl-4">*/}
            {/*                                        <p className="font-semibold">Signavio</p>*/}
            {/*                                    </div>*/}
            {/*                                    <FolderExplorer onFileSelect={(filePath: string) => { void handleCurrentSignavioFileSelect(filePath); }} />*/}
            {/*                                </div>*/}
            {/*                            </div>*/}
            {/*                        </div>*/}
            {/*                    )}*/}

            {/*                    {state.UploadDocTab === 4 && (*/}
            {/*                        <div className="w-full">*/}
            {/*                            <div onClick={() => handleUploadDocTab(0)} className="flex items-center cursor-pointer bg-[#f3f3f3]  w-fit px-4 py-1 rounded-full">*/}
            {/*                                <ChevronLeft className="text-gray-700" /> <span className="font-medium text-sm text-gray-700"> Back</span>*/}
            {/*                            </div>*/}
            {/*                            <div className="  pt-4 border-gray-200 rounded-lg ">*/}
            {/*                                <div className="">*/}
            {/*                                    <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">*/}
            {/*                                        Select a ABAP Program <span className="text-red-500">*</span>*/}
            {/*                                    </label>*/}
            {/*                                    <Dropdown*/}
            {/*                                        mode="single"*/}
            {/*                                        options={state.ABAP_Programs}*/}
            {/*                                        value={state.CurrABAP_ProgramOBJ.Program}*/}
            {/*                                        onChange={(val: string, item: DropdownOption) => handleDropdownABAP_Program(val, item, "Program")}*/}
            {/*                                        onSearch={(q: string) => { void GetABAP_Programs("1", 50, q); }}*/}
            {/*                                    />*/}
            {/*                                </div>*/}
            {/*                                <div className=" ">*/}
            {/*                                    <p className="text  pb-2 font-semibold pt-4">Program Code </p>*/}
            {/*                                    {state.ShowJiraStoryLoad ? (*/}
            {/*                                        <div className="py-8">*/}
            {/*                                            <SpinnerV2 {...{ text: "Fetching Program Data..." }} />*/}
            {/*                                        </div>*/}
            {/*                                    ) : (*/}
            {/*                                        <div className="overflow-y-auto h-[calc(50vh-10px)]">*/}
            {/*                                            <section className="max-w-5xl mx-auto  bg-white  rounded-2xl  space-y-4">*/}
            {/*                                                {!Object.values(state.ABAP_ProgramsData).every(value => value === "") ? (*/}
            {/*                                                    Object.entries(state.ABAP_ProgramsData).map(([key, value]) => (*/}
            {/*                                                        <div key={key}>*/}
            {/*                                                            <Accordion title={key} expandKey={key}>*/}
            {/*                          <pre className="bg-gray-100 text-sm text-gray-800 p-2 rounded-lg overflow-x-auto whitespace-pre-wrap">*/}
            {/*                            {value as string}*/}
            {/*                          </pre>*/}
            {/*                                                            </Accordion>*/}
            {/*                                                        </div>*/}
            {/*                                                    ))*/}
            {/*                                                ) : (*/}
            {/*                                                    <div>*/}
            {/*                                                        {state.CurrABAP_ProgramOBJ.Program === "" ? (*/}
            {/*                                                            <div className="borde rounded-md  bg-gray-100 py-3 px-4">*/}
            {/*                                                                <p className="text-gray-700">Select a Program to see program code</p>*/}
            {/*                                                            </div>*/}
            {/*                                                        ) : (*/}
            {/*                                                            <div className="borde rounded-md  bg-red-100 py-3 px-4">*/}
            {/*                                                                <p className="text-red-600">Data Not Found!</p>*/}
            {/*                                                            </div>*/}
            {/*                                                        )}*/}
            {/*                                                    </div>*/}
            {/*                                                )}*/}
            {/*                                            </section>*/}
            {/*                                        </div>*/}
            {/*                                    )}*/}
            {/*                                </div>*/}
            {/*                            </div>*/}
            {/*                        </div>*/}
            {/*                    )}*/}

            {/*                    {state.UploadDocTab === 5 && (*/}
            {/*                        <div className="w-full">*/}
            {/*                            <div onClick={() => handleUploadDocTab(0)} className="flex items-center cursor-pointer bg-[#f3f3f3]  w-fit px-4 py-1 rounded-full">*/}
            {/*                                <ChevronLeft className="text-gray-700" /> <span className="font-medium text-sm text-gray-700"> Back</span>*/}
            {/*                            </div>*/}
            {/*                            <div className="  pt-4 border-gray-200 rounded-lg ">*/}
            {/*                                <div className="">*/}
            {/*                                    <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">*/}
            {/*                                        Select a Module <span className="text-red-500">*</span>*/}
            {/*                                    </label>*/}
            {/*                                    <Dropdown*/}
            {/*                                        mode="single"*/}
            {/*                                        options={state.SAPModuleList}*/}
            {/*                                        value={state.CurrSAPModule}*/}
            {/*                                        onChange={(val: string, item: SAPModuleItem) => handleDropdownSAPConfigData(val, item)}*/}
            {/*                                        onSearch={(_q: string) => { }}*/}
            {/*                                    />*/}
            {/*                                </div>*/}

            {/*                                <div className=" ">*/}
            {/*                                    <p className="text  pb-2 font-semibold pt-4">SAP Config Tables </p>*/}
            {/*                                    {state.ShowJiraStoryLoad ? (*/}
            {/*                                        <div className="py-8">*/}
            {/*                                            <SpinnerV2 {...{ text: "Fetching Config Data..." }} />*/}
            {/*                                        </div>*/}
            {/*                                    ) : (*/}
            {/*                                        <div className="overflow-y-auto h-[calc(50vh-10px)]">*/}
            {/*                                            <div className="overflow-x-auto relative">*/}
            {/*                                                {state.CurrSAPConfigData.length > 0 ? (*/}
            {/*                                                    <table className="min-w-full border border-gray-200 rounded-md">*/}
            {/*                                                        <thead>*/}
            {/*                                                        <tr className="bg-[#ebebeb] text-left  sticky">*/}
            {/*                                                            <th className="p-1.5 text-sm font-medium text-gray-700">Table</th>*/}
            {/*                                                            <th className="p-1.5 text-sm font-medium text-gray-700">Description</th>*/}
            {/*                                                        </tr>*/}
            {/*                                                        </thead>*/}
            {/*                                                        <tbody>*/}
            {/*                                                        {state.CurrSAPConfigData.map((item2, id2) => (*/}
            {/*                                                            <tr key={id2} className="border-t border-gray-200 ">*/}
            {/*                                                                <td className="p-1.5 text-sm">*/}
            {/*                                                                    <p>{item2.TableName}</p>*/}
            {/*                                                                </td>*/}
            {/*                                                                <td className="p-1.5 text-sm">*/}
            {/*                                                                    <p>{item2.Description}</p>*/}
            {/*                                                                </td>*/}
            {/*                                                            </tr>*/}
            {/*                                                        ))}*/}
            {/*                                                        </tbody>*/}
            {/*                                                    </table>*/}
            {/*                                                ) : (*/}
            {/*                                                    <div>*/}
            {/*                                                        {state.CurrSAPModule === "" ? (*/}
            {/*                                                            <div className="borde rounded-md  bg-gray-100 py-3 px-4">*/}
            {/*                                                                <p className="text-gray-700">Select a Module</p>*/}
            {/*                                                            </div>*/}
            {/*                                                        ) : (*/}
            {/*                                                            <div className="borde rounded-md  bg-red-100 py-3 px-4">*/}
            {/*                                                                <p className="text-red-600">Data Not Found!</p>*/}
            {/*                                                            </div>*/}
            {/*                                                        )}*/}
            {/*                                                    </div>*/}
            {/*                                                )}*/}
            {/*                                            </div>*/}
            {/*                                        </div>*/}
            {/*                                    )}*/}
            {/*                                </div>*/}
            {/*                            </div>*/}
            {/*                        </div>*/}
            {/*                    )}*/}

            {/*                    {state.DocError && <p className="py-2 px-2 text-red-600 font-medium font-lg ">{state.DocError}</p>}*/}
            {/*                </div>*/}
            {/*            </div>*/}

            {/*            {state.UploadDocTab !== 0 && (*/}
            {/*                <div className="col-span-7  overflow-y-auto h-[calc(100vh-280px)]">*/}
            {/*                    <ProjectSprintSessionBPSPMapping*/}
            {/*                        ref={ProjectSprintSessionBPSPMappingRef as any}*/}
            {/*                        BpPayload={handlePayload}*/}
            {/*                        NewSession={true}*/}
            {/*                        CurrentSprint={{*/}
            {/*                            ClientId: ClientIdFromUrl,*/}
            {/*                            ProjectId: ProjectIdFromUrl,*/}
            {/*                            BusinessUnitId: BusinessUnitId,*/}
            {/*                            SprintId: sprintIdFromUrl,*/}
            {/*                        }}*/}
            {/*                    />*/}
            {/*                </div>*/}
            {/*            )}*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*</CustomModal>*/}

            <div>
                <div  className="flex justify-between pb-3">
                    <p className="text-lg font-semibold">Workspace Scenarios</p>
                    {/* <div className="col-span-5 ">*/}
                    {/* <SearchBar currentValue={state.SearchQuery} onSearch={(v: string) => handleSearch(v)} size="medium" />*/}
                    {/*</div>*/}
                    <div onClick={() => { void handleRefreshData(); }} className=" cursor-pointer border border-[#0071E9] rounded-full px-3 py-1">
                        <p className="text-[#0071E9] font-semibold select-none text-sm flex items-center">
                            <RefreshCcw className="mr-1" size={15} />
                            Refresh
                        </p>
                    </div>
                </div>

                {/*<div className={`grid grid-cols-12  justify-between items-center  ${!state.ViewSprintDetails ? 'py-3  ' : ''}`}>*/}
                {/*    {state.ViewSprintDetails ? (*/}
                {/*        <div className="   "></div>*/}
                {/*    ) : (*/}
                {/*        <div>*/}
                {/*            <p className="text-lg font-semibold">Workspace Scenarios</p>*/}
                {/*           /!* <div className="col-span-5 ">*!/*/}
                {/*           /!* <SearchBar currentValue={state.SearchQuery} onSearch={(v: string) => handleSearch(v)} size="medium" />*!/*/}
                {/*           /!*</div>*!/*/}
                {/*        </div>*/}


                {/*    )}*/}

                {/*    {state.ViewSprintDetails ? (*/}
                {/*        <div className=" "></div>*/}
                {/*    ) : (*/}
                {/*        <div className=" col-span-7  ">*/}

                {/*                <div className="flex justify-end  items-center gap-6">*/}
                {/*                    <div onClick={() => { void handleRefreshData(); }} className=" cursor-pointer border border-[#0071E9] rounded-full px-3 py-1">*/}
                {/*                        <p className="text-[#0071E9] font-semibold select-none text-sm flex items-center">*/}
                {/*                            <RefreshCcw className="mr-1" size={15} />*/}
                {/*                            Refresh*/}
                {/*                        </p>*/}
                {/*                    </div>*/}
                {/*                        /!*<div className=" min-w-1/4 ">*!/*/}
                {/*                        /!*    <div className=" ">*!/*/}
                {/*                        /!*        <DropdownV2*!/*/}
                {/*                        /!*            Icon={<HugeiconsIcon icon={FolderLinksIcon} />}*!/*/}
                {/*                        /!*            size="small"*!/*/}
                {/*                        /!*            mode="single"*!/*/}
                {/*                        /!*            searchable={false}*!/*/}
                {/*                        /!*            options={state.SourceTypes}*!/*/}
                {/*                        /!*            value={state.FilterObj.SourceType}*!/*/}
                {/*                        /!*            onChange={(val: string, item: DropdownOption) => { void handleGetDataBySourceType(val, item, "SourceType"); }}*!/*/}
                {/*                        /!*            placeholder="Source Type"*!/*/}
                {/*                        /!*        />*!/*/}
                {/*                        /!*    </div>*!/*/}

                {/*                        /!*</div>*!/*/}
                {/*                    /!*<button*!/*/}
                {/*                    /!*    onClick={handleGenerateScenarios}*!/*/}
                {/*                    /!*    className="bg-[#0071E9] text-nowrap font-semibold  hover:bg-[#005ABA]  cursor-pointer text-white  py-2 px-3 rounded-lg flex items-center space-x-2"*!/*/}
                {/*                    /!*>*!/*/}
                {/*                    /!*    <HugeiconsIcon size={19} icon={SparklesIcon} />*!/*/}
                {/*                    /!*    <span>Generate Test Scenarios </span>*!/*/}
                {/*                    /!*</button>*!/*/}
                {/*                </div>*/}
                {/*        </div>*/}
                {/*    )}*/}
                {/*</div>*/}

                <div className="">
                    {state.ViewSprintDetails ? (
                        <ProjectSprintSessionDetails
                            CurrJIRAConfig={state.CurrJIRAConfig}
                            handleBack={handleBack}
                            CurrentSession={{ ...(state.CurrentSession as SessionListItem), BusinessUnitId: BusinessUnitId }}
                        />
                    ) : (
                        <div>
                            <div className="h-[calc(100vh-250px)]  overflow-y-auto">
                                <div className="flex justify-end"></div>
                                <div className="  ">
                                    <SprintSessionTimelineV3
                                        IsWorkspaceLoading={state.IsWorkspaceLoading}
                                        CurrJIRAConfig={state.CurrJIRAConfig}
                                        handleDeleteSession={(obj: Record<string, unknown>) => { void handleDeleteSession(obj); }}
                                        Title="Session Id"
                                        sessions={state.ProjectSprintList}
                                        onActionClick={(item: SessionListItem) => handleViewSummary(item)}
                                    />
                                    {/*{state.ProjectSprintList.length > 0 ? (*/}
                                    {/*    <SprintSessionTimelineV3*/}
                                    {/*        CurrJIRAConfig={state.CurrJIRAConfig}*/}
                                    {/*        handleDeleteSession={(obj: Record<string, unknown>) => { void handleDeleteSession(obj); }}*/}
                                    {/*        Title="Session Id"*/}
                                    {/*        sessions={state.ProjectSprintList}*/}
                                    {/*        onActionClick={(item: SessionListItem) => handleViewSummary(item)}*/}
                                    {/*    />*/}
                                    {/*) : (*/}
                                    {/*    <div className=" h-full w-full flex  justify-center items-center">*/}
                                    {/*        <div className="py-16 flex flex-col  justify-center items-center border-b-gray-50 border-b">*/}
                                    {/*            <img src={Nodata} alt="No Data" className="w-48" />*/}
                                    {/*            <h3 className="text-lg font-semibold mt-8 text-gray-600">No Scenarios Available</h3>*/}
                                    {/*            <div className="mt-4">*/}
                                    {/*                <button*/}
                                    {/*                    onClick={handleGenerateScenarios}*/}
                                    {/*                    className="bg-[#0071E9] text-nowrap font-semibold  hover:bg-[#005ABA]  cursor-pointer text-white  py-2 px-3 rounded-lg flex items-center space-x-2"*/}
                                    {/*                >*/}
                                    {/*                    <HugeiconsIcon size={19} icon={SparklesIcon} />*/}
                                    {/*                    <span>Generate Test Scenarios </span>*/}
                                    {/*                </button>*/}
                                    {/*            </div>*/}
                                    {/*        </div>*/}
                                    {/*    </div>*/}
                                    {/*)}*/}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
