import React, { useEffect, useMemo, useState } from 'react';
import { LayoutDashboard, Receipt, Users, Download, Plus, IndianRupee, Trash2, Camera, Wallet, ArrowUpRight, LogOut, Search, Bell, CalendarDays, ChevronRight, Eye, X, Pencil, Building2, Hammer, Droplets, Zap, Paintbrush, CookingPot, Armchair, Bath, Lightbulb, PencilRuler, House, Wrench, Package } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '/api';
const BUDGET_DEFAULT = 1600000;
const categories = ['Civil work','Demolition & debris','Plumbing','Electrical','Flooring & tiles','False ceiling','Painting','Modular kitchen','Wardrobes & furniture','Bathroom fittings','Lighting','Designer fees','Rent','Architect (Neel)','Miscellaneous'];
const money = n => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(n||0));

export default function App(){
  const [tab,setTab] = useState('Overview');
  const [budget,setBudget] = useState(()=>Number(localStorage.getItem('rl-budget')||BUDGET_DEFAULT));
  const [expenses,setExpenses] = useState([]);
  const [contractors,setContractors] = useState([]);
  const [error,setError] = useState('');
  const [showExpense,setShowExpense] = useState(false);
  const [showContractor,setShowContractor] = useState(false);
  const [mobileNav,setMobileNav] = useState(false);
  const [search,setSearch] = useState('');
  const [notifications,setNotifications] = useState([]);
  const [showNotifications,setShowNotifications] = useState(false);
  const [editingExpense,setEditingExpense] = useState(null);
  const [removeReceipt,setRemoveReceipt] = useState(false);
  const [form,setForm] = useState({date:new Date().toISOString().slice(0,10),description:'',category:categories[0],amount:'',paymentMethod:'UPI',paidTo:'',receiptFile:''});
  const [contractorForm,setContractorForm] = useState({name:'',workType:'Civil work',phone:'',agreedAmount:'',paidAmount:'0'});
  const [receipt,setReceipt] = useState(null);
  const [auth,setAuth] = useState(()=>sessionStorage.getItem('rl-auth')||'');
  const [role,setRole] = useState(()=>sessionStorage.getItem('rl-role')||'');
  const [loginForm,setLoginForm] = useState({username:'',password:''});
  const [loginError,setLoginError] = useState('');
  const isAdmin = role === 'ADMIN';

  const authHeaders = (extra={}) => ({...extra,...(auth?{Authorization:'Basic '+auth}:{})});

  async function login(event){
    event.preventDefault();
    const encoded=btoa(`${loginForm.username}:${loginForm.password}`);
    try{
      const response=await fetch(API+'/me',{headers:{Authorization:'Basic '+encoded}});
      if(!response.ok) throw new Error('Invalid username or password');
      const me=await response.json();
      sessionStorage.setItem('rl-auth',encoded);sessionStorage.setItem('rl-role',me.role);
      setAuth(encoded);setRole(me.role);setLoginError('');
    }catch(error){setLoginError(error.message)}
  }

  function logout(){sessionStorage.removeItem('rl-auth');sessionStorage.removeItem('rl-role');setAuth('');setRole('');setLoginForm({username:'',password:''});}

  async function load(){
    if(!auth) return;
    try{
      const [e,c]=await Promise.all([fetch(API+'/expenses',{headers:authHeaders()}),fetch(API+'/contractors',{headers:authHeaders()})]);
      if(e.status===401||c.status===401){logout();throw new Error('Session expired');}
      if(!e.ok||!c.ok) throw new Error('Backend unavailable');
      setExpenses(await e.json());setContractors(await c.json());setError('');
    }catch(error){setError(error.message==='Session expired'?'Your session expired. Please sign in again.':'Cannot reach the backend. Please try again.');}
  }

  useEffect(()=>{if(auth) load()},[auth]);

  async function loadNotifications(){
    if(!auth) return;
    try{
      const response=await fetch(API+'/notifications',{headers:authHeaders()});
      if(response.ok)setNotifications(await response.json());
    }catch{}
  }

  async function openNotifications(){
    setShowNotifications(value=>!value);
    if(!showNotifications){
      await fetch(API+'/notifications/read',{method:'PUT',headers:authHeaders()});
      await loadNotifications();
    }
  }

  useEffect(()=>{
    if(!auth) return;
    loadNotifications();
    const timer=setInterval(loadNotifications,15000);
    return()=>clearInterval(timer);
  },[auth]);

  useEffect(()=>{localStorage.setItem('rl-budget',String(budget))},[budget]);

  const spent=expenses.reduce((sum,e)=>sum+Number(e.amount||0),0);
  const pending=contractors.reduce((sum,c)=>sum+Math.max(0,Number(c.agreedAmount||0)-Number(c.paidAmount||0)),0);
  const remaining=budget-spent;
  const pct=budget>0?Math.min(100,spent/budget*100):0;
  const grouped=useMemo(()=>categories.map(name=>({name,total:expenses.filter(e=>e.category===name).reduce((sum,e)=>sum+Number(e.amount||0),0)})).filter(x=>x.total>0).sort((a,b)=>b.total-a.total),[expenses]);

  async function addExpense(event){
    event.preventDefault();if(!isAdmin)return;
    try{
      let receiptFile=removeReceipt?'':(editingExpense?.receiptFile||'');
      if(receipt){const fd=new FormData();fd.append('file',receipt);const response=await fetch(API+'/receipts',{method:'POST',headers:authHeaders(),body:fd});if(!response.ok)throw new Error('Receipt upload failed');receiptFile=(await response.json()).filename;}
      const payload={...form,amount:Number(form.amount),receiptFile};
      const response=await fetch(editingExpense?API+'/expenses/'+editingExpense.id:API+'/expenses',{method:editingExpense?'PUT':'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify(payload)});
      if(!response.ok)throw new Error(editingExpense?'Could not update expense':'Could not save expense');
      setShowExpense(false);setEditingExpense(null);setRemoveReceipt(false);setForm({date:new Date().toISOString().slice(0,10),description:'',category:categories[0],amount:'',paymentMethod:'UPI',paidTo:'',receiptFile:''});setReceipt(null);await load();await loadNotifications();
    }catch(error){alert(error.message)}
  }

  function openAddExpense(){setEditingExpense(null);setRemoveReceipt(false);setForm({date:new Date().toISOString().slice(0,10),description:'',category:categories[0],amount:'',paymentMethod:'UPI',paidTo:'',receiptFile:''});setReceipt(null);setShowExpense(true);}

  function openEditExpense(expense){setEditingExpense(expense);setRemoveReceipt(false);setForm({date:expense.date||new Date().toISOString().slice(0,10),description:expense.description||'',category:expense.category||categories[0],amount:String(expense.amount||''),paymentMethod:expense.paymentMethod||'UPI',paidTo:expense.paidTo||'',receiptFile:expense.receiptFile||''});setReceipt(null);setShowExpense(true);}

  async function addContractor(event){
    if(!isAdmin)return;
    event.preventDefault();
    const response=await fetch(API+'/contractors',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({...contractorForm,agreedAmount:Number(contractorForm.agreedAmount),paidAmount:Number(contractorForm.paidAmount)})});
    if(response.ok){setShowContractor(false);setContractorForm({name:'',workType:'Civil work',phone:'',agreedAmount:'',paidAmount:'0'});await load();}else alert('Could not save contractor');
  }

  async function removeExpense(id){if(isAdmin&&confirm('Delete this expense?')){await fetch(API+'/expenses/'+id,{method:'DELETE',headers:authHeaders()});await load();}}

  function exportCSV(){
    const rows=[['Date','Description','Category','Paid to','Payment method','Amount (INR)'],...expenses.map(e=>[e.date,e.description,e.category,e.paidTo,e.paymentMethod,e.amount])];
    const csv=rows.map(row=>row.map(value=>'"'+String(value??'').replaceAll('"','""')+'"').join(',')).join('\n');
    const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));link.download='renovation-expenses.csv';link.click();URL.revokeObjectURL(link.href);
  }

  if(!auth) return <LoginScreen loginForm={loginForm} setLoginForm={setLoginForm} loginError={loginError} onLogin={login}/>;

  const nav=[['Overview',LayoutDashboard],['Expenses',Receipt],['Contractors',Users],['Reports',Download]];
  const filtered=expenses.filter(e=>`${e.description} ${e.category} ${e.paidTo||''}`.toLowerCase().includes(search.toLowerCase()));

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav?'open':''}`}>
      <div className="brand"><div className="brand-mark">RL</div><div><strong>Renovation</strong><span>Ledger</span></div><button className="mobile-close" onClick={()=>setMobileNav(false)}><X size={18}/></button></div>
      <div className="project-card"><span className="status-dot"/><div><small>Current project</small><strong>1 BHK Renovation</strong><span>Pimpri, Pune</span></div></div>
      <nav className="nav-list">{nav.map(([name,Icon])=><button key={name} className={tab===name?'active':''} onClick={()=>{setTab(name);setMobileNav(false)}}><Icon size={18}/><span>{name}</span>{tab===name&&<ChevronRight className="nav-arrow" size={16}/>}</button>)}</nav>
      <div className="sidebar-profile"><div className="profile-avatar">{role==='ADMIN'?'AD':'VR'}</div><div><strong>{role==='ADMIN'?'Administrator':'Read-only user'}</strong><span>{role==='ADMIN'?'Full access':'Viewer'}</span></div><button title="Logout" onClick={logout}><LogOut size={17}/></button></div>
    </aside>
    {mobileNav&&<button className="nav-overlay" aria-label="Close navigation" onClick={()=>setMobileNav(false)}/>} 

    <main className="main-content">
      <header className="topbar"><button className="mobile-menu" onClick={()=>setMobileNav(true)}>☰</button><div><span className="breadcrumb">Home / {tab}</span><h1>{tab}</h1></div><div className="topbar-actions"><div className="notification-wrap"><button className="icon-button" title="Notifications" onClick={openNotifications}><Bell size={18}/>{notifications.some(n=>!n.readByViewer)&&<span className="notification-dot"/>}</button>{showNotifications&&<div className="notification-panel"><div className="notification-head"><strong>Notifications</strong><button onClick={()=>setShowNotifications(false)}><X size={15}/></button></div>{notifications.length?<div className="notification-list">{notifications.slice(0,8).map(n=><div className="notification-item" key={n.id}><span className="notification-icon"><Receipt size={15}/></span><div><strong>{n.message}</strong><small>{new Date(n.createdAt).toLocaleString()}</small></div></div>)}</div>:<div className="notification-empty">You're all caught up.</div>}</div>}</div>{isAdmin&&<button className="primary-button" onClick={openAddExpense}><Plus size={17}/>Add expense</button>}</div></header>
      {error&&<div className="alert"><span>!</span>{error}</div>}

      {tab==='Overview'&&<div className="page-enter"><section className="hero-card"><div><span className="hero-label">PROJECT OVERVIEW</span><h2>Every rupee,<br/><em>accounted for.</em></h2><p>A clear picture of your renovation, in one place.</p></div><div className="hero-visual"><div className="hero-ring"><Wallet size={34}/></div><span>Budget health</span><strong>{pct.toFixed(0)}%</strong></div></section>
        <section className="metric-grid"><Metric label="Total budget" value={money(budget)} icon={<Wallet/>} accent="green"/><Metric label="Total spent" value={money(spent)} icon={<ArrowUpRight/>} accent="orange" detail={`${pct.toFixed(1)}% utilised`}/><Metric label="Budget remaining" value={money(remaining)} icon={<IndianRupee/>} accent="blue" detail={remaining<0?'Over budget':'Available to spend'}/><Metric label="Contractor dues" value={money(pending)} icon={<Users/>} accent="purple" detail="Outstanding balance"/></section>
        {isAdmin&&<div className="budget-editor"><label>Project budget</label><div><span>₹</span><input type="number" value={budget} onChange={e=>setBudget(Number(e.target.value))}/></div></div>}
        <section className="dashboard-grid"><div className="card"><CardHeader eyebrow="EXPENDITURE" title="Budget utilisation" action={<span className="percentage-badge">{pct.toFixed(1)}%</span>}/><div className="progress-track"><span style={{width:`${pct}%`}}/></div><div className="progress-meta"><span>{money(spent)} spent</span><span>{money(budget)} budget</span></div><div className="balance-row"><span>Remaining balance</span><strong className={remaining<0?'danger':''}>{money(remaining)}</strong></div></div><div className="card"><CardHeader eyebrow="BREAKDOWN" title="Spending by category"/><div className="category-list">{grouped.length?grouped.slice(0,5).map(item=><CategoryRow key={item.name} item={item} spent={spent}/>):<EmptyMini text="No spending recorded yet"/>}</div></div></section>
        <div className="card table-card"><CardHeader eyebrow="ACTIVITY" title="Recent expenses" action={<button className="link-button" onClick={()=>setTab('Expenses')}>View all <ChevronRight size={14}/></button>}/><ExpenseTable expenses={expenses.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,5)} onDelete={removeExpense} onEdit={openEditExpense} isAdmin={isAdmin} auth={auth}/></div>
      </div>}

      {tab==='Expenses'&&<div className="page-enter"><div className="section-toolbar"><div><span className="section-eyebrow">LEDGER</span><h2>All expenses</h2></div><div className="toolbar-actions"><label className="search-box"><Search size={16}/><input placeholder="Search expenses" value={search} onChange={e=>setSearch(e.target.value)}/></label>{isAdmin&&<button className="primary-button" onClick={openAddExpense}><Plus size={17}/>Add expense</button>}</div></div><div className="card table-card"><ExpenseTable expenses={filtered.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)))} onDelete={removeExpense} onEdit={openEditExpense} isAdmin={isAdmin} auth={auth}/></div></div>}

      {tab==='Contractors'&&<div className="page-enter"><div className="section-toolbar"><div><span className="section-eyebrow">DIRECTORY</span><h2>Contractors</h2></div>{isAdmin&&<button className="primary-button" onClick={()=>setShowContractor(true)}><Plus size={17}/>Add contractor</button>}</div><div className="card table-card">{contractors.length?<div className="table-scroll"><table><thead><tr><th>CONTRACTOR</th><th>WORK</th><th>AGREED</th><th>PAID</th><th>BALANCE</th></tr></thead><tbody>{contractors.map(c=><tr key={c.id}><td><b>{c.name}</b><small>{c.phone}</small></td><td>{c.workType}</td><td>{money(c.agreedAmount)}</td><td>{money(c.paidAmount)}</td><td><b className="balance-text">{money(Number(c.agreedAmount)-Number(c.paidAmount))}</b></td></tr>)}</tbody></table></div>:<EmptyState icon={<Users size={28}/>} title="No contractors yet" text="Add your interior designer, civil contractor or specialist team."/>}</div></div>}

      {tab==='Reports'&&<div className="page-enter"><div className="section-toolbar"><div><span className="section-eyebrow">ANALYSIS</span><h2>Budget report</h2></div><button className="secondary-button" onClick={exportCSV}><Download size={16}/>Export CSV</button></div><div className="report-summary"><SummaryItem label="PROJECT BUDGET" value={money(budget)}/><SummaryItem label="ACTUAL SPEND" value={money(spent)}/><SummaryItem label="VARIANCE" value={money(remaining)} negative={remaining<0}/></div><div className="card table-card"><div className="table-scroll"><table><thead><tr><th>CATEGORY</th><th>ACTUAL SPEND</th><th>SHARE</th></tr></thead><tbody>{grouped.map(item=><tr key={item.name}><td><b>{item.name}</b></td><td>{money(item.total)}</td><td><div className="share-cell"><span><i style={{width:`${spent?item.total/spent*100:0}%`}}/></span><b>{spent?(item.total/spent*100).toFixed(1):0}%</b></div></td></tr>)}</tbody></table></div></div></div>}
      <footer>Renovation Ledger · v1.0.0.1 · Developed by Shreyas</footer>
    </main>

    {showExpense&&<ExpenseModal form={form} setForm={setForm} receipt={receipt} setReceipt={setReceipt} onSubmit={addExpense} editing={!!editingExpense} removeReceipt={removeReceipt} setRemoveReceipt={setRemoveReceipt} onClose={()=>{setShowExpense(false);setEditingExpense(null);setRemoveReceipt(false);}}/>} 
    {showContractor&&<ContractorModal form={contractorForm} setForm={setContractorForm} onSubmit={addContractor} onClose={()=>setShowContractor(false)}/>} 
  </div>
}

function LoginScreen({loginForm,setLoginForm,loginError,onLogin}){return <main className="login-shell"><div className="login-visual"><div className="login-logo"><span>RL</span></div><div><div className="login-kicker">RENOVATION LEDGER</div><h1>Build with clarity.<br/><em>Track every rupee.</em></h1><p>Your project finances, documents and progress — organised in one place.</p></div><div className="login-pattern"/></div><form className="login-form" onSubmit={onLogin}><div className="login-mobile-logo"><div className="brand-mark">RL</div><strong>Renovation Ledger</strong></div><div className="login-heading"><span>WELCOME BACK</span><h2>Sign in to your account</h2><p>Enter your credentials to continue.</p></div>{loginError&&<div className="login-error">{loginError}</div>}<Field label="Username"><input required autoComplete="username" value={loginForm.username} onChange={e=>setLoginForm({...loginForm,username:e.target.value})}/></Field><Field label="Password"><input required type="password" autoComplete="current-password" value={loginForm.password} onChange={e=>setLoginForm({...loginForm,password:e.target.value})}/></Field><button className="login-submit">Sign in <ChevronRight size={17}/></button><div className="login-footer">Renovation Ledger · v1.0.0.1 · Developed by Shreyas</div></form></main>}
function Metric({label,value,icon,accent,detail}){return <article className="metric-card"><div className={`metric-icon ${accent}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong>{detail&&<small>{detail}</small>}</div></article>}
function CardHeader({eyebrow,title,action}){return <div className="card-header"><div><span>{eyebrow}</span><h3>{title}</h3></div>{action}</div>}
const categoryVisuals={
  'Civil work':{icon:Hammer,tone:'terracotta'},
  'Demolition & debris':{icon:Wrench,tone:'orange'},
  'Plumbing':{icon:Droplets,tone:'blue'},
  'Electrical':{icon:Zap,tone:'yellow'},
  'Flooring & tiles':{icon:Building2,tone:'stone'},
  'False ceiling':{icon:Building2,tone:'slate'},
  'Painting':{icon:Paintbrush,tone:'pink'},
  'Modular kitchen':{icon:CookingPot,tone:'green'},
  'Wardrobes & furniture':{icon:Armchair,tone:'wood'},
  'Bathroom fittings':{icon:Bath,tone:'aqua'},
  'Lighting':{icon:Lightbulb,tone:'yellow'},
  'Designer fees':{icon:PencilRuler,tone:'purple'},
  'Rent':{icon:House,tone:'green'},
  'Architect (Neel)':{icon:PencilRuler,tone:'purple'},
  'Miscellaneous':{icon:Package,tone:'slate'}
};

