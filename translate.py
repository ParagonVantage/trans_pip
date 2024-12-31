from deep_translator import GoogleTranslator

def translate_text(text, target_language):
    return GoogleTranslator(source='en', target=target_language).translate(text)
