const els=[...document.querySelectorAll('.section,.smart,.project,.service-grid article')];
els.forEach(el=>el.classList.add('reveal'));
const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in')}),{threshold:.12});
els.forEach(el=>io.observe(el));
const play=document.querySelector('.play');
play?.addEventListener('click',()=>{const r=document.querySelector('.showreel');r.classList.toggle('playing');play.textContent=r.classList.contains('playing')?'❚❚':'▶'});
window.addEventListener('scroll',()=>{const y=window.scrollY;document.querySelectorAll('.screen-card').forEach((el,i)=>el.style.translate=`0 ${y*(.025+i*.012)}px`)},{passive:true});