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

// Menu navigation: do not let anchor navigation scroll the oversized hero rail horizontally.
document.querySelectorAll(".menu-tile").forEach(link=>{
  link.addEventListener("click",e=>{
    const cardIndex = link.dataset.cardIndex;
    if(cardIndex !== undefined){
      e.preventDefault();
      closeMenu();
      setActive(Number(cardIndex));
      // Keep the viewport pinned to the document's left edge.
      document.documentElement.scrollLeft = 0;
      document.body.scrollLeft = 0;
      return;
    }

    const targetId = link.getAttribute("href");
    if(targetId && targetId.startsWith("#")){
      const target = document.querySelector(targetId);
      if(target){
        e.preventDefault();
        closeMenu();
        const y = target.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({top:y,left:0,behavior:"smooth"});
      }
    }
  });
});
window.addEventListener("scroll",()=>{
  if(window.scrollX !== 0) window.scrollTo(0,window.scrollY);
},{passive:true});


// --- HERO REFERENCE SEQUENCE: central anchor, Hightouch-style transformation rhythm ---
const seqData=[
 {title:"Brand Identity",eyebrow:"BARTSS / BRAND",icon:"B",desc:"One identity. Many touchpoints.",accent:["#bdd8e9","#8ca7b6","#dce879"],targets:["Positioning","Identity","Motion","Launch"],search:"Searching brand assets…",metric:"92",metricLabel:"Brand consistency",strip:"Channel-ready identity"},
 {title:"Web & Product",eyebrow:"BARTSS / WEB",icon:"▱",desc:"A digital product that explains itself.",accent:["#c7e0ef","#87a8ba","#dce879"],targets:["Desktop","Mobile","Returning user","High intent"],search:"Searching product patterns…",metric:"38",metricLabel:"UX friction removed",strip:"Conversion-ready product"},
 {title:"AutoLAB",eyebrow:"AUTOLAB / AI",icon:"✦",desc:"From idea to approved visual.",accent:["#b6d04f","#74894e","#dce879"],targets:["Character Lock","Style Lock","Prompt Engine","QC passed"],search:"Searching visual references…",metric:"94",metricLabel:"QC pass rate",strip:"Production-ready system"},
 {title:"Motion & 3D",eyebrow:"BARTSS / MOTION",icon:"◯",desc:"One idea. Many motion outputs.",accent:["#c2dcea","#7895a7","#e5b3a0"],targets:["Film","Social","UI motion","3D"],search:"Searching motion assets…",metric:"24",metricLabel:"Format variants",strip:"Motion distribution system"},
 {title:"AiFinance",eyebrow:"AIFINANCE / SIGNALS",icon:"↗",desc:"Turn context into a next move.",accent:["#d9de91","#7d8f59","#b9d7e6"],targets:["Germany","Berlin","iPhone / Android","3+ visits"],search:"Searching existing signals…",metric:"650",metricLabel:"Qualified signal",strip:"Channel strategy"}
];

