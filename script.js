const menuTrigger = document.getElementById("menuTrigger");
const menuPanel = document.getElementById("menuPanel");
const menuClose = document.getElementById("menuClose");
const cards = [...document.querySelectorAll(".show-card")];
const rail = document.getElementById("cardRail");
const featureButtons = [...document.querySelectorAll(".feature-stack button")];

function openMenu(){ document.body.classList.add("menu-open"); menuPanel.classList.add("open"); menuPanel.setAttribute("aria-hidden","false"); menuTrigger.setAttribute("aria-expanded","true"); }
function closeMenu(){ document.body.classList.remove("menu-open"); menuPanel.classList.remove("open"); menuPanel.setAttribute("aria-hidden","true"); menuTrigger.setAttribute("aria-expanded","false"); }
menuTrigger.addEventListener("click", openMenu); menuClose.addEventListener("click", closeMenu);
document.addEventListener("keydown", e => e.key === "Escape" && closeMenu());
document.addEventListener("pointerdown", e => { if(!document.body.classList.contains("menu-open")) return; if(menuPanel.contains(e.target) || menuTrigger.contains(e.target)) return; closeMenu(); });

let activeIndex = 2;
const baseCards = cards.map(c=>c.cloneNode(true));
const baseCount = baseCards.length;
const SETS = 5;
const CENTER_SET = 2;
rail.replaceChildren();

for(let s=0;s<SETS;s++){
  baseCards.forEach((tpl,i)=>{
    const card=tpl.cloneNode(true);
    card.removeAttribute("id");
    card.dataset.logical=String(i);
    card.dataset.set=String(s);
    rail.appendChild(card);
  });
}
const loopCards=[...rail.querySelectorAll(".show-card")];
let railX=0,setWidth=0,railDragging=false,dragStartX=0,dragStartRailX=0,lastDragX=0,lastDragT=0,railVelocity=0,railInertia=0,dragMoved=false,wheelLock=false;
const heroRailWrap=document.querySelector(".rail-wrap");

function getRailX(){
  const m=getComputedStyle(rail).transform;
  return m==="none"?0:new DOMMatrixReadOnly(m).m41;
}
function cardAt(setIndex,logical){ return loopCards[setIndex*baseCount+logical]; }
function centerXForCard(card){
  const wrap=heroRailWrap.getBoundingClientRect();
  return window.innerWidth/2-wrap.left-(card.offsetLeft+card.offsetWidth/2);
}
function refreshSetWidth(){
  const ca=cardAt(CENTER_SET,0),cb=cardAt(CENTER_SET+1,0);
  if(ca&&cb)setWidth=cb.offsetLeft-ca.offsetLeft;
}
function markActive(card){ loopCards.forEach(c=>c.classList.toggle("active",c===card)); }
function normalizeNearCenter(x){
  if(!setWidth)refreshSetWidth();
  const anchor=centerXForCard(cardAt(CENTER_SET,activeIndex));
  const min=anchor-setWidth*.55,max=anchor+setWidth*.55;
  while(x<min)x+=setWidth;
  while(x>max)x-=setWidth;
  return x;
}
function canonicalize(logical,animate=false){
  activeIndex=((logical%baseCount)+baseCount)%baseCount;
  const target=cardAt(CENTER_SET,activeIndex); if(!target)return;
  const tx=centerXForCard(target); markActive(target);
  if(animate){
    rail.style.transition="transform .78s cubic-bezier(.18,.82,.18,1)";
    railX=tx; rail.style.transform="translate3d("+railX+"px,0,0)";
  }else{
    rail.style.transition="none";
    railX=tx; rail.style.transform="translate3d("+railX+"px,0,0)";
    rail.offsetHeight; rail.style.transition="";
  }
}
function setActive(index,immediate=false){
  activeIndex=((index%baseCount)+baseCount)%baseCount;
  requestAnimationFrame(()=>canonicalize(activeIndex,!immediate));
}
function nearestCard(){
  let best=null,dist=Infinity;
  loopCards.forEach(card=>{
    const r=card.getBoundingClientRect(),d=Math.abs((r.left+r.width/2)-window.innerWidth/2);
    if(d<dist){dist=d;best=card;}
  });
  return best;
}
function snapNearest(){
  const target=nearestCard(); if(!target)return;
  const logical=Number(target.dataset.logical);
  markActive(target);
  rail.style.transition="transform .76s cubic-bezier(.18,.82,.18,1)";
  railX=centerXForCard(target);
  rail.style.transform="translate3d("+railX+"px,0,0)";
  setTimeout(()=>{
    activeIndex=logical; canonicalize(activeIndex,false);
    if(heroRailWrap.matches(":hover")&&!railDragging)setTimeout(()=>heroV2Play(activeIndex),260);
  },790);
}
function stopInertia(){if(railInertia)cancelAnimationFrame(railInertia);railInertia=0;}

