using { MessageOnly, ListResponse } from './common';
using from '../db/schema';

/* ========================= Shared types ========================= */
type UUID100  : String(100);
type UUID255  : String(255);

/* ---------------- BRD structured input for V2 ---------------- */
type BRDTestScenario {
  TestScenarioId               : String(100);
  TestScenarioName             : LargeString;
  Description                  : LargeString;
  Priority                     : String(100);
  ExpectedResult               : LargeString;
  DocTraceabilitySources       : LargeString;
  ScenarioTraceabilitySources  : LargeString;
  BusinessLogic                : LargeString;
  SectionTitle                 : LargeString;
  SectionContent               : LargeString;
  BusinessUnitID               : String(100);
  BusinessUnitName             : String(255);
  BusinessProcessId            : String(100);
  BusinessProcessName          : String(255);
  BusinessSubProcessId         : String(100);
  BusinessSubProcessName       : String(255);
  RelatedTCodes                : array of BRDRelatedTCode;
  AcceptanceCriteria           : LargeString;
}

type BRDUncoveredSection {
  DocSectionId : String(100);
  SectionTitle : LargeString;
  SectionContent : LargeString;
  TotalSectionsinDocument : LargeString;
  TotalUncoveredSections  : LargeString;
}
type BRDRelatedField {
  FieldName         : String(255);
  PossibleDataValues: array of LargeString;
}
type BRDRelatedTCode {
  TCode           : String(255);
  TCodeDescription: LargeString;
  RelatedFields   : array of BRDRelatedField;
}
type BRDImpactAnalysis {
  Impact          : LargeString;
  ImpactTitle     : LargeString;
  ImpactDescription : LargeString;
  AffectedSystems : LargeString;
  Stakeholders    : LargeString;
  ImpactLevel     : LargeString;
  Justification   : LargeString;
  Description     : LargeString;
}
type BRDTestStrategy {
  TestStrategy    : LargeString;
  TestStrategyDescription : LargeString;
  TestTypes       : LargeString;
  TestEnvironment : LargeString;
}
type BRDInputLegacy {
  BRDSummary       : LargeString;
  BRDSummaryAdditional : LargeString;
  ImpactAnalysis   : BRDImpactAnalysis;
  TestStrategy     : BRDTestStrategy;
  UncoveredSections: array of BRDUncoveredSection;
  TestScenarios    : array of BRDTestScenario;
}

/* Input payload structure for AddProjectSprintSessionDocBRDSummaryV2 */
type BRDInput {
  BRDSummary       : LargeString;
  TestScenarios    : array of BRDTestScenario;
  UncoveredSections: array of BRDUncoveredSection;
}

/* Simple result shape for BRD V2 (you can extend if needed) */
type BRDResult {
  addProjectBRDSummary : LargeString;
  TestScenarios        : array of String(100);
  UncoveredSections    : array of String(100);
  error                : String(1000);
}
/* -------- Types for GetProjectSprintSessionDocBRDSummaryPaginationFilterSearch -------- */

type BRDSummaryRow {
  ClientId     : String(25);
  ProjectId    : String(25);
  SprintId     : String(25);
  SessionId    : String(25);
  DocumentId   : String(100);
  BRDSummaryId : String(100);
  BRDSummary   : LargeString;
  SortKey      : Integer;
  Status       : Integer;
  CreatedDate  : Timestamp;
  ModifiedDate : Timestamp;
}

type TestStrategyRow {
  ClientId       : String(25);
  ProjectId      : String(25);
  SprintId       : String(25);
  SessionId      : String(25);
  DocumentId     : String(100);
  TestStrategyId : String(100);
  TestStrategy   : LargeString;
  TestTypes      : LargeString;
  TestEnvironment: LargeString;
  SortKey        : Integer;
  Status         : Integer;
  CreatedDate    : Timestamp;
  ModifiedDate   : Timestamp;
}

type ImpactAnalysisRow {
  ClientId        : String(25);
  ProjectId       : String(25);
  SprintId        : String(25);
  SessionId       : String(25);
  DocumentId      : String(100);
  ImpactAnalysisId: String(100);
  Impact          : LargeString;
  AffectedSystems : LargeString;
  Stakeholders    : LargeString;
  ImpactLevel     : LargeString;
  Justification   : LargeString;
  Description     : LargeString;
  SortKey         : Integer;
  Status          : Integer;
  CreatedDate     : Timestamp;
  ModifiedDate    : Timestamp;
}

