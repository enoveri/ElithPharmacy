# Setup Local Supabase Environment
# This script automates the process of setting up and syncing a local Supabase instance

# Parse command line arguments
param (
    [switch]$Verbose,
    [string]$ProjectRef,
    [string]$DbPassword,
    [switch]$Help
)

# Display help if requested
if ($Help) {
    Write-Host "Elith Pharmacy Supabase Setup Script"
    Write-Host "Usage: .\setup_local_supabase.ps1 [options]"
    Write-Host "Options:"
    Write-Host "  -Verbose            Show detailed command outputs"
    Write-Host "  -ProjectRef <ref>   Specify the Supabase project reference"
    Write-Host "  -DbPassword <pwd>   Specify the database password for db pull"
    Write-Host "  -Help               Show this help message"
    exit 0
}

# Configuration
$configFile = "supabase_setup_state.json"
$defaultConfig = @{
    "installed" = $false
    "initialized" = $false
    "loggedIn" = $false
    "linked" = $false
    "started" = $false
    "pulled" = $false
    "reset" = $false
    "projectRef" = ""
    "dbPassword" = ""
}

# Display verbose message
function Write-VerboseLog {
    param([string]$Message)
    
    if ($Verbose) {
        Write-Host $Message -ForegroundColor DarkGray
    }
}

# Create or load configuration
function Initialize-Config {
    if (Test-Path $configFile) {
        $config = Get-Content $configFile | ConvertFrom-Json
        # Convert from JSON object to hashtable
        $configHashtable = @{}
        $config.PSObject.Properties | ForEach-Object { $configHashtable[$_.Name] = $_.Value }
        return $configHashtable
    } else {
        $defaultConfig | ConvertTo-Json | Out-File $configFile
        return $defaultConfig
    }
}

# Save configuration
function Save-Config {
    param($config)
    $config | ConvertTo-Json | Out-File $configFile
}

# Execute a step with validation
function Invoke-Step {
    param(
        [string]$Name,
        [string]$Command,
        [string]$SuccessPattern,
        [scriptblock]$ValidationBlock = $null,
        [hashtable]$Config,
        [string]$ConfigKey,
        [bool]$IsInteractive = $false
    )

    if ($Config[$ConfigKey]) {
        Write-Host "✅ Step '$Name' already completed. Skipping..." -ForegroundColor Green
        return $true
    }

    Write-Host "🔄 Executing step: $Name" -ForegroundColor Cyan
    Write-VerboseLog "Command: $Command"
    
    # If validation block is provided, run it first
    if ($null -ne $ValidationBlock) {
        $validationResult = & $ValidationBlock
        if (-not $validationResult) {
            Write-Host "❌ Validation failed for step: $Name" -ForegroundColor Red
            return $false
        }
    }

    # For interactive commands, warn the user and execute directly
    if ($IsInteractive) {
        Write-Host "⚠️ This step may require your interaction. Please respond to any prompts." -ForegroundColor Yellow
        
        try {
            # Execute the command directly to allow user interaction
            Invoke-Expression $Command
            $exitCode = $LASTEXITCODE
            
            if ($exitCode -eq 0) {
                $Config[$ConfigKey] = $true
                Save-Config $Config
                Write-Host "✅ Step '$Name' completed successfully." -ForegroundColor Green
                return $true
            } else {
                Write-Host "❌ Step '$Name' failed with exit code $exitCode." -ForegroundColor Red
                return $false
            }
        } catch {
            Write-Host "❌ Error executing step '$Name': $_" -ForegroundColor Red
            return $false
        }
    } else {
        # For non-interactive commands, add non-interactive flags when possible
        if ($Command -match "npx") {
            $Command = "$Command --yes"
            Write-VerboseLog "Added --yes flag: $Command"
        }
        
        try {
            # In verbose mode, execute command directly to show real-time output
            if ($Verbose) {
                Write-Host "--- Command Output (Real-time) ---" -ForegroundColor DarkGray
                
                # Execute command directly to show real-time output
                $global:LASTEXITCODE = 0
                Invoke-Expression $Command
                $exitCode = $global:LASTEXITCODE
                
                Write-Host "--------------------" -ForegroundColor DarkGray
            } else {
                # In non-verbose mode, capture output for error reporting
                $global:LASTEXITCODE = 0
                $output = Invoke-Expression $Command
                $exitCode = $global:LASTEXITCODE
            }
            
            # Primary check: exit code
            if ($exitCode -eq 0) {
                $Config[$ConfigKey] = $true
                Save-Config $Config
                Write-Host "✅ Step '$Name' completed successfully." -ForegroundColor Green
                return $true
            } else {
                Write-Host "❌ Step '$Name' failed with exit code $exitCode." -ForegroundColor Red
                # Show output in case of failure in non-verbose mode
                if (-not $Verbose -and $null -ne $output) {
                    Write-Host "Output: $output"
                }
                return $false
            }
        } catch {
            Write-Host "❌ Error executing step '$Name': $_" -ForegroundColor Red
            return $false
        }
    }
}

