package com.kanux.config;


import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.tags.Tag;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI kanuxOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Kanux API - Documentação Profissional")
                        .description("""
                            <b>API RESTful do Kanux</b><br>
                            <ul>
                            <li>Autenticação JWT (login por e-mail/senha)</li>
                            <li>CRUD completo de tickets, chats, perfis, departamentos</li>
                            <li>WebSocket para mensagens em tempo real</li>
                            <li>Exemplos de requisição e resposta em todos os endpoints</li>
                            <li>Políticas de segurança e permissões detalhadas</li>
                            </ul>
                            <b>Para acessar endpoints protegidos:</b>
                            <ol>
                            <li>Use <code>/api/auth/login</code> para autenticar (e-mail/senha)</li>
                            <li>Copie o token JWT retornado</li>
                            <li>Clique em 'Authorize' no topo direito e cole o token</li>
                            </ol>
                        """)
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("Equipe Kanux")
                                .email("suporte@kanux.com.br")
                                .url("https://kanux.com.br"))
                        .license(new License().name("MIT").url("https://opensource.org/licenses/MIT")))
                .externalDocs(new ExternalDocumentation()
                        .description("Repositório Kanux no GitHub")
                        .url("https://github.com/jeffersondiogo-12/kanux-mobile-web"))
                .addTagsItem(new Tag().name("Auth").description("Autenticação e geração de token JWT"))
                .addTagsItem(new Tag().name("Tickets").description("Gerenciamento de tickets de atendimento"))
                .addTagsItem(new Tag().name("Chats").description("Mensagens e conversas em tempo real"))
                .addTagsItem(new Tag().name("Perfis").description("Gestão de usuários e perfis"))
                .addTagsItem(new Tag().name("Departamentos").description("Gestão de departamentos e permissões"))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .schemaRequirement("bearerAuth", new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .in(SecurityScheme.In.HEADER)
                        .name("Authorization")
                        .description("Insira seu token JWT após fazer login. Exemplo: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
                );
    }

    @Bean
    public GroupedOpenApi publicApi() {
        return GroupedOpenApi.builder()
                .group("public")
                .pathsToMatch("/api/**")
                .build();
    }
}
