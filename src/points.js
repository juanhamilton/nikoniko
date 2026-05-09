const API_BASE = '/api';

export const points = {

  async getMonth(teamId, password, month) {
    try {
      const res = await fetch(
        `${API_BASE}/${encodeURIComponent(teamId)}/points?month=${month}`,
        { headers: { 'x-team-password': password } }
      );
      return await res.json();
    } catch (err) {
      console.error('Error fetching points:', err);
      return {};
    }
  },

  async add(teamId, password, member, month, delta) {
    try {
      const res = await fetch(
        `${API_BASE}/${encodeURIComponent(teamId)}/points`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-team-password': password,
          },
          body: JSON.stringify({ member, month, delta }),
        }
      );
      return await res.json();
    } catch (err) {
      console.error('Error updating points:', err);
    }
  },

  renderRanking(container, membersList, pointsData, month, onDelta) {
    // Construir ranking ordenado por puntos desc
    const ranked = [...membersList]
      .map(name => ({ name, pts: pointsData[name] ?? 0 }))
      .sort((a, b) => b.pts - a.pts || a.name.localeCompare(b.name, 'es'));

    const medals = ['🥇', '🥈', '🥉'];

    container.innerHTML = `
      <div class="points-month-label">Mes: <strong>${month}</strong></div>
      <div class="ranking-list">
        ${ranked.map((entry, i) => `
          <div class="ranking-row rank-${i + 1}">
            <div class="ranking-position">
              ${i < 3 ? `<span class="medal">${medals[i]}</span>` : `<span class="rank-num">${i + 1}</span>`}
            </div>
            <div class="ranking-name">${entry.name}</div>
            <div class="ranking-controls">
              <button class="pts-btn pts-sub" data-name="${entry.name}" data-delta="-1">−</button>
              <span class="pts-value">${entry.pts}</span>
              <button class="pts-btn pts-add" data-name="${entry.name}" data-delta="1">+</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.pts-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        onDelta(btn.dataset.name, Number(btn.dataset.delta));
      });
    });
  },
};
