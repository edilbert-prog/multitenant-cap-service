// srv/businessUnitModule.js
const cds = require('@sap/cds')
const { SELECT } = cds.ql
const resolveTenant = require('./util/tenant') // ensure this returns tenant id (e.g. from x-saas-tenant)

module.exports = cds.service.impl(async function () {
  // resolve entity if exposed to this service
  const { BusinessUnitMasterV2 } = this.entities || {}

  this.on('GetBusinessUnitMasterByClientId', async (req) => {
    try {
      let { ClientId, SearchString, PageNo = 1, PageSize = 30 } = req.data || {}
      ClientId = typeof ClientId === 'string' ? ClientId.trim() : ClientId
      SearchString = typeof SearchString === 'string' ? SearchString.trim() : ''
      PageNo = Math.max(1, Number(PageNo) || 1)
      PageSize = Math.min(Math.max(1, Number(PageSize) || 30), 200) // clamp 1..200

      if (!ClientId) return { ResponseData: [] }

      // tenant scoping
      const tenant = resolveTenant(req)
      if (!tenant) {
        console.warn('[GetBusinessUnitMasterByClientId] tenant not resolved')
        return { ResponseData: [] }
      }

      // Build base query using entity object when possible (safer)
      const source = BusinessUnitMasterV2 ? BusinessUnitMasterV2 : 'BusinessUnitMasterV2'

      const q = SELECT.from(source)
        .columns(
          { ref: ['BusinessUnitId'], as: 'value' },
          { ref: ['BusinessUnitName'], as: 'label' },
          'BusinessUnitId','BusinessUnitName','ClientId','CompanyCodeERP',
          'CountryId','StateId','CityId','CountryCode','Contact','Email',
          'Address1','Address2','Zip','Description','SortKey','Status',
          { ref:['createdAt'], as:'createdAt' },   // prefer managed fields if present
          { ref:['modifiedAt'], as:'modifiedAt' }
        )
        .where({ ClientId, Status: 1, TenantId: tenant }) // tenant + active only
        .orderBy`BusinessUnitName asc`
        .limit({ rows: PageSize, offset: (PageNo - 1) * PageSize })

      if (SearchString) {
        const like = `%${SearchString}%`
        q.where`BusinessUnitName like ${like}`
      }

      let rows = []
      try {
        rows = await cds.run(q)
      } catch (e) {
        // Final fallback to raw SQL (handles drivers/edge cases). Use lowercase table name for Postgres.
        console.warn('[GetBusinessUnitMasterByClientId] entity query failed, falling back to raw SQL:', e && e.message)
        const sqlBase = `
          SELECT BusinessUnitId, BusinessUnitName, ClientId, CompanyCodeERP,
                 CountryId, StateId, CityId, CountryCode, Contact, Email,
                 Address1, Address2, Zip, Description, SortKey, Status,
                 TenantId, created_at, updated_at, createdAt, modifiedAt
          FROM businessunitmasterv2
          WHERE status = 1 AND clientid = $1 AND tenantid = $2
        `
        const sqlSearch = SearchString ? ` AND BusinessUnitName ILIKE $3` : ``
        const sqlOrderLimit = ` ORDER BY BusinessUnitName ASC LIMIT $4 OFFSET $5`
        const sql = sqlBase + sqlSearch + sqlOrderLimit

        const params = SearchString
          ? [ ClientId, tenant, `%${SearchString}%`, PageSize, (PageNo - 1) * PageSize ]
          : [ ClientId, tenant, PageSize, (PageNo - 1) * PageSize ]

        try {
          // cds.db.run supports parameterized queries for most adapters
          rows = await cds.db.run(sql, params)
        } catch (rawErr) {
          console.error('[GetBusinessUnitMasterByClientId] raw fallback failed:', rawErr)
          return { ResponseData: [] }
        }
      }

      // Normalize to BusinessUnitItem shape (robust to different column names)
      const normalized = (rows || []).map(r => ({
        value: r.value ?? r.BusinessUnitId ?? r.businessunitid ?? null,
        label: r.label ?? r.BusinessUnitName ?? r.businessunitname ?? null,
        BusinessUnitId: r.BusinessUnitId ?? r.businessunitid ?? null,
        BusinessUnitName: r.BusinessUnitName ?? r.businessunitname ?? null,
        ClientId: r.ClientId ?? r.clientid ?? null,
        CompanyCodeERP: r.CompanyCodeERP ?? r.companycodeerp ?? null,
        CountryId: r.CountryId ?? r.countryid ?? null,
        StateId: r.StateId ?? r.stateid ?? null,
        CityId: r.CityId ?? r.cityid ?? null,
        CountryCode: r.CountryCode ?? r.countrycode ?? null,
        Contact: r.Contact ?? r.contact ?? '',
        Email: r.Email ?? r.email ?? null,
        Address1: r.Address1 ?? r.address1 ?? '',
        Address2: r.Address2 ?? r.address2 ?? '',
        Zip: r.Zip ?? r.zip ?? '',
        Description: r.Description ?? r.description ?? '',
        SortKey: r.SortKey ?? r.sortkey ?? 0,
        Status: r.Status ?? r.status ?? null,
        CreatedDate: r.CreatedDate ?? r.createdAt ?? r.created_at ?? r.createdat ?? null,
        ModifiedDate: r.ModifiedDate ?? r.modifiedAt ?? r.updated_at ?? r.modifiedat ?? null
      }))

      return { ResponseData: normalized }
    } catch (err) {
      console.error('[ERROR] GetBusinessUnitMasterByClientId - unhandled:', err)
      return { ResponseData: [] }
    }
  })
})
