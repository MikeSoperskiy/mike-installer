const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

let mainWindow;

// Check if winget is available
async function checkWinget() {
  try {
    await execAsync('winget --version');
    return true;
  } catch (error) {
    return false;
  }
}

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
    backgroundColor: '#e0e5ec',
    titleBarStyle: 'default',
    frame: true
  });

  mainWindow.loadFile('src/renderer/index.html');

  // Uncomment for debugging
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  // Check winget availability on startup
  mainWindow.webContents.on('did-finish-load', async () => {
    const wingetAvailable = await checkWinget();
    if (!wingetAvailable) {
      dialog.showErrorBox(
        'Winget не найден',
        'Для работы приложения требуется Windows Package Manager (winget).\n\n' +
        'Установите "App Installer" из Microsoft Store или обновите Windows 10/11.'
      );
    }
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
    const { stdout } = await execAsync(`winget list --id "${programId}"`, { timeout: 10000 });
    return stdout.includes(programId);
  } catch (error) {
    console.error(`Check installed error for ${programId}:`, error.message);
    return false;
  }
});

// Install a program
ipcMain.handle('install-program', async (event, program) => {
  try {
    // Send initial progress
    mainWindow.webContents.send('install-progress', {
      programId: program.id,
      status: 'installing',
      message: `Установка ${program.name}...`
    });

    const command = program.installCommand || 
      `winget install --id "${program.wingetId}" --silent --accept-package-agreements --accept-source-agreements`;
    
    console.log(`Installing ${program.name} with command: ${command}`);

    // Execute with timeout (5 minutes)
    const { stdout, stderr } = await execAsync(command, { 
      timeout: 300000,
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
    
    console.log(`Installation output for ${program.name}:`, stdout);
    if (stderr) console.error(`Installation stderr for ${program.name}:`, stderr);
    
    mainWindow.webContents.send('install-progress', {
      programId: program.id,
      status: 'completed',
      message: `${program.name} успешно установлен`
    });

    return { success: true, output: stdout };
  } catch (error) {
    console.error(`Installation error for ${program.name}:`, error);
    
    let errorMessage = error.message;
    
    // Provide more specific error messages
    if (error.message.includes('No package found')) {
      errorMessage = 'Пакет не найден в winget. Проверьте Winget ID.';
    } else if (error.message.includes('requires elevation')) {
      errorMessage = 'Требуются права администратора. Запустите приложение от имени администратора.';
    } else if (error.killed || error.message.includes('timeout')) {
      errorMessage = 'Превышено время ожидания установки.';
    } else if (error.message.includes('network')) {
      errorMessage = 'Ошибка сети. Проверьте интернет-соединение.';
    }
    
    mainWindow.webContents.send('install-progress', {
      programId: program.id,
      status: 'error',
      message: `Ошибка установки ${program.name}: ${errorMessage}`
    });

    return { success: false, error: errorMessage };
  }
});

// Install multiple programs
ipcMain.handle('install-multiple', async (event, programs) => {
  const results = [];
  
  for (const program of programs) {
    try {
      const result = await ipcMain.invoke('install-program', event, program);
      results.push({ program: program.id, result });
    } catch (error) {
      console.error(`Error in install-multiple for ${program.id}:`, error);
      results.push({ program: program.id, result: { success: false, error: error.message } });
    }
  }
  
  return results;
};

// Get system info
ipcMain.handle('get-system-info', async () => {
  try {
    const { stdout } = await execAsync('systeminfo | findstr /B /C:"OS Name" /C:"OS Version"');
    return stdout;
  } catch (error) {
    console.error('System info error:', error);
    return 'Unable to retrieve system info';
  }
});

// Check winget availability
ipcMain.handle('check-winget', async () => {
  return await checkWinget();
});

// Add custom program
ipcMain.handle('add-custom-program', async (event, programData) => {
  // This will be handled by the renderer to save to localStorage
  return { success: true };
});
