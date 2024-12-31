const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const messages = document.getElementById('messages');

let typingTimeout;

// Typing Indicator
chatInput.addEventListener('keypress', (event) => {
    if (event.key !== 'Enter') {
        socket.emit('typing');
    }
});

socket.on('typing', () => {
    const typingIndicator = document.createElement('p');
    typingIndicator.textContent = "Peer is typing...";
    typingIndicator.style.color = "gray";
    typingIndicator.style.fontStyle = "italic";
    messages.appendChild(typingIndicator);

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        typingIndicator.remove();
    }, 1000);
});

// Chat
sendButton.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});

function sendMessage() {
    const message = chatInput.value;
    if (message.trim()) {
        socket.emit('chat', { message });
        chatInput.value = '';
        addMessage(`You: ${message}`);
    }
}

socket.on('chat', (data) => {
    const { message, sender, translatedMessage, sentiment } = data;

    if (sender === socket.id) return; // Ignore self messages

    const sentimentDisplay = sentiment ? ` (${sentiment})` : "";
    addMessage(`Peer: ${translatedMessage || message}${sentimentDisplay}`);
});


function addMessage(msg) {
    const msgDiv = document.createElement('div');
    const timestamp = new Date().toLocaleTimeString();
    msgDiv.textContent = `[${timestamp}] ${msg}`;
    messages.appendChild(msgDiv);
    messages.scrollTop = messages.scrollHeight;
}
