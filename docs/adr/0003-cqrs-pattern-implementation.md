# ADR-0003: CQRS Pattern Implementation

## Status
Accepted

## Context
The Work Timer application has distinct read and write operations with different complexity levels. Write operations (start work, stop work, reset timer) involve complex business logic including state validation, business rule enforcement, and side effects. Read operations (get current session, daily reports) require different data shapes and can be optimized independently. We needed a clear separation between command and query responsibilities to improve maintainability and enable future scalability.

## Decision
We decided to implement the Command Query Responsibility Segregation (CQRS) pattern to separate read and write operations in the application layer, using distinct commands, queries, and handlers.

## Implementation Structure

### Commands (Write Operations)
```typescript
// Simple command objects carrying intent and data
export class StartWorkCommand {
  constructor(public readonly timestamp?: Date) {}
}

export class StopWorkCommand {
  constructor(public readonly timestamp?: Date) {}
}

export class ResetTimerCommand {
  constructor(public readonly confirmation: boolean = false) {}
}
```

### Queries (Read Operations)
```typescript
// Query objects for data retrieval operations
export class GetCurrentSessionQuery {
  constructor(public readonly includeCalculations: boolean = true) {}
}

export class GetDailyReportQuery {
  constructor(
    public readonly date?: WorkDayDate,
    public readonly includeHistory: boolean = false
  ) {}
}
```

### Command Handlers
```typescript
@Injectable()
export class StartWorkHandler {
  constructor(
    private timerService: TimerService,
    private workDayRepository: WorkDayRepository,
    private eventBus: DomainEventBus
  ) {}

  async handle(command: StartWorkCommand): Promise<void> {
    // 1. Load current state
    const workDay = await this.timerService.getCurrentWorkDay();
    
    // 2. Apply business rules
    if (workDay.isComplete()) {
      throw new DailyLimitExceededException();
    }
    
    if (workDay.status.isRunning()) {
      throw new InvalidSessionTransitionException();
    }
    
    // 3. Execute domain operation
    const updatedWorkDay = workDay.startSession(command.timestamp);
    
    // 4. Persist changes
    await this.workDayRepository.save(updatedWorkDay);
    
    // 5. Publish domain events
    this.eventBus.publish(new WorkSessionStartedEvent(updatedWorkDay));
  }
}
```

### Query Handlers
```typescript
@Injectable()
export class GetCurrentSessionHandler {
  constructor(
    private timerService: TimerService,
    private calculatorService: WorkDayCalculatorService
  ) {}

  async handle(query: GetCurrentSessionQuery): Promise<CurrentSessionView> {
    const workDay = await this.timerService.getCurrentWorkDay();
    const currentSession = workDay.getCurrentSession();
    
    if (!query.includeCalculations) {
      return {
        sessionId: currentSession?.id,
        startTime: currentSession?.startTime,
        currentTime: currentSession?.getCurrentDuration()
      };
    }
    
    const calculations = this.calculatorService.calculateMetrics(workDay);
    return {
      sessionId: currentSession?.id,
      startTime: currentSession?.startTime,
      currentTime: currentSession?.getCurrentDuration(),
      totalWorkTime: calculations.totalWorkTime,
      effectiveWorkTime: calculations.effectiveWorkTime,
      remainingTime: calculations.remainingTime
    };
  }
}
```

### Facade Integration
```typescript
@Injectable()
export class TimerFacade {
  constructor(
    private startWorkHandler: StartWorkHandler,
    private stopWorkHandler: StopWorkHandler,
    private resetTimerHandler: ResetTimerHandler,
    private getCurrentSessionHandler: GetCurrentSessionHandler,
    private getDailyReportHandler: GetDailyReportHandler
  ) {}

  // Commands
  async startWork(): Promise<void> {
    await this.startWorkHandler.handle(new StartWorkCommand());
    this.updateState();
  }

  async stopWork(): Promise<void> {
    await this.stopWorkHandler.handle(new StopWorkCommand());
    this.updateState();
  }

  async resetTimer(): Promise<void> {
    await this.resetTimerHandler.handle(new ResetTimerCommand(true));
    this.updateState();
  }

  // Queries
  async getCurrentSession(): Promise<CurrentSessionView> {
    return await this.getCurrentSessionHandler.handle(new GetCurrentSessionQuery());
  }

  async getDailyReport(): Promise<DailyReportView> {
    return await this.getDailyReportHandler.handle(new GetDailyReportQuery());
  }
}
```

