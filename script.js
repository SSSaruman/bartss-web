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


// --- HERO MORPH ENGINE: the main card physically becomes the smaller product cards ---
const morphData=[
 {title:"Brand Identity",eyebrow:"BARTSS / BRAND",icon:"B",desc:"One identity system.",accent:["#bdd8e9","#9bbdd1","#dce879"],items:[["Positioning","Find the sharp point.","01"],["Identity","Build recognition.","02"],["Motion","Make it move.","03"],["Launch","Enter with impact.","04"],["System","Keep it coherent.","05"]]},
 {title:"Web & Product",eyebrow:"BARTSS / WEB",icon:"▱",desc:"A living digital experience.",accent:["#c7e0ef","#8faebe","#dce879"],items:[["UX Flow","Remove friction.","01"],["UI System","Build clarity.","02"],["Motion","Explain through movement.","03"],["Conversion","Turn intent into action.","04"],["Scale","Keep it consistent.","05"]]},
 {title:"AutoLAB",eyebrow:"AUTOLAB / AI",icon:"✦",desc:"Idea to approved asset.",accent:["#b6d04f","#819457","#dce879"],items:[["Storyboard","Turn story into scenes.","01"],["Character Lock","Keep people consistent.","02"],["Style Lock","Protect visual language.","03"],["Prompt Engine","Generate with context.","04"],["QC","Approve the right output.","05"]]},
 {title:"Motion & 3D",eyebrow:"BARTSS / MOTION",icon:"◯",desc:"Ideas in motion.",accent:["#c2dcea","#7d98aa","#e6b4a0"],items:[["Story","Find the beat.","01"],["Motion","Build the rhythm.","02"],["3D","Create the world.","03"],["UI Motion","Make feedback visible.","04"],["Delivery","Adapt every format.","05"]]},
 {title:"AiFinance",eyebrow:"AIFINANCE / AI",icon:"↗",desc:"Signals into decisions.",accent:["#d9de91","#8a9a62","#b9d7e6"],items:[["Context","See the whole picture.","01"],["Signals","Detect what changed.","02"],["Risk","Understand exposure.","03"],["Action","Choose the next move.","04"],["Tracking","Measure what followed.","05"]]}
];

let morphTimer=null,morphToken=0;
function removeMorph(){
  clearTimeout(morphTimer);
  document.querySelector(".hero-morph-layer")?.remove();
  cards.forEach(c=>c.classList.remove("morph-source-hidden"));
  document.getElementById("featureStack")?.classList.remove("morph-muted");
}
function createMorph(index){
  removeMorph();
  if(window.innerWidth<=1100) return null;
  const card=cards[index],wrap=document.querySelector(".rail-wrap");
  if(!card||!wrap) return null;
  const cr=card.getBoundingClientRect(),wr=wrap.getBoundingClientRect(),d=morphData[index]||morphData[0];
  const layer=document.createElement("div");
  layer.className="hero-morph-layer";
  layer.dataset.state="full";
  layer.style.setProperty("--mx",`${cr.left-wr.left+cr.width/2}px`);
  layer.style.setProperty("--my",`${cr.top-wr.top+cr.height/2}px`);
  layer.style.setProperty("--mw",`${cr.width}px`);
  layer.style.setProperty("--mh",`${cr.height}px`);
  layer.style.setProperty("--accent-a",d.accent[0]);
  layer.style.setProperty("--accent-b",d.accent[1]);
  layer.style.setProperty("--accent-c",d.accent[2]);
  layer.innerHTML=`
   <div class="hm-card">
     <div class="hm-top"><i>${String(index+1).padStart(2,"0")}</i><span>BARTSS LAB</span></div>
     <div class="hm-core">${d.icon}</div>
     <div class="hm-copy"><small>${d.eyebrow}</small><b>${d.title}</b><em>${d.desc}</em></div>
   </div>
   ${d.items.map((it,i)=>`<div class="hm-satellite s${i+1}"><div class="hm-sat-inner"><span>${it[2]}</span><i>↗</i><b>${it[0]}</b><small>${it[1]}</small></div></div>`).join("")}
   <div class="hm-caption">${d.eyebrow} → ${d.items.map(x=>x[0].toUpperCase()).join(" → ")}</div>`;
  wrap.appendChild(layer);
  card.classList.add("morph-source-hidden");
  document.getElementById("featureStack")?.classList.add("morph-muted");
  return layer;
}

const morphStates=["full","shrink","spread","focus","return"];
const morphDurations=[700,1050,2100,2200,950];
function playMorph(index=activeIndex){
  const token=++morphToken;
  const layer=createMorph(index);
  if(!layer) return;
  let s=0;
  const advance=()=>{
    if(token!==morphToken||!layer.isConnected)return;
    layer.dataset.state=morphStates[s];
    if(s===1)playUiSound("whoosh");
    if(s===2){playUiSound("pop");setTimeout(()=>playUiSound("glass"),140)}
    if(s===3)playUiSound("click");
    s++;
    if(s<morphStates.length)morphTimer=setTimeout(advance,morphDurations[s-1]);
    else morphTimer=setTimeout(()=>{
      if(token!==morphToken)return;
      removeMorph();
      morphTimer=setTimeout(()=>playMorph(activeIndex),850);
    },morphDurations[4]);
  };
  advance();
}

// restrained interaction sound, opt-in
let audioCtx=null,soundEnabled=false;
let soundBtn=document.querySelector(".sound-control");
if(!soundBtn){soundBtn=document.createElement("button");soundBtn.className="sound-control";soundBtn.textContent="SOUND OFF";document.body.appendChild(soundBtn)}
function ensureAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==="suspended")audioCtx.resume()}
function tone(freq,dur=.055,gain=.018,type="sine",delay=0){if(!soundEnabled)return;ensureAudio();const o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime+delay;o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+dur+.02)}
function playUiSound(k){if(k==="click"){tone(440,.04,.012,"triangle");tone(680,.035,.007,"sine",.02)}if(k==="pop"){tone(300,.065,.014,"sine");tone(590,.055,.008,"triangle",.02)}if(k==="glass"){tone(920,.075,.007,"sine");tone(1380,.09,.004,"sine",.024)}if(k==="whoosh"){tone(145,.12,.006,"sawtooth");tone(240,.11,.004,"sine",.03)}}
soundBtn.addEventListener("click",()=>{soundEnabled=!soundEnabled;ensureAudio();soundBtn.classList.toggle("on",soundEnabled);soundBtn.textContent=soundEnabled?"SOUND ON":"SOUND OFF";if(soundEnabled)playUiSound("pop")});
document.addEventListener("click",e=>{if(soundEnabled&&e.target.closest("button,a,.show-card"))playUiSound("click")},true);

const morphBaseSetActive=setActive;
setActive=function(index){
  morphToken++;removeMorph();morphBaseSetActive(index);
  setTimeout(()=>playMorph(activeIndex),220);
};
requestAnimationFrame(()=>playMorph(activeIndex));
