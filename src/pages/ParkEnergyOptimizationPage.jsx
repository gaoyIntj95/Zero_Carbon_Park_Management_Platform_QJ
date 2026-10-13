import { useMemo, useState } from 'react'
import { Modal } from '../components/Modal.jsx'

const energySeries = {
  电力: { unit:'万kWh', monthlyInput:[4400,4900,5200,6500,7900,6500,6700,7900,10000], monthlyUse:[4120,4630,4960,6210,7520,6200,6390,7570,9680], dailyInput:[300,320,350,340,370,380,390], dailyUse:[288,305,336,328,358,367,376] },
  天然气: { unit:'万Nm³', monthlyInput:[92,96,101,108,114,110,117,123,128], monthlyUse:[86,90,95,101,108,104,111,117,121], dailyInput:[3.8,4.1,4.3,4.0,4.5,4.4,4.2], dailyUse:[3.55,3.85,4.0,3.8,4.23,4.16,3.96] },
  热力: { unit:'万GJ', monthlyInput:[215,230,242,250,268,261,274,282,296], monthlyUse:[205,219,231,238,255,249,260,269,283], dailyInput:[9.2,9.5,10.1,9.8,10.4,10.2,10.6], dailyUse:[8.8,9.0,9.6,9.3,9.9,9.7,10.1] },
}
const cleanData = {
  '2026-09': { generation:[650,580,610,760,480,580,650], local:[600,540,565,700,445,535,597], conversionInput:10000, conversionOutput:8920, peakLoad:18.6, wasteAvailable:20000, wasteUsed:13500, wasteAreas:[{name:'公共供热网络', available:12500, demand:10800},{name:'邻近产业片区', available:7500, demand:8000}] },
  '2026-08': { generation:[600,550,590,730,500,570,630], local:[550,505,540,665,458,522,587], conversionInput:10000, conversionOutput:8860, peakLoad:17.9, wasteAvailable:19000, wasteUsed:12502, wasteAreas:[{name:'公共供热网络', available:12000, demand:10200},{name:'邻近产业片区', available:7000, demand:7400}] },
}
const objects = [{value:'park',label:'园区公共供能设施',factor:1},{value:'interface-a',label:'公共供能接口 A',factor:.62},{value:'interface-b',label:'公共供能接口 B',factor:.38}]
const suggestions = [
  { direction:'设施利用', target:'集中供热站', basis:'供热转换效率低于示例参考值 90%', action:'核实低负荷运行与保温情况，评估运行参数和设施改造方案', condition:'需运营单位确认同期间投入、产出与运行边界', status:'待核实', tone:'orange', source:'公共供热设施进出能计量与运行记录', method:'同一供热环节有用热输出 ÷ 能源投入', caveat:'90% 为示例参考值，需核实适用性；不构成自动调度或确定性节能收益承诺。' },
  { direction:'清洁能源消纳', target:'园区光伏及公共负荷', basis:'局部时段发电量高于就地消纳量', action:'核实公共负荷用能时段，评估园区层面的用能匹配与储能建设', condition:'需取得同期间分时发电及公共负荷数据', status:'待补充', tone:'orange', source:'光伏发电计量、就地消纳计量及公共负荷曲线', method:'就地消纳率 = 同期间就地消纳量 ÷ 光伏发电量', caveat:'建议仅用于园区协调与建设参考，不涉及企业设备控制。' },
  { direction:'余能回收', target:'余热设施及接收片区', basis:'实际利用量低于可回收量，片区需求存在时段差异', action:'核对热源温度、供热时段与接收端需求，评估热网衔接', condition:'需确认温度、距离、接收能力和同期间需求', status:'待评估', tone:'blue', source:'余热回收设施运行记录与接收片区需求测算', method:'余热利用率 = 已利用余热量 ÷ 可回收余热量', caveat:'可供量与需求量的差额不直接等于实际可利用量或能源损失。' },
]
const sum = values => values.reduce((total, value) => total + value, 0)
const percent = (numerator, denominator) => denominator ? (numerator / denominator * 100).toFixed(1) : '待计算'
const niceMax = value => { const step = value >= 1000 ? 2000 : value >= 100 ? 50 : value >= 10 ? 20 : 2; return Math.ceil(value * 1.12 / step) * step }
const csvCell = value => `"${String(value).replaceAll('"','""')}"`

function Sparkline({ tone, values }) {
  const max = Math.max(...values), min = Math.min(...values), span = max - min || 1
  const points = values.map((value,index)=>`${index*15},${36-(value-min)/span*27}`).join(' ')
  return <svg viewBox="0 0 120 45" aria-hidden="true"><polyline points={points} fill="none" stroke={tone} strokeWidth="1.6"/><polyline points={`0,44 ${points} 120,44`} fill={tone} opacity=".07"/></svg>
}

