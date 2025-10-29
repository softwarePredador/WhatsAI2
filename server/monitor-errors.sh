#!/bin/bash

# Monitor de Erros - WhatsAI
# Monitora logs de erro em tempo real e exibe resumo

echo "🔍 WhatsAI Error Monitor"
echo "========================="
echo ""

# Cores
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Diretório de logs
LOG_DIR="logs"

# Verificar se diretório existe
if [ ! -d "$LOG_DIR" ]; then
    echo "❌ Diretório de logs não encontrado: $LOG_DIR"
    exit 1
fi

# Função para contar erros únicos
count_unique_errors() {
    local file=$1
    local pattern=$2
    
    if [ -f "$file" ]; then
        local count=$(grep -i "$pattern" "$file" 2>/dev/null | wc -l | tr -d ' ')
        echo $count
    else
        echo "0"
    fi
}

# Função para pegar últimos erros
get_last_errors() {
    local file=$1
    local lines=$2
    
    if [ -f "$file" ]; then
        tail -n "$lines" "$file" 2>/dev/null
    else
        echo "Arquivo não existe"
    fi
}

# ====================================
# 1. WEBHOOK ERRORS
# ====================================
echo -e "${YELLOW}📡 WEBHOOK ERRORS${NC}"
echo "---"

WEBHOOK_LOG="$LOG_DIR/webhook-errors.log"
if [ -f "$WEBHOOK_LOG" ]; then
    # Contar tipos de erro
    SCHEMA_ERRORS=$(count_unique_errors "$WEBHOOK_LOG" "Schema validation failed")
    PROCESSING_ERRORS=$(count_unique_errors "$WEBHOOK_LOG" "Error processing")
    
    echo "Schema validation errors: $SCHEMA_ERRORS"
    echo "Processing errors: $PROCESSING_ERRORS"
    
    # Último erro
    echo ""
    echo "Último erro (últimas 20 linhas):"
    tail -20 "$WEBHOOK_LOG" | grep -A 5 "Error:" | head -15
else
    echo -e "${GREEN}✅ Nenhum erro de webhook${NC}"
fi

echo ""
echo "---"
echo ""

# ====================================
# 2. MEDIA PROCESSING ERRORS
# ====================================
echo -e "${YELLOW}🖼️  MEDIA PROCESSING ERRORS${NC}"
echo "---"

MEDIA_LOG="$LOG_DIR/media-processing.log"
if [ -f "$MEDIA_LOG" ]; then
    # Contar tipos de erro
    UPLOAD_ERRORS=$(count_unique_errors "$MEDIA_LOG" "Failed to upload")
    DOWNLOAD_ERRORS=$(count_unique_errors "$MEDIA_LOG" "Failed to download")
    S3_ERRORS=$(count_unique_errors "$MEDIA_LOG" "Invalid character in header")
    
    echo "Upload errors: $UPLOAD_ERRORS"
    echo "Download errors: $DOWNLOAD_ERRORS"
    echo "S3 header errors: $S3_ERRORS"
    
    # Últimos erros
    if [ $UPLOAD_ERRORS -gt 0 ] || [ $DOWNLOAD_ERRORS -gt 0 ] || [ $S3_ERRORS -gt 0 ]; then
        echo ""
        echo "Últimos 3 erros:"
        tail -100 "$MEDIA_LOG" | grep -B 2 "ERROR:" | tail -15
    fi
else
    echo -e "${GREEN}✅ Nenhum erro de mídia${NC}"
fi

echo ""
echo "---"
echo ""

# ====================================
# 3. CACHE ERRORS
# ====================================
echo -e "${YELLOW}⚡ CACHE ERRORS${NC}"
echo "---"

CACHE_LOG="$LOG_DIR/cache-errors.log"
if [ -f "$CACHE_LOG" ]; then
    CACHE_ERRORS=$(count_unique_errors "$CACHE_LOG" "ERROR")
    
    echo "Total errors: $CACHE_ERRORS"
    
    if [ $CACHE_ERRORS -gt 0 ]; then
        echo ""
        echo "Último erro:"
        tail -10 "$CACHE_LOG"
    fi
else
    echo -e "${GREEN}✅ Nenhum erro de cache${NC}"
fi

echo ""
echo "---"
echo ""

# ====================================
# 4. RESUMO GERAL
# ====================================
echo -e "${YELLOW}📊 RESUMO GERAL${NC}"
echo "---"

TOTAL_ERRORS=0

# Somar todos os erros
if [ -f "$WEBHOOK_LOG" ]; then
    TOTAL_ERRORS=$((TOTAL_ERRORS + $(count_unique_errors "$WEBHOOK_LOG" "Error")))
fi

if [ -f "$MEDIA_LOG" ]; then
    TOTAL_ERRORS=$((TOTAL_ERRORS + $(count_unique_errors "$MEDIA_LOG" "ERROR")))
fi

if [ -f "$CACHE_LOG" ]; then
    TOTAL_ERRORS=$((TOTAL_ERRORS + $(count_unique_errors "$CACHE_LOG" "ERROR")))
fi

if [ $TOTAL_ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Nenhum erro encontrado! Sistema rodando perfeitamente.${NC}"
else
    echo -e "${RED}⚠️  Total de erros encontrados: $TOTAL_ERRORS${NC}"
    echo ""
    echo "Para monitorar em tempo real:"
    echo "  tail -f logs/webhook-errors.log"
    echo "  tail -f logs/media-processing.log"
    echo "  tail -f logs/cache-errors.log"
fi

echo ""
echo "========================="
echo "Última atualização: $(date)"
