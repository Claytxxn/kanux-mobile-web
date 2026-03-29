FROM eclipse-temurin:25-jdk

WORKDIR /app

RUN apt-get update && apt-get install -y maven

COPY backend /app

RUN mvn clean package -DskipTests

CMD ["java", "-jar", "target/kanux-backend-0.0.1.jar"]
