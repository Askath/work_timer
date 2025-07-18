# Domain-Driven Design (DDD) in the Work Timer Application

## What is Domain-Driven Design?

Domain-Driven Design (DDD) is a software development approach that focuses on modeling software to match a domain according to input from domain experts. Rather than focusing on technology, DDD emphasizes understanding the business domain and creating a model that accurately reflects how the business operates.

## Core DDD Concepts

### 1. Domain
The **domain** is the sphere of knowledge and activity around which the application logic revolves. In our Work Timer application, the domain is **work time tracking** with concepts like work sessions, pause periods, daily limits, and business rules.

### 2. Ubiquitous Language
A **ubiquitous language** is a common language used by all team members to connect all activities of the team with the software. In our application, terms like "work session," "pause deduction," "effective work time," and "daily limit" mean the same thing in conversations, documentation, and code.

### 3. Bounded Context
A **bounded context** defines the boundaries within which a domain model applies. Our Work Timer application represents a single bounded context focused on personal productivity time tracking.

### 4. Building Blocks

#### Value Objects
**Value Objects** are immutable objects that represent concepts that are characterized by their attributes rather than identity.

**Example from our codebase:**
```typescript
// src/app/domain/value-objects/duration.ts
export class Duration {
  private constructor(public readonly milliseconds: number) {
    if (milliseconds < 0) {
      throw new Error('Duration cannot be negative.');
    }
  }

  static fromMinutes(minutes: number): Duration {
    return new Duration(minutes * 60 * 1000);
  }

  add(other: Duration): Duration {
    return new Duration(this.milliseconds + other.milliseconds);
  }
}
```

**Key Characteristics:**
- Immutable (cannot be changed after creation)
- Defined by their attributes, not identity
- Include business behavior (methods like `add`, `subtract`)
- Validate their own invariants

**Other Value Objects in our domain:**
- `TimerStatus` - Represents timer states (STOPPED, RUNNING, PAUSED)
- `WorkDayDate` - Represents a calendar date for work tracking

#### Entities
**Entities** are objects that have a distinct identity that runs through time and different representations.

**Example from our codebase:**
```typescript
// src/app/domain/entities/work-day.ts
export class WorkDay {
  private readonly _sessions: WorkSession[] = [];
  private _currentSession: WorkSession | null = null;
  private _status: TimerStatus = TimerStatus.STOPPED;

  constructor(
    public readonly date: WorkDayDate,
    sessions: WorkSession[] = [],
    // ... other parameters
  ) {
    // Entity identity is the date
  }

  startSession(): WorkSession {
    // Business logic for starting a work session
  }

  calculateTotalWorkTime(): Duration {
    // Business calculation method
  }
}
```

**Key Characteristics:**
- Have unique identity (WorkDay is identified by date)
- Can change state over time
- Contain business logic and rules
- Maintain consistency boundaries

**Other Entities in our domain:**
- `WorkSession` - Individual work periods identified by ID

#### Aggregates
**Aggregates** are clusters of domain objects that can be treated as a single unit. An aggregate has a root entity called the **Aggregate Root**.

**In our application:**
- `WorkDay` is an **Aggregate Root** that manages all `WorkSession` entities for a specific day
- The aggregate ensures consistency - you cannot create sessions outside of a WorkDay
- All changes to sessions must go through the WorkDay aggregate

```typescript
// WorkDay aggregate maintains consistency
export class WorkDay {
  // Only WorkDay can create/modify sessions
  startSession(): WorkSession {
    if (this.isComplete()) {
      throw new DailyLimitExceededException();
    }
    // Business rule enforcement within aggregate boundary
  }
}
```

#### Domain Services
**Domain Services** contain domain logic that doesn't naturally fit within an entity or value object.

**Example from our codebase:**
```typescript
// src/app/domain/services/time-calculation.service.ts
@Injectable()
export class TimeCalculationService {
  calculateEffectiveWorkTime(workDay: WorkDay): Duration {
    // Complex business logic for pause deductions
    const totalWorkTime = workDay.calculateTotalWorkTime();
    const totalPauseTime = workDay.calculateTotalPauseTime();
    
    // 30-minute deduction rule
    if (this.shouldApplyPauseDeduction(workDay)) {
      return totalWorkTime.subtract(Duration.fromMinutes(30));
    }
    
    return totalWorkTime;
  }
}
```

