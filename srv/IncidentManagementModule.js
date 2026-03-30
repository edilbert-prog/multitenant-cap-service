// CAP impl for Incident Management (PostgreSQL via cds-pg)
// Mirrors Express envelopes & names

const cds = require('@sap/cds')

// envelopes identical to your Express API
const ok  = (data) => ({ status: 'ok', data: JSON.stringify(data ?? []) })
const msg = (message) => ({ message })

// utility
const notNull = (v) => v !== undefined && v !== null && v !== ''
const withPaging = (q, pageNo = 1, pageSize = 25) =>
  q.limit(pageSize).offset(Math.max(0, (pageNo - 1) * pageSize))
const addRange = (q, from, to, col = 'CreatedDate') => {
  if (from) q.where`${{ref:[col]}} >= ${from}`
  if (to)   q.where`${{ref:[col]}} <= ${to}`
}
const likeOrs = (cols, text) => {
  const like = `%${(text||'').replace(/'/g,"''")}%`
  return cols.map(c => cds.parse.expr(`${c} like '${like}'`))
             .reduce((a,b)=> a ? { or:[a,b] } : b, null)
}

// entities (adjust only these names if your db entity names differ)
const T = {
  IncidentMaster: 'IncidentMaster',
  IncidentProcessMaster: 'IncidentProcessMaster',
}

