const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const axios = require('axios');
const fs = require('fs');
const os = require('os');

const execAsync = promisify(exec);

let mainWindow;

// Standard installation paths for programs
const INSTALL_PATHS = {
  chrome: [
    'Google\\Chrome\\Application\\chrome.exe',
    'Google\\Chrome\\Application'
  ],
  firefox: [
    'Mozilla Firefox\\firefox.exe',
    'Mozilla Firefox'
  ],
  vivaldi: [
    'Vivaldi\\Application\\vivaldi.exe'
  ],
  vscode: [
    'Microsoft VS Code\\Code.exe',
    'Programs\\Microsoft VS Code\\Code.exe'
  ],
  git: [
    'Git\\bin\\git.exe',
    'Git\\cmd\\git.exe'
  ],
  'github-desktop': [
    'GitHub Desktop\\GitHubDesktop.exe'
  ],
  python: [
    'Python312\\python.exe',
    'Python311\\python.exe',
    'Python310\\python.exe'
  ],
  nodejs: [
    'nodejs\\node.exe'
  ],
  rust: [
    '.cargo\\bin\\rustc.exe'
  ],
  go: [
    'Go\\bin\\go.exe'
  ],
  '7zip': [
    '7-Zip\\7z.exe'
  ],
  notepadplusplus: [
    'Notepad++\\notepad++.exe'
  ],
  steam: [
    'Steam\\steam.exe'
  ],
  discord: [
    'Discord\\Discord.exe'
  ],
  vlc: [
    'VideoLAN\\VLC\\vlc.exe'
  ],
  telegram: [
    'Telegram Desktop\\Telegram.exe'
  ]
};

// Check if program is installed by checking standard paths
function checkProgramInstalled(programId) {
  const paths = INSTALL_PATHS[programId] || [];
  const basePaths = [
    process.env['ProgramFiles'],
    process.env['ProgramFiles(x86)'],
    process.env['LOCALAPPDATA'],
    path.join(os.homedir(), 'AppData', 'Local'),
    path.join(os.homedir())
  ];

  for (const basePath of basePaths) {
    if (!basePath) continue;
    for (const programPath of paths) {
      const fullPath = path.join(basePath, programPath);
      if (fs.existsSync(fullPath)) {
        console.log(`[FOUND] ${programId} at ${fullPath}`);
        return true;
      }
    }
  }
  
  return false;
}

// Download file using axios with progress
async function downloadFile(url, destPath, onProgress) {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      maxRedirects: 5,
      timeout: 60000,
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false
      })
    });

    const totalLength = response.headers['content-length'];
    let downloadedLength = 0;

    const writer = fs.createWriteStream(destPath);

    response.data.on('data', (chunk) => {
      downloadedLength += chunk.length;
      if (totalLength && onProgress) {
        const progress = Math.round((downloadedLength / totalLength) * 100);
        onProgress(progress);
      }
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(destPath));
      writer.on('error', reject);
    });
  } catch (error) {
    if (fs.existsSync(destPath)) {
      fs.unlinkSync(destPath);
    }
    throw error;
  }
}

// Check if winget is available
async function checkWinget() {
  try {
    await execAsync('winget --version', { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
}

function createWindow() {
  // Remove default menu
  Menu.setApplicationMenu(null);
  
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
    backgroundColor: '#1a2332',
    autoHideMenuBar: true,
    frame: true
  });

  mainWindow.loadFile('src/renderer/index.html');

  // Uncomment for debugging
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
    return checkProgramInstalled(programId);
  } catch (error) {
    console.error(`Check installed error for ${programId}:`, error.message);
    return false;
  }
});

// Uninstall a program
ipcMain.handle('uninstall-program', async (event, program) => {
  try {
    mainWindow.webContents.send('install-progress', {
      programId: program.id,
      status: 'uninstalling',
      message: `Удаление ${program.name}...`
    });

    // Try winget uninstall first
    if (program.wingetId) {
      const wingetAvailable = await checkWinget();
      if (wingetAvailable) {
        const command = `winget uninstall --id "${program.wingetId}" --silent`;
        console.log(`[UNINSTALL] ${command}`);
        
        await execAsync(command, { 
          timeout: 300000,
          maxBuffer: 1024 * 1024 * 10
        });
        
        mainWindow.webContents.send('install-progress', {
          programId: program.id,
          status: 'completed',
          message: `${program.name} удалён`
        });
        
        return { success: true };
      }
    }
    
    // If winget not available, show manual uninstall instructions
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Удаление программы',
      message: `Удалите ${program.name} через "Параметры > Приложения"`,
      buttons: ['ОК']
    });
    
    return { success: false, error: 'Manual uninstall required' };
  } catch (error) {
    console.error(`[ERROR] Uninstall failed for ${program.name}:`, error);
    
    mainWindow.webContents.send('install-progress', {
      programId: program.id,
      status: 'error',
      message: `Ошибка удаления: ${error.message}`
    });

    return { success: false, error: error.message };
  }
});

