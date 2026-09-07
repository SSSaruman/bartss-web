const menuTrigger = document.getElementById("menuTrigger");
const menuPanel = document.getElementById("menuPanel");
const menuClose = document.getElementById("menuClose");
const cards = [...document.querySelectorAll(".show-card")];
const rail = document.getElementById("cardRail");
const railWrap = rail?.parentElement;
const featureButtons = [...document.querySelectorAll(".feature-stack button")];
const siteTop = document.querySelector(".site-top");

let activeIndex = 2;
let loopCards = [];
let railX = 0;
let loopSpan = 0;
let dragActive = false;
let dragMoved = false;
let dragStartX = 0;
let lastPointerX = 0;
let lastPointerT = 0;
let velocityX = 0;
let inertiaRaf = 0;
let settleTimer = 0;

function applyRailX(x, animate=false){
  railX = x;
  if(!rail) return;
  rail.classList.toggle("rail-animate", animate);
  rail.style.transform = `translate3d(${railX}px,0,0)`;
}

function cleanClone(card, setName){
  const clone = card.cloneNode(true);
  clone.removeAttribute("id");
  clone.dataset.clone = "1";
  clone.dataset.loopSet = setName;
  clone.classList.remove("active","activating");
  clone.querySelectorAll("[id]").forEach(el=>el.removeAttribute("id"));
  return clone;
}

function rebuildHeroLoop(){
  if(!rail) return;
  cancelAnimationFrame(inertiaRaf);
  clearTimeout(settleTimer);
  rail.querySelectorAll('[data-clone="1"]').forEach(el=>el.remove());
  cards.forEach(card=>card.dataset.loopSet="middle");

  if(window.innerWidth <= 1100){
    loopCards=[...cards];
    rail.classList.remove("loop-ready","is-dragging","rail-animate");
    rail.style.transform="";
    railX=0; loopSpan=0;
    cards.forEach((card,i)=>card.classList.toggle("active",i===activeIndex));
    return;
  }

  const before=document.createDocumentFragment();
  const after=document.createDocumentFragment();
  cards.forEach(card=>before.appendChild(cleanClone(card,"before")));
  cards.forEach(card=>after.appendChild(cleanClone(card,"after")));
  rail.insertBefore(before,rail.firstChild);
  rail.appendChild(after);
  loopCards=[...rail.querySelectorAll(".show-card")];

  requestAnimationFrame(()=>{
    const middleFirst=rail.querySelector('[data-loop-set="middle"][data-index="0"]');
    const afterFirst=rail.querySelector('[data-loop-set="after"][data-index="0"]');
    loopSpan=(afterFirst?.offsetLeft||0)-(middleFirst?.offsetLeft||0);
    centerLogical(activeIndex,false);
    rail.classList.add("loop-ready","ready");
  });
}

function targetXFor(card){
  if(!card || !railWrap) return railX;
  const wrapLeft=railWrap.getBoundingClientRect().left;
  return window.innerWidth/2 - (wrapLeft + card.offsetLeft + card.offsetWidth/2);
}

function visibleCardForLogical(index){
  const candidates=loopCards.filter(card=>Number(card.dataset.index)===index);
  if(!candidates.length) return cards[index];
  const center=window.innerWidth/2;
  return candidates.reduce((best,card)=>{
    const r=card.getBoundingClientRect();
    const d=Math.abs((r.left+r.width/2)-center);
    return !best || d<best.d ? {card,d} : best;
  },null)?.card;
}

function markActive(card,index,pulse=false){
  activeIndex=((index%cards.length)+cards.length)%cards.length;
  loopCards.forEach(el=>el.classList.remove("active","activating"));
  if(card){
    card.classList.add("active");
    if(pulse){
      card.classList.remove("activating");
      void card.offsetWidth;
      card.classList.add("activating");
      setTimeout(()=>card.classList.remove("activating"),720);
    }
  }
  updateFeatureStack(activeIndex);
}

function normalizeToMiddle(index){
  if(window.innerWidth<=1100 || !rail) return;
  const middle=rail.querySelector(`[data-loop-set="middle"][data-index="${index}"]`);
  if(!middle) return;
  rail.classList.remove("rail-animate");
  applyRailX(targetXFor(middle),false);
  markActive(middle,index,false);
}

