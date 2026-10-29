
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    getDocs,
    doc,
    updateDoc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCQGY5x02x8pfMu05RSS_VbVW9iCKFgnYs",
    authDomain: "smarthealthcare-1faaf.firebaseapp.com",
    projectId: "smarthealthcare-1faaf",
    storageBucket: "smarthealthcare-1faaf.firebasestorage.app",
    messagingSenderId: "183240494760",
    appId: "1:183240494760:web:07a9ff1f0b8ec5d2a87c9d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const doctorRecords = document.getElementById("doctorRecords");
const doctorAppointments = document.getElementById("doctorAppointments");
const recordsStatus = document.getElementById("recordsStatus");
const appointmentsStatus = document.getElementById("appointmentsStatus");

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.replace("doctor.html");
        return;
    }

    document.getElementById("doctorWelcome").textContent =
        "Logged in as: " + user.email;

    await loadPatientRecords();
    await loadAppointments();
});

document.getElementById("doctorLogoutBtn").addEventListener("click", async () => {
    await signOut(auth);
    window.location.replace("doctor.html");
});

document.getElementById("refreshRecordsBtn").addEventListener("click", loadPatientRecords);
document.getElementById("refreshAppointmentsBtn").addEventListener("click", loadAppointments);

function addText(parent, tag, value) {
    const element = document.createElement(tag);
    element.textContent = value;
    parent.appendChild(element);
    return element;
}

async function loadPatientRecords() {
    doctorRecords.replaceChildren();
    recordsStatus.textContent = "Loading records...";

    try {
        const snapshot = await getDocs(
            query(collection(db, "healthRecords"), orderBy("createdAt", "desc"))
        );

        if (snapshot.empty) {
            recordsStatus.textContent = "No patient records found.";
            return;
        }

        recordsStatus.textContent = "Total records: " + snapshot.size;

        snapshot.forEach((record) => {
            const data = record.data();
            const card = document.createElement("article");
            card.className = "doctor-record";

            addText(card, "h3", data.patientName || "Unnamed patient");
            addText(card, "p", "Patient ID: " + (data.patientId || "Not available"));
            addText(card, "p", "Age: " + (data.age ?? "Not available"));
            addText(card, "p", "Heart Rate: " + (data.heartRate ?? "Not available") + " BPM");
            addText(card, "p", "SpO2: " + (data.spo2 ?? "Not available") + "%");
            addText(card, "p", "Temperature: " + (data.temperature ?? "Not available") + " °F");
            addText(card, "p", "Blood Pressure: " + (data.bloodPressure || "Not available"));

            doctorRecords.appendChild(card);
        });
    } catch (error) {
        console.error(error);
        recordsStatus.textContent = "Unable to load records. Check Firestore access.";
    }
}

async function loadAppointments() {
    doctorAppointments.replaceChildren();
    appointmentsStatus.textContent = "Loading appointments...";

    try {
        const snapshot = await getDocs(
            query(collection(db, "appointments"), orderBy("createdAt", "desc"))
        );

        if (snapshot.empty) {
            appointmentsStatus.textContent = "No appointments found.";
            return;
        }

        appointmentsStatus.textContent = "Total appointments: " + snapshot.size;

        snapshot.forEach((appointment) => {
            const data = appointment.data();
            const card = document.createElement("article");
            card.className = "doctor-record";

            addText(card, "h3", data.patientName || "Unnamed patient");
            addText(card, "p", "Patient ID: " + (data.patientId || "Not available"));
            addText(card, "p", "Specialist: " + (data.doctor || "Not specified"));
            addText(card, "p", "Date: " + (data.date || "Not specified"));
            addText(card, "p", "Time: " + (data.time || "Not specified"));
            addText(card, "p", "Reason: " + (data.reason || "Not specified"));
            addText(card, "p", "Current status: " + (data.status || "Pending"));

            const select = document.createElement("select");

            ["Pending", "Confirmed", "Completed", "Cancelled"].forEach((status) => {
                const option = document.createElement("option");
                option.value = status;
                option.textContent = status;
                select.appendChild(option);
            });

            select.value = ["Pending", "Confirmed", "Completed", "Cancelled"].includes(data.status)
                ? data.status
                : "Pending";

            card.appendChild(select);

            const button = document.createElement("button");
            button.textContent = "Save Status";

            button.addEventListener("click", async () => {
                button.disabled = true;

                try {
                    await updateDoc(doc(db, "appointments", appointment.id), {
                        status: select.value
                    });
                    appointmentsStatus.textContent = "Appointment status updated.";
                } catch (error) {
                    console.error(error);
                    appointmentsStatus.textContent = "Unable to update status.";
                } finally {
                    button.disabled = false;
                }
            });

            card.appendChild(button);
            doctorAppointments.appendChild(card);
        });
    } catch (error) {
        console.error(error);
        appointmentsStatus.textContent = "Unable to load appointments. Check Firestore access.";
    }
}
