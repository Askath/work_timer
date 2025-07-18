# Work Timer Business Rules

## Overview

This document defines the core business rules and logic governing the Work Timer application. These rules are implemented in the domain layer and enforced throughout the application.

## Core Business Concepts

### Work Session
A continuous period of work activity marked by a start and end time.

**Rules:**
- A work session begins when the timer is started
- A work session ends when the timer is stopped or paused
- Each work session has a unique identifier and timestamp
- Work sessions cannot overlap in time
- Work sessions are immutable once completed

### Pause Period
The time between consecutive work sessions within the same work day.

**Rules:**
- Pause periods are automatically calculated between work sessions
- Pause periods cannot be manually created or modified
- Pause periods are measured from the end of one session to the start of the next
- The first session of the day has no preceding pause period

### Work Day
A single calendar day's collection of work sessions and associated calculations.

**Rules:**
- Work days are bounded by calendar dates (midnight to midnight)
- Each work day maintains independent state and calculations
- Work day state persists across browser sessions
- Work day data is automatically created when the first session begins

## Daily Time Limits

### 10-Hour Daily Limit
The maximum effective work time allowed per calendar day.

**Implementation Rules:**
- Limit is applied to effective work time (after deductions)
- Timer automatically stops when limit is reached
- Cannot start new sessions when limit is met
- Limit resets at midnight (new calendar day)
- Warning notifications appear as limit approaches

**Technical Implementation:**
```typescript
// Domain rule enforcement
if (effectiveWorkTime.hours >= 10) {
  throw new DailyLimitExceededException();
}
```

## Pause Deduction System

### 30-Minute Deduction Rule
The core business rule for calculating effective work time based on pause behavior.

**Rule Definition:**
- **Condition**: Total daily pause time is between 0 minutes and 30 minutes (inclusive)
- **Action**: Deduct exactly 30 minutes from total work time
- **Frequency**: Applied only once per work day
- **Timing**: Applied when work is resumed (not when stopped)

### Implementation Logic
```typescript
// Pseudo-code for deduction calculation
if (totalPauseTime > 0 && totalPauseTime <= 30minutes && !deductionAlreadyApplied) {
  effectiveWorkTime = totalWorkTime - 30minutes;
  markDeductionAsApplied();
}
```

### Deduction Scenarios

#### Scenario 1: Short Breaks (0-30 minutes total pause)
```
Session 1: 2 hours work
Pause: 15 minutes
Session 2: 3 hours work

Result:
- Total Work Time: 5 hours
- Total Pause Time: 15 minutes
- Deduction Applied: 30 minutes
- Effective Work Time: 4.5 hours
```

#### Scenario 2: Long Breaks (over 30 minutes total pause)
```
Session 1: 2 hours work
Pause: 45 minutes
Session 2: 3 hours work

Result:
- Total Work Time: 5 hours
- Total Pause Time: 45 minutes
- Deduction Applied: 0 minutes (rule not triggered)
- Effective Work Time: 5 hours
```

#### Scenario 3: Multiple Short Breaks
```
Session 1: 1 hour work
Pause: 10 minutes
Session 2: 1 hour work
Pause: 15 minutes
Session 3: 1 hour work

Result:
- Total Work Time: 3 hours
- Total Pause Time: 25 minutes (10 + 15)
- Deduction Applied: 30 minutes (rule triggered)
- Effective Work Time: 2.5 hours
```

### Deduction Edge Cases

#### Case 1: Exactly 30 Minutes Pause
- **Total Pause**: Exactly 30 minutes
- **Rule Application**: Deduction IS applied
- **Rationale**: Rule uses <= condition

#### Case 2: Zero Pause Time
- **Total Pause**: 0 minutes (no stops during work)
- **Rule Application**: Deduction is NOT applied
- **Rationale**: Rule requires pause time > 0

#### Case 3: Single Long Pause After Short Pause Day
- **Day 1**: 25 minutes total pause (deduction applied)
- **Day 2**: 45 minutes total pause (no deduction)
- **Result**: Each day calculated independently

## State Transitions

### Timer Status States
The timer can exist in three distinct states:

#### STOPPED
- **Definition**: No active work session, ready to start
- **Valid Transitions**: STOPPED → RUNNING
- **Business Rules**: Can reset timer, can start new session

