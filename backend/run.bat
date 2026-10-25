@echo off
setlocal
echo ==============================================================================
echo AEROTRACE MAA - Starting Spring Boot Backend with Java 21
echo ==============================================================================

cd /d "%~dp0"

where mvn.cmd >nul 2>&1
if %ERRORLEVEL% equ 0 (
    call mvn spring-boot:run
) else (
    call "C:\apache-maven-3.9.16-bin\apache-maven-3.9.16\bin\mvn.cmd" spring-boot:run
)
