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
let railX = 0;
const baseCards = cards;
const baseCount = baseCards.length;

// Infinite visual rail: [clone set] [real set] [clone set].
const beforeFrag=document.createDocumentFragment();
baseCards.forEach((card,i)=>{
  const clone=card.cloneNode(true);
  clone.removeAttribute("id");
  clone.dataset.clone="before";
  clone.dataset.logical=String(i);
  beforeFrag.appendChild(clone);
});
rail.insertBefore(beforeFrag,rail.firstChild);
const afterFrag=document.createDocumentFragment();
baseCards.forEach((card,i)=>{
  const clone=card.cloneNode(true);
  clone.removeAttribute("id");
  clone.dataset.clone="after";
  clone.dataset.logical=String(i);
  afterFrag.appendChild(clone);
});
rail.appendChild(afterFrag);

const loopCards=[...rail.querySelectorAll(".show-card")];
loopCards.forEach((card,i)=>{
  if(card.dataset.logical==null) card.dataset.logical=String((i-baseCount+baseCount)%baseCount);
});

function getRailX(){
  const m=getComputedStyle(rail).transform;
  return m==="none"?0:new DOMMatrixReadOnly(m).m41;
}
function centerXForCard(card){
  const wrap=document.querySelector(".rail-wrap").getBoundingClientRect();
  return window.innerWidth/2-wrap.left-(card.offsetLeft+card.offsetWidth/2);
}
function markActiveCopy(copyIndex){
  loopCards.forEach((card,i)=>card.classList.toggle("active",i===copyIndex));
}
function centerActiveCard(immediate=false){
  if(window.innerWidth<=1100)return;
  const targetIndex=baseCount+activeIndex;
  const target=loopCards[targetIndex];
  if(!target)return;
  railX=centerXForCard(target);
  const prev=rail.style.transition;
  if(immediate)rail.style.transition="none";
  rail.style.transform=`translate3d(${railX}px,0,0)`;
  markActiveCopy(targetIndex);
  if(immediate){
    rail.offsetHeight;
    rail.style.transition=prev;
  }
}
function setActive(index,immediate=false){
  activeIndex=((index%baseCount)+baseCount)%baseCount;
  requestAnimationFrame(()=>centerActiveCard(immediate));
}
function nearestLoopCard(){
  let best=baseCount+activeIndex,bestDist=Infinity;
  loopCards.forEach((card,i)=>{
    const r=card.getBoundingClientRect();
    const d=Math.abs((r.left+r.width/2)-window.innerWidth/2);
    if(d<bestDist){bestDist=d;best=i;}
  });
  return best;
}
function snapToLoopCard(copyIndex){
  const target=loopCards[copyIndex];
  if(!target)return;
  activeIndex=Number(target.dataset.logical);
  markActiveCopy(copyIndex);
  railX=centerXForCard(target);
  rail.style.transition="transform .78s cubic-bezier(.18,.82,.18,1)";
  rail.style.transform=`translate3d(${railX}px,0,0)`;
  setTimeout(()=>{
    const canonical=baseCount+activeIndex;
    if(copyIndex!==canonical){
      rail.style.transition="none";
      railX=centerXForCard(loopCards[canonical]);
      rail.style.transform=`translate3d(${railX}px,0,0)`;
      markActiveCopy(canonical);
      rail.offsetHeight;
      rail.style.transition="";
    }
  },820);
}
loopCards.forEach(card=>card.addEventListener("click",()=>{
  if(card.dataset.clone){
    activeIndex=Number(card.dataset.logical);
    setActive(activeIndex);
  }else setActive(Number(card.dataset.index));
}));

let wheelLock=false;
window.addEventListener("wheel",e=>{
  if(window.innerWidth<=1100||document.body.classList.contains("menu-open"))return;
  const rect=rail.getBoundingClientRect();
  if(rect.bottom<0||rect.top>window.innerHeight||Math.abs(e.deltaY)<18||wheelLock)return;
  wheelLock=true;
  heroV2Reset(true);
  setActive(activeIndex+(e.deltaY>0?1:-1));
  setTimeout(()=>wheelLock=false,620);
},{passive:true});

