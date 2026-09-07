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
function markActive(card){
  loopCards.forEach(c=>c.classList.remove("active"));
  if(card) card.classList.add("active");
}
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
    // Drag only navigates. Motion starts only when the user clicks a card.
  },790);
}
function stopInertia(){if(railInertia)cancelAnimationFrame(railInertia);railInertia=0;}

loopCards.forEach(card=>card.addEventListener("click",()=>{
  const next=Number(card.dataset.logical);
  heroV2Reset();
  setActive(next);
  setTimeout(()=>heroV2Play(next),900);
}));

// Hero selection is click-only. Drag and wheel navigation are intentionally disabled
// so the rail stays spatially stable and the selected card can always center cleanly.
if(heroRailWrap){
  heroRailWrap.addEventListener("pointerdown",e=>{
    if(innerWidth<=1100||e.button!==0)return;
    railDragging=false;
  });
}
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


// HERO V2 — exact 7-step timeline adapted from the supplied Hightouch reference.
const heroV2Data=[
 {title:"Brand Identity",eyebrow:"BARTSS / BRAND",art:"https://images.unsplash.com/photo-1600508774634-4e11d34730e2?auto=format&fit=crop&w=1200&q=84",build:[["Logo design","Ownable mark"],["Brand identity","One visual language"],["Typography & color","Recognisable system"],["Print assets","Ready for real-world use"]],resultTitle:"Identity system ready",resultSub:"Logo, type, color and print working as one.",value:"Brand recognition",metric:"+38%"},
 {title:"Web & Product",eyebrow:"BARTSS / WEB",art:"https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=84",build:[["UX architecture","Clear user path"],["Responsive UI","Every screen covered"],["Design system","Faster iteration"],["Conversion flow","More completed actions"]],resultTitle:"Product flow ready",resultSub:"Clearer UX, reusable UI and stronger conversion.",value:"Task completion",metric:"+31%"},
 {title:"AutoLAB",eyebrow:"AUTOLAB / AI",art:"https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=84",build:[["Storyboard","Scene structure"],["Character Lock","Consistent people"],["Style Lock","One visual language"],["QC pipeline","Approved output only"]],resultTitle:"Production pipeline ready",resultSub:"Story to approved visual with less drift.",value:"Production speed",metric:"3.4×"},
 {title:"Motion & 3D",eyebrow:"BARTSS / MOTION",art:"https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=84",build:[["Storyboard","Clear motion intent"],["3D asset","Premium depth"],["Motion language","Memorable behaviour"],["Format system","Every channel covered"]],resultTitle:"Motion system ready",resultSub:"One idea adapted across every moving format.",value:"Attention lift",metric:"+42%"},
 {title:"AiFinance",eyebrow:"AIFINANCE / AI",art:"https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=84",build:[["Context layer","Understand why"],["Signal filter","Remove noise"],["Risk view","See exposure"],["Action tracking","Close the loop"]],resultTitle:"Decision system ready",resultSub:"Noise filtered into clearer actions.",value:"Decision clarity",metric:"+27%"},
 {title:"Proposal System",eyebrow:"BARTSS / SALES",art:"https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=84",build:[["Scope builder","Clear choices"],["Interactive pricing","Less back-and-forth"],["Approval flow","Shorter sign-off"],["Client tracking","Visible buying intent"]],resultTitle:"Sales flow ready",resultSub:"Interest moves faster toward approval.",value:"Approval speed",metric:"+46%"}
];

loopCards.forEach(card=>{
  const logical=Number(card.dataset.logical);
  const img=card.querySelector(".hero-card-art");
  if(img){img.src=heroV2Data[logical].art;img.loading="eager";img.decoding="async";}
});

let heroV2Token=0,heroV2Timer=null,heroV2Running=false,heroV2AutoTimer=null;

