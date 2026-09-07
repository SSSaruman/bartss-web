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
function getRailX(){
  const m=getComputedStyle(rail).transform;
  return m==="none"?0:new DOMMatrixReadOnly(m).m41;
}
function centerActiveCard(immediate=false){
  if(window.innerWidth<=1100)return;
  const card=cards[activeIndex];
  const before=rail.style.transition;
  if(immediate) rail.style.transition="none";
  const correct=()=>{
    const rect=card.getBoundingClientRect();
    const delta=(window.innerWidth/2)-(rect.left+rect.width/2);
    railX=getRailX()+delta;
    rail.style.transform=`translate3d(${railX}px,0,0)`;
  };
  correct();
  if(immediate){
    rail.offsetHeight;
    rail.style.transition=before;
    requestAnimationFrame(correct);
  }else{
    setTimeout(correct,1080);
  }
}
function setActive(index,immediate=false){
  activeIndex = Math.max(0, Math.min(cards.length - 1, index));
  cards.forEach((card,i)=>card.classList.toggle("active", i===activeIndex));
  requestAnimationFrame(()=>centerActiveCard(immediate));
}
cards.forEach((card,i)=>card.addEventListener("click",()=>setActive(i)));
let wheelLock = false;
window.addEventListener("wheel", e => {
  if(window.innerWidth <= 1100 || document.body.classList.contains("menu-open")) return;
  const rect = rail.getBoundingClientRect(); if(rect.bottom < 0 || rect.top > window.innerHeight || Math.abs(e.deltaY)<18 || wheelLock) return;
  wheelLock=true; setActive(activeIndex + (e.deltaY>0?1:-1)); setTimeout(()=>wheelLock=false,650);
},{passive:true});

