@echo off
REM Giz Livre — © 2026 Heraldo Antunes — Licença MIT (ver LICENSE)
REM Abre o Giz Livre (servidor local + janela do Edge)
cd /d "%~dp0"
where pythonw >nul 2>nul && (start "" pythonw server.py) || (start "Giz Livre" /min python server.py)
