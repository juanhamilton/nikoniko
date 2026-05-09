const API_BASE = '/api';

export const storage = {
  async saveMood(teamId, password, dateStr, member, mood) {
    try {
      const response = await fetch(`${API_BASE}/${encodeURIComponent(teamId)}/moods`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-team-password': password
        },
        body: JSON.stringify({ dateStr, member, mood })
      });
      return await response.json();
    } catch (error) {
      console.error('Error saving mood:', error);
    }
  },

  async getAll(teamId, password) {
    try {
      const response = await fetch(`${API_BASE}/${encodeURIComponent(teamId)}/moods`, {
        headers: { 'x-team-password': password }
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching moods:', error);
      return {};
    }
  }
};
