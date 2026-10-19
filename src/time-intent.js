/** Bounded EN/RU/KK temporal grammar. Unconsumed time cues require explicit confirmation. */
const words={one:1,a:1,an:1,two:2,three:3,four:4,five:5,ten:10,fifteen:15,twenty:20,thirty:30,forty:40,fortyfive:45,sixty:60,один:1,одна:1,одну:1,два:2,две:2,три:3,четыре:4,пять:5,десять:10,пятнадцать:15,двадцать:20,тридцать:30,сорок:40,бір:1,екі:2,үш:3,төрт:4,бес:5,он:10,жиырма:20,отыз:30,қырық:40,алпыс:60};
const amount='(?<![\\p{L}\\p{N}])(?:\\d+(?:[.,]\\d+)?|(?:'+Object.keys(words).sort((a,b)=>b.length-a.length).join('|')+')(?=\\s))';
const hours='(?:hours?|hrs?|h|час(?:а|ов)?|сағат)',minutes='(?:minutes?|mins?|m|минут(?:а|ы|у)?|мин)';
const boundary='(?![\\p{L}\\p{N}])';
const value=x=>words[x.toLowerCase()]??Number(x.replace(',','.'));
export function parseTimeIntent(query){
 let rest=String(query),budgetPhrase,returnByClock,maxWalk,budget,budgetRange;const issues=[];
 if(/(?:^|\s)-\s*\d+\s*(?:min|hour|h\b|m\b|мин|час|сағат)/iu.test(query))issues.push('negative');
 const take=(re,fn)=>{rest=rest.replace(re,(...args)=>{fn(args);return ' '.repeat(args[0].length);});};
 // Explicit deadlines, including Kazakh clock-before-verb word order.
 const clocks=[];
 take(/(?:back by|return by|вернуться\s+(?:к|до)|обратно\s+к|қайту)\s*(\d{1,2}:\d{2})|(?:сағат\s*)?(\d{1,2}:\d{2})(?:-?(?:ге|ке|ға|қа))?\s+дейін\s+(?:қайту|оралу)/giu,a=>clocks.push(a[1]||a[2]));
 if(clocks.length===1&&/^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(clocks[0]))returnByClock=clocks[0];else if(clocks.length)issues.push('deadline');
 // Walking caps are consumed before total budgets.
 const walkRE=new RegExp('(?:within|no more than|maximum|max|не дальше|не более|максимум|до)\\s*('+amount+')\\s*'+minutes+'\\s*(?:on foot|walk(?:ing)?|пешком)|(?:walk(?:ing)?|пешком|жаяу)\\s*(?:for|within|up to|не более|до)?\\s*('+amount+')\\s*'+minutes+boundary,'giu');
 take(walkRE,a=>{const n=value(a[1]||a[2]);if(maxWalk!==undefined||n<1||n>60)issues.push('walking');else maxWalk=n;});
 const durations=[];const add=(a,n)=>durations.push({phrase:a[0],minutes:Math.round(n)});
 take(/(?<![\p{L}\p{N}])(\d+)h\s*(\d{1,2})m(?![\p{L}\p{N}])/giu,a=>add(a,Number(a[1])*60+Number(a[2])));
 take(/(?:one|an?)\s+and\s+(?:a\s+)?half\s+hours?|полтора\s+часа|бір\s+жарым\s+сағат/giu,a=>add(a,90));
 take(/half\s+(?:an?\s+)?hour|полчаса|жарты\s+сағат/giu,a=>add(a,30));
 take(/(?:a\s+)?quarter\s+(?:of\s+)?(?:an?\s+)?hour|четверть\s+часа/giu,a=>add(a,15));
 take(new RegExp('('+amount+')\\s*'+hours+'\\s*(?:and|и|және)?\\s*('+amount+')\\s*'+minutes+boundary,'giu'),a=>add(a,value(a[1])*60+value(a[2])));
 // Use the lower end of an explicit range and disclose that choice in the UI.
 take(new RegExp('('+amount+')\\s*(?:-|–|to|до)\\s*('+amount+')\\s*('+hours+'|'+minutes+')'+boundary,'giu'),a=>{const scale=new RegExp('^'+hours+'$','iu').test(a[3])?60:1,low=value(a[1])*scale,high=value(a[2])*scale;if(low<10||high>240||low>high)issues.push('range');else{budgetRange=[low,high];add(a,low);}});
 take(new RegExp('('+amount+')\\s*('+hours+'|'+minutes+')'+boundary,'giu'),a=>add(a,value(a[1])*(new RegExp('^'+hours+'$','iu').test(a[2])?60:1)));
 if(durations.length===1&&durations[0].minutes>=10&&durations[0].minutes<=240){budget=durations[0].minutes;budgetPhrase=durations[0].phrase;}else if(durations.length)issues.push('duration');
 // This guard deliberately errs toward asking. It is not a general natural-language clock parser.
 if(/\d\s*[:：]\s*\d|\b(?:hours?|minutes?|hrs?|mins?|half|quarter|tomorrow|tonight|morning|afternoon|evening|back by|return by|noon|midnight|back at|return at)\b|час(?:а|ов)?(?:\s|$)|минут|полчас|вернуться|завтра|сегодня|утром|вечером|сағат|минут|дейін\s+(?:қайту|оралу)|ертең|бүгін/iu.test(rest))issues.push('unparsed');
 return {budget,budgetPhrase,budgetRange,maxWalk,returnByClock,timeIssues:[...new Set(issues)]};
}