type UncoveredSectionRow {
  ClientId       : String(25);
  BusinessUnitId : String(25);
  ProjectId      : String(25);
  SprintId       : String(25);
  SessionId      : String(25);
  DocumentId     : String(100);
  DocSectionId   : String(100);
  SectionTitle   : LargeString;
  SectionContent : LargeString;
  SortKey        : Integer;
  Status         : Integer;
  CreatedDate    : Timestamp;
  ModifiedDate   : Timestamp;
}


type BRDSummaryPageResponse {
  BRDSummary        : array of BRDSummaryRow;
  TestStrategy      : array of TestStrategyRow;
  ImpactAnalysis    : array of ImpactAnalysisRow;
  UncoveredSections : array of UncoveredSectionRow;
}



/* ----------------- Types for GetMappedProjectSprintClientSubProcessesProjectSprintV4 ----------------- */
type SubProcessAppTransaction {
  TransactionId             : String(50);
  ApplicationId             : String(50);
  ApplicationName           : String(255);
  Transaction          : String(255);
  TransactionCode           : String(255);
  selected                  : Boolean;
  ProjectSprintTransactionId: String(100);
}

type ApplicationInfo {
  ApplicationId   : String(50);
  ApplicationName : String(255);
  Transactions    : array of SubProcessAppTransaction;
  Features        : array of LargeString;
  Programs        : array of LargeString;
  selected        : Boolean;
  indeterminate   : Boolean;
}

type IntegrationInfo {
  IntegrationId                     : String(50);
  IntegrationName                   : String(255);
  selected                          : Boolean;
  ProjectSprintProcessIntegrationId : String(100);
}

/* lightweight child node (no SubProcesses) */
type SubProcessNodeRef {
  BusinessSubProcessId   : String(50);
  BusinessSubProcessName : String(255);
  Description            : LargeString;
  ProjectSprintProcessId : String(100);
  selected               : Boolean;
  indeterminate          : Boolean;
  Applications           : array of ApplicationInfo;
  Integrations           : array of IntegrationInfo;
}

/* full node used at top-level only; its children are SubProcessNodeRef */
type SubProcessNode {
  BusinessSubProcessId   : String(50);
  BusinessSubProcessName : String(255);
  Description            : LargeString;
  ProjectSprintProcessId : String(100);
  selected               : Boolean;
  indeterminate          : Boolean;
  Applications           : array of ApplicationInfo;
  Integrations           : array of IntegrationInfo;
  SubProcesses           : array of SubProcessNodeRef; 
}
type BusinessProcessInfo {
  BusinessProcessId    : String(50);
  BusinessProcessName  : String(255);
  ClientId             : String(25);
  BusinessUnitId       : String(25);
  ProjectId            : String(50);
  SprintId             : String(50);
  SubProcesses         : array of SubProcessNode;
  selected             : Boolean;
  indeterminate        : Boolean;
}

type GetMappedBPResult {
  ClientId         : String(25);
  BusinessUnitId   : String(25);
  BusinessProcesses: array of BusinessProcessInfo;
}

/* ----------------- Types for AddUpdateProjectSprintSessionDocuments result ----------------- */
type DocumentAddResult {
  DocumentId  : String(100);
  InputFileURL: String(600);
}
type DocumentUpdateResult {
  ClientId   : String(25);
  ProjectId  : String(25);
  SprintId   : String(25);
  SessionId  : String(25);
  DocumentId : String(100);
  // additional columns may be present; LargeString to avoid strictness
  data       : LargeString;
}

type AddUpdateDocsResult {
  addProjectSprintSessionDocs           : array of DocumentAddResult;
  updateProjectSprintSessionDocs        : array of DocumentUpdateResult;
  addProjectSprintSessionDocs_error     : array of LargeString;
  updateProjectSprintSessionDocs_error  : array of LargeString;
  general_error                         : LargeString;
}

