# Backend Entity Documentation

Project: Food Waste Rescue Marketplace

---




## 1) Badge

**Table:** `Badge`  
**Purpose:** Defines gamification badges 

### Attributes
| Field | Type| Notes |
|------|------|------|
| `badge_Id` | `UUID` | Primary key |
| `code` | `String` |   |
| `name` | `String` |   |
| `description` | `String` |  |

### Relationships
- Badge → EmployeeBadge (one-to-Many) (?)

---
## 2) BundlePosting

**Table:** `BundlePosting`

**Purpose:** `BundlePosting` represents a food bundle listed for rescue

### Attributes
| Field | Type| Notes |
|------|------|------|
| `posting_id` | `UUID` | Primary key |
| `seller_id` | `String` |@`ManyToOne`, FK `seller`   |
| `category_id` | `String` | @`ManyToOne`, FK `category`  |
| `window_id` | `String` |  |
| `pickup_start_at` | `String` |   |
| `pickup_end_at` | `String` |  |
| `quantity_total` | `String` |   |
| `quantity_reserved` | `String` |  |
| `price_cents` | `String` |   |
| `discount_pct` | `String` |  |
| `contexts_test` | `String` | |
| `status` | `String` |   |
| `created_at` | `String` |   |
| `estimated_weight_grams` | `String` |  |

### Relationships


- BundlePosting → Seller (Many-to-One) (?)

- BundlePosting → Category (Many-to-One)



Description
---

## 3) Category

**Table:** `Category`  
**Purpose:** Bundle/product category

### Attributes
| Field | Type | Notes |
|------|------|------------|
| `category_id` | `UUID` |Primary key  |
| `name` | `String` |  |

### Relationships
- Category → BundlePosting (One-to-Many)

---
## 4) Employee

**Table:** `Employee`  
**Purpose:** Represents a consumer/employee user that rescues bundles (tracks streaks and badges)


### Attributes (confirmed)
| Field | Type | Notes |
|------|------|------|
| `employee_id` | `UUID` | Primary key |
| `org_id` | `UUID` |@`ManyToOne`, FK `orgranisation`  |
| `user_id` | `UUID` |@`OneToOne`, FK `user` |
| `currentStreakWeeks` | `Integer` |   |
| `bestStreakWeeks` | `Integer` |   |
| `lastRescueWeekStart` | `Integer` |   |
| `createdAt` | `Instant` ||

### Relationships
- Employee → Organisation (Many-to-One)

- Employee → UserAccount (Zero_or_One-to-one)

- Employee → EmployeeBadge (One-to-Many)

- Employee → Reservation (One-to-Many)

- Employee → RescueEvent (One-to-Many, optional)
---

## 5) EmployeeBadge

**Table:** `Employee_badge`  
**Purpose:** Many-to-many join between Employee and Badge

**Key Model:** `@IdClass(EmployeeBadge.Key.class)` (composite PK)

### Attributes
| Field | Type | Notes |
|------|------|------|
| `employee_id` | `UUID` | @`ManyToOne`, FK `empolyee` |
| `badge_id` | `UUID` | @`ManyToOne`, FK `badge`|
| `awardedAt` | `Instant` |  |
### Relationships

- EmployeeBadge → Employee (Many-to-One)

- EmployeeBadge → Badge (Many-to-One)


---
## 6) IssueReport

**Table:** `Issue_report`  
**Purpose:** Consumer reports issues about a bundle/reservation

### Enums
`IssueReport.Type`:
- `UNAVAILABLE`
- `QUALITY`
- `OTHER`

`IssueReport.Status`:
- `OPEN`
- `RESPONDED`
- `RESOLVED`

### Attributes
| Field | Type | Notes |
|------|------|------------------------|
| `issue_id` | `UUID` | Primaty key |
| `posting_id` | `UUID` |@`ManyToOne`, FK `posting`  |
| `reservation_id` | `UUID` | @`ManyToOne`, FK `reservation` |
| `empolyee_id` | `UUID` |@`ManyToOne`, FK `empolyee`  |
| `created_by_user_id` | `UUID` |  |
| `type` | `String` |  |
| `description` | `String` |  |
| `status` | `Status` |  |
| `sellerResponse` | `String` | |
| `responded_by_user_id` | `UUID` |  |
| `createdAt` | `Instant` |  |
| `resolvedAt` | `Instant` |  |

