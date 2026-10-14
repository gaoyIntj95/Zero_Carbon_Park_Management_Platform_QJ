import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/PageHeader.jsx'
import { meteringPoints } from '../../mock/dataManagementStore.js'
import { capacityText, createPublicFacilitySeed, facilityOperationRecords, facilityTypes, operatingStates, publicFacilityRelations, publicSubject, sharedEnterpriseFacilities, validatePublicFacility } from '../../mock/parkFacilityData.js'
import './park-facility-ledger.css'

const storageKey = 'qj-public-facilities-v1'
const emptyFilters = { name: '', type: '', subject: '', status: '' }
const capacityFields = {
  公共供能: [['设计供热能力', 't/h']],
  新能源发电: [['装机容量', 'MWp']],
  能源转换: [['额定容量', 'MVA']],
  储能: [['额定功率', 'MW'], ['额定能量', 'MWh']],
  回收利用: [['设计回收能力', 't/h']],
  外供设施: [['设计外供能力', 't/h']],
}
const today = () => new Date().toISOString().slice(0, 10)
function readPublicFacilities() {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey))
    if (Array.isArray(value)) return value
  } catch { /* Fall back to the demo seed. */ }
  return createPublicFacilitySeed()
}

export function ParkFacilityLedger({ enterpriseRows, nodes, flows, navigate }) {
  const [publicFacilities, setPublicFacilities] = useState(readPublicFacilities)
  const [draftFilters, setDraftFilters] = useState(emptyFilters)
  const [filters, setFilters] = useState(emptyFilters)
  const [selectedId, setSelectedId] = useState(null)
  const [tab, setTab] = useState('basic')
  const [period, setPeriod] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [formType, setFormType] = useState('新能源发电')
  const [message, setMessage] = useState('')
  const allFacilities = useMemo(() => [...publicFacilities, ...sharedEnterpriseFacilities(nodes, enterpriseRows)], [publicFacilities, nodes, enterpriseRows])
  const selected = allFacilities.find(item => item.id === selectedId)
  const editing = publicFacilities.find(item => item.id === editingId)
  const visible = allFacilities.filter(item =>
    (!filters.name || item.name.includes(filters.name.trim())) &&
    (!filters.type || item.type === filters.type) &&
    (!filters.subject || item.subject === filters.subject) &&
    (!filters.status || item.status === filters.status))
  const subjects = [...new Set(allFacilities.map(item => item.subject))]
  const openDetail = item => { setSelectedId(item.id); setTab('basic'); setPeriod('') }
  const openForm = item => { setEditingId(item?.id || 'new'); setFormType(item?.type || '新能源发电'); setMessage('') }
  const save = event => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const next = {
      id: editing?.id || `qj-public-${crypto.randomUUID()}`,
      code: String(data.get('code') || '').trim(), name: String(data.get('name') || '').trim(),
      type: formType, subject: publicSubject, operator: String(data.get('operator') || '').trim(),
      location: String(data.get('location') || '').trim(), commissionedAt: String(data.get('commissionedAt') || ''),
      status: String(data.get('status') || ''), management: '园区公共',
      capacities: capacityFields[formType].map(([label, unit], index) => ({ label, value: Number(data.get(`capacity-${index}`)), unit })),
      condition: String(data.get('condition') || '').trim(),
      changes: [...(editing?.changes || []), { at: today(), action: editing ? '园区更新公共设施档案' : '园区新增公共设施', actor: '园区管理员' }],
    }
    try {
      validatePublicFacility(next, publicFacilities)
      const updated = editing ? publicFacilities.map(item => item.id === editing.id ? next : item) : [...publicFacilities, next]
      localStorage.setItem(storageKey, JSON.stringify(updated))
      setPublicFacilities(updated)
      setEditingId(null)
      setSelectedId(next.id)
      setTab('basic')
      setMessage('公共设施档案已保存。')
    } catch (error) { setMessage(error.message || '保存失败，请重试。') }
  }

  return <div className="content pf-page">
    <PageHeader title="园区能源设施" subtitle="归集设施档案，关联计量与供用能关系。" actions={<button className="btn primary" onClick={() => openForm()}>＋ 新增公共设施</button>} />
    {message && !editingId && <div className="notice success">{message}</div>}
    <div className="pf-stats">
      <Stat label="纳入设施数" value={allFacilities.length} icon="▥" />
      <Stat label="园区公共设施数" value={publicFacilities.length} icon="▤" />
      <Stat label="企业共享设施数" value={allFacilities.length - publicFacilities.length} icon="♧" />
    </div>
    <div className="pf-notice">ⓘ　企业所属设施按约定范围展示，内部设备由企业端管理。</div>
    <form className="pf-filters" onSubmit={event => { event.preventDefault(); setFilters(draftFilters) }}>
      <label>设施名称<input value={draftFilters.name} onChange={event => setDraftFilters({ ...draftFilters, name: event.target.value })} placeholder="请输入设施名称" /></label>
      <label>设施类型<select value={draftFilters.type} onChange={event => setDraftFilters({ ...draftFilters, type: event.target.value })}><option value="">全部</option>{facilityTypes.map(item => <option key={item}>{item}</option>)}</select></label>
      <label>所属主体<select value={draftFilters.subject} onChange={event => setDraftFilters({ ...draftFilters, subject: event.target.value })}><option value="">全部</option>{subjects.map(item => <option key={item}>{item}</option>)}</select></label>
      <label>运行状态<select value={draftFilters.status} onChange={event => setDraftFilters({ ...draftFilters, status: event.target.value })}><option value="">全部</option>{operatingStates.map(item => <option key={item}>{item}</option>)}</select></label>
      <button className="btn primary">查询</button><button className="btn" type="button" onClick={() => { setDraftFilters(emptyFilters); setFilters(emptyFilters) }}>重置</button>
    </form>
    <section className="pf-ledger"><header><h2>设施台账 <small>（{visible.length} 项）</small></h2></header><div className="pf-table-wrap"><table><thead><tr><th>设施名称</th><th>设施类型</th><th>所属主体</th><th>管理属性</th><th>额定容量或设计能力</th><th>运行状态</th><th>操作</th></tr></thead><tbody>{visible.map(item => <tr key={item.id}><td title={item.name}>{item.name}</td><td title={item.type}>{item.type}</td><td title={item.subject}>{item.subject}</td><td><span className={`pf-tag ${item.management === '园区公共' ? 'public' : ''}`}>{item.management}</span></td><td title={capacityText(item)}>{capacityText(item)}</td><td><span className={`pf-state ${item.status === '运行中' ? 'ok' : 'muted'}`}>● {item.status}</span></td><td><button className="pf-link" onClick={() => openDetail(item)}>查看</button></td></tr>)}</tbody></table>{!visible.length && <div className="pf-empty">没有符合条件的设施</div>}</div></section>
    {selected && <div className="pf-mask" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedId(null) }}><aside className="pf-drawer" role="dialog" aria-modal="true" aria-label="设施详情"><header><h2>设施详情</h2><button onClick={() => setSelectedId(null)} aria-label="关闭">×</button></header><div className="pf-title"><h2 title={selected.name}>{selected.name}</h2><span className="pf-tag public">{selected.management}</span><span className="pf-tag">{selected.status}</span></div><div className="pf-tabs">{[['basic', '基本信息'], ['energy', '能源与计量'], ['relations', '关系与变更']].map(([key, label]) => <button className={tab === key ? 'active' : ''} key={key} onClick={() => setTab(key)}>{label}</button>)}</div><div className="pf-drawer-body">
      {tab === 'basic' && <BasicDetails facility={selected} period={period} setPeriod={setPeriod} />}
      {tab === 'energy' && <EnergyDetails facility={selected} flows={flows} nodes={nodes} navigate={navigate} />}
      {tab === 'relations' && <RelationDetails facility={selected} flows={flows} nodes={nodes} enterpriseRows={enterpriseRows} navigate={navigate} />}
    </div><footer><button className="btn" onClick={() => setSelectedId(null)}>关闭</button>{selected.management === '园区公共' && <button className="btn primary" onClick={() => { setSelectedId(null); openForm(selected) }}>编辑公共设施</button>}</footer></aside></div>}
    {editingId && <div className="pf-mask" onMouseDown={event => { if (event.target === event.currentTarget) setEditingId(null) }}><aside className="pf-drawer" role="dialog" aria-modal="true" aria-label="维护公共设施"><header><h2>{editing ? '编辑公共设施' : '新增公共设施'}</h2><button onClick={() => setEditingId(null)} aria-label="关闭">×</button></header><form className="pf-form" onSubmit={save} key={editing?.id || 'new'}><div className="pf-drawer-body"><div className="pf-callout">园区仅维护公共设施。企业共享设施引用企业端档案。</div><div className="pf-form-grid"><label>设施编码<input name="code" required defaultValue={editing?.code || ''} /></label><label>设施名称<input name="name" required defaultValue={editing?.name || ''} /></label><label>设施类型<select value={formType} onChange={event => setFormType(event.target.value)}>{facilityTypes.map(item => <option key={item}>{item}</option>)}</select></label><label>所属主体<input value={publicSubject} readOnly /></label><label>运营主体<input name="operator" required defaultValue={editing?.operator || publicSubject} /></label><label>运行状态<select name="status" defaultValue={editing?.status || '运行中'}>{operatingStates.map(item => <option key={item}>{item}</option>)}</select></label><label className="wide">设施位置<input name="location" required defaultValue={editing?.location || ''} /></label><label>投运时间<input name="commissionedAt" type="date" required defaultValue={editing?.commissionedAt || ''} /></label></div><h3>额定容量或设计能力</h3><div className="pf-form-grid">{capacityFields[formType].map(([label, unit], index) => <label key={`${formType}-${label}`}>{label}（{unit}）<input name={`capacity-${index}`} type="number" min="0.001" step="any" required defaultValue={editing?.capacities?.find(item => item.label === label)?.value || ''} /></label>)}<label className="wide">适用条件<input name="condition" defaultValue={editing?.condition || ''} placeholder="如额定工况、直流侧装机口径" /></label></div>{message && <div className="pf-error" role="alert">{message}</div>}</div><footer><button type="button" className="btn" onClick={() => setEditingId(null)}>取消</button><button className="btn primary">保存</button></footer></form></aside></div>}
  </div>
}

