# 📘 Máquina Virtual Didática EWVM (v2.0) — Next Gen

> **Universidade do Minho — Licenciatura em Engenharia Informática / Ciências da Computação**  
> **Unidade Curricular:** Processamento de Linguagens / Compiladores (PLC)  
> **Autor da Especificação & Tutorial:** Prof. José Carlos Ramalho  
> **Plataforma Oficial:** [https://ewvm.epl.di.uminho.pt/](https://ewvm.epl.di.uminho.pt/)

A **EWVM (Educational Web Virtual Machine)** é uma máquina virtual abstrata baseada numa **arquitetura de pilha (Stack Machine)**, concebida para o ensino prático de compiladores, geração de código e execução passo-a-passo.

Esta versão **NextGen** adota uma arquitetura modularizada e contentorizada:
- **`backend`**: API REST em Node.js/Express com motor de execução, emulação de registradores/pilha/heaps, persistência efémera de sessões e parser sintático (Peggy).
- **`frontend`**: Interface moderna em Vue 3, Vite e Monaco Editor com visualização em tempo real da Pilha de Operandos, Call Stack, String Heap, Struct Heap, terminais I/O, controlo temporal passo-a-passo e destaques de linha.

---

## 🏛️ 1. Arquitetura da EWVM

Ao contrário de arquiteturas orientadas a registos de uso geral (como x86-64 ou ARM), todas as instruções aritméticas, relacionais e lógicas operam diretamente sobre o topo da **Pilha de Operandos**.

```
                    ┌────────────────────────────────────────┐
                    │               E W V M                  │
                    │                                        │
  Registos:         │   [ PC ]     [ SP ]   [ FP ]   [ GP ]  │
                    └─────┬──────────┬────────┬────────┬─────┘
                          │          │        │        │
      ┌───────────────────┴──┐       │        │        │
      │  Memória de Código   │       │        │        │
      │  (Instruções & Tags) │       │        │        │
      └──────────────────────┘       ▼        ▼        ▼
                              ┌─────────────────────────────────────────────┐
                              │     Operand Stack (Pilha)                   │
                              │   - Variáveis Globais (gp - global pointer) │
                              │   - Frames Locais (fp - frame pointer)      │
                              │   - Avaliação Temporária                    │
                              └──────────────┬──────────────────────────────┘
                                             │
      ┌──────────────────────┐               │               ┌──────────────────────┐
      │      Call Stack      │◄──────────────┴──────────────►│     String Heap      │
      │ (End. Retorno + FP)  │                               │ (Cadeias de Caract.) │
      └──────────────────────┘                               └──────────────────────┘
                                             ▲
                                             │
                              ┌──────────────┴───────────────┐
                              │         Struct Heap          │
                              │  (Blocos Dinâmicos / Arrays) │
                              └──────────────────────────────┘
```

### 1.1 Registos Principais
| Registo | Nome Completo | Descrição |
| :--- | :--- | :--- |
| **`PC`** | Program Counter | Aponta para o endereço da instrução Assembly atualmente em execução. |
| **`SP`** | Stack Pointer | Aponta para o topo corrente da pilha de operandos (tamanho atual da pilha). |
| **`FP`** | Frame Pointer | Aponta para a base da pilha de ativação local da função corrente. Fixado em `START` e gerido por `CALL`/`RETURN`. |
| **`GP`** | Global Pointer | Aponta para a base das variáveis globais (`gp = 0`), alocadas antes da instrução `START`. |

### 1.2 Espaços de Memória
1. **Operand Stack (Pilha de Operandos):** Pilha LIFO onde decorrem todas as operações e onde residem as variáveis globais (`pushg`/`storeg`) e locais (`pushl`/`storel`).
2. **Call Stack (Pilha de Chamadas):** Utilizada pelas instruções `CALL` e `RETURN` para guardar pares `(PC de regresso, FP anterior)`.
3. **String Heap:** Armazenamento isolado de cadeias literais (`PUSHS`) e textos lidos do utilizador (`READ`). A pilha lida apenas com apontadores numéricos para esta heap.
4. **Struct Heap:** Área dinâmica para blocos estruturados e vetores (`ALLOC` e `ALLOCN`). Permite leitura e escrita indexadas via `LOAD`, `LOADN`, `STORE` e `STOREN`.
5. **Memória de Código:** Conjunto de instruções Assembly e etiquetas simbólicas do programa.

### 1.3 Esqueleto Canónico de um Programa
```assembly
// 1. Reserva de Variáveis Globais (antes de START)
pushi 0    // gp[0]
pushi 0    // gp[1]

start
    // 2. Corpo Principal do Programa
    pushs "Ola Mundo!"
    writes
    writeln
stop

// 3. Sub-rotinas e Funções (após STOP)
minha_funcao:
    ...
    return
```

---

## 📖 2. Manual de Instruções (ISA EWVM 2.0)

| Categoria | Instrução | Argumentos | Efeito na Pilha | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| **Aritmética Inteira** | `ADD` | - | Retira $n, m$; empilha $m + n$ | Soma inteira |
| | `SUB` | - | Retira $n, m$; empilha $m - n$ | Subtração inteira ($m - n$) |
| | `MUL` | - | Retira $n, m$; empilha $m \times n$ | Multiplicação inteira |
| | `DIV` | - | Retira $n, m$; empilha $m / n$ | Divisão inteira ($m / n$) |
| | `MOD` | - | Retira $n, m$; empilha $m \pmod n$ | Resto da divisão inteira |
| | `NOT` | - | Retira $n$; empilha $1$ se $n = 0$, senão $0$ | Negação booleana/aritmética |
| **Comparações** | `INF` | - | Retira $n, m$; empilha $1$ se $m < n$, senão $0$ | Estritamente menor |
| | `INFEQ` | - | Retira $n, m$; empilha $1$ se $m \le n$, senão $0$ | Menor ou igual |
| | `SUP` | - | Retira $n, m$; empilha $1$ se $m > n$, senão $0$ | Estritamente maior |
| | `SUPEQ` | - | Retira $n, m$; empilha $1$ se $m \ge n$, senão $0$ | Maior ou igual |
| | `EQUAL` | - | Retira $n, m$; empilha $1$ se $m = n$, senão $0$ | Igualdade |
| **Lógica Booleana** | `AND` | - | Retira $n, m$; empilha $1$ se $m \neq 0 \land n \neq 0$, senão $0$ | Conjunção lógica |
| | `OR` | - | Retira $n, m$; empilha $1$ se $m \neq 0 \lor n \neq 0$, senão $0$ | Disjunção lógica |
| **Vírgula Flutuante** | `FADD`, `FSUB` | - | Adição / Subtração de números reais | Operações com floats |
| | `FMUL`, `FDIV` | - | Multiplicação / Divisão de números reais | Operações com floats |
| | `FCOS`, `FSIN` | - | Funções trigonométricas (radianos) | Cosseno e Seno |
| | `FINF`, `FINFEQ` | - | Comparações de reais ($<$, $\le$) | Operações relacionais float |
| | `FSUP`, `FSUPEQ` | - | Comparações de reais ($>$, $\ge$) | Operações relacionais float |
| **Conversões** | `ATOI` / `ATOF` | - | Converte string na Heap para Inteiro / Real | Conversão a partir de string |
| | `ITOF` / `FTOI` | - | Converte Inteiro $\leftrightarrow$ Real | Conversão numérica |
| | `STRI` / `STRF` | - | Converte Inteiro / Real em string e empilha endereço | Serialização em string |
| **Empilhamento** | `PUSHI n` | Inteiro | Empilha constante inteira $n$ | Carrega literal inteiro |
| | `PUSHN n` | Inteiro | Empilha $n$ vezes o inteiro $0$ | Reserva espaço |
| | `PUSHF f` | Real | Empilha constante real $f$ | Carrega literal float |
| | `PUSHS "s"` | String | Armazena na String Heap e empilha endereço | Carrega literal de texto |
| | `PUSHG n` | Inteiro | Empilha o valor de `gp[n]` | Leitura de variável global |
| | `PUSHL n` | Inteiro | Empilha o valor de `fp[n]` | Leitura de variável local |
| | `PUSHSP` / `PUSHFP` / `PUSHGP` | - | Empilha o valor dos registadores | Leitura de ponteiros |
| **Manipulação de Pilha** | `DUP [n]` | [Inteiro] | Duplica o elemento do topo $n$ vezes | Duplicação estática |
| | `DUPN` | - | Retira $n$; duplica o novo topo $n$ vezes | Duplicação dinâmica |
| | `COPY n` | Inteiro | Copia os $n$ elementos do topo | Clonagem mantendo ordem |
| | `COPYN` | - | Retira $n$; clona os $n$ elementos superiores | Clonagem dinâmica |
| | `POP [n]` | [Inteiro] | Descarta $n$ elementos do topo | Descarte |
| | `POPN` | - | Retira $n$; descarta $n$ elementos | Descarte dinâmico |
| | `SWAP` | - | Troca a posição dos 2 elementos do topo | Inversão de topo |
| | `CHECK n, p` | $n, p$ | Valida $n \le \text{topo} \le p$ (erro se falso) | Verificação de limites |
| **Armazenamento** | `STOREG n` | Inteiro | Retira valor e guarda em `gp[n]` | Escrita em global |
| | `STOREL n` | Inteiro | Retira valor e guarda em `fp[n]` | Escrita em local |
| | `STORE n` | Inteiro | Retira endereço $a$ e valor $v$; guarda em $a[n]$ | Escrita com offset fixo |
| | `STOREN` | - | Retira endereço $a$, índice $n$ e valor $v$; guarda em $a[n]$ | Escrita com índice dinâmico |
| | `LOAD n` | Inteiro | Retira endereço $a$; empilha valor em $a[n]$ | Leitura com offset fixo |
| | `LOADN` | - | Retira endereço $a$ e índice $n$; empilha em $a[n]$ | Leitura com índice dinâmico |
| **Heap Dinâmica** | `ALLOC n` | Inteiro | Aloca bloco de $n$ células; empilha endereço | Alocação com dimensão estática |
| | `ALLOCN` | - | Retira tamanho $n$; aloca bloco dinâmico | Alocação com dimensão dinâmica |
| | `FREE` | - | Retira endereço e liberta bloco estruturado | Desalocação de memória |
| **Input / Output** | `READ` | - | Lê string do teclado; empilha endereço | Entrada interativa |
| | `WRITEI` / `WRITEF` | - | Imprime Inteiro / Real do topo da pilha | Escrita numérica |
| | `WRITES` | - | Imprime a cadeia correspondente ao endereço | Escrita de texto |
| | `WRITELN` | - | Imprime mudança de linha (`\n`) | Nova linha |
| | `WRITECHR` | - | Retira código ASCII inteiro e imprime caractere | Escrita de caractere ASCII |
| **Controlo de Fluxo** | `PUSHA label` | Etiqueta | Empilha o endereço da etiqueta | Endereço de destino |
| | `JUMP label` | Etiqueta | Salto incondicional para `label` | Salto incondicional |
| | `JZ label` | Etiqueta | Retira $v$; se $v = 0$ salta para `label`, senão $PC{+}{+}$ | Salto se falso / zero |
| | `CALL` | - | Invoca sub-rotina: guarda $(PC+1, FP)$ e define $FP = SP$ | Chamada de função |
| | `RETURN` | - | Restaura $SP = FP$, recupera contexto e retorna | Regresso de função |
| **Ciclo de Vida** | `START` | - | Marca início do programa principal ($FP = SP$) | Início |
| | `STOP` | - | Termina a execução do programa | Término |
| | `NOP` | - | Não realiza nenhuma operação | No-operation |
| | `ERR "msg"` | String | Interrompe a execução com erro | Lançamento de erro |

---

## 💡 3. Padrões Canónicos de Tradução

### 3.1 Avaliação de Expressões e Notação Pós-fixada (RPN)
Expressões como $((15 + 25) \times 3) - (50 / 2)$ são avaliadas sequencialmente sem recurso a parêntesis:
```assembly
pushi 15
pushi 25
add          // (15 + 25) = 40
pushi 3
mul          // 40 * 3 = 120
pushi 50
pushi 2
div          // 50 / 2 = 25
sub          // 120 - 25 = 95
writei
writeln
```

### 3.2 Seleção Condicional (`IF-THEN-ELSE`)
```assembly
    // Avaliação da condição
    ...
    jz senao        // Se falso (0), salta para o ramo ELSE

entao:
    // Bloco THEN
    ...
    jump fim_if     // Salta por cima do bloco ELSE

senao:
    // Bloco ELSE
    ...

fim_if:
```

### 3.3 Ciclos Iterativos (`WHILE`)
```assembly
ciclo:
    // Avaliar condição de continuação
    ...
    jz fim_ciclo    // Se falso (0), sai do ciclo

    // Corpo do ciclo
    ...

    jump ciclo      // Volta a avaliar a condição
fim_ciclo:
```

### 3.4 Manipulação de Arrays na Heap
```assembly
    // Alocar array de N inteiros
    pushg 0         // tamanho N
    allocn
    storeg 1        // guarda endereço base em gp[1]

    // Escrita em addr[i] = valor:
    pushg 1         // endereço
    pushg 2         // índice i
    pushg 3         // valor
    storen

    // Leitura de addr[i]:
    pushg 1         // endereço
    pushg 2         // índice i
    loadn
```

### 3.5 Funções, Parâmetros e Frames de Ativação
- O chamador empilha os argumentos e invoca com `pusha func; call`.
- Dentro da função, `FP` coincide com `SP` no momento da chamada:
  - Último argumento em `fp[-1]` (acedido via `pushfp; load -1`).
  - Penúltimo argumento em `fp[-2]` (acedido via `pushfp; load -2`).
  - Variáveis locais criadas na função começam em `fp[0]`, `fp[1]`.
- O valor de retorno pode ser escrito no offset do argumento com `storel -1`.
- A instrução `RETURN` limpa as variáveis locais restaurando `SP = FP` e devolve o controlo ao chamador.

---

## 📂 4. Catálogo de Exemplos e Exercícios do Tutorial

O catálogo foi totalmente reformulado com os **23 programas didáticos** extraídos da **Ficha Prática Tutorial**:

| Ficheiro | Nível / Categoria | Dificuldade | Descrição Resumida |
| :--- | :--- | :---: | :--- |
| `exemplo_1_expressao_rpn.vm` | Nível 1 - Aritmética e I/O | 1 | Avaliação de expressão complexa $((15+25) \times 3) - (50/2)$ em RPN. |
| `exercicio_1_1_retangulo.vm` | Nível 1 - Aritmética e I/O | 1 | Leitura de base e altura; cálculo de perímetro $2(b+h)$ e área $b \times h$. |
| `exercicio_1_2_celsius_fahrenheit.vm` | Nível 1 - Aritmética e I/O | 1 | Conversão Celsius para Fahrenheit em vírgula flutuante (`ITOF`, `FMUL`, `FADD`). |
| `exercicio_1_3_manipulacao_pilha.vm` | Nível 1 - Aritmética e I/O | 1 | Cálculo de $2x^2 + 5x$ manipulando unicamente o topo da pilha (`DUP`, `SWAP`, `POP`). |
| `exemplo_2_par_impar.vm` | Nível 2 - Condicionais (IF-ELSE) | 2 | Verificação de número Par ou Ímpar utilizando `MOD 2` e `JZ`. |
| `exercicio_2_1_maior_2_numeros.vm` | Nível 2 - Condicionais (IF-ELSE) | 2 | Leitura de dois inteiros e determinação do maior com `SUP` e `JZ`. |
| `exercicio_2_2_maximo_3_numeros.vm` | Nível 2 - Condicionais (IF-ELSE) | 2 | Seleção condicional aninhada para calcular o máximo entre $A$, $B$ e $C$. |
| `exercicio_2_3_classificacao_notas.vm` | Nível 2 - Condicionais (IF-ELSE) | 2 | Classificação qualitativa de nota: Excelente ($\ge 16$), Suficiente ($\ge 10$) ou Reprovado. |
| `exemplo_3_somatorio_1_a_n.vm` | Nível 3 - Ciclos Iterativos | 3 | Cálculo iterativo da soma $\sum_{i=1}^N i$ com padrão canónico de ciclo `while`. |
| `exercicio_3_1_fatorial_iterativo.vm` | Nível 3 - Ciclos Iterativos | 3 | Cálculo iterativo de $N!$ com acumulador de produto. |
| `exercicio_3_2_potencia_inteira.vm` | Nível 3 - Ciclos Iterativos | 3 | Cálculo de $Base^{Exp}$ através de multiplicações sucessivas. |
| `exercicio_3_3_fibonacci_iterativo.vm` | Nível 3 - Ciclos Iterativos | 3 | Geração iterativa dos primeiros $N$ termos da sucessão de Fibonacci. |
| `exercicio_3_4_mdc_euclides.vm` | Nível 3 - Ciclos Iterativos | 3 | Determinação do Máximo Divisor Comum de dois números pelo Algoritmo de Euclides. |
| `exercicio_3_5_soma_digitos.vm` | Nível 3 - Ciclos Iterativos | 3 | Extração e soma dos dígitos de um número inteiro positivo via `MOD 10` e `DIV 10`. |
| `exemplo_4_array_heap_media.vm` | Nível 4 - Heap e Arrays | 4 | Alocação dinâmica de $N$ inteiros na Struct Heap, leitura, cálculo da soma e média. |
| `exercicio_4_1_max_min_array.vm` | Nível 4 - Heap e Arrays | 4 | Determinação simultânea do valor máximo e mínimo num vetor alocado na Heap. |
| `exercicio_4_2_inversao_array.vm` | Nível 4 - Heap e Arrays | 4 | Inversão *in-place* dos elementos de um array na Heap com dois apontadores. |
| `exercicio_4_3_pesquisa_linear.vm` | Nível 4 - Heap e Arrays | 4 | Pesquisa linear de uma chave $K$ num array da Heap, devolvendo o primeiro índice ou $-1$. |
| `exemplo_5_funcao_quadrado.vm` | Nível 5 - Funções e Recursividade | 5 | Invocação procedimental com `PUSHA`, `CALL` e `RETURN`, acedendo a argumento em `fp[-1]`. |
| `exercicio_5_1_funcao_maximo.vm` | Nível 5 - Funções e Recursividade | 5 | Função com 2 argumentos e retorno de valor que substitui o argumento na pilha. |
| `exercicio_5_2_fatorial_recursivo.vm` | Nível 5 - Funções e Recursividade | 5 | Função recursiva $fat(n) = n \times fat(n-1)$ gerando múltiplos frames na Call Stack. |
| `exercicio_5_3_fibonacci_recursivo.vm` | Nível 5 - Funções e Recursividade | 5 | Implementação da função recursiva pura de Fibonacci $fib(n) = fib(n-1) + fib(n-2)$. |
| `desafio_bubble_sort.vm` | Desafio Final Integrador | 5 | Ordenação completa de um array dinâmico na Struct Heap utilizando o algoritmo Bubble Sort. |

---

## 🚀 5. Instalação e Execução

### Requisitos
- Docker e Docker Compose (ou Docker Engine $\ge 25$)

### Iniciar a Aplicação com Docker Compose
```sh
$ git clone https://github.com/jcramalho/VM_NextGen.git
$ cd VM_NextGen
$ docker compose up --build -d
```

A aplicação ficará disponível em:
- **Frontend Web:** [http://localhost:50520](http://localhost:50520)
- **API REST Backend:** [http://localhost:50520/api](http://localhost:50520/api) (através do proxy Nginx do frontend) ou diretamente no container da API.

---

## 👥 6. Autoria e Contributos
- **Prof. Pedro Rangel Henriques:** Mentor da ideia pedagógica original.
- **Prof. José Carlos Ramalho:** DevOps, autor do tutorial didático e criador da nova versão NextGen.
- **Sofia Teixeira (Outubro 2022):** Primeira versão da plataforma em tese de mestrado.
- **Contribuidores Discentes:** Francisco Ferreira, Rui Gonçalves, Daniel Pereira, Luís Ribeiro, Rafael Fernandes, Humberto Gomes, Frederico Afonso.
