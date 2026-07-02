using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartDocs.Api.Data;
using SmartDocs.Api.Models;
using SmartDocs.Api.Services;

namespace SmartDocs.Api.Controllers;

[ApiController]
[Route("api/documents")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAiService _ai;
    private readonly IWebHostEnvironment _env;

    public DocumentsController(AppDbContext db, IAiService ai, IWebHostEnvironment env)
    {
        _db = db;
        _ai = ai;
        _env = env;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var docs = await _db.Documents
            .Where(d => d.UserId == UserId)
            .OrderByDescending(d => d.UploadedAt)
            .Select(d => new { d.Id, d.Title, d.FileType, d.Summary, d.Keywords, d.UploadedAt })
            .ToListAsync();

        return Ok(docs);
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file.Length == 0) return BadRequest("Empty file.");

        var uploadsPath = Path.Combine(_env.ContentRootPath, "uploads");
        Directory.CreateDirectory(uploadsPath);
        var savedName = $"{Guid.NewGuid()}_{file.FileName}";
        var fullPath = Path.Combine(uploadsPath, savedName);

        await using (var stream = System.IO.File.Create(fullPath))
            await file.CopyToAsync(stream);

        var text = ExtractText(fullPath, file.FileName);

        var doc = new Document
        {
            Title = Path.GetFileNameWithoutExtension(file.FileName),
            FileName = file.FileName,
            FileUrl = $"/uploads/{savedName}",
            FileType = Path.GetExtension(file.FileName).TrimStart('.').ToLower(),
            ExtractedText = text,
            UserId = UserId
        };

        // AI analysis
if (!string.IsNullOrWhiteSpace(text))
{
    try
    {
        var (summary, keywords) = await _ai.AnalyzeDocumentAsync(text);
        doc.Summary = summary;
        doc.Keywords = keywords;

        foreach (var chunk in ChunkText(text, 3000))
{
    doc.Chunks.Add(new DocumentChunk
    {
        Content = chunk,
        EmbeddingJson = "[]"
    });
}
    }
    catch (Exception ex)
    {
        doc.Summary = "AI analysis unavailable: " + ex.Message;
        doc.Keywords = "";
    }
}

        _db.Documents.Add(doc);
        await _db.SaveChangesAsync();

        return Ok(new { doc.Id, doc.Title, doc.Summary, doc.Keywords });
    }

    [HttpPost("{id}/chat")]
    public async Task<IActionResult> Chat(int id, [FromBody] string question)
    {
        var doc = await _db.Documents
            .Include(d => d.Chunks)
            .FirstOrDefaultAsync(d => d.Id == id && d.UserId == UserId);
        if (doc == null) return NotFound();

        var words = question.ToLower().Split(' ');
var topChunks = doc.Chunks
    .OrderByDescending(c => words.Count(w => c.Content.ToLower().Contains(w)))
    .Take(4)
    .Select(c => c.Content);

        var answer = await _ai.AnswerQuestionAsync(question, topChunks);

        _db.ChatMessages.Add(new ChatMessage { DocumentId = id, Role = "user", Content = question });
        _db.ChatMessages.Add(new ChatMessage { DocumentId = id, Role = "assistant", Content = answer });
        await _db.SaveChangesAsync();

        return Ok(new { answer });
    }

    private static IEnumerable<string> ChunkText(string text, int chunkSize)
    {
        for (int i = 0; i < text.Length; i += chunkSize)
            yield return text.Substring(i, Math.Min(chunkSize, text.Length - i));
    }

    private static float CosineSimilarity(float[] a, float[] b)
    {
        float dot = 0, normA = 0, normB = 0;
        for (int i = 0; i < a.Length; i++)
        {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dot / (MathF.Sqrt(normA) * MathF.Sqrt(normB) + 1e-8f);
    }

    private static string ExtractText(string path, string originalFileName)
    {
        var ext = Path.GetExtension(originalFileName).ToLower();
        try
        {
            if (ext == ".txt")
                return System.IO.File.ReadAllText(path);

            if (ext == ".pdf")
            {
                // Basic PDF text extraction - reads raw bytes and extracts readable text
                // For production, add UglyToad.PdfPig package and use PdfDocument.Open(path)
                var bytes = System.IO.File.ReadAllBytes(path);
                var raw = System.Text.Encoding.UTF8.GetString(bytes);
                // Extract text between stream markers (works for simple PDFs)
                var sb = new System.Text.StringBuilder();
                int i = 0;
                while (i < raw.Length)
                {
                    var start = raw.IndexOf("BT", i);
                    if (start < 0) break;
                    var end = raw.IndexOf("ET", start);
                    if (end < 0) break;
                    sb.Append(raw[start..end]);
                    i = end + 2;
                }
                return sb.Length > 50 ? sb.ToString() : raw[..Math.Min(raw.Length, 8000)];
            }

            // .docx: add DocumentFormat.OpenXml package for full support
            return string.Empty;
        }
        catch
        {
            return string.Empty;
        }
    }
}