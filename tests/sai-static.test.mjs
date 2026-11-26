function plus(d,n){const x=new Date(d+'T12:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)}
function valid(d){return /^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d+'T12:00:00Z'))&&plus(d,0)===d&&new Date(d+'T12:00:00Z').getUTCDay()===4}
function counts(e){return !e.skip&&e.puja===true&&e.fast===true}
function schedule(j,now){let n=0,out=[];for(let d=j.start;n<9&&out.length<5200;d=plus(d,7)){const e=j.entries[d]||{};out.push({d,e,n:n+1,future:d>now});if(counts(e)||d>now)n++}return out}
function done(j){const a=Object.entries(j.entries).sort().filter(([d,e])=>counts(e));return a.length===9&&a[8][1].books===true&&a[8][1].food===true}
function today(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
const assert=(x,m)=>{if(!x)throw Error(m)};
const j={start:'2026-11-26',entries:{'2026-11-26':{puja:true,fast:true},'2026-12-03':{skip:true}}};
assert(valid(j.start),'Thursday');assert(!valid('2026-11-27'),'Friday');assert(!valid('2026-02-30'),'invalid date');assert(!counts({fast:true}),'fast alone');assert(!counts({puja:true}),'puja alone');assert(counts({puja:true,fast:true}),'both');assert(!counts({skip:true,puja:true,fast:true}),'skip');assert(schedule(j,'2026-12-03').at(-1).d==='2027-01-28','skip extends');assert(schedule(j,'2026-12-03')[2].future,'future');assert(plus('2026-12-31',7)==='2027-01-07','year transition');const k={start:j.start,entries:Object.fromEntries(Array.from({length:9},(_,i)=>[plus(j.start,i*7),{puja:true,fast:true}]))};assert(!done(k),'udyapan required');Object.assign(k.entries['2027-01-21'],{books:true,food:true});assert(done(k),'udyapan complete');
console.log('12 Sai static assertions passed');
