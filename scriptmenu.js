// =======================
// 💰 PIX
// =======================

function copiarPix() {
  const chave = "61984789603";

  navigator.clipboard.writeText(chave).then(() => {
    alert("Chave PIX: (61) 98478-9603 copiada!");
  });
}
  const iconwwp = document.querySelector(".iconewwp ");

   if (window.scrollY > 0 && window.scrollY < 100) {
  
    iconwwp.style.opacity = "1";
   
  } else if (window.scrollY > 100) {
   
    iconwwp.style.opacity = "0";
   
  }
window.addEventListener('load', async () => {
    // 1. Log para saber se a página carregou e o script rodou
    console.log("Página carregada. Verificando hash...");

    const hash = window.location.hash;
    console.log("Hash atual:", hash); // Isso deve mostrar algo com 'access_token'

    if (hash.includes('type=recovery')) {
        console.log("Token de recuperação detectado!");
        
        const novaSenha = prompt("Link validado! Digite sua nova senha:");
        
        if (novaSenha) {
            const { error } = await supabaseClient.auth.updateUser({ password: novaSenha });
            if (error) {
                alert("Erro ao atualizar senha: " + error.message);
            } else {
                alert("Senha alterada com sucesso!");
                window.location.hash = ""; // Limpa a URL para não pedir de novo
            }
        }
    }
});