#!/usr/bin/env python3
"""
Script para executar o schema SQL no Supabase
"""

import os
import psycopg2
from psycopg2 import sql

# Credenciais do Supabase (usando connection string)
SUPABASE_URL = "zfpkywegrkrxtmzlcqnf.supabase.co"
SUPABASE_DB = "postgres"
SUPABASE_USER = "postgres"
SUPABASE_PASSWORD = os.environ.get("SUPABASE_PASSWORD", "")
SUPABASE_PORT = 5432

def execute_schema():
    """Executa o schema.sql no Supabase"""
    
    try:
        # Conectar ao Supabase
        connection = psycopg2.connect(
            host=SUPABASE_URL,
            database=SUPABASE_DB,
            user=SUPABASE_USER,
            password=SUPABASE_PASSWORD,
            port=SUPABASE_PORT,
            sslmode="require"
        )
        
        cursor = connection.cursor()
        
        # Ler o arquivo schema.sql
        with open('database/schema.sql', 'r', encoding='utf-8') as f:
            schema_content = f.read()
        
        # Executar o schema
        cursor.execute(schema_content)
        connection.commit()
        
        print("✅ Schema executado com sucesso!")
        print("✅ Tabelas de withdrawals criadas!")
        print("✅ Indexes e triggers aplicados!")
        
        cursor.close()
        connection.close()
        
    except Exception as e:
        print(f"❌ Erro ao executar schema: {e}")
        return False
    
    return True

if __name__ == "__main__":
    if not SUPABASE_PASSWORD:
        print("⚠️  SUPABASE_PASSWORD não configurada!")
        print("Configure a variável de ambiente SUPABASE_PASSWORD")
        print("\nNo Windows PowerShell:")
        print("$env:SUPABASE_PASSWORD = 'sua_senha_aqui'")
        print("python deploy_schema.py")
    else:
        execute_schema()
