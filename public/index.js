const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const resultsDiv = document.getElementById('results');

let recognitionInterval;

async function init() {
  try {
    // Inicializar backend
    await fetch('http://localhost:3000/init');
    
    // Iniciar webcam
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    video.srcObject = stream;
    
    // Começar reconhecimento
    recognitionInterval = setInterval(recognizeFaces, 1000);
    
    resultsDiv.textContent = 'Sistema pronto. Procurando rostos...';
  } catch (error) {
    resultsDiv.textContent = `Erro: ${error.message}`;
    console.error(error);
  }
}

async function recognizeFaces() {
  try {
    // Capturar frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg').split(',')[1];
    
    // Enviar para reconhecimento
    const response = await fetch('http://localhost:3000/recognize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData })
    });
    
    const { faces } = await response.json();
    
    // Desenhar resultados
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    faces.forEach(face => {
      // Desenhar retângulo
      ctx.strokeStyle = 'green';
      ctx.lineWidth = 2;
      ctx.strokeRect(face.box.x, face.box.y, face.box.width, face.box.height);
      
      // Mostrar nome
      ctx.fillStyle = 'green';
      ctx.font = '16px Arial';
      ctx.fillText(face.name, face.box.x, face.box.y > 20 ? face.box.y - 5 : 20);
    });
    
    resultsDiv.textContent = faces.length > 0 
      ? `Rostos reconhecidos: ${faces.map(f => f.name).join(', ')}`
      : 'Nenhum rosto reconhecido';
  } catch (error) {
    console.error('Erro no reconhecimento:', error);
  }
}

// Iniciar quando a página carregar
window.onload = init;
window.onbeforeunload = () => {
  clearInterval(recognitionInterval);
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }
};