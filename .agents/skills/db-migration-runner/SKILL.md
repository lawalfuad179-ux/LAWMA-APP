# Database Migration Runner Skill

Load this skill when changing the database schema, creating a new model, adding a column, adding an index, or backfilling data. Migrations are high-risk because they are hard to undo and can take the app down if done wrong. Treat every schema change as a serious commit.

## The Stack

LAWMA Mobile App uses PostgreSQL with Prisma. The schema lives at `prisma/schema.prisma`. Migrations live at `prisma/migrations/`. The Prisma client is regenerated on every migration and imported using the `@/lib/db` alias.

## The Workflow

Schema changes always follow the same sequence:

1. Edit `prisma/schema.prisma`.
2. Run `npx prisma migrate dev --name <descriptive_name>` to generate a migration locally.
3. Read the generated SQL in `prisma/migrations/<timestamp>_<name>/migration.sql` end to end. Do not skip this.
4. Run the app locally, hit the affected pages, and confirm nothing broke.
5. Commit the schema change and the migration file together.
6. Deploy. In CI or on the deployment target, `npx prisma migrate deploy` applies the migration to production.

Never edit a migration file that has already been applied anywhere. If you need to fix a mistake, write a new migration that corrects it.

## Naming

Migrations are named in snake_case, describing the change:

- `add_resident_lga_index`
- `add_complaint_status_table`
- `add_payment_gateway_reference_index`
- `add_collection_schedule_window`

Bad names like `update_schema` or `fix_stuff` are useless when reading history.

## Naming Conventions & Schema Mapping

The database schema must follow these exact naming rules:
- **Database Tables (PostgreSQL)**: Lowercase plural snake_case (e.g., `residents`, `collection_schedules`).
- **Database Columns (PostgreSQL)**: Lowercase snake_case (e.g., `phone_number`, `created_at`).
- **Prisma Models**: PascalCase singular (e.g., `Resident`, `CollectionSchedule`).
- **Prisma Fields**: camelCase singular (e.g., `phoneNumber`, `createdAt`).

To bridge this, you **MUST** use `@map` for camelCase fields and `@@map` for models.

### Example Model Mapping:
```prisma
model Resident {
  id          String   @id @default(uuid())
  phoneNumber String   @unique @map("phone_number")
  createdAt   DateTime @default(now()) @map("created_at")

  @@map("residents")
}
```

## Common Schema Patterns

### Adding a nullable column (safe)

```prisma
model Complaint {
  // ...
  resolvedAt DateTime? @map("resolved_at")
}
```

Nullable columns are additive and safe. Existing rows just get `NULL`.

### Adding a non-nullable column (careful)

You cannot add a `NOT NULL` column to a table with existing rows without a default or a backfill. Do it in two migrations:

1. Add the column as nullable.
2. Backfill existing rows in a data migration or application code.
3. In a second migration, set the column to `NOT NULL`.

### Adding a unique constraint

Unique constraints prevent duplicate phone numbers, duplicate transaction references, and duplicate external IDs.

```prisma
model Payment {
  // ...
  gatewayReference String? @unique @map("gateway_reference")
}
```

Before adding a unique constraint to an existing column with data, make sure existing data does not already contain duplicates.

### Relational Constraints & onDelete

Always specify the relationship deletion behavior using the `@relation` attribute. Do not rely on default implicit cascade behavior.
- Use `onDelete: Restrict` (preferred) to prevent parent deletion when child records exist.
- Use `onDelete: Cascade` only for temporary sessions, tokens, or transient records.

```prisma
model Complaint {
  id         String   @id @default(uuid())
  residentId String   @map("resident_id")
  resident   Resident @relation(fields: [residentId], references: [id], onDelete: Restrict)

  @@map("complaints")
}
```

### Adding an index

Add an index when a query gets slow or when a field is a predictable lookup path.

Useful LAWMA indexes may include:

```prisma
model Complaint {
  id         String          @id @default(uuid())
  residentId String          @map("resident_id")
  status     ComplaintStatus
  lga        String
  createdAt  DateTime        @default(now()) @map("created_at")

  @@index([residentId])
  @@index([lga, status])
  @@index([createdAt])
  @@map("complaints")
}
```

Do not speculatively index every column; each index costs write performance.

### Renaming a column (dangerous)

Prisma treats a rename as a drop + add, which loses data. If you need to rename, do it manually:

1. Add the new column (nullable).
2. Backfill from the old column.
3. Deploy the app reading/writing both.
4. Switch the app to the new column.
5. Drop the old column.

## Data Migrations

Schema changes and data migrations are different. Prisma handles schema. Data migrations are regular code. If you need to backfill or transform data, write a one-off script in `scripts/` that uses the Prisma client and is invoked manually or via a deploy hook.

Do not run ad-hoc SQL against production. Use a versioned script.

## Environments & Safety

- **Development:** `npx prisma migrate dev` creates the migration and applies it locally. This can reset the DB if you confirm the prompt. Never run it against production.
- **Production:** `npx prisma migrate deploy` applies pending migrations without prompting. This is safe for production deployments.

### Data Loss Warning
If Prisma warns that a migration could result in data loss (e.g. dropping a column/table or narrowing types), **NEVER** use `--force` or `--accept-data-loss` flags in production pipelines. Always verify the migration script manually and back up database tables before applying changes.

The two commands are not interchangeable.

## Rollback

Prisma does not generate down migrations. Rolling forward by writing a new migration that reverses the change is the practical approach.

For risky changes, use the expand-contract pattern:

1. Deploy code that works against both old and new schema.
2. Run the migration.
3. Deploy code that only uses the new schema.

Use this for dropping columns, transforming money amounts, changing uniqueness constraints, and moving location-related data.

## Money Columns

Amounts are stored as integers in the smallest currency unit: kobo for NGN. Use `Int` or `BigInt`, never `Float` or `Decimal` for money amounts.

If a column holds money, its name must make the unit clear: `amountKobo`, not `amount`.

## Core LAWMA Model Guidance

Likely models include:

- `Resident`
- `Session`
- `OtpCode`
- `PspOperator`
- `ServiceArea`
- `CollectionSchedule`
- `Complaint`
- `ComplaintImage`
- `Bill`
- `Payment`
- `Notification`
- `RecyclingContent`

Do not add operational/admin-heavy models unless the feature requires them.

## Common Mistakes

- Editing a migration file after it has been applied somewhere.
- Adding a non-nullable column to an existing table without a default or backfill.
- Renaming via Prisma's default drop-and-add behavior.
- Running `prisma migrate reset` outside local development.
- Committing `schema.prisma` without the generated migration file.
- Storing money as floats.
- Adding indexes speculatively.
- Forgetting unique constraints for Flutterwave transaction references.
- Forgetting to map Prisma camelCase variables to PostgreSQL snake_case columns (`@map` / `@@map`).
- Not specifying an explicit `onDelete` restriction constraint on relations.
