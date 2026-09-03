const committee = ['committee']
const admin = ['admin']
const enterprise = ['enterprise']
const both = ['committee', 'enterprise']

// 单一系统的三种视角：菜单只表达当前角色可进入的业务边界。
export const pageRoutes = [
  { path:'/zero-carbon-indicators', title:'零碳指标管控', menuLabel:'零碳指标管控', group:'园区零碳管理', roles:committee, pageType:'module', menuVisible:true, order:1 },
  { path:'/energy-carbon-monitoring', title:'园区能碳监测', menuLabel:'园区能碳监测', groups:{committee:'园区零碳管理',enterprise:'企业绿色服务'}, roleLabels:{enterprise:'企业能碳监测'}, roles:both, pageType:'module', menuVisible:true, menuVisibleRoles:committee, order:2 },
  { path:'/reporting-task-monitoring', title:'填报任务管理', menuLabel:'填报任务管理', group:'园区零碳管理', roles:committee, pageType:'module', menuVisible:true, order:3 },
  { path:'/zero-carbon-results', title:'零碳成果与验收支撑', menuLabel:'零碳成果与验收支撑', group:'园区零碳管理', roles:committee, pageType:'module', menuVisible:true, order:4 },

  { path:'/enterprise-green-services', title:'企业绿色服务', menuLabel:'企业绿色服务', group:'企业绿色服务', roles:committee, pageType:'module', menuVisible:true, menuGroupOnly:true, order:1 },
  { path:'/enterprise-green-services/overview', title:'服务总览', menuLabel:'服务总览', group:'企业绿色服务', roles:committee, pageType:'subpage', parentPath:'/enterprise-green-services', menuParent:'/enterprise-green-services', menuVisible:true, order:1 },
  { path:'/enterprise-green-services/management', title:'服务管理', menuLabel:'服务管理', group:'企业绿色服务', roles:committee, pageType:'subpage', parentPath:'/enterprise-green-services', menuParent:'/enterprise-green-services', menuVisible:true, order:2 },
  { path:'/enterprise-green-services/results', title:'服务成果', menuLabel:'服务成果', group:'企业绿色服务', roles:committee, pageType:'subpage', parentPath:'/enterprise-green-services', menuParent:'/enterprise-green-services', menuVisible:true, order:3 },
  { path:'/enterprise-profile', title:'园区零碳推演与企业画像', menuLabel:'园区零碳推演与企业画像', groups:{committee:'园区零碳管理',enterprise:'企业绿色服务'}, roleLabels:{enterprise:'企业能碳画像'}, roles:both, pageType:'module', menuVisible:true, menuVisibleRoles:committee, order:5 },
  { path:'/green-service-center', title:'绿色服务中心', menuLabel:'绿色服务中心', group:'企业绿色服务', roles:enterprise, pageType:'professional', menuVisible:true, order:1 },
  { path:'/organization-carbon', title:'组织碳管理', menuLabel:'组织碳管理', group:'企业绿色服务', roles:enterprise, pageType:'professional', menuVisible:false, order:2 },
  { path:'/product-carbon-footprint', title:'产品碳足迹', menuLabel:'产品碳足迹', group:'企业绿色服务', roles:enterprise, pageType:'professional', menuVisible:false, order:3 },
  { path:'/cbam', title:'CBAM管理', menuLabel:'CBAM管理', group:'企业绿色服务', roles:enterprise, pageType:'professional', menuVisible:false, order:4 },
  { path:'/supply-chain-carbon', title:'供应链碳管理', menuLabel:'供应链碳管理', group:'企业绿色服务', roles:enterprise, pageType:'professional', menuVisible:false, order:5 },
  { path:'/enterprise-assets', title:'企业碳资产管理', menuLabel:'企业碳资产管理', group:'企业绿色服务', roles:enterprise, pageType:'professional', menuVisible:false, order:6 },

  { path:'/data-management', title:'数据管理', menuLabel:'数据管理', groups:{committee:'数据管理',enterprise:'数据管理',admin:'数据管理'}, roleLabels:{admin:'平台级数据查看/配置'}, roles:[...both,...admin], pageType:'module', menuVisible:true, menuVisibleRoles:admin, order:1 },
  { path:'/data-overview', title:'数据总览', menuLabel:'数据总览', group:'数据管理', roles:committee, pageType:'subpage', parentPath:'/data-management', menuParent:'/data-management', menuVisible:true, order:1 },
  { path:'/enterprise-archive', title:'企业档案', menuLabel:'企业档案', group:'数据管理', roles:committee, pageType:'subpage', parentPath:'/data-management', menuParent:'/data-management', menuVisible:true, order:2 },
  { path:'/energy-facilities', title:'能源与设施', menuLabel:'能源与设施', group:'数据管理', roles:committee, pageType:'subpage', parentPath:'/data-management', menuParent:'/data-management', menuVisible:true, order:3 },
  { path:'/business-data', title:'能碳与运营数据', menuLabel:'能碳与运营数据', group:'数据管理', roles:committee, pageType:'subpage', parentPath:'/data-management', menuParent:'/data-management', menuVisible:true, order:4 },
  { path:'/zero-carbon-data', title:'零碳专项数据', menuLabel:'零碳专项数据', group:'数据管理', roles:committee, pageType:'subpage', parentPath:'/data-management', menuParent:'/data-management', menuVisible:true, order:5 },
  { path:'/data-issues', title:'待处理数据事项', menuLabel:'数据问题', group:'数据管理', roles:both, pageType:'subpage', parentPath:'/data-management', menuParent:'/data-management', menuVisible:false, menuVisibleRoles:committee, order:6 },
  { path:'/my-data', title:'数据总览', menuLabel:'数据总览', group:'数据管理', roles:enterprise, pageType:'subpage', parentPath:'/data-management', menuParent:'/data-management', menuVisible:true, order:1 },
  { path:'/data-details', title:'数据明细', menuLabel:'数据明细', group:'数据管理', roles:enterprise, pageType:'subpage', parentPath:'/data-management', menuParent:'/data-management', menuVisible:true, order:2 },
  { path:'/enterprise-info', title:'企业信息', menuLabel:'企业信息', group:'数据管理', roles:enterprise, pageType:'subpage', parentPath:'/data-management', menuParent:'/data-management', menuVisible:true, order:3 },

  { path:'/knowledge', title:'双碳知识助手', menuLabel:'双碳知识服务', groups:{committee:'双碳知识服务',enterprise:'双碳知识服务'}, roles:both, pageType:'module', menuVisible:true, menuGroupOnly:true, order:1 },
  { path:'/knowledge-assistant', title:'双碳知识助手', menuLabel:'知识助手', group:'双碳知识服务', roles:both, pageType:'subpage', parentPath:'/knowledge', menuParent:'/knowledge', menuVisible:true, order:1 },
  { path:'/knowledge-policies', title:'政策法规', menuLabel:'政策法规', group:'双碳知识服务', roles:both, pageType:'subpage', parentPath:'/knowledge', menuParent:'/knowledge', menuVisible:true, order:2 },
  { path:'/knowledge-standards', title:'标准规范', menuLabel:'标准规范', group:'双碳知识服务', roles:both, pageType:'subpage', parentPath:'/knowledge', menuParent:'/knowledge', menuVisible:true, order:3 },
  { path:'/knowledge-cases', title:'实践案例', menuLabel:'实践案例', group:'双碳知识服务', roles:both, pageType:'subpage', parentPath:'/knowledge', menuParent:'/knowledge', menuVisible:true, order:4 },

  { path:'/system-management', title:'系统管理', menuLabel:'系统管理', group:'系统管理', roles:admin, pageType:'module', menuVisible:true, order:1 },
  { path:'/organization-users', title:'组织与用户', menuLabel:'组织与用户', group:'系统管理', roles:admin, pageType:'subpage', parentPath:'/system-management', menuParent:'/system-management', menuVisible:true, order:1 },
  { path:'/role-permissions', title:'角色权限', menuLabel:'角色权限', group:'系统管理', roles:admin, pageType:'subpage', parentPath:'/system-management', menuParent:'/system-management', menuVisible:true, order:2 },
  { path:'/data-ingestion', title:'数据接入', menuLabel:'数据接入', group:'系统管理', roles:admin, pageType:'subpage', parentPath:'/system-management', menuParent:'/system-management', menuVisible:true, order:3 },
  { path:'/logs', title:'日志管理', menuLabel:'日志管理', group:'系统管理', roles:admin, pageType:'subpage', parentPath:'/system-management', menuParent:'/system-management', menuVisible:true, order:4 },

  { path:'/enterprise-data-reporting', title:'填报任务', menuLabel:'填报任务', group:'企业协同任务', roles:enterprise, pageType:'workbench', menuVisible:true, order:1 },
]

export function getMenuGroups(role) {
  const order = role === 'enterprise' ? ['企业协同任务','企业绿色服务','双碳知识服务','数据管理'] : role === 'admin' ? ['系统管理','数据管理'] : ['园区零碳管理','企业绿色服务','双碳知识服务','数据管理']
  const visible = pageRoutes.filter(route => route.menuVisible && route.roles.includes(role) && (!route.menuVisibleRoles || route.menuVisibleRoles.includes(role)))
  return order.map(group => {
    const groupRoutes = visible.filter(route => (route.groups?.[role] || route.group) === group)
    const items = groupRoutes.filter(route => !route.menuParent || !visible.some(parent => parent.path === route.menuParent))
    return {
      group,
      items:items.sort((a,b)=>(a.order||0)-(b.order||0)).map(route => ({...route, menuLabel:route.roleLabels?.[role] || route.menuLabel, children:groupRoutes.filter(child => child.menuParent===route.path).sort((a,b)=>(a.order||0)-(b.order||0)).map(child => ({...child, menuLabel:child.roleLabels?.[role] || child.menuLabel}))}))
    }
  }).filter(entry => entry.items.length)
}