function centerCard(card,animate=true,pulse=false){
  if(!card) return;
  const index=Number(card.dataset.index);
  markActive(card,index,pulse);
  applyRailX(targetXFor(card),animate);
  clearTimeout(settleTimer);
  settleTimer=setTimeout(()=>normalizeToMiddle(index),animate?760:0);
}

function centerLogical(index,animate=true,pulse=false){
  activeIndex=((index%cards.length)+cards.length)%cards.length;
  if(window.innerWidth<=1100){
    const card=cards[activeIndex];
    cards.forEach((el,i)=>el.classList.toggle("active",i===activeIndex));
    updateFeatureStack(activeIndex);
    if(animate) card?.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});
    return;
  }
  const target=visibleCardForLogical(activeIndex) || rail?.querySelector(`[data-loop-set="middle"][data-index="${activeIndex}"]`);
  centerCard(target,animate,pulse);
}

function wrapRailDuringFreeMove(){
  if(!loopSpan || window.innerWidth<=1100) return;
  const middleRef=rail.querySelector('[data-loop-set="middle"][data-index="2"]');
  if(!middleRef) return;
  const anchor=targetXFor(middleRef);
  if(railX < anchor-loopSpan*.58) railX += loopSpan;
  else if(railX > anchor+loopSpan*.58) railX -= loopSpan;
}

function snapNearest(pulse=false){
  if(window.innerWidth<=1100 || !loopCards.length) return;
  const center=window.innerWidth/2;
  let nearest=null, best=Infinity;
  loopCards.forEach(card=>{
    const r=card.getBoundingClientRect();
    const d=Math.abs((r.left+r.width/2)-center);
    if(d<best){best=d;nearest=card;}
  });
  centerCard(nearest,true,pulse);
}

function stopInertia(){
  if(inertiaRaf) cancelAnimationFrame(inertiaRaf);
  inertiaRaf=0;
}

function startInertia(){
  stopInertia();
  let prev=performance.now();
  const tick=(now)=>{
    const dt=Math.min(32,now-prev); prev=now;
    railX += velocityX*dt;
    velocityX *= Math.pow(.91,dt/16.67);
    wrapRailDuringFreeMove();
    applyRailX(railX,false);
    if(Math.abs(velocityX)>.018){
      inertiaRaf=requestAnimationFrame(tick);
    }else{
      inertiaRaf=0;
      snapNearest(false);
    }
  };
  inertiaRaf=requestAnimationFrame(tick);
}

rail?.addEventListener("pointerdown",e=>{
  if(window.innerWidth<=1100 || e.button!==0) return;
  stopInertia();
  clearTimeout(settleTimer);
  dragActive=true; dragMoved=false;
  dragStartX=e.clientX; lastPointerX=e.clientX; lastPointerT=performance.now(); velocityX=0;
  rail.classList.add("is-dragging");
  rail.classList.remove("rail-animate");
  rail.setPointerCapture?.(e.pointerId);
});

rail?.addEventListener("pointermove",e=>{
  if(!dragActive || window.innerWidth<=1100) return;
  const now=performance.now();
  const dx=e.clientX-lastPointerX;
  const dt=Math.max(1,now-lastPointerT);
  if(Math.abs(e.clientX-dragStartX)>6) dragMoved=true;
  railX+=dx;
  velocityX=dx/dt;
  lastPointerX=e.clientX; lastPointerT=now;
  wrapRailDuringFreeMove();
  applyRailX(railX,false);
  e.preventDefault();
});

function endRailDrag(e){
  if(!dragActive) return;
  dragActive=false;
  rail?.classList.remove("is-dragging");
  try{rail?.releasePointerCapture?.(e.pointerId);}catch(_){}
  if(dragMoved){
    if(Math.abs(velocityX)>.08) startInertia();
    else snapNearest(false);
  }
}
rail?.addEventListener("pointerup",endRailDrag);
rail?.addEventListener("pointercancel",endRailDrag);

