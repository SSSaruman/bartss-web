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
const baseCards = cards.map((c,i)=>{
  const clone=c.cloneNode(true);
  clone.removeAttribute("id");
  clone.dataset.logical=String(i);
  return clone;
});
const baseCount=baseCards.length;
let activeVirtual = baseCount*2 + activeIndex;
const heroRailWrap=document.querySelector(".rail-wrap");
let heroBusy=false;
let heroNavToken=0;
let heroSequenceTimer=null;
let heroNormalizeTimer=null;
let heroAutoplayTimer=null;
let heroUserPauseTimer=null;

function stopHeroAutoplay(){
  clearInterval(heroAutoplayTimer);
  heroAutoplayTimer=null;
}
function startHeroAutoplay(){
  stopHeroAutoplay();
  if(innerWidth<=1100 || document.hidden)return;
  heroAutoplayTimer=setInterval(()=>{
    if(heroBusy || document.body.classList.contains("menu-open"))return;
    selectHero(activeVirtual+1,{play:false,sequence:false});
  },3200);
}
function pauseHeroAutoplay(ms=6500){
  stopHeroAutoplay();
  clearTimeout(heroUserPauseTimer);
  heroUserPauseTimer=setTimeout(startHeroAutoplay,ms);
}

// Five physical copies = real continuous rail. The middle set is the working set.
const loopCards=[];
for(let set=0;set<5;set++){
  baseCards.forEach((base,i)=>{
    const clone=base.cloneNode(true);
    clone.dataset.logical=String(i);
    clone.dataset.virtual=String(set*baseCount+i);
    clone.dataset.loopSet=String(set);
    loopCards.push(clone);
  });
}
rail.replaceChildren(...loopCards);

function liveCards(){ return [...rail.querySelectorAll(".show-card")]; }
function clearHeroSequence(){ clearTimeout(heroSequenceTimer); heroSequenceTimer=null; }

function heroStep(){
  const w=innerWidth;
  // 5-card viewport composition:
  // center + 2 near + 2 edge cards, with no empty side gutters.
  return Math.max(360,Math.min(410,w*.22));
}

function applyHeroLayout({animate=true}={}){
  const step=heroStep();
  const cardsNow=liveCards();

  cardsNow.forEach(card=>{
    const virtual=Number(card.dataset.virtual);
    const d=virtual-activeVirtual;
    const abs=Math.abs(d);
    const push=heroBusy && d!==0 ? (d<0?-115:115) : 0;
    const x=d*step+push;
    const scale=d===0?1.08:(abs===1?.94:.88);
    const opacity=abs>3?0:(d===0?1:(abs===1?.80:.62));

    card.classList.remove("hero-teleport");
    card.style.removeProperty("transition");
    card.style.transitionDuration=animate?".82s":"0s";
    card.dataset.heroDistance=String(d);
    card.style.setProperty("--hero-x",x+"px");
    card.style.setProperty("--hero-scale",String(scale));
    card.style.setProperty("--hero-opacity",String(opacity));
    card.style.zIndex=String(Math.max(1,30-abs));
    card.classList.toggle("active",d===0);
    card.style.pointerEvents=abs<=2?"auto":"none";
  });
}

function normalizeHeroRail(){
  const logical=((activeVirtual%baseCount)+baseCount)%baseCount;
  const middleVirtual=baseCount*2+logical;
  if(activeVirtual===middleVirtual)return;
  activeVirtual=middleVirtual;
  activeIndex=logical;
  applyHeroLayout({animate:false});
}

function selectHero(virtualIndex,{play=true,sequence=false}={}){
  clearHeroSequence();
  clearTimeout(heroNormalizeTimer);
  const token=++heroNavToken;
  heroV2Reset();

  activeVirtual=virtualIndex;
  activeIndex=((activeVirtual%baseCount)+baseCount)%baseCount;
  updateFeatureStack(activeIndex);
  applyHeroLayout({animate:true});

  // After the visible slide completes, silently return to the identical middle copy.
  heroNormalizeTimer=setTimeout(()=>{
    if(token!==heroNavToken || heroBusy)return;
    normalizeHeroRail();
  },900);

  if(play){
    heroSequenceTimer=setTimeout(()=>{
      if(token!==heroNavToken)return;
      heroV2Play(activeIndex,{sequence});
    },900);
  }
}

