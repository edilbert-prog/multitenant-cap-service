import React, {
    useEffect,
    useReducer,
    useRef,
    ChangeEvent,
    MouseEvent,
} from "react";
import { apiRequest } from "../../../utils/helpers/ApiHelper";
import {
    ChevronLeft,
    CircleAlert,
    Code2,
    Download,
    Edit,
    FileWarning,
    Info,
    Layers,
} from "lucide-react";
import Accordion from "../../../utils/Accordion";
import Dropdown from "../../../utils/Dropdown";
import CustomModal from "../../../utils/CustomModal";
import PannelWrapper from "../../../utils/PannelWrapper";
import axios from "axios";
import socket from "../../../utils/socket";
import Pagination from "../../../utils/Pagination";
import { FileDownloader } from "../../../utils/helpers/FileDownloader";
import CustomTableData from "../../../utils/CustomTableData";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";
import SearchBar from "../../../utils/SearchBar";
import useDebounce from "../../../utils/helpers/useDebounce";
import { AiOutlineExport } from "react-icons/ai";
import {PiExport, PiSteps} from "react-icons/pi";
import { toLocalTime } from "../../../utils/helpers/DateTimeParser";
import { uniqueByKeys } from "../../../utils/helpers/UniqueDataFilter";
import { HostConfig } from "../../../../HostConfig";
import ToggleButtonGroupV2 from "../../../utils/ToggleButtonGroupV2";
import DropdownV2 from "../../../utils/DropdownV2";
import { truncateString } from "../../../utils/helpers/HelperFun";
import Tooltip from "../../../utils/Tooltip";
import { StatusMessage } from "../../../utils/StatusMessage";
import SpinnerV2 from "../../../utils/SpinnerV2";
import Menu from "../../../utils/Menu";
import {useSidebar} from "@/utils/SidebarNav/SidebarContext";
import ToggleButtonGroupV3 from "@/utils/ToggleButtonGroupV3";
import {GiBullets} from "react-icons/gi";
import {FaListCheck} from "react-icons/fa6";
import ValidationReport from "@/components/ValidationTabView/ValidationReport";
import PostmanViewerModal from "@/utils/PostmanViewerModal";
import TestCaseDetailsModal from "@/components/TestDesignStudio/Artifacts/TestCaseDetailsModal";

type FlagType =  "Yes" | "No";
type VersionType = "Current" | "Previous" | "Old";

interface CurrJIRAConfig {
    BaseURL?: string;
}

interface CurrentSession {
    ClientId: string;
    ProjectId: string;
    SessionId: string;
    SprintId: string;
    DocumentId: string;
    DocumentName?: string;
    InputFileURL?: string;
    MarkdownFileURL?: string;
    BusinessUnitId?: string;
}

interface Props {
    CurrentSession: CurrentSession;
    CurrJIRAConfig?: CurrJIRAConfig;
    handleBack: () => void;
}

interface TransactionOption {
    label: string;
    value: string;
}

interface TestCaseItem {
    TestCaseId: string;
    TestCase: string;
    PreConditions: string;
    ExpectedResult: string;
    Priority: string;
    TestType: string;
    CreatedDate?: string;
    FlagStatus?: "Yes" | "No";
    Module?: string;
    TestData?: Record<string, unknown>;
    TestSteps?: string[];
    [k: string]: unknown;
}

interface RelatedTCodeField {
    FieldName: string;
    PossibleDataValues: string[];
}

interface RelatedTCode {
    TCode: string;
    TCodeDescription?: string;
    RelatedFields?: RelatedTCodeField[];
}

interface ScenarioItem {
    TestScenarioId: string;
    Priority?: string;
    SectionTitle?: string;
    SectionContent?: string;
    TestScenarioName: string;
    RelatedTCodes?: RelatedTCode[];
    TransactionList?: TransactionOption[];
    TransactionCode?: string;
    TestingLevel?: string;
    FlagStatus?: "Yes" | "No";
    GenerateMTCFlag?: boolean;
    BusinessLogic?: string;
    Description?: string;
    AcceptanceCriteria?: string;
    DocTraceabilitySources?: string;
    ScenarioTraceabilitySources?: string;
    ClientId?: string;
    ProjectId?: string;
    SessionId?: string;
    SprintId?: string;
    DocumentId?: string;
    Transactions?: any[]; // from utils/api untyped
    TestingTechniqueName?: string;
    TestingTechnique?: string;
    [k: string]: unknown;
}

interface EqBoundaryItem {
    LowerLimit?: string | number;
    LwLimitBVN?: string | number;
    LwLimitBVP?: string | number;
    UpperLimit?: string | number;
    UPLimitBVN?: string | number;
    UPLimitBVP?: string | number;
}

interface TestConditionCriteria {
    ClientId: string;
    BusinessUnitId: string;
    BusinessProcessId: string;
    BusinessSubProcessId: string;
    ApplicationId: string;
    TransactionId: string;
    TestingTechniqueId: string;
    TestingTechniqueName: string;
    TransactionFields: any[]; // untyped external
    Transactions: any[]; // untyped external
    [k: string]: unknown;
}

interface CurrAddEditTestCaseObj {
    ClientId: string;
    ProjectId: string;
    SprintId: string;
    SessionId: string;
    DocumentId: string;
    TestScenarioId: string;
    TestCaseId: string;
    TestCase: string;
    PreConditions: string;
    ExpectedResult: string;
    ActualResult: string;
    Priority: string;
    TestType: string;
    Comments?: string;
    [k: string]: unknown;
}

interface ValidateTestCaseFields {
    TestCase: string;
    ExpectedResult: string;
}

interface State {
    ActionType: string;
    Error: string;
    CurrentTCModalToggle: string;
    CurrentToggle: "Test Scenarios" | "BRD Summary";
    CurrentModalToggle: "Generate Test Case" | "Test Cases";
    SearchQuery: string;
    TestCaseSearchQuery: string;
    CurrentTCVersion: string;
    CurrentTestCaseVersionType: VersionType;
    CurrentTestCaseVersionId: string;
    GenerateMassTotalTestCases: string | number;
    CurrentPage: number;
    openEditTestCaseModal: boolean;
    openUncoveredSectionsModal: boolean;
    openBatchTCGenerationModal: boolean;
    SelectAllGenerateMTC: boolean;
    SelectAllAcrossResults: boolean;
    SelectedScenarioIds: Set<string>;
    ExcludedScenarioIds: Set<string>;
    ShowBatchTCGenerationLoader: boolean;
    TotalRecords: number;
    TestCaseTotalRecords: number;
    CurrAddEditTestCaseObj: CurrAddEditTestCaseObj;
    TransactionsList: TransactionOption[];
    BRDSummary: any[];
    TestStrategy: any[];
    TestStepsList: any[];
    ImpactAnalysis: any[];
    ScenariosList: ScenarioItem[];
    existingMarkdownList: any[];
    TestingTechniquesList: TransactionOption[];
    UncoveredSections: Array<{ SectionTitle: string; SectionContent: string }>;
    EqClassesBaundaryValues: EqBoundaryItem[];
    ApplicationsList: any[];
    TestCasesList: TestCaseItem[];
    ViewClientDetails: boolean;
    ShowLoader: boolean;
    ShowTestCases: boolean;
    IsLoading: boolean;
    ShowTestScenariosLoader: boolean;
    openTestCaseModal: boolean;
    openModal: boolean;
    openModal4: boolean;
    CurrScenario: Partial<ScenarioItem> & Record<string, unknown>;
    ScenarioFilterObj: { FlagType: FlagType };
    CurrTestCase: Partial<TestCaseItem> & Record<string, unknown>;
    LLMConfig: any;
    openModal3: boolean;
    SavingLoader: boolean;
    TestConditionCriteria: TestConditionCriteria;
    ValidateTestCaseFields: ValidateTestCaseFields;
    TestCaseFormErrors: Record<string, string>;
    TestCaseCurrentPage?: number;
}

