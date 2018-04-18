# MPRO

## Pre-requisites
* MongoDB
* Node.js
* Git 

## Setup

### Install dependencies

#### MongoDB
Go to MongoDB main page (https://www.mongodb.com/), download and install.

### Node.js
Go to Node.js main page (https://nodejs.org/en/), download and install.

### Git
Go to Git main page (https://git-scm.com/), download and install.

#### To get source code from parent repository
``` bash
> $ git clone https://github.com/enriqueyt/mpro.git
```

### To install Node.js dependencies
``` bash
> $ npm install
```

### Docker (Alternative)
Docker can be used as an alternative to create a MongoDB instance.

Go to Docker main page (https://www.docker.com), install docker engine and docker compose. 

## Development

### To start MongoDB server:         
``` bash
> $ mongod
```

### To create the MongoDB docker container (Alternative):
``` bash
> $ cd docker
> $ docker-compose up -d mongodb
```

### To start, restart and stop the MongoDB container:
``` bash
> $ docker-compose start mongodb
> $ docker-compose restart mongodb
> $ docker-compose stop mongodb
```
Go to Docker Compose page documentation (https://docs.docker.com/compose) to view more details.

### To start the Node.js server: 
``` bash
> $ npm start
```

### To preview the app on web browser
Go to http://localhost:3000

## Git Rules

### Commit messages:
Use the following prefix to classified the actions made:
* #N for adding new features.
* #M for updating features.
* #R for removing features or some piece of code.
* #F for fixing some bug on features.

### Branches
Use the following prefix to create branches:
* feature/FUNCTIONALITY-NAME for normal development.
* fix/ISSUE-DESCRIPTION for bug's fix.

## Version
0.1.0

## Author
* **EYT** - *Initial work* - [enriqueyt](https://github.com/enriqueyt)
* **DER** - *Contributor* - [nanielito](https://github.com/nanielito)

## Licence
N/A
