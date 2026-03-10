const cds = require('@sap/cds')

module.exports = cds.service.impl(function () {

  const { Orders } = this.entities

  // Welcome message
  this.on('Welcome', (req) => {
    return `Welcome ${req.tenant} 🚀`
  })

  // Attach tenant automatically when creating
  this.before('CREATE', Orders, (req) => {
    req.data.tenant = req.tenant
  })

  // Restrict reads to current tenant
  this.before('READ', Orders, (req) => {
    req.query.where({ tenant: req.tenant })
  })

})