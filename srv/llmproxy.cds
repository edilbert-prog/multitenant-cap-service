service LLMProxyService @(path: '/llm') {

  action UploadDocumentNew(
    ClientId           : String,
    ProjectId          : String,
    SprintId           : String,
    SessionId          : String,
    fileUrl            : String,
    InputDoc           : LargeString,
    DocumentId         : String,
    BusinessUnitId     : String,
    BusinessUnitName   : String,
    ActionType         : String,
    AdditionalPrompt   : String,
    SourceType         : String,
    WorkspaceId        : String,
    DocumentName       : String,
    BusinessProcesses  : LargeString
  ) returns LargeString;

  action GenerateDataByExistingMDFile(
    ClientId     : String,
    ProjectId    : String,
    SprintId     : String,
    SessionId    : String,
    DocumentId   : String
  ) returns LargeString;

action testEmit() returns String;
}
