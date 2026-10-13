import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.jsx'
import { StatusTag } from '../components/StatusTag.jsx'
import { archives, carbonAssets, enterprises, enterpriseIndicatorResult, getEnergyCarbonRecord, greenServices, indicators, renewableFacilities, useSharedData } from '../mock/sharedStore.js'

const profileMeta = {
  'ent-001': { type:'重点用能企业', production:'已投产', business:'高效光伏组件及光伏电池片', subpark:'曲靖经开区南海子片区', labels:['重点用能企业','绿色工厂'] },
  'ent-002': { type:'重点用能企业', production:'已投产', business:'高效光伏组件及光伏电池片', subpark:'曲靖经开区南海子片区', labels:['重点用能企业','零碳建设企业'] },
  'ent-003': { type:'重点用能企业', production:'已投产', business:'光伏发电设备及系统集成', subpark:'曲靖经开区南海子片区', labels:['重点用能企业','绿色工厂'] },
}
const defaultMeta = { type:'园区纳管企业', production:'正常运营', business:'园区企业主营业务', subpark:'曲靖经开区', labels:['园区纳管企业'] }
const achievementMap = { 'ent-001':['archive-pv','archive-factory','archive-pcf'], 'ent-002':['archive-pv','archive-diagnosis','archive-factory'], 'ent-003':['archive-pv','archive-saving'] }
const serviceAdvice = { '清洁能源消费占比':'绿电交易服务', '可利用建筑屋顶光伏覆盖率':'屋顶光伏建设服务', '能效诊断覆盖率':'能效诊断服务', '碳足迹认证产品数量':'产品碳足迹服务' }
const asNumber = value => Number.parseFloat(value) || 0
const average = values => values.length ? values.reduce((sum,value) => sum + value, 0) / values.length : 0
const fixed = (value, digits=1) => Number(value || 0).toFixed(digits)

