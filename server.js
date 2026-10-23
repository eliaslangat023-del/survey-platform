const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json({ limit: "32kb" }));

const consumerKey = process.env.CONSUMER_KEY;
const consumerSecret = process.env.CONSUMER_SECRET;
const shortcode = process.env.SHORTCODE;
const securityCredential = process.env.SECURITY_CREDENTIAL;
const initiatorName = process.env.INITIATOR_NAME;
const rewardApiToken = process.env.REWARD_API_TOKEN;
const callbackBaseUrl = process.env.MPESA_CALLBACK_BASE_URL;

const requiredConfig = {
  CONSUMER_KEY: consumerKey,
  CONSUMER_SECRET: consumerSecret,
  SHORTCODE: shortcode,
  SECURITY_CREDENTIAL: securityCredential,
  INITIATOR_NAME: initiatorName,
  REWARD_API_TOKEN: rewardApiToken,
  MPESA_CALLBACK_BASE_URL: callbackBaseUrl,
};
const missingConfig = Object.entries(requiredConfig)
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missingConfig.length) {
  console.error(`Missing required environment variables: ${missingConfig.join(", ")}`);
  process.exit(1);
}

const callbackBase = callbackBaseUrl.replace(/\/$/, "");
const darajaBaseUrl = process.env.DARAJA_BASE_URL || "https://sandbox.safaricom.co.ke";

function safeTokenMatch(provided, expected) {
  if (typeof provided !== "string" || typeof expected !== "string") return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && require("crypto").timingSafeEqual(a, b);
}

function requireRewardToken(req, res, next) {
  const authorization = req.get("authorization") || "";
  const provided = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!safeTokenMatch(provided, rewardApiToken)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

async function getToken() {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const response = await axios.get(
    `${darajaBaseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` }, timeout: 15000 }
  );
  return response.data.access_token;
}

app.post("/sendReward", requireRewardToken, async (req, res) => {
  try {
    const { amount, phoneNumber } = req.body || {};
    const normalizedPhone = typeof phoneNumber === "string" ? phoneNumber.replace(/[\s+()-]/g, "") : "";

    if (!Number.isSafeInteger(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: "amount must be a positive whole number" });
    }
    if (!/^254[17]\d{8}$/.test(normalizedPhone)) {
      return res.status(400).json({ error: "phoneNumber must be a valid Kenyan mobile number in 254 format" });
    }

    const token = await getToken();
    const response = await axios.post(
      `${darajaBaseUrl}/mpesa/b2c/v1/paymentrequest`,
      {
        InitiatorName: initiatorName,
        SecurityCredential: securityCredential,
        CommandID: "BusinessPayment",
        Amount: Number(amount),
        PartyA: shortcode,
        PartyB: normalizedPhone,
        Remarks: "Survey reward payout",
        QueueTimeOutURL: `${callbackBase}/timeout`,
        ResultURL: `${callbackBase}/result`,
        Occasion: "SurveyReward",
      },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 20000 }
    );
    return res.json(response.data);
  } catch (err) {
    // Keep credentials and payment payloads out of logs.
    console.error("Payment request failed:", err.response?.status || err.code || "unknown error");
    return res.status(502).json({ error: "Payment request failed" });
  }
});

// TODO: verify callback authenticity using Daraja's supported validation process,
// persist transaction state, and handle duplicate callbacks idempotently before production.
app.post("/timeout", (_req, res) => res.sendStatus(200));
app.post("/result", (_req, res) => res.sendStatus(200));

app.get("/", (_req, res) => res.send("Survey Platform API is running"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
