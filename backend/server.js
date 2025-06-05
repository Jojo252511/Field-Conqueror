// main.js (oder server.js)
const WebSocket = require('ws');

const TILE_SIZE = 20; // Synchron mit Frontend halten
const GRID_WIDTH_TILES = 30; // Synchron mit Frontend halten
const GRID_HEIGHT_TILES = 25; // Synchron mit Frontend halten
const MAX_PLAYERS = 6;

const wss = new WebSocket.Server({ port: 8080 });

let players = {}; // Speichert Spielerdaten { id: { x, y, color, name, score, ws } }
let gameGrid = []; // Speichert den Zustand des Spielfelds { color, ownerId }
let gameSettings = {
    gameTimeMinutes: 1, // Standard-Spielzeit
    gameActive: false,
    timerInterval: null,
    remainingTime: 0
};

console.log('WebSocket-Server gestartet auf Port 8080');

function initGrid() {
    console.log('Initialisiere Spielfeld...');
    gameGrid = [];
    for (let y = 0; y < GRID_HEIGHT_TILES; y++) {
        const row = [];
        for (let x = 0; x < GRID_WIDTH_TILES; x++) {
            row.push(null); // null bedeutet, die Zelle ist nicht gefärbt
        }
        gameGrid.push(row);
    }
}

function broadcast(data) {
    // Sendet Daten an alle verbundenen Clients
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(JSON.stringify(data));
            } catch (error) {
                console.error('Fehler beim Senden der Daten an Client:', error);
            }
        }
    });
}

function broadcastPlayerUpdate(player) {
    // Sendet ein Update für einen bestimmten Spieler an alle
    broadcast({ type: 'playerUpdate', player: { id: player.id, x: player.x, y: player.y, score: player.score, color: player.color, name: player.name } });
}

function broadcastGridUpdate(x, y, color, ownerId) {
    // Sendet ein Update für eine bestimmte Zelle an alle
    broadcast({ type: 'gridUpdate', x, y, color, ownerId });
}

function broadcastLeaderboard() {
    const leaderboard = Object.values(players)
        .map(p => ({ id: p.id, name: p.name, score: p.score, color: p.color }))
        .sort((a, b) => b.score - a.score);
    broadcast({ type: 'leaderboardUpdate', leaderboard });
}

function calculatePlayerScore(playerId) {
    let score = 0;
    if (!players[playerId]) return 0;

    for (let y = 0; y < GRID_HEIGHT_TILES; y++) {
        for (let x = 0; x < GRID_WIDTH_TILES; x++) {
            if (gameGrid[y][x] && gameGrid[y][x].ownerId === playerId) {
                score++;
            }
        }
    }
    return score;
}

