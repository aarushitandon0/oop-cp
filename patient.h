// patient.h
#pragma once
#include <string>
#include <vector>
#include <sstream>
#include "doctor.h"
class Patient : public Person {
    std::vector<int> appointmentHistory; // appointment IDs
    std::string phone;
    std::string email;
public:
    Patient(): Person() {}
    Patient(int id_, const std::string &name_, const std::string &phone_ = "", const std::string &email_ = "")
        : Person(id_, name_), phone(phone_), email(email_) {}

    void addToHistory(int apptId) { appointmentHistory.push_back(apptId); }
    const std::vector<int>& getHistory() const { return appointmentHistory; }

    void setPhone(const std::string &p) { phone = p; }
    void setEmail(const std::string &e) { email = e; }
    std::string getPhone() const { return phone; }
    std::string getEmail() const { return email; }

    // serialize: id|name|phone|email|id1;id2;id3
    std::string serialize() const {
        std::ostringstream oss;
        oss << id << "|" << name << "|" << phone << "|" << email << "|";
        bool first = true;
        for (int i : appointmentHistory) {
            if (!first) oss << ";";
            first = false;
            oss << i;
        }
        return oss.str();
    }

    static Patient deserialize(const std::string &line) {
        std::vector<std::string> parts;
        std::string tmp;
        std::istringstream iss(line);
        while (std::getline(iss, tmp, '|')) parts.push_back(tmp);
        Patient p;
        if (parts.size() >= 4) {
            p.id = std::stoi(parts[0]);
            p.name = parts[1];
            p.phone = parts[2];
            p.email = parts[3];
            if (parts.size() >= 5 && !parts[4].empty()) {
                std::istringstream hist(parts[4]);
                std::string idStr;
                while (std::getline(hist, idStr, ';')) {
                    if (!idStr.empty()) p.appointmentHistory.push_back(std::stoi(idStr));
                }
            }
        }
        return p;
    }
};
