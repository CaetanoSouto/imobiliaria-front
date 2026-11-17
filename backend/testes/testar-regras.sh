#!/usr/bin/env bash
# Valida as regras de negócio de ofertas e contratos chamando a API de verdade.
#
# Uso:   bash testes/testar-regras.sh [URL_DA_API]      (padrão: http://localhost:8080)
# Requer: backend no ar, curl e node.
#
# O script cria os próprios imóveis ("TESTE ...") e clientes ("rn.*@teste.com") para não
# depender dos dados de exemplo. No final, deixa os imóveis de teste como INDISPONIVEL para
# não aparecerem na vitrine. Ofertas e contratos de teste continuam no banco (não há DELETE).

BASE="${1:-http://localhost:8080}"
TMP="$(mktemp -d)"
STAMP="$(date +%s)"
J='Content-Type: application/json'
PASS=0
FAIL=0
TESTE_IMOVEIS=()

# ---------- utilitários ----------

# call METODO CAMINHO [TOKEN] [CORPO]  -> preenche CODE e BODY
call() {
  local args=(-s -m 30 -o "$TMP/resp" -w '%{http_code}' -X "$1" "$BASE$2" -H "$J")
  [ -n "$3" ] && args+=(-H "Authorization: Bearer $3")
  [ -n "$4" ] && args+=(-d "$4")
  CODE="$(curl "${args[@]}")"
  BODY="$(cat "$TMP/resp")"
}

# campo CAMINHO < json   (ex.: campo status, campo imovel.status)
campo() {
  node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{let o=JSON.parse(s);for(const k of process.argv[1].split(".")){o=o==null?o:o[k]}console.log(o==null?"":o)}catch(e){console.log("")}})' "$1"
}

# do_item ID CAMPO < lista_json   (campo do item da lista com aquele id)
do_item() {
  node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const l=JSON.parse(s);const i=l.find(x=>String(x.id)===process.argv[1]);let o=i;for(const k of process.argv[2].split(".")){o=o==null?o:o[k]}console.log(o==null?"":o)}catch(e){console.log("")}})' "$1" "$2"
}

# confere DESCRIÇÃO ESPERADO OBTIDO
confere() {
  if [ "$2" = "$3" ]; then
    PASS=$((PASS + 1)); echo "  [OK]     $1"
  else
    FAIL=$((FAIL + 1)); echo "  [FALHOU] $1  (esperado: $2 | obtido: $3)"
  fi
}

login() {
  call POST /auth/login "" "{\"email\":\"$1\",\"senha\":\"$2\"}"
  echo "$BODY" | campo token
}

novo_cliente() {
  call POST /users/register "$ADM" "{\"nome\":\"Cliente $1\",\"email\":\"rn.$1.$STAMP@teste.com\",\"senha\":\"123\",\"tipo\":\"USER\"}"
  login "rn.$1.$STAMP@teste.com" 123
}

# novo_imovel TITULO FINALIDADE STATUS -> imprime o id
novo_imovel() {
  local t="TESTE $STAMP $1"
  call POST /imoveis "$ADM" "{\"titulo\":\"$t\",\"finalidade\":\"$2\",\"precoVenda\":300000,\"precoAluguel\":1500,\"status\":\"$3\"}"
  call GET /imoveis ""
  local id
  id="$(echo "$BODY" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const l=JSON.parse(s);const i=l.find(x=>x.titulo===process.argv[1]);console.log(i?i.id:"")})' "$t")"
  TESTE_IMOVEIS+=("$id")
  echo "$id"
}

status_imovel() { call GET "/imoveis/$1" ""; echo "$BODY" | campo status; }

# status_oferta TOKEN_CLIENTE ID
status_oferta() { call GET /ofertas/minhas "$1"; echo "$BODY" | do_item "$2" status; }

oferta() { # oferta TOKEN IMOVEL TIPO VALOR -> preenche CODE/BODY
  call POST /ofertas "$1" "{\"imovelId\":$2,\"tipo\":\"$3\",\"valorProposto\":$4,\"mensagem\":\"teste automatico\"}"
}

# id do contrato de uma oferta (visto pelo admin)
contrato_da_oferta() {
  call GET /contratos "$ADM"
  echo "$BODY" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const l=JSON.parse(s);const c=l.find(x=>String(x.oferta.id)===process.argv[1]);console.log(c?c.id:"")})' "$1"
}

# ---------- preparação ----------

echo "API: $BASE"
call GET /imoveis ""
if [ "$CODE" != "200" ]; then echo "Backend fora do ar (GET /imoveis deu $CODE)."; exit 2; fi

ADM="$(login admin@email.com 123)"
[ -z "$ADM" ] && { echo "Não consegui logar como admin@email.com / 123."; exit 2; }
A="$(novo_cliente a)"; B="$(novo_cliente b)"; C="$(novo_cliente c)"; D="$(novo_cliente d)"
[ -z "$A" ] || [ -z "$B" ] || [ -z "$C" ] || [ -z "$D" ] && { echo "Falha ao criar clientes de teste."; exit 2; }

