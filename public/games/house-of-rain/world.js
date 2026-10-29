// Simulation is independent of rendering so movement and progression can be checked in Node.
export const WIDTH = 25, HEIGHT = 25;
export const SPAWN = { x: 12.5, y: 22, angle: -Math.PI / 2 };
export const STAGES = [
  { title: 'عکسِ آخر', room: 'اتاق خاطره‌ها', target: 'صندوق زیر عکس خانوادگی را باز کن.', answer: '1372', mark: '۴', kind: 'code', x: 4.7, y: 18.3, door: [10, 19], note: [8.3, 21.2], clue: 'پشت عکس نوشته: «تابستان ۱۳۷۲؛ آخرین سالی که همه اینجا بودیم.» روی صندوق نوشته: سالِ عکس.', hint: 'سال نوشته‌شده پشت عکس، رمز چهاررقمی صندوق است: ۱۳۷۲.' },
  { title: 'آن‌سوی آینه', room: 'اتاق آینه', target: 'چیزی را پیدا کن که آینه پنهان می‌کند.', answer: 'clock', mark: '۲', kind: 'mirror', x: 20.3, y: 18.3, door: [14, 19], note: [16.5, 21.2], clue: 'یادداشت کنار آینه: «همه‌چیز را نشان می‌دهد، جز چیزی که زمان را نگه داشته.»', hint: 'چراغ، صندلی و گلدان در هر دو تصویر هستند. ساعت فقط در اتاق واقعی است.' },
  { title: 'سه ضربه در تاریکی', room: 'انباری نم‌زده', target: 'به ضربه‌ها گوش بده و ترتیبشان را تکرار کن.', answer: '213', mark: '۷', kind: 'sound', x: 4.7, y: 11.3, door: [10, 12], note: [8.3, 14.1], clue: 'روی نوار نوشته: «سه دسته ضربه؛ هر بار از یک تا سه. دسته‌ها را از اول به آخر بشمار.» صدا یک نشانهٔ دیداری هم دارد.', hint: 'دستهٔ اول دو ضربه، دستهٔ دوم یک ضربه، دستهٔ سوم سه ضربه: ۲، ۱، ۳.' },
  { title: 'یادداشت مادر', room: 'اتاق آرامش', target: 'تکه‌های نوشتهٔ مادر را به ترتیب بچین.', answer: 'بسم|الله|الرحمن|الرحیم', mark: '۱', kind: 'words', x: 20.3, y: 11.3, door: [14, 12], note: [16.5, 14.1], clue: 'از دفتر مادر: «هر نامه را با بسم الله الرحمن الرحیم شروع می‌کردم. اگر نوشته‌ام پاره شد، آن را با همین ترتیب کنار هم بگذار.»', hint: 'ترتیب نوشته در دفتر مادر آمده: بسم ← الله ← الرحمن ← الرحیم.' },
  { title: 'آخرین در', room: 'اتاق ممنوعه', target: 'چهار نشان را به ترتیب خاطره‌ها وارد قفل کن.', answer: '4271', mark: 'کلید', kind: 'final', x: 4.7, y: 4.3, door: [10, 5], note: [8.3, 7.1], clue: 'آخرین صفحه: «عکس، آینه، صدا، نامه؛ به همان ترتیبی که حقیقت را فهمیدی. کلید زیر این قفل است. بعد به درِ ورودی برگرد.»', hint: 'نشان‌های دفترچه را به ترتیب مرحله‌ها بخوان: ۴، ۲، ۷، ۱.' },
];

