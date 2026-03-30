import React, { useEffect, useReducer, useRef, useMemo } from 'react';
import { apiRequest } from "../../../utils/helpers/ApiHelper";
import { CircleAlert, Code2, Edit, FlaskConical, Info, Layers, Map, SlidersHorizontal, SquarePen, X } from "lucide-react";
import Modal from "../../../utils/Modal";
import Accordion from "../../../utils/Accordion";
import Dropdown from "../../../utils/Dropdown";
import CustomModal from "../../../utils/CustomModal";
import PostmanViewerModal from "../../../utils/PostmanViewerModal";
import TestcaseReportModal from "../../../utils/TestcaseReportModal";
import PannelWrapper from "../../../utils/PannelWrapper";
import ToggleButtonGroup from "../../../utils/ToggleButtonGroup";
import CustomTable from "../../../utils/CustomTable";
import axios from "axios";
import Spinner from "../../../utils/Spinner";
import Pagination from "../../../utils/Pagination";
import Nodata from "../../../assets/Nodata.svg";
import DropdownV2 from "../../../utils/DropdownV2";
import TestStepsHeaderMaster from "@/components/Configuration/SAPModule/SAPObjects/TestStepsHeaderMaster";
import ToggleButtonGroupV3 from "@/utils/ToggleButtonGroupV3";
import CustomTableData from "@/utils/CustomTableData";
import {FaListCheck} from "react-icons/fa6";
import Toast from "../../../utils/Toast.tsx";
import ConfirmPopup from "../../../utils/ConfirmPopup";
import TestCaseDetailsModal from './TestCaseDetailsModal';
import ValidationReport from "@/components/ValidationTabView/ValidationReport";


declare const doc: any;

type ToggleKey = 'Test Scenarios' | 'BRD Summary';
type ModalToggleKey = 'Generate Test Case' | 'Test Cases';

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
    [key: string]: unknown;
}

interface ScenarioFilters {
    DocumentId: string;
    SourceType: string;
    VersionType: string;
}

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

interface CurrAddEditObj {
    ClientId: string;
    ProjectId: string;
    SprintId: string;
    SessionId: string;
    InputFileURL: string;
    MarkdownFileURL: string;
    SessionStatus: string;
    InputDoc: string;
    [key: string]: unknown;
}

interface ValidateFields {
    InputDoc: string;
    [key: string]: string;
}

interface ValidateTestCaseFields {
    TestCase: string;
    ExpectedResult: string;
    [key: string]: string;
}

interface ApiDetails {
    ApiId: string;
    ServiceName: string;
    ApiMethod: string;
    EndPoint: string;
    Version: string;
    RequestSchema: any;
    Headers: any;
    ResponseData: any;
    ApiNotes: string;
}

interface State {
    ActionType: string;
    Error: string;
    CurrentToggle: ToggleKey | string;
    CurrentModalToggle: ModalToggleKey | string;
    SearchQuery: string;
    tab: string;
    CurrentPage: number;
    CurrentTCVersion: string;
    CurrentTCModalToggle: string;
    ViewSummary: boolean;
    openEditTestCaseModal: boolean;
    openUncoveredSectionsModal: boolean;
    TotalRecords: number;
    TestCaseTotalRecords: number;
    CurrentSprint: Record<string, unknown>;
    DocumentList: any[];
    ScenarioFilters: ScenarioFilters;
    ProjectSprintList: any[];
    CurrAddEditTestCaseObj: CurrAddEditTestCaseObj;
    TransactionsList: any[];
    BRDSummary: any[];
    TestStrategy: any[];
    ImpactAnalysis: any[];
    ScenariosList: any[];
    existingMarkdownList: any[];
    TestingTechniquesList: any[];
    UncoveredSections: any[];
    EqClassesBaundaryValues: any[];
    ApplicationsList: any[];
    TestStepsList: any[];
    TestCasesList: any[];
    ViewClientDetails: boolean;
    ShowLoader: boolean;
    ValidationComponentModalOpen: boolean;
    ShowTestCases: boolean;
    ViewSprintDetails: boolean;
    IsLoading: boolean;
    openTestCaseModal: boolean;
    resetDocUpload: boolean;
    showToast: boolean;
    toastMessage:string;
    openModal: boolean;
    openModal4: boolean;
    CurrScenario: Record<string, any>;
    CurrTestCase: Record<string, any>;
    openModal3: boolean;
    SavingLoader: boolean;
    isDataExist: string;
    SourceTypes: { label: string; value: string }[];
    ClientBusinessUnitActionType: string;
    TestConditionCriteria: TestConditionCriteria;
    CurrAddEditObj: CurrAddEditObj;
    ValidateFields: ValidateFields;
    ValidateTestCaseFields: ValidateTestCaseFields;
    TestCaseFormErrors: Record<string, string>;
    TestCaseCurrentPage?: number;
    VersionId?: string;
    TestStepsHeaderList: any[];
    SelectedTestStepsHeader: string;
    AvailableTestSteps: any[];
    SelectedTestStepsIds: string[];
    AssignedTestCaseSteps: any[];
    ExecutingSteps: boolean;
    AssignedTestStepsFilter: string;
    isApiDetailsModalOpen: boolean;
    currentApiDetails: ApiDetails | null;
    CurrEQ?: any;
    deletingId?: string | null;
    // ADD THESE TWO NEW PROPERTIES FOR VALIDATION
    showValidationModal: boolean;
    validationErrors: any[];
}

