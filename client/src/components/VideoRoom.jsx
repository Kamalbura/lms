import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import axios from 'axios';
import { toast } from 'react-toastify';

const VideoRoom = ({ roomId, onError }) => {
  const { user } = useSelector(state => state.auth);
  const [peers, setPeers] = useState([]);
  const [stream, setStream] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState('good');
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);
  const recordingTimer = useRef(null);
  const screenStream = useRef(null);
  
  const socketRef = useRef();
  const userVideo = useRef();
  const peersRef = useRef([]);

  useEffect(() => {
    // Connect to WebRTC signaling server
    socketRef.current = io(process.env.REACT_APP_API_URL, {
      path: '/webrtc',
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    // Get media stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setStream(stream);
        userVideo.current.srcObject = stream;

        // Join room
        socketRef.current.emit('join-room', {
          roomId,
          userId: user._id,
          userType: user.role
        });

        // Setup stream error handling
        stream.getTracks().forEach(track => {
          track.onended = () => {
            toast.error(`${track.kind} device has been disconnected.`);
            if (track.kind === 'video') {
              setVideoEnabled(false);
            } else if (track.kind === 'audio') {
              setAudioEnabled(false);
            }
          };
          
          track.onmute = () => {
            toast.warning(`Your ${track.kind} is muted.`);
            if (track.kind === 'video') {
              setVideoEnabled(false);
            } else if (track.kind === 'audio') {
              setAudioEnabled(false);
            }
          };
          
          track.onunmute = () => {
            toast.info(`Your ${track.kind} is available again.`);
            if (track.kind === 'video') {
              setVideoEnabled(true);
            } else if (track.kind === 'audio') {
              setAudioEnabled(true);
            }
          };
        });

        // Handle socket reconnection
        socketRef.current.on('reconnect', (attemptNumber) => {
          console.log(`Reconnected to signaling server after ${attemptNumber} attempts`);
          toast.success('Reconnected to video session!');
          
          // Re-join room on reconnection
          socketRef.current.emit('join-room', {
            roomId,
            userId: user._id,
            userType: user.role
          });
        });

        socketRef.current.on('reconnecting', (attemptNumber) => {
          console.log(`Attempting to reconnect... (${attemptNumber})`);
          toast.warning('Connection lost. Attempting to reconnect...', {
            autoClose: false,
            toastId: 'reconnecting'
          });
        });

        socketRef.current.on('reconnect_error', (error) => {
          console.error('Reconnection error:', error);
          toast.error('Failed to reconnect. Please refresh the page.');
        });

        socketRef.current.on('reconnect_failed', () => {
          console.error('Failed to reconnect after all attempts');
          toast.error('Connection lost. Please refresh the page to rejoin.', {
            autoClose: false
          });
        });

        // Listen for other users in room
        socketRef.current.on('room-users', users => {
          const peers = [];
          users.forEach(user => {
            const peer = createPeer(user.socketId, socketRef.current.id, stream);
            peersRef.current.push({
              peerId: user.socketId,
              peer,
              userId: user.userId
            });
            peers.push({
              peerId: user.socketId,
              userId: user.userId,
              peer
            });
          });
          setPeers(peers);
        });

        // Handle new user joining
        socketRef.current.on('user-joined', payload => {
          const peer = addPeer(payload.signal, payload.socketId, stream);
          peersRef.current.push({
            peerId: payload.socketId,
            peer,
            userId: payload.userId
          });
          setPeers(peers => [...peers, {
            peerId: payload.socketId,
            userId: payload.userId,
            peer
          }]);
        });

        // Handle incoming signals
        socketRef.current.on('signal', payload => {
          const item = peersRef.current.find(p => p.peerId === payload.from);
          if (item) {
            item.peer.signal(payload.signal);
          }
        });

        // Handle ICE candidates
        socketRef.current.on('ice-candidate', ({ candidate }) => {
          peers.forEach(({ peer }) => {
            peer.addIceCandidate(new RTCIceCandidate(candidate));
          });
        });

        // Handle user leaving
        socketRef.current.on('user-left', ({ socketId }) => {
          const peerObj = peersRef.current.find(p => p.peerId === socketId);
          if (peerObj) {
            peerObj.peer.destroy();
            peersRef.current = peersRef.current.filter(p => p.peerId !== socketId);
            setPeers(peers => peers.filter(p => p.peerId !== socketId));
          }
        });
      })
      .catch(err => {
        console.error('Failed to get media devices:', err);
        onError && onError(err.message);
      });

    return () => {
      // Cleanup
      socketRef.current?.disconnect();
      peers.forEach(({ peer }) => peer.destroy());
      stream?.getTracks().forEach(track => track.stop());
      if (screenStream.current) {
        screenStream.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [roomId, user._id]);

  // Add periodic connection quality monitoring
  useEffect(() => {
    if (!stream || peers.length === 0) return;
    
    // Function to collect WebRTC stats
    const collectStats = async () => {
      try {
        // Monitor the first peer connection for simplicity
        const peerObj = peersRef.current[0];
        if (!peerObj || !peerObj.peer) return;
        
        const stats = await peerObj.peer._pc.getStats();
        let rtt = 0;
        let packetLoss = 0;
        let bitrate = 0;
        let framesDecoded = 0;
        
        stats.forEach(report => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            rtt = report.currentRoundTripTime * 1000; // Convert to ms
          }
          if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
            packetLoss = report.packetsLost;
            framesDecoded = report.framesDecoded;
            
            // Calculate bitrate
            if (report.bytesReceived && report.timestamp && window.lastReport) {
              const bytesNow = report.bytesReceived;
              const bytesLast = window.lastReport.bytesReceived || 0;
              const timeNow = report.timestamp;
              const timeLast = window.lastReport.timestamp || timeNow;
              
              const timeDiff = timeNow - timeLast;
              if (timeDiff > 0) {
                bitrate = 8 * (bytesNow - bytesLast) / timeDiff; // bits per second
              }
            }
            
            // Store last report for comparison
            window.lastReport = report;
          }
        });
        
        // Determine quality based on metrics
        let quality = 'good';
        
        if (rtt > 500 || packetLoss > 5) {
          quality = 'critical';
        } else if (rtt > 300 || packetLoss > 2) {
          quality = 'poor';
        } else if (rtt > 100) {
          quality = 'medium';
        }
        
        // Update connection quality state and adapt video settings
        if (quality !== connectionQuality) {
          handleQualityChange(quality);
          
          // Log metrics
          console.log(`Connection metrics - RTT: ${Math.round(rtt)}ms, Packet Loss: ${packetLoss}, Bitrate: ${Math.round(bitrate/1000)}kbps`);
        }
      } catch (error) {
        console.error('Error collecting WebRTC stats:', error);
      }
    };
    
    // Collect stats every 5 seconds
    const statsInterval = setInterval(collectStats, 5000);
    
    return () => clearInterval(statsInterval);
  }, [stream, peers.length, connectionQuality]);

  function createPeer(userToSignal, callerId, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', signal => {
      socketRef.current.emit('signal', {
        userToSignal,
        callerId,
        signal
      });
    });

    return peer;
  }

  function addPeer(incomingSignal, callerId, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', signal => {
      socketRef.current.emit('signal', {
        userToSignal: callerId,
        callerId: socketRef.current.id,
        signal
      });
    });

    peer.signal(incomingSignal);
    return peer;
  }

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = !audioEnabled;
      setAudioEnabled(!audioEnabled);
      socketRef.current.emit('stream-control', {
        roomId,
        action: 'toggleAudio',
        userId: user._id
      });
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = !videoEnabled;
      setVideoEnabled(!videoEnabled);
      socketRef.current.emit('stream-control', {
        roomId,
        action: 'toggleVideo',
        userId: user._id
      });
    }
  };

  const handleShareScreen = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        screenStream.current.getTracks().forEach(track => track.stop());
        screenStream.current = null;
        
        // Revert to camera video
        peers.forEach(({ peer }) => {
          const sender = peer.getSenders().find(s => s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(stream.getVideoTracks()[0]);
          }
        });
        
        setIsScreenSharing(false);
      } else {
        // Start screen sharing
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: "always",
            displaySurface: "browser",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          }
        });
        
        screenStream.current = displayStream;
        const videoTrack = displayStream.getVideoTracks()[0];
        
        // Handle when user stops sharing via browser UI
        videoTrack.onended = () => {
          peers.forEach(({ peer }) => {
            const sender = peer.getSenders().find(s => s.track.kind === 'video');
            if (sender) {
              sender.replaceTrack(stream.getVideoTracks()[0]);
            }
          });
          setIsScreenSharing(false);
        };

        // Replace video track for all peers
        peers.forEach(({ peer }) => {
          const sender = peer.getSenders().find(s => s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });
        
        setIsScreenSharing(true);
      }
    } catch (err) {
      console.error('Error sharing screen:', err);
      onError && onError('Failed to share screen');
    }
  };

  const startRecording = () => {
    if (!stream) return;

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    recordedChunks.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordedChunks.current, {
        type: 'video/webm'
      });

      // Create form data for upload
      const formData = new FormData();
      formData.append('recording', blob);
      formData.append('officeHourId', roomId);
      formData.append('duration', recordingTime);

      try {
        await axios.post('/api/office-hours/recording', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('Recording saved successfully');
      } catch (error) {
        console.error('Error saving recording:', error);
        toast.error('Failed to save recording');
      }
    };

    mediaRecorder.start(1000);
    setIsRecording(true);
    
    // Start timer
    recordingTimer.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimer.current);
      setRecordingTime(0);
    }
  };

  useEffect(() => {
    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (screenStream.current) {
        screenStream.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleQualityChange = (quality) => {
    setConnectionQuality(quality);
    
    // Adapt video quality based on connection
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        let constraints = {};
        
        switch (quality) {
          case 'critical':
            constraints = {
              width: { ideal: 320 },
              height: { ideal: 240 },
              frameRate: { max: 15 }
            };
            break;
          case 'poor':
            constraints = {
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { max: 20 }
            };
            break;
          case 'medium':
            constraints = {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { max: 30 }
            };
            break;
          default: // good
            constraints = {
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { max: 30 }
            };
        }

        videoTrack.applyConstraints(constraints)
          .catch(err => console.error('Error applying video constraints:', err));
      }
    }

    // Notify peers of quality change
    socketRef.current?.emit('connection:quality', {
      roomId,
      userId: user._id,
      status: quality
    });
  };

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on('connection:quality:update', ({ userId, status }) => {
        // Update UI to show peer's connection quality
        console.log(`Peer ${userId} connection quality: ${status}`);
      });
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 flex-grow">
        <div className="relative">
          <video
            ref={userVideo}
            muted
            autoPlay
            playsInline
            className="w-full h-full object-cover rounded-lg"
          />
          <div className="absolute bottom-2 left-2 bg-gray-900 bg-opacity-75 px-2 py-1 rounded text-white text-sm">
            You {!audioEnabled && '(muted)'}
          </div>
          <div className="absolute top-2 right-2">
            <ConnectionStatus
              peerConnection={peersRef.current[0]?.peer}
              onQualityChange={handleQualityChange}
            />
          </div>
        </div>
        {peers.map(({ peerId, userId, peer }) => (
          <div key={peerId} className="relative">
            <Video peer={peer} userId={userId} />
            <div className="absolute top-2 right-2">
              <ConnectionStatus
                peerConnection={peer}
                onQualityChange={(quality) => {
                  console.log(`Peer ${userId} quality: ${quality}`);
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-center items-center gap-4 p-4 bg-gray-100">
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full ${audioEnabled ? 'bg-blue-500' : 'bg-red-500'} text-white`}
          title={audioEnabled ? 'Mute audio' : 'Unmute audio'}
        >
          <i className={`fas fa-microphone${!audioEnabled ? '-slash' : ''}`} />
        </button>
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full ${videoEnabled ? 'bg-blue-500' : 'bg-red-500'} text-white`}
          title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          <i className={`fas fa-video${!videoEnabled ? '-slash' : ''}`} />
        </button>
        <button
          onClick={handleShareScreen}
          className={`p-3 rounded-full ${isScreenSharing ? 'bg-green-500' : 'bg-blue-500'} text-white`}
          title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
        >
          <i className={`fas fa-${isScreenSharing ? 'stop' : 'desktop'}`} />
        </button>
        
        {user.role === 'instructor' && (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-3 rounded-full ${isRecording ? 'bg-red-500' : 'bg-blue-500'} text-white`}
            title={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <i className={`fas fa-${isRecording ? 'stop' : 'record-vinyl'}`} />
          </button>
        )}

        {isRecording && (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full animate-pulse">
            Recording {formatTime(recordingTime)}
          </span>
        )}

        <div className="ml-4">
          <span className={`px-3 py-1 rounded-full text-white text-sm ${
            connectionQuality === 'good' ? 'bg-green-500' :
            connectionQuality === 'medium' ? 'bg-yellow-500' :
            connectionQuality === 'poor' ? 'bg-orange-500' : 'bg-red-500'
          }`}>
            {connectionQuality.charAt(0).toUpperCase() + connectionQuality.slice(1)}
          </span>
        </div>
      </div>
    </div>
  );
};

const Video = ({ peer, userId }) => {
  const ref = useRef();

  useEffect(() => {
    peer.on('stream', stream => {
      ref.current.srcObject = stream;
    });
  }, [peer]);

  return (
    <div className="relative">
      <video
        ref={ref}
        autoPlay
        playsInline
        className="w-full h-full object-cover rounded-lg"
      />
      <div className="absolute bottom-2 left-2 bg-gray-900 bg-opacity-75 px-2 py-1 rounded text-white text-sm">
        {userId}
      </div>
    </div>
  );
};

const ConnectionStatus = ({ peerConnection, onQualityChange }) => {
  useEffect(() => {
    if (peerConnection) {
      // Simulate quality change for demonstration purposes
      const qualities = ['good', 'medium', 'poor', 'critical'];
      let index = 0;
      const interval = setInterval(() => {
        onQualityChange(qualities[index]);
        index = (index + 1) % qualities.length;
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [peerConnection, onQualityChange]);

  return null;
};

export default VideoRoom;