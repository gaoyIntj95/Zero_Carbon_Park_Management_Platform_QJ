import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.jsx'
import { MetricStrip } from '../components/MetricStrip.jsx'
import { DataPanel } from '../components/DataPanel.jsx'
import { StatusTag } from '../components/StatusTag.jsx'
import { carbonAssets, getEnergyCarbonRecord, enterprises, greenServices, useSharedData } from '../mock/sharedStore.js'

const enterpriseName = id => enterprises.find(item => item.id === id)?.name || '—'

const serviceLabels = { '组织碳核查':'组织碳', '产品碳足迹':'产品碳足迹', 'CBAM':'CBAM', '供应链碳管理':'供应链碳', '企业碳资产管理':'碳资产' }
const plannedServices = { 'ent-004':{ CBAM:'待启动' }, 'ent-005':{ '供应链碳管理':'待启动' }, 'ent-006':{ '组织碳核查':'待启动' } }
const terminalAssetStatus = new Set(['已履约','已获取','已核销','待使用'])
const assetForEnterprise = (enterpriseId, scopedAssets) => scopedAssets.filter(item => item.enterpriseId === enterpriseId)
const enterpriseServiceItems = (enterpriseId, scopedServices, scopedAssets) => {
  const items = scopedServices.filter(item => item.enterpriseId === enterpriseId).map(item => ({ label:serviceLabels[item.serviceType] || item.serviceType, status:item.status, result:item.result }))
  const assets = assetForEnterprise(enterpriseId, scopedAssets)
  if (assets.length) items.push({ label:'碳资产', status:assets.every(item => terminalAssetStatus.has(item.status)) ? '已完成' : '进行中', result:assets.every(item => terminalAssetStatus.has(item.status)) ? '已建立资产台账' : '待完善资产资料' })
  return items
}

const serviceColumns = [['组织碳核查','组织碳管理'], ['产品碳足迹','产品碳足迹'], ['CBAM','CBAM服务'], ['供应链碳管理','供应链碳管理'], ['企业碳资产管理','碳资产服务']]
const serviceStatusTone = status => status === '已完成' ? 'ok' : ['服务中', '待启动'].includes(status) ? 'warn' : 'gray'
function serviceStatusForEnterprise(enterpriseId, type, scopedServices, scopedAssets) {
  const service = scopedServices.find(item => item.enterpriseId === enterpriseId && item.serviceType === type)
  if (service) return service.status === '进行中' ? '服务中' : service.status
  if (type === '企业碳资产管理') {
    const assets = assetForEnterprise(enterpriseId, scopedAssets)
    if (assets.length) return assets.every(item => terminalAssetStatus.has(item.status)) ? '已完成' : '服务中'
  }
  return plannedServices[enterpriseId]?.[type] || '未申请'
}

