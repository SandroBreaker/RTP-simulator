🚀 Simulador e Otimizador de RTP (Retorno ao Jogador)
Este projeto é um Motor Heurístico de Otimização desenvolvido para ajustar dinamicamente os parâmetros de pagamento de um símbolo específico em um jogo de slot (caça-níquel), com o objetivo de atingir um RTP (Return To Player) alvo predefinido.
O simulador é crucial para desenvolvedores e matemáticos de jogos que precisam validar rapidamente a estabilidade e o equilíbrio de um modelo econômico complexo sob condições de alta frequência de simulação.
🎯 Funcionalidades Principais
Otimização Heurística de RTP: Utiliza um loop de feedback contínuo para ajustar os multiplicadores do símbolo Skull (Caveira) até que o RTP simulado se estabilize dentro de uma precisão de 0.1\% do valor alvo.
Simulação de Alto Volume: Calcula o RTP com base em 50.000 giros por ciclo de otimização para garantir um resultado estatisticamente robusto.
Visualização de Volatilidade (CX/UX): O <canvas> plota a jornada de saldo de múltiplos jogadores, oferecendo uma visão clara sobre a volatilidade do jogo e a experiência do cliente (CX) ao longo de 20 rodadas.
Parâmetros Configuráveis: Permite ajustar pesos (frequência) e multiplicadores para vários símbolos (Anchor, Gem, Cowboy, Skull), o RTP alvo e os parâmetros de visualização.
Lógica de Vitória Complexa: A simulação inclui caminhos de vitória complexos (Horizontais, Diagonais Simples/Especiais e Zig-Zag com Backtracking) para replicar a complexidade de um slot moderno.
🛠️ Tecnologias
O simulador é uma aplicação web leve e client-side:
