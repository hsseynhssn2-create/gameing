const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
$('#year').textContent = new Date().getFullYear();

const menuToggle = $('#menuToggle');
const nav = $('#mainNav');
menuToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
});
$$('#mainNav a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false');
}));

let activeFilter = 'all';
const search = $('#gameSearch');
function filterGames() {
  const term = search.value.trim().toLowerCase();
  let visible = 0;
  $$('.game-card').forEach(card => {
    const categories = card.dataset.category.split(' ');
    const matchesFilter = activeFilter === 'all' || categories.includes(activeFilter);
    const matchesText = (card.dataset.name + ' ' + card.innerText).toLowerCase().includes(term);
    card.hidden = !(matchesFilter && matchesText);
    if (!card.hidden) visible++;
  });
  $('#emptyState').hidden = visible > 0;
}
$$('.filter').forEach(button => button.addEventListener('click', () => {
  $$('.filter').forEach(b => b.classList.remove('active'));
  button.classList.add('active'); activeFilter = button.dataset.filter; filterGames();
}));
search.addEventListener('input', filterGames);

const modal = $('#gameModal'), gameArea = $('#gameArea'), modalTitle = $('#modalTitle');
$('#modalClose').addEventListener('click', closeGame);
modal.addEventListener('click', e => { if (e.target === modal) closeGame(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeGame(); });
function closeGame() { modal.hidden = true; gameArea.innerHTML = ''; }
function openGame(title, content) {
  modalTitle.textContent = title; gameArea.innerHTML = content; modal.hidden = false;
}
function button(label, id='actionButton') { return `<button id="${id}">${label}</button>`; }

$$('.play-btn').forEach(btn => btn.addEventListener('click', () => {
  const type = btn.dataset.game;
  if (type === 'reaction') startReaction();
  if (type === 'guess') startGuess();
  if (type === 'memory') startMemory();
}));

function startReaction() {
  openGame('⚡ اضغط بسرعة', `<p>اضغط على الزر أكبر عدد ممكن قبل ما الوقت يخلص!</p><div id="reactionScore">النقاط: 0</div><p id="reactionTime">الوقت: 10</p>${button('ابدأ الجولة','reactionStart')}<div id="reactionPlay"></div>`);
  let score = 0, timer = null, remaining = 10;
  $('#reactionStart').addEventListener('click', () => {
    score = 0; remaining = 10;
    $('#reactionScore').textContent = 'النقاط: 0'; $('#reactionTime').textContent = 'الوقت: 10';
    $('#reactionPlay').innerHTML = button('اضغط هنا!','tapButton');
    $('#reactionStart').disabled = true;
    $('#tapButton').className = 'big-action';
    $('#tapButton').addEventListener('click', () => { score++; $('#reactionScore').textContent = `النقاط: ${score}`; });
    timer = setInterval(() => {
      remaining--; $('#reactionTime').textContent = `الوقت: ${remaining}`;
      if (remaining <= 0) {
        clearInterval(timer); $('#reactionPlay').innerHTML = `<p>انتهت الجولة! نتيجتك ${score} نقطة. ${score >= 20 ? 'سرعتك رهيبة! 🔥' : 'جرّب تاني وحط رقم أعلى!'}</p>`;
        $('#reactionStart').disabled = false; $('#reactionStart').textContent = 'العب مرة تانية';
      }
    }, 1000);
  });
}

function startGuess() {
  let secret, tries;
  openGame('🔢 خمن الرقم', `<p>أنا اخترت رقم من 1 إلى 20. تقدر تعرفه في 5 محاولات؟</p><input class="number-input" id="guessInput" type="number" min="1" max="20" placeholder="؟" aria-label="الرقم المتوقع">${button('خمن','guessSubmit')}<p id="guessMessage" aria-live="polite">مستني تخمينك!</p>${button('لعبة جديدة','guessReset')}`);
  function reset() { secret = Math.floor(Math.random()*20)+1; tries = 5; $('#guessMessage').textContent = 'عندك 5 محاولات. بالتوفيق!'; $('#guessInput').value=''; }
  reset();
  $('#guessSubmit').addEventListener('click', () => {
    const val = Number($('#guessInput').value), msg = $('#guessMessage');
    if (!val || val < 1 || val > 20) { msg.textContent = 'اكتب رقم صحيح من 1 إلى 20.'; return; }
    tries--;
    if (val === secret) { msg.textContent = `صح! الرقم كان ${secret}. بطل! 🐉`; $('#guessSubmit').disabled = true; }
    else if (tries === 0) { msg.textContent = `خلصت المحاولات! الرقم كان ${secret}. جرّب تاني.`; $('#guessSubmit').disabled = true; }
    else msg.textContent = `${val < secret ? 'الرقم السري أكبر ⬆️' : 'الرقم السري أصغر ⬇️'} — باقي ${tries} محاولات.`;
  });
  $('#guessReset').addEventListener('click', () => { $('#guessSubmit').disabled = false; reset(); });
}

function startMemory() {
  const colors = ['#ff6262','#55b9ff','#ffd34e','#b78aff'];
  let sequence = [], player = [], accepting = false, level = 0, showTimer;
  openGame('🧩 تحدي الذاكرة', `<p id="memoryMessage">شوف ترتيب الإشارات وكرره بالضغط عليها.</p><div class="memory-buttons">${colors.map((c,i)=>`<button data-index="${i}" style="background:${c}" aria-label="لون ${i+1}">${['●','◆','▲','■'][i]}</button>`).join('')}</div>${button('ابدأ','memoryStart')}<p id="memoryLevel">المستوى: 0</p>`);
  const pads = $$('.memory-buttons button', gameArea);
  function flash(i) { const old = pads[i].style.filter; pads[i].style.filter='brightness(1.8)'; setTimeout(()=>pads[i].style.filter=old,250); }
  function nextRound() {
    accepting = false; player = []; sequence.push(Math.floor(Math.random()*4));
    $('#memoryLevel').textContent = `المستوى: ${level}`;
    $('#memoryMessage').textContent = 'ركز واحفظ الترتيب...';
    let idx=0; clearInterval(showTimer);
    showTimer=setInterval(()=>{ if(idx>=sequence.length){clearInterval(showTimer);accepting=true;$('#memoryMessage').textContent='دورك! كرر الترتيب.';return;} flash(sequence[idx++]); },650);
  }
  pads.forEach(p=>p.addEventListener('click',()=>{
    if(!accepting) return; const chosen=Number(p.dataset.index); flash(chosen);
    if(sequence[player.length]!==chosen){ accepting=false; $('#memoryMessage').textContent=`انتهت الجولة عند المستوى ${level}. اضغط ابدأ للعب من جديد.`; sequence=[]; level=0; return; }
    player.push(chosen);
    if(player.length===sequence.length){ accepting=false; level++; setTimeout(nextRound,600); }
  }));
  $('#memoryStart').addEventListener('click',()=>{sequence=[];player=[];level=1;$('#memoryStart').textContent='إعادة من البداية';nextRound();});
}