function hvWait(ms,token){
  return new Promise(resolve=>heroV2Timer=setTimeout(()=>resolve(token===heroV2Token),ms));
}
function heroV2RestoreSources(){
  loopCards.forEach(c=>{
    c.classList.remove("hero-v2-source","hero-v2-slot");
    c.style.removeProperty("--hv2-slot-extra");
    if(c.dataset.hv2Hidden==="1"){
      c.style.removeProperty("opacity");
      c.style.removeProperty("visibility");
      c.style.removeProperty("pointer-events");
      c.style.removeProperty("transform");
      c.dataset.hv2Hidden="0";
    }
  });
}
function heroV2Reset(){
  heroV2Token++;
  clearTimeout(heroV2Timer);clearTimeout(heroV2AutoTimer);
  heroV2Running=false;
  heroV2RestoreSources();
  heroRailWrap?.classList.remove("hero-v2-playing");
  document.querySelector(".hero-v2-stage")?.remove();
}
function heroV2Build(index){
  heroV2Reset();
  if(innerWidth<=1100)return null;
  const d=heroV2Data[index];
  const active=nearestCard() || cardAt(CENTER_SET,index);
  if(!d||!active)return null;
  const wrap=heroRailWrap.getBoundingClientRect(),cr=active.getBoundingClientRect();
  const stage=document.createElement("div");
  stage.className="hero-v2-stage";
  stage.dataset.phase="card";
  stage.style.setProperty("--hy",(cr.top-wrap.top+cr.height/2)+"px");

  const thumbs=d.build.map((x,n)=>
    '<i style="--n:'+n+'"><img src="'+d.art+'" alt=""><b>'+x[0]+'</b><em>'+x[1]+'</em></i>'
  ).join("");
  const checklist=d.build.map((x,n)=>
    '<span style="--n:'+n+'"><i></i><b>'+x[0]+'</b><em>'+x[1]+'</em></span>'
  ).join("");

  stage.innerHTML=
    '<div class="hv2-exact-scene">'+
      '<div class="hv2-main-card">'+
        '<div class="hv2-main-photo"><img src="'+d.art+'" alt=""></div>'+
        '<div class="hv2-main-copy"><small>'+d.eyebrow+'</small><b>'+d.title+'</b><span>Ideas into outcomes.</span></div>'+
      '</div>'+
      '<div class="hv2-building"><span class="spinner"></span><b>Building…</b></div>'+
      '<div class="hv2-build-copy">'+checklist+'</div>'+
      '<div class="hv2-pin-grid">'+thumbs+'</div>'+
      '<div class="hv2-result-card">'+
        '<div class="hv2-result-photo"><img src="'+d.art+'" alt=""></div>'+
        '<div class="hv2-result-copy"><small>'+d.eyebrow+'</small><b>'+d.resultTitle+'</b><span>'+d.resultSub+'</span></div>'+
      '</div>'+
      '<div class="hv2-impact"><small>'+d.value+'</small><svg class="hv2-impact-chart" viewBox="0 0 100 40" aria-hidden="true"><path class="hv2-impact-grid" d="M0 34H100 M0 20H100 M0 6H100"/><path class="hv2-impact-line" d="M2 32 C15 28 20 25 29 27 S44 19 53 20 S69 10 77 13 S91 6 98 3"/></svg><b>'+d.metric+'</b></div>'+
    '</div>';

  const visibleActive=nearestCard() || active;
  loopCards.forEach(c=>{
    if(Number(c.dataset.logical)===index || c===visibleActive){
      c.classList.add("hero-v2-source");
      c.dataset.hv2Hidden="1";
      c.style.setProperty("opacity","0","important");
      c.style.setProperty("visibility","hidden","important");
      c.style.setProperty("pointer-events","none","important");
      c.style.setProperty("transform","scale(.92)","important");
    }
  });

  // Expand the actual visible slot in-flow so neighboring cards are physically pushed away.
  visibleActive.classList.add("hero-v2-slot");
  const slotExtra=240;
  visibleActive.style.setProperty("--hv2-slot-extra",slotExtra+"px");
  heroRailWrap.classList.add("hero-v2-playing");

  // Expanding a flex item grows to the right. Counter-shift the rail by half
  // the added width so the active motion area stays centered and both neighbors
  // are displaced outward symmetrically.
  requestAnimationFrame(()=>{
    railX=getRailX()-(slotExtra/2);
    rail.style.transition="transform .82s cubic-bezier(.18,.82,.18,1)";
    rail.style.transform="translate3d("+railX+"px,0,0)";
  });

  heroRailWrap.appendChild(stage);
  return stage;
}

