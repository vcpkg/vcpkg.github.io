#TO USE THIS SCRIPT, HAVE A FOLDER CALLED PORTS AT THE SAME LEVEL OF DIRECTORY AS THIS FILE


import os
import os.path
import json
import requests
from datetime import datetime

# modidy this to be your own token or environmental variable for github repo api access
token = ""

def getFiles(path):
    files = os.listdir(path)
    return list(filter(lambda x: x[0] != '.', files))

path = "ports"
data = {}
data["Generated On"] = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
files = getFiles(path)
data["size"] = len(files)
jsonlist = []
#systems found in ci.baseline.txt
systems = ["arm64-windows", "arm-uwp", "x64-linux", "x64-osx", "x64-uwp", "x64-windows", "x64-windows-static", "x86-windows"]


ci_dict = {}
def gen_ci():
    ci_file = open('ci.baseline.txt')
    for line in ci_file:
        idx_colon = line.find(":")
        idx_equal = line.find("=")
        if line[0] == '#' or line.find(":") == -1 or line.find("=") == -1:
            continue
        else: 
            name = line[:idx_colon]
            if name not in ci_dict:
                ci_dict[name] = {}
            system = line[idx_colon + 1 : idx_equal]
            status = line[idx_equal + 1 :]
            ci_dict[name][system] = status.strip()
            
gen_ci()


#generate the json for all files
def gen_all_files():
    for filename in files:
        f = open(path+"/"+filename+"/CONTROL") #opening each CONTROL file
        prev = ""
        jsonf = {}
        jsonf["Name"] = filename
        for x in f:
            idx = x.find(":") # colon delimiter for properties
            if idx == -1 and prev != "":
                jsonf[prev] = x
            else: #no colon, multi line property
                jsonf[x[:idx]] = x[idx+1:].strip()
                prev = x[:idx]
        for system in systems: #constructing all the ci information for all systems. 
            if filename in ci_dict and system in ci_dict[filename]:
                jsonf[system] = ci_dict[filename][system]
            else:
                jsonf[system] = 'pass'
        jsonlist.append(jsonf)
        f.close()

gen_all_files()
jsonlist.sort(key=lambda item: item["Name"])


length = len("github.com")
base = "https://api.github.com/repos"
data["source"] = jsonlist
count = 1
for port in data["source"]:
    print("Loading " + str(count) + " out of " + str(data["size"]))
    count += 1
    if "Homepage" in port and port["Homepage"].find("github.com") >= 0:
        url = base+port["Homepage"][port["Homepage"].find("github.com")+length :]
        github = requests.get(url, headers={"Authorization": token}).text
        github_json = json.loads(github)
        if "stargazers_count" in github_json:
            stars = github_json["stargazers_count"]
            port["stars"] = stars

out = json.dumps(data, sort_keys=True, indent=4)
output = open("output.json", mode = 'w')
output.write(out)
output.close()
