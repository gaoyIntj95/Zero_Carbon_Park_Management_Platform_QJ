import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.jsx'
import { Modal } from '../components/Modal.jsx'
import { StatusTag } from '../components/StatusTag.jsx'
import { useSharedData, enterpriseEfficiencyBenchmarkResults, enterprises } from '../mock/sharedStore.js'
import { enterpriseEnergyCarbonSeed, enterpriseEnergyCarbonStorageKey } from './data-management/EnterpriseEnergyCarbonPage.jsx'
import '../enterprise-energy-overview.css'

// 概览演示月度结果：折标量、趋势和累计预算共用这一组数值；原始报送记录从能碳数据页读取。
const months = [
  { energy:286, carbon:16920, electricity:1102000, outputValue:16900, structure:[135.3,108.1,42.6] },
  { energy:268, carbon:16450, electricity:1068000, outputValue:16420, structure:[126.8,101.3,39.9] },
  { energy:301, carbon:17380, electricity:1169000, outputValue:17260, structure:[142.4,113.8,44.8] },
  { energy:310, carbon:17620, electricity:1198000, outputValue:17650, structure:[146.6,117.2,46.2] },
  { energy:306, carbon:17480, electricity:1181000, outputValue:17380, structure:[144.8,115.7,45.5] },
  { energy:319, carbon:18050, electricity:1219000, outputValue:18120, structure:[150.9,120.6,47.5] },
  { energy:335, carbon:18710, electricity:1276000, outputValue:18700, structure:[158.5,126.6,49.9] },
  { energy:322, carbon:18190, electricity:1196000, outputValue:18340, structure:[152.3,121.7,48] },
  { energy:326.8, carbon:18846, electricity:1258600, outputValue:18620, structure:[154.6,123.5,48.7] },
]
const energyTypes = [ ['电力','#159f8a'], ['天然气','#358ff1'], ['热力','#ffba49'] ]
const format = (value, decimals) => value == null ? '暂无数据' : Number(value).toLocaleString('zh-CN', { maximumFractionDigits:decimals ?? 1, minimumFractionDigits:decimals ?? 0 })
const percent = value => `${format(value,1)}%`
const readRows = enterpriseId => {
  try { const saved = JSON.parse(localStorage.getItem(enterpriseEnergyCarbonStorageKey(enterpriseId))); return Array.isArray(saved) ? saved : enterpriseEnergyCarbonSeed }
  catch { return enterpriseEnergyCarbonSeed }
}
const validPlatformUrl = enterprise => {
  if (!enterprise?.energyCarbonPlatformEnabled || !enterprise.energyCarbonPlatformUrl) return false
  try { const url = new URL(enterprise.energyCarbonPlatformUrl); return ['http:','https:'].includes(url.protocol) && !!url.hostname }
  catch { return false }
}