## Rationale

### Benefits of CQRS Implementation:

#### 1. **Clear Separation of Concerns**
- **Commands**: Focus solely on state changes and business rule enforcement
- **Queries**: Optimized for data retrieval and view model creation
- **Handlers**: Single responsibility for each operation type

#### 2. **Business Logic Clarity**
```typescript
// Command handlers contain all business logic for state changes
async handle(command: StopWorkCommand): Promise<void> {
  const workDay = await this.timerService.getCurrentWorkDay();
  
  // Business rule: Can only stop if currently running
  if (!workDay.status.isRunning()) {
    throw new InvalidSessionTransitionException();
  }
  
  // Business rule: Apply pause deduction if conditions met
  const updatedWorkDay = workDay.stopCurrentSession(command.timestamp);
  
  // Business rule: Check for 30-minute deduction rule
  if (this.shouldApplyPauseDeduction(updatedWorkDay)) {
    updatedWorkDay.applyPauseDeduction();
  }
  
  await this.workDayRepository.save(updatedWorkDay);
}
```

#### 3. **Testability**
```typescript
// Each handler can be tested in isolation
describe('StartWorkHandler', () => {
  it('should throw exception when daily limit exceeded', async () => {
    const workDay = createWorkDayAtLimit();
    mockTimerService.getCurrentWorkDay.and.returnValue(workDay);
    
    const command = new StartWorkCommand();
    
    await expectAsync(handler.handle(command))
      .toBeRejectedWith(jasmine.any(DailyLimitExceededException));
  });
});
```

#### 4. **Performance Optimization**
- **Commands**: Can be optimized for write performance
- **Queries**: Can use read-optimized data structures and caching
- **Independent Scaling**: Read and write operations can scale separately

#### 5. **Audit Trail**
```typescript
// Commands naturally create audit logs
export class AuditingStartWorkHandler implements StartWorkHandler {
  async handle(command: StartWorkCommand): Promise<void> {
    this.auditLog.record('StartWork', command, Date.now());
    await this.innerHandler.handle(command);
  }
}
```

### Integration with Domain-Driven Design:

#### 1. **Domain Model Protection**
```typescript
// Commands validate input at application boundary
async handle(command: StartWorkCommand): Promise<void> {
  // Input validation
  if (command.timestamp && command.timestamp > new Date()) {
    throw new InvalidCommandException('Cannot start work in the future');
  }
  
  // Domain operation
  const workDay = await this.timerService.getCurrentWorkDay();
  const updatedWorkDay = workDay.startSession(command.timestamp);
}
```

#### 2. **Domain Events Integration**
```typescript
// Commands trigger domain events
async handle(command: StopWorkCommand): Promise<void> {
  const workDay = await this.timerService.getCurrentWorkDay();
  const updatedWorkDay = workDay.stopCurrentSession();
  
  // Domain events published after successful operation
  if (updatedWorkDay.isComplete()) {
    this.eventBus.publish(new DailyLimitReachedEvent(updatedWorkDay));
  }
  
  this.eventBus.publish(new WorkSessionStoppedEvent(updatedWorkDay));
}
```

#### 3. **Repository Pattern Integration**
```typescript
// Handlers orchestrate domain and infrastructure
async handle(command: ResetTimerCommand): Promise<void> {
  if (!command.confirmation) {
    throw new InvalidCommandException('Reset requires confirmation');
  }
  
  const workDay = await this.workDayRepository.findByDate(WorkDayDate.today());
  if (workDay) {
    await this.workDayRepository.delete(workDay);
  }
  
  // Create fresh work day
  const newWorkDay = WorkDay.createNew(WorkDayDate.today());
  await this.workDayRepository.save(newWorkDay);
}
```

