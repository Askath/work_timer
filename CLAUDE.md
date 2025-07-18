# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm start` or `ng serve` - Start development server (default port 4200)
- `npm run build` - Build for production
- `npm run watch` - Build in watch mode for development
- `npm test` - Run all tests with Karma
- `ng test --browsers=Chrome --watch=false` - Run tests once without watch mode

## Architecture Overview

This is an Angular 20.1.0 work timer application implementing Domain-Driven Design (DDD) architecture with standalone components and Angular Signals for reactive state management. The application demonstrates a complete DDD implementation with complex business logic around time tracking and pause deduction rules.

### Core Business Logic

The application centers around a **30-minute deduction rule**: if total pause time between work sessions is 0-30 minutes, 30 minutes is deducted from the total work time. This deduction is applied only once per day and is implemented through domain policies, entities, and business rules.

### Key Architecture Patterns

**Domain-Driven Design**: Full DDD implementation with four distinct layers:
- **Domain Layer** (`src/app/domain/`): Pure business logic with entities (`WorkDay`, `WorkSession`), value objects (`Duration`, `TimerStatus`), domain services, and policies
- **Application Layer** (`src/app/application/`): CQRS pattern with commands, queries, handlers, and facades
- **Infrastructure Layer** (`src/app/infrastructure/`): Repository implementations, data persistence, and external adapters
- **Presentation Layer** (`src/app/presentation/`): Smart/dumb component separation with reactive signals

**Reactive State Management**: Uses Angular Signals throughout for real-time updates. The `TimerFacade` exposes computed signals that automatically update the UI based on domain state changes.

**CQRS Pattern**: Clear separation between commands (state changes) and queries (data retrieval) with dedicated handlers for each operation.

**Component Architecture**: Smart container components inject facades and manage state, while dumb presentation components handle pure UI concerns.

### Data Flow

1. UI components trigger commands via `TimerFacade` (e.g., `StartWorkCommand`, `StopWorkCommand`)
2. Command handlers orchestrate domain operations and update aggregates (`WorkDay`)
3. Domain changes are persisted through repository abstractions to localStorage
4. State updates trigger reactive signals in the facade, automatically updating the UI
5. Query handlers provide optimized read models for complex UI data requirements

### Critical Implementation Details

- **Pause Deduction Timing**: Applied when resuming work, not when stopping. The logic checks if `totalPauseTime > 0 && totalPauseTime <= 30min && lastPauseDeduction === 0`
- **Live Updates**: Current session time updates every second via `setInterval`, triggering reactive updates throughout the UI
- **Daily Limit**: 10-hour limit is enforced on effective work time (total work time minus deductions)
- **Session Management**: Each start/stop cycle creates a new session with incremented session count

### State Management Structure

The core domain state is managed through DDD aggregates and exposed via reactive signals:

**Domain Aggregates:**
- `WorkDay`: Aggregate root containing work sessions, business rules, and daily state
- `WorkSession`: Individual work periods with start/end times and duration calculations

**Application State (`TimerApplicationState`):**
- `workDay`: Current WorkDay aggregate with all business logic
- `calculations`: Computed metrics (total time, effective time, remaining time)
- `currentSessionTime`: Live session time updated every second via signals

**Facade Signals:**
- Computed signals automatically derive UI data from domain state
- Real-time updates propagate through the reactive signal chain
- UI components consume signals directly for optimal performance

### Testing Considerations

When testing, be aware that:
- The timer uses real-time intervals that need to be mocked
- State persistence relies on localStorage which may need to be mocked
- The pause deduction logic has specific timing requirements that need careful testing
- Date objects are serialized/deserialized for localStorage compatibility
- Domain logic can be tested in isolation without external dependencies
- Command and query handlers should be tested with mocked repositories
- Facade signals should be tested for proper reactive updates

### DDD Architecture Details

For comprehensive understanding of the Domain-Driven Design implementation:
- **[DDD.md](./DDD.md)**: Complete DDD guide with practical examples from this codebase
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Detailed architecture overview and design patterns
- **[docs/adr/0001-domain-driven-design-architecture.md](./docs/adr/0001-domain-driven-design-architecture.md)**: Architectural decision record for DDD adoption