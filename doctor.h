// Doctor.h
// Defines Person and Doctor classes
#pragma once

#include <string>
#include <map>
#include <set>
#include <vector>
#include <sstream>
#include <iostream>

class Person {
protected:
    int id;
    std::string name;
public:
    Person(): id(0), name("") {}
    Person(int id_, const std::string &name_): id(id_), name(name_) {}
    virtual ~Person() = default;
    int getId() const { return id; }
    std::string getName() const { return name; }
    void setName(const std::string &n) { name = n; }
};

class Doctor : public Person {
    // schedule: map<date-string, set<time-slot-string>>
    std::map<std::string, std::set<std::string>> availableSlots;
    std::string specialization;
public:
    Doctor() {}
    Doctor(int id_, const std::string &name_, const std::string &spec = "") :
        Person(id_, name_), specialization(spec) {}

    void setSpecialization(const std::string &s) { specialization = s; }
    std::string getSpecialization() const { return specialization; }

    // Add available slot for a date
    void addAvailableSlot(const std::string &date, const std::string &time) {
        availableSlots[date].insert(time);
    }
    // Remove available slot (e.g., when booked)
    bool removeAvailableSlot(const std::string &date, const std::string &time) {
        auto it = availableSlots.find(date);
        if (it == availableSlots.end()) return false;
        size_t erased = it->second.erase(time);
        if (it->second.empty()) availableSlots.erase(it);
        return erased > 0;
    }
    // Return copy of slots for a date
    std::set<std::string> getSlotsForDate(const std::string &date) const {
        auto it = availableSlots.find(date);
        if (it == availableSlots.end()) return {};
        return it->second;
    }

    // Serialization for file saving (CSV-ish)
    // Format: id|name|spec|date1,time1;time2#date2,time1;...
    std::string serialize() const {
        std::ostringstream oss;
        oss << id << "|" << name << "|" << specialization << "|";
        bool firstDate = true;
        for (auto &p : availableSlots) {
            if (!firstDate) oss << "#";
            firstDate = false;
            oss << p.first << ",";
            bool firstT = true;
            for (auto &t : p.second) {
                if (!firstT) oss << ";";
                firstT = false;
                oss << t;
            }
        }
        return oss.str();
    }

    static Doctor deserialize(const std::string &line) {
        std::vector<std::string> parts;
        std::string tmp;
        std::istringstream iss(line);
        while (std::getline(iss, tmp, '|')) parts.push_back(tmp);
        Doctor d;
        if (parts.size() >= 3) {
            d.id = std::stoi(parts[0]);
            d.name = parts[1];
            d.specialization = parts[2];
            if (parts.size() >= 4 && !parts[3].empty()) {
                std::istringstream datesSS(parts[3]);
                std::string dateChunk;
                while (std::getline(datesSS, dateChunk, '#')) {
                    auto commaPos = dateChunk.find(',');
                    if (commaPos == std::string::npos) continue;
                    std::string date = dateChunk.substr(0, commaPos);
                    std::string times = dateChunk.substr(commaPos + 1);
                    std::istringstream timesSS(times);
                    std::string t;
                    while (std::getline(timesSS, t, ';')) {
                        if(!t.empty()) d.availableSlots[date].insert(t);
                    }
                }
            }
        }
        return d;
    }
};