## Command and Query Patterns

### Command Pattern Details:
```typescript
// Commands are immutable data containers
export abstract class Command {
  readonly timestamp: Date = new Date();
  readonly commandId: string = generateId();
}

export class StartWorkCommand extends Command {
  constructor(public readonly requestedStartTime?: Date) {
    super();
  }
}

// Command handlers implement consistent interface
export interface CommandHandler<T extends Command> {
  handle(command: T): Promise<void>;
}
```

### Query Pattern Details:
```typescript
// Queries specify what data is needed
export abstract class Query<TResult> {
  readonly queryId: string = generateId();
}

export class GetDailyReportQuery extends Query<DailyReportView> {
  constructor(
    public readonly date: WorkDayDate = WorkDayDate.today(),
    public readonly includeProjections: boolean = false
  ) {
    super();
  }
}

// Query handlers return view models optimized for UI
export interface QueryHandler<TQuery extends Query<TResult>, TResult> {
  handle(query: TQuery): Promise<TResult>;
}
```

### View Model Pattern:
```typescript
// View models are optimized for UI consumption
export interface CurrentSessionView {
  readonly sessionId: string | null;
  readonly startTime: Date | null;
  readonly currentTime: Duration;
  readonly formattedTime: string;
  readonly canStop: boolean;
}

export interface DailyReportView {
  readonly date: string;
  readonly totalSessions: number;
  readonly totalWorkTime: Duration;
  readonly effectiveWorkTime: Duration;
  readonly pauseDeduction: Duration;
  readonly remainingTime: Duration;
  readonly progressPercentage: number;
  readonly isComplete: boolean;
  readonly formattedSummary: string;
}
```

## Error Handling Strategy

### Command Error Handling:
```typescript
// Commands can fail with business rule violations
export abstract class BusinessRuleException extends Error {
  constructor(message: string, public readonly rule: string) {
    super(message);
  }
}

export class DailyLimitExceededException extends BusinessRuleException {
  constructor() {
    super('Daily 10-hour work limit has been reached', 'DAILY_LIMIT');
  }
}

// Handlers catch and transform domain exceptions
async handle(command: StartWorkCommand): Promise<void> {
  try {
    // Domain operation
  } catch (error) {
    if (error instanceof DomainException) {
      throw new BusinessRuleException(error.message, error.ruleCode);
    }
    throw error;
  }
}
```

### Query Error Handling:
```typescript
// Queries return safe defaults for missing data
async handle(query: GetCurrentSessionQuery): Promise<CurrentSessionView> {
  try {
    const workDay = await this.timerService.getCurrentWorkDay();
    return this.createView(workDay);
  } catch (error) {
    // Return safe default view for UI
    return {
      sessionId: null,
      startTime: null,
      currentTime: Duration.zero(),
      formattedTime: '00:00:00',
      canStop: false
    };
  }
}
```

## Performance Considerations

### Command Optimization:
- **Async Processing**: Commands can be queued for background processing
- **Validation Caching**: Business rule validations can be cached
- **Event Batching**: Multiple domain events can be batched for performance

### Query Optimization:
- **Result Caching**: Query results can be cached aggressively
- **Lazy Loading**: Expensive calculations only performed when requested
- **View Model Caching**: Pre-computed view models for common queries

### Memory Management:
```typescript
// Handlers are stateless and can be singleton
@Injectable({ providedIn: 'root' })
export class StartWorkHandler {
  // No instance state - safe for concurrent operations
}
```

## Testing Strategy

### Command Testing:
```typescript
describe('StopWorkHandler', () => {
  let handler: StopWorkHandler;
  let mockTimerService: jasmine.SpyObj<TimerService>;
  let mockRepository: jasmine.SpyObj<WorkDayRepository>;

  beforeEach(() => {
    // Setup mocks
  });

  it('should apply pause deduction when conditions are met', async () => {
    const workDay = createWorkDayWithShortPause();
    mockTimerService.getCurrentWorkDay.and.returnValue(workDay);

    await handler.handle(new StopWorkCommand());

    expect(mockRepository.save).toHaveBeenCalledWith(
      jasmine.objectContaining({
        pauseDeduction: Duration.fromMinutes(30)
      })
    );
  });
});
```

