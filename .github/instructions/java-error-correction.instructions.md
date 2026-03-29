---
description: "Use quando estiver corrigindo erros Java no backend (maven/build) e quiser garantir que nenhum erro de compilação seja ignorado. Sempre verifique terminal e a aba Issues antes de aplicar correções."
applyTo: "backend/src/main/**/*.java"
---

# Instruções de correção de erros Java (backend)

1. Antes de editar código, execute no terminal do workspace:
   - `mvn -B clean package -DskipTests -U`
   - confirme saída sem erros de compilação (BUILD SUCCESS) ou capture o primeiro erro.

2. Verifique a aba `Issues` do VS Code:
   - filtrar por "Java" ou "Maven".
   - anote os erros de sintaxe, tipo `cannot find symbol`, `illegal start of type`, `null type safety`.

3. Corrija o root-cause:
   - normalizar versões em `pom.xml` (java.version + maven-compiler-plugin.release + spring-boot-starter-parent).
   - converter classes com Lombok para getters/setters explícitos se houver incompatibilidade.
   - remover `@Autowired` e usar injeção por construtor.
   - ajustar tipos genéricos (ex: `ResponseEntity<ApiResponse<T>>`) e evitar `ApiResponse<?>` sem cast.

4. Refaça:
   - `mvn -B clean package -DskipTests -U` até BUILD SUCCESS
   - confirme Issues CPU/erros zerados.

5. Reporte:
   - lista de arquivos modificados
   - comandos usados
   - erro original e solução aplicada

> Observação: se o projeto exigir Java 25, mantenha esse valor em toda a cadeia de configuração e não use versões mais antigas para builds em CI.
