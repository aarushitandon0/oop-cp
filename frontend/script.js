// ------------------ UTILITY FETCH ------------------
async function fetchJSON(url) {
  const res = await fetch(url);
  return await res.json();
}

// ------------------ LOAD LOGS ------------------
async function loadLogs() {
  const res = await fetch("/logs");
  const text = await res.text();
  const container = document.getElementById("logsContainer");
  container.innerHTML = "";

  text.split("\n").forEach(line => {
    if (line.trim().length > 0) {
      const li = document.createElement("li");
      li.textContent = line;
      container.appendChild(li);
    }
  });
}

// ------------------ LOAD PATIENTS ------------------
async function loadPatients() {
  const patients = await fetchJSON("/patients.json");
  const patientSelect = document.getElementById("appointmentPatient");
  const patientsContainer = document.getElementById("patientsContainer");

  patientSelect.innerHTML = '<option value="">-- Select Patient --</option>';
  patientsContainer.innerHTML = "";

  patients.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.name} (${p.id})`;
    patientSelect.appendChild(opt);

    const li = document.createElement("li");
    li.textContent = `${p.id} - ${p.name} | Age: ${p.age} | Gender: ${p.gender} | Phone: ${p.phone}`;
    patientsContainer.appendChild(li);
  });
}

// ------------------ LOAD DOCTORS ------------------
async function loadDoctors() {
  const doctors = await fetchJSON("/doctors.json");
  const doctorSelect = document.getElementById("appointmentDoctor");
  const doctorsContainer = document.getElementById("doctorsContainer");

  doctorSelect.innerHTML = '<option value="">-- Select Doctor --</option>';
  doctorsContainer.innerHTML = "";

  doctors.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = `${d.name} (${d.id})`;
    doctorSelect.appendChild(opt);

    const li = document.createElement("li");
    li.textContent = `${d.id} - ${d.name} | Slots: ${d.defaultSlots.join(", ")}`;
    doctorsContainer.appendChild(li);
  });
}

// ------------------ UPDATE AVAILABLE SLOTS ------------------
async function updateAvailableSlots(dateInput, doctorSelect, timeSelect) {
  const doctorID = doctorSelect.value;
  const date = dateInput.value;

  if (!doctorID || !date) {
    timeSelect.innerHTML = '<option value="">-- Select Slot --</option>';
    return;
  }

  const doctors = await fetchJSON("/doctors.json");
  const appointments = await fetchJSON("/appointments.json");

  const doctor = doctors.find(d => d.id === doctorID);
  if (!doctor || !doctor.defaultSlots || doctor.defaultSlots.length === 0) {
    timeSelect.innerHTML = '<option value="">-- No slots available --</option>';
    return;
  }

  timeSelect.innerHTML = '<option value="">-- Select Slot --</option>';
  doctor.defaultSlots.forEach(slot => {
    const booked = appointments.some(a =>
      a.doctorID === doctorID &&
      a.date === date &&
      a.timeSlot === slot &&
      !a.timeSlot.endsWith("-CANCELLED")
    );

    const opt = document.createElement("option");
    opt.value = slot;
    opt.textContent = booked ? `${slot} (Booked)` : slot;
    if (booked) opt.disabled = true;
    timeSelect.appendChild(opt);
  });
}

// ------------------ SET MIN DATE ------------------
function setMinDate(dateInput) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  dateInput.min = `${yyyy}-${mm}-${dd}`;
}

// ------------------ LOAD APPOINTMENTS ------------------
async function loadAppointments() {
  const appointments = await fetchJSON("/appointments.json");
  const activeContainer = document.getElementById("appointmentsContainer");
  const cancelledContainer = document.getElementById("cancelledAppointmentsContainer");

  activeContainer.innerHTML = "";
  cancelledContainer.innerHTML = "";

  const doctors = await fetchJSON("/doctors.json");

  appointments.forEach(a => {
    const isCancelled = a.timeSlot.endsWith("-CANCELLED");
    const displaySlot = isCancelled ? a.timeSlot.replace("-CANCELLED", "") : a.timeSlot;

    const card = document.createElement("div");
    card.className = isCancelled ? "appointment-card cancelled" : "appointment-card";
    card.innerHTML = `
      <p><strong>Patient:</strong> ${a.patientID}</p>
      <p><strong>Doctor:</strong> ${a.doctorID}</p>
      <p><strong>Date:</strong> ${a.date}</p>
      <p><strong>Time:</strong> ${displaySlot}</p>
      <div style="display:flex; gap:6px; margin-top:8px;">
        <button class="reschedule">Reschedule</button>
        ${!isCancelled ? '<button class="cancel">Cancel</button>' : ''}
      </div>
    `;

    const container = isCancelled ? cancelledContainer : activeContainer;

    // ------------------ CANCEL ------------------
    if (!isCancelled) {
      card.querySelector(".cancel").addEventListener("click", async () => {
        if (!confirm("Cancel this appointment?")) return;
        const res = await fetch("/cancel-appointment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientID: a.patientID,
            doctorID: a.doctorID,
            date: a.date,
            slot: displaySlot
          })
        });
        alert(await res.text());
        loadAppointments();
        loadLogs();
        updateAvailableSlots(document.getElementById("appointmentDate"), document.getElementById("appointmentDoctor"), document.getElementById("appointmentTime"));
      });
    }

    // ------------------ RESCHEDULE ------------------
    card.querySelector(".reschedule").addEventListener("click", async () => {
      // Create modal-like prompt using select inputs
      const modal = document.createElement("div");
      modal.style = "position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center;";
      const form = document.createElement("div");
      form.style = "background:#fff; padding:20px; border-radius:8px; min-width:300px;";

      const dateInput = document.createElement("input");
      dateInput.type = "date";
      dateInput.value = a.date;
      setMinDate(dateInput);

      const doctorSelect = document.createElement("select");
      doctors.forEach(d => {
        const opt = document.createElement("option");
        opt.value = d.id;
        opt.textContent = `${d.name} (${d.id})`;
        if (d.id === a.doctorID) opt.selected = true;
        doctorSelect.appendChild(opt);
      });

      const slotSelect = document.createElement("select");

      updateAvailableSlots(dateInput, doctorSelect, slotSelect);

      dateInput.addEventListener("change", () => updateAvailableSlots(dateInput, doctorSelect, slotSelect));
      doctorSelect.addEventListener("change", () => updateAvailableSlots(dateInput, doctorSelect, slotSelect));

      const submitBtn = document.createElement("button");
      submitBtn.textContent = "Reschedule";
      submitBtn.style = "margin-top:10px;";
      submitBtn.addEventListener("click", async () => {
        const newDate = dateInput.value;
        const newSlot = slotSelect.value;
        if (!newDate || !newSlot) return alert("Select both date and slot!");

        const res = await fetch("/reschedule-appointment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientID: a.patientID,
            doctorID: a.doctorID,
            oldDate: a.date,
            oldSlot: displaySlot,
            newDate,
            newSlot
          })
        });
        alert(await res.text());
        document.body.removeChild(modal);
        loadAppointments();
        loadLogs();
        updateAvailableSlots(document.getElementById("appointmentDate"), document.getElementById("appointmentDoctor"), document.getElementById("appointmentTime"));
      });

      form.appendChild(dateInput);
      form.appendChild(document.createElement("br"));
      form.appendChild(doctorSelect);
      form.appendChild(document.createElement("br"));
      form.appendChild(slotSelect);
      form.appendChild(submitBtn);
      modal.appendChild(form);
      document.body.appendChild(modal);
    });

    container.appendChild(card);
  });
}

// ------------------ EVENT LISTENERS ------------------

// Add Patient
document.getElementById("patientForm").addEventListener("submit", async e => {
  e.preventDefault();
  const name = document.getElementById("patientName").value.trim();
  const age = document.getElementById("patientAge").value.trim();
  const gender = prompt("Enter Gender (M/F):") || "NA";
  const phone = prompt("Enter Phone Number:") || "NA";

  const res = await fetch("/add-patient", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, age, gender, phone })
  });
  alert(await res.text());
  loadPatients();
  loadLogs();
});

// Add Doctor
document.getElementById("doctorForm").addEventListener("submit", async e => {
  e.preventDefault();
  const name = document.getElementById("doctorName").value.trim();
  const slots = document.getElementById("doctorSlots").value.trim();

  const res = await fetch("/add-doctor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, slots })
  });
  alert(await res.text());
  loadDoctors();
  loadLogs();
});

// Book Appointment
document.getElementById("appointmentForm").addEventListener("submit", async e => {
  e.preventDefault();
  const patientID = document.getElementById("appointmentPatient").value;
  const doctorID = document.getElementById("appointmentDoctor").value;
  const date = document.getElementById("appointmentDate").value;
  const slot = document.getElementById("appointmentTime").value;

  const res = await fetch("/book-appointment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patientID, doctorID, date, slot })
  });
  document.getElementById("appointmentMessage").textContent = await res.text();
  loadAppointments();
  updateAvailableSlots(document.getElementById("appointmentDate"), document.getElementById("appointmentDoctor"), document.getElementById("appointmentTime"));
  loadLogs();
});

// ------------------ INITIAL LOAD ------------------
loadPatients();
loadDoctors();
loadAppointments();
loadLogs();

// Auto-refresh logs every 2 seconds
setInterval(loadLogs, 2000);

// Set min date for main appointment picker
setMinDate(document.getElementById("appointmentDate"));

// Add event listeners for date and doctor changes to update available slots
document.getElementById("appointmentDate").addEventListener("change", () => {
  updateAvailableSlots(
    document.getElementById("appointmentDate"),
    document.getElementById("appointmentDoctor"),
    document.getElementById("appointmentTime")
  );
});

document.getElementById("appointmentDoctor").addEventListener("change", () => {
  updateAvailableSlots(
    document.getElementById("appointmentDate"),
    document.getElementById("appointmentDoctor"),
    document.getElementById("appointmentTime")
  );
});