/* ----------------- Types for AddUpdateProjectSprintSession (single session) result ----------------- */
type SessionInsertResult {
  SessionId : String(100);
}
type SessionUpdateResult {
  ClientId   : String(25);
  ProjectId  : String(25);
  SprintId   : String(25);
  SessionId  : String(25);
  SessionStatus : String(255);
  StatusInfo    : String(455);
  ElapsedTime   : String(200);
  Progress      : String(50);
  SortKey       : Integer;
  Status        : Integer;
  ModifiedDate  : Timestamp;
}

type AddUpdateSessionResult {
  addProjectSprintSessionDocs           : array of SessionInsertResult;
  updateProjectSprintSessionDocs        : array of SessionUpdateResult;
  addProjectSprintSessionDocs_error     : array of LargeString;
  updateProjectSprintSessionDocs_error  : array of LargeString;
  general_error                         : LargeString;
}

/* ========================= 1) Client Projects ========================= */
service ClientProjectsService @(path : '/client-projects') {
    function GetClientProjects() returns ListResponse;
    action GetClientProjectsPaginationFilterSearch(
        search : String,
        SearchString:String,
        page : Integer,
        pageSize : Integer,
        ClientId : String(25),
        BusinessUnitId : String(25),
        ProjectId : String(25),
        Status : Integer,
        StartDate  : String,
        EndDate    : String 
    ) returns ListResponse;
    function GetClientProjectsCountFilter(
        search : String,
        ClientId : String(25),
        BusinessUnitId : String(25),
        ProjectId : String(25),
        Status : Integer,
        FromDate : Timestamp,
        ToDate : Timestamp
    ) returns ListResponse;
    action AddUpdateClientProjects(
        ClientId : String(25),
        ProjectId : UUID255,
        ProjectName : String(255),
        BusinessUnitId : String(25),
        StartDate : String(100),
        EndDate : String(100),
        ProjectTypeId : String(25),
        Description : LargeString,
        Status : Integer
    ) returns MessageOnly;
    action DeleteClientProjects(ClientId : String(25), ProjectId : UUID255) returns MessageOnly;

    action GetClientProjectsByClientId(
        ClientId : String(25),
        BusinessUnitId : String(25)
    ) returns ListResponse;

    type SprintInfo {
      SprintId   : String(50);
      SprintName : String(255);
    }

    type ProjectWithSprints {
      ClientId         : String(50);
      BusinessUnitId   : String(50);
      ProjectId        : String(50);
      ProjectName      : String(255);
      BusinessUnitName : String(255);
      Sprints          : array of SprintInfo;
    }

    type GetClientProjectsWithSprintsResponse {
      status       : String(20);
      ResponseData : array of ProjectWithSprints;
      message      : String(255);
    }
    action GetClientProjectsWithSprints(
        ClientId       : String(50),
        BusinessUnitId : String(50),
        ProjectId      : String(50)
    ) returns GetClientProjectsWithSprintsResponse;
    
    action GetClientProjectsWithFolders(
      ClientId     : String(25),
      BusinessUnitId : String(25)
    ) returns {
      status       : String;
      ResponseData : LargeString;
    }
}

/* ====================== 2) Client Project Sprint ====================== */
service ClientProjectSprintService @(path : '/client-project-sprint') {
    function GetClientProjectSprint() returns ListResponse;
    function GetClientProjectSprintPaginationFilterSearch(
        search : String,
        page : Integer,
        pageSize : Integer,
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        Status : Integer,
        StartDate : String,
        EndDate : String
    ) returns ListResponse;
    function GetClientProjectSprintCountFilter(
        search : String,
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        Status : Integer,
        FromDate : Timestamp,
        ToDate : Timestamp
    ) returns ListResponse;
    action AddUpdateClientProjectSprint(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SprintName : String(500),
        StartDate : String(150),
        EndDate : String(150),
        InputFileURL : String(600),
        MarkdownFileURL : String(600),
        DataParseStatus : String(50),
        Status : Integer
    ) returns MessageOnly;
    action DeleteClientProjectSprint(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25)
    ) returns MessageOnly;
}

