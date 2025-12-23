// Database of programs
const PROGRAMS = {
  browsers: {
    name: '🌐 Браузеры',
    icon: '🌐',
    programs: [
      {
        id: 'chrome',
        name: 'Google Chrome',
        wingetId: 'Google.Chrome',
        description: 'Популярный браузер от Google'
      },
      {
        id: 'vivaldi',
        name: 'Vivaldi',
        wingetId: 'Vivaldi.Vivaldi',
        description: 'Гибкий браузер с настройками'
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
        description: 'IDE для web-разработки'
      },
      {
        id: 'pycharm',
        name: 'PyCharm',
        wingetId: 'JetBrains.PyCharm.Community',
        description: 'IDE для Python'
      },
      {
        id: 'vscode',
        name: 'Visual Studio Code',
        wingetId: 'Microsoft.VisualStudioCode',
        description: 'Легкий редактор кода'
      },
      {
        id: 'visualstudio',
        name: 'Visual Studio 2022',
        wingetId: 'Microsoft.VisualStudio.2022.Community',
        description: 'Полноценная IDE от Microsoft'
      },
      {
        id: 'git',
        name: 'Git',
        wingetId: 'Git.Git',
        description: 'Система контроля версий'
      },
      {
        id: 'github-desktop',
        name: 'GitHub Desktop',
        wingetId: 'GitHub.GitHubDesktop',
        description: 'GUI для работы с Git'
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
        wingetId: 'Rustlang.Rust.MSVC',
        description: 'Язык системного программирования'
      },
      {
        id: 'python',
        name: 'Python',
        wingetId: 'Python.Python.3.12',
        description: 'Универсальный язык программирования'
      },
      {
        id: 'nodejs',
        name: 'Node.js',
        wingetId: 'OpenJS.NodeJS',
        description: 'JavaScript runtime'
      },
      {
        id: 'go',
        name: 'Go',
        wingetId: 'GoLang.Go',
        description: 'Язык от Google'
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
        wingetId: 'MSYS2.MSYS2',
        description: 'Unix-подобная среда для Windows'
      },
      {
        id: 'gcc',
        name: 'MinGW-w64 GCC',
        wingetId: 'Msys2.Msys2',
        description: 'GCC компилятор для Windows',
        installCommand: 'winget install --id MSYS2.MSYS2 --silent && C:\\msys64\\usr\\bin\\bash.exe -lc "pacman -S --noconfirm mingw-w64-x86_64-gcc"'
      },
      {
        id: 'cpp-build-tools',
        name: 'C++ Build Tools',
        wingetId: 'Microsoft.VisualStudio.2022.BuildTools',
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
        wingetId: 'Valve.Steam',
        description: 'Платформа для игр'
      },
      {
        id: 'discord',
        name: 'Discord',
        wingetId: 'Discord.Discord',
        description: 'Мессенджер для геймеров'
      },
      {
        id: 'yandex-music',
        name: 'Яндекс Музыка',
        wingetId: 'Yandex.Music',
        description: 'Музыкальный стриминг'
      },
      {
        id: 'hiddify',
        name: 'Hiddify',
        wingetId: 'Hiddify.Hiddify',
        description: 'VPN клиент'
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
    wingetId: programData.wingetId,
    description: programData.description || '',
    custom: true
  };
  
  PROGRAMS.custom.programs.push(newProgram);
  saveCustomPrograms(PROGRAMS.custom.programs);
  
  return newProgram;
}
