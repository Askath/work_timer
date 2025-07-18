# Domain-Driven Design Refactoring Plan

## Task Overview

**Original Request**: Analyze the Angular work timer application architecture and refactor it using Domain-Driven Design principles to improve scalability, maintainability, and testability.

**Problem**: The application had a monolithic architecture with:
- Single 398-line `TimeTrackingService` containing all business logic
- Anemic domain models (just data containers)
- Single UI component handling all functionality
- Infrastructure concerns mixed with domain logic
- Limited testing coverage

## What Has Been Completed ✅

### Phase 1: Domain Modeling & Bounded Contexts
- ✅ **Value Objects Created**:
  - `Duration` - Immutable time calculations with rich behavior
  - `TimerStatus` - Enhanced timer states with transition logic
  - `WorkDayDate` - Date handling with domain-specific operations

- ✅ **Domain Entities Created**:
  - `WorkSession` - Single work period with business rules
  - `WorkDay` - Aggregate root managing daily work sessions

- ✅ **Domain Services Created**:
  - `TimeCalculationService` - Complex time calculations and business rules
  - `PauseDeductionPolicy` - 30-minute pause deduction rule implementation

- ✅ **Domain Events Created**:
  - `WorkSessionStartedEvent`
  - `WorkSessionStoppedEvent` 
  - `PauseDeductionAppliedEvent`
  - `DailyLimitReachedEvent`

### Phase 2: Application Layer Restructure
- ✅ **Application Services Created**:
  - `TimerApplicationService` - Main timer orchestration
  - `WorkSessionApplicationService` - Session management
  - `ReportingApplicationService` - Data queries and analytics

- ✅ **CQRS Implementation**:
  - Commands: `StartWorkCommand`, `StopWorkCommand`, `ResetTimerCommand`
  - Queries: `GetCurrentSessionQuery`, `GetDailyReportQuery`, `GetWorkHistoryQuery`
  - Handlers for all commands and queries

- ✅ **Application Facade**:
  - `TimerFacade` - Unified interface with Angular Signals for reactive UI

## Remaining Work Plan 📋

### Phase 3: Infrastructure Layer (2-3 days)

#### Step 3.1: Create Repository Interfaces
```bash
# Create domain repository interfaces
src/app/domain/repositories/
├── work-session.repository.ts
├── work-day.repository.ts
└── timer-state.repository.ts
```

#### Step 3.2: Implement Repository Adapters
```bash
# Create infrastructure implementations
src/app/infrastructure/
├── repositories/
│   ├── local-storage-work-session.repository.ts
│   ├── local-storage-work-day.repository.ts
│   └── local-storage-timer-state.repository.ts
├── adapters/
│   ├── timer.adapter.ts
│   └── date-time.adapter.ts
└── config/
    ├── business-rules.config.ts
    └── timer.config.ts
```

#### Step 3.3: Update Application Configuration
- Register new dependencies in `app.config.ts`
- Create dependency injection configuration
- Setup repository implementations

### Phase 4: Migration & Integration (2-3 days)

#### Step 4.1: Create Migration Bridge
```typescript
// Create adapter to gradually migrate from old service
src/app/infrastructure/adapters/legacy-timer.adapter.ts
```

#### Step 4.2: Update Existing TimeTrackingService
- Delegate calls to new `TimerFacade`
- Maintain backward compatibility
- Gradual method-by-method migration

#### Step 4.3: Update DashboardComponent
- Inject `TimerFacade` instead of `TimeTrackingService`
- Update template bindings to use new computed signals
- Test functionality preservation

### Phase 5: UI Component Decomposition (2-3 days)

