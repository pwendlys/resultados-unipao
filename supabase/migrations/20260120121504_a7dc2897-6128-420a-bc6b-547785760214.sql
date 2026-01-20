-- ETAPA 1: Inserir roles para tesoureiros existentes
-- Usando INSERT com WHERE NOT EXISTS para evitar duplicatas
-- (alternativa ao ON CONFLICT caso a constraint não exista)

INSERT INTO public.user_roles (user_id, role)
SELECT 'bfb84e19-01b9-4971-90ea-66517f8c4bed'::uuid, 'tesoureiro'::app_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = 'bfb84e19-01b9-4971-90ea-66517f8c4bed' 
  AND role = 'tesoureiro'
);

INSERT INTO public.user_roles (user_id, role)
SELECT 'b9ec91ed-91cc-4044-9fb0-4fab952b7c56'::uuid, 'tesoureiro'::app_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = 'b9ec91ed-91cc-4044-9fb0-4fab952b7c56' 
  AND role = 'tesoureiro'
);