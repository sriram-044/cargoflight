package com.aerotrace.maa.dto;

public class AuthResponse {
    private String token;
    private String tokenType = "Bearer";
    private String username;
    private String fullName;
    private String role;
    private String airport = "MAA";

    public AuthResponse() {}

    public AuthResponse(String token, String username, String fullName, String role) {
        this.token = token;
        this.username = username;
        this.fullName = fullName;
        this.role = role;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getAirport() { return airport; }
    public void setAirport(String airport) { this.airport = airport; }
}