function RateCard({ icon, tone, title, value, scope, basis, values }) {
  return <div className="park-opt-rate-card" style={{'--card-tone':tone}}>
    <div className="park-opt-icon">{icon}</div><div className="park-opt-rate-copy"><div>{title} <button className="park-opt-info" title={basis} aria-label={`${title}统计口径：${basis}`}>ⓘ</button></div><strong>{value}</strong><small>{scope}</small></div><Sparkline tone={tone} values={values}/>
  </div>
}

function LineChart({ labels, input, use, unit }) {
  const left=55,right=705,top=18,bottom=173,max=niceMax(Math.max(...input,...use))
  const x=index=>left+index*(right-left)/(labels.length-1), y=value=>bottom-value/max*(bottom-top)
  const points=values=>values.map((value,index)=>`${x(index)},${y(value)}`).join(' ')
  return <div className="park-opt-line-chart"><span className="park-opt-chart-unit">{unit}</span><svg viewBox="0 0 740 213" role="img" aria-label={`${unit}输入与消费趋势`}>
    {[0,1,2,3,4].map(step=><g key={step}><line className="grid" x1={left} x2={right} y1={y(step*max/4)} y2={y(step*max/4)}/><text x={left-10} y={y(step*max/4)+4} textAnchor="end">{(step*max/4).toLocaleString()}</text></g>)}
    {labels.map((label,index)=><g key={label}><line className="grid vertical" x1={x(index)} x2={x(index)} y1={top} y2={bottom}/><text x={x(index)} y="198" textAnchor="middle">{label}</text></g>)}
    <polyline className="series input" points={points(input)}/><polyline className="series use" points={points(use)}/>
    {input.map((value,index)=><circle key={index} className="point input" cx={x(index)} cy={y(value)} r="3.8"/>)}
    {use.map((value,index)=><circle key={index} className="point use" cx={x(index)} cy={y(value)} r="3.8"/>)}
  </svg></div>
}

function CleanChart({ data, month }) {
  const {generation,local}=data, labels=Array.from({length:7},(_,index)=>`${Number(month)}月${index+1}日`)
  const left=48,right=635,top=17,bottom=143,max=1000
  const x=index=>left+32+index*(right-left-64)/6, y=value=>bottom-value/max*(bottom-top)
  const rate=value=>bottom-value/100*(bottom-top)
  const points=local.map((value,index)=>`${x(index)},${rate(value/generation[index]*100)}`).join(' ')
  return <div className="park-opt-clean-chart"><span className="park-opt-chart-unit">万kWh</span><svg viewBox="0 0 720 185" role="img" aria-label="光伏发电量、就地消纳量与每日消纳率">
    {[0,200,400,600,800,1000].map(value=><g key={value}><line className="grid" x1={left} x2={right} y1={y(value)} y2={y(value)}/><text x={left-8} y={y(value)+4} textAnchor="end">{value.toLocaleString()}</text><text x={right+10} y={y(value)+4}>{value/10}%</text></g>)}
    {generation.map((value,index)=><g key={index}><rect className="bar generation" x={x(index)-20} y={y(value)} width="17" height={bottom-y(value)}/><rect className="bar local" x={x(index)+3} y={y(local[index])} width="17" height={bottom-y(local[index])}/><text x={x(index)} y="166" textAnchor="middle">{labels[index]}</text></g>)}
    <polyline className="rate-line" points={points}/>{local.map((value,index)=><circle key={index} className="rate-point" cx={x(index)} cy={rate(value/generation[index]*100)} r="3"/>)}
  </svg></div>
}

function WasteChart({ areas }) {
  const left=135,right=626,top=26,bottom=141,max=14000
  const width=value=>value/max*(right-left)
  return <div className="park-opt-waste-chart"><svg viewBox="0 0 700 177" role="img" aria-label="两个片区的余热可供量与接收端需求对比">
    {[0,2000,4000,6000,8000,10000,12000,14000].map(value=><g key={value}><line className="grid vertical" x1={left+width(value)} x2={left+width(value)} y1={top} y2={bottom}/><text x={left+width(value)} y="160" textAnchor="middle">{value.toLocaleString()}</text></g>)}
    {areas.map((area,index)=>{const y=48+index*58;return <g key={area.name}><text className="area-name" x={left-9} y={y+16} textAnchor="end">{area.name}</text><rect className="bar available" x={left} y={y} width={width(area.available)} height="13" rx="2"/><rect className="bar demand" x={left} y={y+20} width={width(area.demand)} height="13" rx="2"/><text x={left+width(area.available)+5} y={y+11}>{area.available.toLocaleString()}</text><text x={left+width(area.demand)+5} y={y+31}>{area.demand.toLocaleString()}</text></g>})}
  </svg></div>
}

