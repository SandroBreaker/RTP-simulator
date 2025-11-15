// app.js

const symbols = ['fa-anchor','fa-gem','fa-hat-cowboy','fa-skull-crossbones'];
// Aposta fixa por giro
const bet = 10;
const ROWS = 3;
const COLS = 4;
const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');
const TARGET_RTP = 92;
const ADJUSTMENT_STEP = 0.01; // Ajuste fino para os multiplicadores

// Variável global para controle do loop
let simulationTimeoutId = null;
let currentRTP = 0;
let iteration = 0;
let isRunning = false;

// --- Funções de Configuração e Simulação ---

/**
 * Obtém a configuração atual dos campos de input.
 */
function getConfig() {
  return {
    'fa-anchor': { cls:'fa-anchor', weight: parseInt(document.getElementById('w-anchor').value), mult3: parseFloat(document.getElementById('m3-anchor').value), mult4: parseFloat(document.getElementById('m4-anchor').value) },
    'fa-gem': { cls:'fa-gem', weight: parseInt(document.getElementById('w-gem').value), mult3: parseFloat(document.getElementById('m3-gem').value), mult4: parseFloat(document.getElementById('m4-gem').value) },
    'fa-hat-cowboy': { cls:'fa-hat-cowboy', weight: parseInt(document.getElementById('w-cowboy').value), mult3: parseFloat(document.getElementById('m3-cowboy').value), mult4: parseFloat(document.getElementById('m4-cowboy').value) },
    'fa-skull-crossbones': { cls:'fa-skull-crossbones', weight: parseInt(document.getElementById('w-skull').value), mult3: parseFloat(document.getElementById('m3-skull').value), mult4: parseFloat(document.getElementById('m4-skull').value) }
  };
}

/**
 * Injeta a nova configuração nos campos de input do DOM.
 * Necessário para o algoritmo de ajuste atualizar os parâmetros.
 */