function Stat({ label, value, icon }) { return <section><div className="pf-stat-icon">{icon}</div><div><span>{label}</span><strong>{value}<small> 项</small></strong></div></section> }
function Section({ title, children }) { return <section className="pf-detail-section"><h3>{title}</h3>{children}</section> }
function Facts({ rows }) { return <dl className="pf-facts">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl> }
function BasicDetails({ facility, period, setPeriod }) {
  const records = facilityOperationRecords.filter(item => item.facilityId === facility.id)
  const record = records.find(item => item.period === period) || records[0]
  return <><Section title="档案信息"><Facts rows={[[ '设施编码', facility.code ], ['设施名称', facility.name], ['设施类型', facility.type], ['所属主体', facility.subject], ['运营主体', facility.operator], ['设施位置', facility.location], ['投运时间', facility.commissionedAt], ['运行状态', facility.status], ['管理属性', facility.management]]} /></Section><Section title="额定容量或设计能力"><div className="pf-metrics">{facility.capacities.map(item => <div key={item.label}><span>{item.label}</span><strong>{item.value} <small>{item.unit}</small></strong></div>)}</div><p className="pf-help">适用条件：{facility.condition || '—'}</p></Section><Section title="实际运行数据"><div className="pf-period">统计期间 <select value={record?.period || ''} onChange={event => setPeriod(event.target.value)} disabled={!records.length}>{records.length ? records.map(item => <option key={item.period}>{item.period}</option>) : <option value="">暂无记录</option>}</select></div>{record ? <><div className="pf-metrics">{record.metrics.map(item => <div key={item.label}><span>{item.label}</span><strong>{item.value} <small>{item.unit}</small></strong></div>)}</div><p className="pf-help">数据来源：{record.source}　/　计量点：{record.meter}　/　记录：{record.id}</p></> : <p className="pf-help">暂无设施专属运行记录。额定能力不代表实际产出或可用供给能力。</p>}</Section></>
}
function EnergyDetails({ facility, flows, nodes, navigate }) {
  const meters = meteringPoints.filter(item => item.sourceNodeIds?.includes(facility.id))
  const records = facilityOperationRecords.filter(item => item.facilityId === facility.id)
  const linkedFlows = flows.filter(item => item.sourceNodeId === facility.id || item.targetNodeId === facility.id)
  const publicRelations = publicFacilityRelations.filter(item => item.facilityId === facility.id)
  return <><Section title="关联计量点">{meters.length ? meters.map(item => <div className="pf-related" key={item.pointId}><span title={item.name}>{item.name}<small>　{item.level} · {item.measuredObject}</small></span><button className="pf-link" onClick={() => navigate(`/energy-facilities?tab=meter&objectId=${item.pointId}`)}>查看计量点 →</button></div>) : records.length ? [...new Set(records.map(item => item.meter))].map(item => <div className="pf-related" key={item}><span>{item} <small>Mock 运行记录关联编号</small></span></div>) : <p className="pf-help">暂无关联计量点。</p>}{meters.some(item => item.level === '企业总表') && <p className="pf-help">企业总表计量整个企业，不能作为本设施的实际产出。</p>}</Section><Section title="业务数据引用">{records.length ? records.map(item => <div className="pf-related" key={item.id}><span>{item.period}　{item.source}<small>　{item.metrics.map(metric => `${metric.label} ${metric.value} ${metric.unit}`).join('、')}</small></span></div>) : <p className="pf-help">暂无设施专属业务数据；可在关联计量点或供用能关系中查看已有记录。</p>}</Section><Section title="供用能关系"><p className="pf-help">已关联 {linkedFlows.length + publicRelations.length} 条供用能关系。</p>{publicRelations.map(item => <div className="pf-related" key={item.id}><span>{facility.name} → {item.target}<small>　{item.energyType} · {item.mode} · {item.status}</small></span></div>)}{linkedFlows.map(item => <div className="pf-related" key={item.flowId}><span>{nodes.find(node => node.nodeId === item.sourceNodeId)?.name || item.sourceNodeId} → {nodes.find(node => node.nodeId === item.targetNodeId)?.name || item.targetNodeId}</span><button className="pf-link" onClick={() => navigate(`/energy-facilities?tab=flow&objectId=${item.flowId}`)}>查看关系 →</button></div>)}</Section></>
}
function RelationDetails({ facility, flows, nodes, enterpriseRows, navigate }) {
  const linkedFlows = flows.filter(item => item.sourceNodeId === facility.id || item.targetNodeId === facility.id)
  const publicRelations = publicFacilityRelations.filter(item => item.facilityId === facility.id)
  const label = id => { const node = nodes.find(item => item.nodeId === id); return node?.nodeRole === 'CONSUMER' ? enterpriseRows.find(item => item.enterpriseId === node.enterpriseId)?.name || node.name : node?.name || id }
  return <><Section title="供用能关系">{publicRelations.map(item => <div className="pf-related" key={item.id}><span>{facility.name} → {item.target}<small>　{item.energyType} · {item.mode} · {item.status}</small></span></div>)}{linkedFlows.map(item => <div className="pf-related" key={item.flowId}><span>{label(item.sourceNodeId)} → {label(item.targetNodeId)}<small>　{item.energyType} · {item.supplyMode} · {item.status}</small></span><button className="pf-link" onClick={() => navigate(`/energy-facilities?tab=flow&objectId=${item.flowId}`)}>查看 →</button></div>)}{!linkedFlows.length && !publicRelations.length && <p className="pf-help">暂无已登记的供用能关系。</p>}</Section><Section title="档案变更记录">{facility.changes?.length ? [...facility.changes].reverse().map((item, index) => <div className="pf-history" key={`${item.at}-${index}`}><time>{item.at}</time><span>{item.action}<small>{item.actor}</small></span></div>) : <p className="pf-help">暂无变更记录。</p>}</Section>{facility.management === '企业共享' && <div className="pf-callout">该设施档案来源于企业已有记录，内部设备由企业端维护。</div>}</>
}
