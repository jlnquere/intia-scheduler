# Intia Scheduler Demo

Ce projet permet de programmer des envois récurrents de factures (via les API `api/v1/recuringInvoice`) et l'envoi dans le futur d'emails (via `api/v1/delayedEmail`). Pour se faire, on se base principalement sur [Agenda](https://github.com/agenda/agenda) qui permet la programmation de taches (récurrentes ou non) dans le futur. Agenda utilise Mongo pour sa persistance. 


## Organisation des fichiers
- `src`: tout le code de l'app
  - `routers`: les 2 routeurs pour l'API REST
  - `services`: les services de génération de facture et d'envoi d'email à proprement parler. 
  - `utils`: différentes méthodes utilitaires
- `devtools`: les outils nécessaires au process de développement / déploiement
- `infra`: les fichiers de configuration nécessaires au déploiement du projet sur une machine.


## Déploiement

Le dossier `/infra` contient tout ce qui est nécessaire pour déployer ce projet sur une machine. Il suffit que cette machine ait Docker et Docker Compose. 

### .env
Les secrets de l'app sont stockés dans un fichier `.env` (qui ne doit pas être poussé sur git).

```sh
DOMAIN=intia.projects.webd.fr
LETSENCRYPTMAIL=jjy.quere@gmail.com
DOZZLEAUTH="intia:xxxx"
DOCKER_REPO="rg.fr-par.scw.cloud/webdpocs"
DOCKER_PASSWORD="xxx"
```

- `DOMAIN`: le domaine sur lequel l'app sera servi.
- `LETSENCRYPTMAIL`: l'adresse email utilisée pour l'enregistrement avec Let's Encrypt.
- `DOZZLEAUTH`: les credentials pour accéder aux logs de l'app, générés avec `htpasswd -nb user pass`.
- `DOCKER_REPO`: l'adresse du repo docker où est stockée l'image du scheduler.
- `DOCKER_PASSWORD`: le mot de passe du repo docker. 

### Configuration

La configuration du projet se base sur [node-config](https://github.com/node-config/node-config). Les variables sont définies dans les fichiers du dossier [config](./config/). Certaines valeurs peuvent être surchargées par des variables d'environnement:

- `SERVER_PORT`: Le port que le serveur doit écouter. 
- `MONGO_URL`: l'url de connexion au serveur mongo (de la forme `mongodb://127.0.0.1/scheduler`)


Au final, l'appel peut ressembler à ça: 
```sh
MONGO_URL=mongodb://127.0.0.1/scheduler  SERVER_PORT=1234 yarn start
```

### Setup

Voici un exemple pour la mise en place chez Scaleway. Mais tout ceci fonctionne chez n'importe quel autre _cloud provider_, ou même sur une machine _bare metal_. 


Pour l'init de la machine chez Scaleway (il s'agit de la machine la plus basique, avec docker): 

```
scw instance server create type=DEV1-S zone=fr-par-1 image=docker root-volume=l:20G name=[NOM_MACHINE] ip=new project-id=[UUID_DU_PROJET_CHEZ_SCALEWAY]
```

Une fois que c'est bon, il suffit de copier le contenu de `infra/` sur la machine. 

```
ssh root@[IP_MACHINE_SCALEWAY] 'mkdir -p ~/infra'
cp ./infra/. root@[IP_MACHINE_SCALEWAY]:~/infra
```

Enfin, pour lancer ou mettre à jour le projet: 
```
ssh root@[IP_MACHINE_SCALEWAY] 'cd infra && ./reload.sh'
```

## Développement
Pour la phase de dev, il suffit d'appeler `yarn dev`. Ça aura pour effet de lancer l'API (en mode `development`) en surveillant les fichiers du projet. D'un qu'un fichier est modifié, l'API est relancée. 

On peut utiliser aussi le debugger intégré de Visual Studio (grâce à la config dans [.vscode/launch.json](./.vscode/launch.json)): il suffit de faire `F5`. Bien que très pratique (notamment avec les breakpoints), cette approche est un peu plus lente que `yarn dev`. 

## Utilisation

Toutes les opérations se passent par une API REST. Pour voir l'exécution concrète des jobs, il faut accéder aux logs (via [Dozzle](#dozzle) par exemple.)

### RecuringInvoice
#### Création d'une facture récurrente
```bash
curl -X "POST" "https://intia.projects.webd.fr/api/v1/recuringInvoice/" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "id": "987",
  "interval": "* * * * *",
   "sendEmail": true
}'
```
Ici: ID #987, avec une exécution toutes les minutes avec envoi d'email. 
`interval` dois être au format cron.

#### Récupération d'un job de création de factures récurrente
```bash
curl "https://intia.projects.webd.fr/api/v1/recuringInvoice/987"
```

Réponse:
```json
{
  "id": "987",
  "interval": "* * * * *",
  "nextRun": "2022-05-31T12:51:00.000Z",
    "sendEmail": true
}
```
(`nextRun` correspond à la date de la prochaine exécution du job)


#### Suppression d'un job réccurent
```bash
curl -X "DELETE" "https://intia.projects.webd.fr/api/v1/recuringInvoice/987"
```

#### Édition d'un job de création de factures récurrentes
```bash
curl -X "PUT" "https://intia.projects.webd.fr/api/v1/recuringInvoice/987" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "interval": "30 10 * * *",
  "sendEmail": false
}'
```
Ici, on change le job #987 pour que sa récurrence soit "Tous les jours à 10:30", en désactivant l'envoi de mail. 


### DelayedEmail
#### Récupération d'un job de création de factures récurrentes
```bash
curl "https://intia.projects.webd.fr/api/v1/delayedEmail/9087"
```
Réponse:
```json
{
  "id": "9087",
  "interval": "2022-05-31T16:15:00.000Z",
  "mode": "once",
  "nextRun": "2022-05-31T16:15:00.000Z",
  "content": "Check ignition"
}
```


#### Création d'un job d'envoi d'email
```bash
curl -X "POST" "https://intia.projects.webd.fr/api/v1/delayedEmail/" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "content": "Ground control to Major Tom ? ",
  "id": "9087",
  "interval": "2022-05-31T14:08:00.000Z"
}'
```
Ici, on envoie le message `Ground control to Major Tom ?` avec la facture `#9087` en PJ. Le format de `interval` doit être au format date ISO 8601 ("2020-01-01T00:00:00.000Z"). Le prochain envoi aura lieu le 31/05/2022 à 16:08 (heure de Brest⚓). 

#### Suppression d'un job d'envoi d'email
```bash
curl -X "DELETE" "https://intia.projects.webd.fr/api/v1/delayedEmail/9087"
```

#### Édition d'un job d'envoi d'email
```bash
curl -X "PUT" "https://intia.projects.webd.fr/api/v1/delayedEmail/9087" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "content": "Check ignition ",
  "interval": "2022-05-31T16:15:00.000Z"
}'
```
Ici, on change le job #9087 pour qu'il soit exécuté le 31/05/2022 à 18:15 (heure de Brest⚓) en changeant le contenu.

## Environement de développement
Ce projet a été conçu avec les outils ci-dessous. 
Les liens et procédures d'installation donnés sont pour macOS. Mais les équivalents pour les autres OS sont disponibles en ligne.

### Node 17
Pour l'installation avec HomeBrew:
```sh
brew install node@17
```

Note: dans le cas où vous devez alterner plusieurs versions de Node sur la même machine, vous pouvez utiliser [NVM](https://github.com/nvm-sh/nvm)

### Yarn
La gestion des paquets est prise en charge par [Yarn](https://yarnpkg.com/). Il vient en remplacement de NPM. [Plus d'informations sur l'installation](https://yarnpkg.com/getting-started/install)

Note: même si Yarn est l'outil préconisé, NPM devrait faire l'affaire dans les tâches quotidiennes. 

### Docker
Il suffit de suivre [ce guide](https://docs.docker.com/desktop/mac/install/). 

### Visual Studio Code
N'importe quel éditeur de code peut faire l'affaire pour éditer ce projet. Mais il inclut quelques [configurations spécifiques à VSCode](./.vscode/) qui facilitent vraiment la vie (debbuging, code format, ...).

[Installer VSCode](https://code.visualstudio.com/download)

### Dozzle
Dozzle est une image docker qui permet d'exposer, sur le web, le logs d'autres containers docker d'une instance. Il sert, dans le cadre de cette démo, à voir ce qui se passe dans le scheduler.
Pour y accéder: https://intia.projects.webd.fr/logs/.

