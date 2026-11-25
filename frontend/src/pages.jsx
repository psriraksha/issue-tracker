import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from './api';
import { useAuth } from './auth';

const STATUSES = ['Open', 'In Progress', 'Closed'];
const msg = e => e.response?.data?.message || 'Something went wrong';
const Badge = ({ s }) => <span className={'badge ' + s.replace(' ', '')}>{s}</span>;

export function Login({ admin }) {
  const { login } = useAuth(), nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '' }), [err, setErr] = useState('');
  const submit = async e => {
    e.preventDefault();
    try { const { data } = await api.post(admin ? '/auth/admin-login' : '/auth/login', f); login(data); nav('/'); }
    catch (x) { setErr(msg(x)); }
  };
  return (<form className="card auth" onSubmit={submit}>
    <h2>{admin ? 'Admin Login' : 'User Login'}</h2>{err && <p className="err">{err}</p>}
    <input type="email" placeholder="Email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} required />
    <input type="password" placeholder="Password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} required />
    <button>Login</button>
    <p>{admin ? <Link to="/login">User login</Link> : <><Link to="/register">Register</Link> · <Link to="/admin-login">Admin login</Link></>}</p>
  </form>);
}

export function Register() {
  const { login } = useAuth(), nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '' }), [err, setErr] = useState('');
  const submit = async e => {
    e.preventDefault();
    try { const { data } = await api.post('/auth/register', f); login(data); nav('/'); } catch (x) { setErr(msg(x)); }
  };
  const set = k => e => setF({ ...f, [k]: e.target.value });
  return (<form className="card auth" onSubmit={submit}>
    <h2>Register</h2>{err && <p className="err">{err}</p>}
    <input placeholder="Name" value={f.name} onChange={set('name')} required />
    <input type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
    <input type="password" placeholder="Password (min 6 chars)" value={f.password} onChange={set('password')} required minLength={6} />
    <button>Create account</button><p><Link to="/login">Already registered? Login</Link></p>
  </form>);
}

export function Dashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get('/dashboard').then(r => setD(r.data)); }, []);
  if (!d) return <p>Loading…</p>;
  const cards = [['Total issues', d.total], ['Open', d.byStatus.Open], ['In Progress', d.byStatus['In Progress']],
    ['Closed', d.byStatus.Closed], ['Assigned to me', d.assignedToMe], ['Unassigned', d.unassigned]];
  return (<><h2>Dashboard</h2><div className="grid">
    {cards.map(([l, v]) => <div className="card stat" key={l}><b>{v}</b><span>{l}</span></div>)}</div></>);
}

function IssueForm({ initial = {}, users, canAssign = true, showStatus, onSubmit, label }) {
  const [f, setF] = useState({ title: '', description: '', priority: 'Medium', status: 'Open', assignedTo: '', ...initial });
  const set = k => e => setF({ ...f, [k]: e.target.value });
  return (<form className="card" onSubmit={e => { e.preventDefault(); onSubmit(f); }}>
    <input placeholder="Title" value={f.title} onChange={set('title')} required />
    <textarea placeholder="Description" rows={4} value={f.description} onChange={set('description')} />
    <div className="row">
      <select value={f.priority} onChange={set('priority')}>{['Low', 'Medium', 'High'].map(p => <option key={p}>{p}</option>)}</select>
      {showStatus && <select value={f.status} onChange={set('status')}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>}
      {canAssign && <select value={f.assignedTo} onChange={set('assignedTo')}>
        <option value="">Unassigned</option>{users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}</select>}
    </div>
    <button>{label}</button>
  </form>);
}

