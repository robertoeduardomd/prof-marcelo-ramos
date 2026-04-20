// =======================
// 🎵 CONFIG (MATRIZ DE ENARMONIA)
// =======================

const notas = [
  ["B#", "C", "Dbb"],
  ["C#", "Db"],
  ["C##", "D", "Ebb"],
  ["D#", "Eb"],
  ["D##", "E", "Fb"],
  ["E#", "F", "Gbb"],
  ["F#", "Gb"],
  ["F##", "G", "Abb"],
  ["G#", "Ab"],
  ["G##", "A", "Bbb"],
  ["A#", "Bb"],
  ["A##", "B", "Cb"],
];

const mapaNotas = {};
notas.forEach((grupo, i) => {
  grupo.forEach((n) => (mapaNotas[n] = i));
});

// =======================
// 🎼 INTERVALOS (Corrigido: 7d adicionado, 9M removido)
// =======================

const intervalos = {
  "2m": 1,
  "2M": 2,
  "3m": 3,
  "3M": 4,
  "4J": 5,
  "4A": 6,
  "5d": 6,
  "5J": 7,
  "5A": 8,
  "6m": 8,
  "6M": 9,
  "7d": 9, // 7ª diminuta é enarmônica da 6ª Maior
  "7m": 10,
  "7M": 11,
  "9A": 15,
};

// =======================
// 🎯 DOM
// =======================

const perguntaEl = document.getElementById("pergunta");
const opcoesEl = document.getElementById("opcoes");
const resultado = document.getElementById("resultado");
const placarEl = document.getElementById("placar");
const timerEl = document.getElementById("timer");
const btnIniciar = document.getElementById("btnIniciar");
const selectIntervalo = document.getElementById("selectIntervalo");
const selectNota = document.getElementById("selectNota");
const configEl = document.getElementById("config");

// =======================
// 🎮 ESTADO
// =======================

let perguntas = [];
let indiceAtual = 0;
let perguntaAtual = null;
let acertos = 0;
let erros = 0;
let total = 0;
let bloqueado = false;
let jogoIniciado = false;
let tempo = 0;
let intervaloTimer;
let synth;
let synthErro;
let notaAtual = null;

// =======================
// 🔊 AUDIO
// =======================

function criarSynth() {
  const reverb = new Tone.Reverb({ decay: 1, wet: 0.5 }).toDestination();
  synth = new Tone.Synth();
  synth.connect(reverb);

  // Synth para som de erro tipo "peeeeem"
  synthErro = new Tone.Synth({
    oscillator: {
      type: "sawtooth",
    },
    envelope: {
      attack: 0.01,
      decay: 0.3,
      sustain: 0.2,
      release: 0.5,
    },
  }).toDestination();
}

document.body.addEventListener(
  "click",
  async () => {
    await Tone.start();
  },
  { once: true },
);

function calcularOitavaMaisProxima(notaBase, notaAlvo) {
  const idxBase = mapaNotas[notaBase];
  const idxAlvo = mapaNotas[notaAlvo];

  let midiBase = 60 + idxBase;
  let midiAlvo = 60 + idxAlvo;

  // Calcula diferença real
  let diferenca = idxAlvo - idxBase;

  // Ajuste inteligente de oitava - escolhe a direção mais próxima
  if (diferenca > 6) {
    // intervalo deveria descer (oitava abaixo)
    midiAlvo -= 12;
  } else if (diferenca < -6) {
    // intervalo deveria subir (oitava acima)
    midiAlvo += 12;
  }

  return { midiBase, midiAlvo };
}

function tocarNota(nota, duracao = "16n") {
  if (!synth) return;

  const idx = mapaNotas[nota];
  const midi = 60 + idx;
  const frequencia = Tone.Frequency(midi, "midi");

  synth.triggerAttackRelease(frequencia, duracao);
}

function tocarIntervalo(nota1, nota2) {
  if (!synth) return;

  const { midiBase, midiAlvo } = calcularOitavaMaisProxima(nota1, nota2);

  const n1 = Tone.Frequency(midiBase, "midi");
  const n2 = Tone.Frequency(midiAlvo, "midi");

  // Toca nota base primeiro
  synth.triggerAttackRelease(n1, "16n");

  // Depois toca a segunda nota
  setTimeout(() => {
    synth.triggerAttackRelease(n2, "16n");
  }, 300);
}

function tocarSomErro() {
  if (!synthErro) return;

  // Som de erro tipo "peeeeem" - nota grave com sustain
  synthErro.triggerAttackRelease("C2", "8n");
}

// =======================
// 🧠 LÓGICA
// =======================

function formatarExibicaoNota(nota) {
  return nota.replace("##", "x");
}

function escolherNotaCorreta(base, intervalo, grupoNotas) {
  const letras = ["C", "D", "E", "F", "G", "A", "B"];
  const grau = parseInt(intervalo);
  const letraBase = base[0];
  const indexBase = letras.indexOf(letraBase);
  const letraEsperada = letras[(indexBase + grau - 1) % 7];

  for (let nota of grupoNotas) {
    if (nota[0] === letraEsperada) return nota;
  }
  return grupoNotas[0];
}

