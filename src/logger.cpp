#include "logger.hpp"
#include <ctime>

LogDest Logger::destination = LogDest::STDOUT;
std::ofstream Logger::file_stream;
std::mutex Logger::log_mutex;
std::string Logger::log_filename;

void Logger::set_destination(LogDest dest, const std::string& filename) {
    std::lock_guard<std::mutex> lock(log_mutex);
    destination = dest;
    if (destination == LogDest::FILE) {
        if (!filename.empty()) {
            log_filename = filename;
            if (file_stream.is_open()) file_stream.close();
            file_stream.open(log_filename, std::ios::app);
        }
    } else {
        if (file_stream.is_open()) file_stream.close();
    }
}

void Logger::log(const std::string& msg) {
    write(msg, false);
}

void Logger::error(const std::string& msg, const char* file, int line) {
    std::string err_msg = "[ERROR] ";
    if (file) {
        err_msg += std::string(file);
        if (line > 0) {
            err_msg += ":" + std::to_string(line);
        }
        err_msg += ": ";
    }
    err_msg += msg;
    write(err_msg, true);
}

void Logger::write(const std::string& msg, bool is_error) {
    std::lock_guard<std::mutex> lock(log_mutex);
    // Timestamp
    std::time_t t = std::time(nullptr);
    char timebuf[32];
    std::strftime(timebuf, sizeof(timebuf), "%Y-%m-%d %H:%M:%S", std::localtime(&t));
    std::string out = std::string("[") + timebuf + "] " + msg + "\n";
    switch (destination) {
        case LogDest::FILE:
            if (file_stream.is_open()) file_stream << out << std::flush;
            break;
        case LogDest::STDOUT:
            std::cout << out << std::flush;
            break;
        case LogDest::STDERR:
            std::cerr << out << std::flush;
            break;
    }
}
