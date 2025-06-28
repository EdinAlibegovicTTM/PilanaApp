# Pilana App v2

Aplikacija za upravljanje formama i izvještajima sa AI podrškom.

## 🚀 Novi funkcionalnosti

### ✅ AllowedUsers za AI izvještaje
- Admin može birati koji korisnici imaju pristup AI izvještajima
- UI sa checkbox listom svih korisnika
- Backend validacija pristupa
- Čuvanje kao niz umjesto stringa

### ✅ Dashboard za korisnike
- Svi korisnici vide dashboard nakon prijave (bez automatskog redirecta)
- Admin dashboard sa svim opcijama
- Korisnik dashboard sa opcijama prema pravima
- Upute za korištenje aplikacije

### ✅ GoogleSheet/tab automatsko dohvaćanje
- Uklonjena ručna polja za GoogleSheet/tab
- Automatsko dohvaćanje iz app-settings
- Read-only prikaz tab-a iz podešavanja
- Validacija da je tab postavljen

### ✅ Poboljšano snimanje izvještaja
- Validacija obaveznih polja
- Error handling sa jasnim porukama
- Duplikat provjera
- Uspješno snimanje sa feedback-om

### ✅ Ikonica aplikacije (PWA)
- Upload različitih formata slika
- Automatsko generisanje favicon, apple touch icon, manifest icon
- PWA manifest.json
- Service worker za offline funkcionalnost

### ✅ Dodatne optimizacije
- Error Boundary komponente
- Loading spinner komponente
- Poboljšan AuthGuard
- Performanse optimizacije
- Sigurnosni headeri

## 🛠️ Instalacija

### Preduvjeti
- Node.js 18+ 
- PostgreSQL baza podataka
- Docker (opcionalno)

### Koraci instalacije

1. **Kloniraj repozitorij**
```bash
git clone <repository-url>
cd pilana-v2
```

2. **Instaliraj dependencies**
```bash
npm install
```

3. **Postavi environment varijable**
```bash
cp env.example .env
```
Uredi `.env` fajl sa svojim podešavanjima:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/pilana_db"
GOOGLE_SHEET_ID="your-google-sheet-id"
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@email.com"
GOOGLE_PRIVATE_KEY="your-private-key"
OPENAI_API_KEY="your-openai-api-key"
JWT_SECRET="your-jwt-secret"
```

4. **Pokreni bazu podataka**
```bash
# Sa Docker-om
docker compose up -d

# Ili direktno PostgreSQL
```

5. **Pokreni migracije**
```bash
npx prisma migrate dev
```

6. **Generiši Prisma client**
```bash
npx prisma generate
```

7. **Pokreni aplikaciju**
```bash
npm run dev
```

## 📱 PWA funkcionalnost

Aplikacija podržava PWA (Progressive Web App) funkcionalnost:

- **Instalacija**: Može se instalirati kao aplikacija na desktop i mobilnim uređajima
- **Offline funkcionalnost**: Service worker omogućava offline pristup
- **Push notifications**: Podrška za push obavještenja
- **App icons**: Automatsko generisanje ikonica za različite platforme

### PWA instalacija
1. Otvori aplikaciju u Chrome/Edge
2. Klikni na ikonicu instalacije u adresnoj traci
3. Slijedi upute za instalaciju

## 🔧 Konfiguracija

### Google Sheets
1. Kreiraj Google Service Account
2. Podijeli Google Sheet sa service account email-om
3. Postavi environment varijable

### AI izvještaji
1. Postavi OpenAI API key
2. Konfiguriši Google Sheet tab u podešavanjima
3. Odaberi korisnike koji imaju pristup AI funkcionalnostima

### App ikonica
1. Idite na `/settings`
2. Upload-ujte ikonicu (preporučeno 192x192px PNG)
3. Ikonica će se automatski koristiti za favicon, PWA i Apple touch icon

## 🧪 Testiranje

Koristite `TEST_PLAN.md` za detaljno testiranje svih funkcionalnosti:

```bash
# Pokreni testove
npm test

# Ili prođi kroz test plan ručno
```

## 📁 Struktura projekta

```
pilana-v2/
├── app/                    # Next.js app router
│   ├── api/               # API rute
│   ├── dashboard/         # Dashboard stranica
│   ├── forms/            # Forme
│   ├── reports/          # Izvještaji
│   └── settings/         # Podešavanja
├── components/           # React komponente
│   ├── ErrorBoundary.tsx # Error handling
│   ├── LoadingSpinner.tsx # Loading states
│   └── ...
├── lib/                 # Utility funkcije
├── prisma/              # Database schema i migracije
├── public/              # Statički fajlovi
│   ├── icons/           # App ikonice
│   ├── manifest.json    # PWA manifest
│   └── sw.js           # Service worker
└── store/               # Zustand state management
```

## 🔒 Sigurnost

- Validacija pristupa na frontend i backend nivou
- Filtriranje podataka prema korisničkim pravima
- Sigurno čuvanje lozinki (bcrypt)
- CSRF zaštita
- Sigurnosni headeri

## 🚀 Deployment

### Vercel
```bash
npm run build
vercel --prod
```

### Docker
```bash
docker build -t pilana-app .
docker run -p 3000:3000 pilana-app
```

## 📞 Podrška

Za pitanja i podršku:
- Otvori issue na GitHub-u
- Kontaktiraj development tim

## 📄 Licenca

MIT License - pogledajte LICENSE fajl za detalje. 