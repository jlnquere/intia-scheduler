#!/bin/bash

DOCKER_REPO="rg.fr-par.scw.cloud/webdpocs"

show_usage() {
    echo "Ce script permet de construire et publier une image docker."
    echo -e "\nUsage:\npublish.sh [nom_de_limage] [mode:dev|prod] [build_number] [build_version]"
    echo -e "    - [nom_de_limage]: le nom de l'image qui sera envoyée sur le repository"
    echo -e "    - [mode]: le mode de build (dev ou prod)"
    echo -e "    - [build_number]: un integer représentant le # du build. Sur Github, on passera GITHUB_RUN_NUMBER"
    echo -e "    - [build_version]: une version (semver) du package. Optionnel"
    echo -e "\nExemple:\npublish.sh api-server dev 159 3.0.1-stage2 \n"
    echo -e "\nSi la variable d'environement DRY_RUN est deffinie (peu importe la valeur), tout sera fait sauf le push final. Ca permet de valider le processus sans impacter le repo central."
}

show_error() {
    echo -e "Erreur: $1\n\n"
    show_usage
    exit 1
}

DOCKER_IMAGE_NAME=$1
if [[ -z "${DOCKER_IMAGE_NAME}" ]]; then
    show_error "Vous devez spécifier le nom de l'image à construire."
fi

BUILD_MODE=$2
if [[ -z "${BUILD_MODE}" ]]; then
    show_error "Vous devez spécifier le mode de build."
fi

BUILD_NUMBER=$3
if [[ -z "${BUILD_NUMBER}" ]]; then
    show_error "Vous devez spécifier le numéro de build."
fi

BUILD_VERSION=$4
if [[ -z "${BUILD_VERSION}" ]]; then
    echo -e "  Aucun build version fourni. Tentative de divination à partir du package.json ..."
    BUILD_VERSION=$(grep -m1 version package.json | awk -F: '{ print $2 }' | sed 's/[", ]//g')
    echo -e "    Version trouvée: $BUILD_VERSION"
fi

if [[ -n "${DRY_RUN}" ]]; then
    echo -e "Dry mode activé. L'image docker sera construite, mais rien ne sera publié sur le repo."
fi

echo -e "Build de l'image $DOCKER_IMAGE_NAME"

if [[ $BUILD_MODE = "dev" ]]
then
    echo -e "   En mode dev"
    CONF_ENV="stage"
    TAG="dev"
    if [[ -z "${BUILD_NUMBER}" ]]; then
        TAGBUILD=:${TAG}
    else
        TAGBUILD=:${TAG}-${BUILD_NUMBER}
    fi
    
    if [[ -z "${BUILD_VERSION}" ]]; then
        TAGBUILDVERSION=:${TAG}
    else
        TAGBUILDVERSION=:${TAG}-${BUILD_VERSION}
    fi
    TAG=:$TAG
else
    echo -e "   En mode prod"
    CONF_ENV="prod"
    TAG=""
    if [[ -z "${BUILD_NUMBER}" ]]; then
        TAGBUILD=''
    else
        TAGBUILD=:${BUILD_NUMBER}
    fi
    
    if [[ -n "${BUILD_VERSION}" ]]; then
        TAGBUILDVERSION=:${BUILD_VERSION}
    fi
fi

echo "   CONF_ENV:$CONF_ENV"
echo "   Application des tags suivants: ${TAGBUILD} ${TAGBUILDVERSION} ${TAG}"
echo -e "\n\n\n\n"

docker build --build-arg CONF_ENV=$CONF_ENV \
--build-arg BUILD_NUMBER=${BUILD_NUMBER} \
-t ${DOCKER_REPO}/${DOCKER_IMAGE_NAME}${TAGBUILD}  \
-t ${DOCKER_REPO}/${DOCKER_IMAGE_NAME}${TAGBUILDVERSION} \
-t ${DOCKER_REPO}/${DOCKER_IMAGE_NAME}${TAG} \
--file=dockerfile . || { echo 'Docker build failed' ; exit 1; }

if [[ -z "${DRY_RUN}" ]]; then
    docker image push --all-tags ${DOCKER_REPO}/${DOCKER_IMAGE_NAME} || { echo 'Docker push failed' ; exit 1; }
else
    echo "   Dry run mode activé: rien n'est poussé sur le repo central :)"
fi

