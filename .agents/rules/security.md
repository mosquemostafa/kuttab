# Security and Secrets Protection Rules

You MUST ALWAYS follow these rules without exception:

1. **PROHIBITION ON READING SECRETS & ENV FILES**:
   - NEVER view, read, grep, cat, head, tail, or print the contents of any `.env*` files (such as `.env`, `.env.local`, `.env.prod`, `.env.development`, `.env.production`, or any file containing secrets).
   - If you need to know which environment variables a project expects, inspect `.env.example`, `.env.build`, schema files, or ask the user directly.
   - Do NOT run shell commands or scripts that dump, echo, or output environment secrets, connection strings, private keys, or credentials to terminal stdout/stderr.

2. **MASKING CREDENTIALS**:
   - In any diagnostic scripts, logs, or debugging outputs, always mask sensitive portions of database URLs, tokens, and passwords (e.g. `user:****@host`).
