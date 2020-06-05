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
for filename in files:
    f = open(path+"/"+filename+"/CONTROL")
    prev = ""
    jsonf = {}
    jsonf["Name"] = filename
    for x in f:
        idx = x.find(":")
        if idx == -1 and prev != "":
            jsonf[prev] = x
        else:
            jsonf[x[:idx]] = x[idx+1:].strip()
            prev = x[:idx]
    jsonlist.append(jsonf)
    f.close()
data["source"] = jsonlist
#print(data)
out = json.dumps(data, sort_keys=True, indent=4)
output = open("output/output.json", mode = 'w')
output.write(out)
output.close()
