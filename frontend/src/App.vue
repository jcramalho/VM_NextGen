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

    <div v-if="showExamples" class="w3-modal" style="display:block;">
      <div class="w3-modal-content w3-animate-zoom w3-card-4 w3-round-large" style="width:700px; padding:20px;">
        <header class="w3-container">
          <span @click="showExamples = false" class="w3-button w3-display-topright w3-round-large">&times;</span>
          <h2 class="w3-text-blue-grey"><b>Examples</b></h2>
          
          <div class="w3-margin-bottom">
            <span class="w3-text-blue-grey"><b>Order By:</b></span>
            <button @click="fetchExamples('')" class="w3-button w3-small w3-border w3-round w3-margin-left">Title</button>
            <button @click="fetchExamples('cat')" class="w3-button w3-small w3-border w3-round w3-margin-left">Category</button>
            <button @click="fetchExamples('dif')" class="w3-button w3-small w3-border w3-round w3-margin-left">Difficulty</button>
          </div>
        </header>

        <div class="w3-container" style="max-height:450px; overflow:auto;">
          <div v-if="!Array.isArray(examplesList)">
            <div v-for="(group, key) in examplesList" :key="key" class="w3-margin-bottom">
              <h3 class="w3-border-bottom w3-text-blue-grey" style="padding-bottom:5px;"><b>{{ key }}</b></h3>
              <div v-for="e in group" :key="e.title" class="w3-padding-small w3-hover-light-grey w3-border-bottom" style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <b class="w3-text-dark-grey">{{ e.title }}</b><br>
                  <small class="w3-text-grey">{{ e.description }}</small>
                </div>
                <button @click="loadExampleCode(e.code)" class="w3-button w3-small w3-blue-grey w3-round">Load</button>
              </div>
            </div>
          </div>

          <div v-else>
            <div v-for="e in examplesList" :key="e.title" class="w3-padding-small w3-hover-light-grey w3-border-bottom" style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <b class="w3-text-dark-grey">{{ e.title }}</b> <span class="w3-tag w3-round w3-small w3-indigo">{{ e.category }}</span><br>
                <small class="w3-text-grey">{{ e.description }}</small>
              </div>
              <button @click="loadExampleCode(e.code)" class="w3-button w3-small w3-blue-grey w3-round">Load</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showManual" class="w3-modal" style="display:block;">
      <div class="w3-modal-content w3-animate-zoom w3-card-4 w3-round-large" style="width:800px; padding:20px;">
        <header class="w3-container">
          <span @click="showManual = false" class="w3-button w3-display-topright w3-round-large">&times;</span>
          <h2 class="w3-text-blue-grey"><b>Instruction Documentation</b></h2>
        </header>
        
        <div class="w3-container" style="max-height:500px; overflow:auto; padding-top:10px;">
          <div v-for="(category, index) in manualDocs" :key="index" class="w3-margin-bottom">
            <h3 class="w3-blue-grey w3-padding-small w3-round"><b>{{ category[0] }}</b></h3>
            
            <div style="padding-left:15px;">
              <div v-if="Array.isArray(category[1])">
                <div v-for="(sub, subIdx) in category[1]" :key="subIdx" class="w3-margin-bottom">
                  <h4 class="w3-text-indigo"><b>{{ sub[0] }}</b></h4>
                  <table class="w3-table-all w3-small">
                    <tr v-for="(desc, inst) in sub[1]" :key="inst">
                      <td style="width:120px;"><b class="w3-text-red">{{ inst }}</b></td>
                      <td>{{ desc }}</td>
                    </tr>
                  </table>
                </div>
              </div>

              <div v-else>
                <table class="w3-table-all w3-small">
                  <tr v-for="(desc, inst) in category[1]" :key="inst">
                    <td style="width:120px;"><b class="w3-text-red">{{ inst }}</b></td>
                    <td>{{ desc }}</td>
                  </tr>
                </table>
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

// Se VITE_API_URL for '/api', ele vai usar automaticamente http://ewvm.epl.di.uminho.pt/api
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:50520/api'

