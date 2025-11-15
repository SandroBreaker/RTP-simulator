// app.js

// --- CONFIGURAÇÃO GLOBAL (FONTE DA VERDADE) ---

const simConfig = {
    // Parâmetros do Slot
    symbols: {
        // Valores iniciais são importantes para o build inicial, mas serão sobrepostos pelo DOM
        'ANCHOR': { icon: 'fa-anchor', weight: 75, mult3: 0.1, mult4: 0.2 },
        'GEM': { icon: 'fa-gem', weight: 40, mult3: 0.5, mult4: 0.8 },
        'COWBOY': { icon: 'fa-hat-cowboy', weight: 15, mult3: 5, mult4: 15 },
        'SKULL': { icon: 'fa-skull-crossbones', weight: 10, mult3: 50, mult4: 100 }
    },
    symbolKeys: ['ANCHOR', 'GEM', 'COWBOY', 'SKULL'],

    // Parâmetros da Simulação (Valores que podem ser lidos do DOM)
    bet: 10,
    ROWS: 3,
    COLS: 4,
    TARGET_RTP: 92, // LIDO DO INPUT
    RTP_PRECISION: 0.1,
    ADJUSTMENT_STEP: 0.01,

    // Parâmetros de Visualização (Controlados pelo DOM)
    numPlayers: 100,
    spinsPerPlayer: 20
};

// --- VARIÁVEIS DE ESTADO E REFERÊNCIAS ---