export function makeMap() {
  const map = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(1));
  for (let y = 2; y < 24; y++) for (let x = 11; x < 14; x++) map[y][x] = 0;
  for (const [a,b] of [[2,8],[9,15],[16,23]]) {
    for (let y=a;y<b;y++) for(let x=1;x<10;x++) map[y][x]=0;
    for (let y=a;y<b;y++) for(let x=15;x<24;x++) map[y][x]=0;
  }
  for(let y=1;y<24;y++) { map[y][0]=3; map[y][24]=3; }
  // Moonlit windows face the wet garden; plaster above dark wood panels elsewhere.
  for(const y of [4,6,11,13,18,20]) { map[y][0]=2; map[y][24]=2; }
  for(let x=1;x<24;x++) { map[1][x]=3; map[23][x]=3; }
  map[23][12]=8;
  STAGES.forEach((s,i)=>{map[s.door[1]][s.door[0]]=10+i;});
  // A locked, unused room strengthens the house silhouette without adding a sixth level.
  map[5][14]=9;
  return map;
}

export function cell(map, x, y, stage=0) {
  const v=map[Math.floor(y)]?.[Math.floor(x)] ?? 1;
  return v>=10 && v<=14 && v-10<=stage ? 0 : v;
}
export function canStand(map,x,y,stage=0,r=.19) {
  return [[-r,-r],[r,-r],[-r,r],[r,r]].every(([a,b])=>cell(map,x+a,y+b,stage)===0);
}
export function move(map, player, dx, dy, stage) {
  if(canStand(map,player.x+dx,player.y,stage)) player.x+=dx;
  if(canStand(map,player.x,player.y+dy,stage)) player.y+=dy;
}
export function cast(map,px,py,dx,dy,stage=0,max=35) {
  let mx=Math.floor(px),my=Math.floor(py),side=0;
  const ddx=Math.abs(1/(dx||1e-12)),ddy=Math.abs(1/(dy||1e-12));
  const sx=dx<0?-1:1,sy=dy<0?-1:1;
  let ax=(dx<0?px-mx:mx+1-px)*ddx,ay=(dy<0?py-my:my+1-py)*ddy;
  for(let i=0;i<100;i++) {
    if(ax<ay){ax+=ddx;mx+=sx;side=0;}else{ay+=ddy;my+=sy;side=1;}
    const distance=side?ay-ddy:ax-ddx;
    const type=cell(map,mx+.5,my+.5,stage);
    if(type||distance>max){let u=side?px+distance*dx:py+distance*dy;u-=Math.floor(u);if((!side&&dx>0)||(side&&dy<0))u=1-u;return {distance:Math.max(.01,distance),type:type||1,side,u,x:mx,y:my};}
  }
  return {distance:max,type:1,side:0,u:0,x:mx,y:my};
}
export function hasSight(map,a,b,stage=0) {
  const d=Math.hypot(b.x-a.x,b.y-a.y);
  return d<.01||cast(map,a.x,a.y,(b.x-a.x)/d,(b.y-a.y)/d,stage).distance>d-.1;
}
export function route(map, start, end, stage) {
  const key=(x,y)=>y*WIDTH+x, queue=[[Math.floor(start.x),Math.floor(start.y)]];
  const target=key(Math.floor(end.x),Math.floor(end.y)),seen=new Map([[key(...queue[0]),null]]);
  for(let i=0;i<queue.length;i++){
    const [x,y]=queue[i],k=key(x,y);
    if(k===target){const path=[];let p=k;while(seen.get(p)!==null){path.unshift({x:p%WIDTH+.5,y:Math.floor(p/WIDTH)+.5});p=seen.get(p);}return path;}
    for(const [nx,ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){
      const n=key(nx,ny);if(nx<0||ny<0||nx>=WIDTH||ny>=HEIGHT||seen.has(n)||cell(map,nx+.5,ny+.5,stage))continue;
      seen.set(n,k);queue.push([nx,ny]);
    }
  }
  return [];
}
export function normalizeDigits(value){return String(value).replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/\s/g,'');}
export function checkAnswer(stage,value){return STAGES[stage]?.answer===normalizeDigits(value);}
export function safeProgress(value){return Number.isInteger(value)&&value>=0&&value<=5?value:0;}
export function checkpoint(stage){if(stage===0)return {...SPAWN};return {x:12.5,y:stage<=2?19.5:stage<=4?12.5:5.5,angle:Math.PI/2};}
