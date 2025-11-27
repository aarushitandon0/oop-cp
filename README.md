🏥 Clinic Appointment Management System

A lightweight yet fully functional Patient–Doctor scheduling system built using C++, Node.js (Express), and a Frontend UI powered by HTML/CSS/JavaScript.

This project handles patient management, doctor management, appointment booking, rescheduling, cancellations, and real-time logs.  All without using a heavy SQL database.

🚀 Features

👤 Patient Management

-Add patients with name, age, gender, and phone number

-Auto-generated Patient IDs (P1, P2, …)

-Stored in patients.txt

🩺 Doctor Management

-Add doctors with name + available time slots

-Auto-generated Doctor IDs (D1, D2, …)

-Stored in doctors.txt

📅 Appointment Booking

-Select patient → doctor → date → slot

-System checks if the slot is free

-Saves the appointment in appointments.txt

-Status is saved as active

🔄 Rescheduling

-Allows changing date & time

-Old appointment updated safely

-Prevents conflicts and double bookings

❌ Cancellation

-Appointments aren’t deleted — they’re flagged as cancelled

-Cancelled appointments appear in a separate UI section

-Helps maintain an audit trail

📝 Real-Time Logging

-Every action (add, book, cancel, reschedule) is logged in logs.txt

-Frontend auto-refreshes logs every 2 seconds



🧠 How the Architecture Works
 1. Frontend (HTML + JS)

 -Provides a simple dashboard to manage the system

 -Uses fetch() to talk to the backend

 -Dynamically loads patients, doctors, slots, and appointments

 -Displays active and cancelled appointments separately

 -Real-time log viewer

2. Backend (Node.js Express)
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

      Handles API routes:

      GET /patients.json – returns all patients

      GET /doctors.json – returns all doctors w/ default slots

      GET /appointments.json – returns current appointment list

      POST /book-appointment – books an appointment

      POST /cancel-appointment – flags an appointment as cancelled

      POST /reschedule-appointment – updates an appointment

      POST /add-patient, POST /add-doctor – adds new entries

 For each action, it calls the C++ executable.
 
 3. Core Logic (C++ Program)

 Handles business logic:

 -ID generation

 -Slot validation

 -Appointment updates

 -File handling

 -Data persistence

 -Status handling (active/cancelled)

 -Event logging


  [Project Text Files]
    
</head>
<body>

    doctors.txt
    patients.txt
    appointments.txt
    logs.txt

        

    
[Folder system]
        </pre>
    </div>

       Clinic-System/
       │
       ├── frontend/
       │   ├── index.html
       │   ├── script.js
       │   ├── style.css
       │
       ├── clinic_booking.cpp
       ├── clinic_booking.exe
       ├── server.js
       │
       ├── patients.txt
       ├── doctors.txt
       ├── appointments.txt
       └── logs.txt
[▶️ How to Run the Project]
 
        1. Compile the C++ file
           g++ clinic_booking.cpp -o clinic_booking.exe
        2. Install Node dependencies
           npm install express
        3. Start the server
           node server.js
        4. Open the frontend
           Visit:
           http://localhost:3000

[🧪 Terminal Commands (Direct C++ Operations)]

          Add Patient
          clinic_booking.exe add_patient "John" 22 Male 9876543210

          Add Doctor
          clinic_booking.exe add_doctor "Dr. Mehta" "09:00-10:00 10:00-11:00"

          Book Appointment
          clinic_booking.exe book_appointment P1 D1 2025-11-21 10:00-11:00

          Cancel Appointment
          clinic_booking.exe cancel_appointment P1 D1 2025-11-21 10:00-11:00

          Reschedule Appointment
          clinic_booking.exe reschedule_appointment P1 D1 2025-11-21 10:00-11:00 2025-11-22 11:00-12:00


🎯 Highlight of This Project

No database — fully text-file driven

Works like a real clinic management system

Clean separation of UI, backend, and logic

Great learning project for file handling + C++ logic + Express backend + frontend integration

</body>
</html>


 
