import { useState } from 'react'
import { PageHeader } from '../components/PageHeader.jsx'
import { Tabs } from '../components/Tabs.jsx'
import { DataPanel } from '../components/DataPanel.jsx'
import { StatusTag } from '../components/StatusTag.jsx'
import { Modal } from '../components/Modal.jsx'
import { reportTemplates, useSharedData } from '../mock/sharedStore.js'

export function ReportCenterPage(){
  const {reports,addReport}=useSharedData()
  const [tab,setTab]=useState('template'),[selected,setSelected]=useState(null),[message,setMessage]=useState('')
  const generate=()=>{addReport(selected);setSelected(null);setTab('record');setMessage('报告已生成并写入生成记录。')}
  const exportRecord=report=>{const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`${report.name}.json`;link.click();URL.revokeObjectURL(url);setMessage('报告数据快照已导出。')}
  return <div className="content"><PageHeader title="报告中心" subtitle="基于现有业务数据生成前端报告记录，不模拟正式文档编制能力。"/>{message&&<div className="notice success">{message}</div>}<Tabs tabs={[{value:'template',label:'报告模板'},{value:'record',label:'生成记录'}]} active={tab} onChange={setTab}/>
    {tab==='template'?<DataPanel title="报告模板"><div className="table-wrap"><table><thead><tr><th>报告名称</th><th>报告类型</th><th>来源模块</th><th>适用周期</th><th>操作</th></tr></thead><tbody>{reportTemplates.map(item=><tr key={item.templateId}><td className="item-name">{item.name}</td><td>{item.type}</td><td>{item.sourceModules.join('、')}</td><td>{item.period}</td><td><button className="op-btn" onClick={()=>setSelected(item)}>生成报告</button></td></tr>)}</tbody></table></div></DataPanel>:<DataPanel title="生成记录"><div className="table-wrap"><table><thead><tr><th>报告名称</th><th>类型</th><th>统计期间</th><th>生成时间</th><th>状态</th><th>生成人</th><th>操作</th></tr></thead><tbody>{reports.length?reports.map(item=><tr key={item.reportId}><td className="item-name">{item.name}</td><td>{item.type}</td><td>{item.period}</td><td>{item.createdAt}</td><td><StatusTag tone="ok">{item.status}</StatusTag></td><td>{item.creator}</td><td><button className="op-btn" onClick={()=>exportRecord(item)}>导出快照</button></td></tr>):<tr><td className="empty-cell" colSpan="7">暂无生成记录</td></tr>}</tbody></table></div></DataPanel>}
    <Modal open={!!selected} title="生成报告" onClose={()=>setSelected(null)} className="small"><div className="modal-body">{selected&&<div className="kv"><div className="kv-item"><label>报告模板</label>{selected.name}</div><div className="kv-item"><label>统计期间</label>{selected.period}</div><div className="kv-item"><label>来源模块</label>{selected.sourceModules.join('、')}</div></div>}<div className="info-callout">将基于当前 Mock 共享数据生成一条前端记录。</div></div><div className="modal-foot"><button className="btn" onClick={()=>setSelected(null)}>取消</button><button className="btn primary" onClick={generate}>确认生成</button></div></Modal>
  </div>
}
