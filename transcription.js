(()=>{
const $=s=>document.querySelector(s),toggle=$('#transcription-toggle');
const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
// Safari na iPhonie: krótsze sesje zamiast polegania na continuous.
const ios=/iPad|iPhone|iPod/.test(navigator.userAgent||'')||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
let startupTimer=null,resultTimer=null,lastVisible='',sessionResult=false;
let size=36,base='',segments=new Map(),recognition=null,wanted=false,timer=null,epoch=0,emptyEnds=0;
const status=text=>{$('#transcription-status').textContent=text;};
function font(){ $('#transcription-screen').style.setProperty('--caption-size',size+'px');$('#transcription-size').textContent=size+' px';$('#transcription-smaller').disabled=size<=24;$('#transcription-larger').disabled=size>=100;}
function resize(delta){size=Math.max(24,Math.min(100,size+delta));font();}
function sessionParts(){let final=[],interim=[];for(const [,part] of [...segments].sort((a,b)=>a[0]-b[0]))(part.final?final:interim).push(part.text);return{final:final.join(' ').trim(),interim:interim.join(' ').trim()};}
function join(a,b){return a&&b?a+'\n'+b:a||b;}
function text(){const p=sessionParts();return join(join(base,p.final),p.interim);}
function draw(){const p=sessionParts();const final=join(base,p.final);$('#transcription-final').textContent=final;$('#transcription-interim').textContent=(final&&p.interim?'\n':'')+p.interim;const box=$('#transcription-text');box.scrollTop=box.scrollHeight;}
function button(){toggle.textContent=wanted?'STOP':'START';toggle.setAttribute('aria-pressed',String(wanted));}
function clearWatchdogs(){clearTimeout(startupTimer);clearTimeout(resultTimer);startupTimer=resultTimer=null;}
function stop(){clearWatchdogs();wanted=false;clearTimeout(timer);timer=null;button();status('Zatrzymano');if(recognition){try{recognition.stop();}catch{recognition=null;}}}
function leave(){clearWatchdogs();lastVisible='';wanted=false;clearTimeout(timer);timer=null;epoch++;const old=recognition;recognition=null;if(old){try{old.abort();}catch{}}base='';segments.clear();draw();button();if(Recognition)status('Zatrzymano');}
function failure(code){clearWatchdogs();wanted=false;clearTimeout(timer);timer=null;button();const messages={'not-allowed':'Sprawdź uprawnienia mikrofonu.','service-not-allowed':'Rozpoznawanie mowy jest niedostępne. Sprawdź uprawnienia mikrofonu i ustawienia Siri.','audio-capture':'Nie udało się uruchomić mikrofonu.','network':'Sprawdź połączenie z internetem.','language-not-supported':'Rozpoznawanie polskiej mowy jest niedostępne.','no-speech':'Nie usłyszano mowy. Naciśnij START, aby spróbować ponownie.','aborted':'Transkrypcja została zatrzymana.','startup-timeout':'Mikrofon nie potwierdził uruchomienia. Sprawdź uprawnienia i otwórz stronę w Safari.','result-timeout':'Nie otrzymano napisów z rozpoznawania. Sprawdź internet i ustawienia Siri, a następnie naciśnij START.'};status(messages[code]||'Rozpoznawanie mowy jest niedostępne. Spróbuj ponownie.');$('#transcription-help').hidden=false;}
function startSession(){
 if(!wanted||recognition||document.hidden||location.hash!=='#transkrypcja')return;
 segments.clear();lastVisible='';sessionResult=false;let rec;const token=++epoch;
 try{rec=new Recognition();recognition=rec;rec.lang='pl-PL';rec.continuous=!ios;rec.interimResults=true;rec.maxAlternatives=1;
 rec.onstart=()=>{if(token===epoch&&wanted)status('Uruchamiam mikrofon...');};
 rec.onaudiostart=()=>{if(token!==epoch||!wanted)return;clearTimeout(startupTimer);status('Słucham');};
 rec.onspeechstart=()=>{if(token!==epoch||!wanted)return;clearTimeout(startupTimer);status('Rozpoznaję mowę');clearTimeout(resultTimer);resultTimer=setTimeout(()=>{if(token===epoch&&wanted&&!sessionResult){failure('result-timeout');try{rec.abort();}catch{}}},12000);};
 rec.onspeechend=()=>{if(token===epoch&&wanted)status(sessionResult?'Słucham':'Rozpoznaję mowę');};
 rec.onresult=event=>{if(token!==epoch)return;clearWatchdogs();for(const index of segments.keys())if(index>=event.results.length&&!segments.get(index).final)segments.delete(index);for(let i=0;i<event.results.length;i++){const result=event.results[i];const value=result[0]?.transcript?.trim();if(value)segments.set(i,{text:value,final:result.isFinal});}const part=sessionParts();if(part.final||part.interim){sessionResult=true;lastVisible=join(part.final,part.interim);emptyEnds=0;}draw();if(wanted)status('Rozpoznaję mowę');};
 rec.onerror=event=>{if(token!==epoch||!wanted)return;if(event.error==='no-speech'){status('Nie usłyszano mowy. Czekam na zakończenie sesji...');return;}failure(event.error);try{rec.abort();}catch{}};
 rec.onend=()=>{if(token!==epoch)return;epoch++;clearWatchdogs();const p=sessionParts();const content=join(p.final,p.interim)||lastVisible;const hadText=!!content;base=join(base,content);segments.clear();lastVisible='';recognition=null;draw();if(!wanted)return;emptyEnds=hadText?0:emptyEnds+1;if(emptyEnds>=3){failure('no-speech');return;}status('Wznawiam słuchanie...');timer=setTimeout(()=>{timer=null;startSession();},1000);};
 status('Uruchamiam mikrofon...');startupTimer=setTimeout(()=>{if(token===epoch&&wanted){failure('startup-timeout');try{rec.abort();}catch{}}},15000);rec.start();
 }catch(error){recognition=null;epoch++;failure(error.name==='NotAllowedError'?'not-allowed':'unavailable');}
}
toggle.addEventListener('click',()=>{if(wanted){stop();return;}if(!Recognition){failure('unavailable');return;}if(recognition){status('Poczekaj na zatrzymanie mikrofonu, a następnie naciśnij START.');return;}emptyEnds=0;wanted=true;button();startSession();});
$('#transcription-smaller').addEventListener('click',()=>resize(-4));$('#transcription-larger').addEventListener('click',()=>resize(4));
$('#transcription-clear').addEventListener('click',()=>{if(!text()){status('Nie ma tekstu do usunięcia.');return;}if(window.confirm('Czy na pewno usunąć całą transkrypcję?')){leave();}});
$('#transcription-copy').addEventListener('click',async()=>{const value=text();if(!value){status('Nie ma tekstu do skopiowania.');return;}try{if(!navigator.clipboard?.writeText)throw new Error();await navigator.clipboard.writeText(value);status('Skopiowano transkrypcję.');}catch{const field=document.createElement('textarea');field.value=value;field.style.cssText='position:fixed;top:0;left:0;width:1px;height:1px;opacity:0';document.body.append(field);field.focus();field.select();field.setSelectionRange(0,value.length);let ok=false;try{ok=document.execCommand('copy');}catch{}field.remove();status(ok?'Skopiowano transkrypcję.':'Nie udało się skopiować tekstu. Spróbuj ponownie w Safari.');}});
window.transcriptionScreen={leave};window.addEventListener('pagehide',()=>{stop();});document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});font();button();
if(!Recognition){toggle.disabled=true;status('Rozpoznawanie mowy jest niedostępne w tej przeglądarce.');$('#transcription-help').hidden=false;}
})();
