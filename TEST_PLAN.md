# Test Plan - Pilana App

## 1. Testiranje AllowedUsers za AI izvještaje

### 1.1 Admin funkcionalnosti
- [ ] Prijava kao admin
- [ ] Pristup AI izvještajima (/reports/ai-create)
- [ ] Provjera da se prikazuju svi korisnici u checkbox listi
- [ ] Čekiranje/odčekiranje korisnika
- [ ] Sačuvavanje podešavanja
- [ ] Provjera da se podešavanja čuvaju u localStorage

### 1.2 Korisnik funkcionalnosti
- [ ] Prijava kao običan korisnik
- [ ] Provjera pristupa AI izvještajima (treba biti ograničen)
- [ ] Prijava kao korisnik koji ima dozvolu za AI
- [ ] Provjera da može pristupiti AI izvještajima

### 1.3 Backend testiranje
- [ ] Provjera da se allowedUsers čuva kao niz u localStorage
- [ ] Provjera da se koristi za filtriranje pristupa

## 2. Testiranje Dashboard-a za korisnike

### 2.1 Admin dashboard
- [ ] Prijava kao admin
- [ ] Provjera da se prikazuje dashboard (bez redirecta)
- [ ] Provjera da se prikazuju sve opcije (korisnici, forme, izvještaji, postavke)
- [ ] Provjera da se prikazuju quick stats

### 2.2 Običan korisnik dashboard
- [ ] Prijava kao običan korisnik
- [ ] Provjera da se prikazuje dashboard (bez redirecta)
- [ ] Provjera da se prikazuju samo opcije prema pravima
- [ ] Provjera da se prikazuju upute za korištenje

### 2.3 Korisnik bez pristupa
- [ ] Prijava kao korisnik bez pristupa formama/izvještajima
- [ ] Provjera da se prikazuje poruka o nedostatku pristupa

## 3. Testiranje GoogleSheet/tab polja u admin izvještajima

### 3.1 Admin create izvještaj
- [ ] Pristup /reports/admin-create
- [ ] Provjera da nema input polja za GoogleSheet/tab
- [ ] Provjera da se prikazuje read-only polje sa tab-om iz podešavanja
- [ ] Provjera da se automatski dohvata iz app-settings

### 3.2 Backend testiranje
- [ ] Provjera da se koristi tab iz podešavanja
- [ ] Provjera validacije da je tab obavezan

## 4. Testiranje snimanja standardnog izvještaja

### 4.1 Kreiranje izvještaja
- [ ] Unos osnovnih podataka (naziv, opis)
- [ ] Dodavanje parametara
- [ ] Dodavanje sekcija (tabela, grafikon, tekst)
- [ ] Odabir dozvoljenih korisnika
- [ ] Sačuvavanje izvještaja

### 4.2 Validacija
- [ ] Provjera da se prikazuje greška za prazan naziv
- [ ] Provjera da se prikazuje greška za prazan tab
- [ ] Provjera da se prikazuje greška za nepotpune parametre
- [ ] Provjera da se prikazuje greška za nepotpune sekcije

### 4.3 Korisnik pristup
- [ ] Prijava kao korisnik sa dozvolom
- [ ] Provjera da vidi izvještaj u listi
- [ ] Provjera da može otvoriti izvještaj
- [ ] Prijava kao korisnik bez dozvole
- [ ] Provjera da ne vidi izvještaj

## 5. Testiranje ikonice aplikacije

### 5.1 Upload ikonice
- [ ] Pristup /settings
- [ ] Upload različitih formata slika (PNG, JPG, GIF)
- [ ] Provjera validacije veličine fajla
- [ ] Provjera da se prikazuje preview

### 5.2 Prikaz ikonice
- [ ] Provjera favicon u browser tab-u
- [ ] Provjera ikonice u bookmarks
- [ ] Provjera PWA ikonice
- [ ] Provjera Apple touch icon

### 5.3 Manifest funkcionalnost
- [ ] Provjera da se manifest.json učitava
- [ ] Provjera PWA instalacije (ako podržano)

## 6. Testiranje AI izvještaja

### 6.1 Generisanje izvještaja
- [ ] Unos prompta na bosanskom jeziku
- [ ] Provjera da se generiše izvještaj
- [ ] Provjera da sadrži tabele, grafikone, tekst
- [ ] Provjera da se koristi tab iz podešavanja

### 6.2 Chat funkcionalnost
- [ ] Slanje poruka u chat
- [ ] Provjera AI odgovora
- [ ] Provjera automatskog generisanja izvještaja

## 7. Testiranje edge case-ova

### 7.1 Greške
- [ ] Provjera error handling za API greške
- [ ] Provjera error handling za network greške
- [ ] Provjera error handling za validaciju

### 7.2 Performanse
- [ ] Provjera učitavanja sa velikim brojem korisnika
- [ ] Provjera učitavanja sa velikim brojem izvještaja
- [ ] Provjera responsivnosti na različitim uređajima

### 7.3 Sigurnost
- [ ] Provjera da korisnici ne mogu pristupiti admin funkcionalnostima
- [ ] Provjera da se podaci filtriraju prema dozvolama
- [ ] Provjera da se sesije pravilno upravljaju

## 8. Testiranje na različitim browserima

### 8.1 Chrome
- [ ] Sve funkcionalnosti
- [ ] PWA funkcionalnost

### 8.2 Firefox
- [ ] Sve funkcionalnosti
- [ ] PWA funkcionalnost

### 8.3 Safari
- [ ] Sve funkcionalnosti
- [ ] Apple touch icon

### 8.4 Edge
- [ ] Sve funkcionalnosti
- [ ] PWA funkcionalnost

## 9. Testiranje na mobilnim uređajima

### 9.1 iOS
- [ ] Responsivnost
- [ ] Touch interakcije
- [ ] Apple touch icon

### 9.2 Android
- [ ] Responsivnost
- [ ] Touch interakcije
- [ ] PWA instalacija

## 10. Dokumentacija grešaka

Za svaku pronađenu grešku dokumentirati:
- Opis greške
- Koraci za reprodukciju
- Očekivano ponašanje
- Stvarno ponašanje
- Screenshot (ako je potreban)
- Browser/uređaj informacije 