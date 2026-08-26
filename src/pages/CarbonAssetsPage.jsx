import { useState } from 'react'
import { PageHeader } from '../components/PageHeader.jsx'
import { Tabs } from '../components/Tabs.jsx'
import { MetricStrip } from '../components/MetricStrip.jsx'
import { DataPanel } from '../components/DataPanel.jsx'
import { Modal } from '../components/Modal.jsx'
import { carbonAssets, enterprises } from '../mock/sharedStore.js'

const tabs={quota:{label:'碳配额',unit:'万tCO₂e'},greenPower:{label:'绿电',unit:'万MWh'},greenCertificate:{label:'绿证',unit:'万MWh'}}
export function CarbonAssetsPage(){
  const [type,setType]=useState('quota'),[detail,setDetail]=useState(null)
  const records=carbonAssets.filter(asset=>asset.assetType===type&&asset.applicable!==false)
  const amount=records.reduce((sum,asset)=>sum+asset.amount,0),used=records.reduce((sum,asset)=>sum+(asset.used||0),0)
  const metrics=type==='quota'?[{label:'适用企业配额量',value:amount.toFixed(1)+' '+tabs[type].unit},{label:'已履约/已使用',value:used.toFixed(1)+' '+tabs[type].unit},{label:'结余/缺口',value:(amount-used).toFixed(1)+' '+tabs[type].unit}]:[{label:'台账数量',value:records.length+'条'},{label:'对应电量',value:amount.toFixed(1)+' '+tabs[type].unit}]
  return <div className="content"><PageHeader title="园区绿色权益与碳资产总览" subtitle="园区视角统一查看碳配额、绿电和绿证的规模、适用性与履约状态；本页面只做汇总和追溯，不提供资产交易或维护操作。"/><Tabs tabs={Object.entries(tabs).map(([value,item])=>({value,label:item.label}))} active={type} onChange={setType}/><MetricStrip metrics={metrics}/><DataPanel title={tabs[type].label+'总览明细'} description="按企业、资产类型、期间和适用性查看园区绿色权益与碳资产分布。"><div className="table-wrap"><table><thead><tr><th>企业</th><th>期间</th><th>数量</th><th>单位</th><th>状态</th><th>凭证</th><th>操作</th></tr></thead><tbody>{records.length?records.map(asset=><tr key={asset.assetId}><td className="item-name">{enterprises.find(item=>item.id===asset.enterpriseId)?.name}</td><td>{asset.period||asset.year}</td><td>{asset.amount}</td><td>{asset.unit}</td><td>{asset.status}</td><td>{asset.voucher}</td><td><button className="op-btn" onClick={()=>setDetail(asset)}>查看</button></td></tr>):<tr><td className="empty-cell" colSpan="7">当前资产类型暂无适用台账</td></tr>}</tbody></table></div></DataPanel><Modal open={!!detail} title="绿色权益与碳资产详情" onClose={()=>setDetail(null)} className="small"><div className="modal-body">{detail&&<div className="kv"><div className="kv-item"><label>资产ID</label>{detail.assetId}</div><div className="kv-item"><label>企业</label>{enterprises.find(item=>item.id===detail.enterpriseId)?.name}</div><div className="kv-item"><label>资产类型</label>{detail.assetType}</div><div className="kv-item"><label>是否适用</label>{detail.applicable?'是':'否'}</div><div className="kv-item"><label>业务日期</label>{detail.businessDate}</div><div className="kv-item"><label>凭证</label>{detail.voucher}</div></div>}</div></Modal></div>
}
