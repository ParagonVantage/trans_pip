import speech_recognition as sr
from flask_socketio import emit
from deep_translator import GoogleTranslator

def speech_to_text_and_translate(language='en'):
    """Perform speech-to-text and translate the text into the specified language."""
    recognizer = sr.Recognizer()
    translator = GoogleTranslator(source='auto', target=language)

    try:
        with sr.Microphone() as source:
            emit('status', {'message': 'Listening...'})
            audio = recognizer.listen(source, timeout=5, phrase_time_limit=10)
            spoken_text = recognizer.recognize_google(audio)

            # Translate the recognized speech
            translated_text = translator.translate(spoken_text)

            # Emit the results back to the client
            emit('translation', {'original': spoken_text, 'translated': translated_text})
    except sr.WaitTimeoutError:
        emit('status', {'message': 'Listening timeout: No speech detected.'})
    except sr.UnknownValueError:
        emit('status', {'message': 'Could not understand audio.'})
    except Exception as e:
        emit('status', {'message': f"Error: {str(e)}"})