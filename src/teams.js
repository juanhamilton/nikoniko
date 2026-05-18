const API_BASE = '/api';

export const teams = {
  async getAll() {
    try {
      const response = await fetch(API_BASE + '/teams');
      return await response.json();
    } catch (error) {
      console.error('Error fetching teams:', error);
      return [];
    }
  },

  async authenticate(teamId, password) {
    try {
      const response = await fetch(`${API_BASE}/teams/${encodeURIComponent(teamId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      return await response.json();
    } catch (error) {
      console.error('Error al autenticar el equipo:', error);
      return { error: 'Error de conexión' };
    }
  },

  getCurrent() {
    const urlParams = new URLSearchParams(window.location.search);
    const team = urlParams.get('team') || localStorage.getItem('current_team') || null;
    const password = localStorage.getItem(`team_pw_${team}`) || null;
    return { team, password };
  },

  setCurrent(teamName, password) {
    localStorage.setItem('current_team', teamName);
    localStorage.setItem(`team_pw_${teamName}`, password);
    const url = new URL(window.location);
    url.searchParams.set('team', teamName);
    window.history.pushState({}, '', url);
  },

  clearCurrent() {
    localStorage.removeItem('current_team');
    const url = new URL(window.location);
    url.searchParams.delete('team');
    window.history.pushState({}, '', url);
  }
};
