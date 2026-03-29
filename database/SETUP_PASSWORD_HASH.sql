-- Script para atualizar a senha do usuário pedrocoelhowz1@gmail.com
-- Senha: @Adm7881
-- Hash bcrypt: $2b$10$Y4fE4fFCGuMcM6Jbw/E7vuyChVBQYktiQZeZZ/QV94zyTEALDvCzO

UPDATE admin_users 
SET senha_hash = '$2b$10$Y4fE4fFCGuMcM6Jbw/E7vuyChVBQYktiQZeZZ/QV94zyTEALDvCzO'
WHERE email = 'pedrocoelhowz1@gmail.com';

-- Verificar se foi atualizado
SELECT id, email, nome, ativo, senha_hash FROM admin_users WHERE email = 'pedrocoelhowz1@gmail.com';