/* ===================== 3) Client Project Sessions ===================== */
service ClientProjectSessionsService @(path : '/client-project-sessions') {
    function GetClientProjectSessions() returns ListResponse;
    function GetClientProjectSessionsPaginationFilterSearch(
        search : String,
        page : Integer,
        pageSize : Integer,
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        Status : Integer,
        FromDate : Timestamp,
        ToDate : Timestamp
    ) returns ListResponse;
    function GetClientProjectSessionsCountFilter(
        search : String,
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        Status : Integer,
        FromDate : Timestamp,
        ToDate : Timestamp
    ) returns ListResponse;

    action GetProjectSprintSessions(
            ClientId : String(50),
            ProjectId : String(50),
            SprintId : String(50),
            BusinessUnitId : String(50),
            SourceType : String(255),
            BusinessProcessId : String(50),
            BusinessSubProcessId : String(50),
            SearchString : String,
            PageNo : Integer,
            StartDate : String,
            EndDate : String
        ) returns ListResponse;
    function GetProjectSprintSessionsPaginated(PageNo : Integer) returns ListResponse;

    action AddUpdateClientProjectSessions(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        SessionStatus : String(255),
        StatusInfo : String(455),
        ElapsedTime : String(200),
        Progress : String(50),
        Status : Integer
    ) returns MessageOnly;
    action DeleteClientProjectSessions(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25)
    ) returns MessageOnly;
}

/* ======================== 4) Project BRD Summary ====================== */
service ProjectBRDSummaryService @(path : '/project-brd-summary') {
    function GetProjectBRDSummary() returns ListResponse;
    function GetProjectBRDSummaryPaginationFilterSearch(
        page : Integer,
        pageSize : Integer,
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100)
    ) returns ListResponse;
    function GetProjectBRDSummaryCountFilter(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100)
    ) returns ListResponse;
    action AddUpdateProjectBRDSummary(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100),
        BRDSummaryId : String(100),
        BRDSummary : LargeString,
        SortKey : Integer,
        Status : Integer
    ) returns MessageOnly;
    action DeleteProjectBRDSummary(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100),
        BRDSummaryId : String(100)
    ) returns MessageOnly;
}

/* =================== 5) Project Business Requirements ================= */
service ProjectBusinessRequirementsService @(
    path : '/project-business-requirements'
) {
    function GetProjectBusinessRequirements() returns ListResponse;
    function GetProjectBusinessRequirementsPaginationFilterSearch(
        page : Integer,
        pageSize : Integer,
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100)
    ) returns ListResponse;
    function GetProjectBusinessRequirementsCountFilter(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100)
    ) returns ListResponse;
    action AddUpdateProjectBusinessRequirements(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100),
        BusinessRequirementId : String(100),
        RequirementName : LargeString,
        RequirementValue : LargeString,
        SortKey : Integer,
        Status : Integer
    ) returns MessageOnly;
    action DeleteProjectBusinessRequirements(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100),
        BusinessRequirementId : String(100)
    ) returns MessageOnly;
}

/* =================== 6) Project Client Sub-Process ==================== */
service ProjectClientSubProcessService @(path : '/project-client-sub-process') {
    function GetProjectClientSubProcess() returns ListResponse;
    function GetProjectClientSubProcessPaginationFilterSearch(
        page : Integer,
        pageSize : Integer,
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100)
    ) returns ListResponse;
    function GetProjectClientSubProcessCountFilter(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100)
    ) returns ListResponse;
    action AddUpdateProjectClientSubProcess(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100),
        DocSectionId : String(100),
        SectionTitle : LargeString,
        SectionContent : LargeString,
        SortKey : Integer,
        Status : Integer
    ) returns MessageOnly;
    action DeleteProjectClientSubProcess(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100),
        DocSectionId : String(100)
    ) returns MessageOnly;
}

/* ======================= 7) Project Impact Analysis =================== */
service ProjectImpactAnalysisService @(path : '/project-impact-analysis') {
    function GetProjectImpactAnalysis() returns ListResponse;
    function GetProjectImpactAnalysisPaginationFilterSearch(
        page : Integer,
        pageSize : Integer,
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100)
    ) returns ListResponse;
    function GetProjectImpactAnalysisCountFilter(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100)
    ) returns ListResponse;
    action AddUpdateProjectImpactAnalysis(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100),
        ImpactAnalysisId : String(100),
        Impact : LargeString,
        AffectedSystems : LargeString,
        Stakeholders : LargeString,
        ImpactLevel : LargeString,
        Justification : LargeString,
        Description : LargeString,
        SortKey : Integer,
        Status : Integer
    ) returns MessageOnly;
    action DeleteProjectImpactAnalysis(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100),
        ImpactAnalysisId : String(100)
    ) returns MessageOnly;
}

