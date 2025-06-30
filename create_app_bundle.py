# create AppBundle for Elith Pharmacy

import os
import shutil 


# create a folder for the app bundle
app_bundle_folder = "AppBundle"
os.makedirs(app_bundle_folder, exist_ok=True)

# copy scripts folder to the app bundle
shutil.copytree("scripts", os.path.join(app_bundle_folder, "scripts"))

# copy the frontend folder to the app bundle excluding the node_modules folder
for file in os.listdir("frontend"):
    if file != "node_modules":
        if os.path.isdir(os.path.join("frontend", file)):
            shutil.copytree(os.path.join("frontend", file), os.path.join(app_bundle_folder, "frontend", file))
        else:
            shutil.copy(os.path.join("frontend", file), os.path.join(app_bundle_folder, "frontend", file))

# copy the backend folder to the app bundle exclding the __pycache__ folder
for file in os.listdir("backend"):
    if file != "__pycache__":
        if os.path.isdir(os.path.join("backend", file)):
            shutil.copytree(os.path.join("backend", file), os.path.join(app_bundle_folder, "backend", file))
        else:
            shutil.copy(os.path.join("backend", file), os.path.join(app_bundle_folder, "backend", file))

# copy the Elith-Supabase folder to the app bundle excluding the node_modules folder
for file in os.listdir("Elith-Supabase"):
    if file != "node_modules" and file != "supabase":
        if os.path.isdir(os.path.join("Elith-Supabase", file)):
            shutil.copytree(os.path.join("Elith-Supabase", file), os.path.join(app_bundle_folder, "Elith-Supabase", file))
        else:
            shutil.copy(os.path.join("Elith-Supabase", file), os.path.join(app_bundle_folder, "Elith-Supabase", file))

# in the new supabase folder, in the file supabase_setup_state.json, set the values of all keys that have a boolean value to false
with open(os.path.join(app_bundle_folder, "Elith-Supabase", "supabase_setup_state.json"), "r") as f:
    supabase_setup_state = json.load(f)

for key, value in supabase_setup_state.items():
    if isinstance(value, bool):
        supabase_setup_state[key] = False


# copy the ElithPharmacy exe or elf file from the App-Interface/dist/ElithPharmacy folder to the app bundle
shutil.copy(os.path.join("App-Interface", "dist", "ElithPharmacy", "ElithPharmacy.exe"), os.path.join(app_bundle_folder, "ElithPharmacy.exe"))