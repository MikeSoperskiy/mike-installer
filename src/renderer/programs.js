// Database of programs with stable, long-term download URLs
const PROGRAMS = {
  browsers: {
    name: '🌐 Браузеры',
    icon: '🌐',
    programs: [
      {
        id: 'chrome',
        name: 'Google Chrome',
        // Google's official stable download endpoint - always latest version
        downloadUrl: 'https://dl.google.com/chrome/install/latest/chrome_installer.exe',
        description: 'Популярный браузер от Google',
        installArgs: '/silent /install'
      },
      {
        id: 'firefox',
        name: 'Mozilla Firefox',
        // Mozilla's official latest stable release
        downloadUrl: 'https://download.mozilla.org/?product=firefox-latest&os=win64&lang=ru',
        description: 'Быстрый и приватный браузер',
        installArgs: '/S'
      },
      {
        id: 'vivaldi',
        name: 'Vivaldi',
        wingetId: 'Vivaldi.Vivaldi',
        useWinget: true,
        description: 'Гибкий браузер с настройками'
      }
    ]
  },
  development: {
    name: '💻 Разработка',
    icon: '💻',
    programs: [
      {
        id: 'vscode',
        name: 'Visual Studio Code',
        // Microsoft's stable update endpoint
        downloadUrl: 'https://update.code.visualstudio.com/latest/win32-x64-user/stable',
        description: 'Легкий редактор кода',
        installArgs: '/VERYSILENT /MERGETASKS=!runcode,addcontextmenufiles,addcontextmenufolders'
      },
      {
        id: 'webstorm',
        name: 'WebStorm',
        wingetId: 'JetBrains.WebStorm',
        useWinget: true,
        description: 'IDE для web-разработки'
      },
      {
        id: 'pycharm',
        name: 'PyCharm Community',
        wingetId: 'JetBrains.PyCharm.Community',
        useWinget: true,
        description: 'IDE для Python'
      },
      {
        id: 'visualstudio',
        name: 'Visual Studio 2022',
        wingetId: 'Microsoft.VisualStudio.2022.Community',
        useWinget: true,
        description: 'Полноценная IDE от Microsoft'
      },
      {
        id: 'git',
        name: 'Git',
        // GitHub's official latest release API
        downloadUrl: 'https://github.com/git-for-windows/git/releases/latest/download/Git-2.47.1-64-bit.exe',
        description: 'Система контроля версий',
        installArgs: '/VERYSILENT /NORESTART /NOCANCEL /SP- /CLOSEAPPLICATIONS /RESTARTAPPLICATIONS /COMPONENTS="icons,ext\\reg\\shellhere,assoc,assoc_sh"'
      },
      {
        id: 'github-desktop',
        name: 'GitHub Desktop',
        // GitHub's stable deployment endpoint
        downloadUrl: 'https://central.github.com/deployments/desktop/desktop/latest/win32',
        description: 'GUI для работы с Git',
        installArgs: '--silent'
      }
    ]
  },
  languages: {
    name: '🔥 Языки программирования',
    icon: '🔥',
    programs: [
      {
        id: 'python',
        name: 'Python 3.12',
        // Python.org latest stable 3.12
        downloadUrl: 'https://www.python.org/ftp/python/3.12.8/python-3.12.8-amd64.exe',
        description: 'Универсальный язык программирования',
        installArgs: '/quiet InstallAllUsers=1 PrependPath=1 Include_test=0'
      },
      {
        id: 'nodejs',
        name: 'Node.js LTS',
        // Node.js official LTS download
        downloadUrl: 'https://nodejs.org/dist/v22.12.0/node-v22.12.0-x64.msi',
        description: 'JavaScript runtime',
        installArgs: '/quiet /norestart ADDLOCAL=ALL'
      },
      {
        id: 'rust',
        name: 'Rust',
        // Rust official stable rustup
        downloadUrl: 'https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe',
        description: 'Язык системного программирования',
        installArgs: '-y --default-toolchain stable'
      },
      {
        id: 'go',
        name: 'Go',
        // Go official latest stable
        downloadUrl: 'https://go.dev/dl/go1.23.4.windows-amd64.msi',
        description: 'Язык от Google',
        installArgs: '/quiet /norestart'
      },
      {
        id: 'java',
        name: 'Java JDK 21',
        wingetId: 'Oracle.JDK.21',
        useWinget: true,
        description: 'Java Development Kit'
      }
    ]
  },
  tools: {
    name: '🛠️ Инструменты',
    icon: '🛠️',
    programs: [
      {
        id: 'docker',
        name: 'Docker Desktop',
        wingetId: 'Docker.DockerDesktop',
        useWinget: true,
        description: 'Контейнеризация приложений'
      },
      {
        id: 'postman',
        name: 'Postman',
        wingetId: 'Postman.Postman',
        useWinget: true,
        description: 'API testing tool'
      },
      {
        id: '7zip',
        name: '7-Zip',
        downloadUrl: 'https://www.7-zip.org/a/7z2408-x64.exe',
        description: 'Архиватор файлов',
        installArgs: '/S'
      },
      {
        id: 'notepadplusplus',
        name: 'Notepad++',
        // Notepad++ latest release
        downloadUrl: 'https://github.com/notepad-plus-plus/notepad-plus-plus/releases/download/v8.7.4/npp.8.7.4.Installer.x64.exe',
        description: 'Продвинутый текстовый редактор',
        installArgs: '/S'
      }
    ]
  },
  apps: {
    name: '🎮 Приложения',
    icon: '🎮',
    programs: [
      {
        id: 'steam',
        name: 'Steam',
        // Steam official CDN
        downloadUrl: 'https://cdn.akamai.steamstatic.com/client/installer/SteamSetup.exe',
        description: 'Платформа для игр',
        installArgs: '/S'
      },
      {
        id: 'discord',
        name: 'Discord',
        // Discord stable API endpoint
        downloadUrl: 'https://discord.com/api/downloads/distributions/app/installers/latest?channel=stable&platform=win&arch=x64',
        description: 'Мессенджер для геймеров',
        installArgs: '-s'
      },
      {
        id: 'spotify',
        name: 'Spotify',
        wingetId: 'Spotify.Spotify',
        useWinget: true,
        description: 'Музыкальный стриминг'
      },
      {
        id: 'vlc',
        name: 'VLC Media Player',
        // VLC latest stable
        downloadUrl: 'https://get.videolan.org/vlc/last/win64/vlc-3.0.21-win64.exe',
        description: 'Универсальный медиаплеер',
        installArgs: '/S'
      },
      {
        id: 'telegram',
        name: 'Telegram',
        // Telegram official download
        downloadUrl: 'https://telegram.org/dl/desktop/win64',
        description: 'Мессенджер',
        installArgs: '/VERYSILENT /NORESTART'
      }
    ]
  }
};

