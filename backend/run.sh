#!/bin/bash
echo "==================================================="
echo "Compiling and Starting Student Mentorship Backend..."
echo "Server running on http://localhost:8080"
echo "==================================================="
javac -cp ".:lib/*" server/*.java api/*.java Main.java
java -cp ".:lib/*" Main
