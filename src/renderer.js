const shortcutGrid = document.getElementById('shortcutGrid');
const editorModal = document.getElementById('editorModal');
const closeModal = document.getElementById('closeModal');
const modalTitle = document.getElementById('modalTitle');
const workflowSteps = document.getElementById('workflowSteps');

// Settings Elements
const settingsModal = document.getElementById('settingsModal');
const openSettings = document.getElementById('openSettings');
const closeSettings = document.getElementById('closeSettings');
const saveSettings = document.getElementById('saveSettings');
const aiBaseUrl = document.getElementById('aiBaseUrl');
const aiApiKey = document.getElementById('aiApiKey');
const aiModel = document.getElementById('aiModel');

// Window Controls
const winClose = document.getElementById('winClose');
const winMinimize = document.getElementById('winMinimize');
const winMaximize = document.getElementById('winMaximize');

winClose.onclick = () => {
  console.log('Close clicked');
  window.ipcRenderer.send('window-close');
};
winMinimize.onclick = () => {
  console.log('Minimize clicked');
  window.ipcRenderer.send('window-minimize');
};
winMaximize.onclick = () => {
  console.log('Maximize clicked');
  window.ipcRenderer.send('window-maximize');
};

// Custom Dialog System
const dialogModal = document.getElementById('dialogModal');
const dialogIcon = document.getElementById('dialogIcon');
const dialogTitle = document.getElementById('dialogTitle');
const dialogMessage = document.getElementById('dialogMessage');
const dialogConfirm = document.getElementById('dialogConfirm');
const dialogCancel = document.getElementById('dialogCancel');

function showCustomDialog({ title, message, icon = 'info', type = 'alert' }) {
  return new Promise((resolve) => {
    dialogTitle.innerText = title;
    dialogMessage.innerText = message;
    
    // Set Icon
    let iconHtml = '<i data-lucide="info"></i>';
    if (icon === 'warning') iconHtml = '<i data-lucide="alert-triangle" style="color: var(--accent-orange)"></i>';
    if (icon === 'error') iconHtml = '<i data-lucide="x-circle" style="color: var(--accent-pink)"></i>';
    if (icon === 'question') iconHtml = '<i data-lucide="help-circle" style="color: var(--accent-blue)"></i>';
    dialogIcon.innerHTML = iconHtml;

    if (window.lucide) lucide.createIcons();

    dialogCancel.style.display = type === 'confirm' ? 'block' : 'none';
    dialogModal.style.display = 'flex';

    const handleConfirm = () => {
      dialogModal.style.display = 'none';
      cleanup();
      resolve(true);
    };

    const handleCancel = () => {
      dialogModal.style.display = 'none';
      cleanup();
      resolve(false);
    };

    const cleanup = () => {
      dialogConfirm.removeEventListener('click', handleConfirm);
      dialogCancel.removeEventListener('click', handleCancel);
    };

    dialogConfirm.addEventListener('click', handleConfirm);
    dialogCancel.addEventListener('click', handleCancel);
  });
}

// State Management
let currentCategory = 'all';
const mainTitle = document.querySelector('.header h1');

// Load shortcuts from localStorage or use defaults
const defaultShortcuts = [
  {
    id: 1,
    name: "Summarize Clipboard",
    icon: "bot",
    color: "bg-purple",
    category: "ai",
    favorite: true,
    steps: [
      { type: "clipboard-read", title: "Get Clipboard", desc: "Retrieves text from system clipboard", icon: "clipboard", color: "#BF5AF2" },
      { type: "ai-prompt", title: "AI Summarize", desc: "Generate a concise summary using LLM", icon: "brain-circuit", color: "#FF375F", prompt: "Please summarize the following text concisely:" },
      { type: "notification", title: "Show Notification", desc: "Display summary as a popup", icon: "bell", color: "#0A84FF" }
    ]
  },
  {
    id: 2,
    name: "Translate to French",
    icon: "languages",
    color: "bg-orange",
    category: "ai",
    favorite: false,
    steps: [
      { type: "clipboard-read", title: "Get Clipboard", desc: "Retrieves text for translation", icon: "clipboard", color: "#FF9F0A" },
      { type: "ai-prompt", title: "AI Translate", desc: "Translate to French using AI", icon: "globe", color: "#BF5AF2", prompt: "Please translate the following text to French:" },
      { type: "notification", title: "Show Result", desc: "Display translation", icon: "bell", color: "#32D74B" }
    ]
  },
  {
    id: 3,
    name: "Daily Overview",
    icon: "sun",
    color: "bg-blue",
    category: "personal",
    favorite: true,
    steps: [
      { type: "notification", title: "Good Morning", desc: "Start your day with a greeting", icon: "sun", color: "#0A84FF" },
      { type: "wait", title: "Wait 1s", desc: "Pause for dramatic effect", icon: "timer", color: "#8E8E93" }
    ]
  }
];

