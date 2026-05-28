const supabaseClient = supabase.createClient(
  "https://mpizpzdqtxgcjuxrjsoa.supabase.co",
  "sb_publishable_UdO0kPTujX_15J9c3TpGdA_Lkq79XSv",
);

 function mostrarToast(mensagem, tipo = 'verde') {
    const container = document.getElementById("toast-container");
    const div = document.createElement("div");
    
    // Mapeia o tipo para a classe CSS
    const classes = {
        'verde': 'toast toast-verde',
        'vermelho': 'toast toast-vermelho',
        'amarelo': 'toast toast-amarelo'
    };
    
    div.className = classes[tipo] || classes['verde'];
    div.innerText = mensagem;
    
    container.appendChild(div);
    
    // Remove após 3 segundos
    setTimeout(() => {
        div.remove();
    }, 3000);
}
const SistemaAcesso = {
  // 1. Obtém o ID (UUID) real da sessão ou gera um guest_id para visitantes
  async obterIdentificador() {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (session && session.user) {
      return session.user.id;
    }

    let guestId = localStorage.getItem("guest_id");
    if (!guestId) {
      guestId = "guest_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("guest_id", guestId);
    }
    return guestId;
  },

  // 2. Verifica permissão de jogo
  async podeJogar(nomeApp) {
    const id = await this.obterIdentificador();

    // Busca na tabela pública 'users'
    const { data: user } = await supabaseClient
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    // Se o usuário existir e for Pro, libera total
    const planosPremium = ["plano1", "plano2", "combo", "vitalicio"];

    const usuarioPremium = user && planosPremium.includes(user.tipo_acesso);

    if (usuarioPremium) {
      return {
        liberado: true,
        is_pago: user.is_pago,
      };
    }

    // Conta jogadas no histórico
    const { count } = await supabaseClient
      .from("historico_jogadas")
      .select("*", { count: "exact", head: true })
      .eq("identificador", id)
      .eq("app", nomeApp);

    const totalJogadas = count || 0;

    return {
      liberado: totalJogadas < 3,
      tentativas: totalJogadas,
      is_pago: false,
    };
  },

  // 3. Salva partida
  // No config.js
  // 3. Salva partida
  async salvarPartida(nomeApp, acertos, erros, tempo) {
    console.log("🚀 salvarPartida foi chamada");

    const id = await this.obterIdentificador();

    console.log("📌 ID encontrado:", id);

    const dados = {
      identificador: id,
      app: nomeApp,
      acertos: acertos,
      erros: erros,
      tempo_segundos: tempo,
    };

    console.log("📦 Dados enviados:", dados);

    const { error } = await supabaseClient
      .from("historico_jogadas")
      .insert([dados])
      .select();

    if (error) {
      console.error("❌ ERRO SUPABASE:", error);
    } else {
      console.log("✅ SALVO COM SUCESSO:");
    }
  },
  // Dentro de SistemaAcesso no config.js
// No config.js - Mantenha assim:
// ... dentro de SistemaAcesso ...
async recuperarSenha(email) {
    const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/index.html', 
    });

    if (error) {
        throw new Error(error.message);
    }
    return true; 
}
// ... fim do objeto SistemaAcesso ...
};