// Load custom programs from localStorage
function loadCustomPrograms() {
  const customPrograms = localStorage.getItem('customPrograms');
  if (customPrograms) {
    try {
      const parsed = JSON.parse(customPrograms);
      if (!PROGRAMS.custom) {
        PROGRAMS.custom = {
          name: '⭐ Пользовательские',
          icon: '⭐',
          programs: []
        };
      }
      PROGRAMS.custom.programs = parsed;
    } catch (e) {
      console.error('Error loading custom programs:', e);
    }
  }
}

// Save custom programs to localStorage
function saveCustomPrograms(programs) {
  localStorage.setItem('customPrograms', JSON.stringify(programs));
}

// Add custom program
function addCustomProgram(programData) {
  if (!PROGRAMS.custom) {
    PROGRAMS.custom = {
      name: '⭐ Пользовательские',
      icon: '⭐',
      programs: []
    };
  }
  
  const newProgram = {
    id: 'custom-' + Date.now(),
    name: programData.name,
    downloadUrl: programData.downloadUrl,
    wingetId: programData.wingetId,
    useWinget: programData.useWinget || false,
    description: programData.description || '',
    installArgs: programData.installArgs || '',
    custom: true
  };
  
  PROGRAMS.custom.programs.push(newProgram);
  saveCustomPrograms(PROGRAMS.custom.programs);
  
  return newProgram;
}
