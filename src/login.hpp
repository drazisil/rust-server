#ifndef LOGIN_HPP
#define LOGIN_HPP
#include <string>
#include <map>

class DBHandler;
class SessionManager;

// Returns a response string for AuthLogin, given query params. Checks 'limit' param for validity.
std::string handle_auth_login(const std::map<std::string, std::string>& params);
std::string handle_auth_login(const std::map<std::string, std::string>& params, DBHandler& db, SessionManager& session_mgr);

#endif // LOGIN_HPP