function colorTile(playerId, x, y) {
    if (!players[playerId] || x < 0 || x >= GRID_WIDTH_TILES || y < 0 || y >= GRID_HEIGHT_TILES) {
        return; // Ungültige Aktion
    }

    const player = players[playerId];
    const currentTile = gameGrid[y][x];

    // Wenn die Kachel bereits diesem Spieler gehört, keine Änderung
    if (currentTile && currentTile.ownerId === playerId) {
        return;
    }

    // Wenn die Kachel einem anderen Spieler gehörte, dessen Score reduzieren
    if (currentTile && currentTile.ownerId && players[currentTile.ownerId]) {
        players[currentTile.ownerId].score = calculatePlayerScore(currentTile.ownerId); // Neuberechnung für den alten Besitzer
        // Optional: broadcastPlayerUpdate(players[currentTile.ownerId]); // Um den Score des alten Besitzers sofort zu aktualisieren
    }

    gameGrid[y][x] = { color: player.color, ownerId: playerId };
    player.score = calculatePlayerScore(playerId); // Score des aktuellen Spielers neu berechnen

    broadcastGridUpdate(x, y, player.color, playerId);
    // Score-Updates werden durch broadcastLeaderboard() oder gezielte playerUpdate behandelt
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function startGameOnServer(gameTimeMinutes) {
    if (gameSettings.gameActive) {
        console.log('Spiel läuft bereits.');
        return;
    }
    if (Object.keys(players).length === 0) {
        console.log('Keine Spieler verbunden, Spiel nicht gestartet.');
        broadcast({ type: 'error', message: 'Nicht genügend Spieler zum Starten.' });
        return;
    }

    console.log(`Starte Spiel mit ${gameTimeMinutes} Minuten.`);
    gameSettings.gameTimeMinutes = gameTimeMinutes;
    gameSettings.remainingTime = gameTimeMinutes * 60;
    gameSettings.gameActive = true;
    initGrid(); // Spielfeld zurücksetzen

    // Startpositionen und Scores zurücksetzen
    Object.values(players).forEach(p => {
        p.x = Math.floor(GRID_WIDTH_TILES / 2) + Math.floor(Math.random() * 5 - 2); // Leicht zufällige Start X
        p.y = Math.floor(GRID_HEIGHT_TILES / 2) + Math.floor(Math.random() * 5 - 2); // Leicht zufällige Start Y
        p.score = 0;
        colorTile(p.id, p.x, p.y); // Startkachel färben
    });


    broadcast({
        type: 'gameStart',
        grid: gameGrid, // Sendet das initial leere (oder vom Start gefärbte) Gitter
        players: Object.values(players).map(p => ({ id: p.id, name: p.name, color: p.color, x: p.x, y: p.y, score: p.score })),
        remainingTime: gameSettings.remainingTime
    });
    broadcastLeaderboard();


    if (gameSettings.timerInterval) clearInterval(gameSettings.timerInterval);
    gameSettings.timerInterval = setInterval(() => {
        gameSettings.remainingTime--;
        broadcast({ type: 'timerUpdate', time: formatTime(gameSettings.remainingTime), remainingTime: gameSettings.remainingTime });

        if (gameSettings.remainingTime <= 0) {
            endGameOnServer();
        }
    }, 1000);
}

function endGameOnServer() {
    console.log('Spiel beendet.');
    clearInterval(gameSettings.timerInterval);
    gameSettings.gameActive = false;

    const finalScores = Object.values(players)
        .map(p => ({ name: p.name, score: p.score, color: p.color }))
        .sort((a, b) => b.score - a.score);

    let winnerMessageStr = "Spiel Vorbei!";
    if (finalScores.length > 0) {
        const maxScore = finalScores[0].score;
        const winners = finalScores.filter(p => p.score === maxScore);
        if (winners.length === 1) {
            winnerMessageStr = `${winners[0].name} hat gewonnen mit ${winners[0].score} Feldern!`;
        } else {
            winnerMessageStr = `Unentschieden! Gewinner: ${winners.map(w => w.name).join(', ')} mit ${maxScore} Feldern.`;
        }
    }

    broadcast({ type: 'gameOver', message: winnerMessageStr, scores: finalScores });
    // Spieler können im 'players' Objekt bleiben für ein schnelles neues Spiel,
    // oder man könnte sie hier entfernen, wenn sie disconnected sind.
}


wss.on('connection', (ws) => {
    if (Object.keys(players).length >= MAX_PLAYERS) {
        console.log('Maximale Spielerzahl erreicht. Verbindung abgelehnt.');
        ws.send(JSON.stringify({ type: 'error', message: 'Server ist voll.' }));
        ws.close();
        return;
    }
    if (gameSettings.gameActive) {
        console.log('Spiel läuft bereits. Neuer Spieler kann nicht beitreten.');
        ws.send(JSON.stringify({ type: 'error', message: 'Ein Spiel läuft bereits, bitte warte.' }));
        ws.close();
        return;
    }


    const playerId = `player_${Math.random().toString(36).substr(2, 9)}`; // Eindeutige Spieler-ID
    console.log(`Spieler ${playerId} verbunden.`);


    // Sende dem neuen Spieler die aktuelle (leere) Spielerliste und das Gitter, falls vorhanden
    // und die Möglichkeit, das Spiel zu starten, wenn er der erste ist oder die Einstellungen anzupassen.
    ws.send(JSON.stringify({
        type: 'init',
        playerId: playerId,
        grid: gameGrid, // Sendet das aktuelle Gitter (wichtig, wenn man einem laufenden Spiel beitritt - hier nicht implementiert)
        players: Object.values(players).map(p => ({ id: p.id, name: p.name, color: p.color, x:p.x, y:p.y, score: p.score })), // Bereits verbundene Spieler
        gameActive: gameSettings.gameActive,
        gameTimeMinutes: gameSettings.gameTimeMinutes
    }));


    ws.on('message', (message) => {
        let data;
        try {
            data = JSON.parse(message);
        } catch (e) {
            console.error('Ungültige JSON-Nachricht empfangen:', message);
            return;
        }

        // console.log(`Nachricht von ${playerId}:`, data);

        const player = players[playerId];

        switch (data.type) {
            case 'playerJoin': // Wird vom Client gesendet, nachdem er 'init' erhalten hat
                if (players[playerId]) { // Spieler ist schon gejoined
                     console.log(`Spieler ${playerId} ist bereits beigetreten.`);
                     return;
                }
                players[playerId] = {
                    id: playerId,
                    name: data.name || `Spieler ${Object.keys(players).length + 1}`,
                    color: data.color || '#CCCCCC',
                    x: Math.floor(GRID_WIDTH_TILES / 2),
                    y: Math.floor(GRID_HEIGHT_TILES / 2),
                    score: 0,
                    ws: ws // WebSocket-Verbindung des Spielers speichern
                };
                console.log(`Spieler ${players[playerId].name} (${playerId}) beigetreten mit Farbe ${players[playerId].color}.`);
                // Informiere alle anderen über den neuen Spieler
                broadcast({ type: 'playerJoined', player: {id: playerId, name: players[playerId].name, color: players[playerId].color, x: players[playerId].x, y: players[playerId].y, score: 0} });
                broadcastLeaderboard();
                break;

            case 'move':
                if (!gameSettings.gameActive || !player) break;
                let moved = false;
                const oldX = player.x;
                const oldY = player.y;

                if (data.direction === 'up' && player.y > 0) { player.y--; moved = true; }
                else if (data.direction === 'down' && player.y < GRID_HEIGHT_TILES - 1) { player.y++; moved = true; }
                else if (data.direction === 'left' && player.x > 0) { player.x--; moved = true; }
                else if (data.direction === 'right' && player.x < GRID_WIDTH_TILES - 1) { player.x++; moved = true; }

                if (moved) {
                    // console.log(`Spieler ${player.name} bewegt sich nach (${player.x}, ${player.y})`);
                    colorTile(playerId, player.x, player.y);
                    broadcastPlayerUpdate(player); // Position und Score an alle senden
                    broadcastLeaderboard(); // Leaderboard aktualisieren, da sich der Score geändert haben könnte
                }
                break;

            case 'startGame': // Nur der erste Spieler oder ein Host sollte dies tun können (hier vereinfacht)
                if (!gameSettings.gameActive) {
                     const timeToSet = parseInt(data.gameTimeMinutes);
                     if (isNaN(timeToSet) || timeToSet < 1 || timeToSet > 15) {
                         console.log(`Ungültige Spielzeit von ${playerId}: ${data.gameTimeMinutes}`);
                         ws.send(JSON.stringify({type: 'error', message: 'Ungültige Spielzeit (1-15 Minuten).'}));
                         return;
                     }
                    startGameOnServer(timeToSet);
                } else {
                    ws.send(JSON.stringify({type: 'error', message: 'Spiel läuft bereits.'}));
                }
                break;
            // Weitere Nachrichten-Typen hier...
        }
    });

    ws.on('close', () => {
        console.log(`Spieler ${playerId} (${players[playerId]?.name || 'Unbekannt'}) hat die Verbindung getrennt.`);
        if (players[playerId]) {
            delete players[playerId];
            broadcast({ type: 'playerLeft', playerId: playerId });
            broadcastLeaderboard();

            // Wenn keine Spieler mehr da sind und das Spiel nicht aktiv ist, Grid resetten
            if (Object.keys(players).length === 0 && !gameSettings.gameActive) {
                console.log("Alle Spieler haben das Spiel verlassen. Spielfeld wird zurückgesetzt.");
                initGrid(); // Setzt das Gitter zurück, wenn keine Spieler mehr da sind
                // Ggf. Timer stoppen, falls einer lief, aber das Spiel nicht "aktiv" war (Sonderfall)
                if(gameSettings.timerInterval) clearInterval(gameSettings.timerInterval);
                gameSettings.remainingTime = 0;
            } else if (Object.keys(players).length === 0 && gameSettings.gameActive) {
                // Wenn letzter Spieler geht während Spiel läuft -> Spiel beenden
                console.log("Letzter Spieler hat das Spiel verlassen. Spiel wird beendet.");
                endGameOnServer();
            }
        }
    });

    ws.on('error', (error) => {
        console.error(`Fehler bei Spieler ${playerId} (${players[playerId]?.name || 'Unbekannt'}):`, error);
        // Die 'close'-Veranstaltung wird normalerweise nach einem Fehler ausgelöst,
        // daher ist ein explizites Löschen des Spielers hier möglicherweise nicht erforderlich.
    });
});

// Initialisiere das Grid beim Serverstart
initGrid();
