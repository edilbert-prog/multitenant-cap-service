namespace my.company.subprocess;

type SubProcessNode {
  BusinessSubProcessId   : String(25);
  BusinessProcessId      : String(25);
  BusinessProcessName    : String(255);
  ClientId               : String(25);
  BusinessUnitId         : String(25);
  ProjectId              : String(25);
  SprintId               : String(25);
  BusinessSubProcessName : String(500);
  Description            : LargeString;
  ProjectSprintProcessId : String(50);
  selected               : Boolean;
  indeterminate          : Boolean;
  // SubProcesses removed to avoid circular type
}

type BusinessProcessGroup {
  BusinessProcessId   : String(25);
  BusinessProcessName : String(255);
  ClientId            : String(25);
  BusinessUnitId      : String(25);
  ProjectId           : String(25);
  SprintId            : String(25);
  selected            : Boolean;
  indeterminate       : Boolean;
  SubProcesses        : array of SubProcessNode;
}

type MappedTreeEnvelope {
  ResponseData : {
    ClientId         : String(25);
    BusinessUnitId   : String(25);
    BusinessProcesses: array of BusinessProcessGroup;
  };
}

service SubProcessService @(path:'/subprocess') {
  action GetMappedProjectSprintClientSubProcessesProjectSprintV5(
    ClientId       : String(25),
    BusinessUnitId : String(25),
    ProjectId      : String(25),
    SprintId       : String(25),
    BusinessProcessId : String(25)      // optional if you want to pass it
  ) returns MappedTreeEnvelope;
}
