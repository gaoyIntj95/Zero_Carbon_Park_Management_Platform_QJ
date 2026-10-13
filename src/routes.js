const committee = ['committee']
const admin = ['admin']
const enterprise = ['enterprise']
const both = ['committee', 'enterprise']

// 单一系统的三种视角：菜单只表达当前角色可进入的业务边界。
export const pageRoutes = [
  { path:'/zero-carbon-indicators', title:'零碳建设总览', menuLabel:'零碳建设总览', group:'零碳建设管理', roles:committee, pageType:'module', menuVisible:true, order:1 },
  { path:'/construction-tasks', title:'零碳建设任务管理', menuLabel:'建设任务管理', group:'零碳建设管理', roles:committee, pageType:'module', menuVisible:false, order:2 },
  { path:'/energy-carbon-monitoring', title:'能碳分析', menuLabel:'能碳运行管理', groups:{committee:'能碳运行管理',enterprise:'企业绿色管理'}, roleLabels:{enterprise:'企业能碳监测'}, roles:both, menuVisible:true, menuVisibleRoles:committee, menuGroupOnly:true, pageType:'module', order:1 },
  { path:'/energy-carbon-monitoring/overview', title:'能碳分析', menuLabel:'能碳监测分析', group:'能碳运行管理', roles:committee, pageType:'subpage', parentPath:'/energy-carbon-monitoring', menuParent:'/energy-carbon-monitoring', menuVisible:true, order:1 },
  { path:'/energy-carbon-monitoring/benchmark', title:'园区企业能效管理', menuLabel:'园区企业能效管理', group:'能碳运行管理', roles:committee, pageType:'subpage', parentPath:'/energy-carbon-monitoring', menuParent:'/energy-carbon-monitoring', menuVisible:true, order:3 },
  { path:'/energy-carbon-monitoring/flow', title:'能流分析', menuLabel:'能源流向分析', group:'能碳运行管理', roles:committee, pageType:'subpage', parentPath:'/energy-carbon-monitoring', menuParent:'/energy-carbon-monitoring', menuVisible:true, order:4 },
  { path:'/energy-carbon-monitoring/balance', title:'园区能源优化', menuLabel:'园区能源优化', group:'能碳运行管理', roles:committee, pageType:'subpage', parentPath:'/energy-carbon-monitoring', menuParent:'/energy-carbon-monitoring', menuVisible:true, order:5 },
  { path:'/energy-carbon-monitoring/budget', title:'能耗与碳排预算', menuLabel:'能耗与碳排预算', group:'能碳运行管理', roles:committee, pageType:'subpage', parentPath:'/energy-carbon-monitoring', menuParent:'/energy-carbon-monitoring', menuVisible:true, order:6 },
  { path:'/reporting-task-monitoring', title:'零碳数据填报管理', menuLabel:'企业数据填报', group:'企业协同管理', roles:committee, pageType:'module', menuVisible:false, order:2 },
  { path:'/zero-carbon-results', title:'零碳验收支撑', menuLabel:'零碳验收支撑', group:'零碳建设管理', roles:committee, pageType:'module', menuVisible:true, order:3 },

  { path:'/enterprise-green-services', title:'企业绿色服务', menuLabel:'企业服务管理', group:'企业协同管理', roles:both, pageType:'module', menuVisible:true, order:3 },
  { path:'/enterprise-green-services/overview', title:'企业绿色服务', menuLabel:'服务总览', group:'企业协同管理', roles:both, pageType:'subpage', parentPath:'/enterprise-green-services', menuParent:'/enterprise-green-services', menuVisible:false, order:1 },
  { path:'/enterprise-green-services/management', title:'企业绿色服务', menuLabel:'服务管理', group:'企业协同管理', roles:both, pageType:'subpage', parentPath:'/enterprise-green-services', menuParent:'/enterprise-green-services', menuVisible:false, order:2 },
  { path:'/enterprise-green-services/results', title:'企业绿色服务', menuLabel:'服务成果', group:'企业协同管理', roles:both, pageType:'subpage', parentPath:'/enterprise-green-services', menuParent:'/enterprise-green-services', menuVisible:false, order:3 },
  { path:'/enterprise-profile', title:'企业绿色画像', menuLabel:'绿色画像', group:'企业绿色管理', roles:enterprise, pageType:'module', menuVisible:true, order:1 },
  { path:'/zero-carbon-path-simulation', title:'零碳路径推演', menuLabel:'零碳路径推演', group:'零碳建设管理', roles:committee, pageType:'module', menuVisible:true, order:2 },
  { path:'/green-service-center', title:'绿色服务中心', menuLabel:'绿色服务', group:'企业绿色管理', roles:enterprise, pageType:'professional', menuVisible:true, order:2 },
  { path:'/organization-carbon', title:'组织碳管理', menuLabel:'组织碳管理', group:'企业绿色管理', roles:enterprise, pageType:'professional', menuVisible:false, menuParent:'/green-service-center', order:2 },
  { path:'/organization-carbon/preview', title:'碳排放概览', menuLabel:'碳排放概览', group:'企业绿色管理', roles:enterprise, pageType:'professional', menuVisible:false, menuParent:'/organization-carbon', order:1 },
  { path:'/organization-carbon/inventory', title:'碳核算清单', menuLabel:'碳核算清单', group:'企业绿色管理', roles:enterprise, pageType:'professional', menuVisible:false, menuParent:'/organization-carbon', order:2 },
  { path:'/organization-carbon/support', title:'碳核查支撑', menuLabel:'碳核查支撑', group:'企业绿色管理', roles:enterprise, pageType:'professional', menuVisible:false, menuParent:'/organization-carbon', order:3 },
  { path:'/organization-carbon/report', title:'碳排放报告', menuLabel:'碳排放报告', group:'企业绿色管理', roles:enterprise, pageType:'professional', menuVisible:false, menuParent:'/organization-carbon', order:4 },
  { path:'/organization-carbon/factors', title:'碳排放因子库', menuLabel:'碳排放因子库', group:'企业绿色管理', roles:enterprise, pageType:'professional', menuVisible:false, menuParent:'/organization-carbon', order:5 },
  { path:'/product-carbon-footprint', title:'产品碳足迹', menuLabel:'产品碳足迹', group:'企业绿色管理', roles:enterprise, pageType:'professional', menuVisible:false, menuParent:'/green-service-center', order:3 },
  { path:'/product-carbon-footprint/projects', title:'碳足迹项目管理', menuLabel:'碳足迹项目管理', group:'企业绿色管理', roles:enterprise, pageType:'professional', menuVisible:false, menuParent:'/product-carbon-footprint', order:1 },
  { path:'/product-carbon-footprint/activity', title:'碳足迹核算清单', menuLabel:'碳足迹核算清单', group:'企业绿色管理', roles:enterprise, pageType:'professional', menuVisible:false, menuParent:'/product-carbon-footprint', order:2 },
  { path:'/product-carbon-footprint/results', title:'碳足迹核算结果', menuLabel:'碳足迹核算结果', group:'企业绿色管理', roles:enterprise, pageType:'professional', menuVisible:false, menuParent:'/product-carbon-footprint', order:3 },
  { path:'/product-carbon-footprint/reports', title:'碳足迹报告管理', menuLabel:'碳足迹报告管理', group:'企业绿色管理', roles:enterprise, pageType:'professional', menuVisible:false, menuParent:'/product-carbon-footprint', order:4 },
  { path:'/product-carbon-footprint/factors', title:'碳足迹因子库', menuLabel:'碳足迹因子库', group:'企业绿色管理', roles:enterprise, pageType:'professional', menuVisible:false, menuParent:'/product-carbon-footprint', order:5 },
  { path:'/cbam', title:'CBAM管理', menuLabel:'CBAM管理', group:'企业绿色管理', roles:enterprise, pageType:'professional', menuVisible:false, order:4 },
  { path:'/supply-chain-carbon', title:'供应链碳管理', menuLabel:'供应链碳管理', group:'企业绿色管理', roles:enterprise, pageType:'professional', menuVisible:false, menuParent:'/green-service-center', order:5 },
  { path:'/supply-chain-carbon/suppliers', title:'供应商碳数据采集', menuLabel:'供应商碳数据采集', group:'企业绿色管理', roles:enterprise, pageType:'professional', menuVisible:false, menuParent:'/supply-chain-carbon', order:1 },
  { path:'/supply-chain-carbon/delivery', title:'碳数据披露', menuLabel:'碳数据披露', group:'企业绿色管理', roles:enterprise, pageType:'professional', menuVisible:false, menuParent:'/supply-chain-carbon', order:2 },
  { path:'/enterprise-assets', title:'企业碳资产管理', menuLabel:'企业碳资产管理', group:'企业绿色管理', roles:enterprise, pageType:'professional', menuVisible:false, order:6 },

  { path:'/data-management', title:'数据管理', menuLabel:'数据管理', groups:{committee:'数据管理',enterprise:'企业数据协同',admin:'数据管理'}, roleLabels:{admin:'平台级数据查看/配置'}, roles:[...both,...admin], pageType:'module', menuVisible:true, menuVisibleRoles:admin, order:1 },
  { path:'/data-overview', title:'数据总览', menuLabel:'园区数据总览', group:'园区运营支撑', roles:committee, pageType:'subpage', parentPath:'/data-management', menuParent:'/data-management', menuVisible:true, order:1 },
  { path:'/enterprise-archive', title:'企业档案', menuLabel:'园区企业档案', group:'园区运营支撑', roles:committee, pageType:'subpage', parentPath:'/data-management', menuParent:'/data-management', menuVisible:true, order:2 },
  { path:'/energy-facilities', title:'能源与设施', menuLabel:'园区能源设施', group:'园区运营支撑', roles:committee, pageType:'subpage', parentPath:'/data-management', menuParent:'/data-management', menuVisible:true, order:3 },
  { path:'/business-data', title:'能碳与运营数据', menuLabel:'园区能碳数据', group:'园区运营支撑', roles:committee, pageType:'subpage', parentPath:'/data-management', menuParent:'/data-management', menuVisible:true, order:4 },
  { path:'/zero-carbon-data', title:'零碳专项数据', menuLabel:'园区零碳专项', group:'园区运营支撑', roles:committee, pageType:'subpage', parentPath:'/data-management', menuParent:'/data-management', menuVisible:true, order:5 },
  { path:'/data-issues', title:'数据问题', menuLabel:'数据问题', groups:{committee:'园区运营支撑',enterprise:'企业数据协同'}, roles:both, pageType:'subpage', parentPath:'/data-management', menuParent:'/data-management', menuVisible:false, order:6 },
  { path:'/data-details', title:'数据明细', menuLabel:'能源与碳排', group:'企业数据协同', roles:enterprise, pageType:'subpage', parentPath:'/data-management', menuParent:'/data-management', menuVisible:false, order:3 },
  { path:'/enterprise-info', title:'企业信息', menuLabel:'企业基础信息', group:'企业数据协同', roles:enterprise, pageType:'subpage', parentPath:'/data-management', menuParent:'/data-management', menuVisible:false, order:4 },

  { path:'/knowledge', title:'零碳政策与知识', menuLabel:'零碳政策与知识', groups:{committee:'零碳建设管理',enterprise:'企业绿色管理',admin:'系统管理'}, roleLabels:{committee:'零碳政策与知识',enterprise:'政策知识',admin:'零碳政策与知识'}, roles:[...both,...admin], pageType:'module', menuVisible:true, order:3 },
  { path:'/knowledge-assistant', title:'零碳政策与知识', menuLabel:'知识助手', groups:{committee:'双碳知识服务',enterprise:'企业绿色管理',admin:'系统管理'}, roles:[...both,...admin], pageType:'subpage', parentPath:'/knowledge', menuParent:'/knowledge', menuVisible:false, order:1 },
  { path:'/knowledge-policies', title:'零碳政策与知识', menuLabel:'政策法规', groups:{committee:'双碳知识服务',enterprise:'企业绿色管理',admin:'系统管理'}, roles:[...both,...admin], pageType:'subpage', parentPath:'/knowledge', menuParent:'/knowledge', menuVisible:false, order:2 },
  { path:'/knowledge-standards', title:'零碳政策与知识', menuLabel:'标准规范', groups:{committee:'双碳知识服务',enterprise:'企业绿色管理',admin:'系统管理'}, roles:[...both,...admin], pageType:'subpage', parentPath:'/knowledge', menuParent:'/knowledge', menuVisible:false, order:3 },
  { path:'/knowledge-cases', title:'零碳政策与知识', menuLabel:'实践案例', groups:{committee:'双碳知识服务',enterprise:'企业绿色管理',admin:'系统管理'}, roles:[...both,...admin], pageType:'subpage', parentPath:'/knowledge', menuParent:'/knowledge', menuVisible:false, order:4 },

  { path:'/system-management', title:'系统管理', menuLabel:'系统管理', group:'系统管理', roles:admin, pageType:'module', menuVisible:true, order:1 },
  { path:'/organization-users', title:'组织与用户', menuLabel:'组织与用户', group:'系统管理', roles:admin, pageType:'subpage', parentPath:'/system-management', menuParent:'/system-management', menuVisible:true, order:1 },
  { path:'/role-permissions', title:'角色权限', menuLabel:'角色权限', group:'系统管理', roles:admin, pageType:'subpage', parentPath:'/system-management', menuParent:'/system-management', menuVisible:true, order:2 },
  { path:'/data-ingestion', title:'数据接入', menuLabel:'数据接入', group:'系统管理', roles:admin, pageType:'subpage', parentPath:'/system-management', menuParent:'/system-management', menuVisible:true, order:3 },
  { path:'/logs', title:'日志管理', menuLabel:'日志管理', group:'系统管理', roles:admin, pageType:'subpage', parentPath:'/system-management', menuParent:'/system-management', menuVisible:true, order:4 },

  { path:'/enterprise-data-reporting', title:'填报任务', menuLabel:'协同任务', group:'企业数据协同', roles:enterprise, pageType:'workbench', menuVisible:true, order:1 },
  { path:'/enterprise-basic-info', title:'企业基础信息', menuLabel:'基础档案', group:'企业数据协同', roles:enterprise, pageType:'subpage', menuVisible:true, order:2 },
  { path:'/enterprise-energy-carbon', title:'能源与碳排', menuLabel:'能碳数据', group:'企业数据协同', roles:enterprise, pageType:'subpage', menuVisible:true, order:3 },
  { path:'/enterprise-zero-carbon', title:'零碳专项建设', menuLabel:'零碳专项', group:'企业数据协同', roles:enterprise, pageType:'subpage', menuVisible:true, order:4 },
]

