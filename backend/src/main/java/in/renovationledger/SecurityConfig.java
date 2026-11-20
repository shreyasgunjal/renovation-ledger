package in.renovationledger;

import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  UserDetailsService users(
      PasswordEncoder encoder,
      @Value("${app.admin.username:admin}") String adminUsername,
      @Value("${app.admin.password:change-me}") String adminPassword,
      @Value("${app.viewer.username:viewer}") String viewerUsername,
      @Value("${app.viewer.password:change-me}") String viewerPassword) {
    UserDetails admin = User.withUsername(adminUsername)
        .password(encoder.encode(adminPassword)).roles("ADMIN").build();
    UserDetails viewer = User.withUsername(viewerUsername)
        .password(encoder.encode(viewerPassword)).roles("VIEWER").build();
    return new InMemoryUserDetailsManager(admin, viewer);
  }

  @Bean
  CorsConfigurationSource corsConfigurationSource(
      @Value("${app.allowed-origins:http://localhost:5173,http://localhost:5174}") String allowedOrigins) {
    CorsConfiguration config = new CorsConfiguration();
    Arrays.stream(allowedOrigins.split(","))
        .map(String::trim)
        .filter(origin -> !origin.isEmpty())
        .forEach(config::addAllowedOrigin);
    config.setAllowCredentials(true);
    config.addAllowedHeader("*");
    config.addAllowedMethod("*");

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }

  @Bean
  SecurityFilterChain security(HttpSecurity http) throws Exception {
    http
      .cors(Customizer.withDefaults())
      .csrf(csrf -> csrf.disable())
      .authorizeHttpRequests(auth -> auth
        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
        .requestMatchers(HttpMethod.GET, "/api/**").hasAnyRole("ADMIN", "VIEWER")
        .requestMatchers(HttpMethod.POST, "/api/**").hasRole("ADMIN")
        .requestMatchers(HttpMethod.PUT, "/api/notifications/**").hasAnyRole("ADMIN", "VIEWER")
        .requestMatchers(HttpMethod.PUT, "/api/**").hasRole("ADMIN")
        .requestMatchers(HttpMethod.DELETE, "/api/**").hasRole("ADMIN")
        .anyRequest().authenticated())
      .httpBasic(Customizer.withDefaults());
    return http.build();
  }
}
