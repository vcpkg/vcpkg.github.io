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
data["Size"] = len(files)
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
            if x.strip() == "" or x.strip()[0] == "#":
                continue
            idx = x.find(":") # colon delimiter for properties
            if idx == -1 and prev != "" and x[idx+1]==" ":
                jsonf[prev] = jsonf[prev] + x.strip()
            else: #no colon, multi line property
                if x[:idx] not in jsonf:
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
data["Source"] = jsonlist


def get_stars(data):
    count = 1
    for port in data["Source"]:
        print("Loading " + str(count) + " out of " + str(data["Size"]))
        count += 1
        if "Homepage" in port and port["Homepage"].find("github.com") >= 0:
            url = base+port["Homepage"][port["Homepage"].find("github.com")+length :]
            github = requests.get(url, headers={"Authorization": token}).text
            github_json = json.loads(github)
            if "stargazers_count" in github_json:
                stars = github_json["stargazers_count"]
                port["Stars"] = stars

get_stars(data)

def index_of(lst, name):
    for i in range(len(lst)):
        if lst[i]["Name"] == name:
            return i
    return -1

def get_all_files(data):
    jsonlist = data["Source"]
    file = open('VCPKGHeadersDatabase.txt')
    for line in file:
        idx = line.strip().find(":")
        package = line.strip()[:idx]
        file_name = line.strip()[idx+1:]
        pos = index_of(jsonlist, package)
        if "Files" in jsonlist[pos]:
            jsonlist[pos]["Files"].append(file_name)
        else:
            jsonlist[pos]["Files"] = [file_name]
    file.close()

get_all_files(data)
out = json.dumps(data, sort_keys=True, indent=4)
output = open("output.json", mode = 'w')
output.write(out)
output.close()
