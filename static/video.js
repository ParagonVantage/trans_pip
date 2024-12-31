const socket = io();
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startCallButton = document.getElementById('startCall');
const toggleVideoButton = document.getElementById('toggleVideo');
const switchCameraButton = document.getElementById('switchCamera');

let localStream;
let peerConnection;
const config = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

// Start Call
startCallButton.addEventListener('click', async () => {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;

        peerConnection = new RTCPeerConnection(config);

        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        peerConnection.ontrack = (event) => {
            if (!remoteVideo.srcObject) {
                remoteVideo.srcObject = event.streams[0];
            }
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', event.candidate);
            }
        };

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', offer);
    } catch (error) {
        console.error("Error during call setup:", error);
    }
});

// Toggle Video
toggleVideoButton.addEventListener('click', () => {
    localStream.getVideoTracks().forEach(track => (track.enabled = !track.enabled));
});

// Switch Camera
switchCameraButton.addEventListener('click', async () => {
    try {
        const facingMode = toggleVideoButton.textContent === 'Turn Off Video' ? 'environment' : 'user';
        const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: true });
        const videoTrack = newStream.getVideoTracks()[0];
        const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
        localVideo.srcObject = newStream;
    } catch (error) {
        console.error("Error switching camera:", error);
    }
});
const shareScreenButton = document.getElementById('shareScreen');

let screenStream = null;

// Handle Screen Sharing
shareScreenButton.addEventListener('click', async () => {
    try {
        // Get the screen stream
        screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace video track in PeerConnection
        const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
        if (sender) {
            sender.replaceTrack(screenTrack);
        }

        // Display the shared screen locally
        localVideo.srcObject = screenStream;

        // Handle screen stop event
        screenTrack.onended = () => {
            stopScreenSharing();
        };

        console.log("Screen sharing started");
    } catch (error) {
        console.error("Error sharing screen:", error);
    }
});

// Stop Screen Sharing
function stopScreenSharing() {
    if (screenStream) {
        // Stop all tracks in the screen stream
        screenStream.getTracks().forEach(track => track.stop());
        screenStream = null;

        // Revert back to the camera stream
        const videoTrack = localStream.getVideoTracks()[0];
        const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
        if (sender) {
            sender.replaceTrack(videoTrack);
        }

        // Restore local camera stream display
        localVideo.srcObject = localStream;

        console.log("Screen sharing stopped");
    }
}
const startRecordingButton = document.getElementById('startRecording');
const stopRecordingButton = document.getElementById('stopRecording');

let mediaRecorder = null;
let recordedChunks = [];

// Start Recording
startRecordingButton.addEventListener('click', () => {
    if (localStream) {
        // Initialize MediaRecorder with the local stream
        mediaRecorder = new MediaRecorder(localStream);
        recordedChunks = [];

        // Capture recorded data
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        // Handle recording stop
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);

            // Create a download link for the recording
            const a = document.createElement('a');
            a.href = url;
            a.download = 'recording.webm';
            a.textContent = 'Download Recording';
            a.style.display = 'block';
            document.body.appendChild(a);

            console.log("Recording stopped and saved");
        };

        // Start recording
        mediaRecorder.start();
        console.log("Recording started");

        // Toggle buttons
        startRecordingButton.style.display = 'none';
        stopRecordingButton.style.display = 'inline';
    } else {
        console.error("No stream available for recording");
    }
});

// Stop Recording
stopRecordingButton.addEventListener('click', () => {
    if (mediaRecorder) {
        mediaRecorder.stop(); // Stop the recording
        console.log("Recording stopped");

        // Toggle buttons
        stopRecordingButton.style.display = 'none';
        startRecordingButton.style.display = 'inline';
    }
});
const recordingIndicator = document.getElementById('recordingIndicator');

// Start Recording
startRecordingButton.addEventListener('click', () => {
    if (localStream) {
        mediaRecorder = new MediaRecorder(localStream);
        recordedChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'recording.webm';
            a.textContent = 'Download Recording';
            a.style.display = 'block';
            document.body.appendChild(a);

            console.log("Recording stopped and saved");
        };

        mediaRecorder.start();
        console.log("Recording started");

        // Show the recording indicator
        recordingIndicator.style.display = 'inline';

        // Toggle buttons
        startRecordingButton.style.display = 'none';
        stopRecordingButton.style.display = 'inline';
    } else {
        console.error("No stream available for recording");
    }
});

// Stop Recording
stopRecordingButton.addEventListener('click', () => {
    if (mediaRecorder) {
        mediaRecorder.stop();
        console.log("Recording stopped");

        // Hide the recording indicator
        recordingIndicator.style.display = 'none';

        // Toggle buttons
        stopRecordingButton.style.display = 'none';
        startRecordingButton.style.display = 'inline';
    }
});