// ESTADO REATIVO BASE
const code = ref('start\npushi 10\nwritei\nstop')
const sessionId = ref('')
// Puxa sempre a caixa de ouput para baixo
const terminal = ref([])
const terminalContainer = ref(null) // Referência direta para a div do HTML

// Observa qualquer alteração no array 'terminal'
watch(terminal, async () => {
  // Espera que o Vue atualize o ecrã com a nova linha
  await nextTick()
  // Puxa o scroll vertical para o limite máximo da caixa
  if (terminalContainer.value) {
    terminalContainer.value.scrollTop = terminalContainer.value.scrollHeight
  }
}, { deep: true })

// VARIÁVEIS PARA O MONACO EDITOR
const editorRef = shallowRef(null)
const decorations = shallowRef(null) // Vai guardar a coleção de destaques

// Quando o editor carrega na página, guardamos a instância dele
const handleEditorMount = (editor, monaco) => {
  editorRef.value = editor
  decorations.value = editor.createDecorationsCollection()
}

// Apanhar a linha atual a ser executada no frame (é o índice 0 da array do frame)
const currentLine = computed(() => currentFrame.value ? currentFrame.value[0] : 0)

// Sempre que a linha mudar (ao clicar <<, <, >, >>), o Monaco atualiza o destaque
watch(currentLine, (line) => {
  if (decorations.value) {
    if (line > 0) {
      decorations.value.set([{
        range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 },
        options: {
          isWholeLine: true,
          className: 'highlight-debug' // A classe CSS que criaremos abaixo
        }
      }])
    } else {
      // Limpa o destaque se não houver linha a executar
      decorations.value.set([])
    }
  }
})

const animation = ref([])
const currentIndex = ref(0)
const metadata = ref(null)
const needsInput = ref(false)
const inputValue = ref('')

// ESTADO DOS MODAIS
const showExamples = ref(false)
const showManual = ref(false)
const showCredits = ref(false)

const manualDocs = ref([])
const examplesList = ref([])

// INICIALIZAÇÃO
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

// PROCESSAMENTO DA MÁQUINA VIRTUAL
const runCode = () => {
  // Execução limpa (clique no botão "Run" principal)
  executeAPI(false)
}

const submitInput = () => {
  // Retoma da execução após instrução "read"
  if (inputValue.value !== '') {
    // Adicionar o valor introduzido ao terminal antes de enviar para a API
    terminal.value.push(`<< ${inputValue.value}`)
    executeAPI(true)
  }
}

const cancelInput = () => {
  // Esconde o modal, limpa o input e avisa na consola que a execução foi abortada
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

    // Se a VM pediu um input, temos de enviar o estado atual para o backend conseguir retomar
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
      
      // A VM avisa que pausou numa instrução "read" se a flag input for 1
      needsInput.value = result.data.input === 1
      inputValue.value = '' // Limpa a caixa de texto para o próximo read
    }
  } catch (err) {
    terminal.value = ["Erro de rede ao comunicar com o processador VM."]
  }
}

// BUSCA DE EXEMPLOS VIA ENDPOINT DA API
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

// BOTÕES DE CONTROLO DO PASSO-A-PASSO
const prevStep = () => {
  if (currentIndex.value > 0) currentIndex.value--
}

const nextStep = () => {
  if (currentIndex.value < animation.value.length - 1) currentIndex.value++
}

// ESTADOS COMPUTADOS (VUE REACTIVITY)
const currentFrame = computed(() => animation.value[currentIndex.value] || null)
const currentOperandStack = computed(() => currentFrame.value ? currentFrame.value[1] : [])
const currentCallStack = computed(() => currentFrame.value ? currentFrame.value[2] : [])
const currentStringHeap = computed(() => currentFrame.value ? currentFrame.value[3] : [])
const currentStructHeap = computed(() => currentFrame.value ? currentFrame.value[4] : [])
const currentFP = computed(() => (currentFrame.value && currentFrame.value[5] !== -1) ? currentFrame.value[5] : '-')

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

// INICIALIZADOR DA GRAMÁTICA NO EDITOR MONACO
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
</script>
<style>
/* Estilo para a linha destacada no Monaco Editor */
.highlight-debug {
  background-color: #ffffa0; /* Um amarelo suave */
}
</style>