/* Mobile-first Neon 3x3 Tic-Tac-Toe
   - 3x3 classic
   - 2 players: X and O
   - moderate moving background
   - neon win pulse + screen flash
   - touch-friendly
*/

const SIZE = 3;
const TO_WIN = 3;

// state
let board = Array.from({length: SIZE}, () => Array(SIZE).fill(null));
let current = 'X';
let moveStack = [];
let xWins = 0, oWins = 0, draws = 0;
let gameOver = false;

// dom
const boardEl = document.getElementById('board');
const turnEl = document.getElementById('turnIndicator');
const xWinsEl = document.getElementById('xWins');
const oWinsEl = document.getElementById('oWins');
const drawsEl = document.getElementById('draws');
const newRoundBtn = document.getElementById('newRoundBtn');
const undoBtn = document.getElementById('undoBtn');
const restartBtn = document.getElementById('restartBtn');
const screenGlow = document.getElementById('screenGlow');

// audio
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function tone(freq, dur=0.06, type='sine', gain=0.02){
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.value = gain;
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + dur);
}
function clickSound(){ tone(720, 0.05, 'sine', 0.02); }
function winSound(){
  const now = audioCtx.currentTime;
  [420,620,820].forEach((f,i)=>{
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'triangle'; o.frequency.value = f;
    g.gain.value = 0.03/(i+1);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(now + i*0.06); o.stop(now + 0.18 + i*0.06);
  });
}

// build board
function buildBoard(){
  boardEl.innerHTML = '';
  for(let r=0;r<SIZE;r++){
    for(let c=0;c<SIZE;c++){
      const btn = document.createElement('button');
      btn.className = 'cell';
      btn.dataset.r = r; btn.dataset.c = c;
      btn.setAttribute('aria-label', `cell ${r+1} ${c+1}`);
      const mark = document.createElement('span'); mark.className = 'mark';
      btn.appendChild(mark);
      btn.addEventListener('pointerdown', onCellPointer, {passive:true});
      boardEl.appendChild(btn);
    }
  }
}

// render
function render(){
  for(let r=0;r<SIZE;r++){
    for(let c=0;c<SIZE;c++){
      const el = boardEl.querySelector(`.cell[data-r='${r}'][data-c='${c}']`);
      el.classList.remove('played','x','o','win');
      const mark = el.querySelector('.mark');
      if(board[r][c]){
        el.classList.add('played');
        el.classList.add(board[r][c] === 'X' ? 'x' : 'o');
        mark.textContent = board[r][c];
      } else {
        mark.textContent = '';
      }
    }
  }
  turnEl.textContent = current;
  xWinsEl.textContent = xWins;
  oWinsEl.textContent = oWins;
  drawsEl.textContent = draws;
}

// interaction
function onCellPointer(e){
  if(gameOver) return;
  const el = e.currentTarget;
  const r = +el.dataset.r, c = +el.dataset.c;
  if(board[r][c]) return;
  board[r][c] = current;
  moveStack.push([r,c,current]);
  clickSound();
  render();

  const result = checkWin(r,c,current);
  if(result.win){
    gameOver = true;
    highlightWin(result.positions);
    if(current === 'X') xWins++; else oWins++;
    winSound();
    // subtle screen flash
    flashScreen(current === 'X' ? '#ff6b6b22' : '#7c5cff22');
    setTimeout(()=>{ setTimeout(()=>{ alert(current + ' wins!'); }, 80); }, 200);
    return;
  }

  if(isFull()){
    draws++;
    gameOver = true;
    setTimeout(()=>{ alert('Draw!'); }, 80);
    return;
  }

  current = current === 'X' ? 'O' : 'X';
  render();
}

// win detection
function checkWin(r,c,player){
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  for(const [dr,dc] of dirs){
    let positions = [[r,c]];
    for(let s=1;s<TO_WIN;s++){
      const rr = r + dr*s, cc = c + dc*s;
      if(rr<0||rr>=SIZE||cc<0||cc>=SIZE) break;
      if(board[rr][cc]===player) positions.push([rr,cc]); else break;
    }
    for(let s=1;s<TO_WIN;s++){
      const rr = r - dr*s, cc = c - dc*s;
      if(rr<0||rr>=SIZE||cc<0||cc>=SIZE) break;
      if(board[rr][cc]===player) positions.unshift([rr,cc]); else break;
    }
    if(positions.length >= TO_WIN){
      return {win:true, positions};
    }
  }
  return {win:false};
}

function isFull(){
  for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++) if(!board[r][c]) return false;
  return true;
}

// highlight winning cells
function highlightWin(positions){
  positions.forEach(([r,c])=>{
    const el = boardEl.querySelector(`.cell[data-r='${r}'][data-c='${c}']`);
    if(el) el.classList.add('win');
  });
}

// screen flash
function flashScreen(color){
  screenGlow.style.background = `linear-gradient(180deg, ${color}, transparent)`;
  screenGlow.style.opacity = '1';
  setTimeout(()=>{ screenGlow.style.transition = 'opacity 700ms ease'; screenGlow.style.opacity = '0'; }, 120);
  setTimeout(()=>{ screenGlow.style.transition = ''; }, 900);
}

// controls
function newRound(confirmAsk=true){
  if(confirmAsk && !confirm('Start a new round?')) return;
  board = Array.from({length: SIZE}, () => Array(SIZE).fill(null));
  moveStack = [];
  current = 'X';
  gameOver = false;
  render();
}

function undo(){
  if(moveStack.length === 0 || gameOver) return;
  const last = moveStack.pop();
  const [r,c,player] = last;
  board[r][c] = null;
  current = player;
  render();
}

function resetMatch(){
  if(!confirm('Reset match and clear scores?')) return;
  xWins = 0; oWins = 0; draws = 0;
  newRound(false);
  render();
}

// init
buildBoard();
render();

// wire events
newRoundBtn.addEventListener('click', ()=>newRound(true));
undoBtn.addEventListener('click', undo);
restartBtn.addEventListener('click', resetMatch);

// keyboard helpers for desktop testing
window.addEventListener('keydown', (e)=>{
  if(e.key === 'u') undo();
  if(e.key === 'r') newRound(true);
});

// ensure audio allowed
window.addEventListener('pointerdown', ()=>{ if(audioCtx.state !== 'running') audioCtx.resume(); }, {once:true});
