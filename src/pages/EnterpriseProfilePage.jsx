import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.jsx'
import { Tabs } from '../components/Tabs.jsx'
import { StatusTag } from '../components/StatusTag.jsx'
import { enterprises, getEnergyCarbonRecord, enterpriseIndicatorResult, indicators, greenServices, archives, carbonAssets, renewableFacilities, operationData, useSharedData } from '../mock/sharedStore.js'

const profileMeta = {
  'ent-001': { type:'重点用能企业', carbonManaged:'是', production:'已投产', business:'高效光伏组件及光伏电池片', tags:['重点用能企业','光伏制造','已投产'] },
  'ent-002': { type:'重点用能企业', carbonManaged:'是', production:'已投产', business:'高效光伏组件及光伏电池片', tags:['重点用能企业','光伏制造','已投产','零碳建设企业'] },
  'ent-003': { type:'重点用能企业', carbonManaged:'是', production:'已投产', business:'光伏发电设备及系统集成', tags:['重点用能企业','光伏制造','已投产'] },
}
const defaultMeta = { type:'园区纳管企业', carbonManaged:'按要求纳入', production:'正常运营', business:'园区企业主营业务', tags:['园区纳管企业','正常运营'] }
const statusTone = status => ['已达标','正常','已完成','已履约','已获取','已核销'].includes(status) ? 'ok' : ['待提升','进行中','待完善','待使用'].includes(status) ? 'warn' : 'gray'

