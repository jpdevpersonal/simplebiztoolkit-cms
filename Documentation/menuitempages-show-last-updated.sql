/* =====================================================================
   MenuItemPages — add ShowLastUpdated column
   ---------------------------------------------------------------------
   Target:        Azure SQL Database / SQL Server
   Run with:      SSMS against the target DB
   Idempotent:    Safe to run repeatedly. The column, default constraint
                  and backfill are each guarded.
   Notes:
     * Adds bit column ShowLastUpdated to dbo.MenuItemPages.
     * NOT NULL with DB-level default of 1 (true) so existing rows
       behave the same as before the migration.
     * Backfill statement is defensive — existing rows will already pick
       up the default, but the UPDATE catches any rows added between
       ALTER and constraint application in edge cases.
   ===================================================================== */

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

BEGIN TRANSACTION;
GO

/* ---- Add column (nullable first so backfill is unambiguous) ------- */

IF NOT EXISTS (
    SELECT 1
      FROM sys.columns
     WHERE object_id = OBJECT_ID(N'dbo.MenuItemPages')
       AND name = N'ShowLastUpdated'
)
BEGIN
    ALTER TABLE dbo.MenuItemPages
        ADD ShowLastUpdated bit NULL;
END
GO

/* ---- Backfill existing rows to 1 (true) --------------------------- */

UPDATE dbo.MenuItemPages
   SET ShowLastUpdated = 1
 WHERE ShowLastUpdated IS NULL;
GO

/* ---- Add default constraint -------------------------------------- */

IF NOT EXISTS (
    SELECT 1
      FROM sys.default_constraints
     WHERE name = N'DF_MenuItemPages_ShowLastUpdated'
)
BEGIN
    ALTER TABLE dbo.MenuItemPages
        ADD CONSTRAINT DF_MenuItemPages_ShowLastUpdated
        DEFAULT (1) FOR ShowLastUpdated;
END
GO

/* ---- Enforce NOT NULL ------------------------------------------- */

IF EXISTS (
    SELECT 1
      FROM sys.columns
     WHERE object_id = OBJECT_ID(N'dbo.MenuItemPages')
       AND name = N'ShowLastUpdated'
       AND is_nullable = 1
)
BEGIN
    ALTER TABLE dbo.MenuItemPages
        ALTER COLUMN ShowLastUpdated bit NOT NULL;
END
GO

COMMIT TRANSACTION;
GO

/* ---- Verification (optional) ------------------------------------ */
-- SELECT TOP 5 Id, Slug, Title, ShowLastUpdated FROM dbo.MenuItemPages;
