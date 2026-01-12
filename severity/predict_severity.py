import joblib

model = joblib.load('severity_model.pkl')
vectorizer = joblib.load('vectorizer.pkl')

def predict_severity(symptom_text):
    text_vec = vectorizer.transform([symptom_text])
    prediction = model.predict(text_vec)[0]
    return prediction

while True:
    symptom = input('Enter symptoms (or "exit" to quit): ')
    if symptom.lower() in ['exit', 'quit']:
        break
    severity = predict_severity(symptom)
    print(f'Predicted Severity: {severity}\n')