#### Step 5.1: Create Feature Components
```bash
src/app/presentation/components/
├── timer-controls/
│   ├── timer-controls.component.ts
│   ├── timer-controls.component.html
│   └── timer-controls.component.css
├── current-session/
│   ├── current-session.component.ts
│   ├── current-session.component.html
│   └── current-session.component.css
├── daily-summary/
│   ├── daily-summary.component.ts
│   ├── daily-summary.component.html
│   └── daily-summary.component.css
└── progress-bar/
    ├── progress-bar.component.ts
    ├── progress-bar.component.html
    └── progress-bar.component.css
```

#### Step 5.2: Create Container Component
```bash
src/app/presentation/containers/dashboard/
├── dashboard.container.ts
├── dashboard.container.html
└── dashboard.container.css
```

#### Step 5.3: Implement Smart/Dumb Pattern
- Container components handle business logic
- Presentation components receive data via `@Input()`
- Events flow up via `@Output()`

### Phase 6: Testing Implementation (2-3 days)

#### Step 6.1: Domain Layer Tests
```bash
src/app/domain/
├── entities/*.spec.ts
├── value-objects/*.spec.ts
├── services/*.spec.ts
└── policies/*.spec.ts
```

#### Step 6.2: Application Layer Tests
```bash
src/app/application/
├── services/*.spec.ts
├── handlers/*.spec.ts
└── facades/*.spec.ts
```

#### Step 6.3: Integration Tests
```bash
src/app/infrastructure/
└── repositories/*.spec.ts

src/app/presentation/
├── components/**/*.spec.ts
└── containers/**/*.spec.ts
```

### Phase 7: Performance & Cleanup (1-2 days)

#### Step 7.1: Remove Legacy Code
- Delete old `TimeTrackingService` after migration
- Remove unused model interfaces
- Update all imports throughout application

#### Step 7.2: Performance Optimization
- Implement `OnPush` change detection strategy
- Add lazy loading for feature modules
- Optimize bundle size and memory usage

#### Step 7.3: Documentation
- Update `README.md` with new architecture
- Create architectural decision records (ADRs)
- Document domain concepts and business rules

## Expected Timeline

| Phase | Duration | Status |
|-------|----------|---------|
| Phase 1: Domain Layer | 2 days | ✅ **COMPLETED** |
| Phase 2: Application Layer | 2 days | ✅ **COMPLETED** |
| Phase 3: Infrastructure Layer | 2-3 days | 🔄 **NEXT** |
| Phase 4: Migration | 2-3 days | ⏳ **PENDING** |
| Phase 5: UI Decomposition | 2-3 days | ⏳ **PENDING** |
| Phase 6: Testing | 2-3 days | ⏳ **PENDING** |
| Phase 7: Cleanup | 1-2 days | ⏳ **PENDING** |

**Total Estimated Time**: 13-18 days  
**Completed**: 4 days  
**Remaining**: 9-14 days

## Success Metrics

### Completed ✅
- [x] Rich domain model with encapsulated business logic
- [x] Clear separation of concerns across layers
- [x] CQRS pattern implementation
- [x] Reactive state management with Angular Signals
- [x] Event-driven architecture foundation
- [x] Type-safe interfaces throughout
- [x] Successful build with no compilation errors

### Pending 📋
- [ ] Repository pattern for data persistence
- [ ] Complete migration from monolithic service
- [ ] Component decomposition for better reusability
- [ ] Comprehensive test coverage (>80%)
- [ ] Performance optimization
- [ ] Documentation and architectural guidelines

## Benefits Achieved So Far

1. **Scalability**: Clear domain boundaries allow independent scaling
2. **Maintainability**: Business logic concentrated in domain layer
3. **Testability**: Each layer can be tested independently
4. **Flexibility**: Easy to add new features or change business rules
5. **Type Safety**: Comprehensive TypeScript coverage
6. **Reactive UI**: Real-time updates with Angular Signals

## Detailed Implementation Steps for Remaining Work

### Phase 3: Infrastructure Layer - Detailed Steps

#### Step 3.1.1: Create Domain Repository Interfaces
```bash
# Create directory
mkdir -p src/app/domain/repositories

# Create files:
touch src/app/domain/repositories/work-session.repository.ts
touch src/app/domain/repositories/work-day.repository.ts
touch src/app/domain/repositories/timer-state.repository.ts
```

