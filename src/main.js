import './style.css';
import { calendar } from './calendar.js';
import { storage } from './storage.js';
import { members } from './members.js';
import { report } from './report.js';
import { teams } from './teams.js';
import { roulette } from './roulette.js';
import { points } from './points.js';

// State
let currentTeam = null;
let currentPassword = null;
let currentDate = new Date();
let selectedDateStr = null;
let currentWeekStart = null; // Se inicializa tras definir getWeekStart
let allMembers = [];
let allMoods = {};
let rouletteInitialized = false;
let currentPointsDate = new Date();
let weekStartDay = 1; // 0=Dom, 1=Lun, ..., 6=Sáb

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// DOM Elements - Teams
const teamOverlay = document.getElementById('teamOverlay');
const newTeamInput = document.getElementById('newTeamInput');
const newTeamPassword = document.getElementById('newTeamPassword');
const createTeamBtn = document.getElementById('createTeamBtn');
const existingTeamsList = document.getElementById('existingTeamsList');
const currentTeamDisplay = document.getElementById('currentTeamDisplay');
const changeTeamBtn = document.getElementById('changeTeamBtn');
const teamLoginStep = document.getElementById('teamLoginStep');
const memberSelectStep = document.getElementById('memberSelectStep');
const loginMemberSelect = document.getElementById('loginMemberSelect');
const enterTeamBtn = document.getElementById('enterTeamBtn');
const backToLoginBtn = document.getElementById('backToLoginBtn');

// DOM Elements - General
const userSelect = document.getElementById('userSelect');
const navTabs = document.querySelectorAll('.nav-tab');
const tabContents = document.querySelectorAll('.tab-content');

// DOM Elements - Calendar
const calendarGrid = document.getElementById('calendarGrid');
const currentMonthLabel = document.getElementById('currentMonth');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const happyCountEl = document.getElementById('happyCount');
const superHappyCountEl = document.getElementById('superHappyCount');
const neutralCountEl = document.getElementById('neutralCount');
const sadCountEl = document.getElementById('sadCount');
const superSadCountEl = document.getElementById('superSadCount');

// DOM Elements - Modal
const moodModal = document.getElementById('moodModal');
const modalDateLabel = document.getElementById('modalDate');
const closeModalBtn = document.getElementById('closeModal');
const moodOptions = document.querySelectorAll('.mood-option');

// DOM Elements - Report
const reportHeader = document.getElementById('reportHeader');
const reportEntries = document.getElementById('reportEntries');
const prevWeekBtn = document.getElementById('prevWeek');
const nextWeekBtn = document.getElementById('nextWeek');

// DOM Elements - Members
const membersListContainer = document.getElementById('membersList');
const newMemberInput = document.getElementById('newMemberName');
const addMemberBtn = document.getElementById('addMemberBtn');

// Helper: Obtener el inicio de semana según el día configurado
function getWeekStart(d, startDay = 1) {
  d = new Date(d);
  const day = d.getDay(); // 0=Dom
  const diff = ((day - startDay) + 7) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Logic: Tab Switching
function switchToTab(tabName) {
  const tab = document.querySelector(`.nav-tab[data-tab="${tabName}"]`);
  if (tab) {
    navTabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    const tabEl = document.getElementById(`${tab.dataset.tab}Tab`);
    if (tabEl) {
      tabContents.forEach(c => c.classList.remove('active'));
      tabEl.classList.add('active');
    }
    updateUI();
  }
}

navTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    switchToTab(tab.dataset.tab);
  });
});

function showMemberSelectionStep() {
  teamOverlay.classList.add('active');
  teamLoginStep.style.display = 'none';
  memberSelectStep.style.display = 'block';
  
  members.populateSelect(loginMemberSelect, allMembers);
  const savedMember = localStorage.getItem(`current_member_${currentTeam}`);
  if (savedMember && allMembers.includes(savedMember)) {
    loginMemberSelect.value = savedMember;
  }
}

