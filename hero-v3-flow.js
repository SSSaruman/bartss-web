
(() => {
  const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sections=[
    ".solution-section",
    ".immersive-work",
    ".tablet-experience",
    ".project-gallery",
    ".motion-manifesto",
    ".systems-hub",
    ".packages-section",
    ".transformation",
    ".work-section"
  ].map(sel=>document.querySelector(sel)).filter(Boolean);

  const childGroups=[
    ".need-card",
    ".project-tile",
    ".system-card",
    ".package-card",
    ".case-card",
    ".motion-rail article"
  ];

  sections.forEach(section=>section.classList.add("flow-section"));

  childGroups.forEach(sel=>{
    document.querySelectorAll(sel).forEach((el,i)=>{
      el.classList.add("flow-item");
      el.style.setProperty("--flow-delay",Math.min(i,5)*70+"ms");
    });
  });

  const headings=document.querySelectorAll(
    ".solution-head h2,.gallery-head h2,.motion-copy h2,.systems-head h2,.packages-head h2,.work-head h2,.transform-head h2"
  );

  if(reduce){
    sections.forEach(s=>s.classList.add("flow-in"));
    document.querySelectorAll(".flow-item").forEach(el=>el.classList.add("flow-in"));
    headings.forEach(h=>h.classList.add("flow-heading-in"));
    return;
  }

  const sectionObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      entry.target.classList.add("flow-in");
      entry.target.querySelectorAll(".flow-item").forEach(el=>el.classList.add("flow-in"));
      entry.target.querySelectorAll(
        ".solution-head h2,.gallery-head h2,.motion-copy h2,.systems-head h2,.packages-head h2,.work-head h2,.transform-head h2"
      ).forEach(h=>h.classList.add("flow-heading-in"));
      sectionObserver.unobserve(entry.target);
    });
  },{threshold:.12,rootMargin:"0px 0px -8% 0px"});

  sections.forEach(section=>sectionObserver.observe(section));

  // Smooth reference-like depth: media moves less than the page.
  const parallaxTargets=[
    ...document.querySelectorAll(".project-object"),
    ...document.querySelectorAll(".system-visual > *")
  ];
  parallaxTargets.forEach(el=>el.classList.add("flow-parallax"));

  let ticking=false;
  function updateParallax(){
    ticking=false;
    const vh=innerHeight;
    parallaxTargets.forEach(el=>{
      const r=el.getBoundingClientRect();
      if(r.bottom<0||r.top>vh)return;
      const center=r.top+r.height/2;
      const p=(center-vh/2)/vh;
      el.style.setProperty("--flow-parallax-y",(p*-18).toFixed(2)+"px");
    });
  }
  addEventListener("scroll",()=>{
    if(ticking)return;
    ticking=true;
    requestAnimationFrame(updateParallax);
  },{passive:true});
  addEventListener("resize",updateParallax,{passive:true});
  updateParallax();

  // The supplied reference uses calm, consistent card reveals instead of each
  // section inventing a different entrance. Pause the old marquee animation.
  const motionRail=document.querySelector(".motion-rail");
  if(motionRail){
    let railX=0,last=performance.now(),paused=false;
    motionRail.addEventListener("mouseenter",()=>paused=true);
    motionRail.addEventListener("mouseleave",()=>paused=false);
    function animateRail(now){
      const dt=Math.min(32,now-last); last=now;
      if(!paused && innerWidth>900){
        railX-=dt*.018;
        const limit=Math.max(0,motionRail.scrollWidth-innerWidth*.92);
        if(Math.abs(railX)>limit)railX=0;
        motionRail.style.transform="translate3d("+railX+"px,0,0)";
      }
      requestAnimationFrame(animateRail);
    }
    requestAnimationFrame(animateRail);
  }
})();


// Section settle: after wheel/trackpad motion ends, glide to the nearest main panel.
// Tall sticky storytelling sections keep their internal scroll range.
(() => {
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const snapSections=[...document.querySelectorAll("main > section")];
  let settleTimer=null;
  let snapping=false;

  function insideLongStory(){
    const y=window.scrollY + innerHeight*0.5;
    return [document.querySelector(".immersive-work"),document.querySelector(".tablet-experience")]
      .filter(Boolean)
      .some(section=>{
        const top=section.offsetTop;
        const bottom=top+section.offsetHeight;
        return y>top+innerHeight*.35 && y<bottom-innerHeight*.35;
      });
  }

  function settleToNearest(){
    if(snapping || insideLongStory()) return;
    const current=window.scrollY;
    let best=null;
    for(const section of snapSections){
      const top=section.offsetTop;
      const d=Math.abs(top-current);
      if(!best || d<best.d) best={section,d};
    }
    if(!best || best.d<18) return;
    snapping=true;
    best.section.scrollIntoView({behavior:"smooth",block:"start"});
    setTimeout(()=>snapping=false,700);
  }

  addEventListener("wheel",()=>{
    if(snapping)return;
    clearTimeout(settleTimer);
    settleTimer=setTimeout(settleToNearest,140);
  },{passive:true});

  addEventListener("touchend",()=>{
    clearTimeout(settleTimer);
    settleTimer=setTimeout(settleToNearest,180);
  },{passive:true});
})();