**Files to create:**
1. `src/app/domain/repositories/work-session.repository.ts` - Interface for session persistence
2. `src/app/domain/repositories/work-day.repository.ts` - Interface for work day aggregate persistence
3. `src/app/domain/repositories/timer-state.repository.ts` - Interface for timer state persistence

#### Step 3.1.2: Create Infrastructure Directory Structure
```bash
mkdir -p src/app/infrastructure/{repositories,adapters,config}
```

#### Step 3.1.3: Implement LocalStorage Repositories
**Files to create:**
1. `src/app/infrastructure/repositories/local-storage-work-session.repository.ts`
2. `src/app/infrastructure/repositories/local-storage-work-day.repository.ts` 
3. `src/app/infrastructure/repositories/local-storage-timer-state.repository.ts`

#### Step 3.1.4: Create Infrastructure Adapters
**Files to create:**
1. `src/app/infrastructure/adapters/timer.adapter.ts` - System time abstraction
2. `src/app/infrastructure/adapters/date-time.adapter.ts` - Date/time utilities
3. `src/app/infrastructure/adapters/local-storage.adapter.ts` - Storage abstraction

#### Step 3.1.5: Create Configuration Files
**Files to create:**
1. `src/app/infrastructure/config/business-rules.config.ts` - Business rule constants
2. `src/app/infrastructure/config/timer.config.ts` - Timer settings
3. `src/app/infrastructure/config/infrastructure.config.ts` - Infrastructure settings

#### Step 3.1.6: Update Application Configuration
**Files to modify:**
1. `src/app/app.config.ts` - Register new providers
2. Create `src/app/infrastructure/index.ts` - Infrastructure exports

### Phase 4: Migration & Integration - Detailed Steps

#### Step 4.1.1: Create Migration Bridge Service
**Files to create:**
1. `src/app/infrastructure/adapters/legacy-timer.adapter.ts` - Bridge between old and new
2. `src/app/application/services/migration.service.ts` - Data migration utilities

#### Step 4.1.2: Update TimerFacade with Persistence
**Files to modify:**
1. `src/app/application/facades/timer.facade.ts` - Add repository injection
2. Add persistence methods to facade
3. Update state management to use repositories

#### Step 4.1.3: Gradual Service Migration
**Files to modify:**
1. `src/app/services/time-tracking.service.ts` - Replace methods one by one with facade calls
2. Keep interface unchanged for backward compatibility
3. Add deprecation warnings to old methods

#### Step 4.1.4: Update Component Integration
**Files to modify:**
1. `src/app/components/dashboard.component.ts` - Inject TimerFacade
2. Update all method calls to use facade
3. Update template bindings to use computed signals

#### Step 4.1.5: Data Migration Script
**Files to create:**
1. `src/app/infrastructure/migration/data-migrator.ts` - Migrate existing localStorage data
2. `src/app/infrastructure/migration/schema-validator.ts` - Validate data integrity

### Phase 5: UI Component Decomposition - Detailed Steps

#### Step 5.1.1: Create Component Structure
```bash
mkdir -p src/app/presentation/{components,containers}
mkdir -p src/app/presentation/components/{timer-controls,current-session,daily-summary,progress-bar}
mkdir -p src/app/presentation/containers/dashboard
```

#### Step 5.1.2: Create Timer Controls Component
**Files to create:**
1. `src/app/presentation/components/timer-controls/timer-controls.component.ts`
2. `src/app/presentation/components/timer-controls/timer-controls.component.html`
3. `src/app/presentation/components/timer-controls/timer-controls.component.css`
4. `src/app/presentation/components/timer-controls/timer-controls.component.spec.ts`

