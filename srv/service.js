const cds = require('@sap/cds')

module.exports = cds.service.impl(function () {

  const { Orders } = this.entities


  // Custom endpoint to return a welcome message for the current tenant
  this.on('Welcome', (req) => {
    const tenant = req.tenant
    return `Welcome ${tenant} 🚀`
  })


  // Before inserting a new order, automatically attach the tenant
  this.before('CREATE', Orders, (req) => {
    req.data.tenant = req.tenant
  })


  // Before reading orders, filter results so each tenant only sees its own data
  this.before('READ', Orders, (req) => {

    const tenant = req.tenant

    if (!req.query.SELECT.where) {
      req.query.SELECT.where = [{ ref: ['tenant'] }, '=', { val: tenant }]
    } else {
      req.query.SELECT.where.push('and', { ref: ['tenant'] }, '=', { val: tenant })
    }

  })

})