<p align="center" width="100%">
    <img width="33%" src="logo.png">
</p>

# About
Sorbay is an Open Source alternative to Loom. It allows you to quickly create and share
screen- and camera recordings. The project consists of two parts: The 
[backend](https://github.com/sorbayhq/sorbay) service to store, organize and share recordings and 
the client (this project) for Windows, macOS and Linux to do the actual recordings.

## Setup
If you just want to run the client, download it 
[here](https://github.com/sorbayhq/sorbay-client/releases). We have binaries for Windows and macOS. 
Linux is planned.

## Setup for development

First, clone the repository to your local machine.
```shell
git clone https://github.com/sorbayhq/sorbay-client
cd sorbay-client
```

Next, start the app by running:
```shell
yarn start
```

The app should open and greet you with a login screen. Once you fill in the URL to your 
[backend](https://github.com/sorbayhq/sorbay) service, you should be able to do your first 
recording.

## State of the project

Sorbay is in its very early stages. Consider it an alpha that shouldn't be running in
production just yet. Our goal was to release Sorbay with a working minimalized featureset
and then add more and more features later on.

## Help, bugs & discussion
If you encounter any bugs up an issue in this repository. If you need help or want to chat about
the project, join our 
[Slack](https://join.slack.com/t/sorbay/shared_invite/zt-1m3nio46o-ERrjXDNgSLr_ToklzUfFtw) channel.