loopCards.forEach(card=>card.addEventListener("click",()=>setActive(Number(card.dataset.logical))));

if(heroRailWrap){
  heroRailWrap.addEventListener("pointerdown",e=>{
    if(innerWidth<=1100||e.button!==0)return;
    stopInertia(); heroV2Reset(true);
    railDragging=true;dragMoved=false;
    dragStartX=lastDragX=e.clientX;lastDragT=performance.now();
    dragStartRailX=getRailX();railX=dragStartRailX;railVelocity=0;
    heroRailWrap.classList.add("is-dragging");
    rail.style.transition="none";
    heroRailWrap.setPointerCapture(e.pointerId);
  });
  heroRailWrap.addEventListener("pointermove",e=>{
    if(!railDragging)return;
    const now=performance.now(),dt=Math.max(8,now-lastDragT);
    const dx=e.clientX-dragStartX;
    if(Math.abs(dx)>3)dragMoved=true;
    const raw=dragStartRailX+dx;
    railX=normalizeNearCenter(raw);
    if(Math.abs(railX-raw)>.5)dragStartRailX=railX-dx;
    rail.style.transform="translate3d("+railX+"px,0,0)";
    const instant=(e.clientX-lastDragX)/dt*16.67;
    railVelocity=railVelocity*.7+instant*.3;
    lastDragX=e.clientX;lastDragT=now;
    markActive(nearestCard());
  });
  const finish=e=>{
    if(!railDragging)return;
    railDragging=false;heroRailWrap.classList.remove("is-dragging");
    try{heroRailWrap.releasePointerCapture(e.pointerId)}catch{}
    if(!dragMoved){rail.style.transition="";snapNearest();return;}
    let v=Math.max(-38,Math.min(38,railVelocity*1.32));
    const glide=()=>{
      v*=.938;
      railX=normalizeNearCenter(railX+v);
      rail.style.transform="translate3d("+railX+"px,0,0)";
      markActive(nearestCard());
      if(Math.abs(v)>.28)railInertia=requestAnimationFrame(glide);
      else{railInertia=0;snapNearest();}
    };
    railInertia=requestAnimationFrame(glide);
  };
  heroRailWrap.addEventListener("pointerup",finish);
  heroRailWrap.addEventListener("pointercancel",finish);
}
window.addEventListener("wheel",e=>{
  if(innerWidth<=1100||document.body.classList.contains("menu-open"))return;
  const r=heroRailWrap.getBoundingClientRect();
  if(r.bottom<0||r.top>innerHeight||Math.abs(e.deltaY)<18||wheelLock)return;
  wheelLock=true;heroV2Reset(true);
  setActive(activeIndex+(e.deltaY>0?1:-1));
  setTimeout(()=>wheelLock=false,620);
},{passive:true});
window.addEventListener("resize",()=>{refreshSetWidth();canonicalize(activeIndex,false);});
requestAnimationFrame(()=>{refreshSetWidth();canonicalize(activeIndex,false);});
let featureOffset=0;
setInterval(()=>{ featureOffset=(featureOffset+1)%featureButtons.length; featureButtons.forEach((btn,i)=>{ const order=(i-featureOffset+featureButtons.length)%featureButtons.length; const tops=[0,28,60,95,133,175], widths=[180,215,250,286,322,360], op=[.46,.55,.62,.70,.78,.88]; btn.style.top=`${tops[order]}px`; btn.style.width=`${widths[order]}px`; btn.style.opacity=op[order]; }); },1600);

const solutionMap={
  brand:"Brand Strategy + Identity + Launch System",
  product:"UX Strategy + Product Design + Motion Prototype",
  attention:"Campaign Concept + Motion + Content System",
  automation:"AI Workflow + Custom Agents + Automation Layer"
};
document.querySelectorAll(".need-card").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".need-card").forEach(x=>x.classList.remove("active")); btn.classList.add("active");
  const title=document.getElementById("solutionTitle"); title.animate([{opacity:.2,transform:"translateY(8px)"},{opacity:1,transform:"none"}],{duration:350,easing:"cubic-bezier(.22,1,.36,1)"});
  title.textContent=solutionMap[btn.dataset.solution];
}));

