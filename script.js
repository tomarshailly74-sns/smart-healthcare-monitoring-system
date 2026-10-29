
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCQGY5x02x8pfMu05RSS_VbVW9iCKFgnYs",
    authDomain: "smarthealthcare-1faaf.firebaseapp.com",
    projectId: "smarthealthcare-1faaf",
    storageBucket: "smarthealthcare-1faaf.firebasestorage.app",
    messagingSenderId: "183240494760",
    appId: "1:183240494760:web:07a9ff1f0b8ec5d2a87c9d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Page elements
const loginButton = document.getElementById("patientLoginBtn");

let currentPatient = null;
let healthChart = null;

// ---------------- PATIENT LOGIN ----------------

if (loginButton) {
    loginButton.addEventListener("click", function () {
        const name = document.getElementById("patientNameLogin").value.trim();
        const patientId = document.getElementById("patientIdLogin").value.trim();
        const status = document.getElementById("patientLoginStatus");

        if (!name || !patientId) {
            status.textContent = "Please enter your name and Patient ID.";
            return;
        }

        currentPatient = {
            name: name,
            patientId: patientId
        };

        document.getElementById("patientLogin").style.display = "none";
        document.getElementById("patientDashboard").style.display = "block";

        document.getElementById("welcomePatientName").textContent = name;
        document.getElementById("welcomePatientId").textContent = patientId;

        document.getElementById("patientName").value = name;
        document.getElementById("patientId").value = patientId;

        status.textContent = "";

        loadHealthHistory();
        loadHealthChart();
        loadMyAppointments();
    });
}

// ---------------- LOGOUT ----------------

const logoutButton = document.getElementById("patientLogoutBtn");

if (logoutButton) {
    logoutButton.addEventListener("click", function () {
        currentPatient = null;

        document.getElementById("patientDashboard").style.display = "none";
        document.getElementById("patientLogin").style.display = "block";

        document.getElementById("patientNameLogin").value = "";
        document.getElementById("patientIdLogin").value = "";
        document.getElementById("patientLoginStatus").textContent = "";

        document.getElementById("healthStatus").textContent = "";
        document.getElementById("healthHistory").innerHTML = "";
        document.getElementById("myAppointments").innerHTML = "";
    });
}

// ---------------- CHECK HEALTH ----------------

const checkHealthButton = document.getElementById("checkHealthBtn");

if (checkHealthButton) {
    checkHealthButton.addEventListener("click", async function () {
        if (!currentPatient) return;

        const name = document.getElementById("patientName").value.trim();
        const age = Number(document.getElementById("age").value);
        const email = document.getElementById("email").value.trim();

        const heartRate = Number(document.getElementById("heartRate").value);
        const spo2 = Number(document.getElementById("spo2").value);
        const temperature = Number(document.getElementById("temperature").value);
        const bloodPressure = document.getElementById("bloodPressure").value.trim();

        const status = document.getElementById("healthStatus");

        if (
            !name || !age || !email ||
            !document.getElementById("heartRate").value ||
            !document.getElementById("spo2").value ||
            !document.getElementById("temperature").value ||
            !bloodPressure
        ) {
            status.textContent = "Please fill in all patient and health details.";
            return;
        }

        if (
            age < 1 || age > 120 ||
            heartRate <= 0 ||
            spo2 < 1 || spo2 > 100 ||
            temperature <= 0 ||
            !/^\d{2,3}\/\d{2,3}$/.test(bloodPressure)
        ) {
            status.textContent = "Please check the values and enter valid readings.";
            return;
        }

        const bpParts = bloodPressure.split("/").map(Number);
        const systolic = bpParts[0];
        const diastolic = bpParts[1];

        if (
            systolic <= 0 || diastolic <= 0 ||
            systolic <= diastolic ||
            systolic > 300 || diastolic > 200
        ) {
            status.textContent = "Please enter blood pressure in a valid format, such as 120/80.";
            return;
        }

        const alerts = [];

        if (spo2 < 90) alerts.push("Low SpO₂ reading");
        if (heartRate > 120) alerts.push("High heart rate");
        if (temperature > 100.4) alerts.push("Elevated temperature");
        if (systolic > 140 || diastolic > 90) {
            alerts.push("High blood pressure reading");
        }

        if (alerts.length > 0) {
            status.textContent =
                "Attention: " + alerts.join(", ") +
                ". Recheck your readings and seek medical advice when appropriate.";
        } else {
            status.textContent =
                "No alert was triggered by this project's basic thresholds. " +
                "This is not a medical diagnosis.";
        }

        try {
            await addDoc(collection(db, "healthRecords"), {
                patientName: name,
                patientId: currentPatient.patientId,
                age: age,
                email: email,
                heartRate: heartRate,
                spo2: spo2,
                temperature: temperature,
                bloodPressure: bloodPressure,
                createdAt: serverTimestamp()
            });

            status.textContent += " Health record saved to the database.";

            await loadHealthHistory();
            await loadHealthChart();
        } catch (error) {
            console.error("Error saving health record:", error);
            status.textContent +=
                " Could not save the record. Please check your connection and Firebase settings.";
        }
    });
}

// ---------------- HEALTH HISTORY ----------------

