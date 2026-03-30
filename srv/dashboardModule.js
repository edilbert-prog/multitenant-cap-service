// srv/dashboardService.js  (or replace file name you use)
const cds = require('@sap/cds');
const { SELECT } = cds.ql;
const resolveTenant = require('../srv/util/tenant'); // adjust path

function isValidIsoDate(s) {
  if (!s) return false;
  const d = new Date(s);
  return !Number.isNaN(d.getTime());
}

module.exports = cds.service.impl(function () {


//get csrf token
  this.on('csrfToken', (req) => {
  return { success: true };
});
  /** ========== GetDashboardStats ========== */
  this.on("GetDashboardStats", async (req) => {
  try {
    const { ClientId, ProjectId, SprintId } = req.data || {};
    const tenant = resolveTenant(req);

    if (!tenant) {
      return {
        ResponseData: {
          totalProjects: 0,
          totalTestCases: 0,
          totalSources: 0,
        },
      };
    }

    const qProjects = SELECT.one
      .columns`count(*) as totalProjects`
      .from`ClientProjects as cp`
      .join`BusinessUnitMasterV2 as bum`
      .on`bum.BusinessUnitId = cp.BusinessUnitId`
      .where`cp.Status = 1 and bum.Status = 1`
      .where`cp.TenantId = ${tenant} and bum.TenantId = ${tenant}`;

    if (ClientId) qProjects.where`cp.ClientId = ${ClientId}`;
    if (ProjectId) qProjects.where`cp.ProjectId = ${ProjectId}`;

    const qTC = SELECT.one
      .columns`count(*) as totalTestCases`
      .from`ProjectSprintSessionDocTestCases`
      .where`Status = 1`
      .where`TenantId = ${tenant}`;

    if (ClientId) qTC.where`ClientId = ${ClientId}`;
    if (ProjectId) qTC.where`ProjectId = ${ProjectId}`;
    if (SprintId) qTC.where`SprintId = ${SprintId}`;

    const qSrc = SELECT.one
      .columns`count(*) as totalSources`
      .from`ProjectSprintSessionDocument`
      .where`Status = 1`
      .where`TenantId = ${tenant}`;

    if (ClientId) qSrc.where`ClientId = ${ClientId}`;
    if (ProjectId) qSrc.where`ProjectId = ${ProjectId}`;
    if (SprintId) qSrc.where`SprintId = ${SprintId}`;

    const [proj, tc, src] = await Promise.all([
      cds.run(qProjects),
      cds.run(qTC),
      cds.run(qSrc),
    ]);

    return {
      ResponseData: {
        totalProjects: Number(proj?.totalProjects ?? 0),
        totalTestCases: Number(tc?.totalTestCases ?? 0),
        totalSources: Number(src?.totalSources ?? 0),
      },
    };
  } catch (err) {
    console.error("[GetDashboardStats] error", err);

    return {
      ResponseData: {
        totalProjects: 0,
        totalTestCases: 0,
        totalSources: 0,
      },
    };
  }
});


  /** ========== GetDocumentScenariosCount ========== */
  this.on('GetDocumentScenariosCount', async (req) => {
    try {
      const { ClientId, ProjectId, SprintId } = req.data || {};
      const tenant = resolveTenant(req);
      if (!tenant) return { ResponseData: [] };

      const q = SELECT.from`ProjectSprintSessionDocument as d`
        .leftJoin`ProjectSprintSessionDocTestScenarios as s`
        .on`
          d.ClientId   = s.ClientId
          and d.ProjectId = s.ProjectId
          and d.SprintId  = s.SprintId
          and d.SessionId = s.SessionId
          and d.DocumentId = s.DocumentId
          and d.TenantId   = s.TenantId
          and s.Status     = 1
        `
        .columns`
          d.DocumentId   as ![documentId],
          d.DocumentName as ![documentName],
          COUNT(s.TestScenarioId) as ![count]
        `
        .where`d.Status = 1`
        .where`d.TenantId = ${tenant}`;

      if (ClientId) q.where`d.ClientId  = ${ClientId}`;
      if (ProjectId) q.where`d.ProjectId = ${ProjectId}`;
      if (SprintId) q.where`d.SprintId  = ${SprintId}`;

      q.groupBy`d.DocumentId, d.DocumentName`;
      q.orderBy`![count] desc`;
      q.limit(10);

      const rows = await cds.run(q);
      return { ResponseData: rows ?? [] };
    } catch (err) {
      console.error('[GetDocumentScenariosCount] error', err);
      return { ResponseData: [] };
    }
  });

  /** ========== GetRecentProjects ========== */
  this.on('GetRecentProjects', async (req) => {
    try {
      const { ClientId, PageNo = 1, PageSize = 4 } = req.data || {};
      const tenant = resolveTenant(req);
      if (!tenant) return { ResponseData: [] };
      const offset = Math.max(0, (PageNo - 1) * PageSize);

      // total active test cases for tenant
      const qTotalTC = SELECT.one
        .columns`count(*) as ![n]`
        .from`ProjectSprintSessionDocTestCases`
        .where`Status = 1`
        .where`TenantId = ${tenant}`;

      const totalTCrow = await cds.run(qTotalTC);
      const totalActiveTC = Number(totalTCrow?.n ?? 0);

      // page of recent projects
      const qProjects = SELECT.from`ClientProjects as cp`
        .columns(
          'cp.ProjectId', 'cp.ClientId', 'cp.ProjectName', 'cp.BusinessUnitId',
          'cp.Description', 'cp.Status',
          { ref: ['cp', 'createdAt'], as: 'CreatedDate' },
          { ref: ['cp', 'modifiedAt'], as: 'ModifiedDate' }
        )
        .join`BusinessUnitMasterV2 as bum`
        .on`bum.BusinessUnitId = cp.BusinessUnitId`
        .where`cp.Status = 1 and bum.Status = 1`
        .where`cp.TenantId = ${tenant} and bum.TenantId = ${tenant}`
        .orderBy`cp.createdAt desc`
        .limit({ rows: PageSize, offset });

      if (ClientId) qProjects.where`cp.ClientId = ${ClientId}`;

      const projects = await cds.run(qProjects);
      if (!projects?.length) return { ResponseData: [] };

      const projectIds = projects.map(p => p.ProjectId).filter(Boolean);
      let counts = [];
      if (projectIds.length > 0) {
        const qCounts = SELECT.from`ProjectSprintSessionDocTestCases`
          .columns`ProjectId, count(distinct TestCaseId) as ![cnt]`
          .where`Status = 1`
          .where`TenantId = ${tenant}`
          .where`ProjectId in ${projectIds}`
          .groupBy`ProjectId`;

        counts = await cds.run(qCounts);
      }

      const byProject = new Map((counts || []).map(r => [r.ProjectId, Number(r.cnt || 0)]));

      const result = projects.map(p => {
        const tc = byProject.get(p.ProjectId) || 0;
        const relevance = totalActiveTC > 0 ? Number(((tc * 100) / totalActiveTC).toFixed(2)) : 0;
        return {
          ProjectId: p.ProjectId,
          ClientId: p.ClientId,
          ProjectName: p.ProjectName,
          BusinessUnitId: p.BusinessUnitId,
          Description: p.Description,
          Status: p.Status,
          CreatedDate: p.CreatedDate,
          ModifiedDate: p.ModifiedDate,
          totalTestCases: tc,
          relevance
        };
      });

      return { ResponseData: result };
    } catch (err) {
      console.error('[GetRecentProjects] error', err);
      return { ResponseData: [] };
    }
  });

  /** ========== GetTestCasesByDateRange ========== */
  this.on('GetTestCasesByDateRange', async (req) => {
    try {
      const { ClientId, ProjectId, SprintId, StartDate, EndDate } = req.data || {};
      const tenant = resolveTenant(req);
      if (!tenant) return { ResponseData: [] };

      // Validate StartDate/EndDate: prefer ISO yyyy-mm-dd
      let start = null, end = null;
      if (StartDate && EndDate) {
        if (!isValidIsoDate(StartDate) || !isValidIsoDate(EndDate)) {
          console.warn('[GetTestCasesByDateRange] invalid dates', StartDate, EndDate);
          return { ResponseData: [] };
        }
        start = StartDate;
        end = EndDate;
      }

      const dateRef = { ref: ['createdAt'] };

      // Add range filter first so DB can use index on createdAt
      const q = SELECT.from('ProjectSprintSessionDocTestCases')
        .columns`DATE(${dateRef}) as ![date], COUNT(*) as ![count]`
        .where`Status = 1`
        .where`TenantId = ${tenant}`;

      if (start && end) {
        q.where`${dateRef} >= ${start} and ${dateRef} <= ${end}`; // managed timestamps range (no DATE() here)
      }
      if (ClientId) q.where`ClientId  = ${ClientId}`;
      if (ProjectId) q.where`ProjectId = ${ProjectId}`;
      if (SprintId) q.where`SprintId  = ${SprintId}`;

      // group by DATE(...) for daily buckets
      q.groupBy`DATE(${dateRef})`;
      q.orderBy`DATE(${dateRef})`;

      const rows = await cds.run(q);
      return { ResponseData: rows ?? [] };
    } catch (err) {
      console.error('[GetTestCasesByDateRange] error', err);
      return { ResponseData: [] };
    }
  });

});
