package in.renovationledger;

import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AuthController {
  @GetMapping("/me")
  public Map<String, Object> me(Authentication authentication) {
    boolean admin = authentication.getAuthorities().stream()
        .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
    return Map.of("username", authentication.getName(), "role", admin ? "ADMIN" : "VIEWER");
  }
}
