@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

rem =====================================================================
rem  Zodiak — Fix git structure
rem
rem  Avant : .git/ est dans le sous-dossier ZodiakV2/, mais le code à jour
rem          est dans le dossier parent.
rem  Apres : .git/ est dans le dossier parent, le sous-dossier obsolète
rem          est renommé en ZodiakV2_OBSOLETE_BACKUP (à supprimer plus tard).
rem
rem  Tu peux double-cliquer ce fichier pour l'executer.
rem  Si Windows demande "executer en tant qu'admin", non, pas besoin.
rem =====================================================================

set "ROOT=%~dp0"
rem Retire le slash final
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

set "OLD_REPO=%ROOT%\ZodiakV2"
set "BACKUP=%ROOT%\ZodiakV2_OBSOLETE_BACKUP"

echo.
echo ============================================================
echo   Fix de la structure git Zodiak
echo ============================================================
echo.
echo   Workspace        : %ROOT%
echo   Vieux sous-repo  : %OLD_REPO%
echo   Backup           : %BACKUP%
echo.

rem === Verifications ===================================================
if not exist "%OLD_REPO%\.git" (
    echo [ERREUR] Aucun .git trouve dans "%OLD_REPO%\.git"
    echo Le script a deja ete execute, ou la structure a deja ete reparee.
    echo.
    pause
    exit /b 1
)

if exist "%ROOT%\.git" (
    echo [ERREUR] Il y a deja un .git a la racine "%ROOT%\.git"
    echo Le parent est deja un repo git. Pour eviter d'ecraser, le script s'arrete.
    echo.
    pause
    exit /b 1
)

echo Tout est OK pour proceder.
echo.
choice /c ON /n /m "Tu veux continuer ? (O = Oui / N = Non) "
if errorlevel 2 (
    echo Annule.
    pause
    exit /b 0
)

echo.
echo === Etape 1/3 : Deplacement du .git ===========================
move "%OLD_REPO%\.git" "%ROOT%\.git"
if errorlevel 1 (
    echo [ERREUR] Impossible de deplacer .git
    pause
    exit /b 1
)
echo OK : .git est maintenant a la racine.

echo.
echo === Etape 2/3 : Renommage du sous-dossier obsolete =============
move "%OLD_REPO%" "%BACKUP%"
if errorlevel 1 (
    echo [ATTENTION] Impossible de renommer le sous-dossier (probablement ouvert ailleurs).
    echo Le .git a ete deplace, mais le sous-dossier reste en place.
    echo Tu peux le renommer manuellement plus tard.
) else (
    echo OK : sous-dossier obsolete renomme en ZodiakV2_OBSOLETE_BACKUP
)

echo.
echo === Etape 3/3 : Verification ====================================
if exist "%ROOT%\.git\HEAD" (
    echo OK : %ROOT%\.git\HEAD est present.
) else (
    echo [ERREUR] %ROOT%\.git\HEAD est introuvable.
)

echo.
echo ============================================================
echo   TERMINE !
echo ============================================================
echo.
echo Prochaines etapes :
echo   1. Ouvre GitHub Desktop.
echo   2. Si GD pointe encore sur l'ancien chemin, fais :
echo        File ^> Add local repository ^> "%ROOT%"
echo      Tu peux supprimer l'ancienne entree (clic droit sur le repo
echo      dans la liste ^> "Remove").
echo   3. Tu vas voir des centaines de "changes" — c'est normal,
echo      git compare maintenant l'ancien commit a la version actuelle.
echo   4. Verifie le contenu de ZodiakV2_OBSOLETE_BACKUP, et si rien
echo      ne te manque, supprime-le manuellement (clic droit ^> Supprimer).
echo.
echo Astuce : pour voir un resume des changements, ouvre Git Bash ou CMD
echo et tape : cd /d "%ROOT%" ^&^& git status ^| more
echo.
pause
endlocal
