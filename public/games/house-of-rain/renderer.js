import {cast,STAGES} from './world.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function canvas(w,h=w){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function random(seed=421){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}

function wallTexture(type){
  const c=canvas(256),g=c.getContext('2d'),rnd=random(72+type*34);
  g.fillStyle=type===3?'#414c43':'#687064';g.fillRect(0,0,256,256);
  for(let i=0;i<11000;i++){const v=Math.floor(rnd()*65);g.fillStyle=`rgba(${v},${v+8},${v},${rnd()*.2})`;g.fillRect(rnd()*256,rnd()*256,1+rnd()*3,1+rnd()*4);}
  // Water-stained lime plaster, peeling strips, thin wallpaper lines.
  for(let x=0;x<256;x+=32){g.fillStyle='#a5ae8620';g.fillRect(x,0,2,172);g.fillStyle='#343f3420';g.fillRect(x+8,0,1,172);}
  for(let i=0;i<35;i++){const x=rnd()*256,y=rnd()*173;g.fillStyle='#203b2920';g.beginPath();g.ellipse(x,y,5+rnd()*22,5+rnd()*29,0,0,7);g.fill();}
  g.fillStyle='#302a21';g.fillRect(0,174,256,82);g.fillStyle='#5b5140';g.fillRect(0,172,256,6);g.fillStyle='#171e17';g.fillRect(0,180,256,3);
  for(let x=0;x<256;x+=32){const v=39+rnd()*20;g.fillStyle=`rgb(${v+9},${v+5},${v-6})`;g.fillRect(x+2,185,27,66);g.strokeStyle='#131e18';g.strokeRect(x+5,189,21,57);for(let j=0;j<4;j++){g.strokeStyle='#95836119';g.beginPath();g.moveTo(x+4+j*5,185);g.bezierCurveTo(x+j*5,210,x+9+j*5,220,x+4+j*5,251);g.stroke();}}
  g.fillStyle='#151e17';g.fillRect(0,252,256,4);g.fillStyle='#403e30';g.fillRect(0,0,256,6);g.fillStyle='#8f907239';g.fillRect(0,6,256,2);
  for(let i=0;i<7;i++){let x=rnd()*256,y=rnd()*70;g.strokeStyle='#172c2466';g.lineWidth=.7;g.beginPath();g.moveTo(x,y);for(let j=0;j<5;j++){x+=rnd()*10-6;y+=rnd()*13;g.lineTo(x,y);}g.stroke();}
  if(type===2){
    g.fillStyle='#29372e';g.fillRect(26,26,204,148);const grad=g.createLinearGradient(0,30,0,170);grad.addColorStop(0,'#728c91');grad.addColorStop(.55,'#435d60');grad.addColorStop(1,'#152d2c');g.fillStyle=grad;g.fillRect(34,34,188,132);
    g.fillStyle='#bdd7cf';g.beginPath();g.arc(180,54,13,0,7);g.fill();g.fillStyle='#728a87';g.beginPath();g.arc(186,50,13,0,7);g.fill();
    for(let i=0;i<16;i++){const x=30+rnd()*210;g.strokeStyle='#0c2224';g.lineWidth=2+rnd()*5;g.beginPath();g.moveTo(x,168);g.lineTo(x+rnd()*20-10,38);g.stroke();for(let j=0;j<4;j++){const y=60+rnd()*100;g.beginPath();g.moveTo(x,y+15);g.lineTo(x+25-rnd()*50,y-14);g.stroke();}}
    for(let i=0;i<70;i++){g.strokeStyle='#b7dcda33';const x=35+rnd()*185,y=36+rnd()*128;g.beginPath();g.moveTo(x,y);g.lineTo(x-2,y+8);g.stroke();}
    g.fillStyle='#2d3327';g.fillRect(121,30,13,140);g.fillRect(30,96,198,9);g.fillStyle='#a2a58a';g.fillRect(120,30,2,140);g.fillStyle='#514d3b';g.fillRect(22,170,212,8);g.fillStyle='#9c9c7b';g.fillRect(20,169,216,3);
  }
  if(type>=8){
    g.fillStyle='#1b221c';g.fillRect(8,5,240,251);g.fillStyle=type===8?'#4d4431':'#4e4935';g.fillRect(20,13,216,243);
    for(const x of [30,139])for(const y of [28,136]){g.fillStyle='#2d3022';g.fillRect(x,y,88,101);g.strokeStyle='#847451';g.strokeRect(x+3,y+3,82,95);g.fillStyle='#45432e';g.fillRect(x+10,y+10,68,80);}
    g.fillStyle='#ad9760';g.beginPath();g.arc(202,139,4,0,7);g.fill();g.fillRect(200,139,4,14);g.fillStyle='#131b14';g.fillRect(0,0,13,256);g.fillRect(243,0,13,256);
    if(type>=10){g.fillStyle='#101b16';g.fillRect(99,70,58,28);g.fillStyle='#b3ad89';g.textAlign='center';g.font='17px serif';g.fillText(String(type-9).padStart(2,'0'),128,91);}
  }
  return c;
}

