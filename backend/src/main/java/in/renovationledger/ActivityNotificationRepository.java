package in.renovationledger;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivityNotificationRepository extends JpaRepository<ActivityNotification, Long> {
  List<ActivityNotification> findAllByOrderByCreatedAtDesc();
}
