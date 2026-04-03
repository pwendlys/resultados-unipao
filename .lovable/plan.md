

## Correção: RLS ao gerar PDF da ATA

### Causa Raiz

O bucket de storage `fiscal-files` tem policies que permitem upload (INSERT) apenas para **admin**. O tesoureiro não tem permissão de upload, causando o erro "new row violates row-level security policy" ao fazer `supabase.storage.from('fiscal-files').upload(...)`.

Policies atuais do storage:
- **INSERT**: apenas `admin`
- **SELECT**: apenas `admin` e `fiscal`
- **DELETE**: apenas `admin`

O tesoureiro está excluído de todas as operações de storage.

### Solução: Migration com novas storage policies

Adicionar 2 policies no storage `objects`:

1. **INSERT** para tesoureiro — permitir upload de PDFs da ATA
2. **SELECT** para tesoureiro — permitir download/leitura dos PDFs

```sql
CREATE POLICY "Treasurer can upload fiscal files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'fiscal-files'
  AND has_role(auth.uid(), 'tesoureiro'::app_role)
);

CREATE POLICY "Treasurer can read fiscal files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'fiscal-files'
  AND has_role(auth.uid(), 'tesoureiro'::app_role)
);
```

### Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| Migration SQL (nova) | +2 storage policies para tesoureiro no bucket `fiscal-files` |

### O que NÃO será alterado
- Nenhuma tabela do módulo ATA (RLS já está correto)
- Nenhum componente ou hook
- Nenhuma policy existente de admin/fiscal
- Nenhuma tabela antiga

