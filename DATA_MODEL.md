# Veliaht OS Data Model

## Current Project Structure Analysis

The current prototype is a browser-only single-page application split into three files:

- `index.html`
  Purpose: defines the static shell, login screen, app shell, sidebar container, main content container, and modal root.
  Observation: the HTML is intentionally thin. Most business behavior is not represented structurally in markup and is injected at runtime.

- `styles.css`
  Purpose: contains all presentation logic for layout, cards, forms, tags, modals, and responsive behavior.
  Observation: styling is already separated cleanly from behavior, which is good for future refactors.

- `app.js`
  Purpose: contains translations, in-memory data, localStorage persistence, authentication, role-based navigation, rendering, and CRUD logic.
  Observation: this file currently mixes application state, view rendering, permissions, and domain logic in one place. The prototype is functional, but the data model is not yet normalized enough for long-term SaaS use.

## Current State of the Data Layer

Today the app stores data inside a single `state` object in the browser:

- `company`
- `users`
- `departments`
- `roleCards`
- `tasks`
- `meetingTemplates`
- `meetingOccurrences`
- `meetingDecisions`
- `kpiDefinitions`
- `kpiValues`
- `kpiAlerts`
- `goals`
- `scorecards`
- `lang`
- `currentUserId`

This works for a prototype, but there are structural limitations:

