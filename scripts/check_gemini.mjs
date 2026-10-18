import {readFile} from 'node:fs/promises';
import {attachEvidence} from '../src/evidence.js';
import {generateSuggestions} from '../src/generate.js';
if(!process.env.GEMINI_API_KEY){console.error('Set GEMINI_API_KEY in .env, then run: node --env-file=.env scripts/check_gemini.mjs');process.exit(1);}
const pois=attachEvidence(JSON.parse(await readFile(new URL('../data/pois.json',import.meta.url),'utf8')),JSON.parse(await readFile(new URL('../data/evidence.json',import.meta.url),'utf8')));
const p=pois.find(p=>p.category==='cafe');
const r=await generateSuggestions({ids:[p.id],locale:'ru',context:{socket:true}},pois,process.env);
console.log(JSON.stringify({mode:r.mode,model:r.model||null,reason:r.reason||null,validSuggestionCount:r.suggestions.length},null,2));
if(r.mode!=='gemini-grounded')process.exitCode=1;
