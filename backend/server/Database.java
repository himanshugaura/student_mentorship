package server;

import java.sql.*;

public class Database {

    
    
    
    
    public static final String DB_URL = System.getenv("DB_URL") != null 
            ? System.getenv("DB_URL") 
            : "jdbc:postgresql://ep-sparkling-wave-aoew74uw-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

    public static final String DB_USER = System.getenv("DB_USERNAME") != null 
            ? System.getenv("DB_USERNAME") 
            : "neondb_owner";

    public static final String DB_PASSWORD = System.getenv("DB_PASSWORD") != null 
            ? System.getenv("DB_PASSWORD") 
            : "npg_GRfF8bse4oZy";

    
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
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
                    priority VARCHAR(20),
                    status VARCHAR(30) DEFAULT 'Submitted',
                    student_id INT,
                    student_name VARCHAR(100),
                    mentor_id INT,
                    is_escalated BOOLEAN DEFAULT FALSE,
                    escalation_reason TEXT,
                    remarks TEXT,
                    created_at VARCHAR(50)
                )
            """);

            
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