### Query Testing:
```typescript
describe('GetDailyReportHandler', () => {
  it('should return formatted view model', async () => {
    const workDay = createCompletedWorkDay();
    mockTimerService.getCurrentWorkDay.and.returnValue(workDay);

    const result = await handler.handle(new GetDailyReportQuery());

    expect(result.formattedSummary).toBe('Completed: 10.0 hours worked');
    expect(result.progressPercentage).toBe(100);
  });
});
```

### Integration Testing:
```typescript
describe('Timer CQRS Integration', () => {
  it('should maintain consistency between commands and queries', async () => {
    const facade = TestBed.inject(TimerFacade);

    await facade.startWork();
    const session = await facade.getCurrentSession();
    expect(session.sessionId).toBeTruthy();

    await facade.stopWork();
    const report = await facade.getDailyReport();
    expect(report.totalSessions).toBe(1);
  });
});
```

## Alternatives Considered

### 1. **Direct Service Calls**
- **Pros**: Simple, direct, fewer abstractions
- **Cons**: Mixed responsibilities, harder to test, business logic scattered
- **Decision**: Rejected due to maintainability concerns

### 2. **Event-Driven Architecture**
- **Pros**: Loose coupling, eventual consistency, scalability
- **Cons**: Complexity, debugging difficulty, potential inconsistency
- **Decision**: Rejected for current scale, but events are used within CQRS

### 3. **Traditional Repository Pattern Only**
- **Pros**: Familiar pattern, simple CRUD operations
- **Cons**: No clear business operation boundaries, mixed read/write concerns
- **Decision**: Rejected in favor of CQRS which includes repositories

### 4. **GraphQL with Resolvers**
- **Pros**: Flexible queries, type safety, client-optimized
- **Cons**: Overkill for current requirements, additional complexity
- **Decision**: Rejected due to complexity vs benefit ratio

## Future Enhancements

### 1. **Command Queuing**
```typescript
// Commands can be queued for background processing
export class QueuedCommandBus {
  async execute<T extends Command>(command: T): Promise<void> {
    await this.queue.enqueue(command);
  }
}
```

### 2. **Read Model Optimization**
```typescript
// Separate read models for different query patterns
export class DailyReportReadModel {
  constructor(
    public readonly precomputedSummary: string,
    public readonly cachedCalculations: WorkDayCalculations
  ) {}
}
```

### 3. **Event Sourcing Integration**
```typescript
// Commands can generate event streams
export class EventSourcedStartWorkHandler {
  async handle(command: StartWorkCommand): Promise<void> {
    const events = [
      new WorkSessionStartedEvent(),
      new TimerStatusChangedEvent()
    ];
    await this.eventStore.append(events);
  }
}
```

### 4. **Cross-Boundary Commands**
```typescript
// Commands for external system integration
export class SyncWorkDataCommand {
  constructor(public readonly targetSystem: string) {}
}
```

## Consequences

### Positive:
- **Clear Business Operations**: Each command represents a distinct business operation
- **Testable Business Logic**: Handlers can be tested in isolation with clear inputs/outputs
- **Performance Optimization**: Read and write operations can be optimized independently
- **Audit Trail**: Natural command logging for business operations
- **Future Scalability**: Pattern supports distributed systems and event sourcing

### Negative:
- **Increased Complexity**: More files and abstractions than direct service calls
- **Learning Curve**: Developers need to understand CQRS concepts
- **Initial Development Time**: Setting up the pattern takes longer upfront

### Neutral:
- **Code Volume**: More files but each with single responsibility
- **Abstraction Level**: Higher abstraction may seem excessive for simple operations

## References
- [CQRS Pattern by Martin Fowler](https://martinfowler.com/bliki/CQRS.html)
- [Domain-Driven Design by Eric Evans](https://domainlanguage.com/ddd/)
- [Command Pattern](https://refactoring.guru/design-patterns/command)
- [Clean Architecture by Robert Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)