// ProjectSprintSessionDetailsV2.tsx
import React, { useEffect, useReducer, useRef } from "react";
import { apiRequest } from "../../../utils/helpers/ApiHelper.js";
import {
    CircleAlert,
    Code2,
    Edit,
    FileWarning,
    FlaskConical,
    Info,
    Layers,
    Map,
    SlidersHorizontal,
} from "lucide-react";
import Modal from "../../../utils/Modal.jsx";
import Accordion from "../../../utils/Accordion.jsx";
import Dropdown from "../../../utils/Dropdown.jsx";
import CustomModal from "../../../utils/CustomModal.jsx";
import PannelWrapper from "../../../utils/PannelWrapper.jsx";
import ToggleButtonGroup from "../../../utils/ToggleButtonGroup.jsx";
import CustomTable from "../../../utils/CustomTable.jsx";
import axios from "axios";
import SpinnerV2 from "../../../utils/SpinnerV2.jsx";
import socket from "../../../utils/socket.js";
import Pagination from "../../../utils/Pagination.jsx";
import Nodata from "../../../assets/Nodata.svg";
import { HostConfig } from "../../../../HostConfig.js";
import CustomTableData from "../../../utils/CustomTableData.jsx";
import DropdownV2 from "../../../utils/DropdownV2.jsx";
import TabNavigation from "../../../utils/TabNavigation.jsx";
import SearchBar from "../../../utils/SearchBar.jsx";
import {HugeiconsIcon} from "@hugeicons/react";
import {DocumentValidationIcon, FolderLinksIcon} from "@hugeicons/core-free-icons";

interface CurrentSession {
    ClientId?: string;
    ProjectId?: string;
    SessionId?: string;
    SprintId?: string;
    DocumentId?: string;
    MarkdownFileURL?: string;
    BusinessUnitId?: string;
    [key: string]: unknown;
}

interface CurrentSprint {
    ClientId?: string;
    ProjectId?: string;
    SprintId?: string;
    [key: string]: unknown;
}

type Props = {
    CurrentSession: CurrentSession;
    CurrentSprint: CurrentSprint;
    handleBackToMain?: () => void;
};

interface TestConditionCriteria {
    ClientId: string;
    BusinessUnitId: string;
    BusinessProcessId: string;
    BusinessSubProcessId: string;
    ApplicationId: string;
    TransactionId: string;
    TestingTechniqueId: string;
    TransactionFields: any[];
    Transactions: any[];
    [key: string]: any;
}

interface ScenarioFilters {
    DocumentId: string;
    SourceType: string;
}

interface State {
    ActionType: string;
    Error: string;
    CurrentTestCaseVersionType: string;
    CurrentToggle: string;
    CurrentModalToggle: string;
    SearchQuery: string;
    tab: string;
    FlagType: string;
    CurrentPage: number;
    ViewSummary: boolean;
    openEditTestCaseModal: boolean;
    openUncoveredSectionsModal: boolean;
    TotalRecords: number;
    TestCaseTotalRecords: number;
    CurrentSprint: Record<string, unknown>;
    ProjectSprintList: any[];
    CurrAddEditTestCaseObj: Record<string, any>;
    TransactionsList: any[];
    SourceTypes: { label: string; value: string }[];
    BRDSummary: any[];
    TestStrategy: any[];
    ImpactAnalysis: any[];
    DocumentList: any[];
    ScenariosList: any[];
    existingMarkdownList: any[];
    TestingTechniquesList: any[];
    UncoveredSections: any[];
    EqClassesBaundaryValues: any[];
    ApplicationsList: any[];
    TestCasesList: any[];
    ViewClientDetails: boolean;
    ShowLoader: boolean;
    ShowTestCases: boolean;
    ViewSprintDetails: boolean;
    IsLoading: boolean;
    openTestCaseModal: boolean;
    resetDocUpload: boolean;
    showToast: boolean;
    openModal: boolean;
    openModal4: boolean;
    CurrScenario: Record<string, any>;
    ScenarioFilters: ScenarioFilters;
    CurrTestCase: Record<string, any>;
    openModal3: boolean;
    SavingLoader: boolean;
    isDataExist: string;
    ClientBusinessUnitActionType: string;
    TestConditionCriteria: TestConditionCriteria;
    CurrAddEditObj: Record<string, any>;
    ValidateFields: Record<string, string>;
    ValidateTestCaseFields: Record<string, string>;
    TestCaseFormErrors: Record<string, string>;
    tabs: string[];
    TestCaseCurrentPage: number;
    ShowTestScenariosLoader?: boolean;
    CurrEQ?: any;
    FormErrors?: any;
}

