from collections import defaultdict

projects = defaultdict(str)

hlias = []
with open('preferences-hlias.txt', 'r') as f:
    for line in f:
        rank = line.split("(")[1].replace(")", "")
        hlias.append(int(rank.strip()))
        
        name, num = line.split("(")
        name = name.strip()
        num = int(num.replace(")", "").strip())
        projects[num] = name


kontsantinos = []
with open('preferences-Konstantinos.txt', 'r') as f:
    for line in f:
        line = line.split()[0].split(")P")[1]
        kontsantinos.append(int(line))

def mean(r1, r2):
    return (r1 + r2) / 2

def geometric_mean(r1, r2):
    import math
    return math.sqrt(r1 * r2)

preferences = defaultdict(int)
geo_preferences = defaultdict(int)
for i in range(1, 17):
    preferences[i] = mean(hlias.index(i) + 1, kontsantinos.index(i) + 1)
    geo_preferences[i] = geometric_mean(hlias.index(i) + 1, kontsantinos.index(i) + 1)


with open("final_preferences.txt", "w") as f:
    for pos, i in enumerate(sorted(geo_preferences.keys(), key=lambda x: geo_preferences[x])):
        f.write(f"{pos:2d}){i:2d} {projects[i]}\n")

