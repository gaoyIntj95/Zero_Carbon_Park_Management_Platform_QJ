import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '../components/PageHeader.jsx'
import { StatusTag } from '../components/StatusTag.jsx'
import { Modal } from '../components/Modal.jsx'
import { archives, acceptanceItems, acceptanceMaterials, enterprises, useSharedData } from '../mock/sharedStore.js'
import { buildParkIndicators } from './ZeroCarbonIndicatorsPage.jsx'

const acceptanceStorageKey = 'qujing-zero-carbon-acceptance-v3'
const categories = ['核心指标', '引导指标', '云南特色指标', '专项建设要求']
const acceptanceIdByIndicator = { 'ind-unit-energy':'accept-unit-energy', 'ind-clean-energy':'accept-clean', 'ind-product-energy':'accept-product-energy', 'ind-waste':'accept-waste', 'ind-heat':'accept-heat', 'ind-water':'accept-water', 'ind-roof':'accept-roof', 'ind-green-building':'accept-building', 'ind-new-energy-transport':'accept-transport', 'ind-pcf-products':'accept-pcf', 'ind-diagnosis':'accept-diagnosis', 'ind-green-direct':'accept-green' }
const categoryKey = value => value === '特色指标' ? '云南特色指标' : value
const materialStatusTone = value => value === '已确认' ? 'ok' : value === '待补充' ? 'warn' : 'gray'
const indicatorStatusTone = value => value === '已达标' ? 'ok' : value === '待提升' ? 'warn' : 'gray'
const nowText = () => new Date().toLocaleString('zh-CN', { hour12:false })
const deepCopy = value => JSON.parse(JSON.stringify(value))

const materialTemplates = {
  'accept-unit-energy': [
    { name:'园区能源消费汇总表', provider:'园区能碳管理部门', type:'统计台账', sourceName:'年度能源消费统计表' },
    { name:'园区碳排放计算表', provider:'园区能碳管理部门', type:'计算表' },
    { name:'核算规则与因子依据', provider:'园区能碳管理部门', type:'规则文件' },
  ],
  'accept-clean': [
    { name:'能源消费统计表', provider:'园区能源管理部门', type:'统计台账', sourceName:'年度能源消费统计表' },
    { name:'清洁能源消费来源凭证', provider:'示例主体：曲靖晶澳太阳能科技有限公司', type:'采购/消纳凭证' },
  ],
  'accept-product-energy': [
    { name:'主要产品产量及能耗表', provider:'示例主体：曲靖晶澳光伏科技有限公司', type:'企业填报记录' },
    { name:'适用限额标准与达标计算表', provider:'园区能效管理部门', type:'计算表' },
  ],
  'accept-waste': [
    { name:'固废产生及利用统计表', provider:'示例主体：曲靖隆基硅材料有限公司', type:'企业填报记录' },
    { name:'综合利用凭证', provider:'示例主体：曲靖隆基硅材料有限公司', type:'证明材料' },
  ],
  'accept-heat': [
    { name:'余热余冷余压利用统计表', provider:'示例主体：曲靖阳光新能源股份有限公司', type:'企业填报记录' },
    { name:'回收利用计量记录', provider:'示例主体：曲靖阳光新能源股份有限公司', type:'运行记录' },
  ],
  'accept-water': [
    { name:'工业用水统计表', provider:'示例主体：云南润阳世纪光伏科技有限公司', type:'企业填报记录' },
    { name:'重复利用水量记录', provider:'示例主体：云南润阳世纪光伏科技有限公司', type:'运行记录' },
  ],
  'accept-roof': [
    { name:'可利用屋顶及光伏覆盖面积清单', provider:'园区建设管理部门', type:'园区台账', sourceName:'企业屋顶光伏建设清单' },
    { name:'光伏建设及投运证明', provider:'示例主体：曲靖晶澳太阳能科技有限公司', type:'验收文件' },
  ],
  'accept-building': [
    { name:'新建建筑面积清单', provider:'园区建设管理部门', type:'建设台账' },
    { name:'绿色建筑认定材料', provider:'示例主体：曲靖亿纬锂能有限公司', type:'认证成果', sourceName:'绿色建筑认证证书' },
  ],
  'accept-transport': [
    { name:'交通运输工具分类台账', provider:'园区运营管理部门', type:'园区台账' },
    { name:'车辆及设备证明', provider:'示例主体：曲靖亿纬锂能有限公司', type:'证明材料' },
  ],
  'accept-pcf': [
    { name:'产品碳足迹成果清单', provider:'示例主体：曲靖晶澳光伏科技有限公司', type:'成果清单', sourceName:'碳足迹认证产品清单' },
    { name:'核算报告及认证材料', provider:'示例主体：曲靖晶澳光伏科技有限公司', type:'认证成果' },
  ],
  'accept-diagnosis': [
    { name:'适用企业清单', provider:'园区能效管理部门', type:'园区台账' },
    { name:'能效诊断报告', provider:'示例主体：曲靖晶澳太阳能科技有限公司', type:'正式报告', sourceName:'重点企业能效诊断报告' },
  ],
  'accept-green': [
    { name:'园区电力消费汇总表', provider:'园区能源管理部门', type:'统计台账' },
    { name:'绿电直接供应计量及来源凭证', provider:'示例主体：曲靖晶澳太阳能科技有限公司', type:'采购/溯源凭证' },
  ],
}