type Props = {
    CurrentSession: any;
    CurrentSprint: any;
    handleBackToMain?: () => void;
};

interface DeleteStepPayload {
    TestCaseResultId: string;
    TestStepsId: string;
    TestCaseId: string;
}

interface ConfirmPopupProps {
    message: string;
    onConfirm: () => void;
    children: React.ReactNode;
    [key: string]: unknown;
}
const ConfirmPopupTyped = ConfirmPopup as React.ComponentType<ConfirmPopupProps>;

const initialState: State = {
    ActionType: "",
    Error: "",
    CurrentToggle: "Test Scenarios",
    CurrentModalToggle: "Generate Test Case",
    CurrentTCModalToggle: "Test Steps",
    SearchQuery: "",
    tab: 'upload',
    CurrentPage: 1,
    CurrentTCVersion: "",
    ViewSummary: false,
    ValidationComponentModalOpen: false,
    openEditTestCaseModal: false,
    openUncoveredSectionsModal: false,
    TotalRecords: 0,
    TestCaseTotalRecords: 0,
    CurrentSprint: {},
    DocumentList: [],
    ScenarioFilters: {
        DocumentId: "",
        SourceType: "",
        VersionType: "",
    },
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
    BRDSummary: [],
    TestStrategy: [],
    TestStepsList: [],
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
    toastMessage:'',
    ShowTestCases: false,
    ViewSprintDetails: false,
    IsLoading: true,
    openTestCaseModal: false,
    resetDocUpload: false,
    showToast: false,
    openModal: false,
    openModal4: false,
    CurrScenario: {},
    CurrTestCase: {},
    openModal3: false,
    SavingLoader: false,
    isDataExist: "",
    SourceTypes: [
        { label: 'Document', value: 'Document' },
        { label: 'JIRA', value: 'JIRA' },
        { label: 'Signavio', value: 'Signavio' },
        { label: 'ABAP_Program', value: 'ABAP_Program' },
        { label: 'SAPConfig', value: 'SAPConfig' },
    ],
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
        Transactions: []
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
        InputDoc: ""
    },
    ValidateTestCaseFields: {
        TestCase: "",
        ExpectedResult: "",
    },
    TestCaseFormErrors: {},
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
};