- user authentication data and employee data are mixed in the same `users` collection
- role cards are stored as an object keyed by user id instead of as first-class records
- tasks (`state.tasks`, renamed from `todos` in v0.5) use only `employeeId` for assignment, which is too narrow for future multi-assignee/watcher models. They carry `source`/`sourceId` (mirroring the target `Task.source_type`/`source_id` fields below) and an optional `dueAt` ISO date, added in v0.4 so meeting-originated action items are traceable back to their meeting without a separate table
- meetings are now modeled as `meetingTemplates` (recurring definitions) plus `meetingOccurrences` (concrete dated instances with agenda/notes/status), closing most of the "templates vs. concrete events" gap noted below. `meetingDecisions` is a separate flat collection referencing `meetingOccurrences` by id, so the Decisions Log can be queried across all meetings without duplicating decision text into every occurrence record
- KPI tracking (`kpiDefinitions`, `kpiValues`, `kpiAlerts`), Goals, and Scorecards were added in v0.6 — see §8–11 below for their shapes and the deliberate simplifications made (no stored derived metrics, meeting attendance is approximated, no PDF export/charting/real notifications — all documented in `PRODUCT_BLUEPRINT_V2.md`'s v0.6 sprint table)
- there is no concept of tenancy, audit history, soft deletion, permissions, or versioning

The normalized model below is designed for a long-term multi-company SaaS architecture.

---

## Design Principles

- Every company is a tenant.
- Every core entity should have its own table/collection.
- Authentication identity should be separate from employment identity.
- Meetings, tasks, and KPIs should support history, not just current state.
- Position cards should be versionable because consulting outputs evolve over time.
- Relationships should support future cross-company reporting for Veliaht Akademi without breaking tenant isolation.

---

## 1. Company

### Purpose
Represents a customer company using Veliaht OS. This is the top-level tenant boundary for most operational data.

### Fields

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | string | Legal or display name |
| `slug` | string | URL-safe unique tenant identifier |
| `status` | enum | `active`, `trial`, `archived`, `churned` |
| `industry` | string nullable | Optional sector classification |
| `size_band` | enum nullable | Example: `1-10`, `11-50`, `51-200` |
| `country` | string nullable | ISO country code preferred |
| `timezone` | string | Important for meetings and reporting |
| `default_locale` | string | Example: `tr-TR`, `en-US` |
| `created_at` | datetime | Record creation timestamp |
| `updated_at` | datetime | Last update timestamp |
| `archived_at` | datetime nullable | Soft deletion / inactive state |

### Relationships

- one company has many departments
- one company has many employees
- one company has many meetings
- one company has many tasks
- one company has many KPI definitions
- one company has many KPI values

### Future Scalability Considerations

- must be the core tenant isolation key across all business tables
- should support onboarding state, contract state, and billing plan later
- may later connect to Veliaht Akademi-side entities like consultant ownership and account health

---

## 2. Department

### Purpose
Represents an organizational unit inside a company.

### Fields

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `company_id` | UUID | Foreign key to company |
| `name` | string | Department name |
| `code` | string nullable | Optional short code |
| `parent_department_id` | UUID nullable | Supports nested departments |
| `manager_employee_id` | UUID nullable | Current department owner |
| `status` | enum | `active`, `inactive` |
| `sort_order` | integer nullable | UI ordering |
| `created_at` | datetime | Timestamp |
| `updated_at` | datetime | Timestamp |
| `archived_at` | datetime nullable | Soft deletion |

### Relationships

- belongs to one company
- may belong to one parent department
- has many child departments
- has many employees
- may have one active manager employee
- can own many meetings, tasks, and KPI definitions

### Future Scalability Considerations

- hierarchy support is important for larger organizations
- department manager should not be stored only as a name or title
- future reporting may need department trees, department budgets, and department-level KPI rollups

---

## 3. Employee

### Purpose
Represents a person in a company’s organization chart and operational system.

### Fields

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `company_id` | UUID | Foreign key to company |
| `department_id` | UUID nullable | Current primary department |
| `user_account_id` | UUID nullable | Link to login identity |
| `manager_employee_id` | UUID nullable | Reporting line |
| `first_name` | string | Person name |
| `last_name` | string | Person surname |
| `display_name` | string | Cached full name |
| `email` | string | Business email |
| `phone` | string nullable | Optional |
| `employment_status` | enum | `active`, `inactive`, `on_leave`, `terminated` |
| `employment_type` | enum nullable | `full_time`, `part_time`, `contractor` |
| `role_level` | enum | Example: `owner`, `executive`, `manager`, `staff` |
| `job_title` | string | Current title |
| `start_date` | date nullable | Employment start |
| `end_date` | date nullable | Employment end |
| `created_at` | datetime | Timestamp |
| `updated_at` | datetime | Timestamp |
| `archived_at` | datetime nullable | Soft deletion |

### Relationships

- belongs to one company
- belongs to one department
- may report to one manager employee
- may manage many employees
- may have one user account
- may have one current position card and many historical position card versions
- may own many tasks
- may attend many meetings
- may have many KPI assignments and KPI values

### Future Scalability Considerations

- employee must be distinct from login/auth data
- one person may later hold multiple department assignments or matrix reporting
- employment history should be preserved instead of overwriting records
- permissioning should come from role memberships, not only from a single `role_level` field

---

## 4. User Account

### Purpose
Represents the authentication and access identity used to log into the system.

### Fields

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `primary_email` | string | Unique login email |
| `password_hash` | string nullable | Only for direct auth |
| `auth_provider` | enum | `password`, `google`, `microsoft`, etc. |
| `status` | enum | `active`, `locked`, `invited`, `disabled` |
| `last_login_at` | datetime nullable | Audit and security |
| `created_at` | datetime | Timestamp |
| `updated_at` | datetime | Timestamp |

### Relationships

- may map to one employee in a given company
- may later map to multiple company memberships if cross-tenant admin or consultant access is needed

### Future Scalability Considerations

- should support invitations, resets, SSO, MFA, and audit logging
- keeping auth separate prevents domain corruption when employee data changes

---

## 5. Position Card

### Purpose
Represents the formal role definition for an employee or role within the organization.

### Fields

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `company_id` | UUID | Foreign key to company |
| `employee_id` | UUID nullable | If assigned to a specific person |
| `department_id` | UUID nullable | Useful for role templates |
| `title` | string | Role card title |
| `role_summary` | text | High-level purpose of the role |
| `decision_scope` | text nullable | What can be decided independently |
| `approval_scope` | text nullable | What requires approval |
| `status` | enum | `draft`, `active`, `archived` |
| `version_number` | integer | Version tracking |
| `effective_from` | date nullable | When this version starts |
| `effective_to` | date nullable | When this version ends |
| `created_by_user_id` | UUID nullable | Author/auditor |
| `created_at` | datetime | Timestamp |
| `updated_at` | datetime | Timestamp |

### Relationships

- belongs to one company
- may belong to one employee
- may belong to one department
- has many position card duties
- has many position card collaborations
- may have many historical versions for the same employee/role

### Future Scalability Considerations

- role cards should be versioned, not overwritten
- the model should support template cards before assignment to a named employee
- approval workflow may be needed later for consultant review and client approval

### Supporting Child Entity: Position Card Duty

Purpose: stores one duty per row instead of embedding all duties in one text blob.

Suggested fields:

- `id`
- `position_card_id`
- `description`
- `sort_order`
- `created_at`

### Supporting Child Entity: Position Card Collaboration

Purpose: stores repeated collaboration lines as structured records.

Suggested fields:

- `id`
- `position_card_id`
- `related_department_id` nullable
- `related_role_name` nullable
- `frequency_label`
- `notes` nullable
- `sort_order`

---

## 6. Task

### Purpose
Represents an actionable work item assigned to a person or team.

### Fields

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `company_id` | UUID | Foreign key to company |
| `department_id` | UUID nullable | Contextual grouping |
| `assignee_employee_id` | UUID nullable | Current responsible person |
| `creator_user_id` | UUID nullable | Who created the task |
| `title` | string | Short task name |
| `description` | text nullable | Detailed instructions |
| `status` | enum | `draft`, `scheduled`, `in_progress`, `blocked`, `done`, `cancelled` |
| `priority` | enum nullable | `low`, `medium`, `high`, `critical` |
| `due_at` | datetime nullable | Deadline |
| `started_at` | datetime nullable | Execution start |
| `completed_at` | datetime nullable | Completion timestamp |
| `source_type` | enum nullable | `manual`, `meeting`, `kpi`, `recurring`, `workflow` |
| `source_id` | UUID nullable | Link back to originating object |
| `created_at` | datetime | Timestamp |
| `updated_at` | datetime | Timestamp |
| `archived_at` | datetime nullable | Soft deletion |

### Relationships

- belongs to one company
- may belong to one department
- may be assigned to one employee
- may be created by one user account
- may originate from one meeting, KPI, or workflow

### Future Scalability Considerations

- task assignment may later support multiple assignees or watchers
- comments, attachments, subtasks, and recurring tasks will likely be needed
- do not store task history only in the main row; status transitions should later be auditable

### Current Prototype Status (v0.5)

`state.tasks` (renamed from `state.todos` in v0.5) implements a trimmed subset of the target
shape above:

| Target field | Prototype field | Status |
|---|---|---|
| `title`, `description` | `title`, `description` | Implemented (`title` mixed bilingual-seed / plain-string-user-entered, same convention as `Department.name`/`Employee.name`) |
| `assignee_employee_id` | `employeeId` | Implemented — kept the original field name rather than renaming, since only the container changed in v0.5, not this field |
| `status` | `status` | Implemented as `todo \| in_progress \| blocked \| done` — `draft` and `cancelled` are not modeled yet |
| `priority` | `priority` | Implemented: `low \| medium \| high \| critical`, defaults to `medium` |
| `due_at` | `dueAt` (+ legacy `due` bilingual display text from v0.4) | Implemented |
| `source_type` / `source_id` | `source` / `sourceId` | `manual` and `meeting` are active; `governance`, `kpi`, `recurring`, `workflow` are reserved enum values with no producing logic yet |
| `created_at` | `createdAt` | Implemented for new records; `null` on records migrated from before v0.5 (no fabricated timestamps) |
| `department_id` | — | **Not stored.** Derived at render/filter time from the assignee's `departmentId` to avoid duplicating data already reachable via the assignee foreign key |
| `creator_user_id`, `started_at`, `completed_at`, `updated_at`, `archived_at` | — | Not modeled yet |
| Comments / `TaskComment`, status-history timeline, recurring-template linkage, Projects, SOPs, Checklists | — | Explicitly deferred — see `PRODUCT_BLUEPRINT_V2.md` v0.5 sprint table |

---

## 7. Meeting

### Purpose
Represents a scheduled operational or governance meeting inside a company.

### Fields

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `company_id` | UUID | Foreign key to company |
| `department_id` | UUID nullable | Owning department if applicable |
| `title` | string | Meeting name |
| `meeting_type` | enum nullable | `board`, `weekly`, `daily`, `one_on_one`, `performance`, etc. |
| `cadence_rule` | string nullable | Recurrence rule or business label |
| `scheduled_start_at` | datetime nullable | Concrete next occurrence |
| `scheduled_end_at` | datetime nullable | Concrete end time |
| `duration_minutes` | integer nullable | Easier analytics |
| `status` | enum | `planned`, `completed`, `cancelled` |
| `owner_employee_id` | UUID nullable | Organizer/owner |
| `notes` | text nullable | Optional summary |
| `created_at` | datetime | Timestamp |
| `updated_at` | datetime | Timestamp |
| `archived_at` | datetime nullable | Soft deletion |

### Relationships

- belongs to one company
- may belong to one department
- may be owned by one employee
- has many meeting participants through a join table
- may generate many tasks or action items

### Future Scalability Considerations

- as of v0.4, the prototype already separates `meetingTemplates` (recurring definitions) from `meetingOccurrences` (concrete dated instances) — the remaining gap to this target model is mainly normalization (UUIDs, `company_id`, soft deletion) rather than the template/occurrence split itself
- attendance and notes are first-class fields on `meetingOccurrences`; decisions are a first-class `meetingDecisions` collection; action items are the existing `tasks` collection filtered by `source = 'meeting'` rather than a distinct table — matching the "Task" relationship described above

### Supporting Child Entity: Meeting Participant

Purpose: many-to-many relationship between meetings and employees.

Suggested fields:

- `id`
- `meeting_id`
- `employee_id`
- `participant_role` such as `owner`, `required`, `optional`
- `attendance_status` nullable
- `created_at`

### Supporting Child Entity: Meeting Template

Purpose: optional future entity for recurring meeting blueprints.

Suggested fields:

- `id`
- `company_id`
- `department_id`
- `title`
- `cadence_rule`
- `default_duration_minutes`
- `owner_employee_id`

---

## 8. KPI Definition

### Purpose
Defines what should be measured in the company, department, or employee scope.

### Fields

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `company_id` | UUID | Foreign key to company |
| `department_id` | UUID nullable | Department-level KPI if applicable |
| `employee_id` | UUID nullable | Employee-specific KPI if applicable |
| `name` | string | KPI title |
| `description` | text nullable | What it measures |
| `unit` | string | Example: `%`, `TRY`, `count`, `days` |
| `direction` | enum | `higher_is_better`, `lower_is_better`, `target_is_best` |
| `target_value` | decimal nullable | Default target |
| `warning_threshold` | decimal nullable | Early warning threshold |
| `critical_threshold` | decimal nullable | Critical threshold |
| `measurement_frequency` | enum nullable | `daily`, `weekly`, `monthly`, `quarterly` |
| `status` | enum | `active`, `inactive` |
| `created_at` | datetime | Timestamp |
| `updated_at` | datetime | Timestamp |

### Relationships

- belongs to one company
- may belong to one department
- may belong to one employee
- has many KPI values over time

### Future Scalability Considerations

- KPI definitions should be reusable templates
- the same KPI may exist at company, department, and employee levels
- consultant-driven benchmark libraries may later be shared across tenants but instantiated per company

### Current Prototype Status (v0.6)

`state.kpiDefinitions` implements company- and department-level KPIs (`departmentId` nullable
= company-wide). Employee-level KPIs are not modeled — no v0.6 screen asks for them, and adding
the scope now would be speculative. `status` is `active`/`inactive` as specified; no `company_id`
(single-tenant prototype, consistent with every other entity).

---

## 9. KPI Value

### Purpose
Stores actual measured KPI data points over time.

### Fields

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `kpi_definition_id` | UUID | Foreign key to KPI definition |
| `company_id` | UUID | Foreign key for efficient tenant filtering |
| `department_id` | UUID nullable | Snapshot context |
| `employee_id` | UUID nullable | Snapshot context |
| `period_start` | date | Measurement period start |
| `period_end` | date | Measurement period end |
| `actual_value` | decimal | Measured result |
| `target_value_snapshot` | decimal nullable | Copy of target at measurement time |
| `status` | enum | `on_track`, `warning`, `critical`, `unknown` |
| `entered_by_user_id` | UUID nullable | Manual entry ownership |
| `entered_at` | datetime | Timestamp |
| `notes` | text nullable | Optional explanation |

### Relationships

- belongs to one KPI definition
- belongs to one company
- may belong to one department
- may belong to one employee
- may be entered by one user

### Future Scalability Considerations

- KPI history should be append-only where possible
- target snapshots are important because targets can change over time
- this table will likely power dashboards, alerts, and advisor reports

### Current Prototype Status (v0.6)

`state.kpiValues` does **not** store `status` or `target_value_snapshot` — both are computed at
render time (`kpiStatus()` in `helpers.js`) from the value plus the KPI definition's *current*
thresholds, per the Performance Guidelines rule against storing derived values. This means a
past value's displayed status can change if someone edits the definition's thresholds later —
accepted as a deliberate tradeoff for the prototype phase; a production system would want the
snapshot precisely to avoid this. `department_id`/`employee_id` are not stored on the value
either — both are reachable via `kpi_definition_id` → definition → `departmentId`.

A new `KPIAlert` entity (`state.kpiAlerts`) was added, matching the blueprint's Key Data Entity
list: `{ id, kpiDefinitionId, kpiValueId, severity, createdAt }`, appended whenever a new value
crosses its warning/critical threshold. Surfaced as a "Recent Alerts" list on Company Overview —
there is no Notification Center to push it through (see Meetings/Execution audit notes for the
same gap).

---

## 10. Goal

### Purpose
Tracks a company- or department-level objective with a target date and a check-in history,
without the overhead of a full OKR framework (see `PRODUCT_BLUEPRINT_V2.md` §5.6's architectural
decision to use Goals instead of `Objective → KeyResult → KeyResultCheckIn`).

### Fields

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `company_id` | UUID | Foreign key to company |
| `title` | string | Goal title |
| `owner_employee_id` | UUID nullable | Person accountable for the goal |
| `department_id` | UUID nullable | Null = company-level goal |
| `target_date` | date nullable | When the goal should be reached |
| `status` | enum | `on_track`, `at_risk`, `achieved`, `missed` |
| `created_at` | datetime | Timestamp |
| `updated_at` | datetime | Timestamp |

### Relationships

- belongs to one company
- may belong to one department
- may have one owner employee
- has many check-ins

### Supporting Child Entity: Goal Check-In

Purpose: a dated note recording progress against a goal, embedded on the goal record rather than
a separate top-level table — always scoped to exactly one goal and never queried across goals
(same reasoning applied to Meeting agenda items in the v0.4 prototype).

Suggested fields: `id`, `goal_id`, `date`, `note`, `author_employee_id`.

### Current Prototype Status (v0.6)

`state.goals[].checkIns` is an embedded array, not a separate `state` collection — this is a
deliberate prototype simplification consistent with how `meetingOccurrences[].agendaItems` was
handled in v0.4, not an oversight.

---

## 11. Employee Scorecard

### Purpose
Represents a quarterly (or configurable) performance review of one employee — see the
"Employee Scorecard Process" in `PRODUCT_BLUEPRINT_V2.md` §5.6 for the full workflow.

### Fields

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `company_id` | UUID | Foreign key to company |
| `employee_id` | UUID | The person being reviewed |
| `reviewer_employee_id` | UUID | The manager conducting the review |
| `period` | string | e.g. `2026-Q3` |
| `status` | enum | `not_started`, `in_progress`, `shared`, `completed` |
| `qualitative_notes` | text nullable | Written by the reviewer |
| `self_assessment` | text nullable | Written by the employee, optional |
| `created_at` | datetime | Timestamp |
| `updated_at` | datetime | Timestamp |

### Relationships

- belongs to one company
- belongs to one employee (subject)
- belongs to one employee (reviewer)

### Current Prototype Status (v0.6)

**`kpi_attainment`, `task_completion_rate`, and `meeting_attendance_rate` are intentionally not
fields on this entity.** The blueprint describes them as "auto-pulled"/"auto-calculated," so they
are computed at render time (`taskCompletionRate()`, `meetingAttendanceRate()`,
`departmentKpiOnTrackRate()` in `helpers.js`) rather than stored, per Performance Guidelines §14.

**Meeting attendance rate is an approximation, not real data.** `meetingOccurrences` only track
who was *invited* (`participantIds`), not who actually showed up — there is no attendance-taking
feature anywhere in the app. `meetingAttendanceRate()` currently treats every invited participant
of a `completed` occurrence as having attended. If real attendance-taking is added to the
Meetings module in a future sprint, this function needs a follow-up pass — flagging that here so
it isn't forgotten.

No separate `ScorecardReviewCycle` entity — the review cycle is just the `period` string plus
`state.company.scorecardFrequency` (added in v0.6, Owner-configurable in Settings). A dedicated
entity would be over-engineering for what is currently one config value with no other behavior
attached to it.

---

## 12. Document

### Purpose
A structured company document (template, report, contract, or reference material) with a
version history — see `PRODUCT_BLUEPRINT_V2.md` §5.7.

### Fields

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `company_id` | UUID | Foreign key to company |
| `title` | string | Document title |
| `category` | enum | `template`, `report`, `contract`, `reference` |
| `department_id` | UUID nullable | Owning department, if any |
| `owner_user_id` | UUID | The employee who owns the document |
| `body` | text | Current content |
| `updated_at` | datetime | Timestamp of the latest version |

### Relationships

- belongs to one company
- may belong to one department
- belongs to one owner (employee)
- has many `DocumentVersion` records

### Supporting Child Entity: Document Version

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `document_id` | UUID | Foreign key to document |
| `version_number` | integer | Sequential, starts at 1 |
| `body` | text | Snapshot of content at this version |
| `note` | text nullable | Optional note describing the change |
| `updated_by_user_id` | UUID | Who created this version |
| `updated_at` | datetime | Timestamp |

### Current Prototype Status (v0.7)

**No binary file storage.** There is no object storage until v0.9 (see Cloud Architecture
§10 in `PRODUCT_BLUEPRINT_V2.md`), and storing base64 file blobs in `localStorage` would risk
quota errors and violate the "keep state lean" rule in `ENGINEERING_GUIDE.md` §14. A Document is
therefore a structured text record, not a file upload. "Download current version" exports `body`
as a `.txt` file via `Blob` + `<a download>` — the same zero-dependency pattern used for CSV
export in v0.6. Real binary upload/versioned object storage remains deferred to v0.9.

`versions` is stored as an embedded array on the document record rather than a separate top-level
collection — it is always accessed through its parent document, never independently, so a child
array keeps the prototype simple without losing the version-history requirement.

---

## 13. Policy

### Purpose
A structured, versioned policy statement, organized by category — see `PRODUCT_BLUEPRINT_V2.md`
§5.7. Policies may originate manually or be promoted from a recorded meeting decision.

### Fields

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `company_id` | UUID | Foreign key to company |
| `title` | string | Policy title |
| `category` | enum | `hr`, `financial`, `operational`, `family` |
| `body` | text | Current policy text |
| `effective_date` | date nullable | When the policy takes effect |
| `owner_user_id` | UUID nullable | Policy owner |
| `status` | enum | `draft`, `active`, `archived` |
| `source` | enum | `manual`, `meeting_decision` |
| `source_id` | UUID nullable | The `MeetingDecision` id, if promoted |
| `updated_at` | datetime | Timestamp of the latest version |

### Relationships

- belongs to one company
- may belong to one owner (employee)
- may reference one `MeetingDecision` (if `source = 'meeting_decision'`)
- has many `PolicyVersion` records (embedded, same rationale as `DocumentVersion` above)

### Current Prototype Status (v0.7)

**`family` category visibility is enforced at render time, not by a distinct Family Governance
module** (that module doesn't exist yet — v0.3 shipped Role Profiles only, see the v0.3 sprint
audit note pattern). `renderPolicyDetail()` and `visiblePolicies()` in `helpers.js` filter
`category === 'family'` to the `patron` role only, matching the blueprint's family-governance
visibility rule without requiring the full Family Governance data model.

**Promote to Policy** (`openPromoteToPolicyModal()` / `savePromotedPolicy()` in
`js/render/knowledge.js`, invoked from the Decisions Log in `js/render/meetings.js`) completes the
stub shipped in v0.4.8: it creates a `draft` Policy with `source = 'meeting_decision'` and
`source_id` set to the originating `MeetingDecision.id`. The user still explicitly publishes it
from the Policy Detail screen — nothing is auto-published.

---

## 14. Handbook Section

### Purpose
One of five fixed sections of the Company Handbook — see `PRODUCT_BLUEPRINT_V2.md` §5.7.

### Fields

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `company_id` | UUID | Foreign key to company |
| `key` | enum | `about`, `org_structure`, `how_we_work`, `policies`, `standards` |
| `title` | string | Section heading |
| `body` | text | Section content |
| `updated_at` | datetime nullable | Timestamp |
| `updated_by_user_id` | UUID nullable | Last editor |

### Relationships

- belongs to one company

### Current Prototype Status (v0.7)

A closed set of 5 seeded records, not user-creatable or deletable — matching the blueprint's "Sections are plain-text documents, not a CMS" note. IDs are fixed (`hb-about`, `hb-org-structure`,
…) rather than `genId()`-generated, since the set never grows. `loadState()` backfills all 5 with
empty bodies for existing users who don't have them yet, preserving any other data already in
their `localStorage`.

