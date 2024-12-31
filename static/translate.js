const languageSelector = document.getElementById('languageSelector');
const startTranslationButton = document.getElementById('startTranslation');
const translateNowButton = document.getElementById('translateNow');
const originalText = document.getElementById('originalText').querySelector('span');
const translatedText = document.getElementById('translatedText').querySelector('span');

let targetLanguage = "en"; // Default language

// Update target language
languageSelector.addEventListener('change', (event) => {
    targetLanguage = event.target.value;
    console.log("Target language set to:", targetLanguage);
});

// Live Translation
startTranslationButton.addEventListener('click', () => {
    socket.emit('start_translation', { language: targetLanguage });
    console.log("Start Live Translation button clicked");
});

// Display live translation results
socket.on('translation', (data) => {
    console.log("Translation result received:", data);
    originalText.textContent = data.original || "No speech detected";
    translatedText.textContent = data.translated || "No translation available";
});

// Handle Translate Now button
translateNowButton.addEventListener('click', () => {
    socket.emit('translate_now', { language: targetLanguage });
    console.log("Translate Now button clicked");
});

// Display status updates
socket.on('status', (data) => {
    console.log("Status:", data.message);
});