const $ = selector => document.querySelector(selector); // Utilidade para o DOM
const canvas = $('#simCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

let simulationTimeoutId = null;
let currentRTP = 0;
let iteration = 0;
let isRunning = false;
let weightedArr = [];

// Referências do DOM
const outputElement = $('#output');
const toggleButton = $('#toggleSim');
const rtpTargetInput = $('#rtp-target-input');
const rtpTargetDisplay = $('#rtp-target');


// --- FUNÇÕES DE INTERAÇÃO COM O DOM (VIEW) ---

/**
 * LÊ OS PESOS E MULTIPLICADORES DO DOM E ATUALIZA simConfig.
 */
function readGameParamsFromDOM() {
    // 1. Lê RTP Alvo
    simConfig.TARGET_RTP = parseFloat(rtpTargetInput.value) || 92;

    // 2. Lê Parâmetros de Símbolos
    simConfig.symbolKeys.forEach(key => {
        const sym = simConfig.symbols[key];
        const keyLower = key.toLowerCase();

        // Usando o operador || para fallback, garantindo que seja sempre um número
        sym.weight = parseFloat($(`#w-${keyLower}`).value) || sym.weight;
        sym.mult3 = parseFloat($(`#m3-${keyLower}`).value) || sym.mult3;
        sym.mult4 = parseFloat($(`#m4-${keyLower}`).value) || sym.mult4;
    });

    // 3. Lê Parâmetros de Visualização
    simConfig.numPlayers = parseInt($('#num-players').value) || simConfig.numPlayers;
    simConfig.spinsPerPlayer = parseInt($('#spins-player').value) || simConfig.spinsPerPlayer;
}

/**
 * Atualiza os campos de input do DOM para refletir o estado atual (simConfig).
 */
function updateDOMConfig() {
    simConfig.symbolKeys.forEach(key => {
        const sym = simConfig.symbols[key];
        // Garantindo consistência de precisão na UI
        $(`#w-${key.toLowerCase()}`).value = sym.weight.toFixed(0);
        $(`#m3-${key.toLowerCase()}`).value = sym.mult3.toFixed(4);
        $(`#m4-${key.toLowerCase()}`).value = sym.mult4.toFixed(4);
    });

    rtpTargetDisplay.textContent = simConfig.TARGET_RTP.toFixed(2) + '%';
}

/**
 * Constrói o array ponderado de símbolos para o gerador de números aleatórios.
 */
function buildWeightedArray() {
    // ... (Mantido o código original) ...
    weightedArr = [];
    simConfig.symbolKeys.forEach(key => {
        const weight = Math.max(0, simConfig.symbols[key].weight);
        for(let i = 0; i < weight; i++) {
            weightedArr.push(key);
        }
    });
}

// --- FUNÇÕES DO MOTOR DO JOGO (mantidas iguais) ---
// getRandomSymbol
// findZigzagPaths
// calculateWin
// simulateRTP
// simulatePlayersForPlot

// ... (Resto das funções do motor mantidas iguais) ...
function getRandomSymbol() {
    if (weightedArr.length === 0) return simConfig.symbolKeys[0];
    return weightedArr[Math.floor(Math.random() * weightedArr.length)];
}

function findZigzagPaths(results) {
    // ... (Mantido o código original) ...
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

function calculateWin(results) {
    // ... (Mantido o código original) ...
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

function simulateRTP(totalSpins) {
    // ... (Mantido o código original) ...
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

function simulatePlayersForPlot() {
    // ... (Mantido o código original) ...
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
    // ... (Mantido o código original) ...
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
    readGameParamsFromDOM(); // Garante que qualquer alteração manual seja considerada
    buildWeightedArray();
    const totalSpinsForRTP = 1000 * 50;
    currentRTP = simulateRTP(totalSpinsForRTP);

    // 2. Lógica de Ajuste Heurístico
    const symbolToAdjust = simConfig.symbolKeys[simConfig.symbolKeys.length - 1];
    const symbolObj = simConfig.symbols[symbolToAdjust];

    if (Math.abs(currentRTP - simConfig.TARGET_RTP) > simConfig.RTP_PRECISION) {

        let delta = 0;
        if (currentRTP < simConfig.TARGET_RTP) {
            // RTP abaixo do alvo, precisa AUMENTAR o multiplicador para subir o RTP
            delta = simConfig.ADJUSTMENT_STEP;
        } else {
            // RTP acima do alvo, precisa DIMINUIR o multiplicador para baixar o RTP
            delta = -simConfig.ADJUSTMENT_STEP;
        }

        // Aplica o ajuste, garantindo que o mult seja no mínimo 0.1
        symbolObj.mult4 = Math.max(0.1, symbolObj.mult4 + delta);

        updateDOMConfig();
        outputElement.textContent =
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

    if (toggleButton) {
        toggleButton.textContent = "Rodar Simulação";
        toggleButton.classList.remove('running');
        toggleButton.setAttribute('aria-checked', 'false'); // Acessibilidade: Parado
    }

    if (message) {
        outputElement.textContent += `\n${message}`; // Adiciona a mensagem ao log existente
        if (message.includes('ALVO ATINGIDO')) {
             console.log(message);
        } else {
             // Exibe um alerta somente se for parada manual
             alert(message);
        }
    }

    console.log(message || "Simulação Contínua Parada.");
}


// --- Lógica de Inicialização ---

document.addEventListener('DOMContentLoaded', () => {

    // 1. Inicializa o DOM com os valores lidos da simConfig inicial
    readGameParamsFromDOM(); // Lê os valores atuais no DOM (se forem diferentes do simConfig.js)
    updateDOMConfig();

    // 2. Configura o Listener do Botão
    if(toggleButton) {
        toggleButton.addEventListener('click', () => {
            if (!isRunning) {
                // INICIAR
                toggleButton.textContent = "Parar Simulação";
                toggleButton.classList.add('running');
                toggleButton.setAttribute('aria-checked', 'true'); // Acessibilidade: Rodando
                isRunning = true;
                iteration = 0;

                // Lê TUDO novamente (incluindo RTP e Parâmetros) antes de iniciar
                readGameParamsFromDOM();

                // Limpa o output e inicia o loop
                outputElement.textContent = `Iniciando simulação com RTP Alvo: ${simConfig.TARGET_RTP}%\n---------------------`;
                runCycle();
            } else {
                // PARAR
                stopSimulation("Simulação interrompida pelo usuário.");
            }
        });
    }
    
    // 3. Garante que o Canvas é inicializado corretamente após o carregamento
    // Cria uma visualização inicial (placeholder) se o contexto estiver disponível
    if (ctx) {
        drawSimulation(simulatePlayersForPlot());
    }
});
                 
