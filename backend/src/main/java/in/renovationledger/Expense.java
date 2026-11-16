package in.renovationledger;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
public class Expense {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
  public LocalDate date;
  public String description;
  public String category;
  public String paymentMethod;
  public String paidTo;
  public Double amount;
  public String receiptFile;
}
