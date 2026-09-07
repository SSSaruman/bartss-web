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
function setActive(index){
  activeIndex = Math.max(0, Math.min(cards.length - 1, index));
  cards.forEach((card,i)=>card.classList.toggle("active", i===activeIndex));
  if(window.innerWidth > 1100){
    const card = cards[activeIndex];
    const wrap = document.querySelector(".rail-wrap");
    const wrapRect = wrap.getBoundingClientRect();
    const cardCenterInRail = card.offsetLeft + card.offsetWidth/2;
    const viewportCenter = window.innerWidth/2;
    const exactX = viewportCenter - wrapRect.left - cardCenterInRail;
    rail.style.transform = `translate3d(${exactX}px,0,0)`;
  }
}
cards.forEach((card,i)=> card.addEventListener("click",()=>setActive(i)));
let wheelLock = false;
window.addEventListener("wheel", e => {
  if(window.innerWidth <= 1100 || document.body.classList.contains("menu-open")) return;
  const rect = rail.getBoundingClientRect(); if(rect.bottom < 0 || rect.top > window.innerHeight || Math.abs(e.deltaY)<18 || wheelLock) return;
  wheelLock=true; setActive(activeIndex + (e.deltaY>0?1:-1)); setTimeout(()=>wheelLock=false,650);
},{passive:true});

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


// HERO V2: isolated motion prototype based on the supplied 43.9s Hightouch reference.
// All animation is contained inside .rail-wrap; lower-page code is untouched.
const heroV2Data=[
 {title:"Brand Identity",eyebrow:"BARTSS / BRAND",icon:"B",desc:"One identity. Many touchpoints.",a:"#bdd8e9",b:"#8ca7b6",grid:"Building…",pills:["Positioning","Identity","Motion","Launch"],search:"Searching brand assets…",metric:"92",metricLabel:"Brand consistency",strip:"Channel-ready identity"},
 {title:"Web & Product",eyebrow:"BARTSS / WEB",icon:"▱",desc:"A digital product that explains itself.",a:"#c7e0ef",b:"#87a8ba",grid:"Building…",pills:["Desktop","Mobile","Returning user","High intent"],search:"Searching product patterns…",metric:"38",metricLabel:"UX friction removed",strip:"Conversion-ready product"},
 {title:"AutoLAB",eyebrow:"AUTOLAB / AI",icon:"✦",desc:"From idea to approved visual.",a:"#b6d04f",b:"#74894e",grid:"Building…",pills:["Character Lock","Style Lock","Prompt Engine","QC passed"],search:"Searching visual references…",metric:"94",metricLabel:"QC pass rate",strip:"Production-ready system"},
 {title:"Motion & 3D",eyebrow:"BARTSS / MOTION",icon:"◯",desc:"One idea. Many motion outputs.",a:"#c2dcea",b:"#7895a7",grid:"Building…",pills:["Film","Social","UI motion","3D"],search:"Searching motion assets…",metric:"24",metricLabel:"Format variants",strip:"Motion distribution system"},
 {title:"AiFinance",eyebrow:"AIFINANCE / AI",icon:"↗",desc:"Turn context into a next move.",a:"#d9de91",b:"#7d8f59",grid:"Building…",pills:["Context","Signals","Risk","Action"],search:"Searching existing signals…",metric:"650",metricLabel:"Qualified signal",strip:"Channel strategy"}
];

let heroV2Timer=null,heroV2Token=0;
function heroV2Clear(){
  clearTimeout(heroV2Timer);
  document.querySelector(".hero-v2-stage")?.remove();
  cards.forEach(c=>c.classList.remove("hero-v2-source"));
}
function heroV2Build(index){
  heroV2Clear();
  if(innerWidth<=1100)return null;
  const wrap=document.querySelector(".rail-wrap"),card=cards[index];if(!wrap||!card)return null;
  const wr=wrap.getBoundingClientRect(),cr=card.getBoundingClientRect(),d=heroV2Data[index]||heroV2Data[0];
  const stage=document.createElement("div");stage.className="hero-v2-stage";stage.dataset.state="grid";
  const cx=(window.innerWidth/2)-wr.left,cy=cr.top-wr.top+cr.height/2;
  stage.style.setProperty("--hx",cx+"px");stage.style.setProperty("--hy",cy+"px");
  stage.style.setProperty("--hw",cr.width+"px");stage.style.setProperty("--hh",cr.height+"px");
  stage.style.setProperty("--ha",d.a);stage.style.setProperty("--hb",d.b);
  stage.innerHTML=`
    <div class="hero-v2-scene">
      <div class="hv2-grid" data-label="${d.grid}">${Array.from({length:9},()=>'<i class="hv2-cell"></i>').join("")}</div>
      <div class="hv2-main">
        <div class="hv2-top"><i>${String(index+1).padStart(2,"0")}</i><span>BARTSS LAB</span></div>
        <div class="hv2-object">${d.icon}</div>
        <div class="hv2-copy"><small>${d.eyebrow}</small><b>${d.title}</b><em>${d.desc}</em></div>
      </div>
      <div class="hv2-pills">${d.pills.map(x=>`<span class="hv2-pill"><i></i>${x}</span>`).join("")}</div>
      <div class="hv2-metric"><small>${d.metricLabel}</small><div class="hv2-metric-line"></div><b>${d.metric}</b></div>
      <div class="hv2-strip"><div class="hv2-strip-inner"><div class="hv2-strip-object">${d.icon}</div><b>${d.strip}</b><span>→ LIVE</span></div></div>
      <div class="hv2-search"><div class="hv2-search-title">${d.search}</div><div class="hv2-search-dots"><i></i><i></i><i></i><i></i><i></i></div><div class="hv2-search-assets">${Array.from({length:8},()=>'<i></i>').join("")}</div></div>
      <div class="hv2-formats"><div class="hv2-format f1"><b>${d.title}</b><small>wide banner</small></div><div class="hv2-format f2"><b>${d.title}</b><small>landscape</small></div><div class="hv2-format f3"><b>${d.title}</b><small>vertical</small></div><div class="hv2-format f4"><b>${d.title}</b><small>square</small></div><div class="hv2-format f5"><b>${d.icon}</b><small>tile</small></div></div>
    </div>`;
  wrap.appendChild(stage);card.classList.add("hero-v2-source");return stage;
}
const heroV2States=["grid","card","pills","metric","expand","strip","search","formats","pills","final"];
const heroV2Times=[1750,1850,1900,1750,1550,1450,2100,2200,1850,2600];
function heroV2Play(index=activeIndex){
  const token=++heroV2Token,stage=heroV2Build(index);if(!stage)return;
  let s=0;
  const advance=()=>{
    if(token!==heroV2Token||!stage.isConnected)return;
    stage.dataset.state=heroV2States[s++];
    if(s<heroV2States.length)heroV2Timer=setTimeout(advance,heroV2Times[s-1]);
    else heroV2Timer=setTimeout(()=>{if(token!==heroV2Token)return;heroV2Clear();heroV2Timer=setTimeout(()=>heroV2Play(activeIndex),650)},heroV2Times.at(-1));
  };
  advance();
}
const heroV2BaseSetActive=setActive;
setActive=function(index){
  heroV2Token++;heroV2Clear();heroV2BaseSetActive(index);
  setTimeout(()=>heroV2Play(activeIndex),220);
};
requestAnimationFrame(()=>heroV2Play(activeIndex));
