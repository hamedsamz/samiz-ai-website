import {makeMap,STAGES,SPAWN,cell,move,hasSight,route,checkAnswer,safeProgress,checkpoint} from './world.js';
import {Renderer} from './renderer.js';
import {HouseAudio} from './audio.js';

const $=id=>document.getElementById(id),fa=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const KEY='samiz-house-of-rain-v1',SETTINGS='samiz-house-of-rain-settings';
const map=makeMap(),renderer=new Renderer($('world'),map),audio=new HouseAudio();
let mode='menu',stage=0,notes=new Set(),player={...SPAWN,pitch:0},elapsed=0,catches=0,steps=0,stamina=1,hidden=false,enemy=null,chaseAt=Infinity,nextHaunt=35,hauntCount=0;
let nextFoot=0,enemyPath=[],pathAt=0,enemyAge=0,enemyGrace=0,hideTime=0,nearest=null,sequence=[],wordSequence=[],knockTimer=0,knockPlaying=false,dialogReturn=null,saved=null;
let previous=performance.now(),gameTime=0,subtitleTimer=0,toastTimer=0,chapterTimer=0,roomPrevious='',walking=false,joystick={x:0,y:0},runningTouch=false;
const keys=new Set(),coarse=matchMedia('(pointer:coarse)').matches;
let settings={volume:.65,music:.4,brightness:1.1,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,sensitivity:1};
try{const data=JSON.parse(localStorage.getItem(SETTINGS)||'null');if(data){for(const [k,min,max]of[['volume',0,1],['music',0,1],['brightness',.7,1.8],['sensitivity',.3,2]])if(Number.isFinite(data[k]))settings[k]=clamp(data[k],min,max);if(typeof data.reduced==='boolean')settings.reduced=data.reduced;}}catch{}
audio.level=settings.volume;audio.musicLevel=settings.music;document.body.classList.toggle('reduced',settings.reduced);
try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&v.version===1&&Number.isInteger(v.stage)&&v.stage>=0&&v.stage<=5){saved={stage:safeProgress(v.stage),notes:Array.isArray(v.notes)?v.notes.filter(i=>Number.isInteger(i)&&i>=0&&i<5):[],elapsed:Number.isFinite(v.elapsed)?clamp(v.elapsed,0,1e7):0,catches:Number.isInteger(v.catches)?clamp(v.catches,0,10000):0};}}catch{}
if(saved){$('continue').hidden=false;$('start').innerHTML='شروع از اول <span>←</span>';}