export default function ProjectSprintSessionDetails(props: Props) {
    const { toggleCollapse } = useSidebar();
    const [state, setState] = useReducer(
        (s: State, ns: Partial<State>): State => ({ ...s, ...ns }),
        {
            ActionType: "",
            Error: "",
            CurrentToggle: "Test Scenarios",
            CurrentModalToggle: "Generate Test Case",
            CurrentTCModalToggle: "Test Steps",
            SearchQuery: "",
            TestCaseSearchQuery: "",
            CurrentTCVersion: "",
            CurrentTestCaseVersionType: "Current",
            CurrentTestCaseVersionId: "",
            GenerateMassTotalTestCases: "",
            CurrentPage: 1,
            openEditTestCaseModal: false,
            openUncoveredSectionsModal: false,
            openBatchTCGenerationModal: false,
            SelectAllGenerateMTC: true,
            SelectAllAcrossResults: false,
            SelectedScenarioIds: new Set<string>(),
            ExcludedScenarioIds: new Set<string>(),

            ShowBatchTCGenerationLoader: false,
            TotalRecords: 0,
            TestCaseTotalRecords: 0,
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
            BRDSummary: [],
            TestStepsList: [],
            TestStrategy: [],
            ImpactAnalysis: [],
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
            IsLoading: true,
            ShowTestScenariosLoader: false,
            openTestCaseModal: false,
            openModal: false,
            openModal4: false,
            CurrScenario: {},
            ScenarioFilterObj: { FlagType: "No" },
            CurrTestCase: {},
            LLMConfig: {},
            openModal3: false,
            SavingLoader: false,
            TestConditionCriteria: {
                ClientId: "",
                BusinessUnitId: "",
                BusinessProcessId: "",
                BusinessSubProcessId: "",
                ApplicationId: "",
                TransactionId: "",
                TestingTechniqueId: "",
                TestingTechniqueName: "",
                TransactionFields: [],
                Transactions: [],
            },

            ValidateTestCaseFields: {
                TestCase: "",
                ExpectedResult: "",
            },
            TestCaseFormErrors: {},





            tab: 'upload',
            ViewSummary: false,
            ValidationComponentModalOpen: false,
            CurrentSprint: {},
            DocumentList: [],
            ScenarioFilters: {
                DocumentId: "",
                SourceType: "",
                VersionType: "",
            },
            ProjectSprintList: [],

            toastMessage:'',
            ViewSprintDetails: false,
            resetDocUpload: false,
            showToast: false,
            isDataExist: "",
            TestStepsHeaderList: [],
            SelectedTestStepsHeader: "",
            AvailableTestSteps: [],
            SelectedTestStepsIds: [],
            AssignedTestCaseSteps: [],
            ExecutingSteps: false,
            AssignedTestStepsFilter: "",
            isApiDetailsModalOpen: false,
            currentApiDetails: null,
            deletingId: null,
            // ADD THESE TWO NEW INITIAL VALUES FOR VALIDATION
            showValidationModal: false,
            validationErrors: [],
        } as State
    );

    const didFetchData = useRef<boolean>(false);
    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;

        const init = async () => {
            setState({ IsLoading: true });

            await Promise.all([
                getData(""),
                // GetDefaultLLMEngineConfig(),
                getGetTestingTechnicsList(),
                getBRDSummary(),
            ]);
            setState({ IsLoading: false });
        };

        init();
    }, []);

    const debouncedSearchQuery: string = (useDebounce(state.SearchQuery, 300) as unknown) as string;
    const didSearchRun = useRef<boolean>(false);

    useEffect(() => {
        // Skip on initial render
        if (!didSearchRun.current) {
            didSearchRun.current = true;
            return;
        }
        // Skip if query is still empty string after debounce
        if (debouncedSearchQuery.trim() === "") return;
        getData(debouncedSearchQuery);
    }, [debouncedSearchQuery]);

    const debouncedTestCaseSearchQuery: string = (useDebounce(state.TestCaseSearchQuery, 300) as unknown) as string;
    const didTestCaseSearchRun = useRef<boolean>(false);

    useEffect(() => {
        if (!didTestCaseSearchRun.current) {
            didTestCaseSearchRun.current = true;
            return;
        }
        if (debouncedTestCaseSearchQuery.trim() === "") return;
        getTestCasesList(debouncedTestCaseSearchQuery, state.CurrScenario as ScenarioItem);
    }, [debouncedTestCaseSearchQuery]);

    useEffect(() => {
        socket.on('TestCasesGenerated', (data: any) => {
            getTestCasesList("", data.data, 1, true, state.CurrentTestCaseVersionType);
        });
        return () => {
            socket.off('session_status_updated');
        };
    }, [state.CurrentTestCaseVersionType]);

    const getTestCasesList = async (
        SearchString: string = "",
        CurrScenario: Partial<ScenarioItem> = {},
        PageNo: number = 1,
        isSocketTriggered: boolean = false,
        VersionType: VersionType = "Current",
        VersionId: string = ""
    ) => {
        try {
            const resp: any = await apiRequest("/cognito/api/GetProjectSprintSessionDocumentTestCasesPaginationFilterSearch", {
                PageNo,
                SearchString: SearchString?.toLowerCase(),
                TestScenarioId: (CurrScenario as any).TestScenarioId,
                VersionType,
                VersionId,
                ClientId: (CurrScenario as any).ClientId,
                ProjectId: (CurrScenario as any).ProjectId,
                SessionId: (CurrScenario as any).SessionId,
                SprintId: (CurrScenario as any).SprintId,
                DocumentId: (CurrScenario as any).DocumentId,
            });
            const CurrentTCVersion: string = resp.ResponseData.length > 0 ? resp.ResponseData[0].VersionId : "";
            setState({
                TestCasesList: resp.ResponseData as TestCaseItem[],
                CurrentTCVersion,
                TestCaseTotalRecords: resp.TotalRecords as number,
            });
            if (isSocketTriggered) {
                setState({ ShowLoader: false });
            }
        } catch (err) {
            console.error("Error loading Country/State/City:", err);
        }
    };

    const getGetTransactionsList = async (item: any) => {
        try {
            let TransactionsList: TransactionOption[] = [];
            const resp: any = await apiRequest("/GetProjectSprintSessionBPTransactionsBySessionId", item);
            TransactionsList = resp.ResponseData;
            if (Object.prototype.hasOwnProperty.call(item, "RelatedTCodes")) {
                if (item.RelatedTCodes.length > 0) {
                    const finalTcodes: TransactionOption[] = [];
                    item?.RelatedTCodes.map((v: any) => {
                        v.TCode = String(v.TCode);
                        if (!v.TCode.includes("SE16")) {
                            const temp: TransactionOption = {
                                label: v.TCode,
                                value: v.TCode,
                            };
                            finalTcodes.push(temp);
                        }
                        return null;
                    });
                    TransactionsList = uniqueByKeys([...TransactionsList, ...finalTcodes], ['value']);
                }
            }
            console.log("item.RelatedTCodes", item.RelatedTCodes);
            setState({
                TransactionsList,
            });
        } catch (err) {
            console.error("Error loading Country/State/City:", err);
        }
    };

    const getBRDSummary = async () => {
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

    const getGetTestingTechnicsList = async (_ApplicationId: string = "APID-5", _SearchString: string = "") => {
        try {
            const resp: any = await apiRequest("/testing/GetTestingTechniquesMaster", {});
            setState({
                TestingTechniquesList: resp.ResponseData,
            });
        } catch (err) {
            console.error("Error loading Country/State/City:", err);
        }
    };

    const GetTestStepsByTCODE = async (item) => {
        item.SearchString=item.TransactionCode
        let ReqObj={
            SearchString:item.TransactionCode,
            TestLevel:item.TestingLevel,
        }
        const resp: any = await apiRequest("/GetTestStepsWithDetailsPaginationFilterByTcode", ReqObj);
        if (resp.ResponseData.length > 0) {
            setState({ TestStepsList: resp.ResponseData });
        }
    }
    const GetDefaultLLMEngineConfig = async () => {
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

    const getData = async (SearchQuery: string = "", FlagType: FlagType = "No", PageNo: number = 1) => {
        try {
            setState({ ShowTestScenariosLoader: true });
            const SearchQueryInp = String(SearchQuery).toLowerCase();
            let finalSearchQuery = "";
            if (SearchQueryInp) {
                if (SearchQueryInp?.includes("ts-")) {
                    const StrArr = SearchQueryInp.split('ts-');
                    finalSearchQuery = StrArr.length > 1 ? StrArr[1] : SearchQueryInp;
                } else {
                    finalSearchQuery = SearchQueryInp;
                }
            }
            const resp: any = await apiRequest("/project-sprint-session-docs/GetProjectSprintSessionDocScenarios", {
                StartDate: "",
                EndDate: "",
                PageNo,
                FlagType,
                SearchString: finalSearchQuery,
                ClientId: props.CurrentSession.ClientId,
                ProjectId: props.CurrentSession.ProjectId,
                SessionId: props.CurrentSession.SessionId,
                DocumentId: props.CurrentSession.DocumentId,
            });

            resp.ResponseData.map((item: ScenarioItem) => {
                const TransactionList: TransactionOption[] = [];
                (item as any).TestingLevel = "UAT";
                (item as any).GenerateMTCFlag = false;
                // if (Object.prototype.hasOwnProperty.call(item, "RelatedTCodes") && (item.RelatedTCodes?.length ?? 0) > 0) {
                //     item.RelatedTCodes!.map((v: RelatedTCode, id: number) => {
                //         (v as any).TCode = String(v.TCode);
                //         if (!String(v.TCode).includes("SE16")) {
                //             const temp: TransactionOption = {
                //                 label: String(v.TCode),
                //                 value: String(v.TCode),
                //             };
                //             TransactionList.push(temp);
                //         }
                //         if (id === 0) {
                //             (item as any).TransactionCode = String(v.TCode);
                //         }
                //         return null;
                //     });
                // }
                (item as any).TransactionList = TransactionList;
                return null;
            });
            setState({
                ScenariosList: resp.ResponseData as ScenarioItem[],
                TotalRecords: resp.TotalRecords as number,
            });
        } catch (err: any) {
            setState({ Error: err.toString() });
        } finally {
            setState({ IsLoading: false });
            setState({ ShowTestScenariosLoader: false });
        }
    };

    const getGetTransactionsFieldsList = async (item: any, _SearchString: string = "") => {
        item.SearchString = "";
        const TestConditionCriteria = { ...state.TestConditionCriteria };
        try {
            const resp: any = await apiRequest("/GetTransactionTableFieldValuesMasterNew", item);
            if (resp.ResponseData.length > 0) {
                TestConditionCriteria.Transactions = resp.ResponseData;
                setState({ TestConditionCriteria });
            } else {
                TestConditionCriteria.Transactions = [];
                setState({ TestConditionCriteria });
            }
        } catch (err) {
            TestConditionCriteria.Transactions = [];
            setState({ TestConditionCriteria });
            console.error("Error loading Country/State/City:", err);
        }
    };

    const handleFilterTestCaseByVersionType = (val: VersionType, _options: any) => {
        setState({ CurrentTestCaseVersionType: val });
        getTestCasesList("", state.CurrScenario as ScenarioItem, state.TestCaseCurrentPage ?? 1, false, val);
    };

    const handleFilterScenarioDropdown = (val: FlagType, _options: any, name: keyof State["ScenarioFilterObj"]) => {
        let ScenarioFilterObj = state.ScenarioFilterObj;
        ScenarioFilterObj[name] = val;
        setState({ ScenarioFilterObj });
        getData("", ScenarioFilterObj[name], 1);
    };

    const handleDropdownTSTransaction = (val: string, _options: any, i: number) => {
        let ScenariosList = state.ScenariosList;
        (ScenariosList[i] as any)["TransactionCode"] = val;
        setState({ ScenariosList });
    };

    const handleDropdownTSTestingLevel = (val: string, _options: any, i: number) => {
        let ScenariosList =state.ScenariosList;
        (ScenariosList[i] as any)["TestingLevel"] = val;
        setState({ ScenariosList });
    };

    const handleDropdownTransaction = (val: string, options: any, CurrItem: any, name: keyof TestConditionCriteria) => {
        let TestConditionCriteria =state.TestConditionCriteria;
        (TestConditionCriteria as any)[name] = val;
        if (name === "TestingTechniqueId") {
            TestConditionCriteria["TestingTechniqueName"] = val ? options.label : "";
        }
        setState({ TestConditionCriteria });

        if (name === "TransactionId") {
            if (val) {
                // placeholder for future logic
            } else {
                TestConditionCriteria.TransactionFields = [];
                setState({ TestConditionCriteria });
            }
        }
        if (name === "TransactionId") {
            getGetTransactionsFieldsList(TestConditionCriteria);
        }

        if (name === "TestingTechniqueId") {
            TestConditionCriteria.TransactionFields = [];
            getGetTransactionsFieldsList(TestConditionCriteria);
        }
    };

    const handleCurrentScenario = (item: ScenarioItem) => {
        setState({ openModal4: true, CurrScenario: item });
    };

    const handleSelectionActionType = (item: { id: string }) => {
        if (item.id === "MassTestCases") {
            handleGenerateMassTestCase();
        }
    };

    const handleGenerateMassTestCase = async () => {
        setState({ openBatchTCGenerationModal: true, ShowBatchTCGenerationLoader: true });
        const resp: any = await apiRequest("/GenerateMassTestCasesFromScenarios", {
            ClientId: props.CurrentSession.ClientId,
            ProjectId: props.CurrentSession.ProjectId,
            SessionId: props.CurrentSession.SessionId,
            DocumentId: props.CurrentSession.DocumentId,
        });
        if (resp) {
            const GenerateMassTotalTestCases = resp.scenariosProcessed;
            setState({ GenerateMassTotalTestCases });
        }
        setState({ ShowBatchTCGenerationLoader: false });
    };

    const handleGenerateTestCase = async (_item?: any) => {
        setState({ ShowLoader: true, ShowTestCases: true, CurrentModalToggle: "Test Cases" });

        try {
            const CurrScenario = { ...(state.CurrScenario as ScenarioItem) };
            if (CurrScenario) {
                const TestConditionCriteria = { ...state.TestConditionCriteria };
                const TTQNames: string[] = [];
                if (TestConditionCriteria.TestingTechniqueId) {
                    const TestingTechniquesList = state.TestingTechniquesList;
                    const TTQIDS = String(TestConditionCriteria.TestingTechniqueId).split(',');
                    TTQIDS.map((v) => {
                        const TTQ = TestingTechniquesList.filter((val => val.value === v));
                        if (TTQ.length > 0) {
                            TTQNames.push(TTQ[0].value);
                        }
                        return null;
                    });
                }
                (CurrScenario as any).Transactions = TestConditionCriteria.Transactions;
                (CurrScenario as any).TestingTechniqueName = TestConditionCriteria.TestingTechniqueName;
                (CurrScenario as any).TestingTechnique = TTQNames.join(',');

                const reqObject = {
                    ActionType: "TestCase",
                    ClientId: CurrScenario.ClientId,
                    ProjectId: CurrScenario.ProjectId,
                    BusinessUnitId: props.CurrentSession.BusinessUnitId,
                    SprintId: CurrScenario.SprintId,
                    SessionId: CurrScenario.SessionId,
                    DocumentId: props.CurrentSession.DocumentId,
                    TestScenarioId: CurrScenario.TestScenarioId,
                    TransactionCode: CurrScenario.TransactionCode,
                    TestingLevel: CurrScenario.TestingLevel,
                    MarkdownFilePath: props.CurrentSession.MarkdownFileURL,
                    TestScenario: CurrScenario,
                    // LLMConfig: state.LLMConfig,
                };
                const token = sessionStorage.getItem('access_token');

                await axios.post("/cognito/api/llm/GenerateDataByExistingMDFile", reqObject,{
                    headers: { 'Content-Type': 'application/json', "authentication": token, }});
                getTestCasesList("", CurrScenario);
            }
        } catch (err) {
            console.error("Error loading Country/State/City:", err);
        }
    };

    const handleUpdateFieldValue = (e: React.ChangeEvent<HTMLInputElement>, id1: number, id2: number, name: string) => {
        const TestConditionCriteria = { ...state.TestConditionCriteria };
        (TestConditionCriteria as any).Transactions[id1].TransactionFields[id2][name] = e.target.value;
        setState({ TestConditionCriteria });
    };

    const handlCurrEQC = (item: any) => {
        setState({ openModal3: true, CurrEQ: item as any, EqClassesBaundaryValues: item.EquivalenceClasses as EqBoundaryItem[] });
    };

    // const handleCurrentTestCase = (item: TestCaseItem) => {
    //     setState({ openTestCaseModal: true, CurrTestCase: item });
    //     GetTestStepsByTCODE(item)
    // };

    const handleViewScenarioDetails = (item: ScenarioItem) => {
        console.log("item===>", item);

        const TestConditionCriteria: TestConditionCriteria = {
            ClientId: "",
            BusinessUnitId: "",
            BusinessProcessId: "",
            BusinessSubProcessId: "",
            ApplicationId: "",
            TransactionId: "",
            TestingTechniqueId: "",
            TestingTechniqueName: "",
            TransactionFields: [],
            Transactions: [],
        };

        setState({ openModal: true, TestConditionCriteria, CurrScenario: item, CurrentModalToggle: "Generate Test Case" });
        getGetTransactionsList(item);

    };

    const handleChangeTestCase = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, name: keyof CurrAddEditTestCaseObj) => {
        const CurrAddEditTestCaseObj = { ...state.CurrAddEditTestCaseObj };
        (CurrAddEditTestCaseObj as any)[name] = e.target.value;
        setState({ CurrAddEditTestCaseObj });
    };

    const handleEditTestCase = (item: CurrAddEditTestCaseObj) => {
        setState({ openEditTestCaseModal: true, CurrAddEditTestCaseObj: item });
    };

    const validateTestCaseForm = () => {
        const FormErrors: Record<string, string> = {};
        let formIsValid = true;

        const emailRegex = "";
        for (const name in state.ValidateTestCaseFields) {
            const value = (state.CurrAddEditTestCaseObj as any)[name];
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
            TestCaseFormErrors: FormErrors,
        });
        return formIsValid;
    };

    const handleUpdateFlagTypeTestCase = (e: any, id: number) => {
        const TestCasesList = [...state.TestCasesList];
        const isChecked = e.target.checked as boolean;
        (TestCasesList[id] as any).FlagStatus = isChecked ? "Yes" : "No";
        setState({ TestCasesList });
        void apiRequest("/AddUpdateProjectSprintSessionDocumentTestCases", TestCasesList[id] as any);
    };

    const handleSelectAllGenerateMTC = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        if (checked) {
            setState({
                SelectAllAcrossResults: true,
                SelectedScenarioIds: new Set<string>(),
                ExcludedScenarioIds: new Set<string>(),
                ScenariosList: state.ScenariosList.map(r => ({ ...r, GenerateMTCFlag: true })),
            });
        } else {
            setState({
                SelectAllAcrossResults: false,
                SelectedScenarioIds: new Set<string>(),
                ExcludedScenarioIds: new Set<string>(),
                ScenariosList: state.ScenariosList.map(r => ({ ...r, GenerateMTCFlag: false })),
            });
        }
    };

    const handleSelectAllGenerateMTCWorker = (e: React.ChangeEvent<HTMLInputElement>, id: number) => {
        const checked = e.target.checked;
        const item = state.ScenariosList[id];
        toggleScenarioRow(item, id, checked);
    };

    const handleUpdateFlagGenerateMTCFlag = (e: React.ChangeEvent<HTMLInputElement>, id: number) => {
        const checked = e.target.checked;
        const item = state.ScenariosList[id];
        toggleScenarioRow(item, id, checked);
    };

    const handleUpdateFlagTypeTestScenario = (e: React.ChangeEvent<HTMLInputElement>, id: number) => {
        const ScenariosList = [...state.ScenariosList];
        const isChecked = e.target.checked;
        (ScenariosList[id] as any).FlagStatus = isChecked ? "Yes" : "No";
        setState({ ScenariosList });
        void apiRequest("/UpdateTestScenarioFlagStatus", ScenariosList[id] as any);
    };

    const getScenarioId = (item: ScenarioItem) => item.TestScenarioId;
    const isSelectedScenario = (item: ScenarioItem) => {
        const id = getScenarioId(item);
        return state.SelectAllAcrossResults
            ? !state.ExcludedScenarioIds.has(id)
            : state.SelectedScenarioIds.has(id);
    };

    const toggleScenarioRow = (row: ScenarioItem, _index: number, checked: boolean) => {
        const id = getScenarioId(row);
        if (id == null) {
            console.warn("toggleScenarioRow: row has no stable ID", row);
            return;
        }

        let nextSelected = state.SelectedScenarioIds;
        let nextExcluded = state.ExcludedScenarioIds;

        if (state.SelectAllAcrossResults) {
            nextExcluded = new Set(state.ExcludedScenarioIds);
            if (checked) nextExcluded.delete(id);
            else nextExcluded.add(id);
        } else {
            nextSelected = new Set(state.SelectedScenarioIds);
            if (checked) nextSelected.add(id);
            else nextSelected.delete(id);
        }

        const nextScenariosList = state.ScenariosList.map((r) => {
            const rid = getScenarioId(r);
            const selected = state.SelectAllAcrossResults
                ? !nextExcluded.has(rid)
                : nextSelected.has(rid);

            return selected === r.GenerateMTCFlag ? r : { ...r, GenerateMTCFlag: selected };
        });

        setState({
            SelectedScenarioIds: nextSelected,
            ExcludedScenarioIds: nextExcluded,
            ScenariosList: nextScenariosList,
        });
    };

    const selectAllScenariosAcrossResults = () => {
        setState({
            SelectAllAcrossResults: true,
            SelectedScenarioIds: new Set<string>(),
            ExcludedScenarioIds: new Set<string>(),
            ScenariosList: state.ScenariosList.map(r => ({ ...r, GenerateMTCFlag: true })),
        });
    };

    const clearScenarioSelection = () => {
        setState({
            SelectAllAcrossResults: false,
            SelectedScenarioIds: new Set<string>(),
            ExcludedScenarioIds: new Set<string>(),
            ScenariosList: state.ScenariosList.map(r => ({ ...r, GenerateMTCFlag: false })),
        });
    };

    const handleSubmitTestCase = async () => {
        if (!validateTestCaseForm()) {
            return;
        }
        setState({ openEditTestCaseModal: false });
        const resp: any = await apiRequest("/AddUpdateProjectSprintSessionDocumentTestCases", state.CurrAddEditTestCaseObj as any);
        if (resp) {
            getTestCasesList("", state.CurrScenario as ScenarioItem, state.TestCaseCurrentPage ?? 1);
        }
    };

    const handleTestCaseSearch = (value: string) => {
        setState({ TestCaseSearchQuery: value });
        if (value.trim() === "") {
            getTestCasesList("", state.CurrScenario as ScenarioItem, state.TestCaseCurrentPage ?? 1, false, state.CurrentTestCaseVersionType);
        }
    };

    const handleSearch = (value: string) => {
        setState({ SearchQuery: value });
        if (value.trim() === "") {
            getData("", state.ScenarioFilterObj.FlagType, 1);
        }
    };

    const handlePageChange = (page: number) => {
        setState({ CurrentPage: page });
        getData(state.SearchQuery, state.ScenarioFilterObj.FlagType, page);
    };

    const handleTestCasePageChange = (page: number) => {
        setState({ TestCaseCurrentPage: page });
        getTestCasesList("", state.CurrScenario as ScenarioItem, page, false, state.CurrentTestCaseVersionType);
    };

    const options = [
        { key: "Test Scenarios", label: "Test Scenarios", icon: <Layers size={15} /> },
        { key: "BRD Summary", label: "BRD Summary", icon: <Code2 size={15} /> },
    ] as const;

    const options2 = [
        { key: "Generate Test Case", label: "Generate Test Case", icon: <Layers size={15} /> },
        { key: "Test Cases", label: "Test Cases", icon: <Code2 size={15} /> },
    ] as const;

    const TC_Tabs = [
        { key: "Test Steps", label: "Test Steps", icon: <FaListCheck size={15} /> },
        { key: "Test Steps AI", label: "Test Steps AI", icon: <FaListCheck size={15} /> },
        { key: "Test Dataset", label: "Test Dataset", icon: <Layers size={15} /> },
    ]


















    const didFetchData1 = useRef<boolean>(false);
    useEffect(() => {
        if (didFetchData1.current) return;
        didFetchData1.current = true;

        const init = async () => {
            setState({ IsLoading: true });

            await Promise.all([
                getTestCasesList(),
                getTestStepsHeaderList(),
            ]);

            setState({ IsLoading: false });
        };

        init();
    }, []);

    useEffect(() => {
        if (state.TestStepsHeaderList.length > 0 && !state.SelectedTestStepsHeader) {
            const firstOption = state.TestStepsHeaderList[0].value;
            handleTestStepsHeaderChange(firstOption);
        }
    }, [state.TestStepsHeaderList]);

    const handleUpdateAssignedSteps = (updatedSteps: any[]) => {
        setState({ AssignedTestCaseSteps: updatedSteps });
    };


    const getTestStepsHeaderList = async (transactionCode: string = ""): Promise<void> => {
        try {
            const reqObj: any = {};
            if (transactionCode) {
                reqObj.TransactionCode = transactionCode;
            }

            const resp: any = await apiRequest("/fetchRecordsFromTestStepsHeaderDropdown", reqObj);

            if (resp.ResponseData && resp.ResponseData.length > 0) {
                const formattedList = resp.ResponseData.map((item: any) => ({
                    ...item,
                }));

                setState({ TestStepsHeaderList: formattedList });
            } else {
                setState({ TestStepsHeaderList: [] });
            }
        } catch (err) {
            console.error("Error loading Test Steps Header:", err);
            setState({ TestStepsHeaderList: [] });
        }
    };

   ;

    const getAvailableTestStepsByHeader = async (testStepsId: string): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetTestStepsWithDetailsPaginationFilterByTcode", {
                TestStepsId: testStepsId,
                TestCaseId: (state.CurrTestCase as any)?.TestCaseId
            });

            if (resp.ResponseData && resp.ResponseData.length > 0) {
                const firstItem = resp.ResponseData[0];
                const testStepsDetails = firstItem.TestStepsDetails || [];

                setState({
                    AvailableTestSteps: testStepsDetails,
                    SelectedTestStepsIds: []
                });
            } else {
                setState({
                    AvailableTestSteps: [],
                    SelectedTestStepsIds: []
                });
            }
        } catch (err) {
            console.error("Error loading available test steps:", err);
            setState({
                AvailableTestSteps: [],
                SelectedTestStepsIds: []
            });
        }
    };

    const handleTestStepsHeaderChange = (value: string): void => {
        if (!value || value === 'undefined' || value.trim() === '') {
            setState({
                SelectedTestStepsHeader: "",
                AvailableTestSteps: [],
                SelectedTestStepsIds: []
            });
            return;
        }

        setState({ SelectedTestStepsHeader: value });
        getAvailableTestStepsByHeader(value);
    };

    const handleTestStepSelection = (testStepId: string): void => {
        const currentSelected = [...state.SelectedTestStepsIds];
        const index = currentSelected.indexOf(testStepId);

        if (index > -1) {
            currentSelected.splice(index, 1);
        } else {
            currentSelected.push(testStepId);
        }

        setState({ SelectedTestStepsIds: currentSelected });
    };

    const handleSelectAllTestSteps = (checked: boolean): void => {
        if (checked) {
            const allIds = state.AvailableTestSteps.map((step: any) => step.TestStepDetailId);
            setState({ SelectedTestStepsIds: allIds });
        } else {
            setState({ SelectedTestStepsIds: [] });
        }
    };

    const handleAssignTestSteps = async (): Promise<void> => {
        if (state.SelectedTestStepsIds.length === 0) {
            setState({
                showToast: true,
                toastMessage: "Please select at least one test step to assign"
            });
            return;
        }

        setState({ SavingLoader: true });

        try {
            const testCaseId = (state.CurrTestCase as any).TestCaseId;

            const selectedHeader = state.TestStepsHeaderList.find(
                (h: any) => h.value === state.SelectedTestStepsHeader
            );

            const testCaseStepsData = state.SelectedTestStepsIds
                .map(testStepId => {
                    const testStep = state.AvailableTestSteps.find(
                        (step: any) => step.TestStepDetailId === testStepId
                    );

                    if (!testStep) return null;

                    return {
                        TestCaseId: testCaseId,
                        TestStepsId: state.SelectedTestStepsHeader,
                        StepNo: testStep.StepNo || 0,
                        TestLevel: selectedHeader?.TestLevel || "",
                        Description: testStep.Description || "",
                        ExpectedResult: testStep.ExpectedResult || "",
                        ComponentType: testStep.ComponentType || "",
                        Component: testStep.Component || "",
                        Data: testStep.Data || "{}",
                        ResponseData: "",
                        Status: 1,
                        CreatedBy: "CurrentUser"
                    };
                })
                .filter(Boolean);

            if (testCaseStepsData.length === 0) {
                setState({
                    SavingLoader: false,
                    showToast: true,
                    toastMessage: "No valid test steps found to assign"
                });
                return;
            }

            const response = await apiRequest("/AddUpdateTestCaseStepResult", {
                testCaseSteps: testCaseStepsData
            });

            if (response && response.insertedCount > 0) {
                const testCaseResultData = {
                    TestCaseId: testCaseId,
                    TestStepsId: state.SelectedTestStepsHeader,
                    TestLevel: selectedHeader?.TestLevel || "",
                    Description: selectedHeader?.label || "",
                    Result: "none",
                    Status: 1,
                    CreatedBy: "CurrentUser"
                };

                await apiRequest("/AddUpdateTestCaseStep", testCaseResultData);
            }

            await getAssignedTestCaseSteps(testCaseId, "");

            setState({
                SelectedTestStepsIds: [],
                AvailableTestSteps: [],
                SavingLoader: false,
                CurrentTCModalToggle: "Assigned TestCaseSteps",
                showToast: true,
                toastMessage: `Successfully assigned ${testCaseStepsData.length} test steps!`
            });

        } catch (err) {
            console.error("Error assigning test steps:", err);
            setState({
                SavingLoader: false,
                showToast: true,
                toastMessage: "Error assigning test steps. Please try again."
            });
        }
    };

    const getAssignedTestCaseSteps = async (
        testCaseId: string,
        testStepsId: string = "",
    ): Promise<void> => {
        try {
            const reqObj: any = {
                TestCaseId: testCaseId,
                PageNo: 1,
                SearchString: "",
            };

            if (testStepsId) reqObj.TestStepsId = testStepsId;

            const resp: any = await apiRequest("/GetTestCaseStepsResultsByTestCaseId", reqObj);

            if (resp?.ResponseData?.length > 0) {
                setState({ AssignedTestCaseSteps: resp.ResponseData });
            } else {
                setState({ AssignedTestCaseSteps: [] });
            }
        } catch (err) {
            console.error("Error loading assigned test case steps:", err);
            setState({ AssignedTestCaseSteps: [] });
        }
    };

    const handleAssignedTestStepsFilterChange = (value: string): void => {
        setState({ AssignedTestStepsFilter: value });

        const testCaseId = (state.CurrTestCase as any).TestCaseId;
        getAssignedTestCaseSteps(testCaseId, value);
    };

    const handleCurrentTestCase = (item: any): void => {
        setState({
            openTestCaseModal: true,
            CurrTestCase: item,
            CurrentTCModalToggle: "Test Steps",
            SelectedTestStepsHeader: "",
            AssignedTestStepsFilter: "",
            AvailableTestSteps: [],
            SelectedTestStepsIds: []
        });

        GetTestStepsByTCODE(item);
        getAssignedTestCaseSteps(item.TestCaseId, "");
        getTestStepsHeaderList(item.TransactionCode || "");
    };

    const handleTabChange = async (key: string): Promise<void> => {
        setState({ CurrentTCModalToggle: key });

        const testCaseId = (state.CurrTestCase as any).TestCaseId;

        if (key === "Test Steps") {
            await getAvailableTestStepsByHeader(state.SelectedTestStepsHeader);
        } else if (key === "Assigned TestCaseSteps") {
            await getAssignedTestCaseSteps(testCaseId, state.AssignedTestStepsFilter);
        }
    };

    const handleExecuteSteps = async () => {
        setState({ ExecutingSteps: true });

        let AssignedTestCaseSteps = state.AssignedTestCaseSteps;

        // Prepare records for validation
        const recordsToValidate = AssignedTestCaseSteps.flatMap((v) => {
            if (v.TestCaseStepsResults && v.TestCaseStepsResults.length > 0) {
                return v.TestCaseStepsResults.map((result) => ({
                    TestCaseId: result.TestCaseId,
                    TestStepsId: result.TestStepsId,
                    StepNo: result.StepNo
                }));
            }
            return [];
        });

        console.log("Records to validate:", recordsToValidate); // DEBUG

        try {
            // Validate all steps before execution
            const validationResponse = await apiRequest("/ValidateMultipleTestCaseStepsResults", {
                records: recordsToValidate
            });

            console.log("Full validation response:", validationResponse); // DEBUG

            const validation = validationResponse?.validateMultipleTestCaseStepsResults;
            console.log("Validation object:", validation); // DEBUG

            // Check if validation request failed
            if (!validation || validation.status === 'fail') {
                console.log("Validation request failed"); // DEBUG
                setState({
                    ExecutingSteps: false,
                    showToast: true,
                    toastMessage: "Validation failed. Unable to validate test case steps."
                });
                return;
            }

            // console.log("validation.isValid:", validation.isValid); // DEBUG
            // console.log("validation.invalidData:", validation.invalidData); // DEBUG

            // Check if validation found invalid steps
            if (!validation.isValid) {
                // console.log("Setting modal to show with errors:", validation.invalidData);

                // Set state with all updates at once
                setState({
                    ExecutingSteps: false,
                    showValidationModal: true,
                    validationErrors: validation.invalidData || []
                }, () => {
                    // Callback after state update (if your setState supports it)
                    console.log("State updated successfully");
                });

                return;
            }

            // Validation passed - proceed with execution
            // console.log(`All ${validation.totalRecords} steps validated successfully`);
            /* console.log("Modal render check:", {
                showValidationModal: state.showValidationModal,
                validationErrorsLength: state.validationErrors?.length
            }); */

            // Prepare step data for execution
            AssignedTestCaseSteps.map((v, i) => {
                if (v.TestCaseStepsResults.length > 0) {
                    v.StepNo = v.TestCaseStepsResults[0].StepNo;
                    v.Description = v.TestCaseStepsResults[0].DetailDescription;
                    v.TestStepDetailId = v.TestCaseStepsResults[0].TestStepDetailId;
                    if ((v.TestCaseStepsResults[0].component) && v.TestCaseStepsResults[0].hasOwnProperty('component')) {
                        v.ApiDetails = v.TestCaseStepsResults[0].component.ApiDetails;
                    }
                    if ( v.TestCaseStepsResults[0].hasOwnProperty('ComponentTypeInfo')) {
                        v.ComponentType = v.TestCaseStepsResults[0].ComponentTypeInfo.ComponentTypeName;
                    }
                    v.ComponentKeyMapping = v.TestCaseStepsResults[0].ComponentKeyMapping;
                }
            });

            // Execute the validated steps
            const resp = await apiRequest("/TestStepsValidation", {
                StepsData: AssignedTestCaseSteps
            });

            setState({
                showToast: true,
                toastMessage: `Test steps executed successfully!`
            });

            // Refresh the data
            await getAssignedTestCaseSteps(state.CurrTestCase.TestCaseId, state.AssignedTestStepsFilter);

        } catch (err) {
            console.error("Error executing test steps:", err);
            setState({
                showToast: true,
                toastMessage: "Error executing test steps. Please try again."
            });
        } finally {
            setState({ ExecutingSteps: false });
        }
    };


    /* const handleShowApiDetails = (component: any): void => {
        if (component && component.ApiDetails) {
            const apiDetails: ApiDetails = {
                ApiId: component.ApiDetails.ApiId || "",
                ServiceName: component.ApiDetails.ServiceName || "",
                ApiMethod: component.ApiDetails.ApiMethod || "",
                EndPoint: component.ApiDetails.EndPoint || "",
                Version: component.ApiDetails.Version || "",
                RequestSchema: component.ApiDetails.RequestSchema || null,
                Headers: component.ApiDetails.Headers || null,
                ResponseData: component.ApiDetails.ResponseData || null,
                ApiNotes: component.ApiDetails.Notes || "",
            };
            setState({
                currentApiDetails: apiDetails,
                isApiDetailsModalOpen: true,
            });
        }
    }; */


    const handleShowApiDetails = (component: any): void => {
        console.log("componentcomponentcomponent",component.Data)
        if (component) {
            if (component.ComponentType !=="Validation"){
                setState({ currentApiDetails: component, isApiDetailsModalOpen: true });
            }else{
                setState({ currentApiDetails: component.Data.data[0], ValidationComponentModalOpen: true });
            }

        }
    };


    const handleDeleteAssignedStepItem = async (payload: DeleteStepPayload): Promise<void> => {
        try {
            setState({ deletingId: payload.TestCaseResultId });

            const resp: any = await apiRequest("/DeleteTestCaseStepResult", payload);

            if (resp?.deleteTestCaseStepResult?.affectedRows > 0) {
                await getAssignedTestCaseSteps(
                    payload.TestCaseId,
                    state.AssignedTestStepsFilter || payload.TestStepsId,
                );

                setState({
                    showToast: true,
                    toastMessage: "Test step deleted successfully",
                    deletingId: null
                });
                setTimeout(() => setState({ showToast: false }), 3000);
            } else {
                setState({ deletingId: null });
            }
        } catch (e) {
            console.error("Delete failed", e);
            setState({ deletingId: null });
        }
    };





















    const getFileName = (path?: string) => {
        if (!path) return "No File";
        const parts = path.split("/");
        const fileName = parts[parts.length - 1];
        const cleaned = fileName.replace(/^(\d+-?)+/, "");
        return cleaned.trim();
    };
    const getFileURL = (path?: string) => {
        if (!path) return "";
        return path.replace("/var", "");
    };

    const IdExtracter = (id: string, Prefix: string) => {
        const match = id.split("-");
        if (match) {
            const number = match[1];
            const result = `${Prefix}-${number}`;
            return result;
        } else return id;
    };

    const fileName = props.CurrentSession.DocumentName;
    const url = fileName?.includes("AIT-")
        ? `${props.CurrJIRAConfig?.BaseURL || ""}/browse/AIT-1`
        : `${HostConfig.LLMHost}${getFileURL(props.CurrentSession.InputFileURL)}`;

    const TestScenariosData = state.ScenariosList.map((v, i) => ({
        TestScenarioId: IdExtracter(v.TestScenarioId, "TS"),
        Priority: v.Priority,
        AcceptanceCriteria: v.AcceptanceCriteria,
        Description: v.Description,
        SectionTitle: v.SectionTitle,
        SectionContent: v.SectionContent,
        TestScenarioName: (
            <div className="relative  flex items-center justify-between"  >
                <Tooltip className="bg-white text-gray-900 shadow-lg" title="" content={<div><p>Click here to view Test Cases</p></div>} placement="right">
                    <p className="hover:font-semibold cursor-pointer hover:text-blue-600 hover:underline" onClick={() => handleViewScenarioDetails(v)}> {v.TestScenarioName}{" "}</p>
                </Tooltip>
                <span onClick={() => handleCurrentScenario(v)} className="text-blue-700 ml-2 cursor-pointer">
          <Info size={22} />
        </span>
            </div>
        ),
        TransactionCode: (
            <div>
                <DropdownV2
                    mode="single"
                    size={"small"}
                    options={v.TransactionList as any}
                    value={v.TransactionCode as any}
                    onChange={(val: string, item: any) => handleDropdownTSTransaction(val, item, i)}
                    onSearch={(q: string) => console.log("Search (Multi):", q)}
                />
            </div>
        ),
        TestingLevel: (
            <div>
                <DropdownV2
                    mode="single"
                    size={"small"}
                    searchable={false}
                    options={[
                        { label: "Unit", value: "Unit" },
                        { label: "Integration", value: "Integration" },
                        { label: "System Integration", value: "System Integration" },
                        { label: "UAT", value: "UAT" },
                    ]}
                    value={v.TestingLevel as any}
                    onChange={(val: string, item: any) => handleDropdownTSTestingLevel(val, item, i)}
                    onSearch={(q: string) => console.log("Search (Multi):", q)}
                />
            </div>
        ),
        FlagStatus: (
            <div>
                <label className="custom-checkbox cursor-pointer">
                    <input
                        type="checkbox"
                        checked={!!(v?.FlagStatus && v?.FlagStatus === "Yes")}
                        onChange={(e) => handleUpdateFlagTypeTestScenario(e, i)}
                    />
                    <span className="checkmark" />
                </label>
            </div>
        ),
        GenerateMTCFlag: (
            <div>
                <label className="custom-checkbox cursor-pointer">
                    <input
                        disabled={!!(v?.FlagStatus && v?.FlagStatus === "Yes")}
                        type="checkbox"
                        checked={isSelectedScenario(v)}
                        onChange={(e) => toggleScenarioRow(v, i, e.target.checked)}
                    />
                    <span className={`${v?.FlagStatus && v?.FlagStatus === "Yes" ? '!bg-gray-200 cursor-not-allowed' : ''} checkmark`} />
                </label>
            </div>
        ),

        BusinessLogic: v.BusinessLogic,
        actions: (
            <div className="relative flex items-center">
                <button
                    onClick={() => handleViewScenarioDetails(v)}
                    className=" text-nowrap  cursor-pointer text-gray-800 hover:underline px-3 py-1 rounded text-sm"
                >
                    Test Cases
                </button>
            </div>
        ),
    }));

    const selectAllRef = useRef<HTMLInputElement | null>(null);
    const pageSelectedCount = state.ScenariosList.filter(s => isSelectedScenario(s)).length;
    const allOnPage = state.ScenariosList.length > 0 && pageSelectedCount === state.ScenariosList.length;
    const someOnPage = pageSelectedCount > 0 && !allOnPage;

    const selectedCount = state.SelectAllAcrossResults
        ? (state.TotalRecords - state.ExcludedScenarioIds.size)
        : state.SelectedScenarioIds.size;

    useEffect(() => {
        if (selectAllRef.current) {
            (selectAllRef.current as any).indeterminate = !state.SelectAllAcrossResults && someOnPage;
        }
    }, [state.SelectAllAcrossResults, someOnPage, state.ScenariosList]);

    const TestScenarioColumns = [
        state.ScenarioFilterObj.FlagType === "Yes"
            ? ""
            : {
                key: "GenerateMTCFlag",
                header: (
                    <div className="flex items-center">
                        <label className="custom-checkbox items-center h-[20px] cursor-pointer ">
                            <input
                                ref={selectAllRef}
                                type="checkbox"
                                checked={state.SelectAllAcrossResults || allOnPage}
                                onChange={(e) => handleSelectAllGenerateMTC(e)}
                            />
                            <span className="checkmark" />
                        </label>
                        <p className="pl-1.5"></p>
                {/*        {selectedCount > 0 && (*/}
                {/*            <span className="ml-2 text-xs">*/}
                {/*  {state.SelectAllAcrossResults ? `Selected all (${selectedCount})` : `Selected (${selectedCount})`}*/}
                {/*</span>*/}
                {/*        )}*/}
                {/*        {!state.SelectAllAcrossResults && allOnPage && state.TotalRecords > state.ScenariosList.length && (*/}
                {/*            <button onClick={selectAllScenariosAcrossResults} className="ml-2 text-xs text-blue-700 underline">*/}
                {/*                Select all {state.TotalRecords} results*/}
                {/*            </button>*/}
                {/*        )}*/}
                {/*        {(state.SelectAllAcrossResults || someOnPage) && (*/}
                {/*            <button onClick={clearScenarioSelection} className="ml-2 text-xs text-gray-700 underline">Clear</button>*/}
                {/*        )}*/}
                    </div>
                ),
                sortable: false,
                filterable: false,
                TruncateData: false,
                colWidth: "4rem",
                truncateAt: 20,
                align: "",
            },
        {
            key: "TestScenarioId",
            header: "#ID",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "8rem",
        },
        {
            key: "TestScenarioName",
            header: "Test Scenario ",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "20rem",
            truncateAt: 20,
        },
        {
            key: "Description",
            header: "Description",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "20rem",
            truncateAt: 20,
        },
        {
            key: "BusinessLogic",
            header: "Business Logic",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "20rem",
            truncateAt: 20,
        },

        {
            key: "AcceptanceCriteria",
            header: "Acceptance Criteria",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "20rem",
            truncateAt: 20,
        },
        {
            key: "SectionTitle",
            header: "Section",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "15rem",
            truncateAt: 20,
        },
        {
            key: "TransactionCode",
            header: "Transaction",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "14rem",
            truncateAt: 20,
        },
        {
            key: "TestingLevel",
            header: "Test Level",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "12rem",
            truncateAt: 20,
        },

        {
            key: "actions",
            colWidth: "10rem",
            header: "Action",
            render: (_: unknown, row: any) => (
                <div className="flex items-center justify-end gap-4">
                    <button
                        className="text-[#1A1A1A] font-medium hover:underline "
                        onClick={() => handleViewScenarioDetails(row)}
                    >
                        Test Cases
                    </button>
                    <button
                        className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Delete"
                        onClick={() => alert(`Delete ${row.source}`)}
                    >
                        <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current">
                            <path d="M6 7v9h8V7H6zm8-2h-3l-1-1H8L7 5H4v2h12V5h-2z" />
                        </svg>
                    </button>
                </div>
            ),
        },
    ] as const;

    const TestCasesLisData = state.TestCasesList.map((v) => ({
        TestCaseId: IdExtracter(v.TestCaseId, "TC"),
        TestCase: (
            <div className="relative flex items-center">
                {v.TestCase}{" "}
                <span onClick={() => handleCurrentTestCase(v)} className="text-blue-700 ml-2 cursor-pointer">
          <Info size={22} />
        </span>
            </div>
        ),
        PreConditions: v.PreConditions,

        ExpectedResult: v.ExpectedResult,
        Priority: v.Priority,
        CreatedDate: toLocalTime(v.CreatedDate, 'DD/MM/YYYY - hh:mm A'),
        TestType: v.TestType,
        FlagStatus: (
            <div className="flex items-center">
                <div>
                    <label className="custom-checkbox cursor-pointer">
                        <input
                            type="checkbox"
                            checked={!!(v?.FlagStatus && v?.FlagStatus === "Yes")}
                            onClick={(e) => handleUpdateFlagTypeTestCase(e, state.TestCasesList.findIndex(tc => tc === v))}
                        />
                        <span className="checkmark" />
                    </label>
                </div>
            </div>
        ),
        actions: (
            <div className="relative cursor-pointer flex items-center">
                <div className="" onClick={() => handleEditTestCase(v as any)}>
                    <Edit size={19} className="text-sky-600" />
                </div>
            </div>
        ),
    }));

    const TestCasecolumns = [
        {
            key: "TestCaseId",
            header: "#ID",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "11%",
        },
        {
            key: "TestCase",
            header: "Test Case",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "24%",
            truncateAt: 20,
        },
        {
            key: "PreConditions",
            header: "Pre Conditions",
            sortable: false,
            filterable: false,
            colWidth: "18%",
        },
        {
            key: "ExpectedResult",
            header: "Expected Result",
            TruncateData: false,
            sortable: false,
            colWidth: "16%",
        },
        {
            key: "Priority",
            header: "Priority",
            TruncateData: false,
            sortable: true,
            colWidth: "8%",
        },
        {
            key: "FlagStatus",
            header: "Invalid Flag",
            sortable: false,
            colWidth: "10%",
        },
        {
            key: "CreatedDate",
            header: "Date",
            TruncateData: false,
            sortable: false,
            colWidth: "10%",
        },
        {
            key: "actions",
            colWidth: "10%",
            header: "Action",
        },
    ] as const;