/* =================== 8) Project Session Files (Documents) ============= */
service ProjectSessionFilesService @(path : '/project-session-files') {
    function GetProjectSessionFiles() returns ListResponse;
    function GetProjectSessionFilesPaginationFilterSearch(
        page : Integer,
        pageSize : Integer,
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25)
    ) returns ListResponse;
    function GetProjectSessionFilesCountFilter(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25)
    ) returns ListResponse;

    function GetSessionFilesDropdown(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25)
    ) returns ListResponse;
    function GetDocumentNamesForDropdown(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25)
    ) returns ListResponse;
    function GetDocumentMarkdownFile(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100)
    ) returns ListResponse;
    function DownloadFile(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100)
    ) returns ListResponse;

    action AddUpdateProjectSessionFiles(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100),
        DocumentName : String(500),
        InputFileURL : String(600),
        MarkdownFileURL : String(600),
        LLMEngine : String(200),
        SourceType : String(265),
        StoryId : String(499),
        SessionStatus : String(255),
        StatusInfo : String(455),
        ElapsedTime : String(200),
        Progress : String(50),
        Status : Integer
    ) returns MessageOnly;
    action DeleteProjectSessionFiles(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100)
    ) returns MessageOnly;
    action UpdateClientProjectSessionDocumentMarkdown(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100),
        MarkdownFileURL : String(600)
    ) returns MessageOnly;
}

/* ======== 9) Project Sprint Selected Test Requirements (Flags) ======== */
service ProjectSprintSelectedTestRequirementsService @(
    path : '/project-sprint-selected-test-requirements'
) {
    function GetProjectSprintSelectedTestRequirements(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100)
    ) returns ListResponse;
    function GetProjectSprintSelectedTestRequirementsPaginationFilterSearch(
        page : Integer,
        pageSize : Integer,
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100)
    ) returns ListResponse;
    action AddUpdateProjectSprintSelectedTestRequirements(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100),
        TestScenarioId : String(100),
        FlagStatus : String
    ) returns MessageOnly;
    action DeleteProjectSprintSelectedTestRequirements(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100),
        TestScenarioId : String(100)
    ) returns MessageOnly;
}
service ProjectSprintSessionDocsServices @(
    path : '/cognito/api'
){ 
    //AddUpdateProjectSprintSessionDocuments
    type LLMConfigPayload {
      value         : String(100);
      label         : String(255);
      LLMId         : String(100);
      EngineName    : String(255);
      APIURL        : String(600);
      APIKEY        : LargeString;
      PromptVersion : String(50);
      DefaultFlag   : String(10);
      Description   : LargeString;
      SortKey       : Integer;
      Status        : Integer;
      CreatedDate   : Timestamp;
      ModifiedDate  : Timestamp;
    }

    type DocumentInput {
      ClientId       : String(25);
      ProjectId      : String(25);
      SprintId       : String(25);
      SessionId      : String(25);
      WorkspaceId    : String(50);
      BusinessUnitId : String(50);
      LLMConfig      : LLMConfigPayload;
      DocumentId     : String(100);
      DocumentName   : String(500);
      InputFileURL   : String(600);
      MarkdownFileURL: String(600);
      LLMEngine      : String(200);
      SourceType     : String(265);
      StoryId        : String(499);
      SessionStatus  : String(255);
      StatusInfo     : String(455);
      ElapsedTime    : String(200);
      Progress       : String(50);
      Status         : Integer;
      SortKey        : Integer;
    }

    action AddUpdateProjectSprintSessionDocuments(
        Documents : array of DocumentInput
    ) returns AddUpdateDocsResult;

//AddProjectSprintSessionDocBRDSummary (legacy shape)
   action AddProjectSprintSessionDocBRDSummary(
      ClientId       : String(25),
      ProjectId      : UUID255,
      SprintId       : UUID255,
      SessionId      : UUID255,
      DocumentId     : UUID100,
      BusinessUnitId : String(50),
      WorkspaceId    : String(50),
      LLMConfig      : LLMConfigPayload,
      LLMEngine      : String(200),
      SourceType     : String(265),
      StoryId        : String(499),
      SessionStatus  : String(255),
      StatusInfo     : String(455),
      ElapsedTime    : String(200),
      Progress       : String(50),
      DataParseStatus: String(50),
      InputFilePath  : String(600),
      MarkdownFileURL: String(600),
      InputFileURL   : String(600),
      authentication : String,
      Data           : BRDInputLegacy
    ) returns LargeString;

//UpdateClientProjectSessionsDocumentParseStatus

     action UpdateClientProjectSessionsDocumentParseStatus(
    ClientId     : String(25),
    ProjectId    : String(25),
    SprintId     : String(25),
    SessionId    : String(25),
    DocumentId   : String(100),
    BusinessUnitId : String(50),
    SessionStatus  : String(255),
    StatusInfo     : String(455),
    ElapsedTime    : String(200),
    Progress       : String(50),
    DataParseStatus : String(50),
    authentication : String
  ) returns MessageOnly;

//AddProjectSprintSessionDocBRDSummaryV2

   action AddProjectSprintSessionDocBRDSummaryV2(
      ClientId       : String(25),
      ProjectId      : UUID255,
      SprintId       : UUID255,
      SessionId      : UUID255,
      DocumentId     : UUID100,
      BusinessUnitId : String(25),
      Data           : BRDInput
    ) returns BRDResult;

 action GetProjectSprintSessionDocBRDSummaryPaginationFilterSearch(
    PageNo       : Integer,
    SearchString : String,
    ClientId     : String(25),
    ProjectId    : String(25),
    SprintId     : String(25),
    SessionId    : String(25),
    DocumentId   : String(100)
  ) returns BRDSummaryPageResponse;


}

