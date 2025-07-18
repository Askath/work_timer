# Work Timer Application Architecture

## Overview

The Work Timer application implements a Domain-Driven Design (DDD) architecture with clear layer separation, using Angular 20.1.0 with standalone components and Angular Signals for reactive state management.

## Architecture Layers

### 1. Domain Layer (`src/app/domain/`)

The core business logic layer containing pure domain models and business rules.

- **Value Objects**: `Duration`, `TimerStatus`, `WorkDayDate`
- **Entities**: `WorkDay`, `WorkSession` 
- **Domain Services**: `TimerService`, `WorkDayCalculatorService`
- **Events**: Domain events for state changes

Key characteristics:
- No external dependencies
- Pure business logic
- Immutable value objects
- Rich domain models with business behavior

### 2. Application Layer (`src/app/application/`)

Orchestrates domain operations and manages application workflows.

#### Commands and Queries (CQRS Pattern)
- **Commands**: `StartWorkCommand`, `StopWorkCommand`, `ResetTimerCommand`
- **Queries**: `GetCurrentSessionQuery`, `GetDailyReportQuery`
- **Handlers**: Command and query handlers implementing business workflows

#### Services
- **TimerApplicationService**: Core timer state management
- **ReportingApplicationService**: Daily reporting and analytics
- **WorkSessionApplicationService**: Session management

#### Facades
- **TimerFacade**: Unified API for UI components, providing computed signals

### 3. Infrastructure Layer (`src/app/infrastructure/`)

Handles external concerns like data persistence and system integration.

#### Repositories
- **WorkDayRepository**: Domain repository implementation
- **WorkSessionRepository**: Session storage implementation

#### Persistence
- **LocalStorageService**: Browser localStorage persistence
- **TimerStateRepository**: State persistence implementation

#### Adapters
- **LegacyTimerAdapter**: Backward compatibility during migration

### 4. Presentation Layer (`src/app/presentation/`)

UI components and presentation logic.

#### Components (Dumb Components)
- **TimerControlsComponent**: Start/stop/reset buttons
- **CurrentSessionComponent**: Session display
- **DailySummaryComponent**: Work metrics
- **ProgressDisplayComponent**: Progress visualization
- **AppHeaderComponent**: Application header
- **WorkCompleteComponent**: Completion message

#### Containers (Smart Components)
- **DashboardComponent**: Main application container

#### Interfaces
- **Component Data Interfaces**: Type-safe data contracts for components

## Key Design Patterns

### 1. Domain-Driven Design (DDD)
- **Ubiquitous Language**: Consistent terminology across all layers
- **Bounded Context**: Clear domain boundaries
- **Value Objects**: Immutable domain concepts (Duration, TimerStatus)
- **Entities**: Objects with identity (WorkDay, WorkSession)
- **Domain Services**: Complex business logic coordination

### 2. Command Query Responsibility Segregation (CQRS)
- **Commands**: State-changing operations
- **Queries**: Data retrieval operations
- **Handlers**: Separate handling for commands and queries

### 3. Repository Pattern
- **Domain Repositories**: Abstract data access
- **Infrastructure Implementation**: Concrete persistence implementations

### 4. Facade Pattern
- **TimerFacade**: Simplified API for UI components
- **Computed Signals**: Reactive data transformations

### 5. Adapter Pattern
- **LegacyTimerAdapter**: Migration support for old API compatibility

## State Management

### Angular Signals Architecture
```typescript
// Core State Signal
private readonly _state = signal<TimerApplicationState | null>(null);

// Computed Signals for UI
readonly currentStatus = computed(() => this._state()?.workDay?.status);
readonly currentWorkTime = computed(() => this._state()?.calculations?.totalWorkTime);
readonly effectiveWorkTime = computed(() => this._state()?.calculations?.effectiveWorkTime);
```

### Benefits
- **Automatic Change Detection**: No manual subscription management
- **Performance**: OnPush change detection with signals
- **Type Safety**: Strongly typed reactive state
- **Immutability**: State updates create new immutable state

## Business Logic Flow

### 1. Timer Operations
```
UI Component → TimerFacade → Command Handler → Domain Service → Repository
```

### 2. State Updates
```
Domain Event → Application Service → Signal Update → UI Reactive Update
```

### 3. Data Persistence
```
State Change → Repository → Infrastructure Service → LocalStorage
```

## Component Communication

### Data Flow (Unidirectional)
```
TimerFacade (Signals) → DashboardContainer → Dumb Components (Inputs)
```

### Event Flow (Upward)
```
Dumb Components (Outputs) → DashboardContainer → TimerFacade → Application Layer
```

## Error Handling

### Domain Layer
- **Domain Exceptions**: Business rule violations
- **Validation**: Input validation at domain boundaries

### Application Layer
- **Command Validation**: Pre-condition checks
- **Error Propagation**: Structured error handling

### Presentation Layer
- **User Feedback**: User-friendly error messages
- **Graceful Degradation**: Fallback UI states

## Performance Optimizations

### 1. Change Detection
- **OnPush Strategy**: All components use OnPush change detection
- **Signal-Based**: Automatic optimization with Angular Signals

### 2. Bundle Optimization
- **Tree Shaking**: Unused code elimination
- **Code Splitting**: Lazy loading where applicable
- **Minification**: Production build optimizations

### 3. Memory Management
- **Immutable State**: Prevents memory leaks
- **Computed Signals**: Efficient reactive calculations
- **Cleanup**: Proper resource disposal

## Testing Strategy

### 1. Unit Tests
- **Domain Layer**: Pure business logic testing
- **Application Layer**: Service and handler testing
- **Infrastructure Layer**: Repository and adapter testing

### 2. Integration Tests
- **Component Integration**: UI component behavior
- **Service Integration**: Cross-layer interactions

### 3. End-to-End Tests
- **User Workflows**: Complete application scenarios

## Security Considerations

### 1. Data Protection
- **Local Storage**: Sensitive data handling
- **Input Validation**: XSS prevention
- **Type Safety**: Runtime error prevention

### 2. Business Logic Protection
- **Domain Validation**: Business rule enforcement
- **State Integrity**: Immutable state management

## Migration Strategy

### Legacy Compatibility
- **LegacyTimerAdapter**: Gradual migration support
- **Backward Compatibility**: Existing API preservation during transition
- **Data Migration**: Automatic legacy data conversion

### Future Enhancements
- **Microservice Architecture**: Potential backend integration
- **Progressive Web App**: Offline capability
- **Advanced Analytics**: Enhanced reporting features

## Development Guidelines

### 1. Layer Responsibilities
- **Domain**: Pure business logic only
- **Application**: Workflow orchestration
- **Infrastructure**: External system integration
- **Presentation**: UI concerns only

### 2. Dependency Rules
- **Dependencies flow inward**: Outer layers depend on inner layers
- **Domain independence**: Domain layer has no external dependencies
- **Interface segregation**: Clear contracts between layers

### 3. Code Organization
- **Feature-based structure**: Group related functionality
- **Barrel exports**: Clean import statements
- **Consistent naming**: Clear, descriptive names

This architecture provides a scalable, maintainable foundation for the Work Timer application while maintaining clear separation of concerns and supporting future growth.