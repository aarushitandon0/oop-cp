import express from "express";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend"))); // serve frontend

// ------------------- GET LOGS -------------------
app.get("/logs", (req, res) => {
  const logPath = path.join(__dirname, "logs.txt");

  fs.readFile(logPath, "utf8", (err, data) => {
    if (err) return res.send("");
    res.type("text/plain").send(data);
  });
});

// ------------------- JSON Endpoints -------------------
app.get("/patients.json", (req, res) => {
  if (!fs.existsSync("patients.txt")) return res.json([]);
  const data = fs.readFileSync("patients.txt", "utf-8");
  const patients = data
    .split("\n")
    .filter(Boolean)
    .map(line => {
      const [id, name, age, gender, phone] = line.split(",");
      return { id, name, age, gender, phone };
    });
  res.json(patients);
});

app.get("/doctors.json", (req, res) => {
  const filePath = path.join(__dirname, "doctors.txt");
  if (!fs.existsSync(filePath)) return res.json([]);

  const data = fs.readFileSync(filePath, "utf-8");
  const doctors = data
    .split("\n")
    .filter(Boolean)
    .map(line => {
      // Split into 3 parts only (id, name, slots)
      const parts = line.split(",", 3);
      const id = parts[0].trim();
      const name = parts[1].trim();
      const slots = parts[2] ? parts[2].trim().split(" ").filter(Boolean) : [];
      return { id, name, defaultSlots: slots };
    });

  res.json(doctors);
});


app.get("/appointments.json", (req, res) => {
  if (!fs.existsSync("appointments.txt")) return res.json([]);
  const data = fs.readFileSync("appointments.txt", "utf-8");
  const appointments = data
    .split("\n")
    .filter(Boolean)
    .map(line => {
      const [patientID, doctorID, date, timeSlot] = line.split(",");
      return { patientID, doctorID, date, timeSlot };
    });
  res.json(appointments);
});

// ------------------- ADD PATIENT -------------------
app.post("/add-patient", (req, res) => {
  const { name, age, gender = "", phone = "" } = req.body;
  const exePath = path.join(__dirname, "clinic_booking.exe");

  const args = ["add_patient", name, age.toString()];
  if (gender) args.push(gender);
  if (phone) args.push(phone);

  const process = spawn(exePath, args);

  let generatedID = "";
  process.stdout.on("data", data => {
    const str = data.toString();
    const match = str.match(/NEW_ID:(\w+)/);
    if (match) generatedID = match[1];
  });

  process.stderr.on("data", data => console.error("Error:", data.toString()));

  process.on("close", () => {
    res.json({ message: "✅ Patient added successfully!", id: generatedID });
  });
});

// ------------------- ADD DOCTOR -------------------
app.post("/add-doctor", (req, res) => {
  const { name, slots = "" } = req.body;
  const exePath = path.join(__dirname, "clinic_booking.exe");

  const args = ["add_doctor", name, slots];

  const process = spawn(exePath, args);

  let generatedID = "";
  process.stdout.on("data", data => {
    const str = data.toString();
    const match = str.match(/NEW_ID:(\w+)/);
    if (match) generatedID = match[1];
  });

  process.stderr.on("data", data => console.error("Error:", data.toString()));

  process.on("close", () => {
    res.json({ message: "✅ Doctor added successfully!", id: generatedID });
  });
});

// ------------------- BOOK APPOINTMENT -------------------
app.post("/book-appointment", (req, res) => {
  const { patientID, doctorID, date, slot } = req.body;
  const exePath = path.join(__dirname, "clinic_booking.exe");

  const process = spawn(exePath, ["book_appointment", patientID, doctorID, date, slot]);

  let output = "";
  process.stdout.on("data", data => (output += data.toString()));
  process.stderr.on("data", data => console.error("Error:", data.toString()));
  process.on("close", () => res.send(output || "⚠️ No response from C++ program"));
});

// ------------------- RESCHEDULE APPOINTMENT -------------------
app.post("/reschedule-appointment", (req, res) => {
  const { patientID, doctorID, oldDate, oldSlot, newDate, newSlot } = req.body;
  const exePath = path.join(__dirname, "clinic_booking.exe");

  const process = spawn(exePath, [
    "reschedule_appointment",
    patientID,
    doctorID,
    oldDate,
    oldSlot,
    newDate,
    newSlot
  ]);

  let output = "";
  process.stdout.on("data", data => (output += data.toString()));
  process.stderr.on("data", data => console.error("Error:", data.toString()));
  process.on("close", () => res.send(output || "⚠️ No response from C++ program"));
});

// ------------------- CANCEL APPOINTMENT -------------------
app.post("/cancel-appointment", (req, res) => {
  const { patientID, doctorID, date, slot } = req.body;

  // Read appointments file
  let appointments = [];
  if (fs.existsSync("appointments.txt")) {
    appointments = fs.readFileSync("appointments.txt", "utf-8")
      .split("\n")
      .filter(Boolean)
      .map(line => {
        const [pid, did, dt, t] = line.split(",");
        return { patientID: pid, doctorID: did, date: dt, timeSlot: t };
      });
  }

  let found = false;
  appointments = appointments.map(a => {
    if (a.patientID === patientID && a.doctorID === doctorID &&
        a.date === date && a.timeSlot === slot) {
      found = true;
      return { ...a, timeSlot: slot + "-CANCELLED" };
    }
    return a;
  });

  if (!found) return res.send("⚠️ Appointment not found.");

  // Save updated appointments
  const dataToWrite = appointments.map(a => `${a.patientID},${a.doctorID},${a.date},${a.timeSlot}`).join("\n");
  fs.writeFileSync("appointments.txt", dataToWrite);

  // Log event
  const now = new Date();
  fs.appendFileSync("logs.txt", `[${now.toISOString()}] Cancelled appointment: ${patientID} with ${doctorID} on ${date} at ${slot}\n`);

  res.send("❌ Appointment cancelled successfully!");
});



// ------------------- START SERVER -------------------
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

