-- Libera RLS para acesso público (anon key)
-- Como o app não usa autenticação Supabase, permite tudo com a chave anônima

DO $$
BEGIN
  -- Drop políticas existentes
  DROP POLICY IF EXISTS "select_escolas" ON escolas;
  DROP POLICY IF EXISTS "select_usuarios" ON usuarios;
  DROP POLICY IF EXISTS "select_ocorrencias" ON ocorrencias;
  DROP POLICY IF EXISTS "select_chamados" ON chamados;
  DROP POLICY IF EXISTS "select_avaliacoes" ON avaliacoes_porteiros;
  DROP POLICY IF EXISTS "select_relatorios" ON relatorios_diarios;
  DROP POLICY IF EXISTS "insert_escolas" ON escolas;
  DROP POLICY IF EXISTS "update_escolas" ON escolas;
  DROP POLICY IF EXISTS "delete_escolas" ON escolas;
  DROP POLICY IF EXISTS "insert_usuarios" ON usuarios;
  DROP POLICY IF EXISTS "update_usuarios" ON usuarios;
  DROP POLICY IF EXISTS "delete_usuarios" ON usuarios;
  DROP POLICY IF EXISTS "insert_ocorrencias" ON ocorrencias;
  DROP POLICY IF EXISTS "update_ocorrencias" ON ocorrencias;
  DROP POLICY IF EXISTS "delete_ocorrencias" ON ocorrencias;
  DROP POLICY IF EXISTS "insert_chamados" ON chamados;
  DROP POLICY IF EXISTS "update_chamados" ON chamados;
  DROP POLICY IF EXISTS "delete_chamados" ON chamados;
  DROP POLICY IF EXISTS "insert_avaliacoes" ON avaliacoes_porteiros;
  DROP POLICY IF EXISTS "update_avaliacoes" ON avaliacoes_porteiros;
  DROP POLICY IF EXISTS "delete_avaliacoes" ON avaliacoes_porteiros;
  DROP POLICY IF EXISTS "insert_relatorios" ON relatorios_diarios;
  DROP POLICY IF EXISTS "update_relatorios" ON relatorios_diarios;
  DROP POLICY IF EXISTS "delete_relatorios" ON relatorios_diarios;

  -- Recria permitindo tudo (acesso público via anon key)
  CREATE POLICY "public_select_escolas" ON escolas FOR SELECT USING (true);
  CREATE POLICY "public_select_usuarios" ON usuarios FOR SELECT USING (true);
  CREATE POLICY "public_select_ocorrencias" ON ocorrencias FOR SELECT USING (true);
  CREATE POLICY "public_select_chamados" ON chamados FOR SELECT USING (true);
  CREATE POLICY "public_select_avaliacoes" ON avaliacoes_porteiros FOR SELECT USING (true);
  CREATE POLICY "public_select_relatorios" ON relatorios_diarios FOR SELECT USING (true);

  CREATE POLICY "public_insert_escolas" ON escolas FOR INSERT WITH CHECK (true);
  CREATE POLICY "public_update_escolas" ON escolas FOR UPDATE USING (true);
  CREATE POLICY "public_delete_escolas" ON escolas FOR DELETE USING (true);

  CREATE POLICY "public_insert_usuarios" ON usuarios FOR INSERT WITH CHECK (true);
  CREATE POLICY "public_update_usuarios" ON usuarios FOR UPDATE USING (true);
  CREATE POLICY "public_delete_usuarios" ON usuarios FOR DELETE USING (true);

  CREATE POLICY "public_insert_ocorrencias" ON ocorrencias FOR INSERT WITH CHECK (true);
  CREATE POLICY "public_update_ocorrencias" ON ocorrencias FOR UPDATE USING (true);
  CREATE POLICY "public_delete_ocorrencias" ON ocorrencias FOR DELETE USING (true);

  CREATE POLICY "public_insert_chamados" ON chamados FOR INSERT WITH CHECK (true);
  CREATE POLICY "public_update_chamados" ON chamados FOR UPDATE USING (true);
  CREATE POLICY "public_delete_chamados" ON chamados FOR DELETE USING (true);

  CREATE POLICY "public_insert_avaliacoes" ON avaliacoes_porteiros FOR INSERT WITH CHECK (true);
  CREATE POLICY "public_update_avaliacoes" ON avaliacoes_porteiros FOR UPDATE USING (true);
  CREATE POLICY "public_delete_avaliacoes" ON avaliacoes_porteiros FOR DELETE USING (true);

  CREATE POLICY "public_insert_relatorios" ON relatorios_diarios FOR INSERT WITH CHECK (true);
  CREATE POLICY "public_update_relatorios" ON relatorios_diarios FOR UPDATE USING (true);
  CREATE POLICY "public_delete_relatorios" ON relatorios_diarios FOR DELETE USING (true);
END;
$$;
