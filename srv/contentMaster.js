// srv/contentMaster.js
const cds = require('@sap/cds')

// Match your common envelope across modules
const ok  = (data) => ({ status: 'ok', data: JSON.stringify(data ?? {}) })
const fail= (error) => ({ status: 'fail', data: JSON.stringify([]), error })

module.exports = cds.service.impl(function () {
  const db = cds.tx()

  // convenience
  const qSel = (...args) => cds.run(SELECT.from(...args))
  const qOne = (...args) => cds.run(SELECT.one.from(...args))

  // 1) GetAppVersionInfo
  this.on('GetAppVersionInfo', async (req) => {
    const { AppId } = req.data
    try {
      const rows = await cds.run(
        SELECT.from('AppVersionInfo')
          .where({ AppId, Status: 1 })
          .orderBy`SortKey asc`
      )
      return ok({ AppVersionInfo: rows ?? [] })
    } catch (e) { return fail(String(e)) }
  })

  // 2) GetContentCategoriesMaster
  this.on('GetContentCategoriesMaster', async (req) => {
    const { Language } = req.data
    try {
      const q = SELECT.from('ContentCategoriesMaster')
        .columns([
          { ref:['ContentCategoryId'], as:'key1' },
          { ref:['ContentCategory'],   as:'value' },
          { ref:['ContentCategory'],   as:'text'  },
          '*'
        ])
        .where({ Status: 1 })
        .orderBy`SortKey asc`
      if (Language) q.where`Language = ${Language}`
      const rows = await cds.run(q)
      return ok({ ContentCategoriesMaster: rows ?? [] })
    } catch (e) { return fail(String(e)) }
  })

  // 3) GetContentSourceMaster
  this.on('GetContentSourceMaster', async (req) => {
    const { ContentCategoryId, ContentType, Language } = req.data
    try {
      const q = SELECT.from('ContentSourceMaster')
        .where({ Status: 1, ContentCategoryId })
        .orderBy`ContentId desc`
      if (ContentType) q.where`ContentType = ${ContentType}`
      if (Language)    q.where`Language = ${Language}`
      const rows = await cds.run(q)
      return ok({ ContentSourceMaster: rows ?? [] })
    } catch (e) { return fail(String(e)) }
  })

  // helper: fetch latest ContentId
  async function fetchLatestContentId () {
    const row = await cds.run(
      SELECT.from('ContentMaster')
        .columns`ContentId`
        .orderBy`ContentId desc`.limit(1)
    )
    return row?.[0]?.ContentId ?? 0
  }

  // 4) AddContentMaster (insert-or-update)
  this.on('AddContentMaster', async (req) => {
    const d = req.data
    try {
      let ContentId = (d.ContentId === '' || d.ContentId === 0 || d.ContentId == null)
        ? (await fetchLatestContentId()) + 1
        : d.ContentId

      // if ContentId existed in body => update, else insert
      if (String(d.ContentId ?? '').trim() && Number(d.ContentId) > 0) {
        // update
        const result = await cds.run(
          UPDATE('ContentMaster').set({
            ContentName : d.ContentName,
            ContentType : d.ContentType,
            Thumbnail   : d.Thumbnail,
            Url         : d.Url,
            Language    : d.Language,
            Description : d.Description,
            SortKey     : d.SortKey
          })
          .where({ Status: 1, ContentId })
        )
        if ((result ?? 0) > 0) {
          return ok({ ContentMaster: [{ insertId: ContentId }] })
        } else {
          return fail('updateContentMaster affectedRows=0')
        }
      } else {
        // insert
        await cds.run(
          INSERT.into('ContentMaster').entries({
            ContentId,
            ContentName : d.ContentName,
            ContentType : d.ContentType,
            Thumbnail   : d.Thumbnail,
            Url         : d.Url,
            Language    : d.Language,
            Description : d.Description,
            SortKey     : d.SortKey,
            Status      : 1
          })
        )
        return ok({ ContentMaster: [{ insertId: ContentId }] })
      }
    } catch (e) { return fail(String(e)) }
  })

  // 5) UpdateContentSourceMasterViewCountByContentId
  this.on('UpdateContentSourceMasterViewCountByContentId', async (req) => {
    const { ContentId, ContentCategoryId, Language } = req.data
    try {
      // read current
      const existing = await cds.run(
        SELECT.from('ContentSourceMaster')
          .where({ Status:1, ContentId, ContentCategoryId, Language })
          .limit(1)
      )
      const previous = existing?.[0]?.ViewCount ?? null
      // mimic original: if none found => set 0 (and update will affect 0 rows -> fail)
      const ViewCount = previous == null ? 0 : Number(previous) + 1

      const result = await cds.run(
        UPDATE('ContentSourceMaster').set({ ViewCount })
          .where({ Status:1, ContentId, ContentCategoryId, Language })
      )

      if ((result ?? 0) > 0) {
        return ok({ ContentSourceMaster: [{ insertId: ContentId, ContentCategoryId, Language, ViewCount }] })
      } else {
        return fail('updateContentSourceMasterViewCountByContentId affectedRows=0')
      }
    } catch (e) { return fail(String(e)) }
  })
})
