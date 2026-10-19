import {generateSuggestions} from './generate.js';
export const securityHeaders={
 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer',
 'Permissions-Policy':'geolocation=(self), camera=(), microphone=()',
 'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};
export const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{...securityHeaders,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
export async function api(request,pois,env={}){
 const url=new URL(request.url);
 if(url.pathname==='/api/health')return json({ok:true,poiCount:pois.length,generation:env.QADAM_PUBLIC_DEMO==='true'?'public-preview':env.GEMINI_API_KEY?'configured':'retrieval-template'});
 if(url.pathname!=='/api/generate')return json({error:'Not found'},404);
 if(request.method!=='POST')return json({error:'Method not allowed'},405);
 const origin=request.headers.get('origin');if(origin&&origin!==url.origin)return json({error:'Origin not allowed'},403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'JSON required'},415);
 if(Number(request.headers.get('content-length')||0)>8192)return json({error:'Request too large'},413);
 try{
  // Bound streaming bodies even when Content-Length is absent or incorrect.
  const reader=request.body?.getReader();let length=0,chunks=[];
  if(reader)while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>8192){await reader.cancel();return json({error:'Request too large'},413);}chunks.push(value);}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  const body=JSON.parse(new TextDecoder().decode(bytes));
  return json(await generateSuggestions(body,pois,env));
 }catch{return json({error:'Invalid request. Choose 1–3 valid places.'},400);}
}
