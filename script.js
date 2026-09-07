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
menuPanel.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));

let activeIndex = 2;
function setActive(index){
  activeIndex = Math.max(0, Math.min(cards.length - 1, index));
  cards.forEach((card,i)=>card.classList.toggle("active", i===activeIndex));
  updateFeatureStack(activeIndex);
  if(window.innerWidth > 1100){
    const card = cards[activeIndex], cardCenter = card.offsetLeft + card.offsetWidth/2, viewportCenter = window.innerWidth/2;
    const matrix = getComputedStyle(rail).transform, currentX = matrix === "none" ? 0 : new DOMMatrixReadOnly(matrix).m41;
    const base = rail.getBoundingClientRect().left - currentX;
    rail.style.transform = `translateX(${viewportCenter - (base + cardCenter)}px)`;
  }
}
cards.forEach((card,i)=> card.addEventListener("click",()=>{
  setActive(i);
  if(window.innerWidth <= 1100){
    card.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});
  }
}));
let wheelLock = false;
window.addEventListener("wheel", e => {
  if(window.innerWidth <= 1100 || document.body.classList.contains("menu-open")) return;
  const rect = rail.getBoundingClientRect(); if(rect.bottom < 0 || rect.top > window.innerHeight || Math.abs(e.deltaY)<18 || wheelLock) return;
  wheelLock=true; setActive(activeIndex + (e.deltaY>0?1:-1)); setTimeout(()=>wheelLock=false,650);
},{passive:true});

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
    if(label) label.textContent = items[i] || "";
    btn.style.top = `${i*42}px`;
    btn.style.width = `${220 + i*42}px`;
    btn.style.opacity = `${.62 + i*.14}`;
  });
}

const io=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting) entry.target.classList.add("in-view")}),{threshold:.12});
document.querySelectorAll(".reveal").forEach(el=>io.observe(el));
window.addEventListener("resize",()=>setActive(activeIndex));
async function initHeroRail(){
  try{ if(document.fonts?.ready) await document.fonts.ready; }catch(e){}
  setActive(2);
  requestAnimationFrame(()=>rail?.classList.add("ready"));
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
    }
  });
},{passive:true});
