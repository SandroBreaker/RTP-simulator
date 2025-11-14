const symbols = ['fa-anchor','fa-gem','fa-hat-cowboy','fa-skull-crossbones'];
const bet = 10;
const ROWS = 3;
const COLS = 4;

function getConfig(){
  return {
    'fa-anchor': { cls:'fa-anchor', weight: parseInt(document.getElementById('w-anchor').value), mult3: parseFloat(document.getElementById('m3-anchor').value), mult4: parseFloat(document.getElementById('m4-anchor').value) },
    'fa-gem': { cls:'fa-gem', weight: parseInt(document.getElementById('w-gem').value), mult3: parseFloat(document.getElementById('m3-gem').value), mult4: parseFloat(document.getElementById('m4-gem').value) },
    'fa-hat-cowboy': { cls:'fa-hat-cowboy', weight: parseInt(document.getElementById('w-cowboy').value), mult3: parseFloat(document.getElementById('m3-cowboy').value), mult4: parseFloat(document.getElementById('m4-cowboy').value) },
    'fa-skull-crossbones': { cls:'fa-skull-crossbones', weight: parseInt(document.getElementById('w-skull').value), mult3: parseFloat(document.getElementById('m3-skull').value), mult4: parseFloat(document.getElementById('m4-skull').value) }
  };
}

function buildWeightedArray(config){
  const arr = [];
  symbols.forEach(sym=>{
    for(let i=0;i<config[sym].weight;i++) arr.push(sym);
  });
  return arr;
}

function getRandomSymbol(weightedArr){
  return weightedArr[Math.floor(Math.random()*weightedArr.length)];
}

/**
 * Lógica de cálculo de vitória (Adaptada de computeWin do app.js)
 */
function calculateWin(results, config){
  let totalWin = 0;
  let currentWins = {};
  symbols.forEach(s => currentWins[s] = 0);

  // ---------------------------
  // 1) Horizontais (Linhas 0, 1, 2)
  // ---------------------------
  for (let row = 0; row < ROWS; row++) {
    const first = results[0][row];
    const matchedPayout = config[first];
    if (!matchedPayout) continue;

    let count = 1;
    for (let col = 1; col < COLS; col++) {
      if (results[col][row] === first) count++;
      else break;
    }

    if (count >= 3) {
      const mult = (count === 3 ? matchedPayout.mult3 : matchedPayout.mult4);
      const win = bet * mult;
      totalWin += win;
      currentWins[first] += win;
    }
  }

  // ---------------------------
  // 2) Diagonais Simples
  // ---------------------------
  const diagonalPatterns = [];

  // principal ↘ (0,0), (1,1), (2,2) - só 3 colunas/linhas
  if(COLS >= 3 && ROWS >= 3) {
    diagonalPatterns.push(Array.from({ length: 3 }, (_, i) => ({ col: i, row: i })));
    // invertida ↗ (0,2), (1,1), (2,0)
    diagonalPatterns.push(Array.from({ length: 3 }, (_, i) => ({ col: i, row: ROWS - 1 - i })));
  }

  // especial 1: 1:3 → 2:2 → 3:1 → 4:2 (Ajustado para 4 colunas)
  if (COLS >= 4 && ROWS >= 3) {
    diagonalPatterns.push([
      { col: 0, row: 2 },
      { col: 1, row: 1 },
      { col: 2, row: 0 },
      { col: 3, row: 1 },
    ]);
  }

  diagonalPatterns.forEach(pattern => {
    if(pattern.length < 3) return;

    const first = results[pattern[0].col][pattern[0].row];
    const payout = config[first];
    if (!payout) return;

    let matchCount = 1;
    for (let i = 1; i < pattern.length; i++) {
        if (results[pattern[i].col][pattern[i].row] === first) {
            matchCount++;
        } else {
            break;
        }
    }

    if (matchCount >= 3) {
        const mult = matchCount === 3 ? payout.mult3 : payout.mult4;
        const win = bet * mult;
        totalWin += win;
        currentWins[first] += win;
    }
  });

  // ---------------------------
  // 3) Zig-zag com backtracking (Corrige último cilindro)
  // ---------------------------
  function findZigzagPaths(results) {
    const paths = [];

    function dfs(col, row, path, symbol) {
      path.push({ col, row });

      if (col === COLS - 1) {
        if (path.length >= 3) paths.push([...path]);
        path.pop();
        return;
      }

      const candidates = [row - 1, row, row + 1].filter(r => r >= 0 && r < ROWS);

      let extended = false;

      for (const r of candidates) {
        if (results[col + 1] && results[col + 1][r] === symbol) {
          extended = true;
          dfs(col + 1, r, path, symbol);
        }
      }

      if (!extended && path.length >= 3) {
        paths.push([...path]);
      }

      path.pop();
    }

    for (let startRow = 0; startRow < ROWS; startRow++) {
      const symbol = results[0][startRow];
      if (!config[symbol]) continue;
      dfs(0, startRow, [], symbol);
    }

    return paths;
  }

  const zigPaths = findZigzagPaths(results);
  zigPaths.forEach(path => {
    const symbol = results[path[0].col][path[0].row];
    const payout = config[symbol];
    const matchCount = path.length;
    if (matchCount >= 3) {
      const mult = matchCount === 3 ? payout.mult3 : payout.mult4;
      const win = bet * mult;
      totalWin += win;
      currentWins[symbol] += win;
    }
  });

  return { totalWin, currentWins };
}

