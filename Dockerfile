FROM maven:3.9.9-eclipse-temurin-25

WORKDIR /app

COPY backend /app

RUN mvn clean package -DskipTests

CMD ["java", "-jar", "target/*.jar"]