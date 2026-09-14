const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'icon.ico'), // تحديد الأيقونة هنا
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('mn.html');
  win.setMenu(null);
}

app.whenReady().then(createWindow);

app.whenReady().then(createWindow);