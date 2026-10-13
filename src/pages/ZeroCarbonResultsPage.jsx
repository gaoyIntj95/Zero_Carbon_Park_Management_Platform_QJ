import { useMemo, useState } from 'react'
import { PageHeader } from '../components/PageHeader.jsx'
import { DataPanel } from '../components/DataPanel.jsx'
import { StatusTag } from '../components/StatusTag.jsx'
import { Modal } from '../components/Modal.jsx'
import { acceptanceItems, acceptanceMaterials, useSharedData } from '../mock/sharedStore.js'

const supportDefinitions = [
  { id:'support-clean-energy', acceptanceId:'accept-clean', support:'园区绿色能源供应方案', materialCount:3, source:'园区', date:'2026-08-20', status:'已完备', files:['园区绿色能源供应方案.pdf','年度能源消费统计表.xlsx','企业绿电采购凭证.zip'] },
  { id:'support-roof-pv', acceptanceId:'accept-roof', support:'企业屋顶光伏建设清单', materialCount:5, source:'园区及企业', date:'2026-08-20', status:'已完备', files:['企业屋顶光伏建设清单.xlsx','屋顶光伏建设验收文件.pdf','设备备案材料.pdf','企业屋顶权属证明.pdf','并网验收记录.pdf'] },
  { id:'support-diagnosis', acceptanceId:'accept-product-energy', support:'重点企业能效诊断', materialCount:4, source:'企业/第三方', date:'2026-08-20', status:'部分缺失', files:['重点企业能效诊断报告.pdf','重点设备能效检测报告.pdf','节能改造项目清单.xlsx','第三方服务合同.pdf'] },
  { id:'support-heat', acceptanceId:'accept-heat', support:'余热余压利用改造', materialCount:2, source:'企业', date:'2026-08-20', status:'已完备', files:['余热余压利用改造报告.pdf','余热回收运行记录.xlsx'] },
  { id:'support-water', acceptanceId:'accept-water', support:'工业节水与循环利用成果', materialCount:3, source:'企业', date:'2026-08-20', status:'已完备', files:['工业节水与循环利用成果报告.pdf','工业用水循环利用台账.xlsx','循环用水检测报告.pdf'] },
  { id:'support-factory', acceptanceId:'accept-waste', support:'绿色工厂认证成果', materialCount:2, source:'企业', date:'2026-08-20', status:'已完备', files:['绿色工厂认定材料.pdf','工业固废综合利用检测报告.pdf'] },
  { id:'support-footprint', acceptanceId:'accept-pcf', support:'碳足迹认证产品成果', materialCount:1, source:'企业/第三方', date:'2026-08-20', status:'部分缺失', files:['碳足迹认证产品清单.xlsx'] },
  { id:'support-building', acceptanceId:'accept-building', support:'绿色低碳建筑认定', materialCount:1, source:'园区及企业', date:'2026-08-20', status:'部分缺失', files:['绿色低碳建筑认定汇总.pdf'] },
  { id:'support-transport', acceptanceId:'accept-transport', support:'新能源交通运输建设成果', materialCount:0, source:'企业', date:'2026-08-20', status:'待补充', files:[] },
  { id:'support-saving', acceptanceId:'accept-unit-energy', support:'节能改造项目清单', materialCount:2, source:'企业', date:'2026-08-20', status:'已完备', files:['节能改造项目清单.xlsx','节能量核算说明.pdf'] },
  { id:'support-plan', acceptanceId:'accept-unit-energy', support:'零碳园区建设实施方案', materialCount:2, source:'园区', date:'2026-08-20', status:'已完备', files:['零碳园区建设实施方案.pdf','年度建设任务分解表.xlsx'] },
]

const indicatorTargets = {
  'accept-clean':'清洁能源消费占比 ≥ 90%',
  'accept-roof':'可利用建筑屋顶光伏覆盖率',
  'accept-product-energy':'企业产品单位能耗达到限额标准',
  'accept-heat':'余热余压利用率',
  'accept-water':'工业用水重复利用率',
  'accept-waste':'工业固废综合利用率',
  'accept-pcf':'碳足迹认证产品数量',
  'accept-building':'星级绿色建筑/超低能耗建筑比例',
  'accept-transport':'新能源交通运输工具比例',
  'accept-unit-energy':'单位能耗碳排放',
}

const statusTone = status => status === '已完备' ? 'ok' : status === '部分缺失' ? 'warn' : 'gray'

