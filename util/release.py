import json
import subprocess

with open("package.json", "r") as f:
    data = json.loads(f.read())

data['version'] = input(f"version (current {data['version']}): ")
print(f"writing new version {data['version']} to package.json")

with open("package.json", "w") as f:
    f.write(json.dumps(data, indent=2))


print("commiting, tagging & pushing release..")
subprocess.run("git checkout master", shell=True)
subprocess.run("git add .", shell=True)
subprocess.run(f"git commit -a -m 'new release {data['version']}'", shell=True)
subprocess.run(f"git tag v{data['version']}", shell=True)
subprocess.run("git push origin master --tags", shell=True)

print("creating github release")
subprocess.run(f"gh release --repo sorbayhq/sorbay-client create v{data['version']} --title 'v{data['version']}' --notes 'release {data['version']}'", shell=True)

print("building & publishing artifacts")
subprocess.run("yarn release", shell=True)
