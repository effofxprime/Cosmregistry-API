# Cosmregistry API
Using the power of [json-server](https://github.com/typicode/json-server) & [Swagger UI](https://github.com/swagger-api/swagger-ui), `Cosmregistry API` will generate a `data.json` every hour (or however frequently you specify) using the [Bree Scheduler](https://github.com/breejs/bree). The json-server will pick up the changes to serve over its RESTFUL API with a Swagger interface!

Live working version can be viewed here:  https://cosmoschains.thesilverfox.pro/

# Table of contents

- [Cosmregistry API](#cosmregistry-api)
- [Table of contents](#table-of-contents)
  - [Overview](#overview)
    - [Requirements](#requirements)
  - [Installation](#installation)
    - [Create User](#create-user)
    - [Clone repo](#clone-repo)
    - [NPM Install](#npm-install)
    - [Config files](#config-files)
      - [GitHub Access Tokens](#github-access-tokens)
      - [Host and Port](#host-and-port)
    - [Testing](#testing)
      - [Gather Data](#gather-data)
      - [json-server](#json-server)
    - [Admin user tasks](#admin-user-tasks)
      - [Service Files](#service-files)
      - [NGINX Config](#nginx-config)
  - [Complete](#complete)

## Overview
`Cosmregistry API` is a basic RESTFUL API.  It incorporates using json-server to serve our JSON data.  In this application, the json-server is configured to be a read-only RESTFUL API, so only `GET` methods are supported.  The json-server supports implementing a custom landing page by placing an `index.html` into a `./public` folder relative to the location where the json-server ran.  Instead of using a basic index.html, Swagger UI is used.

The application starts the json-server on `127.0.0.1:8000`
You will need to set up an NGINX reverse proxy OR change these settings to fit your needs.  More on this below.

### Requirements
- Node.js
- NGINX

## Installation

### Create User
Create a user for the application
```sh
adduser --gecos "" --disabled-password cosmapi
chpasswd <<<cosmapi:$(< /dev/urandom tr -dc [A-Z][a-z][0-9][!-~] | head -c24)
```
This creates a new user `cosmapi` and sets a random password containing 24 upper/lower/number/special characters.

Using your Admin user, you can log into the new user using sudo and your Admin user password.
```sh
sudo su - cosmapi
```
Alternatively, sudo to root and then su into cosmapi.
```sh
sudo -i
# After supplying your password, you're now logged in as root
su - cosmapi
```

### Clone repo
Clone the repo
```sh
git clone https://github.com/effofxprime/Cosmregistry-API.git
cd Cosmregistry-API
```

### NPM Install
Install the npm modules
```sh
npm i
```

### Config files
There are a couple of things you will need to configure.  These files are located in the `config` directory.
- `config.json`
- `json-server.json`

The `config.json` looks like this
```json
{
    "interval": "every 1 day",
    "token": "YOUR GITHUB TOKEN HERE",
    "user": "YOUR GITHUB USERNAME HERE"
}
```

#### GitHub Access Tokens
You will need to generate a GitHub token. For detailed instructions, visit (GitHub Docs)[https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token] for fine-grained access tokens to learn more.
The TL;DR instructions go:
- Login to GitHub
- Go to Settings
  - Alternatively: https://github.com/settings/tokens?type=beta
- Scroll down and click on Developer Settings
- Click Personal Access Tokens
- Choose Fine-grained tokens
- Click Generate new token at the top right
  - Give it a descriptive name
  - Choose when to expire, far in the future should be fine because we're only giving read-only access
  - Further describe the purpose of this token in the Description
  - Leave it on read-only
  - Scroll down and click on Generate Token

You will want to save this token in a secure location other than your config file.  This way it is retrievable later as it cannot be seen again.

Use your favorite text editor and modify the `config.json`
```sh
nano config/config.json
```

Copy and paste your token into the field and also add your user.  For example:
```json
{
    "interval": "every 1 day",
    "token": "github_pat_59N3nnArhB3ERMIZXTgAspG8L8t8EwCszKgc084lY[fP2bycdjQYTPm28EV6EfXx06q9VjUBhCPCuUsH2",
    "user": "cosmoscodes69"
}
```

The above token is not valid, do not use it.
You can use the GitHub API to see your Rate limits and limit usage. Use the same user and token to auth with curl.
```sh
curl -u cosmoscodes69:github_pat_59N3nnArhB3ERMIZXTgAspG8L8t8EwCszKgc084lY[fP2bycdjQYTPm28EV6EfXx06q9VjUBhCPCuUsH2 -si https://api.github.com/users/effofxprime
```

In this output, the rate limit information is contained in:
```json
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4984
X-RateLimit-Reset: 1690930805
X-RateLimit-Used: 16
```

#### Host and Port
In the `config.json` you can also change the interval, but I do not recommend you do anything less than 1 day for anything other than testing.
You can read more about how Bree intervals work https://jobscheduler.net/#/?id=job-interval-and-timeout-values

The next configuration you may need to alter is the `json-server.json` for the `json-server`.  Chances are you won't need to alter this file.
This file looks like this
```json
{
    "port": 8000,
    "host": "127.0.0.1",
    "read-only": true,
    "watch": true,
    "routes": "./config/routes.json",
    "id": "name",
    "no-cors": false,
    "no-gzip": false
}
```
If you use NGINX, which I recommend, then leave this alone.  Otherwise, you can change the `port` and `host` to fit your needs.
NGINX Configuration is discussed in another section.

The last file in the `config` directory is `routes.json`.  You should **NOT** need to edit this, and will probably break things if you do. See the [json-server custom routes](https://github.com/typicode/json-server#add-custom-routes) documentation for more info.

### Testing
Before we move on to the steps that require your Admin user, we can test things and make sure they work.
To test and make sure we generate the API data, which is stored in `./data/data.json`, run this from the root of the `Cosmregistry-API` directory.

#### Gather Data
Before you test/run this, in the `config.json` change the interval to `every 10 seconds`.
```sh
cd scripts
node .\cosmregistry-api.js
```
Output:
```sh
every 10 seconds
Worker for job "gatherData" online undefined
Success
Worker for job "gatherData" exited with code 0 undefined
Gracefully exiting { code: 'SIGINT', ignore_hook: true, hide_meta: true }
Gracefully exited { code: 'SIGINT', ignore_hook: true, hide_meta: true }
```
When you see that a worker for job "gatherData" has come up followed by a "Success", you can safely `ctrl-c` and stop the script.
Don't forget to change your interval back to `every 1 day`.

#### json-server
Because we haven't set up NGINX to reverse proxy, this won't be publicly available but it will allow us to see if running the command executes as it should.
In the root of the `Cosmregistry-API` directory, run this:
```sh
npx json-server --config "./config/json-server.json" "./data/data.json"
```
You should see this output in your console:
```

  \{^_^}/ hi!

  Loading ./data/data.json
  Loading ./config/routes.json
  Done

  Resources
  http://127.0.0.1:8000/mainnet
  http://127.0.0.1:8000/testnet
  ...
  ... MOAR
  ... MOAR listings


  Other routes
  /api/v1/* -> /$1
  /mainnet/:name -> /:name?type=mainnet
  /testnet/:name -> /:name?type=testnet

  Home
  http://127.0.0.1:8000

  Type s + enter at any time to create a snapshot of the database
  Watching...
```
If you see this, you should be good to go.  `ctrl-c` to stop the process.

### Admin user tasks
I've included service files already set up and ready to be used.  If your `/home` location differs, you will need to edit these files.  As well, if you chose a different user name than `cosmapi` that we created in the beginning, you will need to modify the service files.

From here, `su` into your `admin` user.

#### Service Files
To make this easy, we will create symlinks.  This way, when you update your Cosmregistry-API repo, they will reflect the changes. 
Change into the directory which has the service files.
```sh
cd /home/cosmapi/Cosmregistry-API/service-files
ln -s $(pwd)/* /etc/systemd/system
ls -lha /etc/systemd/system
```
You should see similar output.  What we care about is that the symlinks resolved full paths. Most terminals show working symlinks in blue.
```sh
lrwxrwxrwx  1 root root   61 Jul 31 18:38  api-data.service -> /home/cosmapi/Cosmregistry-API/service-files/api-data.service
...
...
lrwxrwxrwx  1 root root   68 Jul 31 18:38  cosmregistry-api.target -> /home/cosmapi/Cosmregistry-API/service-files/cosmregistry-api.target
...
...
lrwxrwxrwx  1 root root   64 Jul 31 18:38  json-server.service -> /home/cosmapi/Cosmregistry-API/service-files/json-server.service
```

Now let's refresh systemd and enable everything.
```sh
systemctl daemon-reload
systemctl enable api-data json-server cosmregistry-api
systemctl start cosmregistry-api
```

You can start and stop both services using the target, aka cosmregistry-api.  Both rely on each other and this ensures we start both.
As always you can check the status using `systemctl` or view the logs using `journalctl`.  I prefer `journalctl`.
```sh
journalctl -u api-data -f
journalctl -u json-server -f
```
Expected log output for working processes.
Logs for `api-data`
```log
node[216963]: Worker for job "gatherData" online undefined
node[216963]: Success
node[216963]: Worker for job "gatherData" exited with code 0 undefined
```
logs for `json-server` are the same as the test output we saw.  It's fine if you see these entries as they have not caused problems for myself. 
```log
npx[216986]:   Error reading /home/cosmapi/Cosmregistry-API/data/data.json
npx[216986]: ENOENT: no such file or directory, open '/home/cosmapi/Cosmregistry-API/data/data.json'
npx[216986]:   Read error has been fixed :)
npx[216986]:   ./data/data.json has changed, reloading...
npx[216986]:   Loading ./data/data.json
npx[216986]:   Error reading /home/cosmapi/Cosmregistry-API/data/data.json
npx[216986]: No data, empty input at 1:1
npx[216986]: ^
npx[216986]:   Read error has been fixed :)
npx[216986]:   Error reading /home/cosmapi/Cosmregistry-API/data/data.json
npx[216986]: Unexpected end of input at 1:8193
npx[216986]: 27.0","last_modified":"Wed Jul 26 2023"},"cerberus":{"name":"cerberus
npx[216986]:                                                                      ^
npx[216986]:   Read error has been fixed :)
```

#### NGINX Config
The last thing to do is update your NGINX config with a server declaration and set up a reverse proxy.  Here is an example:
```conf
server {
    listen 443 ssl http2;
    server_name yourcoolapi.yourcoolsite.com;

    location / {
        proxy_set_header   Host $http_host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_hide_header Cache-Control;

        proxy_pass http://127.0.0.1:8000;
    }

    ssl_certificate /etc/letsencrypt/live/YOUR-SITE/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/YOUR-SITE/privkey.pem; # managed by Certbot
}
```
You will need to change the `server_name` and `ssl` directives.
Check that your NGINX changes pass the test.
```sh
nginx -t
```
You should see
```sh
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```
Now you can restart your NGINX server to apply the changes.

## Complete
All done!  Visit the URL you set up as the `server_name` directive and test to make sure everything is working.
If you are having trouble, start a [discussion](https://github.com/effofxprime/Cosmregistry-API/discussions) and give a detailed explanation of what is going on.

