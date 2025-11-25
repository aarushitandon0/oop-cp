#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <sstream>
#include <iomanip>
#include <ctime>
#include <algorithm>
using namespace std;

// ------------------ UTILITY ------------------
string trim(const string &s) {
    size_t start = s.find_first_not_of(" \t\r\n");
    size_t end = s.find_last_not_of(" \t\r\n");
    return (start == string::npos) ? "" : s.substr(start, end - start + 1);
}

// CLASS: Patient
class Patient {
public:
    string id, name, gender, phone;
    int age;

    Patient() {}
    Patient(string i, string n, int a, string g, string p) : id(i), name(n), age(a), gender(g), phone(p) {}

    string serialize() const {
        return id + "," + name + "," + to_string(age) + "," + gender + "," + phone + "\n";
    }

    static Patient deserialize(const string &line) {
        stringstream ss(line);
        string id, name, gender, phone, ageStr;
        getline(ss, id, ','); getline(ss, name, ','); getline(ss, ageStr, ',');
        getline(ss, gender, ','); getline(ss, phone, ',');
        return Patient(id, name, stoi(ageStr), gender, phone);
    }
};

// CLASS: Doctor
class Doctor {
public:
    string id, name;
    vector<string> defaultSlots;

    Doctor() {}
    Doctor(string i, string n, vector<string> s) : id(i), name(n), defaultSlots(s) {}

    string serialize() const {
        string s = id + "," + name + ",";
        for (auto &slot : defaultSlots) s += slot + " ";
        s += "\n";
        return s;
    }

    static Doctor deserialize(const string &line) {
        stringstream ss(line);
        string id, name, slotLine;
        getline(ss, id, ','); getline(ss, name, ','); getline(ss, slotLine);
        vector<string> slots; stringstream sslot(slotLine); string slot;
        while (sslot >> slot) slots.push_back(slot);
        return Doctor(id, name, slots);
    }
};

// CLASS: Appointment
class Appointment {
public:
    string patientID, doctorID, date, timeSlot, status="active";

    Appointment() {}
    Appointment(string p, string d, string dt, string t, string st="active") : patientID(p), doctorID(d), date(dt), timeSlot(t), status(st) {}

    string serialize() const {
        return patientID + "," + doctorID + "," + date + "," + timeSlot + "," + status + "\n";
    }

    static Appointment deserialize(const string &line) {
        stringstream ss(line);
        string pid, did, date, slot, stat;
        getline(ss, pid, ','); getline(ss, did, ','); getline(ss, date, ','); getline(ss, slot, ','); getline(ss, stat, ',');
        if(stat.empty()) stat="active";
        return Appointment(pid, did, date, slot, stat);
    }
};

// CLASS: ClinicSystem
class ClinicSystem {
private:
    vector<Patient> patients;
    vector<Doctor> doctors;
    vector<Appointment> appointments;

public:
    vector<Patient>& getPatients() { return patients; }
    vector<Doctor>& getDoctors() { return doctors; }
    vector<Appointment>& getAppointments() { return appointments; }

    void bookAppointmentFromArgs(string pid, string docID, string date, string slot) {
        appointments.push_back(Appointment(pid, docID, date, slot));
        saveAppointments();
    }

    void logEvent(const string &event) {
        ofstream fout("logs.txt", ios::app);
        time_t now = time(0); tm *ltm = localtime(&now);
        char timestamp[30];
        sprintf(timestamp, "%04d-%02d-%02d %02d:%02d:%02d",
                1900 + ltm->tm_year, 1 + ltm->tm_mon, ltm->tm_mday,
                ltm->tm_hour, ltm->tm_min, ltm->tm_sec);
        fout << "[" << timestamp << "] " << event << "\n";
        fout.close();
    }

    ClinicSystem() { loadPatients(); loadDoctors(); loadAppointments(); }

    void loadPatients() {
        ifstream fin("patients.txt"); string line;
        while(getline(fin, line)) { if(!line.empty()) patients.push_back(Patient::deserialize(line)); }
        fin.close();
    }
    void savePatients() { ofstream fout("patients.txt"); for(auto &p:patients) fout<<p.serialize(); fout.close(); }

    void loadDoctors() {
        ifstream fin("doctors.txt");
        if(!fin) { ofstream fout("doctors.txt"); fout<<"D1,Dr. Mehta,10:00-11:00 11:00-12:00 12:00-13:00\n"; fout<<"D2,Dr. Sharma,09:00-10:00 10:00-11:00 11:00-12:00\n"; fout.close(); fin.open("doctors.txt"); }
        string line;
        while(getline(fin, line)) { if(!line.empty()) doctors.push_back(Doctor::deserialize(line)); }
        fin.close();
    }
    void saveDoctors() { ofstream fout("doctors.txt"); for(auto &d:doctors) fout<<d.serialize(); fout.close(); }

    void loadAppointments() {
        ifstream fin("appointments.txt"); string line;
        while(getline(fin, line)) { 
            if(line.empty()) continue; 
            while(!line.empty()&&(line.back()=='\r'||line.back()==' '||line.back()=='\t')) line.pop_back(); 
            appointments.push_back(Appointment::deserialize(line)); 
        }
        fin.close();
    }
    void saveAppointments() { ofstream fout("appointments.txt"); for(auto &a:appointments) fout<<a.serialize(); fout.close(); }

