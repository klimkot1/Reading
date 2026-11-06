/* Diagnostic state is independent of the UI and audio engine. */
(function(root){
 const letters='abcdefghijklmnopqrstuvwxyz'.split('');
 const key=q=>q.letter+':'+q.mode;
 function create(){return {type:'diagnostic',schemaVersion:3,index:0,startedAt:new Date().toISOString(),answers:[],items:letters.flatMap(letter=>[{letter,mode:'name'},{letter,mode:'sound'}])};}
 function events(run,q){return run.answers.filter(a=>a.questionKey===key(q));}
 function answer(run,selected,heard){
  const q=run.items[run.index];if(!q||!heard)return {accepted:false};
  const previous=events(run,q);if(previous.some(e=>e.correct)||previous.some(e=>!e.correct&&e.answer===selected))return {accepted:false};
  const event={questionKey:key(q),letter:q.letter,mode:q.mode,answer:selected,correct:selected===q.letter,attempt:previous.length+1,questionIndex:run.index,at:new Date().toISOString()};
  run.answers.push(event);return {accepted:true,correct:event.correct,event};
 }
 function summarize(run){
  const detail=letters.map(letter=>{
   const modes={};for(const mode of ['name','sound']){const e=events(run,{letter,mode});modes[mode]={firstTry:e.length?e[0].correct:null,completed:e.some(x=>x.correct),errors:e.filter(x=>!x.correct),attempts:e.length};}
   return {letter,...modes};
  });
  const names=detail.filter(d=>d.name.firstTry===true).length,sounds=detail.filter(d=>d.sound.firstTry===true).length;
  return {schemaVersion:3,at:new Date().toISOString(),names,sounds,known:detail.filter(d=>d.name.firstTry===true&&d.sound.firstTry===true).map(d=>d.letter),passed:names>=24&&sounds>=23,completed:detail.every(d=>d.name.completed&&d.sound.completed),detail,errorLetters:detail.filter(d=>d.name.errors.length||d.sound.errors.length).map(d=>d.letter),answers:run.answers.slice()};
 }
 function progress(run){
  const report=summarize(run);const completed=report.detail.filter(d=>d.name.completed&&d.sound.completed).length;
  const answered=run.items.filter(q=>events(run,q).some(e=>e.correct)).length;
  let streak=0,group=[],milestones=[];
  for(const d of report.detail){
   const clean=d.name.firstTry===true&&d.sound.firstTry===true&&d.name.completed&&d.sound.completed;
   if(clean){streak++;group.push(d.letter);if(group.length===5){milestones.push({key:run.startedAt+':'+group.join(''),letters:group.slice(),endingLetter:d.letter});group=[];}}
   else{if(d.name.errors.length||d.sound.errors.length){streak=0;group=[];}if(!d.name.completed||!d.sound.completed)break;}
  }
  return {completed,answered,remainingLetters:26-completed,remainingQuestions:52-answered,percent:Math.round(answered/52*100),streak,nextReward:5-group.length,milestones,letters:report.detail.map(d=>({...d,problem:d.name.errors.length+d.sound.errors.length>0,complete:d.name.completed&&d.sound.completed}))};
 }
 function createSoundDeck(random=Math.random){const bags={correct:[],wrong:[]},last={correct:-1,wrong:-1};return {next(correct){const type=correct?'correct':'wrong';if(!bags[type].length){bags[type]=[0,1,2,3,4,5].map(v=>({v,r:random()})).sort((a,b)=>a.r-b.r).map(x=>x.v);if(bags[type][0]===last[type]){const swap=bags[type][0];bags[type][0]=bags[type][1];bags[type][1]=swap;}}return last[type]=bags[type].shift();}};}
 root.AssessmentCore={create,answer,summarize,events,key,progress,createSoundDeck};
})(typeof globalThis!=='undefined'?globalThis:this);
