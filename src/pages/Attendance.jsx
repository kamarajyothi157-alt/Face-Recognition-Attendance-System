import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Camera, ShieldCheck, UserCheck, AlertCircle, Loader2, RefreshCw, UserPlus, CheckCircle2, Clock } from 'lucide-react';
import { loadModels, createFaceMatcher, recognizeFace } from '../utils/faceApi';
import { storage } from '../utils/storage';
import { playSuccessSound } from '../utils/sounds';

const Attendance = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [recentEvent, setRecentEvent] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [hasNoUsers, setHasNoUsers] = useState(false);

  const isDetecting = useRef(false);
  const cameraRequestId = useRef(0);
  const usersRef = useRef(users);
  const faceMatcherRef = useRef(faceMatcher);
  const processingRef = useRef(processing);
  const lastMarkedUserRef = useRef(null);

  usersRef.current = users;
  faceMatcherRef.current = faceMatcher;
  processingRef.current = processing;

  const stopCamera = () => {
    isDetecting.current = false;

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

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
      try {
        setLoading(true);
        setError('');
        setHasNoUsers(false);

        const modelsLoaded = await loadModels();
        if (!isMounted) return;

        if (!modelsLoaded) {
          setError('Failed to load face recognition neural models from /models.');
          setLoading(false);
          return;
        }

        const registeredUsers = await storage.getUsers();
        if (!isMounted) return;

        usersRef.current = registeredUsers;
        setUsers(registeredUsers);

        if (!registeredUsers || registeredUsers.length === 0) {
          setHasNoUsers(true);
          setLoading(false);
          return;
        }

        const matcher = createFaceMatcher(registeredUsers);
        if (!matcher) {
          setHasNoUsers(true);
          setLoading(false);
          return;
        }

        faceMatcherRef.current = matcher;
        setFaceMatcher(matcher);

        await startCamera();
      } catch (err) {
        console.error('Initialization error:', err);
        if (isMounted) {
          setError('System initialization failed. Please check camera and storage permissions.');
          setLoading(false);
        }
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
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      video.srcObject = stream;
      video.muted = true;

      await new Promise((resolve) => {
        video.onloadedmetadata = () => resolve();
      });

      try {
        await video.play();
      } catch (playErr) {
        if (playErr.name === 'AbortError') {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        throw playErr;
      }

      setLoading(false);
      isDetecting.current = true;
      requestAnimationFrame(detectionLoop);
    } catch (err) {
      console.error('Camera error:', err);
      setError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : 'Unable to connect to camera device. Please ensure no other app is using the webcam.'
      );
      setLoading(false);
    }
  };

  const drawDetections = (results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const width = video.videoWidth || video.clientWidth || 640;
    const height = video.videoHeight || video.clientHeight || 480;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    results.forEach((res) => {
      const { box, label, distance } = res;
      const isRecognized = label !== 'unknown' && distance < 0.45;
      const color = isRecognized ? '#10b981' : '#f59e0b';

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      const confidence = Math.round((1 - Math.min(distance, 1)) * 100);
      const labelText = isRecognized ? `${label} (${confidence}%)` : 'Unknown User';

      ctx.font = 'bold 14px system-ui, sans-serif';
      const textWidth = ctx.measureText(labelText).width;
      const labelY = box.y > 30 ? box.y - 25 : box.y;

      ctx.fillStyle = color;
      ctx.fillRect(box.x, labelY, textWidth + 16, 24);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(labelText, box.x + 8, labelY + 16);
    });
  };

  const detectionLoop = async () => {
    if (!isDetecting.current) return;

    const video = videoRef.current;
    if (
      !video ||
      video.readyState < 2 ||
      video.videoWidth === 0 ||
      video.paused ||
      !faceMatcherRef.current ||
      processingRef.current
    ) {
      if (isDetecting.current) requestAnimationFrame(detectionLoop);
      return;
    }

    try {
      const results = await recognizeFace(video, faceMatcherRef.current);

      if (results && results.length > 0) {
        drawDetections(results);

        if (results.length > 1) {
          setError('Multiple faces detected. Please ensure only one person is in the frame.');
        } else {
          setError('');
          const bestResult = results[0];
          if (bestResult.label !== 'unknown' && bestResult.distance < 0.45) {
            handleAttendance(bestResult.label);
          }
        }
      } else {
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    } catch (err) {
      console.warn('Detection cycle error:', err);
    }

    if (isDetecting.current) requestAnimationFrame(detectionLoop);
  };

  const handleAttendance = async (userName) => {
    const user = usersRef.current.find((u) => u.name === userName);
    if (!user || processingRef.current) return;

    if (lastMarkedUserRef.current === user.id) return;

    processingRef.current = true;
    setProcessing(true);

    try {
      const markedToday = await storage.isAlreadyMarked(user.id);
      const currentTime = new Date().toLocaleTimeString();

      if (markedToday) {
        lastMarkedUserRef.current = user.id;
        setRecentEvent({
          type: 'already_marked',
          userName: user.name,
          userId: user.id,
          time: currentTime,
        });

        setTimeout(() => {
          processingRef.current = false;
          setProcessing(false);
        }, 2500);
        return;
      }

      await storage.saveAttendance({
        userId: user.id,
        name: user.name,
      });

      lastMarkedUserRef.current = user.id;
      setRecentEvent({
        type: 'success',
        userName: user.name,
        userId: user.id,
        time: currentTime,
      });

      playSuccessSound();

      setTimeout(() => {
        processingRef.current = false;
        setProcessing(false);
      }, 3000);
    } catch (err) {
      console.error('Attendance record error:', err);
      setError('Could not save attendance log. Please try again.');
      processingRef.current = false;
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mark Attendance</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Real-time face recognition for automatic and offline attendance logging.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-sm font-semibold border border-emerald-100 dark:border-emerald-900/30">
          <ShieldCheck size={18} />
          System Live
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Scanner Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative aspect-video glass-card overflow-hidden bg-slate-900 group">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 z-10 bg-slate-900">
                <Loader2 className="animate-spin mb-4 text-primary-500" size={40} />
                <p className="font-medium">Initializing Face Recognition Engine...</p>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover scale-x-[-1] ${loading ? 'opacity-0' : 'opacity-100'}`}
            />

            {/* Live Canvas Bounding Box Overlay */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none scale-x-[-1]"
            />

            {!loading && !error && !hasNoUsers && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-primary-500/30 rounded-3xl" />
                <div className="absolute top-0 left-0 w-full h-1 bg-primary-500/50 animate-[scan_2s_ease-in-out_infinite]" />
              </div>
            )}

            {/* Clean Onboarding State when database is empty */}
            {hasNoUsers && (
              <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center text-center p-8 z-20">
                <div className="w-16 h-16 bg-primary-500/10 text-primary-400 rounded-2xl flex items-center justify-center mb-4 border border-primary-500/20">
                  <UserPlus size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Registered Users Yet</h3>
                <p className="text-slate-400 max-w-sm mb-6 text-sm">
                  The face recognition matcher requires at least one registered profile to start recognizing faces.
                </p>
                <Link to="/register" className="btn-primary flex items-center gap-2">
                  <UserPlus size={18} /> Register First User
                </Link>
              </div>
            )}

            {/* Error Overlay */}
            {error && !hasNoUsers && (
              <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-center p-8 z-20">
                <AlertCircle className="text-red-500 mb-4" size={48} />
                <h3 className="text-xl font-bold text-white mb-2">Camera Notice</h3>
                <p className="text-slate-400 max-w-xs mb-6 text-sm">{error}</p>
                <button
                  onClick={startCamera}
                  className="btn-primary flex items-center gap-2"
                >
                  <RefreshCw size={18} /> Retry Camera
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-4 p-4 glass-card items-center">
            <div
              className={`p-3 rounded-full ${
                processing
                  ? recentEvent?.type === 'already_marked'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-emerald-100 text-emerald-600 animate-pulse'
                  : 'bg-slate-100 text-slate-500'
              } dark:bg-slate-800`}
            >
              <Camera size={24} />
            </div>
            <div className="flex-1">
              <p className="font-bold">
                {processing
                  ? recentEvent?.type === 'already_marked'
                    ? 'Already Marked Today'
                    : 'Recognition Successful!'
                  : 'Scanning for Registered Faces...'}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {processing
                  ? recentEvent?.type === 'already_marked'
                    ? `${recentEvent.userName} has already logged attendance for today.`
                    : `Attendance marked for ${recentEvent?.userName || 'User'}.`
                  : 'Look directly at the webcam within the highlighted area.'}
              </p>
            </div>
            {!loading && !hasNoUsers && (
              <button
                onClick={startCamera}
                className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary-600 transition-colors"
                title="Restart Camera"
              >
                <RefreshCw size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Status / Activity Section */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <UserCheck size={20} className="text-primary-600" /> Recent Recognition Event
            </h3>
            <div className="space-y-4">
              {recentEvent ? (
                recentEvent.type === 'already_marked' ? (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/30">
                    <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider mb-1">
                      <Clock size={14} /> Already Marked Today
                    </div>
                    <p className="font-bold text-lg">{recentEvent.userName}</p>
                    <p className="text-sm text-slate-500">Recognized at {recentEvent.time}</p>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800/30">
                    <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-1">
                      <CheckCircle2 size={14} /> Attendance Logged
                    </div>
                    <p className="font-bold text-lg">{recentEvent.userName}</p>
                    <p className="text-sm text-slate-500">Attendance marked at {recentEvent.time}</p>
                  </div>
                )
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <RefreshCw className="mx-auto mb-3 opacity-20" size={32} />
                  <p className="text-sm">No recognition events yet in this session.</p>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-bold mb-3 text-sm">System Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl text-center">
                <p className="text-xs text-slate-500 mb-1">Registered Users</p>
                <p className="font-bold text-xl">{users.length}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl text-center">
                <p className="text-xs text-slate-500 mb-1">Model Accuracy</p>
                <p className="font-bold text-xl text-emerald-500">99.3%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
