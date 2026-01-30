# Backend Repository Documentation

This document describes all backend repositories, focusing on:

- Custom query methods


- Entity relationship


----
## 1.   BadgeRepository

**Entity:** Badge  
**Extends:** JpaRepository<Badge, UUID>


### Entity Relationships
- This repository manages `Badge` entity.  

- `Badge` is  associated  with `EmployeeBadge`, representing which users/employees have been awarded a badge.

### Custom Query Methods

- `Optional<Badge> findByCode(String code)`  
  Retrieves a badge using its unique business identifier (`code`).  
---
## 2. BundlePostingRepository

**Entity:** BundlePosting  
**Extends:** JpaRepository<BundlePosting, UUID>


### Entity Relationships
This repository manages `BundlePosting` entity, which is associated with:
- `Seller` (each bundle posting is created by a seller)
- `Category` (each bundle posting belongs to a category)



### Custom Query Methods

- `List<BundlePosting> findBySeller_SellerId(UUID sellerId)`  
  Retrieves all bundle postings created by a seller.

- `Page<BundlePosting> findAvailable(Instant now, Pageable pageable)`  
  Retrieves all active bundle postings that are not fully reserved and have not passed their pickup end time.  

- `List<BundlePosting> findExpired(Instant now)`  
  Retrieves all active bundle postings whose pickup end time has already passed.

- `long countBySeller(UUID sellerId)`  
  Returns the total number of bundle postings created by a seller.  


-----
## 3. CategoryRepository

**Entity:** Category  
**Extends:** JpaRepository<Category, UUID>



### Entity Relationships
- This repository manages `Category` entity, which is associated with `BundlePosting` (each bundle posting is classified under a category)

### Custom Query Methods
This repository does not define any custom query methods.  

----
## 4. EmployeeRepository

**Entity:** Employee  
**Extends:** JpaRepository<Employee, UUID>

### Entity Relationships
This repository manages `Employee` entity, which is associated with:
- `Organisation` (many employees belong to one organisation)
- `UserAccount` (an employee may be linked to a user account for login/access)
- `EmployeeBadge` (tracks badges awarded to an employee)
- `Reservation` (reservations handled/managed by an employee)
- `RescueEvent` (events created or managed by an employee)

### Custom Query Methods

- `Optional<Employee> findByUser_UserId(UUID userId)`  
  Retrieves the employee record linked to an `UserAccount`

- `List<Employee> findByOrganisation_OrgId(UUID orgId)`  
  Retrieves all employees belonging to an organisation 


----
## 5. EmployeeBadgeRepository

**Entity:** EmployeeBadge  
**Extends:** JpaRepository<EmployeeBadge, EmployeeBadge.Key>

### Entity Relationships
This repository manages `EmployeeBadge` entity, which represent a link between:
- `Employee`
- `Badge`

It is used to track which badges have been awarded to which employees.

### Custom Query Methods

- `List<EmployeeBadge> findByEmployeeId(UUID employeeId)`  
  Retrieves all badge assignments for a specific employee.

- `boolean existsByEmployeeIdAndBadgeId(UUID employeeId, UUID badgeId)`  
  Checks whether a specific badge has already been awarded to a given employee.

-----
## 6. IssueReportRepository

**Entity:** IssueReport  
**Extends:** JpaRepository<IssueReport, UUID>

### Entity Relationships
This repository manages `IssueReport` entity, which is associated with:
- `BundlePosting` (the bundle posting that the issue refers to)
- `Seller` (indirectly via the associated bundle posting)
- `UserAccount` (the user who submitted the issue report)
- `Reservation` (the reservation related to the issue)
- `Employee` (the employee assigned to handle the issue)

### Custom Query Methods

- `List<IssueReport> findOpenBySeller(UUID sellerId)`  
  Retrieves all issue reports that are linked to bundle postings owned by a seller.

