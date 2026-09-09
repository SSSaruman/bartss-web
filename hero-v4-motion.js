(() => {
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce)return;

  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
  const lerp=(a,b,t)=>a+(b-a)*t;

  const stageSection=document.querySelector('#motionManifesto[data-motion="hightouch-stage"]');
  const phoneSection=document.querySelector('#immersiveWork[data-motion="immersive-v4"]');
  const tabletSection=document.querySelector('#tabletExperience[data-motion="continuous-page"]');

  [stageSection,phoneSection,tabletSection].filter(Boolean).forEach(section=>{
    section.setAttribute('data-motion-director','');
  });

  const stage=stageSection ? {
    section:stageSection,
    window:stageSection.querySelector('.stage-window'),
    cards:[...stageSection.querySelectorAll('.stage-card')],
    statusLabel:stageSection.querySelector('.stage-status span'),
    statusIndex:stageSection.querySelector('.stage-status b'),
    lastActive:-1
  } : null;

  const phone=phoneSection ? {
    section:phoneSection,
    sticky:phoneSection.querySelector('.immersive-sticky'),
    wall:phoneSection.querySelector('.mosaic-layer'),
    device:phoneSection.querySelector('.phone-wrap'),
    copy:phoneSection.querySelector('.immersive-title'),
    note:phoneSection.querySelector('.scroll-note'),
    scenes:[...phoneSection.querySelectorAll('.phone-scene')],
    cards:[...phoneSection.querySelectorAll('.mosaic-card')]
  } : null;

  const tablet=tabletSection ? {
    section:tabletSection,
    page:tabletSection.querySelector('#v4TabletPage'),
    screen:tabletSection.querySelector('.v4-tablet-screen'),
    steps:[...tabletSection.querySelectorAll('.v4-decision-steps span')],
    blocks:[...tabletSection.querySelectorAll('.v4-page-block')],
    boxes:[...tabletSection.querySelectorAll('.v4-random-box')],
    floats:[...tabletSection.querySelectorAll('.tablet-float')],
    progress:tabletSection.querySelector('.tablet-progress i')
  } : null;

  if(tablet){
    tablet.boxes.forEach((box,i)=>{
      const delay=((i*137)%410)+40;
      box.style.setProperty('--box-delay',delay+'ms');
    });
  }

  function sectionProgress(section){
    const rect=section.getBoundingClientRect();
    const travel=Math.max(1,section.offsetHeight-innerHeight);
    return clamp(-rect.top/travel);
  }

  function setHandoff(section,p){
    const entry=smooth(clamp(p/.12));
    const exit=smooth(clamp((p-.86)/.14));
    section.style.setProperty('--director-progress',p.toFixed(4));
    section.style.setProperty('--handoff-in',entry.toFixed(4));
    section.style.setProperty('--handoff-out',exit.toFixed(4));
  }

  function renderStage(){
    if(!stage||!stage.window)return;
    const p=sectionProgress(stage.section);
    setHandoff(stage.section,p);
    const q=smooth(clamp((p-.07)/.86));
    const focus=q*(stage.cards.length-1);
    const active=Math.round(focus);
    const stageW=stage.window.clientWidth;
    const spacing=Math.min(stageW*.16,260);

    stage.cards.forEach((card,i)=>{
      const d=i-focus;
      const ad=Math.abs(d);
      const depth=clamp(ad/2.6);
      card.style.setProperty('--x',(d*spacing).toFixed(2)+'px');
      card.style.setProperty('--y',lerp(0,22,depth).toFixed(2)+'px');
      card.style.setProperty('--scale',lerp(1,.73,depth).toFixed(4));
      card.style.setProperty('--rotate',(d*-.95).toFixed(2)+'deg');
      card.style.setProperty('--opacity',lerp(1,.34,clamp((ad-1.05)/2.5)).toFixed(3));
      card.style.setProperty('--blur',lerp(0,2.2,clamp((ad-1.45)/2.5)).toFixed(2)+'px');
      card.style.zIndex=String(30-Math.round(ad*4));
      card.classList.toggle('is-focus',i===active);
    });

    if(active!==stage.lastActive){
      stage.lastActive=active;
      const labels=['BRAND CONTEXT','PRODUCT CONTEXT','MOTION CONTEXT','AI CONTEXT','SYSTEM CONTEXT'];
      if(stage.statusLabel)stage.statusLabel.textContent=labels[active]||'CONTEXT';
      if(stage.statusIndex)stage.statusIndex.textContent=String(active+1).padStart(2,'0')+' / '+String(stage.cards.length).padStart(2,'0');
    }
  }

  function sceneWeight(q,i,count){
    if(count===1)return 1;
    const center=i/(count-1);
    const radius=.38;
    return smooth(1-Math.abs(q-center)/radius);
  }

  function renderPhone(){
    if(!phone||!phone.wall||!phone.device)return;
    const p=sectionProgress(phone.section);
    setHandoff(phone.section,p);
    const story=clamp(p/.86);
    const exit=smooth(clamp((p-.86)/.14));

    const wallY=18-story*150-exit*16;
    const wallScale=1+story*.045;
    phone.wall.style.setProperty('--wall-y',wallY.toFixed(2)+'vh');
    phone.wall.style.setProperty('--wall-scale',wallScale.toFixed(4));
    phone.wall.style.setProperty('--wall-card-opacity',(0.70+story*.22-exit*.14).toFixed(3));

    phone.cards.forEach((card,i)=>{
      const dir=i%2===0?-1:1;
      const band=(i%4)*.045;
      const drift=(story-band)*dir*(18+(i%3)*5);
      card.style.setProperty('--card-y',drift.toFixed(2)+'px');
      card.style.setProperty('--card-scale',(.98+story*.025).toFixed(4));
    });

    phone.device.style.setProperty('--phone-y',(-exit*innerHeight*.18).toFixed(2)+'px');
    phone.device.style.setProperty('--phone-scale',(1-exit*.06).toFixed(4));
    phone.device.style.setProperty('--phone-opacity',(1-exit*.22).toFixed(3));

    if(phone.copy){
      const copyExit=smooth(clamp((p-.68)/.18));
      phone.copy.style.setProperty('--copy-y',(-copyExit*34).toFixed(2)+'px');
      phone.copy.style.setProperty('--copy-opacity',(1-copyExit*.96).toFixed(3));
    }
    if(phone.note){
      phone.note.style.setProperty('--note-opacity',Math.max(0,.58-story*.38-exit*.2).toFixed(3));
      phone.note.style.setProperty('--note-y',(-exit*14).toFixed(2)+'px');
    }

    phone.scenes.forEach((scene,i)=>{
      const w=sceneWeight(story,i,phone.scenes.length);
      const center=phone.scenes.length===1?0:i/(phone.scenes.length-1);
      const delta=story-center;
      scene.classList.toggle('active',w>.025);
      scene.style.setProperty('--scene-opacity',w.toFixed(3));
      scene.style.setProperty('--scene-y',(delta*-30).toFixed(2)+'px');
      scene.style.setProperty('--scene-scale',(.97+w*.03).toFixed(4));
      scene.style.setProperty('--scene-clip',((1-w)*12).toFixed(2)+'%');
    });
  }

  function renderTablet(){
    if(!tablet||!tablet.page||!tablet.screen)return;
    const p=sectionProgress(tablet.section);
    setHandoff(tablet.section,p);

    const travel=Math.max(0,tablet.page.scrollHeight-tablet.screen.clientHeight);
    tablet.page.style.setProperty('--page-y',(-travel*p).toFixed(2)+'px');

    const active=Math.min(tablet.steps.length-1,Math.floor(clamp(p*.9999)*tablet.steps.length));
    tablet.steps.forEach((el,i)=>el.classList.toggle('active',i===active));
    tablet.blocks.forEach((block,i)=>{
      const live=Math.abs(i-active)<=1;
      block.querySelectorAll('.v4-random-box').forEach(el=>el.classList.toggle('v4-box-live',live));
    });

    tablet.floats.forEach((el,i)=>{
      const phase=p*Math.PI*2+(i*1.13);
      const ampX=7+(i%3)*2;
      const ampY=8+(i%2)*3;
      el.style.setProperty('--float-x',(Math.sin(phase)*ampX).toFixed(2)+'px');
      el.style.setProperty('--float-y',(Math.cos(phase*.82)*ampY).toFixed(2)+'px');
      el.style.setProperty('--float-r',(Math.sin(phase*.56)*.8).toFixed(2)+'deg');
    });

    if(tablet.progress)tablet.progress.style.transform='scaleX('+Math.max(.035,p)+')';
  }

  let raf=0;
  function render(){
    raf=0;
    renderStage();
    renderPhone();
    renderTablet();
  }
  function request(){
    if(!raf)raf=requestAnimationFrame(render);
  }

  addEventListener('scroll',request,{passive:true});
  addEventListener('resize',request,{passive:true});
  request();
})();