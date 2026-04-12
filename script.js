// =======================
// 🎸 CONFIGURAÇÕES
// =======================

const instrumentos = {
  guitarra: ["E", "A", "D", "G", "B", "E"],
  violao7: ["B", "E", "A", "D", "G", "B", "E"],

  baixo4: ["E", "A", "D", "G"],
  baixo5: ["B", "E", "A", "D", "G"],

  cavaquinho: ["D", "G", "B", "D"],

  bandolim4: ["G", "D", "A", "E"],
  bandolim5: ["C", "G", "D", "A", "E"],
};

let afinacao = instrumentos["guitarra"];
let bloqueado = false;
let posicaoAtual = "1";

const notas = [
  ["C"],
  ["C#/Db"],
  ["D"],
  ["D#/Eb"],
  ["E"],
  ["F"],
  ["F#/Gb"],
  ["G"],
  ["G#/Ab"],
  ["A"],
  ["A#/Bb"],
  ["B"],
];

// =======================
// 🎯 DOM
// =======================

const perguntaEl = document.getElementById("pergunta");
const resultadoFinalEl = document.getElementById("resultadoFinal");
const opcoesEl = document.getElementById("opcoes");
const resultado = document.getElementById("resultado");

const selectInstrumento = document.getElementById("instrumento");
const selectPosicao = document.getElementById("posicao");
const configEl = document.querySelector(".ldld");

const btnIniciar = document.getElementById("btnIniciar");

const placarEl = document.getElementById("placar");
const timerEl = document.getElementById("timer");

// =======================
// 🎮 ESTADO
// =======================

let listaPerguntas = [];
let indiceAtual = 0;
let perguntaAtual = null;

let acertos = 0;
let erros = 0;
let total = 0;
let listaErros = [];
let jogoIniciado = false;

// ⏱️ TIMER
let tempo = 0;
let intervalo;

// =======================
// 🔒 SCROLL CONTROL
// =======================

function travarScroll() {
  document.body.style.overflow = "hidden";
}

function liberarScroll() {
  document.body.style.overflow = "auto";
}

// =======================
// 🎧 ÁUDIO
// =======================

let synth;

function criarSynth() {
  const instrumento = selectInstrumento.value;

  const reverb = new Tone.Reverb({
    decay: 1.5,
    wet: 0.3,
  }).toDestination();

  if (instrumento.includes("baixo")) {
    synth = new Tone.MonoSynth({
      oscillator: { type: "square" },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 0.8 },
      filter: { Q: 2, type: "lowpass", rolloff: -24 },
    });
    synth.volume.value = 3;
  } else if (
    instrumento.includes("guitarra") ||
    instrumento.includes("violao")
  ) {
    synth = new Tone.MonoSynth({ oscillator: { type: "sawtooth" } });
    synth.volume.value = -5;
  } else {
    synth = new Tone.Synth({ oscillator: { type: "triangle" } });
  }

  synth.connect(reverb);
}

document.body.addEventListener(
  "click",
  async () => {
    await Tone.start();
  },
  { once: true },
);

function mapearNota(nota) {
  return nota.includes("/") ? nota.split("/")[0] : nota;
}

// 🔥 NOVO: oitavas reais por instrumento
const oitavasPorCorda = {
  guitarra: [2, 2, 3, 3, 3, 4], // corda 6 → 1
  violao7: [1, 2, 2, 3, 3, 3, 4], // corda 7 → 1
  baixo4: [1, 1, 2, 2],
  baixo5: [0, 1, 1, 2, 2],
  cavaquinho: [4, 4, 4, 4],
  bandolim4: [3, 3, 4, 4],
  bandolim5: [3, 3, 3, 4, 4],
};

// 🔥 AGORA AO CLICAR NA OPÇÃO
function tocarSom(nota) {
  if (!synth || !perguntaAtual) return;

  const instrumento = selectInstrumento.value;

  const corda = perguntaAtual.corda;
  const casa = perguntaAtual.casa;

  // 🔥 pega posição real
  const notaBase = afinacao[corda];
  const indiceBase = encontrarIndice(notaBase);
  const indiceFinal = indiceBase + casa;

  // 🔥 pega a NOTA CLICADA (ESSENCIAL)
  const notaIndex = encontrarIndice(nota);

  const oitavaBase = oitavasPorCorda[instrumento][corda];
  const oitavaFinal = oitavaBase + Math.floor(indiceFinal / 12);

  const notaFinal = mapearNota(nota) + oitavaFinal;

  synth.triggerAttackRelease(notaFinal, "16n");
}
// =======================
// 🧠 LÓGICA
// =======================

