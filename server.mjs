import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {attachEvidence} from './src/evidence.js';
import {api,securityHeaders} from './src/http.js';
const root=path.dirname(fileURLToPath(import.meta.url));
const pois=attachEvidence(JSON.parse(await readFile(path.join(root,'data/pois.json'),'utf8')),JSON.parse(await readFile(path.join(root,'data/evidence.json'),'utf8')));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://'+(req.headers.host||'localhost'));
  if(url.pathname.startsWith('/api/')){
   const request=new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:req,duplex:'half'}:{})});
   const response=await api(request,pois,process.env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());return;
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  const pathname=decodeURIComponent(url.pathname);
  let relative=pathname==='/'?'public/index.html':pathname.startsWith('/data/')||pathname.startsWith('/src/')?pathname.slice(1):'public'+pathname;
  // Only ship required public datasets and modules; never serve raw files or credentials.
  if(relative.startsWith('data/')&&!['data/pois.json','data/map.json','data/metadata.json','data/evidence.json'].includes(relative))throw new Error('Not found');
  if(relative.startsWith('src/')&&!['src/engine.js','src/actions.js','src/evidence.js'].includes(relative))throw new Error('Not found');
  const file=path.resolve(root,relative);if(!file.startsWith(root+path.sep)||relative.includes('..'))throw new Error('Not found');
  const content=await readFile(file);res.writeHead(200,{...securityHeaders,'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:content);
 }catch{res.writeHead(404,securityHeaders);res.end('Not found');}
});
const port=Number(process.env.PORT||8787);server.listen(port,'127.0.0.1',()=>console.log(`Qadam local demo: http://127.0.0.1:${port}`));
