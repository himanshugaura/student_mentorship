FROM eclipse-temurin:17-jdk-jammy AS builder
WORKDIR /app
COPY . .
RUN cd backend && javac -cp ".:lib/*" api/*.java server/*.java Main.java

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=builder /app /app

WORKDIR /app/backend

ENV PORT=8080
EXPOSE 8080

CMD ["java", "-cp", ".:lib/*", "Main"]
