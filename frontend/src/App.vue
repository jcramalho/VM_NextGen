<template>
  <div class="w3-container w3-margin-left" style="display:flex; flex-flow:column; height:100%; min-height:700px;">
    
    <div>
      <h1 class="w3-text-blue-grey" style="display: inline;"><b>Virtual Machine EWVM</b></h1>
      <div class="w3-right w3-margin-right" style="margin-top: 15px;">
        <button @click="runCode" class="w3-button w3-padding-small w3-round-large w3-blue-grey" style="margin-right:3px">Run</button>
        <button @click="openExamplesModal" class="w3-button w3-padding-small w3-round-large w3-blue-grey" style="margin-right:3px">Examples</button>
        <button @click="showManual = true" class="w3-button w3-padding-small w3-round-large w3-blue-grey" style="margin-right:3px">Documentation</button>
        <button @click="showCredits = true" class="w3-button w3-padding-small w3-round-large w3-blue-grey">Credits</button>
      </div>
    </div>

    <div class="w3-bar" style="height:100%; overflow:auto; display: flex; flex: 1;">
      
      <div class="w3-third" style="padding-right:3%; height:95%;">
        <div style="height: 100%; border: 1px solid #ccc;">
          <VueMonacoEditor
            :value="code"
            @update:value="newValue => code = newValue"
            theme="vs-light"
            language="EWVM"
            :options="{ minimap: { enabled: false }, automaticLayout: true }"
            @beforeMount="handleEditorBeforeMount"
            @mount="handleEditorMount"
          />
        </div>
      </div>

      <div class="w3-twothird" style="display:flex; flex-flow:column; padding-right:1%; height: 100%;">
        <div class="w3-container w3-border" style="display: flex; flex: 1; background-image: linear-gradient(white , #e9f2fa); padding: 10px;">
          
          <div class="w3-quarter" style="height:100%; text-align: center;">
            <div class="w3-border w3-white w3-margin" style="height:85%; overflow:auto; padding: 5px;">
              <div v-for="(call, i) in currentCallStack" :key="i" class="w3-padding-small w3-border-bottom">
                PC: {{ call[0] }} | FP: {{ call[1] }}
              </div>
            </div>
            <span>Call Stack</span>
          </div>

          <div class="w3-quarter" style="height:100%; text-align: center;">
            <div class="w3-border w3-white w3-margin" style="height:85%; overflow:auto; display: flex; flex-direction: column-reverse; padding: 5px;">
              <div v-for="(val, i) in currentOperandStack" :key="i" 
                   style="padding: 2px 8px; margin-bottom: 3px;"
                   :style="getOperandStackStyle(i)">
                {{ val }}
              </div>
            </div>
            <span>Operand Stack</span>
          </div>

          <div class="w3-half" style="height:100%;">
            <div style="height:50%; text-align: center;">
              <div class="w3-border w3-white w3-margin" style="height:70%; overflow:auto;">
                <div v-for="(str, i) in currentStringHeap" :key="i" class="w3-padding-small w3-border-bottom">{{ str }}</div>
              </div>
              <span>String Heap</span>
            </div>
            <div style="height:50%; text-align: center;">
              <div class="w3-border w3-white w3-margin" style="height:70%; overflow:auto;">
                <div v-for="(struct, i) in currentStructHeap" :key="i" class="w3-padding-small w3-border-bottom">{{ struct }}</div>
              </div>
              <span>Struct Heap</span>
            </div>
          </div>

        </div>

        <div class="w3-container" style="padding:4px 0;">
          <button class="w3-btn w3-round w3-small w3-light-grey" @click="currentIndex = 0">&lt;&lt;</button>
          <button class="w3-btn w3-round w3-small w3-light-grey w3-margin-left" @click="prevStep">&lt;</button>
          <span class="w3-margin-left w3-margin-right"><b>Step: {{ currentIndex }} / {{ animation.length > 0 ? animation.length - 1 : 0 }}</b></span>
          <button class="w3-btn w3-round w3-small w3-light-grey" @click="nextStep">&gt;</button>
          <button class="w3-btn w3-round w3-small w3-light-grey w3-margin-left" @click="currentIndex = animation.length > 0 ? animation.length - 1 : 0">&gt;&gt;</button>
          
          <span class="w3-margin-left" style="color:blue;">GP: 0</span>
          <span class="w3-margin-left" style="color:red;">FP: {{ currentFP }}</span>
          <span class="w3-margin-left" style="color:green;">SP: {{ currentOperandStack.length }}</span>
        </div>

        <div style="height: 140px;" class="w3-margin-bottom">
          <b class="w3-text-blue-grey">Output:</b>
          <div 
            ref="terminalContainer" 
            class="w3-border w3-white" 
            style="height: 80%; padding:5px; overflow:auto; font-family: monospace; white-space: pre-wrap;"
          >
            <div v-for="(line, i) in terminal" :key="i">{{ line }}</div>
          </div>
        </div>   

      </div>
    </div>

    <!--   MODAL de input   -->

    <div v-if="needsInput" class="w3-modal" style="display:block; z-index: 9999; height: calc(100vh - 160px); padding-top: 50px;">
      <div class="w3-modal-content w3-animate-top w3-card-4 w3-round-large" style="max-width: 450px; padding: 10px;">
        <header class="w3-container w3-center">
          <span @click="cancelInput" class="w3-button w3-display-topright w3-round-large w3-hover-red">&times;</span>
          <h3 class="w3-text-blue-grey"><b>Aguardando Input</b></h3>
        </header>
        
        <div class="w3-container w3-padding-16">
          <p class="w3-text-grey w3-center">A Máquina Virtual encontrou uma instrução <code>read</code> e encontra-se em pausa. Insira um valor para continuar a execução:</p>
          
          <input 
            v-model="inputValue" 
            @keyup.enter="submitInput"
            class="w3-input w3-border w3-round w3-margin-bottom" 
            style="text-align: center; font-size: 1.2em;"
            autofocus 
            placeholder="Escreve aqui..."
          />
          
          <button @click="submitInput" class="w3-button w3-blue-grey w3-round w3-block">
            <b>Confirmar</b> <i class="fa fa-check w3-margin-left"></i>
          </button>
        </div>
      </div>
    </div>

    <div v-if="showExamples" class="w3-modal" style="display:block; z-index:9990;">
      <div class="w3-modal-content w3-animate-zoom w3-card-4 w3-round-large" style="width:750px; max-width:96%; padding:20px;">
        <header class="w3-container">
          <span @click="showExamples = false" class="w3-button w3-display-topright w3-round-large w3-hover-red">&times;</span>
          <h2 class="w3-text-blue-grey"><b>Catálogo de Exemplos EWVM</b></h2>
          
          <div class="w3-margin-bottom">
            <span class="w3-text-blue-grey"><b>Ordenar por:</b></span>
            <button @click="fetchExamples('')" class="w3-button w3-small w3-border w3-round w3-margin-left">Título</button>
            <button @click="fetchExamples('cat')" class="w3-button w3-small w3-border w3-round w3-margin-left">Categoria</button>
            <button @click="fetchExamples('dif')" class="w3-button w3-small w3-border w3-round w3-margin-left">Dificuldade</button>
          </div>
        </header>

        <div class="w3-container" style="max-height:480px; overflow:auto;">
          <div v-if="!Array.isArray(examplesList)">
            <div v-for="(group, key) in examplesList" :key="key" class="w3-margin-bottom">
              <h3 class="w3-border-bottom w3-text-blue-grey" style="padding-bottom:5px;"><b>{{ key }}</b></h3>
              <div v-for="e in group" :key="e.title" class="w3-padding-small w3-hover-light-grey w3-border-bottom" style="display:flex; justify-content:space-between; align-items:center;">
                <div style="flex:1; padding-right:10px;">
                  <b class="w3-text-dark-grey">{{ e.title }}</b>
                  <span v-if="e.difficulty" class="w3-tag w3-round w3-small w3-teal w3-margin-left">Dif: {{ e.difficulty }}</span><br>
                  <small class="w3-text-grey">{{ e.description }}</small>
                </div>
                <button @click="loadExampleCode(e.code)" class="w3-button w3-small w3-blue-grey w3-round">Carregar</button>
              </div>
            </div>
          </div>

          <div v-else>
            <div v-for="e in examplesList" :key="e.title" class="w3-padding-small w3-hover-light-grey w3-border-bottom" style="display:flex; justify-content:space-between; align-items:center;">
              <div style="flex:1; padding-right:10px;">
                <b class="w3-text-dark-grey">{{ e.title }}</b> 
                <span class="w3-tag w3-round w3-small w3-indigo" style="margin-left:6px;">{{ e.category }}</span>
                <span v-if="e.difficulty" class="w3-tag w3-round w3-small w3-teal" style="margin-left:4px;">Dif: {{ e.difficulty }}</span><br>
                <small class="w3-text-grey">{{ e.description }}</small>
              </div>
              <button @click="loadExampleCode(e.code)" class="w3-button w3-small w3-blue-grey w3-round">Carregar</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showManual" class="w3-modal" style="display:block; z-index:9990;">
      <div class="w3-modal-content w3-animate-zoom w3-card-4 w3-round-large" style="width:920px; max-width:96%; padding:20px; max-height:90vh; display:flex; flex-direction:column;">
        <header class="w3-container" style="border-bottom:1px solid #e0e0e0; padding-bottom:12px;">
          <span @click="showManual = false" class="w3-button w3-display-topright w3-round-large w3-hover-red">&times;</span>
          <h2 class="w3-text-blue-grey" style="margin:0 0 10px 0;"><b>Documentação EWVM (v2.0)</b></h2>
          
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            <button 
              class="w3-button w3-small w3-round" 
              :class="activeManualTab === 'isa' ? 'w3-blue-grey' : 'w3-light-grey'" 
              @click="activeManualTab = 'isa'">
              <b>📖 Manual de Instruções (ISA)</b>
            </button>
            <button 
              class="w3-button w3-small w3-round" 
              :class="activeManualTab === 'arch' ? 'w3-blue-grey' : 'w3-light-grey'" 
              @click="activeManualTab = 'arch'">
              <b>🏛️ Arquitetura da Máquina</b>
            </button>
            <button 
              class="w3-button w3-small w3-round" 
              :class="activeManualTab === 'patterns' ? 'w3-blue-grey' : 'w3-light-grey'" 
              @click="activeManualTab = 'patterns'">
              <b>💡 Padrões e Conceitos Teóricos</b>
            </button>
          </div>
        </header>
        
        <div class="w3-container" style="overflow-y:auto; flex:1; padding-top:15px;">
          
          <!-- TAB 1: MANUAL ISA -->
          <div v-if="activeManualTab === 'isa'">
            <div class="w3-margin-bottom" style="display:flex; align-items:center; gap:10px;">
              <input 
                v-model="manualSearchQuery" 
                class="w3-input w3-border w3-round" 
                placeholder="🔍 Pesquisar instrução, argumento ou descrição (ex: ADD, ALLOCN, JZ, CALL)..." 
                style="flex:1;"
              />
              <button v-if="manualSearchQuery" @click="manualSearchQuery = ''" class="w3-button w3-small w3-border w3-round w3-light-grey">Limpar</button>
            </div>

            <div v-if="filteredCategories.length === 0" class="w3-panel w3-light-grey w3-round w3-center w3-padding-16">
              <p class="w3-text-grey">Nenhuma instrução encontrada para "<b>{{ manualSearchQuery }}</b>".</p>
            </div>

            <div v-for="(category, index) in filteredCategories" :key="index" class="w3-margin-bottom">
              <h4 class="w3-blue-grey w3-padding-small w3-round" style="margin-bottom:6px;">
                <b>{{ category.name }}</b> <small class="w3-right w3-text-light-grey">{{ category.instructions.length }} instruções</small>
              </h4>
              
              <table class="w3-table-all w3-small w3-hoverable w3-bordered">
                <thead>
                  <tr class="w3-light-blue">
                    <th style="width:130px;">Instrução</th>
                    <th style="width:120px;">Argumentos</th>
                    <th style="width:260px;">Efeito na Pilha</th>
                    <th>Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="inst in category.instructions" :key="inst.op">
                    <td><b class="w3-text-red" style="font-family:monospace; font-size:1.05em;">{{ inst.op }}</b></td>
                    <td><code style="background:#f1f1f1; padding:1px 4px; border-radius:3px;">{{ inst.args }}</code></td>
                    <td><span class="w3-text-indigo" style="font-family:monospace; font-size:0.92em;">{{ inst.stack }}</span></td>
                    <td>{{ inst.desc }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- TAB 2: ARQUITETURA -->
          <div v-if="activeManualTab === 'arch' && docArchitecture">
            <div class="w3-panel w3-leftbar w3-border-blue-grey w3-pale-blue w3-padding">
              <p style="margin:0;">{{ docArchitecture.overview }}</p>
            </div>

            <h4 class="w3-text-blue-grey"><b>Diagrama Arquitetural da EWVM</b></h4>
            <pre class="w3-code w3-border w3-round" style="background:#1e293b; color:#38bdf8; font-family:monospace; font-size:11.5px; line-height:1.2; overflow-x:auto; padding:12px;">{{ docArchitecture.diagram }}</pre>

            <h4 class="w3-text-blue-grey w3-margin-top"><b>1. Registos Principais</b></h4>
            <div class="w3-row-padding" style="margin-left:-8px; margin-right:-8px;">
              <div v-for="reg in docArchitecture.registers" :key="reg.name" class="w3-half w3-margin-bottom">
                <div class="w3-card w3-round w3-white w3-padding-small w3-border" style="height:100%;">
                  <span class="w3-tag w3-round w3-indigo" style="font-family:monospace; font-weight:bold;">{{ reg.name }}</span>
                  <b class="w3-margin-left w3-text-dark-grey">{{ reg.fullName }}</b>
                  <p class="w3-small w3-text-grey" style="margin:6px 0 0 0;">{{ reg.desc }}</p>
                </div>
              </div>
            </div>

            <h4 class="w3-text-blue-grey w3-margin-top"><b>2. Espaços de Memória</b></h4>
            <div class="w3-margin-bottom">
              <div v-for="mem in docArchitecture.memoryAreas" :key="mem.name" class="w3-card w3-round w3-white w3-padding-small w3-border w3-margin-bottom">
                <b class="w3-text-indigo">{{ mem.name }}</b>
                <p class="w3-small w3-text-grey" style="margin:4px 0 0 0;">{{ mem.desc }}</p>
              </div>
            </div>

            <h4 class="w3-text-blue-grey w3-margin-top"><b>3. Esqueleto Canónico de um Programa EWVM</b></h4>
            <div class="w3-margin-bottom">
              <div v-for="phase in docArchitecture.programStructure" :key="phase.phase" class="w3-padding-small w3-border-bottom">
                <b class="w3-text-blue-grey">{{ phase.phase }}:</b>
                <span class="w3-small w3-text-grey w3-margin-left">{{ phase.desc }}</span>
              </div>
            </div>
          </div>

          <!-- TAB 3: PADRÕES TEÓRICOS -->
          <div v-if="activeManualTab === 'patterns'">
            <div class="w3-panel w3-leftbar w3-border-blue-grey w3-pale-blue w3-padding">
              <p style="margin:0;">Padrões de tradução de alto nível para Assembly da EWVM, com exemplos diretamente carregáveis no editor.</p>
            </div>

            <div v-for="(p, pIdx) in docPatterns" :key="pIdx" class="w3-card w3-round w3-white w3-border w3-margin-bottom" style="overflow:hidden;">
              <header class="w3-container w3-light-grey" style="display:flex; justify-content:space-between; align-items:center; padding:8px 16px;">
                <h4 class="w3-text-blue-grey" style="margin:0;"><b>{{ p.title }}</b></h4>
                <button @click="loadPatternCode(p.code)" class="w3-button w3-tiny w3-blue-grey w3-round">
                  <i class="fa fa-code"></i> Carregar no Editor
                </button>
              </header>
              <div class="w3-container w3-padding">
                <p class="w3-small w3-text-dark-grey" style="margin-top:0;">{{ p.desc }}</p>
                <pre class="w3-code w3-border w3-round" style="background:#0f172a; color:#a5f3fc; font-family:monospace; font-size:12px; margin:0; overflow-x:auto; padding:10px;">{{ p.code }}</pre>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <div v-if="showCredits" class="w3-modal" style="display:block;">
      <div class="w3-modal-content w3-animate-zoom w3-card-4 w3-round-large" style="width:650px; padding:20px;">
        <header class="w3-container">
          <span @click="showCredits = false" class="w3-button w3-display-topright w3-round-large">&times;</span>
          <h2 class="w3-text-blue-grey"><b>Autoria e Contributos</b></h2>
        </header>
        <div class="w3-container">
          <p class="w3-text-grey">Identificação das pessoas que permitiram ter esta ferramenta pedagógica operacional online:</p>
          <table class="w3-table-all w3-hoverable w3-small">
            <thead>
              <tr class="w3-blue-grey">
                <th>Nome</th>
                <th>Período</th>
                <th>Contributo</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><b>Sofia Teixeira</b></td><td>Outubro de 2022</td><td>Com a sua tese de mestrado criou a 1ª versão da plataforma.</td></tr>
              <tr><td><b>Francisco Ferreira</b></td><td>2º Sem. 2023/2024</td><td>Correções de erros e novas instruções na VM.</td></tr>
              <tr><td><b>Rui Gonçalves</b></td><td>2º Sem. 2023/2024</td><td>Correções de erros e novas instruções na VM.</td></tr>
              <tr><td><b>Daniel Pereira</b></td><td>2º Sem. 2023/2024</td><td>Correções de erros e novas instruções na VM.</td></tr>
              <tr><td><b>Luís Ribeiro</b></td><td>2º Sem. 2023/2024</td><td>Adição de 2 novas instruções: COPY e COPYN.</td></tr>
              <tr><td><b>Rafael Fernandes</b></td><td>2º Sem. 2024/2025</td><td>Correção da instrução CHECK e robustez multiutilizador.</td></tr>
              <tr><td><b>Humberto Gomes</b></td><td>2º Sem. 2024/2025</td><td>Correção da instrução ALLOCN.</td></tr>
              <tr><td><b>Frederico Afonso</b></td><td>2º Sem. 2024/2025</td><td>Otimização das instruções DUP e DUPN.</td></tr>
              <tr><td><b>Prof. Pedro Rangel Henriques</b></td><td>Desde sempre...</td><td>O mentor da ideia pedagógica.</td></tr>
              <tr><td><b>Prof. José Carlos Ramalho</b></td><td>Desde sempre...</td><td>O DevOps sempre de serviço. Criador da nova versão.</td></tr>
            </tbody>
          </table>
          <p class="w3-small w3-right-align w3-text-grey" v-if="metadata"><b>Versão da API:</b> {{ metadata.version }} ({{ metadata.vdate }})</p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, shallowRef, computed, onMounted, watch, nextTick } from 'vue'