// Tactile drag: motion collapses first, rail follows pointer 1:1, inertia, snap, loop.
const heroRailWrap=document.querySelector(".rail-wrap");
let railDragging=false,dragStartX=0,dragStartRailX=0,lastDragX=0,lastDragT=0,railVelocity=0,railInertia=0,dragMoved=false;
function stopRailInertia(){if(railInertia)cancelAnimationFrame(railInertia);railInertia=0;}
let loopSetWidth=0,loopOriginX=0;
function refreshLoopGeometry(){
  if(window.innerWidth<=1100||loopCards.length<baseCount*2)return;
  loopSetWidth=loopCards[baseCount].offsetLeft-loopCards[0].offsetLeft;
  loopOriginX=centerXForCard(loopCards[baseCount+activeIndex]);
}
function normalizeLoopX(x){
  if(!loopSetWidth)refreshLoopGeometry();
  if(!loopSetWidth)return x;
  const low=loopOriginX-loopSetWidth/2,high=loopOriginX+loopSetWidth/2;
  while(x<low)x+=loopSetWidth;
  while(x>high)x-=loopSetWidth;
  return x;
}
if(heroRailWrap){
  heroRailWrap.addEventListener("pointerdown",e=>{
    if(window.innerWidth<=1100||e.button!==0)return;
    stopRailInertia();
    heroV2Reset(true);
    railDragging=true;dragMoved=false;
    dragStartX=lastDragX=e.clientX;
    lastDragT=performance.now();
    dragStartRailX=getRailX();railX=dragStartRailX;railVelocity=0;
    heroRailWrap.classList.add("is-dragging");
    rail.style.transition="none";
    heroRailWrap.setPointerCapture(e.pointerId);
  });
  heroRailWrap.addEventListener("pointermove",e=>{
    if(!railDragging)return;
    const now=performance.now(),dt=Math.max(8,now-lastDragT);
    const dx=e.clientX-dragStartX;
    if(Math.abs(dx)>4)dragMoved=true;
    railX=normalizeLoopX(dragStartRailX+dx);
    rail.style.transform=`translate3d(${railX}px,0,0)`;
    const instant=(e.clientX-lastDragX)/dt*16.67;
    railVelocity=railVelocity*.68+instant*.32;
    lastDragX=e.clientX;lastDragT=now;
    markActiveCopy(nearestLoopCard());
  });
  const finish=e=>{
    if(!railDragging)return;
    railDragging=false;
    heroRailWrap.classList.remove("is-dragging");
    try{heroRailWrap.releasePointerCapture(e.pointerId)}catch{}
    if(!dragMoved){
      rail.style.transition="";
      snapToLoopCard(nearestLoopCard());
      return;
    }
    let v=Math.max(-34,Math.min(34,railVelocity*1.2));
    const glide=()=>{
      v*=.93;
      railX=normalizeLoopX(railX+v);
      rail.style.transform=`translate3d(${railX}px,0,0)`;
      markActiveCopy(nearestLoopCard());
      if(Math.abs(v)>.32)railInertia=requestAnimationFrame(glide);
      else{
        railInertia=0;
        snapToLoopCard(nearestLoopCard());
        setTimeout(()=>{refreshLoopGeometry();if(heroRailWrap.matches(":hover")&&!railDragging)heroV2Play(activeIndex);},900);
      }
    };
    railInertia=requestAnimationFrame(glide);
  };
  heroRailWrap.addEventListener("pointerup",finish);
  heroRailWrap.addEventListener("pointercancel",finish);
}
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


