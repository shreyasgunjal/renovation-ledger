package in.renovationledger;

import jakarta.persistence.*;

@Entity
public class Contractor {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
  public String name;
  public String workType;
  public String phone;
  public Double agreedAmount;
  public Double paidAmount;
}
