// app.js

// --- CONFIGURAÇÃO GLOBAL (FONTE DA VERDADE) ---

const simConfig = {
    // Parâmetros do Slot
    symbols: {
        'ANCHOR': { icon: 'fa-anchor', weight: 75, mult3: 0.05, mult4: 0.1 },
        'GEM': { icon: 'fa-gem', weight: 40, mult3: 0.3, mult4: 1 },
        'COWBOY': { icon: 'fa-hat-cowboy', weight: 20, mult3: 1.2, mult4: 3 },
        'SKULL': { icon: 'fa-skull-crossbones', weight: 5, mult3: 20, mult4: 50 }
    },
    symbolKeys: ['ANCHOR', 'GEM', 'COWBOY', 'SKULL'], // Array para facilitar iteração

    // Parâmetros da Simulação
    bet: 10,
    ROWS: 3,
    COLS: 4,
    TARGET_RTP: 96,
    RTP_PRECISION: 0.1,         // Diferença mínima para ajuste (0.1% de margem de erro)
    ADJUSTMENT_STEP: 0.01,      // Ajuste fino para os multiplicadores

    // Parâmetros de Visualização (Controlados pelo DOM)
    numPlayers: 100,
    spinsPerPlayer: 50
};

// --- VARIÁVEIS DE ESTADO E REFERÊNCIAS ---


const canvas = document.getElementById('simCanvas');
const ctx = canvas ? canvas.getContext('2d') : null; 

let simulationTimeoutId = null;
let currentRTP = 0;
let iteration = 0;
let isRunning = false;
let weightedArr = []; 

// --- FUNÇÕES DE INTERAÇÃO COM O DOM (VIEW) ---

/**
 * Lê os inputs de jogadores e giros (parâmetros de visualização).
 */
function readViewParamsFromDOM() {
    simConfig.numPlayers = parseInt(document.getElementById('num-players').value) || simConfig.numPlayers; 
    simConfig.spinsPerPlayer = parseInt(document.getElementById('spins-player').value) || simConfig.spinsPerPlayer; 
}

/**
 * LÊ OS PESOS E MULTIPLICADORES DO DOM E ATUALIZA simConfig.
 */
function readGameParamsFromDOM() {
    simConfig.symbolKeys.forEach(key => {
        const sym = simConfig.symbols[key];
        const keyLower = key.toLowerCase();
        
        sym.weight = parseFloat(document.getElementById(`w-${keyLower}`).value) || sym.weight;
        sym.mult3 = parseFloat(document.getElementById(`m3-${keyLower}`).value) || sym.mult3;
        sym.mult4 = parseFloat(document.getElementById(`m4-${keyLower}`).value) || sym.mult4;
    });
}

/**
 * Atualiza os campos de input do DOM para refletir o estado atual (simConfig).
 */
function updateDOMConfig() {
    simConfig.symbolKeys.forEach(key => {
        const sym = simConfig.symbols[key];
        document.getElementById(`w-${key.toLowerCase()}`).value = sym.weight.toFixed(0);
        document.getElementById(`m3-${key.toLowerCase()}`).value = sym.mult3.toFixed(4); 
        document.getElementById(`m4-${key.toLowerCase()}`).value = sym.mult4.toFixed(4);
    });
    
    document.getElementById('rtp-target').textContent = simConfig.TARGET_RTP.toFixed(2) + '%';
}

/**
 * Constrói o array ponderado de símbolos para o gerador de números aleatórios.
 */
function buildWeightedArray() {
    weightedArr = [];
    simConfig.symbolKeys.forEach(key => {
        const weight = Math.max(0, simConfig.symbols[key].weight);
        for(let i = 0; i < weight; i++) {
            weightedArr.push(key);
        }
    });
}

// --- FUNÇÕES DO MOTOR DO JOGO ---

function getRandomSymbol() {
    if (weightedArr.length === 0) return simConfig.symbolKeys[0];
    return weightedArr[Math.floor(Math.random() * weightedArr.length)];
}

/**
 * FUNÇÃO AUXILIAR: Encontra caminhos de vitória em zigue-zague (reutilizada do jogo).
 */
function findZigzagPaths(results) {
    const paths = [];
    const rows = simConfig.ROWS;
    const cols = simConfig.COLS;

    function dfs(col, row, path, symbol) {
      path.push({ col, row });

      if (col === cols - 1) {
        if (path.length >= 3) paths.push([...path]);
        path.pop();
        return;
      }

      const candidates = [row - 1, row, row + 1].filter(r => r >= 0 && r < rows);
      let extended = false;

      for (const r of candidates) {
        if (results[col + 1][r] === symbol) {
          extended = true;
          dfs(col + 1, r, path, symbol);
        }
      }

      if (!extended && path.length >= 3) {
        paths.push([...path]);
      }

      path.pop();
    }

    for (let startRow = 0; startRow < rows; startRow++) {
      const symbol = results[0][startRow];
      if (!simConfig.symbols[symbol]) continue;
      dfs(0, startRow, [], symbol);
    }

    return paths;
}

