import os
import os.path
import json
from datetime import datetime

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




data["source"] = jsonlist
out = json.dumps(data, sort_keys=True, indent=4)
output = open("output.json", mode = 'w')
output.write(out)
output.close()
