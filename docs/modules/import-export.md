# Church Management Tracker - Import and Export System

## Purpose and Objectives
The Import/Export module is the universal data on-ramp and off-ramp for Church Management Tracker. It enables safe, validated ingestion of data across modules and reliable export of records for analysis, reporting, and backup.

Objectives:
- Accept data in common formats with guided mapping and validation
- Provide a structured preview and quality report before committing changes
- Perform batch operations with progress tracking and safe duplicate handling
- Generate configurable templates to standardize future data collection
- Export filtered or full datasets in multiple formats for downstream use

References:
- Service capabilities: Import/Export service implementation
- Validation & data utilities: Data validation and processing service utilities

## Target Users
- Data migration operators moving legacy or external data into the system
- Administrative staff performing bulk updates or backfills
- Ministry leaders exporting datasets for offline review or reporting
- Analysts preparing data for external tools and reporting platforms

## Key Features and Capabilities
- Multi-Format Support
  - Import: Structured data formats (delimited files), with preview; extensible to spreadsheet formats
  - Export: Multiple structured data formats (delimited files, spreadsheet formats, structured text)
- Intelligent Field Mapping
  - Guided column-to-field mapping interface per target module
  - Suggested mappings and required-field validation
- Data Validation and Quality Scoring
  - Row-level validation with rule-based checks per module
  - Consolidated quality report with missing fields and issues
- Duplicate Detection and Safe Skips
  - Module-specific duplicate checks (e.g., exact phone for contacts; name/phone for members)
  - Optional skip-duplicates mode with counters and messages
- Batch Processing with Progress Tracking
  - Batched writes with current/total counters, success/error/skip counts
  - Estimated time remaining while processing
- Template Generation
  - Downloadable templates including instructions and example rows
  - Standardized headers aligned to module requirements
- Universal Operation Across Modules
  - Contacts, First Timers, Sunday Services, Central Members
  - Consistent user experience and progress model for all supported modules

## Data Structures and Fields
The Import/Export module focuses on configuration and progress models rather than record schemas. Representative structures shown here describe functional inputs and outputs.

Supported modules (examples)
- contacts
- first-timers
- sunday-services
- central-members

Import configuration (representative)
| Field | Type | Description |
|------|------|-------------|
| module | enum | Target module to import into |
| validateOnly | boolean | If true, perform validation and preview only (no writes) |
| batchSize | number | Number of rows to process per batch (default sensible value) |
| skipDuplicates | boolean | If true, detected duplicates are skipped (counted separately) |
| updateExisting | boolean | If true, existing records may be updated when matched (when supported) |

Data mapping
| Field | Type | Description |
|------|------|-------------|
| sourceColumn | string | Source column header from the data file |
| targetField | string | Destination field key in the target module |

Import preview and quality summary (representative)
| Field | Type | Description |
|------|------|-------------|
| headers | string[] | Parsed headers from source file |
| sampleRows | any[][] | A subset of data rows for preview |
| qualityReport | object | Aggregated issues, warnings, and completeness metrics |
| validationErrors | list | Row-specific validation error descriptors |

Import progress (runtime)
| Field | Type | Description |
|------|------|-------------|
| currentRecord | number | 1-based index of the currently processed row |
| totalRecords | number | Total number of rows detected |
| processedRecords | number | Number of rows processed so far |
| successfulRecords | number | Successfully imported row count |
| failedRecords | number | Rows that failed to import |
| skippedRecords | number | Rows intentionally skipped (e.g., duplicates) |
| duplicatesDetected | number | Count of duplicates encountered |
| currentStatus | string | Human-readable progress message |
| estimatedTimeRemaining | seconds | Optional ETA |
| canCancel | boolean | Indicates if the operation can be canceled |

Export configuration (representative)
| Field | Type | Description |
|------|------|-------------|
| module | enum | Source module to export from |
| format | enum | Output format: structured data formats (delimited, spreadsheet, text) |
| fields | string[] | Optional subset of fields to include |
| customFilename | string | Optional base filename for the export |

