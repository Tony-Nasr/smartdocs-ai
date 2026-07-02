using System.Text;
using System.Text.Json;

namespace SmartDocs.Api.Services;

public interface IAiService
{
    Task<(string Summary, string Keywords)> AnalyzeDocumentAsync(string text);
    Task<float[]> GetEmbeddingAsync(string text);
    Task<string> AnswerQuestionAsync(string question, IEnumerable<string> contextChunks);
}

public class OpenAiService : IAiService
{
    private readonly HttpClient _http;
    private readonly string _apiKey;

    public OpenAiService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _apiKey = config["OpenAI:ApiKey"]!;
        _http.BaseAddress = new Uri("https://api.openai.com/v1/");
        _http.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");
    }

    public async Task<(string Summary, string Keywords)> AnalyzeDocumentAsync(string text)
    {
        var truncated = text[..Math.Min(text.Length, 6000)];
        var prompt = "Analyze the following document. Respond ONLY with JSON:\n" +
                     "{\"summary\": \"3-4 sentence summary\", \"keywords\": \"comma-separated list of key terms\"}\n\n" +
                     "Document:\n" + truncated;

        var body = new
        {
            model = "gpt-4o-mini",
            messages = new[] { new { role = "user", content = prompt } },
            temperature = 0.3
        };

        var resp = await _http.PostAsync("chat/completions",
            new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json"));
        resp.EnsureSuccessStatusCode();

        var json = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        var content = json.RootElement.GetProperty("choices")[0]
            .GetProperty("message").GetProperty("content").GetString() ?? "{}";

        // Strip code fences if present
        content = content.Trim().TrimStart('`').TrimEnd('`').Replace("json", "", StringComparison.OrdinalIgnoreCase);

        try
        {
            var parsed = JsonDocument.Parse(content);
            var summary = parsed.RootElement.GetProperty("summary").GetString() ?? "";
            var keywords = parsed.RootElement.GetProperty("keywords").GetString() ?? "";
            return (summary, keywords);
        }
        catch
        {
            return (content, "");
        }
    }

    public async Task<float[]> GetEmbeddingAsync(string text)
    {
        var body = new { model = "text-embedding-3-small", input = text };
        var resp = await _http.PostAsync("embeddings",
            new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json"));
        resp.EnsureSuccessStatusCode();

        var json = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        var arr = json.RootElement.GetProperty("data")[0].GetProperty("embedding");
        return arr.EnumerateArray().Select(e => e.GetSingle()).ToArray();
    }

    public async Task<string> AnswerQuestionAsync(string question, IEnumerable<string> contextChunks)
    {
        var context = string.Join("\n---\n", contextChunks);
        var prompt = "Answer the question using ONLY the context below. If the answer isn't in the context, say so.\n\n" +
                     "Context:\n" + context + "\n\nQuestion: " + question;

        var body = new
        {
            model = "gpt-4o-mini",
            messages = new[] { new { role = "user", content = prompt } },
            temperature = 0.2
        };

        var resp = await _http.PostAsync("chat/completions",
            new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json"));
        resp.EnsureSuccessStatusCode();

        var json = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        return json.RootElement.GetProperty("choices")[0]
            .GetProperty("message").GetProperty("content").GetString() ?? "";
    }
}