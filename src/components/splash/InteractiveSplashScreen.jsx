import React, { useRef, useEffect, useState, useCallback } from 'react';
import splashVideo from '../../assets/splash_video.mp4';
import splashPoster from '../../assets/splash_poster.png';
import './InteractiveSplashScreen.css';

/**
 * InteractiveSplashScreen
 * High-performance, seamless cinematic video splash screen for MyLawyer.
 * 
 * Root Cause Fix for Native Play Button Icon:
 * 1. Poster image of exact first frame matches background seamlessly.
 * 2. Solid cover layer sits above video until playback is actively running (onPlaying / onTimeUpdate).
 * 3. Suppresses all webkit media controls in CSS.
 * 4. Android WebSettings mediaPlaybackRequiresUserGesture set to false in MainActivity.
 */
export default function InteractiveSplashScreen({ onAnimationComplete }) {
  const videoRef = useRef(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleFinish = useCallback(() => {
    setIsFadingOut((prev) => {
      if (prev) return prev;
      setTimeout(() => {
        if (typeof onAnimationComplete === 'function') {
          onAnimationComplete();
        }
      }, 400);
      return true;
    });
  }, [onAnimationComplete]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = 1.0;
      video.play().catch(() => {
        // If autoplay blocked by environment, finish cleanly
        handleFinish();
      });
    }

    // Safety fallback: video is 4.0s, so 4.3s guarantees transition
    const safetyTimer = setTimeout(() => {
      handleFinish();
    }, 4300);

    return () => clearTimeout(safetyTimer);
  }, [handleFinish]);

  const handlePlaybackActive = useCallback(() => {
    setIsPlaying(true);
  }, []);

  return (
    <div
      className={`interactive-splash-root ${isFadingOut ? 'splash-fading-out' : ''}`}
      onClick={handleFinish}
      role="status"
      aria-label="MyLawyer"
    >
      {/* 
        Solid Poster Cover:
        Displays the exact first frame seamlessly and completely blocks
        any video player placeholder / play button icon until frames are rendering.
      */}
      <div
        className={`splash-poster-cover ${isPlaying ? 'cover-hidden' : ''}`}
        style={{ backgroundImage: `url(${splashPoster})` }}
        aria-hidden="true"
      />

      <video
        ref={videoRef}
        src={splashVideo}
        poster={splashPoster}
        className={`splash-video-player ${isPlaying ? 'video-visible' : ''}`}
        playsInline
        muted
        autoPlay
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        preload="auto"
        onPlaying={handlePlaybackActive}
        onTimeUpdate={handlePlaybackActive}
        onEnded={handleFinish}
      />
    </div>
  );
}
