import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader.jsx'
import { Tabs } from '../components/Tabs.jsx'
import { MetricStrip } from '../components/MetricStrip.jsx'
import { DataPanel } from '../components/DataPanel.jsx'
import { StatusTag } from '../components/StatusTag.jsx'
import { Modal } from '../components/Modal.jsx'
import { enterprises, useSharedData } from '../mock/sharedStore.js'

export function EnterpriseDataReportingPage() {
  const navigate = useNavigate()
  const { items, currentTask, currentEnterpriseId, updateItem, uploadVoucher, submitTask } = useSharedData()
  const [category, setCategory] = useState('all'), [detail, setDetail] = useState(null), [message, setMessage] = useState(''), [guide, setGuide] = useState(false)
  const categories = useMemo(() => [...new Set(items.map(item => item.category).filter(Boolean))], [items])
  const activeCategory = category === 'all' ? 'all' : category || categories[0]
  const current = activeCategory === 'all' ? items : items.filter(item => item.category === activeCategory)
  const supplementItems = current.filter(item => item.source !== '系统已有')
  const systemItems = current.filter(item => item.source === '系统已有')
  const pending = items.filter(item => item.required && !item.value).length
  const vouchers = items.filter(item => item.voucher && !item.voucherUploaded).length
  const completed = pending === 0 && vouchers === 0
  const taskUnits = items.filter(item => item.required).length + items.filter(item => item.voucher).length
  const completedUnits = Math.max(0, taskUnits - pending - vouchers)
  const enterprise = enterprises.find(item => item.id === currentEnterpriseId)
  const returned = currentTask?.status === '已退回'
  const locked = ['已提交', '已入库', '已关闭'].includes(currentTask?.status)
  const submit = () => { const result = submitTask(currentTask?.taskId); setMessage(result.ok ? '提交成功，已进入园区审核。' : result.reason) }
  const saveDraft = () => setMessage('草稿已保存。')
  return <div className="content enterprise-content"><PageHeader title="填报任务" subtitle="围绕园区本次任务补充系统暂未获取的数据和凭证。" actions={<><button className="btn" onClick={() => setGuide(true)}>填报说明</button><button className="btn primary" disabled={!currentTask || locked} onClick={submit}>{locked ? '已提交' : '提交填报'}</button></>} />
    <div className="report-task-summary"><div><span>任务名称</span><b>{currentTask?.period ? `${currentTask.period}企业数据补充任务` : '暂无年度任务'}</b></div><div><span>统计年度</span><b>{currentTask?.period?.replace('年度','') || '2026'}</b></div><div><span>截止日期</span><b>{currentTask?.deadline || '—'}</b></div><div><span>当前状态</span><StatusTag tone={returned ? 'warn' : completed ? 'ok' : 'gray'}>{returned ? '需修改' : currentTask?.status || '—'}</StatusTag></div></div>
    {message && <div className={`notice ${message.includes('成功') || message.includes('保存') ? 'success' : 'warning'}`}>{message}</div>}{returned && <div className="notice warning">本次填报有数据需要修改：{currentTask.reviewNote || '请核对填报数据和凭证。'}</div>}<div className="info-callout">系统已有数据无需重复填写；请完成标记为“企业填报”的数据项及必要凭证。</div>
    <MetricStrip metrics={[{label:'任务完成度',value:`${completedUnits} / ${taskUnits}`,note:'按数据项与凭证要求统计'},{label:'待补数据',value:pending+'项',note:'需要企业补充'},{label:'待补凭证',value:vouchers+'项',note:'已有数据但缺少证明材料'},{label:'系统已获取',value:items.filter(item => item.source === '系统已有').length+'项',note:'无需重复填写'}]} />
    <div className="report-workbench-note"><b>本次任务只补缺失项</b><span>系统已有数据由数据管理沉淀并自动带入；如发现数值有误，请反馈数据问题，不在本任务中直接修改底层数据。</span><button className="op-btn" onClick={() => navigate('/data-issues')}>反馈数据问题 →</button></div>
    <Tabs tabs={[{value:'all',label:`全部待处理 ${items.filter(item => item.source !== '系统已有').length}`}, ...categories.map(value => ({ value, label:value }))]} active={activeCategory} onChange={setCategory} />
    <DataPanel title="需要你处理" description={`${enterprise?.name || '当前企业'}本次任务中的补充数据与凭证`} actions={<button className="btn" onClick={saveDraft}>保存草稿</button>}><div className="table-wrap"><table className="report-action-table"><thead><tr><th>数据项</th><th>当前情况</th><th>需要处理</th><th>状态</th><th>操作</th></tr></thead><tbody>{supplementItems.length ? supplementItems.map(item => { const needsRevision = returned && item.reviewStatus === '已退回'; const status = needsRevision ? '待确认' : item.value ? (item.voucher && !item.voucherUploaded ? '待补凭证' : '已就绪') : '待补充'; return <tr key={item.id}><td className="item-name">{item.name}<small className="table-subnote">{item.category}</small></td><td>{item.value ? `${item.value} ${item.unit}` : '暂无数据'}</td><td>{item.value && item.voucher && !item.voucherUploaded ? '上传对应凭证' : item.voucher ? '补充年度数据并上传凭证' : '补充年度数据'}</td><td><StatusTag tone={status === '已就绪' ? 'ok' : 'warn'}>{status}</StatusTag></td><td>{item.value && item.voucher && !item.voucherUploaded ? <button className="op-btn" disabled={locked} onClick={() => uploadVoucher(item.id)}>上传</button> : <button className="op-btn" disabled={locked} onClick={() => setDetail(item)}>填写</button>}</td></tr> }) : <tr><td colSpan="5" className="empty-cell">当前暂无待处理项</td></tr>}</tbody></table></div></DataPanel>
    <details className="system-data-collapsible"><summary>系统已自动获取 {systemItems.length}项 ✓ <span>这些数据无需重复填写</span></summary><div className="table-wrap"><table><thead><tr><th>数据项</th><th>当前值</th><th>来源</th><th>状态</th><th>操作</th></tr></thead><tbody>{systemItems.length ? systemItems.map(item => <tr key={item.id}><td className="item-name">{item.name}</td><td><b>{item.value || '—'}</b> {item.unit}</td><td>系统采集</td><td><StatusTag tone="ok">已就绪</StatusTag></td><td><button className="op-btn" onClick={() => setDetail(item)}>查看来源</button><button className="op-btn" onClick={() => navigate('/data-issues')}>反馈问题</button></td></tr>) : <tr><td colSpan="5" className="empty-cell">暂无系统自动获取数据</td></tr>}</tbody></table></div></details>
    <div className="modal-foot page-actions"><button className="btn" onClick={saveDraft}>保存草稿</button><button className="btn primary" disabled={!currentTask || locked} onClick={submit}>{locked ? '已提交' : '提交填报'}</button></div>
    <Modal open={!!detail} title={detail?.name || '填报说明'} onClose={() => setDetail(null)} className="small">{detail && <div className="modal-body"><div className="kv"><div className="kv-item"><label>数据项</label>{detail.name}</div><div className="kv-item"><label>当前值</label>{detail.value || '待填写'} {detail.unit}</div><div className="kv-item"><label>填写说明</label>{detail.note || '请按当前企业实际情况填写本年度数据。'}</div><div className="kv-item"><label>数据用途</label>{detail.businessLinks?.join('、') || '用于园区年度能碳数据汇总。'}</div><div className="kv-item"><label>凭证要求</label>{detail.voucherRequired ? '请上传与本数据项对应的合同、结算凭证或证明材料。' : '无需上传凭证。'}</div></div></div>}</Modal><Modal open={guide} title="填报说明" onClose={() => setGuide(false)} className="small"><div className="modal-body"><p>请只填写数据管理中标记为“企业填报”的数据项；系统已有数据无需重复填写，必要凭证请跟随数据项上传。</p><p>提交前请确认必填数据和必要凭证均已完成。</p></div></Modal>
  </div>
}
