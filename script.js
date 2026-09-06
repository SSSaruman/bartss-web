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


// --- HERO ORGANIC MORPH / active card changes with every feature ---
const morphData=[
 {title:"Brand Identity",eyebrow:"BARTSS / BRAND",icon:"B",desc:"One identity system.",accent:["#bdd8e9","#8ba7b7","#dce879"],items:[["Positioning","Find the sharp point.","01","◎"],["Identity","Build recognition.","02","B"],["Motion","Make it move.","03","▶"],["Launch","Enter with impact.","04","↗"],["System","Keep it coherent.","05","∞"]]},
 {title:"Web & Product",eyebrow:"BARTSS / WEB",icon:"▱",desc:"A living digital experience.",accent:["#c7e0ef","#86a9bb","#dce879"],items:[["UX Flow","Remove friction.","01","↝"],["UI System","Build clarity.","02","▦"],["Motion","Explain through movement.","03","◌"],["Conversion","Turn intent into action.","04","↗"],["Scale","Keep it consistent.","05","∞"]]},
 {title:"AutoLAB",eyebrow:"AUTOLAB / AI",icon:"✦",desc:"Idea to approved asset.",accent:["#b6d04f","#758a4f","#dce879"],items:[["Storyboard","Turn story into scenes.","01","▦"],["Character Lock","Keep people consistent.","02","◉"],["Style Lock","Protect visual language.","03","◇"],["Prompt Engine","Generate with context.","04","✦"],["QC","Approve the right output.","05","✓"]]},
 {title:"Motion & 3D",eyebrow:"BARTSS / MOTION",icon:"◯",desc:"Ideas in motion.",accent:["#c2dcea","#7896a8","#e6b4a0"],items:[["Story","Find the beat.","01","≋"],["Motion","Build the rhythm.","02","▶"],["3D","Create the world.","03","⬡"],["UI Motion","Make feedback visible.","04","◌"],["Delivery","Adapt every format.","05","↗"]]},
 {title:"AiFinance",eyebrow:"AIFINANCE / AI",icon:"↗",desc:"Signals into decisions.",accent:["#d9de91","#80915b","#b9d7e6"],items:[["Context","See the whole picture.","01","◎"],["Signals","Detect what changed.","02","⌁"],["Risk","Understand exposure.","03","△"],["Action","Choose the next move.","04","↗"],["Tracking","Measure what followed.","05","◌"]]}
];