# Display usage information
Write-Host "Elith Pharmacy Supabase Setup Script"
Write-Host "Usage: .\setup_local_supabase.ps1 [options]"
Write-Host "Options:"
Write-Host "  -Verbose            Show detailed command outputs"
Write-Host "  -ProjectRef <ref>   Specify the Supabase project reference"
Write-Host "  -DbPassword <pwd>   Specify the database password for db pull"
Write-Host "  -Help               Show this help message"
Write-Host ""

if ($Verbose) {
    Write-Host "Verbose mode enabled. Command outputs will be displayed." -ForegroundColor Yellow
    Write-Host ""
}

# Main execution
$config = Initialize-Config

# If project reference was provided via command line, update the config
if (-not [string]::IsNullOrEmpty($ProjectRef)) {
    Write-VerboseLog "Using project reference from command line: $ProjectRef"
    $config["projectRef"] = $ProjectRef
    Save-Config $config
}

# If database password was provided via command line, update the config
if (-not [string]::IsNullOrEmpty($DbPassword)) {
    Write-VerboseLog "Using database password from command line"
    $config["dbPassword"] = $DbPassword
    Save-Config $config
}

# Step 1: Install Supabase
$installStep = Invoke-Step -Name "Install Supabase" -Command "npm install supabase --save-dev" `
    -SuccessPattern "up to date" -Config $config -ConfigKey "installed"
if (-not $installStep) { exit 1 }

# Step 2: Initialize Supabase
$initStep = Invoke-Step -Name "Initialize Supabase" -Command "npx supabase init" `
    -SuccessPattern "Finished supabase init." -Config $config -ConfigKey "initialized"
if (-not $initStep) { exit 1 }

# Step 3: Get project reference if not already set
if ([string]::IsNullOrEmpty($config["projectRef"])) {
    Write-Host "You can find your project reference in the URL of your Supabase project. ie https://<project-name>.supabase.co/project/<project-reference>"
    Write-Host "Enter your Supabase project reference:" -ForegroundColor Yellow
    $projectRef = Read-Host
    if (-not [string]::IsNullOrEmpty($projectRef)) {
        $config["projectRef"] = $projectRef
        Save-Config $config
    } else {
        Write-Host "❌ Project reference is required to continue." -ForegroundColor Red
        exit 1
    }
}

# Step 4: Login to Supabase
$loginStep = Invoke-Step -Name "Login to Supabase" -Command "npx supabase login --no-browser" `
    -SuccessPattern "Happy coding!" -Config $config -ConfigKey "loggedIn" -IsInteractive $true
if (-not $loginStep) { exit 1 }

# Step 5: Link project
# Build the link command with password if available
$linkCommand = "npx supabase link --project-ref $($config.projectRef)"
if (-not [string]::IsNullOrEmpty($config["dbPassword"])) {
    $linkCommand = "$linkCommand --password '$($config.dbPassword)'"
    Write-VerboseLog "Using stored database password for linking"
}

$linkStep = Invoke-Step -Name "Link Supabase project" -Command $linkCommand `
    -SuccessPattern "Finished supabase link" -Config $config -ConfigKey "linked" -IsInteractive $true
