const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const https = require('https');
const http = require('http');
const fs = require('fs');
const os = require('os');

const execAsync = promisify(exec);

let mainWindow;

// Download file from URL
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    
    const request = protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(destPath);
        return downloadFile(response.headers.location, destPath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const progress = totalSize ? Math.round((downloadedSize / totalSize) * 100) : 0;
        mainWindow?.webContents.send('download-progress', { progress });
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(destPath);
      });
    });
    
    request.on('error', (err) => {
      fs.unlinkSync(destPath);
      reject(err);
    });
    
    file.on('error', (err) => {
      fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

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
  mainWindow.webContents.openDevTools();

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
    // Check in common installation paths
    const programFiles = process.env['ProgramFiles'];
    const programFilesX86 = process.env['ProgramFiles(x86)'];
    const localAppData = process.env['LOCALAPPDATA'];
    
    // Common program paths
    const pathsToCheck = [
      path.join(programFiles, programId),
      path.join(programFilesX86, programId),
      path.join(localAppData, programId)
    ];
    
    for (const checkPath of pathsToCheck) {
      if (fs.existsSync(checkPath)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Check installed error for ${programId}:`, error.message);
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
      message: `Установка ${program.name}...`
    });

    // Use winget if specified
    if (program.useWinget && program.wingetId) {
      const wingetAvailable = await checkWinget();
      if (!wingetAvailable) {
        throw new Error('Winget не доступен. Установите App Installer из Microsoft Store.');
      }
      
      const command = `winget install --id "${program.wingetId}" --silent --accept-package-agreements --accept-source-agreements`;
      console.log(`Installing ${program.name} with winget: ${command}`);
      
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 300000,
        maxBuffer: 1024 * 1024 * 10
      });
      
      console.log(`Winget output:`, stdout);
      if (stderr) console.error(`Winget stderr:`, stderr);
    }
    // Use direct download
    else if (program.downloadUrl) {
      mainWindow.webContents.send('install-progress', {
        programId: program.id,
        status: 'downloading',
        message: `Скачивание ${program.name}...`
      });
      
      // Determine file extension
      const urlPath = new URL(program.downloadUrl).pathname;
      const extension = urlPath.endsWith('.msi') ? '.msi' : '.exe';
      installerPath = path.join(tempDir, `${program.id}_installer${extension}`);
      
      console.log(`Downloading ${program.name} from ${program.downloadUrl}`);
      await downloadFile(program.downloadUrl, installerPath);
      
      mainWindow.webContents.send('install-progress', {
        programId: program.id,
        status: 'installing',
        message: `Установка ${program.name}...`
      });
      
      // Run installer
      const installArgs = program.installArgs || '';
      const command = extension === '.msi' 
        ? `msiexec /i "${installerPath}" ${installArgs}`
        : `"${installerPath}" ${installArgs}`;
      
      console.log(`Running installer: ${command}`);
      
      const { stdout, stderr } = await execAsync(command, {
        timeout: 300000,
        maxBuffer: 1024 * 1024 * 10
      });
      
      console.log(`Installation output:`, stdout);
      if (stderr) console.error(`Installation stderr:`, stderr);
      
      // Clean up installer
      try {
        if (fs.existsSync(installerPath)) {
          fs.unlinkSync(installerPath);
        }
      } catch (cleanupError) {
        console.error('Failed to cleanup installer:', cleanupError);
      }
    } else {
      throw new Error('Не указан URL для скачивания или Winget ID');
    }
    
    mainWindow.webContents.send('install-progress', {
      programId: program.id,
      status: 'completed',
      message: `${program.name} успешно установлен`
    });

    return { success: true };
  } catch (error) {
    console.error(`Installation error for ${program.name}:`, error);
    
    // Clean up on error
    if (installerPath && fs.existsSync(installerPath)) {
      try {
        fs.unlinkSync(installerPath);
      } catch (cleanupError) {
        console.error('Failed to cleanup installer:', cleanupError);
      }
    }
    
    let errorMessage = error.message;
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Ошибка сети. Проверьте интернет-соединение.';
    } else if (error.message.includes('EACCES') || error.message.includes('permission denied')) {
      errorMessage = 'Нет прав доступа. Запустите от имени администратора.';
    } else if (error.killed || error.message.includes('timeout')) {
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

// Install multiple programs
ipcMain.handle('install-multiple', async (event, programs) => {
  const results = [];
  
  for (const program of programs) {
    try {
      const handler = ipcMain._events['install-program'];
      const result = await handler(event, program);
      results.push({ program: program.id, result });
    } catch (error) {
      console.error(`Error in install-multiple for ${program.id}:`, error);
      results.push({ program: program.id, result: { success: false, error: error.message } });
    }
  }
  
  return results;
});

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
  return { success: true };
});
