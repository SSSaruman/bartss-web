(() => {
  const root=document.querySelector('.v5-showcase');
  const media=[...document.querySelectorAll('.v5-media')];
  const next=document.getElementById('v5Next');
  const index=document.getElementById('v5Index');
  if(!root||!media.length)return;

  let active=0;
  let timer=0;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  function show(i){
    active=(i+media.length)%media.length;
    media.forEach((el,n)=>el.classList.toggle('active',n===active));
    root.dataset.scene=String(active);
    if(index)index.textContent=String(active+1).padStart(2,'0');
  }

  function schedule(){
    clearTimeout(timer);
    if(reduce)return;
    timer=setTimeout(()=>{
      show(active+1);
      schedule();
    },4200);
  }

  next?.addEventListener('click',()=>{
    show(active+1);
    schedule();
  });

  root.addEventListener('pointerenter',()=>clearTimeout(timer));
  root.addEventListener('pointerleave',schedule);

  show(0);
  schedule();
})();