const sourceStatus = status => status === '待补充' ? '待补充' : ['待确认','部分归集'].includes(status) ? '待核对' : '已确认'
const defaultMaterialStatus = (acceptanceId, index, shared) => {
  if (acceptanceId === 'accept-waste') return '已确认'
  if (acceptanceId === 'accept-heat') return '待核对'
  if (acceptanceId === 'accept-transport') return '待补充'
  if (acceptanceId === 'accept-clean' && index === 1) return '待补充'
  if (acceptanceId === 'accept-roof' && index === 1) return '待核对'
  if (acceptanceId === 'accept-diagnosis' && index === 1) return '待核对'
  if (acceptanceId === 'accept-green' && index === 1) return '待核对'
  return shared ? sourceStatus(shared.status) : '待补充'
}
const issueFor = status => status === '待补充' ? '缺少本期适用材料' : status === '待核对' ? '材料已提交，待核对适用期间及对应关系' : ''
const actorFor = provider => provider.startsWith('示例主体：') ? provider.replace('示例主体：', '') : provider

function materialRecord(acceptanceId, template, index, period) {
  const shared = acceptanceMaterials.find(item => item.name === template.sourceName || item.name === template.name)
  const status = defaultMaterialStatus(acceptanceId, index, shared)
  const archive = archives.find(item => item.name === template.sourceName || item.name === template.name)
  const issue = issueFor(status)
  return {
    materialId:`${acceptanceId}-material-${index + 1}`,
    name:template.name,
    provider:template.provider,
    materialType:template.type,
    period,
    version:'V1',
    status,
    issue,
    fileName:'',
    fileData:'',
    sample:true,
    linkedArchive:archive?.name || shared?.name || '',
    task:null,
    history:[],
    logs:[{ time:'2026-08-20 10:00', actor:'原型示例', action:status === '已确认' ? '园区核对确认' : '资料初始化', note:issue || '已核对材料期间和指标对应关系' }],
  }
}

function createYearRecords(year) {
  const period = year === '2026' ? '2026年1—7月' : '2025年度'
  return acceptanceItems.map(item => ({
    indicatorId:item.id.replace('accept-', 'ind-'),
    acceptanceId:item.id,
    materials:(materialTemplates[item.id] || []).map((template, index) => {
      const record = materialRecord(item.id, template, index, period)
      if (year === '2025') { record.status = '待补充'; record.issue = '2025年度尚未关联本期材料'; record.logs = [{ time:'2026-10-13 09:00', actor:'原型示例', action:'资料初始化', note:'本年度尚未关联材料' }] }
      return record
    }),
  }))
}

function createInitialStore() { return { version:3, years:{ '2026':createYearRecords('2026'), '2025':createYearRecords('2025') } } }
function readStore() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(acceptanceStorageKey) || 'null')
    if (saved?.version === 3 && saved.years?.['2026'] && saved.years?.['2025']) return { store:saved, notice:'' }
  } catch { return { store:createInitialStore(), notice:'浏览器存储读取失败，已使用本次演示数据；当前操作可能无法跨刷新保留。' } }
  return { store:createInitialStore(), notice:'' }
}

