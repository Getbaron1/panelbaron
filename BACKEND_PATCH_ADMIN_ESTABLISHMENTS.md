Cole esta rota em `packages/backend/src/routes/admin.ts` dentro da funcao exportada que registra as rotas admin.

```ts
  app.get("/v1/admin/establishments", { preHandler: app.authenticate }, async (request, reply) => {
    const actor = request.authUser || (request as any).user;
    const actorSub = String(actor?.sub || "").trim();
    const actorRole = String(actor?.role || "").trim().toLowerCase();

    const isPrivilegedAdmin = ["admin", "super_admin"].includes(actorRole);

    const result = isPrivilegedAdmin
      ? await app.db.query(
          `select
             id,
             owner_id,
             name,
             slug,
             email,
             phone,
             address,
             description,
             status,
             logo_url,
             primary_color,
             secondary_color,
             background_color,
             trial_ends_at,
             created_at,
             updated_at
           from public.establishments
           order by created_at desc`
        )
      : await app.db.query(
          `select
             id,
             owner_id,
             name,
             slug,
             email,
             phone,
             address,
             description,
             status,
             logo_url,
             primary_color,
             secondary_color,
             background_color,
             trial_ends_at,
             created_at,
             updated_at
           from public.establishments
           where owner_id::text = $1
           order by created_at desc`,
          [actorSub]
        );

    return {
      success: true,
      data: result.rows,
    };
  });
```

Depois:

1. Reinicie o backend do VPS.
2. Teste:
```bash
curl -H "Authorization: Bearer SEU_TOKEN" https://api.getbaron.com.br/v1/admin/establishments
```
3. Quando essa rota responder `success: true`, o painel ja tentara consumi-la primeiro.
