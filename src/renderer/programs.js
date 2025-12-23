// Database of programs with direct download URLs
const PROGRAMS = {
  browsers: {
    name: '🌐 Браузеры',
    icon: '🌐',
    programs: [
      {
        id: 'chrome',
        name: 'Google Chrome',
        downloadUrl: 'https://dl.google.com/chrome/install/standalonesetup64.exe',
        description: 'Популярный браузер от Google',
        installArgs: '/silent /install'
      },
      {
        id: 'vivaldi',
        name: 'Vivaldi',
        downloadUrl: 'https://downloads.vivaldi.com/stable/Vivaldi.6.5.3206.63.x64.exe',
        description: 'Гибкий браузер с настройками',
        installArgs: '--vivaldi-silent --do-not-launch-chrome'
      }
    ]
  },
  development: {
    name: '💻 Разработка',
    icon: '💻',
    programs: [
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
        downloadUrl: 'https://download.jetbrains.com/python/pycharm-community-2024.3.exe',
        description: 'IDE для Python',
        installArgs: '/S /CONFIG=https://raw.githubusercontent.com/MikeSoperskiy/mike-installer/main/configs/pycharm-silent.config'
      },
      {
        id: 'vscode',
        name: 'Visual Studio Code',
        downloadUrl: 'https://code.visualstudio.com/sha/download?build=stable&os=win32-x64-user',
        description: 'Легкий редактор кода',
        installArgs: '/VERYSILENT /MERGETASKS=!runcode'
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
        downloadUrl: 'https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe',
        description: 'Система контроля версий',
        installArgs: '/VERYSILENT /NORESTART'
      },
      {
        id: 'github-desktop',
        name: 'GitHub Desktop',
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
        id: 'rust',
        name: 'Rust',
        downloadUrl: 'https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe',
        description: 'Язык системного программирования',
        installArgs: '-y'
      },
      {
        id: 'python',
        name: 'Python 3.12',
        downloadUrl: 'https://www.python.org/ftp/python/3.12.1/python-3.12.1-amd64.exe',
        description: 'Универсальный язык программирования',
        installArgs: '/quiet InstallAllUsers=1 PrependPath=1'
      },
      {
        id: 'nodejs',
        name: 'Node.js',
        downloadUrl: 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi',
        description: 'JavaScript runtime',
        installArgs: '/quiet /norestart'
      },
      {
        id: 'go',
        name: 'Go',
        downloadUrl: 'https://go.dev/dl/go1.21.6.windows-amd64.msi',
        description: 'Язык от Google',
        installArgs: '/quiet /norestart'
      }
    ]
  },
  tools: {
    name: '🛠️ Инструменты',
    icon: '🛠️',
    programs: [
      {
        id: 'msys2',
        name: 'MSYS2',
        downloadUrl: 'https://github.com/msys2/msys2-installer/releases/download/2024-01-13/msys2-x86_64-20240113.exe',
        description: 'Unix-подобная среда для Windows',
        installArgs: 'install --root C:\\msys64 --confirm-command'
      },
      {
        id: 'cpp-build-tools',
        name: 'C++ Build Tools',
        wingetId: 'Microsoft.VisualStudio.2022.BuildTools',
        useWinget: true,
        description: 'Microsoft C++ Build Tools'
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
        downloadUrl: 'https://cdn.akamai.steamstatic.com/client/installer/SteamSetup.exe',
        description: 'Платформа для игр',
        installArgs: '/S'
      },
      {
        id: 'discord',
        name: 'Discord',
        downloadUrl: 'https://discord.com/api/downloads/distributions/app/installers/latest?channel=stable&platform=win&arch=x64',
        description: 'Мессенджер для геймеров',
        installArgs: '-s'
      },
      {
        id: 'yandex-music',
        name: 'Яндекс Музыка',
        downloadUrl: 'https://music-desktop-application.s3.yandex.net/stable/YandexMusicSetup.exe',
        description: 'Музыкальный стриминг',
        installArgs: '/S'
      },
      {
        id: 'hiddify',
        name: 'Hiddify',
        downloadUrl: 'https://github.com/hiddify/hiddify-next/releases/download/v2.0.5/Hiddify-Windows-Setup-x64.exe',
        description: 'VPN клиент',
        installArgs: '/S'
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