import { VueMonacoEditor } from '@guolao/vue-monaco-editor'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:50520/api'

// ==========================================
// 1. ESTADO REATIVO BASE
// ==========================================
const code = ref('start\npushi 10\nwritei\nstop')
const sessionId = ref('')
const terminal = ref([])
const animation = ref([])
const currentIndex = ref(0)
const metadata = ref(null)

const needsInput = ref(false)
const inputValue = ref('')
const terminalContainer = ref(null) // Referência da div do output

const showExamples = ref(false)
const showManual = ref(false)
const showCredits = ref(false)

const manualDocs = ref(null)
const examplesList = ref([])

const activeManualTab = ref('isa')
const manualSearchQuery = ref('')

// Variáveis para o Monaco Editor
const editorRef = shallowRef(null)
const decorations = shallowRef(null)


// ==========================================
// 2. ESTADOS COMPUTADOS (VUE REACTIVITY)
// ==========================================
const currentFrame = computed(() => animation.value[currentIndex.value] || null)
const currentOperandStack = computed(() => currentFrame.value ? currentFrame.value[1] : [])
const currentCallStack = computed(() => currentFrame.value ? currentFrame.value[2] : [])
const currentStringHeap = computed(() => currentFrame.value ? currentFrame.value[3] : [])
const currentStructHeap = computed(() => currentFrame.value ? currentFrame.value[4] : [])
const currentFP = computed(() => (currentFrame.value && currentFrame.value[5] !== -1) ? currentFrame.value[5] : '-')
const currentLine = computed(() => currentFrame.value ? currentFrame.value[0] : 0) // Agora declarado DEPOIS de currentFrame

