import { useState } from 'react'
import { PageHeader } from '../components/PageHeader.jsx'
import { DataPanel } from '../components/DataPanel.jsx'
import { StatusTag } from '../components/StatusTag.jsx'
import { Modal } from '../components/Modal.jsx'
import { enterprises, greenServices } from '../mock/sharedStore.js'

export function SystemPage({ title }) {
  const [detail,setDetail]=useState(null)
  const rows = title === '企业档案管理' ? enterprises.map(x => [x.name, x.industry, x.id, x.status]) :
    title === '组织碳排放' ? greenServices.filter(x => x.serviceType === '组织碳核查').map(x => [enterprises.find(e=>e.id===x.enterpriseId)?.name, x.year, x.stage, x.status]) :
    title === '产品碳足迹' ? greenServices.filter(x => x.serviceType === '产品碳足迹').map(x => [enterprises.find(e=>e.id===x.enterpriseId)?.name, x.product, x.year, x.status]) :
    [['系统对象', '基础管理容器', '当前阶段提供真实入口与稳定页面地址', '正常']]
  return <div className="content"><PageHeader title={title} subtitle="当前提供稳定页面入口与基础信息查看；完整管理能力不在本轮演示范围。" /><DataPanel title={title}><div className="table-wrap"><table><thead><tr><th>对象</th><th>业务类型</th><th>标识/期间</th><th>状态</th><th>操作</th></tr></thead><tbody>{rows.map((r,i)=><tr key={i}><td className="item-name">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td><StatusTag tone="ok">{r[3]}</StatusTag></td><td><button className="op-btn" onClick={()=>setDetail(r)}>查看</button></td></tr>)}</tbody></table></div></DataPanel><Modal open={!!detail} title={detail?.[0]||'详情'} onClose={()=>setDetail(null)} className="small"><div className="modal-body">{detail&&<div className="kv"><div className="kv-item"><label>业务类型</label>{detail[1]}</div><div className="kv-item"><label>标识 / 期间</label>{detail[2]}</div><div className="kv-item"><label>状态</label>{detail[3]}</div></div>}</div></Modal></div>
}
