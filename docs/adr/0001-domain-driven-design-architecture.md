# ADR-0001: Domain-Driven Design Architecture

## Status
Accepted

## Context
The Work Timer application was initially built with a simple service-based architecture using a single `TimeTrackingService`. As the application grew in complexity, particularly around business rules like the 30-minute pause deduction logic and 10-hour daily limits, the codebase became harder to maintain and extend. We needed a more robust architecture that could handle complex business logic while maintaining clean separation of concerns.

## Decision
We decided to implement Domain-Driven Design (DDD) architecture with the following layers:

1. **Domain Layer**: Contains pure business logic, entities, value objects, and domain services
2. **Application Layer**: Orchestrates domain operations using CQRS pattern with commands, queries, and handlers
3. **Infrastructure Layer**: Handles external concerns like data persistence and system integration
4. **Presentation Layer**: UI components with clear data flow separation between smart and dumb components

## Rationale

### Benefits of DDD Architecture:
- **Business Logic Centralization**: All business rules are contained in the domain layer, making them easy to find, test, and modify
- **Testability**: Pure domain logic can be unit tested without external dependencies
- **Maintainability**: Clear layer boundaries make the codebase easier to understand and modify
- **Scalability**: Architecture supports future growth and feature additions
- **Ubiquitous Language**: Consistent terminology across all layers improves communication

### Key Design Patterns Implemented:
- **CQRS (Command Query Responsibility Segregation)**: Separates read and write operations for better clarity
- **Repository Pattern**: Abstracts data access from domain logic
- **Facade Pattern**: Provides simplified API for UI components
- **Value Objects**: Immutable objects like `Duration` and `TimerStatus` encapsulate business concepts

### Specific Business Logic Improvements:
- **30-Minute Deduction Rule**: Now handled by domain services with clear business rules
- **Daily Time Limits**: Enforced at the domain level with proper validation
- **State Transitions**: Clearly defined state machine for timer status changes
- **Time Calculations**: Immutable value objects prevent calculation errors

## Implementation Details

### Domain Layer Structure:
```
domain/
├── entities/          # WorkDay, WorkSession
├── value-objects/     # Duration, TimerStatus, WorkDayDate
├── services/          # TimerService, WorkDayCalculatorService
└── events/            # Domain events for state changes
```

### Application Layer Structure:
```
application/
├── commands/          # StartWorkCommand, StopWorkCommand, ResetTimerCommand
├── queries/           # GetCurrentSessionQuery, GetDailyReportQuery
├── handlers/          # Command and query handlers
├── services/          # TimerApplicationService, ReportingApplicationService
└── facades/           # TimerFacade (unified UI API)
```

### Infrastructure Layer Structure:
```
infrastructure/
├── repositories/      # WorkDayRepository, WorkSessionRepository
├── persistence/       # LocalStorageService, TimerStateRepository
└── adapters/          # LegacyTimerAdapter (migration support)
```

### Presentation Layer Structure:
```
presentation/
├── components/        # Dumb components (TimerControlsComponent, etc.)
├── containers/        # Smart components (DashboardComponent)
├── interfaces/        # Component data contracts
└── shared/            # Shared UI resources
```

## Migration Strategy
The migration from the legacy service-based architecture was implemented gradually:

1. **Phase 1**: Implement domain layer with core business logic
2. **Phase 2**: Create application layer with CQRS pattern
3. **Phase 3**: Build infrastructure layer with repository pattern
4. **Phase 4**: Decompose UI into dumb components with clear data contracts
5. **Phase 5**: Create unified facade for backward compatibility
6. **Phase 6**: Remove legacy services and models
7. **Phase 7**: Performance optimization and documentation

The `LegacyTimerAdapter` was created to maintain backward compatibility during the migration process, allowing for gradual transition without breaking existing functionality.

## Consequences

### Positive:
- **Improved Code Organization**: Clear separation of concerns makes the codebase easier to navigate
- **Enhanced Testability**: Domain logic can be tested in isolation
- **Better Business Rule Enforcement**: Complex business logic is centralized and consistently applied
- **Future-Proof Architecture**: Can easily accommodate new features and requirements
- **Reduced Technical Debt**: Clean architecture patterns prevent code deterioration
- **Performance Benefits**: Angular Signals and OnPush change detection work well with immutable domain objects

### Negative:
- **Increased Complexity**: More files and layers than the original simple architecture
- **Learning Curve**: Developers need to understand DDD concepts and patterns
- **Initial Development Overhead**: Setting up the architecture takes more time upfront

### Neutral:
- **File Count**: Increased number of files due to layer separation, but each file has a single responsibility
- **Abstraction Level**: Higher level of abstraction may seem excessive for a simple timer app, but provides foundation for future growth

## Alternatives Considered

### 1. Simple Service Architecture (Status Quo)
- **Pros**: Simple, direct, fewer files
- **Cons**: Business logic scattered, hard to test, difficult to extend
- **Decision**: Rejected due to growing complexity and maintenance challenges

### 2. Redux/NgRx State Management
- **Pros**: Centralized state, predictable state changes, time-travel debugging
- **Cons**: Boilerplate overhead, learning curve, overkill for current requirements
- **Decision**: Rejected in favor of Angular Signals which provide similar benefits with less complexity

### 3. Feature-Based Modules
- **Pros**: Logical grouping by feature rather than layer
- **Cons**: Can lead to scattered business logic, harder to enforce architectural boundaries
- **Decision**: Rejected in favor of layer-based organization for better separation of concerns

## Implementation Notes

### Angular Signals Integration:
The DDD architecture works exceptionally well with Angular Signals because:
- **Immutable Domain Objects**: Value objects are naturally immutable, perfect for signals
- **Reactive Calculations**: Domain calculations can be exposed as computed signals
- **Performance**: OnPush change detection works optimally with immutable objects

### CQRS Implementation:
Commands and queries are implemented as simple objects with handlers:
```typescript
// Command
export class StartWorkCommand {}

// Handler
@Injectable()
export class StartWorkHandler {
  async handle(command: StartWorkCommand): Promise<void> {
    // Domain operation orchestration
  }
}
```

### Repository Pattern:
Repositories are implemented as abstract classes in the domain layer with concrete implementations in the infrastructure layer:
```typescript
// Domain
export abstract class WorkDayRepository {
  abstract save(workDay: WorkDay): Promise<void>;
  abstract findByDate(date: WorkDayDate): Promise<WorkDay | null>;
}

// Infrastructure
@Injectable()
export class LocalStorageWorkDayRepository extends WorkDayRepository {
  // Concrete implementation
}
```

## Future Considerations

1. **Backend Integration**: The current architecture can easily accommodate a backend by replacing localStorage repositories with HTTP-based implementations
2. **Event Sourcing**: Domain events are already in place, making event sourcing a natural evolution
3. **Microservices**: Each bounded context (timer, reporting, sessions) could become a separate service
4. **Advanced Analytics**: The reporting application service can be extended with more sophisticated analytics
5. **Multi-User Support**: The domain model can be extended to support user contexts

## References
- [Domain-Driven Design by Eric Evans](https://domainlanguage.com/ddd/)
- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [CQRS Pattern Documentation](https://martinfowler.com/bliki/CQRS.html)
- [Angular Signals Documentation](https://angular.io/guide/signals)