const stage=document.getElementById("transformStage"), after=document.getElementById("afterLayer"), line=document.getElementById("dragLine");
let dragging=false;
function updateSplit(clientX){
  const r=stage.getBoundingClientRect(); const p=Math.max(8,Math.min(92,((clientX-r.left)/r.width)*100));
  after.style.clipPath=`inset(0 0 0 ${p}%)`; line.style.left=`${p}%`;
}
document.getElementById("dragHandle").addEventListener("pointerdown",e=>{dragging=true;e.currentTarget.setPointerCapture(e.pointerId)});
window.addEventListener("pointermove",e=>dragging&&updateSplit(e.clientX));
window.addEventListener("pointerup",()=>dragging=false);
stage.addEventListener("click",e=>updateSplit(e.clientX));

const io=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting) entry.target.classList.add("in-view")}),{threshold:.12});
document.querySelectorAll(".reveal").forEach(el=>io.observe(el));
window.addEventListener("resize",()=>setActive(activeIndex));
requestAnimationFrame(()=>setActive(2));

// Immersive sticky parallax + phone scenes
const immersive = document.getElementById("immersiveWork");
const mosaic = document.querySelector(".mosaic-back");
const phoneScenes = [...document.querySelectorAll(".phone-scene")];
function updateImmersive(){
  if(!immersive) return;
  const r = immersive.getBoundingClientRect();
  const max = immersive.offsetHeight - innerHeight;
  const passed = Math.max(0, Math.min(max, -r.top));
  const p = max > 0 ? passed / max : 0;
  if(mosaic) mosaic.style.transform = `translate3d(0,${(p * -42)}vh,0) scale(${1 + p*.06})`;
  const scene = Math.min(phoneScenes.length - 1, Math.floor(p * phoneScenes.length));
  phoneScenes.forEach((el,i)=>el.classList.toggle("active",i===scene));
}
window.addEventListener("scroll",updateImmersive,{passive:true});
updateImmersive();

// Liquid glass hover cursor for projects
document.querySelectorAll(".project-tile").forEach(tile=>{
  const bubble = tile.querySelector(".liquid-cursor");
  let tx=0,ty=0,cx=0,cy=0,raf=0;
  const loop=()=>{ cx += (tx-cx)*.18; cy += (ty-cy)*.18; bubble.style.left=`${cx}px`; bubble.style.top=`${cy}px`; raf=requestAnimationFrame(loop); };
  tile.addEventListener("mouseenter",e=>{ const r=tile.getBoundingClientRect(); tx=e.clientX-r.left;ty=e.clientY-r.top;cx=tx;cy=ty; if(!raf) loop(); });
  tile.addEventListener("mousemove",e=>{ const r=tile.getBoundingClientRect(); tx=e.clientX-r.left;ty=e.clientY-r.top; });
  tile.addEventListener("mouseleave",()=>{ cancelAnimationFrame(raf); raf=0; });
});

// Subtle cursor-reactive project object depth
document.querySelectorAll(".project-tile").forEach(tile=>{
  const obj=tile.querySelector(".project-object");
  tile.addEventListener("mousemove",e=>{
    const r=tile.getBoundingClientRect(), nx=(e.clientX-r.left)/r.width-.5, ny=(e.clientY-r.top)/r.height-.5;
    if(obj && !obj.classList.contains("project-lock")) obj.style.translate=`${nx*12}px ${ny*10}px`;
  });
  tile.addEventListener("mouseleave",()=>{ if(obj) obj.style.translate="0 0"; });
});


// Tablet web/product experience
const tabletExperience = document.getElementById("tabletExperience");
const tabletScenes = [...document.querySelectorAll(".tablet-scene")];
const tabletTabs = [...document.querySelectorAll("[data-tablet-tab]")];
const tabletFloats = [...document.querySelectorAll(".tablet-float")];
const tabletProgress = document.querySelector(".tablet-progress i");

