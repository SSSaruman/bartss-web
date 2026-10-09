const scenarios = [
  {tag:'FROM ZERO TO SOMETHING',symbol:'✳',title:'Fikri gerçeğe dönüştürelim.',copy:'Henüz sadece bir düşünce olabilir. Onu birlikte tanımlar, tasarlar, prototipler ve insanların gerçekten kullanabileceği bir ürüne dönüştürürüz.',tags:'STRATEJİ / ÜRÜN / TASARIM / YAZILIM',subject:'Bir ürün fikrim var'},
  {tag:'FROM PRESENCE TO IMPACT',symbol:'↗',title:'Markanızı ileri taşıyalım.',copy:'Daha güçlü bir kimlik, daha etkileyici bir dijital varlık ve insanların hatırlayacağı deneyimler tasarlayalım. Görünür olmanın ötesine geçelim.',tags:'MARKA / DİJİTAL / İÇERİK / DENEYİM',subject:'Markamı büyütmek istiyorum'},
  {tag:'FROM REPETITION TO FLOW',symbol:'∞',title:'Tekrarı sisteme dönüştürelim.',copy:'Zaman alan işleri analiz edelim. Akıllı otomasyonlar, yapay zekâ destekli iş akışları ve özel araçlarla ekibinize daha fazla hareket alanı açalım.',tags:'OTOMASYON / AI / ENTEGRASYON / YAZILIM',subject:'İş süreçlerimi otomatikleştirmek istiyorum'},
  {tag:'FROM ORDINARY TO UNFORGETTABLE',symbol:'✺',title:'İnsanların hissedeceği bir şey yaratalım.',copy:'Etkileşimli web deneyimlerinden animasyona, 3D dünyalardan oyunlara kadar fikrinize kendine özgü bir dünya kuralım.',tags:'INTERACTIVE / MOTION / 3D / OYUN',subject:'Etkileyici bir dijital deneyim istiyorum'}
];
const buttons = [...document.querySelectorAll('.possibility-option')];
const panel = document.getElementById('solution-panel');
const contact = document.getElementById('contact-cta');
function selectScenario(index, focus=false){
  if(!Number.isInteger(index)||index<0||index>=scenarios.length)return;
  const s=scenarios[index];
  buttons.forEach((b,i)=>{const active=i===index;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
  document.getElementById('solution-tag').textContent=s.tag;
  document.getElementById('art-symbol').textContent=s.symbol;
  document.getElementById('solution-index').textContent=String(index+1).padStart(3,'0');
  document.getElementById('solution-title').textContent=s.title;
  document.getElementById('solution-copy').textContent=s.copy;
  document.getElementById('solution-tags').textContent=s.tags;
  const mail='mailto:hello@bartss.com?subject='+encodeURIComponent(s.subject+' — Bartss')+'&body='+encodeURIComponent('Merhaba Bartss,\n\nÜzerinde konuşmak istediğim konu:\n\n');
  contact.href=mail;
  document.getElementById('solution-cta').href='#start';
  if(focus)buttons[index].focus();
}
buttons.forEach((button,i)=>{
  button.addEventListener('click',()=>selectScenario(i));
  button.addEventListener('keydown',event=>{
    if(!['ArrowDown','ArrowRight','ArrowUp','ArrowLeft','Home','End'].includes(event.key))return;
    event.preventDefault();
    const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(i+(event.key==='ArrowUp'||event.key==='ArrowLeft'?-1:1)+buttons.length)%buttons.length;
    selectScenario(next,true);
  });
});
document.getElementById('year').textContent=String(new Date().getFullYear());
const revealNodes=document.querySelectorAll('.section-intro,.approach-grid,.proof-heading,.process-card');
if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches){
  const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}},{threshold:.08});
  document.body.classList.add('js-ready');revealNodes.forEach(node=>observer.observe(node));
}
if(matchMedia('(pointer:fine)').matches){
  const glow=document.querySelector('.cursor-glow');
  window.addEventListener('pointermove',event=>{glow.style.left=event.clientX+'px';glow.style.top=event.clientY+'px';glow.style.opacity='1';},{passive:true});
}
selectScenario(0);