function CategoryRow({item,spent}){
  const visual=categoryVisuals[item.name]||categoryVisuals.Miscellaneous;
  const Icon=visual.icon;
  return <div className="category-row"><div className="category-main"><span className={`category-icon ${visual.tone}`}><Icon size={16}/></span><div className="category-details"><div><span>{item.name}</span><strong>{money(item.total)}</strong></div><div className="category-track"><i style={{width:`${spent?item.total/spent*100:0}%`}}/></div></div></div></div>
}
function EmptyMini({text}){return <div className="empty-mini">{text}</div>}
function SummaryItem({label,value,negative=false}){return <div><small>{label}</small><strong className={negative?'danger':''}>{value}</strong></div>}
function EmptyState({icon,title,text}){return <div className="empty-state"><div>{icon}</div><h3>{title}</h3><p>{text}</p></div>}

async function openReceipt(auth,url){const viewer=window.open('', '_blank');try{const response=await fetch(url,{headers:{Authorization:'Basic '+auth}});if(!response.ok)throw new Error('Could not open receipt');const blob=await response.blob();const objectUrl=URL.createObjectURL(blob);if(viewer)viewer.location.href=objectUrl;else window.open(objectUrl,'_blank','noopener,noreferrer');}catch(error){if(viewer)viewer.close();alert(error.message)}}

