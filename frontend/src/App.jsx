import { useEffect, useMemo, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const initial = { username: '', password: '', totp: '' };

export default function App() {
  const [form, setForm] = useState(initial);
  const [token, setToken] = useState('');
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('overview');
  const [newRecord, setNewRecord] = useState({ title: '', category: '', details: '' });
  const [users, setUsers] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'inputer' });
  const canManage = useMemo(() => user && ['admin','manager'].includes(user.role), [user]);

  async function api(path, options = {}) {
    const response = await fetch(API + path, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  }
  async function load() {
    try {
      const [r, s] = await Promise.all([api('/records'), api('/reports/summary')]);
      setRecords(r.records); setSummary(s);
      if (canManage) { const u = await api('/users'); setUsers(u.users); }
    } catch (e) { setMessage(e.message); }
  }
  useEffect(() => { if (token && user && !enrollment) load(); }, [token, user, enrollment]);
  async function login(e) {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      const data = await api('/auth/login', { method: 'POST', body: JSON.stringify(form) });
      if (data.mfaEnrollmentRequired) {
        const response = await fetch(API + '/auth/mfa/setup', { method: 'POST', headers: { Authorization: 'Bearer ' + data.setupToken, 'Content-Type': 'application/json' } });
        const setup = await response.json();
        if (!response.ok) throw new Error(setup.error || 'Could not start MFA setup.');
        setToken(data.setupToken); setUser(data.user); setEnrollment(setup); setMessage('Add the secret below to your authenticator app, then confirm the six-digit code.');
      } else { setToken(data.token); setUser(data.user); setMessage('Signed in securely.'); }
    } catch (e) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  async function verifyEnrollment(e) {
    e.preventDefault(); setMessage('');
    try { await api('/auth/mfa/verify', { method: 'POST', body: JSON.stringify({ code: mfaCode }) }); setEnrollment(null); setToken(''); setUser(null); setForm({ ...form, totp: '' }); setMfaCode(''); setMessage('MFA enabled. Sign in again using your authenticator code.'); }
    catch (e) { setMessage(e.message); }
  }
  async function addUser(e) {
    e.preventDefault(); setMessage('');
    try { await api('/users', { method: 'POST', body: JSON.stringify(newUser) }); setNewUser({ username: '', email: '', password: '', role: 'inputer' }); setMessage('User created. The new user must enroll MFA at first sign-in.'); await load(); }
    catch (e) { setMessage(e.message); }
  }
  async function addRecord(e) {
    e.preventDefault(); setMessage('');
    try { await api('/records', { method: 'POST', body: JSON.stringify(newRecord) }); setNewRecord({ title:'', category:'', details:'' }); setMessage('Record saved.'); await load(); }
    catch (e) { setMessage(e.message); }
  }
  function logout() { setToken(''); setUser(null); setEnrollment(null); setRecords([]); setSummary(null); setForm(initial); setMessage('You have signed out.'); }
  if (enrollment) return <main className="login-layout"><section className="brand-panel"><div className="brand-mark">P2</div><p className="eyebrow">ACCOUNT SECURITY</p><h1>Protect your account.</h1><p className="muted">Add Project Two to your authenticator app. Keep this secret private.</p></section><section className="login-panel"><div className="login-card"><p className="eyebrow">MULTI-FACTOR SETUP</p><h2>Enable authenticator</h2><p className="muted">In your authenticator app, add an account using this setup key:</p><p className="secret-key">{enrollment.secret}</p><p className="tiny">Treat this key like a password. Do not share it. After adding it, enter the current six-digit code.</p><form onSubmit={verifyEnrollment}><label>Authenticator code<input inputMode="numeric" autoComplete="one-time-code" maxLength="6" value={mfaCode} onChange={e=>setMfaCode(e.target.value.replace(/\\D/g,''))} required pattern="[0-9]{6}"/></label><button>Verify and enable MFA</button></form>{message&&<p className="notice" role="status">{message}</p>}</div></section></main>;
  if (!token) return <main className="login-layout"><section className="brand-panel"><div className="brand-mark">P2</div><p className="eyebrow">SECURE WORKSPACE</p><h1>One workspace.<br/>Clear accountability.</h1><p className="muted">Manage records, users and activity with role-based access and multi-factor authentication.</p><div className="security-note">⌁ Password hashing · MFA · Audit trails</div></section><section className="login-panel"><div className="login-card"><p className="eyebrow">WELCOME BACK</p><h2>Sign in to Project Two</h2><p className="muted">Use your account and authenticator code.</p><form onSubmit={login}><label>Username<input autoComplete="username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} required minLength="3"/></label><label>Password<input type="password" autoComplete="current-password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/></label><label>Authenticator code<input inputMode="numeric" autoComplete="one-time-code" maxLength="6" placeholder="6-digit code" value={form.totp} onChange={e=>setForm({...form,totp:e.target.value.replace(/\D/g,'')})} required pattern="[0-9]{6}"/></label><button disabled={busy}>{busy?'Signing in…':'Sign in securely'}</button></form>{message&&<p className="notice" role="status">{message}</p>}<p className="tiny">MFA must be enrolled for an account before signing in. Configure the API and database before first use.</p></div></section></main>;
  return <div className="app-shell"><aside className="sidebar"><div className="brand-row"><span className="brand-mark small">P2</span><b>Project Two</b></div><p className="nav-label">WORKSPACE</p>{[['overview','Overview'],['records','Records'],['reports','Reports'],...(canManage?[['users','User management']]:[])].map(([id,label])=><button key={id} className={'nav-button '+(tab===id?'selected':'')} onClick={()=>setTab(id)}>{label}</button>)}<div className="sidebar-bottom"><span className="status-dot"/> Secure session active</div></aside><main className="main-area"><header className="topbar"><div><p className="eyebrow">SECURE WORKSPACE</p><h1>{tab==='overview'?'Overview':tab==='records'?'Records':tab==='reports'?'Reports':'User management'}</h1></div><div className="user-chip"><span className="avatar">{user.username.slice(0,1).toUpperCase()}</span><span><b>{user.username}</b><small>{user.role}</small></span><button className="outline" onClick={logout}>Sign out</button></div></header>{message&&<p className="notice" role="status">{message}</p>}{tab==='overview'&&<><section className="welcome"><div><p className="eyebrow light">YOUR WORKSPACE</p><h2>Welcome, {user.username}</h2><p>Keep records organized and actions accountable.</p></div><div className="welcome-icon">✦</div></section><section className="stats-grid"><Stat label="Total users" value={summary?.users?.total ?? '—'} hint="Registered accounts"/><Stat label="Active users" value={summary?.users?.active ?? '—'} hint="Enabled accounts"/><Stat label="Total records" value={summary?.records?.total ?? '—'} hint="Saved in workspace"/><Stat label="Open records" value={summary?.records?.open ?? '—'} hint="Need attention"/></section><section className="panel"><div className="panel-heading"><div><h3>Recent records</h3><p>Latest items in your workspace</p></div><button className="outline" onClick={()=>setTab('records')}>View all</button></div><RecordTable records={records.slice(0,5)}/></section></>}{tab==='records'&&<section className="panel"><div className="panel-heading"><div><h3>Records</h3><p>Create and track workspace items.</p></div></div><form className="record-form" onSubmit={addRecord}><label>Title<input value={newRecord.title} onChange={e=>setNewRecord({...newRecord,title:e.target.value})} required maxLength="160"/></label><label>Category<input value={newRecord.category} onChange={e=>setNewRecord({...newRecord,category:e.target.value})} required maxLength="80"/></label><label className="wide">Details<textarea value={newRecord.details} onChange={e=>setNewRecord({...newRecord,details:e.target.value})} maxLength="5000"/></label><button>Save record</button></form><RecordTable records={records}/></section>}{tab==='reports'&&<section className="panel"><div className="panel-heading"><div><h3>Workspace report</h3><p>Live summary from the API</p></div></div><div className="stats-grid"><Stat label="Users" value={summary?.users?.total??'—'} hint="All accounts"/><Stat label="Active accounts" value={summary?.users?.active??'—'} hint="Enabled"/><Stat label="Records" value={summary?.records?.total??'—'} hint="All statuses"/><Stat label="Open" value={summary?.records?.open??'—'} hint="Current open items"/></div><h3>Recent activity</h3>{(summary?.activity||[]).map(a=><div className="activity-row" key={a.action}><span>{a.action.replaceAll('_',' ')}</span><b>{a.total}</b></div>)}</section>}{tab==='users'&&<section className="panel"><div className="panel-heading"><div><h3>User management</h3><p>Visible to authorized roles only.</p></div></div><form className="record-form user-form" onSubmit={addUser}><label>Username<input value={newUser.username} onChange={e=>setNewUser({...newUser,username:e.target.value})} minLength="3" required/></label><label>Email<input type="email" value={newUser.email} onChange={e=>setNewUser({...newUser,email:e.target.value})} required/></label><label>Temporary password<input type="password" value={newUser.password} onChange={e=>setNewUser({...newUser,password:e.target.value})} minLength="12" required/><small>Use 12+ characters and share it securely.</small></label><label>Role<select value={newUser.role} onChange={e=>setNewUser({...newUser,role:e.target.value})}><option value="inputer">Inputer</option><option value="viewer">Viewer</option><option value="manager">Manager</option>{user.role==='admin'&&<option value="admin">Admin</option>}</select></label><button>Create user</button></form><div className="table-wrap"><table><thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>MFA</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td>{u.username}</td><td>{u.email}</td><td><span className="role">{u.role}</span></td><td>{u.is_active?'Active':'Disabled'}</td><td>{u.totp_enabled?'Enabled':'Not enrolled'}</td></tr>)}</tbody></table></div></section>}</main></div>;
}
function Stat({label,value,hint}){return <article className="stat-card"><p>{label}</p><strong>{value}</strong><small>{hint}</small></article>}
function RecordTable({records}){return <div className="table-wrap"><table><thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Created by</th></tr></thead><tbody>{records.map(r=><tr key={r.id}><td><b>{r.title}</b></td><td>{r.category}</td><td><span className={'pill '+r.status}>{r.status.replaceAll('_',' ')}</span></td><td>{r.created_by||'—'}</td></tr>)}</tbody></table>{records.length===0&&<p className="empty">No records yet. Add your first record above.</p>}</div>}
