using Microsoft.AspNetCore.Identity;

namespace SmartDocs.Api.Models;

public class AppUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }

    public ICollection<Document> Documents { get; set; } = new List<Document>();
}
