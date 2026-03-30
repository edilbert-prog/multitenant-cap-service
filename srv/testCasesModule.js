const cds = require('@sap/cds');
const ok  = (data) => ({ status:'ok', data: JSON.stringify(data ?? []) });
const msg = (message) => ({ message });

module.exports = cds.service.impl(function () {

  // ================== TEST CASE STEPS ==================
  this.on('GetTestCaseSteps', async (req) => {
    const { TestCaseId, SearchString } = req.data;
    let q = SELECT.from('TestCaseSteps').where({ Status: 1 });
    if (TestCaseId) q.where({ TestCaseId });
    if (SearchString) q.where`Description like ${'%' + SearchString + '%'}`;
    q.orderBy`TestCaseId asc, TestStepsId asc`;
    const rows = await cds.run(q);
    return ok(rows);
  });

  this.on('AddTestCaseStep', async (req) => {
    const d = req.data;
    await cds.run(INSERT.into('TestCaseSteps').entries({
      TestCaseStepId: d.TestCaseStepId || cds.utils.uuid(),
      TestCaseId: d.TestCaseId,
      TestStepsId: d.TestStepsId,
      TestLevel: d.TestLevel,
      Description: d.Description,
      Result: d.Result || 'none',
      CreatedBy: d.CreatedBy,
      CreatedDate: new Date(),
    }));
    return msg('created');
  });

  this.on('UpdateTestCaseStep', async (req) => {
    const d = req.data;
    await cds.run(UPDATE('TestCaseSteps').set({
      TestLevel: d.TestLevel,
      Description: d.Description,
      Result: d.Result,
      ModifiedBy: d.ModifiedBy,
      ModifiedDate: new Date(),
    }).where({ TestCaseStepId: d.TestCaseStepId }));
    return msg('updated');
  });

  this.on('DeleteTestCaseStep', async (req) => {
    await cds.run(DELETE.from('TestCaseSteps').where({ TestCaseStepId: req.data.TestCaseStepId }));
    return msg('deleted');
  });

  this.on('UpdateTestCaseOverallStatus', async (req) => {
    const d = req.data;
    await cds.run(
      UPDATE('TestCaseSteps')
        .set({ Result: d.Result })
        .where({ TestCaseId: d.TestCaseId, TestStepsId: d.TestStepsId, TestCaseStepId: d.TestCaseStepId })
    );
    return msg('updated');
  });

  this.on('AddTestCaseStepsByTcode', async (req) => {
    // Placeholder for transactional inserts from Tcode
    return msg('created from TransactionCode');
  });

  this.on('AddTestCaseStepsByTcodeWithDynamicId', async (req) => {
    // Placeholder dynamic ID creation logic
    return msg('created with dynamic ID');
  });

  // ================== TEST CASE STEP RESULTS ==================
  this.on('GetTestCaseStepsResults', async (req) => {
    const { TestCaseId, TestCaseResultId, SearchString } = req.data;
    const q = SELECT.from('TestCaseStepsResults')
      .where({ Status: 1 })
      .orderBy`TestCaseId asc, StepNo asc`;
    if (TestCaseId) q.where({ TestCaseId });
    if (TestCaseResultId) q.where({ TestCaseResultId });
    if (SearchString) q.where`ResponseData like ${'%' + SearchString + '%'}`;
    const rows = await cds.run(q);
    return ok(rows);
  });

  this.on('AddTestCaseStepResult', async (req) => {
    const d = req.data;
    await cds.run(INSERT.into('TestCaseStepsResults').entries({
      TestCaseResultId: d.TestCaseResultId || cds.utils.uuid(),
      TestCaseId: d.TestCaseId,
      TestStepsId: d.TestStepsId,
      StepNo: d.StepNo || 0,
      Result: d.Result || 'none',
      ResponseData: d.ResponseData,
      CreatedBy: d.CreatedBy,
      CreatedDate: new Date(),
    }));
    return msg('created');
  });

  this.on('UpdateTestCaseStepResult', async (req) => {
    const d = req.data;
    await cds.run(UPDATE('TestCaseStepsResults').set({
      StepNo: d.StepNo,
      Result: d.Result,
      ResponseData: d.ResponseData,
      ModifiedBy: d.ModifiedBy,
      ModifiedDate: new Date(),
    }).where({ TestCaseId: d.TestCaseId, TestStepsId: d.TestStepsId }));
    return msg('updated');
  });

  this.on('UpdateTestCaseStepResultData', async (req) => {
    const d = req.data;
    await cds.run(UPDATE('TestCaseStepsResults').set({
      Result: d.Result,
      ResponseData: d.ResponseData,
      ModifiedBy: d.ModifiedBy,
      ModifiedDate: new Date(),
    }).where({ TestCaseResultId: d.TestCaseResultId }));
    return msg('updated');
  });

  this.on('DeleteTestCaseStepResult', async (req) => {
    const { TestCaseResultId, TestCaseId, TestStepsId } = req.data;
    await cds.run(DELETE.from('TestCaseStepsResults').where({ TestCaseResultId, TestCaseId, TestStepsId }));
    return msg('deleted');
  });

  this.on('GetTestCaseStepsResultsCountFilter', async (req) => {
    const q = SELECT.one.from('TestCaseStepsResults').columns`count(*) as TotalRows`;
    const [{ TotalRows }] = await cds.run(q);
    return ok([{ TotalRows }]);
  });

  this.on('GetTestCaseStepsResultsPaginationFilter', async (req) => {
    const { page = 1, pageSize = 10 } = req.data;
    const rows = await cds.run(
      SELECT.from('TestCaseStepsResults')
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .orderBy`StepNo asc`
    );
    return ok(rows);
  });
});
