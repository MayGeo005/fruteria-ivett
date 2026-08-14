import { list, put, del } from '@vercel/blob';

const PREFIX='ivett-data/catalog-';

function cloudConfigured(){return Boolean(process.env.BLOB_READ_WRITE_TOKEN)}

export default async function handler(req,res){
  if(!cloudConfigured()) return res.status(503).json({ok:false,code:'CLOUD_NOT_CONFIGURED'});
  try{
    if(req.method==='GET'){
      const result=await list({prefix:PREFIX,limit:100});
      const blobs=[...(result.blobs||[])].sort((a,b)=>new Date(b.uploadedAt)-new Date(a.uploadedAt));
      if(!blobs.length) return res.status(200).json({ok:true,data:null});
      const r=await fetch(blobs[0].url,{cache:'no-store'});
      if(!r.ok) throw new Error('No se pudo leer el catálogo de la nube');
      const data=await r.json();
      return res.status(200).json({ok:true,data});
    }
    if(req.method==='POST'){
      const body=req.body||{};
      if(!body.data || typeof body.data!=='object') return res.status(400).json({ok:false,error:'Datos inválidos'});
      const previous=await list({prefix:PREFIX,limit:100});
      const blob=await put(`${PREFIX}${Date.now()}.json`,JSON.stringify(body),{
        access:'public',contentType:'application/json',addRandomSuffix:true,cacheControlMaxAge:60
      });
      const old=(previous.blobs||[]).map(x=>x.url).filter(Boolean);
      if(old.length) del(old).catch(()=>{});
      return res.status(200).json({ok:true,url:blob.url});
    }
    return res.status(405).json({ok:false,error:'Método no permitido'});
  }catch(error){
    console.error(error);
    return res.status(500).json({ok:false,error:error?.message||'Error de almacenamiento'});
  }
}