export function Issues() {
  const { user } = useAuth();
  const [list, setList] = useState([]), [users, setUsers] = useState([]), [show, setShow] = useState(false), [err, setErr] = useState('');
  const [q, setQ] = useState({ status: '', search: '', mine: false });
  const load = () => api.get('/issues', { params: q }).then(r => setList(r.data)).catch(e => setErr(msg(e)));
  useEffect(() => { load(); }, [q]);
  useEffect(() => { api.get('/users').then(r => setUsers(r.data)); }, []);
  const create = async f => { try { await api.post('/issues', f); setShow(false); load(); } catch (e) { setErr(msg(e)); } };
  return (<>
    <div className="row"><h2>Issues</h2><span className="sp" /><button onClick={() => setShow(!show)}>{show ? 'Cancel' : '+ New issue'}</button></div>
    {err && <p className="err">{err}</p>}
    {show && <IssueForm users={users} canAssign={user.role === 'admin'} onSubmit={create} label="Create issue" />}
    <div className="row filters">
      <input placeholder="Search title…" value={q.search} onChange={e => setQ({ ...q, search: e.target.value })} />
      <select value={q.status} onChange={e => setQ({ ...q, status: e.target.value })}><option value="">All statuses</option>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
      <label><input type="checkbox" checked={q.mine} onChange={e => setQ({ ...q, mine: e.target.checked })} /> Assigned to me</label>
    </div>
    <table className="card"><thead><tr><th>Title</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Created by</th></tr></thead>
      <tbody>{list.map(i => <tr key={i._id}><td><Link to={'/issues/' + i._id}>{i.title}</Link></td><td><Badge s={i.status} /></td>
        <td>{i.priority}</td><td>{i.assignedTo?.name || '—'}</td><td>{i.createdBy?.name}</td></tr>)}
        {!list.length && <tr><td colSpan="5">No issues found</td></tr>}</tbody></table>
  </>);
}

export function IssueDetail() {
  const { id } = useParams(), nav = useNavigate(), { user } = useAuth();
  const [i, setI] = useState(null), [users, setUsers] = useState([]), [edit, setEdit] = useState(false), [text, setText] = useState(''), [err, setErr] = useState('');
  const load = () => api.get('/issues/' + id).then(r => setI(r.data)).catch(e => setErr(msg(e)));
  useEffect(() => { load(); api.get('/users').then(r => setUsers(r.data)); }, [id]);
  if (!i) return <p className={err ? 'err' : ''}>{err || 'Loading…'}</p>;
  const owner = i.createdBy?._id === user.id, admin = user.role === 'admin', canEdit = admin || owner, canStatus = admin;
  const save = async b => { try { await api.put('/issues/' + id, b); setEdit(false); setErr(''); load(); } catch (e) { setErr(msg(e)); } };
  const del = async () => { if (confirm('Delete this issue?')) { try { await api.delete('/issues/' + id); nav('/issues'); } catch (e) { setErr(msg(e)); } } };
  const comment = async e => { e.preventDefault(); try { await api.post(`/issues/${id}/comments`, { text }); setText(''); load(); } catch (x) { setErr(msg(x)); } };
  return (<>
    <p><Link to="/issues">← Back</Link></p>{err && <p className="err">{err}</p>}
    {edit ? <IssueForm showStatus={admin} canAssign={admin} users={users} label="Save changes"
      onSubmit={f => save(admin ? f : { title: f.title, description: f.description, priority: f.priority })}
      initial={{ title: i.title, description: i.description, priority: i.priority, status: i.status, assignedTo: i.assignedTo?._id || '' }} /> :
      <div className="card"><div className="row"><h2>{i.title}</h2><span className="sp" /><Badge s={i.status} /></div>
        <p>{i.description || 'No description'}</p>
        <p className="muted">Priority: {i.priority} · Assigned to: {i.assignedTo?.name || 'Unassigned'} · Created by {i.createdBy?.name} on {new Date(i.createdAt).toLocaleDateString()}</p>
        <div className="row">
          {canStatus && <select value={i.status} onChange={e => save({ status: e.target.value })}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>}
          {canEdit && <><button onClick={() => setEdit(true)}>Edit / Assign</button><button className="danger" onClick={del}>Delete</button></>}
        </div></div>}
    <h3>Comments ({i.comments.length})</h3>
    {i.comments.map(c => <div className="card" key={c._id}><b>{c.author?.name || 'User'}</b> <span className="muted">{new Date(c.createdAt).toLocaleString()}</span><p>{c.text}</p></div>)}
    <form className="card" onSubmit={comment}><textarea rows={3} placeholder="Add a comment…" value={text} onChange={e => setText(e.target.value)} required /><button>Post comment</button></form>
  </>);
}