async function loadHealthHistory() {
    if (!currentPatient) return;

    const historyContainer = document.getElementById("healthHistory");
    historyContainer.textContent = "Loading health history...";

    try {
        const recordsQuery = query(
            collection(db, "healthRecords"),
            where("patientId", "==", currentPatient.patientId)
        );

        const snapshot = await getDocs(recordsQuery);
        historyContainer.innerHTML = "";

        if (snapshot.empty) {
            historyContainer.textContent = "No health records found for this Patient ID.";
            return;
        }

        const records = [];

        snapshot.forEach(function (documentSnapshot) {
            records.push(documentSnapshot.data());
        });

        records.reverse().forEach(function (record) {
            const item = document.createElement("div");
            item.className = "doctor-record";

            const date = record.createdAt
                ? record.createdAt.toDate().toLocaleString()
                : "Date unavailable";

            item.textContent =
                `${date} | Heart Rate: ${record.heartRate} BPM | ` +
                `SpO₂: ${record.spo2}% | Temperature: ${record.temperature}°F | ` +
                `BP: ${record.bloodPressure}`;

            historyContainer.appendChild(item);
        });
    } catch (error) {
        console.error("Error loading health history:", error);
        historyContainer.textContent =
            "Unable to load history. Check your Firebase settings.";
    }
}

const historyButton = document.getElementById("historyBtn");

if (historyButton) {
    historyButton.addEventListener("click", loadHealthHistory);
}

// ---------------- HEALTH CHART ----------------

async function loadHealthChart() {
    if (!currentPatient || typeof Chart === "undefined") return;

    const canvas = document.getElementById("healthChart");
    if (!canvas) return;

    try {
        const recordsQuery = query(
            collection(db, "healthRecords"),
            where("patientId", "==", currentPatient.patientId)
        );

        const snapshot = await getDocs(recordsQuery);
        const records = [];

        snapshot.forEach(function (documentSnapshot) {
            records.push(documentSnapshot.data());
        });

        records.sort(function (a, b) {
            const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt ? b.createdAt.toMillis() : 0;
            return timeA - timeB;
        });

        if (healthChart) {
            healthChart.destroy();
            healthChart = null;
        }

        if (records.length === 0) return;

        const labels = records.map(function (record, index) {
            return record.createdAt
                ? record.createdAt.toDate().toLocaleDateString()
                : `Reading ${index + 1}`;
        });

        healthChart = new Chart(canvas, {
            type: "line",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Heart Rate (BPM)",
                        data: records.map(record => record.heartRate),
                        tension: 0.2
                    },
                    {
                        label: "SpO₂ (%)",
                        data: records.map(record => record.spo2),
                        tension: 0.2
                    },
                    {
                        label: "Temperature (°F)",
                        data: records.map(record => record.temperature),
                        tension: 0.2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true
            }
        });
    } catch (error) {
        console.error("Error loading health chart:", error);
    }
}

// ---------------- BOOK APPOINTMENT ----------------

const bookAppointmentButton = document.getElementById("bookAppointmentBtn");

if (bookAppointmentButton) {
    bookAppointmentButton.addEventListener("click", async function () {
        if (!currentPatient) return;

        const doctor = document.getElementById("appointmentDoctor").value;
        const date = document.getElementById("appointmentDate").value;
        const time = document.getElementById("appointmentTime").value;
        const reason = document.getElementById("appointmentReason").value.trim();
        const status = document.getElementById("appointmentStatus");

        if (!doctor || !date || !time || !reason) {
            status.textContent = "Please complete all appointment fields.";
            return;
        }

        const selectedDate = new Date(`${date}T${time}`);

        if (Number.isNaN(selectedDate.getTime()) || selectedDate <= new Date()) {
            status.textContent = "Please choose a future appointment date and time.";
            return;
        }

        try {
            await addDoc(collection(db, "appointments"), {
                patientName: currentPatient.name,
                patientId: currentPatient.patientId,
                doctor: doctor,
                date: date,
                time: time,
                reason: reason,
                status: "Pending",
                createdAt: serverTimestamp()
            });

            status.textContent = "Appointment request submitted successfully.";
            document.getElementById("appointmentDoctor").value = "";
            document.getElementById("appointmentDate").value = "";
            document.getElementById("appointmentTime").value = "";
            document.getElementById("appointmentReason").value = "";

            await loadMyAppointments();
        } catch (error) {
            console.error("Error booking appointment:", error);
            status.textContent =
                "Unable to submit appointment. Check your Firebase settings.";
        }
    });
}

// ---------------- MY APPOINTMENTS ----------------

async function loadMyAppointments() {
    if (!currentPatient) return;

    const container = document.getElementById("myAppointments");
    container.textContent = "Loading appointments...";

    try {
        const appointmentsQuery = query(
            collection(db, "appointments"),
            where("patientId", "==", currentPatient.patientId)
        );

        const snapshot = await getDocs(appointmentsQuery);
        container.innerHTML = "";

        if (snapshot.empty) {
            container.textContent = "No appointments found.";
            return;
        }

        snapshot.forEach(function (documentSnapshot) {
            const appointment = documentSnapshot.data();
            const item = document.createElement("div");
            item.className = "doctor-record";

            item.textContent =
                `${appointment.doctor} | ${appointment.date} at ${appointment.time} | ` +
                `Status: ${appointment.status} | Reason: ${appointment.reason}`;

            container.appendChild(item);
        });
    } catch (error) {
        console.error("Error loading appointments:", error);
        container.textContent = "Unable to load appointments.";
    }
}

const myAppointmentsButton = document.getElementById("myAppointmentsBtn");

if (myAppointmentsButton) {
    myAppointmentsButton.addEventListener("click", loadMyAppointments);
}

console.log("Patient portal JavaScript loaded.");