#### Step 5.1.3: Create Current Session Component
**Files to create:**
1. `src/app/presentation/components/current-session/current-session.component.ts`
2. `src/app/presentation/components/current-session/current-session.component.html`
3. `src/app/presentation/components/current-session/current-session.component.css`
4. `src/app/presentation/components/current-session/current-session.component.spec.ts`

#### Step 5.1.4: Create Daily Summary Component
**Files to create:**
1. `src/app/presentation/components/daily-summary/daily-summary.component.ts`
2. `src/app/presentation/components/daily-summary/daily-summary.component.html`
3. `src/app/presentation/components/daily-summary/daily-summary.component.css`
4. `src/app/presentation/components/daily-summary/daily-summary.component.spec.ts`

#### Step 5.1.5: Create Progress Bar Component
**Files to create:**
1. `src/app/presentation/components/progress-bar/progress-bar.component.ts`
2. `src/app/presentation/components/progress-bar/progress-bar.component.html`
3. `src/app/presentation/components/progress-bar/progress-bar.component.css`
4. `src/app/presentation/components/progress-bar/progress-bar.component.spec.ts`

#### Step 5.1.6: Create Dashboard Container
**Files to create:**
1. `src/app/presentation/containers/dashboard/dashboard.container.ts`
2. `src/app/presentation/containers/dashboard/dashboard.container.html`
3. `src/app/presentation/containers/dashboard/dashboard.container.css`
4. `src/app/presentation/containers/dashboard/dashboard.container.spec.ts`

#### Step 5.1.7: Update App Component
**Files to modify:**
1. `src/app/app.ts` - Use new dashboard container
2. `src/app/app.html` - Update component reference
3. Remove old dashboard component imports

### Phase 6: Testing Implementation - Detailed Steps

#### Step 6.1.1: Domain Layer Tests
**Files to create:**
1. `src/app/domain/value-objects/duration.spec.ts`
2. `src/app/domain/value-objects/timer-status.spec.ts`
3. `src/app/domain/value-objects/work-day-date.spec.ts`
4. `src/app/domain/entities/work-session.spec.ts`
5. `src/app/domain/entities/work-day.spec.ts`
6. `src/app/domain/services/time-calculation.service.spec.ts`
7. `src/app/domain/policies/pause-deduction-policy.spec.ts`

#### Step 6.1.2: Application Layer Tests
**Files to create:**
1. `src/app/application/services/timer-application.service.spec.ts`
2. `src/app/application/services/work-session-application.service.spec.ts`
3. `src/app/application/services/reporting-application.service.spec.ts`
4. `src/app/application/handlers/start-work.handler.spec.ts`
5. `src/app/application/handlers/stop-work.handler.spec.ts`
6. `src/app/application/handlers/reset-timer.handler.spec.ts`
7. `src/app/application/facades/timer.facade.spec.ts`

#### Step 6.1.3: Infrastructure Layer Tests
**Files to create:**
1. `src/app/infrastructure/repositories/local-storage-work-session.repository.spec.ts`
2. `src/app/infrastructure/repositories/local-storage-work-day.repository.spec.ts`
3. `src/app/infrastructure/adapters/timer.adapter.spec.ts`
4. `src/app/infrastructure/adapters/local-storage.adapter.spec.ts`

#### Step 6.1.4: Component Tests
**Files to create:**
1. Update all component `.spec.ts` files created in Phase 5
2. `src/app/presentation/containers/dashboard/dashboard.container.spec.ts`
3. Integration tests for component communication

#### Step 6.1.5: E2E Tests
**Files to create:**
1. `e2e/timer-workflow.e2e.ts` - Complete timer workflow tests
2. `e2e/business-rules.e2e.ts` - Pause deduction and daily limit tests
3. `e2e/persistence.e2e.ts` - Data persistence tests

### Phase 7: Performance & Cleanup - Detailed Steps

#### Step 7.1.1: Remove Legacy Code
**Files to delete:**
1. `src/app/services/time-tracking.service.ts` (after migration complete)
2. Old model interfaces that have been replaced
3. Unused utility functions

