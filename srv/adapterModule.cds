using { MessageOnly, ListResponse } from './common';

service AdaptersService @(path:'/adapters') {

  // GET list (dropdown-style, up to N)
  function GetAdaptersMaster(
    SearchString : String
  ) returns ListResponse;

  // GET list with paging + filters
  // NOTE: StartDate / EndDate are strings to match original behaviour and avoid CAP Date validation
  action GetAdaptersMasterPaginationFilterSearch(
    StartDate   : String,
    EndDate     : String,
    SearchString: String,
    PageNo      : Integer,
    RecordsPerPage : Integer
  ) returns ListResponse;

  // POST add or update (matches AddUpdateAdaptersMaster)
  action UpsertAdaptersMaster(
    AdapterId : String(25),   // if empty => create, else update
    HostName  : String(455),
    BaseURL   : LargeString,
    Email     : String(455),
    APIToken  : LargeString
  ) returns MessageOnly;

  // DELETE
  action DeleteAdaptersMaster(
    AdapterId : String(25)
  ) returns MessageOnly;
}

// Jira proxy service (kept same signatures)
service JiraAdapterService @(path:'/adapters/jira') {
  action GetJiraProjects() returns ListResponse;
  action GetJiraBoardsByProject(projectKey : String) returns ListResponse;
  action GetJiraSprintsByBoard(boardId : String) returns ListResponse;
  action GetJiraIssuesBySprint(sprintId : String) returns ListResponse;
  action GetJiraIssuesByProject(projectKey : String) returns ListResponse;
  action GetJiraStoriesByStatus(projectKey : String, status : String) returns ListResponse;
  action GetJiraStoriesByAssignee(projectKey : String, assignee : String, status : String) returns ListResponse;
  action GetJiraDefectsByProject(projectKey : String) returns ListResponse;
  action GetJiraIssueFields(issueKey : String) returns ListResponse;
}

// ABAP proxy service
service AbapAdapterService @(path:'/adapters/abap') {
  action GetABAP_ProgramsList(Payload : LargeString) returns ListResponse;
  action GetABAP_ProgramsData(Payload : LargeString) returns ListResponse;
}