function aggregateStatus(materials) {
  if (!materials?.length || materials.some(item => item.status === '待补充')) return '待补充'
  if (materials.some(item => item.status === '待核对')) return '待核对'
  return '已确认'
}
function materialCount(materials) { return materials.filter(item => item.status !== '待补充').length }
function uniqueConfirmedMaterials(records) {
  const unique = new Map()
  records.forEach(record => record.materials.filter(item => item.status === '已确认').forEach(item => {
    const key = `${item.fileName || `sample:${item.name}`}|${item.version}`
    if (!unique.has(key)) unique.set(key, { ...item, relations:[record.acceptanceId] })
    else unique.get(key).relations.push(record.acceptanceId)
  }))
  return [...unique.values()]
}

function Badge({ children, tone='gray' }) { return <StatusTag tone={tone}>{children}</StatusTag> }

export function ZeroCarbonResultsPage() {
  const { runtimeResults, createCampaign } = useSharedData()
  const initial = useState(readStore)[0]
  const [store, setStore] = useState(initial.store)
  const [storageNotice, setStorageNotice] = useState(initial.notice)
  const [year, setYear] = useState('2026')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('ind-unit-energy')
  const [operation, setOperation] = useState(null)
  const [note, setNote] = useState('')
  const [taskRequirement, setTaskRequirement] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [packageSnapshot, setPackageSnapshot] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    try { window.localStorage.setItem(acceptanceStorageKey, JSON.stringify(store)); setStorageNotice('') }
    catch { setStorageNotice('浏览器存储空间不足，本次变更仅保留在当前页面。') }
  }, [store])

  const indicatorResults = useMemo(() => buildParkIndicators(year, runtimeResults), [year, runtimeResults])
  const records = store.years[year] || []
  const rows = useMemo(() => indicatorResults.map(item => {
    const acceptanceId = acceptanceIdByIndicator[item.indicatorId]
    const record = records.find(entry => entry.acceptanceId === acceptanceId) || { acceptanceId, materials:[] }
    return { ...item, period:year === '2026' ? '2026年1—7月' : '2025年度', acceptanceId, record, materialStatus:aggregateStatus(record.materials), materialCount:materialCount(record.materials) }
  }), [indicatorResults, records])
  const filteredRows = useMemo(() => rows.filter(item => item.name.includes(search.trim())), [rows, search])
  const selectedRow = filteredRows.find(item => item.indicatorId === selectedId) || filteredRows[0]
  const selectedRecord = selectedRow?.record
  const selectedMaterial = selectedRecord?.materials.find(item => item.materialId === operation?.materialId)
  const materials = records.flatMap(record => record.materials)
  const counts = { total:materials.length, confirmed:materials.filter(item => item.status === '已确认').length, pending:materials.filter(item => item.status === '待补充').length, review:materials.filter(item => item.status === '待核对').length }
  const fileCount = new Set(materials.filter(item => item.fileData && item.fileName).map(item => `${item.fileName}|${item.version}`)).size
  const selectedMissing = selectedRecord?.materials.filter(item => item.status === '待补充') || []
  const relatedArchives = selectedRow ? archives.filter(item => item.acceptanceItemIds?.includes(selectedRow.acceptanceId)) : []

  useEffect(() => { setNote(''); setTaskRequirement(selectedMaterial?.issue || '请提交本期材料，并说明适用期间及变更内容。'); setFile(null) }, [operation?.materialId, operation?.mode])

  const updateYearRecords = updater => setStore(prev => ({ ...prev, years:{ ...prev.years, [year]:updater(prev.years[year] || []) } }))
  const updateMaterial = (materialId, patch) => updateYearRecords(current => current.map(record => ({ ...record, materials:record.materials.map(material => material.materialId === materialId ? { ...material, ...patch } : material) })))
  const selectIndicator = item => { setSelectedId(item.indicatorId); setOperation(null); setMessage('') }
  const announce = text => { setMessage(text); window.setTimeout(() => setMessage(''), 3000) }

  const createDemoTask = ({ materialId, requirement }) => {
    const material = records.flatMap(record => record.materials).find(item => item.materialId === materialId)
    if (!material) return
    const enterprise = enterprises.find(item => material.provider.includes(item.name))
    const campaignId = createCampaign ? createCampaign({ name:`${actorFor(material.provider)}${material.name}补充任务`, purpose:requirement, period:material.period, deadline:'2026-10-31', enterpriseIds:[enterprise?.id || 'ent-002'], templateIds:[], dataScopes:['零碳验收支撑'], taskType:'验收资料补充' }) : `campaign-demo-${Date.now()}`
    const task = { id:`验收演示任务-${Date.now().toString().slice(-8)}`, campaignId, provider:material.provider, note:requirement, status:'待企业提交', createdAt:nowText() }
    updateMaterial(materialId, { task, issue:'已创建演示补充任务，等待企业提交材料' })
    announce(`已创建演示补充任务 ${task.id}，未实际发送通知。`)
  }

  const handleSubmitFile = async ({ material, file, note }) => {
    if (!file || !note.trim()) { announce('请选择文件并填写补充 / 变更说明。'); return }
    if (file.size > 2 * 1024 * 1024) { announce('文件不能超过2MB。'); return }
    if (!/\.(pdf|png|jpe?g|txt)$/i.test(file.name)) { announce('仅支持 PDF、PNG、JPG、JPEG 或 TXT 文件。'); return }
    const data = await new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => resolve(null); reader.readAsDataURL(file) })
    if (!data) { announce('文件读取失败，请重新选择。'); return }
    const previous = { version:material.version, fileName:material.fileName, fileData:material.fileData, sample:material.sample, period:material.period, materialType:material.materialType, recordedAt:nowText() }
    const history = [...(material.history || [])]
    if (material.fileName || material.sample) history.unshift(previous)
    updateMaterial(material.materialId, { fileName:file.name, fileData:data, fileSize:file.size, sample:false, version:`V${Number(material.version.replace('V','') || 1) + 1}`, status:'待核对', issue:'新材料已提交，待核对', history, logs:[{ time:nowText(), actor:'园区演示人员', action:'提交材料', note:`${file.name}；${note}` }, ...(material.logs || [])], task:material.task ? { ...material.task, status:'已提交' } : material.task })
    setOperation(null)
    announce('本项材料已进入待核对，其他材料状态保持不变。')
  }

  const reviewMaterial = (material, approved, note) => {
    if (!note.trim()) { announce('请填写核对意见。'); return }
    const nextStatus = approved ? '已确认' : '待补充'
    updateMaterial(material.materialId, { status:nextStatus, issue:approved ? '' : note, logs:[{ time:nowText(), actor:'园区演示人员', action:approved ? '确认本项材料' : '要求修正', note }, ...(material.logs || [])], task:approved ? (material.task ? { ...material.task, status:'已确认' } : material.task) : (material.task ? { ...material.task, status:'待修正' } : material.task) })
    setOperation(null)
    announce(approved ? '本项材料已确认，指标判定保持不变。' : '已记录修正要求，本项材料回到待补充。')
  }

  const openPackage = () => setPackageSnapshot({ generatedAt:nowText(), year, period:year === '2026' ? '2026年1—7月' : '2025年度', resultVersion:'指标结果V1', rows:deepCopy(rows), records:deepCopy(records) })
  return <div className="content acceptance-page acceptance-prototype-page">
    <PageHeader title="零碳验收支撑" subtitle="核对支撑材料、处理资料缺口，归集本期验收准备成果。" actions={<button className="btn primary" onClick={openPackage}>生成材料包</button>} />
    {storageNotice && <div className="notice warning">{storageNotice}</div>}
    {message && <div className="notice success">{message}</div>}
    <div className="acceptance-period card-surface"><span>评价年度</span><select value={year} onChange={event => { setYear(event.target.value); setOperation(null) }}><option value="2026">2026</option><option value="2025">2025</option></select><span>资料期间：{year === '2026' ? '2026年1—7月' : '2025年度'}</span><small>示例数据</small></div>
    <section className="acceptance-stats"><div className="card-surface"><span className="acceptance-stat-icon">▤</span><div><span>材料要求总项数</span><b>{counts.total}<small>项</small></b><em>按本期材料要求统计</em></div></div><div className="card-surface"><span className="acceptance-stat-icon green">✓</span><div><span>已确认项数</span><b className="stat-green">{counts.confirmed}<small>项</small></b><em>按本期材料要求统计</em></div></div><div className="card-surface"><span className="acceptance-stat-icon amber">!</span><div><span>待补充项数</span><b className="stat-amber">{counts.pending}<small>项</small></b><em>按本期材料要求统计</em></div></div><div className="card-surface"><span className="acceptance-stat-icon blue">◷</span><div><span>待核对项数</span><b className="stat-gray">{counts.review}<small>项</small></b><em>按本期材料要求统计</em></div></div></section>
    <div className="acceptance-workspace"><aside className="acceptance-directory card-surface"><header><h2>指标资料目录</h2><p>{rows.length} 项关联指标</p></header><div className="acceptance-directory-search"><input value={search} onChange={event => { setSearch(event.target.value); setOperation(null) }} placeholder="搜索指标" aria-label="搜索指标"/></div><div className="acceptance-directory-groups">{categories.map(group => <section key={group}><h3>{group} <span>({rows.filter(item => categoryKey(item.cat) === group).length})</span></h3>{filteredRows.filter(item => categoryKey(item.cat) === group).map(item => <button key={item.indicatorId} className={`acceptance-directory-item ${selectedRow?.indicatorId === item.indicatorId ? 'active' : ''}`} onClick={() => selectIndicator(item)}><span><b>{item.name}</b>{selectedRow?.indicatorId === item.indicatorId && <small>已确认 {item.record.materials.filter(material => material.status === '已确认').length}/{item.record.materials.length} · {item.materialStatus}</small>}</span>{selectedRow?.indicatorId !== item.indicatorId && <Badge tone={materialStatusTone(item.materialStatus)}>{item.materialStatus}</Badge>}<i>›</i></button>)}</section>)}{!filteredRows.length && <div className="empty-state">未找到匹配指标</div>}</div><div className="acceptance-directory-foot">共 {rows.length} 项指标 · {counts.total} 项材料要求</div></aside>
      <main className="acceptance-workarea card-surface">{selectedRow ? <><header className="acceptance-workarea-head"><div><h2>{selectedRow.name} · 支撑材料</h2><p>{selectedRow.period}　·　已确认 {selectedRecord.materials.filter(item => item.status === '已确认').length}/{selectedRecord.materials.length} 项材料</p></div><details className="acceptance-result-details"><summary>查看指标结果与口径 →</summary><div><p>当前值：<b>{selectedRow.value}</b>　目标：<b>{selectedRow.target}</b>　指标判定：<Badge tone={indicatorStatusTone(selectedRow.judgmentStatus)}>{selectedRow.judgmentStatus}</Badge></p><p>计算公式：{selectedRow.formula}</p><p>统计边界：园区纳入统计企业及公共能源设施；指标期间为 {selectedRow.period}。</p><p>依据：{selectedRow.basis}</p><small>资料确认仅表示本期资料完成核对，不改变指标判定或代表验收通过。</small></div></details></header>{selectedMissing.length > 0 && <div className="acceptance-gap-banner">本项尚缺 {selectedMissing.length} 项材料：{selectedMissing.map(item => item.name).join('、')}。</div>}<div className="acceptance-workarea-body"><h3>所需材料与处理情况</h3><div className="material-list">{selectedRecord.materials.map(material => <MaterialItem key={material.materialId} material={material} onPreview={() => setPreview({ ...material, indicatorName:selectedRow.name })} onOperation={mode => setOperation({ mode, materialId:material.materialId })} />)}</div>{operation && selectedMaterial && <OperationArea operation={operation} material={selectedMaterial} isEnterprise={selectedMaterial.provider.startsWith('示例主体：')} note={note} setNote={setNote} taskRequirement={taskRequirement} setTaskRequirement={setTaskRequirement} file={file} setFile={setFile} onCreateTask={() => createDemoTask({ materialId:selectedMaterial.materialId, requirement:taskRequirement })} onSubmitFile={() => handleSubmitFile({ material:selectedMaterial, file, note })} onReview={approved => reviewMaterial(selectedMaterial, approved, note)} onPreview={setPreview} onOperation={setOperation} /> }<details className="acceptance-related"><summary>关联数据与建设成果</summary><div><p><b>关联数据：</b>{(selectedRow.calculationRows || []).map(item => item.name).join('、') || '暂无关联数据'}</p><p><b>关联建设成果：</b>{relatedArchives.map(item => item.name).join('、') || '暂无关联成果'}</p></div></details></div></> : <div className="empty-state">请选择左侧指标查看材料要求。</div>}</main></div>
    <section className="acceptance-package-footer card-surface"><div className="acceptance-package-icon">▰</div><div><h2>本期资料归集</h2><p>归集内容：指标结果清单、已确认材料目录、待处理缺口清单。</p><small>已关联真实文件 {fileCount} 份；示例材料无真实附件。</small></div><div className="acceptance-package-warning">仍有 {counts.pending} 项待补充、{counts.review} 项待核对，可先形成阶段归集清单。</div><button className="btn" onClick={openPackage}>预览归集目录</button></section><p className="acceptance-note">资料确认仅用于准备管理，不代表指标达标或验收通过。</p>
    <PackagePreview snapshot={packageSnapshot} onClose={() => setPackageSnapshot(null)} onExport={snapshot => { const ok = exportPackage(snapshot); setMessage(ok ? '示例归集清单已导出，使用的是生成时的数据快照。' : '示例归集清单导出失败，请检查浏览器下载权限。') }} />
    <MaterialPreview material={preview} onClose={() => setPreview(null)} />
  </div>
}