let shortcuts = JSON.parse(localStorage.getItem('raccourci_shortcuts')) || defaultShortcuts;

// Save shortcuts utility
function saveShortcuts() {
  localStorage.setItem('raccourci_shortcuts', JSON.stringify(shortcuts));
}


// Load settings
const config = JSON.parse(localStorage.getItem('raccourci_config') || '{"baseUrl":"https://api.openai.com/v1","apiKey":"","model":"gpt-4-turbo"}');
aiBaseUrl.value = config.baseUrl;
aiApiKey.value = config.apiKey;
aiModel.value = config.model;

saveSettings.addEventListener('click', () => {
  const newConfig = {
    baseUrl: aiBaseUrl.value,
    apiKey: aiApiKey.value,
    model: aiModel.value
  };
  localStorage.setItem('raccourci_config', JSON.stringify(newConfig));
  settingsModal.style.display = 'none';
});

openSettings.addEventListener('click', (e) => {
  e.preventDefault();
  settingsModal.style.display = 'flex';
});

closeSettings.addEventListener('click', () => {
  settingsModal.style.display = 'none';
});

// Handle Sidebar clicks
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    if (item.id === 'openSettings') return;
    
    e.preventDefault();
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    
    currentCategory = item.getAttribute('data-category');
    mainTitle.innerText = item.querySelector('span').innerText;
    
    filterShortcuts();
  });
});

function filterShortcuts() {
    const query = document.querySelector('.search-container input').value.toLowerCase();
    const cards = document.querySelectorAll('.shortcut-card');
    
    cards.forEach((card, index) => {
      const shortcut = shortcuts[index];
      if (!shortcut) return;
      
      const matchesSearch = shortcut.name.toLowerCase().includes(query);
      let matchesCategory = false;

      if (currentCategory === 'all') matchesCategory = true;
      else if (currentCategory === 'favorites') matchesCategory = shortcut.favorite;
      else if (currentCategory === 'ai') matchesCategory = (shortcut.category === 'ai');
      else if (currentCategory === 'personal') matchesCategory = (shortcut.category === 'personal');
      else if (currentCategory === 'recent') matchesCategory = true; // Placeholder for now

      if (matchesSearch && matchesCategory) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });

    if (window.lucide) lucide.createIcons();
}

async function callAI(prompt, systemPrompt = "You are a helpful assistant.") {
  const setting = JSON.parse(localStorage.getItem('raccourci_config'));
  if (!setting || !setting.apiKey) {
    throw new Error("Please configure your API Key in Settings first.");
  }

  const response = await fetch(`${setting.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${setting.apiKey}`
    },
    body: JSON.stringify({
      model: setting.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "AI Request failed");
  }

  const data = await response.json();
  return data.choices[0].message.content;
}