# ---------- Regra 1: só imóveis disponíveis recebem ofertas ----------
echo
echo "REGRA 1 - Só imóveis DISPONÍVEIS recebem ofertas"
for st in RESERVADO ALUGADO VENDIDO INDISPONIVEL; do
  id="$(novo_imovel "r1 $st" ALUGUEL $st)"
  oferta "$A" "$id" ALUGUEL 1000
  confere "imóvel $st recusa oferta (409)" 409 "$CODE"
done
disp="$(novo_imovel "r1 disponivel" ALUGUEL DISPONIVEL)"
oferta "$A" "$disp" ALUGUEL 1000
confere "imóvel DISPONIVEL aceita oferta (201)" 201 "$CODE"
confere "oferta nasce PENDENTE" PENDENTE "$(echo "$BODY" | campo status)"
oferta "$A" 99999999 ALUGUEL 1000
confere "imóvel inexistente (404)" 404 "$CODE"

# ---------- Regra 2: duas ofertas pendentes do mesmo cliente ----------
echo
echo "REGRA 2 - Cliente não pode ter 2 ofertas PENDENTES para o mesmo imóvel"
oferta "$A" "$disp" ALUGUEL 1200
confere "segunda oferta pendente do mesmo cliente (409)" 409 "$CODE"
echo "  mensagem: $(echo "$BODY" | campo mensagem)"
call GET /ofertas/minhas "$A"
oid="$(echo "$BODY" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const l=JSON.parse(s);const i=l.find(x=>x.imovel.id===Number(process.argv[1]));console.log(i?i.id:"")})' "$disp")"
call PATCH "/ofertas/$oid/cancelar" "$A"
confere "cliente cancela a própria oferta (200 CANCELADA)" "200 CANCELADA" "$CODE $(echo "$BODY" | campo status)"
oferta "$A" "$disp" ALUGUEL 1200
confere "depois de cancelar, pode ofertar de novo (201)" 201 "$CODE"

# ---------- Regra 3: vários clientes ao mesmo tempo ----------
echo
echo "REGRA 3 - Um imóvel recebe ofertas de VÁRIOS clientes ao mesmo tempo"
oferta "$B" "$disp" ALUGUEL 1300; confere "cliente B oferta no mesmo imóvel (201)" 201 "$CODE"
OB="$(echo "$BODY" | campo id)"
oferta "$C" "$disp" ALUGUEL 1400; confere "cliente C oferta no mesmo imóvel (201)" 201 "$CODE"
OC="$(echo "$BODY" | campo id)"
call GET /ofertas?status=PENDENTE "$ADM"
qtd="$(echo "$BODY" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).filter(x=>x.imovel.id===Number(process.argv[1])).length))' "$disp")"
confere "3 ofertas PENDENTES de 3 clientes no imóvel" 3 "$qtd"
OA="$(call GET /ofertas/minhas "$A"; echo "$BODY" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const l=JSON.parse(s);const i=l.find(x=>x.imovel.id===Number(process.argv[1])&&x.status==="PENDENTE");console.log(i?i.id:"")})' "$disp")"

# ---------- Regra 4: aceitar uma oferta ----------
echo
echo "REGRA 4 - Aceitar: imóvel RESERVADO e demais pendentes EM ESPERA"
call PATCH "/ofertas/$OB/aceitar" "$ADM"
confere "admin aceita a oferta de B (200 ACEITA)" "200 ACEITA" "$CODE $(echo "$BODY" | campo status)"
confere "imóvel passa para RESERVADO" RESERVADO "$(status_imovel "$disp")"
confere "oferta de A passa para EM_ESPERA" EM_ESPERA "$(status_oferta "$A" "$OA")"
confere "oferta de C passa para EM_ESPERA" EM_ESPERA "$(status_oferta "$C" "$OC")"
CT="$(contrato_da_oferta "$OB")"
call GET /contratos/meus "$B"
confere "contrato criado para B, AGUARDANDO_ASSINATURA" AGUARDANDO_ASSINATURA "$(echo "$BODY" | do_item "$CT" status)"
oferta "$D" "$disp" ALUGUEL 1000
confere "imóvel RESERVADO não recebe nova oferta (409)" 409 "$CODE"
call PATCH "/ofertas/$OA/aceitar" "$ADM"
confere "não aceita oferta que não está pendente (409)" 409 "$CODE"

# ---------- Regra 5: assinar o contrato ----------
echo
echo "REGRA 5 - Assinar: imóvel ALUGADO/VENDIDO e demais ofertas RECUSADAS"
call PATCH "/contratos/$CT/assinar" "$C"
confere "outro cliente não assina contrato alheio (403)" 403 "$CODE"
call PATCH "/contratos/$CT/assinar" "$B"
confere "B assina o contrato (200 ASSINADO)" "200 ASSINADO" "$CODE $(echo "$BODY" | campo status)"
confere "data de assinatura preenchida" sim "$([ -n "$(echo "$BODY" | campo dataAssinatura)" ] && echo sim || echo nao)"
confere "oferta de aluguel -> imóvel ALUGADO" ALUGADO "$(status_imovel "$disp")"
confere "oferta de A passa para RECUSADA" RECUSADA "$(status_oferta "$A" "$OA")"
confere "oferta de C passa para RECUSADA" RECUSADA "$(status_oferta "$C" "$OC")"
call PATCH "/contratos/$CT/assinar" "$B"
confere "assinar de novo é bloqueado (409)" 409 "$CODE"