module.exports = cds.service.impl(function () {
  // -----------------------------------------------
  // 1) Incident Master
  // -----------------------------------------------
  this.on('GetIncidentMaster', async () => {
    const rows = await SELECT.from(T.IncidentMaster).orderBy`CreatedDate desc`
    return ok(rows)
  })

  this.on('GetIncidentById', async (req) => {
    const { IncidentId } = req.data
    const row = await SELECT.one.from(T.IncidentMaster).where({ IncidentId })
    return ok(row ? [row] : [])
  })

  this.on('AddIncidentMaster', async (req) => {
    const d = req.data
    const key = { IncidentId: d.IncidentId }
    const exists = d.IncidentId
      ? await SELECT.one.from(T.IncidentMaster).where(key)
      : null

    const payload = {
      Incident: d.Incident,
      Description: d.Description,
      LoggedBy: d.LoggedBy,
      AssignedTo: d.AssignedTo,
      DateTime: d.DateTime,
      IncidentType: d.IncidentType,
      Status: d.Status,
      SortKey: d.SortKey,
      ModifiedDate: new Date()
    }

    if (exists) {
      await UPDATE(T.IncidentMaster).set(payload).where(key)
      return msg('updated')
    } else {
      await INSERT.into(T.IncidentMaster).entries({
        IncidentId: d.IncidentId || cds.utils.uuid(),
        ...payload,
        CreatedDate: new Date()
      })
      return msg('created')
    }
  })

  this.on('DeleteIncidentMaster', async (req) => {
    const { IncidentId } = req.data
    await DELETE.from(T.IncidentMaster).where({ IncidentId })
    return msg('deleted')
  })

  // -----------------------------------------------
  // 2) Incident Process Master
  // -----------------------------------------------
  this.on('GetIncidentProcessMaster', async () => {
    const rows = await SELECT.from(T.IncidentProcessMaster).orderBy`CreatedDate desc`
    return ok(rows)
  })

  this.on('GetIncidentProcessById', async (req) => {
    const { IncidentProcessId } = req.data
    const row = await SELECT.one.from(T.IncidentProcessMaster).where({ IncidentProcessId })
    return ok(row ? [row] : [])
  })

  this.on('GetIncidentProcessByIncidentId', async (req) => {
    const { IncidentId } = req.data
    const rows = await SELECT.from(T.IncidentProcessMaster).where({ IncidentId }).orderBy`CreatedDate desc`
    return ok(rows)
  })

  this.on('AddIncidentProcessMaster', async (req) => {
    const d = req.data
    const key = { IncidentProcessId: d.IncidentProcessId }
    const exists = d.IncidentProcessId
      ? await SELECT.one.from(T.IncidentProcessMaster).where(key)
      : null

    const payload = {
      IncidentId: d.IncidentId,
      Description: d.Description,
      AssignedTo: d.AssignedTo,
      Status: d.Status,
      SortKey: d.SortKey,
      ModifiedDate: new Date()
    }

    if (exists) {
      await UPDATE(T.IncidentProcessMaster).set(payload).where(key)
      return msg('updated')
    } else {
      await INSERT.into(T.IncidentProcessMaster).entries({
        IncidentProcessId: d.IncidentProcessId || cds.utils.uuid(),
        ...payload,
        CreatedDate: new Date()
      })
      return msg('created')
    }
  })

  this.on('DeleteIncidentProcessMaster', async (req) => {
    const { IncidentProcessId } = req.data
    await DELETE.from(T.IncidentProcessMaster).where({ IncidentProcessId })
    return msg('deleted')
  })

  // -----------------------------------------------
  // 3) Incidents (pagination, counts, updates, helpers)
  // NOTE: these operate on IncidentMaster table per your models.
  // -----------------------------------------------
  this.on('GetIncidentsMasterPaginationFilterSearch', async (req) => {
    const {
      SearchString, PageNo=1, PageSize=25, Status,
      FromDate, ToDate, IncidentType, LoggedBy, AssignedTo
    } = req.data

    const q = SELECT.from(T.IncidentMaster).orderBy`CreatedDate desc`
    withPaging(q, PageNo, PageSize)

    if (notNull(Status))       q.where({ Status })
    if (notNull(IncidentType)) q.where({ IncidentType })
    if (notNull(LoggedBy))     q.where({ LoggedBy })
    if (notNull(AssignedTo))   q.where({ AssignedTo })
    if (notNull(SearchString)) q.where(likeOrs(
      ['Incident','Description','LoggedBy','AssignedTo','IncidentType'], SearchString
    ))
    addRange(q, FromDate, ToDate)

    const rows = await cds.run(q)
    return ok(rows)
  })

  this.on('GetIncidentsMasterCountFilter', async (req) => {
    const {
      SearchString, Status, FromDate, ToDate, IncidentType, LoggedBy, AssignedTo
    } = req.data

    const q = SELECT.one.from(T.IncidentMaster).columns`count(*) as total`
    if (notNull(Status))       q.where({ Status })
    if (notNull(IncidentType)) q.where({ IncidentType })
    if (notNull(LoggedBy))     q.where({ LoggedBy })
    if (notNull(AssignedTo))   q.where({ AssignedTo })
    if (notNull(SearchString)) q.where(likeOrs(
      ['Incident','Description','LoggedBy','AssignedTo','IncidentType'], SearchString
    ))
    addRange(q, FromDate, ToDate)

    const [{ total }] = await cds.run(q)
    return ok([{ total }])
  })

  this.on('AddUpdateIncidentsMaster', async (req) => {
    const d = req.data
    const key = { IncidentId: d.IncidentId }
    const exists = d.IncidentId
      ? await SELECT.one.from(T.IncidentMaster).where(key)
      : null

    const payload = {
      Incident: d.Incident,
      Description: d.Description,
      LoggedBy: d.LoggedBy,
      AssignedTo: d.AssignedTo,
      AddressedBy: d.AddressedBy,
      DateTime: d.DateTime,
      Solution: d.Solution,
      IncidentType: d.IncidentType,
      Score: d.Score,
      ProcessDescription: d.ProcessDescription,
      Status: d.Status,
      SortKey: d.SortKey,
      ModifiedDate: new Date()
    }

    if (exists) {
      await UPDATE(T.IncidentMaster).set(payload).where(key)
      return msg('updated')
    } else {
      await INSERT.into(T.IncidentMaster).entries({
        IncidentId: d.IncidentId || cds.utils.uuid(),
        ...payload,
        CreatedDate: new Date()
      })
      return msg('created')
    }
  })

  this.on('DeleteIncidentsMaster', async (req) => {
    const { IncidentId } = req.data
    await DELETE.from(T.IncidentMaster).where({ IncidentId })
    return msg('deleted')
  })

  this.on('UpdateStatus', async (req) => {
    const { IncidentId, Status } = req.data
    await UPDATE(T.IncidentMaster).set({ Status, ModifiedDate: new Date() }).where({ IncidentId })
    return msg('updated')
  })

  this.on('UpdateIncidentScore', async (req) => {
    const { IncidentId, Score } = req.data
    await UPDATE(T.IncidentMaster).set({ Score, ModifiedDate: new Date() }).where({ IncidentId })
    return msg('updated')
  })

  // helpers
  this.on('GetIncidentSolutions', async (req) => {
    const { IncidentType, SearchString } = req.data
    const q = SELECT.from(T.IncidentMaster).columns('IncidentId','Incident','Solution','IncidentType')
    if (notNull(IncidentType)) q.where({ IncidentType })
    if (notNull(SearchString)) q.where(likeOrs(['Incident','Description','Solution'], SearchString))
    const rows = await cds.run(q.orderBy`CreatedDate desc`.limit(50))
    return ok(rows)
  })

  this.on('GetIncidentsByType', async (req) => {
    const { IncidentType } = req.data
    const rows = await cds.run(
      SELECT.from(T.IncidentMaster).where({ IncidentType }).orderBy`CreatedDate desc`
    )
    return ok(rows)
  })

  this.on('GetIncidentsFromChatbot', async (req) => {
    const { SearchString } = req.data
    // emulate your models: search by description/incident text
    const q = SELECT.from(T.IncidentMaster).columns(
      'IncidentId','Incident','Description','Solution','IncidentType','Score','LoggedBy','AssignedTo','DateTime'
    )
    if (notNull(SearchString)) q.where(likeOrs(['Incident','Description','Solution'], SearchString))
    const rows = await cds.run(q.orderBy`Score desc, CreatedDate desc`.limit(100))
    return ok(rows)
  })

  this.on('GetIncidentsFromChatbotDetails', async (req) => {
    const { IncidentId } = req.data
    const row = await SELECT.one.from(T.IncidentMaster).where({ IncidentId })
    return ok(row ? [row] : [])
  })
})
