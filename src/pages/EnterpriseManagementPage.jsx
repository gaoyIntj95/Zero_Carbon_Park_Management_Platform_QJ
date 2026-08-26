import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.jsx'
import { MetricStrip } from '../components/MetricStrip.jsx'
import { DataPanel } from '../components/DataPanel.jsx'
import { StatusTag } from '../components/StatusTag.jsx'
import { enterprises, energyCarbonData, greenServices, useSharedData } from '../mock/sharedStore.js'

export function EnterpriseManagementPage() {
  const navigate = useNavigate()
  const { tasks } = useSharedData()
  const rows = useMemo(() => enterprises.map(enterprise => {
    const energy = energyCarbonData.find(item => item.enterpriseId === enterprise.id)
    const services = greenServices.filter(item => item.enterpriseId === enterprise.id)
    const task = tasks.find(item => item.enterpriseId === enterprise.id)
    const risk = energy?.cleanRate < 75 || task?.status === '填报中' || services.some(item => item.status === '进行中')
    return { ...enterprise, energy, services, task, risk }
  }), [tasks])
  const riskCount = rows.filter(item => item.risk).length
  const serviceCount = rows.filter(item => item.services.length).length
  return <div className="content">
    <PageHeader title="企业管理" subtitle="管理员企业层级：查看企业画像、数据状态和服务进度，必要时下钻处理或发起督办。" />
    <MetricStrip metrics={[{ label:'园区企业', value:`${rows.length}家`, note:'纳入园区管理范围' }, { label:'已纳入服务', value:`${serviceCount}家`, note:'至少存在一项绿色服务' }, { label:'待关注企业', value:`${riskCount}家`, note:'按能碳、填报和服务状态识别' }, { label:'数据填报完成', value:`${rows.filter(item => ['已提交','已入库'].includes(item.task?.status)).length}/${rows.length}`, note:'当前填报周期' }]} />
    <DataPanel title="企业清单" description="点击“查看画像”进入企业层级；管理员可查看并审核，不直接代替企业填报。">
      <div className="table-wrap"><table className="enterprise-management-table"><thead><tr><th>企业</th><th>行业</th><th>综合能耗</th><th>碳排放</th><th>清洁能源占比</th><th>服务状态</th><th>填报状态</th><th>操作</th></tr></thead><tbody>{rows.map(item => <tr key={item.id} className={item.risk ? 'enterprise-risk-row' : ''}><td className="item-name">{item.name}{item.risk && <span className="enterprise-risk-mark">重点</span>}</td><td>{item.industry}</td><td>{item.energy?.energy || '—'} 万tce</td><td>{item.energy?.emissions?.toFixed(2) || '—'} 万tCO₂e</td><td>{item.energy?.cleanRate || '—'}%</td><td><StatusTag tone={item.services.some(service => service.status === '进行中') ? 'warn' : item.services.length ? 'ok' : 'gray'}>{item.services.some(service => service.status === '进行中') ? '进行中' : item.services.length ? '已纳入' : '未纳入'}</StatusTag></td><td><StatusTag tone={['已提交','已入库'].includes(item.task?.status) ? 'ok' : 'warn'}>{item.task?.status || '暂无任务'}</StatusTag></td><td><button className="op-btn" onClick={() => navigate(`/enterprise-profile?enterpriseId=${item.id}`)}>查看画像</button></td></tr>)}</tbody></table></div>
    </DataPanel>
  </div>
}
