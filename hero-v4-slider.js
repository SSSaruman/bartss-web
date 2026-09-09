(() => {
  const rail=document.getElementById('v4CardRail');
  const wrap=document.querySelector('.v4-slider-wrap');
  const cards=rail?[...rail.querySelectorAll('.v4-show-card')]:[];
  const featureButtons=[...document.querySelectorAll('#v4FeatureStack button')];
  if(!rail||!wrap||!cards.length)return;

  let activeIndex=2;
  let timer=0;
  const count=cards.length;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  const featureMap=[
    ['LOGO SYSTEM','BRAND LANGUAGE','ROLLOUT READY'],
    ['UX ARCHITECTURE','RESPONSIVE UI','CONVERSION FLOW'],
    ['MOTION LANGUAGE','CAMPAIGN SYSTEM','3D DIRECTION'],
    ['STORYBOARD FLOW','STYLE LOCK','QC PIPELINE'],
    ['SIGNAL FILTER','SYSTEM VIEW','ACTION TRACKING']
  ];

  function circularDistance(index,active){
    let d=index-active;
    while(d>count/2)d-=count;
    while(d<-count/2)d+=count;
    return d;
  }

  function step(){
    const w=wrap.clientWidth||innerWidth;
    return Math.max(300,Math.min(455,w*.245));
  }

  function updateFeatures(){
    const labels=featureMap[activeIndex]||featureMap[0];
    featureButtons.forEach((btn,i)=>{
      const span=btn.querySelector('span');
      if(span)span.textContent=labels[i]||'';
      btn.style.transform='translateX('+(i*10)+'px)';
    });
  }

  function layout(animate=true){
    const gap=step();
    cards.forEach((card,i)=>{
      const d=circularDistance(i,activeIndex);
      const ad=Math.abs(d);
      const x=d*gap+(ad===1?(d<0?-42:42):0);
      const scale=d===0?1.15:(ad===1?.985:.94);
      const opacity=d===0?1:(ad===1?.82:.52);
      const prev=Number(card.dataset.heroDistance??d);
      const wraps=Math.abs(prev-d)>count/2-.5;

      if(wraps){
        card.classList.add('hero-teleport');
        card.style.transitionDuration='0s';
      }else{
        card.classList.remove('hero-teleport');
        card.style.transitionDuration=animate?'.82s':'0s';
      }

      card.dataset.heroDistance=String(d);
      card.style.setProperty('--hero-x',x+'px');
      card.style.setProperty('--hero-scale',String(scale));
      card.style.setProperty('--hero-opacity',String(opacity));
      card.style.zIndex=String(30-ad);
      card.classList.toggle('active',d===0);

      if(wraps){
        requestAnimationFrame(()=>{
          card.classList.remove('hero-teleport');
          card.style.transitionDuration='.82s';
        });
      }
    });
    updateFeatures();
  }

  function select(index){
    activeIndex=((index%count)+count)%count;
    layout(true);
    schedule();
  }

  function schedule(){
    clearTimeout(timer);
    if(reduce)return;
    timer=setTimeout(()=>{
      activeIndex=(activeIndex+1)%count;
      layout(true);
      schedule();
    },5200);
  }

  rail.addEventListener('click',e=>{
    const card=e.target.closest('.v4-show-card');
    if(!card)return;
    select(Number(card.dataset.index));
  });

  wrap.addEventListener('pointerenter',()=>clearTimeout(timer));
  wrap.addEventListener('pointerleave',schedule);
  addEventListener('resize',()=>layout(false),{passive:true});

  layout(false);
  requestAnimationFrame(()=>requestAnimationFrame(()=>layout(true)));
  schedule();
})();