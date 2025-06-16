async function initFaceMatcher() {
  await require('./faceCache').loadModels();
  
  const API_BASE_URL = 'http://seuservidor.com/face-database/api/';
  
  try {
    // Buscar lista de fotos do endpoint PHP
    const response = await fetch(API_BASE_URL + '?action=list');
    const { photos } = await response.json();
    
    const labeledDescriptors = await Promise.all(
      photos.map(async (photo) => {
        try {
          const img = await loadImageFromUrl(photo.url);
          
          const descriptors = await faceapi
            .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();
          
          if (!descriptors) {
            console.warn(`No face detected in ${photo.filename}`);
            return null;
          }
          
          return new faceapi.LabeledFaceDescriptors(photo.name, [descriptors.descriptor]);
        } catch (error) {
          console.error(`Error processing ${photo.filename}:`, error);
          return null;
        }
      })
    );
    
    faceMatcher = new faceapi.FaceMatcher(
      labeledDescriptors.filter(d => d !== null),
      0.6
    );
    
    console.log(`Loaded ${labeledDescriptors.length} known faces from PHP endpoint`);
  } catch (error) {
    console.error('Failed to initialize face matcher:', error);
    throw error;
  }
}