function CommitteeOverview({ scopedServices, scopedAssets, navigate }) {
  const rows = enterprises.map(enterprise => {
    const items = enterpriseServiceItems(enterprise.id, scopedServices, scopedAssets)
    const planned = plannedServices[enterprise.id] || {}
    const hasActive = items.some(item => item.status === '进行中')
    const isPlanned = Object.keys(planned).length > 0
    const resultCount = items.filter(item => item.status === '已完成').length
    const next = hasActive ? (enterprise.id === 'ent-002' ? '待企业补充材料' : '待完善服务资料') : isPlanned ? '已确认需求，待园区启动' : resultCount ? '已形成成果，可查看归档' : '—'
    return { ...enterprise, items, resultCount, status:hasActive ? '服务中' : isPlanned ? '待启动' : resultCount ? '已完成' : '未申请', next, planned }
  })
  const serviceEnterpriseIds = new Set(rows.filter(row => row.items.length > 0).map(row => row.id))
  const serviceItems = rows.reduce((sum, row) => sum + row.items.length, 0)
  const inProgress = rows.filter(row => row.status === '服务中').reduce((sum, row) => sum + row.items.filter(item => item.status === '进行中').length, 0)
  const formed = rows.reduce((sum, row) => sum + row.resultCount, 0)
  const attention = rows.filter(row => row.status === '服务中' || row.status === '待启动')
  const serviceCoverage = serviceColumns.map(([type, label]) => {
    const covered = rows.filter(row => serviceStatusForEnterprise(row.id, type, scopedServices, scopedAssets) !== '未申请').length
    return { label, covered }
  })
  return <>
    <MetricStrip metrics={[{ label:'已开展服务企业', value:`${serviceEnterpriseIds.size}/${enterprises.length}家`, note:'至少存在一条服务记录' }, { label:'服务项目', value:`${serviceItems}项`, note:'统一服务记录主数据' }, { label:'服务进行中', value:`${inProgress}项`, note:'当前仍在办理' }, { label:'已完成服务', value:`${formed}项`, note:'服务记录已完成' }]} />
    <div className="green-service-overview">
      <DataPanel title="服务覆盖概览" description="按服务类型查看企业覆盖情况，快速识别需要扩展的服务。"><div className="green-service-insight"><div className="green-service-kpi"><span>已覆盖企业</span><b>{serviceEnterpriseIds.size}家</b><small>至少已有一项服务记录</small></div><div className="green-service-kpi"><span>待推进企业</span><b>{attention.length}家</b><small>需要启动服务或补齐资料</small></div><div className="green-service-kpi"><span>已归档成果</span><b>{formed}项</b><small>可进入企业档案查看</small></div></div><div className="green-service-bars">{serviceCoverage.map(item => <div className="green-service-bar" key={item.label}><span>{item.label}</span><i><em style={{ width:`${item.covered / enterprises.length * 100}%` }} /></i><strong>{item.covered}/{enterprises.length}家</strong></div>)}</div></DataPanel>
      <PendingServiceItems rows={rows} navigate={navigate} />
    </div>
    <DataPanel title="企业服务全景" description="按企业汇总已开展服务、当前进度、待办动作与已归档成果。"><div className="table-wrap"><table className="service-progress-table"><thead><tr><th>企业</th><th>已开展服务</th><th>当前进度</th><th>最新状态 / 下一步</th><th>已归档成果</th><th>操作</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td className="item-name">{row.name}</td><td><div className="service-coverage-tags">{row.items.length ? row.items.map((item, index) => <span key={`${item.label}-${index}`}>{item.label}</span>) : <small className="table-subnote">暂无服务</small>}</div></td><td><StatusTag tone={serviceStatusTone(row.status)}>{row.status}</StatusTag></td><td><b className="progress-latest">{row.next}</b>{row.status === '服务中' && <small className="table-subnote">资料补齐后进入成果确认</small>}</td><td>{row.resultCount ? <span className="service-result-count">{row.resultCount}项成果</span> : <small className="table-subnote">—</small>}</td><td><button className="op-btn" onClick={() => navigate(`/enterprise-profile?enterpriseId=${row.id}`)}>{row.status === '服务中' || row.status === '待启动' ? '查看进度' : row.resultCount ? '查看成果' : '查看详情'}</button></td></tr>)}</tbody></table></div></DataPanel>
  </>
}

function PendingServiceItems({ rows, navigate }) {
  const attention = rows.filter(row => row.status === '服务中' || row.status === '待启动')
  return <DataPanel title="待推进事项" description="只展示需要园区采取动作的事项，集中处理服务启动、资料补齐和成果确认。"><div className="green-service-alerts">{attention.length ? attention.map(row => <button key={row.id} className="green-service-alert" onClick={() => navigate(`/enterprise-profile?enterpriseId=${row.id}`)}><span><b>{row.name}</b><small>{row.items.filter(item => item.status === '进行中').map(item => item.label).join('、') || Object.keys(row.planned).map(type => serviceLabels[type] || type).join('、')} · {row.next}</small></span><strong className="op-link">{row.status === '服务中' ? '查看' : '启动服务'} →</strong></button>) : <div className="empty">当前没有待推进事项</div>}</div></DataPanel>
}