const InterfaceUsuario = {
  modoCadastro: false,
  
  async atualizarHeader() {
    const nomeElemento = document.getElementById("nome-usuario");
    const linkPainel = document.getElementById("linkpainel");

    const btnElemento = document.getElementById("btn-login-logout");
    if (!nomeElemento || !btnElemento) return;

    const identificador = await SistemaAcesso.obterIdentificador();

    // VISITANTE
    if (identificador.startsWith("guest_")) {
      linkPainel.style.display = "none";

      nomeElemento.innerText = `Visitante #${identificador.replace("guest_", "")}`;

      btnElemento.innerText = "Fazer Login";

      btnElemento.style.background = "#3b82f6";

      btnElemento.onclick = () => this.abrirModalLogin();
    }
    // LOGADO
    else {
      linkPainel.style.display = "inline-block";

      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      const userAuth = session?.user;

      const { data: userTable } = await supabaseClient
        .from("users")
        .select("nome ,tipo_acesso")
        .eq("id", identificador)
        .maybeSingle();

      const nomeFinal =
        userTable?.nome ||
        userAuth?.user_metadata?.display_name ||
        userAuth?.email?.split("@")[0] ||
        "Músico";
      nomeElemento.innerText = `Olá, ${nomeFinal}`;
      nomeElemento.style.color = "#ff0";
      const plano = userTable?.tipo_acesso || "free";

      document.getElementById("plano-usuario").innerText = `Plano: ${plano}`;
      btnElemento.innerText = "Sair";

      btnElemento.style.background = "#ef4444";

      btnElemento.onclick = async () => {
        await supabaseClient.auth.signOut();

        localStorage.removeItem("guest_id");

        window.location.reload();
      };
    }
  },

  abrirModalLogin() {
    const modal = document.getElementById("modal-auth");
    if (modal) modal.style.display = "flex";
  },

  alternarModoAuth() {
    this.modoCadastro = !this.modoCadastro;
    const titulo = document.getElementById("auth-titulo");
    const campoNome = document.getElementById("auth-nome");
    const labelNome = document.querySelector('label[for="auth-nome"]');
    const linkAlternar = document.getElementById("auth-link");
    const textoAlternar = document.getElementById("auth-texto-alternar");

    if (this.modoCadastro) {
      titulo.innerText = "Criar Conta";
      campoNome.style.display = "block";
      labelNome.style.display = "flex";
      linkAlternar.innerText = "Já tenho conta";
      textoAlternar.innerText = "";
    } else {
      titulo.innerText = "Entrar no Sistema";
      campoNome.style.display = "none";
      labelNome.style.display = "none";
      linkAlternar.innerText = "Cadastre-se";
      textoAlternar.innerText = "Não tem conta?";
    }
  },
  
  async processarAuth() {
    const email = document.getElementById("auth-email").value.trim();
    const senha = document.getElementById("auth-senha").value.trim();
    const nome = document.getElementById("auth-nome").value.trim();

    if (!email.includes("@") || senha.length < 6) {
      return alert("E-mail inválido ou senha muito curta (mín. 6 caracteres).");
    }

    if (this.modoCadastro) {
      if (nome === "") return alert("Digite seu nome.");

      // 1. Cadastro no Auth COM metadados (para o nome aparecer rápido)
      const { data, error: authError } = await supabaseClient.auth.signUp({
        email: email,
        password: senha,
        options: {
          data: { display_name: nome }, // Isso aqui salva o nome no perfil de login
        },
      });

      if (authError)
        return alert(
          "Erro: " +
            authError.message +
            "verifique se voce ja confirmou a conta em seu email",
        );

      if (data.user) {
        const novoUsuarioId = data.user.id;
        const guestIdAntigo = localStorage.getItem("guest_id");

        await supabaseClient.from("users").insert([
          {
            id: novoUsuarioId,
            nome: nome,
            email: email,
            is_pago: false,
            tipo_acesso: "free",
          },
        ]);

        if (guestIdAntigo) {
          await supabaseClient
            .from("historico_jogadas")
            .update({ identificador: novoUsuarioId })
            .eq("identificador", guestIdAntigo);

          localStorage.removeItem("guest_id");
        }
      }

      alert(
        "Conta criada com sucesso! verifique seu email para realizar a confirmação.",
      );
      this.alternarModoAuth();
    } else {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: senha,
      });

      if (error) {
        return alert("E-mail ou senha incorretos.");
      }

      // 🔥 pega sessão atual
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      const guestIdAntigo = localStorage.getItem("guest_id");

      // 🔥 MIGRA HISTÓRICO DO VISITANTE
      if (guestIdAntigo && session?.user) {
        console.log("Migrando histórico...");

        const { error: erroMigracao } = await supabaseClient
          .from("historico_jogadas")
          .update({
            identificador: session.user.id,
          })
          .eq("identificador", guestIdAntigo);

        if (erroMigracao) {
          console.error("Erro ao migrar histórico:", erroMigracao);
        } else {
          console.log("Histórico migrado!");
        }

        // remove guest_id antigo
        localStorage.removeItem("guest_id");
      }

      window.location.reload();
    }
    
  },
   async  mostrarToast(mensagem, tipo = 'verde') {
    const container = document.getElementById("toast-container");
    const div = document.createElement("div");
    
    // Mapeia o tipo para a classe CSS
    const classes = {
        'verde': 'toast toast-verde',
        'vermelho': 'toast toast-vermelho',
        'amarelo': 'toast toast-amarelo'
    };
    
    div.className = classes[tipo] || classes['verde'];
    div.innerText = mensagem;
    
    container.appendChild(div);
    
    // Remove após 3 segundos
    setTimeout(() => {
        div.remove();
    }, 3000);
}
};

