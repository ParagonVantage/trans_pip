const muteAudioButton = document.getElementById('muteAudio');
const unmuteAudioButton = document.getElementById('unmuteAudio');

// Mute Audio
muteAudioButton.addEventListener('click', () => {
    localStream.getAudioTracks().forEach(track => (track.enabled = false));
    muteAudioButton.style.display = 'none';
    unmuteAudioButton.style.display = 'inline';
});

// Unmute Audio
unmuteAudioButton.addEventListener('click', () => {
    localStream.getAudioTracks().forEach(track => (track.enabled = true));
    unmuteAudioButton.style.display = 'none';
    muteAudioButton.style.display = 'inline';
});
