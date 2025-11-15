const symbols = ['fa-anchor','fa-gem','fa-hat-cowboy','fa-skull-crossbones'];
// Aposta fixa por giro
const bet = 10;
const ROWS = 3;
const COLS = 4;
const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

function getConfig() {
  return {
    'fa-anchor': { cls:'fa-anchor', weight: parseInt(document.getElementById('w-anchor').value), mult3: parseFloat(document.getElementById('m3-anchor').value), mult4: parseFloat(document.getElementById('m4-anchor').value) },
    'fa-gem': { cls:'fa-gem', weight: parseInt(document.getElementById('w-gem').value), mult3: parseFloat(document.getElementById('m3-gem').value), mult4: parseFloat(document.getElementById('m4-gem').value) },
    'fa-hat-cowboy': { cls:'fa-hat-cowboy', weight: parseInt(document.getElementById('w-cowboy').value), mult3: parseFloat(document.getElementById('m3-cowboy').value), mult4: parseFloat(document.getElementById('m4-cowboy').value) },
    'fa-skull-crossbones': { cls:'fa-skull-crossbones', weight: parseInt(document.getElementById('w-skull').value), mult3: parseFloat(document.getElementById('m3-skull').value), mult4: parseFloat(document.getElementById('m4-skull').value) }
  };
}

function buildWeightedArray(config) {
  const arr = [];
  symbols.forEach(sym => {
    // Garante que o peso seja um número não negativo
    const weight = Math.max(0, config[sym].weight || 0);
    for(let i=0;i<weight;i++) arr.push(sym);
  });
  return arr;
}

function getRandomSymbol(weightedArr) {
  if (weightedArr.length === 0) return symbols[0]; // Fallback
  return weightedArr[Math.floor(Math.random()*weightedArr.length)];
}

function calculateWin(results, config) {
  let totalWin = 0;
  let currentWins = {};
  symbols.forEach(s => currentWins[s] = 0);

  // A lógica de vitória percorre coluna por coluna (reel)
  // e verifica as 3 linhas (rows). Sua lógica parece estar
  // iterando coluna por coluna, mas verificando a primeira 
  // bobina (col=0) em todas as linhas.
  // VAMOS ASSUMIR VITÓRIA POR LINHA, COMEÇANDO DA COLUNA 0.

  for (let row = 0; row < ROWS; row++) {
    const first = results[0][row];
    const matchedPayout = config[first];
    if (!matchedPayout) continue;
    let count = 1;
    // Verifica da coluna 1 até a última
    for (let col = 1; col < COLS; col++) {
      if (results[col][row] === first) count++;
      else break;
    }
    
    // 3 ou 4 símbolos iguais na linha (row)
    if (count >= 3) {
      const mult = (count === 3 ? matchedPayout.mult3 : matchedPayout.mult4);
      const win = bet * mult;
      totalWin += win;
      currentWins[first] += win;
    }
  }
  return { totalWin, currentWins };
}

function simulatePlayers(numPlayers, spinsPerPlayer) {
  const config = getConfig();
  const weightedArr = buildWeightedArray(config);
  const totalBet = numPlayers * spinsPerPlayer * bet;
  const winsBySymbol = {'fa-anchor':0,'fa-gem':0,'fa-hat-cowboy':0,'fa-skull-crossbones':0};
  const playersData = [];

  for(let p=0; p<numPlayers; p++){
    let currentBalance = 0; // Usaremos o saldo acumulado para o gráfico
    const playerRounds = [];

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
      symbols.forEach(sym => winsBySymbol[sym] += winResult.currentWins[sym]);
      
      // Ganho/Perda da rodada (Win - Bet)
      const roundProfit = Object.values(winResult.currentWins).reduce((a,b)=>a+b,0) - bet;
      
      // Saldo acumulado do jogador (para mostrar a jornada)
      currentBalance += roundProfit;
      playerRounds.push(currentBalance);
    }
    playersData.push(playerRounds);
  }

  const totalWin = Object.values(winsBySymbol).reduce((a,b)=>a+b,0);
  const rtp = (totalWin / totalBet) * 100;
  return {rtp, totalWin, totalBet, winsBySymbol, playersData};
}

function drawSimulation(playersData) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const midY = canvas.height / 2;
  
  // 1. Encontra o maior valor (ganho) e o menor valor (perda)
  const allValues = playersData.flat();
  const maxVal = Math.max(0, ...allValues); // Garante que 0 esteja incluído
  const minVal = Math.min(0, ...allValues);
  
  // 2. Calcula a maior magnitude (para escala simétrica)
  // Usamos Math.max(maxVal, Math.abs(minVal)) para que o gráfico seja centralizado,
  // ou Math.max(maxVal, Math.abs(minVal), 10 * bet) para dar uma margem de visualização.
  const maxAbs = Math.max(maxVal, Math.abs(minVal)) || 1;
  
  // 3. O Fator de Escala Vertical (yScale)
  // Mapeia o maxAbs para metade da altura do canvas.
  const yScale = (canvas.height / 2) / maxAbs;
  const xScale = canvas.width / playersData[0].length;
  
  // Linha Zero (Começo) - O Eixo Horizontal
  ctx.beginPath();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.moveTo(0, midY);
  ctx.lineTo(canvas.width, midY);
  ctx.stroke();

  // Desenha as jornadas dos jogadores
  playersData.forEach(playerRounds => {
    ctx.beginPath();
    ctx.strokeStyle = `hsl(${Math.random() * 360}, 70%, 50%)`; // Cor aleatória
    ctx.lineWidth = 0.8;
    
    playerRounds.forEach((value, round) => {
      const x = round * xScale + (xScale / 2); // Centraliza no ponto do giro
      
      // Lógica de mapeamento Y:
      // midY é a linha 0. Subtraímos o valor * escala.
      // Positivo (Ganho): y < midY (Desenha para cima)
      // Negativo (Perda): y > midY (Desenha para baixo)
      const y = midY - value * yScale;
      
      if (round === 0) ctx.moveTo(x, midY); // Começa da linha zero no primeiro ponto
      else ctx.lineTo(x, y);

      // Pontos coloridos (opcional, mostra o fim da rodada)
      ctx.fillStyle = value >= 0 ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)';
      ctx.fillRect(x-1.5, y-1.5, 3, 3);
    });
    ctx.stroke();
  });
}

document.getElementById('runSim').addEventListener('click', ()=>{
  const numPlayers = parseInt(document.getElementById('num-players').value) || 100;
  const spinsPerPlayer = parseInt(document.getElementById('spins-player').value) || 20;
  
  if (numPlayers < 1 || spinsPerPlayer < 1) {
    alert("Número de jogadores e giros deve ser maior que zero.");
    return;
  }
  
  const res = simulatePlayers(numPlayers, spinsPerPlayer);
  const output = document.getElementById('output');
  output.textContent = 
    `--- Resultado da Simulação (${numPlayers * spinsPerPlayer} giros @ R$${bet.toFixed(2)}) ---\n` +
    `RTP (Retorno Teórico): ${res.rtp.toFixed(4)}%\n` +
    `Total Apostado: R$${res.totalBet.toFixed(2)}\n` +
    `Total Ganho: R$${res.totalWin.toFixed(2)}\n\n` +
    'Ganhos por Símbolo:\n' +
    symbols.map(s => `${s.split('-')[1].padEnd(7)}: R$${res.winsBySymbol[s].toFixed(2)}`).join('\n');

  drawSimulation(res.playersData);
});
