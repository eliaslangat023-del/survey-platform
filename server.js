const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// ✅ Daraja sandbox credentials
const consumerKey = "G6shGNaF8bC9BXpSYMZgvFXP1LQUWvYhsoiquCpzp3ySKCGC";     // paste from portal
const consumerSecret = "bi799mmYOY8DqoWP2YpxrEvOcGY8EIx5FkG1P5O9NYas0xyrs8MhPmV6GPq5Oy05"; // paste from portal
const shortcode = "600000";                          // Sandbox shortcode
const securityCredential = "Safaricom123!";          // Sandbox default
const initiatorName = "testapi";                     // Sandbox default

// Helper: get access token
async function getToken() {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const res = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    { headers: { Authorization: `Basic ${auth}` } }
  );
  return res.data.access_token;
}

// ✅ Route: send payout
app.post("/sendReward", async (req, res) => {
  try {
    const { amount, phoneNumber } = req.body;

    if (!amount || !phoneNumber) {
      return res.status(400).json({ error: "Amount and phoneNumber are required" });
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
        QueueTimeOutURL: "http://localhost:3000/timeout",
        ResultURL: "http://localhost:3000/result",
        Occasion: "SurveyReward"
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Callbacks
app.post("/result", (req, res) => {
  console.log("Result:", req.body);
  res.sendStatus(200);
});

app.post("/timeout", (req, res) => {
  console.log("Timeout:", req.body);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
