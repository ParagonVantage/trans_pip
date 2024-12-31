const languageSelector = document.getElementById('languageSelector');
const startTranslationButton = document.getElementById('startTranslation');
let targetLanguage = "en"; // Default language

// Update target language
languageSelector.addEventListener('change', (event) => {
    targetLanguage = event.target.value;
    console.log("Target language set to:", targetLanguage);
});

// Live Translation
startTranslationButton.addEventListener('click', () => {
    socket.emit('start_translation', { language: targetLanguage });
});

socket.on('translation', (data) => {
    addMessage(`Translated: ${data.translated}`);
    console.log("Original:", data.original);
    console.log("Translated:", data.translated);
});
