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
        const mood = allMoods[dateStr] ? allMoods[dateStr][member] : null;

        const td = document.createElement('td');
        if (mood) {
          td.innerHTML = `<div class="report-cell-mood cell-${mood}" title="${MOOD_LABELS[mood] || mood}">${EMOJI_MAP[mood]}</div>`;
        } else {
          td.innerHTML = `<div class="report-cell-mood" style="opacity: 0.1">?</div>`;
        }
        tr.appendChild(td);
      });

      bodyContainer.appendChild(tr);
    });
  }
};
