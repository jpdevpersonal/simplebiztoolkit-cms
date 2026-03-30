-- Menu layout settings for admin-driven top-level navigation ordering
-- Target: SQL Server

IF OBJECT_ID(N'dbo.MenuLayoutSettings', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.MenuLayoutSettings
  (
    Id uniqueidentifier NOT NULL
      CONSTRAINT PK_MenuLayoutSettings PRIMARY KEY
      DEFAULT NEWSEQUENTIALID(),

    MenuKey nvarchar(100) NOT NULL
      CONSTRAINT UQ_MenuLayoutSettings_MenuKey UNIQUE,

    OrderedMenuItemIds nvarchar(max) NOT NULL
      CONSTRAINT CK_MenuLayoutSettings_OrderedMenuItemIds_IsJson
      CHECK (ISJSON(OrderedMenuItemIds) = 1),

    IsActive bit NOT NULL
      CONSTRAINT DF_MenuLayoutSettings_IsActive DEFAULT (1),

    Version int NOT NULL
      CONSTRAINT DF_MenuLayoutSettings_Version DEFAULT (1),

    CreatedAt datetime2(3) NOT NULL
      CONSTRAINT DF_MenuLayoutSettings_CreatedAt DEFAULT SYSUTCDATETIME(),

    UpdatedAt datetime2(3) NOT NULL
      CONSTRAINT DF_MenuLayoutSettings_UpdatedAt DEFAULT SYSUTCDATETIME(),

    UpdatedBy nvarchar(320) NULL
  );
END;
GO

IF NOT EXISTS (
  SELECT 1
  FROM dbo.MenuLayoutSettings
  WHERE MenuKey = N'primary'
)
BEGIN
  INSERT INTO dbo.MenuLayoutSettings
  (
    MenuKey,
    OrderedMenuItemIds,
    IsActive,
    Version,
    UpdatedBy
  )
  VALUES
  (
    N'primary',
    N'[]',
    1,
    1,
    SYSTEM_USER
  );
END;
GO
