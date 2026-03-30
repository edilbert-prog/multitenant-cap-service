/** Structured type for the numbers we return */
type DashboardStats {
  totalProjects  : Integer;
  totalTestCases : Integer;
  totalSources   : Integer;
}
type DocumentScenarioCount {
  documentName : String(500);
  documentId   : String(50);
  count        : Integer;
}
type RecentProject {
  ProjectId       : String(255);
  ClientId        : String(25);
  ProjectName     : String(255);
  BusinessUnitId  : String(25);
  Description     : LargeString;
  Status          : Integer;
  CreatedDate     : Timestamp;
  ModifiedDate    : Timestamp;
  totalTestCases  : Integer;
  relevance       : Decimal(9,2);
}
type TestCaseDateCount {
  date  : Date;
  count : Integer;
}





type DashboardStatsEnvelope {
  ResponseData : DashboardStats;
}
type DocumentScenarioCountResponse {
  ResponseData : array of DocumentScenarioCount;
}
type RecentProjectsEnvelope {
  ResponseData : array of RecentProject;
}
type TestCaseDateCountResponse {
  ResponseData : array of TestCaseDateCount;
}




/** Service */
service DashboardService @(path:'/dashboard') {
  //get csrf token
  function csrfToken() returns String;
  //GetDashboardStats
  action GetDashboardStats(
    ClientId  : String(25),
    ProjectId : String(25),
    SprintId  : String(25)
  ) returns DashboardStatsEnvelope;
  //GetDocumentScenariosCount
  action GetDocumentScenariosCount(
    ClientId  : String(25),
    ProjectId : String(25),
    SprintId  : String(25)
  ) returns DocumentScenarioCountResponse;
  //GetRecentProjects
  action GetRecentProjects(
    ClientId : String(25),
    PageNo   : Integer,
    PageSize : Integer
  ) returns RecentProjectsEnvelope;
 //GetTestCasesByDateRange
 action GetTestCasesByDateRange(
    ClientId  : String(25),
    ProjectId : String(25),
    SprintId  : String(25),
    StartDate : Date,
    EndDate   : Date
  ) returns TestCaseDateCountResponse;
}