function encontrarIndice(nota) {
  return notas.findIndex((g) => g.includes(nota));
}

function obterIntervaloPosicao() {
  switch (posicaoAtual) {
    case "1":
      return { min: 0, max: 4 };
    case "2":
      return { min: 5, max: 8 };
    case "3":
      return { min: 9, max: 12 };
    case "1-2":
      return { min: 0, max: 8 };
    case "2-3":
      return { min: 5, max: 12 };
    case "todas":
      return { min: 0, max: 12 };
    default:
      return { min: 0, max: 4 };
  }
}

function gerarListaPerguntas() {
  listaPerguntas = [];

  const { min, max } = obterIntervaloPosicao();

  afinacao.forEach((_, corda) => {
    for (let casa = min; casa <= max; casa++) {
      listaPerguntas.push({ corda, casa });
    }
  });

  embaralhar(listaPerguntas);
  indiceAtual = 0;
}

function embaralhar(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function gerarPergunta() {
  if (indiceAtual >= listaPerguntas.length) {
    finalizarJogo();
    return;
  }

  perguntaAtual = listaPerguntas[indiceAtual];

  const { corda, casa } = perguntaAtual;

  const notaBase = afinacao[corda];
  const indiceBase = encontrarIndice(notaBase);
  const indiceFinal = (indiceBase + casa) % 12;

  perguntaAtual.resposta = notas[indiceFinal];

  perguntaEl.innerText = `Corda ${afinacao.length - corda} | Casa ${casa}`;

  document
    .querySelectorAll("input[name='nota']")
    .forEach((i) => (i.checked = false));
}

// =======================
// 🎯 OPÇÕES
// =======================

function criarOpcoes() {
  opcoesEl.innerHTML = "";

  notas.forEach((grupo) => {
    grupo.forEach((nota) => {
      const label = document.createElement("label");
      label.className = "opcao";

      // Adiciona classe opcao2 para sustenidos/bemois
      if (nota.includes("/")) {
        label.classList.add("opcao2");
      }

      const input = document.createElement("input");
      input.type = "radio";
      input.name = "nota";
      input.value = nota;

      const span = document.createElement("span");
      span.textContent = nota;

      input.addEventListener("click", () => {
        input.checked = true;
        tocarSom(nota);
        responder();
      });

      label.appendChild(input);
      label.appendChild(span);

      opcoesEl.appendChild(label);
    });
  });
}

// =======================
// 📊 SCORE
// =======================

function atualizarPlacar() {
  placarEl.innerText = `Acertos: ${acertos} | Erros: ${erros} | Total: ${total}`;
}

// =======================
// ⏱️ TIMER
// =======================

function iniciarTimer() {
  clearInterval(intervalo);
  tempo = 0;

  intervalo = setInterval(() => {
    tempo++;
    // AJUSTE: Formatação para MM:SS
    const min = Math.floor(tempo / 60)
      .toString()
      .padStart(2, "0");
    const seg = (tempo % 60).toString().padStart(2, "0");
    timerEl.innerText = `Tempo: ${min}:${seg}`;
  }, 1000);
}

// =======================
// 🔔 TOAST
// =======================

function mostrarToast(msg, tipo) {
  resultado.innerText = msg;
  resultado.className = "";
  resultado.classList.add("show", tipo);

  setTimeout(() => {
    resultado.classList.remove("show");
  }, 1000);
}

// =======================
// 🏁 FINALIZAR
// =======================

function finalizarJogo() {
  clearInterval(intervalo);

  liberarScroll();

  let textoFinal = "\n\n";

  if (listaErros.length > 0) {
    textoFinal += "Erros:\n\n";

    listaErros.forEach((erro, index) => {
      textoFinal += `${index + 1}) Corda ${erro.corda} | Casa ${erro.casa}\n`;
      textoFinal += `Correta: ${erro.correta} | Você marcou: ${erro.marcada}\n\n`;
    });
  } else {
    textoFinal += "Sem erros 🎉 Parabéns";
  }

  perguntaEl.innerText = "🎉 Finalizado!";

  resultadoFinalEl.innerText = textoFinal;
  resultadoFinalEl.style.display = "block";

  resultadoFinalEl.classList.add("resultado-erro");

  configEl.style.display = "flex";

  btnIniciar.style.display = "block";
  btnIniciar.innerText = "Reiniciar";

  jogoIniciado = false;
}

// =======================
// ✅ RESPOSTA
// =======================

function responder() {
  if (!jogoIniciado || bloqueado) return;

  const selecionado = document.querySelector("input[name='nota']:checked");
  if (!selecionado) return;

  bloqueado = true;

  const valor = selecionado.value;
  const correto = perguntaAtual.resposta.includes(valor);

  total++;

  if (correto) {
    acertos++;
    mostrarToast("✅ Correto!", "sucesso");
  } else {
    erros++;
    mostrarToast("❌ " + perguntaAtual.resposta.join(" ou "), "erro");
    listaErros.push({
      corda: afinacao.length - perguntaAtual.corda,
      casa: perguntaAtual.casa,
      correta: perguntaAtual.resposta.join(" ou "),
      marcada: valor,
    });
  }

  atualizarPlacar();

  indiceAtual++;

  setTimeout(() => {
    bloqueado = false;
    gerarPergunta();
  }, 150);
}

// =======================
// 🚀 INICIAR JOGO
// =======================

function iniciarJogo() {
  jogoIniciado = true;

  travarScroll();

  acertos = 0;
  erros = 0;
  total = 0;
  listaErros = [];
  configEl.style.display = "none";
  btnIniciar.style.display = "none";
  perguntaEl.style.display = "block";

  resultadoFinalEl.style.display = "none";
  resultadoFinalEl.classList.remove("resultado-erro");
  resultadoFinalEl.innerText = "";

  gerarListaPerguntas();
  gerarPergunta();
  atualizarPlacar();
  iniciarTimer();
}

// =======================
// 🔄 EVENTOS
// =======================

selectInstrumento.addEventListener("change", (e) => {
  afinacao = instrumentos[e.target.value];
  criarSynth();
});

selectPosicao.addEventListener("change", (e) => {
  posicaoAtual = e.target.value;
});

btnIniciar.addEventListener("click", iniciarJogo);

// =======================
// 🚀 START
// =======================

criarSynth();
criarOpcoes();

// =======================
// 💰 PIX
// =======================

function copiarPix() {
  const chave = "61984789603";

  navigator.clipboard.writeText(chave).then(() => {
    alert("Chave PIX copiada!");
  });
}
// =======================
// ❓ AJUDA (IMAGENS)
// =======================

const btnAjuda = document.getElementById("btnAjuda");
const modalAjuda = document.getElementById("modalAjuda");
const fecharModal = document.getElementById("fecharModal");
const imgInstrumento = document.getElementById("imagemInstrumento");

// 🔥 MAPEAMENTO DAS IMAGENS
const imagens = {
  guitarra: "../imgs/guitarra.jpg",
  violao7: "../imgs/violao7.jpg",
  baixo4: "../imgs/baixo4.jpg",
  baixo5: "../imgs/baixo5.jpg",
  cavaquinho: "../imgs/cavaquinho.png",
  bandolim4: "../imgs/bandolim4.png",
  bandolim5: "../imgs/bandolim5.png",
};

// ABRIR
btnAjuda.addEventListener("click", () => {
  const instrumento = selectInstrumento.value;

  imgInstrumento.src = imagens[instrumento];

  modalAjuda.style.display = "flex";
});

// FECHAR
fecharModal.addEventListener("click", () => {
  modalAjuda.style.display = "none";
});

// FECHAR CLICANDO FORA
modalAjuda.addEventListener("click", (e) => {
  if (e.target === modalAjuda) {
    modalAjuda.style.display = "none";
  }
});
