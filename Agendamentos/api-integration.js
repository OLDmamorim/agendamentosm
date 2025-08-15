// api-integration.js
const API_BASE = '/.netlify/functions/appointments';

// Lista todos os agendamentos da semana
async function listarSemana(weekStart, weekEnd) {
    const url = `${API_BASE}?weekStart=${encodeURIComponent(weekStart)}&weekEnd=${encodeURIComponent(weekEnd)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Erro ao listar agendamentos');
    return await res.json();
}

// Cria um novo agendamento
async function criarAgendamento(data) {
    const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Erro ao criar agendamento');
    return await res.json();
}

// Atualiza um agendamento existente
async function atualizarAgendamento(id, data) {
    const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Erro ao atualizar agendamento');
    return await res.json();
}

// Apaga um agendamento
async function apagarAgendamento(id) {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao apagar agendamento');
    return await res.json();
}

// Disponibilizar globalmente no browser
window.listarSemana = listarSemana;
window.criarAgendamento = criarAgendamento;
window.atualizarAgendamento = atualizarAgendamento;
window.apagarAgendamento = apagarAgendamento;
