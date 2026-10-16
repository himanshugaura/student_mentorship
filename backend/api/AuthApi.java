package api;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import server.Database;
import server.JsonUtil;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.Map;

public class AuthApi implements HttpHandler {

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (JsonUtil.handleCorsPreflight(exchange)) return;

        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod().toUpperCase();
        String query = exchange.getRequestURI().getQuery();
        String body = JsonUtil.readBody(exchange);

        try {
            
            if (path.equals("/api/register") && method.equals("POST")) {
                handleRegister(exchange, body);
                return;
            }

            
            if (path.equals("/api/login") && method.equals("POST")) {
                handleLogin(exchange, body);
                return;
            }

            
            if (path.equals("/api/users") && method.equals("GET")) {
                handleGetUsers(exchange, query);
                return;
            }

            
            if (path.startsWith("/api/users/") && method.equals("DELETE")) {
                long userId = Long.parseLong(path.substring("/api/users/".length()));
                handleDeleteUser(exchange, userId);
                return;
            }

            JsonUtil.sendJson(exchange, 404, "{\"error\": \"Auth endpoint not found\"}");
        } catch (Exception e) {
            e.printStackTrace();
            JsonUtil.sendJson(exchange, 500, "{\"error\": \"" + JsonUtil.escape(e.getMessage()) + "\"}");
        }
    }

    private void handleRegister(HttpExchange exchange, String body) throws Exception {
        Map<String, String> data = JsonUtil.parseJson(body);
        String name = data.get("name");
        String email = data.get("email");
        String password = data.get("password");
        String role = data.getOrDefault("role", "STUDENT").toUpperCase();
        String dept = data.getOrDefault("department", "");
        String phone = data.getOrDefault("phone", "");
        String rollNumber = data.getOrDefault("rollNumber", "");

        if (name == null || email == null || password == null) {
            JsonUtil.sendJson(exchange, 400, "{\"error\": \"Name, email, and password are required\"}");
            return;
        }

        
        if ("STUDENT".equalsIgnoreCase(role)) {
            if (rollNumber == null || !rollNumber.trim().matches("^\\d{8}$")) {
                JsonUtil.sendJson(exchange, 400, "{\"error\": \"Student ID must be exactly 8 digits (e.g. 24042824)\"}");
                return;
            }
            rollNumber = rollNumber.trim();
        }

        try (Connection conn = Database.getConnection();
             PreparedStatement checkStmt = conn.prepareStatement("SELECT id FROM users WHERE email = ?");
             PreparedStatement insertStmt = conn.prepareStatement(
                     "INSERT INTO users (name, email, password, role, department, phone, roll_number) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id")) {

            checkStmt.setString(1, email);
            if (checkStmt.executeQuery().next()) {
                JsonUtil.sendJson(exchange, 400, "{\"error\": \"Email is already registered\"}");
                return;
            }

            insertStmt.setString(1, name);
            insertStmt.setString(2, email);
            insertStmt.setString(3, password);
            insertStmt.setString(4, role);
            insertStmt.setString(5, dept);
            insertStmt.setString(6, phone);
            insertStmt.setString(7, rollNumber);

            ResultSet rs = insertStmt.executeQuery();
            long newId = rs.next() ? rs.getLong(1) : 0;

            String response = "{"
                    + "\"message\": \"Registration successful\","
                    + "\"userId\": " + newId + ","
                    + "\"name\": \"" + JsonUtil.escape(name) + "\","
                    + "\"email\": \"" + JsonUtil.escape(email) + "\","
                    + "\"role\": \"" + role + "\""
                    + "}";
            JsonUtil.sendJson(exchange, 200, response);
        }
    }

    private void handleLogin(HttpExchange exchange, String body) throws Exception {
        Map<String, String> data = JsonUtil.parseJson(body);
        String email = data.get("email");
        String password = data.get("password");

        try (Connection conn = Database.getConnection();
             PreparedStatement stmt = conn.prepareStatement("SELECT * FROM users WHERE email = ? AND password = ?")) {
            stmt.setString(1, email);
            stmt.setString(2, password);

            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                long id = rs.getLong("id");
                String name = rs.getString("name");
                String role = rs.getString("role");
                String dept = rs.getString("department");
                Object mentorObj = rs.getObject("mentor_id");
                Long mentorId = (mentorObj instanceof Number) ? ((Number) mentorObj).longValue() : null;
                String mentorName = rs.getString("mentor_name");

                String response = "{"
                        + "\"message\": \"Login successful\","
                        + "\"userId\": " + id + ","
                        + "\"name\": \"" + JsonUtil.escape(name) + "\","
                        + "\"email\": \"" + JsonUtil.escape(email) + "\","
                        + "\"role\": \"" + JsonUtil.escape(role) + "\","
                        + "\"department\": \"" + JsonUtil.escape(dept != null ? dept : "") + "\","
                        + "\"mentorId\": " + (mentorId != null ? mentorId : "null") + ","
                        + "\"mentorName\": " + (mentorName != null ? "\"" + JsonUtil.escape(mentorName) + "\"" : "null")
                        + "}";
                JsonUtil.sendJson(exchange, 200, response);
            } else {
                JsonUtil.sendJson(exchange, 401, "{\"error\": \"Invalid email or password\"}");
            }
        }
    }

    private void handleGetUsers(HttpExchange exchange, String query) throws Exception {
        String roleFilter = null;
        if (query != null && query.contains("role=")) {
            roleFilter = query.split("role=")[1].split("&")[0].toUpperCase();
        }

        String sql = roleFilter != null ? "SELECT * FROM users WHERE role = ? ORDER BY id" : "SELECT * FROM users ORDER BY id";
        try (Connection conn = Database.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            if (roleFilter != null) {
                stmt.setString(1, roleFilter);
            }
            ResultSet rs = stmt.executeQuery();
            JsonUtil.sendJson(exchange, 200, JsonUtil.resultSetToJson(rs));
        }
    }

    private void handleDeleteUser(HttpExchange exchange, long userId) throws Exception {
        try (Connection conn = Database.getConnection();
             PreparedStatement stmt = conn.prepareStatement("DELETE FROM users WHERE id = ?")) {
            stmt.setLong(1, userId);
            int rows = stmt.executeUpdate();
            if (rows > 0) {
                JsonUtil.sendJson(exchange, 200, "{\"message\": \"User deleted successfully\"}");
            } else {
                JsonUtil.sendJson(exchange, 404, "{\"error\": \"User not found\"}");
            }
        }
    }
}
