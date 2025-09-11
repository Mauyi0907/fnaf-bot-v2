#!/bin/bash

# Script rápido para subir cambios al repositorio
mensaje=$1

if [ -z "$mensaje" ]; then
  mensaje="Actualización automática del bot"
fi

git add .
git commit -m "$mensaje"
git push origin main
