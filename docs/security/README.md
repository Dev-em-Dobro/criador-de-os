# docs/security — Segurança dos dados dos clientes

> Documentos técnicos sobre como os **dados dos clientes** ficam protegidos na
> fábrica de OSs (camada de aplicação + banco). Cada afirmação rastreia a um
> arquivo real do repositório; o que depende de configuração externa está marcado
> com **⚠️ A VERIFICAR**.

## O que existe aqui

| Documento | O que é | Quem usa |
|---|---|---|
| [`seguranca-na-criacao-de-os.md`](./seguranca-na-criacao-de-os.md) | Todas as regras de segurança que entram em vigor quando um OS/cliente novo nasce: isolamento por banco, roles de menor privilégio, REVOKE de PUBLIC, cifragem AES-256-GCM das configurações, auth-first, allowlist de views + SQL parametrizado, provisionamento de credenciais e **as lacunas ainda não enforçadas**. | Dono do produto + devs |

## Relacionados

- Isolamento multitenant e endpoint de query seguro: [`../architecture/05-dados-auth-multitenant.md`](../architecture/05-dados-auth-multitenant.md)
- O que o scaffolder gera de segurança por padrão: [`../architecture/06-scaffolder.md`](../architecture/06-scaffolder.md)
- Contexto legal/LGPD (DPA): [`../legal/acordo-tratamento-dados-dpa.md`](../legal/acordo-tratamento-dados-dpa.md)
- Backup e recuperação: [`../operations/backup-neon.md`](../operations/backup-neon.md)
