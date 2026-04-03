CREATE POLICY "Treasurer can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'tesoureiro'::app_role));