rail?.addEventListener("click",e=>{
  const card=e.target.closest(".show-card");
  if(!card) return;
  if(dragMoved){
    e.preventDefault();
    e.stopPropagation();
    dragMoved=false;
    return;
  }
  if(window.innerWidth<=1100){
    centerLogical(Number(card.dataset.index),true,true);
    return;
  }
  stopInertia();
  centerCard(card,true,true);
});

function openMenu(){ document.body.classList.add("menu-open"); menuPanel.classList.add("open"); menuPanel.setAttribute("aria-hidden","false"); menuTrigger.setAttribute("aria-expanded","true"); }
function closeMenu(){ document.body.classList.remove("menu-open"); menuPanel.classList.remove("open"); menuPanel.setAttribute("aria-hidden","true"); menuTrigger.setAttribute("aria-expanded","false"); }
menuTrigger.addEventListener("click", openMenu); menuClose.addEventListener("click", closeMenu);
document.addEventListener("keydown", e => e.key === "Escape" && closeMenu());
document.addEventListener("pointerdown", e => { if(!document.body.classList.contains("menu-open")) return; if(menuPanel.contains(e.target) || menuTrigger.contains(e.target)) return; closeMenu(); });
menuPanel.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));

function updateStickyMenu(){
  siteTop?.classList.toggle("is-scrolled",window.scrollY>42);
}
window.addEventListener("scroll",updateStickyMenu,{passive:true});
updateStickyMenu();

const featureSets = [
  ["POSITIONING CLARITY","SYSTEM, NOT ASSETS","BUILT TO EXTEND"],
  ["CLEARER USER JOURNEY","MOTION WITH PURPOSE","LEAD & CONVERSION LOGIC"],
  ["FASTER PRODUCTION","CONSISTENCY CONTROL","HUMAN QC"],
  ["STRONGER ATTENTION","COMPLEXITY MADE CLEAR","CAMPAIGN-READY OUTPUT"],
  ["CUSTOM BUSINESS LOGIC","CONNECTED WORKFLOWS","TOOLS YOUR TEAM CAN USE"]
];
function updateFeatureStack(index){
  const items = featureSets[index] || featureSets[0];
  featureButtons.forEach((btn,i)=>{
    const label = btn.querySelector("span");
    if(label) label.textContent = window.BARTSSI18N?.translate(items[i] || "") ?? (items[i] || "");
    btn.style.top = `${i*42}px`;
    btn.style.width = `${220 + i*42}px`;
    btn.style.opacity = `${.62 + i*.14}`;
  });
}

const io=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting) entry.target.classList.add("in-view")}),{threshold:.12});
document.querySelectorAll(".reveal").forEach(el=>io.observe(el));
let heroResizeTimer=0;
window.addEventListener("resize",()=>{
  clearTimeout(heroResizeTimer);
  heroResizeTimer=setTimeout(rebuildHeroLoop,120);
});
async function initHeroRail(){
  try{ if(document.fonts?.ready) await document.fonts.ready; }catch(e){}
  rebuildHeroLoop();
}
window.addEventListener("load",initHeroRail,{once:true});
requestAnimationFrame(()=>{ if(document.readyState==="complete") initHeroRail(); });

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
updateTabletExperience();

let scrollFrame = 0;
function scheduleScrollEffects(){
  if(scrollFrame) return;
  scrollFrame = requestAnimationFrame(()=>{
    scrollFrame = 0;
    updateImmersive();
    updateTabletExperience();
  });
}
window.addEventListener("scroll",scheduleScrollEffects,{passive:true});


