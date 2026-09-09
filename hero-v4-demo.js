(() => {
  const section=document.querySelector('#tabletExperience[data-motion="continuous-page"]');
  if(!section)return;
  const page=section.querySelector('#v4TabletPage');
  const screen=section.querySelector('.v4-tablet-screen');
  const steps=[...section.querySelectorAll('.v4-decision-steps span')];
  const blocks=[...section.querySelectorAll('.v4-page-block')];
  const randomBoxes=[...section.querySelectorAll('.v4-random-box')];
  const progress=section.querySelector('.tablet-progress i');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Deterministic pseudo-random stagger: stable on every load, but not mechanical.
  randomBoxes.forEach((box,i)=>{
    const delay=((i*137)%410)+40;
    box.style.setProperty('--box-delay',delay+'ms');
  });

  let raf=0;
  function render(){
    raf=0;
    const r=section.getBoundingClientRect();
    const max=Math.max(1,section.offsetHeight-innerHeight);
    const p=Math.max(0,Math.min(1,-r.top/max));
    const travel=Math.max(0,page.scrollHeight-screen.clientHeight);
    page.style.setProperty('--page-y',(-travel*p).toFixed(2)+'px');

    const active=Math.min(steps.length-1,Math.floor(p*steps.length));
    steps.forEach((el,i)=>el.classList.toggle('active',i===active));
    blocks.forEach((block,i)=>{
      const live=Math.abs(i-active)<=1;
      block.querySelectorAll('.v4-random-box').forEach(el=>el.classList.toggle('v4-box-live',live));
    });
    if(progress)progress.style.transform='scaleX('+Math.max(.04,p)+')';
  }
  function onScroll(){
    if(reduce)return;
    if(!raf)raf=requestAnimationFrame(render);
  }
  addEventListener('scroll',onScroll,{passive:true});
  addEventListener('resize',onScroll,{passive:true});
  render();
})();