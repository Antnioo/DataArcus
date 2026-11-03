// Bound the upstream in-process plan registry by using fresh Node processes.
// These are deterministic script workers, not agents. All output stays under the lab.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
export async function runCampaign({here,out,repo,seed,count,evidence}) {
 const started=performance.now(),scratch=fs.mkdtempSync(path.join(out,'.batches-'));
 const jobs=[];for(let at=0;at<count;at+=250)jobs.push({index:jobs.length,seed:(seed+at)>>>0,count:Math.min(250,count-at),done:0});
 let next=0;const completed=[];
 function progress(){const o={attempted:jobs.reduce((n,j)=>n+j.done,0),requested:count,completedBatches:completed.length,totalBatches:jobs.length,elapsedSeconds:(performance.now()-started)/1000};fs.writeFileSync(path.join(out,'progress.json'),JSON.stringify(o,null,2)+'\n');console.log(JSON.stringify(o));}
 async function worker(){while(next<jobs.length){const j=jobs[next++],dir=path.join(scratch,'batch-'+j.index);fs.mkdirSync(dir);
  await new Promise((resolve,reject)=>{const args=[path.join(here,'fuzz.mjs'),repo,'--seed',String(j.seed),'--cases',String(j.count),'--out',dir,'--evidence-ref',evidence,'--worker'];if(j.index!==jobs.length-1)args.push('--skip-evidence');const child=spawn(process.execPath,args,{stdio:['ignore','pipe','pipe']});let line='';child.stdout.on('data',b=>{line+=b.toString();const ls=line.split('\n');line=ls.pop();for(const l of ls){let p;try{p=JSON.parse(l);}catch{continue;}if(p.attempted){j.done=p.attempted;progress();}}});child.stderr.on('data',()=>{});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('Batch '+j.index+' failed with exit '+code)));});
  j.done=j.count;completed.push(j);progress();
 }}
 await Promise.all([worker(),worker()]);
 const inputs=jobs.map(j=>({j,dir:path.join(scratch,'batch-'+j.index),s:JSON.parse(fs.readFileSync(path.join(scratch,'batch-'+j.index,'stats.json'),'utf8'))}));
 const result=structuredClone(inputs[0].s);result.seed=seed;result.requestedGenerated=count;result.generated=0;result.realShapes=0;result.coverage={};result.kindCounts={};result.pageSizes={};result.tooltipPages=0;result.backgroundPages=0;result.errors=[];result.occurrences=[];result.baselineErrorCodes={};result.normalizedRepeatFailures=0;result.normalizedRenameFailures=0;result.approvalBindingFailures=0;result.cpuSeconds=0;result.evaluations=0;result.validatorCalls=0;result.shrinkChecks=0;result.cacheHits=0;result.evidenceManifest=[];result.batches=[];
 for(const p of Object.keys(result.properties))result.properties[p]={run:0,failed:0,cases:[],failureKinds:{}};
 const saved=new Map(),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
 for(const {j,dir,s} of inputs){
  const renames=new Map();
  for(const [prop,ps] of Object.entries(s.properties)){
   const dst=result.properties[prop];dst.run+=ps.run;dst.failed+=ps.failed;for(const[k,n]of Object.entries(ps.failureKinds))dst.failureKinds[k]=(dst.failureKinds[k]||0)+n;
   for(const old of ps.cases){const key=prop+':'+hash(fs.readFileSync(path.join(dir,old,'spec.json')));let to=saved.get(key);
    if(!to){to='cases/'+prop+'-'+(dst.cases.length+1);saved.set(key,to);dst.cases.push(to);fs.cpSync(path.join(dir,old),path.join(out,to),{recursive:true});const why=path.join(out,to,'why.md');fs.writeFileSync(why,fs.readFileSync(why,'utf8').replaceAll(old+'/spec.json',to+'/spec.json'));}
    renames.set(old,to);
   }
  }
  result.occurrences.push(...s.occurrences.map(x=>({...x,case:renames.get(x.case)})));result.errors.push(...s.errors);
  for(const k of ['generated','realShapes','tooltipPages','backgroundPages','normalizedRepeatFailures','normalizedRenameFailures','approvalBindingFailures','cpuSeconds','evaluations','validatorCalls','shrinkChecks','cacheHits'])result[k]+=s[k];
  for(const k of ['kindCounts','pageSizes','baselineErrorCodes','coverage'])for(const[n,v]of Object.entries(s[k]))result[k][n]=(result[k][n]||0)+v;
  if(s.evidenceManifest?.length)result.evidenceManifest=s.evidenceManifest;
  result.batches.push({index:j.index,seed:j.seed,generated:s.generated,realShapes:s.realShapes,cpuSeconds:s.cpuSeconds,wallSeconds:s.wallSeconds});
 }
 result.wallSeconds=(performance.now()-started)/1000;delete result.lastCaseSeconds;result.workerProcesses=2;result.batchSize=250;
 fs.writeFileSync(path.join(out,'stats.json'),JSON.stringify(result,null,2)+'\n');fs.rmSync(scratch,{recursive:true,force:true});console.log(JSON.stringify({generated:result.generated,realShapes:result.realShapes,cpuSeconds:result.cpuSeconds,wallSeconds:result.wallSeconds,errors:result.errors.length}));
}
