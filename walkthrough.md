# Walkthrough de Diagnóstico da VPS

## Escopo corrigido

Este walkthrough substitui qualquer análise anterior feita com o IP `198.54.117.242`.

- IP válido da VPS: `185.188.249.39`
- usuário SSH válido: `admin`
- comando correto de acesso: `ssh admin@185.188.249.39`

Conclusão importante: toda conclusão baseada no IP antigo deve ser considerada inválida, porque os testes de conectividade abaixo mostram que o host correto responde em rede e aceita conexão TCP nas portas principais.

## Resultado da conectividade no host correto

Testes executados localmente contra `185.188.249.39`:

- `ping`: respondeu com sucesso, ~193-194 ms
- porta `22/tcp`: aberta
- porta `80/tcp`: aberta
- porta `443/tcp`: aberta

Evidências observadas:

- banner SSH na porta 22: `SSH-2.0-OpenSSH_9.6p1 Ubuntu-3ubuntu13.15`
- HTTP em `http://185.188.249.39`: respondeu `404 Not Found`
- HTTPS em `https://185.188.249.39`: respondeu com cabeçalhos válidos via `curl -k -I`, também retornando `404 Not Found`

Leitura técnica:

- não há sinal de `timeout`
- não há sinal de `connection refused`
- não há sinal de porta `filtered` nas portas testadas
- o host correto está online e com serviços escutando
- o problema anterior pode ter sido causado apenas pelo uso do IP errado

## Diagnóstico corrigido

Com o IP correto, a hipótese principal deixa de ser "VPS inacessível por bloqueio de rede". O cenário mais provável passa a ser um destes:

1. o diagnóstico anterior falhou porque foi executado contra o IP errado
2. a VPS está acessível, mas o serviço esperado atrás de HTTP/HTTPS não está roteado para a aplicação certa
3. existe proxy reverso, Nginx, Traefik, Caddy ou painel respondendo no IP, mas sem a rota/domínio esperado, por isso o `404`
4. os containers podem estar parados, reiniciando ou sem publicar a aplicação correta, mesmo com a máquina acessível
5. a aplicação pode depender de domínio/host header e por isso o acesso direto por IP retorna `404`

## Comando SSH correto

Use somente este comando:

```bash
ssh admin@185.188.249.39
```

Desconsidere instruções com:

- `root@185.188.249.39`
- `ubuntu@185.188.249.39`
- qualquer acesso ao IP `198.54.117.242`

## Diagnóstico inicial após login

Assim que entrar na VPS, rode exatamente:

```bash
whoami
hostname
uptime
free -h
df -h
top
journalctl -xe --no-pager | tail -n 100
```

Objetivo:

- confirmar que você entrou como `admin`
- medir carga, memória e disco
- capturar erros recentes de sistema

## Diagnóstico de Docker e containers

Se o deploy usa Docker Compose, rode:

```bash
docker ps
docker ps -a
docker stats --no-stream
docker compose ps
docker compose logs --tail 200
```

Se o `docker compose` não funcionar, tente:

```bash
docker-compose ps
docker-compose logs --tail 200
```

Como o `docker-compose.yml` deste projeto define os containers `fit-tracker-app` e `fit-tracker-db`, estes comandos costumam ajudar:

```bash
docker logs --tail 200 fit-tracker-app
docker logs --tail 200 fit-tracker-db
docker inspect fit-tracker-app --format '{{json .State}}'
docker inspect fit-tracker-db --format '{{json .State}}'
```

## Verificações de rede dentro da VPS

Depois, confira se a aplicação está escutando onde deveria:

```bash
ss -tulpn | grep -E ':22|:80|:443|:3000'
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1
curl -k -I https://127.0.0.1
```

Se existir proxy reverso, valide também:

```bash
ps aux | grep -E 'nginx|traefik|caddy' | grep -v grep
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}'
```

## Fluxo exato de investigação

Siga nesta ordem:

1. entrar com `ssh admin@185.188.249.39`
2. confirmar saúde básica da máquina com `uptime`, `free -h`, `df -h`
3. verificar erros recentes com `journalctl -xe --no-pager | tail -n 100`
4. listar containers ativos e parados com `docker ps` e `docker ps -a`
5. inspecionar logs do app e do banco com `docker logs --tail 200 fit-tracker-app` e `docker logs --tail 200 fit-tracker-db`
6. confirmar se a aplicação responde localmente em `127.0.0.1:3000`
7. confirmar quais processos estão escutando em `22`, `80`, `443` e `3000`
8. se o IP responder mas a app não, investigar proxy reverso, mapeamento de portas e healthcheck do container

## Como diferenciar erro de IP de problema real de rede/firewall

Neste caso, os testes externos já apontam:

- erro de IP: altamente provável no diagnóstico anterior
- problema de rede/firewall no host correto: pouco provável nas portas `22`, `80` e `443`

Só faria sentido suspeitar de firewall agora se:

- o container publicar apenas em rede interna
- houver regra local bloqueando acesso entre proxy e app
- a aplicação escutar apenas em `127.0.0.1` dentro do container
- existir regra por domínio/host header e não por IP

## Comandos de coleta rápida

Se quiser fazer uma coleta compacta e me mandar a saída, rode:

```bash
whoami
hostname
uptime
free -h
df -h
docker ps
docker ps -a
docker logs --tail 200 fit-tracker-app
docker logs --tail 200 fit-tracker-db
journalctl -xe --no-pager | tail -n 100
ss -tulpn | grep -E ':22|:80|:443|:3000'
```

## Resumo final

- o IP correto é `185.188.249.39`
- o acesso correto é `ssh admin@185.188.249.39`
- o host correto responde a `ping`
- as portas `22`, `80` e `443` estão acessíveis
- o SSH está ativo e anuncia `OpenSSH_9.6p1 Ubuntu`
- o IP responde em HTTP/HTTPS com `404`, o que sugere serviço ativo, mas rota ou app não validada por IP
- a conclusão mais forte é que o diagnóstico anterior foi contaminado pelo uso do IP errado