#### Domain Events
**Domain Events** represent something important that happened in the domain.

**Examples from our codebase:**
```typescript
// src/app/domain/events/work-session-started.event.ts
export class WorkSessionStartedEvent extends DomainEvent {
  constructor(public readonly workDay: WorkDay) {
    super();
  }
}

// src/app/domain/events/pause-deduction-applied.event.ts
export class PauseDeductionAppliedEvent extends DomainEvent {
  constructor(
    public readonly workDay: WorkDay,
    public readonly deductionAmount: Duration
  ) {
    super();
  }
}
```

#### Repositories
**Repositories** provide access to aggregates, abstracting the underlying storage mechanism.

**Example from our codebase:**
```typescript
// src/app/domain/repositories/work-day.repository.ts
export abstract class WorkDayRepository {
  abstract save(workDay: WorkDay): Promise<void>;
  abstract findByDate(date: WorkDayDate): Promise<WorkDay | null>;
  abstract delete(workDay: WorkDay): Promise<void>;
}

// src/app/infrastructure/repositories/local-storage-work-day.repository.ts
@Injectable()
export class LocalStorageWorkDayRepository extends WorkDayRepository {
  async save(workDay: WorkDay): Promise<void> {
    // Concrete implementation using localStorage
  }
}
```

## DDD Architecture Layers in Our Application

### 1. Domain Layer (`src/app/domain/`)
Contains pure business logic with no external dependencies.

**Structure:**
```
domain/
├── entities/           # WorkDay, WorkSession
├── value-objects/      # Duration, TimerStatus, WorkDayDate
├── services/           # TimeCalculationService
├── events/             # Domain events for state changes
├── policies/           # Business policies (pause deduction rules)
└── repositories/       # Abstract repository contracts
```

**Key Principles:**
- No dependencies on external frameworks
- Pure business logic and rules
- Immutable value objects
- Rich domain models with behavior

### 2. Application Layer (`src/app/application/`)
Orchestrates domain operations and manages application workflows using the CQRS pattern.

**Structure:**
```
application/
├── commands/           # StartWorkCommand, StopWorkCommand, ResetTimerCommand
├── queries/            # GetCurrentSessionQuery, GetDailyReportQuery
├── handlers/           # Command and query handlers
├── services/           # Application services coordinating domain operations
└── facades/            # TimerFacade - unified API for UI
```

**CQRS Implementation:**
```typescript
// Command - represents an intention to change state
export class StartWorkCommand {
  constructor(public readonly timestamp?: Date) {}
}

// Command Handler - contains application logic
@Injectable()
export class StartWorkHandler {
  async handle(command: StartWorkCommand): Promise<void> {
    // 1. Load aggregate
    const workDay = await this.workDayRepository.findByDate(WorkDayDate.today());
    
    // 2. Execute domain operation
    const updatedWorkDay = workDay.startSession(command.timestamp);
    
    // 3. Persist changes
    await this.workDayRepository.save(updatedWorkDay);
    
    // 4. Publish events
    this.eventBus.publish(new WorkSessionStartedEvent(updatedWorkDay));
  }
}

// Query - represents a request for data
export class GetCurrentSessionQuery {
  constructor(public readonly includeCalculations: boolean = true) {}
}
```

**Facade Pattern:**
```typescript
// src/app/application/facades/timer.facade.ts
@Injectable()
export class TimerFacade {
  // Computed signals for reactive UI
  readonly currentStatus = computed(() => this._state()?.workDay?.status);
  readonly currentWorkTime = computed(() => this._state()?.calculations?.totalWorkTime);
  
  // Commands
  async startWork(): Promise<void> {
    await this.startWorkHandler.handle(new StartWorkCommand());
  }
  
  // Queries
  async getCurrentSession(): Promise<CurrentSessionView> {
    return await this.getCurrentSessionHandler.handle(new GetCurrentSessionQuery());
  }
}
```

### 3. Infrastructure Layer (`src/app/infrastructure/`)
Handles external concerns like data persistence and system integration.

**Structure:**
```
infrastructure/
├── repositories/       # Concrete repository implementations
├── adapters/           # External system adapters
└── config/             # Infrastructure configuration
```

**Repository Implementation:**
```typescript
// Concrete implementation of domain repository
@Injectable()
export class LocalStorageWorkDayRepository extends WorkDayRepository {
  async save(workDay: WorkDay): Promise<void> {
    const data = this.workDaySerializer.serialize(workDay);
    localStorage.setItem(`workday-${workDay.date.toString()}`, data);
  }
}
```