// HERO V2: benefit-led motion choreography based on the supplied reference.
const heroV2Data=[
 {title:"Brand Identity",eyebrow:"BARTSS / BRAND",art:"https://imockups.com/storage/product/1512/ggaQh3Jpsf2HomOEs9Lf.png",desc:"A recognisable identity system that stays coherent everywhere.",a:"#afcddd",b:"#587080",prompt:"Build a brand people recognise instantly",status:"Structuring the brand system…",steps:[["Positioning","Clear differentiation"],["Identity System","Stronger recognition"],["Guidelines","Less brand drift"],["Launch Kit","Faster rollout"],["Motion Rules","Memorable behaviour"]],pills:["Recognisable faster","Consistent everywhere","Easier approvals","Ready to scale"],metric:"SYSTEM",metricLabel:"Brand outcome"},
 {title:"Web & Product",eyebrow:"BARTSS / WEB",art:"https://cdn.dribbble.com/userupload/36025617/file/original-24879b126976f1c510da521e1ab16360.png?resize=1200x1200&vertical=center",desc:"A product experience that removes friction and moves people to action.",a:"#b8d4e4",b:"#5e7889",prompt:"Turn interest into a clear next action",status:"Removing product friction…",steps:[["UX Architecture","Clearer journeys"],["Responsive UI","Works on every screen"],["Motion System","Feedback people understand"],["Conversion Flow","More completed actions"],["Design System","Faster future releases"]],pills:["Easier to understand","Faster to use","Conversion-ready","Reusable UI"],metric:"FLOW",metricLabel:"Product outcome"},
 {title:"AutoLAB",eyebrow:"AUTOLAB / AI",art:"https://cdn.vicsee.com/blog/20260228-seedance-omni-reference/hero.jpg",desc:"A controlled AI production pipeline from story to approved asset.",a:"#bed55e",b:"#657b45",prompt:"Turn a story into approved visual production",status:"Building the production pipeline…",steps:[["Storyboard","Scenes before generation"],["Character Lock","Consistent people"],["Style Lock","One visual language"],["Prompt Engine","Faster generations"],["QC","Approved output only"]],pills:["Fewer handoffs","Less visual drift","Faster variants","QC built in"],metric:"QC ON",metricLabel:"Production outcome"},
 {title:"Motion & 3D",eyebrow:"BARTSS / MOTION",art:"https://i.pinimg.com/originals/30/90/43/3090437ce606d8965c958910a6c9e294.png",desc:"A motion language that turns static ideas into memorable behaviour.",a:"#b9d5e5",b:"#5e7789",prompt:"Give the idea a motion language",status:"Building movement and depth…",steps:[["Storyboard","Clear motion intent"],["3D Asset","Premium visual depth"],["Motion Language","Stronger brand recall"],["UI Motion","Useful interaction feedback"],["Format System","Every channel covered"]],pills:["More attention","Stronger recall","Reusable motion","Multi-format"],metric:"MOTION",metricLabel:"Attention outcome"},
 {title:"AiFinance",eyebrow:"AIFINANCE / AI",art:"https://files.muzli.cloud/131fbc64d7065b35accaf302d0648723_medium.jpeg?_cb=1778503539794",desc:"Decision intelligence that filters noise and makes the next move clearer.",a:"#d5df79",b:"#627546",prompt:"Turn financial noise into clear decisions",status:"Filtering decision context…",steps:[["Context","Understand why"],["Signal Filter","Less noise"],["Risk Layer","See exposure"],["Action","Decide faster"],["Tracking","Learn from outcomes"]],pills:["Clear priorities","Less noise","Faster decisions","Traceable actions"],metric:"LIVE",metricLabel:"Decision outcome"}
];

const heroStaticArts=heroV2Data.map(x=>x.art);
loopCards.forEach(card=>{
  const logical=Number(card.dataset.logical ?? card.dataset.index ?? 0);
  const img=card.querySelector(".hero-card-art");
  if(img){img.src=heroStaticArts[logical];img.loading="eager";img.decoding="async";}
});