async function updateUI() {
  if (!currentTeam || !currentPassword) {
    showTeamSelection();
    return;
  }

  // Attempt to sync (validates password)
  const fetchedMoods = await storage.getAll(currentTeam, currentPassword);
  
  if (fetchedMoods.error === 'Contraseña inválida' || fetchedMoods.error === 'No autorizado') {
    alert('Sesión expirada o contraseña inválida.');
    currentTeam = null;
    currentPassword = null;
    teams.clearCurrent();
    showTeamSelection();
    return;
  }

  currentTeamDisplay.textContent = currentTeam;
  allMoods = fetchedMoods;

  allMembers = await members.getAll(currentTeam, currentPassword);
  members.populateSelect(userSelect, allMembers);
  
  // Si hay miembros en el equipo, pero no tenemos un integrante guardado en localStorage, mostramos el paso de selección
  const savedMember = localStorage.getItem(`current_member_${currentTeam}`);
  if (allMembers.length > 0 && (!savedMember || !allMembers.includes(savedMember))) {
    showMemberSelectionStep();
    return;
  }

  if (savedMember && allMembers.includes(savedMember)) {
    userSelect.value = savedMember;
  }

  teamOverlay.classList.remove('active');
  
  const activeTab = document.querySelector('.nav-tab.active').dataset.tab;
  
  if (activeTab === 'calendar') {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    currentMonthLabel.textContent = `${monthNames[month]} ${year}`;
    
    calendar.render(calendarGrid, year, month, allMoods, (y, m, d) => {
      selectedDateStr = `${y}-${m}-${d}`;
      modalDateLabel.textContent = `${d} de ${monthNames[m]}, ${y}`;
      moodModal.classList.add('active');
    }, weekStartDay);
    updateStats(allMoods);
  } 
  else if (activeTab === 'report') {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const fmt = (d) => `${d.getDate()} ${monthNames[d.getMonth()]}`;
    document.getElementById('reportWeekLabel').textContent =
      `Semana: ${fmt(currentWeekStart)} — ${fmt(weekEnd)} ${weekEnd.getFullYear()}`;
    report.renderWeekly(reportHeader, reportEntries, allMembers, allMoods, currentWeekStart, weekStartDay);
  }
  else if (activeTab === 'members') {
    members.renderList(membersListContainer, allMembers, async (name) => {
      await members.remove(currentTeam, currentPassword, name);
      updateUI();
    });
  }
  else if (activeTab === 'roulette') {
    const canvasEl = document.getElementById('rouletteCanvas');
    const winnerDisplay = document.getElementById('winnerDisplay');
    const winnerName = document.getElementById('winnerName');
    const spinBtnEl = document.getElementById('spinBtn');
    if (!rouletteInitialized) {
      rouletteInitialized = true;
      winnerDisplay.style.display = 'none';
      spinBtnEl.disabled = false;
      spinBtnEl.textContent = '🎰 ¡Girar!';
      const sorted = [...allMembers].sort((a, b) => a.localeCompare(b, 'es'));
      roulette.init(canvasEl, sorted, (winner) => {
        winnerName.textContent = winner;
        winnerDisplay.style.display = 'flex';
        winnerDisplay.classList.add('winner-pop');
        setTimeout(() => winnerDisplay.classList.remove('winner-pop'), 600);
        setTimeout(() => {
          updateRouletteCounter();
          if (roulette.membersList.length === 0) {
            spinBtnEl.disabled = true;
            spinBtnEl.textContent = '🏆 ¡Todos elegidos!';
          } else {
            spinBtnEl.disabled = false;
            spinBtnEl.textContent = '🎰 ¡Girar de nuevo!';
          }
        }, 1400);
      });
    } else {
      roulette.canvas = canvasEl;
      roulette.ctx = canvasEl.getContext('2d');
      roulette.draw();
    }
    updateRouletteCounter();
  }
  else if (activeTab === 'points') {
    await renderPointsTab();
  }
}

async function renderPointsTab() {
  const y = currentPointsDate.getFullYear();
  const m = currentPointsDate.getMonth();
  const monthKey = `${y}-${m + 1}`;
  const container = document.getElementById('rankingContainer');
  // Mostrar mes en el header de la sección
  document.querySelector('#pointsTab .current-month').textContent =
    `🏅 Ranking — ${monthNames[m]} ${y}`;
  const pointsData = await points.getMonth(currentTeam, currentPassword, monthKey);
  points.renderRanking(container, allMembers, pointsData, monthKey, async (member, delta) => {
    await points.add(currentTeam, currentPassword, member, monthKey, delta);
    await renderPointsTab();
  });
}

// Event Listeners - Points month navigation
document.getElementById('prevPointsMonth').addEventListener('click', () => {
  currentPointsDate.setMonth(currentPointsDate.getMonth() - 1);
  renderPointsTab();
});
document.getElementById('nextPointsMonth').addEventListener('click', () => {
  currentPointsDate.setMonth(currentPointsDate.getMonth() + 1);
  renderPointsTab();
});