/**
 * Calcula o ganho em uma única rodada (Lógica completa do jogo).
 * SUBSTITUÍDO: Agora inclui Horizontais, Diagonais e Zig-zag.
 */
function calculateWin(results) {
    let totalWin = 0;
    const rows = simConfig.ROWS;
    const cols = simConfig.COLS;
    
    // --- 1. HORIZONTAIS ---
    for (let row = 0; row < rows; row++) {
        const firstKey = results[0][row];
        const matchedPayout = simConfig.symbols[firstKey];
        if (!matchedPayout) continue;
        
        let count = 1;
        for (let col = 1; col < cols; col++) {
            if (results[col][row] === firstKey) count++;
            else break;
        }
        
        if (count >= 3) {
            const mult = (count === 3 ? matchedPayout.mult3 : matchedPayout.mult4);
            totalWin += simConfig.bet * mult;
        }
    }

    // --- 2. DIAGONAIS SIMPLES E ESPECIAIS ---
    const diagonalPatterns = [];

    // principal ↘ (da esquerda para a direita)
    diagonalPatterns.push(Array.from({ length: Math.min(rows, cols) }, (_, i) => ({ col: i, row: i })));
    
    // invertida ↗ (da esquerda para a direita)
    diagonalPatterns.push(Array.from({ length: Math.min(rows, cols) }, (_, i) => ({ col: i, row: rows - 1 - i })));
    
    // especial 1: 1:3 → 2:2 → 3:1 → 4:2 (Apenas se COLS >= 4 e ROWS >= 3, o que é o caso)
    if (cols >= 4 && rows >= 3) {
        diagonalPatterns.push([
          { col: 0, row: 2 },
          { col: 1, row: 1 },
          { col: 2, row: 0 },
          { col: 3, row: 1 },
        ]);
    }

    diagonalPatterns.forEach(pattern => {
        const first = results[pattern[0].col][pattern[0].row];
        const payout = simConfig.symbols[first];
        if (!payout) return;

        let matchCount = 1;
        for (let i = 1; i < pattern.length; i++) {
            const p = pattern[i];
            if (results[p.col] && results[p.col][p.row] === first) {
                matchCount++;
            } else {
                break;
            }
        }

        if (matchCount >= 3) {
            const mult = matchCount === 3 ? payout.mult3 : payout.mult4;
            totalWin += simConfig.bet * mult;
        }
    });

    // --- 3. ZIG-ZAG COM BACKTRACKING (DFS) ---
    const zigPaths = findZigzagPaths(results);
    zigPaths.forEach(path => {
        // Assume-se que o path só é retornado se for de 3 ou 4 símbolos iguais e contínuos
        const firstSymbol = results[path[0].col][path[0].row];
        const payout = simConfig.symbols[firstSymbol];
        
        if (path.length >= 3) {
            const mult = path.length === 3 ? payout.mult3 : payout.mult4;
            totalWin += simConfig.bet * mult;
        }
    });
    
    return totalWin;
}

/**
 * Simula um grande número de giros para obter um RTP preciso.
 */
function simulateRTP(totalSpins) {
    let totalWin = 0;
    const totalBet = totalSpins * simConfig.bet;
    
    for(let s = 0; s < totalSpins; s++){
        const results = [];
        for(let col = 0; col < simConfig.COLS; col++){
            const reelCol = [];
            for(let row = 0; row < simConfig.ROWS; row++){
                reelCol.push(getRandomSymbol());
            }
            results.push(reelCol);
        }
        // Usa a nova e completa função calculateWin
        totalWin += calculateWin(results); 
    }
    
    const rtp = (totalWin / totalBet) * 100;
    return rtp;
}

/**
 * Simula jogadores para fins de visualização do gráfico (volatilidade).
 */
function simulatePlayersForPlot() {
    const playersData = [];
    
    for(let p = 0; p < simConfig.numPlayers; p++){
        let currentBalance = 0;
        const playerRounds = [];
        
        for(let s = 0; s < simConfig.spinsPerPlayer; s++){
            const results = [];
            for(let col = 0; col < simConfig.COLS; col++){
                const reelCol = [];
                for(let row = 0; row < simConfig.ROWS; row++){
                    reelCol.push(getRandomSymbol());
                }
                results.push(reelCol);
            }
            // Usa a nova e completa função calculateWin
            const win = calculateWin(results);
            const roundProfit = win - simConfig.bet;
            
            currentBalance += roundProfit;
            playerRounds.push(currentBalance);
        }
        playersData.push(playerRounds);
    }
    return playersData;
}

// --- FUNÇÃO DE OTIMIZAÇÃO E VISUALIZAÇÃO ---

/**
 * Desenha as jornadas dos jogadores no Canvas.
 */
