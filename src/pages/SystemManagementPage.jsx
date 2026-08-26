import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.jsx'
import { Tabs } from '../components/Tabs.jsx'
import { DataPanel } from '../components/DataPanel.jsx'
import { StatusTag } from '../components/StatusTag.jsx'

const tabs=[{value:'organization',label:'组织与用户'},{value:'roles',label:'角色权限'},{value:'ingestion',label:'数据接入'},{value:'logs',label:'日志管理'}]
export function SystemManagementPage(){
  const { pathname } = useLocation(); const routeTab={ '/organization-users':'organization', '/role-permissions':'roles', '/data-ingestion':'ingestion', '/logs':'logs' }[pathname]
  const [tab,setTab]=useState(routeTab||'organization'); const navigate=useNavigate()
  useEffect(()=>{ if (routeTab) setTab(routeTab) },[routeTab])
  const config={
    organization:{title:'组织与用户',path:'/organization-users',headers:['组织/用户','对象类型','所属组织','状态'],rows:[['曲靖零碳园区管委会','园区组织','—','正常'],['企业填报员','用户','纳管企业','正常']]},
    roles:{title:'角色权限',path:'/role-permissions',headers:['角色','适用对象','菜单与数据范围','状态'],rows:[['园区管理人员','committee','园区业务及企业服务总览','正常'],['企业执行人员','enterprise','本企业专业服务与数据','正常'],['平台管理员','admin','系统配置与平台级数据','正常']]},
    ingestion:{title:'数据接入',path:'/data-ingestion',headers:['接入方式','数据来源','同步状态','异常记录'],rows:[['接口接入','物联/外部系统','正常','0'],['文件导入','企业数据填报','正常','1']]},
    logs:{title:'日志管理',path:'/logs',headers:['操作人','操作内容','时间','结果'],rows:[['园区管委会','查看填报任务监控','2026-08-25 18:20','成功'],['曲靖隆基 · 填报人员','更新企业填报数据','2026-08-25 17:42','成功']]},
  }[tab]
  return <div className="content"><PageHeader title="系统管理" subtitle="统一承载组织、角色权限和日志管理入口。" /><Tabs tabs={tabs} active={tab} onChange={setTab}/><DataPanel title={config.title} actions={<button className="btn" onClick={()=>navigate(config.path)}>进入完整页面</button>}><div className="table-wrap"><table><thead><tr>{config.headers.map(header=><th key={header}>{header}</th>)}</tr></thead><tbody>{config.rows.map((row,index)=><tr key={index}>{row.map((cell,cellIndex)=><td key={cellIndex} className={cellIndex===0?'item-name':''}>{cellIndex===row.length-1?<StatusTag tone="ok">{cell}</StatusTag>:cell}</td>)}</tr>)}</tbody></table></div></DataPanel></div>
}