// Workflow execution simulator
async function runWorkflow(shortcut) {
  console.log(`Running workflow: ${shortcut.name}`);
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.style.zIndex = '1000';
  overlay.innerHTML = `
    <div class="modal-content" style="max-width: 500px; height: auto; padding: 40px; text-align: center;">
      <div class="shortcut-icon" style="font-size: 48px; margin-bottom: 20px;"><i data-lucide="${shortcut.icon}"></i></div>
      <h3 style="margin-bottom: 20px;">Running ${shortcut.name}...</h3>
      <div id="executionStatus" style="color: var(--text-secondary); margin-bottom: 20px;">Initializing steps...</div>
      <div style="width: 100%; height: 4px; background: var(--card-bg); border-radius: 2px; overflow: hidden; margin-bottom: 20px;">
        <div id="progressBar" style="width: 0%; height: 100%; background: var(--accent-blue); transition: width 0.3s ease;"></div>
      </div>
      <div id="executionOutput" style="text-align: left; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 12px; font-size: 14px; max-height: 200px; overflow-y: auto; display: none; color: var(--text-secondary);"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const statusEl = overlay.querySelector('#executionStatus');
  const progressEl = overlay.querySelector('#progressBar');
  const outputEl = overlay.querySelector('#executionOutput');

  let context = ""; // This passes data between steps

  try {
    for (let i = 0; i < shortcut.steps.length; i++) {
        const step = shortcut.steps[i];
        statusEl.innerText = `Executing: ${step.title}`;
        progressEl.style.width = `${((i + 1) / shortcut.steps.length) * 100}%`;
        
        switch(step.type) {
          case 'clipboard-read':
            context = await window.ipcRenderer.clipboard.readText();
            if (!context) throw new Error("Clipboard is empty.");
            break;
          case 'clipboard-write':
            await window.ipcRenderer.clipboard.writeText(context);
            break;
          case 'url-open':
            // Logic handled via preload bridge if possible, or just window.open
            window.open(step.url || context);
            break;
          case 'ai-prompt':
            context = await callAI(`${step.prompt}\n\n${context}`);
            outputEl.style.display = 'block';
            outputEl.innerText = context;
            break;
          case 'notification':
            if (Notification.permission === 'granted') {
                new Notification(shortcut.name, { body: context || step.desc });
            } else {
                showCustomDialog({ title: shortcut.name, message: context || step.desc, icon: 'info' });
            }
            break;
          case 'wait':
            await new Promise(resolve => setTimeout(resolve, step.duration || 1000));
            break;
          default:
            await new Promise(resolve => setTimeout(resolve, 800)); // Standard simulation
        }
      }
    
      statusEl.innerText = 'Completed successfully!';
      statusEl.style.color = 'var(--accent-green)';
  } catch (err) {
    statusEl.innerText = `Error: ${err.message}`;
    statusEl.style.color = 'var(--accent-pink)';
    console.error(err);
  }

  await new Promise(resolve => setTimeout(resolve, 2000));
  overlay.remove();
}

let currentEditingShortcut = null;

function renderShortcuts() {
  shortcutGrid.innerHTML = '';
  
  // Add Shortcuts
  shortcuts.forEach(shortcut => {
    const card = document.createElement('div');
    card.className = `shortcut-card ${shortcut.color}`;
    card.innerHTML = `
      <div class="shortcut-icon"><i data-lucide="${shortcut.icon}"></i></div>
      <div class="shortcut-name">${shortcut.name}</div>
      <div class="shortcut-actions">
        <button class="action-btn delete-btn" title="Delete"><i data-lucide="trash-2"></i></button>
        <button class="action-btn edit-btn" title="Edit Workflow"><i data-lucide="sliders"></i></button>
      </div>
    `;
    
    // Check if it belongs to current category
    const matchesCategory = (currentCategory === 'all' || 
                             (currentCategory === 'favorites' && shortcut.favorite) ||
                             (currentCategory === 'ai' && shortcut.category === 'ai') ||
                             (currentCategory === 'personal' && shortcut.category === 'personal'));

    if (matchesCategory) {
        card.style.display = 'flex';
    } else {
        card.style.display = 'none';
    }

    // Click on card runs the shortcut
    card.addEventListener('click', (e) => {
      if (e.target.closest('.edit-btn')) {
        e.stopPropagation();
        openEditor(shortcut);
      } else if (e.target.closest('.delete-btn')) {
        e.stopPropagation();
        showCustomDialog({ 
            title: 'Delete Shortcut', 
            message: `Are you sure you want to delete "${shortcut.name}"?`, 
            icon: 'warning', 
            type: 'confirm' 
        }).then(confirmed => {
            if (confirmed) {
                shortcuts = shortcuts.filter(s => s.id !== shortcut.id);
                saveShortcuts();
                renderShortcuts();
            }
        });
      } else {
        runWorkflow(shortcut);
      }
    });

    shortcutGrid.appendChild(card);
  });

  if (window.lucide) lucide.createIcons();

  // Add "New Shortcut" card
  if (currentCategory === 'all' || currentCategory === 'personal') {
    const newCard = document.createElement('div');
    newCard.className = 'shortcut-card';
    newCard.style.background = 'var(--card-bg)';
    newCard.style.border = '2px dashed var(--border-color)';
    newCard.style.justifyContent = 'center';
    newCard.style.alignItems = 'center';
    newCard.innerHTML = `
      <div class="shortcut-icon" style="margin-bottom: 0;"><i class="fas fa-plus"></i></div>
      <div class="shortcut-name" style="margin-top: 10px; opacity: 0.7;">New Shortcut</div>
    `;
    newCard.addEventListener('click', () => {
      openEditor(null);
    });
    shortcutGrid.appendChild(newCard);
  }
}

function openEditor(shortcut) {
  currentEditingShortcut = shortcut ? { ...shortcut } : {
    id: Date.now(),
    name: "New Shortcut",
    icon: "rocket",
    color: "bg-blue",
    category: "personal",
    favorite: false,
    steps: []
  };

  modalTitle.innerHTML = `<input type="text" id="editShortcutName" value="${currentEditingShortcut.name}" style="background: none; border: none; color: white; font-size: inherit; font-weight: inherit; outline: none; width: 100%;">`;
  
  const nameInput = document.getElementById('editShortcutName');
  nameInput.addEventListener('input', (e) => {
    currentEditingShortcut.name = e.target.value;
  });

  // Color Picker Logic
  const swatches = document.querySelectorAll('.color-swatch');
  swatches.forEach(swatch => {
    swatch.classList.toggle('active', swatch.getAttribute('data-color') === currentEditingShortcut.color);
    swatch.onclick = () => {
      swatches.forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      currentEditingShortcut.color = swatch.getAttribute('data-color');
    };
  });

  // Favorite Toggle
  const favCheckbox = document.getElementById('editFavorite');
  favCheckbox.checked = currentEditingShortcut.favorite;
  favCheckbox.onchange = (e) => {
    currentEditingShortcut.favorite = e.target.checked;
  };

  renderEditorSteps();
  editorModal.style.display = 'flex';
}

function renderEditorSteps() {
  workflowSteps.innerHTML = '';
  
  if (currentEditingShortcut.steps.length === 0) {
    workflowSteps.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">No actions added yet.</div>';
  }

  currentEditingShortcut.steps.forEach((step, index) => {
    const stepCard = document.createElement('div');
    stepCard.className = 'step-card';
    stepCard.innerHTML = `
      <div class="step-icon" style="background: ${step.color}"><i data-lucide="${step.icon}"></i></div>
      <div class="step-info">
        <div class="step-title">${step.title}</div>
        <div class="step-desc">${step.desc}</div>
      </div>
      <button class="action-btn remove-step-btn" data-index="${index}" style="background: none; opacity: 0.5;"><i data-lucide="x"></i></button>
    `;
    
    stepCard.querySelector('.remove-step-btn').addEventListener('click', () => {
        currentEditingShortcut.steps.splice(index, 1);
        renderEditorSteps();
    });

    workflowSteps.appendChild(stepCard);
  });

  if (window.lucide) lucide.createIcons();
}

const actionPickerModal = document.getElementById('actionPickerModal');
const closeActionPicker = document.getElementById('closeActionPicker');
const actionList = document.getElementById('actionList');

const availableActions = [
  { type: "clipboard-read", title: "Read Clipboard", desc: "Get text from system clipboard", icon: "clipboard", color: "#BF5AF2" },
  { type: "clipboard-write", title: "Write Clipboard", desc: "Copy text to system clipboard", icon: "clipboard-check", color: "#32D74B" },
  { type: "ai-prompt", title: "AI Ask", desc: "Send prompt to LLM", icon: "brain-circuit", color: "#FF375F", prompt: "Explain this:" },
  { type: "notification", title: "Notification", desc: "Show a system popup", icon: "bell", color: "#0A84FF" },
  { type: "url-open", title: "Open URL", desc: "Open a website in browser", icon: "link", color: "#5E5CE6", url: "https://google.com" },
  { type: "wait", title: "Wait", desc: "Pause for some time", icon: "timer", color: "#8E8E93", duration: 1000 }
];

function renderActionPicker() {
  actionList.innerHTML = '';
  availableActions.forEach(action => {
    const card = document.createElement('div');
    card.className = 'step-card';
    card.style.cursor = 'pointer';
    card.innerHTML = `
      <div class="step-icon" style="background: ${action.color}"><i data-lucide="${action.icon}"></i></div>
      <div class="step-info">
        <div class="step-title">${action.title}</div>
        <div class="step-desc">${action.desc}</div>
      </div>
    `;
    card.addEventListener('click', () => {
      currentEditingShortcut.steps.push({ ...action });
      renderEditorSteps();
      actionPickerModal.style.display = 'none';
    });
    actionList.appendChild(card);
  });
  if (window.lucide) lucide.createIcons();
}

// Add Step button opens Picker
document.getElementById('addStep').addEventListener('click', () => {
  renderActionPicker();
  actionPickerModal.style.display = 'flex';
});

closeActionPicker.addEventListener('click', () => {
  actionPickerModal.style.display = 'none';
});

// Modal Actions (Save/Run)
const modalFooter = editorModal.querySelector('.modal-footer') || editorModal.querySelector('.modal-header:last-child');
const [runBtn, saveBtn] = modalFooter.querySelectorAll('button');

runBtn.addEventListener('click', () => {
  runWorkflow(currentEditingShortcut);
});

saveBtn.addEventListener('click', () => {
  const index = shortcuts.findIndex(s => s.id === currentEditingShortcut.id);
  if (index !== -1) {
    shortcuts[index] = currentEditingShortcut;
  } else {
    shortcuts.push(currentEditingShortcut);
  }
  saveShortcuts();
  renderShortcuts();
  editorModal.style.display = 'none';
});

closeModal.addEventListener('click', () => {
  editorModal.style.display = 'none';
});

// Centralized search filter
document.querySelector('.search-container input').addEventListener('input', () => {
  filterShortcuts();
});

// Initial render and setup
if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission();
}
renderShortcuts();
if (window.lucide) lucide.createIcons();
console.log('Renderer initialized');