export function EnterpriseProfilePage(){
  const [searchParams] = useSearchParams()
  const [enterpriseId,setEnterpriseId] = useState(searchParams.get('enterpriseId') || 'ent-002')
  const navigate = useNavigate()
  const { tasks, role, services: sharedServices } = useSharedData()
  const enterprise = enterprises.find(item => item.id === enterpriseId)
  const energy = getEnergyCarbonRecord(enterpriseId)
  const meta = profileMeta[enterpriseId] || defaultMeta
  const results = enterpriseIndicatorResult.filter(item => item.enterpriseId === enterpriseId)
  const resultFor = indicatorId => results.find(item => item.indicatorId === indicatorId)
  const achieved = results.filter(item => item.status === '已达标')
  const pending = results.filter(item => item.status !== '已达标')
  const facilities = renewableFacilities.filter(item => item.enterpriseId === enterpriseId)
  const assets = carbonAssets.filter(item => item.enterpriseId === enterpriseId)
  const greenAssets = assets.filter(item => ['greenPower','greenCertificate'].includes(item.assetType))
  const achievementItems = archives.filter(item => (achievementMap[enterpriseId] || []).includes(item.id))
  const services = sharedServices.filter(item => item.enterpriseId === enterpriseId)
  const task = tasks.find(item => item.enterpriseId === enterpriseId)
  const pendingCount = (task?.pendingData || 0) + (task?.pendingVoucher || 0)
  const cleanRate = asNumber(resultFor('ind-clean-energy')?.value || energy?.cleanRate)
  const diagnosisRate = asNumber(resultFor('ind-diagnosis')?.value)
  const roofRate = asNumber(resultFor('ind-roof')?.value)
  const unitCarbon = energy?.energy && energy?.emissions ? Number(energy.emissions) / Number(energy.energy) : 0
  const energyRecords = enterprises.map(item => getEnergyCarbonRecord(item.id)).filter(Boolean)
  const peerClean = average(enterpriseIndicatorResult.filter(item => item.indicatorId === 'ind-clean-energy').map(item => asNumber(item.value)))
  const peerUnitCarbon = average(energyRecords.filter(item => item.energy && item.emissions).map(item => Number(item.emissions) / Number(item.energy)))
  const peerDiagnosis = average(enterpriseIndicatorResult.filter(item => item.indicatorId === 'ind-diagnosis').map(item => asNumber(item.value)))
  const energyAverage = average(energyRecords.map(item => Number(item.energy) || 0))
  const carbonAverage = average(energyRecords.map(item => Number(item.emissions) || 0))
  const factoryCertified = meta.labels.includes('绿色工厂') || achievementItems.some(item => item.domain === '绿色制造成果')
  const pvCapacity = facilities.map(item => `${item.facilityType} ${item.capacity}${item.unit}`).join('、') || '暂无设施登记'
  const stageIndex = pending.length ? 2 : 3
  const developmentStage = ['基础建设','能源优化','建设提升','深度降碳','零碳达标'][stageIndex]
  const state = pending.length ? '建设提升中' : '持续优化'
  const stateTone = pending.length ? 'warn' : 'ok'
  const labels = meta.labels.slice(0, 2)
  const profileConclusion = pending.length ? `已形成绿色制造与零碳建设基础，当前重点补齐${pending.map(item => indicators.find(indicator => indicator.indicatorId === item.indicatorId)?.name).filter(Boolean).join('、')}。` : '零碳建设基础较完整，建议持续优化能效和绿色能源结构。'
  const dimensions = [
    { name:'能源低碳化', raw:`清洁能源消费占比 ${fixed(cleanRate)}%`, target:'目标 ≥90%', progress:Math.min(cleanRate / 90 * 100, 100), status:cleanRate >= 90 ? '已达成' : '接近目标' },
    { name:'碳排控制', raw:`单位能耗碳排 ${unitCarbon ? fixed(unitCarbon,3) : '—'}`, target:'目标 ≤0.300', progress:unitCarbon ? Math.min(.3 / unitCarbon * 100, 100) : 0, status:unitCarbon && unitCarbon <= .3 ? '已达成' : '接近目标' },
    { name:'能效提升', raw:diagnosisRate ? `能效诊断覆盖率 ${fixed(diagnosisRate)}%` : '能效诊断覆盖率待补充', target:'目标 100%', progress:Math.min(diagnosisRate, 100), status:diagnosisRate >= 100 ? '已达成' : '待提升' },
    { name:'绿色制造', raw:factoryCertified ? '绿色工厂已完成目标认证' : '绿色工厂认证待完成', target:'完成目标认证', progress:factoryCertified ? 100 : 0, status:factoryCertified ? '已达成' : '待提升' },
    { name:'零碳建设', raw:roofRate ? `屋顶光伏覆盖率 ${fixed(roofRate)}%` : '屋顶光伏覆盖率待补充', target:'目标 ≥50%', progress:roofRate ? Math.min(roofRate / 50 * 100, 100) : 0, status:roofRate >= 50 ? '已达成' : '待提升' },
  ]
  const energyMetrics = [
    { label:'综合能源消费', current:Number(energy?.energy) || 0, reference:energyAverage, target:null, unit:'万tce', direction:'neutral' },
    { label:'碳排放量', current:Number(energy?.emissions) || 0, reference:carbonAverage, target:null, unit:'万tCO₂e', direction:'neutral' },
    { label:'单位能耗碳排放', current:unitCarbon, reference:peerUnitCarbon, target:.3, unit:'tCO₂e/tce', direction:'low' },
    { label:'清洁能源消费占比', current:cleanRate, reference:peerClean, target:90, unit:'%', direction:'high' },
  ]
  const comparisons = [
    { label:'单位能耗碳排放', current:unitCarbon, reference:peerUnitCarbon, target:.3, unit:'tCO₂e/tce', direction:'low' },
    { label:'清洁能源消费占比', current:cleanRate, reference:peerClean, target:90, unit:'%', direction:'high' },
    { label:'能效诊断覆盖率', current:diagnosisRate, reference:peerDiagnosis, target:100, unit:'%', direction:'high' },
  ]
  const recommendations = pending.map(item => { const name = indicators.find(indicator => indicator.indicatorId === item.indicatorId)?.name || item.indicatorId; return { name, current:item.value, target:indicators.find(indicator => indicator.indicatorId === item.indicatorId)?.target || '目标值', measure:name === '清洁能源消费占比' ? '扩大绿电采购或绿电直供比例' : name === '能效诊断覆盖率' ? '完成重点用能设备和环节能效诊断' : `推进${name}提升`, service: serviceAdvice[name] || '绿色低碳咨询服务' } })
  const go = path => navigate(`${path}${path.includes('?') ? '&' : '?'}enterpriseId=${enterpriseId}`)
  const servicePath = role === 'enterprise' ? '/green-service-center' : '/enterprise-green-services'

  return <div className="content enterprise-profile-page profile-page-v3">
    <PageHeader title={role === 'enterprise' ? '企业能碳画像' : '企业绿色画像'} subtitle="以真实指标、建设成果和服务状态形成企业零碳发展画像。" actions={<select value={enterpriseId} onChange={event => setEnterpriseId(event.target.value)}>{enterprises.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>} />
    <section className="profile-overview-card">
      <div className="profile-identity"><div className="profile-avatar">{enterprise?.name?.slice(0,1)}</div><div><span>企业零碳综合画像 · 2026年度</span><h2>{enterprise?.name || '未找到企业'}</h2><p>{enterprise?.industry || '—'}</p><div className="profile-identity-meta"><span>主要产品</span><b>{meta.business}</b><span>所属园中园</span><b>{meta.subpark}</b></div><div className="profile-tags profile-tags-dark">{labels.map(label => <b key={label}>{label}</b>)}</div></div></div>
      <div className="profile-radar-wrap"><div className="profile-overview-title"><b>企业零碳五维雷达画像</b><span>按目标达成度统一换算</span></div><RadarChart dimensions={dimensions}/></div>
      <div className="profile-conclusion-card"><span className="conclusion-kicker">雷达解读</span><div className="conclusion-stage"><span>当前阶段</span><StatusTag tone={stateTone}>{developmentStage}</StatusTag></div><div className="conclusion-group"><span>主要优势</span><b>绿色制造、零碳建设</b></div><div className="conclusion-group"><span>接近目标</span><b>碳排控制</b></div><div className="conclusion-group priority"><span>优先提升</span><b>能源低碳化、能效提升</b></div><strong>{profileConclusion}</strong></div>
    </section>
    {pendingCount > 0 && <div className="profile-data-reminder"><span>数据待完善</span><b>{pendingCount}项</b><span>补齐后将更新企业画像和零碳评价。</span><button className="op-btn" onClick={() => navigate(`/reporting-task-monitoring?enterpriseId=${enterpriseId}`)}>查看待完善项 →</button></div>}
    <SectionTitle title="核心能碳表现" description="企业当前值、园区参考值与建设目标的直观对比。" action={<button className="btn small" onClick={() => go('/energy-carbon-monitoring')}>进入能碳监测 →</button>} />
    <div className="profile-benchmark-grid">{energyMetrics.map(item => <MetricBenchmark key={item.label} {...item} />)}</div>
    <SectionTitle title="零碳发展阶段" description="阶段判断与优势、短板直接关联，避免只呈现结论。" />
    <section className="development-visual card"><div className="stage-track">{['基础建设','能源优化','建设提升','深度降碳','零碳达标'].map((item,index) => <div className={index <= stageIndex ? 'active' : ''} key={item}><i>{index < stageIndex ? '✓' : index + 1}</i><span>{item}</span>{index === stageIndex && <b>当前</b>}</div>)}</div><div className="stage-explain"><span>当前阶段</span><strong>{developmentStage}</strong><p>{pending.length ? '已具备绿色能源与制造基础，需针对关键短板推进专项服务。' : '已进入持续降碳优化阶段，可巩固优势并形成可复制成果。'}</p></div></section>
    <div className="diagnostic-lists"><InsightList title="已形成优势" tone="ok" items={[{ name:'可利用建筑屋顶光伏覆盖率', value:`${fixed(roofRate)}%` }, ...(facilities.length ? [{ name:'已建分布式光伏', value:pvCapacity }] : []), ...(factoryCertified ? [{ name:'绿色工厂认证', value:'已认证' }] : [])]} empty="暂无已确认优势指标。" /><InsightList title="当前主要短板" tone="warn" items={pending.map(item => ({ name:indicators.find(indicator => indicator.indicatorId === item.indicatorId)?.name || item.indicatorId, value:`${item.value}，目标 ${indicators.find(indicator => indicator.indicatorId === item.indicatorId)?.target || '—'}` }))} empty="当前关联指标均已达成。" /></div>
    <SectionTitle title="园区同行对标" description="仅比较当前可用的关键指标；参考值为园区已入库企业平均水平。" />
    <section className="comparison-card card">{comparisons.map(item => <ComparisonRow key={item.label} {...item} />)}</section>
    <SectionTitle title="绿色低碳建设成果" description="以实际已形成的设施、认证、产品和绿色权益呈现企业能力特征。" action={<button className="op-btn" onClick={() => go('/zero-carbon-results')}>查看验收支撑 →</button>} />
    <div className="outcome-matrix"><Outcome title="绿色能源设施" icon="☀" value={pvCapacity} status={facilities.length ? '已形成' : '待补充'} tone={facilities.length ? 'ok' : 'gray'} /><Outcome title="绿色制造" icon="◆" value={factoryCertified ? '绿色工厂' : '暂无绿色工厂认证'} status={factoryCertified ? '已认证' : '待建设'} tone={factoryCertified ? 'ok' : 'warn'} /><Outcome title="绿色产品" icon="◇" value={achievementItems.find(item => item.id === 'archive-pcf')?.name || '暂无碳足迹认证产品'} status={achievementItems.some(item => item.id === 'archive-pcf') ? '已形成' : '待完善'} tone={achievementItems.some(item => item.id === 'archive-pcf') ? 'ok' : 'warn'} /><Outcome title="绿色权益" icon="↗" value={greenAssets.length ? [...new Set(greenAssets.map(item => item.assetType === 'greenPower' ? '绿电' : '绿证'))].join('、') : '暂无绿电、绿证记录'} status={greenAssets.length ? '已登记' : '待补充'} tone={greenAssets.length ? 'ok' : 'gray'} /></div>
    <SectionTitle title="企业零碳提升路径" description="由画像诊断直接生成可执行的提升动作与推荐服务。" action={services.length ? <span className="service-progress">服务推进：{services.map(item => `${item.serviceType}·${item.stage}`).join('；')}</span> : null} />
    <section className="improvement-path card">{recommendations.length ? recommendations.map((item,index) => <article key={item.name}><span className="path-order">优先级{String(index + 1).padStart(2,'0')}</span><div className="action-flow"><div className="action-step issue"><small>问题</small><b>{item.name} {item.current}，目标 {item.target}</b></div><i>→</i><div className="action-step measure"><small>提升措施</small><b>{item.measure}</b></div><i>→</i><div className="action-step service"><small>推荐服务</small><b>{item.service}</b></div></div><button className="op-btn" onClick={() => go(servicePath)}>查看服务</button></article>) : <p className="side-empty">当前无待提升项，可持续跟踪数据与建设成果。</p>}</section>
  </div>
}

function SectionTitle({ title, description, action }) { return <div className="profile-section-heading profile-section-heading-v3"><div><h3>{title}</h3><p>{description}</p></div>{action}</div> }
function RadarChart({ dimensions }) {
  const [hovered, setHovered] = useState(null)
  const size = 340, center = size / 2, radius = 106
  const point = (index, value=1) => { const angle = -Math.PI / 2 + index * Math.PI * 2 / dimensions.length; return [center + Math.cos(angle) * radius * value, center + Math.sin(angle) * radius * value] }
  const polygon = value => dimensions.map((_,index) => point(index,value).join(',')).join(' ')
  const outline = dimensions.map((item,index) => point(index,item.progress / 100).join(',')).join(' ')
  return <div className="radar-chart" onMouseLeave={() => setHovered(null)}>
    <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="企业零碳五维目标达成度雷达图">
      {[.25,.5,.75,1].map(level => <polygon className={level === 1 ? 'radar-goal-boundary' : 'radar-grid'} key={level} points={polygon(level)} />)}
      {dimensions.map((item,index) => { const [x,y] = point(index); return <line className="radar-axis" key={item.name} x1={center} y1={center} x2={x} y2={y} /> })}
      <polygon className="radar-area" points={outline} />
      <polyline className="radar-outline" points={`${outline} ${point(0,dimensions[0].progress / 100).join(',')}`} />
      {dimensions.map((item,index) => { const [x,y] = point(index,item.progress / 100); return <circle className="radar-point" key={item.name} cx={x} cy={y} r="5" onMouseEnter={() => setHovered(item)} /> })}
    </svg>
    <div className="radar-labels">{dimensions.map((item,index) => { const [x,y] = point(index,1.28); return <button key={item.name} className={`radar-label label-${index}`} style={{left:`${x / size * 100}%`,top:`${y / size * 100}%`}} onMouseEnter={() => setHovered(item)} onFocus={() => setHovered(item)}><b>{item.name}</b><span>{fixed(item.progress)}%</span></button> })}</div>
    <div className="radar-center"><b>目标达成度</b><span>0–100%</span></div>
    {hovered && <div className="radar-tooltip"><b>{hovered.name}</b><span>{hovered.raw}</span><span>{hovered.target}</span><StatusTag tone={hovered.status === '已达成' ? 'ok' : 'warn'}>{hovered.status}</StatusTag></div>}
  </div>
}
function MetricBenchmark({ label, current, reference, target, unit, direction }) { const max=Math.max(current,reference,target || 0,1) * 1.18; const position=value => `${Math.min(96, Math.max(3, value / max * 100))}%`; const digits=unit.includes('tCO') ? 3 : 1; const currentValue=fixed(current,digits); const gap=target === null ? null : Math.abs(current-target); const note=gap === null ? '当前运行数据' : direction === 'low' ? (current <= target ? '已达到建设目标' : `高于目标 ${fixed(gap,digits)}${unit}`) : (current >= target ? '已达到建设目标' : `低于目标 ${fixed(gap,digits)}${unit}`); return <section className="metric-benchmark card"><span>{label}</span><strong>{currentValue}<em>{unit}</em></strong><div className="benchmark-scale"><i className="current" style={{left:position(current)}} /><i className="reference" style={{left:position(reference)}} />{target !== null && <i className="target" style={{left:position(target)}} />}</div><div className="benchmark-labels"><b>企业 {currentValue}{unit}</b><span>园区均值 {fixed(reference,digits)}{unit}</span>{target !== null && <span>{direction === 'low' ? '目标 ≤' : '目标 '}{fixed(target,digits)}{unit}</span>}</div><small className={gap && ((direction === 'low' && current > target) || (direction === 'high' && current < target)) ? 'benchmark-note warn' : 'benchmark-note'}>{note}</small></section> }
function InsightList({ title, tone, items, empty }) { return <section className={`insight-list ${tone}`}><div><b>{title}</b></div>{items.length ? items.map(item => <p key={item.name}><i>{tone === 'ok' ? '✓' : '△'}</i><span>{item.name}</span><strong>{item.value}</strong></p>) : <small>{empty}</small>}</section> }
function ComparisonRow({ label, current, reference, target, unit, direction }) { const max=Math.max(current,reference,target,1) * 1.12; const width=value => `${Math.max(3, value / max * 100)}%`; const digits=unit.includes('tCO') ? 3 : 1; return <div className="comparison-row"><div><b>{label}</b><span>{direction === 'low' ? '数值越低越优' : '数值越高越优'}</span></div><div className="comparison-bars"><p><span>本企业</span><i className="self" style={{width:width(current)}} /><b>{fixed(current,digits)}{unit}</b></p><p><span>同类均值</span><i className="peer" style={{width:width(reference)}} /><b>{fixed(reference,digits)}{unit}</b></p><p><span>{direction === 'low' ? '建设目标上限' : '建设目标'}</span><i className="goal" style={{width:width(target)}} /><b>{fixed(target,digits)}{unit}</b></p></div></div> }
function Outcome({ title, icon, value, status, tone }) { return <section className={`outcome-card ${tone}`}><i>{icon}</i><div><span>{title}</span><b>{value}</b><StatusTag tone={tone === 'ok' ? 'ok' : tone === 'gray' ? 'gray' : 'warn'}>{status}</StatusTag></div></section> }
