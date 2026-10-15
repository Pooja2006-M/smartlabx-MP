import React, { useState, useRef, useEffect } from 'react';

export default function FaceEnrollment({ studentId = 'Aarav_Kumar', studentName = 'Aarav Kumar' }) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollStatus, setEnrollStatus] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Check enrollment status
    fetch(`/api/proctor/enrollment-status/${studentId}`)
      .then(res => res.json())
      .then(data => {
        if (data.is_registered) {
          setEnrollStatus({ success: true, message: 'Biometric face photo is registered and active for exams.' });
        }
      })
      .catch(() => {});
  }, [studentId]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      setEnrollStatus(null);
    } catch (err) {
      alert('Camera access failed. Please allow webcam permissions in your browser.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, 640, 480);
    const base64Image = canvas.toDataURL('image/jpeg', 0.85);
    setPhotoPreview(base64Image);
  };

  const submitEnrollment = async () => {
    if (!photoPreview) return;
    setIsEnrolling(true);
    try {
      const res = await fetch('/api/proctor/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, image_base64: photoPreview })
      });
      const data = await res.json();
      if (data.success) {
        setEnrollStatus({ success: true, message: 'Reference face photo registered successfully!' });
        stopCamera();
      } else {
        setEnrollStatus({ success: false, message: data.error || data.warning || 'Enrollment warning.' });
      }
    } catch (e) {
      setEnrollStatus({ success: false, message: 'Server communication error during enrollment.' });
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div style={{
      maxWidth: 720,
      margin: '0 auto',
      background: '#111827',
      borderRadius: 16,
      border: '1px solid rgba(99, 102, 241, 0.2)',
      padding: 24,
      color: '#f3f4f6',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: '2rem' }}></div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Biometric Face Enrollment</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#9ca3af' }}>
            InvigiLMNce AI Proctoring System requires a reference photo before you enter Safe Exam Mode.
          </p>
        </div>
      </div>

      {enrollStatus && (
        <div style={{
          background: enrollStatus.success ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${enrollStatus.success ? '#10b981' : '#ef4444'}`,
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 20,
          fontSize: '0.9rem',
          color: enrollStatus.success ? '#6ee7b7' : '#fca5a5',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span>{enrollStatus.success ? '[OK]' : '[!]'}</span>
          <span>{enrollStatus.message}</span>
        </div>
      )}

      <div style={{
        position: 'relative',
        width: '100%',
        height: 320,
        background: '#030712',
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #1f2937',
        marginBottom: 20,
      }}>
        {photoPreview ? (
          <img src={photoPreview} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', display: isCameraActive ? 'block' : 'none' }} />
        )}

        {!isCameraActive && !photoPreview && (
          <div style={{ textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: '3rem', marginBottom: 8 }}></div>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Camera is offline</p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {!isCameraActive && !photoPreview && (
          <button
            onClick={startCamera}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              background: '#4f46e5',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Start Webcam
          </button>
        )}

        {isCameraActive && !photoPreview && (
          <button
            onClick={capturePhoto}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              background: '#10b981',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
             Capture Photo
          </button>
        )}

        {photoPreview && (
          <>
            <button
              onClick={submitEnrollment}
              disabled={isEnrolling}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                background: '#059669',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {isEnrolling ? 'Saving to AI Database...' : 'Save Reference Biometric Photo'}
            </button>

            <button
              onClick={() => setPhotoPreview(null)}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                background: '#374151',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Retake Photo
            </button>
          </>
        )}
      </div>
    </div>
  );
}
