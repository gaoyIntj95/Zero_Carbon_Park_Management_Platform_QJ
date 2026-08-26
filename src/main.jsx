import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { pageRoutes, getMenuGroups } from './routes.js'
import { ZeroCarbonIndicatorsPage } from './pages/ZeroCarbonIndicatorsPage.jsx'
import { ZeroCarbonResultsPage } from './pages/ZeroCarbonResultsPage.jsx'
import { EnterpriseDataReportingPage } from './pages/EnterpriseDataReportingPage.jsx'
import { ReportingTaskMonitoringPage } from './pages/ReportingTaskMonitoringPage.jsx'
import { EnterpriseGreenServicesPage } from './pages/EnterpriseGreenServicesPage.jsx'
import { ConstructionTaskPage, ScenarioPage, KnowledgeBasePage } from './pages/FocusPages.jsx'
import { ReportCenterPage } from './pages/ReportCenterPage.jsx'
import { SystemPage } from './pages/SystemPages.jsx'
import { CarbonAssetsPage } from './pages/CarbonAssetsPage.jsx'
import { EnergyCarbonModulePage } from './pages/EnergyCarbonModulePage.jsx'
import { DataManagementPage } from './pages/DataManagementPage.jsx'
import { SystemManagementPage } from './pages/SystemManagementPage.jsx'
import { EnterpriseProfilePage } from './pages/EnterpriseProfilePage.jsx'
import { EnterpriseManagementPage } from './pages/EnterpriseManagementPage.jsx'
import { AdminCenterPage } from './pages/AdminCenterPage.jsx'
import { ProfessionalServicePage } from './pages/ProfessionalServicePage.jsx'
import { ProductCarbonFootprintPage } from './pages/ProductCarbonFootprintPage.jsx'
import { PlaceholderPage } from './pages/PlaceholderPage.jsx'
import { enterprises, SharedDataProvider, useSharedData } from './mock/sharedStore.js'
import './styles.css'; import './extra.css'; import './focus.css'; import './theme.css'; import './zero-carbon-overview.css'; import './zero-carbon-results.css'; import './knowledge-base.css'; import './enterprise-profile.css'; import './energy-carbon-overview.css'

function AppShell({ children }) {
  const location=useLocation(), navigate=useNavigate(), current=pageRoutes.find(x=>x.path===location.pathname)||pageRoutes[0]
  const {role,setRole,currentEnterpriseId}=useSharedData()
  const currentEnterprise=enterprises.find(item=>item.id===currentEnterpriseId)
  const menuGroups=getMenuGroups(role)
  const currentGroup = current.groups?.[role] || current.group
  return <div className="app"><aside className="sidebar"><div className="brand">曲靖国家级零碳园区<small>能碳管理平台后台</small></div><div className="role-chip"><b>{role==='committee'?'园区管理人员':role==='admin'?'平台管理员':'企业填报员'}</b><br/>当前视角</div><nav className="menu">{menuGroups.map(entry=><section className="menu-section" key={entry.group}><button className={'menu-group menu-group-link '+(currentGroup===entry.group?'active':'')} onClick={()=>entry.items[0]&&navigate(entry.items[0].path)}><span className="menu-group-marker"/>{entry.group}</button><div className="menu-children">{entry.items.map(item=><React.Fragment key={item.path}><button className={'menu-item '+(current.path===item.path||item.children?.some(child=>child.path===current.path)?'active':'')} onClick={()=>navigate(item.path)}>{item.menuLabel}</button>{item.children?.map(child=><button key={child.path} className={'menu-item menu-child '+(current.path===child.path?'active':'')} onClick={()=>navigate(child.path)}>{child.menuLabel}</button>)}</React.Fragment>)}</div></section>)}</nav></aside><main className="main"><div className="topbar"><div className="breadcrumb">曲靖国家级零碳园区能碳管理平台后台 / {current.title}</div><div className="top-actions"><button className="top-link" onClick={()=>navigate(role==='admin'?'/system-management':role==='committee'?'/ioc-dashboard':'/enterprise-data-reporting')}>业务关系</button><select className="role-switch" value={role} onChange={e=>{setRole(e.target.value);navigate(e.target.value==='enterprise'?'/enterprise-data-reporting':e.target.value==='admin'?'/system-management':'/ioc-dashboard')}}><option value="committee">园区管理视角</option><option value="admin">平台管理员视角</option><option value="enterprise">企业执行视角</option></select><div className="user">{role==='committee'?'园区管委会 ▾':role==='admin'?'平台管理员 ▾':`${currentEnterprise?.name||'当前企业'} · 填报人员 ▾`}</div></div></div>{children}</main></div>
}

const focused={ '/zero-carbon-indicators':ZeroCarbonIndicatorsPage, '/energy-carbon-monitoring':EnergyCarbonModulePage, '/zero-carbon-results':ZeroCarbonResultsPage, '/enterprise-data-reporting':EnterpriseDataReportingPage, '/reporting-task-monitoring':ReportingTaskMonitoringPage, '/enterprise-green-services':EnterpriseGreenServicesPage, '/enterprise-profile':EnterpriseProfilePage, '/knowledge':KnowledgeBasePage, '/knowledge-ai':KnowledgeBasePage, '/data-management':DataManagementPage, '/data-overview':DataManagementPage, '/enterprise-archive':DataManagementPage, '/business-data':DataManagementPage, '/data-issues':DataManagementPage, '/my-data':DataManagementPage, '/enterprise-info':DataManagementPage, '/data-details':DataManagementPage, '/system-management':SystemManagementPage, '/organization-carbon':ProfessionalServicePage, '/product-carbon-footprint':ProductCarbonFootprintPage, '/cbam':ProfessionalServicePage, '/supply-chain-carbon':ProfessionalServicePage, '/enterprise-assets':ProfessionalServicePage, '/green-service-center':ProfessionalServicePage }
function ProtectedPage({route,children}){const {role}=useSharedData();const home=role==='enterprise'?'/enterprise-data-reporting':role==='admin'?'/system-management':'/ioc-dashboard';return route.roles.includes(role)?children:<Navigate to={home} replace/>}
function RoleHome(){const {role}=useSharedData();return <Navigate to={role==='enterprise'?'/enterprise-data-reporting':role==='admin'?'/system-management':'/ioc-dashboard'} replace/>}
function App(){return <BrowserRouter><SharedDataProvider><AppShell><Routes>{pageRoutes.map(item=>{const Page=focused[item.path]||({ '/data-management':DataManagementPage, '/system-management':SystemManagementPage, '/knowledge':KnowledgeBasePage }[item.parentPath]||(item.path==='/ioc-dashboard'?()=> <PlaceholderPage title="IOC驾驶舱"/>:()=> <SystemPage title={item.title}/>));return <Route key={item.path} path={item.path} element={<ProtectedPage route={item}><Page/></ProtectedPage>}/>})}<Route path="*" element={<RoleHome/>}/></Routes></AppShell></SharedDataProvider></BrowserRouter>}
createRoot(document.getElementById('root')).render(<App />)