function save(){try{localStorage.setItem(KEY,JSON.stringify({version:1,stage,notes:[...notes],elapsed,catches}));}catch{}}
function saveSettings(){try{localStorage.setItem(SETTINGS,JSON.stringify(settings));}catch{}}
function clearInput(){keys.clear();joystick={x:0,y:0};runningTouch=false;$('stick').style.transform='';}
function subtitle(text,duration=5){clearTimeout(subtitleTimer);$('subtitle').textContent=text;$('subtitle').classList.add('visible');subtitleTimer=setTimeout(()=>$('subtitle').classList.remove('visible'),duration*1000);}
function toast(text,duration=3.5){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').classList.add('visible');toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),duration*1000);}
function chapter(number,title,desc){clearTimeout(chapterTimer);$('chapter-number').textContent=number;$('chapter-name').textContent=title;$('chapter-desc').textContent=desc;const el=$('chapter-card');el.hidden=false;el.style.animation='none';void el.offsetWidth;el.style.animation='';chapterTimer=setTimeout(()=>el.hidden=true,settings.reduced?1800:3200);}
function openDialog(title,content,kicker='خانهٔ باران'){
  clearInput();stopKnocks();dialogReturn=document.activeElement;$('dialog-title').textContent=title;$('dialog-content').innerHTML=content;$('dialog-kicker').textContent=kicker;
  if(!$('dialog').open)$('dialog').showModal();
}
function closeDialog(){stopKnocks();$('dialog').close();clearInput();if(mode==='paused'){mode='playing';audio.start();}if(dialogReturn?.isConnected)dialogReturn.focus();else $('world').focus();}
$('close-dialog').onclick=closeDialog;
$('dialog').addEventListener('cancel',e=>{e.preventDefault();closeDialog();});
$('dialog').addEventListener('keydown',e=>{if(['KeyW','KeyA','KeyS','KeyD','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.stopPropagation();});

function updateHUD(){
  const s=STAGES[Math.min(stage,4)];$('stage-label').textContent=stage<5?`مرحلهٔ ${fa(stage+1)} از ۵`:'هر پنج معما حل شد';$('stage-title').textContent=stage<5?s.title:'راهِ خانه';$('objective-text').textContent=stage<5?s.target:'کلید را داری. به درِ ورودی، انتهای راهروی جنوبی برگرد.';
  $('progress').innerHTML=STAGES.map((_,i)=>`<i class="${i<stage?'done':i===stage?'active':''}"></i>`).join('');$('note-count').textContent=fa(notes.size);$('pause').hidden=false;
}
function start(resume=false){
  closeDialog();mode='playing';stage=resume&&saved?saved.stage:0;notes=new Set(resume&&saved?saved.notes:[]);elapsed=resume&&saved?saved.elapsed:0;catches=resume&&saved?saved.catches:0;
  player={...checkpoint(stage),pitch:0};stamina=1;enemy=null;hidden=false;gameTime=0;nextHaunt=35;chaseAt=Infinity;hauntCount=0;nextFoot=0;roomPrevious='';
  $('hidden-veil').hidden=true;$('caught').hidden=true;$('ending').hidden=true;$('menu').hidden=true;$('hud').hidden=false;$('danger').style.opacity=0;clearInput();audio.start();updateHUD();save();
  chapter(resume?'بازگشت به خانه':'فصل اول',resume?'خانه هنوز منتظر است':'صدایی پشت در',resume?'پیشرفت تو محفوظ است. از همین‌جا ادامه بده.':'شمال ایران · یک شب بارانی');
  setTimeout(()=>{if(mode==='playing')subtitle(stage===0?'«گفتی کسی اینجا نیست… پس این صدا از کجاست؟»':'یادداشت‌ها و نشان‌ها در دفترچه‌ات هستند.',6);},3300);
  $('world').focus();
}
$('start').onclick=()=>{if(saved){openDialog('دوباره از آستانهٔ خانه؟','<p>با شروع بازی جدید، پیشرفت قبلی همین مرورگر جایگزین می‌شود.</p><div class="dialog-actions"><button class="primary" id="confirm-new">شروع بازی جدید ←</button><button class="secondary" id="cancel-new">برگشت</button></div>');$('confirm-new').onclick=()=>start(false);$('cancel-new').onclick=closeDialog;}else start(false);};
$('continue').onclick=()=>start(true);

function controls(){
  openDialog('خانه را بشناس',`<p>پنج اتاق، پنج معما. سرنخ‌ها را بردار و اشیای نورانی را بررسی کن. درِ هر اتاق بعد از حل معمای قبلی باز می‌شود.</p><div class="control-grid"><span>کامپیوتر</span><span>WASD برای حرکت؛ موس را بکش یا از کلیدهای جهت چپ و راست برای نگاه‌کردن استفاده کن.</span><span>بررسی و دویدن</span><span>E برای بررسی، Shift برای دویدن، J دفترچه، H راهنما و Esc توقف.</span><span>موبایل</span><span>جوی‌استیک چپ برای حرکت؛ سمت راست صفحه را بکش تا اطراف را ببینی. دکمهٔ «بررسی» کنار اشیا ظاهر می‌شود.</span><span>پنهان شدن</span><span>به کمد نزدیک شو و «بررسی» را بزن. اگر موجود خیلی نزدیک باشد، پنهان‌شدن را می‌بیند. کمی فاصله بگیر.</span><span>نقشه و سرنخ</span><span>دفترچه، نقشهٔ خانه و سرنخ‌های جمع‌شده را نگه می‌دارد. در معماها هم «راهنمای معما» داری.</span><span>ذخیره</span><span>معماهای حل‌شده در همین مرورگر ذخیره می‌شوند. اگر گرفتار شوی، از آخرین نقطه برمی‌گردی.</span></div><p class="dialog-footer">این داستان تخیلی است و از فضای قصه‌های محلی ایران الهام گرفته. نوشتهٔ مذهبی بخشی از خاطرات شخصیت‌هاست. صدا پس از لمس «ورود» فعال می‌شود؛ هدفون اختیاری است.</p>`,'راهنمای بازی');
}
$('how').onclick=controls;$('help').onclick=controls;

function settingsDialog(){
  openDialog('صدا و تصویر',`<div class="settings"><label>بلندی صدا<input aria-label="بلندی صدا" id="volume-setting" type="range" min="0" max="100" value="${settings.volume*100}"></label><label>موسیقی<input aria-label="بلندی موسیقی" id="music-setting" type="range" min="0" max="100" value="${settings.music*100}"></label><label>روشنایی<input aria-label="روشنایی تصویر" id="brightness-setting" type="range" min="70" max="180" value="${settings.brightness*100}"></label><label>حساسیت نگاه<input aria-label="حساسیت نگاه" id="sensitivity-setting" type="range" min="30" max="200" value="${settings.sensitivity*100}"></label><label class="check"><input id="motion-setting" type="checkbox" ${settings.reduced?'checked':''}> کاهش حرکت و لرزش تصویر</label></div><p class="dialog-footer">صدا و موسیقی داخل بازی ساخته می‌شوند. برای قطع کامل صدا، بلندی صدا را روی صفر بگذار.</p>`,'تنظیمات');
  for(const [id,key]of[['volume','volume'],['music','music'],['brightness','brightness'],['sensitivity','sensitivity']])$(id+'-setting').oninput=e=>{settings[key]=Number(e.target.value)/100;audio.setVolume(settings.volume);audio.setMusic(settings.music);saveSettings();};
  $('motion-setting').onchange=e=>{settings.reduced=e.target.checked;document.body.classList.toggle('reduced',settings.reduced);saveSettings();};
}
$('sound').onclick=settingsDialog;
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('مرورگر این دستگاه تمام‌صفحه را پشتیبانی نمی‌کند.');}catch{toast('تمام‌صفحه در این مرورگر در دسترس نیست.');}};

function pause(){if(mode!=='playing')return;mode='paused';clearInput();save();audio.suspend();openDialog('یک لحظه نفس بگیر.','<p>خانه منتظر می‌ماند. معماها و سرنخ‌ها ذخیره شده‌اند.</p><div class="dialog-actions"><button id="resume" class="primary">ادامهٔ بازی ←</button><button id="pause-menu" class="secondary">منوی اصلی</button></div>','توقف');$('resume').onclick=closeDialog;$('pause-menu').onclick=()=>{mode='menu';closeDialog();$('menu').hidden=false;$('hud').hidden=true;$('pause').hidden=true;$('hidden-veil').hidden=true;$('danger').style.opacity=0;$('subtitle').classList.remove('visible');saved={stage,notes:[...notes],elapsed,catches};$('continue').hidden=false;$('start').innerHTML='شروع از اول <span>←</span>';audio.suspend();};}
$('pause').onclick=pause;

function journal(){
  const entries=STAGES.map((s,i)=>notes.has(i)||i<stage?`<article class="journal-entry"><h3>${fa(i+1)} / ${s.room} ${i<stage?`<b> · نشان ${s.mark}</b>`:''}</h3><p>${notes.has(i)?s.clue:'معمای این اتاق حل شده است.'}</p></article>`:'').join('');
  openDialog('دفترچهٔ خانه',`<div class="map-wrap"><canvas id="house-map" width="275" height="275" aria-label="نقشه؛ نقطه سفید تو هستی، نقطه طلایی هدف فعلی و مربع‌های سبز کمدها هستند."></canvas></div><p style="text-align:center;font-size:10px">سفید: تو · طلایی: هدف · سبز: کمد · آبی: سرنخ</p>${entries||'<p class="journal-empty">هنوز سرنخی پیدا نکردی. اتاق اول در سمت چپ راهروی ورودی است.</p>'}<p class="dialog-footer">${stage<5?`هدف فعلی: ${STAGES[stage].room}`:'هدف: بازگشت به درِ ورودی در جنوب نقشه.'}</p>`,'سرنخ‌ها و نقشه');
  const c=$('house-map'),g=c.getContext('2d'),sz=11;g.fillStyle='#0c1712';g.fillRect(0,0,275,275);
  for(let y=0;y<25;y++)for(let x=0;x<25;x++){const v=cell(map,x+.5,y+.5,stage);g.fillStyle=v===0?'#283b2c':v>=10?'#8b6950':'#111f18';g.fillRect(x*sz,y*sz,sz-1,sz-1);}
  for(const s of renderer.hideouts){g.fillStyle='#70916b';g.fillRect(s.x*sz-2,s.y*sz-2,4,4);}
  for(const s of renderer.notes){if(s.stage>stage)continue;g.fillStyle=notes.has(s.stage)?'#365245':'#6da4a7';g.fillRect(s.x*sz-2,s.y*sz-2,4,4);}
  const target=stage<5?STAGES[stage]:{x:12.5,y:23};g.fillStyle='#dcc98c';g.beginPath();g.arc(target.x*sz,target.y*sz,4,0,7);g.fill();g.fillStyle='#f0f0db';g.beginPath();g.arc(player.x*sz,player.y*sz,3,0,7);g.fill();g.strokeStyle='#e5efcd';g.beginPath();g.moveTo(player.x*sz,player.y*sz);g.lineTo((player.x+Math.cos(player.angle)*.7)*sz,(player.y+Math.sin(player.angle)*.7)*sz);g.stroke();
}
$('journal').onclick=journal;

function stopKnocks(){clearTimeout(knockTimer);knockPlaying=false;}
function replayKnocks(){
  stopKnocks();knockPlaying=true;let group=0,hit=0;const counts=[2,1,3];$('knock-visual').textContent='شروع پخش…';
  const tick=()=>{if(!$('dialog').open||!$('sound-led'))return stopKnocks();if(group>=counts.length){$('knock-visual').textContent='پایان پخش · حالا ترتیب را وارد کن';$('sound-led').classList.remove('on');knockPlaying=false;return;}
    audio.knock((group-1)*.4);hit++;$('sound-led').classList.add('on');$('knock-visual').textContent=`دستهٔ ${fa(group+1)}: ${'● '.repeat(hit)}`;
    knockTimer=setTimeout(()=>{if(!$('sound-led'))return; $('sound-led').classList.remove('on');if(hit>=counts[group]){group++;hit=0;knockTimer=setTimeout(tick,1000);}else knockTimer=setTimeout(tick,280);},180);
  };knockTimer=setTimeout(tick,500);
}
function puzzle(index){
  if(index<stage)return toast('این معما حل شده است؛ نشانش در دفترچه ثبت شده.');
  if(index>stage)return toast('اول معمای اتاق قبلی را حل کن.');
  const s=STAGES[index];sequence=[];wordSequence=[];
  let content=`<p>${['روی قفل صندوق نوشته: «سالِ عکس». عکس خانوادگی را در همین اتاق پیدا کن.','اتاق واقعی و انعکاسش را مقایسه کن. کدام وسیله در آینه دیده نمی‌شود؟','رادیو خاموش است، اما هنوز از آن ضربه می‌آید. هر دسته را بشمار؛ سپس سه عدد را به همان ترتیب انتخاب کن.','نامهٔ مادر پاره شده. چهار تکه را با ترتیبی که در دفترش نوشته کنار هم بگذار.','چهار نشان را به ترتیب خاطره‌ها وارد کن: عکس، آینه، صدا، نامه.'][index]}</p>`;
  if(s.kind==='code'||s.kind==='final'){
    if(s.kind==='final')content+=`<div class="paper">${STAGES.slice(0,4).map((x,i)=>`${fa(i+1)}. ${x.room}: <b>${x.mark}</b>`).join('<br>')}</div>`;
    content+='<form id="code-form"><input id="code" class="code-input" inputmode="numeric" autocomplete="off" maxlength="4" aria-label="رمز چهاررقمی" placeholder="— — — —" required><p class="error" id="puzzle-error" role="status"></p><button type="submit" class="primary">امتحان قفل ←</button></form>';
  }else if(s.kind==='mirror'){
    content+='<div class="mirror-pair"><div class="mini-room"><span>اتاق واقعی</span>🕰<br>🪴 🪑 🕯</div><div class="mini-room reflection"><span>داخل آینه</span>　<br>🪴 🪑 🕯</div></div><div class="options"><button class="option" data-answer="lamp">چراغ</button><button class="option" data-answer="clock">ساعت</button><button class="option" data-answer="plant">گلدان</button><button class="option" data-answer="chair">صندلی</button></div><p class="error" id="puzzle-error" role="status"></p>';
  }else if(s.kind==='sound'){
    content+='<button id="play-knocks" class="secondary"><i id="sound-led" class="sound-light"></i>پخش ضربه‌ها ◖◗</button><p class="knock-group" id="knock-visual" role="status">نشانهٔ دیداری ضربه‌ها هم اینجا نمایش داده می‌شود.</p><div class="sequence" id="sequence" aria-live="polite">— — —</div><div class="sound-buttons"><button class="option" data-digit="1">۱</button><button class="option" data-digit="2">۲</button><button class="option" data-digit="3">۳</button></div><div class="dialog-actions"><button id="clear-sequence" class="secondary">پاک کردن</button><button id="check-sequence" class="primary">ثبت ترتیب ←</button></div><p class="error" id="puzzle-error" role="status"></p>';
  }else{
    content+='<div class="sequence word-slots" id="word-sequence" aria-live="polite">چهار تکهٔ نامه…</div><div class="options">'+['الرحیم','بسم','الرحمن','الله'].map(w=>`<button class="option" data-word="${w}">${w}</button>`).join('')+'</div><div class="dialog-actions"><button id="clear-words" class="secondary">از اول</button><button id="check-words" class="primary">کنار هم بگذار ←</button></div><p class="error" id="puzzle-error" role="status"></p>';
  }
  content+='<div style="margin-top:18px"><button id="puzzle-hint" class="hint-btn">راهنمای معما</button><div class="hint" id="puzzle-hint-text" hidden></div></div>';
  openDialog(s.title,content,`مرحلهٔ ${fa(index+1)} · ${s.room}`);
  $('puzzle-hint').onclick=()=>{$('puzzle-hint-text').hidden=false;$('puzzle-hint-text').textContent=s.hint;};
  const answer=value=>{if(checkAnswer(index,value)){solve(index);}else{$('puzzle-error').textContent='هنوز درست نیست. سرنخ را دوباره بخوان.';audio.tone(85,.15,.07);}};
  if($('code-form'))$('code-form').onsubmit=e=>{e.preventDefault();answer($('code').value);};
  document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>answer(b.dataset.answer));
  if(s.kind==='sound'){
    $('play-knocks').onclick=()=>{audio.start();replayKnocks();};
    document.querySelectorAll('[data-digit]').forEach(b=>b.onclick=()=>{if(sequence.length===3)sequence=[];sequence.push(b.dataset.digit);$('sequence').textContent=fa(sequence.join('  '));audio.knock();});
    $('clear-sequence').onclick=()=>{sequence=[];$('sequence').textContent='— — —';};$('check-sequence').onclick=()=>answer(sequence.join(''));
  }
  if(s.kind==='words'){
    const refresh=()=>{$('word-sequence').textContent=wordSequence.join(' ')||'چهار تکهٔ نامه…';document.querySelectorAll('[data-word]').forEach(b=>{b.disabled=wordSequence.includes(b.dataset.word);b.classList.toggle('selected',b.disabled);});};
    document.querySelectorAll('[data-word]').forEach(b=>b.onclick=()=>{if(!wordSequence.includes(b.dataset.word)){wordSequence.push(b.dataset.word);refresh();}});
    $('clear-words').onclick=()=>{wordSequence=[];refresh();};$('check-words').onclick=()=>answer(wordSequence.join('|'));
  }
}
function solve(index){
  if(index!==stage)return;stage++;notes.add(index);audio.success();audio.door();closeDialog();stamina=1;updateHUD();save();
  const text=stage===5?'کلید ورودی را پیدا کردی. برگرد به انتهای راهروی جنوبی.':`نشان ${STAGES[index].mark} در دفترچه ثبت شد. درِ ${STAGES[stage].room} باز شد.`;
  toast(text,5);
  if(stage===1){subtitle('«این عکس… من اینجا نبوده‌ام. چرا توی عکس هستم؟»',6);nextHaunt=gameTime+28;}
  if(stage>=2){enemy=null;chaseAt=gameTime+7;subtitle(stage===5?'[صدای بازشدن قفل] حالا فقط باید به درِ ورودی برسی.':'[صدای قدم از راهرو] چیزی صدای قفل را شنید. کمدها را به خاطر بسپار.',6);}
}

function interact(){
  if(mode!=='playing'||$('dialog').open||!$('chapter-card').hidden)return;
  if(hidden)return leaveHide();if(!nearest)return;
  const obj=nearest;
  if(obj.id==='exit'){if(stage===5)finish();else toast('در قفل است. کلید را در اتاق آخر پیدا کن.');return;}
  if(obj.id.startsWith('door'))return toast(`در قفل است؛ ابتدا مرحلهٔ ${fa(obj.stage)} را تمام کن.`);
  if(obj.id.startsWith('hide')){if(enemy&&Math.hypot(enemy.x-player.x,enemy.y-player.y)<3&&hasSight(map,player,enemy,stage))return toast('تو را می‌بیند! اول کمی فاصله بگیر.');hidden=true;hideTime=0;$('hidden-veil').hidden=false;$('interaction').hidden=true;clearInput();audio.creak();subtitle('[نفسِ آرام] منتظر بمان تا صدای قدم‌ها دور شود.',4);return;}
  if(obj.id.startsWith('note')){notes.add(obj.stage);save();updateHUD();audio.tone(190,.12,.03);openDialog(obj.label,`<div class="paper">${STAGES[obj.stage].clue}</div><p>این سرنخ در دفترچه ثبت شد.</p>`,STAGES[obj.stage].room);return;}
  if(obj.id.startsWith('puzzle'))puzzle(obj.stage);
}
function leaveHide(){hidden=false;$('hidden-veil').hidden=true;clearInput();audio.creak();}
$('interact').onclick=interact;$('leave-hide').onclick=leaveHide;

function findInteraction(){
  if(hidden){$('interaction').hidden=true;nearest=null;return;}
  let best=null,bestScore=Infinity;
  const objects=renderer.items.filter(o=>o.id),exit={id:'exit',x:12.5,y:23.05,label:stage===5?'درِ ورودی؛ خروج از خانه':'درِ ورودی؛ قفل است'};
  objects.push(exit);
  STAGES.forEach((s,i)=>{if(i>stage)objects.push({id:'door'+i,stage:i,x:s.door[0]+.5,y:s.door[1]+.5,label:`درِ ${s.room}؛ قفل است`});});
  for(const obj of objects){
    if((obj.id.startsWith('note')||obj.id.startsWith('puzzle'))&&obj.stage>stage)continue;
    const dx=obj.x-player.x,dy=obj.y-player.y,d=Math.hypot(dx,dy),dot=(dx*Math.cos(player.angle)+dy*Math.sin(player.angle))/Math.max(.01,d);
    if(d>2.05||dot<.45)continue;
    const sight=hasSight(map,player,obj,stage);if(!sight&&!obj.id.startsWith('door')&&obj.id!=='exit')continue;
    const score=d+(1-dot)*1.3;if(score<bestScore){best=obj;bestScore=score;}
  }
  nearest=best;$('interaction').hidden=!best;if(best){$('interaction-label').textContent=best.label;$('interact').innerHTML=`${best.id.startsWith('hide')?'پنهان شو':best.id==='exit'&&stage===5?'خروج':'بررسی'} <kbd>E</kbd>`;}
}

function spawnEnemy(){
  const spots=[{x:12.5,y:3.5},{x:12.5,y:12.5},{x:12.5,y:21.5}].sort((a,b)=>Math.hypot(b.x-player.x,b.y-player.y)-Math.hypot(a.x-player.x,a.y-player.y));
  enemy={...spots[0]};enemyAge=0;enemyGrace=3;pathAt=0;enemyPath=[];hideTime=0;audio.creak(.8);subtitle('[قدم‌های سنگین نزدیک می‌شوند] بدو یا دور از نگاهش در کمد پنهان شو.',6);chaseAt=Infinity;hauntCount++;
}
function caught(){
  mode='caught';enemy=null;hidden=false;$('hidden-veil').hidden=true;$('caught').hidden=false;$('hud').hidden=true;$('danger').style.opacity=0;$('subtitle').classList.remove('visible');audio.scare();clearInput();catches++;save();
}
$('retry').onclick=()=>{mode='playing';player={...checkpoint(stage),pitch:0};stamina=1;enemy=null;chaseAt=Infinity;nextHaunt=gameTime+40;$('caught').hidden=true;$('hud').hidden=false;audio.start();clearInput();toast('از آخرین نقطه برگشتی؛ سرنخ‌ها و معماهای حل‌شده محفوظ‌اند.',4);};
function finish(){
  mode='ending';enemy=null;$('hud').hidden=true;$('ending').hidden=false;$('danger').style.opacity=0;$('subtitle').classList.remove('visible');clearInput();audio.success();$('end-stats').textContent=`۵ معما حل شد · ${fa(Math.max(1,Math.floor(elapsed/60)))} دقیقه · ${fa(catches)} بار بازگشت`;
  try{localStorage.removeItem(KEY);}catch{}saved=null;
}
$('replay').onclick=()=>start(false);

document.addEventListener('keydown',e=>{
  if($('dialog').open)return;
  if(e.code==='Escape'){if(mode==='playing')pause();return;}
  if(mode!=='playing')return;
  if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight'].includes(e.code))e.preventDefault();
  keys.add(e.code);if(e.repeat)return;
  if(e.code==='KeyE'||e.code==='Space')interact();if(e.code==='KeyJ')journal();if(e.code==='KeyH')controls();
});
document.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{clearInput();if(mode==='playing'&&!$('dialog').open)pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();save();audio.suspend();if(mode==='playing'&&!$('dialog').open)pause();}else if(mode==='playing')audio.start();});
window.addEventListener('resize',()=>renderer.resize());
window.addEventListener('pagehide',()=>{if(mode==='playing'||mode==='paused')save();audio.suspend();});

