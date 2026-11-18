# Sobe o backend carregando as credenciais de e-mail do arquivo mail.env.local.
# O mail.env.local NAO vai para o git (veja o .gitignore): e la que ficam o seu Gmail e a senha de app.
#
# Uso (a partir da pasta backend):
#   .\rodar.ps1                    # sobe na porta 8080
#   .\rodar.ps1 -Porta 8090        # sobe em outra porta (ex.: se o XAMPP usa a 8080)
#   .\rodar.ps1 -SoVerificar       # so mostra o que foi carregado, sem subir o backend
param(
  [int]$Porta = 8080,
  [string]$Arquivo = (Join-Path $PSScriptRoot 'mail.env.local'),
  [switch]$SoVerificar
)

if (Test-Path $Arquivo) {
  foreach ($linha in Get-Content $Arquivo) {
    $linha = $linha.Trim()
    if (-not $linha -or $linha.StartsWith('#') -or -not $linha.Contains('=')) { continue }
    $nome, $valor = $linha -split '=', 2
    $nome = $nome.Trim(); $valor = $valor.Trim().Trim('"').Trim("'")
    # variavel em branco nao e definida: assim vale o padrao do application.properties
    if ($valor) { Set-Item -Path "Env:$nome" -Value $valor }
  }
  # no Gmail o remetente precisa ser a propria conta
  if ($env:MAIL_USER -and -not $env:MAIL_FROM) { $env:MAIL_FROM = $env:MAIL_USER }
} else {
  Write-Host "Aviso: $Arquivo nao existe. Copie mail.env.local.example para mail.env.local e preencha."
}

Write-Host ''
Write-Host 'E-mail do backend:'
Write-Host ("  MAIL_HOST     : {0}" -f $(if ($env:MAIL_HOST) { $env:MAIL_HOST } else { '(padrao: smtp.mailgun.org)' }))
Write-Host ("  MAIL_PORT     : {0}" -f $(if ($env:MAIL_PORT) { $env:MAIL_PORT } else { '(padrao: 587)' }))
Write-Host ("  MAIL_USER     : {0}" -f $(if ($env:MAIL_USER) { $env:MAIL_USER } else { '(vazio: o envio de e-mail fica DESLIGADO)' }))
Write-Host ("  MAIL_PASSWORD : {0}" -f $(if ($env:MAIL_PASSWORD) { "preenchida ($($env:MAIL_PASSWORD.Length) caracteres)" } else { '(vazia)' }))
Write-Host ("  MAIL_FROM     : {0}" -f $(if ($env:MAIL_FROM) { $env:MAIL_FROM } else { '(padrao)' }))
if ($env:MAIL_PASSWORD -and $env:MAIL_PASSWORD.Length -ne 16 -and $env:MAIL_HOST -like '*gmail*') {
  Write-Host '  Atencao: a senha de app do Google tem 16 letras, sem espacos. Confira se copiou inteira.'
}
Write-Host ''

if ($SoVerificar) { return }

Set-Location $PSScriptRoot
mvn spring-boot:run "-Dspring-boot.run.arguments=--server.port=$Porta"
