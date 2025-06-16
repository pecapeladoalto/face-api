const express = require('express');
const cors = require('cors');
const path = require('path');
const { canvas, faceapi } = require('./utils/faceCache');
const { initFaceMatcher } = require('./utils/faceMatcher');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rota para inicialização
app.get('/init', async (req, res) => {
  try {
    await initFaceMatcher();
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para processar frame da webcam
app.post('/recognize', async (req, res) => {
  try {
    const { imageData } = req.body;
    if (!imageData) throw new Error('No image data provided');
    
    const result = await recognizeFace(imageData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function recognizeFace(imageData) {
  // Converter base64 para imagem
  const img = await canvas.loadImage(Buffer.from(imageData, 'base64'));
  const displaySize = { width: img.width, height: img.height };
  
  // Redimensionar canvas
  faceapi.matchDimensions(canvas, displaySize);
  
  // Detectar faces
  const detections = await faceapi
    .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptors();
    
  if (detections.length === 0) return { faces: [] };
  
  // Redimensionar detecções para o tamanho do canvas
  const resizedDetections = faceapi.resizeResults(detections, displaySize);
  
  // Obter o faceMatcher do cache
  const faceMatcher = require('./utils/faceMatcher').faceMatcher;
  
  // Reconhecer faces
  const results = resizedDetections.map(d => {
    const bestMatch = faceMatcher.findBestMatch(d.descriptor);
    return {
      name: bestMatch.toString(),
      box: d.detection.box
    };
  });
  
  return { faces: results };
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});