// Drag / swipe rail — reference-style tactile inertia.
const heroRailWrap=document.querySelector(".rail-wrap");
let railDragging=false,dragStartX=0,dragStartRailX=0,lastDragX=0,lastDragT=0,railVelocity=0,railInertia=0;
function nearestCardToCenter(){
  let best=activeIndex,bestDist=Infinity;
  cards.forEach((card,i)=>{
    const r=card.getBoundingClientRect();
    const d=Math.abs((r.left+r.width/2)-window.innerWidth/2);
    if(d<bestDist){bestDist=d;best=i;}
  });
  return best;
}
function stopRailInertia(){ if(railInertia) cancelAnimationFrame(railInertia); railInertia=0; }
function clampRailX(x){
  if(window.innerWidth<=1100)return x;
  const wrap=document.querySelector(".rail-wrap").getBoundingClientRect();
  const first=cards[0],last=cards[cards.length-1];
  const min=window.innerWidth/2-wrap.left-(last.offsetLeft+last.offsetWidth/2);
  const max=window.innerWidth/2-wrap.left-(first.offsetLeft+first.offsetWidth/2);
  return Math.max(min-120,Math.min(max+120,x));
}
if(heroRailWrap){
  heroRailWrap.addEventListener("pointerdown",e=>{
    if(window.innerWidth<=1100 || e.button!==0)return;
    stopRailInertia();
    heroV2Reset(true);
    railDragging=true;
    dragStartX=lastDragX=e.clientX;
    lastDragT=performance.now();
    dragStartRailX=getRailX(); railX=dragStartRailX; railVelocity=0;
    heroRailWrap.classList.add("is-dragging");
    rail.style.transition="none";
    heroRailWrap.setPointerCapture(e.pointerId);
  });
  heroRailWrap.addEventListener("pointermove",e=>{
    if(!railDragging)return;
    const now=performance.now(),dt=Math.max(8,now-lastDragT);
    const dx=e.clientX-dragStartX;
    railX=clampRailX(dragStartRailX+dx);
    rail.style.transform=`translate3d(${railX}px,0,0)`;
    const instant=(e.clientX-lastDragX)/dt*16.67;
    railVelocity=railVelocity*.62+instant*.38;
    lastDragX=e.clientX;lastDragT=now;
  });
  const finishDrag=e=>{
    if(!railDragging)return;
    railDragging=false;
    heroRailWrap.classList.remove("is-dragging");
    try{heroRailWrap.releasePointerCapture(e.pointerId)}catch{}
    let v=Math.max(-42,Math.min(42,railVelocity*1.28));
    const glide=()=>{
      v*=.935;
      railX=clampRailX(railX+v);
      rail.style.transform=`translate3d(${railX}px,0,0)`;
      if(Math.abs(v)>.38){
        railInertia=requestAnimationFrame(glide);
      }else{
        railInertia=0;
        rail.style.transition="";
        const idx=nearestCardToCenter();
        setActive(idx);
        setTimeout(()=>{
          if(heroRailWrap.matches(":hover")&&!railDragging) heroV2Play(idx);
        },520);
      }
    };
    railInertia=requestAnimationFrame(glide);
  };
  heroRailWrap.addEventListener("pointerup",finishDrag);
  heroRailWrap.addEventListener("pointercancel",finishDrag);
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


// HERO V2: frame-timed motion engine rebuilt from the supplied 43.93s reference.
// Reference cadence used: 1.7s collapse, 2.4s bar, 3.0s status pill,
// 3.4–4.5s skeleton/assets grid, 4.8–6.2s small card -> normal card,
// 6.3–7.8s pills, 8.0–10.2s metric, then final hold.
const heroV2Data=[
 {title:"Brand Identity",eyebrow:"BARTSS / BRAND",art:"https://www.creativeboom.com/upload/articles/fe/fea31cd3d79ab166330e81690b54a00a3c9dc995_944.jpg",desc:"Identity built to be remembered.",a:"#b9d8e8",b:"#718b9a",pills:["Positioning","Identity system","Launch","Consistency"],metric:"92",metricLabel:"Recognition score"},
 {title:"Web & Product",eyebrow:"BARTSS / WEB",art:"https://cdn.mockupnest.com/wp-content/uploads/edd/2024/02/02-Dark-Macbook-Pro-Mockup.jpg",desc:"Digital products with real impact.",a:"#b8d5e6",b:"#708d9f",pills:["UX flow","Interface","Motion","Conversion"],metric:"38",metricLabel:"Friction removed"},
 {title:"AutoLAB",eyebrow:"AUTOLAB / AI",art:"https://cdn.dribbble.com/userupload/47183298/file/f3c6aca11ceb80a0534a5ed615f9ad1a.png",desc:"Idea to approved visual.",a:"#b7d54e",b:"#708649",pills:["Character Lock","Style Lock","Prompt Engine","QC passed"],metric:"94",metricLabel:"QC pass rate"},
 {title:"Motion & 3D",eyebrow:"BARTSS / MOTION",art:"https://images.unsplash.com/photo-1777646346045-df4bd1114148?auto=format&fit=crop&fm=jpg&q=80&w=1200",desc:"Movement with depth and intent.",a:"#bdd9e8",b:"#718d9f",pills:["Story","3D","UI motion","Delivery"],metric:"24",metricLabel:"Format variants"},
 {title:"AiFinance",eyebrow:"AIFINANCE / AI",art:"https://pngmagic.com/webp_images/stock-market-data-background-for-posters_T1Q4.webp",desc:"Context into a next move.",a:"#dce879",b:"#70884e",pills:["Context","Signals","Risk","Action"],metric:"650",metricLabel:"Qualified signal"}
];

const heroStaticArts=heroV2Data.map(x=>x.art);
cards.forEach((card,i)=>{
  const img=card.querySelector(".hero-card-art");
  if(img){ img.src=heroStaticArts[i]; img.loading="eager"; img.decoding="async"; }
});

let heroV2Token=0,heroV2Timer=null,heroV2Running=false;
const wait=(ms,token)=>new Promise(resolve=>{
  heroV2Timer=setTimeout(()=>{ if(token===heroV2Token) resolve(true); else resolve(false); },ms);
});
function heroV2Reset(animate=true){
  heroV2Token++;
  clearTimeout(heroV2Timer);
  heroV2Running=false;
  const stage=document.querySelector(".hero-v2-stage");
  cards.forEach(c=>c.classList.remove("hero-v2-source"));
  if(!stage)return;
  if(animate){
    stage.classList.add("resetting");
    stage.dataset.phase="reset";
    setTimeout(()=>stage.remove(),520);
  }else stage.remove();
}
function heroV2Build(index){
  heroV2Reset(false);
  if(innerWidth<=1100)return null;
  const wrap=document.querySelector(".rail-wrap"),card=cards[index],d=heroV2Data[index];
  if(!wrap||!card||!d)return null;
  const wr=wrap.getBoundingClientRect(),cr=card.getBoundingClientRect();
  const stage=document.createElement("div");
  stage.className="hero-v2-stage";
  stage.dataset.phase="idle";
  stage.style.setProperty("--hy",(cr.top-wr.top+cr.height/2)+"px");
  stage.style.setProperty("--ha",d.a); stage.style.setProperty("--hb",d.b);
  stage.innerHTML=`
    <div class="hv2-ref-scene">
      <div class="hv2-card">
        <div class="hv2-photo"><img src="${d.art}" alt="" aria-hidden="true"></div>
        <div class="hv2-card-top"><span>${String(index+1).padStart(2,"0")}</span><em>BARTSS LAB</em></div>
        <div class="hv2-card-copy"><small>${d.eyebrow}</small><b>${d.title}</b><i>${d.desc}</i></div>
      </div>
      <div class="hv2-prompt"><span>✦</span><b>Build ${d.title}</b><i>→</i></div>
      <div class="hv2-status">● Building…</div>
      <div class="hv2-assets">${Array.from({length:8},(_,n)=>`<i style="--n:${n}"><span></span></i>`).join("")}</div>
      <div class="hv2-pills">${d.pills.map((p,n)=>`<span style="--n:${n}"><i></i>${p}</span>`).join("")}</div>
      <div class="hv2-metric"><small>${d.metricLabel}</small><div class="hv2-chart"></div><b data-value="${d.metric}">0</b></div>
    </div>`;
  wrap.appendChild(stage);
  card.classList.add("hero-v2-source");
  return stage;
}
function countMetric(el,target,token,duration=1150){
  const start=performance.now(),num=Number(target)||0;
  const tick=now=>{
    if(token!==heroV2Token||!el.isConnected)return;
    const p=Math.min(1,(now-start)/duration);
    const eased=1-Math.pow(1-p,3);
    el.textContent=Math.round(num*eased);
    if(p<1)requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
async function heroV2Play(index=activeIndex){
  if(innerWidth<=1100||railDragging)return;
  const token=++heroV2Token;
  heroV2Running=true;
  const stage=heroV2Build(index); if(!stage)return;
  // build() increments reset token, so take ownership after build.
  const runToken=++heroV2Token;
  stage.dataset.phase="idle";
  if(!await wait(420,runToken))return;

  stage.dataset.phase="collapse";              // ref ~1.7–2.4
  if(!await wait(760,runToken))return;
  stage.dataset.phase="prompt";                // ref ~2.4–3.0
  if(!await wait(620,runToken))return;
  stage.dataset.phase="status";                // ref ~3.0–3.4
  if(!await wait(430,runToken))return;
  stage.dataset.phase="skeleton";              // ref ~3.4–4.1
  if(!await wait(720,runToken))return;
  stage.dataset.phase="assets";                // ref ~4.1–4.8
  if(!await wait(760,runToken))return;
  stage.dataset.phase="seed";                  // ref ~4.8–5.3
  if(!await wait(560,runToken))return;
  stage.dataset.phase="grow";                  // ref ~5.3–6.3
  if(!await wait(1000,runToken))return;
  stage.dataset.phase="pills";                 // ref ~6.3–7.9
  if(!await wait(1500,runToken))return;
  stage.dataset.phase="metric";                // ref ~8.0–10.2
  countMetric(stage.querySelector(".hv2-metric b"),heroV2Data[index].metric,runToken,1250);
  if(!await wait(1750,runToken))return;
  stage.dataset.phase="final";
  stage.dataset.complete="true";
  heroV2Running=false;                         // stays fixed, no loop
}
if(heroRailWrap){
  heroRailWrap.addEventListener("mouseenter",()=>{
    if(innerWidth<=1100||railDragging)return;
    const existing=document.querySelector(".hero-v2-stage");
    if(existing?.dataset.complete==="true")return;
    if(!heroV2Running) setTimeout(()=>{if(heroRailWrap.matches(":hover")&&!railDragging)heroV2Play(activeIndex)},180);
  });
}
requestAnimationFrame(()=>setActive(activeIndex,true));
window.addEventListener("load",()=>setActive(activeIndex,true));
if(document.fonts?.ready)document.fonts.ready.then(()=>setActive(activeIndex,true));
