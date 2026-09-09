(() => {
  const section=document.querySelector('#immersiveWork[data-motion="immersive-v4"]');
  if(!section) return;

  const sticky=section.querySelector('.immersive-sticky');
  const wall=section.querySelector('.mosaic-layer');
  const phone=section.querySelector('.phone-wrap');
  const copy=section.querySelector('.immersive-title');
  const note=section.querySelector('.scroll-note');
  const scenes=[...section.querySelectorAll('.phone-scene')];
  const cards=[...section.querySelectorAll('.mosaic-card')];
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
  const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
  const sceneWeight=(q,i,count)=>{
    if(count===1) return 1;
    const center=i/(count-1);
    const radius=.39;
    return smooth(1-Math.abs(q-center)/radius);
  };

  let raf=0;
  function render(){
    raf=0;
    if(!sticky||!wall||!phone) return;

    const rect=section.getBoundingClientRect();
    const max=Math.max(1,section.offsetHeight-innerHeight);
    const passed=clamp(-rect.top,0,max);
    const p=passed/max;

    // Main storytelling occupies 0..84%; final 16% is the handoff.
    const story=clamp(p/.84);
    const exit=smooth((p-.84)/.16);

    // Background wall continuously travels behind the fixed phone.
    const wallY=14-(story*132)-(exit*18);
    const wallScale=1+(story*.035);
    wall.style.setProperty('--wall-y',wallY.toFixed(2)+'vh');
    wall.style.setProperty('--wall-scale',wallScale.toFixed(4));
    wall.style.setProperty('--wall-card-opacity',(0.72+story*.18-exit*.12).toFixed(3));

    cards.forEach((card,i)=>{
      const phase=(i%3)*.07;
      const drift=(story-phase)*((i%2===0)?-18:14);
      const cardScale=.985+Math.min(1,story+phase)*.015;
      card.style.setProperty('--card-y',drift.toFixed(2)+'px');
      card.style.setProperty('--card-scale',cardScale.toFixed(4));
    });

    // Phone stays central during the story, then hands off upward at the end.
    const phoneY=-exit*18*innerHeight/100;
    const phoneScale=1-exit*.055;
    const phoneOpacity=1-exit*.18;
    phone.style.setProperty('--phone-y',phoneY.toFixed(2)+'px');
    phone.style.setProperty('--phone-scale',phoneScale.toFixed(4));
    phone.style.setProperty('--phone-opacity',phoneOpacity.toFixed(3));

    // Copy has its own layer and quietly leaves before the phone.
    if(copy){
      const copyExit=smooth((p-.70)/.18);
      copy.style.setProperty('--copy-y',(-copyExit*26).toFixed(2)+'px');
      copy.style.setProperty('--copy-opacity',(1-copyExit*.92).toFixed(3));
    }

    if(note){
      note.style.setProperty('--note-opacity',(Math.max(0,.55-story*.35-exit*.2)).toFixed(3));
      note.style.setProperty('--note-y',(-exit*12).toFixed(2)+'px');
    }

    // Three phone states blend continuously; no class-based hard cuts.
    scenes.forEach((scene,i)=>{
      const w=sceneWeight(story,i,scenes.length);
      const center=scenes.length===1?0:i/(scenes.length-1);
      const delta=story-center;
      const y=delta*-26;
      const child=clamp((w-.06)/.94);

      scene.classList.toggle('active',w>.02);
      scene.style.setProperty('--scene-opacity',w.toFixed(3));
      scene.style.setProperty('--scene-y',y.toFixed(2)+'px');
      scene.style.setProperty('--scene-scale',(.976+w*.024).toFixed(4));
      scene.style.setProperty('--scene-clip',((1-w)*10).toFixed(2)+'%');
      scene.style.setProperty('--child-opacity',child.toFixed(3));
      scene.style.setProperty('--child-y',((1-child)*12).toFixed(2)+'px');
    });
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