#### RUNNING
- **Definition**: Active work session in progress
- **Valid Transitions**: RUNNING → PAUSED
- **Business Rules**: Cannot start new session, time actively accumulating

#### PAUSED
- **Definition**: Work session stopped, maintaining session context
- **Valid Transitions**: PAUSED → RUNNING, PAUSED → STOPPED
- **Business Rules**: Can resume session, can end session, pause time accumulating

### Transition Rules

#### Starting Work (STOPPED → RUNNING)
```typescript
// Pre-conditions
- Current status must be STOPPED
- Daily limit must not be exceeded
- Valid timestamp required

// Post-conditions
- New work session created
- Timer status becomes RUNNING
- Session start time recorded
```

#### Stopping Work (RUNNING → PAUSED)
```typescript
// Pre-conditions
- Current status must be RUNNING
- Active session must exist

// Post-conditions
- Current session completed
- Timer status becomes PAUSED
- Pause start time recorded
- Session count incremented
```

#### Resuming Work (PAUSED → RUNNING)
```typescript
// Pre-conditions
- Current status must be PAUSED
- Daily limit must not be exceeded

// Post-conditions
- Pause duration calculated and added to total
- Deduction rule evaluated and applied if applicable
- New work session created
- Timer status becomes RUNNING
```

#### Resetting Timer (ANY → STOPPED)
```typescript
// Pre-conditions
- User confirmation required

// Post-conditions
- All work day data cleared
- Timer status becomes STOPPED
- Deduction tracking reset
- Session count reset to 0
```

## Data Persistence Rules

### Automatic Saving
- **Trigger**: Every state change
- **Storage**: Browser localStorage
- **Format**: JSON serialization with Date handling
- **Scope**: Per work day (date-keyed)

### Data Recovery
- **Startup**: Automatic restoration from localStorage
- **Validation**: Data integrity checks on load
- **Migration**: Automatic legacy data conversion
- **Fallback**: Fresh state if data corrupted

### Data Retention
- **Duration**: Indefinite (localStorage limitations)
- **Cleanup**: Manual reset only
- **Privacy**: Data remains local to browser

## Validation Rules

### Input Validation
- **Timestamps**: Must be valid Date objects
- **Durations**: Must be non-negative
- **Session IDs**: Must be unique
- **Status Values**: Must be valid enum values

### Business Validation
- **Session Overlap**: Prevented at domain level
- **Negative Time**: Impossible due to value object constraints
- **Future Timestamps**: Rejected for work sessions
- **Daily Limit**: Enforced before session creation

### Data Integrity
- **State Consistency**: All calculations must reconcile
- **Immutability**: Completed sessions cannot be modified
- **Audit Trail**: All state changes are traceable

## Error Conditions

### Business Rule Violations
- **DailyLimitExceededException**: Attempt to exceed 10-hour limit
- **InvalidSessionTransitionException**: Invalid status transition
- **SessionOverlapException**: Overlapping session times
- **InvalidWorkDayException**: Invalid work day state

### Data Exceptions
- **CorruptedStateException**: Invalid persisted data
- **SerializationException**: Data conversion failures
- **StorageQuotaException**: localStorage capacity exceeded

### Recovery Strategies
- **Graceful Degradation**: Fall back to safe defaults
- **User Notification**: Clear error messaging
- **State Reset**: Option to clear corrupted data
- **Automatic Recovery**: Attempt data repair where possible

## Reporting and Analytics

### Real-Time Calculations
- **Current Session Time**: Live updating every second
- **Total Work Time**: Sum of all completed sessions plus current
- **Effective Work Time**: Total work time minus applicable deductions
- **Remaining Time**: 10-hour limit minus effective work time
- **Progress Percentage**: (Effective work time / 10 hours) × 100

### Daily Summary
- **Session Count**: Number of work sessions
- **Average Session Length**: Total work time / session count
- **Total Pause Time**: Sum of all pause periods
- **Deduction Status**: Whether 30-minute deduction was applied
- **Completion Status**: Whether daily limit was reached

### Historical Data
- **Daily Trends**: Work patterns over time
- **Session Analysis**: Work session length patterns
- **Productivity Metrics**: Effective work time trends

This business rules documentation ensures consistent implementation and understanding of the Work Timer application's core logic across all development activities.