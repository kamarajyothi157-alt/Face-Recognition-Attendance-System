import React, { useRef, useState, useEffect } from 'react';
import { Camera, User, Contact, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { loadModels, detectFacesForRegistration } from '../utils/faceApi';
import { storage } from '../utils/storage';

const Register = () => {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({ name: '', id: '' });

  const cameraRequestId = useRef(0);

  const stopCamera = () => {
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch (err) {
        console.warn('Pause video stream failed:', err);
      }

      if (videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const modelsLoaded = await loadModels();
      if (!isMounted) return;

      if (modelsLoaded) {
        startCamera();
      } else {
        setError('Failed to load face recognition models.');
        setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    const requestId = ++cameraRequestId.current;
    setLoading(true);
    setError('');

    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });

      if (requestId !== cameraRequestId.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.muted = true;

        await new Promise((resolve) => {
          video.onloadedmetadata = () => resolve();
        });

        try {
          await video.play();
        } catch (e) {
          if (e.name === 'AbortError') {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          throw e;
        }

        setLoading(false);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError(
        err.name === 'NotAllowedError'
          ? 'Camera access denied. Please allow camera permissions in your browser.'
          : 'Unable to start camera stream. Please check camera connections.'
      );
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    const trimmedId = formData.id.trim();

    if (!trimmedName || !trimmedId) {
      setError('Please fill in both Full Name and Unique ID.');
      return;
    }

    setCapturing(true);
    setError('');
    setSuccess('');

    try {
      const existingUsers = await storage.getUsers();
      const duplicateId = existingUsers.some(
        (u) => u.id.toLowerCase() === trimmedId.toLowerCase()
      );

      if (duplicateId) {
        const confirmOverwrite = window.confirm(
          `A user with ID "${trimmedId}" is already registered. Do you want to update their facial profile?`
        );
        if (!confirmOverwrite) {
          setCapturing(false);
          return;
        }
      }

      const detectionResult = await detectFacesForRegistration(videoRef.current);

      if (detectionResult.error) {
        setError(detectionResult.error);
      } else if (detectionResult.descriptor) {
        await storage.saveUser({
          id: trimmedId,
          name: trimmedName,
          embeddings: Array.from(detectionResult.descriptor),
          registeredAt: new Date().toISOString(),
        });

        setSuccess(`User "${trimmedName}" (${trimmedId}) registered successfully!`);
        setFormData({ name: '', id: '' });
      } else {
        setError('Could not capture facial landmarks. Please reposition your face and retry.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('An error occurred during registration. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-2">Face Registration</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Capture high-precision face embeddings to enroll a new user offline.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Camera Section */}
        <div className="space-y-4">
          <div className="relative aspect-video glass-card overflow-hidden bg-slate-900 flex items-center justify-center">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 z-10 bg-slate-900">
                <Loader2 className="animate-spin mb-2 text-primary-500" size={32} />
                <p>Initializing Camera...</p>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover scale-x-[-1] ${loading ? 'opacity-0' : 'opacity-100'}`}
            />

            {capturing && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white z-20 backdrop-blur-xs">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="font-medium">Extracting Face Embeddings...</p>
                </div>
              </div>
            )}

            <div className="absolute inset-0 border-2 border-primary-500/20 pointer-events-none" />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={startCamera}
              className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} /> Retry Camera
            </button>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 px-2">
            <AlertCircle size={16} className="text-primary-500 shrink-0" />
            <p>Ensure good lighting, look straight at the webcam, and keep only one face in frame.</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="glass-card p-8">
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <User size={16} className="text-primary-600" /> Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Jane Doe"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Contact size={16} className="text-primary-600" /> Unique ID / Roll No
              </label>
              <input
                type="text"
                placeholder="e.g. EMP-101 or STU-2024"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3 text-sm border border-red-100 dark:border-red-900/30">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center gap-3 text-sm border border-emerald-100 dark:border-emerald-900/30">
                <CheckCircle2 size={18} className="shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || capturing}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {capturing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Analyzing Face...
                </>
              ) : (
                <>
                  <Camera size={20} />
                  Capture & Register Face
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
