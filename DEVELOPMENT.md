# Work Timer Development Guide

## Development Environment Setup

### Prerequisites
- **Node.js**: Version 18+ (LTS recommended)
- **npm**: Version 9+ (included with Node.js)
- **Angular CLI**: Version 18+ (`npm install -g @angular/cli`)
- **Git**: For version control
- **VS Code**: Recommended IDE with Angular extensions

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd work_timer

# Install dependencies
npm install

# Start development server
npm start
# or
ng serve

# Open browser to http://localhost:4200
```

### Available Commands

#### Development Commands
```bash
npm start           # Start development server (port 4200)
ng serve           # Alternative start command
npm run watch      # Build in watch mode for development
```

#### Build Commands
```bash
npm run build                     # Production build
ng build                         # Default build
ng build --configuration=production  # Explicit production build
ng build --configuration=development # Development build
```

#### Testing Commands
```bash
npm test                         # Run all tests with Karma
ng test                         # Alternative test command
ng test --browsers=Chrome --watch=false  # Run tests once without watch
```

#### Code Quality Commands
```bash
ng lint             # Run ESLint (if configured)
npm run format      # Format code (if configured)
```

## Project Structure

### Directory Organization
```
work_timer/
├── src/app/
│   ├── application/          # Application layer (CQRS, facades)
│   │   ├── commands/         # Command objects
│   │   ├── queries/          # Query objects
│   │   ├── handlers/         # Command/query handlers
│   │   ├── services/         # Application services
│   │   └── facades/          # Facade pattern implementations
│   ├── domain/               # Domain layer (business logic)
│   │   ├── entities/         # Domain entities
│   │   ├── value-objects/    # Value objects
│   │   ├── services/         # Domain services
│   │   └── events/           # Domain events
│   ├── infrastructure/       # Infrastructure layer (external concerns)
│   │   ├── repositories/     # Repository implementations
│   │   ├── persistence/      # Data persistence
│   │   └── adapters/         # External system adapters
│   ├── presentation/         # Presentation layer (UI)
│   │   ├── components/       # Dumb components
│   │   ├── containers/       # Smart components
│   │   ├── interfaces/       # Component data contracts
│   │   └── shared/           # Shared UI resources
│   ├── components/           # Legacy components (being migrated)
│   ├── app.component.ts      # Root component
│   └── main.ts              # Application bootstrap
├── public/                   # Static assets
├── docs/                    # Documentation
├── CLAUDE.md                # Claude AI development instructions
├── ARCHITECTURE.md          # Architecture documentation
├── BUSINESS_RULES.md        # Business logic documentation
└── README.md               # Project overview
```

## Development Workflow

### 1. Feature Development Process

#### Creating a New Feature
```bash
# Create feature branch
git checkout -b feature/feature-name

# Implement following DDD layers (inside-out):
# 1. Domain layer (business logic)
# 2. Application layer (use cases)
# 3. Infrastructure layer (persistence)
# 4. Presentation layer (UI)

# Test the feature
npm test

# Build to ensure no errors
npm run build

# Commit changes
git add .
git commit -m "feat: implement feature-name"
```

#### Code Review Checklist
- [ ] Domain logic is pure and testable
- [ ] Application services orchestrate correctly
- [ ] UI components use OnPush change detection
- [ ] Angular Signals are used for reactive state
- [ ] Business rules are properly enforced
- [ ] Error handling is implemented
- [ ] Tests cover critical paths
- [ ] Documentation is updated

### 2. Domain-Driven Design Guidelines

#### Domain Layer Development
```typescript
// Value Objects - Immutable, behavior-rich
export class Duration {
  constructor(private readonly _milliseconds: number) {
    if (_milliseconds < 0) {
      throw new Error('Duration cannot be negative');
    }
  }
  
  get milliseconds(): number { return this._milliseconds; }
  
  add(other: Duration): Duration {
    return new Duration(this._milliseconds + other._milliseconds);
  }
  
  format(): string {
    // Formatting logic
  }
}

