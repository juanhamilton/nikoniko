const API_BASE = '/api';

export const members = {
  async getAll(teamId, password) {
    try {
      const response = await fetch(`${API_BASE}/${encodeURIComponent(teamId)}/members`, {
        headers: { 'x-team-password': password }
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching members:', error);
      return [];
    }
  },

  async add(teamId, password, name) {
    try {
      const response = await fetch(`${API_BASE}/${encodeURIComponent(teamId)}/members`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-team-password': password
        },
        body: JSON.stringify({ name })
      });
      return await response.json();
    } catch (error) {
      console.error('Error adding member:', error);
    }
  },

  async remove(teamId, password, name) {
    try {
      const response = await fetch(`${API_BASE}/${encodeURIComponent(teamId)}/members/${encodeURIComponent(name)}`, {
        method: 'DELETE',
        headers: { 'x-team-password': password }
      });
      return await response.json();
    } catch (error) {
      console.error('Error removing member:', error);
    }
  },

  renderList(container, membersList, onDelete) {
    container.innerHTML = '';
    [...membersList].sort((a, b) => a.localeCompare(b, 'es')).forEach(name => {
      const li = document.createElement('li');
      li.className = 'member-item';
      li.innerHTML = `
        <span>${name}</span>
        <button class="delete-member-btn" data-name="${name}">Eliminar</button>
      `;
      li.querySelector('button').addEventListener('click', () => onDelete(name));
      container.appendChild(li);
    });
  },

  populateSelect(selectElement, membersList) {
    const currentVal = selectElement.value;
    const sorted = [...membersList].sort((a, b) => a.localeCompare(b, 'es'));
    selectElement.innerHTML = sorted.map(name => 
      `<option value="${name}" ${name === currentVal ? 'selected' : ''}>${name}</option>`
    ).join('');
    
    if (!sorted.includes(currentVal) && sorted.length > 0) {
      selectElement.value = sorted[0];
    }
  }
};
