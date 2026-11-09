(function(){
  document.documentElement.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];

  /* intro veil — once per session */
  const veil=$('#veil'); let seen=false;
  try{seen=sessionStorage.getItem('ha-veil')==='1'}catch(e){}
  const dropVeil=()=>{veil.classList.add('gone');document.body.classList.add('loaded');try{sessionStorage.setItem('ha-veil','1')}catch(e){}};
  if(seen||reduce){veil.classList.add('gone');requestAnimationFrame(()=>document.body.classList.add('loaded'))}
  else{setTimeout(dropVeil,1900);$('#skip').addEventListener('click',dropVeil)}

  /* reveal on scroll: only elements below the first screen start hidden */
  let io;
  function setupReveal(root){
    if(io) io.disconnect();
    if(reduce||!('IntersectionObserver' in window)) return;
    io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.remove('pre');io.unobserve(e.target)}}),{rootMargin:'0px 0px -8% 0px'});
    $$('.rv,.unveil',root).forEach(el=>{
      el.classList.add('rv');
      const r=el.getBoundingClientRect();
      if(r.top>innerHeight*0.92){el.classList.add('pre');io.observe(el)} else el.classList.remove('pre');
    });
  }

  /* views */
  const views={home:$('#v-home'),dedan:$('#v-dedan'),'gift-box':$('#v-gift-box')};
  let current=null;
  function show(name,jump){
    if(!views[name]) name='home';
    if(name!==current){
      Object.entries(views).forEach(([k,v])=>v.hidden=k!==name);
      current=name; window.scrollTo(0,0);
      $$('[data-nav]').forEach(a=>{if(a.dataset.nav===name)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
      requestAnimationFrame(()=>{setupReveal(views[name]);measure();onScroll()});
    }
    if(jump){const t=document.getElementById(jump);if(t)setTimeout(()=>t.scrollIntoView({behavior:reduce?'auto':'smooth'}),60)}
  }
  function route(){show((location.hash||'#home').slice(1))}
  addEventListener('hashchange',route);
  document.addEventListener('click',e=>{
    const j=e.target.closest('[data-jump]');
    if(j){e.preventDefault();closeMenu();if(location.hash!=='#home'&&location.hash!==''){location.hash='home'}show('home',j.dataset.jump);return}
    const g=e.target.closest('[data-go]'); if(g){location.hash=g.dataset.go;return}
    const v=e.target.closest('[data-variant]'); if(v){pendingVariant=v.dataset.variant}
    if(e.target.closest('#menu a'))closeMenu();
  });

  /* menu */
  const menu=$('#menu'),mb=$('#menuBtn');
  function closeMenu(){menu.classList.remove('open');mb.setAttribute('aria-expanded','false');mb.textContent='Menu'}
  mb.addEventListener('click',()=>{const o=menu.classList.toggle('open');mb.setAttribute('aria-expanded',o);mb.textContent=o?'Close':'Menu'});

  /* scroll-driven effects */
  const nav=$('#nav'); let craft={}, unbox={};
  function measure(){
    const track=$('#craftTrack'),steps=$('#steps');
    const wide=innerWidth>760&&!reduce;
    if(track&&steps&&!views.home.hidden){
      const dist=Math.max(0,steps.scrollWidth-innerWidth+32);
      track.style.height=wide?(innerHeight+dist)+'px':'auto';
      craft={track,steps,dist,wide};
    }
    unbox={track:$('#unboxTrack'),closed:$('#boxClosed'),hots:$$('#boxStage .hot'),on:innerWidth>820&&!reduce};
  }
  const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
  let ticking=false;
  function onScroll(){
    nav.classList.toggle('scrolled',scrollY>8);
    if(reduce) return;
    // parallax
    $$('[data-parallax]').forEach(img=>{
      if(img.closest('.view')?.hidden) return;
      const box=img.closest('.band,.b-hero,.feature .ph')||img.parentElement;const r=box.getBoundingClientRect(); if(r.bottom<0||r.top>innerHeight) return;
      const p=(r.top+r.height/2-innerHeight/2)/innerHeight;
      img.style.transform=`translate3d(0,${(-p*parseFloat(img.dataset.parallax)*100).toFixed(2)}px,0)`;
    });
    // craft horizontal
    if(current==='home'&&craft.wide){
      const r=craft.track.getBoundingClientRect();
      const p=clamp(-r.top/(craft.track.offsetHeight-innerHeight||1));
      craft.steps.style.transform=`translate3d(${-p*craft.dist}px,0,0)`;
      $('#craftBar').style.width=(p*100)+'%';
    }
    if(current==='gift-box'){
      if(unbox.on&&unbox.track){
        const r=unbox.track.getBoundingClientRect();
        const p=clamp(-r.top/(unbox.track.offsetHeight-innerHeight||1));
        unbox.closed.style.opacity=1-clamp((p-.12)/.25);
        unbox.closed.style.transform=`scale(${1+clamp((p-.12)/.25)*.06})`;
        unbox.hots.forEach(h=>h.classList.toggle('on',p>=parseFloat(h.dataset.at)));
      }
      const b=$('#burn').getBoundingClientRect();
      const q=clamp((innerHeight*0.85-b.top)/(b.height+innerHeight*0.35));
      $('#left').style.width=((1-q)*100)+'%';
      $('#ember').style.left=(q*100)+'%';
      $('#mins').textContent=String(Math.round(q*60)).padStart(2,'0');
    }
  }
  addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(()=>{onScroll();ticking=false})}},{passive:true});
  addEventListener('resize',()=>{measure();onScroll()});

  /* product variants */
  const variants={
    box:{name:'Incense Gift Box',tag:'A blessing from the Tibetan plateau',sticks:62,
      imgs:[['boxopen','The open gift box'],['red','Gift box with two tubes on red'],['box','The gift box and its lid'],['tubes','Gold and black tubes'],['light','Lighting a stick in a lacquered bowl']],
      contains:[['Incense tubes','2 × 31 sticks'],['Hand-pinched ceramic holders','2'],['Ash card','1']],
      spec:[['Stick','Ø about 3 mm · length about 190 mm'],['Burn time','About 60 min per stick, in still air'],['Contents','2 tubes (31 sticks each), 2 ceramic holders, 1 ash card'],['Box size','260 × 260 × 65 mm'],['Shelf life','5 years']]},
    gold:{name:'Incense in a Tube · Gold',tag:'31 sticks in a gold tin',sticks:31,
      imgs:[['tubes','Gold and black tubes on a painted chest'],['gift','A gold tube passed from hand to hand'],['herbs','Gold tube with fresh herbs'],['light','Lighting a stick']],
      contains:[['Incense sticks','31'],['Gold tin tube','1']],
      spec:[['Stick','Ø about 3 mm · length about 190 mm'],['Burn time','About 60 min per stick, in still air'],['Contents','31 sticks'],['Tube size','35 × 200 × 35 mm'],['Shelf life','5 years']]},
    black:{name:'Incense in a Tube · Black',tag:'31 sticks in a black tin',sticks:31,
      imgs:[['tubes','Gold and black tubes on a painted chest'],['bamboo','Black tube on a bamboo mat'],['light','Lighting a stick']],
      contains:[['Incense sticks','31'],['Black tin tube','1']],
      spec:[['Stick','Ø about 3 mm · length about 190 mm'],['Burn time','About 60 min per stick, in still air'],['Contents','31 sticks'],['Tube size','35 × 200 × 35 mm'],['Shelf life','5 years']]}
  };
  let pendingVariant=null;
  const stage=$('#stage'),thumbs=$('#thumbs');
  function setImg(i){
    $$('img',stage).forEach((im,k)=>im.classList.toggle('on',k===i));
    $$('button',thumbs).forEach((b,k)=>b.setAttribute('aria-pressed',k===i));
  }
  function setVariant(key){
    const v=variants[key];
    $('#pName').textContent=v.name;$('#crumbName').textContent=v.name;$('#pTag').textContent=v.tag;$('#fSticks').textContent=v.sticks;
    stage.innerHTML=v.imgs.map(([f,a],i)=>`<img src="img/${f}.webp" alt="${a}"${i?' loading="lazy"':''}>`).join('');
    thumbs.innerHTML=v.imgs.map(([f,a],i)=>`<button type="button" aria-label="Show photo ${i+1}: ${a}" aria-pressed="false"><img src="img/${f}.webp" alt="" loading="lazy"></button>`).join('');
    $$('button',thumbs).forEach((b,i)=>b.addEventListener('click',()=>setImg(i)));
    $('#contains').innerHTML=v.contains.map(([a,b])=>`<li><span>${a}</span><span>${b}</span></li>`).join('');
    $('#specList').innerHTML=v.spec.map(([a,b])=>`<dt>${a}</dt><dd>${b}</dd>`).join('');
    requestAnimationFrame(()=>setImg(0));
  }
  $$('#opts input').forEach(r=>r.addEventListener('change',()=>setVariant(r.value)));
  setVariant('box');
  addEventListener('hashchange',()=>{if(location.hash==='#gift-box'&&pendingVariant){const r=document.getElementById('v-'+pendingVariant);if(r){r.checked=true;setVariant(pendingVariant)}pendingVariant=null}});

  /* forms (prototype: nothing is sent) */
  $('#signup').addEventListener('submit',e=>{
    e.preventDefault();const em=$('#email');
    if(!/^\S+@\S+\.\S+$/.test(em.value)){$('#signupNote').textContent='Please enter a valid email address, like name@example.com.';em.focus();return}
    $('#signupNote').textContent='Thank you. In this prototype, sign-ups are not stored yet.';em.value='';
  });
  const modal=$('#modal');let lastFocus=null;
  function openModal(title,eyebrow){lastFocus=document.activeElement;$('#mTitle').textContent=title;$('#mEyebrow').textContent=eyebrow;$('#mNote').textContent='';modal.classList.add('open');setTimeout(()=>$('#mName').focus(),50)}
  function closeModal(){modal.classList.remove('open');lastFocus&&lastFocus.focus()}
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-ask]'))openModal('Ask about this piece','Enquiry');
    const n=e.target.closest('[data-notify]');if(n)openModal('Tell me when it opens',n.dataset.notify);
    if(e.target.closest('[data-close]')||e.target===modal)closeModal();
  });
  addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))closeModal()});
  $('#askForm').addEventListener('submit',e=>{e.preventDefault();
    if(!/^\S+@\S+\.\S+$/.test($('#mEmail').value)){$('#mNote').textContent='Add your email so we can reply.';$('#mEmail').focus();return}
    $('#mNote').textContent='Received. Prototype only: messages are not sent yet.';});

  route();
})();