rail.addEventListener("click",e=>{
  const card=e.target.closest(".show-card");
  if(!card)return;
  e.preventDefault();
  pauseHeroAutoplay(9000);
  selectHero(Number(card.dataset.virtual),{play:true,sequence:true});
});

let heroSwipeStartX=null;
let heroSwipeMoved=false;

heroRailWrap?.addEventListener("pointerdown",e=>{
  if(heroBusy)return;
  heroSwipeStartX=e.clientX;
  heroSwipeMoved=false;
});

heroRailWrap?.addEventListener("pointermove",e=>{
  if(heroSwipeStartX===null)return;
  if(Math.abs(e.clientX-heroSwipeStartX)>10) heroSwipeMoved=true;
});

heroRailWrap?.addEventListener("pointerup",e=>{
  if(heroSwipeStartX===null||heroBusy){heroSwipeStartX=null;return;}
  const dx=e.clientX-heroSwipeStartX;
  heroSwipeStartX=null;
  if(Math.abs(dx)<55)return;
  pauseHeroAutoplay();
  const next=activeVirtual+(dx<0?1:-1);
  selectHero(next,{play:false,sequence:false});
});

heroRailWrap?.addEventListener("wheel",e=>{
  if(innerWidth<=1100||heroBusy||Math.abs(e.deltaX)<=Math.abs(e.deltaY))return;
  e.preventDefault();
  pauseHeroAutoplay();
  const next=activeVirtual+(e.deltaX>0?1:-1);
  selectHero(next,{play:false,sequence:false});
},{passive:false});

window.addEventListener("resize",()=>applyHeroLayout({animate:false}));

requestAnimationFrame(()=>{
  heroRailWrap?.classList.add("hero-intro");
  updateFeatureStack(activeIndex);
  liveCards().forEach(card=>card.style.setProperty("--intro-delay",(Math.min(4,Math.abs(Number(card.dataset.virtual)-activeVirtual))*65)+"ms"));
  applyHeroLayout({animate:false});
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    heroRailWrap?.classList.add("hero-intro-done");
    applyHeroLayout({animate:true});
    setTimeout(startHeroAutoplay,1400);
  }));
});
const heroFeatureMap=[
  ["POSITIONING CLARITY","OWNABLE IDENTITY","CONSISTENT ROLLOUT"],
  ["CLEARER JOURNEY","LOWER FRICTION","CONVERSION FLOW"],
  ["STRONGER HOOK","MOTION LANGUAGE","MEMORABLE STORY"],
  ["WORKFLOW AUDIT","AI AUTOMATION","CUSTOM SYSTEMS"],
  ["CONNECTED STRATEGY","SHARED SYSTEM","SCALABLE GROWTH"]
];

function updateFeatureStack(index){
  const labels=heroFeatureMap[index] || heroFeatureMap[0];
  featureButtons.forEach((btn,i)=>{
    const span=btn.querySelector("span");
    if(span) span.textContent=labels[i] || "";
  });
}

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


