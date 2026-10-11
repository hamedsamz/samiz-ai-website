'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { balances, settlements, parseAmount, type Trip, type Expense } from './calculations';
import './dangi.css';
const money = (n: number) => new Intl.NumberFormat('fa-IR').format(n);
const uid = () => crypto.randomUUID();
const categories: Record<string,string> = { food:'🍜 خورد و خوراک', stay:'🏡 اقامت', transport:'🚙 رفت‌وآمد', fun:'🎟️ تفریح', other:'🛍️ سایر' };
const fresh = (name: string): Trip => ({id:uid(), name, people:[], expenses:[], payments:[]});
const KEY = 'samiz-dangi-v1';
export default function Dongi() {
  const dialogRef = useRef<HTMLElement>(null);
  const [trips,setTrips] = useState<Trip[]>([]);
  const [active,setActive] = useState('');
  const [ready,setReady] = useState(false);
  const [notice,setNotice] = useState('');
  const [tab,setTab] = useState('expenses');
  const [modal,setModal] = useState<'trip'|'person'|'expense'|null>(null);
  const [editing,setEditing] = useState('');
  const [name,setName] = useState('');
  const [title,setTitle] = useState('');
  const [amount,setAmount] = useState('');
  const [payer,setPayer] = useState('');
  const [members,setMembers] = useState<string[]>([]);
  const [category,setCategory] = useState('food');
  const [error,setError] = useState('');
  useEffect(() => {
    try { const saved = localStorage.getItem(KEY); if(saved) { const data=JSON.parse(saved); if(data.version===1 && Array.isArray(data.trips)) { setTrips(data.trips); setActive(data.active || data.trips[0]?.id || ''); } } } catch { setNotice('اطلاعات ذخیره‌شده قابل خواندن نبود. یک سفر جدید بسازید.'); }
    setReady(true);
  },[]);
  useEffect(() => { if(ready) { try { localStorage.setItem(KEY,JSON.stringify({version:1,trips,active})); } catch { setNotice('ذخیره در این مرورگر ممکن نیست؛ از گزارش سفر خروجی بگیرید.'); } } },[trips,active,ready]);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModal(null);
      if (event.key !== 'Tab') return;
      const items = dialogRef.current?.querySelectorAll<HTMLElement>('button, input, select');
      if (!items?.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handle);
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener('keydown', handle); previous?.focus(); };
  }, [modal]);
  const trip = trips.find(t=>t.id===active) || trips[0];
  const total = trip?.expenses.reduce((s,e)=>s+e.amount,0) || 0;
  const balance = trip ? balances(trip) : {};
  const transfers = trip ? settlements(trip) : [];
  const personName = (id:string) => trip?.people.find(p=>p.id===id)?.name || '';
  const update = (fn:(t:Trip)=>Trip) => setTrips(old=>old.map(t=>t.id===trip?.id?fn(t):t));
  const open = (kind:'trip'|'person'|'expense',expense?:Expense) => {
    setError(''); setName(''); setModal(kind); setEditing(expense?.id || '');
    setTitle(expense?.title || ''); setAmount(expense?String(expense.amount):'');
    setPayer(expense?.payer || trip?.people[0]?.id || ''); setMembers(expense?.participants || trip?.people.map(p=>p.id) || []); setCategory(expense?.category || 'food');
  };
  const save = (event:React.FormEvent) => {
    event.preventDefault();
    if(modal==='trip') { if(!name.trim()) return setError('اسم سفر را وارد کنید.'); const next=fresh(name.trim()); setTrips(old=>[...old,next]); setActive(next.id); setTab('expenses'); }
    if(modal==='person') { if(!name.trim()) return setError('نام هم‌سفر را وارد کنید.'); if(trip?.people.some(p=>p.name===name.trim())) return setError('این نام قبلاً ثبت شده؛ یک نام متمایز بنویسید.'); update(t=>({...t,people:[...t.people,{id:uid(),name:name.trim()}]})); }
    if(modal==='expense') {
      const value=parseAmount(amount);
      if(!title.trim() || !Number.isSafeInteger(value) || value<=0 || value>1e12 || !payer || !members.length) return setError('عنوان، مبلغ معتبر (تا یک تریلیون تومان)، پرداخت‌کننده و حداقل یک نفر را مشخص کنید.');
      if(total-(trip?.expenses.find(e=>e.id===editing)?.amount || 0)+value>Number.MAX_SAFE_INTEGER) return setError('مجموع هزینه‌ها بیش از حد مجاز است.');
      const expense:Expense={id:editing || uid(),title:title.trim(),amount:value,payer,participants:members,category,date:trip?.expenses.find(e=>e.id===editing)?.date || new Date().toISOString()};
      update(t=>({...t,expenses:editing?t.expenses.map(e=>e.id===editing?expense:e):[expense,...t.expenses]}));
    }
    setModal(null);
  };
  const report = () => !trip?'': `دنگی | ${trip.name}\nمجموع هزینه‌ها: ${money(total)} تومان\n\n${trip.expenses.map(e=>`${e.title}: ${money(e.amount)} تومان — پرداخت ${personName(e.payer)}`).join('\n')}\n\nمانده حساب:\n${trip.people.map(p=>`${p.name}: ${money(Math.abs(balance[p.id]))} تومان ${balance[p.id]>0?'طلبکار':balance[p.id]<0?'بدهکار':'تسویه'}`).join('\n')}\n\nپیشنهاد تسویه:\n${transfers.map(p=>`${personName(p.from)} ← پرداخت ${money(p.amount)} تومان به ${personName(p.to)}`).join('\n') || 'همه حساب‌ها تسویه است.'}`;
  const share = async () => { try { if(navigator.share) await navigator.share({title:`دنگی — ${trip?.name}`,text:report()}); else { await navigator.clipboard.writeText(report()); setNotice('گزارش کپی شد؛ برای هم‌سفرها بفرستید.'); } } catch(e) { if((e as Error).name!=='AbortError') setNotice('اشتراک‌گذاری ممکن نبود؛ گزارش را دانلود کنید.'); } };
  const download = () => { const url=URL.createObjectURL(new Blob(['\uFEFF'+report()],{type:'text/plain;charset=utf-8'})); const a=document.createElement('a'); a.href=url; a.download='dongi-report.txt'; a.click(); URL.revokeObjectURL(url); };
  const demo = () => { const t:Trip={id:uid(),name:'سفر نمونه به شمال',people:[{id:'a',name:'حامد'},{id:'b',name:'زهرا'},{id:'c',name:'علی'}],expenses:[{id:uid(),title:'ویلای جنگلی',amount:3600000,payer:'a',participants:['a','b','c'],category:'stay',date:new Date().toISOString()},{id:uid(),title:'ناهار کنار دریا',amount:900000,payer:'b',participants:['a','b','c'],category:'food',date:new Date().toISOString()}],payments:[]}; setTrips(old=>[...old,t]);setActive(t.id); };
  return <main className="dangi">
    <header className="dg-header"><Link href="/" className="dg-brand">SAMIZ <span> / دنگی</span></Link><Link href="/">بازگشت به سایت ↗</Link></header>
    <div className="dg-shell"><section className="dg-intro"><div><div className="dg-eyebrow"><span/> سفر مشترک، حساب روشن</div><h1>خاطره‌ها با هم.<br/><em>هزینه‌ها، منصفانه.</em></h1><p>تو از سفر لذت ببر؛ حساب دنگ‌ها با دنگی.</p></div><div className="dg-art" aria-hidden="true"><div className="dg-orbit"/><span className="dg-sun"/><div className="dg-mountain m1"/><div className="dg-mountain m2"/><div className="dg-ticket">DONGI <span>✦</span><small>هم‌سفرِ حساب‌وکتاب</small></div></div></section>
    {notice && <div className="dg-notice" role="status">{notice}<button aria-label="بستن پیام" onClick={()=>setNotice('')}>×</button></div>}
    {!ready ? <div className="dg-empty">در حال آماده‌سازی…</div> : !trip ? <section className="dg-welcome"><div className="dg-empty-icon">✦</div><h2>اولین سفرت رو بساز</h2><p>هم‌سفرها رو اضافه کن و هر هزینه رو همون لحظه ثبت کن.</p><button className="dg-primary" onClick={()=>open('trip')}>+ ساخت سفر جدید</button><button className="dg-ghost" onClick={demo}>دیدن یک سفر نمونه ↗</button><small>بدون ثبت‌نام • مبلغ‌ها به تومان • ذخیره روی همین مرورگر</small></section> : <>
    <div className="dg-toolbar"><label>سفرهای من<select aria-label="انتخاب سفر" value={trip.id} onChange={e=>{setActive(e.target.value);setTab('expenses');}}>{trips.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><div><button className="dg-ghost" onClick={()=>open('trip')}>+ سفر جدید</button><button className="dg-ghost" onClick={share}>اشتراک گزارش ↗</button></div></div>
    <section className="dg-stats"><div className="dg-stat featured"><span>کل هزینه‌های سفر</span><strong>{money(total)} <small>تومان</small></strong><span className="dg-stat-foot">{money(trip.expenses.length)} هزینه ثبت‌شده <b>↗</b></span></div><div className="dg-stat"><span>هم‌سفرها</span><strong>{money(trip.people.length)} <small>نفر</small></strong><div className="dg-avatars">{trip.people.slice(0,5).map(p=><span key={p.id} title={p.name}>{p.name.slice(0,1)}</span>)}<button onClick={()=>open('person')} aria-label="افزودن هم‌سفر">+</button></div></div><div className="dg-stat"><span>مانده برای تسویه</span><strong>{money(transfers.reduce((s,p)=>s+p.amount,0))} <small>تومان</small></strong><span className="dg-stat-foot">{transfers.length ? `${money(transfers.length)} پرداخت پیشنهادی`:'حساب‌ها صافه ✦'}</span></div></section>
    <div className="dg-workspace"><section className="dg-panel"><div className="dg-panel-head"><div className="dg-tabs" role="tablist" aria-label="بخش‌های سفر">{[['expenses','هزینه‌ها'],['people','هم‌سفرها'],['settle','تسویه']].map(([key,label])=><button role="tab" aria-selected={tab===key} className={tab===key?'selected':''} key={key} onClick={()=>setTab(key)}>{label}</button>)}</div><button className="dg-primary" onClick={()=>open(trip.people.length?'expense':'person')}>+ {trip.people.length?'ثبت هزینه':'هم‌سفر'}</button></div>
    {tab==='expenses' && (!trip.expenses.length ? <div className="dg-empty"><span>🧾</span><h3>هنوز هزینه‌ای ثبت نشده</h3><p>{trip.people.length?'اقامت، غذا یا بنزین؛ اولین هزینه رو اضافه کن.':'اول هم‌سفرها رو اضافه کن، بعد هزینه‌ها رو ثبت کن.'}</p></div> : <div className="dg-expenses">{trip.expenses.map(e=><article className="dg-expense" key={e.id}><span className="dg-category">{categories[e.category]?.split(' ')[0]}</span><div className="dg-expense-copy"><h3>{e.title}</h3><p>{personName(e.payer)} پرداخت کرده · {money(e.participants.length)} نفر</p><small>{categories[e.category]?.split(' ').slice(1).join(' ')} · {new Date(e.date).toLocaleDateString('fa-IR')}</small></div><div className="dg-expense-price"><strong>{money(e.amount)}</strong><small>تومان</small><div><button onClick={()=>open('expense',e)} aria-label={`ویرایش ${e.title}`}>ویرایش</button><button onClick={()=>{if(confirm('این هزینه حذف شود؟'))update(t=>({...t,expenses:t.expenses.filter(x=>x.id!==e.id)}));}} aria-label={`حذف ${e.title}`}>حذف</button></div></div></article>)}</div>)}
    {tab==='people' && <div className="dg-people">{trip.people.map(p=><article key={p.id}><span className="dg-avatar">{p.name.slice(0,1)}</span><div><h3>{p.name}</h3><p className={balance[p.id]>0?'positive':balance[p.id]<0?'negative':''}>{money(Math.abs(balance[p.id]))} تومان {balance[p.id]>0?'طلبکار':balance[p.id]<0?'بدهکار':'تسویه'}</p></div><button className="dg-remove" aria-label={`حذف ${p.name}`} onClick={()=>{if(trip.expenses.some(e=>e.payer===p.id || e.participants.includes(p.id)) || trip.payments.some(e=>e.from===p.id || e.to===p.id))setNotice('این هم‌سفر در حساب‌ها حضور دارد؛ ابتدا هزینه‌ها و پرداخت‌های مربوط را حذف کنید.');else update(t=>({...t,people:t.people.filter(x=>x.id!==p.id)}));}}>×</button></article>)}<button className="dg-add-person" onClick={()=>open('person')}>+ افزودن هم‌سفر</button></div>}
    {tab==='settle' && <div className="dg-settle"><p>این پرداخت‌ها ماندهٔ حساب‌ها را صفر می‌کند. فقط پس از پرداخت واقعی، «پرداخت شد» را بزن.</p>{!transfers.length && <div className="dg-empty"><span>✨</span><h3>{trip.expenses.length?'همه حساب‌ها صافه!':'بعد از ثبت هزینه، پیشنهاد تسویه اینجا می‌آید.'}</h3></div>}{transfers.map(p=><article key={p.from+p.to}><div><strong>{personName(p.from)} <span>←</span> {personName(p.to)}</strong><p>{money(p.amount)} تومان</p></div><button className="dg-ghost" onClick={()=>{if(confirm(`پرداخت ${money(p.amount)} تومان از ${personName(p.from)} به ${personName(p.to)} انجام شده؟`))update(t=>({...t,payments:[...t.payments,{...p,id:uid()}]}));}}>پرداخت شد ✓</button></article>)}{trip.payments.length>0 && <><h3>پرداخت‌های ثبت‌شده</h3>{trip.payments.map(p=><article key={p.id}><div><strong>{personName(p.from)} به {personName(p.to)}</strong><p>{money(p.amount)} تومان · پرداخت شد</p></div><button className="dg-ghost" onClick={()=>{if(confirm('این پرداخت از حساب حذف شود؟'))update(t=>({...t,payments:t.payments.filter(x=>x.id!==p.id)}));}}>برگرداندن</button></article>)}</>}</div>}
    </section><aside className="dg-side"><div className="dg-note"><span>✦</span><h2>دنگِ دقیق،<br/>سفرِ بی‌دغدغه.</h2><p>هر هزینه می‌تونه بین همه یا فقط چند نفر تقسیم بشه. سهم‌ها تا آخرین تومان حساب می‌شن.</p><div className="dg-note-line"/><small>واحد همهٔ مبلغ‌ها: تومان</small></div><div className="dg-report"><h3>حساب سفر دست خودته</h3><p>گزارش رو دانلود کن یا برای هم‌سفرها بفرست.</p><button onClick={download}>دانلود گزارش ↓</button></div></aside></div>
    </>}
    <footer className="dg-footer"><span>ساخته‌شده با ♥ در SAMIZ</span><span>اطلاعات فقط در همین مرورگر ذخیره می‌شود.</span></footer></div>
    {modal && <div className="dg-overlay" onClick={e=>{if(e.target===e.currentTarget)setModal(null);}}><section ref={dialogRef} className="dg-modal" role="dialog" aria-modal="true" aria-labelledby="dg-modal-title" onKeyDown={e=>{if(e.key==='Escape')setModal(null);}}><div className="dg-modal-head"><h2 id="dg-modal-title">{modal==='trip'?'یه سفر تازه':modal==='person'?'هم‌سفر جدید':editing?'ویرایش هزینه':'ثبت هزینه'}</h2><button onClick={()=>setModal(null)} aria-label="بستن">×</button></div><form onSubmit={save}>{modal!=='expense'?<label>{modal==='trip'?'اسم سفر':'نام هم‌سفر'}<input autoFocus maxLength={60} value={name} onChange={e=>setName(e.target.value)} placeholder={modal==='trip'?'مثلاً: آخر هفته در شمال':'مثلاً: زهرا'} required/></label>:<><label>عنوان هزینه<input autoFocus maxLength={100} value={title} onChange={e=>setTitle(e.target.value)} placeholder="مثلاً: شام شب اول" required/></label><label>مبلغ به تومان<input inputMode="numeric" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="مثلاً: ۹۰۰٬۰۰۰" required/><small>{Number.isFinite(parseAmount(amount))?`${money(parseAmount(amount))} تومان`:'عدد فارسی یا انگلیسی وارد کن'}</small></label><div className="dg-form-row"><label>چه کسی پرداخت کرد؟<select value={payer} onChange={e=>setPayer(e.target.value)}>{trip?.people.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>دسته‌بندی<select value={category} onChange={e=>setCategory(e.target.value)}>{Object.entries(categories).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label></div><fieldset><legend>تقسیم مساوی بین</legend><div className="dg-member-options">{trip?.people.map(p=><label key={p.id}><input type="checkbox" checked={members.includes(p.id)} onChange={e=>setMembers(old=>e.target.checked?[...old,p.id]:old.filter(id=>id!==p.id))}/>{p.name}</label>)}</div><small>سهم تقریبی هر نفر: {members.length && Number.isFinite(parseAmount(amount))?money(Math.floor(parseAmount(amount)/members.length)):'—'} تومان</small></fieldset></>}{error && <p className="dg-error" role="alert">{error}</p>}<button className="dg-primary dg-submit" type="submit">{modal==='expense'?'ذخیره هزینه':modal==='trip'?'ساخت سفر':'اضافه کردن هم‌سفر'} ✓</button><button type="button" className="dg-ghost dg-submit" onClick={()=>setModal(null)}>انصراف</button></form></section></div>}
  </main>;
}