let lookPointer=null,lastX=0,lastY=0;
$('world').addEventListener('pointerdown',e=>{if(mode!=='playing'||$('dialog').open||hidden)return;lookPointer=e.pointerId;lastX=e.clientX;lastY=e.clientY;$('world').setPointerCapture(e.pointerId);});
$('world').addEventListener('pointermove',e=>{if(e.pointerId!==lookPointer||mode!=='playing'||$('dialog').open)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;player.angle+=dx*.005*settings.sensitivity;player.pitch=clamp(player.pitch-dy*.0011*settings.sensitivity,-.18,.18);lastX=e.clientX;lastY=e.clientY;});
const stopLook=()=>lookPointer=null;$('world').addEventListener('pointerup',stopLook);$('world').addEventListener('pointercancel',stopLook);
let joystickPointer=null,joyCenter={x:0,y:0};
const joystickMove=e=>{if(e.pointerId!==joystickPointer)return;const dx=e.clientX-joyCenter.x,dy=e.clientY-joyCenter.y,d=Math.hypot(dx,dy),r=34,scale=d>r?r/d:1;joystick={x:dx/r*scale,y:dy/r*scale};$('stick').style.transform=`translate(${dx*scale}px,${dy*scale}px)`;};
$('joystick').addEventListener('pointerdown',e=>{e.preventDefault();joystickPointer=e.pointerId;const b=$('joystick').getBoundingClientRect();joyCenter={x:b.left+b.width/2,y:b.top+b.height/2};$('joystick').setPointerCapture(e.pointerId);joystickMove(e);});
$('joystick').addEventListener('pointermove',joystickMove);
const stopJoystick=e=>{if(e.pointerId===joystickPointer){joystickPointer=null;joystick={x:0,y:0};$('stick').style.transform='';}};
$('joystick').addEventListener('pointerup',stopJoystick);$('joystick').addEventListener('pointercancel',stopJoystick);
$('run').addEventListener('pointerdown',e=>{e.preventDefault();runningTouch=true;$('run').setPointerCapture(e.pointerId);});
for(const event of ['pointerup','pointercancel'])$('run').addEventListener(event,()=>runningTouch=false);

