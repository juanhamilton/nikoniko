const API_BASE = '/api';

export const storage = {
  async saveMood(teamId, password, dateStr, member, mood, comment = '') {
    try {
      const response = await fetch(`${API_BASE}/${encodeURIComponent(teamId)}/moods`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-team-password': password
        },
        body: JSON.stringify({ dateStr, member, mood, comment })
      });
      return await response.json();
    } catch (error) {
      console.error('Error saving mood:', error);
    }
  },

  async deleteMood(teamId, password, dateStr, member) {
    try {
      const response = await fetch(`${API_BASE}/${encodeURIComponent(teamId)}/moods`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-team-password': password
        },
        body: JSON.stringify({ dateStr, member })
      });
      return await response.json();
    } catch (error) {
      console.error('Error deleting mood:', error);
    }
  },

  async getAll(teamId, password) {
    try {
      const response = await fetch(`${API_BASE}/${encodeURIComponent(teamId)}/moods`, {
        headers: { 'x-team-password': password }
      });
      const data = await response.json();
      // Normalizar entradas legadas (string) al formato { mood, comment }
      Object.keys(data).forEach(dateStr => {
        const day = data[dateStr];
        Object.keys(day).forEach(member => {
          if (typeof day[member] === 'string') {
            day[member] = { mood: day[member], comment: '' };
          }
        });
      });
      return data;
    } catch (error) {
      console.error('Error fetching moods:', error);
      return {};
    }
  }
};
