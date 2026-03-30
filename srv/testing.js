const cds = require('@sap/cds')

module.exports = cds.service.impl(async function () {

  const { TestingTechniquesMaster } = cds.entities

  this.on('GetTestingTechniquesMaster', async (req) => {
    const { SearchString = '' } = req.data || {}
    const db = await cds.connect.to('db')

    try {
      const where = { Status: 1 }
      if (SearchString) {
        where.TestingTechnique = { like: `%${SearchString}%` }
      }

      const rows = await db.read(TestingTechniquesMaster)
        .where(where)
        .orderBy({ SortKey: 'asc' })
        .limit(30)

      const ResponseData = rows.map(r => ({
        value: r.TestingTechniqueId,
        label: r.TestingTechnique,
        TestingTechniqueId: r.TestingTechniqueId,
        TestingTechnique: r.TestingTechnique,
        Description: r.Description,
        SortKey: r.SortKey,
        Status: r.Status,
        CreatedDate: r.CreatedDate,
        ModifiedDate: r.ModifiedDate
      }))

      return { ResponseData }

    } catch (error) {
      req.error(error)
      return { ResponseData: [] }
    }
  })

})
