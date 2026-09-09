(() => {
  const section=document.querySelector('#projects[data-motion="solution-gallery"]');
  if(!section) return;
  const cards=[...section.querySelectorAll('.solution-project')];
  cards.forEach((card,i)=>{
    card.style.setProperty('--delay',(i*90)+'ms');
    card.querySelectorAll('.solution-project-chain>div').forEach((row,j)=>{
      row.style.setProperty('--chain-delay',(220+i*70+j*72)+'ms');
    });
  });
  const io=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting) return;
      cards.forEach(card=>card.classList.add('in'));
      io.disconnect();
    });
  },{threshold:.28});
  io.observe(section);
})();