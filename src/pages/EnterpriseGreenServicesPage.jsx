import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.jsx'
import { MetricStrip } from '../components/MetricStrip.jsx'
import { DataPanel } from '../components/DataPanel.jsx'
import { StatusTag } from '../components/StatusTag.jsx'
import { Modal } from '../components/Modal.jsx'
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

function CommitteeOverview({ scopedServices, scopedAssets, navigate, onOpen }) {
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
  return <>
    <PageHeader title="企业绿色服务 / 服务总览" subtitle="从园区运营视角查看企业服务覆盖、办理进展、待推进事项和已完成服务。" />
    <MetricStrip metrics={[{ label:'已服务企业', value:`${serviceEnterpriseIds.size}家`, note:'至少存在一条服务记录' }, { label:'服务记录', value:`${serviceItems}项`, note:'统一服务记录主数据' }, { label:'服务中', value:`${inProgress}项`, note:'当前仍在办理' }, { label:'已完成服务', value:`${formed}项`, note:'服务记录已完成' }]} />
    <DataPanel title="企业绿色服务进展" description="按企业查看当前服务、最新状态与下一步动作。"><div className="table-wrap"><table className="service-progress-table"><thead><tr><th>企业</th><th>当前服务</th><th>当前进度</th><th>最新状态 / 下一步</th><th>操作</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td className="item-name">{row.name}</td><td>{row.items.length ? row.items.map(item => item.label).join('、') : '—'}</td><td><StatusTag tone={row.status === '服务中' || row.status === '待启动' ? 'warn' : row.status === '已完成' ? 'ok' : 'gray'}>{row.status}</StatusTag>{row.resultCount > 0 && <small className="table-subnote">已形成{row.resultCount}项成果</small>}</td><td><b className="progress-latest">{row.next}</b>{row.status === '服务中' && <small className="table-subnote">资料补齐后进入成果确认</small>}</td><td><button className="op-btn" onClick={() => navigate(`/enterprise-profile?enterpriseId=${row.id}`)}>{row.status === '服务中' || row.status === '待启动' ? '查看进度' : row.resultCount ? '查看成果' : '查看详情'}</button></td></tr>)}</tbody></table></div></DataPanel>
    <DataPanel title="待推进事项" description="只展示需要园区采取动作的事项，避免重复罗列企业进展。"><div className="green-service-alerts">{attention.length ? attention.map(row => <button key={row.id} className="green-service-alert" onClick={() => navigate(`/enterprise-profile?enterpriseId=${row.id}`)}><span><b>{row.name}</b><small>{row.items.filter(item => item.status === '进行中').map(item => item.label).join('、') || Object.keys(row.planned).map(type => serviceLabels[type] || type).join('、')} · {row.next}</small></span><strong className="op-link">{row.status === '服务中' ? '查看' : '启动服务'} →</strong></button>) : <div className="empty">当前没有待推进事项</div>}</div></DataPanel>
    <div className="service-entry-grid"><button className="service-entry" onClick={() => onOpen('catalog')}><span><b>查看服务目录</b><small>组织碳、碳足迹、CBAM、供应链碳、碳资产等可提供服务</small></span><strong>→</strong></button><button className="service-entry" onClick={() => onOpen('results')}><span><b>查看服务成果</b><small>查看企业已形成的报告、成果文件及相关服务记录</small></span><strong>→</strong></button></div>
  </>
}

function EnterpriseWorkbench({ scopedServices, scopedAssets, currentEnterpriseId, navigate }) {
  const current = enterprises.find(item => item.id === currentEnterpriseId), energy = getEnergyCarbonRecord(currentEnterpriseId), active = scopedServices.filter(item => item.status === '进行中'), finished = scopedServices.filter(item => item.status === '已完成')
  return <><PageHeader title="企业绿色服务工作台" subtitle={`${current?.name || '当前企业'}：查看自身绿色服务进度、成果和待处理事项。`} actions={<button className="btn primary" onClick={() => navigate('/data-management')}>进入企业数据管理</button>} />
    <div className="view-context enterprise-context"><b>企业执行视角</b><span>只看本企业、处理数据、补充凭证、完成服务任务</span></div>
    <MetricStrip metrics={[{ label:'当前碳排放', value:`${energy?.emissions?.toFixed(2) || '—'} 万tCO₂e`, note:'2026年1—7月' }, { label:'清洁能源占比', value:`${energy?.cleanRate || '—'}%`, note:energy?.cleanRate >= 85 ? '表现良好' : '建议提升' }, { label:'进行中服务', value:`${active.length}项`, note:'需要企业配合' }, { label:'待处理事项', value:`${active.length + (scopedAssets.some(item => item.status === '待完善') ? 1 : 0)}项`, note:'进入对应模块处理' }]} />
    <DataPanel title="我的服务进度" description="服务卡片展示当前阶段；进入专业模块处理明细和凭证"><div className="enterprise-service-status"><div><b>{active.length}</b><span>进行中</span></div><div><b>{finished.length}</b><span>已完成</span></div><div><b>{scopedAssets.length}</b><span>绿色权益</span></div><div className="enterprise-service-tip">企业侧只展示本企业数据，园区汇总和企业排名不会出现在这里。</div></div><div className="green-service-task-list">{scopedServices.length ? scopedServices.map(item => <div className="green-service-task" key={item.serviceId}><div><b>{item.serviceType}</b><small>{item.year} · {item.stage} · 来源：{item.source}</small></div><StatusTag tone={item.status === '已完成' ? 'ok' : 'warn'}>{item.status}</StatusTag><button className="op-btn" onClick={() => navigate(item.serviceType === '组织碳核查' ? '/organization-carbon' : item.serviceType === '产品碳足迹' ? '/product-carbon-footprint' : '/enterprise-assets')}>进入处理</button></div>) : <div className="empty">当前还没有配置专业服务</div>}</div></DataPanel>
    <div className="enterprise-green-next"><DataPanel title="下一步建议" description="按优先级处理，完成后会同步更新园区侧服务状态"><div className="green-next-item"><span className="priority-dot warn">1</span><div><b>补充企业数据与凭证</b><small>数据完整后才能用于碳核算、指标评价和服务成果。</small></div><button className="op-btn" onClick={() => navigate('/enterprise-data-reporting')}>去处理</button></div><div className="green-next-item"><span className="priority-dot">2</span><div><b>确认组织碳核查阶段</b><small>当前服务处于进行中，请跟进第三方核查材料。</small></div><button className="op-btn" onClick={() => navigate('/organization-carbon')}>查看服务</button></div></DataPanel></div>
  </>
}