// Documentação Dinâmica (ISA, Arquitetura e Padrões)
const docCategories = computed(() => {
  if (!manualDocs.value) return []
  if (Array.isArray(manualDocs.value)) {
    return manualDocs.value.map(cat => ({
      name: cat[0],
      instructions: Array.isArray(cat[1]) 
        ? cat[1].flatMap(sub => Object.entries(sub[1] || {}).map(([op, desc]) => ({ op, args: '-', stack: '-', desc })))
        : Object.entries(cat[1] || {}).map(([op, desc]) => ({ op, args: '-', stack: '-', desc }))
    }))
  }
  return manualDocs.value.categories || []
})

const docArchitecture = computed(() => {
  return manualDocs.value?.architecture || null
})

const docPatterns = computed(() => {
  return manualDocs.value?.patterns || []
})

const filteredCategories = computed(() => {
  const query = manualSearchQuery.value.trim().toLowerCase()
  if (!query) return docCategories.value

  return docCategories.value.map(cat => {
    const matching = (cat.instructions || []).filter(inst => {
      const op = (inst.op || '').toLowerCase()
      const desc = (inst.desc || '').toLowerCase()
      const stack = (inst.stack || '').toLowerCase()
      const args = (inst.args || '').toLowerCase()
      return op.includes(query) || desc.includes(query) || stack.includes(query) || args.includes(query)
    })
    return {
      ...cat,
      instructions: matching
    }
  }).filter(cat => cat.instructions.length > 0)
})


