// Replace with your Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const functions = firebase.functions();

// Anonymous login for testing
auth.signInAnonymously().then(() => {
  document.getElementById("output").innerText = "Logged in anonymously";
});

async function deposit() {
  const fn = functions.httpsCallable("requestDeposit");
  const res = await fn({ amount: 200 });
  document.getElementById("output").innerText = JSON.stringify(res.data);
}

async function withdraw() {
  const fn = functions.httpsCallable("requestWithdrawal");
  const res = await fn({ amount: 100 });
  document.getElementById("output").innerText = JSON.stringify(res.data);
}

async function accessSurvey() {
  const fn = functions.httpsCallable("requestSurveyAccess");
  const res = await fn({ surveyId: "cat1" });
  document.getElementById("output").innerText = "Access token: " + res.data.token;
}

