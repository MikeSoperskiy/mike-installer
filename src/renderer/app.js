// State management
let selectedPrograms = new Set();
let installedPrograms = new Set();
let installingPrograms = new Set();

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadCustomPrograms();
  renderCategories();
  setupEventListeners();
  // Disabled - causes errors with new download system
  // checkInstalledPrograms();
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
    <div class="program-status" id="status-${program.id}"></div>
  `;
  
  card.addEventListener('click', () => toggleProgramSelection(program.id));
  
  return card;
}

// Toggle program selection
function toggleProgramSelection(programId) {
  if (installingPrograms.has(programId) || installedPrograms.has(programId)) {
    return;
  }
  
  const card = document.querySelector(`[data-program-id="${programId}"]`);
  
  if (selectedPrograms.has(programId)) {
    selectedPrograms.delete(programId);
    card.classList.remove('selected');
  } else {
    selectedPrograms.add(programId);
    card.classList.add('selected');
  }
  
  updateSelectedCount();
}

// Update selected count
function updateSelectedCount() {
  document.getElementById('selectedCount').textContent = `Выбрано: ${selectedPrograms.size}`;
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

// Check installed programs - disabled
async function checkInstalledPrograms() {
  // Disabled to avoid errors with path checking
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

// Modal functionality
function setupModal() {
  const modal = document.getElementById('customModal');
  const addBtn = document.getElementById('addCustom');
  const closeBtn = document.querySelector('.close');
  const form = document.getElementById('customProgramForm');
  
  addBtn.addEventListener('click', () => {
    modal.style.display = 'block';
  });
  
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const programData = {
      name: document.getElementById('customName').value,
      wingetId: document.getElementById('customWingetId').value,
      category: document.getElementById('customCategory').value,
      description: document.getElementById('customDescription').value
    };
    
    addCustomProgram(programData);
    renderCategories();
    
    form.reset();
    modal.style.display = 'none';
    
    updateStatus(`Добавлена программа: ${programData.name}`);
  });
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('selectAll').addEventListener('click', selectAll);
  document.getElementById('deselectAll').addEventListener('click', deselectAll);
  document.getElementById('installSelected').addEventListener('click', installSelected);
  
  setupSearch();
  setupModal();
  
  // Listen for install progress
  window.electronAPI.onInstallProgress((data) => {
    updateStatus(data.message);
  });
}
