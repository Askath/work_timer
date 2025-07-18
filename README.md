# Work Timer

A Domain-Driven Design (DDD) Angular application for tracking work time with intelligent pause calculation, business rule enforcement, and daily limits. Built with Angular 20.1.0, standalone components, and Angular Signals for reactive state management.

## Features

- **Start/Stop Timer**: Simple controls to track work sessions
- **Intelligent Pause Calculation**: Automatically calculates pause time between work sessions
- **30-Minute Deduction Rule**: Applies 30-minute deduction when total pause time is 0-30 minutes
- **Daily 10-Hour Limit**: Enforces maximum 10-hour work limit per day
- **Real-time Updates**: Live timer display and progress tracking
- **Session Management**: Tracks individual work sessions throughout the day
- **Data Persistence**: Local storage for maintaining state across browser sessions
- **Progress Visualization**: Visual progress bar showing daily limit progress
- **Responsive Design**: Mobile-friendly interface

## Technology Stack

- **Angular 20.1.0**: Modern Angular framework with standalone components
- **TypeScript**: Type-safe development with strict mode
- **Angular Signals**: Reactive state management and change detection
- **Domain-Driven Design**: Clean architecture with layer separation
- **CQRS Pattern**: Command Query Responsibility Segregation
- **Repository Pattern**: Abstract data access layer
- **OnPush Change Detection**: Optimized performance strategy
- **CSS3**: Custom styling with responsive design
- **LocalStorage**: Browser-based data persistence

## Project Structure

```
src/app/
├── application/              # Application layer (use cases, facades)
│   ├── commands/            # Command objects (CQRS)
│   ├── queries/             # Query objects (CQRS)
│   ├── handlers/            # Command/query handlers
│   ├── services/            # Application services
│   └── facades/             # Facade pattern implementations
├── domain/                  # Domain layer (business logic)
│   ├── entities/            # Domain entities (WorkDay, WorkSession)
│   ├── value-objects/       # Value objects (Duration, TimerStatus)
│   ├── services/            # Domain services
│   └── events/              # Domain events
├── infrastructure/          # Infrastructure layer (external concerns)
│   ├── repositories/        # Repository implementations
│   ├── persistence/         # Data persistence services
│   └── adapters/            # External system adapters
├── presentation/            # Presentation layer (UI components)
│   ├── components/          # Dumb/presentation components
│   ├── containers/          # Smart/container components
│   ├── interfaces/          # Component data contracts
│   └── shared/              # Shared UI resources
├── components/              # Legacy components (being migrated)
├── app.component.ts         # Root component
└── main.ts                  # Application bootstrap
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd work_timer
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
# or
ng serve
```

4. Open your browser and navigate to `http://localhost:4200/`

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development setup and guidelines.

## Usage

### Basic Timer Operations

1. **Start Work**: Click "Start Work" to begin timing your work session
2. **Stop Work**: Click "Stop Work" to pause and save your current session
3. **Resume Work**: Click "Resume Work" to continue after a pause
4. **Reset Timer**: Click "Reset" to clear all data for the current day

### Understanding the Dashboard

- **Current Session**: Shows the time for your current work session
- **Total Work Time**: Displays cumulative work time for the day
- **Effective Work Time**: Work time after applying pause deductions
- **Pause Time**: Total time spent on breaks between sessions
- **Pause Deduction**: Amount deducted due to the 30-minute rule
- **Daily Limit Progress**: Visual representation of progress toward 10-hour limit
- **Remaining Time**: Time left until daily limit is reached

### Business Rules

#### Pause Deduction Logic
- If total pause time is **0-30 minutes**: 30 minutes is deducted from total work time
- If total pause time is **over 30 minutes**: No deduction is applied
- Deduction is applied only once per day when the condition is met

#### Daily Limit
- Maximum work time per day is **10 hours**
- Timer automatically stops when limit is reached
- Effective work time (after deductions) is used for limit calculation

For detailed business rules and logic, see [BUSINESS_RULES.md](./BUSINESS_RULES.md).

## Architecture Overview

This application implements Domain-Driven Design (DDD) with clear layer separation:

### Core Layers

#### Domain Layer
Contains pure business logic, entities, and value objects:
- **WorkDay**: Manages daily work sessions and calculations
- **Duration**: Immutable time value object with business methods
- **TimerStatus**: Work timer state management
- **Business Rules**: 30-minute deduction rule, 10-hour daily limit

