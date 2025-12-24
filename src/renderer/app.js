// State management
let selectedPrograms = new Set();
let installedPrograms = new Set();
let installingPrograms = new Set();
let currentContextProgram = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadCustomPrograms();
  renderCategories();
  setupEventListeners();
  checkInstalledPrograms();
});

// Render all categories
function renderCategories() {
  const container = document.getElementById('categoriesContainer');
  container.innerHTML = '';
  
  Object.entries(PROGRAMS).forEach(([categoryId, category]) => {
    const categoryElement = createCategoryElement(categoryId, category);
    container.appendChild(categoryElement);
  });
}

// Create category element
function createCategoryElement(categoryId, category) {
  const categoryDiv = document.createElement('div');
  categoryDiv.className = 'category';
  categoryDiv.dataset.category = categoryId;
  
  const header = document.createElement('div');
  header.className = 'category-header';
  header.innerHTML = `
    <h2>${category.icon} ${category.name}</h2>
    <span class="toggle-icon">▼</span>
  `;
  
  header.addEventListener('click', () => {
    categoryDiv.classList.toggle('collapsed');
  });
  
  const programsGrid = document.createElement('div');
  programsGrid.className = 'programs-grid';
  
  category.programs.forEach(program => {
    const programCard = createProgramCard(program);
    programsGrid.appendChild(programCard);
  });
  
  categoryDiv.appendChild(header);
  categoryDiv.appendChild(programsGrid);
  
  return categoryDiv;
}

// Create program card
function createProgramCard(program) {
  const card = document.createElement('div');
  card.className = 'program-card';
  card.dataset.programId = program.id;
  
  card.innerHTML = `
    <div class="program-name">${program.name}</div>
    <div class="program-description">${program.description}</div>
    <div class="program-status" id="status-${program.id}">Проверка...</div>
  `;
  
  // Right click to open context menu
  card.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, program);
  });
  
  // Left click to open context menu
  card.addEventListener('click', (e) => {
    if (!installingPrograms.has(program.id)) {
      showContextMenu(e.clientX, e.clientY, program);
    }
  });
  
  return card;
}

// Show context menu
function showContextMenu(x, y, program) {
  const menu = document.getElementById('contextMenu');
  currentContextProgram = program;
  
  // Update menu items based on program state
  const selectItem = document.getElementById('ctxSelect');
  const installItem = document.getElementById('ctxInstall');
  const uninstallItem = document.getElementById('ctxUninstall');
  
  // Update select text
  if (selectedPrograms.has(program.id)) {
    selectItem.querySelector('.ctx-text').textContent = 'Отменить выбор';
  } else {
    selectItem.querySelector('.ctx-text').textContent = 'Выбрать для пакетной установки';
  }
  
  // Show/hide based on installation status
  if (installedPrograms.has(program.id)) {
    installItem.style.display = 'none';
    uninstallItem.style.display = 'flex';
  } else {
    installItem.style.display = 'flex';
    uninstallItem.style.display = 'none';
  }
  
  // Position menu
  menu.style.display = 'block';
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  
  // Adjust if menu goes off screen
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    menu.style.left = (x - rect.width) + 'px';
  }
  if (rect.bottom > window.innerHeight) {
    menu.style.top = (y - rect.height) + 'px';
  }
}

// Hide context menu
function hideContextMenu() {
  document.getElementById('contextMenu').style.display = 'none';
  currentContextProgram = null;
}

// Update selected count
function updateSelectedCount() {
  document.getElementById('selectedCountInline').textContent = selectedPrograms.size;
}

// Select all programs
function selectAll() {
  Object.values(PROGRAMS).forEach(category => {
    category.programs.forEach(program => {
      if (!installedPrograms.has(program.id) && !installingPrograms.has(program.id)) {
        selectedPrograms.add(program.id);
        const card = document.querySelector(`[data-program-id="${program.id}"]`);
        if (card) card.classList.add('selected');
      }
    });
  });
  updateSelectedCount();
}

// Deselect all programs
function deselectAll() {
  selectedPrograms.clear();
  document.querySelectorAll('.program-card').forEach(card => {
    card.classList.remove('selected');
  });
  updateSelectedCount();
}

// Install selected programs
async function installSelected() {
  if (selectedPrograms.size === 0) {
    updateStatus('Выберите программы для установки');
    return;
  }
  
  const programsToInstall = [];
  
  Object.values(PROGRAMS).forEach(category => {
    category.programs.forEach(program => {
      if (selectedPrograms.has(program.id)) {
        programsToInstall.push(program);
      }
    });
  });
  
  updateStatus(`Установка ${programsToInstall.length} программ...`);
  
  for (const program of programsToInstall) {
    await installProgram(program);
  }
  
  updateStatus('Установка завершена!');
  selectedPrograms.clear();
  updateSelectedCount();
}