// Entities - Objects with identity
export class WorkDay {
  constructor(
    private readonly _date: WorkDayDate,
    private _sessions: WorkSession[],
    private _status: TimerStatus
  ) {}
  
  startSession(): WorkSession {
    // Business logic for starting work
  }
  
  calculateEffectiveTime(): Duration {
    // Business logic for time calculations
  }
}
```

#### Application Layer Development
```typescript
// Command handlers
@Injectable()
export class StartWorkHandler {
  constructor(private timerService: TimerService) {}
  
  async handle(command: StartWorkCommand): Promise<void> {
    // Orchestrate domain operations
    const workDay = this.timerService.getCurrentWorkDay();
    workDay.startSession();
    await this.timerService.save(workDay);
  }
}

// Application services
@Injectable()
export class TimerApplicationService {
  private readonly _state = signal<TimerApplicationState | null>(null);
  
  getCurrentState(): TimerApplicationState | null {
    return this._state();
  }
  
  updateState(newState: TimerApplicationState): void {
    this._state.set(newState);
  }
}
```

#### Presentation Layer Development
```typescript
// Dumb components
@Component({
  selector: 'app-timer-controls',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimerControlsComponent {
  readonly data = input.required<TimerControlsData>();
  readonly startStopClicked = output<void>();
  readonly resetClicked = output<void>();
}

// Smart components/containers
@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  readonly timerFacade = inject(TimerFacade);
  
  toggleTimer(): void {
    if (this.timerFacade.currentStatus().isRunning()) {
      this.timerFacade.stopWork();
    } else {
      this.timerFacade.startWork();
    }
  }
}
```

### 3. Angular Signals Best Practices

#### Signal Usage Patterns
```typescript
// Create signals for mutable state
private readonly _state = signal<State>(initialState);

// Use computed for derived state
readonly derivedValue = computed(() => {
  const state = this._state();
  return state ? calculateDerived(state) : null;
});

// Use effect for side effects
constructor() {
  effect(() => {
    const state = this._state();
    if (state) {
      this.persistState(state);
    }
  });
}
```

#### Avoiding Common Pitfalls
```typescript
// ❌ Don't mutate signal values
this._state().property = newValue;

// ✅ Do create new state objects
this._state.set({ ...this._state(), property: newValue });

// ❌ Don't call signals in non-reactive contexts
const value = this.mySignal(); // In constructor or lifecycle hooks

// ✅ Do use signals in computed or templates
readonly computedValue = computed(() => this.mySignal());
```

### 4. Testing Strategy

#### Unit Testing
```typescript
describe('Duration', () => {
  it('should add durations correctly', () => {
    const duration1 = Duration.fromMinutes(30);
    const duration2 = Duration.fromMinutes(15);
    
    const result = duration1.add(duration2);
    
    expect(result.minutes).toBe(45);
  });
  
  it('should throw error for negative values', () => {
    expect(() => Duration.fromMilliseconds(-1))
      .toThrow('Duration cannot be negative');
  });
});
```

#### Component Testing
```typescript
describe('TimerControlsComponent', () => {
  it('should emit startStopClicked when button clicked', () => {
    const component = createComponent(TimerControlsComponent, {
      componentInputs: {
        data: { buttonText: 'Start', disabled: false }
      }
    });
    
    let clicked = false;
    component.componentInstance.startStopClicked.subscribe(() => clicked = true);
    
    const button = component.fixture.debugElement.query(By.css('.start-stop-btn'));
    button.nativeElement.click();
    
    expect(clicked).toBe(true);
  });
});
```

#### Integration Testing
```typescript
describe('Timer Integration', () => {
  it('should calculate pause deduction correctly', async () => {
    const timerFacade = TestBed.inject(TimerFacade);
    
    // Start work
    await timerFacade.startWork();
    
    // Simulate 1 hour of work
    jasmine.clock().tick(3600000);
    
    // Stop work
    await timerFacade.stopWork();
    
    // Simulate 15 minute pause
    jasmine.clock().tick(900000);
    
    // Resume work
    await timerFacade.startWork();
    
    // Verify deduction applied
    expect(timerFacade.pauseDeduction().minutes).toBe(30);
  });
});
```

## Code Style Guidelines

### 1. TypeScript Best Practices

#### Type Safety
```typescript
// ✅ Use strict types
interface TimerData {
  readonly currentTime: Duration;
  readonly status: TimerStatus;
}

// ✅ Use readonly for immutable data
class WorkSession {
  constructor(
    private readonly _id: string,
    private readonly _startTime: Date
  ) {}
}

// ✅ Use union types for constrained values
type TimerStatusValue = 'STOPPED' | 'RUNNING' | 'PAUSED';
```

#### Naming Conventions
```typescript
// Classes: PascalCase
class TimerApplicationService {}

// Methods and variables: camelCase
getCurrentSession(): WorkSession {}

// Constants: UPPER_SNAKE_CASE
const MAX_WORK_HOURS = 10;

// Interfaces: PascalCase with descriptive names
interface TimerControlsData {}

// Private fields: underscore prefix
private readonly _state = signal<State>(null);
```

### 2. Angular Best Practices

#### Component Design
```typescript
// ✅ Use OnPush change detection
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})

