namespace SmartDocs.Api.DTOs;

public record RegisterDto(string FullName, string Email, string Password);
public record LoginDto(string Email, string Password);
public record AuthResponseDto(string AccessToken, string RefreshToken, string Email, string FullName);
public record RefreshDto(string RefreshToken, string Email);
