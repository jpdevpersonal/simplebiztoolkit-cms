# GPT Prompt — Generate FAQs feature for `simplebiztoolkit-api`

Paste the prompt below into your AI coding assistant while the
[`simplebiztoolkit-api`](https://github.com/jpdevpersonal/simplebiztoolkit-api)
repository is open. It assumes the existing patterns used for the Products
feature (Models, Data/AppDbContext, Dtos, Services, Controllers, Migrations).

---

## PROMPT — copy from here

You are working in the `simplebiztoolkit-api` ASP.NET Core / EF Core repository.
Implement a complete **FAQs** feature that mirrors the conventions already used
for the **Products** feature. Do not deviate from the existing patterns — match
naming, folder layout, DI registration, JSON envelope, authorization, and
revalidation webhook usage exactly.

### Goal

Expose a public `GET /api/faqs` endpoint and an authorized admin CRUD surface
under `/api/admin/faqs` that backs the Next.js CMS public `/faq` page and a new
CMS admin section. The Next.js client expects every successful response to be
wrapped in a `{ "data": ... }` envelope, and FAQ JSON fields must use the
short keys `q` and `a` (not `question`/`answer`) so they match the existing
frontend `Faq` type.

### Data shape (must match exactly)

The Next.js client uses this TypeScript type:

```ts
export interface Faq {
  id: string;            // GUID
  q: string;             // question (max 500 chars)
  a: string;             // answer as sanitized HTML (nvarchar(max))
  group?: string;        // optional grouping label (max 200 chars)
  sortOrder: number;     // int, default 0
  status: "draft" | "published";
}
```

A `FaqInput` (create/update payload) uses the same JSON keys with all fields
optional except `q` and `a` on create.

### Tasks

1. **Model** — `Models/Faq.cs`
   - `Id` (Guid, primary key, default `Guid.NewGuid()`).
   - `Question` (string, required, max length 500).
   - `Answer` (string, required, stored as `nvarchar(max)`).
   - `Group` (string, nullable, max length 200).
   - `SortOrder` (int, default 0).
   - `Status` (string, max length 20, default `"draft"`, allowed values
     `draft` | `published`).
   - `CreatedUtc` (DateTime, default `DateTime.UtcNow`).
   - `UpdatedUtc` (DateTime, default `DateTime.UtcNow`).

2. **DbContext** — extend `Data/AppDbContext.cs`
   - Add `public DbSet<Faq> Faqs { get; set; }`.
   - In `OnModelCreating`, configure the `Faq` entity:
     - `HasKey(f => f.Id)`.
     - `Property(Question).IsRequired().HasMaxLength(500)`.
     - `Property(Answer).IsRequired()` (no length = `nvarchar(max)`).
     - `Property(Group).HasMaxLength(200)`.
     - `Property(Status).IsRequired().HasMaxLength(20).HasDefaultValue("draft")`.
     - `Property(SortOrder).HasDefaultValue(0)`.
     - `Property(CreatedUtc).HasDefaultValueSql("SYSUTCDATETIME()")`.
     - `Property(UpdatedUtc).HasDefaultValueSql("SYSUTCDATETIME()")`.
     - `HasIndex(f => new { f.Group, f.SortOrder })` named `IX_Faqs_Group_SortOrder`.
   - Do **not** seed data here — seeding is handled by a separate SQL script run
     against the database.

3. **DTOs** — `Dtos/FaqDto.cs` and `Dtos/FaqInputDto.cs`
   - `FaqDto` shape:
     ```csharp
     public sealed class FaqDto
     {
         public Guid Id { get; init; }
         [JsonPropertyName("q")] public string Q { get; init; } = string.Empty;
         [JsonPropertyName("a")] public string A { get; init; } = string.Empty;
         [JsonPropertyName("group")] public string? Group { get; init; }
         [JsonPropertyName("sortOrder")] public int SortOrder { get; init; }
         [JsonPropertyName("status")] public string Status { get; init; } = "draft";
     }
     ```
   - `FaqInputDto` mirrors `FaqDto` but:
     - No `Id`.
     - `Q` and `A` required (DataAnnotations `[Required]`, `[MaxLength(500)]` on Q).
     - `Group` optional (`[MaxLength(200)]`).
     - `SortOrder` optional (default 0).
     - `Status` optional (default `"draft"`); validate value is `draft` or `published`.

4. **Service** — `Services/IFaqService.cs` and `Services/FaqService.cs`
   - Methods:
     - `Task<IReadOnlyList<FaqDto>> GetPublishedAsync(CancellationToken ct)`
     - `Task<IReadOnlyList<FaqDto>> GetAllAsync(CancellationToken ct)`
     - `Task<FaqDto?> GetByIdAsync(Guid id, CancellationToken ct)`
     - `Task<FaqDto> CreateAsync(FaqInputDto input, CancellationToken ct)`
     - `Task<FaqDto?> UpdateAsync(Guid id, FaqInputDto input, CancellationToken ct)`
     - `Task<bool> DeleteAsync(Guid id, CancellationToken ct)`
   - Ordering: always `OrderBy(f => f.Group ?? "").ThenBy(f => f.SortOrder).ThenBy(f => f.Id)`.
   - `CreateAsync` / `UpdateAsync` must set `UpdatedUtc = DateTime.UtcNow` and
     trim `Question` / `Group`.
   - Register `IFaqService` → `FaqService` as scoped in `Program.cs` alongside
     the existing service registrations.

5. **Controllers**
   - `Controllers/FaqsController.cs` (public)
     - Route `[Route("api/faqs")]`.
     - `[HttpGet]` returns `{ data = await _service.GetPublishedAsync(ct) }`.
     - Allow anonymous.
   - `Controllers/AdminFaqsController.cs` (admin)
     - Route `[Route("api/admin/faqs")]`.
     - `[Authorize]` matching the existing admin controllers.
     - `[HttpGet]` → all FAQs (drafts included) wrapped in `{ data }`.
     - `[HttpGet("{id:guid}")]` → single FAQ or 404 ProblemDetails.
     - `[HttpPost]` → create, returns `201` with `{ data }` and `Location` header.
     - `[HttpPut("{id:guid}")]` → update, returns `200 { data }` or 404.
     - `[HttpDelete("{id:guid}")]` → returns `204` or 404.
   - After every successful write (POST/PUT/DELETE), call the existing
     revalidation webhook helper used by Products with body
     `{ "type": "faq" }` so the Next.js CMS purges `/faq` and the `faqs` cache
     tag. If the helper is named differently, reuse the same implementation
     pattern — do not invent a new one.
   - All errors must use `Results.Problem(...)` / `ProblemDetails` consistent
     with existing controllers.

6. **Migration**
   - Run `dotnet ef migrations add AddFaqs` in `Migrations/` so the EF schema
     matches the SQL script (the SQL script will be applied manually in
     production; the migration exists for local/dev parity).
   - Verify generated SQL contains the table, defaults, and
     `IX_Faqs_Group_SortOrder` index.

7. **Build & verify**
   - `dotnet build` succeeds with zero warnings introduced by these changes.
   - Existing tests still pass (`dotnet test`).
   - Add a minimal unit test in `tests/simplebiztoolkit-api.Tests` covering
     `FaqService.GetPublishedAsync` filters out drafts and orders by
     `Group, SortOrder` (use an in-memory SQLite or InMemory provider matching
     existing test conventions).

### Output

When done, summarize:
- New / changed files with relative paths.
- The `dotnet build` and `dotnet test` results.
- The exact request/response samples for `GET /api/faqs`, `POST /api/admin/faqs`,
  and `PUT /api/admin/faqs/{id}` to confirm the `{ "data": { … "q": …, "a": … } }`
  envelope is correct.

Do not change any unrelated files. Do not modify existing Products, Pages,
Menu, or Auth code.

## END PROMPT
