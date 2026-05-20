import React, { useState, useEffect, useRef, useCallback, startTransition } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetCourseByIdQuery } from '@/features/api/CourseApi';
import { useMarkVideoWatchedMutation } from '@/features/api/enrollmentApi';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

const VideoPlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const playerRef = useRef(null);
  const [showStartDialog, setShowStartDialog] = useState(true);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [player, setPlayer] = useState(null);
  const progressCheckIntervalRef = useRef(null);
  const lastProgressRef = useRef(0);
  const dialogTimeoutRef = useRef(null);
  const fallbackTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);
  const playerInstanceRef = useRef(null);

  const { data: courseData, isLoading } = useGetCourseByIdQuery(courseId);
  const [markVideoWatched] = useMarkVideoWatchedMutation();

  const course = courseData?.course;

  // Extract YouTube video ID
  const extractYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = course?.videoUrl ? extractYouTubeId(course.videoUrl) : null;

  const handleVideoEnd = useCallback(async () => {
    if (videoEnded || !isMountedRef.current) return;

    startTransition(() => {
      setVideoEnded(true);
    });

    const isFullscreen = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );

    if (isFullscreen) {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen().catch(() => {});
        } else if (document.webkitFullscreenElement) {
          await document.webkitExitFullscreen().catch(() => {});
        } else if (document.mozFullScreenElement) {
          await document.mozCancelFullScreen().catch(() => {});
        } else if (document.msFullscreenElement) {
          await document.msExitFullscreen().catch(() => {});
        }
      } catch (error) {
        console.debug('Fullscreen exit error:', error);
      }
    }

    if (dialogTimeoutRef.current) {
      clearTimeout(dialogTimeoutRef.current);
      dialogTimeoutRef.current = null;
    }
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }

    const delay = isFullscreen ? 500 : 100;

    const showDialogSafely = () => {
      if (isMountedRef.current) {
        startTransition(() => {
          setShowCompleteDialog(true);
        });
      }
    };

    if (!isFullscreen) {
      showDialogSafely();
    } else {
      dialogTimeoutRef.current = setTimeout(() => {
        showDialogSafely();
        if (fallbackTimeoutRef.current) {
          clearTimeout(fallbackTimeoutRef.current);
          fallbackTimeoutRef.current = null;
        }
      }, delay);

      fallbackTimeoutRef.current = setTimeout(() => {
        showDialogSafely();
      }, 1000);
    }

    markVideoWatched(courseId).catch((error) => {
      if (isMountedRef.current) {
        console.error('Failed to mark video as watched:', error);
      }
    });
  }, [videoEnded, courseId, markVideoWatched]);

  const checkVideoCompletion = useCallback(() => {
    if (player && !videoEnded && isMountedRef.current) {
      try {
        if (!player.getDuration || typeof player.getDuration !== 'function') {
          return;
        }

        const playerState = player.getPlayerState();
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();

        if (isNaN(currentTime) || isNaN(duration) || duration <= 0) {
          return;
        }

        if (playerState === 0 || (duration && currentTime >= duration - 0.5)) {
          handleVideoEnd();
        }
      } catch (error) {
        if (isMountedRef.current && !error.message?.includes('not attached')) {
          console.debug('Completion check error:', error);
        }
      }
    }
  }, [player, videoEnded, handleVideoEnd]);

  const handleFullscreenChange = useCallback(() => {
    if (!document.fullscreenElement &&
        !document.webkitFullscreenElement &&
        !document.mozFullScreenElement &&
        !document.msFullscreenElement) {
      if (player && !videoEnded) {
        checkVideoCompletion();
      }
    }
  }, [player, videoEnded, checkVideoCompletion]);

  const startProgressTracking = useCallback((playerInstance) => {
    if (progressCheckIntervalRef.current) {
      clearInterval(progressCheckIntervalRef.current);
    }

    progressCheckIntervalRef.current = setInterval(() => {
      if (playerInstance && !videoEnded && isMountedRef.current) {
        try {
          if (!playerInstance.getDuration || typeof playerInstance.getDuration !== 'function') {
            return;
          }

          const currentTime = playerInstance.getCurrentTime();
          const duration = playerInstance.getDuration();

          if (isNaN(currentTime) || isNaN(duration) || duration <= 0) {
            return;
          }

          if (duration && currentTime >= duration - 1) {
            try {
              const playerState = playerInstance.getPlayerState();
              if (playerState === 0 || currentTime >= duration - 0.5) {
                handleVideoEnd();
                if (progressCheckIntervalRef.current) {
                  clearInterval(progressCheckIntervalRef.current);
                  progressCheckIntervalRef.current = null;
                }
                return;
              }
            } catch {
              if (progressCheckIntervalRef.current) {
                clearInterval(progressCheckIntervalRef.current);
                progressCheckIntervalRef.current = null;
              }
              return;
            }
          }

          try {
            const playerState = playerInstance.getPlayerState();
            if (currentTime === lastProgressRef.current && playerState === 1) {
              lastProgressRef.current = currentTime;
            } else {
              lastProgressRef.current = currentTime;
            }
          } catch {
            return;
          }
        } catch (error) {
          if (progressCheckIntervalRef.current) {
            clearInterval(progressCheckIntervalRef.current);
            progressCheckIntervalRef.current = null;
          }
          if (isMountedRef.current && !error.message?.includes('not attached')) {
            console.debug('Progress check error:', error);
          }
        }
      }
    }, 2000);
  }, [videoEnded, handleVideoEnd]);

  const onPlayerReady = useCallback((event) => {
    startProgressTracking(event.target);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
  }, [startProgressTracking, handleFullscreenChange]);

  const onPlayerStateChange = useCallback((event) => {
    if (event.data === 0) {
      handleVideoEnd();
      if (progressCheckIntervalRef.current) {
        clearInterval(progressCheckIntervalRef.current);
        progressCheckIntervalRef.current = null;
      }
    }
  }, [handleVideoEnd]);

  useEffect(() => {
    const handleError = (event) => {
      const message = event.message || '';
      if (message.includes('postMessage') && message.includes('target origin')) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    window.addEventListener('error', handleError, true);
    return () => window.removeEventListener('error', handleError, true);
  }, []);

  useEffect(() => {
    if (!window.YT) {
      window.onYouTubeIframeAPIReady = () => {};
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    let initTimeout = null;
    let retryTimeout = null;

    if (videoId && !showStartDialog && window.YT && window.YT.Player && !playerInstanceRef.current) {
      const waitForDivAndInit = (attempts = 0) => {
        if (playerInstanceRef.current) return;

        const playerContainer = document.getElementById('youtube-player');

        if (playerContainer && playerContainer.offsetParent !== null) {
          initTimeout = setTimeout(() => {
            if (isMountedRef.current && !playerInstanceRef.current && document.getElementById('youtube-player')) {
              initializePlayer();
            }
          }, 100);
        } else if (attempts < 40) {
          initTimeout = setTimeout(() => {
            if (isMountedRef.current && !playerInstanceRef.current) {
              waitForDivAndInit(attempts + 1);
            }
          }, 50);
        }
      };

      waitForDivAndInit();
    }

    function initializePlayer() {
      if (playerInstanceRef.current) return;

      const playerContainer = document.getElementById('youtube-player');
      if (!playerContainer) return;

      const existingIframe = playerContainer.querySelector('iframe');
      if (existingIframe) {
        try {
          if (playerInstanceRef.current && typeof playerInstanceRef.current.destroy === 'function') {
            playerInstanceRef.current.destroy();
          } else {
            playerContainer.innerHTML = '';
          }
        } catch {
          playerContainer.innerHTML = '';
        }
        playerInstanceRef.current = null;
      }

      try {
        const newPlayer = new window.YT.Player('youtube-player', {
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            playsinline: 1,
          },
          events: {
            onStateChange: onPlayerStateChange,
            onReady: onPlayerReady,
          },
        });
        if (isMountedRef.current && !playerInstanceRef.current) {
          setPlayer(newPlayer);
          playerInstanceRef.current = newPlayer;
        }
      } catch (error) {
        console.error('Error initializing YouTube player:', error);
        if (isMountedRef.current && !playerInstanceRef.current) {
          retryTimeout = setTimeout(() => {
            if (isMountedRef.current && !playerInstanceRef.current && document.getElementById('youtube-player')) {
              try {
                const newPlayer = new window.YT.Player('youtube-player', {
                  videoId: videoId,
                  playerVars: {
                    autoplay: 1,
                    controls: 1,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    playsinline: 1,
                  },
                  events: {
                    onStateChange: onPlayerStateChange,
                    onReady: onPlayerReady,
                  },
                });
                if (isMountedRef.current && !playerInstanceRef.current) {
                  setPlayer(newPlayer);
                  playerInstanceRef.current = newPlayer;
                }
              } catch (retryError) {
                console.error('Retry failed to initialize YouTube player:', retryError);
              }
            }
          }, 500);
        }
      }
    }

    return () => {
      if (initTimeout) clearTimeout(initTimeout);
      if (retryTimeout) clearTimeout(retryTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, showStartDialog]);

  const handleStartVideo = () => {
    setShowStartDialog(false);
  };

  const handleProceedToTest = () => {
    navigate(`/course/${courseId}/test`);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!course || !course.videoUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black bg-[url('https://res.cloudinary.com/dmlk8egiw/image/upload/v1762946281/Group_3646_ptqpn7.png')] bg-cover bg-center md:bg-top bg-no-repeat pt-24">
        <div className="relative z-10 max-w-md mx-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl p-12 text-center">
            <div className="bg-red-500/20 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center border border-red-500/50">
              <AlertCircle className="h-10 w-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Video Not Available</h2>
            <p className="text-white/70 mb-6">This course doesn't have a video yet.</p>
            <Button
              onClick={() => navigate(`/course/${courseId}`)}
              className="bg-[#F58120] hover:bg-[#F58120]/90 text-white"
            >
              Back to Course
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black bg-[url('https://res.cloudinary.com/dmlk8egiw/image/upload/v1762946281/Group_3646_ptqpn7.png')] bg-cover bg-center md:bg-top bg-no-repeat flex items-center justify-center pt-24 pb-12">
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl max-w-md text-white [&>button]:text-white [&>button]:hover:text-white [&>button]:opacity-100 hover:[&>button]:opacity-100 [&>button]:hover:bg-white/10 [&>button]:rounded-full [&>button]:p-1">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-white">
              📹 Course Video
            </DialogTitle>
            <DialogDescription className="sr-only">
              Watch the complete video to unlock the test
            </DialogDescription>
          </DialogHeader>
          <div className="text-center space-y-4 pt-4">
            <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
              <p className="text-white font-semibold">
                Watch the complete video to unlock the test!
              </p>
            </div>
            <div className="space-y-2 text-left text-sm text-white/80">
              <p className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-[#F58120] flex-shrink-0 mt-0.5" />
                <span>You must watch the full video</span>
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-[#F58120] flex-shrink-0 mt-0.5" />
                <span>After completion, the test will be available</span>
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-[#F58120] flex-shrink-0 mt-0.5" />
                <span>Complete the test to earn your certificate</span>
              </p>
            </div>
          </div>
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleStartVideo}
              className="bg-[#F58120] hover:bg-[#F58120]/90 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start Watching Video
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl max-w-md text-white z-[9999] [&>button]:text-white [&>button]:hover:text-white [&>button]:opacity-100 hover:[&>button]:opacity-100 [&>button]:hover:bg-white/10 [&>button]:rounded-full [&>button]:p-1">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-white">
              🎉 Video Complete!
            </DialogTitle>
            <DialogDescription className="sr-only">
              Video completed successfully. Now take the test.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center space-y-4 pt-4">
            <div className="p-4 bg-green-500/20 backdrop-blur-sm border border-green-500/50 rounded-lg">
              <p className="text-white font-semibold">
                Great job! You&apos;ve completed the video.
              </p>
            </div>
            <p className="text-white font-medium">Now it&apos;s time to test your knowledge!</p>
            <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-left text-sm">
              <p className="font-semibold text-white mb-2">Test Information:</p>
              <ul className="space-y-1 text-white/80">
                <li>• {course?.testQuestions?.length || 0} Questions</li>
                <li>• {course?.testTimeLimit || 20} Minutes Time Limit</li>
                <li>• Passing Score: 60%</li>
                <li>• You can retake until you pass</li>
              </ul>
            </div>
          </div>
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleProceedToTest}
              className="bg-[#F58120] hover:bg-[#F58120]/90 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start Test Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {!showStartDialog && (
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-8">
          <div className="relative w-full bg-black rounded-lg overflow-hidden shadow-2xl" style={{ paddingBottom: '56.25%', minHeight: '400px' }}>
            <div
              id="youtube-player"
              ref={playerRef}
              className="absolute top-0 left-0 w-full h-full"
              style={{ width: '100%', height: '100%', minHeight: '360px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