export function ParkEnergyOptimizationPage() {
  const [draft,setDraft]=useState({period:'2026-09',energy:'电力',object:'park'})
  const [filters,setFilters]=useState(draft)
  const [trendMode,setTrendMode]=useState('monthly')
  const [basis,setBasis]=useState(null)
  const data=cleanData[filters.period], series=energySeries[filters.energy], object=objects.find(item=>item.value===filters.object)
  const month=Number(filters.period.slice(-2)), monthlyInput=series.monthlyInput.slice(0,month), monthlyUse=series.monthlyUse.slice(0,month)
  const dailyInputFactor=monthlyInput.at(-1)/series.monthlyInput.at(-1), dailyUseFactor=monthlyUse.at(-1)/series.monthlyUse.at(-1)
  const trendInput=(trendMode==='monthly'?monthlyInput:series.dailyInput.map(value=>value*dailyInputFactor)).map(value=>Number((value*object.factor).toFixed(1)))
  const trendUse=(trendMode==='monthly'?monthlyUse:series.dailyUse.map(value=>value*dailyUseFactor)).map(value=>Number((value*object.factor).toFixed(1)))
  const trendLabels=trendMode==='monthly'?monthlyInput.map((_,index)=>`${index+1}月`):series.dailyInput.map((_,index)=>`${month}月${index+1}日`)
  const match=percent(monthlyUse.at(-1),monthlyInput.at(-1)), conversion=percent(data.conversionOutput,data.conversionInput)
  const clean=percent(sum(data.local),sum(data.generation)), waste=percent(data.wasteUsed,data.wasteAvailable)
  const changeDraft=(key,value)=>setDraft(current=>({...current,[key]:value}))
  const exportData=()=>{
    const rows=[['园区能源优化','2026年'+month+'月','示例数据'],['分析对象',object.label],['能源品种',filters.energy],['趋势口径',trendMode==='monthly'?'月度':'日度'],['期间','输入量','消费量','单位'],...trendLabels.map((label,index)=>[label,trendInput[index],trendUse[index],series.unit]),[],['清洁能源日期','发电量','就地消纳量','消纳率'],...data.generation.map((value,index)=>[`${month}月${index+1}日`,value,data.local[index],percent(data.local[index],value)+'%']),[],['余热片区','余热可供量','接收端需求','单位'],...data.wasteAreas.map(area=>[area.name,area.available,area.demand,'GJ'])]
    const csv='\ufeff'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n')
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}))
    const link=document.createElement('a');link.href=url;link.download=`园区能源优化-${filters.period}.csv`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)
  }
  return <div className="park-opt-page">
    <div className="park-opt-head"><div><h1>园区能源优化</h1><span>供用匹配 · 设施效率 · 清洁能源利用 · 优化参考</span></div><em>示例数据</em></div>
    <div className="park-opt-filters">
      <label>统计期间<select value={draft.period} onChange={event=>changeDraft('period',event.target.value)}><option value="2026-09">2026年9月</option><option value="2026-08">2026年8月</option></select></label>
      <label>能源品种<select value={draft.energy} onChange={event=>changeDraft('energy',event.target.value)}><option>电力</option><option>天然气</option><option>热力</option></select></label>
      <label>分析对象<select value={draft.object} onChange={event=>changeDraft('object',event.target.value)}>{objects.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <button className="park-opt-query" onClick={()=>setFilters({...draft})}>⌕　查询</button><button className="park-opt-export" onClick={exportData}>⇩　导出</button>
    </div>
    <div className="park-opt-metrics">
      <RateCard icon="ϟ" tone="#2585f2" title="供用匹配率" value={match+'%'} scope={`${object.label} · ${filters.energy}`} basis="同月同对象的已匹配去向量（消费与外供）÷ 可供输入量；不代表供给余量。" values={monthlyUse.map((value,index)=>value/monthlyInput[index]*100)}/>
      <RateCard icon="⚙" tone="#15af98" title="公共设施转换效率" value={conversion+'%'} scope="集中供热设施 · 投入/有用热" basis="同月同一供热环节有用热输出 ÷ 能源投入。" values={[82,84,85,84,87,86,88,88.6,Number(conversion)]}/>
      <RateCard icon="♧" tone="#13b7aa" title="清洁能源就地消纳率" value={clean+'%'} scope="园区光伏 · 当月示例周" basis="同期间就地消纳量 ÷ 光伏发电量；与下方每日柱状图一致。" values={data.local.map((value,index)=>value/data.generation[index]*100)}/>
      <RateCard icon="↻" tone="#ff873b" title="可回收余热利用率" value={waste+'%'} scope="余热回收系统 · 当月" basis="同月已利用余热量 ÷ 可回收余热量；不以供需差额代替利用量。" values={[54,57,56,61,59,64,Number(waste)]}/>
    </div>
    <div className="park-opt-row park-opt-primary-row">
      <section className="park-opt-card park-opt-trend"><div className="park-opt-card-head"><h2><span className="park-opt-heading-icon">▣</span>{filters.energy}供用趋势</h2><div className="park-opt-switch"><button className={trendMode==='monthly'?'active':''} onClick={()=>setTrendMode('monthly')}>月度</button><button className={trendMode==='daily'?'active':''} onClick={()=>setTrendMode('daily')}>日度</button></div></div><div className="park-opt-legend"><span><i className="line-blue"/>外部输入 + 本地供给</span><span><i className="line-green"/>园区消费 + 外供</span><small>范围：{object.label}</small></div><LineChart labels={trendLabels} input={trendInput} use={trendUse} unit={series.unit}/><div className="park-opt-warning">ⓘ 差额需结合储能变化、计量覆盖及统计口径核对；不直接认定为损失。</div></section>
      <section className="park-opt-card park-opt-facility"><div className="park-opt-card-head"><h2><span className="park-opt-heading-icon">◌</span>公共设施运行分析</h2><small>范围：园区公共设施 · {month}月</small></div><div className="park-opt-facility-bars">
        <div><div><b>集中供热站转换效率</b><span>{conversion}%</span></div><i><em style={{width:conversion+'%'}}/></i><small>参考值 90%（示例）</small></div>
        <div><div><b>光伏系统消纳率</b><span>{clean}%</span></div><i><em className="green" style={{width:clean+'%'}}/></i><small>按示例周统计</small></div>
        <div><div><b>余热回收系统利用率</b><span>{waste}%</span></div><i><em className="orange" style={{width:waste+'%'}}/></i><small>按当月统计</small></div>
      </div><div className="park-opt-security"><h3>供能保障参考 <span title="仅在同环节同期间负荷与可用能力均确认后计算供给余量">ⓘ</span></h3><div><span>公共供电接口 A<br/><b>高峰负荷：{data.peakLoad} MW</b></span><span>可用供电能力：待供能单位确认<br/><strong>ⓘ 供给余量：待确认（暂不计算）</strong></span></div></div></section>
    </div>
    <div className="park-opt-row park-opt-secondary-row">
      <section className="park-opt-card"><div className="park-opt-card-head"><h2><span className="park-opt-heading-icon">▥</span>清洁能源消纳匹配</h2><small>园区光伏 · {month}月1—7日</small></div><div className="park-opt-legend"><span><i className="bar-blue"/>发电量</span><span><i className="bar-green"/>就地消纳量</span><span><i className="line-orange"/>消纳率</span><small>消纳率 {clean}%</small></div><CleanChart data={data} month={month}/></section>
      <section className="park-opt-card"><div className="park-opt-card-head"><h2><span className="park-opt-heading-icon">▣</span>余能回收匹配</h2><small>单位：GJ · {month}月</small></div><div className="park-opt-legend"><span><i className="bar-blue"/>余热可供量</span><span><i className="bar-green"/>接收端需求</span></div><WasteChart areas={data.wasteAreas}/><div className="park-opt-chart-note">按相同期间与能源品种核对，接收条件待核实。</div></section>
    </div>
    <section className="park-opt-card park-opt-suggestions"><div className="park-opt-card-head"><h2><span className="park-opt-heading-icon">▣</span>优化参考建议</h2><strong>3 项建议</strong></div><div className="park-opt-table-wrap"><table><thead><tr><th>改善方向</th><th>涉及对象</th><th>分析依据</th><th>建议内容</th><th>适用条件</th><th>状态</th><th>操作</th></tr></thead><tbody>{suggestions.map(item=><tr key={item.direction}><td>{item.direction}</td><td>{item.target}</td><td>{item.basis}</td><td>{item.action}</td><td>{item.condition}</td><td><span className={`park-opt-status ${item.tone}`}>{item.status}</span></td><td><button onClick={()=>setBasis(item)}>查看依据</button></td></tr>)}</tbody></table></div></section>
    <p className="park-opt-foot">数据来源：示例能碳监测、能源流向、设施档案及诊断结果。建议供园区协调与建设参考；电量差额不等于容量余量，未匹配差额不直接认定为能源损失。</p>
    <Modal open={!!basis} title={basis ? `${basis.direction} · 分析依据` : '分析依据'} onClose={()=>setBasis(null)} className="small"><div className="modal-body"><div className="park-opt-basis"><div><label>涉及对象</label><span>{basis?.target}</span></div><div><label>数据来源</label><span>{basis?.source}</span></div><div><label>计算 / 判断口径</label><span>{basis?.method}</span></div><div><label>适用条件</label><span>{basis?.condition}</span></div><div><label>限制说明</label><span>{basis?.caveat}</span></div></div></div><div className="modal-foot"><button className="btn primary" onClick={()=>setBasis(null)}>关闭</button></div></Modal>
  </div>
}