#### Application Layer  
Orchestrates domain operations using CQRS pattern:
- **Commands**: `StartWorkCommand`, `StopWorkCommand`, `ResetTimerCommand`
- **Queries**: `GetCurrentSessionQuery`, `GetDailyReportQuery`
- **Handlers**: Process commands and queries
- **TimerFacade**: Unified API with reactive signals for UI

#### Infrastructure Layer
Handles external concerns and data persistence:
- **Repositories**: Abstract data access
- **LocalStorageService**: Browser persistence implementation
- **Adapters**: Legacy compatibility during migration

#### Presentation Layer
UI components with clear data flow:
- **Dumb Components**: Pure presentation with inputs/outputs
- **Smart Components**: Inject facades and manage local state
- **OnPush Change Detection**: Optimized performance

### API Documentation

#### TimerFacade (Primary API)

```typescript
// Timer operations
async startWork(): Promise<void>
async stopWork(): Promise<void>
async resetTimer(): Promise<void>

// Reactive state (computed signals)
readonly currentStatus: Signal<TimerStatus>
readonly currentWorkTime: Signal<Duration>
readonly effectiveWorkTime: Signal<Duration>
readonly remainingTime: Signal<Duration>
readonly isWorkComplete: Signal<boolean>
readonly progressPercentage: Signal<number>

// Formatted display values
readonly formattedCurrentTime: Signal<string>
readonly formattedEffectiveTime: Signal<string>
readonly buttonText: Signal<string>
```

### Domain Models

#### Core Value Objects
```typescript
// Duration - Immutable time representation
class Duration {
  static fromMinutes(minutes: number): Duration
  static fromHours(hours: number): Duration
  get milliseconds(): number
  get minutes(): number
  get hours(): number
  add(other: Duration): Duration
  subtract(other: Duration): Duration
  format(): string // "HH:MM:SS"
}

// TimerStatus - Work timer state
class TimerStatus {
  static readonly STOPPED: TimerStatus
  static readonly RUNNING: TimerStatus  
  static readonly PAUSED: TimerStatus
  isRunning(): boolean
  isPaused(): boolean
  isStopped(): boolean
  getDisplayText(): string
}

// WorkDayDate - Date value object
class WorkDayDate {
  static today(): WorkDayDate
  static fromDate(date: Date): WorkDayDate
  equals(other: WorkDayDate): boolean
  toString(): string
}
```

#### Domain Entities
```typescript
// WorkDay - Aggregate root for daily work tracking
class WorkDay {
  readonly date: WorkDayDate
  readonly sessions: WorkSession[]
  readonly status: TimerStatus
  readonly sessionCount: number
  
  startSession(): WorkSession
  stopCurrentSession(): void
  calculateTotalWorkTime(): Duration
  calculateEffectiveWorkTime(): Duration
  isComplete(): boolean
}

// WorkSession - Individual work period
class WorkSession {
  readonly id: string
  readonly startTime: Date
  readonly endTime: Date | null
  readonly duration: Duration
  
  complete(endTime: Date): WorkSession
  isActive(): boolean
}
```

## Development

### Building for Production

```bash
npm run build
# or
ng build --configuration=production
```

### Running Tests

```bash
npm test
# or
ng test
```

### Code Quality

This project follows Domain-Driven Design and Angular best practices:
- **Domain-Driven Design**: Clear separation of business logic
- **CQRS Pattern**: Separate command and query responsibilities  
- **Clean Architecture**: Dependency inversion and layer isolation
- **Angular Signals**: Reactive programming with automatic change detection
- **OnPush Strategy**: Optimized change detection for performance
- **Type Safety**: Strict TypeScript configuration
- **Immutable State**: Predictable state management
- **Repository Pattern**: Abstract data access layer

For detailed development guidelines, see [DEVELOPMENT.md](./DEVELOPMENT.md).

### Browser Compatibility

- Modern browsers supporting ES2020+
- LocalStorage API required for data persistence
- Responsive design for mobile and desktop

### Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Detailed architecture overview and design patterns
- **[BUSINESS_RULES.md](./BUSINESS_RULES.md)**: Complete business logic and rules documentation  
- **[DEVELOPMENT.md](./DEVELOPMENT.md)**: Development setup, guidelines, and best practices
- **[CLAUDE.md](./CLAUDE.md)**: Claude AI development instructions and context

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.