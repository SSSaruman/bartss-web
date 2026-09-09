(() => {
  const section=document.querySelector('#about[data-motion="team-collage-v1"]');
  if(!section) return;
  const person=section.querySelector('.team-person');
  if(!person) return;

  const io=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting) return;
      person.classList.add('in');
      io.disconnect();
    });
  },{threshold:.28});
  io.observe(section);
})();