function fecharModais() {
  const modais = ["modal-auth", "modal-planos", "modalAjuda", "modal-limite"];
  modais.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
}

// Atualiza o header sempre que o estado da autenticação mudar (Login/Logout)
supabaseClient.auth.onAuthStateChange(() => {
  InterfaceUsuario.atualizarHeader();
});

window.addEventListener("DOMContentLoaded", () => {
  InterfaceUsuario.atualizarHeader();
});

async function testarConexao() {
  try {
    const { count, error } = await supabaseClient
      .from("users")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("❌ Erro de conexão:", error.message);
    } else {
      console.log("✅ Banco conectado. Usuários:", count);
    }
  } catch (err) {
    console.error("❌ Erro inesperado:", err);
  }
}
async function abrirModalRecuperacao() {
    // 1. Fecha modais abertos (caso existam)
    fecharModais(); 
    
    // 2. Em vez de usar prompt(), mostramos seu modal de recuperação
    // Certifique-se de que no seu HTML o ID seja 'modal-esqueci'
    const modal = document.getElementById("modal-esqueci");
    if (modal) {
        modal.style.display = "flex";
    }
}
// --- FUNÇÕES DE CONTROLE DOS MODAIS ---

// Abre o modal de "Esqueci a senha"
function abrirModalRecuperacao() {
    fecharModais(); // Fecha o modal de login caso esteja aberto
    document.getElementById("modal-esqueci").style.display = "flex";
}

// Fecha qualquer modal pelo ID
function fecharModal(id) {
    document.getElementById(id).style.display = "none";
}

// Processa o envio do e-mail de recuperação
async function processarRecuperacao() {
    const email = document.getElementById("email-recuperacao").value.trim();
    
    if (!email) {
        InterfaceUsuario.mostrarToast("Digite um e-mail válido.", "amarelo");
        return;
    }

    try {
        await SistemaAcesso.recuperarSenha(email);
        InterfaceUsuario.mostrarToast("Enviamos um e-mail de redefinição para você!", "verde");
        fecharModal('modal-esqueci');
    } catch (error) {
        InterfaceUsuario.mostrarToast("Erro ao enviar: " + error.message, "vermelho");
    }
}

// Processa a troca de senha ao clicar no link do e-mail

// Detecta se o usuário veio pelo link do e-mail (ao carregar a página)
// --- SUBSTITUA POR ESTE BLOCO NO FINAL DO SEU CONFIG.JS ---

supabaseClient.auth.onAuthStateChange(async (event, session) => {
    // PASSWORD_RECOVERY é o evento oficial do Supabase quando o usuário clica no link do e-mail
    if (event === 'PASSWORD_RECOVERY') {
        const modalReset = document.getElementById("modal-resetar");
        if (modalReset) {
            modalReset.style.display = "flex";
        }
    }
});

testarConexao();
