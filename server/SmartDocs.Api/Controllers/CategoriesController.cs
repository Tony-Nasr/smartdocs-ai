using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartDocs.Api.Data;
using SmartDocs.Api.Models;

namespace SmartDocs.Api.Controllers;

[ApiController]
[Route("api/categories")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;
    public CategoriesController(AppDbContext db) => _db = db;

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var cats = await _db.Categories
            .Where(c => c.UserId == UserId)
            .Select(c => new { c.Id, c.Name, c.Color, Count = c.Documents.Count })
            .ToListAsync();
        return Ok(cats);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCategoryDto dto)
    {
        var cat = new Category { Name = dto.Name, Color = dto.Color, UserId = UserId };
        _db.Categories.Add(cat);
        await _db.SaveChangesAsync();
        return Ok(new { cat.Id, cat.Name, cat.Color, Count = 0 });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var cat = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id && c.UserId == UserId);
        if (cat == null) return NotFound();
        _db.Categories.Remove(cat);
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPatch("/api/documents/{docId}/category")]
    public async Task<IActionResult> AssignCategory(int docId, [FromBody] int? categoryId)
    {
        var doc = await _db.Documents.FirstOrDefaultAsync(d => d.Id == docId && d.UserId == UserId);
        if (doc == null) return NotFound();
        doc.CategoryId = categoryId;
        await _db.SaveChangesAsync();
        return Ok();
    }
}

public record CreateCategoryDto(string Name, string Color);