venda="$(novo_imovel "r5 venda" VENDA DISPONIVEL)"
oferta "$B" "$venda" VENDA 280000
OV="$(echo "$BODY" | campo id)"
call PATCH "/ofertas/$OV/aceitar" "$ADM"
CTV="$(contrato_da_oferta "$OV")"
call PATCH "/contratos/$CTV/assinar" "$B"
confere "oferta de venda -> imóvel VENDIDO" VENDIDO "$(status_imovel "$venda")"

# ---------- Regra 6: cancelar contrato ----------
echo
echo "REGRA 6 - Cliente desiste: admin cancela o contrato e o imóvel volta a DISPONÍVEL"
call PATCH "/contratos/$CT/cancelar" "$B"
confere "cliente não cancela contrato (403)" 403 "$CODE"
call PATCH "/contratos/$CT/cancelar" "$ADM"
confere "admin cancela contrato assinado (200 CANCELADO)" "200 CANCELADO" "$CODE $(echo "$BODY" | campo status)"
confere "imóvel volta a DISPONIVEL" DISPONIVEL "$(status_imovel "$disp")"
confere "oferta do contrato fica CANCELADA" CANCELADA "$(status_oferta "$B" "$OB")"
oferta "$D" "$disp" ALUGUEL 1500
confere "imóvel pode receber novas ofertas (201)" 201 "$CODE"
call PATCH "/contratos/$CT/cancelar" "$ADM"
confere "cancelar duas vezes é bloqueado (409)" 409 "$CODE"

# cancelamento antes da assinatura: ofertas em espera voltam a PENDENTE
z="$(novo_imovel "r6 cancelar antes de assinar" ALUGUEL DISPONIVEL)"
oferta "$A" "$z" ALUGUEL 1000; ZA="$(echo "$BODY" | campo id)"
oferta "$B" "$z" ALUGUEL 1100; ZB="$(echo "$BODY" | campo id)"
call PATCH "/ofertas/$ZA/aceitar" "$ADM"
confere "imóvel reservado após aceitar" RESERVADO "$(status_imovel "$z")"
confere "oferta de B em espera" EM_ESPERA "$(status_oferta "$B" "$ZB")"
CTZ="$(contrato_da_oferta "$ZA")"
call PATCH "/contratos/$CTZ/cancelar" "$ADM"
confere "cancelar contrato aguardando assinatura (200)" 200 "$CODE"
confere "imóvel volta a DISPONIVEL" DISPONIVEL "$(status_imovel "$z")"
confere "oferta que estava em espera volta a PENDENTE" PENDENTE "$(status_oferta "$B" "$ZB")"

# ---------- Extras: validações e permissões ----------
echo
echo "EXTRAS - Validações e permissões"
oferta "$C" "$z" VENDA 100000
confere "tipo da oferta diferente da finalidade do imóvel (409)" 409 "$CODE"
oferta "$C" "$z" ALUGUEL 0
confere "valor zero é inválido (400)" 400 "$CODE"
oferta "$C" "$z" TROCA 100
confere "tipo inválido (400)" 400 "$CODE"
oferta "$ADM" "$z" ALUGUEL 1000
confere "admin não faz oferta (403)" 403 "$CODE"
call POST /ofertas "" "{\"imovelId\":$z,\"tipo\":\"ALUGUEL\",\"valorProposto\":10}"
confere "sem token (401)" 401 "$CODE"
call PATCH "/ofertas/$ZB/aceitar" "$C"
confere "cliente não aceita oferta (403)" 403 "$CODE"
call PATCH "/ofertas/$ZB/cancelar" "$C"
confere "cliente não cancela oferta de outro (403)" 403 "$CODE"
call GET /ofertas "$C"
confere "cliente não lista todas as ofertas (403)" 403 "$CODE"
call GET /contratos "$C"
confere "cliente não lista todos os contratos (403)" 403 "$CODE"
call PATCH "/imoveis/$z/status" "$C" '{"status":"VENDIDO"}'
confere "cliente não muda o status do imóvel direto (403)" 403 "$CODE"
confere "status do imóvel continua DISPONIVEL" DISPONIVEL "$(status_imovel "$z")"

# ---------- limpeza ----------
for id in "${TESTE_IMOVEIS[@]}"; do
  call PATCH "/imoveis/$id/status" "$ADM" '{"status":"INDISPONIVEL"}'
done
rm -rf "$TMP"

echo
echo "RESULTADO: $PASS aprovados, $FAIL reprovados"
[ "$FAIL" -eq 0 ]
