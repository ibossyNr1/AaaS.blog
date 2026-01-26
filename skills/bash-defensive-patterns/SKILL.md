---
name: bash-defensive-patterns
description: Master defensive Bash programming techniques for production-grade scripts. Use when writing robust shell scripts, CI/CD pipelines, or system utilities requiring fault tolerance and safety.
version: 1.0.0
dependencies: ["bash"]
---

# Bash Defensive Patterns

Comprehensive guidance for writing production-ready Bash scripts using defensive programming techniques, error handling, and safety best practices to prevent common pitfalls and ensure reliability.

## When to Use This Skill

- Writing production automation scripts
- Building CI/CD pipeline scripts
- Creating system administration utilities
- Developing error-resilient deployment automation
- Writing scripts that must handle edge cases safely
- Building maintainable shell script libraries
- Implementing comprehensive logging and monitoring
- Creating scripts that must work across different platforms

## Core Defensive Principles

### 1. Strict Mode
Enable bash strict mode at the start of every script to catch errors early.

```bash
#!/bin/bash
set -Eeuo pipefail  # Exit on error, unset variables, pipe failures
```

### 2. Error Handling
Always check exit codes and handle failures gracefully.

```bash
if ! command -v some_tool >/dev/null 2>&1; then
    echo "Error: some_tool is required" >&2
    exit 1
fi
```

### 3. Input Validation
Validate all external inputs before using them.

```bash
if [[ -z "${1:-}" ]]; then
    echo "Usage: $0 <input_file>" >&2
    exit 1
fi

if [[ ! -f "$1" ]]; then
    echo "Error: File '$1' does not exist" >&2
    exit 1
fi
```

### 4. Safe Variable Expansion
Use parameter expansion to avoid unbound variables.

```bash
# Instead of $VAR, use:
${VAR:-default_value}    # Use default if unset or empty
${VAR:?error_message}    # Exit with error if unset or empty
${VAR:+value}            # Use value only if VAR is set
```

### 5. Quote Everything
Always quote variables to prevent word splitting and glob expansion.

```bash
# Bad
echo $VAR

# Good
echo "$VAR"

# Especially important for filenames
cp "$source_file" "$dest_file"
```

### 6. Use Functions
Encapsulate logic in functions for reusability and error isolation.

```bash
validate_input() {
    local file="$1"
    if [[ ! -f "$file" ]]; then
        echo "Invalid file: $file" >&2
        return 1
    fi
}
```

### 7. Logging
Implement structured logging for debugging and auditing.

```bash
log() {
    local level="$1"
    local message="$2"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [$level] $message"
}

log "INFO" "Starting processing..."
```

### 8. Cleanup
Use traps to ensure cleanup happens even on script termination.

```bash
cleanup() {
    rm -f "$temp_file"
    echo "Cleanup completed"
}

trap cleanup EXIT
```

## Common Pitfalls and Solutions

### Pitfall 1: Unquoted Variables
```bash
# Dangerous
for file in $files; do
    rm $file

done

# Safe
for file in "${files[@]}"; do
    rm "$file"
done
```

### Pitfall 2: Missing Error Checks
```bash
# Dangerous
some_command
next_command  # Runs even if some_command failed

# Safe
if ! some_command; then
    echo "some_command failed" >&2
    exit 1
fi
next_command
```

### Pitfall 3: Assuming Command Existence
```bash
# Dangerous
jq . file.json

# Safe
if ! command -v jq >/dev/null 2>&1; then
    echo "Error: jq is required but not installed" >&2
    exit 1
fi
jq . file.json
```

## Advanced Patterns

### 1. Retry Logic
```bash
max_retries=3
retry_count=0

while [[ $retry_count -lt $max_retries ]]; do
    if some_command; then
        break
    fi
    ((retry_count++))
    echo "Attempt $retry_count failed, retrying..."
    sleep 2

done

if [[ $retry_count -eq $max_retries ]]; then
    echo "Failed after $max_retries attempts" >&2
    exit 1
fi
```

### 2. Parallel Execution with Error Handling
```bash
process_file() {
    local file="$1"
    # Process file
}

export -f process_file

# Process files in parallel, limit to 4 at a time
printf '%s\n' "${files[@]}" | xargs -P4 -I{} bash -c 'process_file "{}"' || {
    echo "One or more files failed to process" >&2
    exit 1
}
```

### 3. Configuration Management
```bash
# Load configuration safely
CONFIG_FILE="${CONFIG_FILE:-config.sh}"

if [[ -f "$CONFIG_FILE" ]]; then
    # Use source with error checking
    if ! source "$CONFIG_FILE"; then
        echo "Failed to load config: $CONFIG_FILE" >&2
        exit 1
    fi
else
    echo "Config file not found: $CONFIG_FILE" >&2
    exit 1
fi
```

## Testing Your Scripts

### 1. ShellCheck
Always run ShellCheck on your scripts:
```bash
shellcheck your_script.sh
```

### 2. BATS Testing
Use BATS for unit testing:
```bash
#!/usr/bin/env bats

@test "script handles missing input" {
    run ./your_script.sh
    [ "$status" -eq 1 ]
    [ "$output" = "Usage: your_script.sh <input_file>" ]
}
```

### 3. Dry Run Mode
Implement a dry-run flag:
```bash
dry_run=false

if [[ "${1:-}" == "--dry-run" ]]; then
    dry_run=true
    shift
fi

execute() {
    if [[ "$dry_run" == true ]]; then
        echo "[DRY RUN] $*"
    else
        "$@"
    fi
}

execute rm -rf "$temp_dir"
```

## Best Practices Checklist

- [ ] Enable strict mode (`set -Eeuo pipefail`)
- [ ] Validate all inputs
- [ ] Quote all variable expansions
- [ ] Check command exit codes
- [ ] Use functions for modularity
- [ ] Implement logging
- [ ] Set up cleanup traps
- [ ] Test with ShellCheck
- [ ] Add help/usage information
- [ ] Support dry-run mode
- [ ] Document assumptions and limitations

## Resources

- [ShellCheck](https://www.shellcheck.net/) - Static analysis for shell scripts
- [BATS](https://github.com/bats-core/bats-core) - Bash Automated Testing System
- [Google Shell Style Guide](https://google.github.io/styleguide/shellguide.html)
- [Bash Pitfalls](https://mywiki.wooledge.org/BashPitfalls)
