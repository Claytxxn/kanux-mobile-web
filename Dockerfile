FROM maven:3.9.9-eclipse-temurin-21

WORKDIR /app

COPY backend /app

RUN mvn clean package -DskipTests

CMD ["java", "-jar", "target/kanux-backend-0.0.1.jar"]
