package in.renovationledger;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;
import java.nio.file.*;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "${app.allowed-origins}")
public class ApiController {
  private final ExpenseRepository expenses;
  private final ContractorRepository contractors;
  private final Path uploadPath;
  private final ActivityNotificationRepository notifications;

  public ApiController(ExpenseRepository expenses, ContractorRepository contractors,
      ActivityNotificationRepository notifications, @Value("${app.upload-dir}") String uploadDir) throws Exception {
    this.expenses = expenses; this.contractors = contractors; this.notifications = notifications;
    this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
    Files.createDirectories(uploadPath);
  }

  @GetMapping("/expenses") public List<Expense> expenses() { return expenses.findAll(); }
  @PostMapping("/expenses") public Expense addExpense(@RequestBody Expense e) {
    if (e.amount == null || e.amount <= 0) throw new IllegalArgumentException("Amount must be greater than zero");
    Expense expense = expenses.save(e);
    ActivityNotification notification = new ActivityNotification();
    notification.message = "New expense: " + expense.description + " — " + money(expense.amount);
    notifications.save(notification);
    return expense;
  }
  @DeleteMapping("/expenses/{id}") public void deleteExpense(@PathVariable Long id) { expenses.deleteById(id); }

  @PostMapping(value="/receipts", consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
  public Map<String,String> upload(@RequestParam("file") MultipartFile file) throws Exception {
    String original = Paths.get(Objects.requireNonNull(file.getOriginalFilename())).getFileName().toString();
    String safe = UUID.randomUUID() + "-" + original.replaceAll("[^a-zA-Z0-9._-]", "_");
    Files.copy(file.getInputStream(), uploadPath.resolve(safe), StandardCopyOption.REPLACE_EXISTING);
    return Map.of("filename", safe);
  }
  @GetMapping("/receipts/{name}")
  public org.springframework.http.ResponseEntity<byte[]> receipt(@PathVariable String name) throws Exception {
    Path p = uploadPath.resolve(name).normalize();
    if (!p.startsWith(uploadPath) || !Files.exists(p)) return org.springframework.http.ResponseEntity.notFound().build();
    String type = Files.probeContentType(p);
    return org.springframework.http.ResponseEntity.ok().header("Content-Type", type == null ? "application/octet-stream" : type).body(Files.readAllBytes(p));
  }

  @GetMapping("/contractors") public List<Contractor> contractors() { return contractors.findAll(); }
  @PostMapping("/contractors") public Contractor addContractor(@RequestBody Contractor c) {
    if (c.paidAmount == null) c.paidAmount = 0.0;
    if (c.agreedAmount == null) c.agreedAmount = 0.0;
    return contractors.save(c);
  }
  @PutMapping("/contractors/{id}") public Contractor updateContractor(@PathVariable Long id, @RequestBody Contractor c) {
    c.id = id; return contractors.save(c);
  }
  @DeleteMapping("/contractors/{id}") public void deleteContractor(@PathVariable Long id) { contractors.deleteById(id); }

  @PutMapping("/expenses/{id}/receipt")
  public Expense setReceiptReference(@PathVariable Long id, @RequestBody Map<String,String> body) {
    Expense expense = expenses.findById(id).orElseThrow();
    expense.receiptFile = body.get("receiptFile");
    return expenses.save(expense);
  }

  @PostMapping(value="/expenses/{id}/receipt", consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
  public Expense replaceReceipt(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws Exception {
    Expense expense = expenses.findById(id).orElseThrow();
    String original = Paths.get(Objects.requireNonNull(file.getOriginalFilename())).getFileName().toString();
    String safe = UUID.randomUUID() + "-" + original.replaceAll("[^a-zA-Z0-9._-]", "_");
    Files.copy(file.getInputStream(), uploadPath.resolve(safe), StandardCopyOption.REPLACE_EXISTING);
    expense.receiptFile = safe;
    return expenses.save(expense);
  }

  @PutMapping("/expenses/{id}") public Expense updateExpense(@PathVariable Long id, @RequestBody Expense updated) {
    Expense expense = expenses.findById(id).orElseThrow();
    expense.date = updated.date;
    expense.description = updated.description;
    expense.category = updated.category;
    expense.paymentMethod = updated.paymentMethod;
    expense.paidTo = updated.paidTo;
    expense.amount = updated.amount;
    return expenses.save(expense);
  }

  @GetMapping("/notifications") public List<ActivityNotification> notificationList() {
    return notifications.findAllByOrderByCreatedAtDesc();
  }

  @PutMapping("/notifications/read") public void markNotificationsRead() {
    for (ActivityNotification notification : notifications.findAll()) {
      notification.readByViewer = true;
      notifications.save(notification);
    }
  }

  private static String money(Double amount) {
    return "₹" + (amount == null ? "0" : String.format("%,.0f", amount));
  }
}
