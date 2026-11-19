import React, { useEffect, useMemo, useState } from 'react';
import { LayoutDashboard, Receipt, Users, Download, Plus, IndianRupee, Trash2, Camera, Wallet, ArrowUpRight, Menu } from 'lucide-react';

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
  const [form,setForm] = useState({date:new Date().toISOString().slice(0,10),description:'',category:categories[0],amount:'',paymentMethod:'UPI',paidTo:'',receiptFile:''});
  const [contractorForm,setContractorForm] = useState({name:'',workType:'Civil work',phone:'',agreedAmount:'',paidAmount:'0'});
  const [receipt,setReceipt] = useState(null);
  const [auth,setAuth] = useState(()=>sessionStorage.getItem('rl-auth')||'');
  const [role,setRole] = useState(()=>sessionStorage.getItem('rl-role')||'');
  const [loginForm,setLoginForm] = useState({username:'',password:''});
  const [loginError,setLoginError] = useState('');
  const isAdmin = role === 'ADMIN';

  function authHeaders(extra={}){
    return {...extra, ...(auth ? {Authorization:'Basic '+auth} : {})};
  }

  async function login(event){
    event.preventDefault();
    const encoded = btoa(`${loginForm.username}:${loginForm.password}`);
    try{
      const response=await fetch(API+'/me',{headers:{Authorization:'Basic '+encoded}});
      if(!response.ok) throw new Error('Invalid username or password');
      const me=await response.json();
      sessionStorage.setItem('rl-auth',encoded);
      sessionStorage.setItem('rl-role',me.role);
      setAuth(encoded);setRole(me.role);setLoginError('');
    }catch(error){setLoginError(error.message)}
  }

  function logout(){
    sessionStorage.removeItem('rl-auth');sessionStorage.removeItem('rl-role');
    setAuth('');setRole('');setLoginForm({username:'',password:''});
  }

  async function load(){
    try {
      const [e,c] = await Promise.all([
        fetch(API+'/expenses',{headers:authHeaders()}),
        fetch(API+'/contractors',{headers:authHeaders()})
      ]);
      if(e.status===401||c.status===401) {logout(); throw new Error('Session expired');}
      if(!e.ok||!c.ok) throw new Error('Backend unavailable');
      setExpenses(await e.json()); setContractors(await c.json()); setError('');
    } catch(error) { setError(error.message==='Session expired'?'Your session expired. Please sign in again.':'Cannot reach the backend. Please try again.'); }
  }
  useEffect(()=>{load()},[]);
  useEffect(()=>{localStorage.setItem('rl-budget',String(budget))},[budget]);
  const spent = expenses.reduce((s,e)=>s+Number(e.amount||0),0);
  const pending = contractors.reduce((s,c)=>s+Math.max(0,Number(c.agreedAmount||0)-Number(c.paidAmount||0)),0);
  const remaining = budget-spent;
  const grouped = useMemo(()=>categories.map(name=>({name,total:expenses.filter(e=>e.category===name).reduce((s,e)=>s+Number(e.amount||0),0)})).filter(x=>x.total>0).sort((a,b)=>b.total-a.total),[expenses]);
  const pct = budget>0?Math.min(100,spent/budget*100):0;

  async function addExpense(ev){
    ev.preventDefault();
    if(!isAdmin) return;
    try {
      let receiptFile='';
      if(receipt){const fd=new FormData();fd.append('file',receipt);const r=await fetch(API+'/receipts',{method:'POST',headers:authHeaders(),body:fd});if(!r.ok)throw new Error('Receipt upload failed');receiptFile=(await r.json()).filename;}
      const r=await fetch(API+'/expenses',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({...form,amount:Number(form.amount),receiptFile})});
      if(!r.ok)throw new Error('Could not save expense');
      setShowExpense(false);setForm({date:new Date().toISOString().slice(0,10),description:'',category:categories[0],amount:'',paymentMethod:'UPI',paidTo:'',receiptFile:''});setReceipt(null);load();
    } catch(e){alert(e.message)}
  }
  async function addContractor(ev){
    ev.preventDefault();
    if(!isAdmin) return;
    const r=await fetch(API+'/contractors',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({...contractorForm,agreedAmount:Number(contractorForm.agreedAmount),paidAmount:Number(contractorForm.paidAmount)})});
    if(r.ok){setShowContractor(false);setContractorForm({name:'',workType:'Civil work',phone:'',agreedAmount:'',paidAmount:'0'});load()}else alert('Could not save contractor');
  }
  async function removeExpense(id){if(isAdmin&&confirm('Delete this expense?')){await fetch(API+'/expenses/'+id,{method:'DELETE',headers:authHeaders()});load()}}
  async function replaceReceipt(id,file){
    if(!isAdmin||!file) return;
    const fd=new FormData();fd.append('file',file);
    const response=await fetch(API+'/expenses/'+id+'/receipt',{method:'POST',headers:authHeaders(),body:fd});
    if(!response.ok) throw new Error('Could not restore receipt');
    await response.json();
    await load();
  }
  function exportCSV(){
    const rows=[['Date','Description','Category','Paid to','Payment method','Amount (INR)'],...expenses.map(e=>[e.date,e.description,e.category,e.paidTo,e.paymentMethod,e.amount])];
    const csv=rows.map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='renovation-expenses.csv';a.click();URL.revokeObjectURL(a.href);
  }
  const nav=[['Overview',LayoutDashboard],['Expenses',Receipt],['Contractors',Users],['Reports',Download]];
  if(!auth) return <div className="login-shell"><form className="login-card" onSubmit={login}><div className="brandmark">R</div><div><div className="eyebrow">RENOVATION LEDGER</div><h2>Sign in</h2></div>{loginError&&<div className="warning">{loginError}</div>}<Field label="Username"><input required autoComplete="username" value={loginForm.username} onChange={e=>setLoginForm({...loginForm,username:e.target.value})}/></Field><Field label="Password"><input required type="password" autoComplete="current-password" value={loginForm.password} onChange={e=>setLoginForm({...loginForm,password:e.target.value})}/></Field><button className="primary login-button">Sign in</button></form></div>;

  return <div className="shell">
    <aside className="sidebar"><div className="brand"><div className="brandmark">R</div><div><b>Renovation</b><small>LEDGER</small></div></div><div className="project-label">YOUR PROJECT</div><div className="project"><span className="project-dot"/> <div><b>1 BHK Renovation</b><small>Pimpri, Pune</small></div></div><nav>{nav.map(([n,I])=><button className={tab===n?'active':''} onClick={()=>setTab(n)} key={n}><I size={18}/>{n}</button>)}</nav><div className="side-bottom"><div className="avatar">{role==='ADMIN'?'AD':'VR'}</div><div><b>{role==='ADMIN'?'Administrator':'Read-only user'}</b><small>{role}</small></div><button className="logout-button" onClick={logout}>Logout</button></div></aside>
    <main className="main"><header><div><div className="eyebrow">HOME IMPROVEMENT / PIMPRI</div><h1>{tab}</h1></div><div className="header-actions"><button className="outline" onClick={exportCSV}><Download size={16}/> Export CSV</button>{isAdmin&&<button className="primary" onClick={()=>setShowExpense(true)}><Plus size={17}/> Add expense</button>}</div></header>
      {error&&<div className="warning">{error}</div>}
      {tab==='Overview'&&<><section className="welcome"><div><div className="eyebrow light">PROJECT DASHBOARD</div><h2>Every rupee,<br/>accounted for.</h2><p>Keep your renovation on track with a clear view of spending.</p></div><div className="welcome-icon"><Wallet size={58}/></div></section>
      <section className="stats"><article><div className="stat-top">Total budget <span><IndianRupee size={17}/></span></div><strong>{money(budget)}</strong><label>Set your project limit</label>{isAdmin&&<input className="budget-input" type="number" value={budget} onChange={e=>setBudget(Number(e.target.value))}/>}</article><article><div className="stat-top">Total spent <span><ArrowUpRight size={17}/></span></div><strong>{money(spent)}</strong><label>{pct.toFixed(1)}% of total budget used</label></article><article><div className="stat-top">Budget remaining <span><Wallet size={17}/></span></div><strong className={remaining<0?'red':''}>{money(remaining)}</strong><label>{remaining<0?'Over budget':'Available to spend'}</label></article><article><div className="stat-top">Contractor dues <span><Users size={17}/></span></div><strong>{money(pending)}</strong><label>Based on contractor balances</label></article></section>
      <section className="grid-two"><div className="panel"><div className="panel-head"><div><h3>Budget utilisation</h3><p>Actual expenses against your project budget</p></div><span className="tag">{pct.toFixed(1)}%</span></div><div className="progress"><i style={{width:pct+'%'}}/></div><div className="progress-label"><span>{money(spent)} spent</span><span>{money(budget)} budget</span></div><div className="budget-foot"><span>Remaining balance</span><b>{money(remaining)}</b></div></div><div className="panel"><div className="panel-head"><div><h3>Spending by category</h3><p>Where your renovation budget goes</p></div></div>{grouped.length?grouped.slice(0,5).map(x=><div className="category-row" key={x.name}><div><span>{x.name}</span><b>{money(x.total)}</b></div><div className="mini-progress"><i style={{width:(spent?x.total/spent*100:0)+'%'}}/></div></div>):<div className="empty-small">Your category breakdown will appear here once you add expenses.</div>}</div></section>
      <section className="panel"><div className="panel-head"><div><h3>Recent expenses</h3><p>Your latest renovation transactions</p></div><button className="text-btn" onClick={()=>setTab('Expenses')}>View all →</button></div><ExpenseTable expenses={expenses.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,5)} onDelete={removeExpense} isAdmin={isAdmin} auth={auth}/></section></>}
      {tab==='Expenses'&&<section className="panel"><div className="panel-head"><div><h3>All expenses</h3><p>Record materials, labour, services and purchases</p></div>{isAdmin&&<button className="primary" onClick={()=>setShowExpense(true)}><Plus size={16}/> Add expense</button>}</div><ExpenseTable expenses={expenses.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)))} onDelete={removeExpense} isAdmin={isAdmin} auth={auth}/></section>}
      {tab==='Contractors'&&<section className="panel"><div className="panel-head"><div><h3>Contractor directory</h3><p>Agreed amounts, payments and outstanding balances</p></div>{isAdmin&&<button className="primary" onClick={()=>setShowContractor(true)}><Plus size={16}/> Add contractor</button>}</div>{contractors.length?<div className="table-wrap"><table><thead><tr><th>CONTRACTOR</th><th>WORK TYPE</th><th>AGREED</th><th>PAID</th><th>BALANCE</th></tr></thead><tbody>{contractors.map(c=><tr key={c.id}><td><b>{c.name}</b><small>{c.phone}</small></td><td>{c.workType}</td><td>{money(c.agreedAmount)}</td><td>{money(c.paidAmount)}</td><td><b>{money(Number(c.agreedAmount)-Number(c.paidAmount))}</b></td></tr>)}</tbody></table></div>:<div className="empty">No contractors added yet. Add your interior designer, civil contractor, carpenter or electrician.</div>}</section>}
      {tab==='Reports'&&<section className="panel"><div className="panel-head"><div><h3>Budget vs actual report</h3><p>Category-wise expenditure summary</p></div><button className="outline" onClick={exportCSV}><Download size={16}/> Export CSV</button></div><div className="report-total"><div><small>PROJECT BUDGET</small><b>{money(budget)}</b></div><div><small>ACTUAL SPEND</small><b>{money(spent)}</b></div><div><small>VARIANCE</small><b className={remaining<0?'red':''}>{money(remaining)}</b></div></div><div className="table-wrap"><table><thead><tr><th>CATEGORY</th><th>ACTUAL SPEND</th><th>% OF TOTAL SPEND</th></tr></thead><tbody>{grouped.map(x=><tr key={x.name}><td>{x.name}</td><td><b>{money(x.total)}</b></td><td>{spent?(x.total/spent*100).toFixed(1):0}%</td></tr>)}</tbody></table></div></section>}
      <footer>Renovation Ledger · Local development edition · Data stored on this Mac</footer>
    </main>
    {showExpense&&<Modal title="Add an expense" close={()=>setShowExpense(false)}><form onSubmit={addExpense}><div className="form-grid"><Field label="Date"><input required type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></Field><Field label="Amount (₹)"><input required min="1" type="number" placeholder="e.g. 12500" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></Field><Field label="Description"><input required placeholder="e.g. Bathroom tiles" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></Field><Field label="Category"><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></Field><Field label="Payment method"><select value={form.paymentMethod} onChange={e=>setForm({...form,paymentMethod:e.target.value})}>{['UPI','Cash','Credit card','Debit card','Bank transfer'].map(c=><option key={c}>{c}</option>)}</select></Field><Field label="Paid to (optional)"><input placeholder="Vendor / contractor" value={form.paidTo} onChange={e=>setForm({...form,paidTo:e.target.value})}/></Field></div><Field label="Receipt photo / invoice"><label className="upload"><Camera size={19}/><span>{receipt?receipt.name:'Choose a photo or PDF'}</span><input type="file" accept="image/*,.pdf" onChange={e=>setReceipt(e.target.files[0])}/></label></Field><div className="modal-actions"><button type="button" className="outline" onClick={()=>setShowExpense(false)}>Cancel</button><button className="primary">Save expense</button></div></form></Modal>}
    {showContractor&&<Modal title="Add contractor" close={()=>setShowContractor(false)}><form onSubmit={addContractor}><div className="form-grid"><Field label="Contractor name"><input required value={contractorForm.name} onChange={e=>setContractorForm({...contractorForm,name:e.target.value})} placeholder="Name / company"/></Field><Field label="Phone"><input value={contractorForm.phone} onChange={e=>setContractorForm({...contractorForm,phone:e.target.value})} placeholder="Contact number"/></Field><Field label="Work type"><select value={contractorForm.workType} onChange={e=>setContractorForm({...contractorForm,workType:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></Field><Field label="Agreed amount (₹)"><input required type="number" min="0" value={contractorForm.agreedAmount} onChange={e=>setContractorForm({...contractorForm,agreedAmount:e.target.value})}/></Field><Field label="Already paid (₹)"><input type="number" min="0" value={contractorForm.paidAmount} onChange={e=>setContractorForm({...contractorForm,paidAmount:e.target.value})}/></Field></div><div className="modal-actions"><button type="button" className="outline" onClick={()=>setShowContractor(false)}>Cancel</button><button className="primary">Save contractor</button></div></form></Modal>}
  </div>
}
async function openReceipt(auth, url){
  try{
    const response=await fetch(url,{headers:{Authorization:'Basic '+auth}});
    if(!response.ok) throw new Error('Could not open receipt');
    const blob=await response.blob();
    const objectUrl=URL.createObjectURL(blob);
    window.open(objectUrl,'_blank','noopener,noreferrer');
  }catch(error){alert(error.message)}
}
function Field({label,children}){return <label className="field"><span>{label}</span>{children}</label>}
function Modal({title,close,children}){return <div className="backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><div className="modal"><div className="modal-head"><h2>{title}</h2><button className="close" onClick={close}>×</button></div>{children}</div></div>}
function ExpenseTable({expenses,onDelete,isAdmin=true,auth=''}){
  return expenses.length?<div className="table-wrap"><table><thead><tr><th>DATE</th><th>DESCRIPTION</th><th>CATEGORY</th><th>PAYMENT</th><th>AMOUNT</th><th></th></tr></thead><tbody>{expenses.map(e=><tr key={e.id}><td>{e.date}</td><td><b>{e.description}</b>{e.paidTo&&<small>Paid to {e.paidTo}</small>}{e.receiptFile&&<small><a href="#" onClick={ev=>{ev.preventDefault();openReceipt(auth,API+'/receipts/'+encodeURIComponent(e.receiptFile))}}>View receipt</a></small>}{isAdmin&&<small><label className="replace-receipt">Replace receipt<input type="file" accept="image/*,.pdf" onChange={ev=>replaceReceipt(e.id,ev.target.files[0]).catch(error=>alert(error.message))}/></label></small>}</td><td><span className="pill">{e.category}</span></td><td>{e.paymentMethod}</td><td><b>{money(e.amount)}</b></td>{isAdmin&&<td><button className="icon-btn" title="Delete expense" onClick={()=>onDelete(e.id)}><Trash2 size={16}/></button></td>}</tr>)}</tbody></table></div>:<div className="empty"><Receipt size={28}/><b>No expenses recorded yet</b><span>Add your first renovation expense to start tracking your budget.</span></div>}