function setTabletScene(index){
  tabletScenes.forEach((el,i)=>el.classList.toggle("active",i===index));
  tabletTabs.forEach((el,i)=>el.classList.toggle("active",i===index));
}
function updateTabletExperience(){
  if(!tabletExperience) return;
  const r = tabletExperience.getBoundingClientRect();
  const max = tabletExperience.offsetHeight - innerHeight;
  const passed = Math.max(0,Math.min(max,-r.top));
  const p = max>0 ? passed/max : 0;
  const scene = Math.min(2,Math.floor(p*3));
  setTabletScene(scene);
  tabletFloats.forEach((el,i)=>{
    const direction = i%2===0 ? -1 : 1;
    el.style.transform = `translate3d(0,${direction * p * (45 + i*8)}px,0) rotate(${direction*p*2}deg)`;
  });
  if(tabletProgress) tabletProgress.style.transform = `scaleX(${Math.max(.08,p)})`;
}
tabletTabs.forEach((btn,i)=>btn.addEventListener("click",()=>setTabletScene(i)));
window.addEventListener("scroll",updateTabletExperience,{passive:true});
updateTabletExperience();


// HERO V2 — Hightouch-inspired product storytelling, adapted to BARTSS.
const heroV2Data=[
 {title:"Brand Identity",eyebrow:"BARTSS / BRAND",art:"https://images.unsplash.com/photo-1600508774634-4e11d34730e2?auto=format&fit=crop&w=1200&q=84",context:"Brand context loading",output:"Distinct by design.",sub:"One identity. Every touchpoint.",assets:[["Positioning","Clear differentiation"],["Voice","Recognisable tone"],["Identity","Memorable system"],["Guidelines","Less brand drift"],["Applications","Ready to launch"],["Motion","Behaviour that sticks"]],benefits:["Recognisable faster","Consistent everywhere","Easier approvals","Ready to scale"],metric:"1 SYSTEM",metricLabel:"Brand outcome",formats:["Website","Deck","Social","Packaging","Motion"]},
 {title:"Web & Product",eyebrow:"BARTSS / WEB",art:"https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=84",context:"Product context loading",output:"Make the next step obvious.",sub:"Less friction. More completed actions.",assets:[["UX Architecture","Clearer journeys"],["Responsive UI","Every screen covered"],["Motion","Useful feedback"],["Conversion","More completed actions"],["Design System","Faster releases"],["Analytics","Learn what works"]],benefits:["Easier to understand","Faster to use","Conversion-ready","Reusable UI"],metric:"FLOW",metricLabel:"Product outcome",formats:["Desktop","Mobile","Landing","Product","Checkout"]},
 {title:"AutoLAB",eyebrow:"AUTOLAB / AI",art:"https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=84",context:"Story + brand context loading",output:"Ready to publish.",sub:"From story to approved visual.",assets:[["Storyboard","Scenes before generation"],["Character Lock","Consistent people"],["Style Lock","One visual language"],["Prompt Engine","Faster generations"],["Production","Automated variants"],["QC","Approved output only"]],benefits:["Fewer handoffs","Less visual drift","Faster variants","QC built in"],metric:"QC ON",metricLabel:"Production outcome",formats:["16:9","9:16","1:1","Ads","Campaign"]},
 {title:"Motion & 3D",eyebrow:"BARTSS / MOTION",art:"https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=84",context:"Motion system loading",output:"Make the idea move.",sub:"One motion language. Every format.",assets:[["Story","Clear motion intent"],["Key Visual","A strong anchor"],["3D","Premium depth"],["Motion Rules","Consistent behaviour"],["UI Motion","Useful feedback"],["Formats","Every channel covered"]],benefits:["More attention","Stronger recall","Reusable motion","Multi-format"],metric:"MOTION",metricLabel:"Attention outcome",formats:["Film","Social","UI","3D","Launch"]},
 {title:"AiFinance",eyebrow:"AIFINANCE / AI",art:"https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=84",context:"Decision context loading",output:"Less noise. Clearer moves.",sub:"Signals become decisions.",assets:[["Context","Understand why"],["Signals","Filter the noise"],["Risk","See exposure"],["Action","Decide faster"],["Tracking","Learn from outcomes"],["Agents","Keep watching"]],benefits:["Clear priorities","Less noise","Faster decisions","Traceable actions"],metric:"LIVE",metricLabel:"Decision outcome",formats:["Portfolio","Risk","Signals","Actions","Report"]},
 {title:"Proposal System",eyebrow:"BARTSS / SALES",art:"https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=84",context:"Sales context loading",output:"From interest to approval.",sub:"A proposal people can act on.",assets:[["Need","Understand intent"],["Scope","Make choices clear"],["Pricing","Interactive options"],["Approval","Shorter sign-off"],["Tracking","See buying intent"],["System","Reuse every time"]],benefits:["Faster approvals","Less email friction","Visible intent","Reusable sales flow"],metric:"READY",metricLabel:"Sales outcome",formats:["Brand","Web","Motion","AI","Retainer"]}
];

