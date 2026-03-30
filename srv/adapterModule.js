const cds = require('@sap/cds');
const resolveTenant = require('./util/tenant'); // ensure this exists

module.exports = cds.service.impl(function () {

  // --------------------------------------------------------------------
  // ROBUST SQL RUNNER
  // --------------------------------------------------------------------
  async function runSql(ctxOrThis, sql, params = []) {
    let ctx = ctxOrThis;
    if (typeof ctxOrThis === 'string') {
      sql = ctxOrThis;
      ctx = null;
    }

    let dbClient;
    if (cds && cds.db) {
      dbClient = cds.db;
    } else {
      const svc = await cds.connect.to('db');
      dbClient = svc.run ? svc : (svc.db ? svc.db : svc);
    }
    if (!dbClient) throw new Error('No DB client available.');

    if (dbClient.run)  return normalizeDbResult(await dbClient.run(sql, params));
    if (dbClient.exec) return normalizeDbResult(await dbClient.exec(sql, params));
    if (dbClient.query) return normalizeDbResult(await dbClient.query(sql, params));

    throw new Error('DB client does not expose run/exec/query.');
  }

  function normalizeDbResult(res) {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (res.rows && Array.isArray(res.rows)) return res.rows;
    if (res.raw && Array.isArray(res.raw)) return res.raw;
    return res;
  }

  function sanitizeRows(rows = [], valueField = 'AdapterId', labelField = 'HostName') {
    return rows.map(r => ({
      ...r,
      value: r[valueField] ? String(r[valueField]) : '',
      label: r[labelField] ? String(r[labelField]) : ''
    }));
  }

  // --------------------------------------------------------------------
  // GET ADAPTERS MASTER
  // --------------------------------------------------------------------
  this.on('GetAdaptersMaster', async (req) => {
    const tenant = resolveTenant(req);
    if (!tenant) return req.reject(403, 'TenantId is required');

    try {
      const { SearchString = '' } = req.data || {};

      const where = [`tenantid = $1`];
      const params = [tenant];

      if (SearchString.trim()) {
        params.push(`%${SearchString.trim()}%`);
        where.push(`hostname ILIKE $${params.length}`);
      }

      const sql = `
        SELECT 
          adapterid   AS "AdapterId",
          hostname    AS "HostName",
          baseurl     AS "BaseURL",
          email       AS "Email",
          apitoken    AS "APIToken",
          createdat   AS "CreatedDate",
          modifiedat  AS "ModifiedDate"
        FROM adaptersmaster
        WHERE ${where.join(' AND ')}
        ORDER BY createdat DESC
        LIMIT 30
      `;

      const rows = await runSql(this, sql, params);
      return { ResponseData: sanitizeRows(rows) };

    } catch (err) {
      return { ResponseData: [], error: err.message || String(err) };
    }
  });

  // --------------------------------------------------------------------
  // PAGINATION + FILTER + SEARCH
  // --------------------------------------------------------------------
  this.on('GetAdaptersMasterPaginationFilterSearch', async (req) => {
    const tenant = resolveTenant(req);
    if (!tenant) return req.reject(403, 'TenantId is required');

    try {
      const d = req.data || {};
      const StartDate = d.StartDate ? String(d.StartDate).trim() : '';
      const EndDate   = d.EndDate   ? String(d.EndDate).trim()   : '';
      const SearchString = d.SearchString ? String(d.SearchString).trim() : '';

      const RecordsPerPage = 10;
      const PageNo = Math.max(1, Number(d.PageNo || 1));
      const offset = (PageNo - 1) * RecordsPerPage;

      const where = [`tenantid = $1`];
      const params = [tenant];

      if (StartDate) {
        params.push(StartDate);
        where.push(`DATE(createdat) >= $${params.length}`);
      }
      if (EndDate) {
        params.push(EndDate);
        where.push(`DATE(createdat) <= $${params.length}`);
      }
      if (SearchString) {
        params.push(`%${SearchString}%`);
        where.push(`hostname ILIKE $${params.length}`);
      }

      // ---------------- COUNT QUERY ----------------
      const countSql = `
        SELECT COUNT(*) AS total
        FROM adaptersmaster
        WHERE ${where.join(' AND ')}
      `;

      const countRes = await runSql(this, countSql, params);
      const totalRows = Number(countRes?.[0]?.total || 0);

      // ---------------- DATA QUERY ----------------
      const dataSql = `
        SELECT 
          adapterid   AS "AdapterId",
          hostname    AS "HostName",
          baseurl     AS "BaseURL",
          email       AS "Email",
          apitoken    AS "APIToken",
          createdat   AS "CreatedDate",
          modifiedat  AS "ModifiedDate"
        FROM adaptersmaster
        WHERE ${where.join(' AND ')}
        ORDER BY createdat DESC
        LIMIT $${params.length + 1} 
        OFFSET $${params.length + 2}
      `;

      const dataParams = params.concat([RecordsPerPage, offset]);
      const dataRows = await runSql(this, dataSql, dataParams);

      return {
        TotalRecords: totalRows,
        RecordsPerPage,
        TotalPages: Math.ceil(totalRows / RecordsPerPage),
        CurrentPage: PageNo,
        ResponseData: sanitizeRows(dataRows)
      };

    } catch (err) {
      console.error('GetAdaptersMasterPaginationFilterSearch error:', err);
      return {
        TotalRecords: 0,
        RecordsPerPage: 10,
        TotalPages: 0,
        CurrentPage: 1,
        ResponseData: [],
        error: err.message || String(err)
      };
    }
  });

});
