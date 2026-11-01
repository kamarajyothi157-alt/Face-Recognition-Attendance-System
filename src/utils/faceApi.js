import * as faceapi from 'face-api.js';

const MODEL_URL = '/models';

// Load models from public folder with caching check
export const loadModels = async () => {
  try {
    const isTinyDetectorLoaded = faceapi.nets.tinyFaceDetector.isLoaded;
    const isLandmarkLoaded = faceapi.nets.faceLandmark68TinyNet.isLoaded;
    const isRecognitionLoaded = faceapi.nets.faceRecognitionNet.isLoaded;

    if (isTinyDetectorLoaded && isLandmarkLoaded && isRecognitionLoaded) {
      return true;
    }

    await Promise.all([
      !isTinyDetectorLoaded ? faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL) : Promise.resolve(),
      !isLandmarkLoaded ? faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL) : Promise.resolve(),
      !isRecognitionLoaded ? faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL) : Promise.resolve(),
    ]);

    console.log('Face recognition models loaded successfully');
    return true;
  } catch (error) {
    console.error('Error loading face recognition models:', error);
    return false;
  }
};

// Create a FaceMatcher from stored user data with input validation
export const createFaceMatcher = (users) => {
  if (!users || !Array.isArray(users) || users.length === 0) return null;

  const validUsers = users.filter(
    (u) =>
      u &&
      u.name &&
      u.embeddings &&
      (Array.isArray(u.embeddings) || ArrayBuffer.isView(u.embeddings)) &&
      u.embeddings.length === 128
  );

  if (validUsers.length === 0) return null;

  try {
    const labeledDescriptors = validUsers.map((user) => {
      const descriptor = new Float32Array(user.embeddings);
      return new faceapi.LabeledFaceDescriptors(user.name, [descriptor]);
    });

    return new faceapi.FaceMatcher(labeledDescriptors, 0.45);
  } catch (err) {
    console.error('Error creating FaceMatcher:', err);
    return null;
  }
};

// Detection for registration with validation
export const detectFacesForRegistration = async (input) => {
  if (!input) {
    return { error: 'No camera input provided.' };
  }

  if (
    input instanceof HTMLVideoElement &&
    (input.readyState < 2 || input.videoWidth === 0 || input.paused)
  ) {
    return { error: 'Camera stream is still starting. Please wait a second.' };
  }

  try {
    const detections = await faceapi
      .detectAllFaces(
        input,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 })
      )
      .withFaceLandmarks(true)
      .withFaceDescriptors();

    if (!detections || detections.length === 0) {
      return { error: 'No face detected. Please position your face clearly in the frame.' };
    }

    if (detections.length > 1) {
      return { error: 'Multiple faces detected. Please make sure only one person is in view.' };
    }

    return { descriptor: detections[0].descriptor };
  } catch (err) {
    console.error('Error detecting face for registration:', err);
    return { error: 'Failed to process facial embeddings. Please retry.' };
  }
};

// Backwards-compatible helper
export const getFaceEmbeddings = async (input) => {
  const result = await detectFacesForRegistration(input);
  return result.descriptor || null;
};

// Recognition loop detection with validation
export const recognizeFace = async (input, faceMatcher) => {
  if (!faceMatcher || !input) return [];

  if (
    input instanceof HTMLVideoElement &&
    (input.readyState < 2 || input.videoWidth === 0 || input.paused)
  ) {
    return [];
  }

  try {
    const detections = await faceapi
      .detectAllFaces(
        input,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 })
      )
      .withFaceLandmarks(true)
      .withFaceDescriptors();

    if (!detections || detections.length === 0) return [];

    const results = detections.map((d) => {
      const bestMatch = faceMatcher.findBestMatch(d.descriptor);
      return {
        label: bestMatch.label,
        distance: bestMatch.distance,
        box: d.detection.box,
      };
    });

    return results;
  } catch (err) {
    console.warn('Face recognition detection loop error:', err);
    return [];
  }
};