let heroV2Token=0,heroV2Timer=null,heroV2Running=false;
const wait=(ms,token)=>new Promise(resolve=>{
  heroV2Timer=setTimeout(()=>resolve(token===heroV2Token),ms);
});
function heroV2Reset(animate=true){
  heroV2Token++;
  clearTimeout(heroV2Timer);
  heroV2Running=false;
  const stage=document.querySelector(".hero-v2-stage");
  loopCards.forEach(c=>c.classList.remove("hero-v2-source"));
  if(!stage)return;
  if(animate){
    stage.classList.add("resetting");
    stage.dataset.phase="reset";
    setTimeout(()=>stage.remove(),560);
  }else stage.remove();
}
function heroV2Build(index){
  heroV2Reset(false);
  if(innerWidth<=1100)return null;
  const wrap=document.querySelector(".rail-wrap");
  const card=loopCards[baseCount+index];
  const d=heroV2Data[index];
  if(!wrap||!card||!d)return null;
  const wr=wrap.getBoundingClientRect(),cr=card.getBoundingClientRect();
  const stage=document.createElement("div");
  stage.className="hero-v2-stage";stage.dataset.phase="idle";
  stage.style.setProperty("--hy",(cr.top-wr.top+cr.height/2)+"px");
  stage.style.setProperty("--ha",d.a);stage.style.setProperty("--hb",d.b);
  stage.innerHTML=`
   <div class="hv2-ref-scene">
    <div class="hv2-card">
      <div class="hv2-photo"><img src="${d.art}" alt="" aria-hidden="true"></div>
      <div class="hv2-glass-wash"></div>
      <div class="hv2-card-top"><span>${String(index+1).padStart(2,"0")}</span><em>BARTSS LAB</em></div>
      <div class="hv2-card-copy"><small>${d.eyebrow}</small><b>${d.title}</b><i>${d.desc}</i></div>
    </div>
    <div class="hv2-prompt"><span>✦</span><b>${d.prompt}</b><i>→</i></div>
    <div class="hv2-status">● ${d.status}</div>
    <div class="hv2-assets">${d.steps.map((x,n)=>`<i style="--n:${n}"><b>${x[0]}</b><span>${x[1]}</span></i>`).join("")}</div>
    <div class="hv2-pills">${d.pills.map((x,n)=>`<span style="--n:${n}"><i></i>${x}</span>`).join("")}</div>
    <div class="hv2-metric"><small>${d.metricLabel}</small><div class="hv2-chart"></div><b>${d.metric}</b></div>
   </div>`;
  wrap.appendChild(stage);
  return stage;
}
async function heroV2Play(index=activeIndex){
  if(innerWidth<=1100||railDragging||heroV2Running)return;
  heroV2Running=true;
  const stage=heroV2Build(index);if(!stage){heroV2Running=false;return;}
  const token=++heroV2Token;
  stage.dataset.phase="idle";
  if(!await wait(520,token))return;
  stage.dataset.phase="collapse"; if(!await wait(850,token))return;
  stage.dataset.phase="prompt"; if(!await wait(720,token))return;
  stage.dataset.phase="status"; if(!await wait(520,token))return;
  stage.dataset.phase="skeleton"; if(!await wait(900,token))return;
  stage.dataset.phase="assets"; if(!await wait(1050,token))return;
  stage.dataset.phase="seed"; if(!await wait(650,token))return;
  stage.dataset.phase="grow"; if(!await wait(1200,token))return;
  stage.dataset.phase="pills"; if(!await wait(1700,token))return;
  stage.dataset.phase="metric"; if(!await wait(1800,token))return;
  stage.dataset.phase="final";stage.dataset.complete="true";heroV2Running=false;
}
if(heroRailWrap){
  heroRailWrap.addEventListener("mouseenter",()=>{
    if(innerWidth<=1100||railDragging)return;
    const existing=document.querySelector(".hero-v2-stage");
    if(existing?.dataset.complete==="true"||heroV2Running)return;
    setTimeout(()=>{if(heroRailWrap.matches(":hover")&&!railDragging)heroV2Play(activeIndex)},180);
  });
}
requestAnimationFrame(()=>{setActive(activeIndex,true);setTimeout(refreshLoopGeometry,80);});
window.addEventListener("load",()=>{setActive(activeIndex,true);setTimeout(refreshLoopGeometry,120);});
if(document.fonts?.ready)document.fonts.ready.then(()=>{setActive(activeIndex,true);setTimeout(refreshLoopGeometry,80);});
