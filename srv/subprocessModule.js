// srv/subprocess-service.js
const cds = require('@sap/cds')
const { SELECT } = cds.ql
const resolveTenant = require('./util/tenant') // must return tenant id (string)

module.exports = cds.service.impl(async function () {

  // Maximum rows to fetch to avoid runaway queries (tune as needed)
  const MAX_ROWS = 10000

  /**
   * Build nested subtree from pre-fetched maps
   */
  function buildTreeNode(node, childrenMap) {
    const children = (childrenMap.get(node.BusinessSubProcessId) || []).map(c => buildTreeNode(c, childrenMap))

    const allSel = children.length > 0 && children.every(c => c.selected && !c.indeterminate)
    const anySelOrIndet = children.some(c => c.selected || c.indeterminate)
    const selfSel = !!node.selected

    return {
      ...node,
      selected: children.length === 0 ? selfSel : (selfSel || allSel),
      indeterminate: children.length === 0 ? false : (!allSel && anySelOrIndet),
      SubProcesses: children
    }
  }

  /**
   * Main action
   */
  this.on('GetMappedProjectSprintClientSubProcessesProjectSprintV5', async (req) => {
    const {
      ClientId,
      BusinessUnitId,
      ProjectId,
      SprintId,
      BusinessProcessId = null
    } = req.data || {}

    // basic validation
    if (!ClientId || !BusinessUnitId) {
      return { ResponseData: { ClientId, BusinessUnitId, BusinessProcesses: [] } }
    }

    // resolve tenant
    const tenant = resolveTenant(req)
    if (!tenant) {
      req.error(401, 'Tenant not resolved')
      return
    }

    try {
      // 1) fetch all relevant ClientSubProcessMaster rows (single query)
      const spWhere = {
        ClientId,
        BusinessUnitId,
        Status: 1,
        TenantId: tenant
      }
      if (BusinessProcessId) spWhere.BusinessProcessId = BusinessProcessId

      const clientSPRows = await cds.run(
        SELECT.from('ClientSubProcessMaster')
          .columns(['BusinessSubProcessId','BusinessProcessId','ParentSubProcessId','ClientId','BusinessUnitId'])
          .where(spWhere)
      )

      if (!clientSPRows || clientSPRows.length === 0) {
        return { ResponseData: { ClientId, BusinessUnitId, BusinessProcesses: [] } }
      }

      if (clientSPRows.length > MAX_ROWS) {
        console.warn(`[GetMappedProjectSprintClientSubProcessesProjectSprintV5] result rows (${clientSPRows.length}) exceeds MAX_ROWS (${MAX_ROWS})`)
      }

      // build IDs sets
      const subIds = [...new Set(clientSPRows.map(r => r.BusinessSubProcessId))]
      const bpIds = [...new Set(clientSPRows.map(r => r.BusinessProcessId).filter(Boolean))]

      // 2) fetch metadata for sub-processes (names, descriptions)
      const bpspmRows = await cds.run(
        SELECT.from('BusinessProcessSubProcessMaster')
          .columns(['BusinessProcessId','BusinessSubProcessId','BusinessSubProcessName','Description','Status'])
          .where({ BusinessSubProcessId: { in: subIds }, Status: 1 })
      )

      // 3) fetch process master names
      const bpmRows = await cds.run(
        SELECT.from('BusinessProcessMaster')
          .columns(['BusinessProcessId','BusinessProcessName'])
          .where({ BusinessProcessId: { in: bpIds } })
      )

      // 4) fetch project-sprint mapping rows (to know whether a subprocess is selected in this project/sprint)
      const pbspRows = await cds.run(
        SELECT.from('ProjectSprintSubProcessMaster')
          .columns(['ClientId','BusinessUnitId','BusinessProcessId','BusinessSubProcessId','ProjectId','SprintId','ProjectSprintProcessId'])
          .where({
            ClientId,
            BusinessUnitId,
            ProjectId,
            SprintId,
            BusinessSubProcessId: { in: subIds },
            TenantId: tenant
          })
      )

      // create maps for quick lookups
      const metaMap = new Map(bpspmRows.map(r => [r.BusinessSubProcessId, r]))
      const bpNameMap = new Map(bpmRows.map(r => [r.BusinessProcessId, r.BusinessProcessName]))
      // pbspMap: one-to-one per BusinessSubProcessId in the context of the given project/sprint
      const pbspMap = new Map(pbspRows.map(r => [r.BusinessSubProcessId, r]))

      // assemble flat nodes with metadata and selection flag
      const flatNodes = clientSPRows.map(r => {
        const meta = metaMap.get(r.BusinessSubProcessId) || {}
        const pb = pbspMap.get(r.BusinessSubProcessId)
        return {
          BusinessSubProcessId: r.BusinessSubProcessId,
          BusinessProcessId: r.BusinessProcessId,
          BusinessProcessName: bpNameMap.get(r.BusinessProcessId) || '',
          ParentSubProcessId: r.ParentSubProcessId ?? null,
          ClientId: r.ClientId,
          BusinessUnitId: r.BusinessUnitId,
          ProjectId,
          SprintId,
          BusinessSubProcessName: meta.BusinessSubProcessName || '',
          Description: meta.Description || '',
          ProjectSprintProcessId: pb?.ProjectSprintProcessId || '',
          selected: !!(pb && pb.ProjectSprintProcessId),
          indeterminate: false
        }
      })

      // build adjacency list parentId -> [children]
      const childrenMap = new Map()
      const nodeMap = new Map()
      flatNodes.forEach(n => {
        nodeMap.set(n.BusinessSubProcessId, n)
        const parent = n.ParentSubProcessId ?? null
        const arr = childrenMap.get(parent) || []
        arr.push(n)
        childrenMap.set(parent, arr)
      })

      // find distinct business processes to produce result per process
      const uniqueBPIds = [...new Set(flatNodes.map(n => n.BusinessProcessId))]

      const businessProcesses = uniqueBPIds.map(bpId => {
        // build root-level subprocesses for this bpId (parent null)
        const roots = (childrenMap.get(null) || []).filter(r => r.BusinessProcessId === bpId)
        // But there may be root nodes whose parent isn't null (if parent exists outside this bp set),
        // also include any nodes with ParentSubProcessId that isn't present in nodeMap → treat them as roots
        const orphanRoots = flatNodes.filter(n => n.BusinessProcessId === bpId && n.ParentSubProcessId && !nodeMap.has(n.ParentSubProcessId))

        // combine and dedupe
        const topNodes = [...roots, ...orphanRoots].filter((v, i, a) => a.findIndex(x => x.BusinessSubProcessId === v.BusinessSubProcessId) === i)

        const subtree = topNodes.map(n => buildTreeNode(n, childrenMap))

        const allSel = subtree.length > 0 && subtree.every(sp => sp.selected && !sp.indeterminate)
        const anySelOrIndet = subtree.some(sp => sp.selected || sp.indeterminate)

        return {
          BusinessProcessId: bpId,
          BusinessProcessName: bpNameMap.get(bpId) || '',
          ClientId,
          BusinessUnitId,
          ProjectId,
          SprintId,
          selected: allSel,
          indeterminate: !allSel && anySelOrIndet,
          SubProcesses: subtree
        }
      })

      return { ResponseData: { ClientId, BusinessUnitId, BusinessProcesses: businessProcesses } }

    } catch (err) {
      console.error('[GetMappedProjectSprintClientSubProcessesProjectSprintV5] error:', err)
      req.error(500, `Failed to fetch subprocesses: ${err.message}`)
    }
  })
})
