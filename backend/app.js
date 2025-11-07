import express from "express";
import cors from "cors";
import { getPool } from "./db.js";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

const app = express();
app.use(cors());
app.use(express.json());

const eb = new EventBridgeClient({});
const EB_BUS_NAME = process.env.EB_BUS_NAME || "default";

const router = express.Router();

router.get("/health", async (_req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query("SELECT NOW() AS now");
    res.json({ ok: true, db_time: rows[0].now });
  } catch (err) {
    console.error("Health check failed:", err);
    res.status(500).json({ error: "db_connection_failed" });
  }
});

router.get("/events", async (_req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      "SELECT id, title, date FROM events ORDER BY date ASC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Failed to list events:", err);
    res.status(500).json({ error: "failed_to_list_events" });
  }
});

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
                  email
                })
              }
            ]
          })
        );
        console.log("✅ EventBridge event sent for booking", bookingId);
      } catch (evErr) {
        console.warn("⚠️ Failed to send EventBridge event (non‑fatal):", evErr.message);
      }
    })();

    res.json({ ok: true, booking_id: bookingId });
  } catch (err) {
    console.error("Failed to book event:", err);
    res.status(500).json({ error: "failed_to_book" });
  }
});

app.use("/", router);
app.use("/api", router);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ API listening on :${port}`);
});
