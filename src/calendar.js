const DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const calendar = {
  // weekStartDay: 0=Domingo, 1=Lunes, ..., 6=Sábado
  render(container, year, month, allMoods, onDayClick, weekStartDay = 1) {
    container.innerHTML = '';

    // Encabezados de días ordenados según el día de inicio
    for (let i = 0; i < 7; i++) {
      const dn = document.createElement('div');
      dn.className = 'day-name';
      dn.textContent = DAY_NAMES_SHORT[(weekStartDay + i) % 7];
      container.appendChild(dn);
    }

    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Dom
    // Cuántas celdas vacías antes del día 1
    const startOffset = ((firstDayOfMonth - weekStartDay) + 7) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Relleno mes anterior
    for (let i = startOffset - 1; i >= 0; i--) {
      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-day not-current';
      dayEl.innerHTML = `<span class="day-number">${daysInPrevMonth - i}</span>`;
      container.appendChild(dayEl);
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${month}-${day}`;
      const dayData = allMoods[dateStr] || {};
      const responses = Object.values(dayData);

      let dominantMood = '';
      if (responses.length > 0) {
        const counts = responses.reduce((acc, mood) => {
          acc[mood] = (acc[mood] || 0) + 1;
          return acc;
        }, {});
        dominantMood = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
      }

      const dayEl = document.createElement('div');
      dayEl.className = `calendar-day ${dominantMood ? 'day-' + dominantMood : ''}`;

      let indicatorsHtml = '';
      if (responses.length > 0) {
        indicatorsHtml = `<div class="team-indicators">
          ${responses.map(m => `<span class="dot mood-${m}"></span>`).join('')}
        </div>`;
      } else {
        indicatorsHtml = `<div class="mood-indicator"></div>`;
      }

      dayEl.innerHTML = `
        <span class="day-number">${day}</span>
        ${indicatorsHtml}
        ${responses.length > 0 ? `<span class="response-count">${responses.length}</span>` : ''}
      `;

      dayEl.addEventListener('click', () => onDayClick(year, month, day));
      container.appendChild(dayEl);
    }

    // Relleno mes siguiente
    const totalCells = 42;
    const currentCells = startOffset + daysInMonth;
    for (let i = 1; i <= totalCells - currentCells; i++) {
      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-day not-current';
      dayEl.innerHTML = `<span class="day-number">${i}</span>`;
      container.appendChild(dayEl);
    }
  }
};
