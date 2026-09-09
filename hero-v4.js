const menuTrigger=document.getElementById("menuTrigger");
const menuPanel=document.getElementById("menuPanel");
const menuClose=document.getElementById("menuClose");

function openMenu(){
  document.body.classList.add("menu-open");
  menuPanel?.classList.add("open");
  menuPanel?.setAttribute("aria-hidden","false");
  menuTrigger?.setAttribute("aria-expanded","true");
}
function closeMenu(){
  document.body.classList.remove("menu-open");
  menuPanel?.classList.remove("open");
  menuPanel?.setAttribute("aria-hidden","true");
  menuTrigger?.setAttribute("aria-expanded","false");
}
menuTrigger?.addEventListener("click",openMenu);
menuClose?.addEventListener("click",closeMenu);
document.addEventListener("keydown",e=>e.key==="Escape"&&closeMenu());
document.addEventListener("pointerdown",e=>{
  if(!document.body.classList.contains("menu-open"))return;
  if(menuPanel?.contains(e.target)||menuTrigger?.contains(e.target))return;
  closeMenu();
});

// HERO V4 — transformation motion, no carousel.
(() => {
  const stage=document.getElementById("v4Stage");
  if(!stage)return;

  const status=document.getElementById("v4StageStatus");
  const index=document.getElementById("v4StageIndex");
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;

  const phases=[
    {key:"broken",label:"Something isn’t working."},
    {key:"system",label:"BARTSS reorganises the system."},
    {key:"outcome",label:"The outcome becomes visible."}
  ];

  let active=0;
  let timer=null;
  let raf=0;
  let tx=0,ty=0,cx=0,cy=0;

  function applyPhase(i){
    active=(i+phases.length)%phases.length;
    const phase=phases[active];
    stage.dataset.phase=phase.key;
    if(status)status.textContent=phase.label;
    if(index)index.textContent=String(active+1).padStart(2,"0")+" / 03";
  }

  function schedule(){
    clearTimeout(timer);
    const duration=active===0?3300:(active===1?3600:4100);
    timer=setTimeout(()=>{
      applyPhase(active+1);
      schedule();
    },duration);
  }

  function depthLoop(){
    raf=0;
    cx+=(tx-cx)*.09;
    cy+=(ty-cy)*.09;
    stage.style.setProperty("--mx",cx.toFixed(2)+"px");
    stage.style.setProperty("--my",cy.toFixed(2)+"px");
    if(Math.abs(tx-cx)>.05||Math.abs(ty-cy)>.05){
      raf=requestAnimationFrame(depthLoop);
    }
  }

  stage.addEventListener("pointermove",e=>{
    if(reduce)return;
    const r=stage.getBoundingClientRect();
    tx=((e.clientX-r.left)/r.width-.5)*16;
    ty=((e.clientY-r.top)/r.height-.5)*12;
    if(!raf)raf=requestAnimationFrame(depthLoop);
  },{passive:true});

  stage.addEventListener("pointerleave",()=>{
    tx=0;ty=0;
    if(!raf)raf=requestAnimationFrame(depthLoop);
  },{passive:true});

  applyPhase(0);
  if(!reduce)schedule();
})();

const solutionMap={
  brand:{
    title:"Brand Strategy + Identity + Motion + Web",
    chips:["Strategy","Identity","Motion","Web"]
  },
  product:{
    title:"UX + Content Architecture + Web + Motion + Conversion System",
    chips:["UX","Content architecture","Web","Motion","Conversion system"]
  },
  attention:{
    title:"Campaign Strategy + Motion + 3D + Content System",
    chips:["Campaign strategy","Motion","3D","Content system"]
  },
  automation:{
    title:"Workflow Analysis + AI + Automation + Custom Systems",
    chips:["Workflow analysis","AI","Automation","Custom systems"]
  }
};
document.querySelectorAll(".need-card").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".need-card").forEach(x=>x.classList.remove("active"));
  btn.classList.add("active");

  const config=solutionMap[btn.dataset.solution]||solutionMap.brand;
  const title=document.getElementById("solutionTitle");
  const chips=document.getElementById("solutionStackChips");

  title.animate(
    [{opacity:.2,transform:"translateY(8px)"},{opacity:1,transform:"none"}],
    {duration:350,easing:"cubic-bezier(.22,1,.36,1)"}
  );
  title.textContent=config.title;

  if(chips){
    chips.animate(
      [{opacity:.2,transform:"translateY(6px)"},{opacity:1,transform:"none"}],
      {duration:320,easing:"cubic-bezier(.22,1,.36,1)"}
    );
    chips.replaceChildren(...config.chips.map(label=>{
      const span=document.createElement("span");
      span.textContent=label;
      return span;
    }));
  }
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



function sceneEnvelope(globalP,index,count){
  const center=(index+.5)/count;
  const dist=Math.abs(globalP-center)*count;
  const visibility=Math.max(0,Math.min(1,1-dist));
  return visibility*visibility*(3-2*visibility);
}
