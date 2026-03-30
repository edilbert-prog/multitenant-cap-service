using { managed } from '@sap/cds/common';


/* ===== Tenants===== */
entity Tenants : managed {
  key tenantId : String(50);
  subdomain    : String(255);
  status       : String(50);
  plan         : String(50);
}


/* ===== CONNECTIONS / LLM ===== */
entity AdaptersMaster : managed {
  key AdapterId    : String(64);
  TenantId           : String(50);
  HostName         : String(455);
  BaseURL          : LargeString;
  Email            : String(455);
  APIToken         : LargeString;
};

/* ===== GEO MASTERS ===== */
entity Countries : managed {
  key CountryId     : String(25);
  TenantId          : String(50);
  CountryName       : String(100);
  iso3              : String(3);
  iso2              : String(2);
  phonecode         : String(255);
  capital           : String(255);
  currency          : String(255);
  currency_symbol   : String(255);
  tld               : String(255);
  native            : String(255);
  region            : String(255);
  subregion         : String(255);
  timezones         : LargeString;
  translations      : LargeString;
  latitude          : String;
  longitude         : String;
  emoji             : String(191);
  emojiU            : String(191);
  flag              : Integer;
  wikiDataId        : String(255);
};
entity States : managed {
  key StateId     : String(25);
  TenantId        : String(50);
  StateName       : String(255);
  CountryId       : String(11);
  country_code    : String(2);
  fips_code       : String(255);
  iso2            : String(255);
  latitude        : String;
  longitude       : String;
  flag            : Integer;
  wikiDataId      : String(255);

  to_Country : Association to Countries
      on to_Country.CountryId = $self.CountryId;
};
entity Cities : managed {
  key CityId     : String(25);
  TenantId       : String(50);
  CityName       : String(255);
  StateId        : String(25);
  state_code     : String(255);
  CountryId      : String(25);
  country_code   : String(5);
  latitude       : String;
  longitude      : String;
  flag           : Integer;
  wikiDataId     : String(255);

  to_State   : Association to States
      on to_State.StateId = $self.StateId;

  to_Country : Association to Countries
      on to_Country.CountryId = $self.CountryId;
};

/* ===== CLIENTS / BU ===== */
entity ClientsMaster : managed {
  key ClientId     : String(25);
  TenantId         : String(50);
  ClientName       : String(255);
  IndustryType     : String(100);
  CompanyIdERP     : String(255);
  CountryId        : String(25);
  StateId          : String(25);
  CityId           : String(25);
  CountryCode      : String(25);
  Contact          : String(50);
  Email            : String(255);
  Address1         : LargeString;
  Address2         : LargeString;
  Zip              : LargeString;
  Description      : LargeString;
  SortKey          : Integer;
  Status           : Integer;
  to_City    : Association to Cities on to_City.CityId = $self.CityId;
};

entity BusinessUnitMasterV2 : managed {
  key BusinessUnitId : String(25);
  BusinessUnitName   : String(255);
  key ClientId       : String(50);
  TenantId           : String(50);
  CompanyCodeERP     : String(255);
  CountryId          : String(25);
  StateId            : String(25);
  CityId             : String(25);
  CountryCode        : String(25);
  Contact            : String(50);
  key Email          : String(255);
  Address1           : LargeString;
  Address2           : LargeString;
  Zip                : LargeString;
  Description        : LargeString;
  SortKey            : Integer;
  Status             : Integer;
  to_City : Association to Cities on to_City.CityId = $self.CityId;
};

entity ClientProjects : managed {
  key ClientId     : String(25);
  key ProjectId    : String(255);
  TenantId         : String(50);
  ProjectName      : String(255);
  BusinessUnitId   : String(25);
  StartDate        : String(100);
  EndDate          : String(100);
  ProjectTypeId    : String(25);
  Description      : LargeString;
  SortKey          : Integer;
  Status           : Integer;
  to_BusinessUnit : Association to BusinessUnitMasterV2 on to_BusinessUnit.BusinessUnitId = $self.BusinessUnitId;
};

