/* =====================================================================
   FAQs table — schema + initial seed
   ---------------------------------------------------------------------
   Target:        Azure SQL Database (Basic tier)
   Run with:      SQL Server Management Studio (SSMS) against the target DB
   Idempotent:    Safe to run repeatedly. The table is only created if it
                  does not already exist, and seed rows are only inserted
                  when the table is empty.
   Notes:
     * Answers are stored as sanitized HTML. Existing answers are wrapped
       in <p>...</p> so they render consistently in the public accordion.
     * "Group" is a reserved word in T-SQL, so it is quoted with [Group].
     * SortOrder is per-group; the public page orders by ([Group], SortOrder).
   ===================================================================== */

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

BEGIN TRANSACTION;
GO

/* ---- Schema -------------------------------------------------------- */

IF NOT EXISTS (
    SELECT 1 FROM sys.tables WHERE name = 'Faqs' AND schema_id = SCHEMA_ID('dbo')
)
BEGIN
    CREATE TABLE dbo.Faqs (
        Id          UNIQUEIDENTIFIER    NOT NULL CONSTRAINT DF_Faqs_Id          DEFAULT NEWID(),
        Question    NVARCHAR(500)       NOT NULL,
        Answer      NVARCHAR(MAX)       NOT NULL,
        [Group]     NVARCHAR(200)       NULL,
        SortOrder   INT                 NOT NULL CONSTRAINT DF_Faqs_SortOrder   DEFAULT (0),
        Status      NVARCHAR(20)        NOT NULL CONSTRAINT DF_Faqs_Status      DEFAULT (N'draft'),
        CreatedUtc  DATETIME2(7)        NOT NULL CONSTRAINT DF_Faqs_CreatedUtc  DEFAULT (SYSUTCDATETIME()),
        UpdatedUtc  DATETIME2(7)        NOT NULL CONSTRAINT DF_Faqs_UpdatedUtc  DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_Faqs PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT CK_Faqs_Status CHECK (Status IN (N'draft', N'published'))
    );

    PRINT 'Created table dbo.Faqs';
END
ELSE
BEGIN
    PRINT 'Table dbo.Faqs already exists - skipping CREATE TABLE';
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_Faqs_Group_SortOrder' AND object_id = OBJECT_ID('dbo.Faqs')
)
BEGIN
    CREATE INDEX IX_Faqs_Group_SortOrder ON dbo.Faqs ([Group], SortOrder);
    PRINT 'Created index IX_Faqs_Group_SortOrder';
END
GO

/* ---- Seed (only when table is empty) ------------------------------- */

