#!/usr/bin/env python3

import os
import os.path
import json
import requests
import subprocess
import sys
from datetime import datetime

cwd = os.path.dirname(os.path.realpath(__file__))
os.chdir(cwd)
vcpkg_dir = os.path.join(cwd, "vcpkg.git")

def cloneAndUpdate():
    print(vcpkg_dir)
    if os.path.exists(vcpkg_dir):
        command = subprocess.run(['git', 'pull'], capture_output=True, cwd=vcpkg_dir)
        if(command.returncode != 0):
            sys.stdout.buffer.write(command.stdout)
            sys.stderr.buffer.write(command.stderr)
            exit(command.returncode)
    else:
        print("Cloning vcpkg.git")
        command = subprocess.run(['git', 'clone', 'git@github.com:microsoft/vcpkg.git', 'vcpkg.git'], capture_output=True)
        if(command.returncode != 0):
            sys.stdout.buffer.write(command.stdout)
            sys.stderr.buffer.write(command.stderr)
            exit(command.returncode)


def getFiles(path):
    files = os.listdir(path)
    return list(filter(lambda x: x[0] != '.', files))

cloneAndUpdate()
path = "vcpkg.git/ports"
data = {}
data["Generated On"] = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
files = getFiles(path)
data["Size"] = len(files)
jsonlist = []
#systems found in ci.baseline.txt
systems = ["arm64-windows", "arm-uwp", "x64-linux", "x64-osx", "x64-uwp", "x64-windows", "x64-windows-static", "x86-windows"]


ci_dict = {}
def gen_ci():
    ci_file = open(os.path.join(vcpkg_dir, 'scripts', 'ci.baseline.txt'))
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
        mode = "control"
        try:
            f = open(path+"/"+filename+"/CONTROL") #opening each CONTROL file
        except FileNotFoundError:
            print("No CONTROL file for " + filename)
            print("Using manifest mode")
            f = open(path+"/"+filename+"/vcpkg.json")
            mode = "manifest"
        prev = ""
        jsonf = {}
        jsonf["Name"] = filename
        jsonf["Features"] = []
        feature_dict = {}
        if mode == "control":
            for line in f:
                if line.strip() == "" or line.strip()[0] == "#":
                    if mode == "feature":
                        jsonf["Features"].append(feature_dict)
                        feature_dict = {}
                        mode = "control"
                    continue
                idx = line.strip().find(":") # colon delimiter for properties
                if idx == -1 and prev != "":
                    jsonf[prev] = jsonf[prev] + line.strip()
                else: #no colon, multi line property
                    if line[:idx] == "Feature":
                        mode = "feature"
                        feature_dict["Name"] = line[idx+1:].strip()
                    else:
                        if mode == "feature":
                            feature_dict[line[:idx]] = line[idx+1:].strip()
                        elif line[:idx] not in jsonf:
                            jsonf[line[:idx]] = line[idx+1:].strip()
                            prev = line[:idx]
            if mode == "feature":
                jsonf["Features"].append(feature_dict)
                feature_dict = {}
                mode = "control"
        else:
            manifest = json.load(f)
            for keys in manifest.keys():
                if keys == 'version-string':
                    jsonf["Version"] = manifest[keys]
                elif keys == 'description':
                    jsonf["Description"] = ' '.join(manifest[keys]) if type(manifest[keys]) is list else manifest[keys]
                else:
                    jsonf[keys.capitalize()] = manifest[keys]
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
            github = requests.get(url).text
            github_json = json.loads(github)
            if "stargazers_count" in github_json:
                stars = github_json["stargazers_count"]
                port["Stars"] = stars

get_stars(data)

out = json.dumps(data, sort_keys=True, indent=4)
output = open(os.path.join(cwd, "..", "output.json"), mode = 'w')
output.write(out)
output.close()