entity ProjectTypesMaster : managed {
  key ProjectTypeId : String(25);
  TenantId          : String(50);
  ProjectType       : String(255);
  SortKey           : Integer;
  Status            : Integer;
};

entity ClientProjectSprint : managed {
  key ClientId        : String(25);
  key ProjectId       : String(25);
  key SprintId        : String(25);
   TenantId           : String(50);
  SprintName          : String(500);
  StartDate           : String(150);
  EndDate             : String(150);
  InputFileURL        : String(600);
  MarkdownFileURL     : String(600);
  DataParseStatus     : String(50);
  SortKey             : Integer;
  Status              : Integer;
  to_Client : Association to ClientsMaster on to_Client.ClientId = $self.ClientId;
};

/* ===== APPLICATIONS / TX ===== */
entity ApplicationsMaster : managed {
  key ApplicationId : String(25);
   TenantId           : String(50);
  ApplicationName   : String(255);
  Description       : LargeString;
  SortKey           : Integer;
  Status            : Integer;
};

entity TransactionsMaster : managed {
  key TransactionId   : String(30);
  Transaction         : String(555);
  Transactionname         : String(555);
  key TransactionCode : String(60);
  Description         : LargeString;
  BusinessProcessId        : String(30);
  BusinessSubProcessId     : String(30);
  ApplicationId            : String(30);
  SortKey             : Integer;
  Status              : Integer;
};

/* ===== SESSIONS / DOCS ===== */
entity ProjectSprintSessions : managed {
  key ClientId   : String(25);
  key ProjectId  : String(25);
  key SprintId   : String(25);
  key SessionId  : String(25);
  TenantId           : String(50);
  SessionStatus  : String(255);
  StatusInfo     : String(455);
  ElapsedTime    : String(200);
  Progress       : String(50);
  SortKey        : Integer;
  Status         : Integer;
  to_Sprint : Association to ClientProjectSprint
    on to_Sprint.ClientId = $self.ClientId and to_Sprint.ProjectId = $self.ProjectId and to_Sprint.SprintId = $self.SprintId;
};

entity ProjectSprintSessionDocument : managed {
  key ClientId     : String(25);
  key ProjectId    : String(25);
  key SprintId     : String(25);
  key SessionId    : String(25);
  key DocumentId   : String(100);
  TenantId         : String(50);
  DocumentName     : String(500);
  InputFileURL     : String(600);
  MarkdownFileURL  : String(600);
  SessionStatus    : String(255);
  DataParseStatus  : String(100); 
  StatusInfo       : String(455);
  LLMEngine        : String(200);
  SourceType       : String(265);
  StoryId          : String(499);
  ElapsedTime      : String(200);
  Progress         : String(50);
  SortKey          : Integer;
  Status           : Integer;
  to_Session : Association to ProjectSprintSessions
    on  to_Session.ClientId = $self.ClientId and to_Session.ProjectId = $self.ProjectId
    and to_Session.SprintId = $self.SprintId and to_Session.SessionId = $self.SessionId;
};

entity ProjectSprintSessionDocBRDSummary : managed {
  key ClientId     : String(25);
  key ProjectId    : String(25);
  key SprintId     : String(25);
  key SessionId    : String(25);
  key DocumentId   : String(25);
  key BRDSummaryId : String(25);
  TenantId           : String(50);
  BRDSummary       : LargeString;
  SortKey          : Integer;
  Status           : Integer;
  to_Doc : Association to ProjectSprintSessionDocument
    on  to_Doc.ClientId = $self.ClientId and to_Doc.ProjectId = $self.ProjectId
    and to_Doc.SprintId = $self.SprintId and to_Doc.SessionId = $self.SessionId and to_Doc.DocumentId = $self.DocumentId;
};