---

## 15. Meeting Summary

### Purpose
The AI-generated (see prototype status below) summary of a completed meeting: key points,
extracted decisions, and extracted action items — see `PRODUCT_BLUEPRINT_V2.md` §5.7 and Data
Flow 3.

### Fields

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `occurrence_id` | UUID | Foreign key to the `MeetingOccurrence` (one-to-one) |
| `key_points` | text[] | Bullet points summarizing the meeting |
| `decision_ids` | UUID[] | References into `meetingDecisions` |
| `action_item_ids` | UUID[] | References into `tasks` (`source = 'meeting'`) |
| `status` | enum | `draft`, `approved` |
| `generated_at` | datetime | When the draft was (re)generated |
| `approved_by_user_id` | UUID nullable | Who approved it |
| `approved_at` | datetime nullable | Timestamp |

### Relationships

- belongs to one `MeetingOccurrence`
- references many `MeetingDecision` and `Task` records (by id, not embedded)

### Current Prototype Status (v0.7)

**Not LLM-generated.** The prototype has no backend and therefore nowhere to safely hold an
LLM provider API key or make a server-side call (see `ENGINEERING_GUIDE.md` §1 — the API layer
doesn't exist until v0.9). `generateMeetingSummary()` in `helpers.js` deterministically derives
`key_points` from the occurrence's agenda item titles plus its notes field, `decision_ids` from
existing `meetingDecisions` for that occurrence, and `action_item_ids` from existing `tasks` with
`source = 'meeting'` for that occurrence. This is disclosed to the user in-product (`notice_ai_stub`
i18n key, shown on the review modal) rather than presented as a real LLM output. Real LLM
generation is deferred until a backend exists (v0.9) or AI Settings adds provider configuration
(v0.8), whichever lands first.

The summary is generated lazily the first time "Generate Summary" is clicked on a completed
meeting (`openMeetingSummaryModal()` in `js/render/knowledge.js`), not automatically on
completion — there is no background job runner in the prototype to do this without a user action
triggering it.

---

## 16. AIInsight

### Purpose
A structured, rule-based signal surfaced from operating data: a governance gap, a KPI
anomaly, an execution-health problem, or a scorecard-completion gap — see
`PRODUCT_BLUEPRINT_V2.md` §5.8.

### Fields (conceptual — not a stored entity, see prototype status)

| Field | Type | Notes |
|---|---|---|
| `id` | string | Deterministic, not `genId()`-generated — e.g. `ai-gov-{employee_id}`, `ai-kpi-{kpi_definition_id}` |
| `type` | enum | `governance_gap`, `kpi_anomaly`, `execution_health`, `scorecard_completion` |
| `severity` | enum | `info`, `warning`, `critical` |
| `title` | text | Human-readable description |
| `department_id` | UUID nullable | For role-scoping to a manager |
| `source_id` | UUID | The employee/KPI-definition/department id the insight is about |
| `recommended_action` | object | `{ title, assignee_id, task_source_type }` — the concrete action a user can convert to a `Task` |

### Current Prototype Status (v0.8)

**Not a stored entity — computed live on every call to `computeAIInsights()` in `helpers.js`.**
This is a deliberate architecture decision, not an oversight: an insight's content (its title,
severity, recommended action) is entirely derivable from data that already lives in `roleCards`,
`kpiAlerts`, `tasks`, and `scorecards`. Storing it as a persisted, mutable record would mean
keeping a second copy of derived data in sync with its source — exactly what the Performance
Guidelines rule in `ENGINEERING_GUIDE.md` §14 warns against (the same reasoning that already kept
KPI `status` and `target_value_snapshot` out of `KPIValue` in v0.6).

