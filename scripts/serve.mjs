// Dependency-free local launcher for the already built game. Binds loopback only.
import http from 'node:http';
import {createReadStream,existsSync,statSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const port=Number(process.env.ATC_PORT||4173);
if(!existsSync(resolve(root,'index.html'))){console.error('Build the game first with npm run build.');process.exit(1);}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.md':'text/plain; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.hdr':'application/octet-stream','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
  try{
    if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=resolve(root,'.'+(path==='/'?'/index.html':path));
    if(!file.startsWith(root+sep)||!existsSync(file)||!statSync(file).isFile()){res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    if(req.method==='HEAD')res.end();else createReadStream(file).pipe(res);
  }catch{res.writeHead(400);res.end('Bad request');}
}).listen(port,'127.0.0.1',()=>console.log(`Taoyuan Tower is ready: http://127.0.0.1:${port}\nKeep this window open while playing. Press Ctrl+C to stop.`)).on('error',error=>{
  if(error.code==='EADDRINUSE')console.error(`Port ${port} is already in use. Check http://127.0.0.1:${port} or set ATC_PORT to another port.`);
  else console.error(error.message);process.exitCode=1;
});
