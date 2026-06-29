-- Atualiza o email do admin para "nise"
UPDATE usuarios SET email = 'nise' WHERE email = 'admin.nise@seguranca.municipio.br' OR nome = 'Administrador NISE';

-- Se não existir nenhum usuário, insere o admin padrão
INSERT INTO usuarios (nome, email, perfil, status, senha)
SELECT 'Administrador NISE', 'nise', 'admin', 'ativo', 'admin123'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'nise');

-- Popula escolas se estiverem vazias (dados mock)
INSERT INTO escolas (nome, tipo, endereco, cameras) VALUES
  ('CEI Luiz Felipe', 'CEI', 'Rua das Flores, 123 - Centro', 16),
  ('CEI São Cristóvão', 'CEI', 'Av. Brasil, 456 - São Cristóvão', 18),
  ('CEI Arco Íris', 'CEI', 'Rua do Arco, 789 - Jardim das Cores', 14),
  ('CEI Bruno Leonardo', 'CEI', 'Rua dos Artistas, 321 - Vila Nova', 16),
  ('CEI Dom Franco', 'CEI', 'Av. Monsenhor, 654 - Centro', 18),
  ('CEI Menino Jesus', 'CEI', 'Rua da Paz, 987 - Bairro Alto', 14),
  ('CEI Nosso Lar', 'CEI', 'Rua da Esperança, 147 - Conjunto Habitat', 16),
  ('CEI Vasco Papa', 'CEI', 'Rua do Esporte, 258 - Vila Athletic', 18),
  ('CEI Criança Feliz', 'CEI', 'Av. da Alegria, 369 - Parque Infantil', 14),
  ('CEM Guilherme', 'CEM', 'Rua das Escolas, 111 - Centro', 22),
  ('CEM Orlando Pereira', 'CEM', 'Av. da Educação, 222 - Jardim Central', 24),
  ('EM Maria Hilda', 'EM', 'Rua Professoras, 333 - Vila dos Professores', 20),
  ('EM Paulo Freire', 'EM', 'Av. do Conhecimento, 444 - Bairro Académico', 22),
  ('EM José Anchieta', 'EM', 'Rua São José, 555 - Centro Histórico', 18),
  ('ERM Álvares de Azevedo', 'ERM', 'Estrada Rural, km 15 - Zona Rural', 10),
  ('ERM Cora Coralina', 'ERM', 'Estrada Rural, km 22 - Comunidade do Brejo', 8),
  ('ERM Euclides Cunha', 'ERM', 'Estrada Rural, km 35 - Assentamento', 10),
  ('ERM Osvaldo Cruz', 'ERM', 'Estrada Rural, km 48 - Comunidade São Francisco', 8),
  ('ERM Vinícius de Moraes', 'ERM', 'Estrada Rural, km 12 - Sitio dos Ipês', 10)
ON CONFLICT DO NOTHING;
