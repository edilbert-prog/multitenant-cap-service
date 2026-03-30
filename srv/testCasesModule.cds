using { MessageOnly, ListResponse } from './common';

service TestCaseStepsService @(path:'/test-case-steps') {

  // 1) Get list of steps
  function GetTestCaseSteps(
    TestCaseId : String(25),
    SearchString : String
  ) returns ListResponse;

  // 2) Add new step
  action AddTestCaseStep(
    TestCaseStepId : String(25),
    TestCaseId : String(25),
    TestStepsId : String(25),
    TestLevel : String(50),
    Description : LargeString,
    Result : String(50),
    CreatedBy : String(25)
  ) returns MessageOnly;

  // 3) Update step details
  action UpdateTestCaseStep(
    TestCaseStepId : String(25),
    TestLevel : String(50),
    Description : LargeString,
    Result : String(50),
    ModifiedBy : String(25)
  ) returns MessageOnly;

  // 4) Delete step
  action DeleteTestCaseStep(TestCaseStepId : String(25)) returns MessageOnly;

  // 5) Update overall result
  action UpdateTestCaseOverallStatus(
    TestCaseId : String(25),
    TestStepsId : String(25),
    TestCaseStepId : String(25),
    Result : String(50)
  ) returns MessageOnly;

  // 6) Add steps from transaction code
  action AddTestCaseStepsByTcode(
    TestCaseId : String(25),
    TestStepsId : String(25),
    TransactionCode : String(100),
    TestLevel : String(50),
    CreatedBy : String(25)
  ) returns ListResponse;

  // 7) Add steps by Tcode with dynamic IDs
  action AddTestCaseStepsByTcodeWithDynamicId(
    TestCaseId : String(25),
    TestStepsId : String(25),
    TransactionCode : String(100),
    TestLevel : String(50),
    CreatedBy : String(25)
  ) returns ListResponse;
}

service TestCaseStepsResultsService @(path:'/test-case-steps-results') {

  // 8) Get all step results
  function GetTestCaseStepsResults(
    TestCaseId : String(25),
    TestCaseResultId : String(25),
    SearchString : String
  ) returns ListResponse;

  // 9) Add new step result
  action AddTestCaseStepResult(
    TestCaseResultId : String(25),
    TestCaseId : String(25),
    TestStepsId : String(25),
    StepNo : Integer,
    Result : String(50),
    ResponseData : LargeString,
    CreatedBy : String(25)
  ) returns MessageOnly;

  // 10) Update step result
  action UpdateTestCaseStepResult(
    TestCaseResultId : String(25),
    TestCaseId : String(25),
    TestStepsId : String(25),
    StepNo : Integer,
    Result : String(50),
    ResponseData : LargeString,
    ModifiedBy : String(25)
  ) returns MessageOnly;

  // 11) Update result data
  action UpdateTestCaseStepResultData(
    TestCaseResultId : String(25),
    TestCaseId : String(25),
    TestStepsId : String(25),
    ResponseData : LargeString,
    Result : String(50),
    ModifiedBy : String(25)
  ) returns MessageOnly;

  // 12) Delete a test case step result
  action DeleteTestCaseStepResult(
    TestCaseResultId : String(25),
    TestCaseId : String(25),
    TestStepsId : String(25)
  ) returns MessageOnly;

  // 13) Get result count and filters
  function GetTestCaseStepsResultsCountFilter(
    TestCaseId : String(25),
    TestStepsId : String(25),
    SearchString : String,
    Status : Integer
  ) returns ListResponse;

  // 14) Get result pagination list
  function GetTestCaseStepsResultsPaginationFilter(
    TestCaseId : String(25),
    TestStepsId : String(25),
    SearchString : String,
    Status : Integer,
    page : Integer,
    pageSize : Integer
  ) returns ListResponse;
}
