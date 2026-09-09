
(() => {
  const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sections=[
    ".solution-section",
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
  // Global parallax removed: fewer scroll-bound writes keeps the page smooth.
  const parallaxTargets=[];

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