The one thing that genuinely needs to persist is **which insights a user has dismissed** — that's
a real user action, not derivable from anything else. It's tracked as a flat array of insight ids,
`state.dismissedInsightIds`, rather than a `dismissed` flag on a stored insight record. Since every
insight's id is deterministic (built from the type + the entity it's about), the same underlying
condition always produces the same id across recomputation, so dismissal correctly survives reloads
without needing to store the insight itself.

**Convert-to-task tracking needs no storage at all.** Whether an insight has already been converted
is answered by checking `state.tasks.some(t => t.source_id === insight.id)` — since converting an
insight creates a `Task` with `source_id` set to the insight's id, the task list itself is the
source of truth. No separate "converted" flag or `SuggestedAction` collection exists.

**Role scoping:** `visibleAIInsights(user)` returns the full company-wide set for `patron` and a
department-filtered subset for `mudur` (no insights for `calisan`) — matches the blueprint's
Owner-Full / GM-Read / Manager-none access split as closely as this codebase's 3-role model allows
(see the `mudur` role-mapping precedent already established in the Knowledge module's `v0.7`
family-policy visibility rule).

---

## 17. SuggestedAction

### Purpose
The blueprint's `SuggestedAction` entity — "actionable recommendations generated from risk
signals... can be converted to a Task in Execution with one click" (§5.8).

