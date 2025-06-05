# Feld Eroberer - Multiplayer

Ein einfaches lokales Multiplayer-Spiel, inspiriert von "Paper.io". Spieler steuern einen Würfel und versuchen, so viele Felder wie möglich auf einem 2D-Spielfeld in ihrer Farbe einzufärben. Der Spieler mit den meisten Feldern nach Ablauf der Zeit gewinnt.

## 🌟 Features

* **Echtzeit-Multiplayer:** Spiele mit bis zu 6 Personen im lokalen Netzwerk.
* **Anpassbare Spieler:** Wähle deinen Namen und deine Farbe.
* **Dynamisches Spielfeld:** Felder werden in Echtzeit in der Farbe des Spielers gefärbt, der sie berührt.
* **Zeitbasiertes Spiel:** Die Spieldauer ist einstellbar (Standard: 1-5 Minuten).
* **Leaderboard:** Zeigt die aktuellen Punktestände der Spieler an.
* **Einfache Steuerung:** Bewegung über Pfeiltasten oder WASD.

## 🛠️ Tech Stack

* **Frontend:** HTML, CSS (Tailwind CSS), JavaScript (Vanilla JS)
* **Backend:** Node.js
* **Kommunikation:** WebSockets (über das `ws`-Paket)

## 🚀 Setup & Starten

Um das Spiel lokal zu betreiben, befolge diese Schritte:

### Voraussetzungen

* **Node.js:** Stelle sicher, dass Node.js auf deinem System installiert ist. Du kannst es von [nodejs.org](https://nodejs.org/) herunterladen und installieren.
* **Webbrowser:** Ein moderner Webbrowser (z.B. Chrome, Firefox, Edge).

### 1. Backend Setup

1.  **Code herunterladen/klonen:** Lade die Backend-Datei (`server.js`) herunter oder klone das Repository.
2.  **Abhängigkeiten installieren:**
    * Öffne ein Terminal oder eine Kommandozeile.
    * Navigiere in den Ordner, in dem sich die Backend-Datei befindet.
    * Führe den folgenden Befehl aus, um die `ws`-Bibliothek zu installieren (falls noch nicht geschehen, erstelle eine `package.json` mit `npm init -y`):
        ```bash
        npm install ws
        ```
3.  **Server starten:**
    * Führe im selben Terminal den folgenden Befehl aus:
        ```bash
        node server.js 
        ```
    * Der Server sollte nun laufen und auf Port `8080` auf Verbindungen warten. Du siehst eine Meldung wie `WebSocket-Server gestartet auf Port 8080`.

### 2. Frontend Setup

1.  **HTML-Datei öffnen:**
    * Lade die Frontend-HTML-Datei (`index.html`) herunter.
    * Öffne diese Datei in deinem Webbrowser (Doppelklick auf die Datei oder "Datei öffnen" im Browser-Menü).
2.  **Mit dem Server verbinden:**
    * Gib deinen gewünschten Spielernamen ein und wähle eine Farbe.
    * Klicke auf "Mit Server verbinden".
    * Du wirst aufgefordert, die **IP-Adresse des Servers** einzugeben.
        * Wenn der Server auf **demselben Computer** läuft, auf dem du den Browser öffnest, kannst du `localhost` (Standard) oder `127.0.0.1` eingeben.
        * Wenn der Server auf einem **anderen Computer im selben lokalen Netzwerk** läuft, musst du die lokale IP-Adresse dieses Computers eingeben (z.B. `192.168.1.105`). Die lokale IP-Adresse des Server-Computers findest du üblicherweise in den Netzwerkeinstellungen (unter Windows z.B. mit `ipconfig` in der Kommandozeile, unter macOS/Linux mit `ifconfig` oder `ip addr`).
    * Klicke "OK".
3.  **Spiel starten:**
    * Sobald du (und andere Spieler) verbunden sind, werden die Steuerelemente für das Spiel angezeigt.
    * Ein Spieler kann die gewünschte Spielzeit einstellen und dann auf "Spiel Starten" klicken.

### 3. Zusätzliche Hinweise

* **Firewall:** Stelle sicher, dass deine Firewall (sowohl auf dem Server-PC als auch auf den Client-PCs) eingehende Verbindungen für Node.js bzw. den Port `8080` zulässt, damit andere Spieler im lokalen Netzwerk sich verbinden können.
* **Maximale Spielerzahl:** Das Backend ist aktuell für maximal 6 Spieler konfiguriert.

## 🎮 Spielanleitung

* **Bewegung:** Benutze die **Pfeiltasten** (`↑`, `↓`, `←`, `→`) oder die Tasten **W, A, S, D** auf deiner Tastatur, um deinen Würfel über das Spielfeld zu bewegen.
* **Felder färben:** Jedes Kästchen, das du mit deinem Würfel berührst, wird in deiner Farbe eingefärbt.
* **Punkte sammeln:** Für jedes neu eingefärbte Feld (oder ein Feld, das du einem anderen Spieler abnimmst) erhältst du einen Punkt.
* **Ziel:** Sei der Spieler mit den meisten eingefärbten Feldern, wenn die Spielzeit abgelaufen ist!

## 📄 Lizenz

Dieses Projekt ist für den persönlichen gebrauch gedacht. Du kannst es gerne anpassen und erweitern.