export default function ProjectSprintSessionTestCases(props: Props) {
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

    const searchParams = new URLSearchParams(location.search);
    const ClientIdFromUrl = searchParams.get("CLId");
    const BusinessUnitIdName = searchParams.get("BUNM");
    const sprintIdFromUrl = searchParams.get("SPRID");
    const ProjectIdFromUrl = searchParams.get("PJID");

    const getTestCasesList = async (
        SearchString: string = "",
        PageNo: number = 1,
        DocumentId: string = "",
        VersionType: string = "Current"
    ): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetProjectSprintSessionDocumentTestCasesPaginationFilterSearchBySprintId", {
                PageNo,
                SearchString,
                DocumentId,
                VersionType,
                ClientId: ClientIdFromUrl ? ClientIdFromUrl : props.CurrentSession.ClientId,
                ProjectId: ProjectIdFromUrl ? ProjectIdFromUrl : props.CurrentSession.ProjectId,
                SprintId: sprintIdFromUrl ? sprintIdFromUrl : props.CurrentSession.SprintId,
            });

            let CurrentTCVersion = "";
            if (resp.ResponseData.length > 0) {
                CurrentTCVersion = resp.ResponseData[0].VersionId;
            }
            setState({
                TestCasesList: resp.ResponseData,
                CurrentTCVersion,
                ShowLoader: false,
                TestCaseTotalRecords: resp.TotalRecords
            });
        } catch (err) {
            console.error("Error loading test cases:", err);
        }
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

    const GetTestStepsByTCODE = async (item: any) => {
        item.SearchString = item.TransactionCode;
        let ReqObj = {
            SearchString: item.TransactionCode,
            TestLevel: item.TestingLevel,
            TestCaseId: (state.CurrTestCase as any)?.TestCaseId
        };
        const resp: any = await apiRequest("/GetTestStepsWithDetailsPaginationFilterByTcode", ReqObj);
        if (resp.ResponseData.length > 0) {
            setState({ TestStepsList: resp.ResponseData });
        }
    };

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
        
        // // Check if validation request failed
        // if (!validation || validation.status === 'fail') {
        //     console.log("Validation request failed"); // DEBUG
        //     setState({
        //         ExecutingSteps: false,
        //         showToast: true,
        //         toastMessage: "Validation failed. Unable to validate test case steps."
        //     });
        //     return;
        // }
        // // Check if validation found invalid steps
        // if (!validation.isValid) {
        //     setState({
        //         ExecutingSteps: false,
        //         showValidationModal: true,
        //         validationErrors: validation.invalidData || []
        //     }, () => {
        //         // Callback after state update (if your setState supports it)
        //         console.log("State updated successfully");
        //     });
        //
        //     return;
        // }

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
                    v.validation_id = v.TestCaseStepsResults[0].component.validation_id;
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

    const getGetTransactionsList = async (ApplicationId: string = "APID-5", _SearchString: string = ""): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetTransactionsMasterByApplicationId", {
                ApplicationId
            });

            setState({
                TransactionsList: resp.ResponseData,
            });
        } catch (err) {
            console.error("Error loading transactions:", err);
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
            console.error("Error loading BRD summary:", err);
        }
    };

    const getGetTestingTechnicsList = async (_ApplicationId: string = "APID-5", _SearchString: string = ""): Promise<void> => {
        try {
            const resp: any = await apiRequest("/testing/GetTestingTechniquesMaster", {});
            setState({
                TestingTechniquesList: resp.ResponseData,
            });
        } catch (err) {
            console.error("Error loading testing techniques:", err);
        }
    };

    const getData = async (SearchQuery: string = "", PageNo: number = 1): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetProjectSprintSessionDocScenariosBySprint", {
                StartDate: "",
                EndDate: "",
                PageNo,
                SearchString: SearchQuery,
                ClientId: props.CurrentSession.ClientId,
                ProjectId: props.CurrentSession.ProjectId,
                SprintId: props.CurrentSession.SprintId,
            });
            setState({
                ScenariosList: resp.ResponseData, TotalRecords: resp.TotalRecords
            });
        } catch (err: any) {
            setState({ Error: err.toString() });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const handleDropdownClientInfo = (val: any, _options: any, name: string): void => {
        const TestConditionCriteria = { ...state.TestConditionCriteria };
        TestConditionCriteria[name] = val;
        setState({ TestConditionCriteria });
    };

    const getGetTransactionsFieldsList = async (item: any, _SearchString: string = ""): Promise<void> => {
        item.SearchString = "";
        const TestConditionCriteria = { ...state.TestConditionCriteria };
        try {
            const resp: any = await apiRequest("/GetTransactionFieldValuesMaster", item);
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
            console.error("Error loading transaction fields:", err);
        }
    };

    const handleDropdownTransaction = (val: any, _options: any, CurrItem: any, name: string): void => {
        const TestConditionCriteria = { ...state.TestConditionCriteria };
        TestConditionCriteria[name] = val;
        setState({ TestConditionCriteria });

        if (name === "TransactionId") {
            if (val) {
                // placeholder
            } else {
                TestConditionCriteria.TransactionFields = [];
                setState({ TestConditionCriteria });
            }
        }
        if (name === "TransactionId") {
            getGetTransactionsFieldsList(TestConditionCriteria);
        }

        if (name === "TestingTechniqueId") {
            getGetTransactionsFieldsList(TestConditionCriteria);
        }
    };

    const handleScenarioFilter = (value: any, _option: any, name: string): void => {
        const ScenarioFilters = { ...state.ScenarioFilters };
        ScenarioFilters[name as keyof ScenarioFilters] = value;
        setState({ ScenarioFilters });
        if (name === "SourceType") {
            getDocumentList("", value as string);
        }
        if (name === "DocumentId") {
            getTestCasesList("", 1, value as string, state.VersionId as string);
        }
        if (name === "VersionType") {
            getTestCasesList("", 1, ScenarioFilters["DocumentId"], value as string);
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
                const TestConditionCriteria = state.TestConditionCriteria;
                const TTQNames: string[] = [];
                if (TestConditionCriteria.TestingTechniqueId) {
                    const TestingTechniquesList = state.TestingTechniquesList;

                    const TTQIDS = (TestConditionCriteria.TestingTechniqueId as string).split(',');

                    TTQIDS.map((v: string) => {
                        const TTQ = TestingTechniquesList.filter((val: any) => val.value === v);
                        if (TTQ.length > 0) {
                            TTQNames.push(TTQ[0].value as string);
                        }
                        return v;
                    });
                }
                CurrScenario.Transactions = TestConditionCriteria.Transactions;
                CurrScenario.TestingTechnique = TTQNames.join(',');
                const reqObject: any = {
                    ActionType: "TestCase",
                    ClientId: CurrScenario.ClientId,
                    ProjectId: CurrScenario.ProjectId,
                    BusinessUnitId: props.CurrentSession.BusinessUnitId,
                    SprintId: CurrScenario.SprintId,
                    SessionId: CurrScenario.SessionId,
                    DocumentId: props.CurrentSession.DocumentId,
                    TestScenarioId: CurrScenario.TestScenarioId,
                    MarkdownFilePath: props.CurrentSession.MarkdownFileURL,
                    TestScenario: CurrScenario
                };

                await axios.post("https://sirobilt.ai:8050/api/GenerateDataByExistingMDFile", reqObject as any);
                getTestCasesList("", CurrScenario);
            }
        } catch (err) {
            console.error("Error generating test case:", err);
        }
    };

    const handleUpdateFieldValue = (
        e: React.ChangeEvent<HTMLInputElement>,
        id1: number,
        id2: number,
        name: string
    ): void => {
        const TestConditionCriteria = { ...state.TestConditionCriteria };
        TestConditionCriteria.Transactions[id1].TransactionFields[id2][name] = e.target.value;
        setState({ TestConditionCriteria });
    };

    const handlCurrEQC = (item: any): void => {
        setState({ openModal3: true, CurrEQ: item, EqClassesBaundaryValues: item.EquivalenceClasses });
    };

    const handleViewScenarioDetails = (item: any): void => {
        const TestConditionCriteria: TestConditionCriteria = {
            ClientId: "",
            BusinessUnitId: "",
            BusinessProcessId: "",
            BusinessSubProcessId: "",
            ApplicationId: "",
            TransactionId: "",
            TestingTechniqueId: "",
            TransactionFields: [],
            Transactions: []
        };

        setState({ openModal: true, TestConditionCriteria, CurrScenario: item, CurrentModalToggle: "Generate Test Case" });
    };

    const handleChangeTestCase = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
        name: string
    ): void => {
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

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        for (const name in state.ValidateTestCaseFields) {
            const value = state.CurrAddEditTestCaseObj[name];
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
            TestCaseFormErrors: FormErrors
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
            // optional refresh
        }
    };

    const handleSubmitTestCase = async (): Promise<void> => {
        if (!validateTestCaseForm()) {
            return;
        }
        setState({ openEditTestCaseModal: false });
        const resp: any = await apiRequest("/AddUpdateProjectSprintSessionDocumentTestCases", state.CurrAddEditTestCaseObj);
        if (resp) {
            getTestCasesList("", state.CurrScenario as any, state.TestCaseCurrentPage as number);
        }
    };

    const handlePageChange = (page: number): void => {
        setState({ CurrentPage: page });
        getTestCasesList("", page);
    };

    const handleTestCasePageChange = (page: number): void => {
        setState({ TestCaseCurrentPage: page });
        getTestCasesList("", page, state.ScenarioFilters.DocumentId, state.ScenarioFilters.VersionType);
    };



