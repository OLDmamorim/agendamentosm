// netlify/functions/appointments.js
// CommonJS para Netlify Functions
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL_UNPOOLED || process.env.NETLIFY_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

exports.handler = async (event) => {
  // CORS simples (mantém se o portal e a função estiverem no mesmo domínio; não faz mal ficar)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors(), body: '' };
  }

  try {
    const client = await pool.connect();
    const method = event.httpMethod;

    if (method === 'GET') {
      // /.netlify/functions/appointments?weekStart=YYYY-MM-DD&weekEnd=YYYY-MM-DD
      const { weekStart, weekEnd } = event.queryStringParameters || {};
      const { rows } = await client.query(
        `SELECT * FROM appointments
         WHERE date BETWEEN $1 AND $2
         ORDER BY date, period, created_at`,
        [weekStart, weekEnd]
      );
      client.release();
      return ok(rows);
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { date, period, plate, car_model, service_type, status = 'NE', notes = null } = body;

      // regra: máximo 5 por período
      const c = await client.query(
        `SELECT count(*) FROM appointments WHERE date=$1 AND period=$2`,
        [date, period]
      );
      if (Number(c.rows[0].count) >= 5) {
        client.release();
        return err(409, 'Limite de 5 agendamentos para esse período.');
      }

      const { rows } = await client.query(
        `INSERT INTO appointments (date, period, plate, car_model, service_type, status, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING *`,
        [date, period, plate, car_model, service_type, status, notes]
      );
      client.release();
      return ok(rows[0], 201);
    }

    if (method === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      const { id, status, notes } = body;
      const { rows } = await client.query(
        `UPDATE appointments
           SET status = COALESCE($2,status),
               notes  = COALESCE($3,notes)
         WHERE id = $1
         RETURNING *`,
        [id, status, notes]
      );
      client.release();
      return ok(rows[0] ?? {});
    }

    if (method === 'DELETE') {
      const { id } = JSON.parse(event.body || '{}');
      await client.query(`DELETE FROM appointments WHERE id=$1`, [id]);
      client.release();
      return ok({ deleted: true });
    }

    client.release();
    return err(405, 'Método não suportado.');
  } catch (e) {
    console.error(e);
    return err(500, 'Erro no servidor: ' + e.message);
  }
};

function ok(data, status = 200) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', ...cors() },
    body: JSON.stringify(data),
  };
}
function err(status, message) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', ...cors() },
    body: JSON.stringify({ error: message }),
  };
}
function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
