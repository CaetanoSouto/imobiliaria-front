package com.example.demo.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.example.demo.models.UserModel;
import com.example.demo.repositories.UserRepository;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final UserRepository userRepository;

    public SecurityConfig(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter,
            AuthEntryPoint authEntryPoint, AcessoNegadoHandler acessoNegadoHandler) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // página de login (HTML) -> pública
                .requestMatchers(HttpMethod.GET, "/", "/login.html").permitAll()
                // Login -> todos, sem token
                .requestMatchers(HttpMethod.POST, "/auth/login").permitAll()
                // Listar imóveis / um imóvel -> todos, sem token
                .requestMatchers(HttpMethod.GET, "/imoveis", "/imoveis/**").permitAll()
                // Bairros, tipos de imóveis (só leitura) e fotos enviadas -> públicos (a vitrine usa)
                .requestMatchers(HttpMethod.GET, "/bairros", "/bairros/**", "/tipos-imoveis", "/tipos-imoveis/**", "/uploads/**").permitAll()
                // Alterar status do imóvel direto -> só ADMIN. O cliente muda o status apenas
                // indiretamente, pelas regras de ofertas e contratos (senão burlaria as regras).
                .requestMatchers(HttpMethod.PATCH, "/imoveis/*/status").hasRole("ADMIN")
                // Cadastrar, alterar e remover imóveis -> só ADMIN
                .requestMatchers(HttpMethod.POST, "/imoveis/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/imoveis/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/imoveis/**").hasRole("ADMIN")
                // Cadastrar, alterar e remover bairros, tipos de imóveis e fotos -> só ADMIN
                .requestMatchers("/bairros", "/bairros/**", "/tipos-imoveis", "/tipos-imoveis/**", "/fotos", "/fotos/**").hasRole("ADMIN")
                // Ofertas: o cliente (USER) cria, lista as suas e cancela; corretor e admin listam todas,
                // aceitam (preparando o contrato) e recusam
                .requestMatchers(HttpMethod.POST, "/ofertas").hasRole("USER")
                .requestMatchers(HttpMethod.GET, "/ofertas/minhas").hasRole("USER")
                .requestMatchers(HttpMethod.PATCH, "/ofertas/*/cancelar").hasRole("USER")
                .requestMatchers(HttpMethod.GET, "/ofertas").hasAnyRole("CORRETOR", "ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/ofertas/*/aceitar", "/ofertas/*/recusar").hasAnyRole("CORRETOR", "ADMIN")
                .requestMatchers("/ofertas", "/ofertas/**").denyAll()
                // Contratos: o cliente (USER) lista os seus e assina; corretor e admin listam todos;
                // o admin aprova (libera para assinatura) e cancela
                .requestMatchers(HttpMethod.GET, "/contratos/meus").hasRole("USER")
                .requestMatchers(HttpMethod.PATCH, "/contratos/*/assinar").hasRole("USER")
                .requestMatchers(HttpMethod.GET, "/contratos").hasAnyRole("CORRETOR", "ADMIN")
                // PDF do contrato: o cliente baixa só o seu (o service confere); corretor e admin, qualquer um
                .requestMatchers(HttpMethod.GET, "/contratos/*/pdf").hasAnyRole("USER", "CORRETOR", "ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/contratos/*/aprovar", "/contratos/*/cancelar").hasRole("ADMIN")
                .requestMatchers("/contratos", "/contratos/**").denyAll()
                // Favoritos -> só o cliente (USER)
                .requestMatchers("/favoritos", "/favoritos/**").hasRole("USER")
                // Cadastrar e gerenciar usuários -> só ADMIN
                .requestMatchers("/auth/register", "/users", "/users/**").hasRole("ADMIN")
                // rotas que já eram públicas no projeto
                .requestMatchers(HttpMethod.GET, "/email/**").permitAll()
                // página de erro do Spring (senão um 404/500 viraria 401)
                .requestMatchers("/error").permitAll()
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(authEntryPoint)     // 401
                .accessDeniedHandler(acessoNegadoHandler)     // 403
            )
            .authenticationProvider(authenticationProvider(userDetailsService()))
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            UserModel user = userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));

            String role = user.getTipo() == null ? "USER" : user.getTipo();
            if (!role.startsWith("ROLE_")) {
                role = "ROLE_" + role;
            }

            return User.withUsername(user.getEmail())
                    .password(user.getSenha())
                    .roles(role.replace("ROLE_", ""))
                    .build();
        };
    }

    @Bean
    public AuthenticationProvider authenticationProvider(UserDetailsService userDetailsService) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