if (-not $linkStep) { exit 1 }

# Step 6: Start Supabase
$startStep = Invoke-Step -Name "Start Supabase" -Command "npx supabase start" `
    -SuccessPattern "Started supabase local development setup" -Config $config -ConfigKey "started" -IsInteractive $true
if (-not $startStep) { exit 1 }

# Handle database pull with automatic migration repair
function Handle-DbPull {
    param(
        [string]$DbPassword
    )
    
    $pullCommand = ""
    if (-not [string]::IsNullOrEmpty($DbPassword)) {
        $pullCommand = "npx supabase db pull --password '$DbPassword'"
    } else {
        $pullCommand = "npx supabase db pull"
    }
    
    # First attempt to pull
    Write-VerboseLog "Attempting database pull"
    try {
        $output = Invoke-Expression $pullCommand 2>&1
        $exitCode = $LASTEXITCODE
        
        # Check if we need to repair migrations
        if ($exitCode -ne 0 -and $output -match "migration repair --status reverted") {
            Write-Host "⚠️ Migration history mismatch detected. Attempting automatic repair..." -ForegroundColor Yellow
            
            # Extract migration ID from error message
            $migrationId = [regex]::Match($output, "migration repair --status reverted (\d+)").Groups[1].Value
            
            if (-not [string]::IsNullOrEmpty($migrationId)) {
                Write-Host "🔄 Repairing migration: $migrationId" -ForegroundColor Cyan
                
                try {
                    $repairOutput = Invoke-Expression "npx supabase migration repair --status reverted $migrationId" 2>&1
                    $repairExitCode = $LASTEXITCODE
                    
                    if ($repairExitCode -eq 0) {
                        Write-Host "✅ Migration repair successful. Retrying database pull..." -ForegroundColor Green
                        # Retry the pull after repair
                        $output = Invoke-Expression $pullCommand 2>&1
                        $exitCode = $LASTEXITCODE
                    } else {
                        Write-Host "❌ Migration repair failed: $repairOutput" -ForegroundColor Red
                        return $false
                    }
                } catch {
                    Write-Host "❌ Error during migration repair: $_" -ForegroundColor Red
                    return $false
                }
            } else {
                Write-Host "❌ Could not determine migration ID to repair" -ForegroundColor Red
                Write-Host $output
                return $false
            }
        }
        
        # Show output in verbose mode
        if ($Verbose) {
            Write-Host "--- Database Pull Output ---" -ForegroundColor DarkGray
            $output
            Write-Host "--------------------" -ForegroundColor DarkGray
        }
        
        # Check final result
        if ($exitCode -eq 0) {
            Write-Host "✅ Database schema pulled successfully" -ForegroundColor Green
            $config["pulled"] = $true
            Save-Config $config
            return $true
        } else {
            Write-Host "❌ Database pull failed with exit code $exitCode" -ForegroundColor Red
            Write-Host $output
            return $false
        }
    } catch {
        Write-Host "❌ Error executing database pull: $_" -ForegroundColor Red
        return $false
    }
}

# Step 7: Pull database schema
if ([string]::IsNullOrEmpty($config["dbPassword"]) -and [string]::IsNullOrEmpty($DbPassword)) {
    Write-Host "Enter your database password for schema pull:" -ForegroundColor Yellow
    $dbPassword = Read-Host -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
    $plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
    
    if (-not [string]::IsNullOrEmpty($plainPassword)) {
        $config["dbPassword"] = $plainPassword
        Save-Config $config
    }
}

if (-not (Handle-DbPull -DbPassword $config["dbPassword"])) {
    exit 1
}

# Step 8: Reset local database
$resetStep = Invoke-Step -Name "Reset local database" -Command "npx supabase db reset --local" `
    -SuccessPattern "Finished supabase db reset" -Config $config -ConfigKey "reset"
if (-not $resetStep) { exit 1 }

Write-Host "`n✅ All steps completed successfully! Your local Supabase instance is now in sync with the remote database." -ForegroundColor Green
Write-Host "To reset the setup process and start over, delete the '$configFile' file." -ForegroundColor Yellow 