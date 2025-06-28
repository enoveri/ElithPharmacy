check os

## windows
Check wsl . # run wsl --install if not available

# install docker
Check docker # winget install -e --id Docker.DockerDesktop if docker is  not installed and we have winget installed on the system. 
If winget is not installed. 
Download-docker-desktop and start the installation sequence
download-url: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe

1.
## Harder Setup 

# Obtain the zip from a google drive.
Extract the zip file containing this working directory and move to it.

# Check for updates from the Updates git Repo
repo_url: https://github.com/Verily/Pharmacy/Updates.git # this is a place holder.

# Front end setup
Move to frontend and run npm install

# Supabase setup
Move to Elith-Supabase and run npm install
Run the setup_local_supabase.ps1 script to setup supabase

# Back end setup
Check for existence of python. 
Download python3.*
Download_url: https://www.python.org/ftp/python/3.13.5/python-3.13.5-amd64.exe
Create a virtual environment for the backend usage. 
Install the requirements.txt from the backend

# create docker containers -- We can pull the containers but this is a setup that is supposed to make updates from github directly. 
Move to the root folder and create run docker compose up --build. 

# install the requirements.txt in the App-Interface.

-- We have supabase setup and the app containers and App-Interface

# Elevate the prvileges of the maintainer scripts. 
# Add the watch dog to start at startup
# Run the watch dog as daemon.
# start the app in the App-Interface directory, run main.py

2.
## Easier setup. 

# Create a working directory

# pull the base setup zip from google drive containing only the ElithSupabse directory, App-Interface and the maintainer powershell scripts. 

# extract it.
# Supabase setup
Move to Elith-Supabase and run npm install
Run the setup_local_supabase.ps1 script to setup supabase

# docker pull the container from Docker Hub pulling the backend and frontend images
# TODO: We shall need another script that is able to always check for upto date images and containers and install them.

# python setup for some python scripts. 
Check for existence of python. 
Download python3.*
Download_url: https://www.python.org/ftp/python/3.13.5/python-3.13.5-amd64.exe
Create a virtual environment for the backend usage. 
Install the requirements.txt from the backend

# install the requirements.txt in the App-Interface.

-- We have supabase setup and the app containers and App-Interface

# Elevate the prvileges of the maintainer scripts. 
# Add the watch dog to start at startup
# Run the watch dog as daemon.
# start the app in the App-Interface directory, run main.py