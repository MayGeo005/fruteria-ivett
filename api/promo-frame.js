import fs from 'fs';
import path from 'path';

export default function handler(req,res){
  try{
    const css=fs.readFileSync(path.join(process.cwd(),'promo-art.css'),'utf8');
    const matches=[...css.matchAll(/data:image\/webp;base64,([A-Za-z0-9+/=]+)/g)];
    if(!matches.length) return res.status(404).send('Marco no encontrado');
    const base64=matches.map(m=>m[1]).sort((a,b)=>b.length-a.length)[0];
    const image=Buffer.from(base64,'base64');
    res.setHeader('Content-Type','image/webp');
    res.setHeader('Cache-Control','no-store');
    return res.status(200).send(image);
  }catch(error){
    console.error(error);
    return res.status(500).send('No se pudo cargar el marco');
  }
}