function drawSimulation(playersData) {
    if (!ctx) return; 

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const midY = canvas.height / 2;
    
    const allValues = playersData.flat();
    const maxVal = Math.max(0, ...allValues);
    const minVal = Math.min(0, ...allValues);
    
    const maxAbs = Math.max(Math.abs(maxVal), Math.abs(minVal)) || 1;
    
    const yScale = (canvas.height / 2) / maxAbs;
    const xScale = canvas.width / simConfig.spinsPerPlayer;
    
    // Linha Zero (Centro)
    ctx.beginPath();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.moveTo(0, midY);
    ctx.lineTo(canvas.width, midY);
    ctx.stroke();
    
    // Rótulo de Status
    ctx.fillStyle = '#FFD700';
    ctx.font = '14px Arial';
    ctx.fillText(`RTP: ${currentRTP.toFixed(4)}% | Alvo: ${simConfig.TARGET_RTP}% | Iteração: ${iteration}`, 10, 20);

    // Desenha as jornadas (com cores baseadas no saldo: Verde=Positivo, Vermelho=Negativo)
    playersData.forEach(playerRounds => {
        
        let previousY = midY; 
        let previousX = 0;
        
        playerRounds.forEach((currentValue, round) => {
            
            const currentX = (round + 1) * xScale - (xScale / 2); 
            const currentY = midY - currentValue * yScale; 
            
            // Define a cor do SEGMENTO
            ctx.strokeStyle = (currentValue >= 0) ? '#4CAF50' : '#D32F2F'; 

            // Desenha o SEGMENTO
            ctx.beginPath();
            ctx.lineWidth = 2; 
            
            // Move para o ponto inicial
            if (round === 0) {
                ctx.moveTo(previousX, previousY);
            } else {
                ctx.moveTo(previousX, previousY);
            }
            
            // Desenha a linha até o ponto atual
            ctx.lineTo(currentX, currentY);
            ctx.stroke();

            // Atualiza as coordenadas para o próximo loop
            previousX = currentX;
            previousY = currentY;
        });
    });
}

/**
 * Função principal que executa a simulação e o ajuste heurístico.
 */
function runCycle() {
    if (!isRunning) return;
    
    // 1. Otimização: Roda a simulação de RTP com grande número de giros.
    buildWeightedArray(); 
    const totalSpinsForRTP = 1000 * 50; 
    currentRTP = simulateRTP(totalSpinsForRTP);
    
    // 2. Lógica de Ajuste Heurístico
    const symbolToAdjust = simConfig.symbolKeys[simConfig.symbolKeys.length - 1]; 
    const symbolObj = simConfig.symbols[symbolToAdjust];
    
    if (Math.abs(currentRTP - simConfig.TARGET_RTP) > simConfig.RTP_PRECISION) {
        
        let delta = 0;
        if (currentRTP < simConfig.TARGET_RTP) {
            delta = simConfig.ADJUSTMENT_STEP;
        } else {
            delta = -simConfig.ADJUSTMENT_STEP;
        }

        symbolObj.mult4 = Math.max(0.1, symbolObj.mult4 + delta);
        
        updateDOMConfig();
        const output = document.getElementById('output');
        output.textContent = 
            `--- Ajuste RTP Contínuo (Iteração ${iteration}) ---\n` +
            `RTP Atual: ${currentRTP.toFixed(4)}%\n` +
            `RTP Alvo: ${simConfig.TARGET_RTP}%\n` +
            `Ajuste: ${delta > 0 ? 'AUMENTANDO' : 'DIMINUINDO'} mult4\n` +
            `${symbolToAdjust} x4: ${symbolObj.mult4.toFixed(4)}`;
            
    } else {
        stopSimulation(`✅ ALVO ATINGIDO: RTP Estabilizado em ${currentRTP.toFixed(4)}% após ${iteration} iterações.`);
        return;
    }
    
    // 3. Visualização
    readViewParamsFromDOM(); 
    const playersData = simulatePlayersForPlot();
    drawSimulation(playersData);
    
    iteration++;
    
    // 4. Agenda o Próximo Ciclo (Loop Recursivo)
    simulationTimeoutId = setTimeout(runCycle, 100); 
}

// --- FUNÇÕES DE CONTROLE ---

function stopSimulation(message) {
    if (simulationTimeoutId !== null) {
        clearTimeout(simulationTimeoutId);
        simulationTimeoutId = null;
    }
    isRunning = false;
    
    const toggleButton = document.getElementById('toggleSim'); 
    
    if (toggleButton) { 
        toggleButton.textContent = "Rodar Simulação";
        toggleButton.classList.remove('running');
    }
    
    if (message) alert(message);
    
    console.log(message || "Simulação Contínua Parada.");
}


// --- Lógica de Inicialização ---

document.addEventListener('DOMContentLoaded', () => {
    
    const runButton = document.getElementById('toggleSim'); 
    const stopButton = document.getElementById('stopSim'); 
    
    updateDOMConfig();
    
    if (stopButton) stopButton.remove();

    if(runButton) {
        runButton.addEventListener('click', () => {
            const button = runButton;
            if (!isRunning) {
                // INICIAR
                button.textContent = "Parar Simulação";
                button.classList.add('running');
                isRunning = true;
                iteration = 0;
                
                readGameParamsFromDOM(); 
                
                simConfig.TARGET_RTP = parseFloat(document.getElementById('rtp-target-input').value) || 92; 
                
                runCycle();
            } else {
                // PARAR
                stopSimulation("Simulação interrompida pelo usuário.");
            }
        });
    }
});
