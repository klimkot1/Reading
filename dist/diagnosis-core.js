(function(root){
 const names={a:'ay',b:'bee',c:'see',d:'dee',e:'ee',f:'eff',g:'gee',h:'aitch',i:'eye',j:'jay',k:'kay',l:'ell',m:'em',n:'en',o:'oh',p:'pee',q:'cue',r:'ar',s:'ess',t:'tee',u:'you',v:'vee',w:'double you',x:'ex',y:'why',z:'zee'};
 function create(rng=Math.random){const base=root.GameCore.create('explorer',rng),items=[];const letters=Object.keys(names);for(let start=0;start<26;start+=4){const group=letters.slice(start,start+4),nameItems=group.map(l=>base.items.find(q=>q.mode==='name'&&q.letter===l)),sounds=group.map(l=>base.items.find(q=>q.mode==='sound'&&q.letter===l)).map(q=>({...q}));for(let i=sounds.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[sounds[i],sounds[j]]=[sounds[j],sounds[i]];}for(const q of sounds){const task={a:'audio',b:'picture',c:'word',d:'letter'}[q.letter];if(task){q.task=task;const pool=(task==='picture'?Object.keys(root.GameCore.pictures):letters).filter(l=>l!==q.letter&&!(['c','k'].includes(q.letter)&&['c','k'].includes(l)));for(let i=pool.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}q.options=[q.letter,...pool.slice(0,2)];for(let i=2;i>0;i--){const j=Math.floor(rng()*(i+1));[q.options[i],q.options[j]]=[q.options[j],q.options[i]];}}}if(sounds[0]?.letter===group.at(-1)&&sounds.length>1)sounds.push(sounds.shift());items.push(...nameItems,...sounds);}return {...base,schemaVersion:5,difficulty:'standard',assessmentVersion:'letter-recognition-5',items};}
 function coverage(run){const report=root.AssessmentCore.summarize(run);return {names:report.detail.filter(d=>d.name.completed).length,sounds:report.detail.filter(d=>d.sound.completed).length};}
 function report(run,childName){const raw=root.AssessmentCore.summarize(run);return {...raw,schemaVersion:5,assessmentVersion:run.assessmentVersion,childName,scope:'Узнавание названий и базовых звуков английских букв на слух',notAssessed:['Самостоятельное произношение','Чтение слов и текста','Понимание прочитанного'],coverage:coverage(run),taskEvidence:run.answers.slice(),startedAt:run.startedAt,finishedAt:new Date().toISOString(),replays:{...run.replays}};}
 function cuePlan(q){if(q.task==='name')return Array.from({length:3},()=>({kind:'letter',value:q.letter,text:names[q.letter]}));if(q.task==='word')return Array.from({length:3},()=>({kind:'word',value:root.GameCore.pictures[q.letter].word,text:root.GameCore.pictures[q.letter].word}));if(q.task==='audio')return q.options.map((value,index)=>({kind:'phoneme',value,index}));return Array.from({length:3},()=>({kind:'phoneme',value:q.letter}));}
 const shuffle=(a,rng)=>a.map(v=>({v,k:rng()})).sort((a,b)=>a.k-b.k).map(x=>x.v);
 function createDynamic(rng=Math.random){
  const letters=Object.keys(names),items=[];
  const endings={g:'dog',n:'sun',t:'hat'};
  for(let start=0;start<26;start+=4){
   const group=letters.slice(start,start+4);
   const nameItems=group.map(letter=>({letter,mode:'name',task:'name',options:shuffle([letter,...shuffle(letters.filter(l=>l!==letter),rng).slice(0,2)],rng)}));
   const sounds=shuffle(group,rng).map(letter=>{
    const i=letters.indexOf(letter),pictured=root.GameCore.pictures[letter];
    let task=letter==='q'||letter==='x'?'audio':endings[letter]?'ending':pictured?['audio','picture','word','letter'][i%4]:i%2?'audio':'letter';
    let pool=task==='picture'?Object.keys(root.GameCore.pictures):letters;
    // C and K represent the same /k/. Never offer two acoustically equivalent answers.
    pool=shuffle(pool.filter(l=>l!==letter&&!(letter==='c'&&l==='k')&&!(letter==='k'&&l==='c')),rng);
    const distractors=[];for(const l of pool){if(distractors.some(x=>['c','k'].includes(x)&&['c','k'].includes(l)))continue;distractors.push(l);if(distractors.length===2)break;}
    return {letter,mode:'sound',task,word:endings[letter],options:shuffle([letter,...distractors],rng)};
   });
   if(sounds[0]?.letter===group.at(-1)&&sounds.length>1)sounds.push(sounds.shift());
   items.push(...nameItems,...sounds);
  }
  return {type:'diagnostic',schemaVersion:5,kind:'diagnostic',difficulty:'standard',assessmentVersion:'letter-recognition-6',index:0,startedAt:new Date().toISOString(),answers:[],items};
 }
 function dynamicCue(q){if(q.task==='ending')return [{kind:'word',value:q.word,text:q.word}];if(q.task==='name')return cuePlan(q);if(q.task==='word')return cuePlan(q).slice(0,1);if(q.task==='audio')return cuePlan(q);return [{kind:'phoneme',value:q.letter}];}
 root.DiagnosisCore={names,create:createDynamic,coverage,report,cuePlan:dynamicCue};
})(globalThis);
