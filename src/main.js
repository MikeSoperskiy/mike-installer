const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const axios = require('axios');
const fs = require('fs');
const os = require('os');
const Registry = require('winreg');

const execAsync = promisify(exec);

let mainWindow;

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
        rejectUnauthorized: false // For problematic SSL certificates
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

// Check if program is installed via Windows Registry
async function checkInstalled(programName) {
  return new Promise((resolve) => {
    const regPaths = [
      '\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
      '\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall'
    ];

    let checked = 0;
    let found = false;

    regPaths.forEach(regPath => {
      const regKey = new Registry({
        hive: Registry.HKLM,
        key: regPath
      });

      regKey.keys((err, items) => {
        checked++;
        if (!err && items) {
          items.forEach(item => {
            item.values((err, values) => {
              if (!err && values) {
                values.forEach(value => {
                  if (value.name === 'DisplayName' && 
                      value.value.toLowerCase().includes(programName.toLowerCase())) {
                    found = true;
                  }
                });
              }
            });
          });
        }
        
        if (checked === regPaths.length) {
          setTimeout(() => resolve(found), 500);
        }
      });
    });
  });
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
ipcMain.handle('check-installed', async (event, programName) => {
  try {
    return await checkInstalled(programName);
  } catch (error) {
    console.error(`Check installed error for ${programName}:`, error.message);
    return false;
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
        timeout: 600000, // 10 minutes
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
      
      // Determine file extension
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
      
      // Run installer
      const installArgs = program.installArgs || (extension === '.msi' ? '/quiet /norestart' : '/S');
      const command = extension === '.msi' 
        ? `msiexec /i "${installerPath}" ${installArgs}`
        : `"${installerPath}" ${installArgs}`;
      
      console.log(`[INSTALL] ${command}`);
      
      const { stdout, stderr } = await execAsync(command, {
        timeout: 600000, // 10 minutes
        maxBuffer: 1024 * 1024 * 10
      });
      
      console.log(`[INSTALL SUCCESS] ${program.name}`);
      if (stderr) console.error(`[INSTALL STDERR]`, stderr);
      
      // Clean up installer
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
    
    // Clean up on error
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