function TrendChart({ values, month, unit, label }) {
  const [hovered, setHovered] = useState(null)
  const width = 760, height = 220, left = 48, right = 20, top = 24, bottom = 36
  const max = Math.ceil(Math.max(...values, 1) * 1.18 / 100) * 100
  const x = index => left + (width-left-right) * (values.length === 1 ? .5 : index/(values.length-1))
  const y = value => top + (height-top-bottom) * (1-value/max)
  const line = values.map((value,index) => `${x(index)},${y(value)}`).join(' ')
  const area = `${left},${height-bottom} ${line} ${x(values.length-1)},${height-bottom}`
  return <div className="eeo-trend-chart">
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${label}趋势，单位${unit}`}>
      {[0,1,2,3,4].map(index => { const tick = max * (4-index)/4, pos = y(tick); return <g key={index}><line x1={left} x2={width-right} y1={pos} y2={pos} stroke="#e9eef0"/><text x={left-10} y={pos+4} textAnchor="end">{format(tick,0)}</text></g> })}
      <polygon points={area} fill="#d8f0eb" opacity=".75" />
      <polyline points={line} fill="none" stroke="#079a82" strokeWidth="2.6" strokeLinejoin="round" />
      {values.map((value,index) => <g key={index} onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(index)} onBlur={() => setHovered(null)} tabIndex="0" aria-label={`${index+1}月 ${format(value)} ${unit}`}>
        <circle cx={x(index)} cy={y(value)} r="9" fill="transparent" />
        <circle cx={x(index)} cy={y(value)} r={hovered === index ? 6 : 4} fill="#079a82" stroke="white" strokeWidth="2" />
        <text x={x(index)} y={height-10} textAnchor="middle">{index+1}月</text>
      </g>)}
    </svg>
    {hovered != null && <div className="eeo-tooltip" style={{ left:`${Math.min(88,Math.max(6,x(hovered)/width*100))}%` }}>{month.slice(0,4)}年{hovered+1}月　{format(values[hovered])} {unit}</div>}
  </div>
}

export function EnterpriseEnergyOverviewPage() {
  const navigate = useNavigate()
  const { currentEnterpriseId } = useSharedData()
  const [month, setMonth] = useState(9)
  const [trend, setTrend] = useState('energy')
  const [detail, setDetail] = useState(null)
  const rows = useMemo(() => readRows(currentEnterpriseId), [currentEnterpriseId])
  const period = `2026-${String(month).padStart(2,'0')}`
  const current = months[month-1]
  const previous = months[month-2]
  const scoped = rows.filter(row => row.period === period && row.boundary === '企业边界')
  const verify = scoped.filter(row => row.quality === '来源差异' || row.quality === '待核实' || row.report === '待企业核实' || row.report === '已退回')
  const missing = scoped.filter(row => row.value == null)
  const issueIds = new Set([...verify,...missing].map(row => row.id))
  const electricityRecord = scoped.find(row => row.id === 'elec-input' || row.id === 'elec-aug')
  const carbonRecord = scoped.find(row => row.id === 'carbon-total')
  const valueRecord = scoped.find(row => row.id === 'industrial-value')
  const electricity = electricityRecord?.value ?? current?.electricity
  const carbon = carbonRecord?.value ?? current?.carbon
  const denominator = valueRecord?.value ?? (month === 9 ? null : current?.outputValue)
  const energyAffected = scoped.some(row => issueIds.has(row.id) && row.category === '能源数据')
  const carbonAffected = energyAffected || scoped.some(row => issueIds.has(row.id) && row.category === '碳排放数据')
  const intensity = current && denominator > 0 ? current.energy / denominator : null
  const benchmark = enterpriseEfficiencyBenchmarkResults.filter(row => row.enterpriseId === currentEnterpriseId && row.period <= period && row.actualValue != null).sort((a,b) => b.period.localeCompare(a.period))[0]
  const energyCumulative = current ? months.slice(0,month).reduce((sum,row) => sum+row.energy,0) : null
  const carbonCumulative = current ? months.slice(0,month).reduce((sum,row) => sum+row.carbon,0) : null
  const energyBudget = current ? 2850/9*month : null
  const carbonBudget = current ? 178000/9*month : null
  const enterprise = enterprises.find(item => item.id === currentEnterpriseId)
  const sourceNames = [...new Set(scoped.map(row => row.source))]
  const latestUpdate = scoped.flatMap(row => row.history || []).map(item => item.time).sort().at(-1) || (scoped.length ? '2026-10-14 09:30' : '暂无记录')
  const goData = () => navigate('/enterprise-energy-carbon')
  const mom = (value, before) => value != null && before != null ? `${value >= before ? '上升' : '下降'} ${percent(Math.abs(value-before)/before*100)}` : '暂无环比'
  const metrics = [
    { icon:'ϟ', title:'电力消费量', value:electricity, unit:'kWh', sub:`环比 ${mom(electricity,previous?.electricity)}`, provisional:issueIds.has(electricityRecord?.id) },
    { icon:'▤', title:'综合能耗', value:current?.energy, unit:'tce', sub:`环比 ${mom(current?.energy,previous?.energy)}`, provisional:energyAffected },
    { icon:'◒', title:'碳排放量', value:carbon, unit:'tCO₂e', sub:'报告期核算 · 与预算采用相同口径', provisional:carbonAffected, badge:'报告期核算' },
    { icon:'▥', title:'单位产值能耗', value:intensity, unit:'tce/万元', sub:denominator > 0 ? '产值口径：工业增加值' : '工业增加值缺失，暂无数据', provisional:energyAffected || valueRecord && issueIds.has(valueRecord.id) },
  ]
  const segments = current?.structure || []
  const total = current?.energy || 0
  let offset = 0
  const gradient = segments.map((value,index) => { const start=offset; offset+=value/total*100; return `${energyTypes[index][1]} ${start}% ${offset}%` }).join(',')
  const trendValues = months.slice(0,Math.min(month,9)).map(row => trend === 'energy' ? row.energy : row.carbon)
  const trendUnit = trend === 'energy' ? 'tce' : 'tCO₂e'
  const budgetRows = [ ['综合能耗',energyCumulative,energyBudget,'tce'], ['碳排放',carbonCumulative,carbonBudget,'tCO₂e'] ]
  return <div className="content eeo-page">
    <PageHeader title="能碳概览" subtitle="查看企业边界能碳结果，核实园区报送所需数据" actions={<><label className="eeo-month">月份 <select aria-label="月份" value={month} onChange={event => setMonth(Number(event.target.value))}>{Array.from({length:10},(_,index) => <option key={index+1} value={index+1}>2026年{String(index+1).padStart(2,'0')}月</option>)}</select></label><button className="btn eeo-outline" onClick={goData}>查看能碳数据 →</button></>}/>
    {!!(verify.length || missing.length) && <div className="eeo-alert"><span className="eeo-alert-icon">!</span><span>本期有{verify.length}项数据待核实、{missing.length}项数据待补充，受影响指标为暂定结果。</span><button onClick={goData}>去核实 →</button></div>}
    <div className="eeo-metrics">{metrics.map((metric,index) => <section className="eeo-metric" key={metric.title}><span className={`eeo-metric-icon tone-${index}`}>{metric.icon}</span><div><div className="eeo-metric-title">{metric.title}{metric.badge && <small className="eeo-badge">{metric.badge}</small>}</div><strong>{metric.value == null ? '暂无数据' : format(metric.value,index===3 ? 4 : index===1 ? 1 : 0)}{metric.value != null && <small>{metric.unit}</small>}</strong><p>{metric.sub}</p>{metric.provisional && metric.value != null && <span className="eeo-provisional">暂定结果</span>}</div></section>)}</div>
    <div className="eeo-chart-grid">
      <section className="eeo-card eeo-structure"><header><h2>能源消费结构</h2><p>按各能源折标量占综合能耗比例</p></header>{current ? <div className="eeo-structure-body"><div className="eeo-donut" style={{background:`conic-gradient(${gradient})`}}><div><strong>{format(total,1)}</strong><small>tce</small></div></div><div className="eeo-legend">{segments.map((value,index) => <div key={index}><span style={{background:energyTypes[index][1]}}/>{energyTypes[index][0]}<b>{percent(value/total*100)}</b></div>)}</div></div> : <div className="eeo-empty">本月暂无关联的折标结果</div>}</section>
      <section className="eeo-card eeo-trend"><header><div><h2>能耗与碳排放趋势</h2><p>{trend === 'energy' ? '综合能耗' : '碳排放'}（{trendUnit}）· 2026年1月至{Math.min(month,months.length)}月{month > months.length ? '，所选月暂无结果' : ''}</p></div><div className="eeo-switch"><button className={trend === 'energy' ? 'active' : ''} onClick={() => setTrend('energy')}>综合能耗</button><button className={trend === 'carbon' ? 'active' : ''} onClick={() => setTrend('carbon')}>碳排放</button></div></header>{trendValues.length ? <TrendChart key={trend} values={trendValues} month={period} unit={trendUnit} label={trend === 'energy' ? '综合能耗' : '碳排放'}/> : <div className="eeo-empty">本年度暂无关联趋势数据</div>}<p className="eeo-note">综合能耗按已关联能源记录折标；碳排放使用报告期核算结果，分别展示对应单位。</p></section>
    </div>
    <div className="eeo-bottom-grid">
      <section className="eeo-card eeo-product"><header><h2>主要产品能耗达标</h2>{benchmark && <button className="eeo-link" onClick={() => setDetail({type:'product',data:benchmark})}>查看结果 →</button>}</header>{benchmark ? <div className="eeo-product-table"><div className="eeo-product-head"><span>产品 / 指标</span><span>实际值</span><span>状态</span></div><div className="eeo-product-row"><span><b>{benchmark.objectName}</b><small>{benchmark.indicatorName} · {benchmark.period}</small></span><b>{format(benchmark.actualValue,3)} {benchmark.unit}</b><StatusTag tone={benchmark.result === 'not_compliant' ? 'warn' : 'ok'}>{benchmark.result === 'not_compliant' ? '未达标' : '达标'}</StatusTag></div></div> : <div className="eeo-empty">暂无关联的产品能耗对标结果</div>}<p className="eeo-note">仅引用已有对标结果，本页不维护适用标准或判断规则。</p></section>
      <section className="eeo-card eeo-budget"><header><div><h2>能碳预算执行</h2><p>截至{month}月：累计实际 / 同期预算</p></div>{current && <button className="eeo-link" onClick={() => setDetail({type:'budget'})}>查看预算 →</button>}</header>{current ? budgetRows.map(([name,actual,budget,unit]) => <div className="eeo-budget-row" key={name}><b>{name}</b><div className="eeo-budget-track"><i style={{width:`${Math.min(actual/budget*100,100)}%`}}/></div><strong>{percent(actual/budget*100)}</strong><small>累计实际 {format(actual,1)} {unit}　/　同期预算 {format(budget,1)} {unit}</small></div>) : <div className="eeo-empty">暂无关联的同期预算结果</div>}<p className="eeo-note">比值仅表示累计实际与同期预算，不表示年度时间进度。</p></section>
      <section className="eeo-card eeo-sources"><header><h2>数据来源与状态</h2></header>{sourceNames.length ? <div className="eeo-source-list">{sourceNames.slice(0,4).map(name => { const records = scoped.filter(row => row.source === name), sourceStatus = records.some(row => row.value == null) ? '待补充' : records.some(row => issueIds.has(row.id)) ? '待核实' : '已关联'; return <div key={name}><span>▧　{name}</span><StatusTag tone={sourceStatus === '已关联' ? 'ok' : 'warn'}>{sourceStatus}</StatusTag></div> })}</div> : <div className="eeo-empty">{current ? '本月为概览演示数据，暂无关联的来源记录' : '本月暂无关联的来源记录'}</div>}<dl><div><dt>统计边界</dt><dd>企业边界</dd></div><div><dt>数据期间</dt><dd>{period}</dd></div><div><dt>最近更新</dt><dd>{latestUpdate}</dd></div></dl><button className="eeo-link eeo-source-link" onClick={goData}>查看来源记录 →</button></section>
    </div>
    {validPlatformUrl(enterprise) && <div className="eeo-platform"><span>精细化能碳管理由企业级平台承接。</span><a href={enterprise.energyCarbonPlatformUrl} target="_blank" rel="noreferrer">进入企业能碳平台 ↗</a></div>}
    <Modal open={!!detail} title={detail?.type === 'product' ? '产品能耗对标结果' : '能碳预算关联结果'} onClose={() => setDetail(null)} className="small"><div className="modal-body eeo-detail">{detail?.type === 'product' ? <dl>{[['产品',detail.data.objectName],['指标',detail.data.indicatorName],['实际值',`${format(detail.data.actualValue,3)} ${detail.data.unit}`],['达标状态',detail.data.result === 'not_compliant' ? '未达标' : '达标'],['适用标准',detail.data.standardName],['标准版本',detail.data.standardVersion],['来源依据',`园区企业能效管理关联结果 · ${detail.data.period}`]].map(([key,value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl> : <><p>2026年1—{month}月累计实际与同期预算，企业边界；碳排放采用报告期核算口径。</p><dl>{budgetRows.map(([name,actual,budget,unit]) => <div key={name}><dt>{name}</dt><dd>{format(actual,1)} / {format(budget,1)} {unit}（{percent(actual/budget*100)}）</dd></div>)}</dl></>}</div><div className="modal-foot"><button className="btn primary" onClick={() => setDetail(null)}>关闭</button></div></Modal>
  </div>
}
