const menuTrigger = document.getElementById("menuTrigger");
const menuPanel = document.getElementById("menuPanel");
const menuClose = document.getElementById("menuClose");
const cards = [...document.querySelectorAll(".show-card")];
const rail = document.getElementById("cardRail");
const featureButtons = [...document.querySelectorAll(".feature-stack button")];

function openMenu(){
  document.body.classList.add("menu-open");
  menuPanel.classList.add("open");
  menuPanel.setAttribute("aria-hidden","false");
  menuTrigger.setAttribute("aria-expanded","true");
}
function closeMenu(){
  document.body.classList.remove("menu-open");
  menuPanel.classList.remove("open");
  menuPanel.setAttribute("aria-hidden","true");
  menuTrigger.setAttribute("aria-expanded","false");
}
menuTrigger.addEventListener("click", openMenu);
menuClose.addEventListener("click", closeMenu);
document.addEventListener("keydown", e => e.key === "Escape" && closeMenu());

document.addEventListener("pointerdown", e => {
  if(!document.body.classList.contains("menu-open")) return;
  if(menuPanel.contains(e.target) || menuTrigger.contains(e.target)) return;
  closeMenu();
});

let activeIndex = 2;
function setActive(index){
  activeIndex = Math.max(0, Math.min(cards.length - 1, index));
  cards.forEach((card,i)=>card.classList.toggle("active", i===activeIndex));

  if(window.innerWidth > 1100){
    const card = cards[activeIndex];
    const cardCenter = card.offsetLeft + card.offsetWidth/2;
    const viewportCenter = window.innerWidth/2;
    const matrix = getComputedStyle(rail).transform;
    const currentX = matrix === "none" ? 0 : new DOMMatrixReadOnly(matrix).m41;
    const base = rail.getBoundingClientRect().left - currentX;
    const shift = viewportCenter - (base + cardCenter);
    rail.style.transform = `translateX(${shift}px)`;
  }

  featureButtons.forEach((btn,i)=>{
    const logical = (i + activeIndex) % featureButtons.length;
    btn.style.transform = `translateX(-50%) translateY(${logical === 0 ? -2 : 0}px)`;
  });
}
cards.forEach((card,i)=> card.addEventListener("click",()=>setActive(i)));

let wheelLock = false;
window.addEventListener("wheel", e => {
  if(window.innerWidth <= 1100 || document.body.classList.contains("menu-open")) return;
  const rect = rail.getBoundingClientRect();
  if(rect.bottom < 0 || rect.top > window.innerHeight) return;
  if(Math.abs(e.deltaY) < 18 || wheelLock) return;
  wheelLock = true;
  setActive(activeIndex + (e.deltaY > 0 ? 1 : -1));
  setTimeout(()=>wheelLock=false, 650);
},{passive:true});

let featureOffset = 0;
setInterval(()=>{
  featureOffset = (featureOffset + 1) % featureButtons.length;
  featureButtons.forEach((btn,i)=>{
    const order = (i - featureOffset + featureButtons.length) % featureButtons.length;
    const tops = [0,28,60,95,133,175];
    const widths = [180,215,250,286,322,360];
    const opacities = [.46,.55,.62,.70,.78,.88];
    btn.style.top = `${tops[order]}px`;
    btn.style.width = `${widths[order]}px`;
    btn.style.opacity = opacities[order];
  });
}, 1600);

window.addEventListener("resize",()=>setActive(activeIndex));
requestAnimationFrame(()=>setActive(2));