var manual = {
  "architecture": {
    "title": "Arquitetura da Máquina Virtual EWVM",
    "overview": "A EWVM é uma máquina virtual abstrata baseada numa arquitetura de pilha (Stack Machine). Ao contrário das arquiteturas baseadas em registos de uso geral (como x86-64 ou ARM), todas as operações aritméticas e lógicas retiram os seus operandos do topo de uma stack de operandos e empilham o resultado de volta.",
    "diagram": "                    ┌────────────────────────────────────────┐\n                    │               E W V M                  │\n                    │                                        │\n  Registos:         │   [ PC ]     [ SP ]   [ FP ]   [ GP ]  │\n                    └─────┬──────────┬────────┬────────┬─────┘\n                          │          │        │        │\n      ┌───────────────────┴──┐       │        │        │\n      │  Memória de Código   │       │        │        │\n      │  (Instruções & Tags) │       │        │        │\n      └──────────────────────┘       ▼        ▼        ▼\n                              ┌─────────────────────────────────────────────┐\n                              │     Operand Stack (Pilha)                   │\n                              │   - Variáveis Globais (gp - global pointer) │\n                              │   - Frames Locais (fp - frame pointer)      │\n                              │   - Avaliação Temporária                    │\n                              └──────────────┬──────────────────────────────┘\n                                             │\n      ┌──────────────────────┐               │               ┌──────────────────────┐\n      │      Call Stack      │◄──────────────┴──────────────►│     String Heap      │\n      │ (End. Retorno + FP)  │                               │ (Cadeias de Caract.) │\n      └──────────────────────┘                               └──────────────────────┘\n                                             ▲\n                                             │\n                              ┌──────────────┴───────────────┐\n                              │         Struct Heap          │\n                              │  (Blocos Dinâmicos / Arrays) │\n                              └──────────────────────────────┘",
    "registers": [
      {
        "name": "PC",
        "fullName": "Program Counter",
        "desc": "Aponta para o endereço da instrução atualmente em execução na memória de código."
      },
      {
        "name": "SP",
        "fullName": "Stack Pointer",
        "desc": "Aponta para o topo atual da pilha de operandos (número de elementos na pilha)."
      },
      {
        "name": "FP",
        "fullName": "Frame Pointer",
        "desc": "Aponta para a base da pilha de ativação local da função corrente. Definido pela instrução START (fp = sp) e atualizado dinamicamente em instruções CALL e RETURN."
      },
      {
        "name": "GP",
        "fullName": "Global Pointer",
        "desc": "Aponta para a base das variáveis globais (gp = 0), alocadas antes da instrução START."
      }
    ],
    "memoryAreas": [
      {
        "name": "Operand Stack (Pilha de Operandos)",
        "desc": "Pilha LIFO onde os cálculos ocorrem e onde as variáveis globais e locais residem. As globais são acedidas via gp[n] (pushg/storeg) e as locais via fp[n] (pushl/storel)."
      },
      {
        "name": "Call Stack (Pilha de Chamadas)",
        "desc": "Pilha interna utilizada pelas instruções CALL e RETURN para guardar os pares (PC de retorno, FP anterior), permitindo invocações aninhadas e recursivas de funções."
      },
      {
        "name": "String Heap",
        "desc": "Área de armazenamento dedicada a cadeias de caracteres literais (PUSHS) e strings lidas pelo utilizador (READ). A pilha armazena apenas apontadores para esta área."
      },
      {
        "name": "Struct Heap (Memória Dinâmica)",
        "desc": "Heap para alocação dinâmica de blocos estruturados e arrays (ALLOC e ALLOCN). Os elementos são lidos e escritos através de endereços e deslocamentos (LOAD, LOADN, STORE, STOREN)."
      },
      {
        "name": "Memória de Código",
        "desc": "Contém a sequência de instruções Assembly e etiquetas (labels) que definem o programa a ser executado."
      }
    ],
    "programStructure": [
      {
        "phase": "1. Reserva de Variáveis Globais",
        "desc": "Instruções de empilhamento inicial (ex: pushi 0 ou pushn N) que alocam espaço para variáveis globais acessíveis via gp[0], gp[1], etc."
      },
      {
        "phase": "2. Instrução START",
        "desc": "Marca o início da execução do programa principal, fixando fp = sp e delimitando o espaço de variáveis globais."
      },
      {
        "phase": "3. Corpo do Programa e STOP",
        "desc": "Lógica principal do programa (operações, ciclos, condicionais, I/O). Termina obrigatoriamente com a instrução STOP."
      },
      {
        "phase": "4. Procedimentos e Funções (Sub-rotinas)",
        "desc": "Colocadas habitualmente após a instrução STOP com as respetivas etiquetas (labels), terminando com a instrução RETURN."
      }
    ]
  },
  "categories": [
    {
      "name": "Aritmética Inteira",
      "instructions": [
        {
          "op": "ADD",
          "args": "-",
          "stack": "Retira n e m; empilha m + n",
          "desc": "Soma inteira de dois operandos."
        },
        {
          "op": "SUB",
          "args": "-",
          "stack": "Retira n e m; empilha m - n",
          "desc": "Subtração inteira (sub-topo menos topo)."
        },
        {
          "op": "MUL",
          "args": "-",
          "stack": "Retira n e m; empilha m * n",
          "desc": "Multiplicação inteira de dois operandos."
        },
        {
          "op": "DIV",
          "args": "-",
          "stack": "Retira n e m; empilha m / n",
          "desc": "Divisão inteira (sub-topo a dividir pelo topo)."
        },
        {
          "op": "MOD",
          "args": "-",
          "stack": "Retira n e m; empilha m % n",
          "desc": "Resto da divisão inteira de m por n."
        },
        {
          "op": "NOT",
          "args": "-",
          "stack": "Retira n; empilha 1 se n == 0, senão 0",
          "desc": "Negação lógica/aritmética do topo."
        }
      ]
    },
    {
      "name": "Comparações Inteiras",
      "instructions": [
        {
          "op": "INF",
          "args": "-",
          "stack": "Retira n e m; empilha 1 se m < n, senão 0",
          "desc": "Menor que (estritamente inferior)."
        },
        {
          "op": "INFEQ",
          "args": "-",
          "stack": "Retira n e m; empilha 1 se m <= n, senão 0",
          "desc": "Menor ou igual."
        },
        {
          "op": "SUP",
          "args": "-",
          "stack": "Retira n e m; empilha 1 se m > n, senão 0",
          "desc": "Maior que (estritamente superior)."
        },
        {
          "op": "SUPEQ",
          "args": "-",
          "stack": "Retira n e m; empilha 1 se m >= n, senão 0",
          "desc": "Maior ou igual."
        },
        {
          "op": "EQUAL",
          "args": "-",
          "stack": "Retira n e m; empilha 1 se m == n, senão 0",
          "desc": "Igualdade entre dois valores."
        }
      ]
    },
    {
      "name": "Lógica Booleana",
      "instructions": [
        {
          "op": "AND",
          "args": "-",
          "stack": "Retira n e m; empilha 1 se m!=0 e n!=0, senão 0",
          "desc": "Conjunção lógica (E booleano)."
        },
        {
          "op": "OR",
          "args": "-",
          "stack": "Retira n e m; empilha 1 se m!=0 ou n!=0, senão 0",
          "desc": "Disjunção lógica (OU booleano)."
        }
      ]
    },
    {
      "name": "Vírgula Flutuante (Reais)",
      "instructions": [
        {
          "op": "FADD",
          "args": "-",
          "stack": "Retira n e m; empilha m + n (float)",
          "desc": "Soma de dois números reais em vírgula flutuante."
        },
        {
          "op": "FSUB",
          "args": "-",
          "stack": "Retira n e m; empilha m - n (float)",
          "desc": "Subtração de dois números reais em vírgula flutuante."
        },
        {
          "op": "FMUL",
          "args": "-",
          "stack": "Retira n e m; empilha m * n (float)",
          "desc": "Multiplicação de dois números reais."
        },
        {
          "op": "FDIV",
          "args": "-",
          "stack": "Retira n e m; empilha m / n (float)",
          "desc": "Divisão de dois números reais em vírgula flutuante."
        },
        {
          "op": "FCOS",
          "args": "-",
          "stack": "Retira n; empilha cos(n)",
          "desc": "Calcula o cosseno do número real."
        },
        {
          "op": "FSIN",
          "args": "-",
          "stack": "Retira n; empilha sin(n)",
          "desc": "Calcula o seno do número real."
        },
        {
          "op": "FINF",
          "args": "-",
          "stack": "Retira n e m; empilha 1 se m < n, senão 0",
          "desc": "Comparação real menor que."
        },
        {
          "op": "FINFEQ",
          "args": "-",
          "stack": "Retira n e m; empilha 1 se m <= n, senão 0",
          "desc": "Comparação real menor ou igual."
        },
        {
          "op": "FSUP",
          "args": "-",
          "stack": "Retira n e m; empilha 1 se m > n, senão 0",
          "desc": "Comparação real maior que."
        },
        {
          "op": "FSUPEQ",
          "args": "-",
          "stack": "Retira n e m; empilha 1 se m >= n, senão 0",
          "desc": "Comparação real maior ou igual."
        }
      ]
    },
    {
      "name": "Conversões de Tipo",
      "instructions": [
        {
          "op": "ATOI",
          "args": "-",
          "stack": "Retira endereço de string; empilha inteiro convertido",
          "desc": "Converte cadeia de caracteres na String Heap para valor inteiro."
        },
        {
          "op": "ATOF",
          "args": "-",
          "stack": "Retira endereço de string; empilha real convertido",
          "desc": "Converte cadeia de caracteres na String Heap para valor real."
        },
        {
          "op": "ITOF",
          "args": "-",
          "stack": "Retira inteiro; empilha o valor convertido em real",
          "desc": "Converte número inteiro em número real (float)."
        },
        {
          "op": "FTOI",
          "args": "-",
          "stack": "Retira real; empilha inteiro truncado",
          "desc": "Converte número real em inteiro descartando a parte fracionária."
        },
        {
          "op": "STRI",
          "args": "-",
          "stack": "Retira inteiro; empilha endereço de nova string",
          "desc": "Converte valor inteiro em string e armazena-a na String Heap."
        },
        {
          "op": "STRF",
          "args": "-",
          "stack": "Retira real; empilha endereço de nova string",
          "desc": "Converte número real em string e armazena-a na String Heap."
        }
      ]
    },
    {
      "name": "Operações com Endereços e Strings",
      "instructions": [
        {
          "op": "PADD",
          "args": "-",
          "stack": "Retira inteiro n e endereço a; empilha a + n",
          "desc": "Deslocamento de endereço de ponteiro (aritmética de apontadores)."
        },
        {
          "op": "CONCAT",
          "args": "-",
          "stack": "Retira n e m; empilha endereço de (ms + ns)",
          "desc": "Concatena duas strings e guarda o resultado na String Heap."
        },
        {
          "op": "CHRCODE",
          "args": "-",
          "stack": "Retira string; empilha código ASCII do primeiro char",
          "desc": "Obtém o código ASCII do primeiro caractere de uma string."
        },
        {
          "op": "STRLEN",
          "args": "-",
          "stack": "Retira string; empilha comprimento",
          "desc": "Devolve o número de caracteres de uma string."
        },
        {
          "op": "CHARAT",
          "args": "-",
          "stack": "Retira índice n e string m; empilha código ASCII em m[n]",
          "desc": "Devolve o código ASCII do caractere na posição n da string."
        }
      ]
    },
    {
      "name": "Empilhamento de Dados (PUSH)",
      "instructions": [
        {
          "op": "PUSHI n",
          "args": "Inteiro n",
          "stack": "Empilha n",
          "desc": "Empilha a constante inteira n."
        },
        {
          "op": "PUSHN n",
          "args": "Inteiro n",
          "stack": "Empilha n zeros inteiros",
          "desc": "Empilha n vezes o valor 0 (usado para reservar blocos/variáveis)."
        },
        {
          "op": "PUSHF f",
          "args": "Real f",
          "stack": "Empilha f",
          "desc": "Empilha a constante real em vírgula flutuante f."
        },
        {
          "op": "PUSHS s",
          "args": "String s",
          "stack": "Guarda s na String Heap e empilha endereço",
          "desc": "Armazena literal na String Heap e empilha o respetivo endereço."
        },
        {
          "op": "PUSHG n",
          "args": "Inteiro n",
          "stack": "Empilha o valor de gp[n]",
          "desc": "Empilha o valor da variável global no índice n."
        },
        {
          "op": "PUSHL n",
          "args": "Inteiro n",
          "stack": "Empilha o valor de fp[n]",
          "desc": "Empilha o valor da variável local no índice n do frame atual."
        },
        {
          "op": "PUSHSP",
          "args": "-",
          "stack": "Empilha o valor do registador SP",
          "desc": "Lê o apontador de topo de pilha corrente."
        },
        {
          "op": "PUSHFP",
          "args": "-",
          "stack": "Empilha o valor do registador FP",
          "desc": "Lê a base do frame de ativação corrente."
        },
        {
          "op": "PUSHGP",
          "args": "-",
          "stack": "Empilha o valor do registador GP",
          "desc": "Lê a base das variáveis globais."
        },
        {
          "op": "PUSHST n",
          "args": "Inteiro n",
          "stack": "Empilha o endereço do bloco struct n",
          "desc": "Empilha o endereço de índice n na Struct Heap."
        }
      ]
    },
    {
      "name": "Manipulação de Pilha",
      "instructions": [
        {
          "op": "DUP [n]",
          "args": "[Inteiro n]",
          "stack": "Duplica o topo da pilha n vezes (defeito 1)",
          "desc": "Duplica e empilha n cópias do elemento no topo da pilha."
        },
        {
          "op": "DUPN",
          "args": "-",
          "stack": "Retira n; duplica o novo topo n vezes",
          "desc": "Duplicação dinâmica com contagem obtida da própria pilha."
        },
        {
          "op": "COPY n",
          "args": "Inteiro n",
          "stack": "Copia os n elementos do topo e empilha-os na mesma ordem",
          "desc": "Clona os n elementos superiores da pilha mantendo a ordem."
        },
        {
          "op": "COPYN",
          "args": "-",
          "stack": "Retira n; clona os n elementos do topo",
          "desc": "Clonagem dinâmica dos n elementos superiores."
        },
        {
          "op": "POP [n]",
          "args": "[Inteiro n]",
          "stack": "Remove n elementos do topo (defeito 1)",
          "desc": "Descarta os elementos superiores da pilha."
        },
        {
          "op": "POPN",
          "args": "-",
          "stack": "Retira n; descarta os n elementos seguintes",
          "desc": "Descarte dinâmico de n elementos da pilha."
        },
        {
          "op": "SWAP",
          "args": "-",
          "stack": "Retira v e m; empilha v depois m",
          "desc": "Inverte a ordem dos dois elementos no topo da pilha."
        },
        {
          "op": "CHECK n, p",
          "args": "Inteiros n, p",
          "stack": "Verifica n <= topo <= p",
          "desc": "Valida se o topo se encontra no intervalo [n, p]; lança erro se falso."
        }
      ]
    },
    {
      "name": "Armazenamento em Memória (STORE & LOAD)",
      "instructions": [
        {
          "op": "STOREG n",
          "args": "Inteiro n",
          "stack": "Retira valor; guarda em gp[n]",
          "desc": "Armazena o valor do topo na variável global de offset n."
        },
        {
          "op": "STOREL n",
          "args": "Inteiro n",
          "stack": "Retira valor; guarda em fp[n]",
          "desc": "Armazena o valor do topo na variável local de offset n."
        },
        {
          "op": "STORE n",
          "args": "Inteiro n",
          "stack": "Retira endereço a e valor v; guarda v em a[n]",
          "desc": "Guarda valor no deslocamento constante n a partir do endereço base a."
        },
        {
          "op": "STOREN",
          "args": "-",
          "stack": "Retira endereço a, índice n e valor v; guarda v em a[n]",
          "desc": "Guarda valor com índice dinâmico em memória estruturada."
        },
        {
          "op": "LOAD n",
          "args": "Inteiro n",
          "stack": "Retira endereço a; empilha valor em a[n]",
          "desc": "Lê valor no deslocamento constante n a partir do endereço base a."
        },
        {
          "op": "LOADN",
          "args": "-",
          "stack": "Retira endereço a e índice n; empilha valor em a[n]",
          "desc": "Lê valor com índice dinâmico em memória estruturada."
        }
      ]
    },
    {
      "name": "Gestão de Heap Dinâmica",
      "instructions": [
        {
          "op": "ALLOC n",
          "args": "Inteiro n",
          "stack": "Aloca bloco de n células; empilha endereço base",
          "desc": "Aloca um bloco contíguo de dimensão estática n na Struct Heap."
        },
        {
          "op": "ALLOCN",
          "args": "-",
          "stack": "Retira tamanho n; aloca bloco e empilha endereço",
          "desc": "Aloca dinamicamente um bloco de dimensão n na Struct Heap."
        },
        {
          "op": "FREE",
          "args": "-",
          "stack": "Retira endereço a; liberta o bloco",
          "desc": "Liberta a memória do bloco alocado na Struct Heap."
        },
        {
          "op": "POPST",
          "args": "-",
          "stack": "Remove o último bloco alocado na heap",
          "desc": "Desaloca o último bloco estruturado da Heap."
        }
      ]
    },
    {
      "name": "Entrada e Saída (I/O)",
      "instructions": [
        {
          "op": "READ",
          "args": "-",
          "stack": "Lê string do teclado, guarda na Heap e empilha endereço",
          "desc": "Pausa a VM aguardando entrada do utilizador no terminal."
        },
        {
          "op": "WRITEI",
          "args": "-",
          "stack": "Retira inteiro do topo e imprime no terminal",
          "desc": "Escreve um número inteiro na consola."
        },
        {
          "op": "WRITEF",
          "args": "-",
          "stack": "Retira real do topo e imprime no terminal",
          "desc": "Escreve um número real em vírgula flutuante na consola."
        },
        {
          "op": "WRITES",
          "args": "-",
          "stack": "Retira endereço da String Heap e imprime o texto",
          "desc": "Escreve uma cadeia de caracteres na consola."
        },
        {
          "op": "WRITELN",
          "args": "-",
          "stack": "Não altera a pilha; imprime mudança de linha",
          "desc": "Escreve uma nova linha (\n) no terminal."
        },
        {
          "op": "WRITECHR",
          "args": "-",
          "stack": "Retira código ASCII inteiro e imprime o caractere",
          "desc": "Escreve um único caractere correspondente ao código ASCII."
        }
      ]
    },
    {
      "name": "Controlo de Fluxo e Sub-rotinas",
      "instructions": [
        {
          "op": "PUSHA label",
          "args": "Etiqueta label",
          "stack": "Empilha o endereço de instrução da etiqueta",
          "desc": "Obtém o endereço da etiqueta de código para salto ou chamada."
        },
        {
          "op": "JUMP label",
          "args": "Etiqueta label",
          "stack": "Não altera pilha; atualiza PC para a etiqueta",
          "desc": "Salto incondicional de execução para a etiqueta especificada."
        },
        {
          "op": "JZ label",
          "args": "Etiqueta label",
          "stack": "Retira valor v; se v == 0 salta para label, senão PC++",
          "desc": "Salto condicional se o topo for zero (falso). Base de IF e Ciclos."
        },
        {
          "op": "CALL",
          "args": "-",
          "stack": "Retira endereço da sub-rotina; guarda retorno na Call Stack",
          "desc": "Invoca função: guarda (PC+1, FP) na Call Stack e define FP = SP."
        },
        {
          "op": "RETURN",
          "args": "-",
          "stack": "Restaura SP = FP, recupera contexto e retorna ao chamador",
          "desc": "Retorna de sub-rotina descartando variáveis locais do frame."
        }
      ]
    },
    {
      "name": "Ciclo de Vida do Programa",
      "instructions": [
        {
          "op": "START",
          "args": "-",
          "stack": "Define FP = SP (marca início do programa)",
          "desc": "Inicializa o ponteiro de frame principal após alocação de globais."
        },
        {
          "op": "STOP",
          "args": "-",
          "stack": "Termina a execução do programa",
          "desc": "Interrompe o ciclo de execução da máquina virtual."
        },
        {
          "op": "NOP",
          "args": "-",
          "stack": "Não efetua qualquer operação",
          "desc": "Instrução neutra de preenchimento."
        },
        {
          "op": "ERR \"msg\"",
          "args": "String mensagem",
          "stack": "Interrompe a execução com erro",
          "desc": "Lança uma exceção controlada com a mensagem fornecida."
        }
      ]
    }
  ],
  "patterns": [
    {
      "title": "Expressões em RPN (Notação Polaca Invertida)",
      "desc": "Numa máquina de pilha, expressões aritméticas não usam parêntesis; são avaliadas em notação pós-fixada. Para avaliar A + B, empilha-se A, empilha-se B e chama-se ADD. Para operadores não-comutativos (como A - B e A / B), a instrução retira primeiro o topo (B) e depois o sub-topo (A), empilhando A - B.",
      "code": "// Expressão: ((15 + 25) * 3) - (50 / 2)\npushi 15\npushi 25\nadd          // (15 + 25) = 40\npushi 3\nmul          // 40 * 3 = 120\npushi 50\npushi 2\ndiv          // 50 / 2 = 25\nsub          // 120 - 25 = 95\nwritei\nwriteln"
    },
    {
      "title": "Padrão Canónico de Seleção Condicional (IF-THEN-ELSE)",
      "desc": "Para implementar condicionais, avalia-se a condição no topo da pilha (resultado booleano 1 ou 0). A instrução JZ label desvia para o ramo ELSE caso o valor seja 0. No fim do ramo THEN, um JUMP incondicional salta por cima do bloco ELSE.",
      "code": "    // Avaliar condição (ex: x > 0)\n    pushg 0\n    pushi 0\n    sup\n    jz senao\n\nentao:\n    pushs \"Positivo\"\n    writes\n    writeln\n    jump fimif\n\nsenao:\n    pushs \"Nao positivo\"\n    writes\n    writeln\n\nfimif:"
    },
    {
      "title": "Padrão Canónico de Ciclos Iterativos (WHILE)",
      "desc": "Um ciclo iterativo define uma etiqueta no início do teste de condição. Se a condição for falsa (0), o JZ salta para fora do ciclo. No fim do corpo do ciclo, um JUMP regressa ao início para reavaliar a condição.",
      "code": "ciclo:\n    // 1. Avaliar condição de paragem (ex: i <= N)\n    pushg 1      // i\n    pushg 0      // N\n    infeq\n    jz fimciclo // Se falso (0), sai do ciclo\n\n    // 2. Corpo do ciclo: acumulador += i; i++\n    pushg 2\n    pushg 1\n    add\n    storeg 2\n\n    pushg 1\n    pushi 1\n    add\n    storeg 1\n\n    jump ciclo\n\nfimciclo:"
    },
    {
      "title": "Alocação e Manipulação de Arrays na Struct Heap",
      "desc": "A Struct Heap armazena vetores indexados. ALLOCN retira da pilha o tamanho N e aloca o bloco contíguo, empilhando o seu endereço base. STOREN recebe [endereço, índice, valor] e armazena na heap. LOADN recebe [endereço, índice] e empilha o valor.",
      "code": "    // Alocar array de N inteiros na Heap\n    pushg 0      // tamanho N\n    allocn\n    storeg 1     // guarda endereco base em gp[1]\n\n    // Escrever valor 42 no indice 0: addr[0] = 42\n    pushg 1      // endereco base\n    pushi 0      // indice i\n    pushi 42     // valor\n    storen\n\n    // Ler valor de addr[0]\n    pushg 1\n    pushi 0\n    loadn\n    writei\n    writeln"
    },
    {
      "title": "Convenção de Chamada de Funções e Frame de Ativação",
      "desc": "Chamadas procedimentais com CALL guardam o par (PC+1, FP) na Call Stack e fixam FP = SP. Os argumentos passados encontram-se em offsets negativos a partir de FP: o último argumento em fp[-1], o anterior em fp[-2], etc. Variáveis locais começam em fp[0]. RETURN restaura SP = FP, recupera o frame anterior e regressa.",
      "code": "start\n    // Passar argumento = 9 e chamar funcao\n    pushi 9\n    pusha quadrado\n    call\n    stop\n\n// Procedimento quadrado(x)\nquadrado:\n    // Ler argumento x que se encontra em fp[-1]\n    pushfp\n    load -1\n    dup 1\n    mul\n    writei\n    writeln\n    return"
    }
  ]
};

module.exports = {manual};