entity ProjectSprintSessionDocImpactAnalysis : managed {
  key ClientId         : String(25);
  key ProjectId        : String(25);
  key SprintId         : String(25);
  key SessionId        : String(25);
  key DocumentId       : String(25);
  key ImpactAnalysisId : String(25);
  TenantId           : String(50);
  Impact               : LargeString;
  impactedescription   : LargeString;
  AffectedSystems      : LargeString;
  Stakeholders         : LargeString;
  ImpactLevel          : LargeString;
  Justification        : LargeString;
  Description          : LargeString;
  SortKey              : Integer;
  Status               : Integer;
  to_Doc : Association to ProjectSprintSessionDocument
    on  to_Doc.ClientId = $self.ClientId and to_Doc.ProjectId = $self.ProjectId
    and to_Doc.SprintId = $self.SprintId and to_Doc.SessionId = $self.SessionId and to_Doc.DocumentId = $self.DocumentId;
};

entity ProjectSprintSessionDocMissedSections : managed {
  key ClientId     : String(25);
  key ProjectId    : String(25);
  key SprintId     : String(25);
  key SessionId    : String(25);
  key DocumentId   : String(25);
  key DocSectionId : String(25);
  TenantId           : String(50);
  BusinessUnitId   : String(25); 
  SectionTitle     : LargeString;
  SectionContent   : LargeString;
  SortKey          : Integer;
  Status           : Integer;
  to_Doc : Association to ProjectSprintSessionDocument
    on  to_Doc.ClientId = $self.ClientId and to_Doc.ProjectId = $self.ProjectId
    and to_Doc.SprintId = $self.SprintId and to_Doc.SessionId = $self.SessionId and to_Doc.DocumentId = $self.DocumentId;
};

entity ProjectSprintSessionDocTestScenarios : managed {
  key ClientId       : String(25);
  key ProjectId      : String(25);
  key SprintId       : String(25);
  key SessionId      : String(25);
  key DocumentId     : String(25);
  key TestScenarioId : String(25);
  TenantId           : String(50);
  VersionId          : String(25);
  TestScenarioName   : LargeString;
  TestScenarioStatus : LargeString;
  SectionTitle       : LargeString;
  SectionContent     : LargeString;
  Description        : LargeString;
  Priority           : String(100);
  DocTraceabilitySources      : LargeString;
  ScenarioTraceabilitySources : LargeString;
  BusinessLogic      : LargeString;
  RelatedTCodes      : LargeString;
  AcceptanceCriteria : LargeString;
  FlagStatus         : String default 'No';
  SortKey            : Integer;
  Status             : Integer;
  to_Doc : Association to ProjectSprintSessionDocument
    on  to_Doc.ClientId = $self.ClientId and to_Doc.ProjectId = $self.ProjectId
    and to_Doc.SprintId = $self.SprintId and to_Doc.SessionId = $self.SessionId and to_Doc.DocumentId = $self.DocumentId;
};

entity CoreDynamicTableIds : managed {
  key ModuleName     : String(100);
  key SubModuleName  : String(100);
  Prefix             : String(50);
  Suffix             : String(50);
  SequenceNo         : Integer;
  TenantId           : String(50);
};

entity ProjectSprintSessionDocTestCases : managed {
  key ClientId       : String(25);
  key ProjectId      : String(25);
  key SprintId       : String(25);
  key SessionId      : String(25);
  key DocumentId     : String(25);
  key TestScenarioId : String(25);
  key TestCaseId     : String(25);
  VersionId          : String(25);
  TenantId           : String(50);
  TestCase           : LargeString;
  PreConditions      : LargeString;
  ExpectedResult     : LargeString;
  ActualResult       : LargeString;
  Priority           : String(100);
  TestType           : String(100);
  TestingLevel       : String(100);
  TransactionCode    : String(255);
  FlagStatus         : String default 'No';
  Module             : String(100);
  ExecutionDate      : String(100);
  TestedBy           : String(100);
  TestStatus         : LargeString;
  Comments           : LargeString;
  TestData           : LargeString;
  TestSteps          : LargeString;
  SortKey            : Integer;
  Status             : Integer;
  to_Doc : Association to ProjectSprintSessionDocument
    on  to_Doc.ClientId = $self.ClientId and to_Doc.ProjectId = $self.ProjectId
    and to_Doc.SprintId = $self.SprintId and to_Doc.SessionId = $self.SessionId and to_Doc.DocumentId = $self.DocumentId;
};

entity ProjectSprintSessionDocTestStrategy : managed {
  key ClientId      : String(25);
  key ProjectId     : String(25);
  key SprintId      : String(25);
  key SessionId     : String(25);
  key DocumentId    : String(25);
  key TestStrategyId: String(25);
  TenantId           : String(50);
  TestStrategy      : LargeString;
  TestTypes         : LargeString;
  TestEnvironment   : LargeString;
  SortKey           : Integer;
  Status            : Integer;
};

entity ProjectSprintTransactionMaster : managed {
  key ClientId             : String(25);
  key BusinessUnitId       : String(25);
  key ProjectId            : String(25);
  key SprintId             : String(25);
  key BusinessProcessId    : String(25);
  key BusinessSubProcessId : String(25);
  key TransactionId        : String(30);
  TenantId           : String(50);
  Selected                 : Integer;
  ProjectSprintTransactionId : String(50);
};

entity ProjectSprintFeatureMaster : managed {
  key ClientId             : String(25);
  key BusinessUnitId       : String(25);
  key ProjectId            : String(25);
  key SprintId             : String(25);
  key BusinessProcessId    : String(25);
  key BusinessSubProcessId : String(25);
  key FeatureId            : String(25);
  TenantId           : String(50);
  Selected                 : Integer;
  ProjectSprintFeatureId   : String(50);
};

entity ProjectSprintProgramMaster : managed {
  key ClientId             : String(25);
  key BusinessUnitId       : String(25);
  key ProjectId            : String(25);
  key SprintId             : String(25);
  key BusinessProcessId    : String(25);
  key BusinessSubProcessId : String(25);
  key ProgramId            : String(25);
  TenantId           : String(50);
  Selected                 : Integer;
  ProjectSprintProgramId   : String(50);
};

entity ProjectSprintProcessIntegration : managed {
  key ClientId             : String(25);
  key BusinessUnitId       : String(25);
  key ProjectId            : String(25);
  key SprintId             : String(25);
  key BusinessProcessId    : String(25);
  key BusinessSubProcessId : String(25);
  key IntegrationId        : String(30);
   TenantId           : String(50);
  Selected                 : Integer;
  ProjectSprintProcessIntegrationId : String(50);
};

/* ===== TESTING KB ===== */
entity TestingTechniquesMaster : managed {
  key TestingTechniqueId : String(25);
   TenantId           : String(50);
  TestingTechnique       : String(500);
  Description            : LargeString;
  SortKey                : Integer;
  Status                 : Integer;
};

entity PromptVersionMaster : managed {
  key TestScenarioId : String(25);
  key VersionId      : String(25);
   TenantId           : String(50);
  Prompt             : LargeString;
};

/* ===== INCIDENTS ===== */
entity IncidentMaster : managed {
  key IncidentId        : String(25);
   TenantId           : String(50);
  Description           : LargeString;
  LoggedBy              : String(255);
  BP_SP                 : String(255);
  AssignedTo            : String(255);
  AddressedBy           : String(255);
  DateTime              : String(255);
  Solution              : LargeString;
  Incident              : String(255);
  IncidentType          : String(100);
  Score                 : String;
  ProcessDescription    : LargeString;
  SortKey               : Integer;
  Status                : Integer;
};

/* ===== OWNERSHIP (COMPOSITIONS) ===== */

extend entity ProjectSprintSessions {
  Documents : Composition of many ProjectSprintSessionDocument
    on  Documents.ClientId  = $self.ClientId
    and Documents.ProjectId = $self.ProjectId
    and Documents.SprintId  = $self.SprintId
    and Documents.SessionId = $self.SessionId;
}