function MaterialItem({ material, onPreview, onOperation }) {
  const isEnterprise = material.provider.startsWith('示例主体：')
  const source = material.linkedArchive ? `关联台账：${material.linkedArchive}` : isEnterprise ? '企业报送' : '园区资料补充'
  return <article className={`material-item ${material.status === '已确认' ? 'confirmed' : 'needs-action'}`}><div className="acceptance-material-icon">▤</div><div className="acceptance-material-main"><div className="material-item-head"><h4>{material.name}</h4><Badge tone={materialStatusTone(material.status)}>{material.status}</Badge></div><p>提供主体：{material.provider}　│　来源：{source}　│　类型：{material.materialType}　│　期间：{material.period}　│　{material.version}</p>{material.fileName && <div className="material-file-name">{material.fileName} · {material.version}</div>}{material.issue ? <div className="material-issue">{material.issue}</div> : <div className="material-ok">已核对本期材料及指标对应关系。</div>}{material.task && <div className="material-task">演示任务 {material.task.id} · {material.task.status}</div>}</div><div className="material-actions">{material.status !== '待补充' && <button className="btn acceptance-material-primary" onClick={onPreview}>预览材料</button>}{material.status === '待补充' ? <button className="btn acceptance-material-primary" onClick={() => onOperation('supply')}>{isEnterprise ? material.task ? '继续补充' : '发起补充任务' : '补充园区材料'}</button> : material.status === '待核对' ? <button className="btn acceptance-material-primary" onClick={() => onOperation('review')}>核对材料</button> : <button className="btn acceptance-material-secondary" onClick={() => onOperation('supply')}>更新材料</button>}<button className="btn acceptance-material-secondary" onClick={() => onOperation('history')}>处理记录</button></div></article>
}

