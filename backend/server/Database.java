package server;

import java.sql.*;

public class Database {

    
    
    
    
    static {
        try {
            Class.forName("org.postgresql.Driver");
        } catch (ClassNotFoundException e) {
            System.err.println("Notice: org.postgresql.Driver not found on classpath");
        }
    }

    public static final String DEFAULT_DB_URL = "jdbc:postgresql://ep-sparkling-wave-aoew74uw-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
    public static final String DEFAULT_DB_USER = "neondb_owner";
    public static final String DEFAULT_DB_PASSWORD = "npg_GRfF8bse4oZy";

    public static String DB_URL = DEFAULT_DB_URL;
    public static String DB_USER = DEFAULT_DB_USER;
    public static String DB_PASSWORD = DEFAULT_DB_PASSWORD;

    public static Connection getConnection() throws SQLException {
        String rawUrl = System.getenv("DB_URL");
        if (rawUrl == null || rawUrl.trim().isEmpty()) {
            rawUrl = DEFAULT_DB_URL;
        }
        rawUrl = rawUrl.trim();

        String user = System.getenv("DB_USERNAME");
        String pass = System.getenv("DB_PASSWORD");

        if (rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://")) {
            String withoutProtocol = rawUrl.substring(rawUrl.indexOf("://") + 3);
            if (withoutProtocol.contains("@")) {
                String userInfo = withoutProtocol.substring(0, withoutProtocol.indexOf("@"));
                String hostPart = withoutProtocol.substring(withoutProtocol.indexOf("@") + 1);
                if (user == null || user.trim().isEmpty()) {
                    if (userInfo.contains(":")) {
                        user = userInfo.substring(0, userInfo.indexOf(":"));
                        pass = userInfo.substring(userInfo.indexOf(":") + 1);
                    } else {
                        user = userInfo;
                    }
                }
                rawUrl = "jdbc:postgresql://" + hostPart;
            } else {
                rawUrl = "jdbc:postgresql://" + withoutProtocol;
            }
        } else if (!rawUrl.startsWith("jdbc:postgresql://")) {
            rawUrl = "jdbc:postgresql://" + rawUrl;
        }

        rawUrl = rawUrl.replace("&channel_binding=require", "").replace("?channel_binding=require&", "?").replace("?channel_binding=require", "");

        if (user == null || user.trim().isEmpty()) {
            user = DEFAULT_DB_USER;
        }
        if (pass == null || pass.trim().isEmpty()) {
            pass = DEFAULT_DB_PASSWORD;
        }

        DB_URL = rawUrl;
        DB_USER = user;
        DB_PASSWORD = pass;

        return DriverManager.getConnection(rawUrl, user, pass);
    }

    
    public static void initDatabase() {
        try (Connection conn = getConnection(); Statement stmt = conn.createStatement()) {
            System.out.println("Checking and initializing PostgreSQL database tables...");

            
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password VARCHAR(100) NOT NULL,
                    role VARCHAR(20) NOT NULL,
                    department VARCHAR(100),
                    phone VARCHAR(20),
                    roll_number VARCHAR(50),
                    mentor_id INT,
                    mentor_name VARCHAR(100)
                )
            """);

            
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS grievances (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(200) NOT NULL,
                    description TEXT NOT NULL,
                    category VARCHAR(50),
                    status VARCHAR(30) DEFAULT 'Submitted',
                    student_id INT,
                    student_name VARCHAR(100),
                    mentor_id INT,
                    remarks TEXT,
                    created_at VARCHAR(50)
                )
            """);

            try {
                stmt.execute("ALTER TABLE grievances DROP COLUMN IF EXISTS priority");
                stmt.execute("ALTER TABLE grievances DROP COLUMN IF EXISTS is_escalated");
                stmt.execute("ALTER TABLE grievances DROP COLUMN IF EXISTS escalation_reason");
            } catch (Exception ignored) {}

            
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS meetings (
                    id SERIAL PRIMARY KEY,
                    student_id INT,
                    student_name VARCHAR(100),
                    mentor_id INT,
                    mentor_name VARCHAR(100),
                    title VARCHAR(200) NOT NULL,
                    purpose TEXT,
                    meeting_time VARCHAR(50),
                    status VARCHAR(30) DEFAULT 'Requested',
                    venue_or_link VARCHAR(200),
                    feedback TEXT,
                    created_at VARCHAR(50)
                )
            """);

            
            ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM users");
            if (rs.next() && rs.getInt(1) == 0) {
                stmt.execute("""
                    INSERT INTO users (name, email, password, role, department, phone) 
                    VALUES ('System Admin', 'admin@college.edu', 'admin123', 'ADMIN', 'Management', '9876543210')
                """);
                stmt.execute("""
                    INSERT INTO users (name, email, password, role, department, phone) 
                    VALUES ('Himanshu', 'mentor@college.edu', 'mentor123', 'MENTOR', 'Computer Application', '9876543211')
                """);
                stmt.execute("""
                    INSERT INTO users (name, email, password, role, department, phone, roll_number, mentor_id, mentor_name) 
                    VALUES ('Khushbu', 'student@college.edu', 'student123', 'STUDENT', 'BCA', '9876543212', '24042824', 2, 'Himanshu')
                """);
                System.out.println("Default sample accounts initialized (admin@college.edu, mentor@college.edu, student@college.edu)");
            }

            System.out.println("PostgreSQL tables are ready!");
        } catch (Exception e) {
            System.err.println("Notice: Could not connect to PostgreSQL right now (" + e.getMessage() + ")");
            System.err.println("Check DB_URL, DB_USER, and DB_PASSWORD in Database.java when running.");
        }
    }
}
