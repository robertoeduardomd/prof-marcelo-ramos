// =======================
// 💰 PIX
// =======================

function copiarPix() {
  const chave = "61984789603";

  navigator.clipboard.writeText(chave).then(() => {
    alert("Chave PIX: (61) 98478-9603 copiada!");
  });
}