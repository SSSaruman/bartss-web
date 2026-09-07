(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (n,min,max)=>Math.max(min,Math.min(max,n));
  const lerp = (a,b,t)=>a+(b-a)*t;

  // Branded first-load transition.
  const loader = document.getElementById("bartssLoader");
  const loaderCount = document.getElementById("loaderCount");
  const loaderLine = document.getElementById("loaderLine");
  function finishLoader(){
    document.body.classList.add("motion-ready");
    if(!loader) return;
    loader.classList.add("is-done");
    setTimeout(()=>loader.remove(),1000);
  }
  if(reduce){
    loader?.remove();
    document.body.classList.add("motion-ready");
  }else if(loader){
    const seen = sessionStorage.getItem("bartssMotionSeen");
    const duration = seen ? 360 : 1050;
    const start = performance.now();
    const tick = now => {
      const p = clamp((now-start)/duration,0,1);
      const eased = 1-Math.pow(1-p,3);
      if(loaderCount) loaderCount.textContent=String(Math.round(eased*100)).padStart(2,"0");
      if(loaderLine) loaderLine.style.transform=`scaleX(${eased})`;
      if(p<1) requestAnimationFrame(tick);
      else{
        sessionStorage.setItem("bartssMotionSeen","1");
        setTimeout(finishLoader,seen?40:120);
      }
    };
    requestAnimationFrame(tick);
  }else{
    document.body.classList.add("motion-ready");
  }

  // Reading progress.
  const progress = document.getElementById("scrollProgress");
  let scrollRaf=0;
  function updateProgress(){
    scrollRaf=0;
    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
    const p=clamp(scrollY/max,0,1);
    if(progress) progress.style.transform=`scaleX(${p})`;
  }
  addEventListener("scroll",()=>{
    if(!scrollRaf) scrollRaf=requestAnimationFrame(updateProgress);
  },{passive:true});
  updateProgress();

  // Headline reveal observer — large statements behave like scenes, not static headings.
  const headings=[...document.querySelectorAll(".v3-section-head h2,.v3-trust-statement h2,.v3-fit h2,.v3-contact h2")];
  if(reduce){
    headings.forEach(h=>h.classList.add("motion-heading-in"));
  }else{
    const headingIO=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add("motion-heading-in");
          headingIO.unobserve(entry.target);
        }
      });
    },{threshold:.28,rootMargin:"0px 0px -8% 0px"});
    headings.forEach(h=>headingIO.observe(h));
  }

  // Hero material: cursor-tracked tilt + live highlight. Works for loop clones too.
  const rail=document.getElementById("cardRail");
  function cardsNow(){ return [...document.querySelectorAll(".card-rail .show-card")]; }
  function resetCard(card){
    card.style.setProperty("--rx","0deg");
    card.style.setProperty("--ry","0deg");
    card.style.setProperty("--shine-x","50%");
    card.style.setProperty("--shine-y","45%");
  }
  document.addEventListener("pointermove",e=>{
    if(reduce || innerWidth<=1100) return;
    const card=e.target.closest?.(".show-card");
    if(!card || !rail?.contains(card)) return;
    const r=card.getBoundingClientRect();
    const nx=clamp((e.clientX-r.left)/r.width,0,1);
    const ny=clamp((e.clientY-r.top)/r.height,0,1);
    card.style.setProperty("--ry",`${((nx-.5)*7).toFixed(2)}deg`);
    card.style.setProperty("--rx",`${((.5-ny)*6).toFixed(2)}deg`);
    card.style.setProperty("--shine-x",`${(nx*100).toFixed(1)}%`);
    card.style.setProperty("--shine-y",`${(ny*100).toFixed(1)}%`);
  },{passive:true});
  document.addEventListener("pointerout",e=>{
    const card=e.target.closest?.(".show-card");
    if(card && !card.contains(e.relatedTarget)) resetCard(card);
  });

  // Drag velocity reaction — a controlled skew that decays after release.
  let lastX=0,lastT=0,skew=0,skewTarget=0,skewRaf=0;
  function animateSkew(){
    skew=lerp(skew,skewTarget,.18);
    skewTarget*=.88;
    cardsNow().forEach(card=>card.style.setProperty("--velocity-skew",`${skew.toFixed(2)}deg`));
    if(Math.abs(skew)>.03 || Math.abs(skewTarget)>.03) skewRaf=requestAnimationFrame(animateSkew);
    else{
      skewRaf=0;
      cardsNow().forEach(card=>card.style.setProperty("--velocity-skew","0deg"));
    }
  }
  rail?.addEventListener("pointerdown",e=>{lastX=e.clientX;lastT=performance.now();},{passive:true});
  rail?.addEventListener("pointermove",e=>{
    if(!rail.classList.contains("is-dragging") || reduce) return;
    const now=performance.now(),dt=Math.max(8,now-lastT),dx=e.clientX-lastX;
    skewTarget=clamp((dx/dt)*3.8,-6,6);
    lastX=e.clientX;lastT=now;
    if(!skewRaf) skewRaf=requestAnimationFrame(animateSkew);
  },{passive:true});
  ["pointerup","pointercancel"].forEach(type=>rail?.addEventListener(type,()=>{
    skewTarget=0;if(!skewRaf) skewRaf=requestAnimationFrame(animateSkew);
  },{passive:true}));

  // Case studies become scroll-staged compositions.
  const cases=[...document.querySelectorAll(".case-card")];
  const systems=[...document.querySelectorAll(".system-card")];
  const process=document.querySelector(".process-grid");
  let sceneRaf=0;
  function updateScenes(){
    sceneRaf=0;
    if(reduce) return;
    const vh=innerHeight;
    cases.forEach((card,i)=>{
      const r=card.getBoundingClientRect();
      if(r.bottom<0 || r.top>vh) return;
      const center=(r.top+r.height*.5)-vh*.5;
      const shift=clamp(-center/vh*42,-24,24);
      card.style.setProperty("--case-shift",`${shift.toFixed(2)}px`);
    });
    if(process){
      const r=process.getBoundingClientRect();
      const p=clamp((vh*.72-r.top)/(r.height+vh*.28),0,1);
      process.style.setProperty("--process-progress",p.toFixed(3));
    }
    const docY=scrollY+vh*.45;
    document.body.style.setProperty("--bg-y",`${clamp((docY/document.documentElement.scrollHeight)*100,18,82).toFixed(1)}%`);
  }
  addEventListener("scroll",()=>{
    if(!sceneRaf) sceneRaf=requestAnimationFrame(updateScenes);
  },{passive:true});
  addEventListener("resize",updateScenes,{passive:true});
  updateScenes();

  // Systems react to pointer with depth, without turning into a dashboard gimmick.
  systems.forEach(card=>{
    card.addEventListener("pointermove",e=>{
      if(reduce || innerWidth<=900) return;
      const r=card.getBoundingClientRect();
      const nx=(e.clientX-r.left)/r.width-.5;
      const ny=(e.clientY-r.top)/r.height-.5;
      card.style.setProperty("--sys-x",`${(nx*10).toFixed(1)}px`);
      card.style.setProperty("--sys-y",`${(ny*7).toFixed(1)}px`);
    },{passive:true});
    card.addEventListener("pointerleave",()=>{
      card.style.setProperty("--sys-x","0px");
      card.style.setProperty("--sys-y","0px");
    });
  });

  // Capability rail: autonomous slow drift, pauses while the visitor interacts.
  const motionRail=document.getElementById("motionRail");
  let railOffset=0,railDirection=-1,railAutoRaf=0,railPaused=false,lastFrame=0;
  function autoRail(now){
    if(!motionRail || reduce || innerWidth<=700){railAutoRaf=0;return;}
    const parent=motionRail.parentElement;
    const max=Math.max(0,motionRail.scrollWidth-(parent?.clientWidth||innerWidth)+40);
    if(!railPaused && max>10){
      const dt=Math.min(40,now-(lastFrame||now));
      railOffset+=railDirection*dt*.018;
      if(railOffset<=-max){railOffset=-max;railDirection=1;}
      if(railOffset>=0){railOffset=0;railDirection=-1;}
      motionRail.style.transform=`translate3d(${railOffset}px,0,0)`;
      motionRail.classList.add("is-auto-moving");
    }
    lastFrame=now;
    railAutoRaf=requestAnimationFrame(autoRail);
  }
  if(motionRail){
    motionRail.parentElement.style.overflow="hidden";
    motionRail.addEventListener("pointerenter",()=>railPaused=true);
    motionRail.addEventListener("pointerleave",()=>railPaused=false);
    railAutoRaf=requestAnimationFrame(autoRail);
  }

  // Magnetic final CTA — restrained, only desktop pointer devices.
  document.querySelectorAll(".contact-primary,.contact-secondary").forEach(el=>{
    el.addEventListener("pointermove",e=>{
      if(reduce || innerWidth<=900) return;
      const r=el.getBoundingClientRect();
      const dx=e.clientX-(r.left+r.width/2);
      const dy=e.clientY-(r.top+r.height/2);
      el.style.setProperty("--mx",`${clamp(dx*.08,-9,9).toFixed(1)}px`);
      el.style.setProperty("--my",`${clamp(dy*.12,-6,6).toFixed(1)}px`);
    },{passive:true});
    el.addEventListener("pointerleave",()=>{
      el.style.setProperty("--mx","0px");el.style.setProperty("--my","0px");
    });
  });

  // Very subtle pointer atmosphere in hero/background.
  addEventListener("pointermove",e=>{
    if(reduce || innerWidth<=900) return;
    document.body.style.setProperty("--bg-x",`${(e.clientX/innerWidth*100).toFixed(1)}%`);
  },{passive:true});
})();