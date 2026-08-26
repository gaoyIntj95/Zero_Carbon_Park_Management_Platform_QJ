import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.jsx'
import { MetricStrip } from '../components/MetricStrip.jsx'
import { DataPanel } from '../components/DataPanel.jsx'
import { StatusTag } from '../components/StatusTag.jsx'

export function AdminCenterPage(){
  const navigate=useNavigate()
  return <div className="content"><PageHeader title="管理员中心" subtitle="平台管理员视角：负责组织、权限、系统配置、运行审计和平台级数据治理。"/><div className="service-role-banner service-admin"><b>平台管理工作台</b><span>管系统、管权限、管数据规则，不替代园区业务管理和企业数据填报</span></div><MetricStrip metrics={[{label:'组织租户',value:'1个',note:'曲靖零碳园区'},{label:'纳管企业',value:'6家',note:'当前平台范围'},{label:'待处理告警',value:'3项',note:'系统与权限相关'},{label:'今日操作日志',value:'28条',note:'可审计追溯'}]}/><div className="admin-center-grid"><DataPanel title="管理员任务" description="平台运行维护和权限治理事项。"><div className="admin-task"><div><b>检查企业角色授权</b><small>2个企业账号待确认数据权限范围</small></div><StatusTag tone="warn">待处理</StatusTag><button className="op-btn" onClick={()=>navigate('/system-management')}>去处理</button></div><div className="admin-task"><div><b>核对数据规则版本</b><small>能源、碳核算和指标专项数据规则待复核</small></div><StatusTag tone="warn">待复核</StatusTag><button className="op-btn" onClick={()=>navigate('/data-management')}>查看数据</button></div><div className="admin-task"><div><b>查看平台操作审计</b><small>最近 24 小时产生 28 条操作记录</small></div><StatusTag tone="ok">正常</StatusTag><button className="op-btn" onClick={()=>navigate('/system-management')}>查看日志</button></div></DataPanel><DataPanel title="平台快捷入口" description="管理员进入平台级配置，不进入企业填报工作台。"><div className="admin-shortcuts"><button className="admin-shortcut" onClick={()=>navigate('/system-management')}><b>组织与权限</b><span>账号、角色、数据范围</span></button><button className="admin-shortcut" onClick={()=>navigate('/data-management')}><b>平台数据</b><span>数据质量和规则口径</span></button><button className="admin-shortcut" onClick={()=>navigate('/enterprise-management')}><b>企业范围</b><span>查看纳管企业清单</span></button></div></DataPanel></div></div>
}
