const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    backgroundColor: '#1e1e1e',
    titleBarStyle: 'default',
    frame: true
  });

  mainWindow.loadFile('src/renderer/index.html');

  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Check if a program is installed
ipcMain.handle('check-installed', async (event, programId) => {
  try {
    const { stdout } = await execAsync(`winget list --id ${programId}`);
    return stdout.includes(programId);
  } catch (error) {
    return false;
  }
});

// Install a program
ipcMain.handle('install-program', async (event, program) => {
  try {
    const command = program.installCommand || `winget install --id ${program.wingetId} --silent --accept-package-agreements --accept-source-agreements`;
    
    mainWindow.webContents.send('install-progress', {
      programId: program.id,
      status: 'installing',
      message: `Установка ${program.name}...`
    });

    const { stdout, stderr } = await execAsync(command);
    
    mainWindow.webContents.send('install-progress', {
      programId: program.id,
      status: 'completed',
      message: `${program.name} успешно установлен`
    });

    return { success: true, output: stdout };
  } catch (error) {
    mainWindow.webContents.send('install-progress', {
      programId: program.id,
      status: 'error',
      message: `Ошибка установки ${program.name}: ${error.message}`
    });

    return { success: false, error: error.message };
  }
});

// Install multiple programs
ipcMain.handle('install-multiple', async (event, programs) => {
  const results = [];
  
  for (const program of programs) {
    const result = await ipcMain.emit('install-program', event, program);
    results.push({ program: program.id, result });
  }
  
  return results;
});

// Get system info
ipcMain.handle('get-system-info', async () => {
  try {
    const { stdout } = await execAsync('systeminfo | findstr /B /C:"OS Name" /C:"OS Version"');
    return stdout;
  } catch (error) {
    return 'Unable to retrieve system info';
  }
});

// Add custom program
ipcMain.handle('add-custom-program', async (event, programData) => {
  // This will be handled by the renderer to save to localStorage
  return { success: true };
});
