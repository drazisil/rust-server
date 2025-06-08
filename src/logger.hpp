#ifndef LOGGER_HPP
#define LOGGER_HPP

#include <string>
#include <fstream>
#include <iostream>
#include <mutex>

// Logger destination
enum class LogDest {
    FILE,
    STDOUT,
    STDERR
};

class Logger {
public:
    static void set_destination(LogDest dest, const std::string& filename = "");
    static void log(const std::string& msg);
    static void error(const std::string& msg, const char* file = nullptr, int line = 0);
private:
    static LogDest destination;
    static std::ofstream file_stream;
    static std::mutex log_mutex;
    static std::string log_filename;
    static void write(const std::string& msg, bool is_error = false);
};

// Macros for logging
#define LOG(msg) Logger::log(msg)
#define LOG_ERROR(msg) Logger::error(msg, __FILE__, __LINE__)

#endif // LOGGER_HPP