// ✅ Use input/output for component communication
readonly data = input.required<ComponentData>();
readonly actionClicked = output<void>();

// ✅ Use inject() for dependency injection
readonly service = inject(MyService);
```

#### Template Guidelines
```html
<!-- ✅ Use trackBy for ngFor -->
<div *ngFor="let item of items; trackBy: trackByFn">

<!-- ✅ Use async pipe for observables (when not using signals) -->
<div>{{ data$ | async }}</div>

<!-- ✅ Use signals directly in templates -->
<div>{{ mySignal() }}</div>

<!-- ✅ Use OnPush-friendly event handling -->
<button (click)="handleClick()">Click me</button>
```

## Debugging and Troubleshooting

### Common Issues

#### 1. Signal Updates Not Reflecting in UI
```typescript
// Problem: Mutating signal values
this._state().property = newValue;

// Solution: Create new state objects
this._state.set({ ...this._state(), property: newValue });
```

#### 2. Memory Leaks with Intervals
```typescript
// Problem: Not cleaning up intervals
setInterval(() => {}, 1000);

// Solution: Proper cleanup
private timerInterval: number | null = null;

ngOnInit() {
  this.timerInterval = setInterval(() => {}, 1000);
}

ngOnDestroy() {
  if (this.timerInterval) {
    clearInterval(this.timerInterval);
  }
}
```

#### 3. localStorage Serialization Issues
```typescript
// Problem: Date objects not serializing correctly
JSON.stringify(new Date());

// Solution: Custom serialization
JSON.stringify(date, (key, value) => {
  if (value instanceof Date) {
    return { _isDate: true, value: value.toISOString() };
  }
  return value;
});
```

### Debugging Tools

#### Angular DevTools
```bash
# Install Angular DevTools browser extension
# Use for component tree inspection and signal debugging
```

#### Debug Logging
```typescript
// Development logging
if (!environment.production) {
  console.log('Debug info:', data);
}

// Use structured logging
private log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  console[level](`[${this.constructor.name}] ${message}`, data);
}
```

## Performance Optimization

### 1. Bundle Size Optimization
- Use OnPush change detection
- Implement lazy loading for large features
- Optimize images and assets
- Use Angular's built-in optimization

### 2. Runtime Performance
- Minimize computed signal dependencies
- Use trackBy functions for lists
- Avoid expensive operations in templates
- Implement proper caching strategies

### 3. Memory Management
- Clean up subscriptions and intervals
- Use immutable state patterns
- Avoid circular references
- Monitor memory usage in development

## Deployment

### Build for Production
```bash
npm run build
# Outputs to dist/work_timer/
```

### Environment Configuration
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  debugMode: true
};

// src/environments/environment.prod.ts
export const environment = {
  production: true,
  debugMode: false
};
```

This development guide provides the foundation for maintaining and extending the Work Timer application while adhering to established architectural patterns and best practices.