# Supabase Local Installation Guide

## Prerequisites

- Windows 10/11 with WSL 2
- Docker Desktop
- Node.js (v18 or higher)

## Step 1: Install WSL ✅ COMPLETED

```powershell
wsl --install
```

**Status: ✅ Installed successfully**
**Next: Restart your computer for changes to take effect**

## Step 2: Install Docker Desktop

1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop/
2. Run the installer and ensure "Use WSL 2 instead of Hyper-V" is checked
3. Start Docker Desktop and wait for it to be ready
4. Verify installation:

```powershell
docker --version
docker-compose --version
```

## Step 3: Setup Supabase Local Environment

Navigate to the supabase directory:

```powershell
cd "c:\Users\Kingt\Desktop\Programmer\Elith Pharmacy\supabase-local-installation"
```

Install Supabase CLI:

```powershell
npm install -g @supabase/cli
```

Initialize Supabase project:

```powershell
supabase init
```

Start Supabase local development:

```powershell
supabase start
```

**Note: This command takes 5-10 minutes on first run as it downloads Docker images**

## Step 4: Verify Installation

After `supabase start` completes, you should see output similar to:

```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
        Inbucket URL: http://localhost:54324
          JWT secret: your-jwt-secret
         anon key: your-anon-key
service_role key: your-service-role-key
```

## Step 5: Access Supabase Studio

Open your browser and go to: http://localhost:54323
This is your local Supabase Studio interface.

## Troubleshooting

- If Docker fails to start, ensure WSL 2 is properly installed and running
- If ports are in use, stop other services or use `supabase stop` first
- Check Docker Desktop is running before starting Supabase

## Next Steps

1. **RESTART YOUR COMPUTER** (required after WSL installation)
2. Install Docker Desktop
3. Continue with Supabase setup