function setConfig(config) {
    document.getElementById('w-anchor').value = config['fa-anchor'].weight.toFixed(0);
    document.getElementById('m3-anchor').value = config['fa-anchor'].mult3.toFixed(2);
    document.getElementById('m4-anchor').value = config['fa-anchor'].mult4.toFixed(2);
    
    document.getElementById('w-gem').value = config['fa-gem'].weight.toFixed(0);
    document.getElementById('m3-gem').value = config['fa-gem'].mult3.toFixed(2);
    document.getElementById('m4-gem').value = config['fa-gem'].mult4.toFixed(2);

    document.getElementById('w-cowboy').value = config['fa-cowboy'].weight.toFixed(0);
    document.getElementById('m3-cowboy').value = config['fa-cowboy'].mult3.toFixed(2);
    document.getElementById('m4-cowboy').value = config['fa-cowboy'].mult4.toFixed(2);

    document.getElementById('w-skull').value = config['fa-skull-crossbones'].weight.toFixed(0);
    document.getElementById('m3-skull').value = config['fa-skull-crossbones'].mult3.toFixed(2);
    document.getElementById('m4-skull').value = config['fa-skull-crossbones'].mult4.toFixed(2);
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
  
  // Rótulo RTP Alvo
  ctx.fillStyle = '#FFD700'; // Dourado
  ctx.font = '14px Arial';
  ctx.fillText(`RTP: ${currentRTP.toFixed(4)}% | Alvo: ${TARGET_RTP}% | Iteração: ${iteration}`, 10, 20);

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

// --- Funções de Controle de Loop e Otimização ---

/**
 * Função principal que executa a simulação e agenda a próxima execução.
 * Inclui a lógica heurística para ajustar os multiplicadores.
 */
function runCycle() {
  if (!isRunning) return; // Parar se a flag for falsa

  const numPlayers = parseInt(document.getElementById('num-players').value) || 100;
  const spinsPerPlayer = parseInt(document.getElementById('spins-player').value) || 20;

  if (numPlayers < 1 || spinsPerPlayer < 1) {
    alert("Número de jogadores e giros deve ser maior que zero.");
    stopSimulation(); 
    return;
  }
  
  // 1. Executa a Simulação (usando um número alto de giros para precisão do RTP)
  const totalGirosParaRTP = 1000 * 50; // Ex: 50.000 giros por ciclo para estabilidade
  const res = simulatePlayers(1000, 50); // Ajustamos para usar 1000 jogadores * 50 giros
  currentRTP = res.rtp;
  
  // 2. Lógica de Ajuste de RTP
  let config = getConfig();
  const symbolToAdjust = 'fa-skull-crossbones'; // Ajustamos o símbolo de maior pagamento
  const currentMult4 = config[symbolToAdjust].mult4;
  
  if (Math.abs(currentRTP - TARGET_RTP) > 0.1) {
    
    if (currentRTP < TARGET_RTP) {
      // RTP muito baixo -> Aumentar o pagamento (multiplicador)
      config[symbolToAdjust].mult4 += ADJUSTMENT_STEP;
      console.log(`[Iteração ${iteration}] RTP ${currentRTP.toFixed(4)}% < ${TARGET_RTP}%. Aumentando ${symbolToAdjust} mult4 para ${(currentMult4 + ADJUSTMENT_STEP).toFixed(2)}`);
    } else {
      // RTP muito alto -> Diminuir o pagamento (multiplicador)
      config[symbolToAdjust].mult4 = Math.max(0.1, currentMult4 - ADJUSTMENT_STEP); // Evitar zero ou negativo
      console.log(`[Iteração ${iteration}] RTP ${currentRTP.toFixed(4)}% > ${TARGET_RTP}%. Diminuindo ${symbolToAdjust} mult4 para ${(currentMult4 - ADJUSTMENT_STEP).toFixed(2)}`);
    }

    setConfig(config);
  } else {
    // Alvo atingido!
    console.log(`✅ ALVO ATINGIDO: RTP Estabilizado em ${currentRTP.toFixed(4)}% após ${iteration} iterações.`);
    stopSimulation();
    return;
  }
  
  // 3. Atualiza o Output
  const output = document.getElementById('output');
  output.textContent = 
    `--- Ajuste RTP Contínuo ---\n` +
    `RTP Atual: ${currentRTP.toFixed(4)}%\n` +
    `RTP Alvo: ${TARGET_RTP}%\n` +
    `Diferença: ${(currentRTP - TARGET_RTP).toFixed(4)}%\n` +
    `Iteração: ${iteration}\n\n` +
    'Configuração Atualizada:\n' +
    `${symbolToAdjust} x4: ${config[symbolToAdjust].mult4.toFixed(2)}`;

  // 4. Desenha o Gráfico (apenas para visualização do último ciclo)
  drawSimulation(res.playersData);
  
  iteration++;
  
  // 5. Agenda o Próximo Ciclo (Loop Recursivo)
  simulationTimeoutId = setTimeout(runCycle, 1000); // 1000ms = 1 segundo
}

/**
 * Função para parar a simulação contínua.
 */
function stopSimulation() {
  if (simulationTimeoutId !== null) {
    clearTimeout(simulationTimeoutId);
    simulationTimeoutId = null;
  }
  isRunning = false;
  document.getElementById('runSim').disabled = false;
  const stopButton = document.getElementById('stopSim');
  if (stopButton) stopButton.disabled = true;
  console.log("Simulação Contínua Parada.");
}


// --- Lógica de Inicialização e Botões ---

document.addEventListener('DOMContentLoaded', () => {
    const runButton = document.getElementById('runSim');
    
    // Cria e adiciona o botão de Stop
    const stopButton = document.createElement('button');
    stopButton.id = 'stopSim';
    stopButton.textContent = 'Parar';
    stopButton.disabled = true;
    stopButton.style.marginLeft = '10px'; 
    
    runButton.parentElement.insertBefore(stopButton, runButton.nextSibling);

    // Event Listener do Botão de RODAR (inicia o ciclo)
    runButton.addEventListener('click', ()=>{
        if (!isRunning) {
            runButton.disabled = true;
            stopButton.disabled = false;
            isRunning = true;
            iteration = 0; // Reinicia a contagem
            runCycle(); // Inicia o primeiro ciclo e agenda os próximos
        }
    });

    // Event Listener do Botão de STOP
    stopButton.addEventListener('click', stopSimulation);
});
