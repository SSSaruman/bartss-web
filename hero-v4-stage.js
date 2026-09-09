(() => {
  const section=document.querySelector('#motionManifesto[data-motion="hightouch-stage"]');
  if(!section) return;

  const cards=[...section.querySelectorAll('.stage-card')];
  const status=section.querySelector('.stage-status');
  const statusLabel=status?.querySelector('span');
  const statusIndex=status?.querySelector('b');
  const windowEl=section.querySelector('.stage-window');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!cards.length||!windowEl) return;

  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};

  let raf=0;
  let lastActive=-1;

  function render(){
    raf=0;
    const rect=section.getBoundingClientRect();
    const max=Math.max(1,section.offsetHeight-innerHeight);
    const passed=clamp(-rect.top,0,max);
    const p=passed/max;

    // Leave breathing room at the start/end; 5 cards own the middle 82%.
    const q=smooth(clamp((p-.08)/.84));
    const focus=q*(cards.length-1);
    const active=Math.round(focus);

    const stageW=windowEl.clientWidth;
    const spacing=Math.min(stageW*.155,250);

    cards.forEach((card,i)=>{
      const d=i-focus;
      const ad=Math.abs(d);
      const x=d*spacing;
      const depth=clamp(ad/2.6);
      const y=lerp(0,20,depth);
      const scale=lerp(1,.76,depth);
      const rotate=d*-.8;
      const opacity=lerp(1,.44,clamp((ad-1.15)/2.4));
      const blur=lerp(0,1.8,clamp((ad-1.5)/2.5));

      card.style.setProperty('--x',x.toFixed(2)+'px');
      card.style.setProperty('--y',y.toFixed(2)+'px');
      card.style.setProperty('--scale',scale.toFixed(4));
      card.style.setProperty('--rotate',rotate.toFixed(2)+'deg');
      card.style.setProperty('--opacity',opacity.toFixed(3));
      card.style.setProperty('--blur',blur.toFixed(2)+'px');
      card.style.zIndex=String(20-Math.round(ad*3));
    });

    if(active!==lastActive){
      lastActive=active;
      if(statusIndex) statusIndex.textContent=String(active+1).padStart(2,'0')+' / '+String(cards.length).padStart(2,'0');
      if(statusLabel){
        const labels=['BRAND CONTEXT','PRODUCT CONTEXT','MOTION CONTEXT','AI CONTEXT','SYSTEM CONTEXT'];
        statusLabel.textContent=labels[active]||'CONTEXT LOADING';
      }
    }
  }

  function onScroll(){
    if(reduce) return;
    if(raf) return;
    raf=requestAnimationFrame(render);
  }
  addEventListener('scroll',onScroll,{passive:true});
  addEventListener('resize',onScroll,{passive:true});
  render();
})();