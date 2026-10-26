package api;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import server.Database;
import server.JsonUtil;

import java.io.IOException;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

public class AdminApi implements HttpHandler {

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (JsonUtil.handleCorsPreflight(exchange)) return;

        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod().toUpperCase();

        try {
            
            if (path.equals("/api/admin/stats") && method.equals("GET")) {
                handleStats(exchange);
                return;
            }

            JsonUtil.sendJson(exchange, 404, "{\"error\": \"Admin endpoint not found\"}");
        } catch (Exception e) {
            e.printStackTrace();
            JsonUtil.sendJson(exchange, 500, "{\"error\": \"" + JsonUtil.escape(e.getMessage()) + "\"}");
        }
    }

    private void handleStats(HttpExchange exchange) throws Exception {
        try (Connection conn = Database.getConnection();
             Statement stmt = conn.createStatement()) {

            
            ResultSet rs1 = stmt.executeQuery("SELECT COUNT(*) FROM users WHERE role = 'STUDENT'");
            long totalStudents = rs1.next() ? rs1.getLong(1) : 0;

            
            ResultSet rs2 = stmt.executeQuery("SELECT COUNT(*) FROM users WHERE role = 'MENTOR'");
            long totalMentors = rs2.next() ? rs2.getLong(1) : 0;

            
            ResultSet rs3 = stmt.executeQuery("SELECT COUNT(*) FROM grievances");
            long totalGrievances = rs3.next() ? rs3.getLong(1) : 0;

            
            ResultSet rs4 = stmt.executeQuery("SELECT COUNT(*) FROM grievances WHERE status IN ('Submitted', 'Under Review', 'In Progress')");
            long pendingGrievances = rs4.next() ? rs4.getLong(1) : 0;

            
            ResultSet rs5 = stmt.executeQuery("SELECT COUNT(*) FROM grievances WHERE status = 'Resolved'");
            long resolvedGrievances = rs5.next() ? rs5.getLong(1) : 0;


            String json = "{"
                    + "\"totalStudents\": " + totalStudents + ","
                    + "\"totalMentors\": " + totalMentors + ","
                    + "\"totalGrievances\": " + totalGrievances + ","
                    + "\"pendingGrievances\": " + pendingGrievances + ","
                    + "\"resolvedGrievances\": " + resolvedGrievances
                    + "}";
            JsonUtil.sendJson(exchange, 200, json);
        }
    }
}
