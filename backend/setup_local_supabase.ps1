# Setup Local Supabase Environment
# This script automates the process of setting up and syncing a local Supabase instance

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
        [string]$ConfigKey
    )

    if ($Config[$ConfigKey]) {
        Write-Host "✅ Step '$Name' already completed. Skipping..." -ForegroundColor Green
        return $true
    }

    Write-Host "🔄 Executing step: $Name" -ForegroundColor Cyan
    
    # If validation block is provided, run it first
    if ($null -ne $ValidationBlock) {
        $validationResult = & $ValidationBlock
        if (-not $validationResult) {
            Write-Host "❌ Validation failed for step: $Name" -ForegroundColor Red
            return $false
        }
    }

    try {
        $output = Invoke-Expression $Command
        
        # Check if command was successful based on success pattern
        if ($output -match $SuccessPattern -or [string]::IsNullOrEmpty($SuccessPattern)) {
            $Config[$ConfigKey] = $true
            Save-Config $Config
            Write-Host "✅ Step '$Name' completed successfully." -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Step '$Name' failed. Output did not match expected pattern." -ForegroundColor Red
            Write-Host "Output: $output"
            return $false
        }
    } catch {
        Write-Host "❌ Error executing step '$Name': $_" -ForegroundColor Red
        return $false
    }
}

# Main execution
$config = Initialize-Config

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
$loginStep = Invoke-Step -Name "Login to Supabase" -Command "npx supabase login" `
    -SuccessPattern "Happy coding!" -Config $config -ConfigKey "loggedIn"
if (-not $loginStep) { exit 1 }

# Step 5: Link project
$linkStep = Invoke-Step -Name "Link Supabase project" -Command "npx supabase link --project-ref $($config.projectRef)" `
    -SuccessPattern "Finished supabase link" -Config $config -ConfigKey "linked"
if (-not $linkStep) { exit 1 }

# Step 6: Start Supabase
$startStep = Invoke-Step -Name "Start Supabase" -Command "npx supabase start" `
    -SuccessPattern "Started supabase local development setup" -Config $config -ConfigKey "started"
if (-not $startStep) { exit 1 }

# Step 7: Pull database schema
$pullStep = Invoke-Step -Name "Pull database schema" -Command "npx supabase db pull" `
    -SuccessPattern "Finished supabase db pull" -Config $config -ConfigKey "pulled"
if (-not $pullStep) { exit 1 }

# Step 8: Reset local database
$resetStep = Invoke-Step -Name "Reset local database" -Command "npx supabase db reset --local" `
    -SuccessPattern "Finished supabase db reset" -Config $config -ConfigKey "reset"
if (-not $resetStep) { exit 1 }

Write-Host "`n✅ All steps completed successfully! Your local Supabase instance is now in sync with the remote database." -ForegroundColor Green
Write-Host "To reset the setup process and start over, delete the '$configFile' file." -ForegroundColor Yellow 