function ExpenseTable({expenses,onDelete,onEdit,isAdmin,auth}){return expenses.length?<div className="table-scroll"><table><thead><tr><th>DATE</th><th>DESCRIPTION</th><th>CATEGORY</th><th>PAYMENT</th><th>AMOUNT</th>{isAdmin&&<th>ACTIONS</th>}</tr></thead><tbody>{expenses.map(e=><tr key={e.id}><td><span className="date-cell"><CalendarDays size={14}/>{e.date}</span></td><td><b>{e.description}</b>{e.paidTo&&<small>Paid to {e.paidTo}</small>}{e.receiptFile&&<button className="receipt-link" onClick={()=>openReceipt(auth,API+'/receipts/'+encodeURIComponent(e.receiptFile))}><Eye size={13}/>View receipt</button>}</td><td><span className="category-pill">{e.category}</span></td><td>{e.paymentMethod}</td><td><b className="amount-cell">{money(e.amount)}</b></td>{isAdmin&&<td><div className="row-actions"><button className="edit-button" title="Edit expense" onClick={()=>onEdit(e)}><Pencil size={14}/></button><button className="delete-button" title="Delete expense" onClick={()=>onDelete(e.id)}><Trash2 size={15}/></button></div></td>}</tr>)}</tbody></table></div>:<EmptyState icon={<Receipt size={28}/>} title="No expenses yet" text="Add your first renovation expense to begin tracking."/>}

