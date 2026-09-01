import fs from 'fs';
import path from 'path';

export default function handler(req,res){
  try{
    const css=fs.readFileSync(path.join(process.cwd(),'promo-art.css'),'utf8');
    const match=css.match(/data:image\/webp;base64,([A-Za-z0-9+/=]+)/);
    if(!match) return res.status(404).send('Marco no encontrado');
    const image=Buffer.from(match[1],'base64');
    res.setHeader('Content-Type','image/webp');
    res.setHeader('Cache-Control','public, max-age=3600, s-maxage=31536000, immutable');
    return res.status(200).send(image);
  }catch(error){
    console.error(error);
    return res.status(500).send('No se pudo cargar el marco');
  }
}
