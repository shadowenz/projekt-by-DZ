(()=>{
const $=s=>document.querySelector(s),field=$('#speech-text'),voiceSelect=$('#speech-voice'),rate=$('#speech-rate');
const synth=window.speechSynthesis;
const supported=!!synth&&typeof window.SpeechSynthesisUtterance==='function';
let state={text:'Dzień dobry, jestem osobą Głuchą. Proszę o pomoc',rate:1,voice:''};
let polishVoices=[],current=null,generation=0;
const sayStatus=text=>{$('#speech-status').textContent=text;};
field.value=state.text;rate.value=state.rate;
function rateLabel(){$('#rate-value').textContent=Number(rate.value).toFixed(1).replace('.',',');}
rateLabel();
// Ustawienia istnieją tylko podczas bieżącego użycia.
function save(){state.text=field.value;state.rate=Number(rate.value);}
function refreshVoices(){
 if(!supported)return;
 try{polishVoices=synth.getVoices().filter(v=>/^pl(?:[-_]|$)/i.test(v.lang));}catch{polishVoices=[];}
 voiceSelect.replaceChildren();
 if(!polishVoices.length){const option=document.createElement('option');option.textContent='Brak polskiego głosu';option.value='';voiceSelect.append(option);voiceSelect.disabled=true;$('#voice-info').textContent='Nie znaleziono polskiego głosu. Sprawdź głosy mowy w ustawieniach iPhone’a.';return;}
 voiceSelect.disabled=false;
 for(const voice of polishVoices){const option=document.createElement('option');option.value=voice.voiceURI;option.textContent=voice.name+(voice.localService?' — lokalny':'');voiceSelect.append(option);}
 const selected=polishVoices.find(v=>v.voiceURI===state.voice)||polishVoices.find(v=>v.default)||polishVoices[0];voiceSelect.value=selected.voiceURI;
 $('#voice-info').textContent='Dostępne głosy pochodzą z systemu. Nazwy głosów są podane przez iPhone’a.';
}
function stop(message=false){generation++;current=null;if(supported)synth.cancel();if(message)sayStatus('Zatrzymano.');}
window.speechScreen={stop};
field.addEventListener('input',save);
rate.addEventListener('input',()=>{rateLabel();save();});
voiceSelect.addEventListener('change',()=>{state.voice=voiceSelect.value;save();});
$('#speak').addEventListener('click',()=>{
 if(!field.value.trim()){sayStatus('Najpierw wpisz wiadomość.');field.focus();return;}
 if(!supported){sayStatus('Ta przeglądarka nie obsługuje czytania tekstu. Spróbuj otworzyć aplikację w Safari.');return;}
 refreshVoices();if(!polishVoices.length){sayStatus('Nie znaleziono polskiego głosu na tym urządzeniu.');return;}
 field.blur();stop();const token=generation;
 try{const utterance=new window.SpeechSynthesisUtterance(field.value);current=utterance;utterance.lang='pl-PL';utterance.voice=polishVoices.find(v=>v.voiceURI===voiceSelect.value)||polishVoices[0];utterance.rate=Number(rate.value);
 utterance.onstart=()=>{if(token===generation)sayStatus('Odczytuję wiadomość.');};
 utterance.onend=()=>{if(token===generation){current=null;sayStatus('Zakończono odczytywanie.');}};
 utterance.onerror=()=>{if(token===generation){current=null;sayStatus('Nie udało się odczytać wiadomości. Spróbuj ponownie.');}};
 sayStatus('Rozpoczynam odczytywanie.');synth.speak(utterance);
 }catch{current=null;sayStatus('Nie udało się odczytać wiadomości. Spróbuj ponownie.');}
});
$('#stop-speech').addEventListener('click',()=>stop(true));
$('#clear-speech').addEventListener('click',()=>{if(!field.value){sayStatus('Pole jest już puste.');return;}if(window.confirm('Czy na pewno usunąć całą wiadomość?')){stop();field.value='';save();field.focus();}});
function manualCopy(){const start=field.selectionStart,end=field.selectionEnd;field.focus();field.select();field.setSelectionRange(0,field.value.length);let ok=false;try{ok=document.execCommand('copy');}catch{}if(ok)field.setSelectionRange(start,end);return ok;}
$('#copy-speech').addEventListener('click',async()=>{if(!field.value){sayStatus('Najpierw wpisz wiadomość.');return;}try{if(!navigator.clipboard?.writeText)throw new Error();await navigator.clipboard.writeText(field.value);sayStatus('Skopiowano wiadomość.');}catch{sayStatus(manualCopy()?'Skopiowano wiadomość.':'Przytrzymaj zaznaczony tekst i wybierz Kopiuj.');}});
if(supported){refreshVoices();if(synth.addEventListener)synth.addEventListener('voiceschanged',refreshVoices);else synth.onvoiceschanged=refreshVoices;}else{$('#voice-info').textContent='Ta przeglądarka nie obsługuje czytania tekstu. Spróbuj Safari.';voiceSelect.disabled=true;}
window.addEventListener('pagehide',()=>stop());
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
})();
