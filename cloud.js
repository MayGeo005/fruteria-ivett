(()=>{
  const localSave=save,localSaveI=saveI;
  const localPromoSave=typeof savePromo==='function'?savePromo:null;
  const localDataSnapshot=JSON.parse(JSON.stringify(data));
  const localImageSnapshot={...over};
  const localPromoSnapshot=typeof promo!=='undefined'?JSON.parse(JSON.stringify(promo)):null;
  let cloudReady=false,saveTimer=null,saving=false,pending=false;

  function cloudBadge(text,ok){
    let b=document.getElementById('cloudBadge');
    if(!b){b=document.createElement('div');b.id='cloudBadge';b.style.cssText='font-size:12px;font-weight:800;padding:7px 10px;border-radius:9px;margin-right:auto';document.querySelector('.top')?.prepend(b)}
    b.textContent=text;b.style.background=ok?'#e4f5e9':'#fff3dc';b.style.color=ok?'#075a2a':'#8a5700';
  }
  async function uploadDataUrl(name,dataUrl){
    const r=await fetch('/api/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,dataUrl})});
    if(!r.ok) throw new Error('No se pudo subir '+name);
    const j=await r.json();return j.url;
  }
  async function migrateImages(){
    const entries=Object.entries(over).filter(([,v])=>typeof v==='string'&&v.startsWith('data:image/'));
    if(!entries.length)return;
    cloudBadge(`☁ Migrando ${entries.length} foto(s)…`,false);
    for(const [name,url] of entries){
      try{over[name]=await uploadDataUrl(name,url);localStorage.setItem('ivettImgs',JSON.stringify(over));render();if(typeof promoRender==='function')promoRender()}catch(e){console.error(e)}
    }
  }
  async function pushCloud(){
    if(!cloudReady){pending=true;return}
    if(saving){pending=true;return}
    saving=true;pending=false;
    try{
      await migrateImages();
      const payload={data,images:over,promo:typeof promo!=='undefined'?promo:null,updatedAt:new Date().toISOString()};
      const r=await fetch('/api/catalog',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if(!r.ok)throw new Error('No se pudo guardar en nube');
      cloudBadge('☁ Nube sincronizada',true);
    }catch(e){console.error(e);cloudBadge('☁ Sin conexión a nube',false)}finally{saving=false;if(pending)setTimeout(pushCloud,250)}
  }
  function scheduleCloud(){clearTimeout(saveTimer);saveTimer=setTimeout(pushCloud,700)}

  save=function(){localSave();scheduleCloud()};
  saveI=function(){const ok=localSaveI();if(ok)scheduleCloud();return ok};
  if(localPromoSave)savePromo=function(){localPromoSave();scheduleCloud()};

  async function initCloud(){
    cloudBadge('☁ Conectando…',false);
    try{
      const r=await fetch('/api/catalog',{cache:'no-store'});
      if(r.status===503){cloudBadge('☁ Activa almacenamiento en Vercel',false);return}
      if(!r.ok)throw new Error('Error al consultar nube');
      const j=await r.json();cloudReady=true;
      const remote=j.data;
      if(remote&&remote.data){
        data=remote.data;
        over={...(remote.images||{}),...localImageSnapshot};
        if(typeof promo!=='undefined'&&remote.promo)promo=remote.promo;
      }else{
        data=localDataSnapshot;over={...localImageSnapshot};
        if(typeof promo!=='undefined'&&localPromoSnapshot)promo=localPromoSnapshot;
      }
      localStorage.setItem('ivettData',JSON.stringify(data));
      localStorage.setItem('ivettImgs',JSON.stringify(over));
      if(typeof promo!=='undefined')localStorage.setItem('ivettPromo',JSON.stringify(promo));
      render();if(typeof promoRender==='function')promoRender();
      await migrateImages();await pushCloud();
    }catch(e){console.error(e);cloudBadge('☁ Modo local',false)}
  }
  initCloud();
})();
