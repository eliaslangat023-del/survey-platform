const axios = require("axios");

// Placeholder credentials (replace with your Daraja values)
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || "YOUR_SHORTCODE";
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || "YOUR_PASSKEY";
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || "YOUR_CONSUMER_KEY";
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || "YOUR_CONSUMER_SECRET";
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL || "https://yourdomain.com/mpesa/callback";

async function getToken() {
  const res = await axios.get("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
    auth: { username: MPESA_CONSUMER_KEY, password: MPESA_CONSUMER_SECRET }
  });
  return res.data.access_token;
}

exports.stkPush = async ({ amount, phone, accountRef }) => {
  const token = await getToken();
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const password = Buffer.from(MPESA_SHORTCODE + MPESA_PASSKEY + timestamp).toString("base64");

  const res = await axios.post("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: phone,
    PartyB: MPESA_SHORTCODE,
    PhoneNumber: phone,
    CallBackURL: MPESA_CALLBACK_URL,
    AccountReference: accountRef,
    TransactionDesc: "Wallet top-up"
  }, { headers: { Authorization: `Bearer ${token}` } });

  return res.data;
};

exports.b2cPayout = async ({ amount, phone, reason }) => {
  const token = await getToken();
  const res = await axios.post("https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest", {
    InitiatorName: "testapi",
    SecurityCredential: "YOUR_SECURITY_CREDENTIAL",
    CommandID: "BusinessPayment",
    Amount: amount,
    PartyA: MPESA_SHORTCODE,
    PartyB: phone,
    Remarks: reason,
    QueueTimeOutURL: MPESA_CALLBACK_URL,
    ResultURL: MPESA_CALLBACK_URL,
    Occasion: "Survey payout"
  }, { headers: { Authorization: `Bearer ${token}` } });

  return { success: res.data.ResponseCode === "0", reference: res.data.ConversationID };
};
