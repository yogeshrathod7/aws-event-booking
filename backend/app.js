import express from "express";
import { getPool } from "./db.js";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

const app = express();
app.use(express.json());

const eb = new EventBridgeClient({});
const EB_BUS_NAME = process.env.EB_BUS_NAME || "default";

// Helper: mount routes under both / and /api
const router = express.Router();

// Health check
router.get("/health", async (_req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query("SELECT NOW() as now");
    res.json({ ok: true, db_time: rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "db_connection_failed" });
  }
});

// Fetch events
router.get("/events", async (_req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      "SELECT id, title, date FROM events ORDER BY date ASC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed_to_list_events" });
  }
});

// Book an event
router.post("/book", async (req, res) => {
  const { event_id, name, email } = req.body || {};
  if (!event_id || !name || !email) {
    return res.status(400).json({ error: "missing_fields" });
  }

  try {
    const pool = await getPool();
    const [result] = await pool.query(
      "INSERT INTO bookings (event_id, name, email) VALUES (?, ?, ?)",
      [event_id, name, email]
    );

    const bookingId = result.insertId || null;

    // Fire-and-forget the EventBridge event — don't fail booking if this errors.
    (async () => {
      try {
        await eb.send(
          new PutEventsCommand({
            Entries: [
              {
                EventBusName: EB_BUS_NAME,
                Source: "app.booking",
                DetailType: "BookingCreated",
                Detail: JSON.stringify({
                  bookingId,
                  eventId: event_id,
                  name,
                  email,
                }),
              },
            ],
          })
        );
      } catch (evErr) {
        console.warn(
          "Failed to send EventBridge event (non-fatal):",
          evErr.message
        );
      }
    })();

    res.json({ ok: true, booking_id: bookingId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed_to_book" });
  }
});

// Mount routes under both "" and "/api"
app.use("/", router);
app.use("/api", router);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ API listening on :${port}`));