function updateStats(allMoods) {
  const stats = { 'super-happy': 0, 'happy': 0, 'neutral': 0, 'sad': 0, 'super-sad': 0 };
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  Object.keys(allMoods).forEach(dateStr => {
    const [dYear, dMonth] = dateStr.split('-').map(Number);
    if (dYear === year && dMonth === month) {
      Object.values(allMoods[dateStr]).forEach(mood => {
        if (stats[mood] !== undefined) stats[mood]++;
      });
    }
  });

  superHappyCountEl.textContent = stats['super-happy'];
  happyCountEl.textContent = stats['happy'];
  neutralCountEl.textContent = stats['neutral'];
  sadCountEl.textContent = stats['sad'];
  superSadCountEl.textContent = stats['super-sad'];
}

// Logic: Team Selection
async function showTeamSelection() {
  teamOverlay.classList.add('active');
  teamLoginStep.style.display = 'block';
  memberSelectStep.style.display = 'none';
  const allTeams = await teams.getAll();
  existingTeamsList.innerHTML = '';
  
  allTeams.forEach(teamName => {
    const badge = document.createElement('div');
    badge.className = 'team-badge';
    badge.textContent = teamName;
    badge.addEventListener('click', () => {
      newTeamInput.value = teamName;
      newTeamPassword.focus();
    });
    existingTeamsList.appendChild(badge);
  });
}

createTeamBtn.addEventListener('click', async () => {
  const name = newTeamInput.value.trim();
  const password = newTeamPassword.value.trim();
  
  if (!name || !password) return alert('Nombre y contraseña son obligatorios.');
  
  const result = await teams.authenticate(name, password);
  
  if (result.success) {
    currentTeam = name;
    currentPassword = password;
    teams.setCurrent(name, password);
    newTeamInput.value = '';
    newTeamPassword.value = '';
    
    // Obtener miembros del equipo para decidir si mostrar selección o ir directamente a creación
    allMembers = await members.getAll(currentTeam, currentPassword);
    
    if (result.isNew || allMembers.length === 0) {
      // Equipo nuevo o sin integrantes: ir directo a la pestaña de miembros
      teamOverlay.classList.remove('active');
      switchToTab('members');
      alert('¡Equipo creado / ingresado con éxito! Por favor, agrega al menos un integrante para comenzar.');
    } else {
      // Equipo existente con integrantes: mostrar el paso de seleccionar integrante
      showMemberSelectionStep();
    }
  } else {
    alert('Contraseña incorrecta o error al crear el equipo.');
  }
});

changeTeamBtn.addEventListener('click', () => {
  if (currentTeam) {
    localStorage.removeItem(`current_member_${currentTeam}`);
  }
  currentTeam = null;
  currentPassword = null;
  teams.clearCurrent();
  showTeamSelection();
});

// Event Listeners - Paso 2 del Login y selección de usuario
enterTeamBtn.addEventListener('click', () => {
  const selectedMember = loginMemberSelect.value;
  if (!selectedMember) return alert('Por favor, selecciona un integrante.');
  
  localStorage.setItem(`current_member_${currentTeam}`, selectedMember);
  userSelect.value = selectedMember;
  
  // Resetear pantallas para el siguiente inicio de sesión
  teamLoginStep.style.display = 'block';
  memberSelectStep.style.display = 'none';
  
  teamOverlay.classList.remove('active');
  updateUI();
});

backToLoginBtn.addEventListener('click', () => {
  teamLoginStep.style.display = 'block';
  memberSelectStep.style.display = 'none';
});

userSelect.addEventListener('change', () => {
  if (currentTeam) {
    localStorage.setItem(`current_member_${currentTeam}`, userSelect.value);
  }
});

// Event Listeners - Calendar
prevMonthBtn.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  updateUI();
});

nextMonthBtn.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  updateUI();
});

const weekStartSelect = document.getElementById('weekStartSelect');
weekStartSelect.addEventListener('change', () => {
  weekStartDay = Number(weekStartSelect.value);
  document.getElementById('reportWeekStartSelect').value = weekStartDay;
  currentWeekStart = getWeekStart(new Date(), weekStartDay);
  updateUI();
});