/*     
    const ValidationErrorModal = ({ show, errors, onClose }) => {
        if (!show) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-red-600 flex items-center gap-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Validation Failed
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                        <p className="text-red-800 font-medium mb-1">
                            {errors.length} {errors.length === 1 ? 'step' : 'steps'} missing execution results
                        </p>
                        <p className="text-red-700 text-sm">
                            Please ensure all assigned test case steps have a Test Case Key before running this execution.
                        </p>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Step No
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Test Case ID
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Test Steps ID
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {errors.map((error, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                            {error.StepNo}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">
                                            {error.TestCaseId}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">
                                            {error.TestStepsId}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Add Test Case Keys
                        </button>
                    </div>
                </div>
            </div>
        );
    };
 */


    const getFileName = (path: string): string => {
        if (!path) return "No File";
        const parts = path.split("/");
        const fileName = parts[parts.length - 1];
        const cleaned = fileName.replace(/^(\d+-?)+/, '');
        return cleaned.trim();
    };

    const getFileURL = (path: string): string => {
        if (!path) return "No URL";
        const url = path.replace("/var", "");
        return url;
    };

    const steps = [
        { title: 'Test Scenarios', subtitle: 'Select Test Scenario and Transaction', icon: <Map /> },
        { title: 'Test Conditions', subtitle: 'Select Test Conditions', icon: <FlaskConical /> },
        { title: 'Test Cases', subtitle: 'Select Test Cases', icon: <SlidersHorizontal /> },
    ];

    const options = [
        { key: "Test Scenarios", label: "Test Scenarios", icon: <Layers size={15} /> },
        { key: "BRD Summary", label: "BRD Summary", icon: <Code2 size={15} /> },
    ];
    
    const options2 = [
        { key: "Generate Test Case", label: "Generate Test Case", icon: <Layers size={15} /> },
        { key: "Test Cases", label: "Test Cases", icon: <Code2 size={15} /> },
    ];

    const columns: any[] = [
        {
            key: "DocumentName",
            header: "Source",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "8%",
        },
        {
            key: "TestScenarioName",
            header: "Test Scenario",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "10%",
        },
        {
            key: "TestCase",
            header: "Test Case",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "16%",
        },
        {
            key: "ExpectedResult",
            header: "Expected Result",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "16%",
        },
    ];

    const data: any[] = state.TestCasesList.map((v: any) => ({
        TestCase: (
            <div className="relative flex items-center">
                {v.TestCase}
                <span onClick={() => handleCurrentTestCase(v)} className="text-blue-700 ml-2 cursor-pointer">
                    <Info size={22} />
                </span>
            </div>
        ),
        DocumentName: v.DocumentName,
        TestScenarioName: v.TestScenarioName,
        ExpectedResult: v.ExpectedResult,
        Priority: v.Priority,
        TestType: v.TestType,
    }));

    return (
        <div className="w-full relative">
            <Toast
                message={state.toastMessage}
                show={state.showToast}
                onClose={() => setState({ showToast: false })}
            />

            {/* <CustomModal
                width="max-w-5xl"
                modalZIndex={1003}
                isOpen={state.isApiDetailsModalOpen}
                onClose={() => setState({ isApiDetailsModalOpen: false, currentApiDetails: null })}
                title={<div className="text-lg font-semibold">API Details</div>}
                footerContent={[
                    <button
                        key="close"
                        onClick={() => setState({ isApiDetailsModalOpen: false, currentApiDetails: null })}
                        className="mt-2 cursor-pointer px-5 py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg"
                    >
                        Close
                    </button>,
                ]}
            >
                {state.currentApiDetails && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="border border-gray-300 rounded p-3 bg-gray-50">
                                <p className="font-semibold text-gray-700">API ID:</p>
                                <p className="text-gray-600">{state.currentApiDetails.ApiId || "-"}</p>
                            </div>
                            <div className="border border-gray-300 rounded p-3 bg-gray-50">
                                <p className="font-semibold text-gray-700">Service Name:</p>
                                <p className="text-gray-600">{state.currentApiDetails.ServiceName || "-"}</p>
                            </div>
                            <div className="border border-gray-300 rounded p-3 bg-gray-50">
                                <p className="font-semibold text-gray-700">Method:</p>
                                <p className="text-gray-600">{state.currentApiDetails.ApiMethod || "-"}</p>
                            </div>
                            <div className="border border-gray-300 rounded p-3 bg-gray-50">
                                <p className="font-semibold text-gray-700">Version:</p>
                                <p className="text-gray-600">{state.currentApiDetails.Version || "-"}</p>
                            </div>
                        </div>
                        
                        <div className="border border-gray-300 rounded p-3 bg-gray-50">
                            <p className="font-semibold text-gray-700 mb-2">Endpoint:</p>
                            <p className="text-gray-600 break-all">{state.currentApiDetails.EndPoint || "-"}</p>
                        </div>

                        {state.currentApiDetails.RequestSchema && (
                            <div className="border border-gray-300 rounded p-3 bg-gray-50">
                                <p className="font-semibold text-gray-700 mb-2">Request Schema:</p>
                                <pre className="text-xs text-gray-600 overflow-auto max-h-48 bg-white p-2 rounded">
                                    {JSON.stringify(state.currentApiDetails.RequestSchema, null, 2)}
                                </pre>
                            </div>
                        )}

                        {state.currentApiDetails.Headers && (
                            <div className="border border-gray-300 rounded p-3 bg-gray-50">
                                <p className="font-semibold text-gray-700 mb-2">Headers:</p>
                                <pre className="text-xs text-gray-600 overflow-auto max-h-48 bg-white p-2 rounded">
                                    {JSON.stringify(state.currentApiDetails.Headers, null, 2)}
                                </pre>
                            </div>
                        )}

                        {state.currentApiDetails.ResponseData && (
                            <div className="border border-gray-300 rounded p-3 bg-gray-50">
                                <p className="font-semibold text-gray-700 mb-2">Response Data:</p>
                                <pre className="text-xs text-gray-600 overflow-auto max-h-48 bg-white p-2 rounded">
                                    {JSON.stringify(state.currentApiDetails.ResponseData, null, 2)}
                                </pre>
                            </div>
                        )}

                        {state.currentApiDetails.ApiNotes && (
                            <div className="border border-gray-300 rounded p-3 bg-gray-50">
                                <p className="font-semibold text-gray-700 mb-2">Notes:</p>
                                <p className="text-gray-600">{state.currentApiDetails.ApiNotes}</p>
                            </div>
                        )}
                    </div>
                )}
            </CustomModal> */}


            {state.ValidationComponentModalOpen&& <div className="z-[1009]">
                <ValidationReport data={state.currentApiDetails} isOpen={state.ValidationComponentModalOpen} onClose={function (): void {
                    setState({ValidationComponentModalOpen:false})
                } } />
            </div>}


            {/* <PostmanViewerModal
                isOpen={state.isApiDetailsModalOpen}
                onClose={() => setState({ isApiDetailsModalOpen: false, currentApiDetails: null })}
                data={state.currentApiDetails}
                title="Execution Report"
            /> */}
            <TestcaseReportModal
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
                title={<div className="text-lg">Edit Test Case</div>}
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
                        className="mt-2 cursor-pointer px-5 py-2 bg-[#0071E9] text-white text-sm rounded-lg"
                    >
                        Save
                    </button>,
                ]}
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                    Test Case<span className="text-red-500">*</span>
                                </label>
                            </div>
                            <div className="relative">
                                <textarea
                                    onChange={(e) => handleChangeTestCase(e, "TestCase")}
                                    value={state.CurrAddEditTestCaseObj.TestCase as string}
                                    rows={3}
                                    maxLength={2000}
                                    placeholder="Test Case"
                                    className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8] resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                                ></textarea>
                            </div>
                            {state.TestCaseFormErrors.TestCase && (
                                <div className="flex items-center mt-1 ml-2">
                                    <CircleAlert size={14} className="text-red-500" />
                                    <p className="ml-2 text-red-500 text-sm">{state.TestCaseFormErrors.TestCase}</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                    Pre Conditions
                                </label>
                            </div>
                            <div className="relative">
                                <textarea
                                    onChange={(e) => handleChangeTestCase(e, "PreConditions")}
                                    value={state.CurrAddEditTestCaseObj.PreConditions as string}
                                    rows={3}
                                    maxLength={2000}
                                    placeholder="Pre Conditions"
                                    className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8] resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                                ></textarea>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                    Expected Result<span className="text-red-500">*</span>
                                </label>
                            </div>
                            <div className="relative">
                                <textarea
                                    onChange={(e) => handleChangeTestCase(e, "ExpectedResult")}
                                    value={state.CurrAddEditTestCaseObj.ExpectedResult as string}
                                    rows={3}
                                    maxLength={2000}
                                    placeholder="Expected Result"
                                    className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8] resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                                ></textarea>
                            </div>
                            {state.TestCaseFormErrors.ExpectedResult && (
                                <div className="flex items-center mt-1 ml-2">
                                    <CircleAlert size={14} className="text-red-500" />
                                    <p className="ml-2 text-red-500 text-sm">{state.TestCaseFormErrors.ExpectedResult}</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                    Test Type
                                </label>
                            </div>
                            <div className="relative">
                                <input
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChangeTestCase(e, "TestType")}
                                    value={state.CurrAddEditTestCaseObj.TestType as string}
                                    placeholder="TestType"
                                    className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8] resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                    Priority
                                </label>
                            </div>
                            <div className="relative">
                                <input
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChangeTestCase(e, "Priority")}
                                    value={state.CurrAddEditTestCaseObj.Priority as string}
                                    placeholder="Priority"
                                    className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8] resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                    Comments
                                </label>
                            </div>
                            <div className="relative">
                                <textarea
                                    onChange={(e) => handleChangeTestCase(e, "Comments")}
                                    value={(state.CurrAddEditTestCaseObj.Comments as string) || ""}
                                    rows={3}
                                    maxLength={2000}
                                    placeholder="Comments"
                                    className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8] resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
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
                onClose={() => setState({ openModal3: false })}
                title={"Test Scenario 1"}
            >
                <div className="space-y-5 flex flex-col">
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
                                        <tr className="border-t border-gray-200" key={id}>
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
                            onClick={() => setState({ openModal3: false })}
                            className="cursor-pointer mt-4 px-5 py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>

            <CustomModal
                width="max-w-8xl"
                isOpen={state.openModal}
                onClose={() => setState({ openModal: false })}
                title={
                    <div className="text-lg">
                        Test Scenario: <span className="text-base font-normal text-gray-700">{state.CurrScenario.TestScenarioName}</span>
                    </div>
                }
                footerContent={[
                    <button
                        key="close"
                        onClick={() => setState({ openModal: false })}
                        className="mt-2 cursor-pointer px-5 py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg"
                    >
                        Close
                    </button>,
                    state.CurrentModalToggle === "Generate Test Case" ? (
                        <button
                            key="gen"
                            onClick={handleGenerateTestCase}
                            className="mt-2 cursor-pointer px-5 py-2 bg-[#0071E9] text-white text-sm rounded-lg"
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
                                onChange={(key: string) => {
                                    setState({ CurrentModalToggle: key });
                                    getTestCasesList("", state.CurrScenario as any);
                                }}
                            />
                        </div>

                        <div>
                            {state.CurrentModalToggle !== "Generate Test Case" ? (
                                <p>
                                    Total Test Cases Generated By AI: <span className="font-semibold">{state.TestCaseTotalRecords}</span>
                                </p>
                            ) : (
                                <p className="font-semibold">Automatically generate test cases using AI</p>
                            )}
                        </div>
                    </div>

                    {state.CurrentModalToggle === "Generate Test Case" ? (
                        <div className="xl min-h-96 space-y-0">
                            <div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                            Transactions <span className="text-red-500">*</span>
                                        </label>
                                        <Dropdown
                                            mode="multiple"
                                            options={state.TransactionsList}
                                            value={state.TestConditionCriteria.TransactionId}
                                            onChange={(val: any, item: any, CurrItem: any) =>
                                                handleDropdownTransaction(val, item, CurrItem, "TransactionId")
                                            }
                                            onSearch={(q: string) => {}}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                            Testing Technique <span className="text-red-500">*</span>
                                        </label>
                                        <Dropdown
                                            mode="single"
                                            options={state.TestingTechniquesList}
                                            value={state.TestConditionCriteria.TestingTechniqueId}
                                            onChange={(val: any, item: any, CurrItem: any) =>
                                                handleDropdownTransaction(val, item, CurrItem, "TestingTechniqueId")
                                            }
                                            onSearch={(q: string) => {}}
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
                                                                        <tr key={id2} className="border-t border-gray-200">
                                                                            <td className="p-1.5 text-sm"><p>{item2.ScreenName}</p></td>
                                                                            <td className="p-1.5 text-sm"><p>{item2.FieldName}</p></td>
                                                                            <td className="p-1.5 text-sm"><p>{item2.TestingTechnique}</p></td>
                                                                            <td className="p-1.5 text-sm"><p>{item2.FieldType}</p></td>
                                                                            <td className="p-1.5 text-sm">
                                                                                <input
                                                                                    onChange={(e) => handleUpdateFieldValue(e, i, id2, "FieldValue")}
                                                                                    type="text"
                                                                                    defaultValue={item2.FieldValue}
                                                                                    className="w-full p-2 rounded-md border border-gray-200 bg-gray-50 shadow-sm focus:outline-none"
                                                                                />
                                                                            </td>
                                                                            <td className="p-1.5 text-sm">
                                                                                <button
                                                                                    onClick={() => handlCurrEQC(item2)}
                                                                                    className="bg-[#0071E9] mr-4 cursor-pointer text-white px-3 py-1 rounded text-sm"
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
                            <div className="overflow-x-auto min-h-72">
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
                                                        <tr className="border-t border-gray-200" key={id}>
                                                            <td className="p-2">
                                                                <div className="relative flex items-center">
                                                                    {item.TestCase}
                                                                    <span
                                                                        onClick={() => handleCurrentTestCase(item)}
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
                                                                        onClick={() => handleUpdateFlagTypeTestCase(id, item, "Valid")}
                                                                        className={`px-2 py-1 cursor-pointer ${item?.FlagType && item?.FlagType === "Valid" ? "bg-violet-600 text-white" : "bg-gray-200"} mr-2 text-[0.70rem] rounded-md`}
                                                                    >
                                                                        <p>Valid</p>
                                                                    </div>
                                                                    <div
                                                                        onClick={() => handleUpdateFlagTypeTestCase(id, item, "InValid")}
                                                                        className={`px-2 py-1 cursor-pointer ${item?.FlagType && item?.FlagType === "InValid" ? "bg-violet-600 text-white" : "bg-gray-200"} mr-2 text-[0.70rem] rounded-md`}
                                                                    >
                                                                        <p>Invalid</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="p-2">
                                                                <div className="cursor-pointer" onClick={() => handleEditTestCase(item)}>
                                                                    <Edit size={19} className="text-sky-600" />
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr className="border-t border-gray-200">
                                                    <td className="p-2" colSpan={11}>
                                                        <div className="py-10 flex flex-col w-full justify-center items-center">
                                                            <img src={Nodata} alt="No Data" className="w-58" />
                                                            <h3 className="text-lg font-semibold mt-4 text-gray-700">No test cases have been generated yet.</h3>
                                                            <h3 className="text-sm font-semibold mt-1 text-gray-600">Generate test cases in the 'Generate Test Case' section.</h3>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        ) : (
                                            <tr className="border-t border-gray-200">
                                                <td className="p-2" colSpan={10}>
                                                    <div className="h-96 py-20">
                                                        <Spinner size="lg" color="blue-500" text="Generating Test Cases.." />
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
                onClose={() => setState({ openModal4: false })}
                title={<div className="font-medium text-base">{state.CurrScenario.TestScenarioName}</div>}
                footerContent={[
                    <button
                        key="close"
                        onClick={() => setState({ openModal4: false })}
                        className="mt-2 cursor-pointer px-5 py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg"
                    >
                        Close
                    </button>,
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
                        <p className="font-semibold pb-2 pl-2">Related Transaction Codes:</p>
                        <div>
                            <div className="space-y-6">
                                {Object.keys(state.CurrScenario).length > 0 && state.CurrScenario?.RelatedTCodes?.map((item: any, index: number) => (
                                    <div key={index} className="border border-gray-300 rounded-lg p-4 shadow-sm bg-white">
                                        <h2 className="text-lg font-semibold text-blue-700">TCode: {item.TCode}</h2>
                                        <p className="text-gray-700 mb-4">Description: {item.TCodeDescription}</p>

                                        <div className="space-y-2">
                                            {item.RelatedFields.map((field: any, i: number) => (
                                                <div key={i} className="border border-gray-200 rounded p-3 bg-gray-50">
                                                    <p className="font-medium text-gray-800">Field Name: {field.FieldName}</p>
                                                    <p className="text-gray-600">
                                                        Possible Values: <span className="text-gray-800">{field.PossibleDataValues.join(", ")}</span>
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
                isOpen={state.openUncoveredSectionsModal}
                onClose={() => setState({ openUncoveredSectionsModal: false })}
                title={<div className="font-medium text-base">Ignored Sections From Document</div>}
                footerContent={[
                    <button
                        key="close"
                        onClick={() => setState({ openUncoveredSectionsModal: false })}
                        className="mt-2 cursor-pointer px-5 py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg"
                    >
                        Close
                    </button>,
                ]}
            >
                <div className="space-y-6 h-full flex flex-col text-sm">
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
                    <div>
                        {state.CurrentToggle === "Test Scenarios" && (
                            <div>
                                <div className="flex items-center gap-5 py-4">
                                    <div className="flex items-center gap-5">
                                        <p>Source Type</p>
                                        <div className="flex items-center -end">
                                            <div className="w-40">
                                                <DropdownV2
                                                    size="small"
                                                    mode="single"
                                                    searchable={false}
                                                    options={state.SourceTypes}
                                                    value={state.ScenarioFilters.SourceType}
                                                    onChange={(val: any, item: any) => handleScenarioFilter(val, item, "SourceType")}
                                                    placeholder="Select"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-5">
                                        <p>Source</p>
                                        <div className="flex items-center -end">
                                            <div className="w-64">
                                                <DropdownV2
                                                    size="small"
                                                    mode="single"
                                                    searchable={false}
                                                    options={state.DocumentList}
                                                    value={state.ScenarioFilters.DocumentId}
                                                    onChange={(val: any, item: any) => handleScenarioFilter(val, item, "DocumentId")}
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
                                            value={state.ScenarioFilters.VersionType}
                                            onChange={(val: any, item: any) => handleScenarioFilter(val, item, "VersionType")}
                                        />
                                    </div>
                                    <p>Version: {state.CurrentTCVersion}</p>
                                </div>
                                <CustomTableData
                                    spinnerLabel="Generating Test Cases"
                                    showSpinnerFlag={false}
                                    scrollHeightClass="h-[calc(100vh-364px)]"
                                    truncateCharLimit={40}
                                    data={data}
                                    columns={columns}
                                    rowKey="id"
                                />

                                <div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center">
                                            <p className="text-blue-700 text-sm font-semibold">
                                                Total Test Cases: {state.TestCaseTotalRecords}
                                            </p>
                                        </div>
                                        <div className="pt-4 flex justify-end">
                                            {state.TestCaseTotalRecords > 10 && (
                                                <Pagination
                                                    total={state.TestCaseTotalRecords}
                                                    current={state.TestCaseCurrentPage}
                                                    pageSize={10}
                                                    onChange={handleTestCasePageChange}
                                                    showSizeChanger={false}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {state.CurrentToggle === "BRD Summary" && (
                            <div className="overflow-x-auto mt-4 h=[calc(100vh-280px)]">
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
            
            {/* <ValidationErrorModal
                show={state.showValidationModal}
                errors={state.validationErrors}
                onClose={() => {
                    setState({ 
                        showValidationModal: false, 
                        validationErrors: [],
                        CurrentTCModalToggle: "Test Case Keys" 
                    });
                }}
            /> */}
           

            <CustomModal
                width="max-w-2xl"
                isOpen={state.showValidationModal}
                modalZIndex={10000} // Increase z-index to bring it to front
                onClose={() => {
                    setState({ 
                        showValidationModal: false, 
                        validationErrors: [],
                        CurrentTCModalToggle: "Test Case Keys" 
                    });
                }}
                title={
                    <div className="flex items-center gap-2 text-red-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="font-semibold">Validation Failed</span>
                    </div>
                }
                footerContent={
                    <button
                        onClick={() => {
                            setState({ 
                                showValidationModal: false, 
                                validationErrors: [],
                                CurrentTCModalToggle: "Test Case Keys" 
                            });
                        }}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Add Test Case Keys
                    </button>
                }
            >
                <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                    <p className="text-red-800 font-medium mb-1">
                        {state.validationErrors?.length || 0} {state.validationErrors?.length === 1 ? 'step' : 'steps'} missing execution results
                    </p>
                    <p className="text-red-700 text-sm">
                        Please ensure all assigned test case steps have a Test Case Key before running this execution.
                    </p>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Step No
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Test Case ID
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Test Steps ID
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {state.validationErrors?.map((error, index) => (
                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                        {error.StepNo}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        {error.TestCaseId}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        {error.TestStepsId}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CustomModal>

        </div>
    );
}