### Current Prototype Status (v0.8)

**Also not a stored entity.** Every `AIInsight` already carries its own `recommended_action` object
(see above) — there is exactly one recommended action per insight, generated deterministically at
the same time as the insight itself, so a separate `SuggestedAction` collection would just be a
1:1 shadow of `AIInsight` with no independent data. The "Suggested Actions" screen in
`js/render/aiAdvisor.js` renders the same `visibleAIInsights(user)` list as the Insights screen,
just with the recommended-action panel and the "Convert to Task" button surfaced instead of the
dismiss button.

**Per-insight-type recommended actions:**

| Insight type | Recommended action | Assignee | Task `source_type` |
|---|---|---|---|
| `governance_gap` | Complete role profile for `{employee}` | Employee's manager (Owner if none) | `governance` |
| `kpi_anomaly` | Address critical/warning KPI: `{kpi}` | KPI's department manager (Owner if company-wide) | `kpi` |
| `execution_health` | Follow up on task completion in `{department}` | Department manager | `governance` |
| `scorecard_completion` | Complete `{n}` scorecard reviews for `{department}` | Department manager (the reviewer) | `governance` |

This activates the `kpi` and `governance` `Task.source_type` enum values that were reserved with
no producing logic since v0.5 — exactly the gap the v0.5 and v0.6 audit notes flagged as pending.