// Event Listeners - Modal
closeModalBtn.addEventListener('click', () => moodModal.classList.remove('active'));

moodOptions.forEach(option => {
  option.addEventListener('click', async () => {
    const mood = option.dataset.mood;
    const member = userSelect.value;
    if (!member) return alert('Por favor, selecciona un integrante primero.');
    
    await storage.saveMood(currentTeam, currentPassword, selectedDateStr, member, mood);
    moodModal.classList.remove('active');
    updateUI();
  });
});

// Event Listeners - Report
prevWeekBtn.addEventListener('click', () => {
  currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  updateUI();
});

nextWeekBtn.addEventListener('click', () => {
  currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  updateUI();
});

const reportWeekStartSelect = document.getElementById('reportWeekStartSelect');
reportWeekStartSelect.addEventListener('change', () => {
  weekStartDay = Number(reportWeekStartSelect.value);
  // Sincronizar el otro selector
  document.getElementById('weekStartSelect').value = weekStartDay;
  currentWeekStart = getWeekStart(new Date(), weekStartDay);
  updateUI();
});

// Event Listeners - Members
addMemberBtn.addEventListener('click', async () => {
  const name = newMemberInput.value.trim();
  if (name) {
    await members.add(currentTeam, currentPassword, name);
    newMemberInput.value = '';
    updateUI();
  }
});

// Event Listeners - Roulette
const spinBtn = document.getElementById('spinBtn');
spinBtn.addEventListener('click', () => {
  if (roulette.spinning || roulette.membersList.length === 0) return;
  document.getElementById('winnerDisplay').style.display = 'none';
  roulette.spin();
  spinBtn.disabled = true;
  spinBtn.textContent = '⏳ Girando...';
});

const resetRouletteBtn = document.getElementById('resetRouletteBtn');
resetRouletteBtn.addEventListener('click', () => {
  rouletteInitialized = false;
  document.getElementById('winnerDisplay').style.display = 'none';
  spinBtn.disabled = false;
  spinBtn.textContent = '🎰 ¡Girar!';
  updateUI();
});

function updateRouletteCounter() {
  const counter = document.getElementById('rouletteCounter');
  if (!counter) return;
  const remaining = roulette.membersList.length;
  const total = roulette.originalMembers.length;
  if (total === 0) { counter.textContent = ''; return; }
  counter.textContent = `${remaining} de ${total} participantes restantes`;
}

// ── Exportar CSV ────────────────────────────────────────────────────────────
const MOOD_LABELS = {
  'super-happy': 'Muy Feliz',
  'happy':       'Feliz',
  'neutral':     'Normal',
  'sad':         'Mal',
  'super-sad':   'Muy Mal',
};

function csvCell(value) {
  // Envuelve en comillas si contiene coma, comilla o salto de línea
  const str = String(value ?? '');
  return str.includes(',') || str.includes('"') || str.includes('\n')
    ? `"${str.replace(/"/g, '""')}"`
    : str;
}

function downloadCSV() {
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const sortedMembers = [...allMembers].sort((a, b) => a.localeCompare(b, 'es'));

  // Encabezado
  const header = ['Fecha', 'Día', ...sortedMembers].map(csvCell).join(',');

  // Días del mes
  const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const rows = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr  = `${year}-${month}-${day}`;
    const dateObj  = new Date(year, month, day);
    const dateLabel = `${String(day).padStart(2,'0')}/${String(month + 1).padStart(2,'0')}/${year}`;
    const dayName  = DAY_NAMES[dateObj.getDay()];
    const dayData  = allMoods[dateStr] || {};
    const cells    = [dateLabel, dayName, ...sortedMembers.map(m => MOOD_LABELS[dayData[m]] || '')];
    rows.push(cells.map(csvCell).join(','));
  }

  const csv  = [header, ...rows].join('\r\n');
  // BOM UTF-8 para que Excel abra correctamente con tildes y ñ
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `NikoNiko_${currentTeam}_${monthNames[month]}_${year}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

document.getElementById('downloadCsvBtn').addEventListener('click', downloadCSV);

// Auto-refresh
setInterval(updateUI, 30000);

// Initialize
const saved = teams.getCurrent();
currentTeam = saved.team;
currentPassword = saved.password;
currentWeekStart = getWeekStart(new Date(), weekStartDay);
updateUI();
console.log('Calendario Niko-Niko Multiequipo Seguro Inicializado');
