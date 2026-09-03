import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.jsx'
import { StatusTag } from '../components/StatusTag.jsx'
import { Tabs } from '../components/Tabs.jsx'
import { ScenarioPage } from './FocusPages.jsx'
import { enterprises, getEnergyCarbonRecord, enterpriseIndicatorResult, indicators, greenServices, archives, carbonAssets, renewableFacilities, operationData, useSharedData } from '../mock/sharedStore.js'

const profileMeta = {
  'ent-001': { type:'重点用能企业', production:'已投产', business:'高效光伏组件及光伏电池片', subpark:'曲靖经开区南海子片区', labels:['重点用能企业','绿色工厂'] },
  'ent-002': { type:'重点用能企业', production:'已投产', business:'高效光伏组件及光伏电池片', subpark:'曲靖经开区南海子片区', labels:['重点用能企业','零碳建设企业'] },
  'ent-003': { type:'重点用能企业', production:'已投产', business:'光伏发电设备及系统集成', subpark:'曲靖经开区南海子片区', labels:['重点用能企业','绿色工厂'] },
}
const defaultMeta = { type:'园区纳管企业', production:'正常运营', business:'园区企业主营业务', subpark:'曲靖经开区', labels:['园区纳管企业'] }
const achievementMap = { 'ent-001':['archive-pv','archive-factory','archive-pcf'], 'ent-002':['archive-pv','archive-diagnosis','archive-factory'], 'ent-003':['archive-pv','archive-saving'] }
const serviceAdvice = { '清洁能源消费占比':'绿电交易服务', '可利用建筑屋顶光伏覆盖率':'屋顶光伏建设服务', '能效诊断覆盖率':'能效诊断服务', '碳足迹认证产品数量':'产品碳足迹服务' }

