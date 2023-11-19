# gitpoap-bot

Le bot GitPOAP est une application GitHub construite avec [Probot](https://github.com/probot/probot) ayant deux fonctions principales :
 - [Notifications GitPOAP](https://docs.gitpoap.io/github-bot) : une fonctionnalité pour notifier les utilisateurs lorsqu'une contribution leur a valu un GitPOAP sur les dépôts pris en charge et où les utilisateurs ont choisi d'y participer.
 - [Attributions GitPOAP ad-hoc](https://docs.gitpoap.io/github-bot#tagging-contributors) : la possibilité pour un mainteneur de taguer des utilisateurs ad-hoc sur un ticket ou une demande de tirage (pull request) qui devraient recevoir un GitPOAP.

## Configuration

```sh
# Installer les dépendances
yarn

# Compiler le code TypeScript
yarn build

# Démarrer le bot
yarn start
```

## Docker

```sh
# 1. Construire le conteneur
docker build -t gitpoap-bot .

# 2. Démarrer le conteneur
docker run -e APP_ID=<id-de-l-application> -e PRIVATE_KEY=<valeur-pem> gitpoap-bot
```

Contribution
Si vous avez des suggestions pour améliorer gitpoap-bot, ou souhaitez signaler un bogue, ouvrez un ticket ! Nous serions ravis de recevoir toute contribution.

Pour en savoir plus, consultez le [Guide de contribution](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2022 Jay Puntham-Baker <jay@gitpoap.io>
