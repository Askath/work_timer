# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm start` or `ng serve` - Start development server (default port 4200)
- `npm run build` - Build for production
- `npm run watch` - Build in watch mode for development
- `npm test` - Run all tests with Karma
- `ng test --browsers=Chrome --watch=false` - Run tests once without watch mode

## Architecture Overview

This is an Angular 20.1.0 work timer application using standalone components and Angular Signals for reactive state management. The application implements complex business logic around time tracking with pause deduction rules.

### Core Business Logic

The application centers around a **30-minute deduction rule**: if total pause time between work sessions is 0-30 minutes, 30 minutes is deducted from the total work time. This deduction is applied only once per day and is tracked via `lastPauseDeduction` in the timer state.

### Key Architecture Patterns

**Reactive State Management**: Uses Angular Signals throughout for real-time updates. The `TimeTrackingService` contains the core state signal and computed signals that automatically update the UI.

**Service Layer**: Two main services handle all business logic:
- `TimeTrackingService`: Core timer logic, pause calculations, and 10-hour daily limit enforcement
- `LocalStorageService`: Data persistence with Date serialization/deserialization

**Component Architecture**: Single main component (`DashboardComponent`) that injects the service and displays real-time data using computed signals.

### Data Flow

1. Timer state is managed in `TimeTrackingService` using Angular signals
2. All UI updates are driven by computed signals that automatically recalculate when base state changes
3. State changes trigger automatic localStorage saves via Angular effects
4. On app startup, state is restored from localStorage and timer resumes if it was running

### Critical Implementation Details

- **Pause Deduction Timing**: Applied when resuming work, not when stopping. The logic checks if `totalPauseTime > 0 && totalPauseTime <= 30min && lastPauseDeduction === 0`
- **Live Updates**: Current session time updates every second via `setInterval`, triggering reactive updates throughout the UI
- **Daily Limit**: 10-hour limit is enforced on effective work time (total work time minus deductions)
- **Session Management**: Each start/stop cycle creates a new session with incremented session count

### State Management Structure

The core state (`TimerState`) includes:
- `status`: Current timer state (STOPPED, RUNNING, PAUSED)
- `totalWorkTime`: Cumulative work time for the day
- `totalPauseTime`: Cumulative pause time between sessions
- `lastPauseDeduction`: Tracks if 30-minute deduction was already applied
- `currentSessionTime`: Live session time updated every second

### Testing Considerations

When testing, be aware that:
- The timer uses real-time intervals that need to be mocked
- State persistence relies on localStorage which may need to be mocked
- The pause deduction logic has specific timing requirements that need careful testing
- Date objects are serialized/deserialized for localStorage compatibility