// ==========================================
// 3. WATCHERS (OBSERVADORES AUTOMÁTICOS)
// ==========================================

// Auto-Scroll do Terminal
watch(terminal, async () => {
  await nextTick()
  if (terminalContainer.value) {
    terminalContainer.value.scrollTop = terminalContainer.value.scrollHeight
  }
}, { deep: true })

// Highlight (Destaque) da Linha no Monaco Editor
watch(currentLine, (line) => {
  if (decorations.value) {
    if (line > 0) {
      decorations.value.set([{
        range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 },
        options: {
          isWholeLine: true,
          className: 'highlight-debug'
        }
      }])
    } else {
      decorations.value.set([])
    }
  }
})


// ==========================================
// 4. INICIALIZAÇÃO (ON MOUNTED)
// ==========================================
onMounted(async () => {
  try {
    const initRes = await fetch(`${API_URL}/init`)
    const initData = await initRes.json()
    sessionId.value = initData.data.sessionId
    metadata.value = initData.data.metadados

    const manualRes = await fetch(`${API_URL}/manual`)
    const manualData = await manualRes.json()
    manualDocs.value = manualData.data
  } catch (err) {
    console.error("Erro ao ligar à API:", err)
  }
})


// ==========================================
// 5. FUNÇÕES E LÓGICA
// ==========================================