let morphTimer=null,morphToken=0,morphRaf=0;
function removeMorph(){
 clearTimeout(morphTimer);cancelAnimationFrame(morphRaf);
 document.querySelector(".hero-morph-layer")?.remove();
 cards.forEach(c=>c.classList.remove("morph-source-hidden"));
 document.getElementById("featureStack")?.classList.remove("morph-muted");
}
function createMorph(index){
 removeMorph(); if(innerWidth<=1100)return null;
 const card=cards[index],wrap=document.querySelector(".rail-wrap"); if(!card||!wrap)return null;
 const cr=card.getBoundingClientRect(),wr=wrap.getBoundingClientRect(),d=morphData[index]||morphData[0];
 const layer=document.createElement("div");layer.className="hero-morph-layer";layer.dataset.state="full";
 [["--mx",cr.left-wr.left+cr.width/2+"px"],["--my",cr.top-wr.top+cr.height/2+"px"],["--mw",cr.width+"px"],["--mh",cr.height+"px"],["--a",d.accent[0]],["--b",d.accent[1]],["--c",d.accent[2]]].forEach(([k,v])=>layer.style.setProperty(k,v));
 layer.innerHTML=`
  <div class="hm-card">
   <div class="hm-top"><i>${String(index+1).padStart(2,"0")}</i><span>BARTSS LAB</span></div>
   <div class="hm-core">${d.icon}</div>
   <div class="hm-feature-meter"><i></i></div>
   <div class="hm-copy"><small>${d.eyebrow}</small><b>${d.title}</b><em>${d.desc}</em></div>
  </div>
  ${d.items.map((it,i)=>`<div class="hm-satellite s${i+1}" data-i="${i}"><div class="hm-sat-inner"><span>${it[2]}</span><i>↗</i><div class="hm-sat-visual"><i></i></div><b>${it[0]}</b><small>${it[1]}</small></div></div>`).join("")}
  <div class="hm-caption">${d.eyebrow}</div>`;
 wrap.appendChild(layer);card.classList.add("morph-source-hidden");document.getElementById("featureStack")?.classList.add("morph-muted");
 return {layer,d};
}
function springSpread(layer){
 const sats=[...layer.querySelectorAll(".hm-satellite")];
 const targets=[
  [-168,-76,-4,.90],[-142,108,3,.82],[170,-82,4,.90],[146,108,-3,.82],[4,-154,1,.78]
 ];
 sats.forEach((el,i)=>{
   const [x,y,r,s]=targets[i];
   el.animate([
    {transform:"translate(-50%,-50%) scale(.16)",opacity:0},
    {transform:`translate(calc(-50% + ${x*1.08}px),calc(-50% + ${y*1.08}px)) scale(${s*1.04}) rotate(${r*1.12}deg)`,opacity:1,offset:.72},
    {transform:`translate(calc(-50% + ${x}px),calc(-50% + ${y}px)) scale(${s}) rotate(${r}deg)`,opacity:1}
   ],{duration:980+70*i,easing:"cubic-bezier(.16,1,.3,1)",fill:"forwards"});
   el.dataset.baseX=x;el.dataset.baseY=y;el.dataset.baseR=r;el.dataset.baseS=s;
 });
}
function startOrganicDrift(layer){
 const sats=[...layer.querySelectorAll(".hm-satellite")]; const start=performance.now();
 const tick=now=>{
   if(!layer.isConnected)return;
   const t=(now-start)/1000;
   sats.forEach((el,i)=>{
     if(layer.dataset.state!=="spread" && layer.dataset.state!=="feature")return;
     if(el.classList.contains("is-active"))return;
     const x=Number(el.dataset.baseX||0),y=Number(el.dataset.baseY||0),r=Number(el.dataset.baseR||0),s=Number(el.dataset.baseS||1);
     const dx=Math.sin(t*.78+i*1.7)*3.2,dy=Math.cos(t*.92+i*1.13)*4.2,dr=Math.sin(t*.55+i)*.65;
     el.style.transform=`translate(calc(-50% + ${x+dx}px),calc(-50% + ${y+dy}px)) scale(${s}) rotate(${r+dr}deg)`;
   });
   morphRaf=requestAnimationFrame(tick);
 };
 morphRaf=requestAnimationFrame(tick);
}
function setFeature(ctx,fi){
 const {layer,d}=ctx, item=d.items[fi],card=layer.querySelector(".hm-card"),core=layer.querySelector(".hm-core"),copy=layer.querySelector(".hm-copy"),meter=layer.querySelector(".hm-feature-meter i"),caption=layer.querySelector(".hm-caption");
 const sats=[...layer.querySelectorAll(".hm-satellite")];
 sats.forEach((s,i)=>s.classList.toggle("is-active",i===fi));
 const active=sats[fi];
 // Keep the hero-card's center fixed. The selected feature orbits the same anchor.
 const orbit=[
   [162,-64,-2],[146,92,2],[-162,-66,2],[-146,92,-2],[0,-150,0]
 ][fi];
 active.style.transform=`translate(calc(-50% + ${orbit[0]}px),calc(-50% + ${orbit[1]}px)) scale(.94) rotate(${orbit[2]}deg)`;
 const satStyle=getComputedStyle(active);
 const featureA=satStyle.getPropertyValue("--sa").trim()||d.accent[0];
 const featureB=satStyle.getPropertyValue("--sb").trim()||d.accent[1];
 card.style.setProperty("--a",featureA);
 card.style.setProperty("--b",featureB);
 core.textContent=item[3]; core.animate([{transform:"translate(-50%,-50%) rotate(4deg) scale(.72)",opacity:.2},{transform:"translate(-50%,-50%) rotate(4deg) scale(1.08)",opacity:1,offset:.65},{transform:"translate(-50%,-50%) rotate(4deg) scale(1)",opacity:1}],{duration:520,easing:"cubic-bezier(.16,1,.3,1)"});
 copy.animate([{opacity:.12,transform:"translateY(9px)"},{opacity:1,transform:"translateY(0)"}],{duration:430,easing:"ease-out"});
 copy.querySelector("small").textContent=`${d.eyebrow} / ${item[2]}`;
 copy.querySelector("b").textContent=item[0];
 copy.querySelector("em").textContent=item[1];
 meter.style.width=`${(fi+1)*20}%`;
 caption.textContent=`${d.title.toUpperCase()} → ${item[0].toUpperCase()}`;
 active.animate([{filter:"brightness(1.2)",boxShadow:"0 0 0 rgba(0,0,0,0)"},{filter:"brightness(1)",boxShadow:"0 30px 60px rgba(20,28,32,.22)"}],{duration:600,easing:"ease-out"});
}
function playMorph(index=activeIndex){
 const token=++morphToken,ctx=createMorph(index);if(!ctx)return;const {layer,d}=ctx;
 layer.dataset.state="full";
 morphTimer=setTimeout(()=>{if(token!==morphToken)return;layer.dataset.state="shrink";playUiSound("whoosh");
  morphTimer=setTimeout(()=>{if(token!==morphToken)return;layer.dataset.state="spread";springSpread(layer);startOrganicDrift(layer);playUiSound("pop");
    morphTimer=setTimeout(()=>featureLoop(0),1250);
  },900);
 },650);
 function featureLoop(fi){
   if(token!==morphToken||!layer.isConnected)return;
   if(fi>=d.items.length){
     layer.dataset.state="return";playUiSound("whoosh");
     morphTimer=setTimeout(()=>{if(token!==morphToken)return;removeMorph();morphTimer=setTimeout(()=>playMorph(activeIndex),700)},1000);return;
   }
   layer.dataset.state="feature";setFeature(ctx,fi);playUiSound(fi===d.items.length-1?"glass":"click");
   morphTimer=setTimeout(()=>featureLoop(fi+1),1450);
 }
}

