import os
from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
from textblob import TextBlob
from translate import translate_text
import speech_recognition as sr

app = Flask(__name__)
socketio = SocketIO(app, async_mode='eventlet')

def recognize_speech():
    recognizer = sr.Recognizer()
    try:
        with sr.Microphone() as source:
            print("Listening...")
            audio = recognizer.listen(source, timeout=5, phrase_time_limit=10)
            text = recognizer.recognize_google(audio)
            print(f"Recognized Text: {text}")
            return text
    except Exception as e:
        print(f"Speech Recognition Error: {e}")
        raise e

@socketio.on('start_translation')
def handle_translation(data):
    target_language = data.get('language', 'en')
    print("Start Translation received:", data)
    try:
        result = speech_to_text_and_translate(target_language)
        emit('translation', {
            'original': result.get('original', ''),
            'translated': result.get('translated', '')
        })
    except Exception as e:
        emit('status', {'message': f"Error: {str(e)}"})

@socketio.on('translate_now')
def handle_translate_now(data):
    target_language = data.get('language', 'en')
    try:
        result = speech_to_text_and_translate(target_language)
        emit('translation', {
            'original': result.get('original', ''),
            'translated': result.get('translated', '')
        })
    except Exception as e:
        emit('status', {'message': f"Error: {str(e)}"})

def speech_to_text_and_translate(target_language):
    try:
        print(f"Target Language: {target_language}")
        text = recognize_speech()
        print(f"Recognized Text: {text}")
        translated = translate_text(text, target_language)
        print(f"Translated Text: {translated}")
        return {'original': text, 'translated': translated}
    except Exception as e:
        print(f"Error during translation: {e}")
        raise e

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
