import com.sun.net.httpserver.HttpServer;
import server.Database;
import server.JsonUtil;
import api.AuthApi;
import api.GrievanceApi;
import api.MentorshipApi;
import api.AdminApi;

import java.net.InetSocketAddress;

public class Main {

    public static int getPort() {
        String envPort = System.getenv("PORT");
        if (envPort != null && !envPort.trim().isEmpty()) {
            try {
                return Integer.parseInt(envPort.trim());
            } catch (NumberFormatException ignored) {}
        }
        return 8080;
    }

    public static void main(String[] args) throws Exception {
        int port = getPort();
        System.out.println("=================================================");
        System.out.println("  Student Mentorship & Grievance Management System");
        System.out.println("  Server Port: " + port);
        System.out.println("=================================================");

        
        Database.initDatabase();

        
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        
        AuthApi authHandler = new AuthApi();
        GrievanceApi grievanceHandler = new GrievanceApi();
        MentorshipApi mentorshipHandler = new MentorshipApi();
        AdminApi adminHandler = new AdminApi();

        server.createContext("/health", exchange -> {
            if (JsonUtil.handleCorsPreflight(exchange)) return;
            JsonUtil.sendJson(exchange, 200, "{\"status\":true}");
        });

        
        server.createContext("/api/register", authHandler);
        server.createContext("/api/login", authHandler);
        server.createContext("/api/users", authHandler);

        
        server.createContext("/api/allocate-mentor", mentorshipHandler);
        server.createContext("/api/mentors", mentorshipHandler);
        server.createContext("/api/meetings", mentorshipHandler);

        
        server.createContext("/api/grievances", grievanceHandler);

        
        server.createContext("/api/admin", adminHandler);

        
        server.createContext("/", exchange -> {
            String path = exchange.getRequestURI().getPath();
            if (path.startsWith("/api")) {
                exchange.sendResponseHeaders(404, -1);
                return;
            }
            if (path.equals("/") || path.isEmpty()) {
                path = "/index.html";
            }

            java.io.File file = new java.io.File("../frontend" + path);
            if (!file.exists()) {
                file = new java.io.File("frontend" + path);
            }
            if (!file.exists()) {
                file = new java.io.File("d:/Student_Mentorship/frontend" + path);
            }

            if (file.exists() && !file.isDirectory()) {
                String contentType = "text/html; charset=UTF-8";
                if (path.endsWith(".css")) contentType = "text/css; charset=UTF-8";
                else if (path.endsWith(".js")) contentType = "application/javascript; charset=UTF-8";
                else if (path.endsWith(".png")) contentType = "image/png";
                else if (path.endsWith(".svg")) contentType = "image/svg+xml";

                exchange.getResponseHeaders().set("Content-Type", contentType);
                byte[] bytes = java.nio.file.Files.readAllBytes(file.toPath());
                exchange.sendResponseHeaders(200, bytes.length);
                try (java.io.OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            } else {
                String notFound = "File Not Found: " + path;
                exchange.sendResponseHeaders(404, notFound.length());
                try (java.io.OutputStream os = exchange.getResponseBody()) {
                    os.write(notFound.getBytes());
                }
            }
        });

        
        server.setExecutor(null); 
        server.start();

        System.out.println();
        System.out.println(">>> Server is running at http://localhost:" + port);
        System.out.println(">>> Connected to: " + Database.DB_URL);
        System.out.println(">>> Ready to receive REST API calls from Web Frontend & Postman!");
        System.out.println("=================================================");
    }
}
