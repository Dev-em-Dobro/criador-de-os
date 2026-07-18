# docs/operations — Operação e continuidade

> Documentos técnicos sobre operar e **não perder dados** dos OSs em produção
> (backup, recuperação, runbooks). Descreve o que **existe hoje no repositório** e
> o que depende de configuração externa (marcado com **⚠️ A VERIFICAR no Console
> Neon** / provedor).

## O que existe aqui

| Documento | O que é | Quem usa |
|---|---|---|
| [`backup-neon.md`](./backup-neon.md) | Backup do **site** (código no git) e do **banco** de cada cliente no Neon: o que existe hoje (nada automatizado além do PITR nativo), como o Neon protege nativamente (history retention + PITR + branching), opções concretas de backup (PITR, `pg_dump` externo, snapshot por branch), backup crítico dos **segredos** (`.env`, `SETTINGS_ENC_KEY`), e passo a passo de restauração. | Dono do produto + devs |

## Relacionados

- Onde vivem os segredos e a connection string: [`../architecture/05-dados-auth-multitenant.md`](../architecture/05-dados-auth-multitenant.md)
- Fluxo do operador ao criar/reconstruir um cliente: [`../architecture/06-scaffolder.md`](../architecture/06-scaffolder.md)
- Segurança dos dados (roles, cifragem, allowlist): [`../security/seguranca-na-criacao-de-os.md`](../security/seguranca-na-criacao-de-os.md)
- Retenção/expurgo de backups no contrato (LGPD): [`../legal/acordo-tratamento-dados-dpa.md`](../legal/acordo-tratamento-dados-dpa.md)
