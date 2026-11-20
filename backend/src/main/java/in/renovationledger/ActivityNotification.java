package in.renovationledger;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name="activity_notifications")
public class ActivityNotification {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
  @Column(length = 500) public String message;
  public Instant createdAt = Instant.now();
  public boolean readByViewer;
}
