using { MessageOnly, ListResponse } from './common';

// 1) Incident Master (dictionary of incidents)
service IncidentMasterService @(path:'/incident-master') {
  function GetIncidentMaster() returns ListResponse;
  function GetIncidentById(IncidentId : String(25)) returns ListResponse;

  action AddIncidentMaster(
    IncidentId    : String(25),   // blank => create, else update
    Incident      : String(500),
    Description   : LargeString,
    LoggedBy      : String(100),
    AssignedTo    : String(100),
    DateTime      : String(50),   // keep string to mirror Express
    IncidentType  : String(100),
    Status        : Integer,
    SortKey       : Integer
  ) returns MessageOnly;

  action DeleteIncidentMaster(IncidentId : String(25)) returns MessageOnly;
}

// 2) Incident Process Master (steps / process entries per incident)
service IncidentProcessMasterService @(path:'/incident-process') {
  function GetIncidentProcessMaster() returns ListResponse;
  function GetIncidentProcessById(IncidentProcessId : String(25)) returns ListResponse;
  function GetIncidentProcessByIncidentId(IncidentId : String(25)) returns ListResponse;

  action AddIncidentProcessMaster(
    IncidentProcessId : String(25), // blank => create, else update
    IncidentId        : String(25),
    Description       : LargeString,
    AssignedTo        : String(100),
    Status            : Integer,
    SortKey           : Integer
  ) returns MessageOnly;

  action DeleteIncidentProcessMaster(IncidentProcessId : String(25)) returns MessageOnly;
}

// 3) Incidents (the "work" endpoints used by UI — pagination, scores, chatbot, etc.)
service IncidentsService @(path:'/incidents') {
  function GetIncidentsMasterPaginationFilterSearch(
    SearchString : String,
    PageNo       : Integer,
    PageSize     : Integer,
    Status       : Integer,
    FromDate     : Timestamp,
    ToDate       : Timestamp,
    IncidentType : String(100),
    LoggedBy     : String(100),
    AssignedTo   : String(100)
  ) returns ListResponse;

  function GetIncidentsMasterCountFilter(
    SearchString : String,
    Status       : Integer,
    FromDate     : Timestamp,
    ToDate       : Timestamp,
    IncidentType : String(100),
    LoggedBy     : String(100),
    AssignedTo   : String(100)
  ) returns ListResponse;

  action AddUpdateIncidentsMaster(
    IncidentId    : String(25),   // blank => create, else update
    Incident      : String(500),
    Description   : LargeString,
    LoggedBy      : String(100),
    AssignedTo    : String(100),
    AddressedBy   : String(100),
    DateTime      : String(50),
    Solution      : LargeString,
    IncidentType  : String(100),
    Score         : Integer,
    ProcessDescription : LargeString,
    Status        : Integer,
    SortKey       : Integer
  ) returns MessageOnly;

  action DeleteIncidentsMaster(IncidentId : String(25)) returns MessageOnly;

  action UpdateStatus(IncidentId : String(25), Status : Integer) returns MessageOnly;
  action UpdateIncidentScore(IncidentId : String(25), Score : Integer) returns MessageOnly;

  // helpers
  function GetIncidentSolutions(IncidentType : String(100), SearchString : String) returns ListResponse;
  function GetIncidentsByType(IncidentType : String(100)) returns ListResponse;

  // chatbot helpers (your routes include a list; models also have “details”)
  function GetIncidentsFromChatbot(SearchString : String) returns ListResponse;
  function GetIncidentsFromChatbotDetails(IncidentId : String(25)) returns ListResponse;
}
