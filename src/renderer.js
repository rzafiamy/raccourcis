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
  alert('Settings saved!');
});

openSettings.addEventListener('click', (e) => {
  e.preventDefault();
  settingsModal.style.display = 'flex';
});

closeSettings.addEventListener('click', () => {
  settingsModal.style.display = 'none';
});

// Handle other sidebar clicks
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    if (item.id === 'openSettings') return;
    
    e.preventDefault();
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    
    const category = item.innerText.trim().toLowerCase();
    const cards = document.querySelectorAll('.shortcut-card');
    
    cards.forEach((card, index) => {
      const shortcut = shortcuts[index];
      if (!shortcut) return;
      
      // Basic filtering logic
      if (category === 'all shortcuts' || 
          (category === 'ai workflows' && shortcut.name.toLowerCase().includes('clipboard')) ||
          (category === 'favorites' && shortcut.id === 1)) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
    
    console.log(`Switched to: ${category}`);
  });
});

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

const shortcuts = [
  {
    id: 1,
    name: "Summarize Clipboard",
    icon: "fa-robot",
    color: "bg-purple",
    steps: [
      { type: "clipboard-read", title: "Get Clipboard", desc: "Retrieves text from system clipboard", icon: "fa-copy", color: "#BF5AF2" },
      { type: "ai-prompt", title: "AI Summarize", desc: "Generate a concise summary using LLM", icon: "fa-brain", color: "#FF375F", prompt: "Please summarize the following text concisely:" },
      { type: "notification", title: "Show Notification", desc: "Display summary as a popup", icon: "fa-bell", color: "#0A84FF" }
    ]
  },
  {
    id: 2,
    name: "Translate to French",
    icon: "fa-language",
    color: "bg-orange",
    steps: [
      { type: "clipboard-read", title: "Get Clipboard", desc: "Retrieves text for translation", icon: "fa-copy", color: "#FF9F0A" },
      { type: "ai-prompt", title: "AI Translate", desc: "Translate to French using AI", icon: "fa-globe", color: "#BF5AF2", prompt: "Please translate the following text to French:" },
      { type: "notification", title: "Show Result", desc: "Display translation", icon: "fa-bell", color: "#32D74B" }
    ]
  }
];

// Workflow execution simulator
async function runWorkflow(shortcut) {
  console.log(`Running workflow: ${shortcut.name}`);
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.style.zIndex = '1000';
  overlay.innerHTML = `
    <div class="modal-content" style="max-width: 500px; height: auto; padding: 40px; text-align: center;">
      <div class="shortcut-icon" style="font-size: 48px; margin-bottom: 20px;"><i class="fas ${shortcut.icon}"></i></div>
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
            context = await navigator.clipboard.readText();
            if (!context) throw new Error("Clipboard is empty.");
            break;
          case 'ai-prompt':
            context = await callAI(`${step.prompt}\n\n${context}`);
            outputEl.style.display = 'block';
            outputEl.innerText = context;
            break;
          case 'notification':
            new Notification(shortcut.name, { body: context });
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

function renderShortcuts() {
  shortcutGrid.innerHTML = '';
  shortcuts.forEach(shortcut => {
    const card = document.createElement('div');
    card.className = `shortcut-card ${shortcut.color}`;
    card.innerHTML = `
      <div class="shortcut-icon"><i class="fas ${shortcut.icon}"></i></div>
      <div class="shortcut-name">${shortcut.name}</div>
      <div class="shortcut-actions">
        <button class="action-btn edit-btn" title="Edit Workflow"><i class="fas fa-sliders"></i></button>
      </div>
    `;
    
    // Click on card runs the shortcut
    card.addEventListener('click', (e) => {
      if (e.target.closest('.edit-btn')) {
        e.stopPropagation();
        openEditor(shortcut);
      } else {
        runWorkflow(shortcut);
      }
    });

    shortcutGrid.appendChild(card);
  });
}

function openEditor(shortcut) {
  modalTitle.innerText = shortcut.name;
  workflowSteps.innerHTML = '';
  
  shortcut.steps.forEach(step => {
    const stepCard = document.createElement('div');
    stepCard.className = 'step-card';
    stepCard.innerHTML = `
      <div class="step-icon" style="background: ${step.color}"><i class="fas ${step.icon}"></i></div>
      <div class="step-info">
        <div class="step-title">${step.title}</div>
        <div class="step-desc">${step.desc}</div>
      </div>
      <i class="fas fa-chevron-right" style="color: var(--text-secondary); font-size: 12px;"></i>
    `;
    workflowSteps.appendChild(stepCard);
  });

  editorModal.style.display = 'flex';
}

closeModal.addEventListener('click', () => {
  editorModal.style.display = 'none';
});

// Simple search filter
document.querySelector('.search-container input').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const cards = document.querySelectorAll('.shortcut-card');
  cards.forEach((card, index) => {
    const name = shortcuts[index].name.toLowerCase();
    if (name.includes(query)) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
});

// Initial render
renderShortcuts();
console.log('Renderer initialized');