export function getMenuGroups(role) {
  const order = role === 'enterprise' ? ['企业绿色管理','企业数据协同'] : role === 'admin' ? ['系统管理','数据管理'] : ['零碳建设管理','能碳运行管理','园区运营支撑','企业协同管理']
  const visible = pageRoutes.filter(route => route.menuVisible && route.roles.includes(role) && (!route.menuVisibleRoles || route.menuVisibleRoles.includes(role)))
  const tabbedServiceParents = new Set(['/organization-carbon', '/product-carbon-footprint', '/supply-chain-carbon'])
  const buildMenuTree = (parentPath, groupRoutes) => groupRoutes
    .filter(route => route.menuParent === parentPath)
    .sort((a,b)=>(a.order||0)-(b.order||0))
    .map(route => ({
      ...route,
      menuLabel: route.roleLabels?.[role] || route.menuLabel,
      children: tabbedServiceParents.has(route.path) ? [] : buildMenuTree(route.path, groupRoutes),
    }))
  return order.map(group => {
    const groupRoutes = visible.filter(route => (route.groups?.[role] || route.group) === group)
    const items = groupRoutes.filter(route => !route.menuParent || !visible.some(parent => parent.path === route.menuParent))
    return {
      group,
      items: items.sort((a,b)=>(a.order||0)-(b.order||0)).map(route => ({
        ...route,
        menuLabel: route.roleLabels?.[role] || route.menuLabel,
        children: buildMenuTree(route.path, groupRoutes),
      }))
    }
  }).filter(entry => entry.items.length)
}
