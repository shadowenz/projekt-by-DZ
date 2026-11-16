const pages={rozmowa:'ROZMOWA',transkrypcja:'TRANSKRYPCJA',powiedz:'POWIEDZ ZA MNIE',notatnik:'DUŻY NOTATNIK',zwroty:'GOTOWE ZWROTY',ustawienia:'USTAWIENIA'};
const $=selector=>document.querySelector(selector);
const storageKey='projekt-by-dz-notatnik-v1';
let fontSize=48,lastPage='',storageFailed=false;
// Usuń zapis ze starszej wersji. Nowy tekst pozostaje wyłącznie w pamięci ekranu.
for(const oldKey of [storageKey,'projekt-by-dz-powiedz-v1','projekt-by-dz-transkrypcja-font-v1']){try{localStorage.removeItem(oldKey);}catch{}}
function status(message){$('#note-status').textContent=message;}
function saveNote(){}
function updateFont(){ $('#notebook').style.setProperty('--note-size',fontSize+'px');$('#font-size').textContent=fontSize+' px';$('#smaller').disabled=fontSize<=24;$('#larger').disabled=fontSize>=100; }
function editing(focus=false){$('#editor').hidden=false;$('#presentation').hidden=true;$('.app').classList.remove('presenting');if(focus)$('#note-text').focus();}
function render(){const key=location.hash.slice(1),title=pages[key],notebook=key==='notatnik',speech=key==='powiedz',transcription=key==='transkrypcja';if(!transcription)window.transcriptionScreen?.leave();$('#transcription-screen').hidden=!transcription;if(!speech)window.speechScreen?.stop();$('#speech-screen').hidden=!speech;editing();$('.app').classList.toggle('notebook-open',notebook);$('#home').hidden=!!title;$('#footer').hidden=!!title;$('#notebook').hidden=!notebook;$('#placeholder').hidden=!title||notebook||speech||transcription;document.title=title?title+' — projekt by DZ':'projekt by DZ';if(title){if(transcription){$('#transcription-title').focus();}else if(speech){$('#speech-title').focus();}else if(!notebook){$('#page-title').textContent=title;$('#page-title').focus();}lastPage=key;}else if(lastPage){$('[data-page="'+lastPage+'"]').focus();}window.scrollTo(0,0);}
document.querySelectorAll('[data-page]').forEach(button=>button.addEventListener('click',()=>{location.hash=button.dataset.page;}));window.addEventListener('hashchange',render);
$('#note-text').addEventListener('input',saveNote);
$('#smaller').addEventListener('click',()=>{fontSize=Math.max(24,fontSize-4);updateFont();saveNote();});
$('#larger').addEventListener('click',()=>{fontSize=Math.min(100,fontSize+4);updateFont();saveNote();});
$('#show-text').addEventListener('click',()=>{const text=$('#note-text').value;if(!text.trim()){status('Najpierw wpisz wiadomość.');$('#note-text').focus();return;}saveNote();$('#note-text').blur();$('#display-text').textContent=text;$('#editor').hidden=true;$('#presentation').hidden=false;$('.app').classList.add('presenting');$('#display-text').focus();window.scrollTo(0,0);});
$('#edit-text').addEventListener('click',()=>editing(true));
$('#clear-text').addEventListener('click',()=>{if(!$('#note-text').value){status('Notatnik jest pusty.');return;}if(window.confirm('Czy na pewno usunąć cały tekst?')){$('#note-text').value='';saveNote();$('#note-text').focus();}});
function fallbackCopy(text){const field=$('#note-text');const start=field.selectionStart,end=field.selectionEnd;field.focus();field.select();field.setSelectionRange(0,text.length);let copied=false;try{copied=document.execCommand('copy');}catch{}field.setSelectionRange(start,end);return copied;}
$('#copy-text').addEventListener('click',async()=>{const text=$('#note-text').value;if(!text){status('Najpierw wpisz wiadomość.');return;}try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);}else if(!fallbackCopy(text)){throw new Error('copy');}status('Skopiowano tekst.');}catch{if(fallbackCopy(text))status('Skopiowano tekst.');else{$('#note-text').select();status('Nie udało się skopiować automatycznie. Przytrzymaj zaznaczony tekst i wybierz Kopiuj.');}}});
updateFont();render();status(storageFailed?'Nie można odczytać lokalnego zapisu. Skopiuj ważny tekst przed zamknięciem.':'Tekst nie jest zapisywany.');
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').then(reg=>reg.update()).catch(()=>{});}