---

## 18. AnalysisSnapshot (Company Health Brief)

### Purpose
A point-in-time executive summary combining structured signals into a readable brief — see
`PRODUCT_BLUEPRINT_V2.md` §5.8 "Company Health Brief."

### Fields

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `generated_at` | datetime | Timestamp |
| `improved` | text[] | Positive changes found (KPIs recovered, goals achieved) |
| `declined` | text[] | Open insight titles at generation time |
| `biggest_risk` | text | The single highest-severity open insight |
| `biggest_improvement` | text | The single most positive change found |
| `suggested_priorities` | text[] | Top 3 uncoverted recommended actions, most severe first |
| `top_open_items` | text[] | Up to 5 open high/critical-priority tasks |
| `executive_summary` | text | A paragraph assembled by string template from the fields above |

### Current Prototype Status (v0.8)

**Unlike `AIInsight`, this genuinely is a stored, point-in-time snapshot** (`state.healthBriefs`)
— a brief reflects "what things looked like when generated," which is exactly the kind of data
that should NOT be silently recomputed later (a brief from last week should still read as it did
last week even after this week's data changes). Generated on demand via a "Regenerate" button
(`regenerateHealthBrief()` in `js/render/aiAdvisor.js`) rather than automatically every Monday —
there is no background job scheduler in a browser-only prototype to run a weekly job. `improved`
detection is intentionally narrow (KPIs that both have alert history and are currently `on_track`,
goals with `status = 'achieved'`) rather than a general time-series diff, since the prototype
doesn't keep enough historical snapshots to compute a broader "what improved" comparison
correctly. `executive_summary` is a plain string template (`brief_executive_summary` i18n key)
filled in from the other computed fields — no LLM involved, matching the blueprint's own note that
this screen is "generated by structured analysis — not LLM prose in v0.8."

---

## 19. AssistantQuery

### Purpose
A log of Executive Assistant questions asked and their answers — see `PRODUCT_BLUEPRINT_V2.md`
§5.8 "Executive Assistant."

### Fields

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `template_key` | string | Which of the 14 fixed question templates was asked |
| `question_text` | text | The rendered question label at ask time |
| `answer_text` | text | The rule-based answer |
| `asked_by_user_id` | UUID | Who asked |
| `department_scope` | UUID nullable | The asking user's department, for audit context |
| `asked_at` | datetime | Timestamp |

### Current Prototype Status (v0.8)

**Simplified from the blueprint's `AssistantSession → AssistantQuery → AssistantResponse`
three-entity chain to one flat entity.** There is no actual conversational LLM here — each
question is independent, stateless, and always produces the same answer for the same underlying
data (see `ASSISTANT_QUESTIONS` and `answerAssistantQuestion()` in `helpers.js`), so a "session"
grouping multiple queries into a conversation thread has nothing real to represent. This is the
same kind of simplification as v0.4.1 collapsing the meeting hierarchy from three levels to two
when the extra level added no behavior — removing an entity that doesn't earn its complexity.

**14 rule-based question templates**, all answerable from existing state with no LLM call: overdue
tasks, underperforming departments, critical KPIs, at-risk goals, meetings with unresolved action
items, employees with overdue tasks, what changed this week, recently updated policies,
departments missing scorecards, today's priority risks, missing role profiles, decisions in the
last 30 days, the employee with the most overdue tasks, and the current user's own open action
items. Answers are department-scoped for `mudur` (via `scopedEmployees()`/`scopedDepartments()`
in `helpers.js`) and company-wide for `patron`, matching the same role-scoping pattern used
throughout Execution and Performance.

---

## 20. AISettings

### Purpose
Company-level configuration for the AI module: LLM provider selection and per-feature toggles —
see `PRODUCT_BLUEPRINT_V2.md` §5.9 "AI Settings."

### Fields

| Field | Type | Notes |
|---|---|---|
| `llm_provider` | string | Currently only `"anthropic"`; **inert** — see prototype status |
| `features_enabled` | object | `{ insights, suggested_actions, role_profile_drafter, executive_assistant, health_brief }`, all boolean |

### Current Prototype Status (v0.8)

Not a per-user or per-department setting — a single company-level object (`state.aiSettings`),
consistent with this prototype's single-tenant assumption used everywhere else (`state.company`).
**The provider selector is visible but `disabled`** in the Settings screen, labeled "LLM Provider
(Available in v0.9)" — there's no backend integration point for it to actually configure yet (same
gap as the Meeting Summarizer and Role Profile Drafter). **The feature toggles are fully
functional**: `featuresEnabled.insights` gates `computeAIInsights()` itself (returns an empty list
when off, which cascades to Suggested Actions, the Dashboard widget, and the Health Brief since
they all consume the same function); the other four toggles gate their respective screens/buttons
independently.

