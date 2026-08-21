const DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const EMOJI_MAP = {
  'legendary':   '🦸',
  'super-happy': '🤩',
  'happy':       '😊',
  'neutral':     '😐',
  'productive':  '💪',
  'zen':         '🧘',
  'sad':         '☹️',
  'chaos':       '🤯',
  'meetings':    '🥱',
  'super-sad':   '😫',
  'caca':        '💩',
};

const MOOD_LABELS = {
  'legendary':   'Legendario',
  'super-happy': 'Muy Feliz',
  'happy':       'Feliz',
  'neutral':     'Normal',
  'productive':  'Productivo',
  'zen':         'Modo Zen',
  'sad':         'Mal',
  'chaos':       'Caos Total',
  'meetings':    'Reuniones',
  'super-sad':   'Muy Mal',
  'caca':        'Día Caca',
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const report = {
  // weekStartDay: 0=Dom, 1=Lun, ..., 6=Sáb
  renderWeekly(headerRow, bodyContainer, membersList, allMoods, startDate, weekStartDay = 1) {
    headerRow.innerHTML = '<th>Integrante</th>';
    bodyContainer.innerHTML = '';

    const dateObjects = [];

    // Encabezados: 7 días desde startDate
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dateObjects.push(date);

      const th = document.createElement('th');
      const dayLabel = DAY_NAMES_SHORT[date.getDay()];
      th.innerHTML = `${dayLabel}<br><small>${date.getDate()}/${date.getMonth() + 1}</small>`;
      headerRow.appendChild(th);
    }

    // Filas por miembro
    membersList.forEach(member => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><strong>${member}</strong></td>`;

      dateObjects.forEach(date => {
        const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        const rawEntry = allMoods[dateStr] ? allMoods[dateStr][member] : null;
        const entry = typeof rawEntry === 'string' ? { mood: rawEntry, comment: '' } : rawEntry;

        const td = document.createElement('td');
        if (entry?.mood) {
          const label = MOOD_LABELS[entry.mood] || entry.mood;
          const tooltip = entry.comment ? `${label}: ${entry.comment}` : label;
          const badge = entry.comment ? '<span class="comment-badge" title="Con reseña">💬</span>' : '';
          td.innerHTML = `<div class="report-cell-mood cell-${entry.mood}" title="${escapeHtml(tooltip)}">${EMOJI_MAP[entry.mood]}${badge}</div>`;
        } else {
          td.innerHTML = `<div class="report-cell-mood" style="opacity: 0.1">?</div>`;
        }
        tr.appendChild(td);
      });

      bodyContainer.appendChild(tr);
    });
  }
};