function sprite(kind){
  const c=canvas(256,384),g=c.getContext('2d'),rnd=random(15);
  const shadow=()=>{g.fillStyle='#02070480';g.beginPath();g.ellipse(128,365,105,16,0,0,7);g.fill();};shadow();
  if(kind==='wardrobe'){
    g.fillStyle='#1a261d';g.fillRect(28,39,200,326);g.fillStyle='#786846';g.fillRect(20,31,216,15);g.fillStyle='#544c33';g.fillRect(31,47,194,300);
    for(const x of [40,134]){g.fillStyle='#333b28';g.fillRect(x,55,82,279);g.strokeStyle='#82704c';g.lineWidth=2;g.strokeRect(x+7,62,68,265);g.fillStyle='#4a4a30';g.fillRect(x+13,70,56,249);for(let i=0;i<9;i++){g.strokeStyle='#1f30224c';g.beginPath();g.moveTo(x+16+i*5,71);g.lineTo(x+13+i*5,317);g.stroke();}}
    g.fillStyle='#a58e53';g.fillRect(113,175,4,22);g.fillRect(139,175,4,22);g.fillStyle='#342e1d';g.fillRect(35,346,18,23);g.fillRect(203,346,18,23);
  }else if(kind==='table'||kind==='note'||kind==='chest'||kind==='radio'||kind==='letter'||kind==='lock'){
    const top=kind==='chest'?238:250;g.fillStyle='#3e3424';g.fillRect(32,top,192,31);g.fillStyle='#756240';g.fillRect(27,top-6,202,11);g.fillStyle='#302d20';g.fillRect(40,top+26,12,91);g.fillRect(202,top+26,12,91);
    if(kind==='note'||kind==='letter'){
      g.fillStyle='#d4c49b';g.beginPath();g.moveTo(75,top-8);g.lineTo(77,top-85);g.lineTo(167,top-93);g.lineTo(172,top-11);g.fill();g.strokeStyle='#655b3b';g.lineWidth=2;for(let i=0;i<6;i++){g.beginPath();g.moveTo(89,top-73+i*9);g.lineTo(152-i%2*15,top-73+i*9);g.stroke();}
      g.fillStyle='#977a4d';g.fillRect(177,top-46,8,39);g.fillStyle='#e6c77a';g.beginPath();g.ellipse(181,top-52,4,10,0,0,7);g.fill();
    }else if(kind==='chest'||kind==='lock'){
      g.fillStyle='#5a462b';g.fillRect(53,top-67,150,64);g.fillStyle='#83663c';g.fillRect(50,top-72,156,13);g.strokeStyle='#ae9254';g.lineWidth=5;g.strokeRect(68,top-66,119,58);g.fillStyle='#b69b61';g.fillRect(121,top-50,15,23);g.fillStyle='#18221a';g.fillRect(126,top-45,4,11);
    }else if(kind==='radio'){
      g.fillStyle='#493c2a';g.fillRect(55,top-90,149,86);g.fillStyle='#0d1c17';g.fillRect(65,top-80,97,52);g.fillStyle='#958c5b';g.fillRect(68,top-77,91,7);g.strokeStyle='#597766';for(let i=0;i<7;i++){g.beginPath();g.moveTo(69,top-63+i*5);g.lineTo(157,top-63+i*5);g.stroke();}g.fillStyle='#ae9d64';g.beginPath();g.arc(184,top-47,9,0,7);g.fill();g.strokeStyle='#839989';g.lineWidth=2;g.beginPath();g.moveTo(190,top-89);g.lineTo(209,top-156);g.stroke();
    }
  }else if(kind==='mirror'){
    g.fillStyle='#84724d';g.beginPath();g.ellipse(128,160,87,139,0,0,7);g.fill();g.fillStyle='#4e6866';g.beginPath();g.ellipse(128,160,76,125,0,0,7);g.fill();const gr=g.createLinearGradient(50,30,180,280);gr.addColorStop(0,'#97b6ae66');gr.addColorStop(.45,'#314c49');gr.addColorStop(1,'#111f21');g.fillStyle=gr;g.beginPath();g.ellipse(128,160,70,119,0,0,7);g.fill();g.strokeStyle='#b6c9bc33';g.lineWidth=2;g.beginPath();g.moveTo(78,115);g.lineTo(133,54);g.moveTo(100,165);g.lineTo(174,79);g.stroke();g.fillStyle='#56482e';g.fillRect(114,295,28,59);g.fillRect(64,350,129,13);
  }else if(kind==='lamp'){
    const glow=g.createRadialGradient(128,117,4,128,117,100);glow.addColorStop(0,'#e3c77744');glow.addColorStop(1,'#e3c77700');g.fillStyle=glow;g.fillRect(0,0,256,255);g.fillStyle='#4a4a30';g.fillRect(123,135,10,218);g.fillStyle='#908054';g.fillRect(120,140,16,7);g.fillStyle='#3c402a';g.beginPath();g.ellipse(128,355,57,9,0,0,7);g.fill();g.fillStyle='#9b8e5b';g.beginPath();g.moveTo(93,54);g.lineTo(162,54);g.lineTo(190,143);g.lineTo(66,143);g.fill();const shade=g.createLinearGradient(70,0,190,0);shade.addColorStop(0,'#42442b');shade.addColorStop(.5,'#c6ae6d');shade.addColorStop(1,'#565639');g.fillStyle=shade;g.beginPath();g.moveTo(94,56);g.lineTo(161,56);g.lineTo(184,137);g.lineTo(72,137);g.fill();
  }else if(kind==='chair'){
    g.strokeStyle='#504c33';g.lineWidth=12;g.strokeRect(60,130,137,145);g.fillStyle='#333c2a';g.fillRect(67,137,123,129);g.strokeStyle='#77704b';g.lineWidth=4;for(let x=82;x<185;x+=25){g.beginPath();g.moveTo(x,139);g.lineTo(x,262);g.stroke();}g.fillStyle='#615338';g.fillRect(48,266,160,20);g.fillStyle='#343721';g.fillRect(57,285,12,75);g.fillRect(186,285,12,75);
  }else if(kind==='portrait'){
    g.fillStyle='#342f22';g.fillRect(48,57,160,194);g.fillStyle='#99805a';g.fillRect(54,63,148,182);g.fillStyle='#39483b';g.fillRect(64,73,128,162);g.fillStyle='#62725c';g.beginPath();g.moveTo(66,220);g.lineTo(116,122);g.lineTo(175,202);g.lineTo(190,176);g.lineTo(190,233);g.lineTo(66,233);g.fill();g.fillStyle='#a79c74';for(let i=0;i<3;i++){g.beginPath();g.ellipse(97+i*31,148+i%2*13,9,12,0,0,7);g.fill();g.fillStyle='#27352a';g.fillRect(88+i*31,160+i%2*13,19,39);g.fillStyle='#a79c74';}g.fillStyle='#a6a181';g.font='13px serif';g.textAlign='center';g.fillText('۱۳۷۲',128,268);
  }else if(kind==='clock'){
    g.fillStyle='#594b30';g.beginPath();g.arc(128,112,68,0,7);g.fill();g.fillStyle='#a4a78b';g.beginPath();g.arc(128,112,58,0,7);g.fill();g.strokeStyle='#29392e';g.lineWidth=5;g.beginPath();g.moveTo(128,70);g.lineTo(128,112);g.lineTo(90,112);g.stroke();g.lineWidth=2;for(let i=0;i<12;i++){const a=i*Math.PI/6;g.beginPath();g.moveTo(128+Math.sin(a)*47,112+Math.cos(a)*47);g.lineTo(128+Math.sin(a)*53,112+Math.cos(a)*53);g.stroke();}
  }else if(kind==='plant'){
    g.fillStyle='#544e35';g.beginPath();g.moveTo(91,283);g.lineTo(104,362);g.lineTo(153,362);g.lineTo(167,283);g.fill();g.strokeStyle='#526544';g.lineWidth=4;g.beginPath();g.moveTo(128,291);g.lineTo(134,109);g.stroke();for(let i=0;i<9;i++){g.fillStyle=i%2?'#3e5d40':'#688064';const y=130+i*16,x=i%2?151:104;g.beginPath();g.ellipse(x,y,34,11,i%2?-.7:.7,0,7);g.fill();}
  }else if(kind==='ghost'){
    const mist=g.createRadialGradient(128,210,30,128,210,171);mist.addColorStop(0,'#06131388');mist.addColorStop(1,'#06131300');g.fillStyle=mist;g.fillRect(0,0,256,384);
    const robe=g.createLinearGradient(50,0,200,0);robe.addColorStop(0,'#01070800');robe.addColorStop(.22,'#081012');robe.addColorStop(.5,'#151c1c');robe.addColorStop(.8,'#02090b');robe.addColorStop(1,'#07111200');g.fillStyle=robe;g.beginPath();g.moveTo(104,89);g.bezierCurveTo(65,107,62,196,46,342);g.lineTo(76,325);g.lineTo(90,371);g.lineTo(119,351);g.lineTo(143,377);g.lineTo(166,345);g.lineTo(210,362);g.bezierCurveTo(172,180,186,111,150,90);g.fill();
    g.strokeStyle='#24322c';g.lineWidth=13;g.beginPath();g.moveTo(84,128);g.bezierCurveTo(68,175,39,187,43,242);g.moveTo(169,130);g.bezierCurveTo(187,174,207,177,211,235);g.stroke();g.strokeStyle='#68796b';g.lineWidth=3;for(let i=0;i<4;i++){g.beginPath();g.moveTo(41+i*4,231);g.lineTo(33+i*5,257+i%2*8);g.moveTo(206+i*4,227);g.lineTo(211+i*5,255-i%2*7);g.stroke();}
    g.fillStyle='#0b1313';g.beginPath();g.ellipse(128,69,30,49,-.1,0,7);g.fill();const face=g.createRadialGradient(129,72,4,128,72,29);face.addColorStop(0,'#a4af98');face.addColorStop(.6,'#6d8072');face.addColorStop(1,'#1e322c');g.fillStyle=face;g.beginPath();g.ellipse(128,72,20,32,-.1,0,7);g.fill();g.fillStyle='#071011';g.beginPath();g.ellipse(118,65,8,6,-.2,0,7);g.ellipse(139,66,8,6,.2,0,7);g.fill();g.fillStyle='#d7dab2';g.fillRect(117,65,3,2);g.fillRect(137,66,3,2);g.fillStyle='#0e1c18';g.beginPath();g.ellipse(127,88,6,10,0,0,7);g.fill();
    for(let i=0;i<13;i++){g.strokeStyle='#61776613';g.lineWidth=1;g.beginPath();g.moveTo(80+rnd()*100,128);g.lineTo(65+rnd()*130,350);g.stroke();}
  }
  return c;
}