// HERO V2 — clean Hightouch-inspired product story.
const heroV2Data=[
 {title:"Brand clarity",eyebrow:"BARTSS / BRAND",art:"https://images.unsplash.com/photo-1600508774634-4e11d34730e2?auto=format&fit=crop&w=1200&q=84",build:[["Positioning","Clarify the promise"],["Identity","Create ownable signals"],["Motion","Make the system recognisable"],["Web","Carry it into experience"]],resultTitle:"Brand system ready",resultSub:"Strategy, identity, motion and web working as one.",value:"Brand clarity",metric:"+38%"},
 {title:"Digital conversion",eyebrow:"BARTSS / DIGITAL",art:"https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=84",build:[["UX","Reduce friction"],["Content architecture","Explain value faster"],["Web","Make actions obvious"],["Conversion system","Move visitors toward decisions"]],resultTitle:"Conversion path ready",resultSub:"Clearer journey, less friction, stronger action.",value:"Task completion",metric:"+31%"},
 {title:"Attention",eyebrow:"BARTSS / ATTENTION",art:"https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=84",build:[["Campaign idea","Create the hook"],["Motion","Build behaviour"],["3D","Add depth"],["Content system","Extend across channels"]],resultTitle:"Attention system ready",resultSub:"One idea designed to be noticed and remembered.",value:"Attention lift",metric:"+42%"},
 {title:"Efficiency",eyebrow:"BARTSS / SYSTEMS",art:"https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=84",build:[["Workflow analysis","Find repetitive work"],["AI","Automate decisions"],["Automation","Connect the steps"],["Custom systems","Make it usable"]],resultTitle:"Workflow system ready",resultSub:"Manual production reduced into a controlled system.",value:"Production speed",metric:"3.4×"},
 {title:"Growth system",eyebrow:"BARTSS / GROWTH",art:"https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=84",build:[["Strategy","Align the direction"],["Experience","Connect the touchpoints"],["Systems","Remove fragmentation"],["Scale","Extend what works"]],resultTitle:"Growth system ready",resultSub:"Strategy, experience and systems moving together.",value:"System coherence",metric:"+35%"}
];

liveCards().forEach(card=>{
  const d=heroV2Data[Number(card.dataset.logical)];
  const img=card.querySelector(".hero-card-art");
  if(img){ img.src=d.art; img.loading="eager"; img.decoding="async"; }
});

let heroV2Token=0;
let heroV2Timer=null;

function hvWait(ms,token){
  return new Promise(resolve=>heroV2Timer=setTimeout(()=>resolve(token===heroV2Token),ms));
}

function heroV2Reset(){
  heroV2Token++;
  clearTimeout(heroV2Timer);
  document.querySelector(".hero-v2-stage")?.remove();
  liveCards().forEach(c=>{
    c.classList.remove("hero-v2-source");
    c.style.removeProperty("visibility");
    c.style.removeProperty("pointer-events");
  });
  heroBusy=false;
  heroRailWrap?.classList.remove("hero-v2-playing");
  applyHeroLayout({animate:true});
}

function heroV2Build(index){
  const source=liveCards().find(c=>c.classList.contains("active"));
  const d=heroV2Data[index];
  if(!source||!d||innerWidth<=1100)return null;

  const wrap=heroRailWrap.getBoundingClientRect();
  const cr=source.getBoundingClientRect();
  const stage=document.createElement("div");
  stage.className="hero-v2-stage";
  stage.dataset.phase="card";
  stage.style.setProperty("--hy",(cr.top-wrap.top+cr.height/2)+"px");

  const checklist=d.build.map((x,n)=>
    '<span style="--n:'+n+'"><i></i><b>'+x[0]+'</b><em>'+x[1]+'</em></span>'
  ).join("");
  const thumbs=d.build.map((x,n)=>
    '<i style="--n:'+n+'"><img src="'+d.art+'" alt=""><b>'+x[0]+'</b><em>'+x[1]+'</em></i>'
  ).join("");

  stage.innerHTML=
    '<div class="hv2-exact-scene">'+
      '<div class="hv2-main-card"><div class="hv2-main-photo"><img src="'+d.art+'" alt=""></div><div class="hv2-main-copy"><small>'+d.eyebrow+'</small><b>'+d.title+'</b><span>Ideas into outcomes.</span></div></div>'+
      '<div class="hv2-building"><span class="spinner"></span><b>Building…</b></div>'+
      '<div class="hv2-build-copy">'+checklist+'</div>'+
      '<div class="hv2-pin-grid">'+thumbs+'</div>'+
      '<div class="hv2-result-card"><div class="hv2-result-photo"><img src="'+d.art+'" alt=""></div><div class="hv2-result-copy"><small>'+d.eyebrow+'</small><b>'+d.resultTitle+'</b><span>'+d.resultSub+'</span></div></div>'+
      '<div class="hv2-impact"><small>'+d.value+'</small><svg class="hv2-impact-chart" viewBox="0 0 100 40" aria-hidden="true"><path class="hv2-impact-grid" d="M0 34H100 M0 20H100 M0 6H100"/><path class="hv2-impact-line" d="M2 32 C15 28 20 25 29 27 S44 19 53 20 S69 10 77 13 S91 6 98 3"/></svg><b>'+d.metric+'</b></div>'+
    '</div>';

  source.classList.add("hero-v2-source");
  source.style.setProperty("visibility","hidden","important");
  source.style.setProperty("pointer-events","none","important");
  heroBusy=true;
  heroRailWrap.classList.add("hero-v2-playing");
  applyHeroLayout({animate:true});
  heroRailWrap.appendChild(stage);
  return {stage,source,d};
}

