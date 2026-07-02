using System.Text;
using System.Text.Json;

namespace SmartDocs.Api.Services;

public class GroqService : IAiService
{
    private readonly HttpClient _http;
    private readonly string _apiKey;

    public GroqService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _apiKey = config["Groq:ApiKey"]!;
    }

    public async Task<(string Summary, string Keywords)> AnalyzeDocumentAsync(string text)
    {
        var truncated = text[..Math.Min(text.Length, 6000)];
        var prompt = "Analyze the following document. Respond ONLY with valid JSON, no markdown, no code fences, no explanation:\n" +
                     "{\"summary\": \"3-4 sentence summary\", \"keywords\": \"comma-separated key terms\"}\n\n" +
                     "Document:\n" + truncated;

        var result = await CallGroqAsync(prompt);
        try
        {
            var clean = result.Trim().TrimStart('`').TrimEnd('`')
                .Replace("json", "", StringComparison.OrdinalIgnoreCase).Trim();
            var parsed = JsonDocument.Parse(clean);
            var summary = parsed.RootElement.GetProperty("summary").GetString() ?? "";
            var keywords = parsed.RootElement.GetProperty("keywords").GetString() ?? "";
            return (summary, keywords);
        }
        catch
        {
            return (result, "");
        }
    }

    public Task<float[]> GetEmbeddingAsync(string text) => Task.FromResult(Array.Empty<float>());

    public async Task<string> AnswerQuestionAsync(string question, IEnumerable<string> contextChunks)
    {
        var context = string.Join("\n---\n", contextChunks);
        var prompt = "Answer the question using ONLY the context below. " +
                     "If not found in the context, say so.\n\nContext:\n" + context + "\n\nQuestion: " + question;
        return await CallGroqAsync(prompt);
    }

    private async Task<string> CallGroqAsync(string prompt)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions");
        request.Headers.Add("Authorization", $"Bearer {_apiKey}");

        var body = new
        {
            model = "llama-3.3-70b-versatile",
            messages = new[] { new { role = "user", content = prompt } },
            temperature = 0.3
        };

        request.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

        var resp = await _http.SendAsync(request);
        var responseBody = await resp.Content.ReadAsStringAsync();

        if (!resp.IsSuccessStatusCode)
            throw new Exception($"Groq error {resp.StatusCode}: {responseBody}");

        var json = JsonDocument.Parse(responseBody);
        return json.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString() ?? "";
    }
}