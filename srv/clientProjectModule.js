const cds = require('@sap/cds')
const socket = require('../socket');
const resolveTenant = require('./util/tenant')

/* ---------- Envelope helpers ---------- */
const toListResponse = (payload) => payload
const messageOnly = (message) => ({ message })

/* ---------- Utility helpers ---------- */
const notNull = (v) => v !== undefined && v !== null && v !== ''

/* ---------- MAP (logical -> physical) ---------- */
const MAP = {
  ClientProjects: { entity: 'ClientProjects', keys: ['ClientId', 'ProjectId'], searchCols: ['ProjectName', 'ProjectId', 'BusinessUnitId'] },
  ClientProjectSprint: { entity: 'ClientProjectSprint', keys: ['ClientId', 'ProjectId', 'SprintId'], searchCols: ['SprintName', 'InputFileURL', 'MarkdownFileURL'] },
  ProjectSprintSessions: { entity: 'ProjectSprintSessions', keys: ['ClientId', 'ProjectId', 'SprintId', 'SessionId'], searchCols: ['SessionStatus', 'StatusInfo', 'ElapsedTime', 'Progress'] },
  ProjectBRDSummary: { entity: 'ProjectSprintSessionDocBRDSummary', keys: ['ClientId','ProjectId','SprintId','SessionId','DocumentId','BRDSummaryId'], searchCols: ['BRDSummary'] },
  ProjectBusinessRequirements: { entity: 'ProjectSprintSessionDocTestScenarios', keys: ['ClientId','ProjectId','SprintId','SessionId','DocumentId','TestScenarioId'], searchCols: ['TestScenarioName','AcceptanceCriteria','Priority','BusinessLogic','Description'] },
  ProjectClientSubProcess: { entity: 'ProjectSprintSessionDocMissedSections', keys: ['ClientId','ProjectId','SprintId','SessionId','DocumentId','DocSectionId'], searchCols: ['SectionTitle','SectionContent'] },
  ProjectImpactAnalysis: { entity: 'ProjectSprintSessionDocImpactAnalysis', keys: ['ClientId','ProjectId','SprintId','SessionId','DocumentId','ImpactAnalysisId'], searchCols: ['Impact','AffectedSystems','Stakeholders','ImpactLevel','Justification','Description'] },
  ProjectSessionFiles: { entity: 'ProjectSprintSessionDocument', keys: ['ClientId','ProjectId','SprintId','SessionId','DocumentId'], searchCols: ['DocumentName','InputFileURL','MarkdownFileURL','StoryId','SourceType','LLMEngine','StatusInfo','SessionStatus'] },
  ProjectSprintSessionDocSections: { entity: 'ProjectSprintSessionDocSections', keys: ['ClientId','ProjectId','SprintId','SessionId','DocumentId','Section'], searchCols: ['Section','Payload'] },
  ProjectValidationComponent: { entity: 'ProjectSprintSessionDocTestCases', keys: ['ClientId','ProjectId','SprintId','SessionId','DocumentId','TestScenarioId','TestCaseId'], searchCols: ['Component','TestType','TestingLevel','TestCase','TestStatus'] },
  ProjectTestStrategy: { entity: 'ProjectSprintSessionDocTestStrategy', keys: ['ClientId','ProjectId','SprintId','SessionId','DocumentId','TestStrategyId'], searchCols: ['TestStrategy','TestTypes','TestEnvironment'] },
  PromptVersionMaster: { entity: 'PromptVersionMaster', keys: ['TestScenarioId','VersionId'], searchCols: ['Prompt'] }
}

/* ---------- Generic list & count helpers (CDS SELECT) ---------- */

function getTenant(req) {
  const tenant = resolveTenant(req)
  if (!tenant) throw Object.assign(new Error('TenantId is required'), { statusCode: 403 })
  return tenant
}

async function listWithSearch(entityName, descriptor = {}, filters = {}, paging = { page: 1, pageSize: 25 }, orderCol = 'CreatedDate') {
  const { page = 1, pageSize = 25 } = paging || {}
  const q = SELECT.from(entityName).orderBy(`${orderCol} desc`).limit(pageSize).offset(Math.max(0, (page - 1) * pageSize))

  for (const [k, v] of Object.entries(filters || {})) {
    if (['search','fromDate','toDate'].includes(k)) continue
    if (notNull(v)) q.where({ [k]: v })
  }

  if (filters.search && descriptor.searchCols && descriptor.searchCols.length) {
    const like = `%${String(filters.search)}%`
    const parts = descriptor.searchCols.map(c => cds.parse.expr(`${c} like '${like.replace(/'/g,"''")}'`))
    const combined = parts.reduce((a,b) => a ? { or: [a,b] } : b, null)
    if (combined) q.where(combined)
  }

  if (filters.fromDate) q.where({ [orderCol]: { '>=': filters.fromDate } })
  if (filters.toDate) q.where({ [orderCol]: { '<=': filters.toDate } })

  return cds.run(q)
}

async function countWithSearch(entityName, descriptor = {}, filters = {}) {
  const q = SELECT.one.from(entityName).columns `count(*) as total`
  for (const [k,v] of Object.entries(filters || {})) {
    if (['search','fromDate','toDate'].includes(k)) continue
    if (notNull(v)) q.where({ [k]: v })
  }
  if (filters.search && descriptor.searchCols && descriptor.searchCols.length) {
    const like = `%${String(filters.search)}%`
    const parts = descriptor.searchCols.map(c => cds.parse.expr(`${c} like '${like.replace(/'/g,"''")}'`))
    const combined = parts.reduce((a,b) => a ? { or: [a,b] } : b, null)
    if (combined) q.where(combined)
  }
  if (filters.fromDate) q.where({ CreatedDate: { '>=': filters.fromDate } })
  if (filters.toDate) q.where({ CreatedDate: { '<=': filters.toDate } })

  const [{ total = 0 } = {}] = await cds.run(q)
  return Number(total || 0)
}

