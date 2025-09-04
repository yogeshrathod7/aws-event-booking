import express from 'express';
import { getPool } from './db.js';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

const app = express();
app.use(express.json());

const eb = new EventBridgeClient({});
const EB_BUS_NAME = process.env.EB_BUS_NAME || 'default';

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/events', async (_req, res) => {
  try {
    const pool = await getPool();
    const q = await pool.query('SELECT id, title, date FROM events ORDER BY date ASC');
    res.json(q.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'failed_to_list_events' });
  }
});

app.post('/book', async (req, res) => {
  const { event_id, name, email } = req.body || {};
  if (!event_id || !name || !email) return res.status(400).json({ error: 'missing_fields' });
  try {
    const pool = await getPool();
    const ins = await pool.query(
      'INSERT INTO bookings(event_id, name, email) VALUES($1,$2,$3) RETURNING id, created_at',
      [event_id, name, email]
    );

    await eb.send(new PutEventsCommand({
      Entries: [{
        EventBusName: EB_BUS_NAME,
        Source: 'app.booking',
        DetailType: 'BookingCreated',
        Detail: JSON.stringify({ bookingId: ins.rows[0].id, eventId: event_id, name, email })
      }]
    }));

    res.json({ ok: true, booking_id: ins.rows[0].id, created_at: ins.rows[0].created_at });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'failed_to_book' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on :${port}`));