// Controlo do Mónaco Editor
const handleEditorMount = (editor, monaco) => {
  editorRef.value = editor
  decorations.value = editor.createDecorationsCollection()
}

const handleEditorBeforeMount = (monaco) => {
  monaco.languages.register({ id: 'EWVM' })
  monaco.languages.setMonarchTokensProvider('EWVM', {
    tokenizer: {
      root: [
        [/[+\-]?\d+/, 'number'],
        [/".*?"/, 'string'],
        [/\/\/.*/, 'comment'],
        [/[A-Za-z_][A-Za-z0-9_]*/, 'keyword'],
      ]
    }
  })
}

// Comunicação com a Máquina Virtual
const runCode = () => {
  executeAPI(false)
}

const submitInput = () => {
  if (inputValue.value !== '') {
    terminal.value.push(`<< ${inputValue.value}`)
    executeAPI(true)
  }
}

const cancelInput = () => {
  needsInput.value = false
  inputValue.value = ''
  terminal.value.push(">> Execução interrompida: Input cancelado pelo utilizador.")
}

const executeAPI = async (isResume) => {
  try {
    const bodyData = {
      code: code.value,
      sessionId: sessionId.value
    }

    if (isResume) {
      bodyData.input = inputValue.value
      bodyData.index = currentIndex.value
      bodyData.terminal = terminal.value
    }

    const res = await fetch(`${API_URL}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    })
    
    const result = await res.json()
    if (result.success) {
      terminal.value = result.data.terminal
      animation.value = result.data.animation
      currentIndex.value = animation.value.length > 0 ? animation.value.length - 1 : 0
      
      needsInput.value = result.data.input === 1
      inputValue.value = ''
    } else {
      if (result.data?.terminal && result.data.terminal.length > 0) {
        terminal.value = result.data.terminal
      } else {
        terminal.value = ["Erro na compilação ou execução do programa."]
      }
      animation.value = []
      currentIndex.value = 0
    }
  } catch (err) {
    terminal.value.push("Erro de rede ao comunicar com o processador VM.")
  }
}

// Busca de Exemplos e Controlo de Modais
const fetchExamples = async (orderBy = '') => {
  try {
    const url = orderBy ? `${API_URL}/examples?orderBy=${orderBy}` : `${API_URL}/examples`
    const res = await fetch(url)
    const result = await res.json()
    if (result.success) {
      examplesList.value = result.data.exemplos
    }
  } catch (err) {
    console.error("Erro ao ir buscar os exemplos:", err)
  }
}

const openExamplesModal = () => {
  fetchExamples()
  showExamples.value = true
}

const loadExampleCode = (exampleCode) => {
  if (exampleCode) {
    code.value = exampleCode
    animation.value = []
    terminal.value = []
    currentIndex.value = 0
    showExamples.value = false
  }
}

const loadPatternCode = (patternCode) => {
  if (patternCode) {
    code.value = patternCode
    animation.value = []
    terminal.value = []
    currentIndex.value = 0
    showManual.value = false
  }
}

// Controlo do Passo-a-Passo e Estilos Dinâmicos
const prevStep = () => {
  if (currentIndex.value > 0) currentIndex.value--
}

const nextStep = () => {
  if (currentIndex.value < animation.value.length - 1) currentIndex.value++
}

const getOperandStackStyle = (index) => {
  let border = '1px solid #ccc'
  if (index === currentFP.value) border = '3px solid red'
  return {
    border: border,
    background: '#607d8b',
    color: 'white',
    borderRadius: '4px'
  }
}
</script>
<style>
/* Estilo para a linha destacada no Monaco Editor */
.highlight-debug {
  background-color: #ffffa0; /* Um amarelo suave */
}
</style>