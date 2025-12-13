const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { stkPush, b2cPayout } = require("./mpesa");

admin.initializeApp();
const db = admin.firestore();

// Deposit via STK Push
exports.requestDeposit = functions.https.onCall(async (data, context) => {
  const { amount } = data;
  const uid = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError("unauthenticated", "Login required");

  const userDoc = await db.collection("users").doc(uid).get();
  const phone = userDoc.data().phone;

  const result = await stkPush({ amount, phone, accountRef: `deposit-${uid}` });
  return { status: "pending", result };
});

// Withdrawal via B2C
exports.requestWithdrawal = functions.https.onCall(async (data, context) => {
  const { amount } = data;
  const uid = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError("unauthenticated", "Login required");

  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  const user = userSnap.data();

  if (user.balance_ksh < amount) {
    throw new functions.https.HttpsError("failed-precondition", "Insufficient balance");
  }

  await userRef.update({ balance_ksh: user.balance_ksh - amount });

  const result = await b2cPayout({ amount, phone: user.phone, reason: "Survey payout" });
  return { status: result.success ? "success" : "failed", result };
});

// Secure survey access
exports.requestSurveyAccess = functions.https.onCall(async (data, context) => {
  const { surveyId } = data;
  const uid = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError("unauthenticated", "Login required");

  const survey = (await db.collection("surveys").doc(surveyId).get()).data();
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  const user = userSnap.data();

  if (user.balance_ksh < survey.entry_fee_ksh) {
    throw new functions.https.HttpsError("failed-precondition", "Insufficient balance");
  }

  await userRef.update({ balance_ksh: user.balance_ksh - survey.entry_fee_ksh });

  const token = Math.random().toString(36).substring(2, 10);
  await db.collection("surveyAccess").add({
    user_id: uid,
    survey_id: surveyId,
    access_token: token,
    granted_at: admin.firestore.FieldValue.serverTimestamp(),
    reward_paid: false
  });

  return { token };
});
