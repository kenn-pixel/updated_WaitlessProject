# Supabase Schema for WaitLess

Use the SQL in `supabase-schema.sql` to create the tables expected by the frontend.

## Expected tables

### `queue`
- `id`: `bigint` primary key
- `token`: `text`
- `name`: `text`
- `service`: `text`
- `priority`: `text`
- `wait_min`: `integer`
- `created_at`: `timestamptz`

### `appointments`
- `id`: `bigint` primary key
- `token`: `text`
- `name`: `text`
- `phone`: `text`
- `service`: `text`
- `date`: `date`
- `time`: `text`
- `status`: `text`
- `created_at`: `timestamptz`

## Usage

1. Open the Supabase SQL editor.
2. Paste the SQL from `supabase-schema.sql`.
3. Run the query to create the tables.
4. Add sample rows if needed.

## Sample data
You can also seed the tables with sample rows by running the SQL in `supabase-schema.sql` after the table creation statements.

## Notes

- The frontend currently reads from `queue` and `appointments`.
- If you rename the tables or columns, update `src/supabaseTables.js` and the dashboard page mappings.
