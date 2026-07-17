🚀 Stap-voor-Stap: Abel123 Platform Starten

---

📦 Deel 1: Backend Starten (Flask + SQLite)

Stap 1: Open een terminal/command prompt

Stap 2: Ga naar de backend map

```bash
cd backend
```

Stap 3: Maak een virtuele omgeving aan

```bash
# Windows
python -m venv venv

# Mac/Linux
python3 -m venv venv
```

Stap 4: Activeer de virtuele omgeving

```bash
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

Je zou (venv) voor je command prompt moeten zien.

Stap 5: Installeer de benodigde packages

```bash
pip install -r requirements.txt
```

Stap 6: Start de Flask backend

```bash
python run.py
```

Je zou dit moeten zien:

```
🚀 Abel123 platform starting...
📡 API_BASE: http://localhost:5000/api
 * Running on http://127.0.0.1:5000
 * Running on http://localhost:5000
```

✅ De backend draait nu op: http://localhost:5000

---

🌐 Deel 2: Frontend Starten

Optie A: VS Code Live Server (Aanbevolen)

1. Open de index.html in VS Code
2. Rechtsklik op de index.html
3. Kies "Open with Live Server"
4. De website opent op: http://localhost:5500

Optie B: Python HTTP Server

```bash
# Open een NIEUWE terminal (laat de backend draaien!)
cd ..  # Ga naar de hoofdmap

# Python 3
python -m http.server 5500

# Python 2
python -m SimpleHTTPServer 5500
```

Open in browser: http://localhost:5500

Optie C: Dubbelklik op index.html

· Dubbelklik op index.html in je bestandsverkenner
· Let op: Dit werkt niet altijd door CORS restricties

---

📁 Complete bestandsstructuur

Zorg dat je bestanden zo zijn georganiseerd:

```
abel123-platform/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── auth.py
│   │   ├── utils.py
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── auth_routes.py
│   │       ├── user_routes.py
│   │       ├── job_routes.py
│   │       ├── proposal_routes.py
│   │       ├── message_routes.py
│   │       └── review_routes.py
│   ├── instance/
│   │   └── werknexus.db  ← Wordt automatisch aangemaakt
│   ├── requirements.txt
│   └── run.py
├── index.html              ← In de hoofdmap
├── scripts.js              ← In de hoofdmap
└── README.md
```

---

🎯 Testen of het werkt

1. Check de backend API

Open in je browser:

```
http://localhost:5000/health
```

Je zou moeten zien:

```json
{"status":"healthy"}
```

2. Check de frontend

Open in je browser:

```
http://localhost:5500
```

Je zou de Abel123 homepage moeten zien.

3. Registreer een account

1. Klik op "Account aanmaken" (rechtsboven)
2. Vul alle velden in:
   · Voornaam: Jan
   · Achternaam: Jansen
   · E-mail: jan@test.nl
   · Wachtwoord: 123456
   · Functietitel: Developer
   · Categorie: IT & Software
   · Locatie: Amsterdam
3. Klik op "Account aanmaken"
4. Je zou een welkomstbericht moeten zien! 🎉

4. Log in

1. Klik op "Inloggen"
2. Vul je e-mail en wachtwoord in
3. Klik op "Inloggen"
4. Je wordt naar het dashboard gebracht

5. Plaats een opdracht

1. Klik op "+ Opdracht plaatsen"
2. Vul alle velden in
3. Klik op "Opdracht plaatsen"
4. Ga naar "Opdrachten" om je opdracht te zien

---

🔧 Probleemoplossing

Probleem: "Kan geen verbinding maken met de backend"

Oplossing: Controleer of de backend draait:

```bash
# In de backend terminal
python run.py
```

Probleem: "Module not found"

Oplossing: Installeer de packages opnieuw:

```bash
pip install -r requirements.txt
```

Probleem: "Port 5000 is al in gebruik"

Oplossing: Gebruik een andere poort:

```bash
# In run.py aanpassen
app.run(debug=True, host='0.0.0.0', port=5001)
```

En pas API_BASE aan in scripts.js:

```javascript
return 'http://localhost:5001/api';
```

Probleem: "CORS error" in de console

Oplossing: Zet CORS aan in de backend:

```python
# In backend/app/__init__.py
CORS(app, origins=['http://localhost:5500', 'http://127.0.0.1:5500'])
```

Probleem: De database is niet aangemaakt

Oplossing: De database wordt automatisch aangemaakt bij de eerste start. Check of instance/werknexus.db bestaat.

---

📱 Wat je nu kunt doen

Als Freelancer:

· ✅ Account aanmaken
· ✅ Profiel invullen met skills en uurtarief
· ✅ Opdrachten bekijken van andere gebruikers
· ✅ Voorstellen versturen op opdrachten
· ✅ Chatten met opdrachtgevers
· ✅ Reviews ontvangen

Als Opdrachtgever:

· ✅ Account aanmaken
· ✅ Opdrachten plaatsen
· ✅ Voorstellen ontvangen van freelancers
· ✅ Voorstellen accepteren of afwijzen
· ✅ Chatten met freelancers
· ✅ Reviews achterlaten

---

🚀 Volgende stappen

1. Test alles: Maak meerdere accounts aan en test alle functies
2. Bekijk de console (F12): Zie alle API calls en logs
3. Bekijk de database: Open instance/werknexus.db met een SQLite viewer
4. Pas de styling aan: Wijzig de CSS in index.html

---

💡 Tip voor GitHub Pages

Als je de frontend op GitHub Pages wilt zetten:

1. Push index.html en scripts.js naar de root van je repository
2. Zet de backend ergens anders (Render, Heroku, etc.)
3. Verander API_BASE in scripts.js naar je live backend URL:

```javascript
// In scripts.js
return 'https://jouw-backend-url.com/api';
```

---