let seqTimer=null,seqToken=0;
function clearSeq(){
  clearTimeout(seqTimer);
  document.querySelector(".hero-seq")?.remove();
  document.body.classList.remove("hero-seq-active");
  cards.forEach(c=>c.classList.remove("hero-seq-hidden"));
  document.getElementById("featureStack")?.classList.remove("hero-seq-muted");
}
function buildSeq(index){
  clearSeq(); if(innerWidth<=1100)return null;
  const card=cards[index],wrap=document.querySelector(".rail-wrap");if(!card||!wrap)return null;
  const cr=card.getBoundingClientRect(),wr=wrap.getBoundingClientRect(),d=seqData[index]||seqData[0];
  const intro=document.querySelector(".hero-intro");
  const ir=intro?intro.getBoundingClientRect():null;
  // The showcase belongs to the RIGHT hero column, not to the selected rail-card.
  // Keep a fixed presentation anchor in the visual center of that column.
  const anchorX=ir ? (ir.left-wr.left + ir.width/2) : (wr.width*.76);
  const anchorY=Math.min(250,Math.max(210,wr.height*.39));
  const el=document.createElement("div");el.className="hero-seq";el.dataset.state="grid";
  [["--cx",anchorX+"px"],["--cy",anchorY+"px"],["--cw",Math.min(360,cr.width)+"px"],["--ch",Math.min(360,cr.height)+"px"],["--a",d.accent[0]],["--b",d.accent[1]],["--c",d.accent[2]]].forEach(([k,v])=>el.style.setProperty(k,v));
  el.innerHTML=`
   <div class="hq-scene">
    <div class="hq-grid"><div class="hq-grid-label"><b>Building…</b><small>Content strategy<br>Generating assets<br>Testing outputs</small></div>${Array.from({length:9},()=>'<i class="hq-tile"></i>').join("")}</div>
    <div class="hq-card">
      <div class="hq-top"><i>${String(index+1).padStart(2,"0")}</i><span>BARTSS LAB</span></div>
      <div class="hq-object">${d.icon}</div>
      <div class="hq-copy"><small>${d.eyebrow}</small><b>${d.title}</b><em>${d.desc}</em></div>
    </div>
    <div class="hq-targets">${d.targets.map(x=>`<span class="hq-target"><i></i>${x}</span>`).join("")}</div>
    <div class="hq-metric"><small>${d.metricLabel}</small><div class="hq-chart"></div><b>${d.metric}</b></div>
    <div class="hq-strip"><div class="hq-strip-inner"><div class="hq-strip-object">${d.icon}</div><b>${d.strip}</b><span>→ LIVE</span></div></div>
    <div class="hq-search"><div class="hq-search-title">${d.search}</div><div class="hq-search-row"><i></i><i></i><i></i><i></i><i></i></div><div class="hq-search-assets">${Array.from({length:8},()=>'<i></i>').join("")}</div></div>
    <div class="hq-formats"><div class="hq-format f1"><b>${d.title}</b><small>wide banner</small></div><div class="hq-format f2"><b>${d.title}</b><small>landscape</small></div><div class="hq-format f3"><b>${d.title}</b><small>vertical</small></div><div class="hq-format f4"><b>${d.title}</b><small>square</small></div><div class="hq-format f5"><b>${d.icon}</b><small>tile</small></div></div>
   </div>`;
  wrap.appendChild(el);document.body.classList.add("hero-seq-active");card.classList.add("hero-seq-hidden");document.getElementById("featureStack")?.classList.add("hero-seq-muted");return el;
}
const seqStates=["grid","card","targets","metric","expand","strip","search","formats","targets","final"];
const seqTimes=[1250,1400,1550,1450,1200,1100,1650,1700,1450,2100];
function playSeq(index=activeIndex){
 const token=++seqToken,el=buildSeq(index);if(!el)return;let s=0;
 const next=()=>{
  if(token!==seqToken||!el.isConnected)return;
  el.dataset.state=seqStates[s];
  if(s===1||s===4||s===5)playUiSound("whoosh");
  if(s===2||s===7)playUiSound("pop");
  if(s===3||s===8)playUiSound("glass");
  s++;
  if(s<seqStates.length)seqTimer=setTimeout(next,seqTimes[s-1]);
  else seqTimer=setTimeout(()=>{if(token!==seqToken)return;clearSeq();seqTimer=setTimeout(()=>playSeq(activeIndex),650)},seqTimes[9]);
 };
 next();
}

// opt-in micro sound
let audioCtx=null,soundEnabled=false,soundBtn=document.querySelector(".sound-control");
if(!soundBtn){soundBtn=document.createElement("button");soundBtn.className="sound-control";soundBtn.textContent="SOUND OFF";document.body.appendChild(soundBtn)}
function ensureAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==="suspended")audioCtx.resume()}
function tone(freq,d=.05,g=.014,type="sine",delay=0){if(!soundEnabled)return;ensureAudio();const o=audioCtx.createOscillator(),v=audioCtx.createGain(),t=audioCtx.currentTime+delay;o.type=type;o.frequency.setValueAtTime(freq,t);v.gain.setValueAtTime(.0001,t);v.gain.exponentialRampToValueAtTime(g,t+.008);v.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(v);v.connect(audioCtx.destination);o.start(t);o.stop(t+d+.02)}
function playUiSound(k){if(k==="click"){tone(420,.04,.01,"triangle");tone(680,.035,.006,"sine",.02)}if(k==="pop"){tone(310,.065,.013,"sine");tone(600,.05,.007,"triangle",.02)}if(k==="glass"){tone(930,.07,.006,"sine");tone(1390,.09,.004,"sine",.025)}if(k==="whoosh"){tone(145,.12,.005,"sawtooth");tone(235,.1,.003,"sine",.03)}}
soundBtn.addEventListener("click",()=>{soundEnabled=!soundEnabled;ensureAudio();soundBtn.classList.toggle("on",soundEnabled);soundBtn.textContent=soundEnabled?"SOUND ON":"SOUND OFF";if(soundEnabled)playUiSound("pop")});
document.addEventListener("click",e=>{if(soundEnabled&&e.target.closest("button,a,.show-card"))playUiSound("click")},true);

const seqBaseSetActive=setActive;
setActive=function(index){seqToken++;clearSeq();seqBaseSetActive(index);setTimeout(()=>playSeq(activeIndex),180)};
requestAnimationFrame(()=>playSeq(activeIndex));
