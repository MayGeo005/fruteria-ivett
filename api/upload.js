import { put } from '@vercel/blob';

function safeName(s='producto'){
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-+|-+$/g,'').toLowerCase()||'producto';
}

export default async function handler(req,res){
  if(!process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ok:false,code:'CLOUD_NOT_CONFIGURED'});
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'Método no permitido'});
  try{
    const {name,dataUrl}=req.body||{};
    const m=String(dataUrl||'').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if(!m) return res.status(400).json({ok:false,error:'Imagen inválida'});
    const mime=m[1];
    const buffer=Buffer.from(m[2],'base64');
    if(buffer.length>4*1024*1024) return res.status(413).json({ok:false,error:'Imagen demasiado grande'});
    const ext=mime.includes('png')?'png':mime.includes('webp')?'webp':'jpg';
    const blob=await put(`ivett-products/${safeName(name)}-${Date.now()}.${ext}`,buffer,{
      access:'public',contentType:mime,addRandomSuffix:true,cacheControlMaxAge:31536000
    });
    return res.status(200).json({ok:true,url:blob.url});
  }catch(error){
    console.error(error);
    return res.status(500).json({ok:false,error:error?.message||'No se pudo subir la imagen'});
  }
}