async function heroV2Play(index,{sequence=false}={}){
  clearHeroSequence();
  heroV2Reset();

  // reset() restores idle state; immediately enter story state once, without a second navigation.
  heroBusy=true;
  applyHeroLayout({animate:true});
  const built=heroV2Build(index);
  if(!built){ heroBusy=false; return; }

  const {stage,source,d}=built;
  const token=++heroV2Token;

  stage.dataset.phase="card";
  if(!await hvWait(760,token))return;

  stage.dataset.phase="building";
  if(!await hvWait(900,token))return;

  stage.dataset.phase="build";
  if(!await hvWait(3200,token))return;

  stage.dataset.phase="collapse";
  if(!await hvWait(820,token))return;

  stage.dataset.phase="resultSeed";
  if(!await hvWait(680,token))return;

  stage.dataset.phase="resultGrow";
  if(!await hvWait(1150,token))return;

  stage.dataset.phase="impact";
  const line=stage.querySelector(".hv2-impact-line");
  const number=stage.querySelector(".hv2-impact b");

  if(line){
    line.style.strokeDasharray="160";
    line.style.strokeDashoffset="160";
    requestAnimationFrame(()=>line.style.strokeDashoffset="0");
  }

  if(number){
    const raw=d.metric;
    const numeric=parseFloat(raw.replace(/[^0-9.]/g,""));
    const prefix=raw.startsWith("+")?"+":"";
    const suffix=raw.includes("%")?"%":(raw.includes("×")?"×":"");
    const t0=performance.now();
    const count=now=>{
      if(token!==heroV2Token||!number.isConnected)return;
      const p=Math.min(1,(now-t0)/1350);
      const eased=1-Math.pow(1-p,3);
      const value=numeric*eased;
      number.textContent=prefix+(numeric%1?value.toFixed(1):Math.round(value))+suffix;
      if(p<1)requestAnimationFrame(count);
    };
    requestAnimationFrame(count);
  }

  if(!await hvWait(1900,token))return;
  stage.dataset.phase="final";
  if(!await hvWait(1200,token))return;

  source.style.removeProperty("visibility");
  source.style.removeProperty("pointer-events");
  source.classList.remove("hero-v2-source");
  stage.classList.add("final-handoff");
  heroBusy=false;
  heroRailWrap.classList.remove("hero-v2-playing");
  applyHeroLayout({animate:true});

  heroSequenceTimer=setTimeout(()=>{
    if(token!==heroV2Token)return;
    stage.remove();

    if(sequence){
      activeVirtual+=1;
      activeIndex=((activeVirtual%baseCount)+baseCount)%baseCount;
      updateFeatureStack(activeIndex);
      applyHeroLayout({animate:true});
      heroSequenceTimer=setTimeout(()=>{
        normalizeHeroRail();
        if(token===heroV2Token)heroV2Play(activeIndex,{sequence:true});
      },2100);
    }
  },520);
}

document.addEventListener("visibilitychange",()=>{
  if(document.hidden) stopHeroAutoplay();
  else startHeroAutoplay();
});
heroRailWrap?.addEventListener("mouseenter",()=>stopHeroAutoplay());
heroRailWrap?.addEventListener("mouseleave",()=>{ if(!heroBusy) startHeroAutoplay(); });
