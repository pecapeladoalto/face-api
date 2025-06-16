const fs = require('fs');
const path = require('path');
const { createCanvas, Image } = require('canvas');
const faceapi = require('face-api.js');
const tf = require('@tensorflow/tfjs-node');

// Configurar ambiente
faceapi.env.monkeyPatch({
  Canvas: createCanvas(),
  Image: Image,
  ImageData: ImageData
});

// Cache para modelos
let modelsLoaded = false;
const canvas = createCanvas(300, 300);

async function loadModels() {
  if (modelsLoaded) return;
  
  console.log('Loading models...');
  const modelPath = path.join(__dirname, '../../models');
  
  await faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
  
  modelsLoaded = true;
  console.log('Models loaded successfully');
}

module.exports = {
  canvas,
  faceapi,
  loadModels
};