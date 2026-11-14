# Veliaht OS — Engineering Guide

**Document type:** Engineering Handbook  
**Status:** Authoritative — all contributors must read this before writing code  
**Scope:** Frontend prototype through v0.9 cloud backend  
**Audience:** Every engineer who touches this codebase

---

## Table of Contents

1. [Folder Structure](#1-folder-structure)
2. [Coding Standards](#2-coding-standards)
3. [Naming Conventions](#3-naming-conventions)
4. [File Organization Rules](#4-file-organization-rules)
5. [Sprint Workflow](#5-sprint-workflow)
6. [Git Workflow](#6-git-workflow)
7. [Code Review Checklist](#7-code-review-checklist)
8. [UI Consistency Rules](#8-ui-consistency-rules)
9. [Definition of Done](#9-definition-of-done)
10. [Regression Checklist](#10-regression-checklist)
11. [Rules for Adding New Modules](#11-rules-for-adding-new-modules)
12. [Rules for Modifying Existing Modules](#12-rules-for-modifying-existing-modules)
13. [Rules for Preserving Backward Compatibility](#13-rules-for-preserving-backward-compatibility)
14. [Performance Guidelines](#14-performance-guidelines)
15. [Documentation Requirements](#15-documentation-requirements)

---

## 1. Folder Structure

### Current Structure (v0.1–v0.8 prototype phase)

```
project-root/
│
├── index.html                  # App shell — HTML structure only, no logic
├── styles.css                  # All styles — single source of truth for UI
├── app.js                      # Shell renderer and main navigation dispatcher
│
├── js/
│   ├── state.js                # Application state object and seed data
│   ├── storage.js              # localStorage persistence layer
│   ├── auth.js                 # Authentication: login, logout, current user
│   ├── i18n.js                 # Translation strings and t() / tf() functions
│   ├── helpers.js              # Pure utility functions shared across modules
│   ├── modal.js                # Modal open/close infrastructure
│   │
│   └── render/                 # One file per product module
│       ├── dashboard.js        # Dashboard renders (patron/mudur/calisan)
│       ├── departments.js      # Organization → Departments
│       ├── employees.js        # Organization → Employees
│       ├── roleCards.js        # Governance → Role Profiles
│       ├── meetings.js         # Meetings module
│       └── settings.js         # Administration → Settings
│
├── docs/
│   ├── MODULE_ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   ├── PRODUCT_BLUEPRINT_V2.md
│   └── ENGINEERING_GUIDE.md    # This file
│
├── CLAUDE.md                   # AI assistant development guide
├── .gitignore
└── DATA_MODEL.md               # (root-level, to be moved to docs/ in v0.3)
```

### Target Structure (v0.9+ backend phase)

When the backend is introduced in v0.9, the repository splits into two clearly separated directories:

```
project-root/
│
├── frontend/                   # Browser client
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── js/
│       ├── api.js              # API client (replaces storage.js for remote data)
│       ├── auth.js
│       ├── i18n.js
│       ├── helpers.js
│       ├── modal.js
│       ├── notifications.js    # In-app notification center
│       ├── search.js           # Global search (Cmd+K)
│       └── render/
│           └── [one file per module]
│
├── backend/                    # API server
│   ├── src/
│   │   ├── app.js              # Express app entry point
│   │   ├── routes/             # One file per resource group
│   │   ├── controllers/        # Route handlers
│   │   ├── services/           # Business logic
│   │   ├── models/             # Database models / query layer
│   │   ├── middleware/         # Auth, tenant isolation, rate limiting
│   │   └── jobs/               # Background job definitions
│   ├── migrations/             # Database migration files
│   └── seeds/                  # Demo data seeders
│
├── docs/                       # Architecture and product docs
└── CLAUDE.md
```

### Rules

- `js/render/` contains **only render functions** for a single module. No business logic, no data mutation, no cross-module calls.
- `js/helpers.js` contains **only pure functions** — no DOM access, no state reads, no side effects.
- `js/state.js` is the **single source of truth** for all in-memory data during the prototype phase. No module creates its own state object.
- `docs/` is documentation only. No JavaScript, no HTML, no CSS.
- Never create files in the root directory that belong in a subdirectory.

---

## 2. Coding Standards

### Language Version

The prototype uses **vanilla JavaScript with no build toolchain**. This is intentional for the prototype phase. Adhere to the following:

- Use `const` for values that are never reassigned.
- Use `let` for values that change within a scope.
- Do not use `var` in new code. Legacy `var` in existing files may remain until those files are refactored as part of a planned module sprint.
- Do not introduce `class` syntax until the v0.9 backend phase. The prototype architecture does not benefit from it.
- Do not introduce modules (`import`/`export`) until a build tool is adopted in v0.9.
- All functions are declared as named function declarations or const arrow functions — not anonymous function expressions assigned to variables.

### Formatting

- **Indentation:** 2 spaces. No tabs.
- **Line length:** Soft limit of 100 characters. Break template literals at logical boundaries, not character count.
- **Semicolons:** Always. Never rely on ASI.
- **Quotes:** Double quotes for strings. Template literals for strings containing interpolation.
- **Trailing commas:** Include on multi-line arrays and objects. Reduces diff noise.
- **Braces:** Always use braces on `if`, `for`, `while` blocks, even for single-line bodies.

```javascript
// Correct
if (condition) {
  doSomething();
}

// Wrong
if (condition) doSomething();
```

### Functions

- Functions must do one thing. If a function renders HTML and also mutates state, split it.
- Maximum function length: 40 lines. If a function exceeds this, extract sub-functions.
- All functions that return a value must return the same type in all code paths.
- Render functions return nothing — they write to the DOM directly. They must not mutate state.
- Mutation functions return nothing — they mutate state and call `persistState()`. They must not directly manipulate the DOM.

```javascript
// Correct separation
function saveDepartment(deptId) {
  // mutates state, persists, re-renders
  const dept = state.departments.find(d => d.id === deptId);
  dept.name = getFormValue("f-dept-name");
  persistState();
  closeModal();
  window.renderMain();
}

function renderDepartmentCard(dept) {
  // pure render — reads state, returns HTML string
  const mgr = state.users.find(u => u.id === dept.managerId);
  return `<div class="card card-row">...</div>`;
}
```

### Error Handling

- Validate all user input before mutating state. Use `validateEmployeePayload` as the pattern for validation functions.
- Validation functions return `{ errors: string[], warnings: string[] }`. Never throw from a validation function.
- `try/catch` is required only around localStorage access and future API calls.
- Do not silently swallow errors. Always `console.error()` in catch blocks.
- User-facing errors must use translated strings via `t()`. Never hardcode error text in English or Turkish directly in render or mutation functions.

### Internationalization

Every string displayed to the user must be translated. No exceptions.

```javascript
// Correct
html += `<div class="page-title">${t("page_title_departments")}</div>`;

// Wrong — hardcoded string
html += `<div class="page-title">Departments</div>`;
```

- Add both `tr` and `en` translations to `i18n.js` for every new string, in the same commit.
- Use `t(key)` for static strings.
- Use `tf(key, { param: value })` for strings with interpolated values.
- Use `loc(obj)` for bilingual objects `{ tr: "...", en: "..." }` stored in data records.
- i18n keys use `snake_case` with a module prefix: `dept_modal_title`, `employee_save_success`.

---

## 3. Naming Conventions

### JavaScript

| Thing | Convention | Example |
|---|---|---|
| Functions | `camelCase` | `renderDepartmentList`, `saveEmployee` |
| Variables | `camelCase` | `currentUser`, `deptId` |
| Constants (module-level) | `SCREAMING_SNAKE_CASE` | `STORAGE_KEY`, `MAX_DEPT_NAME_LENGTH` |
| Boolean variables | `is`/`has`/`can` prefix | `isOwner`, `hasManager`, `canEdit` |
| Event handler parameters | `e` | `function(e) { e.target... }` |
| Render functions | `render` prefix + PascalCase subject | `renderDashboard`, `renderEmployeeCard` |
| Save/mutation functions | `save`/`delete`/`update` prefix | `saveDepartment`, `deleteEmployee` |
| Open modal functions | `open` prefix + PascalCase subject | `openEmployeeModal`, `openDeptModal` |
| Validation functions | `validate` prefix | `validateEmployeePayload` |
| Helper/query functions | descriptive verb | `deptEmployees`, `directReports` |

### IDs in State Data

All IDs in the state object use a short prefix followed by a hyphen and a unique slug:

| Entity | Prefix | Example |
|---|---|---|
| User / Employee | `u-` | `u-murat`, `u-fatma` |
| Department | `dep-` | `dep-satis`, `dep-ik` |
| Task | `t-` | `t-1`, `t-task-abc` |
| Meeting Template | `m-` | `m-weekly-review` |
| Meeting Occurrence | `mo-` | `mo-1` |
| Meeting Decision | `md-` | `md-1` |
| Role Profile | `rp-` | `rp-sales-rep` |
| Project | `proj-` | `proj-website` |
| Goal | `goal-` | `goal-q3-revenue` |
| Goal Check-In | `ci-` | `ci-1` |
| KPI Definition | `kpi-` | `kpi-monthly-revenue` |
| KPI Value | `kpival-` | `kpival-1` |
| KPI Alert | `kal-` | `kal-1` |
| Scorecard | `sc-` | `sc-1` |
| Document | `doc-` | `doc-sales-policy` |
| Policy | `pol-` | `pol-1` |
| Handbook Section | `hb-` | `hb-about` (fixed set, not `genId()`-generated) |
| Meeting Summary | `ms-` | `ms-1` |
| AI Insight | `ai-` | `ai-gov-u-ahmet` (deterministic from type + subject, not `genId()` — see `DATA_MODEL.md` §16) |
| Analysis Snapshot (Health Brief) | `snap-` | `snap-1` |
| Assistant Query | `aq-` | `aq-1` |

Auto-generated IDs from `genId(prefix)` follow the same prefix convention.

### HTML IDs and Classes

| Thing | Convention | Example |
|---|---|---|
| Element IDs (DOM) | `kebab-case` | `main-content`, `modal-overlay`, `login-email` |
| Form field IDs | `f-` prefix + `kebab-case` | `f-emp-name`, `f-dept-manager` |
| CSS class names | `kebab-case` | `card`, `card-row`, `page-title`, `stat-grid` |
| Tag/badge classes | `tag-` prefix + color | `tag-green`, `tag-gold`, `tag-red`, `tag-gray` |
| Section headers | `section-head` | consistent across all modules |
| Notice/alert classes | `notice notice-{color}` | `notice notice-red`, `notice notice-green` |

### i18n Keys

`module_context_element`

Examples: `dept_modal_title`, `employee_validation_email_required`, `meeting_empty_state`, `kpi_status_on_track`

### CSS Variables

All design tokens are CSS custom properties defined in `:root`. Use them — never hardcode color, shadow, or spacing values.

```css
/* Correct */
color: var(--navy);
border: 1px solid var(--border);

/* Wrong */
color: #1a2844;
border: 1px solid #dde2ec;
```

---

## 4. File Organization Rules

### One module, one render file

Each product module defined in `PRODUCT_BLUEPRINT_V2.md` maps to exactly one file in `js/render/`. That file owns all render functions for that module.

| Module | File |
|---|---|
| Dashboard | `js/render/dashboard.js` |
| Organization | `js/render/departments.js` + `js/render/employees.js` (to be merged into `organization.js` in v0.3) |
| Governance (Corporate) | `js/render/roleCards.js` → rename to `governance.js` in v0.3 |
| Governance (Family) | `js/render/familyGovernance.js` — new in v0.3 |
| Meetings | `js/render/meetings.js` |
| Execution | `js/render/execution.js` — new in v0.5 |
| Performance | `js/render/performance.js` — new in v0.6 |
| Knowledge | `js/render/knowledge.js` — new in v0.7 |
| AI Advisor | `js/render/aiAdvisor.js` — new in v0.8 |
| Administration | `js/render/settings.js` → rename to `administration.js` in v0.9 |

### Script load order in index.html

Scripts must be loaded in this order. Violating the order breaks the dependency chain.

```
1. state.js          — data must exist before anything reads it
2. storage.js        — depends on state
3. i18n.js           — depends on state (for lang)
4. helpers.js        — depends on state and i18n
5. auth.js           — depends on state, helpers
6. modal.js          — depends on nothing (DOM-only)
7. js/render/*.js    — depends on all of the above
8. app.js            — depends on all render files
```

When adding a new render file, add it between step 7 and step 8. Never add a render file before `helpers.js`.

### What belongs where

| Code type | Where it goes |
|---|---|
| Translatable strings | `i18n.js` only |
| Pure data transformation functions | `helpers.js` |
| State mutation + persistence | The module's render file, or `helpers.js` for shared mutations |
| DOM rendering (HTML string generation) | The module's render file |
| Modal content | The module's render file (the function that calls `showModal`) |
| CSS variables and design tokens | `styles.css` `:root` block |
| Component-level styles | `styles.css`, in the section for the relevant component |

### What does not belong in a render file

- Direct `localStorage` access — use `persistState()` and `loadState()` from `storage.js`
- Cross-module state reads beyond what is necessary to render the current view
- Business logic that belongs in `helpers.js`
- Hardcoded strings not wrapped in `t()`

---

## 5. Sprint Workflow

Every sprint delivers one named, versioned increment. Sprints are not time-boxed — they are scope-boxed.

### Sprint Lifecycle

```
1. PLAN      — Review sprint scope from PRODUCT_BLUEPRINT_V2.md
               Identify all files that will be touched
               Identify all new i18n keys required
               Identify any state schema changes

2. ANALYZE   — Read all files that will be modified before writing any code
               Check for downstream effects on other modules
               Flag any backward compatibility risks

3. PROPOSE   — If the sprint changes architecture, data shapes, or module boundaries:
               Write the plan out explicitly before coding
               Wait for approval

4. IMPLEMENT — Work in small increments, one feature at a time
               Run regression after each feature, not only at the end
               Commit partial progress at stable checkpoints (not broken states)

5. TEST      — Complete the regression checklist (§10) in full
               Test both Turkish and English language modes
               Test all four user roles that have access to the changed module

6. COMMIT    — Run the full regression checklist one final time
               Create the version commit following the Git workflow (§6)
```

### What a sprint must never do

- Change two unrelated modules in the same sprint
- Leave the application in a broken state at any commit
- Skip the regression checklist to "save time"
- Add undocumented features — if it's not in the blueprint, it is not in the sprint
- Create new files without updating the script load order in `index.html`

### Sprint sizing

Each sprint should be completable in one focused session. If a sprint item requires more than one session, split it into two sprint items.

---

## 6. Git Workflow

### Branching strategy

The project currently uses a single `master` branch. When the team grows beyond one engineer, switch to:

- `main` — production-ready code only. Never commit directly to main.
- `develop` — integration branch. All features merge here first.
- `feature/v0.X-short-description` — one branch per sprint item.
- `fix/short-description` — bug fixes outside of a sprint.

Until then, all commits go to `master` with the versioning convention below.

### Commit message format

```
vX.Y.Z short module or feature description

Optional one-paragraph body explaining the why, not the what.
The what is in the diff.
```

**Examples:**
```
v0.3.1 role profiles — version history and state management

v0.4.5 meetings — action item to task bridge

v0.6.10 kpi signals — threshold alert to notification pipeline
```

**Rules:**
- Version prefix is mandatory on sprint-closing commits.
- Use lowercase after the version prefix.
- First line is under 72 characters.
- Do not include "fix", "add", "update" as filler words — describe the feature directly.
- Do not reference issue numbers or ticket IDs unless an external tracker is adopted.

### Commit granularity

- **One concern per commit.** Adding i18n keys and adding a render function are one concern. Adding a render function and fixing an unrelated bug in another module are two concerns.
- Commits on a branch should tell a readable story: "add state schema," "add render function," "add i18n keys," "add validation."
- Never batch a sprint's worth of work into a single commit. Checkpointed commits are fine and encouraged.
- The sprint-closing commit (version commit) should represent a complete, tested feature — not a work-in-progress.

### Tags

Every version commit receives a Git tag matching the version prefix:

```
git tag v0.3.1
git tag v0.4.0
```

Tag after the commit, not before.

### What never goes into version control

Refer to `.gitignore`. In addition:

- Passwords, API keys, tokens — never, even in comments
- `console.log` debugging statements left in production paths
- Commented-out code blocks — delete them, they live in git history
- Personal editor config files

---

## 7. Code Review Checklist

Every pull request (or, in single-engineer mode, every sprint-closing commit reviewed before tagging) must pass this checklist.

### Correctness

- [ ] The feature works as described in `PRODUCT_BLUEPRINT_V2.md`
- [ ] All four user roles that have access to the feature are tested
- [ ] Role-restricted screens are hidden from roles that should not see them
- [ ] State mutations are persisted immediately after mutation
- [ ] No mutation occurs inside a render function
- [ ] No DOM manipulation occurs inside a mutation function
- [ ] Validation rejects invalid input with a user-facing translated error message
- [ ] No data is lost when the page is reloaded (state persists correctly)

### Code quality

- [ ] No `var` declarations in new code
- [ ] No hardcoded strings — all user-facing text uses `t()` or `tf()`
- [ ] Both `tr` and `en` translations added for every new i18n key
- [ ] Function names match the naming conventions in §3
- [ ] No function exceeds 40 lines
- [ ] No render function exceeds its module file
- [ ] No new global variables introduced (beyond what `state.js` defines)
- [ ] `genId(prefix)` used for all new IDs, with the correct prefix per entity type (§3)

### Architecture

- [ ] The change is confined to the module files it should affect
- [ ] No cross-module state mutation (module A should not mutate data owned by module B)
- [ ] New render files are added to `index.html` in the correct load order (§4)
- [ ] New state properties are added to `state.js` with sensible defaults
- [ ] If a state schema changed, `loadState()` still handles old persisted data gracefully

### UI

- [ ] New UI components use existing CSS classes before introducing new ones
- [ ] New CSS classes follow the naming convention in §3
- [ ] No inline `style` attributes except for truly dynamic values (e.g., calculated widths)
- [ ] Empty states are implemented for any list that may be empty
- [ ] The UI looks correct at 1280px, 1440px, and on a tablet (768px)

### Documentation

- [ ] Any new function with non-obvious behavior has a single explanatory comment
- [ ] New sprint items in `PRODUCT_BLUEPRINT_V2.md` are marked as delivered
- [ ] `CLAUDE.md` updated if development workflow has changed

---

## 8. UI Consistency Rules

### Design tokens

All colors, borders, shadows, radii, and spacing values are defined as CSS custom properties in `:root` in `styles.css`. Use them everywhere. Never hardcode design values.

The current token set includes:

```css
--navy        /* primary brand color — headers, active states */
--gold        /* accent color — primary buttons, highlights */
--bg          /* page background */
--surface     /* card and panel background */
--border      /* standard border color */
--text-main   /* primary text */
--text-sub    /* secondary/muted text */
--red         /* error, critical states */
--green       /* success, on-track states */
--amber       /* warning states */
```

Any new color need must be added to `:root` as a named variable, not used inline.

### Component patterns

Every screen is built from a small set of established components. Use these components — do not reinvent them.

| Component | CSS class | Use |
|---|---|---|
| Page title | `.page-title` | The main heading of every screen |
| Page subtitle | `.page-sub` | Descriptive line below the page title |
| Content card | `.card` | Any bordered, padded content container |
| Row-style card | `.card.card-row` | Card with content on the left and a tag/action on the right |
| Statistics grid | `.stat-grid` > `.stat-card` | 2–4 metric tiles at the top of a dashboard |
| Section header | `.section-head` > `h2` | Named section dividers within a screen |
| Notice/alert | `.notice.notice-{color}` | Informational banners: red (error), amber (warning), green (success) |
| Tag/badge | `.tag.tag-{color}` | Status labels on cards: green, gold, red, gray, navy |
| Primary button | `.btn-gold` | The main confirm or save action |
| Secondary button | `.btn-sm` | Cancel, secondary actions |
| Text input | `.text-input` | All form fields: input, select, textarea |
| Modal body | `showModal(html)` | All dialogs — never use browser `alert()` or `confirm()` for UI |
| Empty state | `.empty-state` | Message shown when a list has no items |
| Avatar | `.avatar` | Initials-based circular avatar generated by `initials(name)` |

### Empty states

Every list, board, or table must handle the empty case. Empty states must:
- Explain what the screen is for (one line)
- Tell the user what to do next (one action)
- Use `.empty-state` class

```javascript
if (items.length === 0) {
  html += `<div class="empty-state">${t("dept_empty_no_employees")}</div>`;
}
```

Never show a blank area where content should be.

### Modals

All data entry and confirmation dialogs use the `showModal()` system. Do not use:
- `alert()` for notifications (except temporary debug, which must be removed before commit)
- `confirm()` except for irreversible destructive operations (delete, reset)
- `prompt()` at any time

Modal HTML structure (always follow this order):

```html
<button class="modal-close" onclick="closeModal()">&times;</button>
<h3><!-- modal title --></h3>
<!-- form fields -->
<div class="modal-actions">
  <button class="btn-sm" onclick="closeModal()"><!-- cancel label --></button>
  <button class="btn-gold" onclick="saveXxx()"><!-- save label --></button>
</div>
```

### Language and tone

- All UI text is concise. Labels are one to three words. Descriptions are one sentence.
- No exclamation marks in UI text.
- Error messages describe what went wrong and what the user should do. "Name is required" — not "Error."
- Empty state messages are encouraging, not apologetic. "No departments yet — add your first one." — not "Nothing to show."
- Button labels use verbs: "Save", "Add department", "Delete". Not "OK", "Submit", "Yes".

### Accessibility

- Every form field has a `<label>` element associated with it.
- Interactive elements are keyboard-navigable.
- Color is never the only signal — combine color with text or an icon.
- Error states show an error message in addition to any red border or color change.

---

## 9. Definition of Done

A sprint item is **done** when all of the following are true. Not most. All.

### Feature completeness

- [ ] The feature matches the screen description in `PRODUCT_BLUEPRINT_V2.md`
- [ ] All screens listed for the sprint item are implemented
- [ ] All four applicable user roles see the correct view (their permitted access, nothing more)
- [ ] Empty states are implemented for all new lists
- [ ] Validation is implemented for all new forms

### Quality

- [ ] No `console.log` statements in the committed code
- [ ] No commented-out code in the committed code
- [ ] No hardcoded strings — all user-facing text uses `t()` or `tf()`
- [ ] Both Turkish and English text is verified to display correctly
- [ ] The app does not throw any JavaScript errors in the browser console under normal use

### State integrity

- [ ] New state properties are initialized in `state.js` with correct default values
- [ ] Mutations call `persistState()` immediately
- [ ] Reloading the page preserves the user's data correctly
- [ ] `loadState()` handles a missing new property gracefully (uses the default from `state.js`)

### Documentation

- [ ] New i18n keys are documented (they are self-documenting in `i18n.js`)
- [ ] Sprint item status updated in `PRODUCT_BLUEPRINT_V2.md`
- [ ] If a new file was created, the script load order in `index.html` is updated

### Testing

- [ ] Full regression checklist (§10) has been executed and passed
- [ ] The feature has been manually tested in both Turkish and English
- [ ] The feature has been tested while logged in as each role that can access it

### Version commit

- [ ] The sprint-closing commit follows the format in §6
- [ ] The commit is tagged with the version number

---

## 10. Regression Checklist

Execute this checklist in full before every version commit. Execute it in the browser — not by reading code.

### Authentication

- [ ] Logging in with a valid patron account works
- [ ] Logging in with a valid mudur account works
- [ ] Logging in with a valid calisan account works
- [ ] Logging in with an incorrect password shows the error message
- [ ] Logging out clears the session and returns to the login screen
- [ ] After logout and re-login, the user's previous data is still present

### Navigation

- [ ] Patron sees: Overview, Departments & Employees, Role Profiles, Meetings, Settings (or their Turkish equivalents)
- [ ] Mudur sees: Overview, My Team, Role Profiles, Meetings (no Settings)
- [ ] Calisan sees: Home, My Card, My Meetings (no team or settings tabs)
- [ ] Switching tabs renders the correct screen content
- [ ] Active tab is visually highlighted
- [ ] Language switcher changes all visible text correctly (TR ↔ EN)

### Organization module

- [ ] Department list renders with correct department names and manager names
- [ ] Adding a department saves it and it appears in the list
- [ ] Editing a department updates it in place
- [ ] Deleting a department with employees shows the protection error
- [ ] Deleting an empty department removes it from the list and state
- [ ] Employee directory renders with correct data
- [ ] Adding an employee saves to state and appears in the directory
- [ ] Editing an employee updates correctly
- [ ] Deleting an employee removes them from state and department lists
- [ ] Validation prevents saving an employee with no name, no email, or no department (non-patron)
- [ ] Reporting lines section shows employees missing a manager
- [ ] Org chart view (if implemented) renders correctly

### Governance module

- [ ] Role profile list renders for patron and mudur
- [ ] A role profile card opens and shows the correct content
- [ ] Editing a role profile saves correctly
- [ ] An employee can view their own role profile (read-only)
- [ ] An employee cannot see other employees' role profiles

### Meetings module

- [ ] Meeting list renders correctly for all roles
- [ ] Patron and mudur see all meetings
- [ ] Calisan sees only meetings they participate in
- [ ] Meeting details display correct participant list and schedule

### Tasks module (when implemented)

- [ ] My Tasks renders the correct tasks for the logged-in user
- [ ] Task status update persists after page reload
- [ ] Team board shows department-scoped tasks for mudur
- [ ] Patron sees all tasks across departments

### Settings module

- [ ] Settings screen is accessible to patron only
- [ ] Company name displays correctly
- [ ] Language preference change persists after reload
- [ ] Reset data prompt appears before data is deleted

### Data persistence

- [ ] Reload the page — all data added during the session is still present
- [ ] Close and reopen the browser tab — data is still present
- [ ] No state corruption when switching between roles via logout/login

### Language

- [ ] All screens render without any missing translation keys (no raw key names visible, e.g., `"nav_kartlar"` appearing as text)
- [ ] Both TR and EN display correct text for all new features

---

## 11. Rules for Adding New Modules

A new module is any section listed in `PRODUCT_BLUEPRINT_V2.md` that does not yet exist in the codebase. Follow these steps in order.

### Step 1 — Read the blueprint first

Before writing a single line of code, read the full module specification in `PRODUCT_BLUEPRINT_V2.md`:
- All screens in the module
- Role-access matrix for each screen
- Data entities involved
- Data flows into and out of the module

If anything in the blueprint is ambiguous, resolve it before starting.

### Step 2 — Design the state schema

Define all new entities the module requires as properties in `state.js`. Every new entity must have:
- A clearly named top-level key in the state object
- An initial value (empty array `[]` for collections, `null` or `{}` for singletons)
- The ID prefix that `genId()` will use

```javascript
// Example: Adding the tasks entity for the Execution module
var state = {
  // ... existing properties ...
  tasks: [],        // Task[]
  projects: [],     // Project[]
  sops: [],         // SOP[]
};
```

All new state properties must be initialized — never leave a property undefined.

### Step 3 — Update loadState() for backward compatibility

If new state properties are added, `loadState()` must handle existing persisted data that does not have these properties yet. The current pattern handles this:

```javascript
// In storage.js loadState():
// After loading persisted state, fill missing new properties with defaults
if (!state.tasks) state.tasks = [];
if (!state.projects) state.projects = [];
```

This must be done before the sprint is released, not after.

### Step 4 — Add i18n keys

Add all new strings to `i18n.js` with both `tr` and `en` values before writing render functions. This forces explicit translation coverage and prevents render functions from containing hardcoded strings.

Group new keys together under a comment identifying the module:
```javascript
// === Execution Module ===
task_board_title: "Görev Panosu",
// ...
```

### Step 5 — Create the render file

Create `js/render/[moduleName].js`. Every render function in this file must:
- Read from `state` (never write to it)
- Use `t()` / `tf()` / `loc()` for all strings
- Use the established component classes from §8
- Implement empty states for every list
- Enforce role-based access at the top of the function

```javascript
function renderTaskBoard() {
  const user = getCurrentUser();
  // Role check: only patron, genel_mudur, mudur can see the team board
  if (user.role === "calisan") {
    document.getElementById("main-content").innerHTML = `
      <div class="empty-state">${t("access_denied")}</div>`;
    return;
  }
  // ... render logic
}
```

### Step 6 — Add the script tag to index.html

Add the new script tag in the correct load order (§4). It must come after all infrastructure files and before `app.js`.

### Step 7 — Register the module in app.js

Add the module's tabs and render function references to the role-based navigation tables in `app.js`. Follow the existing pattern in `tabsByRole` and the `fn` dispatch object in `renderMain`.

### Step 8 — Add seed data (if needed)

If the module benefits from demo data (it usually does), add seed records to `state.js`. Seed data must:
- Use the correct ID prefix for the entity
- Be consistent with existing seed data (use the same user and department IDs)
- Be in both Turkish and English for any bilingual fields

### Step 9 — Run the full regression checklist

Run the complete checklist in §10. New module work frequently breaks existing navigation or state loading. Do not skip existing module tests.

---

## 12. Rules for Modifying Existing Modules

Modifying an existing module carries more risk than adding a new one because regressions are possible.

### Before touching any file

1. Read the entire file you are about to change, not just the function you are targeting.
2. Identify every function that calls the function you are changing.
3. Identify every place in the state that the function reads from or writes to.

### Scope discipline

- Change only what the sprint item requires. No opportunistic refactoring while working on a feature.
- If you discover a bug or improvement opportunity unrelated to the current sprint item, create a note for a future sprint. Do not fix it now.
- If you must rename a function, grep for all usages before renaming and update them all in the same commit.

### State schema changes

If you change the shape of an existing entity in `state.js` (add, rename, or remove a field):

1. Update the seed data in `state.js` to match the new shape.
2. Update `loadState()` in `storage.js` to handle persisted data in the old shape. Backward compatibility (§13) applies here.
3. Update all render functions in all modules that read the changed field.
4. Update all mutation functions that write the changed field.
5. Update the relevant section of `DATA_MODEL.md` to reflect the change.

Never rename a state property across multiple files in separate commits. Do it atomically in one commit.

### i18n changes

- Never remove an i18n key that may still be used elsewhere. Search for all usages before deleting.
- If you rename an i18n key, update every `t()` call that references the old key in the same commit.
- Adding new keys is safe. Removing or renaming existing keys is risky — search first.

### CSS changes

- Changes to shared CSS classes affect every module that uses them. Test all affected screens, not just the one you are working on.
- Do not change a shared class to fix a visual issue in one screen. Create a modifier class instead: `card--compact`, `btn-gold--wide`.
- Do not remove CSS variables from `:root` without searching for all usages first.

---

## 13. Rules for Preserving Backward Compatibility

Backward compatibility in this project means: **a user who has data saved in localStorage must not lose that data or experience broken behavior after a new version is deployed.**

This is a non-negotiable requirement throughout the prototype phase.

### The persistence contract

The STORAGE_KEY `"veliaht_yonetim_state_v1"` defines the current serialization format. Any change to what is stored under this key must be forward-compatible with data saved under the previous format.

### Rules

**Never remove a state property that may exist in a user's persisted data.**
If a property is no longer needed, deprecate it: keep reading it in `loadState()` for one version, then remove it in the next.

**Never rename a state property.**
Renaming `state.todos` to `state.tasks` without a migration step causes all existing user data to lose their tasks on the next page load. Instead:

1. In the transition sprint: read from both old and new names in `loadState()`, write to the new name only.
2. In the following sprint: remove the old name from `loadState()`.

```javascript
// Migration pattern in loadState():
if (parsed.todos && !parsed.tasks) {
  state.tasks = parsed.todos; // migrate old name to new
} else {
  state.tasks = parsed.tasks || [];
}
```

**Never change the shape of an existing entity in a way that breaks reading existing instances.**
Adding a new optional field with a default is safe. Changing a required field from a string to an object is breaking. Provide a migration in `loadState()`.

```javascript
// Safe: adding a new field with a default
if (parsed.tasks) {
  state.tasks = parsed.tasks.map(function(t) {
    return Object.assign({ priority: "medium" }, t); // new field, backward-safe default
  });
}
```

**When the STORAGE_KEY must change (major data model revision):**
The STORAGE_KEY includes a version suffix (`_v1`). If the data model changes so fundamentally that migration is not feasible, increment the key to `_v2`. Implement a one-time migration function that reads `_v1` data, transforms it, writes to `_v2`, and removes `_v1`. This migration runs once on the first load after the upgrade.

**Never ship a sprint that clears user data without an explicit, confirmed user action.**
`resetAllData()` in `storage.js` is the only authorized data-clearing path, and it requires `confirm()` first.

### API backward compatibility (v0.9+)

Once the backend API is introduced:

- Never remove a field from an API response. Mark it deprecated and remove it in the next major version.
- Never change the type of an API field without versioning the endpoint.
- New required fields on API requests must have defaults the server handles gracefully.
- API versioning (`/api/v1/`, `/api/v2/`) gates breaking changes.

---

## 14. Performance Guidelines

### Prototype phase (v0.1–v0.8)

The prototype runs entirely in the browser with no network dependency. Performance problems in this phase are almost always caused by excessive DOM manipulation or unbounded loops over state.

**DOM writes**

Batch all DOM mutations into a single `innerHTML` assignment per render call. Never update the DOM incrementally inside a loop.

```javascript
// Correct — one DOM write
let html = "";
items.forEach(function(item) {
  html += renderItemCard(item);
});
document.getElementById("main-content").innerHTML = html;

// Wrong — DOM write inside loop (forces reflow on every iteration)
items.forEach(function(item) {
  document.getElementById("main-content").innerHTML += renderItemCard(item);
});
```

**Filtering and finding**

Avoid repeated `.find()` or `.filter()` calls on the same array within a single render function. Cache the result.

```javascript
// Correct
const me = getCurrentUser(); // call once
const dept = userDept(me);  // call once
// use me and dept throughout

// Wrong
// calling getCurrentUser() or state.users.find(...) in multiple places in the same function
```

**State size**

The state object is serialized to JSON on every `persistState()` call. Keep entities lean:
- Do not store derived or computed values in state — compute them at render time.
- Do not store display-only strings (formatted dates, concatenated labels) in state — format them at render time.
- Do not duplicate data across entities — use foreign key references (IDs), not embedded copies.

**Large lists**

If a list exceeds 50 items, implement a simple pagination or "show more" pattern before rendering the full list as a single HTML block. An uncapped list of 200+ cards will cause visible jank on render.

### Backend phase (v0.9+)

**API calls**

- Never make API calls inside a loop. Batch requests where possible.
- Cache frequently-read reference data (departments, employees) in memory for the session — do not refetch on every render.
- Set a reasonable timeout on all API calls (10 seconds). Surface a friendly error if the timeout is exceeded.
- Optimistic UI for writes: update state immediately on user action, then confirm with the API. Revert on error.

**Database (v0.9 guidelines for backend engineers)**

- Every foreign key column must have a database index.
- Every query that filters by `company_id` (all of them) must have `company_id` in the index.
- Do not run unbounded queries. All list endpoints must accept a `limit` and `offset` parameter, with a server-enforced maximum of 200 records.
- Do not compute aggregates (count, sum) at query time in render-path requests. Use pre-computed snapshots (e.g., `DepartmentHealthSnapshot`) or background jobs.

**Bundle size**

When a build tool is introduced in v0.9:
- No single JavaScript bundle should exceed 200KB uncompressed.
- Images must be compressed before committing. No PNG over 100KB.
- The initial page load must score ≥ 85 on Lighthouse Performance.

---

## 15. Documentation Requirements

### What must be documented and where

| Artifact | Location | When to update |
|---|---|---|
| Product architecture and module specs | `docs/PRODUCT_BLUEPRINT_V2.md` | When a sprint item is delivered (mark as delivered) or when the blueprint changes |
| Data model and entity relationships | `DATA_MODEL.md` | When a state schema changes |
| Module architecture overview | `docs/MODULE_ARCHITECTURE.md` | When a new module is added or module responsibilities change |
| Engineering standards (this document) | `docs/ENGINEERING_GUIDE.md` | When standards change, with a version note at the top |
| AI assistant context | `CLAUDE.md` | When sprint workflow or project structure changes |

### Code comments

The default is: **no comments**. Write code that explains itself through naming.

Write a comment **only** when the reason behind the code is non-obvious:
- A hidden constraint or external limitation
- A workaround for a specific known bug
- An invariant that would not be obvious to a reader unfamiliar with the domain
- A deliberate choice that looks wrong but is correct

```javascript
// Correct — explains a non-obvious invariant
// Patron role has no departmentId by design — they sit above the org structure
if (!isOwnerRole(user.role) && !user.departmentId) {
  warnings.push(t("warning_manager_missing_save"));
}

// Wrong — restates what the code already says
// Check if the user is an owner
if (isOwnerRole(user.role)) { ... }
```

Never write:
- Comments that explain what the code does (the code does that)
- Comments referencing the current task, sprint, or issue number (that belongs in the commit message)
- Commented-out code blocks (delete them — they live in git history)
- Section divider comments like `// ========== RENDER ==========`

### i18n as documentation

The `i18n.js` file is self-documenting by design. The key names serve as the canonical reference for all user-facing strings. The file is organized by module and kept in alphabetical order within each module section. When reviewing changes, `i18n.js` shows exactly what text was added or changed in a sprint.

### Commit messages as changelog

Commit messages serve as the project changelog. A reader who runs `git log` must be able to understand the arc of product development without reading any external document. Write commit messages accordingly.

Avoid: `"fix bug"`, `"wip"`, `"updates"`, `"cleanup"`.  
Write: `"v0.4.5 meetings — action items now create linked task records"`.

### Sprint delivery record

When a sprint item from `PRODUCT_BLUEPRINT_V2.md` is completed, update the table row in the roadmap section to indicate it is delivered. This keeps the blueprint as a live, accurate record of what exists — not just what was planned.

### Architecture decision records (ADRs)

For any significant architectural decision (changing the state model, adopting a new library, changing the folder structure), write a brief ADR as a section in `docs/MODULE_ARCHITECTURE.md`. Format:

```
## Decision: [topic]
Date: YYYY-MM-DD
Context: [what situation prompted this decision]
Decision: [what was decided]
Consequences: [what changes as a result]
```

ADRs are write-once, append-only. Do not edit past decisions — add a new entry that supersedes the old one if the decision changes.

---

## Appendix A — Quick Reference Card

For engineers who have read the full guide and need a daily reference:

### Before you start a sprint item
1. Read the blueprint spec for the item
2. Read all files you will touch
3. Identify state schema changes and their migration needs
4. Add i18n keys first

### While coding
- `const` / `let` — never `var`
- All strings through `t()` — never hardcoded
- One DOM write per render call — never inside a loop
- Render functions only read state — never write it
- Mutation functions only write state — never write DOM directly

### Before committing
- Run the full regression checklist (§10)
- Test both TR and EN
- Test all roles that touch the feature
- Check the browser console for errors
- Remove all `console.log` statements

### Commit format
`vX.Y.Z short description of what was added`

### When in doubt
Stop. Re-read the blueprint. Ask. Guessing at requirements produces rework.

---

## Appendix B — Common Patterns

### Add a new entity type

```javascript
// 1. state.js — add collection with default
var state = {
  goals: [],  // Goal[]
};

// 2. state.js — add seed data
goals: [
  { id: "goal-q3-revenue", title: { tr: "Q3 Ciro Hedefi", en: "Q3 Revenue Goal" }, ... }
],

// 3. storage.js — handle missing property in loadState()
if (!state.goals) state.goals = [];

// 4. helpers.js — add genId prefix (document the prefix in §3)
// Goals use prefix "goal-"

// 5. js/render/performance.js — add render function
function renderGoals() { ... }
```

### Add a new navigation tab

```javascript
// app.js — add to tabsByRole for the appropriate roles
patron: [
  ["goals", t("nav_goals")],  // new entry
  ...
],

// app.js — add to the fn dispatch in renderMain()
patron: {
  goals: renderGoals,         // new entry
  ...
},
```

### Add a validated form field

```javascript
// helpers.js — extend the relevant validation function
function validateGoalPayload(payload) {
  const errors = [];
  if (!payload.title) errors.push(t("goal_validation_title_required"));
  if (!payload.ownerId) errors.push(t("goal_validation_owner_required"));
  return { errors };
}

// render file — call validation before saving
function saveGoal(goalId) {
  const title = document.getElementById("f-goal-title").value.trim();
  const ownerId = document.getElementById("f-goal-owner").value || null;
  const validation = validateGoalPayload({ title, ownerId });
  if (validation.errors.length) {
    alert(validation.errors.join("\n"));
    return;
  }
  // ... proceed with mutation
}
```

### Migrate a renamed state property

```javascript
// storage.js — in loadState(), after loading parsed data
// Migration: rename todos → tasks (v0.4 → v0.5)
if (parsed.todos && !parsed.tasks) {
  state.tasks = parsed.todos;
  delete state.todos; // clean up old key
} else {
  state.tasks = parsed.tasks || [];
}
```