export function EnterpriseProfilePage(){
  const [searchParams] = useSearchParams()
  const [enterpriseId,setEnterpriseId] = useState(searchParams.get('enterpriseId') || 'ent-002')
  const [view,setView] = useState('profile')
  const navigate = useNavigate()
  const { tasks, role } = useSharedData()
  const enterprise = enterprises.find(item => item.id === enterpriseId)
  const energy = getEnergyCarbonRecord(enterpriseId)
  const meta = profileMeta[enterpriseId] || defaultMeta
  const results = enterpriseIndicatorResult.filter(item => item.enterpriseId === enterpriseId)
  const achieved = results.filter(item => item.status === '已达标')
  const pending = results.filter(item => item.status !== '已达标')
  const services = greenServices.filter(item => item.enterpriseId === enterpriseId)
  const achievementItems = archives.filter(item => (achievementMap[enterpriseId] || []).includes(item.id))
  const assets = carbonAssets.filter(item => item.enterpriseId === enterpriseId)
  const greenAssets = assets.filter(item => ['greenPower','greenCertificate'].includes(item.assetType))
  const facilities = renewableFacilities.filter(item => item.enterpriseId === enterpriseId)
  const task = tasks.find(item => item.enterpriseId === enterpriseId)
  const pendingCount = (task?.pendingData || 0) + (task?.pendingVoucher || 0)
  const cleanRate = results.find(item => item.indicatorId === 'ind-clean-energy')?.value || energy?.cleanRate || '—'
  const unitCarbon = energy?.energy && energy?.emissions ? (Number(energy.emissions) / Number(energy.energy)).toFixed(3) : '—'
  const state = pending.length ? '绿色发展企业' : '零碳建设企业'
  const stateTone = pending.length ? 'warn' : 'ok'
  const strengths = achieved.length ? achieved.map(item => indicators.find(indicator => indicator.indicatorId === item.indicatorId)?.name).filter(Boolean) : ['基础数据已接入']
  const recommendations = pending.map(item => { const name = indicators.find(indicator => indicator.indicatorId === item.indicatorId)?.name || item.indicatorId; return { name, service: serviceAdvice[name] || '绿色低碳咨询服务' } })
  const go = path => navigate(`${path}${path.includes('?') ? '&' : '?'}enterpriseId=${enterpriseId}`)
  const servicePath = role === 'enterprise' ? '/green-service-center' : '/enterprise-green-services'

  return <div className="content enterprise-profile-page">
    <PageHeader title={role === 'enterprise' ? '企业能碳画像' : '园区零碳推演与企业画像'} subtitle={role === 'enterprise' ? '查看本企业当前能碳表现、零碳建设成果与待提升方向。' : '面向园区管理人员，查看企业零碳发展状态、建设成果和下一步提升方向。'} actions={<select value={enterpriseId} onChange={event => setEnterpriseId(event.target.value)}>{enterprises.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>} />
    {role === 'committee' && <Tabs tabs={[{value:'profile',label:'企业零碳画像'},{value:'scenario',label:'园区零碳推演'}]} active={view} onChange={setView}/>}
    {view === 'scenario' && role === 'committee' ? <ScenarioPage embedded /> : <>
      <section className="profile-hero profile-hero-v2"><div className="profile-hero-main"><div className="profile-avatar">{enterprise?.name?.slice(0,1)}</div><div><div className="profile-kicker">企业零碳综合画像 · 2026年度</div><h2>{enterprise?.name || '未找到企业'}</h2><p>{enterprise?.industry || '—'} <i>·</i> {meta.business}</p><div className="profile-tags">{meta.labels.map(label => <span key={label}>{label}</span>)}</div></div></div><div className="profile-hero-meta"><StatusTag tone={stateTone}>{state}</StatusTag><span>零碳建设阶段：{meta.production}</span><span className="profile-completeness">数据完整率 100%</span></div></section>
      <div className="profile-identity-strip"><div><span>主要产品</span><b>{meta.business}</b></div><div><span>所属园中园</span><b>{meta.subpark}</b></div><div><span>企业属性</span><b>{meta.type}</b></div><div><span>投产状态</span><b>{meta.production}</b></div><button className="op-btn" onClick={() => go('/data-management')}>查看企业档案 →</button></div>
      {pendingCount > 0 && <div className="profile-data-reminder"><span>数据待完善</span><b>{pendingCount}项</b><span>补齐后将更新企业画像和零碳评价。</span><button className="op-btn" onClick={() => navigate(`/reporting-task-monitoring?enterpriseId=${enterpriseId}`)}>查看待完善项 →</button></div>}
      <div className="profile-section-heading"><div><h3>企业能碳表现</h3><p>以已入库的能源与碳排放数据展示企业当前运行水平</p></div><button className="btn small" onClick={() => go('/energy-carbon-monitoring')}>进入能碳监测 →</button></div>
      <div className="profile-metrics profile-metrics-v2"><div><span>综合能源消费</span><b>{energy?.energy || '—'} <em>万tce</em></b><small>2026年1–7月</small></div><div><span>碳排放量</span><b>{energy?.emissions || '—'} <em>万tCO₂e</em></b><small>已接入核算结果</small></div><div><span>单位能耗碳排放</span><b>{unitCarbon}<em>{unitCarbon === '—' ? '' : 'tCO₂/tce'}</em></b><small>由能耗与碳排放数据计算</small></div><div><span>清洁能源消费占比</span><b className="green-number">{cleanRate}<em>{cleanRate === '—' || String(cleanRate).includes('%') ? '' : '%'}</em></b><small>企业关联评价指标</small></div></div>
      <div className="profile-layout profile-layout-v2"><main>
        <div className="profile-section-heading"><div><h3>零碳建设评价</h3><p>明确企业已具备的基础与仍需推进的建设方向</p></div><span className="profile-evaluation-count">已达成 {achieved.length} / {results.length} 项</span></div>
        <div className="profile-evaluation-grid"><section className="card evaluation-card"><div className="card-title"><b>已达成指标</b><StatusTag tone="ok">{achieved.length}项</StatusTag></div>{achieved.length ? achieved.map(item => <div className="evaluation-item" key={item.resultId}><i>✓</i><span>{indicators.find(indicator => indicator.indicatorId === item.indicatorId)?.name || item.indicatorId}</span><b>{item.value}</b></div>) : <p className="side-empty">暂无已达成的企业关联指标</p>}</section><section className="card evaluation-card"><div className="card-title"><b>待提升指标</b><StatusTag tone="warn">{pending.length}项</StatusTag></div>{pending.length ? pending.map(item => <div className="evaluation-item" key={item.resultId}><i>○</i><span>{indicators.find(indicator => indicator.indicatorId === item.indicatorId)?.name || item.indicatorId}</span><b>{item.value}</b></div>) : <p className="side-empty">当前关联指标均已达成</p>}</section></div>
        <div className="profile-section-heading profile-section-heading-spaced"><div><h3>绿色低碳建设成果</h3><p>归集绿色设施、认证成果与绿色权益资产</p></div><button className="op-btn" onClick={() => go('/zero-carbon-results')}>查看验收支撑 →</button></div>
        <div className="resource-grid resource-grid-v2"><ResourceCard icon="◆" title="绿色设施" value={`${facilities.length}项`} detail={facilities.length ? facilities.map(item => `${item.facilityType} ${item.capacity}${item.unit}`).join('、') : '暂无设施登记'} /><ResourceCard icon="✓" title="绿色认证" value={`${achievementItems.filter(item => item.domain === '绿色制造成果').length}项`} detail={achievementItems.filter(item => item.domain === '绿色制造成果').map(item => item.name).join('、') || '暂无认证成果'} /><ResourceCard icon="◇" title="绿色产品" value={`${achievementItems.filter(item => item.id === 'archive-pcf').length}项`} detail={achievementItems.find(item => item.id === 'archive-pcf')?.name || '暂无碳足迹认证产品'} /><ResourceCard icon="↗" title="碳资产" value={`${greenAssets.length}项`} detail={greenAssets.length ? greenAssets.map(item => item.assetType === 'greenPower' ? '绿电' : '绿证').join('、') : '暂无绿电绿证记录'} /></div>
      </main><aside>
        <div className="profile-side-card card"><div className="side-card-head"><b>企业零碳状态</b><StatusTag tone={stateTone}>{state}</StatusTag></div><div className="state-summary"><span>零碳指标</span><strong>{achieved.length} / {results.length} 项达成</strong></div><div className="state-summary"><span>优势</span><strong>{strengths.join('、')}</strong></div><div className="state-summary"><span>待提升</span><strong>{pending.length ? pending.map(item => indicators.find(indicator => indicator.indicatorId === item.indicatorId)?.name).join('、') : '暂无'}</strong></div></div>
        <div className="profile-side-card card recommendation-card"><div className="side-card-head"><b>提升建议与绿色服务</b><span>下一步</span></div>{recommendations.length ? recommendations.map(item => <div className="recommendation-item" key={item.name}><div><b>{item.name}</b><span>推荐：{item.service}</span></div><button className="op-btn" onClick={() => go(servicePath)}>查看服务</button></div>) : <p className="side-empty">当前无待提升项，可持续跟踪数据与成果。</p>}</div>
        {services.length > 0 && <div className="profile-side-card card"><div className="side-card-head"><b>服务推进情况</b><span>{services.length}项</span></div><p className="service-status-text">{services.map(item => `${item.serviceType}·${item.stage}`).join('；')}</p><button className="btn text" onClick={() => go(servicePath)}>查看服务进度 →</button></div>}
      </aside></div>
    </>}
  </div>
}

function ResourceCard({icon,title,value,detail}){return <div className="card resource-card resource-card-v2"><span className="resource-icon">{icon}</span><div><b>{title}</b><strong>{value}</strong><p>{detail}</p></div></div>}
