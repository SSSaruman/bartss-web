(()=> {
  const world=document.getElementById('world');
  const rail=[...document.querySelectorAll('.capability-rail button')];
  if(world){
    rail.forEach(btn=>{
      btn.addEventListener('pointerenter',()=>world.dataset.focus=btn.dataset.focus);
      btn.addEventListener('pointerleave',()=>delete world.dataset.focus);
    });
  }

  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(world && !reduce){
    let tx=0,ty=0,cx=0,cy=0;
    addEventListener('pointermove',e=>{
      tx=(e.clientX/innerWidth-.5)*10;
      ty=(e.clientY/innerHeight-.5)*10;
    },{passive:true});
    function tick(){
      cx+=(tx-cx)*.06; cy+=(ty-cy)*.06;
      world.style.transform=`translate3d(${cx}px,${cy}px,0)`;
      requestAnimationFrame(tick);
    }
    tick();
  }

  const seq=document.getElementById('bartssEffect');
  const stage=document.querySelector('.effect-stage');
  const steps=[...document.querySelectorAll('.effect-step')];
  const index=document.getElementById('effectIndex');
  const progress=document.getElementById('effectProgress');
  if(!seq||!stage||!steps.length)return;

  const labels=['01 / BRAND','02 / PACKAGING','03 / WEB & PRODUCT','04 / MOTION & 3D','05 / CAMPAIGN','06 / AI SYSTEMS','07 / INTEGRATED WORLD'];
  let last=-1;
  function update(){
    const r=seq.getBoundingClientRect();
    const total=Math.max(1,seq.offsetHeight-innerHeight);
    const p=Math.min(1,Math.max(0,-r.top/total));
    const step=Math.min(steps.length-1,Math.floor(p*steps.length));
    if(step!==last){
      last=step;
      steps.forEach((el,i)=>el.classList.toggle('active',i===step));
      stage.dataset.step=String(step);
      if(index)index.textContent=labels[step];
    }
    if(progress)progress.style.width=(p*100).toFixed(2)+'%';
  }
  addEventListener('scroll',update,{passive:true});
  addEventListener('resize',update);
  update();

  const serviceRows=[...document.querySelectorAll('.service-row')];
  const serviceScenes=[...document.querySelectorAll('.service-scene')];
  if(serviceRows.length&&serviceScenes.length){
    let serviceActive=0;
    const activateService=(idx)=>{
      serviceActive=idx;
      serviceRows.forEach((el,i)=>el.classList.toggle('active',i===idx));
      serviceScenes.forEach((el,i)=>el.classList.toggle('active',i===idx));
    };
    serviceRows.forEach((row,i)=>row.addEventListener('pointerenter',()=>activateService(i)));
    const io=new IntersectionObserver((entries)=>{
      let best=null;
      entries.forEach(entry=>{
        if(entry.isIntersecting&&(!best||entry.intersectionRatio>best.intersectionRatio))best=entry;
      });
      if(best){
        const idx=Number(best.target.dataset.service);
        if(Number.isFinite(idx)&&idx!==serviceActive)activateService(idx);
      }
    },{rootMargin:'-35% 0px -35% 0px',threshold:[0,.25,.5,.75,1]});
    serviceRows.forEach(row=>io.observe(row));
    activateService(0);
  }
})();