IF NOT EXISTS (SELECT 1 FROM dbo.Faqs)
BEGIN
    INSERT INTO dbo.Faqs (Question, Answer, [Group], SortOrder, Status, CreatedUtc, UpdatedUtc)
    SELECT v.Question, v.Answer, v.[Group], v.SortOrder, N'published', SYSUTCDATETIME(), SYSUTCDATETIME()
    FROM (VALUES
        (N'How do I receive my files?', N'<p>All products are digital downloads delivered via Etsy after checkout. If you purchased using your Etsy account, the downloads can be found by going into your account and selecting Purchases and Reviews. You should see your items there with a Download Files button to the right.</p>', N'Getting started', 1),
        (N'How long does delivery take?', N'<p>Delivery is instant. Once Etsy confirms payment, your download links are available immediately on your Purchases and Reviews page — most customers open their first file within a minute or two.</p>', N'Getting started', 2),
        (N'Do I need an Etsy account to use the templates?', N'<p>You need an Etsy account to complete checkout and access the downloads, but you do not need an account to print or fill in the PDFs after you have saved them to your device.</p>', N'Getting started', 3),
        (N'How can I contact the seller?', N'<p>Message us directly through Etsy from the listing or your order page. See the contact page for more details. We typically reply within one business day.</p>', N'Getting started', 4),
        (N'Do I need special software?', N'<p>No. All templates work with standard PDF readers and common office tools — your web browser (Chrome, Edge, Safari, Firefox), Adobe Acrobat Reader, Apple Preview, or Microsoft Office. No subscription required.</p>', N'File formats & software', 1),
        (N'What''s the difference between a fillable PDF and a printable PDF?', N'<p>Fillable PDFs have form fields you can type into on a computer, tablet or phone using a free PDF reader — your data is saved when you save the file. Printable PDFs are designed to be printed and completed by hand. Most of our listings include both versions.</p>', N'File formats & software', 2),
        (N'Are the templates editable in Word, Pages or Google Docs?', N'<p>Our templates are designed as PDFs, not as Word/Pages/Docs files. Fillable PDFs can be typed into directly without converting. Editing the underlying design (layout, headings, branding) is not supported.</p>', N'File formats & software', 3),
        (N'Can I open the templates on iPad or iPhone?', N'<p>Yes. Open the PDF in Files, Books, Apple Preview, or any PDF reader app. Fillable forms work in most iOS PDF readers including the built-in Files app.</p>', N'File formats & software', 4),
        (N'Can I use them digitally in GoodNotes or Notability?', N'<p>Many customers use the printable templates digitally on apps such as GoodNotes — either filling them out by typing on a computer or by writing on a tablet. The fillable PDFs are designed for browsers and PDF readers rather than dedicated note-taking apps, but most work in GoodNotes if you import them as PDFs.</p>', N'File formats & software', 5),
        (N'Can I print the templates?', N'<p>Yes, absolutely. Every template is designed for clean printing on a standard home or office printer and can be reused as many times as you need.</p>', N'Printing', 1),
        (N'What paper size do the templates use?', N'<p>Both A4 and US Letter sizes are included with every listing. Choose the appropriate size at print time — no separate purchase required.</p>', N'Printing', 2),
        (N'What''s the best print setting?', N'<p>Choose ''Actual size'' (100%) in your print dialog rather than ''Fit to page'' to keep the proportions correct. Black-and-white or grayscale printing works for most templates.</p>', N'Printing', 3),
        (N'Do I need a colour printer?', N'<p>No. The templates are designed to look good in both colour and black-and-white. A standard mono laser or inkjet printer is more than enough.</p>', N'Printing', 4),
        (N'Can I add my logo or business name?', N'<p>The fillable PDFs include fields for your business name and contact details where applicable. The underlying design (fonts, layout, colour) cannot be edited because the templates are delivered as flattened PDFs.</p>', N'Customisation', 1),
        (N'Can I request a custom template?', N'<p>We don''t take custom design commissions, but we''re always interested in feedback. Message us through Etsy with your idea — popular requests get added to our roadmap.</p>', N'Customisation', 2),
        (N'Can I use the templates for my business?', N'<p>Yes. Every template is licensed for unlimited personal and business use by the buyer for a single business or shop. Print as many copies as you need, for as long as you operate that business.</p>', N'Licensing & business use', 1),
        (N'Can I share or resell the templates?', N'<p>No. The licence covers your own use only. You may not resell, redistribute, share the source PDFs, or upload them to template marketplaces or stock sites.</p>', N'Licensing & business use', 2),
        (N'Can I give a filled-in template to a client or tenant?', N'<p>Yes. Filled-in copies (such as a completed invoice, receipt or rent-payment record) can be given to clients or tenants exactly as you''d use any printed form.</p>', N'Licensing & business use', 3),
        (N'What is your refund policy?', N'<p>Because the templates are delivered instantly as digital files, all sales are final per Etsy''s policy on digital downloads. If you received the wrong file, or there''s a download problem, message us through Etsy and we''ll fix it straight away.</p>', N'Refunds & support', 1),
        (N'I can''t find my download — where do I look?', N'<p>Sign in to Etsy, open your Purchases and Reviews page, find the order, and click the Download Files button. If you checked out as a guest, Etsy sends a download link to the email address you used at checkout.</p>', N'Refunds & support', 2),
        (N'The PDF won''t open — what should I do?', N'<p>Try opening it in a different reader (Adobe Acrobat Reader is the most reliable). If the file is still unreadable, message us through Etsy and we''ll send a fresh copy at no cost.</p>', N'Refunds & support', 3),
        (N'Will I be charged again if I lose the file?', N'<p>No. Your purchase stays on your Etsy account permanently and you can re-download the files at any time from your Purchases and Reviews page.</p>', N'Refunds & support', 4),
        (N'Who are the templates for?', N'<p>Small business owners, online sellers, freelancers and landlords who want clean, printable forms without buying software or hiring a designer. Most templates also work well for household and personal use.</p>', N'About the templates', 1),
        (N'Why printable PDFs and not an app?', N'<p>Printables work offline, never expire, don''t require an account, and don''t change the way your business runs. They are also low-cost (typically a few pounds or dollars per design) and reusable forever.</p>', N'About the templates', 2)
    ) AS v (Question, Answer, [Group], SortOrder);

    PRINT CONCAT('Seeded ', @@ROWCOUNT, ' FAQ rows');
END
ELSE
BEGIN
    PRINT 'dbo.Faqs already contains rows - skipping seed';
END
GO

COMMIT TRANSACTION;
GO

PRINT 'FAQs schema/seed script complete';
SELECT COUNT(*) AS FaqCount FROM dbo.Faqs;
GO
