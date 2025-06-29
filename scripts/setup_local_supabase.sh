#!/bin/bash

# Setup Local Supabase Environment
# This script automates the process of setting up and syncing a local Supabase instance

# Configuration
CONFIG_FILE="supabase_setup_state.json"
VERBOSE=false
PROJECT_REF=""
DB_PASSWORD=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -p|--project-ref)
            if [[ -n "$2" && "$2" != -* ]]; then
                PROJECT_REF="$2"
                shift 2
            else
                echo "Error: Project reference argument is missing"
                exit 1
            fi
            ;;
        -d|--db-password)
            if [[ -n "$2" && "$2" != -* ]]; then
                DB_PASSWORD="$2"
                shift 2
            else
                echo "Error: Database password argument is missing"
                exit 1
            fi
            ;;
        -h|--help)
            echo "Elith Pharmacy Supabase Setup Script"
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  -v, --verbose         Show detailed command outputs"
            echo "  -p, --project-ref REF Specify the Supabase project reference"
            echo "  -d, --db-password PWD Specify the database password for db pull"
            echo "  -h, --help            Show this help message"
            exit 0
            ;;
        *)
            shift
            ;;
    esac
done

# Show verbose message
verbose_log() {
    if [ "$VERBOSE" = "true" ]; then
        echo -e "\e[90m$1\e[0m"
    fi
}

# Create or load configuration
initialize_config() {
    if [ -f "$CONFIG_FILE" ]; then
        # Load existing config
        return 0
    else
        # Create default config
        cat > "$CONFIG_FILE" << EOF
{
  "installed": false,
  "initialized": false,
  "loggedIn": false,
  "linked": false,
  "started": false,
  "pulled": false,
  "reset": false,
  "projectRef": "",
  "dbPassword": ""
}
EOF
    fi
}

# Get config value
get_config_value() {
    local key="$1"
    value=$(grep -o "\"$key\": *\"[^\"]*\"" "$CONFIG_FILE" | cut -d'"' -f4)
    if [ "$key" = "projectRef" ] || [ "$key" = "dbPassword" ]; then
        echo "$value"
        return
    fi
    
    # For boolean values
    bool_value=$(grep -o "\"$key\": *\(true\|false\)" "$CONFIG_FILE" | grep -o "\(true\|false\)")
    if [ "$bool_value" = "true" ]; then
        echo "true"
    else
        echo "false"
    fi
}

# Update config value
update_config_value() {
    local key="$1"
    local value="$2"
    
    # Check if value is a boolean or string
    if [ "$value" = "true" ] || [ "$value" = "false" ]; then
        # Update boolean value
        sed -i "s/\"$key\": *\(true\|false\)/\"$key\": $value/" "$CONFIG_FILE"
    else
        # Update string value
        sed -i "s/\"$key\": *\"[^\"]*\"/\"$key\": \"$value\"/" "$CONFIG_FILE"
    fi
}

# Execute a step with validation
invoke_step() {
    local name="$1"
    local command="$2"
    local success_pattern="$3"
    local config_key="$4"
    local is_interactive="${5:-false}"
    
    # Check if step already completed
    if [ "$(get_config_value "$config_key")" = "true" ]; then
        echo -e "\e[32m✅ Step '$name' already completed. Skipping...\e[0m"
        return 0
    fi
    
    echo -e "\e[36m🔄 Executing step: $name\e[0m"
    verbose_log "Command: $command"
    
    # For interactive commands, warn the user
    if [ "$is_interactive" = "true" ]; then
        echo -e "\e[33m⚠️ This step may require your interaction. Please respond to any prompts.\e[0m"
        # Execute interactive command directly to allow user input
        eval "$command"
        exit_code=$?
        
        # Check exit code for success
        if [ $exit_code -eq 0 ]; then
            update_config_value "$config_key" "true"
            echo -e "\e[32m✅ Step '$name' completed successfully.\e[0m"
            return 0
        else
            echo -e "\e[31m❌ Step '$name' failed with exit code $exit_code.\e[0m"
            return 1
        fi
    else
        # For non-interactive commands, add non-interactive flags when possible
        # if [[ "$command" == *"npx"* ]]; then
        #     command="$command"
        #     # verbose_log "Added --yes flag: $command"
        # fi
        
        # In verbose mode, execute command directly to show real-time output
        if [ "$VERBOSE" = "true" ]; then
            echo -e "\e[90m--- Command Output (Real-time) ---\e[0m"
            eval "$command"
            exit_code=$?
            echo -e "\e[90m--------------------\e[0m"
        else
            # In non-verbose mode, capture output for error reporting
            output=$(eval "$command" 2>&1)
            exit_code=$?
        fi
        
        # Primary check: exit code
        if [ $exit_code -eq 0 ]; then
            update_config_value "$config_key" "true"
            echo -e "\e[32m✅ Step '$name' completed successfully.\e[0m"
            return 0
        else
            echo -e "\e[31m❌ Step '$name' failed with exit code $exit_code.\e[0m"
            # Show output in case of failure in non-verbose mode
            if [ "$VERBOSE" = "false" ] && [ -n "$output" ]; then
                echo "Output: $output"
            fi
            return 1
        fi
    fi
}