/* ========== 10) Project Sprint Session Docs (+ session helpers) ======= */
service ProjectSprintSessionDocsService @(
    path : '/project-sprint-session-docs'
) {
    function GetProjectSprintSessionDocs(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25)
    ) returns ListResponse;
    function GetProjectSprintSessionDocsPaginationFilterSearch(
        page : Integer,
        pageSize : Integer,
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25)
    ) returns ListResponse;
    function GetProjectSprintDocuments(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25)
    ) returns ListResponse;
    function CheckDocumentScenariosByName(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentName : String
    ) returns ListResponse;

    action AddUpdateProjectSprintSession(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        InputFileURL: String(600),
        MarkdownFileURL: String(600),
        SessionStatus : String(255),
        StatusInfo : String(455),
        ElapsedTime : String(200),
        Progress : String(50),
        SortKey : Integer, 
        Status : Integer,
        InputDoc       : array of String
    ) returns AddUpdateSessionResult;


    action AddUpdateProjectSprintSessionDocs(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100),
        Section : String(255),
        Payload : LargeString,
        SortKey : Integer,
        Status : Integer
    ) returns MessageOnly;

    action UpdateClientProjectSessionsMarkdownFiles(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        MarkdownFileURL : String(600)
    ) returns MessageOnly;
    action UpdateClientProjectSessionDocumentMarkdown(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100),
        MarkdownFileURL : String(600)
    ) returns MessageOnly;
    action UpdateClientProjectSessionInputFile(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        InputFileURL : String(600)
    ) returns MessageOnly;

  
    action DeleteProjectSprintSessionDocs(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100)
    ) returns MessageOnly;
    action DeleteProjectSprintSessions(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25)
    ) returns MessageOnly;

     action GetMappedProjectSprintClientSubProcessesProjectSprintV4(
    ClientId      : String(25),
    BusinessUnitId: String(25),
    ProjectId     : String(50),
    SprintId      : String(50),
    PageNo : Integer,
    SearchString:String,
    ParentSubProcessId : String(50)
  ) returns GetMappedBPResult;  // changed from LargeString to structured result

action GetProjectSprintSessionDocScenarios(
    ClientId     : String(25),
    ProjectId    : String(25),
    SessionId    : String(25),
    DocumentId   : String(100),
    FlagType     : String(50),
    SearchString : String,
    PageNo       : Integer,
    StartDate    : String,
    EndDate      : String
  ) returns ListResponse;
}