### Relationships 
- IssueReport → UserAccount (Many-to-One) (?)

- IssueReport → BundlePosting (Many-to-One)

- IssueReport → Reservation (Many-to-One)

- IssueReport → Employee (Many-to-One)

---
## 7) Organisation

**Table:** `Organisation`  
**Purpose:** Represents business participating in the system

### Attributes
| Field | Type | Notes |
|------|------|------------|
| `orgId` | `UUID` | Primary key |
| `name` | `String` |  |
| `locationText` | `String` |  |
| `billingStub` | `String` |  |
| `createdAt` | `Instant` | |

### Relationships
- Organisation → Employee (One-to-Many)

- Organisation → Reservation (One-to-Many)


---
## 8) RescueEvent

**Table:** `Rescue_event`  
**Purpose:** Event entity for completed rescues, used for streak + impact calculations

### Attributes
| Field | Type | Constraints |
|------|------|------------|
| `eventId` | `UUID` | Primary key |
| `employee` | `Employee` | `@ManyToOne`, FK `employee_id` |
| `reservation` | `Reservation` | `@OneToOne`, FK `reservation_id` |
| `collectedAt` | `Instant` |  |
| `mealsEstimate` | `Integer` |  |
| `co2eEstimateGrams` | `Integer` |  |

### Relationships

- RescueEvent → Employee (Many-to-One)


- RescueEvent → Reservation (One-to-One)




---
## 9) Reservation

**Table:** `Reservation`  
**Purpose:** The user reserved to a bundle, including claim code information and lifecycle status.

### Enums
`Reservation.Status`:
- `RESERVED`
- `COLLECTED`
- `NO_SHOW`
- `EXPIRED`
- `CANCELLED`

### Attributes (confirmed)
| Field | Type | Notes |
|------|------|------|
| `reservation_id` | `uuid`|   Primary key|
| `posting_id` | `uuid`|@`ManyToOne`, FK `BundlePosting`   |
| `org_id` | `uuid`|  @`ManyToOne`, FK `Orgranisation`|
| `empolyee_id` | `uuid`|@`ManyToOne`, FK `Empolyee`  |
| `reserved_at` | `Instant`|  |
| `status` | `Status` |  |
| `claimCodeHash` | `String` |  |
| `claimCodeLast4` | `String` | |
| `collectedAt` | `Instant`|  |
| `noShowMarkedAt` | `Instant`  |  |
| `expiredMarkedAt` | `Instant` |   |

### Relationships 


- Reservation → Organisation (Many-to-One)

- Reservation → UserAccount (Many-to-One)

- Reservation → Employee (Many-to-One)

- Reservation → RescueEvent (One-to-One)

- Reservation → IssueReport (One-to-Many)

---
## 10) Seller

**Table:** `Seller`  
**Purpose:** Represents a seller listing surplus bundles

### Attributes
| Field | Type | Notes |
|------|------|------------|
| `seller_id` | `UUID` | Primary Key |
| `user` | `UserAccount` |@`OneToOne`,  FK: `user_id` |
| `name` | `String` |  |
| `locationText` | `String` | |
| `openingHoursText` | `String` |  |
| `contactStub` | `String` |  |
| `createdAt` | `Instant` | |

### Relationships

- Seller → UserAccount (One-to-One)

- Seller → BundlePosting (One-to-Many) (?)

---
## 11) UserAccount

**Table:** `UserAccount`  
**Purpose:** The system's login account information

### Enums
`Reservation.Status`:
- `SELLER`
- `ORG_ADMIN`
- `EMPOLYEE`
- `MAINTAINER`

### Attributes
| Field | Type | Notes |
|------|------|------------|
| `userID` | `UUID` | Primary Key |
| `email` | `String` | |
| `passwordHash` | `String` |  |
| `role` | `String` | |
| `createdAt` | `Instant` | |

### Relationships
- UserAccount → Seller (One-to-One)

- UserAccount → Employee (One-to-One)

- UserAccount → Reservation (One-to-Many)

- UserAccount → IssueReport (One-to-Many) (?)

-----