export default function ProjectSprintSessionDetailsV2(props: Props): JSX.Element {
    const [state, setState] = useReducer(
        (prev: State, next: Partial<State>): State => ({ ...prev, ...next }),
        {
            ActionType: "",
            Error: "",
            CurrentTestCaseVersionType: "Current",
            CurrentToggle: "Test Scenarios",
            CurrentModalToggle: "Generate Test Case",
            SearchQuery: "",
            tab: "upload",
            FlagType: "No",
            CurrentPage: 1,
            ViewSummary: false,
            openEditTestCaseModal: false,
            openUncoveredSectionsModal: false,
            TotalRecords: 0,
            TestCaseTotalRecords: 0,
            CurrentSprint: {},
            ProjectSprintList: [],
            CurrAddEditTestCaseObj: {
                ClientId: "",
                ProjectId: "",
                SprintId: "",
                SessionId: "",
                DocumentId: "",
                TestScenarioId: "",
                TestCaseId: "",
                TestCase: "",
                PreConditions: "",
                ExpectedResult: "",
                ActualResult: "",
                Priority: "",
                TestType: "",
            },
            TransactionsList: [],
            SourceTypes: [
                { label: "Document", value: "Document" },
                { label: "JIRA", value: "JIRA" },
                { label: "Signavio", value: "Signavio" },
                { label: "ABAP_Program", value: "ABAP_Program" },
                { label: "SAPConfig", value: "SAPConfig" },
            ],
            BRDSummary: [],
            TestStrategy: [],
            ImpactAnalysis: [],
            DocumentList: [],
            ScenariosList: [],
            existingMarkdownList: [],
            TestingTechniquesList: [],
            UncoveredSections: [],
            EqClassesBaundaryValues: [],
            ApplicationsList: [],
            TestCasesList: [],
            ViewClientDetails: false,
            ShowLoader: false,
            ShowTestCases: false,
            ViewSprintDetails: false,
            IsLoading: true,
            openTestCaseModal: false,
            resetDocUpload: false,
            showToast: false,
            openModal: false,
            openModal4: false,
            CurrScenario: {},
            ScenarioFilters: {
                DocumentId: "",
                SourceType: "",
            },
            CurrTestCase: {},
            openModal3: false,
            SavingLoader: false,
            isDataExist: "",
            ClientBusinessUnitActionType: "",
            TestConditionCriteria: {
                ClientId: "",
                BusinessUnitId: "",
                BusinessProcessId: "",
                BusinessSubProcessId: "",
                ApplicationId: "",
                TransactionId: "",
                TestingTechniqueId: "",
                TransactionFields: [],
                Transactions: [],
            },
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
            ValidateFields: {
                InputDoc: "",
            },
            ValidateTestCaseFields: {
                TestCase: "",
                ExpectedResult: "",
            },
            TestCaseFormErrors: {},
            tabs: ["Valid", "Invalid"],
            TestCaseCurrentPage: 1,
            ShowTestScenariosLoader: false,
        } as State
    );

    const didFetchData = useRef<boolean>(false);
    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;

        const init = async (): Promise<void> => {
            setState({ IsLoading: true });

            await Promise.all([getData("")]);

            setState({ IsLoading: false });
        };

        void init();
    }, []);

    useEffect(() => {
        socket.on("TestCasesGenerated", (data: any) => {
            getTestCasesList("", data.data);
        });
        return () => {
            socket.off("session_status_updated");
        };
    }, []);

    const getTestCasesList = async (SearchString: string = "", CurrScenario: any, PageNo: number = 1): Promise<void> => {
        try {
            const resp: any = await apiRequest("/cognito/api/GetProjectSprintSessionDocumentTestCasesPaginationFilterSearch", {
                PageNo,
                SearchString,
                TestScenarioId: CurrScenario.TestScenarioId,
                ClientId: CurrScenario.ClientId,
                ProjectId: CurrScenario.ProjectId,
                SessionId: CurrScenario.SessionId,
                SprintId: CurrScenario.SprintId,
                DocumentId: CurrScenario.DocumentId,
            });
            setState({
                TestCasesList: resp.ResponseData,
                ShowLoader: false,
                TestCaseTotalRecords: resp.TotalRecords,
            });
        } catch (err) {
            console.error("Error loading Country/State/City:", err);
        }
    };

    const getGetTransactionsList = async (ApplicationId: string = "APID-5", _SearchString: string = ""): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetTransactionsMaster", {
                ApplicationId,
            });
            setState({
                TransactionsList: resp.ResponseData,
            });
        } catch (err) {
            console.error("Error loading Country/State/City:", err);
        }
    };

    const getBRDSummary = async (): Promise<void> => {
        try {
            const resp: any = await apiRequest("/cognito/api/GetProjectSprintSessionDocBRDSummaryPaginationFilterSearch", {
                PageNo: 1,
                SearchString: "",
                ClientId: props.CurrentSession.ClientId,
                ProjectId: props.CurrentSession.ProjectId,
                SessionId: props.CurrentSession.SessionId,
                SprintId: props.CurrentSession.SprintId,
                DocumentId: props.CurrentSession.DocumentId,
            });
            setState({
                BRDSummary: resp.BRDSummary,
                TestStrategy: resp.TestStrategy,
                ImpactAnalysis: resp.ImpactAnalysis,
                UncoveredSections: resp.UncoveredSections,
            });
        } catch (err) {
            console.error("Error loading Country/State/City:", err);
        }
    };

    const getGetTestingTechnicsList = async (_ApplicationId: string = "APID-5", _SearchString: string = ""): Promise<void> => {
        try {
            const resp: any = await apiRequest("/testing/GetTestingTechniquesMaster", {});
            setState({
                TestingTechniquesList: resp.ResponseData,
            });
        } catch (err) {
            console.error("Error loading Country/State/City:", err);
        }
    };

    const searchParams = new URLSearchParams(location.search);
    const ClientIdFromUrl = searchParams.get("CLId");
    const BusinessUnitIdName = searchParams.get("BUNM");
    const sprintIdFromUrl = searchParams.get("SPRID");
    const ProjectIdFromUrl = searchParams.get("PJID");

    const getData = async (
        SearchQuery: string = "",
        FlagType: string = "All",
        PageNo: number = 1,
        DocumentId: string = "",
        VersionType: string = "Current"
    ): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetProjectSprintSessionDocScenariosBySprint", {
                StartDate: "",
                EndDate: "",
                PageNo,
                FlagType,
                DocumentId,
                VersionType,
                SearchString: SearchQuery,
                ClientId: ClientIdFromUrl ? ClientIdFromUrl : props.CurrentSession.ClientId,
                ProjectId: ProjectIdFromUrl ? ProjectIdFromUrl : props.CurrentSession.ProjectId,
                SprintId: sprintIdFromUrl ? sprintIdFromUrl : props.CurrentSession.SprintId,
            });
            setState({
                ScenariosList: resp.ResponseData,
                TotalRecords: resp.TotalRecords,
            });
        } catch (err: unknown) {
            setState({ Error: String(err) });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const getDocumentList = async (SearchQuery: string = "", SourceType: string = ""): Promise<void> => {
        const resp: any = await apiRequest("/GetProjectSprintDocuments", {
            StartDate: "",
            EndDate: "",
            SourceType,
            SearchString: SearchQuery,
            ClientId: ClientIdFromUrl ? ClientIdFromUrl : props.CurrentSprint.ClientId,
            ProjectId: ProjectIdFromUrl ? ProjectIdFromUrl : props.CurrentSprint.ProjectId,
            SprintId: sprintIdFromUrl ? sprintIdFromUrl : props.CurrentSprint.SprintId,
        });

        if (resp.ResponseData.length > 0) {
            resp.ResponseData.map((v: any) => {
                v.label = `${v.DocumentName} (${v.SessionId})`;
                v.value = v.DocumentId;
                return v;
            });
            setState({ DocumentList: resp.ResponseData });
        }
    };

    const getGetTransactionsFieldsList = async (item: any, _SearchString: string = ""): Promise<void> => {
        item.SearchString = "";
        const TestConditionCriteriaLocal: TestConditionCriteria = { ...state.TestConditionCriteria };
        try {
            const resp: any = await apiRequest("/GetTransactionTableFieldValuesMasterNew", item);
            if (resp.ResponseData.length > 0) {
                TestConditionCriteriaLocal.Transactions = resp.ResponseData;
                setState({ TestConditionCriteria: TestConditionCriteriaLocal });
            } else {
                TestConditionCriteriaLocal.Transactions = [];
                setState({ TestConditionCriteria: TestConditionCriteriaLocal });
            }
        } catch (err) {
            TestConditionCriteriaLocal.Transactions = [];
            setState({ TestConditionCriteria: TestConditionCriteriaLocal });
            console.error("Error loading Country/State/City:", err);
        }
    };

    const handleDropdownTransaction = (val: string, _options: unknown, CurrItem: any, name: keyof TestConditionCriteria): void => {
        const TestConditionCriteriaLocal: TestConditionCriteria = { ...state.TestConditionCriteria };
        (TestConditionCriteriaLocal as any)[name] = val;
        setState({ TestConditionCriteria: TestConditionCriteriaLocal });

        if (name === "TransactionId") {
            if (val) {
                // placeholder for future logic
            } else {
                TestConditionCriteriaLocal.TransactionFields = [];
                setState({ TestConditionCriteria: TestConditionCriteriaLocal });
            }
        }
        if (name === "TransactionId") {
            void getGetTransactionsFieldsList(TestConditionCriteriaLocal);
        }

        if (name === "TestingTechniqueId") {
            void getGetTransactionsFieldsList(TestConditionCriteriaLocal);
        }
    };

    const handleCurrentScenario = (item: any): void => {
        setState({ openModal4: true, CurrScenario: item });
    };

    const handleGenerateTestCase = async (_item: any): Promise<void> => {
        setState({ ShowLoader: true, ShowTestCases: true, CurrentModalToggle: "Test Cases" });

        try {
            const CurrScenario = state.CurrScenario;
            if (CurrScenario) {
                const TestConditionCriteriaLocal = state.TestConditionCriteria;
                const TTQNames: string[] = [];
                if (TestConditionCriteriaLocal.TestingTechniqueId) {
                    const TestingTechniquesList = state.TestingTechniquesList;
                    const TTQIDS = TestConditionCriteriaLocal.TestingTechniqueId.split(",");
                    TTQIDS.map((v: string) => {
                        const TTQ = TestingTechniquesList.filter((val: any) => val.value === v);
                        if (TTQ.length > 0) {
                            TTQNames.push(TTQ[0].value);
                        }
                        return v;
                    });
                }
                (CurrScenario as any).Transactions = TestConditionCriteriaLocal.Transactions;
                (CurrScenario as any).TestingTechnique = TTQNames.join(",");
                const reqObject = {
                    ActionType: "TestCase",
                    ClientId: CurrScenario.ClientId,
                    ProjectId: CurrScenario.ProjectId,
                    BusinessUnitId: props.CurrentSession.BusinessUnitId,
                    SprintId: CurrScenario.SprintId,
                    SessionId: CurrScenario.SessionId,
                    DocumentId: props.CurrentSession.DocumentId,
                    TestScenarioId: CurrScenario.TestScenarioId,
                    MarkdownFilePath: props.CurrentSession.MarkdownFileURL,
                    TestScenario: CurrScenario,
                };

                await axios.post("https://sirobilt.ai:8050/api/GenerateDataByExistingMDFile", reqObject);
                void getTestCasesList("", CurrScenario);
            }
        } catch (err) {
            console.error("Error loading Country/State/City:", err);
        }
    };

    const handleUpdateFieldValue = (
        e: React.ChangeEvent<HTMLInputElement>,
        id1: number,
        id2: number,
        name: string
    ): void => {
        const TestConditionCriteriaLocal: TestConditionCriteria = { ...state.TestConditionCriteria };
        (TestConditionCriteriaLocal.Transactions[id1].TransactionFields[id2] as any)[name] = e.target.value;
        setState({ TestConditionCriteria: TestConditionCriteriaLocal });
    };

    const handlCurrEQC = (item: any): void => {
        setState({ openModal3: true, CurrEQ: item, EqClassesBaundaryValues: item.EquivalenceClasses });
    };

    const handleCurrentTestCase = (item: any): void => {
        setState({ openTestCaseModal: true, CurrTestCase: item });
    };

    const handleViewScenarioDetails = (item: any): void => {
        const TestConditionCriteriaLocal: TestConditionCriteria = {
            ClientId: "",
            BusinessUnitId: "",
            BusinessProcessId: "",
            BusinessSubProcessId: "",
            ApplicationId: "",
            TransactionId: "",
            TestingTechniqueId: "",
            TransactionFields: [],
            Transactions: [],
        };

        setState({
            openModal: true,
            TestConditionCriteria: TestConditionCriteriaLocal,
            CurrScenario: item,
            CurrentModalToggle: "Generate Test Case",
        });
        void getTestCasesList("", item);
    };

    const handleChangeTestCase = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>, name: string): void => {
        const CurrAddEditTestCaseObj = { ...state.CurrAddEditTestCaseObj };
        CurrAddEditTestCaseObj[name] = e.target.value;
        setState({ CurrAddEditTestCaseObj });
    };

    const handleEditTestCase = (item: any): void => {
        setState({ openEditTestCaseModal: true, CurrAddEditTestCaseObj: item });
    };

    const validateTestCaseForm = (): boolean => {
        const FormErrors: Record<string, string> = {};
        let formIsValid = true;

        const emailRegex = "";
        for (const name in state.ValidateTestCaseFields) {
            const value = state.CurrAddEditTestCaseObj[name];
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
        setState({
            FormErrors,
        });
        return formIsValid;
    };

    const handleUpdateFlagTypeTestCase = async (id: number, item: any, value: string): Promise<void> => {
        const TestCasesList = [...state.TestCasesList];
        (TestCasesList[id] as any).FlagType = value;
        setState({ TestCasesList });
        item.FlagType = value;
        const resp: any = await apiRequest("/AddUpdateProjectSprintSessionDocumentTestCases", item);
        if (resp) {
            // optional follow-up
        }
    };

    const handleSubmitTestCase = async (): Promise<void> => {
        if (!validateTestCaseForm()) {
            return;
        }
        setState({ openEditTestCaseModal: false });
        const resp: any = await apiRequest(
            "/AddUpdateProjectSprintSessionDocumentTestCases",
            state.CurrAddEditTestCaseObj
        );
        if (resp) {
            void getTestCasesList("", state.CurrScenario, state.TestCaseCurrentPage);
        }
    };

    const handlePageChange = (page: number): void => {
        setState({ CurrentPage: page });
        void getData("", state.FlagType, page, state.ScenarioFilters.DocumentId, state.CurrentTestCaseVersionType);
    };

    const handleFilterTestCaseByVersionType = (val: string, _options: unknown): void => {
        setState({ CurrentTestCaseVersionType: val });
        void getData("", state.FlagType, state.CurrentPage, state.ScenarioFilters.DocumentId, val);
    };

    const handleScenarioFilter = (value: string, _option: unknown, name: keyof ScenarioFilters): void => {
        const ScenarioFiltersLocal: ScenarioFilters = { ...state.ScenarioFilters };
        ScenarioFiltersLocal[name] = value;
        setState({ ScenarioFilters: ScenarioFiltersLocal });
        if (name === "SourceType") {
            void getDocumentList("", value);
        }
        if (name === "DocumentId") {
            void getData("", state.FlagType, state.CurrentPage, value, state.CurrentTestCaseVersionType);
        }
    };

    const handleTestCasePageChange = (page: number): void => {
        setState({ TestCaseCurrentPage: page });
        void getTestCasesList("", state.CurrScenario, page);
    };

    const getFileURL = (path?: string): string => {
        if (!path) return "No URL";
        const url = path.replace("/var", "");
        return url;
    };


    const handleGetDataBySourceType = async (val, _item, name): Promise<void> => {
        setState({ FlagType:val });
         getData("", val, state.CurrentPage, state.ScenarioFilters.DocumentId, state.CurrentTestCaseVersionType);
    };


    const handleCurrentTab = (tab: string): void => {
        setState({ FlagType: tab });
        void getData("", tab, state.CurrentPage, state.ScenarioFilters.DocumentId, state.CurrentTestCaseVersionType);
    };

    const options2 = [
        {
            key: "Generate Test Case",
            label: "Generate Test Case",
            icon: <Layers size={15} />,
        },
        { key: "Test Cases", label: "Test Cases", icon: <Code2 size={15} /> },
    ] as const;

    const columns = [
        { title: "Test Scenario ", key: "TestScenarioName", headerClassName: "w-[34%]" },
        {
            title: "Priority",
            key: "Priority",
            headerClassName: "w-[ 10%]",
        },
        { title: "Section", key: "Section" },
        {
            title: "Section Content",
            key: "SectionContent",
            headerClassName: "w-[35%]",
        },
        { title: "Source", key: "Source", headerClassName: "w-[50%]" },
    ];

    const IdExtracter = (id: string, Prefix: string): string => {
        const match = id.split("-");
        if (match) {
            const number = match[1];
            const result = `${Prefix}-${number}`;
            return result;
        } else return id;
    };

    const options = [
        { key: "No", label: "Valid", icon: <Layers size={15} /> },
        { key: "Yes", label: "Invalid", icon: <Code2 size={15} /> },
    ] as const;

    const TestScenariosData = state.ScenariosList.map((v: any) => ({
        TestScenarioId: IdExtracter(v.TestScenarioId, "TC"),
        Priority: v.Priority,
        VersionId: v.VersionId,
        SectionTitle: v.SectionTitle,
        SectionContent: v.SectionContent,
        SourceType: v.SourceType,
        Source: (
            <a
                href={`${HostConfig.LLMHost}${getFileURL(v.InputFileURL)}`}
                target="_blank"
                rel="noreferrer"
                className="text-sky-600 cursor-pointer"
            >
                {v.DocumentName}
            </a>
        ),
        TestScenarioName: (
            <div className="relative flex items-center justify-between">
                {v.TestScenarioName}{" "}
                <span onClick={() => handleCurrentScenario(v)} className="text-blue-700 ml-2 cursor-pointer">
          <Info size={22} />
        </span>
            </div>
        ),
        BusinessLogic: v.BusinessLogic,
        Description: v.Description,
        actions: <div className="relative flex items-center" />,
    }));

    const TestScenarioColumns = [
        {
            key: "TestScenarioId",
            header: "#ID",
            sortable: true,
            filterable: false,
            TruncateData: false,
            colWidth: "10%",
        },
        {
            key: "TestScenarioName",
            header: "Test Scenario ",
            sortable: true,
            filterable: false,
            TruncateData: false,
            colWidth: "45rem",
            truncateAt: 20,
        },
        {
            key: "SourceType",
            header: "Source Type",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "15rem",
            truncateAt: 20,
        },
        {
            key: "Source",
            header: "Source",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "15rem",
            truncateAt: 20,
        },
        {
            key: "VersionId",
            header: "Version",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "15rem",
            truncateAt: 20,
        },
    ];

    return (
        <div className="w-full relative">
            <div>
                <CustomModal
                    width="max-w-6xl"
                    modalZIndex={1001}
                    isOpen={state.openEditTestCaseModal}
                    onClose={(): void => setState({ openEditTestCaseModal: false })}
                    title={<div className="text-lg">Edit Test Case </div>}
                    footerContent={[
                        <button
                            key="close"
                            onClick={(): void => setState({ openEditTestCaseModal: false })}
                            className="mt-2 cursor-pointer px-5 py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg"
                        >
                            Close
                        </button>,
                        <button
                            key="save"
                            onClick={handleSubmitTestCase}
                            className="mt-2 cursor-pointer px-5 py-2 bg-[#0071E9] text-white text-sm rounded-lg "
                        >
                            Save
                        </button>,
                    ]}
                >
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-3">
                            <div className=" ">
                                <div className="flex justify-between items-center mb-1">
                                    <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                        Test Case
                                        <span className="text-red-500">*</span>
                                    </label>
                                </div>
                                <div className="relative">
                  <textarea
                      onChange={(e): void => handleChangeTestCase(e, "SprintName")}
                      value={state.CurrAddEditTestCaseObj.TestCase}
                      id="name"
                      name="name"
                      rows={3}
                      maxLength={2000}
                      placeholder="Description"
                      className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8]   resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                  ></textarea>
                                </div>
                                {state.TestCaseFormErrors.TestCase && (
                                    <div className="flex items-center mt-1 ml-2">
                                        <CircleAlert size={14} className="text-red-500" />
                                        <p className="ml-2 text-red-500 text-sm ">{state.TestCaseFormErrors.TestCase}</p>
                                    </div>
                                )}
                            </div>

                            <div className=" ">
                                <div className="flex justify-between items-center mb-1">
                                    <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                        Pre Conditions
                                    </label>
                                </div>
                                <div className="relative">
                  <textarea
                      onChange={(e): void => handleChangeTestCase(e, "PreConditions")}
                      value={state.CurrAddEditTestCaseObj.PreConditions}
                      id="name"
                      name="name"
                      rows={3}
                      maxLength={2000}
                      placeholder="Pre Conditions"
                      className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8]   resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                  ></textarea>
                                </div>
                            </div>

                            <div className=" ">
                                <div className="flex justify-between items-center mb-1">
                                    <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                        Expected Result
                                        <span className="text-red-500">*</span>
                                    </label>
                                </div>
                                <div className="relative">
                  <textarea
                      onChange={(e): void => handleChangeTestCase(e, "ExpectedResult")}
                      value={state.CurrAddEditTestCaseObj.ExpectedResult}
                      id="name"
                      name="name"
                      rows={3}
                      maxLength={2000}
                      placeholder="Expected Result"
                      className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8]   resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                  ></textarea>
                                </div>
                                {state.TestCaseFormErrors.ExpectedResult && (
                                    <div className="flex items-center mt-1 ml-2">
                                        <CircleAlert size={14} className="text-red-500" />
                                        <p className="ml-2 text-red-500 text-sm ">{state.TestCaseFormErrors.ExpectedResult}</p>
                                    </div>
                                )}
                            </div>

                            <div className=" ">
                                <div className="flex justify-between items-center mb-1">
                                    <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                        Test Type
                                    </label>
                                </div>
                                <div className="relative">
                                    <input
                                        onChange={(e): void => handleChangeTestCase(e, "TestType")}
                                        value={state.CurrAddEditTestCaseObj.TestType}
                                        placeholder="TestType"
                                        className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8]   resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    />
                                </div>
                            </div>
                            <div className=" ">
                                <div className="flex justify-between items-center mb-1">
                                    <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                        Priority
                                    </label>
                                </div>
                                <div className="relative">
                                    <input
                                        onChange={(e): void => handleChangeTestCase(e, "Priority")}
                                        value={state.CurrAddEditTestCaseObj.Priority}
                                        placeholder="TestType"
                                        className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8]   resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    />
                                </div>
                            </div>

                            <div className=" ">
                                <div className="flex justify-between items-center mb-1">
                                    <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                        Comments
                                    </label>
                                </div>
                                <div className="relative">
                  <textarea
                      onChange={(e): void => handleChangeTestCase(e, "Comments")}
                      value={state.CurrAddEditTestCaseObj.Comments}
                      id="name"
                      name="name"
                      rows={3}
                      maxLength={2000}
                      placeholder="Comments"
                      className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8]   resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                  ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                </CustomModal>

                <Modal
                    width="max-w-4xl"
                    modalZIndex={1000}
                    isOpen={state.openModal3}
                    onClose={(): void => setState({ openModal3: false })}
                    title={"Test Scenario 1"}
                >
                    <div className="space-y-5  flex flex-col">
                        <div className="overflow-x-auto mt-6">
                            <div>
                                <p className="font-semibold">Equivalence Classes and Boundary Values</p>
                            </div>
                            <table className="min-w-full border border-gray-200 rounded-md">
                                <thead>
                                <tr className="bg-[#ebebeb] text-left">
                                    <th className="p-2 font-semibold text-gray-700">Lower Limit</th>
                                    <th className="p-2 font-semibold text-gray-700">Lower Limit (-1)</th>
                                    <th className="p-2 font-semibold text-gray-700">Lower Limit (+1)</th>
                                    <th className="p-2 font-semibold text-gray-700">Upper Limit</th>
                                    <th className="p-2 font-semibold text-gray-700">Upper Limit (-1)</th>
                                    <th className="p-2 font-semibold text-gray-700">Upper Limit (+1)</th>
                                </tr>
                                </thead>
                                <tbody>
                                {state.EqClassesBaundaryValues.map((item: any, id: number) => {
                                    return (
                                        <tr className="border-t border-gray-200 " key={id}>
                                            <td className="p-3">{item.LowerLimit}</td>
                                            <td className="p-3">{item.LwLimitBVN}</td>
                                            <td className="p-3">{item.LwLimitBVP}</td>
                                            <td className="p-3">{item.UpperLimit}</td>
                                            <td className="p-3">{item.UPLimitBVN}</td>
                                            <td className="p-3">{item.UPLimitBVP}</td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end items-center bottom-0 gap-6 border-t border-gray-300">
                            <button
                                onClick={(): void => setState({ openModal3: false })}
                                className="cursor-pointer mt-4 px-5 py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg "
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </Modal>

                <CustomModal
                    width="max-w-8xl"
                    isOpen={state.openModal}
                    onClose={(): void => setState({ openModal: false })}
                    title={
                        <div className="text-lg">
                            Test Scenario:{" "}
                            <span className="text-base font-normal text-gray-700">{state.CurrScenario.TestScenarioName}</span>
                        </div>
                    }
                    footerContent={[
                        <button
                            key="close"
                            onClick={(): void => setState({ openModal: false })}
                            className="mt-2 cursor-pointer px-5 py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg"
                        >
                            Close
                        </button>,
                        state.CurrentModalToggle === "Generate Test Case" ? (
                            <button
                                key="generate"
                                onClick={handleGenerateTestCase}
                                className="mt-2 cursor-pointer  px-5 py-2 bg-[#0071E9] text-white text-sm rounded-lg "
                            >
                                Generate Test Cases
                            </button>
                        ) : (
                            ""
                        ),
                    ]}
                >
                    <div className="space-y-5 h-full flex flex-col">
                        <div className="flex justify-between items-center">
                            <div className="w-fit">
                                <ToggleButtonGroup
                                    animationFlag={false}
                                    initialKey={state.CurrentModalToggle}
                                    items={options2}
                                    onChange={(key: string): void => {
                                        setState({ CurrentModalToggle: key });
                                        void getTestCasesList("", state.CurrScenario);
                                    }}
                                />
                            </div>

                            <div>
                                {state.CurrentModalToggle !== "Generate Test Case" ? (
                                    <p>
                                        Total Test Cases Generated By AI:{" "}
                                        <span className="font-semibold">{state.TestCaseTotalRecords}</span>
                                    </p>
                                ) : (
                                    <p className="font-semibold">Automatically generate test cases using AI </p>
                                )}
                            </div>
                        </div>

                        {state.CurrentModalToggle === "Generate Test Case" ? (
                            <div className="xl min-h-96   space-y-0">
                                <div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="">
                                            <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                                Transactions <span className="text-red-500">*</span>
                                            </label>
                                            <Dropdown
                                                mode="multiple"
                                                options={state.TransactionsList}
                                                value={(state.TestConditionCriteria as any).TransactionId}
                                                onChange={(val: string, item: unknown, CurrItem: any): void =>
                                                    handleDropdownTransaction(val, item, CurrItem, "TransactionId")
                                                }
                                                onSearch={(q: string): void => console.log("Search (Multi):", q)}
                                            />
                                        </div>
                                        <div className="">
                                            <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                                Testing Technique <span className="text-red-500">*</span>
                                            </label>
                                            <Dropdown
                                                mode="single"
                                                options={state.TestingTechniquesList}
                                                value={(state.TestConditionCriteria as any).TestingTechniqueId}
                                                onChange={(val: string, item: unknown, CurrItem: any): void =>
                                                    handleDropdownTransaction(val, item, CurrItem, "TestingTechniqueId")
                                                }
                                                onSearch={(q: string): void => console.log("Search (Multi):", q)}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-8">
                                        {state.TestConditionCriteria.Transactions.map((vl: any, i: number) => {
                                            return (
                                                <div className="mb-6" key={vl.TransactionId ?? i}>
                                                    <Accordion title={vl.Transaction} expandKey={vl.TransactionId}>
                                                        <div className="p-">
                                                            <div className="overflow-x-auto">
                                                                <table className="min-w-full border border-gray-200 rounded-md">
                                                                    <thead>
                                                                    <tr className="bg-[#ebebeb] text-left">
                                                                        <th className="p-1.5 text-sm font-medium text-gray-700">Screen Name</th>
                                                                        <th className="p-1.5 text-sm font-medium text-gray-700">Field Name</th>
                                                                        <th className="p-1.5 text-sm font-medium text-gray-700">Testing Technique</th>

                                                                        <th className="p-1.5 text-sm font-medium text-gray-700">Field Type</th>
                                                                        <th className="p-1.5 text-sm font-medium text-gray-700">Field Value</th>
                                                                        <th className="p-1.5 text-sm font-medium text-gray-700">Boundary Values</th>
                                                                    </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                    {vl.TransactionFields.map((item2: any, id2: number) => (
                                                                        <tr key={id2} className="border-t border-gray-200 ">
                                                                            <td className="p-1.5 text-sm">
                                                                                <p>{item2.ScreenName}</p>
                                                                            </td>
                                                                            <td className="p-1.5 text-sm">
                                                                                <p>{item2.FieldName}</p>
                                                                            </td>
                                                                            <td className="p-1.5 text-sm">
                                                                                <p>{item2.TestingTechnique}</p>
                                                                            </td>
                                                                            <td className="p-1.5 text-sm">
                                                                                <p>{item2.FieldType}</p>
                                                                            </td>
                                                                            <td className="p-1.5 text-sm">
                                                                                <input
                                                                                    onChange={(e): void => handleUpdateFieldValue(e, i, id2, "FieldValue")}
                                                                                    type="text"
                                                                                    defaultValue={item2.FieldValue}
                                                                                    className="w-full p-2 rounded-md border border-gray-200 bg-gray-50 shadow-sm focus:outline-none"
                                                                                />
                                                                            </td>
                                                                            <td className="p-1.5 text-sm">
                                                                                <button
                                                                                    onClick={(): void => handlCurrEQC(item2)}
                                                                                    className="bg-[#0071E9] mr-4  cursor-pointer text-white px-3 py-1 rounded text-sm"
                                                                                >
                                                                                    Boundary Values
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </Accordion>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="overflow-x-auto  min-h-72">
                                    <table className="min-w-full text-sm border border-gray-200 rounded-md">
                                        <thead>
                                        <tr className="bg-[#ebebeb] text-left">
                                            <th className="p-2 font-semibold text-gray-700 w-96">Test Case</th>
                                            <th className="p-2 font-semibold text-gray-700 w-96">Pre Conditions</th>
                                            <th className="p-2 font-semibold text-gray-700 w-96">Expected Result</th>
                                            <th className="p-2 font-semibold text-gray-700 w-30">Priority</th>
                                            <th className="p-2 font-semibold text-gray-700 w-10 text-nowrap w-14 w-30">Test Type</th>
                                            <th className="p-2 font-semibold text-gray-700 w-36">Flag</th>
                                            <th className="p-2 font-semibold text-gray-700">Actions</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {!state.ShowLoader ? (
                                            state.TestCasesList.length > 0 ? (
                                                state.TestCasesList.map((item: any, id: number) => {
                                                    return (
                                                        <tr className="border-t border-gray-200 " key={id}>
                                                            <td className="p-2">
                                                                <div className="relative flex items-center">
                                                                    {item.TestCase}{" "}
                                                                    <span
                                                                        onClick={(): void => handleCurrentTestCase(item)}
                                                                        className="text-blue-700 ml-2 cursor-pointer"
                                                                    >
                                      <Info size={22} />
                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="p-2">{item.PreConditions}</td>
                                                            <td className="p-2">{item.ExpectedResult}</td>
                                                            <td className="p-2">{item.Priority}</td>
                                                            <td className="p-2">{item.TestType}</td>
                                                            <td className="p-2">
                                                                <div className="flex items-center">
                                                                    <div
                                                                        onClick={(): void => handleUpdateFlagTypeTestCase(id, item, "Valid")}
                                                                        className={`px-2 py-1 cursor-pointer ${
                                                                            item?.FlagType && item?.FlagType === "Valid"
                                                                                ? "bg-violet-600 text-white"
                                                                                : "bg-gray-200"
                                                                        }  mr-2 text-[0.70rem]  rounded-md`}
                                                                    >
                                                                        <p>Valid</p>
                                                                    </div>
                                                                    <div
                                                                        onClick={(): void => handleUpdateFlagTypeTestCase(id, item, "InValid")}
                                                                        className={`px-2 py-1 cursor-pointer ${
                                                                            item?.FlagType && item?.FlagType === "InValid"
                                                                                ? "bg-violet-600 text-white"
                                                                                : "bg-gray-200"
                                                                        }  mr-2 text-[0.70rem]  rounded-md`}
                                                                    >
                                                                        <p>Invalid</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="p-2">
                                                                <div className="cursor-pointer" onClick={(): void => handleEditTestCase(item)}>
                                                                    <Edit size={19} className="text-sky-600" />
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr className="border-t border-gray-200 ">
                                                    <td className="p-2" colSpan={11}>
                                                        <div className="py-10 flex flex-col w-full justify-center items-center">
                                                            <img src={Nodata} alt="No Data" className="w-58" />
                                                            <h3 className="text-lg font-semibold mt-4 text-gray-700">
                                                                No test cases have been generated yet.{" "}
                                                            </h3>
                                                            <h3 className="text-sm font-semibold mt-1 text-gray-600">
                                                                Generate test cases in the 'Generate Test Case' section.
                                                            </h3>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        ) : (
                                            <tr className="border-t border-gray-200 ">
                                                <td className="p-2" colSpan={10}>
                                                    <div className="h-96 py-20">
                                                        <SpinnerV2 {...{ text: "Generating Test Cases.." }} />
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        </tbody>
                                    </table>
                                    {state.TestCaseTotalRecords > 10 && (
                                        <div className="pt-4 flex justify-end">
                                            <Pagination
                                                total={state.TestCaseTotalRecords}
                                                current={state.TestCaseCurrentPage}
                                                pageSize={10}
                                                onChange={handleTestCasePageChange}
                                                showSizeChanger={false}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </CustomModal>

                <CustomModal
                    width="max-w-7xl"
                    isOpen={state.openModal4}
                    onClose={(): void => setState({ openModal4: false })}
                    title={<div className="font-medium text-base">{state.CurrScenario.TestScenarioName}</div>}
                    footerContent={[
                        <button
                            key="close"
                            onClick={(): void => setState({ openModal4: false })}
                            className="mt-2 cursor-pointer px-5 py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg"
                        >
                            Close
                        </button>,
                        ,
                    ]}
                >
                    <div className="space-y-5 h-full flex flex-col">
                        <table className="min-w-full border border-gray-300 rounded-md">
                            <tbody>
                            <tr className="border-t border-gray-200 bg-gray-50">
                                <td className="p-3 font-semibold text-gray-700 w-1/4 border-r border-gray-300">Business Logic:</td>
                                <td className="p-3 text-gray-800">{state.CurrScenario.BusinessLogic}</td>
                            </tr>
                            <tr className="border-t border-gray-200">
                                <td className="p-3 font-medium text-gray-700 border-r border-gray-300">Acceptance Criteria:</td>
                                <td className="p-3 text-gray-800">{state.CurrScenario.AcceptanceCriteria}</td>
                            </tr>

                            <tr className="border-t border-gray-200 bg-gray-50">
                                <td className="p-3 font-medium text-gray-700 border-r border-gray-300">Document Reference Mapping:</td>
                                <td className="p-3 text-gray-800">{state.CurrScenario.DocTraceabilitySources}</td>
                            </tr>
                            <tr className="border-t border-gray-200">
                                <td className="p-3 font-medium text-gray-700 border-r border-gray-300">Business Process Mapping:</td>
                                <td className="p-3 text-gray-800">{state.CurrScenario.ScenarioTraceabilitySources}</td>
                            </tr>
                            </tbody>
                        </table>

                        <div>
                            <p className="font-semibold pb-2 pl-2"> Related Transaction Codes:</p>
                            <div>
                                <div className="space-y-6">
                                    {Object.keys(state.CurrScenario).length > 0 &&
                                        state.CurrScenario?.RelatedTCodes?.map((item: any, index: number) => (
                                            <div key={index} className="border border-gray-300 rounded-lg p-4 shadow-sm bg-white">
                                                <h2 className="text-lg font-semibold text-blue-700">TCode: {item.TCode}</h2>
                                                <p className="text-gray-700 mb-4">Description: {item.TCodeDescription}</p>

                                                <div className="space-y-2">
                                                    {item.RelatedFields.map((field: any, i: number) => (
                                                        <div key={i} className="border border-gray-200 rounded p-3 bg-gray-50">
                                                            <p className="font-medium text-gray-800">Field Name: {field.FieldName}</p>
                                                            <p className="text-gray-600">
                                                                Possible Values:{" "}
                                                                <span className="text-gray-800">{field.PossibleDataValues.join(", ")}</span>
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </CustomModal>

                <CustomModal
                    width="max-w-7xl"
                    isOpen={state.openTestCaseModal}
                    onClose={(): void => setState({ openTestCaseModal: false })}
                    title={<div className="font-medium text-base">{state.CurrTestCase.TestCase}</div>}
                    footerContent={[
                        <button
                            key="close"
                            onClick={(): void => setState({ openTestCaseModal: false })}
                            className="mt-2 cursor-pointer px-5 py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg"
                        >
                            Close
                        </button>,
                        ,
                    ]}
                >
                    <div className="space-y-6 h-full flex flex-col text-sm">
                        <table className="min-w-full border border-gray-300 rounded-md">
                            <tbody>
                            <tr className="border-t border-gray-200 bg-gray-50">
                                <td className="p-3 font-semibold text-gray-700 w-1/4 border-r border-gray-300">Test Case:</td>
                                <td className="p-3 text-gray-800">{state.CurrTestCase.TestCase}</td>
                            </tr>
                            <tr className="border-t border-gray-200">
                                <td className="p-3 font-medium text-gray-700 border-r border-gray-300">Pre Conditions:</td>
                                <td className="p-3 text-gray-800">{state.CurrTestCase.PreConditions}</td>
                            </tr>
                            <tr className="border-t border-gray-200 bg-gray-50">
                                <td className="p-3 font-medium text-gray-700 border-r border-gray-300">Expected Result:</td>
                                <td className="p-3 text-gray-800">{state.CurrTestCase.ExpectedResult}</td>
                            </tr>
                            <tr className="border-t border-gray-200 bg-gray-50">
                                <td className="p-3 font-medium text-gray-700 border-r border-gray-300">Priority:</td>
                                <td className="p-3 text-gray-800">{state.CurrTestCase.Priority}</td>
                            </tr>
                            <tr className="border-t border-gray-200">
                                <td className="p-3 font-medium text-gray-700 border-r border-gray-300">Test Type:</td>
                                <td className="p-3 text-gray-800">{state.CurrTestCase.TestType}</td>
                            </tr>
                            <tr className="border-t border-gray-200 bg-gray-50">
                                <td className="p-3 font-medium text-gray-700 border-r border-gray-300">Module:</td>
                                <td className="p-3 text-gray-800">{state.CurrTestCase.Module}</td>
                            </tr>
                            </tbody>
                        </table>

                        {state.CurrTestCase.TestData && (
                            <div>
                                <p className="font-semibold pb-2 pl-2">Test Data:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(state.CurrTestCase.TestData).map(([key, value]) => (
                                        <div key={key} className="border border-gray-300 rounded p-3 bg-gray-50">
                                            <p className="text-gray-700">
                                                <span className="font-medium">{JSON.stringify(key)}:</span> {JSON.stringify(value) || "—"}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {state.CurrTestCase.TestSteps && (
                            <div>
                                <p className="font-semibold pb-2 pl-2">Test Steps:</p>
                                <ol className="list-decimal list-inside space-y-1 pl-4">
                                    {state.CurrTestCase.TestSteps.map((step: string, index: number) => (
                                        <li key={index} className="text-gray-800">
                                            {step}
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}
                    </div>
                </CustomModal>

                <CustomModal
                    width="max-w-7xl"
                    isOpen={state.openUncoveredSectionsModal}
                    onClose={(): void => setState({ openUncoveredSectionsModal: false })}
                    title={<div className="font-medium text-base ">Ignored Sections From Document</div>}
                    footerContent={[
                        <button
                            key="close"
                            onClick={(): void => setState({ openUncoveredSectionsModal: false })}
                            className="mt-2 cursor-pointer px-5 py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg"
                        >
                            Close
                        </button>,
                        ,
                    ]}
                >
                    <div className="space-y-6 h-full flex flex-col text-sm ">
                        {state.UncoveredSections.map((vl: any, i: number) => {
                            return (
                                <Accordion title={vl.SectionTitle} expandKey={vl.SectionTitle} key={i}>
                                    <div>
                                        <p>{vl.SectionContent}</p>
                                    </div>
                                </Accordion>
                            );
                        })}
                    </div>
                </CustomModal>

                <div>
                    <PannelWrapper className="">
                        <div className="">
                            {state.CurrentToggle === "Test Scenarios" && (
                                <div className="w-full ">
                                    <div className="flex items-center py-4  gap-6  w-full">
                                        <div className="">
                                            <div className=" min-w-1/4 ">
                                                <div className=" ">
                                                    <DropdownV2
                                                        Icon={<HugeiconsIcon icon={DocumentValidationIcon} />}
                                                        size="small"
                                                        mode="single"
                                                        searchable={false}
                                                        options={[
                                                            { value: "No", label: "Valid", icon: <Layers size={15} /> },
                                                            { value: "Yes", label: "Invalid", icon: <Code2 size={15} /> },
                                                        ]}
                                                        value={state.FlagType}
                                                        onChange={(val, item) => {  handleGetDataBySourceType(val, item, "SourceType"); }}
                                                        placeholder=""
                                                    />
                                                </div>

                                            </div>
                                            {/*<ToggleButtonGroup animationFlag={true} initialKey={state.FlagType} items={options} onChange={handleCurrentTab} />*/}
                                        </div>

                                        <div className=" flex items-center gap-5">
                                            <p>Source Type </p>
                                            <div className="flex   items-center -end    ">
                                                <div className="w-40 ">
                                                    <DropdownV2
                                                        size="small"
                                                        mode="single"
                                                        searchable={false}
                                                        options={state.SourceTypes}
                                                        value={state.ScenarioFilters.SourceType}
                                                        onChange={(val: string, item: unknown): void => handleScenarioFilter(val, item, "SourceType")}
                                                        placeholder="Select"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className=" flex items-center gap-5">
                                            <p>Source </p>
                                            <div className="flex  items-center -end    ">
                                                <div className="w-96">
                                                    <DropdownV2
                                                        size="small"
                                                        mode="single"
                                                        searchable={false}
                                                        options={state.DocumentList}
                                                        value={state.ScenarioFilters.DocumentId}
                                                        onChange={(val: string, item: unknown): void => handleScenarioFilter(val, item, "DocumentId")}
                                                        placeholder="Select"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center w-80">
                                            <p className="flex text-sm font-medium items-center pr-4">Version:</p>
                                            <DropdownV2
                                                mode="single"
                                                size={"small"}
                                                searchable={false}
                                                options={[
                                                    { label: "Current", value: "Current" },
                                                    { label: "Previous", value: "Previous" },
                                                    { label: "Old", value: "Old" },
                                                ]}
                                                value={state.CurrentTestCaseVersionType}
                                                onChange={(val: string, item: unknown): void => handleFilterTestCaseByVersionType(val, item)}
                                            />
                                        </div>
                                    </div>

                                    <CustomTableData
                                        showSpinnerFlag={state.ShowTestScenariosLoader}
                                        HorizontalScroll={true}
                                        scrollHeightClass="h-[calc(100vh-364px)]"
                                        truncateCharLimit={40}
                                        data={TestScenariosData}
                                        columns={TestScenarioColumns}
                                        rowKey="id"
                                    />
                                    <div className="">
                                        <div className="flex justify-between items-center">
                                            <div className="flex  items-center">
                                                <p className="text-blue-700 text-sm font-semibold">
                                                    Total Scenarios: {state.TotalRecords}
                                                    <span></span>
                                                </p>
                                            </div>
                                            <div className="pt-4 flex justify-end">
                                                {state.TotalRecords > 10 && (
                                                    <Pagination
                                                        total={state.TotalRecords}
                                                        current={state.CurrentPage}
                                                        pageSize={10}
                                                        onChange={handlePageChange}
                                                        showSizeChanger={false}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {state.CurrentToggle === "BRD Summary" && (
                                <div className="overflow-x-auto mt-4 h-[calc(100vh-280px)]">
                                    <div className="space-y-6">
                                        {state.BRDSummary?.map((item: any, index: number) => (
                                            <div key={index} className="bg-gray-100 p-6 rounded-lg shadow-md">
                                                <h2 className="text-xl font-bold text-gray-800 mb-4">BRD Summary</h2>
                                                <p className="text-gray-700 whitespace-pre-line">{item.BRDSummary}</p>
                                            </div>
                                        ))}

                                        {state.TestStrategy?.map((item: any, index: number) => (
                                            <div key={index} className="bg-gray-100 p-6 rounded-lg shadow-md">
                                                <h2 className="text-xl font-bold text-gray-800 mb-4">Test Strategy</h2>
                                                <div className="space-y-4">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-700">Strategy</h3>
                                                        <p className="text-gray-600 whitespace-pre-line">{item.TestStrategy}</p>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-700">Test Types</h3>
                                                        <p className="text-gray-600">{item.TestTypes}</p>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-700">Test Environment</h3>
                                                        <p className="text-gray-600 whitespace-pre-line">{item.TestEnvironment}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {state.ImpactAnalysis?.map((item: any, index: number) => (
                                            <div key={index} className="bg-gray-100 p-6 rounded-lg shadow-md">
                                                <h2 className="text-xl font-bold text-gray-800 mb-4">Impact Analysis</h2>
                                                <div className="space-y-4">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-700">Impact</h3>
                                                        <p className="text-gray-600">{item.Impact}</p>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-700">Affected Systems</h3>
                                                        <p className="text-gray-600">{item.AffectedSystems}</p>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-700">Stakeholders</h3>
                                                        <p className="text-gray-600">{item.Stakeholders}</p>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-700">Impact Level</h3>
                                                        <p className="text-gray-600">{item.ImpactLevel}</p>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-700">Justification</h3>
                                                        <p className="text-gray-600 whitespace-pre-line">{item.Justification}</p>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-700">Description</h3>
                                                        <p className="text-gray-600 whitespace-pre-line">{item.Description}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </PannelWrapper>
                </div>
            </div>
        </div>
    );
}