    string generatePatientID() { int maxID=0; for(auto &p:patients){ if(p.id[0]=='P'){ int num=stoi(p.id.substr(1)); maxID=max(maxID,num); } } return "P"+to_string(maxID+1); }
    string generateDoctorID() { int maxID=0; for(auto &d:doctors){ if(d.id[0]=='D'){ int num=stoi(d.id.substr(1)); maxID=max(maxID,num); } } return "D"+to_string(maxID+1); }

    bool isSlotAvailable(string docID, string date, string slot) {
        for(auto &a:appointments) if(a.doctorID==docID && a.date==date && a.timeSlot==slot && a.status=="active") return false;
        return true;
    }
};

// MAIN
int main(int argc, char* argv[]) {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    ClinicSystem system;

    if(argc>1){
        string mode=argv[1];

        if(mode=="add_patient" && argc>=4 && argc<=6){
            string name=argv[2]; int age=stoi(argv[3]);
            string gender=(argc>=5)?argv[4]:"NA"; string phone=(argc==6)?argv[5]:"NA";
            auto normalize=[](const string &val){ return (val.empty()||val=="undefined"||val=="null"||val=="NA")?"NA":val; };
            gender=normalize(gender); phone=normalize(phone);
            string id=system.generatePatientID();
            system.getPatients().push_back(Patient(id,name,age,gender,phone));
            system.savePatients();
            system.logEvent("Added patient: "+id+" - "+name+" (Age "+to_string(age)+", Gender "+gender+")");
            cout<<"NEW_ID:"<<id<<"\n✅ Patient added successfully!\n";
            return 0;
        }

        else if(mode=="add_doctor" && argc==4){
            string name=argv[2]; string slotStr=argv[3];
            string id=system.generateDoctorID();
            vector<string> slots; stringstream ss(slotStr); string temp;
            while(ss>>temp) slots.push_back(temp);
            if(slots.empty()) slots={"09:00-10:00"};
            system.getDoctors().push_back(Doctor(id,name,slots));
            system.saveDoctors();
            system.logEvent("Added doctor: "+id+" - "+name);
            cout<<"NEW_ID:"<<id<<"\n✅ Doctor added successfully!\n";
            return 0;
        }

        else if(mode=="book_appointment" && argc==6){
            string pid=argv[2], docID=argv[3], date=argv[4], slot=argv[5];
            if(!system.isSlotAvailable(docID,date,slot)){ cout<<"❌ Slot not available!\n"; return 0; }
            system.bookAppointmentFromArgs(pid,docID,date,slot);
            system.logEvent("Booked appointment: Patient "+pid+" with Doctor "+docID+" on "+date+" at "+slot);
            cout<<"✅ Appointment booked successfully!\n"; return 0;
        }

        else if(mode=="cancel_appointment" && argc==6){
            string pid=argv[2], docID=argv[3], date=argv[4], slot=argv[5];
            bool found=false;
            for(auto &a:system.getAppointments()){
                if(a.patientID==pid && a.doctorID==docID && a.date==date && a.timeSlot==slot && a.status=="active"){
                    a.status="cancelled"; system.saveAppointments();
                    system.logEvent("Cancelled appointment: Patient "+pid+" with Doctor "+docID+" on "+date+" at "+slot);
                    cout<<"❌ Appointment cancelled successfully!\n"; found=true; break;
                }
            }
            if(!found) cout<<"⚠️ Appointment not found.\n";
            return 0;
        }

        else if(mode=="reschedule_appointment" && argc==8){
            string pid=argv[2], docID=argv[3], oldDate=argv[4], oldSlot=argv[5], newDate=argv[6], newSlot=argv[7];
            bool found=false;
            for(auto &a:system.getAppointments()){
                // Compare ignoring -CANCELLED suffix
                string slotForCheck = a.timeSlot;
                if(slotForCheck.size() > 10 && slotForCheck.substr(slotForCheck.size()-10) == "-CANCELLED")
                    slotForCheck = slotForCheck.substr(0, slotForCheck.size()-10);

                if(a.patientID==pid && a.doctorID==docID &&
                   trim(a.date)==trim(oldDate) &&
                   trim(slotForCheck)==trim(oldSlot) &&
                   (a.status=="active" || a.status=="cancelled")) {

                    if(!system.isSlotAvailable(docID,newDate,newSlot)){
                        cout<<"❌ New slot not available!\n"; 
                        return 0;
                    }

                    a.date=newDate;
                    a.timeSlot=newSlot;
                    a.status="active";
                    system.saveAppointments();
                    system.logEvent("Rescheduled appointment: Patient "+pid+" from "+oldDate+" "+oldSlot+" to "+newDate+" "+newSlot);
                    cout<<"🔁 Appointment rescheduled successfully!\n";
                    found=true;
                    break;
                }
            }
            if(!found) cout<<"⚠️ Appointment not found.\n"; 
            return 0;
        }

        else{ cout<<"❌ Invalid command or arguments.\n"; return 0; }
    }

    return 0;
}
