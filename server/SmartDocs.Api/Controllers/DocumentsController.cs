using DocumentFormat.OpenXml.Packaging;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartDocs.Api.Data;
using SmartDocs.Api.Models;
using SmartDocs.Api.Services;
using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;

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

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var doc = await _db.Documents
            .Include(d => d.Chunks)
            .Include(d => d.Messages)
            .FirstOrDefaultAsync(d => d.Id == id && d.UserId == UserId);

        if (doc == null) return NotFound();

        // Delete physical file
        try
        {
            var filePath = Path.Combine(_env.ContentRootPath, "uploads",
                Path.GetFileName(doc.FileUrl));
            if (System.IO.File.Exists(filePath))
                System.IO.File.Delete(filePath);
        }
        catch { }

        _db.Documents.Remove(doc);
        await _db.SaveChangesAsync();
        return Ok();
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
Console.WriteLine($"DEBUG: ext={Path.GetExtension(file.FileName)}, textLength={text?.Length ?? 0}, text={text?[..Math.Min(200, text?.Length ?? 0)]}");


        var doc = new Document
        {
            Title = Path.GetFileNameWithoutExtension(file.FileName),
            FileName = file.FileName,
            FileUrl = $"/uploads/{savedName}",
            FileType = Path.GetExtension(file.FileName).TrimStart('.').ToLower(),
            ExtractedText = text,
            UserId = UserId
        };

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

    private static string ExtractText(string path, string originalFileName)
{
    var ext = Path.GetExtension(originalFileName).ToLower();
    try
    {
        if (ext == ".txt")
            return System.IO.File.ReadAllText(path);

        if (ext == ".pdf")
        {
            var sb = new System.Text.StringBuilder();
            using var pdf = UglyToad.PdfPig.PdfDocument.Open(path);
            foreach (var page in pdf.GetPages())
                sb.AppendLine(string.Join(" ", page.GetWords().Select(w => w.Text)));
            return sb.ToString();
        }

        if (ext == ".docx")
{
    var sb = new System.Text.StringBuilder();
    using var wordDoc = WordprocessingDocument.Open(path, false);
    var body = wordDoc.MainDocumentPart?.Document?.Body;
    if (body == null) return "DOCX body is null";
    foreach (var para in body.Elements<DocumentFormat.OpenXml.Wordprocessing.Paragraph>())
        sb.AppendLine(para.InnerText);
    var result = sb.ToString().Trim();
    return string.IsNullOrEmpty(result) ? "DOCX extracted but empty" : result;
}

        return string.Empty;
    }
    catch (Exception ex)
{
    return $"Extraction error ({ext}): {ex.Message}";
}
}
}