function OperationArea({ operation, material, isEnterprise, note, setNote, taskRequirement, setTaskRequirement, file, setFile, onCreateTask, onSubmitFile, onReview, onPreview, onOperation }) {
  if (operation.mode === 'history') return <section className="drawer-section operation-area"><div className="operation-title"><h3>处理记录 · {material.name}</h3><button className="link-btn" onClick={() => onOperation(null)}>收起</button></div><div className="history-list">{(material.logs || []).map((log, index) => <div className="history-item" key={`${log.time}-${index}`}><b>{log.action}</b><small>{log.time} · {log.actor}</small><p>{log.note}</p></div>)}{(material.history || []).map(history => <div className="history-version" key={`${history.version}-${history.recordedAt}`}><b>{history.version}</b><span>{history.fileName || '示例材料，无真实附件'} · {history.recordedAt}</span><button className="link-btn" onClick={() => onPreview({ ...history, name:material.name, provider:material.provider, materialType:material.materialType, period:material.period, indicatorName:'' })}>查看原版本</button></div>)}</div></section>
  if (operation.mode === 'review') return <section className="drawer-section operation-area"><div className="operation-title"><div><h3>核对当前材料</h3><p>核对提供主体、适用期间、内容与指标要求的对应关系。</p></div><button className="link-btn" onClick={() => onOperation(null)}>收起</button></div><div className="operation-context"><b>{material.name}</b><span>{material.provider} · {material.version}</span></div><label className="operation-field">核对意见<textarea value={note} onChange={event => setNote(event.target.value)} placeholder="请记录核对依据或需修正的问题" /></label><div className="operation-buttons"><button className="btn" onClick={() => onReview(false)}>要求修正</button><button className="btn primary" onClick={() => onReview(true)}>确认本项材料</button></div></section>
  return <section className="drawer-section operation-area"><div className="operation-title"><div><h3>{isEnterprise ? '企业材料补充' : '补充园区材料'} · {material.name}</h3><p>提供主体：{material.provider} · 适用期间：{material.period}</p></div><button className="link-btn" onClick={() => onOperation(null)}>收起</button></div>{isEnterprise && !material.task && <div className="task-create-box"><div><b>先发起企业补充任务</b><p>当前主体为示例企业，创建后只记录演示任务，不实际发送通知。</p></div><textarea value={taskRequirement} onChange={event => setTaskRequirement(event.target.value)} /><button className="btn" onClick={onCreateTask}>创建演示补充任务</button></div>}{isEnterprise && material.task && <div className="task-box">演示任务 {material.task.id} · {material.task.status}<br />{material.task.provider} · {material.task.note}<small>未实际发送通知，仅用于本页交互演示。</small></div>}<label className="operation-field">选择文件<input type="file" accept=".pdf,.png,.jpg,.jpeg,.txt" onChange={event => setFile(event.target.files?.[0] || null)} /></label><small className="file-hint">支持 PDF、图片、TXT，每份不超过 2MB；仅存于当前浏览器。</small><label className="operation-field">补充 / 变更说明<textarea value={note} onChange={event => setNote(event.target.value)} placeholder="请说明补充内容、适用期间及变更原因" /></label><div className="operation-buttons"><button className="btn primary" onClick={onSubmitFile}>{isEnterprise ? '模拟企业提交' : '提交待核对'}</button></div></section>
}

