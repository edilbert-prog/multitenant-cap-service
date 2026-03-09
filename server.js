const express = require('express') 
const cds = require('@sap/cds')
const { INSERT, UPDATE } = cds.ql
const { SELECT } = cds.ql;

cds.on('bootstrap', app => {
  console.log('✅ server.js bootstrap loaded')
////////////////////////////////////////////////////////////////////////////////////////
//tenand subscribe(tenant onbording)
app.use(express.json())
    app.put('/callback/v1.0/tenants/:tenant', async (req, res) => {

    const tenantId = req.params.tenant
    const subdomain = req.body?.subscribedSubdomain

    console.log("Subscription payload:", req.body)

    try {

      await cds.tx({ tenant: tenantId }, tx =>
        tx.run(
          INSERT.into('Tenants').entries({
            tenantId,
            subdomain,
            status: 'SUBSCRIBED',
            plan: 'FREE'
          })
        )
      )

      const tenantUrl =
        `https://${subdomain}-cap-saas-approuter.cfapps.ap10.hana.ondemand.com`

      console.log("Tenant URL:", tenantUrl)

      res.status(200).send(tenantUrl)

    } catch (error) {

      console.error("REAL ERROR:", error)
      res.status(500).send(error.message)

    }

  })
  ///////////////////////////////////////////////////////////////////////////////////

  /// tenant unsubscribe(Offbording)
    app.delete('/callback/v1.0/tenants/:tenant', async (req, res) => {

    const tenantId = req.params.tenant

    console.log(`⬅️ Unsubscribing tenant: ${tenantId}`)

    await cds.run(
      DELETE.from('Tenants')
        .where({ tenantId })
    )

    res.status(200).json({ status: "OK" })

  })
///////////////////////////////////////////////////
//get Dependencies

app.get('/callback/v1.0/dependencies', (req, res) => {

  console.log('📦 getDependencies callback called')

  // since your app currently has no SAP reuse services,
  // return empty array
  res.status(200).json([])

})
})