function gerarListaPerguntas() {
  perguntas = [];
  const modo = document.querySelector("input[name='modo']:checked").value;

  if (modo === "intervalo") {
    const intEscolhido = selectIntervalo.value;
    const bases = [
      "C",
      "C#",
      "Db",
      "D",
      "Eb",
      "E",
      "F",
      "F#",
      "Gb",
      "G",
      "Ab",
      "A",
      "Bb",
      "B",
    ];
    bases.forEach((base) => {
      const novoIndex = (mapaNotas[base] + intervalos[intEscolhido]) % 12;
      const correta = escolherNotaCorreta(base, intEscolhido, notas[novoIndex]);
      perguntas.push({
        texto: `${formatarIntervalo(intEscolhido)} de ${base}`,
        base,
        resposta: correta,
      });
    });
  } else {
    const base = selectNota.value;
    Object.keys(intervalos).forEach((intKey) => {
      const novoIndex = (mapaNotas[base] + intervalos[intKey]) % 12;
      const correta = escolherNotaCorreta(base, intKey, notas[novoIndex]);
      perguntas.push({
        texto: `${formatarIntervalo(intKey)} de ${base}`,
        base,
        resposta: correta,
      });
    });
  }
  embaralhar(perguntas);
}

function formatarIntervalo(i) {
  const nomes = {
    "2m": "2ª m",
    "2M": "2ª M",
    "3m": "3ª m",
    "3M": "3ª M",
    "4J": "4ª J",
    "4A": "4ª Aum.",
    "5d": "5ª dim",
    "5J": "5ª J",
    "5A": "5ª Aum.",
    "6m": "6ª m",
    "6M": "6ª M",
    "7d": "7ª dim",
    "7m": "7ª m",
    "7M": "7ª M",
    "9A": "9ª Aum.",
  };
  return nomes[i] || i;
}

function gerarPergunta() {
  if (indiceAtual >= perguntas.length) {
    finalizarJogo();
    return;
  }
  perguntaAtual = perguntas[indiceAtual];
  perguntaEl.innerText = perguntaAtual.texto;

  // Toca APENAS a nota base da pergunta
  tocarNota(perguntaAtual.base);
}

function criarOpcoes() {
  opcoesEl.innerHTML = "";

  // Agora ambos os modos usam a mesma visualização de botões agrupados
  notas.forEach((grupo) => {
    const btn = document.createElement("div");
    btn.className = "opcao";

    // Adiciona classe opcao2 se o grupo tiver exatamente 2 notas (C#/Db, etc)
    if (grupo.length === 2) {
      btn.classList.add("opcao2");
    }

    grupo.forEach((nota) => {
      const span = document.createElement("span");
      span.textContent = formatarExibicaoNota(nota);
      if (nota.includes("b")) span.className = "nota-bemol";
      else if (nota.includes("#")) span.className = "nota-sustenido";
      else span.className = "nota-principal";
      btn.appendChild(span);
    });

    // Dentro da função criarOpcoes(), substitua o bloco do btn.onclick por:
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (!jogoIniciado || bloqueado) return;

      // Identifica se o grupo clicado contém a resposta correta
      const correto = grupo.includes(perguntaAtual.resposta);

      // Toca a nota clicada (primeira nota do grupo)
      if (grupo.length > 0) {
        tocarNota(grupo[0]);
      }

      // Processa resposta imediatamente
      responder(correto, grupo.length > 0 ? grupo[0] : null);
    });
    opcoesEl.appendChild(btn);
  });
}

function responder(correto, notaClicada = null) {
  bloqueado = true;
  total++;

  if (correto) {
    acertos++;
    mostrarToast("✅ Correto!", "sucesso");
  } else {
    erros++;
    mostrarToast(
      `❌ Correto: ${formatarExibicaoNota(perguntaAtual.resposta)}`,
      "erro",
    );

    // Toca som de erro apenas
    tocarSomErro();
  }

  atualizarPlacar();
  indiceAtual++;

  // Passa para próxima pergunta imediatamente
  setTimeout(() => {
    bloqueado = false;
    gerarPergunta();
  }, 400); // Tempo reduzido para jogo rápido
}

function embaralhar(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function finalizarJogo() {
  clearInterval(intervaloTimer);
  perguntaEl.innerText = "Fim do treino 🎉";
  jogoIniciado = false;
  configEl.style.display = "block";
  btnIniciar.innerText = "Reiniciar";
}

function atualizarPlacar() {
  placarEl.innerText = `Acertos: ${acertos} | Erros: ${erros} | Total: ${total}`;
}

function iniciarTimer() {
  clearInterval(intervaloTimer);
  tempo = 0;
  intervaloTimer = setInterval(() => {
    tempo++;
    const minutos = Math.floor(tempo / 60);
    const segundos = tempo % 60;
    const minutosFormatados = minutos.toString().padStart(2, "0");
    const segundosFormatados = segundos.toString().padStart(2, "0");
    timerEl.innerText = `${minutosFormatados}:${segundosFormatados}`;
  }, 1000);
}

function mostrarToast(msg, tipo) {
  resultado.innerText = msg;
  resultado.className = "show " + tipo;
  setTimeout(() => resultado.classList.remove("show"), 2000);
}

function iniciarJogo() {
  jogoIniciado = true;
  configEl.style.display = "none";
  acertos = 0;
  erros = 0;
  total = 0;
  indiceAtual = 0;
  gerarListaPerguntas();
  atualizarPlacar();
  iniciarTimer();
  gerarPergunta();
  criarOpcoes();
}

document.querySelectorAll("input[name='modo']").forEach((r) => {
  r.addEventListener("change", () => {
    const modo = r.value;
    selectIntervalo.classList.toggle("hidden", modo !== "intervalo");
    selectNota.classList.toggle("hidden", modo !== "nota");
    criarOpcoes();
  });
});

selectNota.addEventListener("change", () => {
  if (document.querySelector("input[name='modo']:checked").value === "nota")
    criarOpcoes();
});

btnIniciar.addEventListener("click", iniciarJogo);
criarSynth();
criarOpcoes();
