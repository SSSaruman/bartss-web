import { chromium } from "playwright";
import fs from "node:fs/promises";

const out="artifacts/visual-qa";
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});

async function audit(name,width,height){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  const errors=[];
  page.on("pageerror",e=>errors.push("pageerror: "+e.message));
  page.on("console",m=>{ if(m.type()==="error") errors.push("console: "+m.text()); });
  await page.goto("http://127.0.0.1:4173/index.html",{waitUntil:"networkidle"});
  await page.waitForTimeout(1800);

  const metrics=await page.evaluate(()=>({
    overflow:document.documentElement.scrollWidth-window.innerWidth,
    scrollHeight:document.documentElement.scrollHeight,
    viewportHeight:innerHeight,
    brokenImages:[...document.images].filter(img=>img.complete && img.naturalWidth===0).map(img=>img.getAttribute("src"))
  }));
  if(metrics.overflow>3) errors.push("horizontal-overflow: "+metrics.overflow);
  if(metrics.brokenImages.length) errors.push("broken-images: "+metrics.brokenImages.join(", "));
  const screenCount=metrics.scrollHeight/metrics.viewportHeight;
  if(width>1100 && screenCount>8.2) errors.push("page-too-long: "+screenCount.toFixed(2)+" screens");
  if(width<=1100 && screenCount>13) errors.push("mobile-page-too-long: "+screenCount.toFixed(2)+" screens");

  const hero=page.locator(".v3-hero");
  if(await hero.count()) await hero.screenshot({path:`${out}/${name}-hero.png`});
  if(width<=1100){
    const centerDelta=await page.evaluate(()=>{
      const active=document.querySelector(".card-rail .show-card.active");
      if(!active) return 999;
      const r=active.getBoundingClientRect();
      return Math.abs((r.left+r.width/2)-innerWidth/2);
    });
    if(centerDelta>18) errors.push("mobile-active-not-centered: "+centerDelta.toFixed(1));
  }

  if(width>1100){
    await page.evaluate(()=>{
      const cards=[...document.querySelectorAll('.card-rail .show-card[data-index="4"]')];
      const center=innerWidth/2;
      const target=cards.reduce((best,card)=>{
        const r=card.getBoundingClientRect();
        const d=Math.abs((r.left+r.width/2)-center);
        return !best||d<best.d?{card,d}:best;
      },null)?.card;
      if(target){
        target.dataset.qaClicked="1";
        target.click();
      }
    });
    const activeTimeline=[];
    for(let i=0;i<7;i++){
      await page.waitForTimeout(120);
      activeTimeline.push(await page.evaluate(()=>document.querySelector('.card-rail .show-card.active')?.dataset.index||null));
    }
    const active=activeTimeline[activeTimeline.length-1];
    if(active!=="4") errors.push("hero-active-mismatch: expected 4 got "+active);
    if(activeTimeline.some(v=>v!=="4")) errors.push("hero-active-changed-during-focus: "+activeTimeline.join(","));

    const exactClickedStayedActive=await page.evaluate(()=>{
      const clicked=document.querySelector('.card-rail .show-card[data-qa-clicked="1"]');
      return !!clicked && clicked.classList.contains("active");
    });
    if(!exactClickedStayedActive) errors.push("hero-clicked-dom-card-replaced");

    const heroLayout=await page.evaluate(()=>{
      const activeEl=document.querySelector('.card-rail .show-card.active');
      if(!activeEl) return null;
      const all=[...document.querySelectorAll('.card-rail .show-card')];
      const ar=activeEl.getBoundingClientRect();
      const base=all.find(el=>el!==activeEl && el.dataset.index!==activeEl.dataset.index);
      const br=base?.getBoundingClientRect();
      const ordered=all
        .map(el=>({el,r:el.getBoundingClientRect()}))
        .filter(x=>x.r.right>0 && x.r.left<innerWidth)
        .sort((a,b)=>a.r.left-b.r.left);
      const pos=ordered.findIndex(x=>x.el===activeEl);
      const left=pos>0?ordered[pos-1].r:null;
      const right=pos>=0&&pos<ordered.length-1?ordered[pos+1].r:null;
      return {
        activeWidth:ar.width,
        baseWidth:br?.width||0,
        leftGap:left?ar.left-left.right:999,
        rightGap:right?right.left-ar.right:999
      };
    });
    if(!heroLayout) errors.push("hero-layout-missing");
    else{
      if(heroLayout.activeWidth < heroLayout.baseWidth*1.12) errors.push("hero-active-not-larger: "+heroLayout.activeWidth.toFixed(1)+" vs "+heroLayout.baseWidth.toFixed(1));
      if(heroLayout.leftGap < 18 || heroLayout.rightGap < 18) errors.push("hero-card-overlap: "+heroLayout.leftGap.toFixed(1)+"/"+heroLayout.rightGap.toFixed(1));
    }
  }

  await page.locator("#menuTrigger").click();
  await page.waitForTimeout(450);
  await page.screenshot({path:`${out}/${name}-menu.png`,fullPage:false});
  await page.locator("#menuClose").click();

  await page.locator("#work").scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  await page.locator("#work").screenshot({path:`${out}/${name}-work.png`});

  await page.locator("#systemsHub").scrollIntoViewIfNeeded();
  await page.waitForTimeout(650);
  await page.locator("#systemsHub").screenshot({path:`${out}/${name}-systems.png`});

  await page.locator("#contact").scrollIntoViewIfNeeded();
  await page.waitForTimeout(450);
  const contactVisible=await page.evaluate(()=>{
    const h=document.querySelector("#contact h2");
    if(!h) return false;
    const r=h.getBoundingClientRect(),cs=getComputedStyle(h);
    return r.width>1&&r.height>1&&Number(cs.opacity)>.2&&cs.visibility!=="hidden";
  });
  if(!contactVisible) errors.push("contact-heading-hidden");
  await page.locator("#contact").screenshot({path:`${out}/${name}-contact.png`});

  const rectChecks=await page.evaluate(()=>{
    const selectors=[".v3-section-head",".case-card",".process-grid",".system-card",".v3-fit",".contact-grid"];
    const bad=[];
    for(const sel of selectors){
      for(const el of document.querySelectorAll(sel)){
        const r=el.getBoundingClientRect();
        if(r.width<1||r.height<1) bad.push(sel+": zero-size");
        if(r.left < -4 || r.right > innerWidth+4) bad.push(sel+": viewport spill");
      }
    }
    return bad;
  });
  errors.push(...rectChecks);
  await page.close();
  return errors;
}

const results={
  desktop:await audit("desktop",1440,1000),
  mobile:await audit("mobile",390,844)
};
await fs.writeFile(`${out}/results.json`,JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
await browser.close();
if(results.desktop.length||results.mobile.length) process.exitCode=1;
