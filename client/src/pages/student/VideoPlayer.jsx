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
    // Prevent multiple calls
    if (videoEnded || !isMountedRef.current) return;
    
    // Use startTransition for state updates to prevent rendering errors
    startTransition(() => {
      setVideoEnded(true);
    });
    
    // Check if we're in fullscreen mode
    const isFullscreen = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
    
    // Exit fullscreen if in fullscreen mode (helps dialog appear on mobile)
    let fullscreenExited = !isFullscreen;
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
        fullscreenExited = true;
      } catch (error) {
        console.debug('Fullscreen exit error:', error);
        // Continue anyway - show dialog even if fullscreen exit fails
        fullscreenExited = true;
      }
    }
    
    // Clear any existing timeouts
    if (dialogTimeoutRef.current) {
      clearTimeout(dialogTimeoutRef.current);
      dialogTimeoutRef.current = null;
    }
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
    
    // Show dialog - use longer delay if we were in fullscreen, shorter if not
    const delay = isFullscreen ? 500 : 100;
    
    // Helper function to safely set dialog state
    const showDialogSafely = () => {
      if (isMountedRef.current) {
        startTransition(() => {
          setShowCompleteDialog(true);
        });
      }
    };
    
    // Fallback: Show dialog immediately if not in fullscreen
    if (!isFullscreen) {
      showDialogSafely();
    } else {
      // In fullscreen, wait for exit to complete
      dialogTimeoutRef.current = setTimeout(() => {
        showDialogSafely();
        // Clear fallback if dialog shows early
        if (fallbackTimeoutRef.current) {
          clearTimeout(fallbackTimeoutRef.current);
          fallbackTimeoutRef.current = null;
        }
      }, delay);
      
      // Fallback: Show dialog after max 1 second even if fullscreen exit fails
      fallbackTimeoutRef.current = setTimeout(() => {
        showDialogSafely();
      }, 1000);
    }
    
    // Mark video as watched (don't wait for this to show dialog)
    markVideoWatched(courseId).catch((error) => {
      // Only log if component is still mounted
      if (isMountedRef.current) {
        console.error('Failed to mark video as watched:', error);
      }
    });
  }, [videoEnded, courseId, markVideoWatched]);

  const checkVideoCompletion = useCallback(() => {
    if (player && !videoEnded && isMountedRef.current) {
      try {
        // Check if player is ready and attached to DOM
        if (!player.getDuration || typeof player.getDuration !== 'function') {
          return; // Player not ready yet
        }
        
        const playerState = player.getPlayerState();
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();
        
        // Validate values
        if (isNaN(currentTime) || isNaN(duration) || duration <= 0) {
          return; // Invalid values, player might not be ready
        }
        
        // YT.PlayerState.ENDED = 0
        if (playerState === 0 || (duration && currentTime >= duration - 0.5)) {
          handleVideoEnd();
        }
      } catch (error) {
        // Ignore errors about player not attached - it's normal during cleanup
        if (isMountedRef.current && !error.message?.includes('not attached')) {
          console.debug('Completion check error:', error);
        }
      }
    }
  }, [player, videoEnded, handleVideoEnd]);

  const handleFullscreenChange = useCallback(() => {
    // When exiting fullscreen, check if video ended
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
    // Clear any existing interval
    if (progressCheckIntervalRef.current) {
      clearInterval(progressCheckIntervalRef.current);
    }

    // Check video progress every 2 seconds
    // This helps detect completion even when events don't fire in fullscreen
    progressCheckIntervalRef.current = setInterval(() => {
      if (playerInstance && !videoEnded && isMountedRef.current) {
        try {
          // Check if player is ready and attached to DOM
          if (!playerInstance.getDuration || typeof playerInstance.getDuration !== 'function') {
            return; // Player not ready yet
          }
          
          const currentTime = playerInstance.getCurrentTime();
          const duration = playerInstance.getDuration();
          
          // Validate values
          if (isNaN(currentTime) || isNaN(duration) || duration <= 0) {
            return; // Invalid values, player might not be ready
          }
          
          // If video is at or near the end (within 1 second)
          if (duration && currentTime >= duration - 1) {
            // Double check the player state
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
            } catch (err) {
              // Player might be destroyed, just clear interval
              if (progressCheckIntervalRef.current) {
                clearInterval(progressCheckIntervalRef.current);
                progressCheckIntervalRef.current = null;
              }
              return;
            }
          }
          
          // Detect if video is stuck (progress hasn't changed but should have)
          try {
            const playerState = playerInstance.getPlayerState();
            if (currentTime === lastProgressRef.current && playerState === 1) {
              // Video is playing but time isn't advancing - might be an issue
              // Reset last progress
              lastProgressRef.current = currentTime;
            } else {
              lastProgressRef.current = currentTime;
            }
          } catch (err) {
            // Player might be destroyed, ignore
            return;
          }
        } catch (error) {
          // Player might not be ready or destroyed, clear interval and stop tracking
          if (progressCheckIntervalRef.current) {
            clearInterval(progressCheckIntervalRef.current);
            progressCheckIntervalRef.current = null;
          }
          // Don't log if component unmounted
          if (isMountedRef.current && !error.message?.includes('not attached')) {
            console.debug('Progress check error:', error);
          }
        }
      }
    }, 2000);
  }, [videoEnded, handleVideoEnd]);

  const onPlayerReady = useCallback((event) => {
    console.log('YouTube player ready:', event);
    // Start progress tracking for mobile fullscreen compatibility
    startProgressTracking(event.target);
    
    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
  }, [startProgressTracking, handleFullscreenChange]);

  const onPlayerStateChange = useCallback((event) => {
    // YT.PlayerState.ENDED = 0
    if (event.data === 0) {
      handleVideoEnd();
      // Clear progress tracking when video ends
      if (progressCheckIntervalRef.current) {
        clearInterval(progressCheckIntervalRef.current);
        progressCheckIntervalRef.current = null;
      }
    }
  }, [handleVideoEnd]);

  // Suppress harmless warnings (postMessage origin warnings and permissions policy warnings)
  // Note: We're suppressing at the source level, not overriding console to avoid interfering with React
  useEffect(() => {
    // Suppress warnings by listening to errors and preventing default behavior
    const handleError = (event) => {
      const message = event.message || '';
      if (message.includes('postMessage') && message.includes('target origin')) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };
    
    window.addEventListener('error', handleError, true);
    
    return () => {
      window.removeEventListener('error', handleError, true);
    };
  }, []);

  // Load YouTube iframe API
  useEffect(() => {
    if (!window.YT) {
      // Ensure we wait for the API to load before initializing
      window.onYouTubeIframeAPIReady = () => {
        // This callback is called when the YouTube iframe API is ready
        // Player initialization happens in the other useEffect
      };
      
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Initialize YouTube player when dialog is closed
  useEffect(() => {
    isMountedRef.current = true;
    let initTimeout = null;
    let retryTimeout = null;
    
    // Only initialize player when:
    // 1. Video ID exists
    // 2. Start dialog is closed (video div is rendered)
    // 3. YouTube API is loaded
    // 4. Player doesn't already exist
    if (videoId && !showStartDialog && window.YT && window.YT.Player && !playerInstanceRef.current) {
      console.log('Conditions met for player initialization:', {
        videoId,
        showStartDialog,
        hasYT: !!window.YT,
        hasPlayer: !!window.YT.Player,
        existingPlayer: !!playerInstanceRef.current
      });
      
      // Function to wait for div to exist and then initialize
      const waitForDivAndInit = (attempts = 0) => {
        // Check if player already exists (prevent re-initialization)
        if (playerInstanceRef.current) {
          console.log('Player already exists, skipping initialization');
          return;
        }
        
        const playerContainer = document.getElementById('youtube-player');
        
        console.log(`Attempt ${attempts}: Player container check:`, {
          exists: !!playerContainer,
          offsetParent: playerContainer?.offsetParent,
          clientWidth: playerContainer?.clientWidth,
          clientHeight: playerContainer?.clientHeight
        });
        
        if (playerContainer && playerContainer.offsetParent !== null) {
          // Div exists and is visible, initialize player
          console.log('Player container found, initializing...');
          
          // Double-check player doesn't exist
          if (playerInstanceRef.current) {
            console.log('Player already exists, skipping initialization');
            return;
          }
          
          // Small delay to ensure DOM is fully updated
          initTimeout = setTimeout(() => {
            // Triple-check player doesn't exist before initializing
            if (isMountedRef.current && !playerInstanceRef.current && document.getElementById('youtube-player')) {
              initializePlayer();
            }
          }, 100);
        } else if (attempts < 40) {
          // Div doesn't exist yet, wait and retry (up to 40 times = 2 seconds)
          initTimeout = setTimeout(() => {
            if (isMountedRef.current && !playerInstanceRef.current) {
              waitForDivAndInit(attempts + 1);
            }
          }, 50);
        } else {
          console.error('YouTube player container not found after multiple attempts');
        }
      };
      
      // Start waiting for div
      waitForDivAndInit();
    } else {
      if (playerInstanceRef.current) {
        console.log('Player initialization skipped - player already exists');
      } else {
        console.log('Player initialization skipped:', {
          videoId: !!videoId,
          showStartDialog,
          hasYT: !!window.YT,
          hasPlayer: !!(window.YT && window.YT.Player),
          existingPlayer: !!playerInstanceRef.current
        });
      }
    }

    function initializePlayer() {
      // Prevent multiple initializations
      if (playerInstanceRef.current) {
        console.log('Player already exists, aborting initialization');
        return;
      }
      
      const playerContainer = document.getElementById('youtube-player');
      if (!playerContainer) {
        console.error('Player container not found when trying to initialize');
        return;
      }
      
      // Check if container already has a YouTube iframe (might have been created by previous attempt)
      const existingIframe = playerContainer.querySelector('iframe');
      if (existingIframe) {
        console.log('Container already has an iframe, destroying it first');
        try {
          if (playerInstanceRef.current && typeof playerInstanceRef.current.destroy === 'function') {
            playerInstanceRef.current.destroy();
          } else {
            // Manually remove iframe if player instance doesn't exist
            playerContainer.innerHTML = '';
          }
        } catch (error) {
          console.error('Error cleaning up existing player:', error);
          playerContainer.innerHTML = '';
        }
        playerInstanceRef.current = null;
      }
      
      try {
        console.log('Creating YouTube player with videoId:', videoId);
        const newPlayer = new window.YT.Player('youtube-player', {
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            playsinline: 1, // Important for mobile fullscreen handling
          },
          events: {
            onStateChange: onPlayerStateChange,
            onReady: onPlayerReady,
          },
        });
        console.log('YouTube player created successfully');
        if (isMountedRef.current && !playerInstanceRef.current) {
          setPlayer(newPlayer);
          playerInstanceRef.current = newPlayer;
        }
      } catch (error) {
        console.error('Error initializing YouTube player:', error);
        // Retry after a short delay if initialization fails
        if (isMountedRef.current && !playerInstanceRef.current) {
          retryTimeout = setTimeout(() => {
            if (isMountedRef.current && !playerInstanceRef.current && document.getElementById('youtube-player')) {
              try {
                console.log('Retrying player initialization...');
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
                console.log('YouTube player created successfully on retry');
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

    // Cleanup function
    return () => {
      // Clear initialization timeouts
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
    // Only depend on videoId and showStartDialog to prevent infinite loops
    // The callbacks are stable via useCallback, but we don't want to re-initialize if they change
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
      {/* Start Dialog */}
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

            <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
              <p className="text-white/90 text-sm">
                <strong className="text-white">Note:</strong> Please pay attention to the video content as it will help you in the test!
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

      {/* Complete Dialog */}
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
                Great job! You've completed the video.
              </p>
            </div>
            
            <div className="space-y-2 text-white/80">
              <p className="text-white font-medium">Now it's time to test your knowledge!</p>
              <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-left text-sm">
                <p className="font-semibold text-white mb-2">Test Information:</p>
                <ul className="space-y-1 text-white/80">
                  <li>• {course.testQuestions?.length || 0} Questions</li>
                  <li>• {course.testTimeLimit || 20} Minutes Time Limit</li>
                  <li>• Passing Score: 60%</li>
                  <li>• You can retake until you pass</li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
              <p className="text-white/90 text-sm">
                <strong className="text-white">Important:</strong> Once you start the test, don't switch tabs or go back. The test will restart if you do!
              </p>
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

      {/* Video Player */}
      {!showStartDialog && (
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-8">
          <div className="relative w-full bg-black rounded-lg overflow-hidden shadow-2xl" style={{ paddingBottom: '56.25%', minHeight: '400px' }}>
            <div 
              id="youtube-player" 
              ref={playerRef} 
              className="absolute top-0 left-0 w-full h-full"
              style={{ width: '100%', height: '100%', minHeight: '360px' }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;