const staticArts=heroV2Data.map(x=>x.art);
loopCards.forEach(card=>{
  const logical=Number(card.dataset.logical);
  const img=card.querySelector(".hero-card-art");
  if(img){img.src=staticArts[logical];img.loading="eager";img.decoding="async";}
});

let heroV2Token=0,heroV2Timer=null,heroV2Running=false;
const wait=(ms,token)=>new Promise(resolve=>heroV2Timer=setTimeout(()=>resolve(token===heroV2Token),ms));
function heroV2Reset(animate=true){
  heroV2Token++;clearTimeout(heroV2Timer);heroV2Running=false;
  const stage=document.querySelector(".hero-v2-stage");
  if(!stage)return;
  if(animate){stage.dataset.phase="reset";stage.classList.add("resetting");setTimeout(()=>stage.remove(),480);}
  else stage.remove();
}
function heroV2Build(index){
  heroV2Reset(false);
  if(innerWidth<=1100)return null;
  const d=heroV2Data[index],active=cardAt(CENTER_SET,index);
  if(!d||!active)return null;
  const wrap=heroRailWrap.getBoundingClientRect(),cr=active.getBoundingClientRect();
  const stage=document.createElement("div");
  stage.className="hero-v2-stage";stage.dataset.phase="context";
  stage.style.setProperty("--hy",(cr.top-wrap.top+cr.height/2)+"px");
  const assetHtml=d.assets.map((x,n)=>'<i style="--n:'+n+'"><b>'+x[0]+'</b><span>'+x[1]+'</span></i>').join("");
  const benefitHtml=d.benefits.map((x,n)=>'<span style="--n:'+n+'"><i></i>'+x+'</span>').join("");
  const formatHtml=d.formats.map((x,n)=>'<i style="--n:'+n+'"><b>'+x+'</b><span>'+d.output+'</span></i>').join("");
  stage.innerHTML=
    '<div class="hv2-scene">'+
      '<div class="hv2-context"><b>'+d.context+'</b><span>● ● ● ● ●</span></div>'+
      '<div class="hv2-assets">'+assetHtml+'</div>'+
      '<div class="hv2-output"><div class="hv2-photo"><img src="'+d.art+'" alt=""></div><div class="hv2-output-copy"><small>'+d.eyebrow+'</small><b>'+d.output+'</b><span>'+d.sub+'</span></div></div>'+
      '<div class="hv2-benefits">'+benefitHtml+'</div>'+
      '<div class="hv2-metric"><small>'+d.metricLabel+'</small><div class="hv2-chart"></div><b>'+d.metric+'</b></div>'+
      '<div class="hv2-strategy"><span>✦</span><b>'+d.title+'</b><em>→ system ready</em></div>'+
      '<div class="hv2-formats">'+formatHtml+'</div>'+
    '</div>';
  heroRailWrap.appendChild(stage);
  return stage;
}
async function heroV2Play(index=activeIndex){
  if(innerWidth<=1100||railDragging||heroV2Running)return;
  heroV2Running=true;
  const stage=heroV2Build(index);if(!stage){heroV2Running=false;return;}
  const token=++heroV2Token;
  const phases=[["context",650],["skeleton",900],["assets",1100],["seed",680],["grow",1150],["benefits",1650],["metric",1650],["strategy",950],["formats",1800],["return",1250],["final",2600]];
  for(const pair of phases){
    if(token!==heroV2Token)return;
    stage.dataset.phase=pair[0];
    if(!await wait(pair[1],token))return;
  }
  stage.dataset.complete="true";heroV2Running=false;
}
heroRailWrap?.addEventListener("mouseenter",()=>{
  if(innerWidth<=1100||railDragging||heroV2Running)return;
  const existing=document.querySelector(".hero-v2-stage");
  if(existing?.dataset.complete==="true")return;
  setTimeout(()=>{if(heroRailWrap.matches(":hover")&&!railDragging)heroV2Play(activeIndex)},160);
});