function EnterpriseWorkbench({ scopedServices, scopedAssets, currentEnterpriseId, navigate, confirmServiceResult }) {
  const current = enterprises.find(item => item.id === currentEnterpriseId), energy = getEnergyCarbonRecord(currentEnterpriseId), active = scopedServices.filter(item => item.status === '进行中'), finished = scopedServices.filter(item => item.status === '已完成')
  return <><PageHeader title="企业绿色服务工作台" subtitle={`${current?.name || '当前企业'}：查看自身绿色服务进度、成果和待处理事项。`} actions={<button className="btn primary" onClick={() => navigate('/data-management')}>进入企业数据管理</button>} />
    <div className="view-context enterprise-context"><b>企业执行视角</b><span>只看本企业、处理数据、补充凭证、完成服务任务</span></div>
    <MetricStrip metrics={[{ label:'当前碳排放', value:`${energy?.emissions?.toFixed(2) || '—'} 万tCO₂e`, note:'2026年1—7月' }, { label:'清洁能源占比', value:`${energy?.cleanRate || '—'}%`, note:energy?.cleanRate >= 85 ? '表现良好' : '建议提升' }, { label:'进行中服务', value:`${active.length}项`, note:'需要企业配合' }, { label:'待处理事项', value:`${active.length + (scopedAssets.some(item => item.status === '待完善') ? 1 : 0)}项`, note:'进入对应模块处理' }]} />
    <DataPanel title="我的服务进度" description="服务卡片展示当前阶段；进入专业模块处理明细和凭证"><div className="enterprise-service-status"><div><b>{active.length}</b><span>进行中</span></div><div><b>{finished.length}</b><span>已完成</span></div><div><b>{scopedAssets.length}</b><span>绿色权益</span></div><div className="enterprise-service-tip">企业侧只展示本企业数据，园区汇总和企业排名不会出现在这里。</div></div><div className="green-service-task-list">{scopedServices.length ? scopedServices.map(item => <div className="green-service-task" key={item.serviceId}><div><b>{item.serviceType}</b><small>{item.year} · {item.stage} · 来源：{item.source}</small></div><StatusTag tone={item.status === '已完成' ? 'ok' : 'warn'}>{item.status}</StatusTag>{item.status !== '已完成' && <button className="op-btn" onClick={() => confirmServiceResult(item.serviceId)}>确认成果回流</button>}<button className="op-btn" onClick={() => navigate(item.serviceType === '组织碳核查' ? '/organization-carbon' : item.serviceType === '产品碳足迹' ? '/product-carbon-footprint' : '/enterprise-assets')}>进入处理</button></div>) : <div className="empty">当前还没有配置专业服务</div>}</div></DataPanel>
    <div className="enterprise-green-next"><DataPanel title="下一步建议" description="按优先级处理，完成后会同步更新园区侧服务状态"><div className="green-next-item"><span className="priority-dot warn">1</span><div><b>补充企业数据与凭证</b><small>数据完整后才能用于碳核算、指标评价和服务成果。</small></div><button className="op-btn" onClick={() => navigate('/enterprise-data-reporting')}>去处理</button></div><div className="green-next-item"><span className="priority-dot">2</span><div><b>确认组织碳核查阶段</b><small>当前服务处于进行中，请跟进第三方核查材料。</small></div><button className="op-btn" onClick={() => navigate('/organization-carbon')}>查看服务</button></div></DataPanel></div>
  </>
}

