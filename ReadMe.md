API Overzicht

Endpoint Method Description
/api/auth/register POST Registreer een nieuwe gebruiker
/api/auth/login POST Login en krijg JWT token
/api/auth/me GET Haal huidige gebruiker op
/api/users GET Lijst van gebruikers (met filters)
/api/users/<id> GET Gebruiker details
/api/users/me PUT Update eigen profiel
/api/users/<id>/reviews GET Reviews voor een gebruiker
/api/jobs GET Lijst van opdrachten (met filters)
/api/jobs POST Nieuwe opdracht plaatsen
/api/jobs/<id> GET Opdracht details
/api/jobs/<id>/proposals GET Voorstellen voor een opdracht
/api/proposals GET Eigen voorstellen
/api/proposals POST Voorstel versturen
/api/proposals/<id> PUT Voorstel bijwerken (accepteren/afwijzen)
/api/messages GET Berichten ophalen (met peerId filter)
/api/messages POST Bericht versturen
/api/messages/conversations GET Lijst van gesprekken
/api/reviews GET Reviews ophalen
/api/reviews POST Review plaatsen

project structuur:

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
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── index.html
│   └── scripts.js
└── .env

2.Backend Starten:

cd backend

python -m venv venv

source venv/bin/activate 
#Windows: venv\Scripts\activate

pip install -r requirements.txt

python run.py

3. Frontend starten

Open de index.html in een live server (VS Code Live Server of python -m http.server 5500 in de frontend map).

4. Testen

· Demo account: demo@werknexus.nl / demo123
· Of registreer een eigen account via de UI

Het platform is nu volledig functioneel met:

· ✅ Registratie & login met JWT authenticatie
· ✅ Opdrachten plaatsen, bekijken en filteren
· ✅ Voorstellen versturen en accepteren/afwijzen
· ✅ Freelancer profielen bekijken
· ✅ Chat systeem tussen gebruikers
· ✅ Review systeem
· ✅ Nederlands/Engels taal switch
· ✅ Responsive design