function update(dt){
  const active=mode==='playing'&&!$('dialog').open&&$('chapter-card').hidden;
  if(!active){walking=false;return;}
  gameTime+=dt;elapsed+=dt;walking=false;
  if(!hidden){
    let forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-joystick.y;
    let strafe=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0)+joystick.x;
    const mag=Math.hypot(forward,strafe);if(mag>1){forward/=mag;strafe/=mag;}
    const turn=(keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0);player.angle+=turn*dt*1.7;
    const wantsRun=(keys.has('ShiftLeft')||keys.has('ShiftRight')||runningTouch)&&mag>.15,running=wantsRun&&stamina>.06;
    stamina=clamp(stamina+(running?-.22:.15)*dt,0,1);const speed=(running?3.55:2.05)*dt;
    if(mag>.1){move(map,player,(Math.cos(player.angle)*forward-Math.sin(player.angle)*strafe)*speed,(Math.sin(player.angle)*forward+Math.cos(player.angle)*strafe)*speed,stage);walking=true;if(gameTime>nextFoot){audio.step(running);nextFoot=gameTime+(running?.29:.47);steps++;}}
  }else stamina=clamp(stamina+dt*.2,0,1);
  $('stamina').style.width=`${Math.round(stamina*100)}%`;
  if(gameTime>chaseAt&&!enemy)spawnEnemy();
  if(gameTime>nextHaunt){nextHaunt=gameTime+40+Math.random()*18;if(stage>=2&&!enemy){chaseAt=gameTime+4;audio.knock(.8);subtitle('[سه ضربه از پشت دیوار] تنها نیستی.',4);}else{audio.creak(Math.random()>.5?.8:-.8);subtitle(['[جیرجیر کف چوبی از اتاق خالی]','[ضربه‌ای آرام به پنجره]','[نجوا از انتهای راهرو] «برگرد…»'][hauntCount++%3],4);}}
  let danger=0;
  if(enemy){
    enemyAge+=dt;enemyGrace-=dt;
    if(hidden){hideTime+=dt;if(hideTime>7){enemy=null;nextHaunt=gameTime+38;subtitle('[قدم‌ها دور می‌شوند] فعلاً رفت…',4);$('danger').style.opacity=0;}}
    else{
      if(gameTime>pathAt){enemyPath=route(map,enemy,player,stage);pathAt=gameTime+.65;}
      if(enemyGrace<=0){const target=hasSight(map,enemy,player,stage)?player:enemyPath[0];if(target){const dx=target.x-enemy.x,dy=target.y-enemy.y,d=Math.hypot(dx,dy),v=(stage===5?1.67:1.42)*dt;if(d<.2&&enemyPath.length)enemyPath.shift();if(d>.02)move(map,enemy,dx/d*Math.min(v,d),dy/d*Math.min(v,d),stage);}}
      const distance=Math.hypot(enemy.x-player.x,enemy.y-player.y);danger=clamp(1-distance/10,.1,.9);if(distance<.64&&enemyGrace<=0)caught();
    }
    if(enemyAge>34){enemy=null;nextHaunt=gameTime+38;subtitle('[سکوت] صدای قدم‌ها قطع شد.',4);danger=0;}
  }
  $('danger').style.opacity=String(settings.reduced?danger*.3:danger*(.4+Math.sin(gameTime*4)*.08));audio.update(gameTime,danger);
  findInteraction();
  let room='راهروی خانه';if(player.x<10||player.x>14){const idx=STAGES.findIndex(s=>(s.x<10)===(player.x<10)&&Math.abs(s.y-player.y)<4);if(idx>=0)room=STAGES[idx].room;}
  if(room!==roomPrevious){$('room-name').textContent=room;roomPrevious=room;}
}
function frame(now){
  const dt=Math.min(.05,(now-previous)/1000);previous=now;update(dt);
  renderer.render(player,stage,now/1000,{menu:mode==='menu',enemy,hidden,brightness:settings.brightness,motion:!settings.reduced,moving:walking});requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