function MaterialPreview({ material, onClose }) {
  if (!material) return null
  const hasFile = Boolean(material.fileData)
  const isImage = hasFile && material.fileData.startsWith('data:image/')
  return <Modal open title={`材料预览 · ${material.fileName || material.version || '示例材料'}`} onClose={onClose} className="material-preview-modal"><div className="modal-body"><div className="preview-meta">{material.indicatorName && <span>关联指标：{material.indicatorName}</span>}<span>{material.period} · {material.version}</span><span>{material.provider}</span></div>{!hasFile ? <div className="sample-file-note">示例材料，无真实附件。当前仅展示材料要求、版本和处理状态，不能作为正式报告或认证文件。</div> : isImage ? <img className="material-preview-image" src={material.fileData} alt={material.fileName} /> : <iframe className="material-preview-frame" src={material.fileData} title="材料预览" sandbox="allow-same-origin" />}{hasFile && <div className="preview-download"><a className="btn" href={material.fileData} download={material.fileName}>下载当前文件</a><span>浏览器可能显示保存提示。</span></div>}</div><div className="modal-foot"><button className="btn" onClick={onClose}>关闭预览</button></div></Modal>
}

function PackagePreview({ snapshot, onClose, onExport }) {
  if (!snapshot) return null
  const confirmedRows = snapshot.rows.filter(row => row.materialStatus === '已确认')
  const confirmedMaterials = uniqueConfirmedMaterials(snapshot.records)
  const pendingRows = snapshot.rows.filter(row => row.materialStatus !== '已确认')
  return <Modal open title="本期资料归集预览" onClose={onClose} className="package-preview-modal"><div className="modal-body"><div className="package-note">{snapshot.period} · {snapshot.resultVersion} · 本次仅归集已确认材料，缺口单独列明。</div><div className="package-summary-grid"><div><b>{confirmedRows.length}/{snapshot.rows.length}</b><span>资料已确认指标 / 全部指标</span></div><div><b>{confirmedMaterials.length}</b><span>已确认材料要求项（去重）</span></div><div><b>{pendingRows.length}</b><span>仍有待处理材料的指标</span></div></div><h3>归集内容</h3><p className="package-content">① 指标结果清单　② 材料目录及指标对应关系<br />③ 已确认材料版本信息　④ 待补充与待核对清单</p><h3>已确认材料目录</h3>{confirmedMaterials.length ? <div className="package-material-list">{confirmedMaterials.map(item => <div key={`${item.name}-${item.version}`}><b>{item.name}</b><span>{item.version} · {item.fileName || '示例材料，无真实附件'} · 关联 {item.relations.length} 项指标</span></div>)}</div> : <div className="empty-state">当前没有已确认材料。</div>}<h3>尚存缺口</h3>{pendingRows.length ? <div className="package-gap-list">{pendingRows.map(row => <div key={row.indicatorId}><b>{row.name}</b><Badge tone={materialStatusTone(row.materialStatus)}>{row.materialStatus}</Badge><small>{row.record.materials.filter(item => item.status !== '已确认').map(item => item.issue || item.name).join('；')}</small></div>)}</div> : <div className="empty-state">无待处理资料。</div>}<div className="package-disclaimer">本原型导出 HTML 阶段归集清单，包含生成时的指标结果、材料名称、版本和状态；不生成 ZIP，不声称包含真实附件材料。</div></div><div className="modal-foot"><button className="btn" onClick={onClose}>取消</button><button className="btn primary" onClick={() => onExport(snapshot)}>导出示例归集清单</button></div></Modal>
}