/* =================== 11) Project Validation Component ================= */
service ProjectValidationComponentService @(
    path : '/project-validation-component'
) {
    function GetProjectValidationComponent(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100)
    ) returns ListResponse;
    function GetProjectValidationComponentPaginationFilterSearch(
        page : Integer,
        pageSize : Integer,
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100)
    ) returns ListResponse;
    function GetProjectValidationComponentCountFilter(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100)
    ) returns ListResponse;
    action AddUpdateProjectValidationComponent(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100),
        TestScenarioId : String(100),
        TestCaseId : String(100),
        Component : String(100),
        TestType : String(100),
        TestingLevel : String(100),
        Status : Integer
    ) returns MessageOnly;
    action DeleteProjectValidationComponent(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100),
        TestCaseId : String(100)
    ) returns MessageOnly;
}

/* ==================== 12) Project Summary Requirements ================= */
service SummaryRequirementsService @(path : '/summary-requirements') {
    function GetSummaryRequirements(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100)
    ) returns ListResponse;
    function GetSummaryRequirementsPaginationFilterSearch(
        page : Integer,
        pageSize : Integer,
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100)
    ) returns ListResponse;
    function GetSummaryRequirementsCountFilter(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100)
    ) returns ListResponse;
    action AddUpdateSummaryRequirements(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100),
        BRDSummaryId : String(100),
        BRDSummary : LargeString,
        Status : Integer
    ) returns MessageOnly;
    action DeleteSummaryRequirements(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100),
        BRDSummaryId : String(100)
    ) returns MessageOnly;
}

/* ===================== 13) Project Test Requirements =================== */
service TestRequirementsService @(path : '/test-requirements') {
    function GetTestRequirements(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100)
    ) returns ListResponse;
    function GetTestRequirementsPaginationFilterSearch(
        page : Integer,
        pageSize : Integer,
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100)
    ) returns ListResponse;
    function GetTestRequirementsCountFilter(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100)
    ) returns ListResponse;
    function GetTestRequirementsDropdown(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100)
    ) returns ListResponse;
    action AddUpdateTestRequirements(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100),
        TestScenarioId : String(100),
        TestScenarioName : LargeString,
        Priority : String(100),
        AcceptanceCriteria : LargeString,
        FlagStatus : String,
        Status : Integer
    ) returns MessageOnly;
    action DeleteTestRequirements(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100),
        TestScenarioId : String(100)
    ) returns MessageOnly;
}

/* ======================== 14) Project Test Strategy ==================== */
service TestStrategyService @(path : '/test-strategy') {
    function GetTestStrategy(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100)
    ) returns ListResponse;
    function GetTestStrategyPaginationFilterSearch(
        page : Integer,
        pageSize : Integer,
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100)
    ) returns ListResponse;
    function GetTestStrategyCountFilter(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100)
    ) returns ListResponse;
    action AddUpdateTestStrategy(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100),
        TestStrategyId : String(100),
        TestStrategy : LargeString,
        TestTypes : LargeString,
        TestEnvironment : LargeString,
        Status : Integer
    ) returns MessageOnly;
    action DeleteTestStrategy(
        ClientId : String(25),
        ProjectId : String(25),
        SprintId : String(25),
        SessionId : String(25),
        DocumentId : String(100),
        TestStrategyId : String(100)
    ) returns MessageOnly;
}

/* ======================== 15) Prompt Version Master ==================== */
service PromptVersionMasterService @(path : '/prompt-version-master') {
    function GetPromptVersionMaster(TestScenarioId : String(25)) returns ListResponse;
    function GetPromptVersionMasterPaginationFilterSearch(
        page : Integer,
        pageSize : Integer,
        TestScenarioId : String(25)
    ) returns ListResponse;
    function GetPromptVersionMasterCountFilter(TestScenarioId : String(25)) returns ListResponse;
    action AddUpdatePromptVersionMaster(
        TestScenarioId : String(25),
        VersionId : String(25),
        Prompt : LargeString
    ) returns MessageOnly;
    action DeletePromptVersionMaster(
        TestScenarioId : String(25),
        VersionId : String(25)
    ) returns MessageOnly;
}
/* ======================== 16) getprojecttype ==================== */
service Project @(path : '/getproject') {
    
    action GetProjectTypesMaster(
        SearchString : String
    ) returns {
        ResponseData : LargeString;
        fetchRecordsFromProjectTypesMaster_error : String;
    };
}