const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// --- A CORREÇÃO ESTÁ AQUI ---
// Usamos app.getPath('userData') para salvar o banco na pasta de dados do Windows,
// que tem permissão total de leitura e gravação!
const dbPath = path.join(app.getPath('userData'), 'doramas.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Erro ao ligar à base de dados:', err);
    else console.log('Ligado à base de dados SQLite com sucesso.');
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS doramas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            nota REAL,
            status TEXT,
            img TEXT,
            sinopse TEXT,
            episodios INTEGER,
            episodios_assistidos INTEGER DEFAULT 0,
            elenco TEXT
        )
    `);
});

function criarJanela() {
    const mainWindow = new BrowserWindow({
        width: 2440, 
        height: 1080,
        autoHideMenuBar: true, 
        show: false, 
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    
    mainWindow.loadFile('index.html');

    mainWindow.once('ready-to-show', () => {
        
        mainWindow.show();
    });
}

app.whenReady().then(() => {
    criarJanela();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) criarJanela();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('get-doramas', () => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM doramas ORDER BY nota DESC', [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
});

ipcMain.handle('add-dorama', (event, dorama) => {
    return new Promise((resolve, reject) => {
        const { titulo, nota, status, img, sinopse, episodios, episodios_assistidos, elenco } = dorama;
        db.run(
            'INSERT INTO doramas (titulo, nota, status, img, sinopse, episodios, episodios_assistidos, elenco) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [titulo, nota, status, img, sinopse, episodios, episodios_assistidos, elenco],
            function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, titulo, nota, status, img, sinopse, episodios, episodios_assistidos, elenco });
            }
        );
    });
});

ipcMain.handle('update-dorama', (event, dorama) => {
    return new Promise((resolve, reject) => {
        const { id, titulo, nota, status, img, sinopse, episodios, episodios_assistidos, elenco } = dorama;
        db.run(
            'UPDATE doramas SET titulo = ?, nota = ?, status = ?, img = ?, sinopse = ?, episodios = ?, episodios_assistidos = ?, elenco = ? WHERE id = ?',
            [titulo, nota, status, img, sinopse, episodios, episodios_assistidos, elenco, id],
            function (err) {
                if (err) reject(err);
                else resolve({ id, titulo, nota, status, img, sinopse, episodios, episodios_assistidos, elenco });
            }
        );
    });
});

ipcMain.handle('delete-dorama', (event, id) => {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM doramas WHERE id = ?', [id], function (err) {
            if (err) reject(err);
            else resolve({ changes: this.changes });
        });
    });
});