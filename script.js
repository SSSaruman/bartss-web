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

// --- HERO SHOWCASE ENGINE: reference-led, product-specific states ---
const heroShowcaseData = [
  {
    kicker:"BARTSS / BRAND", title:"A brand people can recognise.", cta:"See identity",
    media:"linear-gradient(145deg,#9db9ca,#586f80)", price:"Brand system",
    pills:["Positioning","Identity","Motion","Launch"],
    panelTitle:"One system, many touchpoints", chips:["Logo","Type","Color","Campaign"], caption:"STRATEGY → IDENTITY → LAUNCH"
  },
  {
    kicker:"BARTSS / WEB", title:"A site that explains itself.", cta:"See product",
    media:"linear-gradient(145deg,#d8e6ee,#89aabb)", price:"Live UX",
    pills:["UX flow","UI system","Motion","Conversion"],
    panelTitle:"Less friction. More action.", chips:["Navigation","Content","CTA","Leads"], caption:"UX → INTERFACE → CONVERSION"
  },
  {
    kicker:"AUTOLAB / AI PRODUCTION", title:"From idea to approved visual.", cta:"Run production",
    media:"linear-gradient(145deg,#cfee35,#48672e)", price:"QC ✓",
    pills:["Character lock","Style lock","Prompt","QC"],
    panelTitle:"18 scenes / one visual system", chips:["Story","Shots","Prompts","Approved"], caption:"STORYBOARD → GENERATE → QC"
  },
  {
    kicker:"BARTSS / MOTION", title:"Make the idea move.", cta:"Play system",
    media:"linear-gradient(145deg,#e57c55,#522f54)", price:"Motion kit",
    pills:["Film","3D","UI Motion","Social"],
    panelTitle:"Motion built into the brand", chips:["Story","Timing","3D","Delivery"], caption:"STORY → MOTION → ATTENTION"
  },
  {
    kicker:"AIFINANCE / SIGNALS", title:"Turn context into a next move.", cta:"See signal",
    media:"linear-gradient(145deg,#a8d9e6,#36586a)", price:"+24.8%",
    pills:["Cash flow","Signals","Portfolio","Actions"],
    panelTitle:"High-intent signal detected", chips:["Context","Risk","Signal","Action"], caption:"DATA → CONTEXT → DECISION"
  }
];

function createShowcase(card,index){
  card.querySelector(".hero-showcase")?.remove();
  const d=heroShowcaseData[index] || heroShowcaseData[0];
  const el=document.createElement("div");
  el.className="hero-showcase";
  el.dataset.state="grid";
  el.innerHTML=`
    <div class="hs-stage">
      <div class="hs-grid">${Array.from({length:8},()=>'<i class="hs-thumb"></i>').join("")}</div>
      <div class="hs-side-card left"></div><div class="hs-side-card right"></div>
      <div class="hs-ad" style="--media:${d.media}">
        <div class="hs-ad-media"></div>
        <div class="hs-ad-copy"><small>${d.kicker}</small><b>${d.title}</b><em>${d.cta} →</em></div>
        <span class="hs-price">${d.price}</span>
      </div>
      <div class="hs-pills">${d.pills.map(x=>`<span class="hs-pill"><i></i>${x}</span>`).join("")}</div>
      <div class="hs-panel">
        <div class="hs-panel-head"><small>HOW IT WORKS</small><i>+</i></div>
        <h4>${d.panelTitle}</h4>
        <div class="hs-chip-row">${d.chips.map(x=>`<span>${x}</span>`).join("")}</div>
        <div class="hs-bars"><i style="--w:88%"></i><i style="--w:70%"></i><i style="--w:94%"></i></div>
      </div>
      <div class="hs-caption">${d.caption}</div>
    </div>`;
  card.querySelector(".visual").appendChild(el);
  return el;
}

let heroShowcaseToken=0, heroShowcaseTimer=null;
const heroStates=["grid","ad","product","panel","final"];
const heroDurations=[1450,1550,1700,1650,1900];

function playShowcase(index=activeIndex){
  clearTimeout(heroShowcaseTimer);
  const token=++heroShowcaseToken;
  document.querySelectorAll(".hero-showcase").forEach(x=>x.remove());
  const card=cards[index];
  if(!card || !card.classList.contains("active")) return;
  const el=createShowcase(card,index);
  let s=0;
  const next=()=>{
    if(token!==heroShowcaseToken || !el.isConnected) return;
    el.dataset.state=heroStates[s];
    if(s===1) playUiSound("whoosh");
    if(s===2) playUiSound("glass");
    if(s===3) playUiSound("pop");
    s++;
    if(s<heroStates.length) heroShowcaseTimer=setTimeout(next,heroDurations[s-1]);
    else heroShowcaseTimer=setTimeout(()=>playShowcase(activeIndex),heroDurations[4]);
  };
  next();
}

// subtle interaction sound; off by default due browser autoplay rules
let audioCtx=null, soundEnabled=false;
const soundBtn=document.createElement("button");
soundBtn.className="sound-control";
soundBtn.textContent="SOUND OFF";
document.body.appendChild(soundBtn);
function ensureAudio(){if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==="suspended")audioCtx.resume()}
function tone(freq,dur=.055,gain=.022,type="sine",delay=0){if(!soundEnabled)return;ensureAudio();const o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime+delay;o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+dur+.02)}
function playUiSound(kind){if(kind==="click"){tone(460,.045,.016,"triangle");tone(720,.04,.009,"sine",.025)}if(kind==="pop"){tone(320,.07,.016,"sine");tone(610,.06,.01,"triangle",.02)}if(kind==="glass"){tone(900,.08,.009,"sine");tone(1320,.10,.006,"sine",.025)}if(kind==="whoosh"){tone(150,.13,.008,"sawtooth");tone(250,.12,.006,"sine",.035)}}
soundBtn.addEventListener("click",()=>{soundEnabled=!soundEnabled;ensureAudio();soundBtn.classList.toggle("on",soundEnabled);soundBtn.textContent=soundEnabled?"SOUND ON":"SOUND OFF";if(soundEnabled)playUiSound("pop")});
document.addEventListener("click",e=>{if(soundEnabled&&e.target.closest("button,a,.show-card"))playUiSound("click")},true);

const baseSetActive=setActive;
setActive=function(index){baseSetActive(index);setTimeout(()=>playShowcase(activeIndex),100)};
requestAnimationFrame(()=>playShowcase(activeIndex));