let stepDetailsData=state.TestStepsList.length>0?state.TestStepsList[0].TestStepsDetails:[]
    const TestStepsData = stepDetailsData.map((v) => ({
        StepNo: v.StepNo,
        ExpectedResult: v.ExpectedResult,
        Description: v.Description,
    }));

    const rawSteps = (state.CurrTestCase as any).TestSteps;

    const TestStepsDataAI = Array.isArray(rawSteps)
        ? rawSteps.map((v: any, i: number) => {
            if (typeof v === "string") {
                // Plain string array case
                return {
                    StepNo: i + 1,
                    Description: v,
                    ExpectedResult: "-",
                };
            } else if (typeof v === "object" && v !== null) {
                // Object array case
                return {
                    StepNo: v.StepNo ?? i + 1,
                    ExpectedResult: v.ExpectedResult ?? JSON.stringify(v.ExpectedResult),
                    Description: v.StepDescription ?? JSON.stringify(v.StepDescription),
                };
            } else {
                // Unexpected case fallback
                return {
                    StepNo: i + 1,
                    ExpectedResult: "-",
                    Description: String(v),
                };
            }
        })
        : [];



    const TestStepsColums = [
        {
            key: "StepNo",
            header: "Step No",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "5%",
        },
        {
            key: "Description",
            header: "Description",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "24%",
            truncateAt: 20,
        },
        {
            key: "ExpectedResult",
            header: "Expected Result",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "24%",
            truncateAt: 20,
        },

    ]


    const TestStepsColumsAI = [
        {
            key: "StepNo",
            header: "Step No",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "5%",
        },
        {
            key: "Description",
            header: "Description",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "24%",
            truncateAt: 20,
        },
        {
            key: "ExpectedResult",
            header: "ExpectedResult",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "24%",
            truncateAt: 20,
        },

    ]


    console.log("diuasdushdsdiasdh", state.CurrTestCase);

    return (
        <div className="w-full relative">
            <div>

                {state.ValidationComponentModalOpen&& <div className="z-[1009]">
                    <ValidationReport data={state.currentApiDetails} isOpen={state.ValidationComponentModalOpen} onClose={function (): void {
                        setState({ValidationComponentModalOpen:false})
                    } } />
                </div>}


                <PostmanViewerModal
                    isOpen={state.isApiDetailsModalOpen}
                    onClose={() => setState({ isApiDetailsModalOpen: false, currentApiDetails: null })}
                    data={state.currentApiDetails}
                    title="Execution Report"
                />

                <TestCaseDetailsModal
                    isOpen={state.openTestCaseModal}
                    onClose={() => setState({ openTestCaseModal: false })}
                    testCase={state.CurrTestCase}
                    currentTab={state.CurrentTCModalToggle}
                    onTabChange={handleTabChange}
                    testStepsHeaderList={state.TestStepsHeaderList}
                    selectedTestStepsHeader={state.SelectedTestStepsHeader}
                    onTestStepsHeaderChange={handleTestStepsHeaderChange}
                    availableTestSteps={state.AvailableTestSteps}
                    selectedTestStepsIds={state.SelectedTestStepsIds}
                    onTestStepSelection={handleTestStepSelection}
                    onSelectAllTestSteps={handleSelectAllTestSteps}
                    onAssignTestSteps={handleAssignTestSteps}
                    savingLoader={state.SavingLoader}
                    assignedTestCaseSteps={state.AssignedTestCaseSteps}
                    assignedTestStepsFilter={state.AssignedTestStepsFilter}
                    onAssignedTestStepsFilterChange={handleAssignedTestStepsFilterChange}
                    onExecuteSteps={handleExecuteSteps}
                    executingSteps={state.ExecutingSteps}
                    onDeleteAssignedStep={handleDeleteAssignedStepItem}
                    deletingId={state.deletingId}
                    onShowApiDetails={handleShowApiDetails}
                    onUpdateAssignedSteps={handleUpdateAssignedSteps}
                />

                <CustomModal
                    width="max-w-6xl"
                    modalZIndex={1001}
                    isOpen={state.openEditTestCaseModal}
                    onClose={() => setState({ openEditTestCaseModal: false })}
                    title={<div className="text-lg">Edit Test Case </div>}
                    footerContent={[
                        <button
                            key="close"
                            onClick={() => setState({ openEditTestCaseModal: false })}
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
                                    <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                        Test Case
                                        <span className="text-red-500">*</span>
                                    </label>
                                </div>
                                <div className="relative">
                  <textarea
                      onChange={(e) => handleChangeTestCase(e, "SprintName" as any)}
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
                                    <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                        Pre Conditions
                                    </label>
                                </div>
                                <div className="relative">
                  <textarea
                      onChange={(e) => handleChangeTestCase(e, "PreConditions")}
                      value={state.CurrAddEditTestCaseObj.PreConditions}
                      id="preconditions"
                      name="preconditions"
                      rows={3}
                      maxLength={2000}
                      placeholder="Pre Conditions"
                      className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8]   resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                  ></textarea>
                                </div>
                            </div>

                            <div className=" ">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                        Expected Result
                                        <span className="text-red-500">*</span>
                                    </label>
                                </div>
                                <div className="relative">
                  <textarea
                      onChange={(e) => handleChangeTestCase(e, "ExpectedResult")}
                      value={state.CurrAddEditTestCaseObj.ExpectedResult}
                      id="expected"
                      name="expected"
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
                                    <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">Test Type</label>
                                </div>
                                <div className="relative">
                                    <input
                                        onChange={(e) => handleChangeTestCase(e, "TestType")}
                                        value={state.CurrAddEditTestCaseObj.TestType}
                                        placeholder="TestType"
                                        className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8]   resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    />
                                </div>
                            </div>

                            <div className=" ">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                        Priority
                                    </label>
                                </div>
                                <div className="relative">
                                    <input
                                        onChange={(e) => handleChangeTestCase(e, "Priority")}
                                        value={state.CurrAddEditTestCaseObj.Priority}
                                        placeholder="TestType"
                                        className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8]   resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    />
                                </div>
                            </div>

                            <div className=" ">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                        Comments
                                    </label>
                                </div>
                                <div className="relative">
                  <textarea
                      onChange={(e) => handleChangeTestCase(e, "Comments" as any)}
                      value={(state.CurrAddEditTestCaseObj as any).Comments || ""}
                      id="comments"
                      name="comments"
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

                <CustomModal
                    modalZIndex={1005}
                    width="max-w-6xl"
                    isOpen={state.openModal3}
                    onClose={() => setState({ openModal3: false })}
                    title={
                        <div className="text-lg">
                            Test Scenario: <span className="text-base font-normal text-gray-700">{(state.CurrScenario as any).TestScenarioName}</span>
                        </div>
                    }
                    footerContent={[
                        <button
                            key="close"
                            onClick={() => setState({ openModal3: false })}
                            className="mt-2 cursor-pointer px-5 py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg"
                        >
                            Close
                        </button>,
                    ]}
                >
                    <div className="space-y-5  flex flex-col">
                        <div className="overflow-x-auto ">
                            <div>
                                <p className="font-semibold text-lg">Boundary Values</p>
                            </div>
                            <table className="min-w-full border border-gray-200 rounded-md pt-3">
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
                                {state.EqClassesBaundaryValues.map((item, id) => {
                                    return (
                                        <tr className="border-t border-gray-200 " key={id}>
                                            <td className="p-3">{item.LowerLimit as any}</td>
                                            <td className="p-3">{item.LwLimitBVN as any}</td>
                                            <td className="p-3">{item.LwLimitBVP as any}</td>
                                            <td className="p-3">{item.UpperLimit as any}</td>
                                            <td className="p-3">{item.UPLimitBVN as any}</td>
                                            <td className="p-3">{item.UPLimitBVP as any}</td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </CustomModal>

                <CustomModal
                    width="max-w-8xl"
                    isOpen={state.openModal}
                    onClose={() => setState({ openModal: false })}
                    title={
                        <div className="flex items-center justify-between">
                            <p className="text-lg">
                                Scenario: <span className="text-base font-normal text-gray-700">{(state.CurrScenario as any).TestScenarioName}</span>
                            </p>
                        </div>
                    }
                    footerContent={[
                        <button
                            key="close"
                            onClick={() => setState({ openModal: false })}
                            className=" cursor-pointer py-2 px-3 bg-white font-semibold text-[#5700D1] border border-[#5700D1] text-sm rounded-lg"
                        >
                            Close
                        </button>,
                        state.CurrentModalToggle === "Generate Test Case" ? (
                            <button
                                key="gen"
                                onClick={handleGenerateTestCase}
                                className="bg-[#0071E9] text-nowrap font-semibold  hover:bg-[#005ABA]  cursor-pointer text-white  py-2 px-3 rounded-lg flex items-center space-x-2"
                            >
                                <HugeiconsIcon size={19} icon={SparklesIcon} />
                                <span>Generate Test Cases </span>
                            </button>
                        ) : (
                            ""
                        ),
                    ]}
                >
                    <div className="space-y-5 h-full w-full flex flex-col">
                        <div className="flex  w-full justify-between items-center">
                            <div className="">
                                <ToggleButtonGroupV3
                                    variant="underline"
                                    animationFlag={false}
                                    initialKey={state.CurrentModalToggle}
                                    items={options2 as any}
                                    onChange={(key: "Generate Test Case" | "Test Cases") => {
                                        console.log("key", key);
                                        setState({ CurrentModalToggle: key });
                                        getTestCasesList("", state.CurrScenario as ScenarioItem, 1, false, state.CurrentTestCaseVersionType);
                                    }}
                                />
                            </div>

                            <div className={state.CurrentModalToggle !== "Generate Test Case" ? `w-` : ''}>
                                {state.CurrentModalToggle !== "Generate Test Case" ? (
                                    <div className="flex gap-10">
                                        <div className="flex font-medium ml-6 items-center text-sky-700">
                                            <PiExport size={19} />
                                            <p
                                                className="text-sky-700 cursor-pointer ml-1 m-0"
                                                onClick={() => FileDownloader("/ExportTestCasesByTestScenarioToExcel", state.CurrScenario)}
                                            >
                                                Export
                                            </p>
                                        </div>
                                        <div className="w-1/2">
                                            <SearchBar currentValue={state.TestCaseSearchQuery} onSearch={handleTestCaseSearch} size="medium" />
                                        </div>
                                        <div className="flex items-center w-80">
                                            <p className="flex text-sm font-medium items-center pr-4">Filter:</p>
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
                                                onChange={(val: VersionType, item: any) => handleFilterTestCaseByVersionType(val, item)}
                                            />
                                        </div>

                                        <div className="right-0">
                                            <p className="text-lg text-nowrap">
                                                Total Test Cases: <span className="font-bold pl-1">{!state.ShowLoader && state.TestCaseTotalRecords}</span>
                                            </p>
                                            <p className="text-sm font-semibold text-gray-600 text-nowrap">
                                                VersionId: <span className="text-gray-700 pl-1">{state.CurrentTCVersion}</span>
                                            </p>
                                        </div>
                                    </div>
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
                                            <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">Transactions</label>
                                            <Dropdown
                                                mode="multiple"
                                                options={state.TransactionsList as any}
                                                value={(state.TestConditionCriteria as any).TransactionId}
                                                onChange={(val: string, item: any, CurrItem: any) =>
                                                    handleDropdownTransaction(val, item, CurrItem, "TransactionId")
                                                }
                                                onSearch={(q: string) => console.log("Search (Multi):", q)}
                                            />
                                        </div>
                                        <div className="">
                                            <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                                Testing Technique <span className="text-red-500">*</span>
                                            </label>
                                            <Dropdown
                                                searchable={false}
                                                mode="single"
                                                options={state.TestingTechniquesList as any}
                                                value={(state.TestConditionCriteria as any).TestingTechniqueId}
                                                onChange={(val: string, item: any, CurrItem: any) =>
                                                    handleDropdownTransaction(val, item, CurrItem, "TestingTechniqueId")
                                                }
                                                onSearch={(q: string) => console.log("Search (Multi):", q)}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-8">
                                        {(state.TestConditionCriteria as any).Transactions.map((TcodeItem: any, id: number) => {
                                            return (
                                                <div className="mb-6" key={id}>
                                                    <Accordion title={`TCODE: ${TcodeItem.TransactionId}`} expandKey={TcodeItem.TransactionId}>
                                                        <div>
                                                            {TcodeItem.Tables.map((TableItem: any, id2: number) => {
                                                                return (
                                                                    <div className="mb-6" key={id2}>
                                                                        <div className="border border-gray-300 p-3">
                                                                            <div className="pb-1">
                                                                                <p className=" font-semibold text-gray-800">{`Table: ${TableItem.TableName}`}</p>
                                                                            </div>
                                                                            <div className="p-">
                                                                                <div className="overflow-x-auto">
                                                                                    <table className="min-w-full border border-gray-200 rounded-md">
                                                                                        <thead>
                                                                                        <tr className="bg-[#ebebeb] text-left">
                                                                                            <th className="p-1.5 text-sm font-medium text-gray-700">Field Name</th>
                                                                                            <th className="p-1.5 text-sm font-medium text-gray-700">Field Type</th>
                                                                                            <th className="p-1.5 text-sm font-medium text-gray-700">Field Value</th>
                                                                                            <th className="p-1.5 text-sm font-medium text-gray-700">Description</th>
                                                                                            <th className="p-1.5 text-sm font-medium text-gray-700">Boundary Values</th>
                                                                                        </tr>
                                                                                        </thead>
                                                                                        <tbody>
                                                                                        {TableItem.Fields.map((FieldItem: any, id3: number) => (
                                                                                            <tr key={id3} className="border-t border-gray-200 ">
                                                                                                <td className="p-1.5 text-sm">
                                                                                                    <p>{FieldItem.FieldName}</p>
                                                                                                </td>
                                                                                                <td className="p-1.5 text-sm">
                                                                                                    <p>{FieldItem.FieldType}</p>
                                                                                                </td>
                                                                                                <td className="p-1.5 text-sm">
                                                                                                    <input
                                                                                                        onChange={(e) => handleUpdateFieldValue(e, id2, id3, "FieldValue")}
                                                                                                        type="text"
                                                                                                        defaultValue={FieldItem.FieldValue}
                                                                                                        className="w-full p-2 rounded-md border border-gray-200 bg-gray-50 shadow-sm focus:outline-none"
                                                                                                    />
                                                                                                </td>
                                                                                                <td className="p-1.5 text-sm">
                                                                                                    <p>{FieldItem.Description}</p>
                                                                                                </td>
                                                                                                <td className="p-1.5 text-sm">
                                                                                                    <button
                                                                                                        onClick={() => handlCurrEQC(FieldItem)}
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
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
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
                                    <CustomTableData
                                        spinnerLabel="Generating Test Cases"
                                        showSpinnerFlag={state.ShowLoader}
                                        scrollHeightClass="h-[calc(100vh-364px)]"
                                        truncateCharLimit={40}
                                        data={TestCasesLisData}
                                        columns={TestCasecolumns as any}
                                        rowKey="id"
                                    />
                                    {!state.ShowLoader && state.TestCaseTotalRecords > 10 && (
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
                    onClose={() => setState({ openModal4: false })}
                    title={<div className="font-medium text-base">{(state.CurrScenario as any).TestScenarioName}</div>}
                    footerContent={[
                        <button
                            key="close"
                            onClick={() => setState({ openModal4: false })}
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
                                <td className="p-3 text-gray-800">{(state.CurrScenario as any).BusinessLogic}</td>
                            </tr>
                            <tr className="border-t border-gray-200">
                                <td className="p-3 font-medium text-gray-700 border-r border-gray-300">Acceptance Criteria:</td>
                                <td className="p-3 text-gray-800">{(state.CurrScenario as any).AcceptanceCriteria}</td>
                            </tr>
                            <tr className="border-t border-gray-200">
                                <td className="p-3 font-medium text-gray-700 border-r border-gray-300">Priority :</td>
                                <td className="p-3 text-gray-800">{(state.CurrScenario as any).Priority}</td>
                            </tr>

                            <tr className="border-t border-gray-200 bg-gray-50">
                                <td className="p-3 font-medium text-gray-700 border-r border-gray-300">Document Reference Mapping:</td>
                                <td className="p-3 text-gray-800">{(state.CurrScenario as any).DocTraceabilitySources}</td>
                            </tr>
                            <tr className="border-t border-gray-200">
                                <td className="p-3 font-medium text-gray-700 border-r border-gray-300">Business Process Mapping:</td>
                                <td className="p-3 text-gray-800">{(state.CurrScenario as any).ScenarioTraceabilitySources}</td>
                            </tr>
                            <tr className="border-t border-gray-200">
                                <td className="p-3 font-medium text-gray-700 border-r border-gray-300">Section Title :</td>
                                <td className="p-3 text-gray-800">{(state.CurrScenario as any).SectionTitle}</td>
                            </tr>
                            </tbody>
                        </table>

                        <div>
                            <p className="font-semibold pb-2 pl-2"> Related Transaction Codes:</p>
                            <div>
                                <div className="space-y-6">
                                    {Object.keys(state.CurrScenario).length > 0 &&
                                        (state.CurrScenario as any).RelatedTCodes &&
                                        (state.CurrScenario as any).RelatedTCodes.map((item: RelatedTCode, index: number) => {
                                            return (
                                                <div key={index} className="border border-gray-300 rounded-lg p-4 shadow-sm bg-white">
                                                    <h2 className="text-lg font-semibold text-blue-700">TCode: {item.TCode}</h2>
                                                    <p className="text-gray-700 mb-4">Description: {item.TCodeDescription}</p>

                                                    <div className="space-y-2">
                                                        {Object.prototype.hasOwnProperty.call(item, 'RelatedFields')
                                                            ? (item.RelatedFields || []).map((field: RelatedTCodeField, i: number) => (
                                                                <div key={i} className="border border-gray-200 rounded p-3 bg-gray-50">
                                                                    <p className="font-medium text-gray-800">Field Name: {field.FieldName}</p>
                                                                    <p className="text-gray-600">
                                                                        Possible Values:{" "}
                                                                        <span className="text-gray-800">{(field.PossibleDataValues || []).join(", ")}</span>
                                                                    </p>
                                                                </div>
                                                            ))
                                                            : ""}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        </div>
                    </div>
                </CustomModal>

                <CustomModal
                    width="max-w-7xl"
                    isOpen={state.openTestCaseModal}
                    onClose={() => setState({ openTestCaseModal: false })}
                    title={<div className="font-medium text-base">{(state.CurrTestCase as any).TestCase}</div>}
                    footerContent={[
                        <button
                            key="close"
                            onClick={() => setState({ openTestCaseModal: false })}
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
                                <td className="p-3 text-gray-800">{(state.CurrTestCase as any).TestCase}</td>
                            </tr>
                            <tr className="border-t border-gray-200">
                                <td className="p-3 font-medium text-gray-700 border-r border-gray-300">Pre Conditions:</td>
                                <td className="p-3 text-gray-800">{(state.CurrTestCase as any).PreConditions}</td>
                            </tr>
                            <tr className="border-t border-gray-200 bg-gray-50">
                                <td className="p-3 font-medium text-gray-700 border-r border-gray-300">Expected Result:</td>
                                <td className="p-3 text-gray-800">{(state.CurrTestCase as any).ExpectedResult}</td>
                            </tr>
                            <tr className="border-t border-gray-200 bg-gray-50">
                                <td className="p-3 font-medium text-gray-700 border-r border-gray-300">Priority:</td>
                                <td className="p-3 text-gray-800">{(state.CurrTestCase as any).Priority}</td>
                            </tr>
                            <tr className="border-t border-gray-200">
                                <td className="p-3 font-medium text-gray-700 border-r border-gray-300">Test Type:</td>
                                <td className="p-3 text-gray-800">{(state.CurrTestCase as any).TestType}</td>
                            </tr>
                            <tr className="border-t border-gray-200 bg-gray-50">
                                <td className="p-3 font-medium text-gray-700 border-r border-gray-300">Module:</td>
                                <td className="p-3 text-gray-800">{(state.CurrTestCase as any).Module}</td>
                            </tr>
                            </tbody>
                        </table>



                        <div>
                            <ToggleButtonGroupV3
                                variant="underline"
                                animationFlag={false}
                                initialKey={state.CurrentTCModalToggle}
                                items={TC_Tabs}
                                onChange={(key) => {
                                    setState({ CurrentTCModalToggle: key });
                                }}
                            />
                        </div>

                        {
                            state.CurrentTCModalToggle==="Test Steps"&& <div>
                                <div>
                                    <p className="font-semibold text-lg pb-2 pl-2">Test Steps {state.CurrTestCase.TransactionCode?`(${state.CurrTestCase.TransactionCode})`:''}: </p>
                                </div>
                                <CustomTableData
                                    spinnerLabel=""
                                    showSpinnerFlag={false}
                                    truncateCharLimit={40}
                                    data={TestStepsData}
                                    columns={TestStepsColums}
                                    rowKey="id"
                                />
                            </div>
                        }

                        {
                            state.CurrentTCModalToggle==="Test Steps AI"&&  <div>
                                <div>
                                    <p className="font-semibold text-lg pb-2 pl-2">Test Steps (AI):</p>
                                </div>
                                <CustomTableData
                                    spinnerLabel=""
                                    showSpinnerFlag={false}
                                    truncateCharLimit={40}
                                    data={TestStepsDataAI}
                                    columns={TestStepsColumsAI}
                                    rowKey="id"
                                />
                            </div>
                        }
                        {
                            state.CurrentTCModalToggle==="Test Dataset"&& <div>
                                {(state.CurrTestCase as any).TestData && (
                                    <div>
                                        <p className="font-semibold pb-2 pl-2">Test Data:</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {Object.entries(((state.CurrTestCase as any).TestData as Record<string, unknown>)).map(([key, value]) => (
                                                <div key={key} className="border border-gray-300 rounded p-3 bg-gray-50">
                                                    <p className="text-gray-700">
                                                        <span className="font-medium">{JSON.stringify(key)}:</span> {JSON.stringify(value) || '—'}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        }






                        {/*{(state.CurrTestCase as any).TestSteps && (*/}
                        {/*    <div>*/}
                        {/*        <p className="font-semibold pb-2 pl-2">Test Steps:</p>*/}
                        {/*        <ol className="list-decimal list-inside space-y-1 pl-4">*/}
                        {/*            {((state.CurrTestCase as any).TestSteps as string[]).map((step: string, index: number) => (*/}
                        {/*                <li key={index} className="text-gray-800">{step}</li>*/}
                        {/*            ))}*/}
                        {/*        </ol>*/}
                        {/*    </div>*/}
                        {/*)}*/}
                    </div>
                </CustomModal>

                <CustomModal
                    width="max-w-7xl"
                    isOpen={state.openUncoveredSectionsModal}
                    onClose={() => setState({ openUncoveredSectionsModal: false })}
                    title={<div className="font-medium text-base ">Ignored Sections From Document</div>}
                    footerContent={[
                        <button
                            key="close"
                            onClick={() => setState({ openUncoveredSectionsModal: false })}
                            className="mt-2 cursor-pointer px-5 py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg"
                        >
                            Close
                        </button>,
                        ,
                    ]}
                >
                    <div className="space-y-6 h-full flex flex-col text-sm ">
                        {state.UncoveredSections.map((vl, i) => {
                            return (
                                <Accordion key={i} checkboxEnabled={true} title={vl.SectionTitle} expandKey={vl.SectionTitle}>
                                    <div>
                                        <p>{vl.SectionContent}</p>
                                    </div>
                                </Accordion>
                            );
                        })}
                    </div>
                </CustomModal>

                <CustomModal
                    width="max-w-lg"
                    isOpen={state.openBatchTCGenerationModal}
                    onClose={() => setState({ openBatchTCGenerationModal: false })}
                    title={<p className="text-lg">Generate Test Case</p>}
                    footerContent={[
                        <button
                            key="close"
                            onClick={() => setState({ openBatchTCGenerationModal: false })}
                            className=" cursor-pointer py-2 px-3 bg-white font-semibold text-[#5700D1] border border-[#5700D1] text-sm rounded-lg"
                        >
                            Close
                        </button>,
                    ]}
                >
                    <div className="space-y-5 h-full w-full flex flex-col">
                        {state.ShowBatchTCGenerationLoader ? (
                            <SpinnerV2 />
                        ) : (
                            <StatusMessage
                                className="bg-white"
                                size={150}
                                strokeWidth={7}
                                status="success"
                                message={`Successfully Generated Test Cases (${state.GenerateMassTotalTestCases}).`}
                            />
                        )}
                    </div>
                </CustomModal>

                <div>
                    <PannelWrapper className="">
                        <div className="flex justify-between items-center py-4">
                            <div className="flex justify-between items-center ">
                                <div onClick={()=>{
                                    toggleCollapse()
                                    props.handleBack()}} className="flex items-center cursor-pointer bg[#f3f3f3]    p-2 rounded-full">
                                    <ChevronLeft className="text-gray-700" />
                                </div>
                                <div className="pl-4 ">
                                    <p className="text-lg font-semibold ">{state.CurrentToggle}</p>
                                    <div className="flex items-center justify-between   pt-1  ">
                                        <Tooltip className="bg-white text-gray-900 shadow-lg" title="" content={<div>{fileName}</div>} placement="right">
                                            <p className="text-xs ">
                                                <span className="font-medium">{props.CurrentSession.SessionId}</span> {"  -  "}
                                                <span>
                          {fileName && url ? (
                              <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sky-700 font-medium hover:underline break-all"
                              >
                                  {truncateString(fileName, 35)}
                              </a>
                          ) : (
                              <span className="text-gray-500">No File</span>
                          )}
                        </span>
                                            </p>
                                        </Tooltip>
                                    </div>
                                </div>
                            </div>

                            <div className="w-1/4">
                                <SearchBar currentValue={state.SearchQuery} onSearch={handleSearch} size="medium" />
                            </div>

                            <div className="flex items-center ">
                                <p className="flex text-sm font-medium items-center pr-4">Filter:</p>
                                <DropdownV2
                                    mode="single"
                                    size={"small"}
                                    searchable={false}
                                    options={[
                                        { label: "Valid", value: "No" },
                                        { label: "Invalid", value: "Yes" },
                                    ]}
                                    value={state.ScenarioFilterObj.FlagType}
                                    onChange={(val: FlagType, item: any) => handleFilterScenarioDropdown(val, item, "FlagType")}
                                />
                            </div>

                            <div className="flex items-center gap-5">
                                <Menu
                                    portal
                                    trigger={
                                        <button
                                            className="bg-[#0071E9] text-sm text-nowrap font-medium  hover:bg-[#005ABA]  cursor-pointer text-white  py-2 px-3 rounded-lg flex items-center space-x-2"
                                        >
                                            <HugeiconsIcon size={19} icon={SparklesIcon} />
                                            <span>Generate Mass Test Cases/Mark Invalid </span>
                                        </button>
                                    }
                                    align="start"
                                    width={260}
                                    items={[
                                        { id: "MassTestCases", label: "Generate Mass Test Cases" },
                                        { id: "MarkInvalid", label: "Mark Invalid" },
                                    ]}
                                    onSelect={(item: any) => handleSelectionActionType(item)}
                                />
                            </div>
                        </div>

                        <div className="">
                            {
                                state.CurrentToggle === "Test Scenarios" && (
                                    <div className="">
                                        <CustomTableData
                                            showSpinnerFlag={state.ShowTestScenariosLoader}
                                            HorizontalScroll={true}
                                            scrollHeightClass="h-[calc(100vh-340px)]"
                                            truncateCharLimit={40}
                                            data={TestScenariosData}
                                            columns={TestScenarioColumns as any}
                                            rowKey="id"
                                        />
                                        <div className="">
                                            <div className="flex justify-between items-center pt-2">
                                                <div className="flex  items-center">
                                                    <p className="text-blue-700 text-sm  font-semibold">
                                                        Total Scenarios: {state.SearchQuery ? state.ScenariosList.length : state.TotalRecords}
                                                        <span></span>
                                                    </p>
                                                    <div className="flex font-medium ml-6 items-center text-red-700">
                                                        <div className="flex items-center">
                                                            <div className="flex font-medium ml-6 items-center text-red-700">
                                                            <FileWarning size={19}/>
                                                            <p className="text-red-700 cursor-pointer ml-1 m-0"
                                                               onClick={() => setState({openUncoveredSectionsModal: true})}>Ignored
                                                                Sections</p>

                                                        </div>
                                                            <div className="flex font-medium ml-6 items-center text-sky-700">
                                                                <Download size={19}/>
                                                                <p className="text-sky-700 text-sm cursor-pointer ml-1 m-0"
                                                                   onClick={() => FileDownloader("/ExportTestScenariosToExcel", props.CurrentSession)}>Download
                                                                    Test Scenarios</p>
                                                            </div>
                                                            <div className="flex font-medium ml-6 items-center text-sky-700">
                                                                <Download size={19}/>
                                                                <p className="text-sky-700 text-sm cursor-pointer ml-1 m-0"
                                                                   onClick={() => FileDownloader("/ExportTestCasesByDocumentToExcel", props.CurrentSession)}>Download
                                                                    Test Cases</p>

                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                {state.TotalRecords > 10 && (
                                                    <div className="pt-2">
                                                        <Pagination
                                                            total={state.TotalRecords}
                                                            current={state.CurrentPage}
                                                            pageSize={10}
                                                            onChange={handlePageChange}
                                                            showSizeChanger={false}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            }

                            {
                                state.CurrentToggle === "BRD Summary" && (
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
                                )
                            }
                        </div>
                    </PannelWrapper>
                </div>
            </div>
        </div>
    );
}