// Project brief qualifier
const briefPanel = document.getElementById("briefPanel");
const briefOpen = document.getElementById("briefOpen");
const briefClose = document.getElementById("briefClose");
const briefBackdrop = document.getElementById("briefBackdrop");
const briefForm = document.getElementById("briefForm");
function openBrief(){
  if(!briefPanel) return;
  briefPanel.classList.add("open");
  briefPanel.setAttribute("aria-hidden","false");
  document.body.classList.add("brief-open");
}
function closeBrief(){
  if(!briefPanel) return;
  briefPanel.classList.remove("open");
  briefPanel.setAttribute("aria-hidden","true");
  document.body.classList.remove("brief-open");
}
briefOpen?.addEventListener("click",openBrief);
briefClose?.addEventListener("click",closeBrief);
briefBackdrop?.addEventListener("click",closeBrief);
document.addEventListener("keydown",e=>{ if(e.key==="Escape" && briefPanel?.classList.contains("open")) closeBrief(); });
briefForm?.addEventListener("submit",async e=>{
  e.preventDefault();
  const submit = document.getElementById("briefSubmit");
  const errorBox = document.getElementById("briefError");
  const data = Object.fromEntries(new FormData(briefForm).entries());
  data.action = "create";
  data.consent = data.consent === "1";
  if(errorBox){ errorBox.hidden = true; errorBox.textContent = ""; }
  if(submit){ submit.disabled = true; submit.dataset.label = submit.innerHTML; submit.innerHTML = "Creating lead…"; }
  try{
    const res = await fetch("./api/leads.php",{
      method:"POST",
      headers:{"Content-Type":"application/json","Accept":"application/json"},
      body:JSON.stringify(data)
    });
    const payload = await res.json().catch(()=>({ok:false,error:"invalid_response"}));
    if(!res.ok || !payload.ok) throw new Error(payload.error || "lead_create_failed");
    const stored = {...data, lead_id:payload.leadId, update_token:payload.updateToken};
    delete stored.company_fax;
    sessionStorage.setItem("bartssProjectBrief",JSON.stringify(stored));
    window.location.href="./offers.html";
  }catch(err){
    const msg = err?.message === "rate_limited"
      ? "Too many attempts. Please wait a few minutes and try again."
      : "Your project could not be saved. Please check the form and try again.";
    if(errorBox){ errorBox.textContent = msg; errorBox.hidden = false; }
    if(submit){ submit.disabled = false; submit.innerHTML = submit.dataset.label || "Create project lead →"; }
  }
});


// Keep mobile hero state aligned with the card nearest the viewport center.
let railScrollFrame = 0;
rail?.addEventListener("scroll",()=>{
  if(window.innerWidth > 1100 || railScrollFrame) return;
  railScrollFrame = requestAnimationFrame(()=>{
    railScrollFrame = 0;
    const center = window.innerWidth / 2;
    let nearest = 0, best = Infinity;
    cards.forEach((card,i)=>{
      const r = card.getBoundingClientRect();
      const d = Math.abs((r.left + r.width/2) - center);
      if(d < best){ best = d; nearest = i; }
    });
    if(nearest !== activeIndex){
      activeIndex = nearest;
      cards.forEach((card,i)=>card.classList.toggle("active",i===activeIndex));
      updateFeatureStack(activeIndex);
    }
  });
},{passive:true});

window.addEventListener("bartss:lang",()=>updateFeatureStack(activeIndex));


// --- Art direction motion pass: reveal + lightweight parallax ---
const motionItems = [
  ...document.querySelectorAll(".package-card"),
  ...document.querySelectorAll(".case-card"),
  ...document.querySelectorAll(".process-grid article"),
  ...document.querySelectorAll(".system-card"),
  ...document.querySelectorAll(".fit-card")
];
motionItems.forEach(el=>el.classList.add("motion-item"));
const motionObserver = new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add("motion-in");
      motionObserver.unobserve(entry.target);
    }
  });
},{threshold:.12,rootMargin:"0px 0px -5% 0px"});
motionItems.forEach(el=>motionObserver.observe(el));

const parallaxTargets = [
  ...document.querySelectorAll(".case-art"),
  ...document.querySelectorAll(".system-visual")
];
let artMotionFrame=0;
function updateArtMotion(){
  artMotionFrame=0;
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const vh=innerHeight;
  parallaxTargets.forEach((el,i)=>{
    const r=el.getBoundingClientRect();
    if(r.bottom<0 || r.top>vh) return;
    const progress=((r.top+r.height/2)-vh/2)/vh;
    const amp=i<3?18:10;
    el.style.setProperty("--parallax-y",`${(-progress*amp).toFixed(2)}px`);
  });
}
window.addEventListener("scroll",()=>{
  if(artMotionFrame) return;
  artMotionFrame=requestAnimationFrame(updateArtMotion);
},{passive:true});
window.addEventListener("resize",updateArtMotion,{passive:true});
updateArtMotion();