**Files to modify:**
1. Update all imports throughout the application
2. Remove deprecated methods and warnings

#### Step 7.1.2: Performance Optimization
**Files to modify:**
1. Add `OnPush` change detection to all components
2. Implement `trackBy` functions for `*ngFor` loops
3. Add lazy loading configuration
4. Optimize bundle size with tree shaking

#### Step 7.1.3: Documentation Updates
**Files to create/modify:**
1. `ARCHITECTURE.md` - Document new architecture
2. `BUSINESS_RULES.md` - Document domain rules
3. `DEVELOPMENT.md` - Development guidelines
4. Update `README.md` with new architecture info
5. Create architectural decision records (ADRs)

## Quick Start Commands for Next Session

```bash
# Phase 3 - Start with repository interfaces
mkdir -p src/app/domain/repositories
cd src/app/domain/repositories

# Create repository interface files
cat > work-session.repository.ts << 'EOF'
/**
 * @fileoverview Work session repository interface.
 * @author Work Timer Application
 */

import { WorkSession, WorkDayDate } from '../index';

export interface WorkSessionRepository {
  save(session: WorkSession): Promise<void>;
  findById(id: string): Promise<WorkSession | null>;
  findByDate(date: WorkDayDate): Promise<WorkSession[]>;
  findAll(): Promise<WorkSession[]>;
  delete(id: string): Promise<void>;
  deleteByDate(date: WorkDayDate): Promise<void>;
}
EOF

# Then continue with next repository interfaces...
```

## File Creation Checklist

### Phase 3 - Infrastructure (13 files)
- [ ] `src/app/domain/repositories/work-session.repository.ts`
- [ ] `src/app/domain/repositories/work-day.repository.ts`
- [ ] `src/app/domain/repositories/timer-state.repository.ts`
- [ ] `src/app/infrastructure/repositories/local-storage-work-session.repository.ts`
- [ ] `src/app/infrastructure/repositories/local-storage-work-day.repository.ts`
- [ ] `src/app/infrastructure/repositories/local-storage-timer-state.repository.ts`
- [ ] `src/app/infrastructure/adapters/timer.adapter.ts`
- [ ] `src/app/infrastructure/adapters/date-time.adapter.ts`
- [ ] `src/app/infrastructure/adapters/local-storage.adapter.ts`
- [ ] `src/app/infrastructure/config/business-rules.config.ts`
- [ ] `src/app/infrastructure/config/timer.config.ts`
- [ ] `src/app/infrastructure/config/infrastructure.config.ts`
- [ ] `src/app/infrastructure/index.ts`

### Phase 4 - Migration (5 files)
- [ ] `src/app/infrastructure/adapters/legacy-timer.adapter.ts`
- [ ] `src/app/application/services/migration.service.ts`
- [ ] `src/app/infrastructure/migration/data-migrator.ts`
- [ ] `src/app/infrastructure/migration/schema-validator.ts`
- [ ] Modify: `src/app/components/dashboard.component.ts`

### Phase 5 - UI Components (20 files)
- [ ] Timer Controls Component (4 files)
- [ ] Current Session Component (4 files)
- [ ] Daily Summary Component (4 files)
- [ ] Progress Bar Component (4 files)
- [ ] Dashboard Container (4 files)

### Phase 6 - Testing (20+ files)
- [ ] Domain tests (7 files)
- [ ] Application tests (7 files)
- [ ] Infrastructure tests (4 files)
- [ ] Component tests (from Phase 5)
- [ ] E2E tests (3 files)

### Phase 7 - Cleanup & Documentation (5 files)
- [ ] `ARCHITECTURE.md`
- [ ] `BUSINESS_RULES.md`
- [ ] `DEVELOPMENT.md`
- [ ] Update `README.md`
- [ ] Create ADR documents

**Total remaining files to create/modify: ~63 files**