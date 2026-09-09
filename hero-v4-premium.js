(() => {
  const targets=[
    document.querySelector('#transformation .transform-stage'),
    ...document.querySelectorAll('#work .proof-case'),
    ...document.querySelectorAll('#systemsHub .system-card'),
    document.querySelector('#about .team-stage')
  ].filter(Boolean);

  targets.forEach(el=>el.setAttribute('data-premium-reveal',''));

  const io=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('premium-in');
        io.unobserve(entry.target);
      }
    });
  },{threshold:.18,rootMargin:'0px 0px -5% 0px'});
  targets.forEach(el=>io.observe(el));

  document.querySelectorAll('.proof-case,.system-card,.premium-after-browser').forEach(el=>{
    let raf=0,tx=0,ty=0,cx=0,cy=0;
    const step=()=>{
      raf=0;
      cx+=(tx-cx)*.1; cy+=(ty-cy)*.1;
      el.style.transform='translate3d('+(cx*.35).toFixed(2)+'px,'+(cy*.25).toFixed(2)+'px,0)';
      if(Math.abs(tx-cx)>.05||Math.abs(ty-cy)>.05)raf=requestAnimationFrame(step);
    };
    el.addEventListener('pointermove',e=>{
      const r=el.getBoundingClientRect();
      tx=((e.clientX-r.left)/r.width-.5)*10;
      ty=((e.clientY-r.top)/r.height-.5)*8;
      if(!raf)raf=requestAnimationFrame(step);
    },{passive:true});
    el.addEventListener('pointerleave',()=>{
      tx=0;ty=0;if(!raf)raf=requestAnimationFrame(step);
    },{passive:true});
  });
})();