function ServiceManagement({ scopedServices, scopedAssets, navigate }) {
  const catalog = [['组织碳核查','组织碳排放核算、核查支撑与报告归档'],['产品碳足迹','产品碳足迹核算、评价与认证支持'],['CBAM','出口产品CBAM数据准备与申报支持'],['供应链碳管理','供应商碳数据采集与协同管理'],['企业碳资产管理','配额、绿电绿证与碳资产台账管理']]
  return <DataPanel title="服务目录与覆盖" description="园区可提供的绿色低碳服务；服务建立后将在上方企业服务全景中统一跟踪。"><div className="table-wrap"><table><thead><tr><th>服务项目</th><th>服务说明</th><th>当前覆盖企业</th><th>操作</th></tr></thead><tbody>{catalog.map(([name,desc]) => { const count = name === '企业碳资产管理' ? new Set(scopedAssets.map(item => item.enterpriseId)).size : new Set(scopedServices.filter(item => item.serviceType === name).map(item => item.enterpriseId)).size; return <tr key={name}><td className="item-name">{serviceLabels[name] || name}</td><td>{desc}</td><td>{count}家</td><td><button className="op-btn" onClick={() => navigate('/enterprise-management')}>查看适用企业</button></td></tr> })}</tbody></table></div></DataPanel>
}

function ServiceResults({ scopedServices, scopedAssets, navigate }) {
  const results = scopedServices.filter(item => item.result && item.result !== '—').map(item => ({ id:item.serviceId, enterprise:enterpriseName(item.enterpriseId), name:item.result, type:serviceLabels[item.serviceType] || item.serviceType, date:`${item.year}-08-20`, source:item.source }))
  enterprises.filter(enterprise => { const assets = assetForEnterprise(enterprise.id, scopedAssets); return assets.length && assets.every(item => terminalAssetStatus.has(item.status)) }).forEach(enterprise => results.push({ id:`asset-result-${enterprise.id}`, enterprise:enterprise.name, name:'企业碳资产与绿色权益台账', type:'碳资产管理', date:'2026-08-20', source:'碳资产管理' }))
  return <DataPanel title="服务成果归档" description="归档已完成服务形成的报告、认证成果和管理台账。"><div className="table-wrap"><table><thead><tr><th>成果名称</th><th>企业</th><th>服务类型</th><th>形成时间</th><th>来源</th><th>操作</th></tr></thead><tbody>{results.length ? results.map(item => <tr key={item.id}><td className="item-name">{item.name}</td><td>{item.enterprise}</td><td>{item.type}</td><td>{item.date}</td><td>{item.source}</td><td><button className="op-btn" onClick={() => navigate('/enterprise-management')}>查看</button></td></tr>) : <tr><td colSpan="6" className="empty">暂无已归档成果</td></tr>}</tbody></table></div></DataPanel>
}

export function EnterpriseGreenServicesPage() {
  const navigate = useNavigate(), { role, currentEnterpriseId, services, confirmServiceResult } = useSharedData()
  const scopedServices = role === 'enterprise' ? services.filter(item => item.enterpriseId === currentEnterpriseId) : services
  const scopedAssets = carbonAssets.filter(item => item.applicable && (role === 'committee' || item.enterpriseId === currentEnterpriseId))
  if (role === 'enterprise') return <div className="content enterprise-content"><EnterpriseWorkbench scopedServices={scopedServices} scopedAssets={scopedAssets} currentEnterpriseId={currentEnterpriseId} navigate={navigate} confirmServiceResult={confirmServiceResult} /></div>
  return <div className="content service-hub-page"><PageHeader title="企业绿色服务工作台" subtitle="统一掌握服务覆盖、待推进事项和已归档成果。" actions={<button className="btn" onClick={() => navigate('/enterprise-management')}>查看企业服务档案</button>} /><CommitteeOverview scopedServices={scopedServices} scopedAssets={scopedAssets} navigate={navigate} /><ServiceManagement scopedServices={scopedServices} scopedAssets={scopedAssets} navigate={navigate} /><ServiceResults scopedServices={scopedServices} scopedAssets={scopedAssets} navigate={navigate} /></div>
}
