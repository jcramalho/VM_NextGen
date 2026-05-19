# VM Next Gen

Com o passar do tempo, as aplicações vão ficando desatualizadas.
Neste caso, foi o que aconteceu. 
A App original também foi desenvolvida de uma forma monolítica e havia necessidade de a modularizar para facilitar a sua manutenção evolutiva.

Esta versão compreende dois serviços:
- **backend**: corresponde a uma API de dados REST;
- **frontend**: corresponde à interface web desenvolvida em Vue 3.

Este repositório é e continuará a ser público.
Quem quiser pode usar esta plataforma à vontade (uma referência à fonte é sempre eticamente louvável).

---

## Instalação

O processo de instalação é extremamente simples bastando clonar o repositório e correr o orquestrador:

```sh
$ git clone https://github.com/jcramalho/VM_NextGen.git
$ cd VM_NextGen
$ docker compose up --build -d
```
Nota: se a versão do docker instalada for anterior à 25 será necessário usar `docker-compose`.

--- 

2026-05-19 by jcr
