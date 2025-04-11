require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();

app.use(cors());
app.use(express.json());

const calendar = google.calendar({ version: 'v3' });
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON), // 🔁 uses env var for JSON key
  scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
});

app.post('/check-availability', async (req, res) => {
  try {
    const { calendarId, weddingDate } = req.body;
    const authClient = await auth.getClient();

    const start = new Date(weddingDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    const response = await calendar.events.list({
      auth: authClient,
      calendarId,
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items;

    // ⛔ If there's any event, the whole day is unavailable
    if (events.length === 0) {
      res.json({ available: true, message: '✅ No events — date is available!' });
    } else {
      res.json({ available: false, message: '❌ Date is booked', events });
    }
  } catch (err) {
    console.error('Error checking availability:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
