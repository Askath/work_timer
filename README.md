# Work Timer

A comprehensive Angular application for tracking work time with intelligent pause calculation, deduction rules, and daily limits.

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
- **TypeScript**: Type-safe development
- **Angular Signals**: Reactive state management
- **CSS3**: Custom styling with responsive design
- **LocalStorage**: Data persistence

## Project Structure

```
src/app/
├── components/
│   └── dashboard.component.ts    # Main dashboard UI component
├── models/
│   ├── timer-state.interface.ts  # Timer state interface
│   ├── time-session.interface.ts # Individual session interface
│   └── daily-time-data.interface.ts # Daily aggregated data interface
├── services/
│   ├── time-tracking.service.ts  # Core timer logic service
│   ├── local-storage.service.ts  # Data persistence service
│   └── index.ts                  # Service barrel exports
├── app.ts                        # Root component
├── app.html                      # Root template
└── app.css                       # Root styles
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
ng serve
```

4. Open your browser and navigate to `http://localhost:4200/`

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

## API Documentation

### TimeTrackingService

The core service managing all timer operations:

```typescript
// Start or resume work timer
startWork(): void

// Stop work timer and transition to paused state
stopWork(): void

// Reset timer and clear all data
resetTimer(): void

// Computed signals for reactive data
readonly currentStatus: Signal<TimerStatus>
readonly currentWorkTime: Signal<number>
readonly effectiveWorkTime: Signal<number>
readonly remainingTime: Signal<number>
readonly isWorkComplete: Signal<boolean>
```

### LocalStorageService

Handles data persistence:

```typescript
// Save/retrieve timer state
saveTimerState(state: TimerState): void
getTimerState(): TimerState | null

// Save/retrieve work sessions
saveSession(session: TimeSession): void
getAllSessions(): TimeSession[]

// Save/retrieve daily data
saveDailyData(data: DailyTimeData): void
getDailyData(date: string): DailyTimeData | null
```

### Data Models

#### TimerState
```typescript
interface TimerState {
  status: TimerStatus;
  startTime: Date | null;
  currentSessionStart: Date | null;
  totalWorkTime: number;
  totalPauseTime: number;
  currentSessionTime: number;
  sessionsCount: number;
  lastPauseDeduction: number;
}
```

#### TimeSession
```typescript
interface TimeSession {
  id: string;
  startTime: Date;
  endTime: Date | null;
  duration: number;
  isPause: boolean;
  date: string;
}
```

#### DailyTimeData
```typescript
interface DailyTimeData {
  date: string;
  sessions: TimeSession[];
  totalWorkTime: number;
  totalPauseTime: number;
  pauseDeduction: number;
  effectiveWorkTime: number;
  remainingTime: number;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Development

### Building for Production

```bash
ng build --prod
```

### Running Tests

```bash
ng test
```

### Code Quality

This project follows Angular best practices:
- Single Responsibility Principle
- Reactive programming with Angular Signals
- Comprehensive error handling
- Type safety with TypeScript
- Clean architecture with separation of concerns

### Browser Compatibility

- Modern browsers supporting ES2020+
- LocalStorage API required for data persistence
- Responsive design for mobile and desktop

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.