// Install a program
ipcMain.handle('install-program', async (event, program) => {
  const tempDir = os.tmpdir();
  let installerPath = null;
  
  try {
    mainWindow.webContents.send('install-progress', {
      programId: program.id,
      status: 'installing',
      message: `Подготовка установки ${program.name}...`
    });

    // Use winget if specified
    if (program.useWinget && program.wingetId) {
      const wingetAvailable = await checkWinget();
      if (!wingetAvailable) {
        throw new Error('Winget не доступен. Установите App Installer из Microsoft Store.');
      }
      
      mainWindow.webContents.send('install-progress', {
        programId: program.id,
        status: 'installing',
        message: `Установка ${program.name} через winget...`
      });
      
      const command = `winget install --id "${program.wingetId}" --silent --accept-package-agreements --accept-source-agreements`;
      console.log(`[WINGET] ${command}`);
      
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 600000,
        maxBuffer: 1024 * 1024 * 10
      });
      
      console.log(`[WINGET SUCCESS] ${program.name}`);
      if (stderr) console.error(`[WINGET STDERR]`, stderr);
    }
    // Use direct download
    else if (program.downloadUrl) {
      mainWindow.webContents.send('install-progress', {
        programId: program.id,
        status: 'downloading',
        message: `Скачивание ${program.name}...`
      });
      
      const extension = program.downloadUrl.includes('.msi') || program.installArgs?.includes('msiexec') ? '.msi' : '.exe';
      installerPath = path.join(tempDir, `mike_installer_${program.id}_${Date.now()}${extension}`);
      
      console.log(`[DOWNLOAD] ${program.name} from ${program.downloadUrl}`);
      
      await downloadFile(program.downloadUrl, installerPath, (progress) => {
        mainWindow?.webContents.send('install-progress', {
          programId: program.id,
          status: 'downloading',
          message: `Скачивание ${program.name}: ${progress}%`
        });
      });
      
      console.log(`[DOWNLOAD SUCCESS] ${installerPath}`);
      
      mainWindow.webContents.send('install-progress', {
        programId: program.id,
        status: 'installing',
        message: `Установка ${program.name}...`
      });
      
      const installArgs = program.installArgs || (extension === '.msi' ? '/quiet /norestart' : '/S');
      const command = extension === '.msi' 
        ? `msiexec /i "${installerPath}" ${installArgs}`
        : `"${installerPath}" ${installArgs}`;
      
      console.log(`[INSTALL] ${command}`);
      
      const { stdout, stderr } = await execAsync(command, {
        timeout: 600000,
        maxBuffer: 1024 * 1024 * 10
      });
      
      console.log(`[INSTALL SUCCESS] ${program.name}`);
      if (stderr) console.error(`[INSTALL STDERR]`, stderr);
      
      setTimeout(() => {
        try {
          if (fs.existsSync(installerPath)) {
            fs.unlinkSync(installerPath);
            console.log(`[CLEANUP] Removed ${installerPath}`);
          }
        } catch (cleanupError) {
          console.error('[CLEANUP ERROR]', cleanupError.message);
        }
      }, 2000);
    } else {
      throw new Error('Не указан URL для скачивания или Winget ID');
    }
    
    mainWindow.webContents.send('install-progress', {
      programId: program.id,
      status: 'completed',
      message: `${program.name} успешно установлен!`
    });

    return { success: true };
  } catch (error) {
    console.error(`[ERROR] Installation failed for ${program.name}:`, error);
    
    if (installerPath && fs.existsSync(installerPath)) {
      try {
        fs.unlinkSync(installerPath);
      } catch (e) {}
    }
    
    let errorMessage = error.message;
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      errorMessage = 'Ошибка сети. Проверьте интернет-соединение.';
    } else if (error.message.includes('EACCES') || error.message.includes('permission denied')) {
      errorMessage = 'Нет прав доступа. Запустите от имени администратора.';
    } else if (error.killed) {
      errorMessage = 'Превышено время ожидания.';
    }
    
    mainWindow.webContents.send('install-progress', {
      programId: program.id,
      status: 'error',
      message: `Ошибка: ${errorMessage}`
    });

    return { success: false, error: errorMessage };
  }
});

// Get system info
ipcMain.handle('get-system-info', async () => {
  try {
    const { stdout } = await execAsync('systeminfo | findstr /B /C:"OS Name" /C:"OS Version"');
    return stdout;
  } catch (error) {
    return `Windows ${os.release()}`;
  }
});

// Check winget availability
ipcMain.handle('check-winget', async () => {
  return await checkWinget();
});

// Add custom program
ipcMain.handle('add-custom-program', async (event, programData) => {
  return { success: true };
});