function Field({label,children}){return <label className="field"><span>{label}</span>{children}</label>}
function Modal({title,subtitle,close,children}){return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><div className="modal"><div className="modal-header"><div><span>NEW RECORD</span><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div><button onClick={close}><X size={19}/></button></div>{children}</div></div>}

function ExpenseModal({form,setForm,receipt,setReceipt,onSubmit,onClose,editing=false,removeReceipt,setRemoveReceipt})
{const categoriesLocal=categories;return <Modal title={editing?'Edit expense':'Add an expense'} subtitle={editing?'Update the expense details':'Record a renovation payment'} close={onClose}><form onSubmit={onSubmit}><div className="form-grid"><Field label="Date"><input required type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></Field><Field label="Amount (₹)"><input required min="1" type="number" placeholder="e.g. 12500" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></Field><Field label="Description"><input required placeholder="e.g. Bathroom tiles" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></Field><Field label="Category"><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categoriesLocal.map(c=><option key={c}>{c}</option>)}</select></Field><Field label="Payment method"><select value={form.paymentMethod} onChange={e=>setForm({...form,paymentMethod:e.target.value})}>{['UPI','Cash','Credit card','Debit card','Bank transfer'].map(c=><option key={c}>{c}</option>)}</select></Field><Field label="Paid to"><input placeholder="Vendor or contractor" value={form.paidTo} onChange={e=>setForm({...form,paidTo:e.target.value})}/></Field></div><Field label="Receipt"><label className="upload-zone"><Camera size={22}/><div><strong>{receipt?receipt.name:'Choose receipt or invoice'}</strong><span>Image or PDF, up to 10 MB</span></div><input type="file" accept="image/*,.pdf" onChange={e=>setReceipt(e.target.files[0])}/></label></Field>{editing&&<Field label="Remove existing receipt"><div className="checkbox-group"><label className="checkbox-label"><input type="checkbox" checked={removeReceipt} onChange={e=>setRemoveReceipt(e.target.checked)}/><span className="checkbox-custom"/><span className="checkbox-label-text">Yes, remove receipt</span></label></div></Field>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button"><Plus size={16}/>Save expense</button></div></form></Modal>}

function ContractorModal({form,setForm,onSubmit,onClose}){return <Modal title="Add contractor" subtitle="Create a contractor balance record" close={onClose}><form onSubmit={onSubmit}><div className="form-grid"><Field label="Contractor name"><input required placeholder="Name or company" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field><Field label="Phone"><input placeholder="Contact number" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></Field><Field label="Work type"><select value={form.workType} onChange={e=>setForm({...form,workType:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></Field><Field label="Agreed amount (₹)"><input required type="number" min="0" value={form.agreedAmount} onChange={e=>setForm({...form,agreedAmount:e.target.value})}/></Field><Field label="Already paid (₹)"><input type="number" min="0" value={form.paidAmount} onChange={e=>setForm({...form,paidAmount:e.target.value})}/></Field></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button"><Plus size={16}/>Save contractor</button></div></form></Modal>}