// Install single program
async function installProgram(program) {
  installingPrograms.add(program.id);
  selectedPrograms.delete(program.id);
  
  const card = document.querySelector(`[data-program-id="${program.id}"]`);
  const statusElement = document.getElementById(`status-${program.id}`);
  
  if (card) {
    card.classList.remove('selected');
    card.classList.add('installing');
  }
  if (statusElement) {
    statusElement.textContent = 'Установка...';
  }
  
  try {
    const result = await window.electronAPI.installProgram(program);
    
    if (result.success) {
      installedPrograms.add(program.id);
      if (card) {
        card.classList.remove('installing');
        card.classList.add('installed');
      }
      if (statusElement) {
        statusElement.textContent = '✅ Установлено';
      }
    } else {
      if (card) {
        card.classList.remove('installing');
        card.classList.add('error');
      }
      if (statusElement) {
        statusElement.textContent = '❌ Ошибка';
      }
    }
  } catch (error) {
    console.error('Installation error:', error);
    if (card) {
      card.classList.remove('installing');
      card.classList.add('error');
    }
    if (statusElement) {
      statusElement.textContent = '❌ Ошибка';
    }
  } finally {
    installingPrograms.delete(program.id);
  }
}

// Uninstall program
async function uninstallProgram(program) {
  const card = document.querySelector(`[data-program-id="${program.id}"]`);
  const statusElement = document.getElementById(`status-${program.id}`);
  
  if (statusElement) {
    statusElement.textContent = 'Удаление...';
  }
  
  try {
    const result = await window.electronAPI.uninstallProgram(program);
    
    if (result.success) {
      installedPrograms.delete(program.id);
      if (card) {
        card.classList.remove('installed');
      }
      if (statusElement) {
        statusElement.textContent = '❌ Не установлено';
      }
    }
  } catch (error) {
    console.error('Uninstall error:', error);
  }
}

// Check installed programs
async function checkInstalledPrograms() {
  Object.values(PROGRAMS).forEach(category => {
    category.programs.forEach(async program => {
      try {
        const isInstalled = await window.electronAPI.checkInstalled(program.id);
        const statusElement = document.getElementById(`status-${program.id}`);
        const card = document.querySelector(`[data-program-id="${program.id}"]`);
        
        if (isInstalled) {
          installedPrograms.add(program.id);
          if (card) card.classList.add('installed');
          if (statusElement) statusElement.textContent = '✅ Установлено';
        } else {
          if (statusElement) statusElement.textContent = '❌ Не установлено';
        }
      } catch (error) {
        console.error('Check installation error:', error);
      }
    });
  });
}

// Update status bar
function updateStatus(message) {
  document.getElementById('statusText').textContent = message;
}

// Search functionality
function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    
    document.querySelectorAll('.program-card').forEach(card => {
      const programId = card.dataset.programId;
      let program = null;
      
      Object.values(PROGRAMS).forEach(category => {
        const found = category.programs.find(p => p.id === programId);
        if (found) program = found;
      });
      
      if (program) {
        const matches = program.name.toLowerCase().includes(query) ||
                       program.description.toLowerCase().includes(query);
        card.style.display = matches ? 'block' : 'none';
      }
    });
  });
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('selectAll').addEventListener('click', selectAll);
  document.getElementById('deselectAll').addEventListener('click', deselectAll);
  document.getElementById('installSelected').addEventListener('click', installSelected);
  
  // Context menu handlers
  document.getElementById('ctxSelect').addEventListener('click', () => {
    if (currentContextProgram) {
      const card = document.querySelector(`[data-program-id="${currentContextProgram.id}"]`);
      if (selectedPrograms.has(currentContextProgram.id)) {
        selectedPrograms.delete(currentContextProgram.id);
        if (card) card.classList.remove('selected');
      } else {
        selectedPrograms.add(currentContextProgram.id);
        if (card) card.classList.add('selected');
      }
      updateSelectedCount();
    }
    hideContextMenu();
  });
  
  document.getElementById('ctxInstall').addEventListener('click', async () => {
    if (currentContextProgram) {
      await installProgram(currentContextProgram);
    }
    hideContextMenu();
  });
  
  document.getElementById('ctxUninstall').addEventListener('click', async () => {
    if (currentContextProgram) {
      await uninstallProgram(currentContextProgram);
    }
    hideContextMenu();
  });
  
  // Hide context menu on click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-menu') && !e.target.closest('.program-card')) {
      hideContextMenu();
    }
  });
  
  setupSearch();
  
  // Listen for install progress
  window.electronAPI.onInstallProgress((data) => {
    updateStatus(data.message);
  });
}