extend entity ProjectSprintSessionDocument {
  BRDSummaries  : Composition of many ProjectSprintSessionDocBRDSummary
    on  BRDSummaries.ClientId   = $self.ClientId
    and BRDSummaries.ProjectId  = $self.ProjectId
    and BRDSummaries.SprintId   = $self.SprintId
    and BRDSummaries.SessionId  = $self.SessionId
    and BRDSummaries.DocumentId = $self.DocumentId;

  ImpactAnalyses : Composition of many ProjectSprintSessionDocImpactAnalysis
    on  ImpactAnalyses.ClientId   = $self.ClientId
    and ImpactAnalyses.ProjectId  = $self.ProjectId
    and ImpactAnalyses.SprintId   = $self.SprintId
    and ImpactAnalyses.SessionId  = $self.SessionId
    and ImpactAnalyses.DocumentId = $self.DocumentId;

  MissedSections : Composition of many ProjectSprintSessionDocMissedSections
    on  MissedSections.ClientId   = $self.ClientId
    and MissedSections.ProjectId  = $self.ProjectId
    and MissedSections.SprintId   = $self.SprintId
    and MissedSections.SessionId  = $self.SessionId
    and MissedSections.DocumentId = $self.DocumentId;

  TestScenarios : Composition of many ProjectSprintSessionDocTestScenarios
    on  TestScenarios.ClientId   = $self.ClientId
    and TestScenarios.ProjectId  = $self.ProjectId
    and TestScenarios.SprintId   = $self.SprintId
    and TestScenarios.SessionId  = $self.SessionId
    and TestScenarios.DocumentId = $self.DocumentId;

  TestCases : Composition of many ProjectSprintSessionDocTestCases
    on  TestCases.ClientId   = $self.ClientId
    and TestCases.ProjectId  = $self.ProjectId
    and TestCases.SprintId   = $self.SprintId
    and TestCases.SessionId  = $self.SessionId
    and TestCases.DocumentId = $self.DocumentId;

  TestStrategies : Composition of many ProjectSprintSessionDocTestStrategy
    on  TestStrategies.ClientId   = $self.ClientId
    and TestStrategies.ProjectId  = $self.ProjectId
    and TestStrategies.SprintId   = $self.SprintId
    and TestStrategies.SessionId  = $self.SessionId
    and TestStrategies.DocumentId = $self.DocumentId;
}

//client project folder
entity ClientProjectFolders : managed {
  key FolderId       : String(25);
  ClientId           : String(25);
  BusinessUnitId     : String(25);
  ProjectId          : String(255);
  FolderName         : String(500);
  ParentFolderId     : String(25);  
  SortKey            : Integer;
  Status             : Integer;
   TenantId           : String(50);      
};

/* ===== SUB PROCESS ===== */
entity ClientSubProcessMaster : managed { 
  key BusinessSubProcessId : String(25); 
  BusinessProcessId        : String(25); 
  ParentSubProcessId       : String(25); 
  ClientId                 : String(25); 
  BusinessUnitId           : String(25); 
  Status                   : Integer;
  TenantId              : String(50); 
} 

entity BusinessProcessMaster : managed { 
  key BusinessProcessId : String(25); 
  BusinessProcessName   : String(255); 
  TenantId              : String(50);
} 

entity BusinessProcessSubProcessMaster : managed { 
  key BusinessProcessId    : String(25); 
  key BusinessSubProcessId : String(25); 
  BusinessSubProcessName   : String(500); 
  Description              : LargeString; 
  Status                   : Integer; 
  SortKey                  : Integer;
  TenantId              : String(50);
} 
  
entity ProjectSprintSubProcessMaster : managed { 
  key ClientId             : String(25); 
  key BusinessUnitId       : String(25); 
  key BusinessProcessId    : String(25); 
  key BusinessSubProcessId : String(25); 
  key ProjectId            : String(25); 
  key SprintId             : String(25); 
  ProjectSprintProcessId   : String(50);
  projectsprintsubprocessid: String(50);
  TenantId              : String(50);
}
