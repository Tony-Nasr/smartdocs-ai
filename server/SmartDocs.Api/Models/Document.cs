namespace SmartDocs.Api.Models;

public class Document
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public string? ExtractedText { get; set; }
    public string? Summary { get; set; }
    public string? Keywords { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public bool IsFavorite { get; set; } = false;

    public string UserId { get; set; } = string.Empty;
    public AppUser? User { get; set; }

    public int? CategoryId { get; set; }
    public Category? Category { get; set; }

    public ICollection<DocumentChunk> Chunks { get; set; } = new List<DocumentChunk>();
    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#6366f1";
    public string UserId { get; set; } = string.Empty;
    public AppUser? User { get; set; }
    public ICollection<Document> Documents { get; set; } = new List<Document>();
}

public class DocumentChunk
{
    public int Id { get; set; }
    public int DocumentId { get; set; }
    public Document? Document { get; set; }
    public string Content { get; set; } = string.Empty;
    public string EmbeddingJson { get; set; } = string.Empty;
}

public class ChatMessage
{
    public int Id { get; set; }
    public int DocumentId { get; set; }
    public Document? Document { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}