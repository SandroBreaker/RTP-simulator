const symbols = ['fa-anchor','fa-gem','fa-hat-cowboy','fa-skull-crossbones'];
// Aposta fixa por giro
const bet = 10;
const ROWS = 3;
const COLS = 4;
const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

// Variável global para controle do loop
let simulationTimeoutId = null;

// --- Funções de Configuração e Simulação (Mantidas Iguais) ---

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
    const weight = Math.max(0, config[sym].weight || 0);
    for(let i=0;i<weight;i++) arr.push(sym);
  });
  return arr;
}

function getRandomSymbol(weightedArr) {
  if (weightedArr.length === 0) return symbols[0];
  return weightedArr[Math.floor(Math.random()*weightedArr.length)];
}

function calculateWin(results, config) {
  let totalWin = 0;
  let currentWins = {};
  symbols.forEach(s => currentWins[s] = 0);

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
  return { totalWin, currentWins };
}

function simulatePlayers(numPlayers, spinsPerPlayer) {
  const config = getConfig();
  const weightedArr = buildWeightedArray(config);
  const totalBet = numPlayers * spinsPerPlayer * bet;
  const winsBySymbol = {'fa-anchor':0,'fa-gem':0,'fa-hat-cowboy':0,'fa-skull-crossbones':0};
  const playersData = [];

  for(let p=0; p<numPlayers; p++){
    let currentBalance = 0;
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
      
      const roundProfit = Object.values(winResult.currentWins).reduce((a,b)=>a+b,0) - bet;
      
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
  
  const allValues = playersData.flat();
  const maxVal = Math.max(0, ...allValues);
  const minVal = Math.min(0, ...allValues);
  
  const maxAbs = Math.max(maxVal, Math.abs(minVal)) || 1;
  
  const yScale = (canvas.height / 2) / maxAbs;
  const xScale = canvas.width / playersData[0].length;
  
  // Linha Zero
  ctx.beginPath();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.moveTo(0, midY);
  ctx.lineTo(canvas.width, midY);
  ctx.stroke();

  // Desenha as jornadas dos jogadores
  playersData.forEach(playerRounds => {
    ctx.beginPath();
    ctx.strokeStyle = `hsl(${Math.random() * 360}, 70%, 50%)`; 
    ctx.lineWidth = 0.8;
    
    playerRounds.forEach((value, round) => {
      const x = round * xScale + (xScale / 2);
      const y = midY - value * yScale;
      
      if (round === 0) ctx.moveTo(x, midY);
      else ctx.lineTo(x, y);

      ctx.fillStyle = value >= 0 ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)';
      ctx.fillRect(x-1.5, y-1.5, 3, 3);
    });
    ctx.stroke();
  });
}

// --- Funções de Controle de Loop ---

/**
 * Função principal que executa a simulação e agenda a próxima execução.
 */
function runCycle() {
  const numPlayers = parseInt(document.getElementById('num-players').value) || 100;
  const spinsPerPlayer = parseInt(document.getElementById('spins-player').value) || 20;

  if (numPlayers < 1 || spinsPerPlayer < 1) {
    alert("Número de jogadores e giros deve ser maior que zero.");
    stopSimulation(); // Parar se a entrada for inválida
    return;
  }
  
  // 1. Executa a Simulação
  const res = simulatePlayers(numPlayers, spinsPerPlayer);
  
  // 2. Atualiza o Output
  const output = document.getElementById('output');
  output.textContent = 
    `--- Resultado da Simulação (${numPlayers * spinsPerPlayer} giros @ R$${bet.toFixed(2)}) ---\n` +
    `RTP (Retorno Teórico): ${res.rtp.toFixed(4)}%\n` +
    `Total Apostado: R$${res.totalBet.toFixed(2)}\n` +
    `Total Ganho: R$${res.totalWin.toFixed(2)}\n\n` +
    'Ganhos por Símbolo:\n' +
    symbols.map(s => `${s.split('-')[1].padEnd(7)}: R$${res.winsBySymbol[s].toFixed(2)}`).join('\n');

  // 3. Desenha o Gráfico
  drawSimulation(res.playersData);

  // 4. Agenda o Próximo Ciclo (Loop Recursivo)
  simulationTimeoutId = setTimeout(runCycle, 1000); // 1000ms = 1 segundo
}

/**
 * Função para parar a simulação contínua.
 */
function stopSimulation() {
  if (simulationTimeoutId !== null) {
    clearTimeout(simulationTimeoutId);
    simulationTimeoutId = null;
    document.getElementById('runSim').disabled = false;
    document.getElementById('stopSim').disabled = true;
    console.log("Simulação Contínua Parada.");
  }
}


// --- Lógica de Inicialização e Botões ---

document.addEventListener('DOMContentLoaded', () => {
    // Adiciona o botão de Stop ao DOM
    const runButton = document.getElementById('runSim');
    const stopButton = document.createElement('button');
    stopButton.id = 'stopSim';
    stopButton.textContent = 'STOP SIMULAÇÃO';
    stopButton.disabled = true;
    
    // Assumindo que 'runSim' está dentro de um div.input-group ou similar
    runButton.parentElement.insertBefore(stopButton, runButton.nextSibling);

    // Event Listener do Botão de RODAR (inicia o ciclo)
    runButton.addEventListener('click', ()=>{
        if (simulationTimeoutId === null) {
            runButton.disabled = true;
            stopButton.disabled = false;
            runCycle(); // Inicia o primeiro ciclo e agenda os próximos
        }
    });

    // Event Listener do Botão de STOP
    stopButton.addEventListener('click', stopSimulation);
});