### 4. Presentation Layer (`src/app/presentation/`)
UI components with clear separation between smart and dumb components.

**Structure:**
```
presentation/
├── components/         # Dumb/presentation components
├── containers/         # Smart/container components  
├── interfaces/         # Component data contracts
└── shared/             # Shared UI resources
```

**Component Architecture:**
```typescript
// Smart component - injects dependencies and manages state
@Component({...})
export class DashboardContainer {
  readonly timerFacade = inject(TimerFacade);
  
  // Uses facade's computed signals
  readonly currentTime = this.timerFacade.formattedCurrentTime;
  readonly buttonText = this.timerFacade.buttonText;
}

// Dumb component - pure presentation
@Component({
  template: `
    <div class="timer-display">{{ time }}</div>
    <button>{{ buttonText }}</button>
  `
})
export class TimerDisplayComponent {
  @Input() time!: string;
  @Input() buttonText!: string;
  @Output() buttonClick = new EventEmitter<void>();
}
```

## Key Business Rules Implementation

### 30-Minute Pause Deduction Rule
This complex business rule is implemented across multiple DDD components:

**Domain Policy:**
```typescript
// src/app/domain/policies/pause-deduction-policy.ts
export class PauseDeductionPolicy {
  shouldApplyDeduction(workDay: WorkDay): boolean {
    const totalPauseTime = workDay.calculateTotalPauseTime();
    return totalPauseTime.minutes > 0 && 
           totalPauseTime.minutes <= 30 && 
           !workDay.pauseDeductionApplied;
  }
}
```

**Domain Service:**
```typescript
// src/app/domain/services/time-calculation.service.ts
calculateEffectiveWorkTime(workDay: WorkDay): Duration {
  const policy = new PauseDeductionPolicy();
  if (policy.shouldApplyDeduction(workDay)) {
    return workDay.calculateTotalWorkTime().subtract(Duration.fromMinutes(30));
  }
  return workDay.calculateTotalWorkTime();
}
```

**Application Handler:**
```typescript
// Applied when stopping work
async handle(command: StopWorkCommand): Promise<void> {
  const workDay = await this.workDayRepository.findByDate(WorkDayDate.today());
  const updatedWorkDay = workDay.stopCurrentSession();
  
  // Business rule evaluation
  if (this.pauseDeductionPolicy.shouldApplyDeduction(updatedWorkDay)) {
    updatedWorkDay.applyPauseDeduction();
    this.eventBus.publish(new PauseDeductionAppliedEvent(updatedWorkDay));
  }
}
```

## Benefits of DDD in Our Application

### 1. **Business Logic Clarity**
All complex business rules (pause deductions, daily limits) are centralized in the domain layer and expressed in business terms.

### 2. **Testability**
Domain logic can be tested in isolation without external dependencies:
```typescript
describe('PauseDeductionPolicy', () => {
  it('should apply deduction for 25-minute pause', () => {
    const workDay = createWorkDayWithPause(Duration.fromMinutes(25));
    const policy = new PauseDeductionPolicy();
    
    expect(policy.shouldApplyDeduction(workDay)).toBe(true);
  });
});
```

### 3. **Maintainability**
Changes to business rules only require updates to domain components, with clear boundaries preventing unwanted side effects.

### 4. **Ubiquitous Language**
The code uses the same terminology as business conversations:
- "Work Session" not "Timer Period"
- "Pause Deduction" not "Time Reduction"
- "Effective Work Time" not "Adjusted Duration"

### 5. **Future Scalability**
The architecture supports future enhancements like:
- Multiple users
- Project tracking
- Advanced reporting
- Backend integration

## Guidance for Contributors

### 1. **Understanding the Domain**
Before making changes, understand the business rules in [BUSINESS_RULES.md](./BUSINESS_RULES.md) and the architectural decisions in [docs/adr/](./docs/adr/).

### 2. **Layer Responsibilities**
- **Domain Layer**: Pure business logic only - no Angular dependencies, no external calls
- **Application Layer**: Orchestrate domain operations, handle commands/queries
- **Infrastructure Layer**: External system integration, data persistence
- **Presentation Layer**: UI concerns only, use facade for data access

### 3. **Dependency Rules**
- Dependencies flow inward: Presentation → Application → Domain
- Domain layer has no dependencies on outer layers
- Use dependency inversion for external concerns

