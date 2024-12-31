from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
from speech_recognition_handler import speech_to_text_and_translate  # Import non-blocking speech handler
from translate import translate_text
from textblob import TextBlob
import speech_recognition as sr

app = Flask(__name__)
socketio = SocketIO(app, async_mode='eventlet')

# Analytics dictionary
analytics = {
    "messages_sent": 0,
    "calls_started": 0,
    "total_call_duration": 0,
    "translations_requested": 0,
    "language_usage": {},  # Tracks usage per language
    "positive_messages": 0,  # Count of positive messages
    "negative_messages": 0,  # Count of negative messages
    "neutral_messages": 0    # Count of neutral messages
}


@app.route('/')
def index():
    return render_template('index.html')

# Serve favicon.ico
@app.route('/favicon.ico')
def favicon():
    return '', 204  # Ignore favicon requests

# Serve analytics data for the dashboard
@app.route('/analytics')
def analytics_page():
    return render_template('analytics.html', data=analytics)

@app.route('/analytics/data')
def analytics_data():
    return analytics  # Sentiment counts are already part of the `analytics` dictionary


# Handle live speech-to-text translation
@socketio.on('start_translation')
def handle_translation(data):
    global analytics
    target_language = data.get('language', 'en')  # Default to English
    analytics['translations_requested'] += 1  # Increment translations count
    analytics['language_usage'][target_language] = analytics['language_usage'].get(target_language, 0) + 1

    try:
        speech_to_text_and_translate(target_language)
        emit('status', {'message': 'Translation process started...'})
    except Exception as e:
        emit('status', {'message': f"Error: {str(e)}"})

# Handle chat messages with translation
@socketio.on('chat')
def handle_chat(data):
    global analytics
    analytics['messages_sent'] += 1

    message = data['message']
    target_language = data.get('targetLanguage', 'en')  # Default to English
    sender_id = request.sid

    # Perform sentiment analysis
    sentiment_score = analyze_sentiment(message)
    if sentiment_score > 0:
        analytics['positive_messages'] += 1
    elif sentiment_score < 0:
        analytics['negative_messages'] += 1
    else:
        analytics['neutral_messages'] += 1

    try:
        translated_message = translate_text(message, target_language)
    except Exception as e:
        print(f"Translation error: {e}")
        translated_message = message  # Fallback to the original message

    emit('chat', {
        'message': message,
        'translatedMessage': translated_message,
        'sender': sender_id
    }, broadcast=True)


    # Emit chat message with sentiment
    emit('chat', {
        'message': message,
        'translatedMessage': translated_message,
        'sender': sender_id,
        'sentiment': sentiment # type: ignore
    }, broadcast=True)

# Handle WebRTC signaling
@socketio.on('offer')
def handle_offer(offer):
    global analytics
    analytics['calls_started'] += 1  # Increment calls started
    print("Broadcasting offer:", offer)
    emit('offer', offer, broadcast=True)

@socketio.on('answer')
def handle_answer(answer):
    print("Broadcasting answer:", answer)
    emit('answer', answer, broadcast=True)

@socketio.on('ice-candidate')
def handle_ice_candidate(candidate):
    print("Broadcasting ICE candidate:", candidate)
    emit('ice-candidate', candidate, broadcast=True)

# Handle typing indicator
@socketio.on('typing')
def handle_typing():
    emit('typing', broadcast=True, include_self=False)

@socketio.on('translate_now')
def handle_translate_now(data):
    target_language = data.get('language', 'en')  # Default to English

    try:
        speech_to_text_and_translate(target_language)
        emit('status', {'message': 'Listening for speech...'})
    except Exception as e:
        emit('status', {'message': f"Error: {str(e)}"})

def analyze_sentiment(message):
    """Analyze sentiment of a message and return the polarity."""
    blob = TextBlob(message)
    polarity = blob.sentiment.polarity  # Polarity ranges from -1 (negative) to 1 (positive)
    print(f"Message: {message}, Sentiment Score: {polarity}")  # Debug log
    return polarity

def recognize_speech():
    recognizer = sr.Recognizer()
    try:
        with sr.Microphone() as source:
            print("Listening...") = recognizer.listen(source, timeout=5, phrase_time_limit=10)
            text = recognizer.recognize_google()
            print(f"Recognized Speech: {text}")
            return text
    except sr.RequestError:
        print("Could not request results from Google Speech Recognition service")
        return None
    except sr.UnknownValueError:
        print("Could not understand the audio")
        return None
    
if __name__ == '__main__':
    socketio.run(app, debug=True)