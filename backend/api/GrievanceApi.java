package api;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import server.Database;
import server.JsonUtil;

import java.io.IOException;
import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

public class GrievanceApi implements HttpHandler {

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (JsonUtil.handleCorsPreflight(exchange)) return;

        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod().toUpperCase();
        String body = JsonUtil.readBody(exchange);

        try {
            
            if (path.equals("/api/grievances") && method.equals("POST")) {
                handleSubmitGrievance(exchange, body);
                return;
            }

            
            if (path.equals("/api/grievances") && method.equals("GET")) {
                handleGetAllGrievances(exchange);
                return;
            }

            
            if (path.startsWith("/api/grievances/student/") && method.equals("GET")) {
                long studentId = Long.parseLong(path.substring("/api/grievances/student/".length()));
                handleGetByStudent(exchange, studentId);
                return;
            }

            
            if (path.startsWith("/api/grievances/mentor/") && method.equals("GET")) {
                long mentorId = Long.parseLong(path.substring("/api/grievances/mentor/".length()));
                handleGetByMentor(exchange, mentorId);
                return;
            }

            
            if (path.matches("/api/grievances/\\d+/status") && (method.equals("PUT") || method.equals("POST"))) {
                long id = Long.parseLong(path.split("/")[3]);
                handleUpdateStatus(exchange, id, body);
                return;
            }


            
            if (path.matches("/api/grievances/\\d+") && method.equals("GET")) {
                long id = Long.parseLong(path.substring("/api/grievances/".length()));
                handleGetById(exchange, id);
                return;
            }

            JsonUtil.sendJson(exchange, 404, "{\"error\": \"Grievance endpoint not found\"}");
        } catch (Exception e) {
            e.printStackTrace();
            JsonUtil.sendJson(exchange, 500, "{\"error\": \"" + JsonUtil.escape(e.getMessage()) + "\"}");
        }
    }

    private void handleSubmitGrievance(HttpExchange exchange, String body) throws Exception {
        Map<String, String> data = JsonUtil.parseJson(body);
        String title = data.get("title");
        String desc = data.get("description");
        String category = data.get("category");
        String priority = data.getOrDefault("priority", "Medium");
        Long studentId = data.containsKey("studentId") ? Long.parseLong(data.get("studentId")) : null;
        String studentName = data.get("studentName");

        if (title == null || desc == null) {
            JsonUtil.sendJson(exchange, 400, "{\"error\": \"Title and description are required\"}");
            return;
        }

        
        if (category == null || category.trim().isEmpty() || category.equalsIgnoreCase("Other")) {
            category = detectCategory(title, desc);
        }

        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        Long mentorId = null;

        if (studentId != null) {
            try (Connection conn = Database.getConnection();
                 PreparedStatement uStmt = conn.prepareStatement("SELECT name, mentor_id FROM users WHERE id = ?")) {
                uStmt.setLong(1, studentId);
                ResultSet rs = uStmt.executeQuery();
                if (rs.next()) {
                    if (studentName == null) studentName = rs.getString("name");
                    Object mObj = rs.getObject("mentor_id");
                    mentorId = (mObj instanceof Number) ? ((Number) mObj).longValue() : null;
                }
            }
        }

        try (Connection conn = Database.getConnection();
             PreparedStatement stmt = conn.prepareStatement("""
                 INSERT INTO grievances (title, description, category, priority, status, student_id, student_name, mentor_id, created_at)
                 VALUES (?, ?, ?, ?, 'Submitted', ?, ?, ?, ?) RETURNING id
             """)) {
            stmt.setString(1, title);
            stmt.setString(2, desc);
            stmt.setString(3, category);
            stmt.setString(4, priority);
            stmt.setObject(5, studentId);
            stmt.setString(6, studentName);
            stmt.setObject(7, mentorId);
            stmt.setString(8, now);

            ResultSet rs = stmt.executeQuery();
            long newId = rs.next() ? rs.getLong(1) : 0;

            String response = "{"
                    + "\"message\": \"Grievance submitted successfully\","
                    + "\"id\": " + newId + ","
                    + "\"title\": \"" + JsonUtil.escape(title) + "\","
                    + "\"category\": \"" + JsonUtil.escape(category) + "\","
                    + "\"priority\": \"" + JsonUtil.escape(priority) + "\","
                    + "\"status\": \"Submitted\","
                    + "\"createdAt\": \"" + now + "\""
                    + "}";
            JsonUtil.sendJson(exchange, 200, response);
        }
    }

    private void handleGetAllGrievances(HttpExchange exchange) throws Exception {
        try (Connection conn = Database.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT * FROM grievances ORDER BY id DESC")) {
            JsonUtil.sendJson(exchange, 200, JsonUtil.resultSetToJson(rs));
        }
    }

    private void handleGetByStudent(HttpExchange exchange, long studentId) throws Exception {
        try (Connection conn = Database.getConnection();
             PreparedStatement stmt = conn.prepareStatement("SELECT * FROM grievances WHERE student_id = ? ORDER BY id DESC")) {
            stmt.setLong(1, studentId);
            ResultSet rs = stmt.executeQuery();
            JsonUtil.sendJson(exchange, 200, JsonUtil.resultSetToJson(rs));
        }
    }

    private void handleGetByMentor(HttpExchange exchange, long mentorId) throws Exception {
        try (Connection conn = Database.getConnection();
             PreparedStatement stmt = conn.prepareStatement("SELECT * FROM grievances WHERE mentor_id = ? ORDER BY id DESC")) {
            stmt.setLong(1, mentorId);
            ResultSet rs = stmt.executeQuery();
            JsonUtil.sendJson(exchange, 200, JsonUtil.resultSetToJson(rs));
        }
    }

    private void handleGetById(HttpExchange exchange, long id) throws Exception {
        try (Connection conn = Database.getConnection();
             PreparedStatement stmt = conn.prepareStatement("SELECT * FROM grievances WHERE id = ?")) {
            stmt.setLong(1, id);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                JsonUtil.sendJson(exchange, 200, JsonUtil.rowToJson(rs));
            } else {
                JsonUtil.sendJson(exchange, 404, "{\"error\": \"Grievance not found\"}");
            }
        }
    }

    private void handleUpdateStatus(HttpExchange exchange, long id, String body) throws Exception {
        Map<String, String> data = JsonUtil.parseJson(body);
        String status = data.get("status");
        String remarks = data.get("remarks");

        try (Connection conn = Database.getConnection();
             PreparedStatement stmt = conn.prepareStatement("UPDATE grievances SET status = COALESCE(?, status), remarks = COALESCE(?, remarks) WHERE id = ?")) {
            stmt.setString(1, status);
            stmt.setString(2, remarks);
            stmt.setLong(3, id);

            int rows = stmt.executeUpdate();
            if (rows > 0) {
                JsonUtil.sendJson(exchange, 200, "{\"message\": \"Status updated successfully\", \"id\": " + id + ", \"status\": \"" + JsonUtil.escape(status != null ? status : "") + "\"}");
            } else {
                JsonUtil.sendJson(exchange, 404, "{\"error\": \"Grievance not found\"}");
            }
        }
    }

    
    private static String detectCategory(String title, String desc) {
        String text = ((title != null ? title : "") + " " + (desc != null ? desc : "")).toLowerCase();
        if (text.contains("exam") || text.contains("mark") || text.contains("grade") || text.contains("result")) return "Examination";
        if (text.contains("hostel") || text.contains("mess") || text.contains("food") || text.contains("room")) return "Hostel";
        if (text.contains("fee") || text.contains("payment") || text.contains("scholarship") || text.contains("fine")) return "Fees";
        if (text.contains("wifi") || text.contains("internet") || text.contains("lab") || text.contains("computer") || text.contains("library")) return "Infrastructure";
        if (text.contains("faculty") || text.contains("teacher") || text.contains("attendance") || text.contains("syllabus") || text.contains("class")) return "Academic";
        return "Other";
    }
}