Export progress/result (representative)
| Field | Type | Description |
|------|------|-------------|
| totalRecords | number | Number of records included |
| processedRecords | number | Progress indicator during generation |
| filename | string | Generated filename |
| fileSize | number | Approximate file size (format dependent) |
| processingTime | number | Milliseconds elapsed |

Notes:
- Validation rules are module-specific to reflect required vs optional fields and accepted formats.
- Duplicate strategy varies by module, prioritizing exact phone matches for contacts and combined phone/name checks for members.

## Workflow Processes
1) Parse and Preview (Import)
- Upload a source file (structured data format) for the chosen module
- The system parses headers and a preview of rows for confirmation
- Column mapping interface aligns source headers to module fields
- A validation-only run produces a quality report and row-level errors without writing

2) Validate and Confirm (Import)
- Run full validation on all rows using module rules
- Review the quality report summarizing issues and completeness
- Optionally adjust mappings or fix source data and re-preview

3) Import with Progress (Import)
- Start the import with batch processing enabled
- Progress shows current/total, success, failed, skipped, and duplicates detected
- The operation reports a final summary with messages for any row-level exceptions

4) Duplicate Handling (Import)
- If skipDuplicates is enabled: duplicates are detected and skipped with counts and messages
- If updating existing is supported and enabled: matched records can be updated per module policy

5) Template Generation
- Choose a module and format (structured data format) and optionally include examples and instructions
- Download a structured template to standardize incoming datasets

6) Export Datasets (Export)
- Choose a module, output format, and optional field subset
- Generate a file with headers mapped to human-readable labels
- Download the result for analysis, sharing, or backup

## Integration Points with Other Modules
- Central Members
  - Member imports compute data quality, detect duplicates, and support template-driven onboarding
  - Export supports full or filtered cohorts
  - See: [`docs/modules/central-members.md`](docs/modules/central-members.md)
- First Timers
  - Bulk import from events and outreach; export for follow-up lists
  - Provides stats to dashboards on incoming volumes
  - See: [`docs/modules/first-timers.md`](docs/modules/first-timers.md)
- Sunday Service
  - Backfill historical services and attendees via structured imports
  - Export attendance histories for analysis
  - See: [`docs/modules/sunday-service.md`](docs/modules/sunday-service.md)
- Evangelism
  - Import outreach lists with inviter mapping; export filtered segments for campaigns
  - See: [`docs/modules/evangelism.md`](docs/modules/evangelism.md)
- Dashboard & Analytics
  - Uses Import/Export for standardized reporting outputs and templates
  - See: [`docs/modules/dashboard-analytics.md`](docs/modules/dashboard-analytics.md)

## Benefits and Outcomes
- Reduces friction in initial data migration and ongoing bulk updates within Church Management Tracker
- Ensures data correctness with clear validation and quality scoring
- Prevents duplicate proliferation through module-appropriate checks
- Provides transparent progress, auditability, and post-run summaries
- Standardizes data collection with downloadable templates

## Related User Guides
- [Administrative Staff Workflows](../user-guides/administrative-workflows.md) - Data import and export procedures
- [Ministry Leader Workflows](../user-guides/ministry-leader-workflows.md) - Team coordination using exports
- [Data Entry Personnel Workflows](../user-guides/data-entry-workflows.md) - Quality control procedures
- [Common Procedures](../user-guides/common-procedures.md) - Generating reports and exports

## Typical Import Journey
```mermaid
flowchart LR
A[Upload File] --> B[Map Columns]
B --> C[Validate Only]
C -->|Issues Found| B
C -->|Clean| D[Import with Progress]
D --> E[Summary + Quality Report]
```

## Typical Export Journey
```mermaid
flowchart LR
A[Select Module + Fields] --> B[Choose Format]
B --> C[Generate File]
C --> D[Download + Share]
```

## Related Documentation
- [Documentation Hub](../README.md) - Main documentation index for Church Management Tracker
- [Module Index](README.md) - Overview of all system modules
- [System Architecture](../overview/system-architecture.md) - Technical architecture overview
- [Application Overview](../overview/application-overview.md) - Getting started with Church Management Tracker