### 4. **Adding New Features**

#### For New Business Rules:
1. Add domain logic to entities, value objects, or domain services
2. Create or update domain events if needed
3. Update application handlers to orchestrate the new logic
4. Add tests for the business rules

#### For New UI Features:
1. Create computed signals in the facade
2. Implement dumb components for presentation
3. Update smart components to use facade data
4. Follow the existing component data contracts

#### For New Data Requirements:
1. Update domain repositories (abstract contracts)
2. Implement concrete repositories in infrastructure layer
3. Update serialization/persistence logic as needed

### 5. **Testing Strategy**

#### Domain Layer Testing:
```typescript
// Test pure business logic
describe('WorkDay', () => {
  it('should calculate total work time correctly', () => {
    const workDay = WorkDay.create(WorkDayDate.today());
    workDay.addSession(createSession(Duration.fromHours(2)));
    workDay.addSession(createSession(Duration.fromHours(3)));
    
    expect(workDay.calculateTotalWorkTime()).toEqual(Duration.fromHours(5));
  });
});
```

#### Application Layer Testing:
```typescript
// Test command handlers with mocks
describe('StartWorkHandler', () => {
  it('should start work session when conditions are met', async () => {
    const workDay = createEmptyWorkDay();
    mockRepository.findByDate.and.returnValue(Promise.resolve(workDay));
    
    await handler.handle(new StartWorkCommand());
    
    expect(mockRepository.save).toHaveBeenCalledWith(jasmine.any(WorkDay));
  });
});
```

### 6. **Common Patterns**

#### Adding a New Command:
1. Create command class in `application/commands/`
2. Create handler class in `application/handlers/`
3. Add method to facade to execute command
4. Update UI to call facade method

#### Adding a New Query:
1. Create query class in `application/queries/`
2. Create handler class in `application/handlers/`
3. Define view model interface
4. Add computed signal to facade
5. Update UI to display data

#### Adding Domain Logic:
1. Determine if logic belongs in entity, value object, or domain service
2. Write business logic using ubiquitous language
3. Add domain events if state changes are significant
4. Create tests for business rules

## Advanced DDD Concepts in Our Application

### 1. **Domain Events**
We use domain events to decouple business logic and enable side effects:
```typescript
// Events are published after domain operations
this.eventBus.publish(new DailyLimitReachedEvent(workDay));
```

### 2. **Specifications (Policies)**
Complex business rules are encapsulated in policy objects:
```typescript
export class DailyLimitPolicy {
  isLimitExceeded(workDay: WorkDay): boolean {
    return workDay.calculateEffectiveWorkTime().hours >= 10;
  }
}
```

### 3. **Factory Methods**
Complex object creation is handled by factory methods:
```typescript
// Entity factory methods
static create(date: WorkDayDate): WorkDay {
  return new WorkDay(date);
}

// Value object factory methods
static fromMinutes(minutes: number): Duration {
  return new Duration(minutes * 60 * 1000);
}
```

### 4. **Immutability**
All value objects and domain operations return new instances:
```typescript
// Value objects are immutable
add(other: Duration): Duration {
  return new Duration(this.milliseconds + other.milliseconds);
}

// Entity operations return new instances
stopCurrentSession(): WorkDay {
  return new WorkDay(/* new state */);
}
```

## Resources for Learning More

### Books
- **"Domain-Driven Design" by Eric Evans** - The foundational book introducing DDD concepts
- **"Implementing Domain-Driven Design" by Vaughn Vernon** - Practical implementation guidance

### Our Documentation
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Detailed architecture overview and patterns
- **[BUSINESS_RULES.md](./BUSINESS_RULES.md)** - Complete business logic documentation  
- **[docs/adr/0001-domain-driven-design-architecture.md](./docs/adr/0001-domain-driven-design-architecture.md)** - Architectural decision record for DDD adoption

### Online Resources
- [Domain-Driven Design Official Website](https://domainlanguage.com/ddd/)
- [Martin Fowler on DDD](https://martinfowler.com/tags/domain%20driven%20design.html)
- [Clean Architecture Principles](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

This Work Timer application serves as a practical example of how DDD principles can be applied to create maintainable, testable, and business-focused software, even for relatively simple domains. The clear separation of concerns and rich domain models make the codebase easier to understand, extend, and maintain over time.