import { PageHeader } from '../components/PageHeader.jsx'
export function PlaceholderPage({ title }) { return <div className="content"><PageHeader title={title} /><div className="placeholder-card"><h2>{title}</h2><p>页面容器已建立，业务结构和交互细节待确认。</p></div></div> }
