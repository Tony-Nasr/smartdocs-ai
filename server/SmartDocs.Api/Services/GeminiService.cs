using System.Text;
using System.Text.Json;

namespace SmartDocs.Api.Services;

public class GeminiService : IAiService
{
    private readonly HttpClient _http;
    private readonly string _apiKey;

    public GeminiService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _apiKey = config["Gemini:ApiKey"]!;
    }

    public async Task<(string Summary, string Keywords)> AnalyzeDocumentAsync(string text)
    {
        var truncated = text[..Math.Min(text.Length, 6000)];
        var prompt = "Analyze the following document. Respond ONLY with valid JSON, no markdown, no code fences:\n" +
                     "{\"summary\": \"3-4 sentence summary here\", \"keywords\": \"comma-separated key terms here\"}\n\n" +
                     "Document:\n" + truncated;

        var result = await CallGeminiAsync(prompt);

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

    public async Task<float[]> GetEmbeddingAsync(string text)
{
    await Task.Delay(500); // wait 0.5 seconds between calls
    var url = $"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={_apiKey}";
        var body = new
        {
            model = "models/text-embedding-004",
            content = new { parts = new[] { new { text } } }
        };

        var resp = await _http.PostAsync(url,
            new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json"));
        resp.EnsureSuccessStatusCode();

        var json = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        var values = json.RootElement
            .GetProperty("embedding")
            .GetProperty("values")
            .EnumerateArray()
            .Select(e => e.GetSingle())
            .ToArray();

        return values;
    }

    public async Task<string> AnswerQuestionAsync(string question, IEnumerable<string> contextChunks)
    {
        var context = string.Join("\n---\n", contextChunks);
        var prompt = "Answer the question using ONLY the context below. " +
                     "If the answer is not in the context, say 'I could not find that in the document.'\n\n" +
                     "Context:\n" + context + "\n\nQuestion: " + question;

        return await CallGeminiAsync(prompt);
    }

    private async Task<string> CallGeminiAsync(string prompt)
{
    var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={_apiKey}";
    var body = new
    {
        contents = new[]
        {
            new { parts = new[] { new { text = prompt } } }
        },
        generationConfig = new { temperature = 0.3 }
    };

    for (int attempt = 0; attempt < 3; attempt++)
    {
        var resp = await _http.PostAsync(url,
            new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json"));

        if (resp.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
        {
            await Task.Delay(5000); // wait 5 seconds and retry
            continue;
        }

        resp.EnsureSuccessStatusCode();
        var json = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
        return json.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString() ?? "";
    }

    throw new Exception("Gemini rate limit reached after 3 attempts.");
}
}