async function heroV2Play(index=activeIndex){
  if(innerWidth<=1100||railDragging||heroV2Running)return;
  const stage=heroV2Build(index);
  if(!stage)return;
  heroV2Running=true;
  const token=++heroV2Token;

  // 1. Full hero card — visible briefly exactly where the slider card was.
  stage.dataset.phase="card";
  if(!await hvWait(900,token))return;

  // 2. Card compresses into the Building bubble.
  stage.dataset.phase="building";
  if(!await hvWait(820,token))return;

  // 3. Building stays on the left; checklist + Pinterest-style asset grid builds beside it.
  stage.dataset.phase="build";
  if(!await hvWait(3400,token))return;

  // 4. Entire build UI shrinks/fades away as one system.
  stage.dataset.phase="collapse";
  if(!await hvWait(760,token))return;

  // 5. Selected/generated asset emerges small from the center.
  stage.dataset.phase="resultSeed";
  if(!await hvWait(650,token))return;

  // 6. Result card grows smoothly toward full card size.
  stage.dataset.phase="resultGrow";
  if(!await hvWait(1150,token))return;

  // 7. Value/impact graph draws in, then number counts to the result.
  stage.dataset.phase="impact";
  const impactBox=stage.querySelector(".hv2-impact");
  const impactNumber=impactBox?.querySelector("b");
  const impactLine=impactBox?.querySelector(".hv2-impact-line");
  if(impactLine){
    impactLine.style.strokeDasharray="160";
    impactLine.style.strokeDashoffset="160";
    requestAnimationFrame(()=>impactLine.style.strokeDashoffset="0");
  }
  if(impactNumber){
    const raw=d.metric;
    const numeric=parseFloat(String(raw).replace(/[^0-9.]/g,""));
    const prefix=String(raw).trim().startsWith("+")?"+":"";
    const suffix=String(raw).includes("%")?"%":(String(raw).includes("×")?"×":"");
    if(Number.isFinite(numeric)){
      const started=performance.now();
      const duration=1250;
      const tick=now=>{
        if(token!==heroV2Token||!impactNumber.isConnected)return;
        const p=Math.min(1,(now-started)/duration);
        const eased=1-Math.pow(1-p,3);
        const value=numeric*eased;
        impactNumber.textContent=prefix+(numeric%1?value.toFixed(1):Math.round(value))+suffix;
        if(p<1)requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }
  if(!await hvWait(1750,token))return;
  stage.dataset.phase="final";
  heroV2Running=false;
  await hvWait(1150,token);
  if(token!==heroV2Token)return;
  const source=nearestCard() || cardAt(CENTER_SET,index);
  const slot=heroRailWrap.querySelector(".show-card.hero-v2-slot");
  if(slot){
    const currentExtra=parseFloat(getComputedStyle(slot).getPropertyValue("--hv2-slot-extra"))||240;
    slot.style.setProperty("--hv2-slot-extra","0px");
    railX=getRailX()+(currentExtra/2);
    rail.style.transition="transform .72s cubic-bezier(.18,.82,.18,1)";
    rail.style.transform="translate3d("+railX+"px,0,0)";
  }
  setTimeout(()=>{
    if(source){
      source.style.setProperty("opacity","1","important");
      source.style.setProperty("visibility","visible","important");
      source.style.setProperty("pointer-events","auto","important");
      source.classList.remove("hero-v2-source","hero-v2-slot");
      source.style.removeProperty("--hv2-slot-extra");
      source.dataset.hv2Hidden="0";
    }
  },360);
  stage.classList.add("final-handoff");
  heroRailWrap?.classList.remove("hero-v2-playing");
  setTimeout(()=>stage.remove(),520);

  // Final state holds. Next card is user-driven (click or drag).
}

// Motion is intentionally click-triggered. Hover remains a lightweight visual cue only.
