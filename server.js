const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// Load env vars from Render dashboard (set these in Render → Environme>
const consumerKey = process.env.CONSUMER_KEY || "G6shGNaF8bC9BXpSYMZgvF>
const consumerSecret = process.env.CONSUMER_SECRET || "bi799mmYOY8DqoWP>
const shortcode = process.env.SHORTCODE || "600000"; // Sandbox shortco>
const securityCredential = process.env.SECURITY_CREDENTIAL || "Safarico>
const initiatorName = process.env.INITIATOR_NAME || "testapi";

// Helper: get access token
async function getToken() {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString>
  const res = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=clien>
    { headers: { Authorization: `Basic ${auth}` } }
  );
  return res.data.access_token;
}

// ✅ Route: send payout
app.post("/sendReward", async (req, res) => {
  try {
    const { amount, phoneNumber } = req.body;

    if (!amount || !phoneNumber) {
  return res.status(400).json({ error: "Amount and phoneNumber are >
    }

    const token = await getToken();
    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest",
      {
        InitiatorName: initiatorName,
        SecurityCredential: securityCredential,
        CommandID: "BusinessPayment",
        Amount: amount,
        PartyA: shortcode,
        PartyB: phoneNumber,
        Remarks: "Survey reward payout",
        QueueTimeOutURL: "https://survey-platform.onrender.com/timeout",
        ResultURL: "https://survey-platform.onrender.com/result",
        Occasion: "SurveyReward"
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Payment request failed" });
  }
});

// ✅ Callbacks
app.post("/timeout", (req, res) => {
  console.log("Timeout callback:", req.body);
  res.sendStatus(200);
});

  return res.status(400).json({ error: "Amount and phoneNumber are >
    }

    const token = await getToken();
    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest",
      {
        InitiatorName: initiatorName,
        SecurityCredential: securityCredential,
        CommandID: "BusinessPayment",
        Amount: amount,
        PartyA: shortcode,
        PartyB: phoneNumber,
        Remarks: "Survey reward payout",
        QueueTimeOutURL: "https://survey-platform.onrender.com/timeout",
        ResultURL: "https://survey-platform.onrender.com/result",
        Occasion: "SurveyReward"
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    res.json(response.data);
  } catch (err) {
    console.errapp.post("/timeout", (req, res) => {
console.log("Timeout callback:", req.body);
  res.sendStatus(200);
});

  return res.status(400).json({ error: "Amount and phoneNumber are >
    }

    const token = await getToken();
    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest",
      {
        InitiatorName: initiatorName,
        SecurityCredential: securityCredential,
        CommandID: "BusinessPayment",
        Amount: amount,
        PartyA: shortcode,
        PartyB: phoneNumber,
        Remarks: "Survey reward payout",
        QueueTimeOutURL: "https://survey-platform.onrender.com/timeout",
        ResultURL: "https://survey-platform.onrender.com/result",
        Occasion: "SurveyReward"
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);or(err.response?.d>
    res.status(500).json({ error: "Payment request failed" });
 }
});

// ✅ Callbacksapp.post("/result", (req, res) => {
  console.log("Result callback:", req.body);
  res.sendStatus(200);
});

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("Survey Platform API is running 🚀");
});

// ✅ Port binding for Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