export function EnterpriseProfilePage(){
  const [searchParams] = useSearchParams(); const [enterpriseId,setEnterpriseId] = useState(searchParams.get('enterpriseId') || 'ent-002'); const navigate = useNavigate(); const { tasks } = useSharedData()
  const enterprise = enterprises.find(item => item.id === enterpriseId); const energy = getEnergyCarbonRecord(enterpriseId); const meta = profileMeta[enterpriseId] || defaultMeta
  const results = enterpriseIndicatorResult.filter(item => item.enterpriseId === enterpriseId); const services = greenServices.filter(item => item.enterpriseId === enterpriseId); const achievements = archives.filter(item => item.enterpriseId === enterpriseId); const task = tasks.find(item => item.enterpriseId === enterpriseId)
  const assets = carbonAssets.filter(item => item.enterpriseId === enterpriseId); const facilities = renewableFacilities.filter(item => item.enterpriseId === enterpriseId); const operation = operationData.find(item => item.enterpriseId === enterpriseId); const pendingCount = (task?.pendingData || 0) + (task?.pendingVoucher || 0)
  const indicatorDone = results.filter(item => item.status === '已达标').length; const indicatorProgress = results.length ? Math.round(indicatorDone / results.length * 100) : 0; const greenAssets = assets.filter(item => ['greenPower','greenCertificate'].includes(item.assetType)); const carbonAssetCount = assets.filter(item => item.assetType === 'quota').length
  const relatedServiceText = services.length ? services.map(item => `${item.serviceType} · ${item.stage}`).join('；') : '暂未纳入绿色低碳服务'
  const go = path => navigate(`${path}${path.includes('?') ? '&' : '?'}enterpriseId=${enterpriseId}`)
  const timeline = [...achievements.map(item => ({ date:item.date, title:item.name, tag:'建设成果' })), ...services.map(item => ({ date:`${item.year}-08`, title:`${item.serviceType} · ${item.stage}`, tag:'绿色服务' }))].sort((a,b) => String(b.date).localeCompare(String(a.date))).slice(0,5)
  return <div className="content enterprise-profile-page">
    <PageHeader title="企业画像" subtitle="从园区管理视角聚合查看单家企业的基础档案、能碳表现、相关指标、绿色服务和零碳建设成果。画像只聚合已有结果，不建立第二套计算逻辑。" actions={<select value={enterpriseId} onChange={event => setEnterpriseId(event.target.value)}>{enterprises.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>} />
    <Tabs tabs={[{value:'energy',label:'能源分析'},{value:'carbon',label:'碳排放分析'},{value:'overview',label:'能碳监测总览'},{value:'profile',label:'企业画像'}]} active="profile" onChange={value => navigate(value === 'profile' ? '/enterprise-profile' : `/energy-carbon-monitoring?tab=${value}`)} />
    <section className="profile-hero profile-hero-v2"><div className="profile-hero-main"><div className="profile-avatar">{enterprise?.name?.slice(0,1)}</div><div><div className="profile-kicker">企业综合档案 · 2026年度</div><h2>{enterprise?.name || '未找到企业'}</h2><p>{enterprise?.industry || '—'} <i>·</i> {meta.business}</p><div className="profile-tags">{meta.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div></div><div className="profile-hero-meta"><StatusTag tone="ok">{enterprise?.status || '—'}</StatusTag><span>数据更新于 2026-08-25</span><span className="profile-completeness">档案完整度 100%</span></div></section>
    <div className="profile-identity-strip"><div><span>企业类型</span><b>{meta.type}</b></div><div><span>园区状态</span><b>{meta.production}</b></div><div><span>重点碳排放管理</span><b>{meta.carbonManaged}</b></div><div><span>年度经营数据</span><b>{operation?.value?.toLocaleString() || '—'} <em>万元</em></b></div><button className="op-btn" onClick={() => go('/data-management')}>查看企业档案 →</button></div>
    {pendingCount > 0 && <div className="profile-data-reminder"><span>数据待完善</span><b>{pendingCount}项</b><span>当前画像基于已入库结果展示，待补数据不会改变本页计算口径。</span><button className="op-btn" onClick={() => navigate(`/reporting-task-monitoring?enterpriseId=${enterpriseId}`)}>查看待完善项 →</button></div>}
    <div className="profile-metrics profile-metrics-v2"><div><span>综合能耗</span><b>{energy?.energy || '—'} <em>万tce</em></b><small>2026年1–7月 · 园区能碳监测</small></div><div><span>碳排放量</span><b>{energy?.emissions || '—'} <em>万tCO₂e</em></b><small>较上期 <strong className="down">↓ 3.8%</strong></small></div><div><span>清洁能源占比</span><b className="green-number">{energy?.cleanRate || '—'}<em>%</em></b><small>园区企业平均 81.4%</small></div><div><span>企业关联零碳指标</span><b>{indicatorDone} <em>/ {results.length || 0} 达标</em></b><small>仅统计与该企业直接相关的指标</small></div></div>
    <div className="profile-layout profile-layout-v2"><main>
      <div className="profile-section-heading"><div><h3>企业低碳画像</h3><p>从企业身份、能源特征、碳排放特征、绿色能源、零碳指标和绿色服务六个维度阅读企业状态</p></div><button className="btn small" onClick={() => go('/energy-carbon-monitoring')}>进入能碳监测 →</button></div>
      <div className="profile-grid profile-grid-v2">
        <ProfileCard title="企业概况" source="企业档案" text={<><strong>{meta.business}</strong><span>{meta.type} · {meta.production}</span><span>年度经营数据 {operation?.value?.toLocaleString() || '—'} 万元</span></>} onClick={() => go('/data-management')} />
        <ProfileCard title="能源特征" source="能源分析" text={<><strong>{energy?.energy || '—'} 万tce</strong><span>电力为主要能源 · 用电量 {energy?.electricity || '—'} 万kWh</span><span>统计周期 2026年1–7月</span></>} onClick={() => go('/energy-carbon-monitoring?tab=energy')} />
        <ProfileCard title="碳排放特征" source="碳排放分析" text={<><strong>{energy?.emissions || '—'} 万tCO₂e</strong><span>已接入园区碳排放核算结果</span><span>主要来源：购入电力活动数据</span></>} onClick={() => go('/energy-carbon-monitoring?tab=carbon')} />
        <ProfileCard title="绿色能源" source="能碳监测" text={<><strong>{energy?.cleanRate || '—'}% 清洁能源占比</strong><span>{facilities.map(item => `${item.facilityType} ${item.capacity}${item.unit}`).join('、') || '暂无绿色设施记录'}</span><span>绿电 / 绿证 {greenAssets.length} 项</span></>} onClick={() => go('/energy-carbon-monitoring?tab=overview')} />
        <ProfileCard title="零碳指标" source="指标管控" text={<><strong>企业关联指标 {indicatorDone} / {results.length || 0} 达标</strong><span>{results.map(item => `${indicators.find(x => x.indicatorId === item.indicatorId)?.name || item.indicatorId}：${item.status}`).join('；') || '暂无企业级指标结果'}</span><span>不代表园区全量指标进度</span></>} onClick={() => go('/zero-carbon-indicators')} />
        <ProfileCard title="绿色服务" source="企业绿色服务" text={<><strong>{services.length ? `${services.length} 项服务关系` : '暂未纳入服务'}</strong><span>{relatedServiceText}</span><span>{services[0]?.result && services[0].result !== '—' ? `成果：${services[0].result}` : '服务成果持续归集'}</span></>} onClick={() => go('/enterprise-green-services')} />
      </div>
      <div className="profile-section-heading profile-section-heading-spaced"><div><h3>零碳建设成果与绿色资产</h3><p>展示已形成的建设成果、绿色设施、绿电绿证和碳资产，不混入经营数据</p></div><button className="op-btn" onClick={() => go('/zero-carbon-results')}>查看验收支撑 →</button></div>
      <div className="resource-grid resource-grid-v2"><ResourceCard icon="◆" title="建设成果" value={`${achievements.length}项`} detail={achievements.length ? achievements.map(item => item.name).join('、') : '暂无已归集建设成果'} /><ResourceCard icon="↗" title="绿色设施" value={`${facilities.length}项`} detail={facilities.length ? facilities.map(item => `${item.facilityType} ${item.capacity}${item.unit}`).join('、') : '暂无绿色设施登记'} /><ResourceCard icon="⌁" title="绿电 / 绿证" value={`${greenAssets.length}项`} detail={greenAssets.length ? greenAssets.map(item => `${item.assetType === 'greenPower' ? '绿电' : '绿证'} ${item.amount}${item.unit}`).join('、') : '暂无绿电绿证记录'} /><ResourceCard icon="◇" title="碳资产" value={`${carbonAssetCount}项`} detail={carbonAssetCount ? assets.filter(item => item.assetType === 'quota').map(item => `${item.year}年配额 · ${item.status}`).join('、') : '暂无碳配额资产登记'} /></div>
    </main><aside><div className="profile-side-card card activity-card"><div className="side-card-head"><b>近期动态</b><span>2026年度</span></div><div className="activity-list">{timeline.map((item,index) => <div className="activity-item" key={`${item.title}-${index}`}><i /><div><small>{item.date} · {item.tag}</small><p>{item.title}</p></div></div>)}{!timeline.length && <p className="side-empty">暂无近期动态</p>}</div></div></aside></div>
  </div>
}

function ProfileCard({title,source,text,onClick}){return <div className="card profile-card profile-card-v2"><div className="card-title"><b>{title}</b><span>{source}</span></div><div className="profile-card-content">{text}</div><button className="btn text" onClick={onClick}>查看来源 <span>→</span></button></div>}
function ResourceCard({icon,title,value,detail}){return <div className="card resource-card resource-card-v2"><span className="resource-icon">{icon}</span><div><b>{title}</b><strong>{value}</strong><p>{detail}</p></div></div>}
