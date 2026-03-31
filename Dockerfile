# ---- Estágio de build ----
FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /app

# Copiar apenas o pom.xml para baixar dependências (cache)
COPY backend/pom.xml .
RUN mvn dependency:go-offline

# Copiar o código fonte e compilar
COPY backend/src ./src
RUN mvn clean package -DskipTests

# ---- Estágio de execução ----
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copiar o JAR gerado do estágio anterior
COPY --from=builder /app/target/kanux-backend.jar /app/kanux-backend.jar

# Expor a porta que sua aplicação usa
EXPOSE 10000

# Comando para iniciar a aplicação
CMD ["java", "-jar", "kanux-backend.jar"]