function exportPackage(snapshot) {
  const materials = uniqueConfirmedMaterials(snapshot.records)
  const rows = snapshot.rows.map(row => `<tr><td>${escapeHtml(row.name)}</td><td>${escapeHtml(row.value)} / ${escapeHtml(row.target)}</td><td>${escapeHtml(row.judgmentStatus)}</td><td>${escapeHtml(row.materialStatus)}</td><td>${escapeHtml(row.record.materials.filter(item => item.status !== '已确认').map(item => item.issue || item.name).join('；') || '—')}</td><td>${escapeHtml(row.record.materials.filter(item => item.status === '已确认').map(item => `${item.name}（${item.version}）`).join('；') || '暂无已确认材料')}</td></tr>`).join('')
  const html = `<!doctype html><meta charset="utf-8"><title>零碳验收阶段归集清单</title><style>body{font:14px Microsoft YaHei,sans-serif;padding:32px;color:#193d49}table{border-collapse:collapse;width:100%}th,td{border:1px solid #dbe6e5;padding:10px;text-align:left}th{background:#eef6f4}</style><h1>曲靖零碳园区 · 阶段资料归集清单</h1><p>${snapshot.period} · ${snapshot.resultVersion} · 生成时间：${snapshot.generatedAt}</p><p>本清单保留生成时快照；资料准备不等同于指标达标、认证通过或验收通过。本文件不含真实报告附件。</p><h2>材料目录（已确认材料去重）</h2><ul>${materials.map(item => `<li>${escapeHtml(item.name)} · ${escapeHtml(item.version)} · ${escapeHtml(item.fileName || '示例材料，无真实附件')}</li>`).join('')}</ul><table><tr><th>指标</th><th>当前值 / 目标</th><th>指标判定</th><th>资料准备</th><th>缺口</th><th>已确认材料</th></tr>${rows}</table>`
  try { const url = URL.createObjectURL(new Blob([html], { type:'text/html;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = `${snapshot.year}零碳验收_阶段归集清单.html`; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); return true } catch { return false }
}
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char])) }
