# Troubleshooting

## Setup Issues

**Q:** I don't have yarn. Where can I install it?

**A:** you need to first have nodejs. and use this command to install yarn:
```shell
npm install --global yarn
```

**Q:** I have a problem on sorbay's permisions on MacOS.

**A:** Please refer to the [Permissions Documentation](permissions.md).

## Recording Issues

**Q:** I'm on Linux, and I'm using Wayland, why is my screen recording black?

**A:** This problem is due Wayland's security on screen recording, you can change to Xorg,
then your recordings would get your screen's content.