export function ZeroCarbonResultsPage() {
  const { acceptancePackage, submitAcceptancePackage, reviewAcceptancePackage } = useSharedData()
  const [packageOpen, setPackageOpen] = useState(false)
  const [packageReady, setPackageReady] = useState(false)
  const [selectedSupport, setSelectedSupport] = useState(null)
  const [supplementing, setSupplementing] = useState(false)
  const [options, setOptions] = useState({ indicator:true, archive:true, catalog:true, attachment:true })
  const [message, setMessage] = useState('')
  const supportRows = useMemo(() => supportDefinitions.map(item => ({ ...item, indicator:acceptanceItems.find(indicator => indicator.id === item.acceptanceId)?.name || '—', target:indicatorTargets[item.acceptanceId] || '' })), [])
  const incomplete = supportRows.filter(item => item.status !== '已完备').length
  const coverage = new Set(supportRows.map(item => item.acceptanceId)).size
  const generate = () => { setPackageReady(true); submitAcceptancePackage(supportRows.map(item => item.acceptanceId)); setMessage(`验收材料包已生成，当前仍有 ${incomplete} 项待完善内容，已提交园区复核。`) }
  const toggle = key => setOptions(prev => ({ ...prev, [key]:!prev[key] }))
  const openDetail = (item, shouldSupplement=false) => { setSelectedSupport(item); setSupplementing(shouldSupplement) }
  return <div className="content acceptance-page"><PageHeader title="零碳验收支撑" subtitle="按验收指标检查支撑成果和证明材料完备情况，补齐缺口后生成验收材料包。" actions={<button className="btn primary" onClick={() => setPackageOpen(true)}>生成验收材料包</button>} />
    {message && <div className="notice success">{message}</div>}
    {acceptancePackage.status !== '未生成' && <div className="notice">材料包状态：{acceptancePackage.status}{acceptancePackage.generatedAt && ` · 生成于 ${acceptancePackage.generatedAt}`}{acceptancePackage.status === '待复核' && <button className="op-btn" onClick={() => { reviewAcceptancePackage(); setMessage('验收成果已确认，关联建设任务和零碳指标已更新。') }}>确认验收成果</button>}</div>}
    <section className="acceptance-overview acceptance-support-overview"><div><span>验收指标覆盖</span><b>{coverage}/{acceptanceItems.length}<small>项</small></b></div><div><span>支撑成果</span><b>{supportRows.length}<small>项</small></b></div><div><span>证明材料</span><b>{acceptanceMaterials.length}<small>份</small></b></div><div className={incomplete?'support-pending':''}><span>待完善</span><b>{incomplete}<small>项</small></b></div></section>
    <SupportRegistry rows={supportRows} onOpen={openDetail}/>
    <SupportDetail item={selectedSupport} supplementing={supplementing} onClose={() => setSelectedSupport(null)} />
    <Modal open={packageOpen} title="生成验收材料包" onClose={() => setPackageOpen(false)} className="small"><div className="modal-body"><p className="panel-desc">材料包将按验收指标汇总支撑成果、证明材料和完备情况。</p><div className="package-summary"><div><b>{coverage}/{acceptanceItems.length}</b><span>项指标覆盖</span></div><div><b>{supportRows.length}</b><span>项支撑成果</span></div><div><b>{acceptanceMaterials.length}</b><span>份证明材料</span></div><div><b>{incomplete}</b><span>项待完善</span></div></div><div className="package-options">{[['indicator','指标结果表'],['archive','支撑成果清单'],['catalog','证明材料目录'],['attachment','全部附件']].map(([key,label]) => <label key={key}><input type="checkbox" checked={options[key]} onChange={() => toggle(key)} /> {label}</label>)}</div><div className="info-callout">当前仍有 {incomplete} 项支撑材料待完善；生成后会在材料目录中保留缺口说明。</div>{packageReady && <div className="package-ready">验收材料包已生成，当前状态：{acceptancePackage.status}。</div>}</div><div className="modal-foot"><button className="btn" onClick={() => setPackageOpen(false)}>取消</button><button className="btn primary" onClick={generate}>生成材料包</button></div></Modal>
  </div>
}

function SupportRegistry({ rows, onOpen }) {
  return <DataPanel className="acceptance-support" title="验收支撑事项" description="每条记录对应一项验收支撑事项，可检查成果、证明材料和完备情况。"><div className="table-wrap"><table><thead><tr><th>验收指标</th><th>支撑事项/成果</th><th>证明材料</th><th>材料来源</th><th>形成时间</th><th>完备状态</th><th>操作</th></tr></thead><tbody>{rows.map(item => <tr key={item.id}><td className="acceptance-indicator"><b>{item.indicator}</b>{item.target && <small>{item.target}</small>}</td><td className="item-name">{item.support}</td><td>{item.materialCount ? <button className="op-btn" onClick={() => onOpen(item)}>{item.materialCount}份</button> : <span className="acceptance-missing">待补充</span>}</td><td>{item.source}</td><td>{item.date}</td><td><StatusTag tone={statusTone(item.status)}>{item.status}</StatusTag></td><td className="acceptance-actions"><button className="op-btn" onClick={() => onOpen(item)}>查看</button>{item.status !== '已完备' && <button className="op-btn" onClick={() => onOpen(item, true)}>补充材料</button>}</td></tr>)}</tbody></table></div></DataPanel>
}

function SupportDetail({ item, supplementing, onClose }) {
  return <Modal open={!!item} title={supplementing ? '补充证明材料' : '验收支撑事项'} onClose={onClose} className="small"><div className="modal-body">{item && <><div className="kv"><div className="kv-item"><label>验收指标</label>{item.target || item.indicator}</div><div className="kv-item"><label>支撑事项/成果</label>{item.support}</div><div className="kv-item"><label>材料来源</label>{item.source}</div><div className="kv-item"><label>完备状态</label><StatusTag tone={statusTone(item.status)}>{item.status}</StatusTag></div></div><div className="section"><h3>证明材料</h3>{item.files.length ? <ul className="acceptance-attachment-list">{item.files.map(file => <li key={file}>{file}</li>)}</ul> : <p className="side-empty">当前尚未上传证明材料。</p>}</div>{supplementing && <div className="info-callout">请补充对应证明材料后回到填报任务提交，本页面将继续标记该事项的完备情况。</div>}</>}</div><div className="modal-foot"><button className="btn" onClick={onClose}>关闭</button>{supplementing && <button className="btn primary" onClick={onClose}>补充材料</button>}</div></Modal>
}
