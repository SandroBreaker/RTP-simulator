🚀 SlotRTP Optimizer: Motor de Otimização de RTP
Este projeto é um simulador e otimizador heurístico para o Return to Player (RTP) de um jogo de slot de 3 linhas e 4 colunas. Ele demonstra como um multiplicador de símbolo ajustável (o Skull) pode ser iterativamente calibrado para se aproximar de um RTP alvo definido.
✨ Destaques do Projeto (UX/CX)
 * Interface Intuitiva: Design Dark Mode otimizado para dispositivos móveis (Mobile First) para facilitar a interação e leitura.
 * Controle Total: Permite a manipulação dos pesos e multiplicadores de todos os símbolos em tempo real.
 * Visualização de Volatilidade: O <canvas> exibe a jornada de múltiplos jogadores simulados, oferecendo uma visão clara da volatilidade do jogo com o RTP atual.
 * Otimização Contínua: Um algoritmo heurístico ajusta o multiplicador do símbolo Skull (x4) até que o RTP simulado atinja o valor alvo dentro de uma margem de precisão.
⚙️ Tecnologias Utilizadas
| Tecnologia | Descrição |
|---|---|
| HTML5 | Estrutura semântica e acessível (A11Y). |
| CSS3 | Estilização responsiva, Dark Mode e foco em UX/Mobile. |
| JavaScript (ES6) | Motor de simulação e otimização heurística, manipulação do DOM e desenho no Canvas. |
| Font Awesome | Ícones para identificação visual rápida dos símbolos. |
🕹️ Funcionalidades do Slot
O simulador utiliza uma lógica de vitória complexa, refletindo slots modernos:
 * Vitórias Horizontais: 3 ou 4 símbolos iguais adjacentes na mesma linha.
 * Vitórias Diagonais/Especiais: Inclui as diagonais principais e padrões especiais de 3/4 símbolos.
 * Vitórias Zig-Zag (DFS): Implementa um algoritmo de backtracking (DFS) para encontrar caminhos de vitória contínuos em linhas adjacentes.
🛠️ Como Utilizar
Basta abrir o arquivo index.html em qualquer navegador moderno.
📝 Parâmetros Chave
| Elemento | Configuração | Impacto |
|---|---|---|
| RTP Alvo (%) | Define o objetivo do algoritmo de otimização (ex: 92.0). |  |
| Pesos (W) | Frequência de cada símbolo na bobina. | Altera a probabilidade de acerto. |
| Multiplicadores (x3/x4) | Pagamento por 3 ou 4 símbolos na linha de pagamento. | Altera o RTP e a Volatilidade. |
| Skull (Ajuste) | O multiplicador x4 deste símbolo será automaticamente ajustado pelo motor. | Mecanismo de calibração do RTP. |
📊 Painel de Visualização
 * Nº Giros p/ Jogador: Quantas rodadas cada "jogador" simulado fará no gráfico.
 * Nº Jogadores: Quantas linhas de jornada de saldo serão desenhadas no Canvas.
▶️ Rodando a Simulação
 * Ajuste os Parâmetros: Defina o RTP Alvo e os pesos/multiplicadores iniciais.
 * Inicie: Clique no botão "Rodar Simulação".
 * Observação: O motor iniciará um loop contínuo:
   * Loop 1: Simula milhares de rodadas para calcular o RTP Atual.
   * Loop 2: Se RTP Atual \neq RTP Alvo, ele ajusta o multiplicador do Skull (mult4) na direção necessária.
   * Loop 3: Simula a jornada de jogadores (volatilidade) e atualiza o gráfico.
 * Conclusão: A simulação para automaticamente quando o RTP atinge o alvo dentro da precisão definida (0.1%).
🛑 Estrutura de Arquivos
/
├── index.html        # Estrutura e Interface
├── styles.css        # Estilização Otimizada (CSS aprimorado)
└── app.js            # Motor de Simulação e Lógica de Otimização

