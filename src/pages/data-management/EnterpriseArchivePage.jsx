import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader.jsx'
import { DataPanel } from '../../components/DataPanel.jsx'
import { Modal } from '../../components/Modal.jsx'
import { FormField, Table } from './shared.jsx'

const energyOptions = ['电力', '天然气', '热力', '其他']
const attributeOptions = [
  ['isKeyEnterprise', '重点企业'],
  ['isKeyEnergyUser', '重点用能企业'],
  ['greenFactory', '绿色工厂'],
  ['zeroCarbonFactory', '零碳工厂'],
]

const attributeLabels = enterprise => attributeOptions.map(([name, label]) => enterprise[name] && label).filter(Boolean)
const coordinateParts = value => {
  const text = String(value || '')
  return {
    longitude: text.match(/(?:东经|经度)\s*([-+\d.]+)/)?.[1] || '',
    latitude: text.match(/(?:北纬|纬度)\s*([-+\d.]+)/)?.[1] || '',
  }
}
const coordinateText = (longitude, latitude) => longitude && latitude ? `东经${longitude}° / 北纬${latitude}°` : ''

function AttributeTags({ enterprise }) {
  return <div className="enterprise-attribute-tags">{attributeLabels(enterprise).map(label => <span key={label}>{label}</span>)}</div>
}

function RequiredLabel({ children }) {
  return <>{children}<em className="enterprise-required-mark">*</em></>
}

function FieldError({ children }) {
  return children ? <small className="enterprise-field-error">{children}</small> : null
}

function EnergyChoices({ enterprise }) {
  const features = enterprise?.energyFeatures || []
  return <div className="enterprise-choice-tags">{energyOptions.map(option => {
    const checked = option === '其他' ? features.some(item => !energyOptions.includes(item)) : features.includes(option)
    return <label className={checked ? 'selected' : ''} key={option}><input type="checkbox" name="energyFeatures" value={option} defaultChecked={checked} />{option}</label>
  })}</div>
}

export function EnterpriseArchivePage({ enterpriseRows, setEnterpriseRows, records, nodes, setIssues, navigate }) {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const [query, setQuery] = useState('')
  const [detail, setDetail] = useState(null)
  const [editing, setEditing] = useState(null)
  const [exitTarget, setExitTarget] = useState(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const id = params.get('enterpriseId')
    if (id) setDetail(enterpriseRows.find(item => item.enterpriseId === id) || null)
  }, [location.search])

  const filtered = enterpriseRows.filter(item => (!query || `${item.name}${item.creditCode}${item.mainProducts}`.includes(query)))

  const save = event => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const current = editing?.enterpriseId
    const id = current || `ent-${Date.now()}`
    const name = String(form.get('name') || '').trim()
    const creditCode = String(form.get('creditCode') || '').trim()
    const longitude = String(form.get('longitude') || '').trim()
    const latitude = String(form.get('latitude') || '').trim()
    const errors = {}
    if (!name) errors.name = '请输入企业名称。'
    if (!creditCode) errors.creditCode = '请输入统一社会信用代码。'
    else if (creditCode.length !== 18) errors.creditCode = '统一社会信用代码应为18位。'
    else if (!current && enterpriseRows.some(item => String(item.creditCode || '').trim() === creditCode)) errors.creditCode = '该统一社会信用代码已存在企业档案。'
    if (longitude || latitude) {
      if (!longitude || !latitude) {
        errors.longitude = '请同时填写经度和纬度。'
        errors.latitude = '请同时填写经度和纬度。'
      } else if (!Number.isFinite(Number(longitude)) || Number(longitude) < -180 || Number(longitude) > 180) {
        errors.longitude = '经度应为 -180 至 180 之间的数值。'
      } else if (!Number.isFinite(Number(latitude)) || Number(latitude) < -90 || Number(latitude) > 90) {
        errors.latitude = '纬度应为 -90 至 90 之间的数值。'
      }
    }
    if (Object.keys(errors).length) {
      setFormErrors(errors)
      return
    }
    const next = {
      ...(editing || {}),
      id,
      enterpriseId: id,
      name,
      creditCode,
      industry: String(form.get('industry') || '').trim(),
      address: String(form.get('address') || '').trim(),
      location: coordinateText(longitude, latitude),
      mainProducts: String(form.get('mainProducts') || '').trim(),
      energyFeatures: form.getAll('energyFeatures'),
      isKeyEnterprise: form.get('isKeyEnterprise') === 'on',
      isKeyEnergyUser: form.get('isKeyEnergyUser') === 'on',
      greenFactory: form.get('greenFactory') === 'on',
      zeroCarbonFactory: form.get('zeroCarbonFactory') === 'on',
      managedStatus: editing?.managedStatus || '已纳管',
      contact: String(form.get('contact') || '').trim(),
      phone: String(form.get('phone') || '').trim(),
      status: '正常',
    }
    setEnterpriseRows(previous => current
      ? previous.map(item => item.enterpriseId === current ? next : item)
      : [...previous, next])

    if (next.managedStatus === '已纳管' && !nodes.some(item => item.enterpriseId === id && item.nodeRole === 'CONSUMER')) {
      const accessIssue = {
        issueId: `issue-energy-access-${id}`,
        objectType: 'ENERGY_FLOW',
        objectId: `enterprise-${id}-energy-access`,
        enterpriseId: id,
        dataItemCode: 'ENERGY_FLOW_RELATION',
        period: '长期有效',
        issueType: '关系不完整',
        currentValue: '—',
        sourceRecordId: '',
        reason: '尚未配置能源接入关系。',
        responsibleParty: 'PARK',
        relatedIOC: ['能源流向态势'],
        relatedIndicator: [],
        status: '待处理',
        createdAt: '刚刚',
        resolvedAt: '',
        note: '请在能源与设施中补充企业用能节点和能源流向关系。',
      }
      setIssues(previous => previous.some(item => item.enterpriseId === id && item.issueType === '关系不完整' && item.status !== '已解决')
        ? previous
        : [accessIssue, ...previous])
    }
    setEditing(null)
    setFormErrors({})
    setMoreOpen(false)
    setNotice(current ? '企业档案已更新。' : '企业档案已创建。')
  }

  const exitEnterprise = enterprise => {
    const referenced = records.some(item => item.enterpriseId === enterprise.enterpriseId)
    setEnterpriseRows(previous => previous.map(item => item.enterpriseId === enterprise.enterpriseId
      ? { ...item, managedStatus: '已退出' }
      : item))
    setDetail(null)
    setEditing(null)
    setExitTarget(null)
    setMoreOpen(false)
    setNotice(referenced ? '该企业存在业务引用，已标记为“企业退出”并保留历史关联。' : '企业已退出园区。')
  }

  return <div className="content dm-page">
    <PageHeader title="企业档案" subtitle="维护园区企业基础档案，为业务数据、能源关系和零碳指标管理提供基础支撑。" actions={<button className="btn primary" onClick={() => { setFormErrors({}); setMoreOpen(false); setEditing({}) }}>新增企业档案</button>} />
    {notice && <div className="notice success">{notice}</div>}
    <div className="filters"><input className="search-input" style={{ flex: '0 1 360px', minWidth: '260px' }} value={query} onChange={event => setQuery(event.target.value)} placeholder="企业名称、信用代码、主要产品" /></div>
    <DataPanel title="企业档案列表" description="查看和维护园区企业基础信息及企业属性。">
      <Table className="enterprise-archive-table" headers={['企业', '所属行业', '主要产品', '企业属性', '操作']} rows={filtered.map(item => ({
        key: item.enterpriseId,
        cells: [<span>{item.name}</span>, item.industry, item.mainProducts || '—', <AttributeTags enterprise={item} />, <div className="enterprise-row-actions"><button className="op-btn" onClick={() => { setFormErrors({}); setDetail(item) }}>查看</button><button className="op-btn" onClick={() => { setFormErrors({}); setMoreOpen(false); setEditing(item) }}>编辑</button></div>],
      }))} />
    </DataPanel>

    <Modal open={!!detail} title="企业档案" onClose={() => setDetail(null)} className="detail-modal">
      <div className="modal-body">
        {detail && <div className="enterprise-detail-sections">
          <section className="enterprise-detail-section"><h3>基本信息</h3><div className="dm-detail-grid enterprise-archive-detail-grid">
            <div><label>企业名称</label><b>{detail.name}</b></div>
            <div><label>统一社会信用代码</label><b>{detail.creditCode}</b></div>
            <div><label>所属行业</label><b>{detail.industry}</b></div>
            <div><label>主要产品</label><b>{detail.mainProducts || '—'}</b></div>
          </div></section>
          <section className="enterprise-detail-section"><h3>联系信息</h3><div className="dm-detail-grid enterprise-archive-detail-grid">
            <div><label>企业联系人</label><b>{detail.contact || '—'}</b></div>
            <div><label>联系电话</label><b>{detail.phone || '—'}</b></div>
            <div className="wide"><label>地址</label><p>{detail.address || '—'}</p></div>
          </div></section>
          <section className="enterprise-detail-section"><h3>能源与空间信息</h3><div className="dm-detail-grid enterprise-archive-detail-grid">
            <div><label>主要能源</label><b>{detail.energyFeatures?.join('、') || '—'}</b></div>
            <div><label>经纬度</label><b>{detail.location || '—'}</b></div>
          </div></section>
          <section className="enterprise-detail-section"><h3>企业属性</h3><div className="enterprise-detail-attributes"><AttributeTags enterprise={detail} /></div></section>
        </div>}
      </div>
      <div className="modal-foot"><button className="btn" onClick={() => navigate(`/business-data?enterpriseId=${detail?.enterpriseId}`)}>查看业务数据</button><button className="btn primary" onClick={() => { setEditing(detail); setDetail(null) }}>编辑档案</button></div>
    </Modal>

    <Modal open={!!editing} title={editing?.enterpriseId ? `编辑企业档案｜${editing.name}` : '新增企业档案'} onClose={() => setEditing(null)} className="detail-modal">
      <form onSubmit={save}>
        <div className="modal-body">
          <div className="dm-form-grid enterprise-archive-form-grid">
            <FormField label={<RequiredLabel>企业名称</RequiredLabel>}><input name="name" autoComplete="off" defaultValue={editing?.name || ''} /><FieldError>{formErrors.name}</FieldError></FormField>
            <FormField label={<RequiredLabel>统一社会信用代码</RequiredLabel>}><input name="creditCode" autoComplete="off" defaultValue={editing?.creditCode || ''} readOnly={Boolean(editing?.enterpriseId)} /><FieldError>{formErrors.creditCode}</FieldError></FormField>
            <FormField label="所属行业"><input name="industry" autoComplete="off" defaultValue={editing?.industry || ''} /></FormField>
            <FormField label="主要产品"><input name="mainProducts" defaultValue={editing?.mainProducts || ''} /></FormField>
            <FormField label="主要能源"><EnergyChoices enterprise={editing} /></FormField>
            <FormField label="企业联系人"><input name="contact" autoComplete="off" defaultValue={editing?.contact || ''} /></FormField>
            <FormField label="联系电话"><input name="phone" autoComplete="off" defaultValue={editing?.phone || ''} /></FormField>
            <FormField label="地址" wide><input name="address" autoComplete="off" defaultValue={editing?.address || ''} /></FormField>
            <div className="enterprise-coordinate-fields wide"><span>经纬度</span><div><label>经度<input name="longitude" type="number" min="-180" max="180" step="any" autoComplete="off" defaultValue={coordinateParts(editing?.location).longitude} /><FieldError>{formErrors.longitude}</FieldError></label><label>纬度<input name="latitude" type="number" min="-90" max="90" step="any" autoComplete="off" defaultValue={coordinateParts(editing?.location).latitude} /><FieldError>{formErrors.latitude}</FieldError></label></div></div>
            <div className="enterprise-attribute-field wide"><span>企业属性</span><div className="enterprise-choice-tags">{attributeOptions.map(([name, label]) => <label className={editing?.[name] ? 'selected' : ''} key={name}><input type="checkbox" name={name} defaultChecked={Boolean(editing?.[name])} />{label}</label>)}</div></div>
          </div>
        </div>
        <div className="modal-foot">{editing?.enterpriseId && <div className="enterprise-more-actions"><button type="button" className="enterprise-more-trigger" onClick={() => setMoreOpen(open => !open)} aria-expanded={moreOpen}>更多操作 ▾</button>{moreOpen && <div className="enterprise-more-menu"><button type="button" onClick={() => { setExitTarget(editing); setMoreOpen(false) }}>标记为已退出园区</button></div>}</div>}<div className="enterprise-form-actions"><button type="button" className="btn" onClick={() => { setEditing(null); setFormErrors({}); setMoreOpen(false) }}>取消</button><button className="btn primary">保存</button></div></div>
      </form>
    </Modal>

    <Modal open={!!exitTarget} title="确认标记企业已退出园区？" onClose={() => setExitTarget(null)} className="small">
      <div className="modal-body"><p className="enterprise-exit-confirmation">确认后，该企业将不再纳入当前园区的数据统计，已有历史数据仍会保留。该操作不会删除历史数据。</p></div>
      <div className="modal-foot"><button className="btn" onClick={() => setExitTarget(null)}>取消</button><button className="btn enterprise-exit-confirm-btn" onClick={() => exitEnterprise(exitTarget)}>确认退出</button></div>
    </Modal>
  </div>
}