- `List<IssueReport> findBySeller(UUID sellerId)`  
  Retrieves all issue reports associated with bundle postings owned by a seller.

----
## 7.  OrganisationRepository

**Entity:** Organisation  
**Extends:** JpaRepository<Organisation, UUID>

### Entity Relationships
This repository manages `Organisation` entity.  
`Organisation` is  associated with:
- `Employee` (employees belong to an organisation)

### Custom Query Methods
This repository does not define any custom query methods.  

---

## 8. RescueEventRepository

**Entity:** RescueEvent  
**Extends:** JpaRepository<RescueEvent, UUID>

### Entity Relationships
This repository manages `RescueEvent` entity, which is associated with:
- `Employee` (many rescue events can be performed by a single employee)
- `Reservation` (each rescue event corresponds to a reservation)

### Custom Query Methods

- `List<RescueEvent> findByEmployee_EmployeeId(UUID employeeId)`  
  Retrieves all rescue events performed by a employee.

- `long countByEmployee_EmployeeId(UUID employeeId)`  
  Returns the total number of rescue events performed by a employee.

- `long sumCo2eByEmployee(UUID employeeId)`  
  Returns the total estimated CO₂e savings generated by rescue events performed by a employee.

- `long sumMealsByEmployee(UUID employeeId)`  
  Returns the total estimated number of meals saved by rescue events performed by a employee.

------
## 9. ReservationRepository

**Entity:** Reservation  
**Extends:** JpaRepository<Reservation, UUID>

### Entity Relationships
This repository manages `Reservation` entity, which is associated with:
- `Organisation` (the organisation that made the reservation)
- `UserAccount` (the user who created the reservation)
- `Employee` (the employee assigned to handle the reservation)
- `RescueEvent` (each reservation may result in a rescue event)
- `IssueReport` (a reservation can have multiple issue reports)

### Custom Query Methods

- `List<Reservation> findByPosting_PostingId(UUID postingId)`  
  Retrieves all reservations for a bundle posting.

- `List<Reservation> findByOrganisation_OrgId(UUID orgId)`  
  Retrieves all reservations made by an organisation.

- `List<Reservation> findByEmployee_EmployeeId(UUID employeeId)`  
  Retrieves all reservations assigned to an employee.

- `Optional<Reservation> findByClaimCodeHash(String hash)`  
  Retrieves a reservation using its hashed claim code

- `List<Reservation> findExpired(Instant now)`  
  Retrieve bookings whose pickup deadline has passed.

- `long countByPosting_PostingIdAndStatus(UUID postingId, Reservation.Status status)`  
  Returns the number of reservations for a given posting filtered by reservation status.  


- `List<Reservation> findBySellerAndStatus(UUID sellerId, Reservation.Status status)`  
  Retrieves all reservations linked to bundle postings owned by a seller and filtered by status.

-----
## 10. SellerRepository

**Entity:** Seller  
**Extends:** JpaRepository<Seller, UUID>

### Entity Relationships
This repository manages `Seller` entity, which is associated with:
- `UserAccount` (each seller account is linked to a single user account)
- `BundlePosting` (a seller can create multiple bundle postings)

### Custom Query Methods

- `Optional<Seller> findByUser_UserId(UUID userId)`  
  Retrieves the seller entity associated with a user account.

---

## 11. UserAccountRepository

**Entity:** UserAccount  
**Extends:** JpaRepository<UserAccount, UUID>

### Entity Relationships
This repository manages `UserAccount` entity, which is associated with:
- `Seller` (a user account may be linked to a seller profile)
- `Employee` (a user account may be linked to an employee profile)
- `Reservation` (a user account can create multiple reservations)
- `IssueReport` (a user account can submit multiple issue reports)

### Custom Query Methods

- `Optional<UserAccount> findByEmail(String email)`  
  Retrieves a user account using its email address

- `boolean existsByEmail(String email)`  
  Check if a user account for a given email address already exists.





-----