export class Renderer{
  constructor(element,map){
    this.canvas=element;this.g=element.getContext('2d',{alpha:false});this.map=map;this.textures={};for(const t of [1,2,3,8,9,10,11,12,13,14])this.textures[t]=wallTexture(t);
    this.sprites={};for(const t of ['wardrobe','table','note','chest','radio','letter','lock','mirror','lamp','chair','portrait','clock','plant','ghost'])this.sprites[t]=sprite(t);
    this.items=[];this.hideouts=[];this.notes=[];
    STAGES.forEach((s,i)=>{
      this.items.push({x:s.x,y:s.y,kind:['chest','mirror','radio','letter','lock'][i],scale:i===1?1.65:1.3,stage:i,id:'puzzle'+i,label:['صندوق خاطره‌ها','آینهٔ قدیمی','رادیوی خاموش','نامهٔ مادر','قفل آخر'][i]});
      const note={x:s.note[0],y:s.note[1],kind:'note',scale:1.18,stage:i,id:'note'+i,label:['پشت عکس خانوادگی','یادداشت کنار آینه','نوار قدیمی','دفتر مادر','آخرین صفحه'][i]};this.items.push(note);this.notes.push(note);
      const hx=i%2===0?8.4:16.6,hy=s.y-1.5;const hide={x:hx,y:hy,kind:'wardrobe',scale:1.8,id:'hide'+i,label:'کمد؛ جایی برای پنهان شدن'};this.items.push(hide);this.hideouts.push(hide);
      this.items.push({x:i%2===0?2.2:22.7,y:s.y+2,kind:'lamp',scale:1.55});
      this.items.push({x:i%2===0?5.8:19.1,y:s.y+3.1,kind:'chair',scale:1.05});
      this.items.push({x:i%2===0?2.3:22.7,y:s.y-1,kind:i===1?'clock':'portrait',scale:1.4});
    });
    for(const y of [3,9,16,21]){this.items.push({x:11.3,y:y+.3,kind:'lamp',scale:1.4},{x:13.4,y:y+1,kind:'plant',scale:1.3});}
    this.items.push({x:12.5,y:2.2,kind:'portrait',scale:1.9});
    this.makeFloor();this.resize();
  }
  makeFloor(){
    const c=canvas(128),g=c.getContext('2d'),rnd=random(373);
    g.fillStyle='#393e2c';g.fillRect(0,0,128,128);
    for(let y=0;y<128;y+=16){g.fillStyle=`rgb(${55+rnd()*12},${52+rnd()*12},${36+rnd()*9})`;g.fillRect(0,y,128,15);g.fillStyle='#18251a';g.fillRect(0,y+15,128,1);for(let i=0;i<75;i++){g.fillStyle=rnd()>.5?'#d7c98b14':'#14251a2e';g.fillRect(rnd()*128,y+rnd()*14,2+rnd()*22,.7);}const x=rnd()*128;g.fillStyle='#19251c';g.fillRect(x,y,1,16);}
    this.floor=g.getImageData(0,0,128,128).data;
  }
  resize(){
    const mobile=matchMedia('(pointer:coarse)').matches;
    const w=Math.min(mobile?660:960,Math.round(innerWidth*(mobile?.72:.72)));
    this.w=Math.max(280,w);this.h=Math.round(this.w*innerHeight/innerWidth);this.h=Math.min(900,this.h);
    this.canvas.width=this.w;this.canvas.height=this.h;this.z=new Float32Array(this.w);this.frame=this.g.createImageData(this.w,this.h);this.proj=this.w/(2*Math.tan(70*Math.PI/360));
  }
  render(player,stage,time,{menu=false,enemy=null,hidden=false,brightness=1,motion=true,moving=false,flashlight=true}={}){
    const g=this.g,w=this.w,h=this.h,proj=this.proj;
    const angle=menu?-Math.PI/2+.12+Math.sin(time*.045)*.055:player.angle;
    const p=menu?{x:12.5,y:20.8}:player,dx=Math.cos(angle),dy=Math.sin(angle),plane=.7002;
    const bob=!menu&&moving&&motion?Math.sin(time*9)*h*.006:0;
    const horizon=Math.floor(h*.46+(player.pitch||0)*h+bob),d=this.frame.data,fl=this.floor;
    const lightning=Math.sin(time*.37)>0.998?1.22:1;
    for(let y=0;y<h;y++){
      if(y<=horizon){const t=y/Math.max(1,horizon),r=(14+t*8)*brightness,gg=(22+t*10)*brightness,b=(23+t*10)*brightness;for(let x=0;x<w;x++){const k=(y*w+x)*4;d[k]=r;d[k+1]=gg;d[k+2]=b;d[k+3]=255;}continue;}
      const distance=.85*proj/(y-horizon),sx=dx+dy*plane,sy=dy-dx*plane;
      let fx=p.x+distance*sx,fy=p.y+distance*sy;const stepX=-distance*dy*plane*2/w,stepY=distance*dx*plane*2/w;
      const fog=clamp(.92/(1+distance*.16),.14,.9)*brightness;
      for(let x=0;x<w;x+=2){const tx=Math.floor(fx*64)&127,ty=Math.floor(fy*64)&127,tk=(ty*128+tx)*4;let r=fl[tk]*fog,gg=fl[tk+1]*fog,b=fl[tk+2]*fog;
        // A faded red kilim runs the length of the hallway.
        if(fx>11.6&&fx<13.4){const edge=fx<11.73||fx>13.27;const pattern=(Math.floor(fy*4)+Math.floor(fx*11))%5===0;r=(edge?89:pattern?81:61)*fog;gg=(edge?75:pattern?54:32)*fog;b=(edge?47:pattern?34:27)*fog;}
        const k=(y*w+x)*4;d[k]=r;d[k+1]=gg;d[k+2]=b;d[k+3]=255;if(x+1<w){d[k+4]=r;d[k+5]=gg;d[k+6]=b;d[k+7]=255;}fx+=stepX*2;fy+=stepY*2;
      }
    }
    g.putImageData(this.frame,0,0);
    for(let x=0;x<w;x+=2){const camera=2*x/w-1,rx=dx-dy*plane*camera,ry=dy+dx*plane*camera,hit=cast(this.map,p.x,p.y,rx,ry,stage),dist=hit.distance;this.z[x]=dist;this.z[x+1]=dist;
      const top=horizon-proj*.95/dist,bottom=horizon+proj*.85/dist,wh=bottom-top;
      const tex=this.textures[hit.type]||this.textures[1];g.drawImage(tex,Math.min(255,Math.floor(hit.u*256)),0,1,256,x,top,2,wh);
      const light=clamp((.85/(1+dist*.12)+(hit.type===2?.19:0))*(hit.side?.84:1)*brightness*lightning,.12,1);g.fillStyle=`rgba(0,9,10,${1-light})`;g.fillRect(x,top,2,wh);
      if(dist>5){g.fillStyle=`rgba(13,32,31,${clamp((dist-5)*.015,0,.34)})`;g.fillRect(x,top,2,wh);}
    }
    const objects=[...this.items];if(enemy)objects.push({...enemy,kind:'ghost',scale:1.9});else if(menu)objects.push({x:12.45,y:8.6,kind:'ghost',scale:1.95});
    objects.sort((a,b)=>Math.hypot(b.x-p.x,b.y-p.y)-Math.hypot(a.x-p.x,a.y-p.y));
    for(const obj of objects){
      const ox=obj.x-p.x,oy=obj.y-p.y,depth=ox*dx+oy*dy,side=ox*(-dy)+oy*dx;
      if(depth<.18||depth>25)continue;
      const screenX=w/2+side/depth*proj,size=proj*(obj.scale||1.4)/depth,width=size*2/3,left=screenX-width/2,top=horizon+proj*.85/depth-size;
      if(left>w||left+width<0)continue;
      const sprite=this.sprites[obj.kind],light=clamp((obj.kind==='lamp'?.95:.95/(1+depth*.105))*brightness,.19,1);
      g.globalAlpha=light;
      for(let x=Math.max(0,Math.floor(left));x<Math.min(w,left+width);x+=2){if(depth>this.z[x]+.05)continue;const u=clamp(Math.floor((x-left)/width*256),0,255);g.drawImage(sprite,u,0,1,384,x,top,2,size);}
      g.globalAlpha=1;
      if(obj.id&&obj.id.startsWith('puzzle')&&obj.stage===stage){
        const center=Math.round(clamp(screenX,0,w-1));if(depth<this.z[center]+.1&&depth<9){const cy=top+size*.52,rr=clamp(8/depth,1.5,4);g.fillStyle='#c8d9b7';g.globalAlpha=.5+Math.sin(time*2)*.2;g.beginPath();g.arc(screenX,cy,rr,0,7);g.fill();g.globalAlpha=1;}
      }
    }
    if(flashlight&&!menu){const fg=g.createRadialGradient(w*.5,h*.52,w*.02,w*.5,h*.52,w*.52);fg.addColorStop(0,'rgba(214,202,146,.075)');fg.addColorStop(.35,'rgba(194,195,144,.03)');fg.addColorStop(1,'rgba(0,0,0,.17)');g.fillStyle=fg;g.fillRect(0,0,w,h);}
    if(!menu&&!hidden){
      // Hand-held torch silhouette at the bottom of the view.
      const tx=w*.77+(motion?Math.sin(time*2)*2:0),ty=h*.9+bob;g.save();g.translate(tx,ty);g.rotate(-.23);g.fillStyle='#101b1c';g.beginPath();g.moveTo(-w*.02,0);g.lineTo(w*.025,0);g.lineTo(w*.048,h*.18);g.lineTo(-w*.008,h*.18);g.fill();g.fillStyle='#40504b';g.fillRect(-w*.027,-h*.02,w*.06,h*.047);g.fillStyle='#758779';g.fillRect(-w*.025,-h*.024,w*.056,h*.009);g.restore();
    }
    // Subtle haze, occasional lightning and rain at the edges of the view.
    if(menu){g.strokeStyle='#a2c5bc10';g.lineWidth=.6;for(let i=0;i<45;i++){const x=((i*97.3+time*23)%w),y=((i*71+time*137)%h);g.beginPath();g.moveTo(x,y);g.lineTo(x-2,y+12);g.stroke();}}
  }
}
