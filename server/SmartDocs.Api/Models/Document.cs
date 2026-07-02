namespace SmartDocs.Api.Models;

public class Document
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty; // pdf, docx, txt
    public string? ExtractedText { get; set; }
    public string? Summary { get; set; }
    public string? Keywords { get; set; } // comma-separated, or JSON array
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public string UserId { get; set; } = string.Empty;
    public AppUser? User { get; set; }

    public ICollection<DocumentChunk> Chunks { get; set; } = new List<DocumentChunk>();
    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}

// Stores text chunks + embeddings for RAG (simple version: cosine similarity in-app,
// no vector DB needed for MVP)
public class DocumentChunk
{
    public int Id { get; set; }
    public int DocumentId { get; set; }
    public Document? Document { get; set; }
    public string Content { get; set; } = string.Empty;
    public string EmbeddingJson { get; set; } = string.Empty; // serialized float[]
}

public class ChatMessage
{
    public int Id { get; set; }
    public int DocumentId { get; set; }
    public Document? Document { get; set; }
    public string Role { get; set; } = string.Empty; // "user" or "assistant"
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