# Handle database pull with automatic migration repair
handle_db_pull() {
    local db_password="$1"
    local pull_command=""
    
    if [ -n "$db_password" ]; then
        pull_command="npx supabase db pull --password \"$db_password\""
    else
        pull_command="npx supabase db pull"
    fi
    
    # First attempt to pull
    verbose_log "Attempting database pull"
    output=$(eval "$pull_command" 2>&1)
    exit_code=$?
    
    # Check if we need to repair migrations
    if [ $exit_code -ne 0 ] && echo "$output" | grep -q "migration repair --status reverted"; then
        echo -e "\e[33m⚠️ Migration history mismatch detected. Attempting automatic repair...\e[0m"
        
        # Extract migration ID from error message
        migration_id=$(echo "$output" | grep -o "migration repair --status reverted [0-9]*" | awk '{print $5}')
        
        if [ -n "$migration_id" ]; then
            echo -e "\e[36m🔄 Repairing migration: $migration_id\e[0m"
            repair_output=$(npx supabase migration repair --status reverted "$migration_id" 2>&1)
            repair_exit=$?
            
            if [ $repair_exit -eq 0 ]; then
                echo -e "\e[32m✅ Migration repair successful. Retrying database pull...\e[0m"
                # Retry the pull after repair
                output=$(eval "$pull_command" 2>&1)
                exit_code=$?
            else
                echo -e "\e[31m❌ Migration repair failed: $repair_output\e[0m"
                return 1
            fi
        else
            echo -e "\e[31m❌ Could not determine migration ID to repair\e[0m"
            echo "$output"
            return 1
        fi
    fi
    
    # Show output in verbose mode
    if [ "$VERBOSE" = "true" ]; then
        echo -e "\e[90m--- Database Pull Output ---\e[0m"
        echo "$output"
        echo -e "\e[90m--------------------\e[0m"
    fi
    
    # Check final result
    if [ $exit_code -eq 0 ]; then
        echo -e "\e[32m✅ Database schema pulled successfully\e[0m"
        update_config_value "pulled" "true"
        return 0
    else
        echo -e "\e[31m❌ Database pull failed with exit code $exit_code\e[0m"
        echo "$output"
        return 1
    fi
}

# Display usage information
echo -e "Elith Pharmacy Supabase Setup Script"
echo -e "Usage: $0 [options]"
echo -e "Options:"
echo -e "  -v, --verbose         Show detailed command outputs"
echo -e "  -p, --project-ref REF Specify the Supabase project reference"
echo -e "  -d, --db-password PWD Specify the database password for db pull"
echo -e "  -h, --help            Show this help message\n"

if [ "$VERBOSE" = "true" ]; then
    echo -e "\e[33mVerbose mode enabled. Command outputs will be displayed.\e[0m\n"
fi

# Main execution
initialize_config

# If project reference was provided via command line, update the config
if [ -n "$PROJECT_REF" ]; then
    verbose_log "Using project reference from command line: $PROJECT_REF"
    update_config_value "projectRef" "$PROJECT_REF"
fi

# If database password was provided via command line, update the config
if [ -n "$DB_PASSWORD" ]; then
    verbose_log "Using database password from command line"
    update_config_value "dbPassword" "$DB_PASSWORD"
fi

# Step 1: Install Supabase
if ! invoke_step "Install Supabase" "npm install supabase --save-dev" "up to date" "installed"; then
    exit 1
fi

# Step 2: Initialize Supabase
if ! invoke_step "Initialize Supabase" "npx supabase init" "Finished supabase init" "initialized"; then
    exit 1
fi

# Step 3: Get project reference if not already set
project_ref=$(get_config_value "projectRef")
if [ -z "$project_ref" ]; then
    echo "You can find your project reference in the URL of your Supabase project. ie https://<project-name>.supabase.co/project/<project-reference>"
    echo -e "\e[33mEnter your Supabase project reference:\e[0m"
    read project_ref
    if [ -n "$project_ref" ]; then
        update_config_value "projectRef" "$project_ref"
    else
        echo -e "\e[31m❌ Project reference is required to continue.\e[0m"
        exit 1
    fi
fi

# Step 4: Login to Supabase
if ! invoke_step "Login to Supabase" "npx supabase login --no-browser" "Happy coding" "loggedIn" "true"; then
    exit 1
fi

# Step 5: Link project
project_ref=$(get_config_value "projectRef")
db_password=$(get_config_value "dbPassword")

# Build the link command with password if available
link_command="npx supabase link --project-ref $project_ref"
if [ -n "$db_password" ]; then
    link_command="$link_command --password \"$db_password\""
    verbose_log "Using stored database password for linking"
fi

if ! invoke_step "Link Supabase project" "$link_command" "Finished supabase link" "linked" "true"; then
    exit 1
fi

# Step 6: Start Supabase
if ! invoke_step "Start Supabase" "npx supabase start" "Started supabase local development setup" "started" "true"; then
    exit 1
fi

# Step 7: Pull database schema
db_password=$(get_config_value "dbPassword")
if [ -z "$db_password" ] && [ -z "$DB_PASSWORD" ]; then
    echo -e "\e[33mEnter your database password for schema pull:\e[0m"
    read -s db_password
    if [ -n "$db_password" ]; then
        update_config_value "dbPassword" "$db_password"
    fi
fi

db_password=$(get_config_value "dbPassword")
if ! handle_db_pull "$db_password"; then
    exit 1
fi

# Step 8: Reset local database
if ! invoke_step "Reset local database" "npx supabase db reset --local" "Finished supabase db reset" "reset"; then
    exit 1
fi

echo -e "\n\e[32m✅ All steps completed successfully! Your local Supabase instance is now in sync with the remote database.\e[0m"
echo -e "\e[33mTo reset the setup process and start over, delete the '$CONFIG_FILE' file.\e[0m" 