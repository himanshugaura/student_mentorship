package api;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import server.Database;
import server.JsonUtil;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

public class MentorshipApi implements HttpHandler {

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (JsonUtil.handleCorsPreflight(exchange)) return;

        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod().toUpperCase();
        String body = JsonUtil.readBody(exchange);

        try {
            
            if (path.equals("/api/allocate-mentor") && method.equals("POST")) {
                handleAllocateMentor(exchange, body);
                return;
            }

            
            if (path.matches("/api/mentors/\\d+/students") && method.equals("GET")) {
                long mentorId = Long.parseLong(path.split("/")[3]);
                handleGetStudentsByMentor(exchange, mentorId);
                return;
            }

            
            if (path.equals("/api/meetings") && method.equals("POST")) {
                handleRequestMeeting(exchange, body);
                return;
            }

            
            if (path.startsWith("/api/meetings/student/") && method.equals("GET")) {
                long studentId = Long.parseLong(path.substring("/api/meetings/student/".length()));
                handleGetStudentMeetings(exchange, studentId);
                return;
            }

            
            if (path.startsWith("/api/meetings/mentor/") && method.equals("GET")) {
                long mentorId = Long.parseLong(path.substring("/api/meetings/mentor/".length()));
                handleGetMentorMeetings(exchange, mentorId);
                return;
            }

            
            if (path.matches("/api/meetings/\\d+") && (method.equals("PUT") || method.equals("POST"))) {
                long meetingId = Long.parseLong(path.substring("/api/meetings/".length()));
                handleUpdateMeeting(exchange, meetingId, body);
                return;
            }

            JsonUtil.sendJson(exchange, 404, "{\"error\": \"Mentorship endpoint not found\"}");
        } catch (Exception e) {
            e.printStackTrace();
            JsonUtil.sendJson(exchange, 500, "{\"error\": \"" + JsonUtil.escape(e.getMessage()) + "\"}");
        }
    }

    private void handleAllocateMentor(HttpExchange exchange, String body) throws Exception {
        Map<String, String> data = JsonUtil.parseJson(body);
        long studentId = Long.parseLong(data.get("studentId"));
        long mentorId = Long.parseLong(data.get("mentorId"));

        if (mentorId == 0) {
            try (Connection conn = Database.getConnection();
                 PreparedStatement updateStudent = conn.prepareStatement("UPDATE users SET mentor_id = NULL, mentor_name = NULL WHERE id = ? AND role = 'STUDENT'")) {
                updateStudent.setLong(1, studentId);
                int updated = updateStudent.executeUpdate();
                if (updated > 0) {
                    JsonUtil.sendJson(exchange, 200, "{\"message\": \"Mentor unassigned successfully\"}");
                } else {
                    JsonUtil.sendJson(exchange, 404, "{\"error\": \"Student not found\"}");
                }
                return;
            }
        }

        try (Connection conn = Database.getConnection();
             PreparedStatement getMentor = conn.prepareStatement("SELECT name FROM users WHERE id = ? AND role = 'MENTOR'");
             PreparedStatement updateStudent = conn.prepareStatement("UPDATE users SET mentor_id = ?, mentor_name = ? WHERE id = ? AND role = 'STUDENT'")) {

            getMentor.setLong(1, mentorId);
            ResultSet rs = getMentor.executeQuery();
            if (!rs.next()) {
                JsonUtil.sendJson(exchange, 404, "{\"error\": \"Mentor not found\"}");
                return;
            }
            String mentorName = rs.getString("name");

            updateStudent.setLong(1, mentorId);
            updateStudent.setString(2, mentorName);
            updateStudent.setLong(3, studentId);

            int updated = updateStudent.executeUpdate();
            if (updated > 0) {
                String response = "{"
                        + "\"message\": \"Mentor allocated successfully\","
                        + "\"studentId\": " + studentId + ","
                        + "\"mentorId\": " + mentorId + ","
                        + "\"mentorName\": \"" + JsonUtil.escape(mentorName) + "\""
                        + "}";
                JsonUtil.sendJson(exchange, 200, response);
            } else {
                JsonUtil.sendJson(exchange, 404, "{\"error\": \"Student not found\"}");
            }
        }
    }

    private void handleGetStudentsByMentor(HttpExchange exchange, long mentorId) throws Exception {
        try (Connection conn = Database.getConnection();
             PreparedStatement stmt = conn.prepareStatement("SELECT * FROM users WHERE mentor_id = ? ORDER BY id")) {
            stmt.setLong(1, mentorId);
            ResultSet rs = stmt.executeQuery();
            JsonUtil.sendJson(exchange, 200, JsonUtil.resultSetToJson(rs));
        }
    }

    private void handleRequestMeeting(HttpExchange exchange, String body) throws Exception {
        Map<String, String> data = JsonUtil.parseJson(body);
        long studentId = Long.parseLong(data.get("studentId"));
        String title = data.get("title");
        String purpose = data.getOrDefault("purpose", "");
        String meetingTime = data.getOrDefault("meetingTime", "");
        Long mentorId = data.containsKey("mentorId") ? Long.parseLong(data.get("mentorId")) : null;

        String studentName = null;
        String mentorName = null;

        try (Connection conn = Database.getConnection();
             PreparedStatement uStmt = conn.prepareStatement("SELECT name, mentor_id, mentor_name FROM users WHERE id = ?")) {
            uStmt.setLong(1, studentId);
            ResultSet rs = uStmt.executeQuery();
            if (rs.next()) {
                studentName = rs.getString("name");
                if (mentorId == null) {
                    Object mObj = rs.getObject("mentor_id");
                    mentorId = (mObj instanceof Number) ? ((Number) mObj).longValue() : null;
                    mentorName = rs.getString("mentor_name");
                }
            }
        }

        if (mentorId == null) {
            JsonUtil.sendJson(exchange, 400, "{\"error\": \"No mentor assigned or specified for this meeting\"}");
            return;
        }

        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));

        try (Connection conn = Database.getConnection();
             PreparedStatement stmt = conn.prepareStatement("""
                 INSERT INTO meetings (student_id, student_name, mentor_id, mentor_name, title, purpose, meeting_time, status, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'Requested', ?) RETURNING id
             """)) {
            stmt.setLong(1, studentId);
            stmt.setString(2, studentName);
            stmt.setLong(3, mentorId);
            stmt.setString(4, mentorName);
            stmt.setString(5, title);
            stmt.setString(6, purpose);
            stmt.setString(7, meetingTime);
            stmt.setString(8, now);

            ResultSet rs = stmt.executeQuery();
            long newId = rs.next() ? rs.getLong(1) : 0;

            JsonUtil.sendJson(exchange, 200, "{\"message\": \"Meeting requested successfully\", \"id\": " + newId + ", \"status\": \"Requested\"}");
        }
    }

    private void handleGetStudentMeetings(HttpExchange exchange, long studentId) throws Exception {
        try (Connection conn = Database.getConnection();
             PreparedStatement stmt = conn.prepareStatement("SELECT * FROM meetings WHERE student_id = ? ORDER BY id DESC")) {
            stmt.setLong(1, studentId);
            ResultSet rs = stmt.executeQuery();
            JsonUtil.sendJson(exchange, 200, JsonUtil.resultSetToJson(rs));
        }
    }

    private void handleGetMentorMeetings(HttpExchange exchange, long mentorId) throws Exception {
        try (Connection conn = Database.getConnection();
             PreparedStatement stmt = conn.prepareStatement("SELECT * FROM meetings WHERE mentor_id = ? ORDER BY id DESC")) {
            stmt.setLong(1, mentorId);
            ResultSet rs = stmt.executeQuery();
            JsonUtil.sendJson(exchange, 200, JsonUtil.resultSetToJson(rs));
        }
    }

    private void handleUpdateMeeting(HttpExchange exchange, long meetingId, String body) throws Exception {
        Map<String, String> data = JsonUtil.parseJson(body);
        String status = data.get("status");
        String venue = data.get("venueOrLink");
        String feedback = data.get("feedback");

        try (Connection conn = Database.getConnection();
             PreparedStatement stmt = conn.prepareStatement("""
                 UPDATE meetings 
                 SET status = COALESCE(?, status), 
                     venue_or_link = COALESCE(?, venue_or_link), 
                     feedback = COALESCE(?, feedback) 
                 WHERE id = ?
             """)) {
            stmt.setString(1, status);
            stmt.setString(2, venue);
            stmt.setString(3, feedback);
            stmt.setLong(4, meetingId);

            int rows = stmt.executeUpdate();
            if (rows > 0) {
                JsonUtil.sendJson(exchange, 200, "{\"message\": \"Meeting updated successfully\", \"id\": " + meetingId + "}");
            } else {
                JsonUtil.sendJson(exchange, 404, "{\"error\": \"Meeting not found\"}");
            }
        }
    }
}
