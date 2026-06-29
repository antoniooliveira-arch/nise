-- SIME - Sistema Integrado de Monitoramento Escolar
-- Migration SQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  -- Drop todas as tabelas existentes
  DROP TABLE IF EXISTS encaminhamentos CASCADE;
  DROP TABLE IF EXISTS audios CASCADE;
  DROP TABLE IF EXISTS relatorios_diarios CASCADE;
  DROP TABLE IF EXISTS avaliacoes_porteiros CASCADE;
  DROP TABLE IF EXISTS chamados CASCADE;
  DROP TABLE IF EXISTS ocorrencias CASCADE;
  DROP TABLE IF EXISTS usuarios CASCADE;
  DROP TABLE IF EXISTS escolas CASCADE;

  -- Extensão UUID
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
END;
$$;

DO $migration$
BEGIN
  CREATE TABLE IF NOT EXISTS escolas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('CEI', 'CEM', 'EM', 'ERM')),
    endereco TEXT NOT NULL,
    cameras INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    perfil VARCHAR(50) NOT NULL CHECK (perfil IN ('admin', 'tecnico_monitoramento', 'tecnico_tatico')),
    status VARCHAR(20) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    unidades TEXT[],
    senha VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS ocorrencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('seguranca', 'disciplina', 'estrutura', 'outros')),
    tipo VARCHAR(255) NOT NULL,
    ambiente VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    prioridade VARCHAR(20) NOT NULL CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica')),
    status VARCHAR(20) NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_atendimento', 'finalizada', 'encerrada')),
    data_abertura TIMESTAMPTZ DEFAULT NOW(),
    data_encerramento TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS chamados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ocorrencia_id UUID NOT NULL REFERENCES ocorrencias(id) ON DELETE CASCADE,
    tecnico_monitoramento VARCHAR(255) NOT NULL,
    tecnico_tatico VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'atendido', 'finalizado', 'encerrado')),
    data_abertura TIMESTAMPTZ DEFAULT NOW(),
    data_atendimento TIMESTAMPTZ,
    data_finalizacao TIMESTAMPTZ,
    data_encerramento TIMESTAMPTZ,
    observacoes_admin TEXT,
    encerrado_por VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS avaliacoes_porteiros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
    porteiro_nome VARCHAR(255) NOT NULL,
    situacao VARCHAR(20) NOT NULL CHECK (situacao IN ('funcional', 'nao_funcional')),
    motivo VARCHAR(255),
    observacoes TEXT,
    tecnico_responsavel VARCHAR(255) NOT NULL,
    data TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS relatorios_diarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
    data TIMESTAMPTZ DEFAULT NOW(),
    situacao VARCHAR(20) NOT NULL CHECK (situacao IN ('normal', 'atencao', 'critico')),
    observacoes TEXT NOT NULL,
    enviado_por VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS audios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ocorrencia_id UUID NOT NULL REFERENCES ocorrencias(id) ON DELETE CASCADE,
    arquivo_url TEXT NOT NULL,
    transcricao TEXT,
    duracao INTEGER NOT NULL,
    data TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS encaminhamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ocorrencia_id UUID NOT NULL REFERENCES ocorrencias(id) ON DELETE CASCADE,
    administrador VARCHAR(255) NOT NULL,
    destino VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    data TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Índices
  CREATE INDEX IF NOT EXISTS idx_ocorrencias_escola_id ON ocorrencias(escola_id);
  CREATE INDEX IF NOT EXISTS idx_ocorrencias_status ON ocorrencias(status);
  CREATE INDEX IF NOT EXISTS idx_ocorrencias_data_abertura ON ocorrencias(data_abertura);
  CREATE INDEX IF NOT EXISTS idx_chamados_ocorrencia_id ON chamados(ocorrencia_id);
  CREATE INDEX IF NOT EXISTS idx_chamados_status ON chamados(status);
  CREATE INDEX IF NOT EXISTS idx_avaliacoes_porteiros_escola_id ON avaliacoes_porteiros(escola_id);
  CREATE INDEX IF NOT EXISTS idx_relatorios_diarios_escola_id ON relatorios_diarios(escola_id);
  CREATE INDEX IF NOT EXISTS idx_relatorios_diarios_data ON relatorios_diarios(data);

  -- Função updated_at
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $func$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $func$ language 'plpgsql';

  -- Triggers
  DROP TRIGGER IF EXISTS update_escolas_updated_at ON escolas;
  CREATE TRIGGER update_escolas_updated_at BEFORE UPDATE ON escolas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
  CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  DROP TRIGGER IF EXISTS update_ocorrencias_updated_at ON ocorrencias;
  CREATE TRIGGER update_ocorrencias_updated_at BEFORE UPDATE ON ocorrencias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  DROP TRIGGER IF EXISTS update_chamados_updated_at ON chamados;
  CREATE TRIGGER update_chamados_updated_at BEFORE UPDATE ON chamados FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  DROP TRIGGER IF EXISTS update_avaliacoes_porteiros_updated_at ON avaliacoes_porteiros;
  CREATE TRIGGER update_avaliacoes_porteiros_updated_at BEFORE UPDATE ON avaliacoes_porteiros FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  DROP TRIGGER IF EXISTS update_relatorios_diarios_updated_at ON relatorios_diarios;
  CREATE TRIGGER update_relatorios_diarios_updated_at BEFORE UPDATE ON relatorios_diarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  -- RLS
  ALTER TABLE escolas ENABLE ROW LEVEL SECURITY;
  ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
  ALTER TABLE ocorrencias ENABLE ROW LEVEL SECURITY;
  ALTER TABLE chamados ENABLE ROW LEVEL SECURITY;
  ALTER TABLE avaliacoes_porteiros ENABLE ROW LEVEL SECURITY;
  ALTER TABLE relatorios_diarios ENABLE ROW LEVEL SECURITY;
  ALTER TABLE audios ENABLE ROW LEVEL SECURITY;
  ALTER TABLE encaminhamentos ENABLE ROW LEVEL SECURITY;

  -- Políticas
  DROP POLICY IF EXISTS "select_escolas" ON escolas;
  CREATE POLICY "select_escolas" ON escolas FOR SELECT USING (auth.role() = 'authenticated');
  DROP POLICY IF EXISTS "select_usuarios" ON usuarios;
  CREATE POLICY "select_usuarios" ON usuarios FOR SELECT USING (auth.role() = 'authenticated');
  DROP POLICY IF EXISTS "select_ocorrencias" ON ocorrencias;
  CREATE POLICY "select_ocorrencias" ON ocorrencias FOR SELECT USING (auth.role() = 'authenticated');
  DROP POLICY IF EXISTS "select_chamados" ON chamados;
  CREATE POLICY "select_chamados" ON chamados FOR SELECT USING (auth.role() = 'authenticated');
  DROP POLICY IF EXISTS "select_avaliacoes" ON avaliacoes_porteiros;
  CREATE POLICY "select_avaliacoes" ON avaliacoes_porteiros FOR SELECT USING (auth.role() = 'authenticated');
  DROP POLICY IF EXISTS "select_relatorios" ON relatorios_diarios;
  CREATE POLICY "select_relatorios" ON relatorios_diarios FOR SELECT USING (auth.role() = 'authenticated');

  DROP POLICY IF EXISTS "insert_escolas" ON escolas;
  CREATE POLICY "insert_escolas" ON escolas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  DROP POLICY IF EXISTS "update_escolas" ON escolas;
  CREATE POLICY "update_escolas" ON escolas FOR UPDATE USING (auth.role() = 'authenticated');
  DROP POLICY IF EXISTS "delete_escolas" ON escolas;
  CREATE POLICY "delete_escolas" ON escolas FOR DELETE USING (auth.role() = 'authenticated');

  DROP POLICY IF EXISTS "insert_usuarios" ON usuarios;
  CREATE POLICY "insert_usuarios" ON usuarios FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  DROP POLICY IF EXISTS "update_usuarios" ON usuarios;
  CREATE POLICY "update_usuarios" ON usuarios FOR UPDATE USING (auth.role() = 'authenticated');
  DROP POLICY IF EXISTS "delete_usuarios" ON usuarios;
  CREATE POLICY "delete_usuarios" ON usuarios FOR DELETE USING (auth.role() = 'authenticated');

  DROP POLICY IF EXISTS "insert_ocorrencias" ON ocorrencias;
  CREATE POLICY "insert_ocorrencias" ON ocorrencias FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  DROP POLICY IF EXISTS "update_ocorrencias" ON ocorrencias;
  CREATE POLICY "update_ocorrencias" ON ocorrencias FOR UPDATE USING (auth.role() = 'authenticated');
  DROP POLICY IF EXISTS "delete_ocorrencias" ON ocorrencias;
  CREATE POLICY "delete_ocorrencias" ON ocorrencias FOR DELETE USING (auth.role() = 'authenticated');

  DROP POLICY IF EXISTS "insert_chamados" ON chamados;
  CREATE POLICY "insert_chamados" ON chamados FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  DROP POLICY IF EXISTS "update_chamados" ON chamados;
  CREATE POLICY "update_chamados" ON chamados FOR UPDATE USING (auth.role() = 'authenticated');
  DROP POLICY IF EXISTS "delete_chamados" ON chamados;
  CREATE POLICY "delete_chamados" ON chamados FOR DELETE USING (auth.role() = 'authenticated');

  DROP POLICY IF EXISTS "insert_avaliacoes" ON avaliacoes_porteiros;
  CREATE POLICY "insert_avaliacoes" ON avaliacoes_porteiros FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  DROP POLICY IF EXISTS "update_avaliacoes" ON avaliacoes_porteiros;
  CREATE POLICY "update_avaliacoes" ON avaliacoes_porteiros FOR UPDATE USING (auth.role() = 'authenticated');
  DROP POLICY IF EXISTS "delete_avaliacoes" ON avaliacoes_porteiros;
  CREATE POLICY "delete_avaliacoes" ON avaliacoes_porteiros FOR DELETE USING (auth.role() = 'authenticated');

  DROP POLICY IF EXISTS "insert_relatorios" ON relatorios_diarios;
  CREATE POLICY "insert_relatorios" ON relatorios_diarios FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  DROP POLICY IF EXISTS "update_relatorios" ON relatorios_diarios;
  CREATE POLICY "update_relatorios" ON relatorios_diarios FOR UPDATE USING (auth.role() = 'authenticated');
  DROP POLICY IF EXISTS "delete_relatorios" ON relatorios_diarios;
  CREATE POLICY "delete_relatorios" ON relatorios_diarios FOR DELETE USING (auth.role() = 'authenticated');
END;
$migration$;