function simulatePlayers(numPlayers, spinsPerPlayer){
  const config = getConfig();
  const weightedArr = buildWeightedArray(config);
  let totalWin = 0;
  const totalSpins = numPlayers * spinsPerPlayer;
  const totalBet = totalSpins * bet;

  const winsBySymbol = {'fa-anchor':0,'fa-gem':0,'fa-hat-cowboy':0,'fa-skull-crossbones':0};

  for(let p=0; p<numPlayers; p++){
    for(let s=0; s<spinsPerPlayer; s++){
      const results = [];
      for(let col=0; col<COLS; col++){
        const reelCol = [];
        for(let row=0; row<ROWS; row++){
          reelCol.push(getRandomSymbol(weightedArr));
        }
        results.push(reelCol);
      }
      
      const winResult = calculateWin(results, config);
      totalWin += winResult.totalWin;

      symbols.forEach(s => winsBySymbol[s] += winResult.currentWins[s]);
    }
  }

  const rtp = (totalWin / totalBet) * 100;
  return {rtp, totalWin, totalBet, winsBySymbol};
}

document.getElementById('runSim').addEventListener('click', ()=>{
  const numPlayers = parseInt(document.getElementById('num-players').value) || 1000;
  const spinsPerPlayer = parseInt(document.getElementById('spins-player').value) || 1000;
  
  const config = getConfig();
  const totalWeight = symbols.reduce((acc, sym) => acc + config[sym].weight, 0);

  const res = simulatePlayers(numPlayers, spinsPerPlayer);
  
  const output = document.getElementById('output');
  output.textContent = 
    `--- Resultado da Simulação (${res.totalSpins} giros @ R$${bet}) ---\n` +
    `RTP (Retorno Teórico): ${res.rtp.toFixed(4)}%\n` +
    `Total Apostado: R$${res.totalBet.toFixed(2)}\n` +
    `Total Ganho: R$${res.totalWin.toFixed(2)}\n` +
    `\n--- Contribuição por Símbolo (Ganho Total) ---\n` +
    symbols.map(s => {
        const peso = config[s].weight;
        const contrib = res.winsBySymbol[s] / res.totalWin * 100;
        return `${s.split('-')[1].padEnd(7)} (Peso ${peso}/${totalWeight}): ${res.winsBySymbol[s].toFixed(2)} (${contrib.toFixed(2)}% do Ganho)`;
    }).join('\n');
});

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('w-anchor').value = 85;
    document.getElementById('m3-anchor').value = 1.5;
    document.getElementById('m4-anchor').value = 8;
    
    document.getElementById('w-gem').value = 35;
    document.getElementById('m3-gem').value = 5;
    document.getElementById('m4-gem').value = 20;

    document.getElementById('w-cowboy').value = 15;
    document.getElementById('m3-cowboy').value = 30;
    document.getElementById('m4-cowboy').value = 120;

    document.getElementById('w-skull').value = 5;
    document.getElementById('m3-skull').value = 300;
    document.getElementById('m4-skull').value = 1500;

    document.getElementById('num-players').value = 1000;
    document.getElementById('spins-player').value = 1000;
});
