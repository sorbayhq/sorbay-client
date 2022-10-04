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
subprocess.run(f"gh release --repo sorbayhq/sorbay-client create v0.0.1 --title 'v{data['version']}' --notes 'release {data['version']}'", shell=True)

print("building application")
subprocess.run("yarn build", shell=True)

print("publishing artifacts")
subprocess.run("electron-builder --publish", shell=True)
