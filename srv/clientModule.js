const cds = require('@sap/cds')
const resolveTenant = require('./util/tenant')
const { SELECT, INSERT, UPDATE } = cds.ql

// -----------------------------------------------------
// Helper: safe date parser
// -----------------------------------------------------
const parseDate = (v) => {
  if (!v) return null
  const d = new Date(v)
  if (isNaN(d)) return null
  return d.toISOString().slice(0, 10)
}

module.exports = cds.service.impl(function () {

  // =====================================================
  // PAGINATION + FILTER
  // =====================================================
  this.on('GetClientsMasterPaginationFilterSearch', async (req) => {
    try {
      const tenant = resolveTenant(req)
      if (!tenant) return req.reject(403, 'TenantId is required')

      let {
        PageNo = 1,
        PageSize = 10,
        search,
        SearchString,
        status,
        fromDate,
        toDate,
        StartDate,
        EndDate
      } = req.data || {}

      PageNo = Math.max(1, Number(PageNo) || 1)
      PageSize = Math.min(Math.max(1, Number(PageSize) || 10), 100)

      const RecordsPerPage = PageSize
      const offset = (PageNo - 1) * RecordsPerPage

      const searchTerm = String(SearchString || search || '').trim()
      let from = parseDate(StartDate || fromDate)
      let to   = parseDate(EndDate || toDate)

      if (from && to && new Date(from) > new Date(to)) {
        const tmp = from; from = to; to = tmp
      }

      // ---------------- COUNT ----------------
      const qc = SELECT.one.from('ClientsMaster as C').columns`count(*) as TotalRows`
      qc.where`C.TenantId = ${tenant}`

      if (status !== undefined && status !== '') {
        qc.where`C.Status = ${Number(status)}`
      }

      if (searchTerm) {
        const like = `%${searchTerm}%`
        qc.where`C.ClientName like ${like} or C.CompanyIdERP like ${like} or C.Email like ${like}`
      }

      if (from) qc.where`C.createdAt >= ${from}`
      if (to)   qc.where`C.createdAt <= ${to}`

      const countRow = await cds.run(qc)
      const TotalRecords = Number(countRow?.TotalRows || 0)
      const TotalPages = Math.max(1, Math.ceil(TotalRecords / RecordsPerPage))

      // ---------------- DATA ----------------
      const q = SELECT
        .from('ClientsMaster as C')
        .columns(
          'C.ClientId','C.ClientName','C.IndustryType','C.CompanyIdERP',
          'C.CountryId','C.StateId','C.CityId','C.CountryCode',
          'C.Contact','C.Email','C.Address1','C.Address2','C.Zip',
          'C.Description','C.SortKey','C.Status',
          { ref:['C','createdAt'], as:'CreatedDate' },
          { ref:['C','modifiedAt'], as:'ModifiedDate' },
          { ref:['CN','CountryName'], as:'CountryName' },
          { ref:['ST','StateName'], as:'StateName' },
          { ref:['CT','CityName'], as:'CityName' }
        )
        .leftJoin('Countries as CN').on`CN.CountryId = C.CountryId`
        .leftJoin('States as ST').on`ST.StateId = C.StateId`
        .leftJoin('Cities as CT').on`CT.CityId = C.CityId`
        .where`C.TenantId = ${tenant}`
        .orderBy`C.createdAt desc`
        .limit({ rows: RecordsPerPage, offset })

      if (status !== undefined && status !== '') {
        q.where`C.Status = ${Number(status)}`
      }

      if (searchTerm) {
        const like = `%${searchTerm}%`
        q.where`C.ClientName like ${like} or C.CompanyIdERP like ${like} or C.Email like ${like}`
      }

      if (from) q.where`C.createdAt >= ${from}`
      if (to)   q.where`C.createdAt <= ${to}`

      const rows = await cds.run(q)

      return {
        TotalRecords,
        RecordsPerPage,
        TotalPages,
        CurrentPage: PageNo,
        ResponseData: rows || []
      }

    } catch (err) {
      console.error(err)
      return {
        TotalRecords: 0,
        RecordsPerPage: 10,
        TotalPages: 1,
        CurrentPage: 1,
        ResponseData: []
      }
    }
  })

  // =====================================================
  // GET CLIENTS (Dropdown)
  // =====================================================
  this.on('GetClientsMaster', async (req) => {

    const tenant = resolveTenant(req)
    if (!tenant) return req.reject(403, 'TenantId is required')

    const { SearchString } = req.data || {}

    const q = SELECT.from('ClientsMaster')
      .columns(
        { ref: ['ClientId'], as: 'value' },
        { ref: ['ClientName'], as: 'label' }
      )
      .where`Status = 1 and TenantId = ${tenant}`
      .orderBy`ClientName asc`
      .limit(30)

    if (SearchString && SearchString.trim()) {
      const like = `%${SearchString.trim()}%`
      q.where`ClientName like ${like}`
    }

    const result = await cds.run(q)

    return { ResponseData: result || [] }
  })

  // =====================================================
  // CHECK CLIENT
  // =====================================================
  this.on('CheckClientsMaster', async (req) => {

    const tenant = resolveTenant(req)
    if (!tenant) return req.reject(403, 'TenantId is required')

    const { ClientName } = req.data

    const result = await SELECT.from('ClientsMaster')
      .where({ ClientName, TenantId: tenant })

    return result.length > 0
      ? { ResponseData: result }
      : { ResponseData: [], checkClientsMaster_error: 'No data found' }
  })

  // =====================================================
  // ADD / UPDATE CLIENT
  // =====================================================
  this.on('AddUpdateClientsMaster', async (req) => {

    const tenant = resolveTenant(req)
    if (!tenant) return req.reject(403, 'TenantId is required')

    let data = req.data

    try {
      if (!data.ClientId) {
        data.ClientId = cds.utils.uuid()
        data.TenantId = tenant
        data.Status = 1

        await INSERT.into('ClientsMaster').entries(data)

        return { addClientsMaster: { insertId: data.ClientId } }
      }

      const updated = await UPDATE('ClientsMaster')
        .set(data)
        .where({ ClientId: data.ClientId, TenantId: tenant, Status: 1 })

      return updated > 0
        ? { updateClientsMaster: { insertId: data.ClientId } }
        : { updateClientsMaster: [] }

    } catch (e) {
      return { error: e.message }
    }
  })

  // =====================================================
  // UPDATE STATUS
  // =====================================================
  this.on('UpdateClientsMasterStatus', async (req) => {

    const tenant = resolveTenant(req)
    if (!tenant) return req.reject(403, 'TenantId is required')

    const { ClientName } = req.data

    const result = await UPDATE('ClientsMaster')
      .set({ Status: 1 })
      .where({ ClientName, TenantId: tenant })

    return result > 0
      ? { updateClientsMasterStatus: result }
      : { updateClientsMasterStatus: [] }
  })

  // =====================================================
  // DELETE (SOFT DELETE)
  // =====================================================
  this.on('DeleteClientsMaster', async (req) => {

    const tenant = resolveTenant(req)
    if (!tenant) return req.reject(403, 'TenantId is required')

    const { ClientId } = req.data

    const result = await UPDATE('ClientsMaster')
      .set({ Status: 0 })
      .where({ ClientId, TenantId: tenant })

    return result > 0
      ? { deleteClientsMaster: { insertId: ClientId } }
      : { deleteClientsMaster: [] }
  })

})