---

## Recommended Relationship Summary

### Core Tenancy

- `Company 1 -> many Departments`
- `Company 1 -> many Employees`
- `Company 1 -> many PositionCards`
- `Company 1 -> many Tasks`
- `Company 1 -> many Meetings`
- `Company 1 -> many KpiDefinitions`
- `Company 1 -> many KpiValues`

### Organization

- `Department 1 -> many Employees`
- `Employee 1 -> many Employees` through `manager_employee_id`

### Role Definition

- `Employee 1 -> many PositionCards` over time
- `PositionCard 1 -> many PositionCardDuties`
- `PositionCard 1 -> many PositionCardCollaborations`

### Execution

- `Employee 1 -> many Tasks`
- `Meeting many <-> many Employee` through `MeetingParticipant`
- `Meeting 1 -> many Tasks` for action items

### Measurement

- `KpiDefinition 1 -> many KpiValues`
- KPI definitions may be scoped to company, department, or employee

---

## Fields That Should Be Removed From the Long-Term Domain Model

These are acceptable in the prototype but should not remain as-is in production architecture:

- plain text `password` on user records
- mixed multilingual object values directly in domain rows for all business data
- `roleCards` stored as a key-value object by employee id
- local-only persistence as the source of truth

---

## Suggested Naming for a Production Backend

- `companies`
- `departments`
- `employees`
- `user_accounts`
- `position_cards`
- `position_card_duties`
- `position_card_collaborations`
- `tasks`
- `meetings`
- `meeting_participants`
- `meeting_templates`
- `meeting_decisions`
- `kpi_definitions`
- `kpi_values`
- `kpi_alerts`
- `goals`
- `goal_check_ins`
- `employee_scorecards`

---

## Final Recommendation

The current prototype is a good phase-one UI demonstration, but the future SaaS should treat:

- authentication
- company tenancy
- organization structure
- role definition
- operational execution
- performance measurement

as separate layers in the data model.

The most important architectural move is to stop treating `app.js` state as a single app object and instead define first-class entities with stable IDs, explicit foreign keys, history support, and tenant boundaries.