// opt-in micro sound
let audioCtx=null,soundEnabled=false,soundBtn=document.querySelector(".sound-control");
if(!soundBtn){soundBtn=document.createElement("button");soundBtn.className="sound-control";soundBtn.textContent="SOUND OFF";document.body.appendChild(soundBtn)}
function ensureAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==="suspended")audioCtx.resume()}
function tone(freq,d=.05,g=.014,type="sine",delay=0){if(!soundEnabled)return;ensureAudio();const o=audioCtx.createOscillator(),v=audioCtx.createGain(),t=audioCtx.currentTime+delay;o.type=type;o.frequency.setValueAtTime(freq,t);v.gain.setValueAtTime(.0001,t);v.gain.exponentialRampToValueAtTime(g,t+.008);v.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(v);v.connect(audioCtx.destination);o.start(t);o.stop(t+d+.02)}
function playUiSound(k){if(k==="click"){tone(420,.04,.01,"triangle");tone(680,.035,.006,"sine",.02)}if(k==="pop"){tone(310,.065,.013,"sine");tone(600,.05,.007,"triangle",.02)}if(k==="glass"){tone(930,.07,.006,"sine");tone(1390,.09,.004,"sine",.025)}if(k==="whoosh"){tone(145,.12,.005,"sawtooth");tone(235,.1,.003,"sine",.03)}}
soundBtn.addEventListener("click",()=>{soundEnabled=!soundEnabled;ensureAudio();soundBtn.classList.toggle("on",soundEnabled);soundBtn.textContent=soundEnabled?"SOUND ON":"SOUND OFF";if(soundEnabled)playUiSound("pop")});
document.addEventListener("click",e=>{if(soundEnabled&&e.target.closest("button,a,.show-card"))playUiSound("click")},true);

const organicBaseSetActive=setActive;
setActive=function(index){morphToken++;removeMorph();organicBaseSetActive(index);setTimeout(()=>playMorph(activeIndex),180)};
requestAnimationFrame(()=>playMorph(activeIndex));
