import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useEnterpriseArchive, effectiveProfile } from '../../mock/enterpriseArchiveStore.js'
import { ArchiveDetailDrawer } from '../../components/EnterpriseArchiveViews.jsx'
import '../../enterprise-archive-views.css'

const types = ['工业企业', '服务企业', '其他企业']
const included = ['已纳管', '待纳入', '已退出']
export function EnterpriseArchivePage({ navigate }) {
  const { search } = useLocation(), archive = useEnterpriseArchive()
  const params = new URLSearchParams(search)
  const [draft, setDraft] = useState({ name: '', industry: '', type: '', status: '' })
  const [filters, setFilters] = useState(draft)
  const [selectedId, setSelectedId] = useState(params.get('enterpriseId') || '')
  const [page, setPage] = useState(1)
  const profiles = archive.profiles.map(profile => effectiveProfile(archive, profile.enterpriseId))
  const pending = archive.changes.filter(change => change.status === '待园区确认')
  const filtered = profiles.filter(profile => (!filters.name || profile.name.includes(filters.name.trim())) && (!filters.industry || profile.industry === filters.industry) && (!filters.type || profile.enterpriseType === filters.type) && (!filters.status || profile.managedStatus === filters.status))
  const shown = filtered.slice((page - 1) * 10, page * 10)
  const open = id => { setSelectedId(id); navigate(`/enterprise-archive?enterpriseId=${encodeURIComponent(id)}`) }
  const close = () => { setSelectedId(''); navigate('/enterprise-archive') }
  return <div className="content dm-page ea-page"><div className="ea-page-head"><h1>园区企业档案</h1><p>统一企业档案，关联业务记录与管理关系。</p></div><div className="ea-metrics">{[['企业总数', profiles.length, '▤'], ['已纳入企业数', profiles.filter(profile => profile.managedStatus === '已纳管').length, '✓'], ['待确认变更', pending.length, '◷']].map(([label, value, icon]) => <section key={label}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></section>)}</div>
    <form className="ea-filters" onSubmit={e => { e.preventDefault(); setFilters(draft); setPage(1) }}><label>企业名称<input placeholder="请输入企业名称" aria-label="企业名称" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}/></label><label>所属行业<select value={draft.industry} onChange={e => setDraft({ ...draft, industry: e.target.value })}><option value="">全部</option>{[...new Set(profiles.map(profile => profile.industry))].map(value => <option key={value}>{value}</option>)}</select></label><label>企业类型<select value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value })}><option value="">全部</option>{types.map(value => <option key={value}>{value}</option>)}</select></label><label>纳入状态<select value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value })}><option value="">全部</option>{included.map(value => <option key={value}>{value}</option>)}</select></label><button className="btn primary">查询</button><button type="button" className="btn" onClick={() => { setDraft({name:'',industry:'',type:'',status:''});setFilters({name:'',industry:'',type:'',status:''});setPage(1) }}>重置</button></form>
    <section className="ea-card ea-list"><header><h2>企业列表（{filtered.length}）</h2></header><div className="table-wrap"><table className="ea-table"><thead><tr>{['企业名称', '所属行业', '企业类型', '主要产品', '纳入状态', '待确认变更', '操作'].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{shown.map(profile => <tr key={profile.enterpriseId}><td title={profile.name}>{profile.name}</td><td title={profile.industry}>{profile.industry}</td><td title={profile.enterpriseType}>{profile.enterpriseType}</td><td title={profile.mainProducts}>{profile.mainProducts}</td><td><span className="ea-badge ok">{profile.managedStatus}</span></td><td>{pending.filter(change => change.enterpriseId === profile.enterpriseId).length || '—'}</td><td><button className="op-btn" onClick={() => open(profile.enterpriseId)}>查看</button></td></tr>)}</tbody></table>{!shown.length && <div className="ea-empty">暂无匹配企业</div>}</div><footer><span>共 {filtered.length} 家</span><div><button className="btn" disabled={page === 1} onClick={() => setPage(value => value - 1)}>上一页</button><span>{page} / {Math.max(1, Math.ceil(filtered.length / 10))}</span><button className="btn" disabled={page * 10 >= filtered.length} onClick={() => setPage(value => value + 1)}>下一页</button></div></footer></section>
    {selectedId && <ArchiveDetailDrawer key={selectedId} enterpriseId={selectedId} onClose={close} initialTab={params.has('changeId') ? 'changes' : 'basic'}/>}
  </div>
}