function ServiceMatrix({ onSelect, scopedServices, scopedAssets }) {
  const types = ['组织碳核查', '产品碳足迹', 'CBAM', '供应链碳管理', '企业碳资产管理']
  const status = (enterpriseId, type) => {
    const item = greenServices.find(service => service.enterpriseId === enterpriseId && service.serviceType === type)
    if (item) return item.status === '已完成' ? '已完成' : item.status === '进行中' ? '服务中' : item.status
    if (type === '企业碳资产管理') {
      const assets = carbonAssets.filter(asset => asset.enterpriseId === enterpriseId && asset.applicable)
      if (assets.length) return assets.every(asset => terminalAssetStatus.has(asset.status)) ? '已完成' : '服务中'
    }
    return plannedServices[enterpriseId]?.[type] || '未申请'
  }
  return <DataPanel title="服务覆盖矩阵" description="统一服务状态：未申请、待启动、服务中、已完成；服务成果作为完成后的结果单独归档。"><div className="table-wrap"><table><thead><tr><th>企业</th>{types.map(type => <th key={type}>{type.replace('核查','')}</th>)}</tr></thead><tbody>{enterprises.map(enterprise => <tr key={enterprise.id} onClick={() => onSelect(enterprise.id)}><td className="item-name">{enterprise.name}</td>{types.map(type => { const value=status(enterprise.id, type); return <td key={type}><StatusTag tone={value === '未申请' ? 'gray' : value === '服务中' || value === '待启动' ? 'warn' : 'ok'}>{value}</StatusTag></td>})}</tr>)}</tbody></table></div></DataPanel>
}

export function EnterpriseGreenServicesPage() {
  const [portal, setPortal] = useState(null), navigate = useNavigate(), { role, currentEnterpriseId } = useSharedData()
  const scopedServices = role === 'enterprise' ? greenServices.filter(item => item.enterpriseId === currentEnterpriseId) : greenServices
  const scopedAssets = carbonAssets.filter(item => item.applicable && (role === 'committee' || item.enterpriseId === currentEnterpriseId))
  if (role === 'enterprise') return <div className="content enterprise-content"><EnterpriseWorkbench scopedServices={scopedServices} scopedAssets={scopedAssets} currentEnterpriseId={currentEnterpriseId} navigate={navigate} /></div>
  return <div className="content"><CommitteeOverview scopedServices={scopedServices} scopedAssets={scopedAssets} navigate={navigate} onOpen={setPortal} /><ServiceMatrix scopedServices={scopedServices} scopedAssets={scopedAssets} onSelect={id => navigate(`/enterprise-profile?enterpriseId=${id}`)} /><Modal open={!!portal} title={portal === 'catalog' ? '绿色服务目录' : '服务成果'} onClose={() => setPortal(null)} className="small"><div className="modal-body">{portal === 'catalog' ? <><p className="modal-lead">园区当前可提供以下绿色低碳服务，企业是否适用以服务需求识别结果为准。</p><div className="service-catalog-list">{['组织碳排放','产品碳足迹','CBAM管理','供应链碳管理','企业碳资产管理'].map(item => <div key={item}><b>{item}</b><span>查看服务说明与适用企业</span></div>)}</div></> : <div className="table-wrap"><table><thead><tr><th>企业</th><th>服务</th><th>状态</th><th>成果</th></tr></thead><tbody>{scopedServices.filter(item => item.result && item.result !== '—').map(item => <tr key={item.serviceId}><td>{enterpriseName(item.enterpriseId)}</td><td>{serviceLabels[item.serviceType] || item.serviceType}</td><td><StatusTag tone="ok">已完成</StatusTag></td><td>{item.result}</td></tr>)}</tbody></table></div>}</div></Modal></div>
}