/* ---------- Raw SQL helpers (for dynamic fragments) ---------- */
function escapeLiteral(v) {
  if (v === undefined || v === null) return 'NULL'
  return `'${String(v).replace(/'/g, "''")}'`
}
function escapeLike(v) {
  if (v === undefined || v === null) return "''"
  return `'%${String(v).replace(/'/g, "''")}%'`
}
function safeJSONParse(str, fallback) {
  if (!str) return fallback
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

/* ---------- Export handlers ---------- */
module.exports = cds.service.impl(function () {

// Helper: single DB runner
async function runDb(sql, params = []) {
  const db = await cds.connect.to('db')
  return db.run(sql, params)
}
// Helper: normalize rows
const normalize = (rows) => Array.isArray(rows) ? rows : (rows && rows.rows ? rows.rows : [])

/**
 * Core SQL: equivalent of your original getClientSubProcessesAndMappedProjectSprintUnSelectedBPSP
 * Uses lowercase physical table names (Postgres).
 */
async function fetchClientSubProcessesAndMappedProjectSprintUnSelectedBPSP(requestObj) {
  const {
    ClientId,
    BusinessUnitId,
    BusinessProcessId,
    ProjectId,
    SprintId,
    ParentSubProcessId = null
  } = requestObj;

  const isRoot = ParentSubProcessId === null ||
                 ParentSubProcessId === undefined ||
                 ParentSubProcessId === '' ||
                 ParentSubProcessId === 'null';

  // correct param order: client, businessUnit, project, sprint
  const params = [ClientId, BusinessUnitId, ProjectId, SprintId];

  let extraWhere = '';
  if (BusinessProcessId) {
    params.push(BusinessProcessId);
    extraWhere += ` AND spm.businessprocessid = $${params.length}`;
  }
  if (isRoot) {
    extraWhere += ` AND spm.parentsubprocessid IS NULL`;
  } else {
    params.push(ParentSubProcessId);
    extraWhere += ` AND spm.parentsubprocessid = $${params.length}`;
  }

  const sql = `
    SELECT
      spm.clientid,
      spm.businessunitid,
      spm.businessprocessid        AS businessprocessid,
      bpm.businessprocessname      AS businessprocessname,
      spm.businesssubprocessid     AS businesssubprocessid,
      bpspm.businesssubprocessname AS businesssubprocessname,
      pbsp.projectsprintprocessid  AS projectsprintprocessid,
      spm.parentsubprocessid       AS parentsubprocessid,
      COALESCE(bpspm.description,'') AS description
    FROM clientsubprocessmaster spm
    JOIN businessprocessmaster bpm
      ON bpm.businessprocessid = spm.businessprocessid
    LEFT JOIN businessprocesssubprocessmaster bpspm
      ON bpspm.businessprocessid = spm.businessprocessid
     AND bpspm.businesssubprocessid = spm.businesssubprocessid
    LEFT JOIN projectsprintsubprocessmaster pbsp
      ON pbsp.clientid = spm.clientid
     AND pbsp.businessunitid = spm.businessunitid
     AND pbsp.businessprocessid = spm.businessprocessid
     AND pbsp.businesssubprocessid = spm.businesssubprocessid
     AND pbsp.projectid = $3
     AND pbsp.sprintid = $4
    WHERE spm.clientid = $1
      AND spm.businessunitid = $2
      AND spm.status = 1
      AND (bpspm.status IS NULL OR bpspm.status = 1)
      ${extraWhere}
    ORDER BY COALESCE(bpspm.sortkey,0), COALESCE(bpspm.businesssubprocessname, spm.businesssubprocessid)
  `;

  console.log('fetchClientSubProcesses SQL params:', params);

  const res = await runDb(sql, params);

  // debug: log first row shape so you can confirm column names
  console.log('fetchClientSubProcesses sample row:', (Array.isArray(res) ? res[0] : (res && res.rows ? res.rows[0] : null)));

  return { status: 'success', data: normalize(res) };
}



/* Transaction / Feature / Program / Integration fetchers (lowercase physical names) */
async function fetchClientApplicationMappedProjectSprintTransactionsUnSelected(requestObj) {
  const { ClientId, BusinessUnitId, BusinessProcessId, BusinessSubProcessId, ProjectId, SprintId } = requestObj
  const sql = `
    SELECT
      t.transactionid,
      t.transactionname,
      t.transactioncode,
      a.applicationid,
      a.applicationname,
      COALESCE(pstm.projectsprinttransactionid, '') AS projectsprinttransactionid,
      COALESCE(pstm.selected, 0) AS selected
    FROM transactionsmaster t
    JOIN applicationsmaster a ON a.applicationid = t.applicationid
    LEFT JOIN projectsprinttransactionmaster pstm
      ON pstm.clientid = $1
      AND pstm.businessunitid = $2
      AND pstm.projectid = $3
      AND pstm.sprintid = $4
      AND pstm.businessprocessid = $5
      AND pstm.businesssubprocessid = $6
      AND pstm.transactionid = t.transactionid
    WHERE t.businessprocessid = $5
      AND t.businesssubprocessid = $6
      AND t.status = 1
    ORDER BY a.applicationname, t.transactionname
  `
  const params = [ClientId, BusinessUnitId, ProjectId, SprintId, BusinessProcessId, BusinessSubProcessId]
  const res = await runDb(sql, params)
  return { status: 'success', data: normalize(res) }
}

async function fetchClientApplicationMappedProjectSprintFeaturesWithSelection(requestObj) {
  const { ClientId, BusinessUnitId, BusinessProcessId, BusinessSubProcessId, ProjectId, SprintId } = requestObj
  const sql = `
    SELECT
      f.featureid,
      f.feature,
      f.applicationid,
      a.applicationname,
      COALESCE(psfm.projectsprintfeatureid, '') AS projectsprintfeatureid,
      COALESCE(psfm.selected, 0) AS selected
    FROM featuremaster f
    JOIN applicationsmaster a ON a.applicationid = f.applicationid
    LEFT JOIN projectsprintfeaturemaster psfm
      ON psfm.clientid = $1
      AND psfm.businessunitid = $2
      AND psfm.projectid = $3
      AND psfm.sprintid = $4
      AND psfm.businessprocessid = $5
      AND psfm.businesssubprocessid = $6
      AND psfm.featureid = f.featureid
    WHERE f.businessprocessid = $5
      AND f.businesssubprocessid = $6
      AND f.status = 1
    ORDER BY a.applicationname, f.feature
  `
  const params = [ClientId, BusinessUnitId, ProjectId, SprintId, BusinessProcessId, BusinessSubProcessId]
  const res = await runDb(sql, params)
  return { status: 'success', data: normalize(res) }
}

async function fetchClientApplicationMappedProjectSprintProgramsWithSelection(requestObj) {
  const { ClientId, BusinessUnitId, BusinessProcessId, BusinessSubProcessId, ProjectId, SprintId } = requestObj
  const sql = `
    SELECT
      p.programid,
      p.programname,
      p.applicationid,
      a.applicationname,
      COALESCE(pspm.projectsprintprogramid, '') AS projectsprintprogramid,
      COALESCE(pspm.selected, 0) AS selected
    FROM programmaster p
    JOIN applicationsmaster a ON a.applicationid = p.applicationid
    LEFT JOIN projectsprintprogrammaster pspm
      ON pspm.clientid = $1
      AND pspm.businessunitid = $2
      AND pspm.projectid = $3
      AND pspm.sprintid = $4
      AND pspm.businessprocessid = $5
      AND pspm.businesssubprocessid = $6
      AND pspm.programid = p.programid
    WHERE p.businessprocessid = $5
      AND p.businesssubprocessid = $6
      AND p.status = 1
    ORDER BY a.applicationname, p.programname
  `
  const params = [ClientId, BusinessUnitId, ProjectId, SprintId, BusinessProcessId, BusinessSubProcessId]
  try {
    const res = await runDb(sql, params)
    return { status: 'success', data: normalize(res) }
  } catch (e) {
    // if table doesn't exist or naming differs, return empty (safe fallback)
    return { status: 'success', data: [] }
  }
}

async function fetchClientIntegrationsMappedProjectSprintWithSprintSelection(requestObj) {
  const { ClientId, BusinessUnitId, BusinessProcessId, BusinessSubProcessId, ProjectId, SprintId } = requestObj
  const sql = `
    SELECT
      im.integrationid,
      im.integrationname,
      COALESCE(pspi.projectsprintprocessintegrationid, '') AS projectsprintprocessintegrationid,
      COALESCE(pspi.selected, 0) AS selected
    FROM integrationmaster im
    LEFT JOIN projectsprintprocessintegration pspi
      ON pspi.clientid = $1
      AND pspi.businessunitid = $2
      AND pspi.projectid = $3
      AND pspi.sprintid = $4
      AND pspi.businessprocessid = $5
      AND pspi.businesssubprocessid = $6
      AND pspi.integrationid = im.integrationid
    WHERE im.businessprocessid = $5
      AND im.businesssubprocessid = $6
      AND im.status = 1
    ORDER BY im.integrationname
  `
  const params = [ClientId, BusinessUnitId, ProjectId, SprintId, BusinessProcessId, BusinessSubProcessId]
  const res = await runDb(sql, params)
  return { status: 'success', data: normalize(res) }
}

/**
 * Recursive routine to build tree of subprocesses and enrich with apps/integrations/programs/features/transactions
 */
async function getNestedMappedProjectSprintSubProcessesUnSelected(baseRequest, parentId = null) {
  const reqObj = { ...baseRequest, ParentSubProcessId: parentId }
  const subProcResult = await fetchClientSubProcessesAndMappedProjectSprintUnSelectedBPSP(reqObj)
  if (subProcResult.status !== 'success') throw new Error(subProcResult.error || 'Failed fetching subprocesses')

  const seen = new Set()
  const filtered = subProcResult.data.filter(s => {
    if (!s || !s.businesssubprocessid) return false
    if (seen.has(s.businesssubprocessid)) return false
    seen.add(s.businesssubprocessid)
    return true
  })

  const promises = filtered.map(async (sub) => {
    const bspId = sub.businesssubprocessid
    const reqWithBSP = {
      ClientId: baseRequest.ClientId,
      BusinessUnitId: baseRequest.BusinessUnitId,
      BusinessProcessId: sub.businessprocessid,
      BusinessSubProcessId: bspId,
      ProjectId: baseRequest.ProjectId,
      SprintId: baseRequest.SprintId
    }

    // Transactions & Applications
    const txnResult = await fetchClientApplicationMappedProjectSprintTransactionsUnSelected(reqWithBSP)
    const appsMap = new Map()
    for (const txn of txnResult.data || []) {
      const appId = txn.applicationid || ''
      if (!appsMap.has(appId)) {
        appsMap.set(appId, {
          ApplicationId: appId,
          ApplicationName: txn.applicationname || '',
          Transactions: [],
          Features: [],
          Programs: [],
          selected: false,
          indeterminate: false
        })
      }
      appsMap.get(appId).Transactions.push({
        TransactionId: txn.transactionid,
        ApplicationId: txn.applicationid,
        ApplicationName: txn.applicationname,
        transactionname: txn.transactionname,
        TransactionCode: txn.transactioncode,
        selected: Number(txn.selected) === 1,
        ProjectSprintTransactionId: txn.projectsprinttransactionid || ''
      })
    }

    // Features
    const featureResult = await fetchClientApplicationMappedProjectSprintFeaturesWithSelection(reqWithBSP)
    (featureResult.data || []).forEach(ft => {
      if (appsMap.has(ft.applicationid)) {
        appsMap.get(ft.applicationid).Features.push({
          FeatureId: ft.featureid,
          ApplicationId: ft.applicationid,
          ApplicationName: ft.applicationname,
          Feature: ft.feature,
          selected: Number(ft.selected) === 1,
          ProjectSprintFeatureId: ft.projectsprintfeatureid || ''
        })
      }
    })

    // Programs
    const programResult = await fetchClientApplicationMappedProjectSprintProgramsWithSelection(reqWithBSP)
    (programResult.data || []).forEach(pg => {
      if (appsMap.has(pg.applicationid)) {
        appsMap.get(pg.applicationid).Programs.push({
          ProgramId: pg.programid,
          ApplicationId: pg.applicationid,
          ApplicationName: pg.applicationname,
          ProgramName: pg.programname,
          selected: Number(pg.selected) === 1,
          ProjectSprintProgramId: pg.projectsprintprogramid || ''
        })
      }
    })

    // Finalize applications array
    const enrichedApplications = Array.from(appsMap.values()).map(app => {
      const allTxnSelected = app.Transactions.length > 0 && app.Transactions.every(t => t.selected)
      const anyTxnSelected = app.Transactions.some(t => t.selected)
      return {
        ...app,
        selected: allTxnSelected,
        indeterminate: !allTxnSelected && anyTxnSelected
      }
    })

    // Integrations
    const integrationResult = await fetchClientIntegrationsMappedProjectSprintWithSprintSelection(reqWithBSP)
    const enrichedIntegrations = (integrationResult.data || []).map(intg => ({
      IntegrationId: intg.integrationid,
      IntegrationName: intg.integrationname,
      selected: Number(intg.selected) === 1,
      ProjectSprintProcessIntegrationId: intg.projectsprintprocessintegrationid || ''
    }))

    // Recurse for children
    const children = await getNestedMappedProjectSprintSubProcessesUnSelected(baseRequest, bspId)

    const areAllChildrenSelected = children.length > 0 && children.every(c => c.selected && !c.indeterminate)
    const isAnyChildSelectedOrIndeterminate = children.some(c => c.selected || c.indeterminate)
    const isSelfSelected = Number(sub.selected) === 1
    const finalSelected = (children.length === 0) ? isSelfSelected : (isSelfSelected || areAllChildrenSelected)
    const finalIndeterminate = (children.length === 0) ? false : (!areAllChildrenSelected && isAnyChildSelectedOrIndeterminate)

    return {
      BusinessSubProcessId: bspId,
      BusinessSubProcessName: sub.businesssubprocessname,
      Description: sub.description,
      ProjectSprintProcessId: sub.projectsprintprocessid || '',
      selected: finalSelected,
      indeterminate: finalIndeterminate,
      Applications: enrichedApplications,
      Integrations: enrichedIntegrations,
      SubProcesses: children.map(c => ({ ...c, ProjectSprintProcessId: c.ProjectSprintProcessId || '' }))
    }
  })

  return Promise.all(promises)
}

// Exposed CAP action handler
this.on('GetMappedProjectSprintClientSubProcessesProjectSprintV4', async (req) => {
  const requestObj = req.data || {}
  const finalArray = {}

  try {
    // Validate required fields
    for (const k of ['ClientId', 'BusinessUnitId', 'ProjectId', 'SprintId']) {
      if (!requestObj[k]) return req.reject(400, `${k} is required`)
    }

    // initial fetch to group by business process
    const initialResp = await fetchClientSubProcessesAndMappedProjectSprintUnSelectedBPSP(requestObj)
    if (initialResp.status !== 'success') throw new Error(initialResp.error || 'Failed fetching initial subprocesses')

    const rawData = initialResp.data || []
    const grouped = {}

    for (const item of rawData) {
      const bpId = item.businessprocessid
      if (!grouped[bpId]) {
        grouped[bpId] = {
          BusinessProcessId: bpId,
          BusinessProcessName: item.businessprocessname,
          SubProcesses: []
        }

        // fetch children subtree for this BP
        const subprocesses = await getNestedMappedProjectSprintSubProcessesUnSelected(
          { ...requestObj, BusinessProcessId: bpId }
        )

        grouped[bpId].SubProcesses = subprocesses

        const allSelected = subprocesses.length > 0 && subprocesses.every(sp => sp.selected && !sp.indeterminate)
        const anySelectedOrIndeterminate = subprocesses.some(sp => sp.selected || sp.indeterminate)

        grouped[bpId].selected = allSelected
        grouped[bpId].indeterminate = !allSelected && anySelectedOrIndeterminate
      }
    }

    finalArray.ResponseData = {
      ClientId: requestObj.ClientId,
      BusinessUnitId: requestObj.BusinessUnitId,
      BusinessProcesses: Object.values(grouped)
    }
    return finalArray
  } catch (err) {
    finalArray.fetchClientSubProcesses_error = err && (err.message || String(err))
    return req.reject(500, finalArray.fetchClientSubProcesses_error)
  }
})


///AddUpdateProjectSprintSession
this.on('AddUpdateProjectSprintSession', async (req) => {
  const d = req.data || {}
  const finalArray = {}

  try {
    const { ClientId, ProjectId, SprintId } = d
    if (!ClientId || !ProjectId || !SprintId) {
      return req.reject(400, 'ClientId, ProjectId and SprintId are required')
    }

    const db = await cds.connect.to('db')

    // ---------- 1) Generate SessionId ----------
    let sessionId = d.SessionId
    if (!sessionId) {
      let reserved = null
      try { reserved = await _reserveCoreDynamicSeq('ProjectSprintSessions', 'Identification', 1) } catch {}
      if (reserved?.status === 'success' && reserved.data?.[0]) {
        const m = reserved.data[0]
        const seq = Number(m.StartSeq ?? (Number(m.PrevSequenceNo || 0) + 1))
        sessionId = `${m.Prefix || ''}${m.Suffix || ''}-${seq}`.replace(/^-/, '')
      } else {
        sessionId = cds.utils?.uuid?.() || String(Date.now())
      }
      d.SessionId = sessionId
    }

    // ---------- 2) Check if session exists ----------
    const existsSql = `
      SELECT 1 FROM projectsprintsessions
      WHERE clientid=$1 AND projectid=$2 AND sprintid=$3 AND sessionid=$4
      LIMIT 1
    `
    const exists = await db.run(existsSql, [ClientId, ProjectId, SprintId, sessionId])

    const now = new Date()
    const sessionStatus = d.SessionStatus ?? null
    const statusInfo = d.StatusInfo ?? null
    const elapsedTime = d.ElapsedTime ?? null
    const progress = d.Progress ?? '0'
    const sortKey = d.SortKey ?? 0
    const status = d.Status ?? 1

    // ---------- 3A) UPDATE ----------
    if (Array.isArray(exists) && exists.length > 0) {
      const updateSql = `
        UPDATE projectsprintsessions
        SET sessionstatus=$5, statusinfo=$6, elapsedtime=$7, progress=$8,
            sortkey=$9, status=$10, modifieddate=$11
        WHERE clientid=$1 AND projectid=$2 AND sprintid=$3 AND sessionid=$4
      `
      const updateParams = [
        ClientId, ProjectId, SprintId, sessionId,
        sessionStatus, statusInfo, elapsedTime, progress,
        sortKey, status, now
      ]

      const updateRes = await db.run(updateSql, updateParams)

      // return EXACT shape as original
      finalArray.updateProjectSprintSessionDocs = {
        fieldCount: 0,
        affectedRows: updateRes?.changes ?? updateRes?.rowCount ?? 1,
        insertId: sessionId,
        info: "",
        serverStatus: 2,
        warningStatus: 0,
        changedRows: updateRes?.changes ?? updateRes?.rowCount ?? 1
      }
      return finalArray
    }

    // ---------- 3B) INSERT ----------
    const insertSql = `
      INSERT INTO projectsprintsessions
      (clientid, projectid, sprintid, sessionid,
       sessionstatus, statusinfo, elapsedtime, progress,
       sortkey, status, createddate, modifieddate)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    `
    const insertParams = [
      ClientId, ProjectId, SprintId, sessionId,
      sessionStatus, statusInfo, elapsedTime, progress,
      sortKey, status, now, now
    ]

    const insertRes = await db.run(insertSql, insertParams)

    finalArray.addProjectSprintSessionDocs = {
      fieldCount: 0,
      affectedRows: insertRes?.changes ?? insertRes?.rowCount ?? 1,
      insertId: sessionId,
      info: "",
      serverStatus: 2,
      warningStatus: 0,
      changedRows: insertRes?.changes ?? insertRes?.rowCount ?? 1
    }

    return finalArray
  } catch (err) {
    return req.reject(500, err.message || 'Internal server error')
  }
})

 /* ---------- GetProjectSprintSessionDocScenarios (CAP version) ---------- */
  this.on('GetProjectSprintSessionDocScenarios', async (req) => {
    const {
      ClientId = '',
      ProjectId = '',
      SessionId = '',
      DocumentId = '',
      FlagType = 'All',
      SearchString = '',
      PageNo = 1,
      StartDate = '',
      EndDate = ''
    } = req.data || {}

    // Same as legacy: fixed 10 per page
    const RecordsPerPage = 10
    const page = Math.max(1, Number(PageNo || 1))
    const offset = (page - 1) * RecordsPerPage

    const db = await cds.connect.to('db')

    // ---- dynamic filter bits (FlagType + SearchString) ----
    const flagFilter =
      FlagType && FlagType !== 'All'
        ? ` AND psdts.flagstatus = ${escapeLiteral(FlagType)}`
        : ''

    const searchFilter = SearchString
      ? ` AND (
            psdts.testscenarioname ILIKE ${escapeLike(SearchString)}
         OR psdts.testscenarioid  ILIKE ${escapeLike(SearchString)}
        )`
      : ''

    // ---- 1) COUNT query (equivalent to getProjectSprintSessionDocScenariosCountFilter) ----
    const countSql = `
      SELECT COUNT(*)::bigint AS total
      FROM projectsprintsessiondoctestscenarios psdts
      WHERE psdts.status   = 1
        AND psdts.clientid = $1
        AND psdts.projectid = $2
        AND psdts.sessionid = $3
        AND psdts.documentid = $4
        ${flagFilter}
        ${searchFilter}
    `

    const countParams = [ClientId, ProjectId, SessionId, DocumentId]

    // ---- 2) DATA query (equivalent to fetchProjectSprintSessionDocScenarios) ----
    const dataSql = `
      SELECT 
        psdts.*,
        COALESCE(tc.testcasecount, 0) AS testcasecount
      FROM projectsprintsessiondoctestscenarios psdts
      LEFT JOIN (
        SELECT 
          clientid,
          projectid,
          sprintid,
          sessionid,
          documentid,
          testscenarioid,
          COUNT(*) AS testcasecount
        FROM projectsprintsessiondoctestcases
        WHERE status = 1
        GROUP BY clientid, projectid, sprintid, sessionid, documentid, testscenarioid
      ) tc
        ON psdts.clientid       = tc.clientid
       AND psdts.projectid      = tc.projectid
       AND psdts.sprintid       = tc.sprintid
       AND psdts.sessionid      = tc.sessionid
       AND psdts.documentid     = tc.documentid
       AND psdts.testscenarioid = tc.testscenarioid
      WHERE psdts.status   = 1
        AND psdts.clientid = $1
        AND psdts.projectid = $2
        AND psdts.sessionid = $3
        AND psdts.documentid = $4
        ${flagFilter}
        ${searchFilter}
      ORDER BY CAST(regexp_replace(psdts.testscenarioid, '.*-(\\d+)$','\\1') AS INTEGER) ASC
      LIMIT $5 OFFSET $6
    `

    const dataParams = [ClientId, ProjectId, SessionId, DocumentId, RecordsPerPage, offset]

        try {
      const [{ total = 0 } = {}] = await db.run(countSql, countParams)
      const totalRecords = Number(total || 0)
      const totalPages = totalRecords > 0 ? Math.ceil(totalRecords / RecordsPerPage) : 0

      const rows = await db.run(dataSql, dataParams) || []

      const ResponseData = rows.map(r => ({
        ClientId: r.clientid,
        ProjectId: r.projectid,
        SprintId: r.sprintid,
        SessionId: r.sessionid,
        DocumentId: r.documentid,
        TestScenarioId: r.testscenarioid,
        VersionId: r.versionid,
        TestScenarioName: r.testscenarioname,
        TestScenarioStatus: r.testscenariostatus,
        SectionTitle: r.sectiontitle,
        SectionContent: r.sectioncontent,
        Description: r.description,
        Priority: r.priority,
        DocTraceabilitySources: r.doctraceabilitysources,
        ScenarioTraceabilitySources: r.scenariotraceabilitysources,
        BusinessLogic: r.businesslogic,
        // DB has JSON text, convert to JS value
        RelatedTCodes: safeJSONParse(r.relatedtcodes, []),
        AcceptanceCriteria: r.acceptancecriteria,
        // "no" -> "No", "Yes" -> "Yes"
        FlagStatus: r.flagstatus
          ? r.flagstatus.charAt(0).toUpperCase() + r.flagstatus.slice(1).toLowerCase()
          : null,
        SortKey: r.sortkey,
        Status: r.status,
        CreatedDate: r.createddate,
        ModifiedDate: r.modifieddate,
        TestCaseCount: Number(r.testcasecount || 0)
      }))

      return {
        TotalRecords: totalRecords,
        RecordsPerPage,
        TotalPages: totalPages,
        CurrentPage: page,
        ResponseData
      }
    } catch (err) {
      req._ && req._.log && req._.log.error && req._.log.error('GetProjectSprintSessionDocScenarios error', err)
      return req.reject(500, err.message || 'DB error')
    }

  })


  const service = this

  /* 1) Client Projects */
  this.on('GetClientProjects', async (req) => {
    const tenant = getTenant(req)
    const rows = await cds.run(SELECT.from(MAP.ClientProjects.entity).orderBy `CreatedDate desc`.where({ TenantId: tenant }))
    return toListResponse({ ResponseData: rows || [] })
  })

  /* GetProjectTypesMaster */
  this.on('GetProjectTypesMaster', async (req) => {
  try {
    const { SearchString } = req.data || {}

    const tenant = req.tenant

    let query = SELECT.from('ProjectTypesMaster')
      .columns([
        { ref: ['ProjectTypeId'], as: 'value' },
        { ref: ['ProjectType'], as: 'label' },
        '*'
      ])
      .where({
        Status: 1,
        TenantId: tenant
      })
      .orderBy('SortKey')

    if (SearchString) {
      query.where({
        ProjectType: { like: `%${SearchString}%` }
      })
    }

    const rows = await cds.run(query)

    return {
      ResponseData: rows || [],
      fetchRecordsFromProjectTypesMaster_error:
        (!rows || rows.length === 0) ? 'No data found' : null
    }

  } catch (err) {
    return req.reject(500, err.message || 'Internal error')
  }
})


  /* 2) GetClientProjectsByClientId */
  this.on('GetClientProjectsByClientId', async (req) => {
    const tenant = getTenant(req);
    const data = req.data || {};
    const ClientId = data.ClientId || data.clientId || '';
    const BusinessUnitId = data.BusinessUnitId || data.businessUnitId || '';

    const where = { Status: 1, TenantId: tenant };
    if (ClientId) where.ClientId = ClientId;
    if (BusinessUnitId) where.BusinessUnitId = BusinessUnitId;

    try {
      const rows = await cds.run(
        SELECT.from(MAP.ClientProjects.entity)
          .columns('ProjectId as value', 'ProjectName as label', '*')
          .where(where)
          .orderBy `ProjectName asc`
      );
      return { ResponseData: rows || [] };
    } catch (err) {
      console.error('Error in GetClientProjectsByClientId:', err);
      return { ResponseData: [], ErrorMessage: err.message || String(err) };
    }
  });

  /* 3) GetClientProjectsWithSprints */
  this.on('GetClientProjectsWithSprints', async (req) => {
    const tenant = getTenant(req);
    const { ClientId, BusinessUnitId } = req.data || {}
    if (!ClientId) return req.reject(400, 'ClientId is required')

    try {
      const projects = await cds.run(
        SELECT.from(MAP.ClientProjects.entity)
          .columns(['ProjectId','ProjectName','BusinessUnitId','ClientId','CreatedDate'])
          .where({TenantId: tenant, ClientId, ...(BusinessUnitId ? { BusinessUnitId } : {}) })
          .orderBy `CreatedDate ASC`
      )

      const projectList = []
      for (const project of projects || []) {
        const { ProjectId, ProjectName, BusinessUnitId: BUId } = project
        let buName = null
        if (BUId) {
          const bu = await cds.run(SELECT.one.from('BusinessUnitMasterV2').columns('BusinessUnitName').where({TenantId: tenant, BusinessUnitId: BUId }))
          buName = bu ? bu.BusinessUnitName : null
        }
        const sprints = await cds.run(SELECT.from(MAP.ClientProjectSprint.entity).columns(['SprintId','SprintName']).where({TenantId: tenant, ClientId: project.ClientId, ProjectId }))
        const sprintMap = new Map()
        for (const s of sprints || []) {
          if (!s || !s.SprintId) continue
          if (!sprintMap.has(s.SprintId)) sprintMap.set(s.SprintId, { SprintId: s.SprintId, SprintName: s.SprintName })
        }
        projectList.push({
          ClientId: project.ClientId,
          BusinessUnitId: BUId || null,
          ProjectId,
          ProjectName,
          BusinessUnitName: buName || null,
          Sprints: Array.from(sprintMap.values())
        })
      }

      return { status: 'success', ResponseData: projectList }
    } catch (err) {
      service.log && service.log.error && service.log.error('GetClientProjectsWithSprints error', err)
      return req.reject(500, err.message || 'Internal Server Error')
    }
  })

  /* 4) GetClientProjectsPaginationFilterSearch */
  this.on('GetClientProjectsPaginationFilterSearch', async (req) => {
    const tenant = getTenant(req);
    const data = req.data || {};
    const search = (data.search ?? data.SearchString ?? '').trim();
    const page = Math.max(1, Number(data.page ?? data.PageNo ?? 1));
    const pageSize = Math.max(1, Number(data.pageSize ?? 10));
    const clientId = data.clientId ?? data.ClientId ?? '';
    const businessUnitId = data.businessUnitId ?? data.BusinessUnitId ?? '';
    const projectId = data.projectId ?? data.ProjectId ?? '';
    const status = data.status ?? data.Status ?? 1;
    const startDate = data.StartDate ?? data.startDate ?? null;
    const endDate   = data.EndDate   ?? data.endDate   ?? null;

    const filters = ['cp.tenantid = $1'];
    const params = [tenant];

    if (clientId) { filters.push('cp.clientid = $' + (params.length + 1)); params.push(clientId); }
    if (businessUnitId) { filters.push('cp.businessunitid = $' + (params.length + 1)); params.push(businessUnitId); }
    if (projectId) { filters.push('cp.projectid = $' + (params.length + 1)); params.push(projectId); }
    if (status !== undefined && status !== null) { filters.push('cp.status = $' + (params.length + 1)); params.push(status); }
    if (startDate) { filters.push('cp.createdat >= $' + (params.length + 1)); params.push(startDate); }
    if (endDate) { filters.push('cp.createdat <= $' + (params.length + 1)); params.push(endDate); }

    if (search) { filters.push(`(cp.projectname ILIKE $${params.length + 1} OR cp.projectid ILIKE $${params.length + 1})`); params.push(`%${String(search).replace(/%/g, '\\%').replace(/_/g, '\\_')}%`); }

    const whereClause = filters.length ? ('WHERE ' + filters.join(' AND ')) : ''

    const countSql = `
      SELECT COUNT(*)::bigint AS total
      FROM clientprojects cp
      ${whereClause}
    `

    const offset = (page - 1) * pageSize
    const dataSql = `
      SELECT cp.*
      FROM clientprojects cp
      ${whereClause}
      ORDER BY cp.createdat DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `
    const dataParams = params.concat([pageSize, offset])

    const db = await cds.connect.to('db')
    try {
      const [{ total = 0 } = {}] = await db.run(countSql, params)
      const rows = await db.run(dataSql, dataParams)

      return {
        TotalRecords: Number(total || 0),
        RecordsPerPage: pageSize,
        TotalPages: Math.max(1, Math.ceil((Number(total || 0)) / pageSize)),
        CurrentPage: page,
        ResponseData: rows || []
      }
    } catch (err) {
      console.error('GetClientProjectsPaginationFilterSearch error', err)
      return req.reject(500, err.message || 'DB error')
    }
  })

  /* Helper to normalize result formats */
  function normalizeRows(res) {
    if (!res) return []
    if (Array.isArray(res)) return res
    if (res.rows && Array.isArray(res.rows)) return res.rows
    if (res.raw && Array.isArray(res.raw)) return res.raw
    return []
  }



  /* 5) GetClientProjectsWithFolders */
  this.on('GetClientProjectsWithFolders', async (req) => {
    const tenant = getTenant(req);
    try {
      const { ClientId, BusinessUnitId } = req.data || {}
      if (!ClientId || !BusinessUnitId) {
        return { status: 'fail', ResponseData: [], error: 'ClientId and BusinessUnitId required' }
      }

      const qProjects = SELECT.from('ClientProjects')
        .columns(['ClientId','ProjectId','ProjectName','BusinessUnitId'])
        .where({ TenantId: tenant, ClientId, BusinessUnitId })
        .orderBy`ProjectName`
      const projectsRaw = await cds.run(qProjects)
      const projects = normalizeRows(projectsRaw)

      let folders = []
      const projectIds = projects.map(p => p.ProjectId).filter(Boolean)
      if (projectIds.length > 0) {
        const qFolders = SELECT.from('ClientProjectFolders')
          .columns(['FolderId','ClientId','BusinessUnitId','ProjectId','FolderName','ParentFolderId','SortKey','Status','CreatedDate','ModifiedDate'])
          .where({ TenantId: tenant, ClientId, BusinessUnitId, ProjectId: projectIds })
          .orderBy`SortKey ASC, CreatedDate ASC`

        const foldersRaw = await cds.run(qFolders)
        folders = normalizeRows(foldersRaw)
      }

      const foldersByProject = {}
      for (const f of folders) {
        const pid = f.ProjectId || ''
        foldersByProject[pid] = foldersByProject[pid] || []
        foldersByProject[pid].push({
          FolderId: f.FolderId,
          FolderName: f.FolderName,
          ParentFolderId: f.ParentFolderId || '',
          SortKey: Number(f.SortKey || 0),
          Status: f.Status == null ? 1 : Number(f.Status)
        })
      }

      const buildTree = (flat) => {
        const map = {}
        flat.forEach(node => map[node.FolderId] = { ...node, SubFolders: [] })
        const roots = []
        flat.forEach(node => {
          if (node.ParentFolderId && map[node.ParentFolderId]) {
            map[node.ParentFolderId].SubFolders.push(map[node.FolderId])
          } else {
            roots.push(map[node.FolderId])
          }
        })
        const sortRecursive = (arr) => {
          arr.sort((a,b) => (a.SortKey - b.SortKey) || String(a.FolderName||'').localeCompare(String(b.FolderName||'')))
          arr.forEach(x => { if (x.SubFolders && x.SubFolders.length) sortRecursive(x.SubFolders) })
        }
        sortRecursive(roots)
        return roots
      }

      const ResponseData = projects.map(p => {
        const pf = foldersByProject[p.ProjectId] || []
        return {
          ClientId: p.ClientId,
          BusinessUnitId: p.BusinessUnitId,
          ProjectId: p.ProjectId,
          ProjectName: p.ProjectName,
          BusinessUnitName: '',
          Folders: buildTree(pf)
        }
      })

      console.log(`GetClientProjectsWithFolders -> projects:${projects.length} folders:${folders.length}`)

      return { status: 'success', ResponseData }
    } catch (err) {
      console.error('GetClientProjectsWithFolders error', err)
      return { status: 'fail', ResponseData: [], error: err && err.message ? err.message : String(err) }
    }
  })

  /* ----- Count, Add/Update, Delete ClientProjects ----- */

  /* 6) GetClientProjectsCountFilter */
  this.on('GetClientProjectsCountFilter', async (req) => {
    const tenant = getTenant(req);
    const { search, clientId, businessUnitId, projectId, status, fromDate, toDate } = req.data || {}
    const total = await countWithSearch(MAP.ClientProjects.entity, MAP.ClientProjects, {
      search, TenantId: tenant, ClientId: clientId, BusinessUnitId: businessUnitId, ProjectId: projectId, Status: status, fromDate, toDate
    })
    return toListResponse({ ResponseData: [{ total }] })
  })

  /* 7) AddUpdateClientProjects */
  this.on('AddUpdateClientProjects', async (req) => {
    const tenant = getTenant(req);
    const d = req.data || {}
    const key = Object.fromEntries(MAP.ClientProjects.keys.map(k => [k, d[k]]).filter(([_, v]) => notNull(v)))
    const exists = await cds.run(SELECT.one.from(MAP.ClientProjects.entity).where(key))
    const payload = { ProjectName: d.ProjectName, BusinessUnitId: d.BusinessUnitId, StartDate: d.StartDate, EndDate: d.EndDate, ProjectTypeId: d.ProjectTypeId, Description: d.Description, Status: d.Status, ModifiedDate: new Date() }
    if (exists) {
      await cds.run(UPDATE(MAP.ClientProjects.entity).set(payload).where(key))
      return messageOnly('updated')
    } else {
      await cds.run(INSERT.into(MAP.ClientProjects.entity).entries({ TenantId: tenant, ClientId: d.ClientId, ProjectId: d.ProjectId || cds.utils.uuid(), ...payload, CreatedDate: new Date() }))
      return messageOnly('created')
    }
  })

  /* 8) DeleteClientProjects */
  this.on('DeleteClientProjects', async (req) => {
    const tenant = getTenant(req);
    const key = Object.fromEntries(MAP.ClientProjects.keys.map(k => [k, req.data[k]]).filter(([_, v]) => notNull(v)))
    await cds.run(DELETE.from(MAP.ClientProjects.entity).where(key))
    return messageOnly('deleted')
  })

  /* ---------------- 2) Client Project Sprint (CRUD) ---------------- */

  /* 9) GetClientProjectSprint */
  this.on('GetClientProjectSprint', async (req) => {
    const tenant = getTenant(req);
    const rows = await cds.run(SELECT.from(MAP.ClientProjectSprint.entity).where({ TenantId: tenant }).orderBy `CreatedDate desc`)
    return toListResponse({ ResponseData: rows || [] })
  })

  /* 10) GetClientProjectSprintPaginationFilterSearch */
  this.on('GetClientProjectSprintPaginationFilterSearch', async (req) => {
    const tenant = getTenant(req);
    const { search, page = 1, pageSize = 25, clientId, projectId, sprintId, status, fromDate, toDate } = req.data || {}
    const rows = await listWithSearch(MAP.ClientProjectSprint.entity, MAP.ClientProjectSprint, {
      search, TenantId: tenant, ClientId: clientId, ProjectId: projectId, SprintId: sprintId, Status: status, fromDate, toDate
    }, { page, pageSize })
    return toListResponse({ ResponseData: rows || [] })
  })
  this.on('GetClientProjectSprintCountFilter', async (req) => {
    const tenant = getTenant(req);
    const { search, clientId, projectId, sprintId, status, fromDate, toDate } = req.data || {}
    const total = await countWithSearch(MAP.ClientProjectSprint.entity, MAP.ClientProjectSprint, {
      search, TenantId: tenant, ClientId: clientId, ProjectId: projectId, SprintId: sprintId, Status: status, fromDate, toDate
    })
    return toListResponse({ ResponseData: [{ total }] })
  })
  this.on('AddUpdateClientProjectSprint', async (req) => {
    const tenant = getTenant(req);
    const d = req.data || {}
    const key = Object.fromEntries(MAP.ClientProjectSprint.keys.map(k => [k, d[k]]).filter(([_, v]) => notNull(v)))
    const exists = await cds.run(SELECT.one.from(MAP.ClientProjectSprint.entity).where(key))
    const payload = { SprintName: d.SprintName, StartDate: d.StartDate, EndDate: d.EndDate, InputFileURL: d.InputFileURL, MarkdownFileURL: d.MarkdownFileURL, DataParseStatus: d.DataParseStatus, Status: d.Status, ModifiedDate: new Date() }
    if (exists) {
      await cds.run(UPDATE(MAP.ClientProjectSprint.entity).set(payload).where(key))
      return messageOnly('updated')
    } else {
      await cds.run(INSERT.into(MAP.ClientProjectSprint.entity).entries({ TenantId: tenant, ClientId: d.ClientId, ProjectId: d.ProjectId, SprintId: d.SprintId || cds.utils.uuid(), ...payload, CreatedDate: new Date() }))
      return messageOnly('created')
    }
  })
  this.on('DeleteClientProjectSprint', async (req) => {
    const tenant = getTenant(req);
    const key = Object.fromEntries(MAP.ClientProjectSprint.keys.map(k => [k, req.data[k]]).filter(([_, v]) => notNull(v)))
    await cds.run(DELETE.from(MAP.ClientProjectSprint.entity).where(key))
    return messageOnly('deleted')
  })

  /* ---------------- 3) Client Project Sessions (CRUD) ---------------- */
  this.on('GetClientProjectSessions', async (req) => {
    const tenant = getTenant(req);
    const rows = await cds.run(SELECT.from(MAP.ProjectSprintSessions.entity).where({ TenantId: tenant }).orderBy `CreatedDate desc`)
    return toListResponse({ ResponseData: rows || [] })
  })
  this.on('GetClientProjectSessionsPaginationFilterSearch', async (req) => {
    const tenant = getTenant(req);
    const { search, page = 1, pageSize = 25, clientId, projectId, sprintId, sessionId, status, fromDate, toDate } = req.data || {}
    const rows = await listWithSearch(MAP.ProjectSprintSessions.entity, MAP.ProjectSprintSessions, {
      search, ClientId: clientId, ProjectId: projectId, SprintId: sprintId, SessionId: sessionId, Status: status, fromDate, toDate
    }, { page, pageSize })
    return toListResponse({ ResponseData: rows || [] })
  })
  this.on('GetClientProjectSessionsCountFilter', async (req) => {
    const tenant = getTenant(req);
    const { search, clientId, projectId, sprintId, sessionId, status, fromDate, toDate } = req.data || {}
    const total = await countWithSearch(MAP.ProjectSprintSessions.entity, MAP.ProjectSprintSessions, {
      search, TenantId: tenant, ClientId: clientId, ProjectId: projectId, SprintId: sprintId, SessionId: sessionId, Status: status, fromDate, toDate
    })
    return toListResponse({ ResponseData: [{ total }] })
  })
  this.on('AddUpdateClientProjectSessions', async (req) => {
    const tenant = getTenant(req);
    const d = req.data || {}
    const key = Object.fromEntries(MAP.ProjectSprintSessions.keys.map(k => [k, d[k]]).filter(([_, v]) => notNull(v)))
    const exists = await cds.run(SELECT.one.from(MAP.ProjectSprintSessions.entity).where(key))
    const payload = { SessionStatus: d.SessionStatus, StatusInfo: d.StatusInfo, ElapsedTime: d.ElapsedTime, Progress: d.Progress, Status: d.Status, ModifiedDate: new Date() }
    if (exists) {
      await cds.run(UPDATE(MAP.ProjectSprintSessions.entity).set(payload).where(key))
      return messageOnly('updated')
    } else {
      await cds.run(INSERT.into(MAP.ProjectSprintSessions.entity).entries({ TenantId: tenant, ClientId: d.ClientId, ProjectId: d.ProjectId, SprintId: d.SprintId, SessionId: d.SessionId || cds.utils.uuid(), ...payload, CreatedDate: new Date() }))
      return messageOnly('created')
    }
  })
  this.on('DeleteClientProjectSessions', async (req) => {
    const tenant = getTenant(req);
    const key = Object.fromEntries(MAP.ProjectSprintSessions.keys.map(k => [k, req.data[k]]).filter(([_, v]) => notNull(v)))
    await cds.run(DELETE.from(MAP.ProjectSprintSessions.entity).where(key))
    return messageOnly('deleted')
  })

  /* ---------------- 4) Client Project Sessions Document Parse Status (CRUD) ---------------- */
  this.on('UpdateClientProjectSessionsDocumentParseStatus', async (req) => {
    const tenant = getTenant(req);  
    const { ClientId, ProjectId, SprintId, SessionId, DocumentId, SessionStatus, StatusInfo, ElapsedTime, Progress, DataParseStatus } = req.data;
    try {
      const effectiveProgress = Progress !== undefined ? Progress : progress;
      // update the same columns your original function updated, plus dataparsestatus if provided
    const payload = {
      sessionstatus: SessionStatus ?? undefined,
      statusinfo: StatusInfo ?? undefined,
      elapsedtime: ElapsedTime ?? undefined,
      progress: effectiveProgress ?? undefined,
      dataparsestatus: DataParseStatus ?? undefined,
      modifieddate: new Date()
    };

    // remove undefined keys so cds/SQL doesn't try to set them to null unintentionally
    for (const k of Object.keys(payload)) if (payload[k] === undefined) delete payload[k];

    await cds.run(UPDATE('projectsprintsessiondocument').set(payload).where({
      clientid: ClientId,
      projectid: ProjectId,
      sprintid: SprintId,
      sessionid: SessionId,
      documentid: DocumentId,
      tenantid: tenant
    }));

    // socket logic here
    const io = socket.get();
      if (io) {
        io.emit('session_status_updated', {
          data: req.data,
          SprintId,
          SessionId,
          Status: SessionStatus ?? null
        });
      } else {
        console.warn('[emit] socket.io not initialized yet');
      }

    return { message: 'updated' };
  } catch (e) {
    req._ && req._.log && req._.log.error && req._.log.error('UpdateClientProjectSessionsDocumentParseStatus error', e);
    return req.reject(500, e.message || String(e));
  }
});



  /* --------- Aggregation: GetProjectSprintSessions (Postgres-ready, lowercase) --------- */
  this.on('GetProjectSprintSessions', async (req) => {
    const tenant = getTenant(req);
    const {
      ClientId = '', ProjectId = '', SprintId = '', SourceType = '', BusinessProcessId = '', BusinessSubProcessId = '', SearchString = '', PageNo = 1
    } = req.data || {}

    const RecordsPerPage = 300
    const page = Math.max(1, Number(PageNo || 1))
    const offset = (page - 1) * RecordsPerPage

    const sourceFilter = SourceType ? `AND psd.sourcetype = ${escapeLiteral(SourceType)}` : ''
    const searchFilter = SearchString ? `AND (psd.sessionid ILIKE ${escapeLike(SearchString)} OR psd.documentname ILIKE ${escapeLike(SearchString)})` : ''
    const subProcFilter = BusinessSubProcessId ? `AND spsm.businesssubprocessid = ${escapeLiteral(BusinessSubProcessId)}` : ''
    const bpFilter = BusinessProcessId ? `  
      AND EXISTS (
        SELECT 1 FROM projectsprintsubprocessmaster spsm
        WHERE spsm.status = 1
          AND spsm.tenantid = ${tenant}
          AND spsm.clientid = psd.clientid
          AND spsm.projectid = psd.projectid
          AND spsm.sprintid = psd.sprintid
          AND spsm.businessprocessid = ${escapeLiteral(BusinessProcessId)}
          ${subProcFilter}
      )
    ` : ''

    const baseSql = `
      SELECT
        psd.*,
        COALESCE(scenarios.scenariocount,0) AS scenariocount,
        COALESCE(testcases.testcasecount,0) AS testcasecount
      FROM projectsprintsessiondocument psd
      LEFT JOIN (
        SELECT clientid, projectid, sprintid, sessionid, documentid, COUNT(*) AS scenariocount
        FROM projectsprintsessiondoctestscenarios
        WHERE status = 1
        GROUP BY clientid, projectid, sprintid, sessionid, documentid
      ) scenarios
        ON psd.clientid = scenarios.clientid
        AND psd.projectid = scenarios.projectid
        AND psd.sprintid = scenarios.sprintid
        AND psd.sessionid = scenarios.sessionid
        AND psd.documentid = scenarios.documentid
      LEFT JOIN (
        SELECT clientid, projectid, sprintid, sessionid, documentid, COUNT(*) AS testcasecount
        FROM projectsprintsessiondoctestcases
        WHERE status = 1
        GROUP BY clientid, projectid, sprintid, sessionid, documentid
      ) testcases
        ON psd.clientid = testcases.clientid
        AND psd.projectid = testcases.projectid
        AND psd.sprintid = testcases.sprintid
        AND psd.sessionid = testcases.sessionid
        AND psd.documentid = testcases.documentid
      WHERE psd.status = 1
        AND psd.clientid = $1
        AND psd.projectid = $2
        AND psd.sprintid = $3
        ${sourceFilter}
        ${bpFilter}
        ${searchFilter}
      ORDER BY CAST(regexp_replace(psd.documentid, '.*-(\\d+)$','\\1') AS INTEGER) DESC
      LIMIT $4 OFFSET $5
    `

    const countSql = `
      SELECT COUNT(*)::bigint AS total
      FROM projectsprintsessiondocument psd
      WHERE psd.status = 1
        AND psd.clientid = $1
        AND psd.projectid = $2
        AND psd.sprintid = $3
        ${sourceFilter}
        ${bpFilter}
        ${searchFilter}
    `

    const db = await cds.connect.to('db')
    try {
      const [{ total = 0 } = {}] = await db.run(countSql, [ClientId, ProjectId, SprintId])
      const totalRecords = Number(total || 0)
      const totalPages = Math.max(1, Math.ceil(totalRecords / RecordsPerPage))

      const rows = await db.run(baseSql, [ClientId, ProjectId, SprintId, RecordsPerPage, offset])

      const sessionMap = new Map()
      for (const r of rows || []) {
        const key = `${r.clientid}_${r.projectid}_${r.sprintid}_${r.sessionid}`
        if (!sessionMap.has(key)) {
          sessionMap.set(key, {
            ClientId: r.clientid,
            ProjectId: r.projectid,
            SprintId: r.sprintid,
            SessionId: r.sessionid,
            Documents: []
          })
        }
        sessionMap.get(key).Documents.push({
          ClientId: r.clientid,
          ProjectId: r.projectid,
          SprintId: r.sprintid,
          SessionId: r.sessionid,
          WorkspaceId: r.workspaceid || '',
          ImpactWorkspaceId: r.impactworkspaceid || null,
          DocumentId: r.documentid,
          DocumentName: r.documentname,
          InputFileURL: r.inputfileurl,
          MarkdownFileURL: r.markdownfileurl,
          SessionStatus: r.sessionstatus,
          StatusInfo: r.statusinfo,
          LLMEngine: r.llmengine,
          SourceType: r.sourcetype,
          StoryId: r.storyid || null,
          ElapsedTime: r.elapsedtime,
          Progress: r.progress,
          SortKey: r.sortkey,
          Status: r.status,
          CreatedDate: r.createddate,
          ModifiedDate: r.modifieddate,
          ScenarioCount: Number(r.scenariocount || 0),
          TestCaseCount: Number(r.testcasecount || 0)
        })
      }

      const ResponseData = Array.from(sessionMap.values())
      return toListResponse({ TotalRecords: totalRecords, RecordsPerPage, TotalPages: totalPages, CurrentPage: page, ResponseData })
    } catch (err) {
      service.log && service.log.error && service.log.error('GetProjectSprintSessions error', err)
      return req.reject(500, err.message || 'DB error')
    }
  })

  this.on('GetProjectSprintSessionsPaginated', async (req) => {
    const tenant = getTenant(req);
    const pageNo = Number(req.data?.PageNo || 1)
    req.data = { ...(req.data || {}), PageNo: pageNo }
    return await service.tx(async () => await this.emit('GetProjectSprintSessions', req))
  })

  /* ---------------- Remaining CRUD wrappers for other entities (unchanged patterns) ---------------- */
  this.on('GetProjectBRDSummary', async (req) => {
    const tenant = getTenant(req);
    const rows = await cds.run(SELECT.from(MAP.ProjectBRDSummary.entity).orderBy `CreatedDate desc`)
    return toListResponse({ ResponseData: rows || [] })
  })
  this.on('GetProjectBRDSummaryPaginationFilterSearch', async (req) => {
    const { page = 1, pageSize = 25, clientId, projectId, sprintId, sessionId, documentId } = req.data || {}
    const rows = await listWithSearch(MAP.ProjectBRDSummary.entity, MAP.ProjectBRDSummary, { ClientId: clientId, ProjectId: projectId, SprintId: sprintId, SessionId: sessionId, DocumentId: documentId }, { page, pageSize })
    return toListResponse({ ResponseData: rows || [] })
  })
  this.on('AddUpdateProjectBRDSummary', async (req) => {
    const d = req.data || {}
    const key = Object.fromEntries(MAP.ProjectBRDSummary.keys.map(k => [k, d[k]]).filter(([_, v]) => notNull(v)))
    const exists = await cds.run(SELECT.one.from(MAP.ProjectBRDSummary.entity).where(key))
    const payload = { BRDSummary: d.BRDSummary, SortKey: d.SortKey, Status: d.Status, ModifiedDate: new Date() }
    if (exists) { await cds.run(UPDATE(MAP.ProjectBRDSummary.entity).set(payload).where(key)); return messageOnly('updated') }
    await cds.run(INSERT.into(MAP.ProjectBRDSummary.entity).entries({ ClientId: d.ClientId, ProjectId: d.ProjectId, SprintId: d.SprintId, SessionId: d.SessionId, DocumentId: d.DocumentId, BRDSummaryId: d.BRDSummaryId || cds.utils.uuid(), ...payload, CreatedDate: new Date() }))
    return messageOnly('created')
  })
  this.on('DeleteProjectBRDSummary', async (req) => {
    const key = Object.fromEntries(MAP.ProjectBRDSummary.keys.map(k => [k, req.data[k]]).filter(([_, v]) => notNull(v)))
    await cds.run(DELETE.from(MAP.ProjectBRDSummary.entity).where(key))
    return messageOnly('deleted')
  })

  /* Project Business Requirements (test scenarios) */
  this.on('GetProjectBusinessRequirements', async (req) => {
    const rows = await cds.run(SELECT.from(MAP.ProjectBusinessRequirements.entity).orderBy `CreatedDate desc`)
    return toListResponse({ ResponseData: rows || [] })
  })
  this.on('GetProjectBusinessRequirementsPaginationFilterSearch', async (req) => {
    const { page = 1, pageSize = 25, clientId, projectId, sprintId, sessionId, documentId } = req.data || {}
    const rows = await listWithSearch(MAP.ProjectBusinessRequirements.entity, MAP.ProjectBusinessRequirements, { ClientId: clientId, ProjectId: projectId, SprintId: sprintId, SessionId: sessionId, DocumentId: documentId }, { page, pageSize })
    return toListResponse({ ResponseData: rows || [] })
  })
  this.on('AddUpdateProjectBusinessRequirements', async (req) => {
    const d = req.data || {}
    const key = { ClientId: d.ClientId, ProjectId: d.ProjectId, SprintId: d.SprintId, SessionId: d.SessionId, DocumentId: d.DocumentId, TestScenarioId: d.BusinessRequirementId }
    const exists = await cds.run(SELECT.one.from(MAP.ProjectBusinessRequirements.entity).where(key))
    const payload = { TestScenarioName: d.RequirementName, Description: d.RequirementValue, SortKey: d.SortKey, Status: d.Status, ModifiedDate: new Date() }
    if (exists) { await cds.run(UPDATE(MAP.ProjectBusinessRequirements.entity).set(payload).where(key)); return messageOnly('updated') }
    await cds.run(INSERT.into(MAP.ProjectBusinessRequirements.entity).entries({ ClientId: d.ClientId, ProjectId: d.ProjectId, SprintId: d.SprintId, SessionId: d.SessionId, DocumentId: d.DocumentId, TestScenarioId: d.BusinessRequirementId || cds.utils.uuid(), ...payload, CreatedDate: new Date() }))
    return messageOnly('created')
  })
  this.on('DeleteProjectBusinessRequirements', async (req) => {
    const key = { ClientId: req.data.ClientId, ProjectId: req.data.ProjectId, SprintId: req.data.SprintId, SessionId: req.data.SessionId, DocumentId: req.data.DocumentId, TestScenarioId: req.data.BusinessRequirementId }
    await cds.run(DELETE.from(MAP.ProjectBusinessRequirements.entity).where(key))
    return messageOnly('deleted')
  })

  /* Project Session Files (Documents) */
  this.on('GetProjectSessionFiles', async (req) => {
    const rows = await cds.run(SELECT.from(MAP.ProjectSessionFiles.entity).orderBy `CreatedDate desc`)
    return toListResponse({ ResponseData: rows || [] })
  })
  this.on('GetProjectSessionFilesPaginationFilterSearch', async (req) => {
    const { page = 1, pageSize = 25, clientId, projectId, sprintId, sessionId } = req.data || {}
    const rows = await listWithSearch(MAP.ProjectSessionFiles.entity, MAP.ProjectSessionFiles, { ClientId: clientId, ProjectId: projectId, SprintId: sprintId, SessionId: sessionId }, { page, pageSize })
    return toListResponse({ ResponseData: rows || [] })
  })
  this.on('GetSessionFilesDropdown', async (req) => {
    const { clientId, projectId, sprintId, sessionId } = req.data || {}
    const rows = await cds.run(SELECT.from(MAP.ProjectSessionFiles.entity).columns('DocumentId as id','DocumentName as text').where({ ClientId: clientId, ProjectId: projectId, SprintId: sprintId, SessionId: sessionId }).orderBy `DocumentName asc`)
    return toListResponse({ ResponseData: rows || [] })
  })
  this.on('GetDocumentNamesForDropdown', async (req) => {
    const { clientId, projectId, sprintId, sessionId } = req.data || {}
    const rows = await cds.run(SELECT.from(MAP.ProjectSessionFiles.entity).columns('DocumentName').distinct().where({ ClientId: clientId, ProjectId: projectId, SprintId: sprintId, SessionId: sessionId }).orderBy `DocumentName asc`)
    return toListResponse({ ResponseData: (rows || []).map(r => ({ text: r.DocumentName })) })
  })
  this.on('GetDocumentMarkdownFile', async (req) => {
    const key = Object.fromEntries(MAP.ProjectSessionFiles.keys.map(k => [k, req.data[k]]).filter(([_, v]) => notNull(v)))
    const row = await cds.run(SELECT.one.from(MAP.ProjectSessionFiles.entity).where(key))
    return toListResponse({ ResponseData: row ? [{ MarkdownFileURL: row.MarkdownFileURL }] : [] })
  })
  this.on('DownloadFile', async (req) => {
    const key = Object.fromEntries(MAP.ProjectSessionFiles.keys.map(k => [k, req.data[k]]).filter(([_, v]) => notNull(v)))
    const row = await cds.run(SELECT.one.from(MAP.ProjectSessionFiles.entity).where(key))
    return toListResponse({ ResponseData: row ? [{ url: row.InputFileURL || row.MarkdownFileURL }] : [] })
  })
  this.on('AddUpdateProjectSessionFiles', async (req) => {
    const d = req.data || {}
    const key = Object.fromEntries(MAP.ProjectSessionFiles.keys.map(k => [k, d[k]]).filter(([_, v]) => notNull(v)))
    const exists = await cds.run(SELECT.one.from(MAP.ProjectSessionFiles.entity).where(key))
    const payload = { DocumentName: d.DocumentName, InputFileURL: d.InputFileURL, MarkdownFileURL: d.MarkdownFileURL, LLMEngine: d.LLMEngine, SourceType: d.SourceType, StoryId: d.StoryId, SessionStatus: d.SessionStatus, StatusInfo: d.StatusInfo, ElapsedTime: d.ElapsedTime, Progress: d.Progress, Status: d.Status, ModifiedDate: new Date() }
    if (exists) {
      await cds.run(UPDATE(MAP.ProjectSessionFiles.entity).set(payload).where(key))
      return messageOnly('updated')
    } else {
      await cds.run(INSERT.into(MAP.ProjectSessionFiles.entity).entries({ ClientId: d.ClientId, ProjectId: d.ProjectId, SprintId: d.SprintId, SessionId: d.SessionId, DocumentId: d.DocumentId || cds.utils.uuid(), ...payload, CreatedDate: new Date() }))
      return messageOnly('created')
    }
  })
  this.on('DeleteProjectSessionFiles', async (req) => {
    const key = Object.fromEntries(MAP.ProjectSessionFiles.keys.map(k => [k, req.data[k]]).filter(([_, v]) => notNull(v)))
    await cds.run(DELETE.from(MAP.ProjectSessionFiles.entity).where(key))
    return messageOnly('deleted')
  })
  this.on('UpdateClientProjectSessionDocumentMarkdown', async (req) => {
    const { ClientId, ProjectId, SprintId, SessionId, DocumentId, MarkdownFileURL } = req.data || {}
    await cds.run(UPDATE(MAP.ProjectSessionFiles.entity).set({ MarkdownFileURL, ModifiedDate: new Date() }).where({ ClientId, ProjectId, SprintId, SessionId, DocumentId }))
    return messageOnly('updated')
  })

  /********************************************************************
   * Add/Update ProjectSprintSessionDocument(s) - CAP/CDS implementation
   ********************************************************************/
  async function _fetchCoreDynamicMeta(moduleName, subModuleName) {
    try {
      const db = await cds.connect.to('db');
      const tenant = getTenant(req);
      const rows = await db.run(
        `SELECT modulename, submodulename, prefix, suffix, sequenceno
         FROM coredynamictableids
         WHERE modulename = $1 AND submodulename = $2 AND tenantid = $3`,
        [moduleName, subModuleName, tenant]
      );
      if (!rows || !rows.length) return { status: 'fail', data: [], error: new Error('No CoreDynamicTableIds row') };
      return { status: 'success', data: [rows[0]] };
    } catch (e) {
      return { status: 'fail', data: [], error: e };
    }
  }

  async function _reserveCoreDynamicSeq(moduleName, subModuleName, count) {
    if (!count || count <= 0) {
      return _fetchCoreDynamicMeta(moduleName, subModuleName);
    }

    const db = await cds.connect.to('db');
    try {
      await db.run('BEGIN');

      // ensure row exists (use lowercase physical table)
      await db.run(
        `INSERT INTO coredynamictableids (modulename, submodulename, prefix, suffix, sequenceno)
         VALUES ($1, $2, '', '', 0)
         ON CONFLICT (modulename, submodulename) DO NOTHING`,
        [moduleName, subModuleName, tenant]
      );

      // lock the row for update
      const rows = await db.run(
        `SELECT prefix, suffix, sequenceno
         FROM coredynamictableids
         WHERE modulename = $1 AND submodulename = $2 AND tenantid = $3
         FOR UPDATE`,
        [moduleName, subModuleName, tenant]
      );

      if (!rows || !rows.length) {
        await db.run('ROLLBACK');
        return { status: 'fail', data: [], error: new Error('CoreDynamicTableIds row missing') };
      }

      const { prefix = '', suffix = '', sequenceno: prevSeqRaw } = rows[0];
      const prevSeq = Number(prevSeqRaw || 0);
      const startSeq = prevSeq + 1;
      const endSeq = startSeq + count - 1;

      await db.run(
        `UPDATE coredynamictableids SET sequenceno = $1
         WHERE modulename = $2 AND submodulename = $3 AND tenantid = $4`,
        [endSeq, moduleName, subModuleName, tenant]
      );

      await db.run('COMMIT');

      return {
        status: 'success',
        data: [{
          Prefix: prefix,
          Suffix: suffix,
          PrevSequenceNo: prevSeq,
          NewSequenceNo: endSeq,
          StartSeq: startSeq,
          EndSeq: endSeq,
          SequenceNo: prevSeq // legacy compatibility
        }]
      };
    } catch (e) {
      try { await db.run('ROLLBACK'); } catch(_) {}
      return { status: 'fail', data: [], error: e };
    }
  }

  async function _insertProjectSprintSessionDocument(doc, currentUser = 'system') {
    try {
      const tenant = getTenant(req);
      const entry = {
        createdat: new Date(),
        createdby: currentUser || 'system',
        modifiedat: new Date(),
        modifiedby: currentUser || 'system',
        tenantid: tenant,
        clientid: doc.ClientId,
        projectid: doc.ProjectId,
        sprintid: doc.SprintId,
        sessionid: doc.SessionId,
        documentid: doc.DocumentId,
        documentname: doc.DocumentName || null,
        inputfileurl: doc.InputFileURL || null,
        markdownfileurl: doc.MarkdownFileURL || null,
        storyid: doc.StoryId || null,
        sessionstatus: doc.SessionStatus || null,
        statusinfo: doc.StatusInfo ?? 'Document Parsing Initiated',
        llmengine: doc.LLMEngine || null,
        sourcetype: doc.SourceType || null,
        elapsedtime: doc.ElapsedTime || null,
        progress: doc.Progress ?? '0',
        sortkey: doc.SortKey ?? 0,
        status: doc.Status ?? 1,
        createddate: new Date(),
        modifieddate: new Date()
      };

      // use physical lowercase table name
      await cds.run(INSERT.into('projectsprintsessiondocument').entries(entry));
      return { status: 'success', data: { DocumentId: doc.DocumentId, InputFileURL: doc.InputFileURL } };
    } catch (e) {
      return { status: 'fail', data: [], error: e };
    }
  }

 async function _updateProjectSprintSessionDocument(doc) {
  try {
    const tenant = getTenant(req);
    const where = { clientid: doc.ClientId, projectid: doc.ProjectId, sprintid: doc.SprintId, sessionid: doc.SessionId }
    if (doc.DocumentId) where.documentid = doc.DocumentId
    where.tenantid = tenant;
    const payload = {
      inputfileurl: doc.InputFileURL || null,
      markdownfileurl: doc.MarkdownFileURL || null,
      sessionstatus: doc.SessionStatus || null,
      sortkey: doc.SortKey ?? 0,
      status: doc.Status ?? 1,
      modifieddate: new Date()
    }

    await cds.run(UPDATE('projectsprintsessiondocument').set(payload).where(where))

    // return the updated row for clarity
    const updated = await cds.run(SELECT.one.from('projectsprintsessiondocument').where(where))
    return { status: 'success', data: updated }
  } catch (e) {
    return { status: 'fail', data: [], error: e }
  }
}


  this.on('AddUpdateProjectSprintSessionDocuments', async (req) => {
    const tenant = getTenant(req);
    console.log('AddUpdateProjectSprintSessionDocuments')
    const docs = (req.data && req.data.Documents) || []
    const finalArray = {
      addProjectSprintSessionDocs: [],
      updateProjectSprintSessionDocs: [],
      addProjectSprintSessionDocs_error: [],
      updateProjectSprintSessionDocs_error: []
    }

    if (!Array.isArray(docs) || docs.length === 0) {
      return req.reject(400, 'Documents must be a non-empty array')
    }

    try {
      const newDocsCount = docs.filter(d => !d.DocumentId).length

      // Reserve sequence numbers in DB if we have new docs
      let idMeta
      if (newDocsCount > 0) {
        const res = await _reserveCoreDynamicSeq('ProjectSprintSessionDocument', 'Identification', newDocsCount)
        if (res.status !== 'success') {
          // fallback to simple fetch
          const fallback = await _fetchCoreDynamicMeta('ProjectSprintSessionDocument', 'Identification')
          if (fallback.status !== 'success') throw new Error('Could not obtain CoreDynamicTableIds metadata')
          idMeta = fallback.data[0]
        } else {
          idMeta = res.data[0]
        }
      } else {
        const meta = await _fetchCoreDynamicMeta('ProjectSprintSessionDocument', 'Identification')
        idMeta = meta.status === 'success' ? meta.data[0] : { Prefix: '', Suffix: '', SequenceNo: 0 }
      }

      // set starting seq: if NewSequenceNo available then PrevSequenceNo exists; fallback uses SequenceNo
      let seq = Number(idMeta.PrevSequenceNo ?? idMeta.SequenceNo ?? 0) + 1
      const prefix = idMeta.Prefix ?? ''
      const suffix = idMeta.Suffix ?? ''

      // determine current user (pass to insert helper)
      const requestUser = (req && req.user && (req.user.id || req.user.username)) || (cds.context && cds.context.user && (cds.context.user.id || cds.context.user.username)) || 'system'

      for (const doc of docs) {
        try {
          if (!doc.DocumentId) {
            // generate DocumentId without stray leading hyphen
            const idNumber = seq++
            const usePrefixSuffix = (prefix || suffix)
            const serial = String(idNumber) // change pad if you want fixed width
            if (usePrefixSuffix) {
              doc.DocumentId = `${prefix}${suffix}-${serial}`
            } else {
              // fallback to plain numeric id; OR change to `DOC-00001` if preferred
              doc.DocumentId = serial
            }

            const r = await _insertProjectSprintSessionDocument(doc, requestUser)
            if (r.status === 'success') {
              finalArray.addProjectSprintSessionDocs.push({ insertId: doc.DocumentId, InputFileURL: doc.InputFileURL })
            } else {
              finalArray.addProjectSprintSessionDocs_error.push(r.error || r)
            }
          } else {
            const r = await _updateProjectSprintSessionDocument(doc)
            if (r.status === 'success') {
              finalArray.updateProjectSprintSessionDocs.push(r.data)
            } else {
              finalArray.updateProjectSprintSessionDocs_error.push(r.error || r)
            }
          }
        } catch (innerErr) {
          const errEntry = { DocumentId: doc.DocumentId || 'N/A', error: innerErr.message || innerErr }
          if (!doc.DocumentId) finalArray.addProjectSprintSessionDocs_error.push(errEntry)
          else finalArray.updateProjectSprintSessionDocs_error.push(errEntry)
        }
      }

      // If we used fallback metadata (no FOR UPDATE reserved path) we need to persist seq
      if (newDocsCount > 0 && idMeta && idMeta.NewSequenceNo === undefined) {
        try {
          const db = await cds.connect.to('db')
          const finalSeq = seq - 1
          await db.run(
            `UPDATE coredynamictableids SET sequenceno = $1
             WHERE modulename = $2 AND submodulename = $3 AND tenantid = $4`,
            [finalSeq, 'ProjectSprintSessionDocument', 'Identification', tenant]
          )
        } catch (persistErr) {
          finalArray.general_error = finalArray.general_error || ''
          finalArray.general_error += `; sequence persist failed: ${persistErr.message || persistErr}`
          req._ && req._.log && req._.log.error && req._.log.error('persist seq error', persistErr)
        }
      }
    } catch (err) {
      finalArray.general_error = err.message || String(err)
      req._ && req._.log && req._.log.error && req._.log.error('AddUpdateProjectSprintSessionDocuments error', err)
    }

    return finalArray
  })



  //AddProjectSprintSessionDocBRDSummary (legacy shape)
  this.on('AddProjectSprintSessionDocBRDSummary', async (req) => {
    const tenant = getTenant(req);
    console.log('AddProjectSprintSessionDocBRDSummary')
    const payload = req.data || {}
    const { Data = {}, ...requestObjRaw } = payload
    const requestObj = { ...requestObjRaw }
    if (!requestObj.BusinessUnitId && requestObj.BusinessUnitID) requestObj.BusinessUnitId = requestObj.BusinessUnitID
    const { BRDSummary = '', ImpactAnalysis = {}, TestStrategy = {}, UncoveredSections = [], TestScenarios = [] } = Data || {}
    requestObj.tenantid = tenant;
    for (const k of ['ClientId', 'ProjectId', 'SprintId', 'SessionId']) {
      if (!requestObj[k]) return req.reject(400, `${k} is required`)
    }

    const db = await cds.connect.to('db')
    const finalResult = { addProjectBRDSummary: null, TestScenarios: [], UncoveredSections: [] }

    try {
      await db.run('BEGIN')

      // generate DocumentId if missing
      if (!requestObj.DocumentId) {
        const docMetaRes = await _reserveCoreDynamicSeq('ProjectSprintSessionDocument', 'Identification', 1)
        if (docMetaRes.status !== 'success') throw new Error('Could not allocate DocumentId')
        const docMeta = docMetaRes.data[0]
        requestObj.DocumentId = (docMeta.Prefix || docMeta.Suffix)
          ? `${docMeta.Prefix || ''}${docMeta.Suffix || ''}-${docMeta.StartSeq}`
          : String(docMeta.StartSeq)
        finalResult.DocumentId = requestObj.DocumentId
      }

      // 1) BRD summary
      const brdMetaRes = await _reserveCoreDynamicSeq('ProjectSessionDocBRDSummary', 'Identification', 1)
      if (brdMetaRes.status !== 'success') throw new Error('Could not allocate BRDSummaryId')
      const brdMeta = brdMetaRes.data[0]
      requestObj.BRDSummaryId = (brdMeta.Prefix || brdMeta.Suffix)
        ? `${brdMeta.Prefix || ''}${brdMeta.Suffix || ''}-${brdMeta.StartSeq}`
        : String(brdMeta.StartSeq)

      await db.run(
        `INSERT INTO projectsprintsessiondocbrdsummary
          (tenantid, clientid, projectid, sprintid, sessionid, documentid, brdsummaryid, brdsummary, sortkey, status, createddate, modifieddate)
         VALUES ($1,$2,$3,$4,$5,$6,$7,0,1,$8,$9)`,
        [
          requestObj.tenantid, requestObj.ClientId, requestObj.ProjectId, requestObj.SprintId, requestObj.SessionId,
          requestObj.DocumentId, requestObj.BRDSummaryId, String(BRDSummary || '').trim(),
          new Date(), new Date()
        ]
      )
      finalResult.addProjectBRDSummary = { BRDSummaryId: requestObj.BRDSummaryId }

      // 2) VersionId
      const verRows = await db.run(
        `SELECT versionid FROM projectsprintsessiondoctestscenarios
         WHERE clientid = $1 AND projectid = $2 AND sprintid = $3 AND sessionid = $4 AND documentid = $5
         ORDER BY createddate DESC LIMIT 1`,
        [requestObj.ClientId, requestObj.ProjectId, requestObj.SprintId, requestObj.SessionId, requestObj.DocumentId]
      )
      let versionNumber = 1
      if (verRows && verRows.length > 0 && verRows[0].versionid) {
        const raw = String(verRows[0].versionid)
        const parts = raw.split('-')
        const n = Number(parts[1] || parts[parts.length - 1] || 0)
        if (!Number.isNaN(n)) versionNumber = n + 1
      }
      requestObj.VersionId = `VER-${versionNumber}`

      // 3) TestScenarios
      if (Array.isArray(TestScenarios) && TestScenarios.length > 0) {
        const count = TestScenarios.length
        const trMetaRes = await _reserveCoreDynamicSeq('ProjectSprintSessionDocScenario', 'Identification', count)
        if (trMetaRes.status !== 'success') throw new Error('Failed to reserve TestScenario sequence numbers')
        const trMeta = trMetaRes.data[0]
        let seq = trMeta.StartSeq

        for (const sc of TestScenarios) {
          if (trMeta.Prefix || trMeta.Suffix) {
            sc.TestScenarioId = `${trMeta.Prefix || ''}${trMeta.Suffix || ''}-${seq++}`
          } else {
            sc.TestScenarioId = String(seq++)
          }

          let relatedTcodesForDb = ''
          if (Array.isArray(sc.RelatedTCodes)) relatedTcodesForDb = JSON.stringify(sc.RelatedTCodes)
          else if (typeof sc.RelatedTCodes === 'string') {
            try { relatedTcodesForDb = JSON.stringify(JSON.parse(sc.RelatedTCodes)) }
            catch (_) { relatedTcodesForDb = sc.RelatedTCodes || '' }
          } else {
            relatedTcodesForDb = JSON.stringify([])
          }

          await db.run(
            `INSERT INTO projectsprintsessiondoctestscenarios (
              tenantid, clientid, projectid, sprintid, sessionid, documentid, testscenarioid, versionid,
               testscenarioname, description, priority, doctraceabilitysources, scenariotraceabilitysources,
               businesslogic, sectiontitle, sectioncontent, relatedtcodes, acceptancecriteria,
               sortkey, status, createddate, modifieddate
             ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,0,1,$18,$19)
             ON CONFLICT (tenantid, clientid, projectid, sprintid, sessionid, documentid, testscenarioid)
             DO UPDATE SET
               testscenarioname = EXCLUDED.testscenarioname,
               description = EXCLUDED.description,
               priority = EXCLUDED.priority,
               doctraceabilitysources = EXCLUDED.doctraceabilitysources,
               scenariotraceabilitysources = EXCLUDED.scenariotraceabilitysources,
               businesslogic = EXCLUDED.businesslogic,
               sectiontitle = EXCLUDED.sectiontitle,
               sectioncontent = EXCLUDED.sectioncontent,
               relatedtcodes = EXCLUDED.relatedtcodes,
               acceptancecriteria = EXCLUDED.acceptancecriteria,
               modifieddate = EXCLUDED.modifieddate`,
            [
              requestObj.tenantid, requestObj.ClientId, requestObj.ProjectId, requestObj.SprintId, requestObj.SessionId, requestObj.DocumentId,
              sc.TestScenarioId, requestObj.VersionId,
              sc.TestScenarioName?.trim() || '',
              sc.Description?.trim() || '',
              sc.Priority?.trim() || '',
              sc.DocTraceabilitySources?.trim() || '',
              sc.ScenarioTraceabilitySources?.trim() || '',
              sc.BusinessLogic?.trim() || '',
              sc.SectionTitle?.trim() || '',
              sc.SectionContent?.trim() || '',
              relatedTcodesForDb,
              sc.AcceptanceCriteria?.trim() || '',
              new Date(), new Date()
            ]
          )

          finalResult.TestScenarios.push(sc)
        }
      }

      // 4) Uncovered sections
      if (Array.isArray(UncoveredSections) && UncoveredSections.length > 0) {
        const count = UncoveredSections.length
        const msMetaRes = await _reserveCoreDynamicSeq('ProjectSprintSessionDocMissedScenario', 'Identification', count)
        if (msMetaRes.status !== 'success') throw new Error('Failed to reserve MissedSections sequence numbers')
        const msMeta = msMetaRes.data[0]
        let seq2 = msMeta.StartSeq

        for (const sec of UncoveredSections) {
          if (msMeta.Prefix || msMeta.Suffix) {
            sec.DocSectionId = `${msMeta.Prefix || ''}${msMeta.Suffix || ''}-${seq2++}`
          } else {
            sec.DocSectionId = String(seq2++)
          }

          await db.run(
            `INSERT INTO projectsprintsessiondocmissedsections (
               clientid, businessunitid, projectid, sprintid, sessionid, documentid, docsectionid,
               sectiontitle, sectioncontent, sortkey, status, createddate, modifieddate
             ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,0,1,$10,$11)`,
            [
              requestObj.ClientId,
              requestObj.BusinessUnitId || null,
              requestObj.ProjectId,
              requestObj.SprintId,
              requestObj.SessionId,
              requestObj.DocumentId,
              sec.DocSectionId,
              sec.SectionTitle?.trim() || '',
              sec.SectionContent?.trim() || '',
              new Date(),
              new Date()
            ]
          )

          finalResult.UncoveredSections.push(sec)
        }
      }

      // 5) Impact analysis
      if (ImpactAnalysis && typeof ImpactAnalysis === 'object') {
        // accept alternate field names from legacy callers
        const iaImpact = ImpactAnalysis.Impact ?? ImpactAnalysis.ImpactTitle ?? ''
        const iaDescription = ImpactAnalysis.Description ?? ImpactAnalysis.ImpactDescription ?? ''

        const iaMetaRes = await _reserveCoreDynamicSeq('ProjectSprintSessionDocImpactAnalysis', 'Identification', 1)
        if (iaMetaRes.status !== 'success') throw new Error('Failed to reserve ImpactAnalysis sequence numbers')
        const iaMeta = iaMetaRes.data[0]
        requestObj.ImpactAnalysisId = (iaMeta.Prefix || iaMeta.Suffix)
          ? `${iaMeta.Prefix || ''}${iaMeta.Suffix || ''}-${iaMeta.StartSeq}`
          : String(iaMeta.StartSeq)

        await db.run(
          `INSERT INTO projectsprintsessiondocimpactanalysis (
             tenantid, clientid, projectid, sprintid, sessionid, documentid, impactanalysisid,
             impact, affectedsystems, stakeholders, impactlevel, justification, description,
             sortkey, status, createddate, modifieddate
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,0,1,$13,$14)`,
          [
          requestObj.tenantid,
          requestObj.ClientId,
          requestObj.ProjectId,
          requestObj.SprintId,
          requestObj.SessionId,
          requestObj.DocumentId,
          requestObj.ImpactAnalysisId,
          iaImpact?.trim() || '',
          ImpactAnalysis.AffectedSystems?.trim() || '',
          ImpactAnalysis.Stakeholders?.trim() || '',
          ImpactAnalysis.ImpactLevel?.trim() || '',
          ImpactAnalysis.Justification?.trim() || '',
          iaDescription?.trim() || '',
          new Date(),
          new Date()
        ]
      )

        finalResult.addProjectImpactAnalysis = { ImpactAnalysisId: requestObj.ImpactAnalysisId }
      }

      // 6) Test strategy
      if (TestStrategy && typeof TestStrategy === 'object') {
        const tsValue = TestStrategy.TestStrategy ?? TestStrategy.TestStrategyDescription ?? ''
        const tsMetaRes = await _reserveCoreDynamicSeq('ProjectSprintSessionDocTestStrategy', 'Identification', 1)
        if (tsMetaRes.status !== 'success') throw new Error('Failed to reserve TestStrategy sequence numbers')
        const tsMeta = tsMetaRes.data[0]
        requestObj.TestStrategyId = (tsMeta.Prefix || tsMeta.Suffix)
          ? `${tsMeta.Prefix || ''}${tsMeta.Suffix || ''}-${tsMeta.StartSeq}`
          : String(tsMeta.StartSeq)

        await db.run(
          `INSERT INTO projectsprintsessiondocteststrategy (
             tenantid, clientid, projectid, sprintid, sessionid, documentid, teststrategyid,
             teststrategy, testtypes, testenvironment, sortkey, status, createddate, modifieddate
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,0,1,$13,$14)`,
          [
          requestObj.tenantid,
          requestObj.ClientId,
          requestObj.ProjectId,
          requestObj.SprintId,
          requestObj.SessionId,
          requestObj.DocumentId,
          requestObj.TestStrategyId,
          tsValue?.trim() || '',
          TestStrategy.TestTypes?.trim() || '',
          TestStrategy.TestEnvironment?.trim() || '',
          new Date(),
          new Date()
        ]
      )

        finalResult.addProjectTestStrategy = { TestStrategyId: requestObj.TestStrategyId }
      }

      await db.run('COMMIT')
      return finalResult
    } catch (err) {
      try { await db.run('ROLLBACK') } catch (_) {}
      finalResult.error = err && (err.message || String(err))
      return req.reject(500, finalResult.error)
    }
  })

  //AddProjectSprintSessionDocBRDSummaryV2
this.on('AddProjectSprintSessionDocBRDSummaryV2', async (req) => {
  const tenantid = req.tenantid;
  const payload = req.data || {};
  console.log('AddProjectSprintSessionDocBRDSummaryV2')
  const { Data = {}, ...requestObj } = payload;
  if (!Data || typeof Data !== 'object') return req.reject(400, 'Data is required');

  const { BRDSummary = '', TestScenarios = [], UncoveredSections = [] } = Data;
  const finalResult = { addProjectBRDSummary: null, TestScenarios: [], UncoveredSections: [], error: null };

  // validate keys
  for (const k of ['tenantid', 'ClientId', 'ProjectId', 'SprintId', 'SessionId', 'DocumentId']) {
    if (!requestObj[k]) return req.reject(400, `${k} is required`);
  }

  const db = await cds.connect.to('db');

  try {
    await db.run('BEGIN');

    // 1) allocate BRDSummaryId
const brdMetaRes = await _reserveCoreDynamicSeq('ProjectSessionDocBRDSummary', 'Identification', 1);
if (brdMetaRes.status !== 'success') {
  const fallback = await _fetchCoreDynamicMeta('ProjectSessionDocBRDSummary', 'Identification');
  if (fallback.status !== 'success') throw new Error('Could not allocate BRDSummaryId (reserve & fallback failed)');
  const meta = fallback.data[0];
  const seq = Number(meta.SequenceNo || 0) + 1;

  // Only include hyphen when prefix or suffix exist
  requestObj.BRDSummaryId = (meta.Prefix || meta.Suffix)
    ? `${meta.Prefix || ''}${meta.Suffix || ''}-${seq}`
    : String(seq);

  await db.run(
    `UPDATE coredynamictableids SET sequenceno = $1 WHERE modulename = $2 AND submodulename = $3`,
    [seq, 'ProjectSessionDocBRDSummary', 'Identification']
  );
} else {
  const meta = brdMetaRes.data[0];

  requestObj.BRDSummaryId = (meta.Prefix || meta.Suffix)
    ? `${meta.Prefix || ''}${meta.Suffix || ''}-${meta.StartSeq}`
    : String(meta.StartSeq);
}
    // 2) insert BRD summary (use lowercase column names)
    await db.run(
      `INSERT INTO projectsprintsessiondocbrdsummary
        (clientid, projectid, sprintid, sessionid, documentid, brdsummaryid, brdsummary, sortkey, status, createddate, modifieddate)
       VALUES ($1,$2,$3,$4,$5,$6,$7,0,1,$8,$9)`,
      [
        requestObj.ClientId, requestObj.ProjectId, requestObj.SprintId, requestObj.SessionId,
        requestObj.DocumentId, requestObj.BRDSummaryId, String(BRDSummary || '').trim(),
        new Date(), new Date()
      ]
    );
    finalResult.addProjectBRDSummary = requestObj.BRDSummaryId;

    // 3) compute VersionId (include sprintid)
    const verRows = await db.run(
      `SELECT versionid FROM projectsprintsessiondoctestscenarios
       WHERE clientid = $1 AND projectid = $2 AND sprintid = $3 AND sessionid = $4 AND documentid = $5
       ORDER BY createddate DESC LIMIT 1`,
      [requestObj.ClientId, requestObj.ProjectId, requestObj.SprintId, requestObj.SessionId, requestObj.DocumentId]
    );
    let versionNumber = 1;
    if (verRows && verRows.length > 0 && verRows[0].versionid) {
      const raw = String(verRows[0].versionid);
      const parts = raw.split('-');
      const n = Number(parts[1] || parts[parts.length - 1] || 0);
      if (!Number.isNaN(n)) versionNumber = n + 1;
    }
    requestObj.VersionId = `VER-${versionNumber}`;

    // 4) Insert TestScenarios
    if (Array.isArray(TestScenarios) && TestScenarios.length > 0) {
      const count = TestScenarios.length;
      const trMetaRes = await _reserveCoreDynamicSeq('ProjectSprintSessionDocScenario', 'Identification', count);
      if (trMetaRes.status !== 'success') throw new Error('Failed to reserve TestScenario sequence numbers');
      const trMeta = trMetaRes.data[0];
      let seq = trMeta.StartSeq;

      for (const sc of TestScenarios) {
       if (trMeta.Prefix || trMeta.Suffix) {
  sc.TestScenarioId = `${trMeta.Prefix || ''}${trMeta.Suffix || ''}-${seq++}`;
} else {
  sc.TestScenarioId = String(seq++);
}

        // prepare relatedtcodes as JSON text
        let relatedTcodesForDb = '';
        if (Array.isArray(sc.RelatedTCodes)) relatedTcodesForDb = JSON.stringify(sc.RelatedTCodes);
        else if (typeof sc.RelatedTCodes === 'string') {
          // try parse a JSON string; otherwise use raw string
          try { relatedTcodesForDb = JSON.stringify(JSON.parse(sc.RelatedTCodes)); }
          catch (_) { relatedTcodesForDb = sc.RelatedTCodes || ''; }
        } else {
          relatedTcodesForDb = JSON.stringify([]);
        }

        await db.run(
          `INSERT INTO projectsprintsessiondoctestscenarios (
             clientid, projectid, sprintid, sessionid, documentid, testscenarioid, versionid,
             testscenarioname, description, priority, doctraceabilitysources, scenariotraceabilitysources,
             businesslogic, sectiontitle, sectioncontent, relatedtcodes, acceptancecriteria,
             sortkey, status, createddate, modifieddate
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,0,1,$18,$19)
           ON CONFLICT (clientid, projectid, sprintid, sessionid, documentid, testscenarioid)
           DO UPDATE SET
             testscenarioname = EXCLUDED.testscenarioname,
             description = EXCLUDED.description,
             priority = EXCLUDED.priority,
             doctraceabilitysources = EXCLUDED.doctraceabilitysources,
             scenariotraceabilitysources = EXCLUDED.scenariotraceabilitysources,
             businesslogic = EXCLUDED.businesslogic,
             sectiontitle = EXCLUDED.sectiontitle,
             sectioncontent = EXCLUDED.sectioncontent,
             relatedtcodes = EXCLUDED.relatedtcodes,
             acceptancecriteria = EXCLUDED.acceptancecriteria,
             modifieddate = EXCLUDED.modifieddate`,
          [
            requestObj.ClientId, requestObj.ProjectId, requestObj.SprintId, requestObj.SessionId, requestObj.DocumentId,
            sc.TestScenarioId, requestObj.VersionId,
            sc.TestScenarioName?.trim() || '',
            sc.Description?.trim() || '',
            sc.Priority?.trim() || '',
            sc.DocTraceabilitySources?.trim() || '',
            sc.ScenarioTraceabilitySources?.trim() || '',
            sc.BusinessLogic?.trim() || '',
            sc.SectionTitle?.trim() || '',
            sc.SectionContent?.trim() || '',
            relatedTcodesForDb,
            sc.AcceptanceCriteria?.trim() || '',
            new Date(), new Date()
          ]
        );

        finalResult.TestScenarios.push(sc.TestScenarioId);
      }
    }

    // 5) Insert UncoveredSections
    if (Array.isArray(UncoveredSections) && UncoveredSections.length > 0) {
      const count = UncoveredSections.length;
      const msMetaRes = await _reserveCoreDynamicSeq('ProjectSprintSessionDocMissedScenario', 'Identification', count);
      if (msMetaRes.status !== 'success') throw new Error('Failed to reserve MissedSections sequence numbers');
      const msMeta = msMetaRes.data[0];
      let seq2 = msMeta.StartSeq;

      for (const sec of UncoveredSections) {
       if (msMeta.Prefix || msMeta.Suffix) {
  sec.DocSectionId = `${msMeta.Prefix || ''}${msMeta.Suffix || ''}-${seq2++}`;
} else {
  sec.DocSectionId = String(seq2++);
}

        await db.run(
          `INSERT INTO projectsprintsessiondocmissedsections (
             clientid, businessunitid, projectid, sprintid, sessionid, documentid, docsectionid,
             sectiontitle, sectioncontent, sortkey, status, createddate, modifieddate
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,0,1,$10,$11)`,
          [
            requestObj.ClientId,
            requestObj.BusinessUnitId || null,
            requestObj.ProjectId,
            requestObj.SprintId,
            requestObj.SessionId,
            requestObj.DocumentId,
            sec.DocSectionId,
            sec.SectionTitle?.trim() || '',
            sec.SectionContent?.trim() || '',
            new Date(),
            new Date()
          ]
        );

        finalResult.UncoveredSections.push(sec.DocSectionId);
      }
    }

    await db.run('COMMIT');
    return finalResult;
  } catch (err) {
    try { await db.run('ROLLBACK'); } catch (_) {}
    finalResult.error = err && (err.message || String(err));
    return req.reject(500, finalResult.error);
  }
});
this.on('GetProjectSprintSessionDocBRDSummaryPaginationFilterSearch',
  async req => {
    const { ClientId, ProjectId, SprintId, SessionId, DocumentId } = req.data
    const db = cds.transaction(req)

    const where = { Status: 1, ClientId, ProjectId, SprintId, SessionId, DocumentId }

    const [
      brdSummaryRows,
      testStrategyRows,
      impactAnalysisRows,
      uncoveredSectionRows
    ] = await Promise.all([
      db.read('ProjectSprintSessionDocBRDSummary').where(where),
      db.read('ProjectSprintSessionDocTestStrategy').where(where),
      db.read('ProjectSprintSessionDocImpactAnalysis').where(where),
      db.read('ProjectSprintSessionDocMissedSections').where(where)
    ])

    return {
      BRDSummary: brdSummaryRows,
      TestStrategy: testStrategyRows,
      ImpactAnalysis: impactAnalysisRows,
      UncoveredSections: uncoveredSectionRows
    }
  }
)

})
