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
    const card = cards[activeIndex], cardCenter = card.offsetLeft + card.offsetWidth/2, viewportCenter = window.innerWidth/2;
    const matrix = getComputedStyle(rail).transform, currentX = matrix === "none" ? 0 : new DOMMatrixReadOnly(matrix).m41;
    const base = rail.getBoundingClientRect().left - currentX;
    rail.style.transform = `translateX(${viewportCenter - (base + cardCenter)}px)`;
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

// --- Hero cinematic card choreography inspired by the supplied reference ---
const demoContent = [
  {title:"Brand system", kicker:"BARTSS / BRAND", icon:"B", desc:"Strategy → identity → motion", detail:"A coherent brand system ready to scale.", pills:["Positioning","Identity","Motion","Launch"]},
  {title:"Live product experience", kicker:"BARTSS / WEB", icon:"▱", desc:"UX → interface → conversion", detail:"A product that explains itself while people use it.", pills:["UX flow","UI system","Motion","Conversion"]},
  {title:"Idea → approved asset", kicker:"AUTOLAB / AI", icon:"✦", desc:"Story → visual → QC", detail:"Storyboard, prompts, generation and consistency in one flow.", pills:["Storyboard","Prompts","QC","Consistency"]},
  {title:"Motion system", kicker:"BARTSS / MOTION", icon:"◯", desc:"Story → movement → attention", detail:"Motion built as part of the brand, not decoration.", pills:["Film","3D","UI motion","Social"]},
  {title:"Signals → decisions", kicker:"AIFINANCE / AI", icon:"↗", desc:"Context → signal → action", detail:"Financial context turned into a clearer next move.", pills:["Cash flow","Signals","Portfolio","Actions"]}
];

function makeHeroDemo(card,index){
  card.querySelector(".hero-demo")?.remove();
  const d=demoContent[index] || demoContent[0];
  const demo=document.createElement("div");
  demo.className="hero-demo stage-cluster";
  demo.innerHTML=`
    <div class="demo-cluster">
      <i class="demo-tile"></i><i class="demo-tile"></i><i class="demo-tile"></i>
      <i class="demo-tile"></i><i class="demo-tile"></i><i class="demo-tile"></i>
    </div>
    <div class="demo-main">
      <div class="demo-main-inner"><small>${d.kicker}</small><div class="demo-main-icon">${d.icon}</div><b>${d.title}</b><em>${d.desc}</em></div>
    </div>
    <div class="demo-pills">${d.pills.map(x=>`<span class="demo-pill"><i></i>${x}</span>`).join("")}</div>
    <div class="demo-detail"><span>WHY IT MATTERS</span><b>${d.detail}</b><i></i></div>
    <div class="demo-status">BUILDING THE SYSTEM...</div>`;
  card.querySelector(".visual").appendChild(demo);
  card.classList.add("demo-playing");
  return demo;
}

let demoTimer=null, demoStageTimer=null, demoRunId=0;
const stages=["stage-cluster","stage-main","stage-features","stage-detail","stage-out"];
function runHeroDemo(index=activeIndex){
  clearTimeout(demoTimer); clearTimeout(demoStageTimer);
  const runId=++demoRunId;
  document.querySelectorAll(".hero-demo").forEach(x=>x.remove());
  cards.forEach(x=>x.classList.remove("demo-playing"));
  const card=cards[index]; if(!card || !card.classList.contains("active")) return;
  const demo=makeHeroDemo(card,index);
  let stage=0;
  const advance=()=>{
    if(runId!==demoRunId || !demo.isConnected) return;
    demo.className="hero-demo "+stages[stage];
    if(stage===1) playUiSound("whoosh");
    if(stage===2) playUiSound("pop");
    if(stage===3) playUiSound("glass");
    stage++;
    if(stage<stages.length){ demoStageTimer=setTimeout(advance, stage===1?1150:stage===2?1350:stage===3?1500:1350); }
    else { demoTimer=setTimeout(()=>runHeroDemo(activeIndex),900); }
  };
  advance();
}

// sound layer (browser requires user gesture; user can enable explicitly)
let audioCtx=null, soundEnabled=false;
const soundBtn=document.createElement("button");
soundBtn.className="sound-control"; soundBtn.textContent="SOUND OFF";
document.body.appendChild(soundBtn);
function ensureAudio(){ if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)(); if(audioCtx.state==="suspended") audioCtx.resume(); }
function tone(freq,duration=.06,gain=.035,type="sine",when=0){
  if(!soundEnabled) return; ensureAudio();
  const o=audioCtx.createOscillator(), g=audioCtx.createGain();
  o.type=type;o.frequency.setValueAtTime(freq,audioCtx.currentTime+when);
  g.gain.setValueAtTime(0.0001,audioCtx.currentTime+when);
  g.gain.exponentialRampToValueAtTime(gain,audioCtx.currentTime+when+.008);
  g.gain.exponentialRampToValueAtTime(0.0001,audioCtx.currentTime+when+duration);
  o.connect(g);g.connect(audioCtx.destination);o.start(audioCtx.currentTime+when);o.stop(audioCtx.currentTime+when+duration+.02);
}
function playUiSound(kind){
  if(!soundEnabled) return;
  if(kind==="click"){tone(520,.045,.026,"triangle");tone(760,.04,.016,"sine",.025)}
  if(kind==="pop"){tone(330,.08,.025,"sine");tone(660,.07,.018,"triangle",.025)}
  if(kind==="glass"){tone(980,.09,.016,"sine");tone(1450,.12,.01,"sine",.03)}
  if(kind==="whoosh"){tone(180,.16,.018,"sawtooth");tone(280,.14,.012,"sine",.05)}
}
soundBtn.addEventListener("click",()=>{
  soundEnabled=!soundEnabled; ensureAudio(); soundBtn.classList.toggle("on",soundEnabled); soundBtn.textContent=soundEnabled?"SOUND ON":"SOUND OFF"; if(soundEnabled) playUiSound("pop");
});
document.addEventListener("click",e=>{ if(soundEnabled && e.target.closest("button,a,.show-card")) playUiSound("click"); },true);

// restart cinematic demo whenever active hero card changes
const originalSetActive=setActive;
setActive=function(index){
  originalSetActive(index);
  setTimeout(()=>runHeroDemo(activeIndex),120);
};
requestAnimationFrame(()=>runHeroDemo(activeIndex));
