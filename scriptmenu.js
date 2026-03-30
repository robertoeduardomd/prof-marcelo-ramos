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