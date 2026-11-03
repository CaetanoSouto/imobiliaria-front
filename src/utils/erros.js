// Converte qualquer erro do axios numa frase amigável — nunca mostra JSON cru na tela.
export function mensagemErro(error) {
  if (!error?.response) {
    if (error?.code === 'ECONNABORTED') {
      return 'O servidor demorou demais para responder. Tente novamente.'
    }
    return 'Não foi possível conectar ao servidor. Verifique se o backend está no ar.'
  }

  const { status, data } = error.response
  const doBackend = typeof data === 'string' ? data : data?.mensagem || data?.message

  switch (status) {
    case 400:
      return doBackend || 'Dados inválidos. Revise as informações e tente novamente.'
    case 401:
      return 'Sua sessão expirou. Faça login novamente.'
    case 403:
      return 'Acesso negado. Você não tem permissão para esta ação.'
    case 404:
      return 'Item não encontrado.'
    case 409:
      return doBackend || 'A operação conflita com uma regra de negócio.'
    default:
      return status >= 500
        ? 'Erro interno no servidor. Tente novamente em instantes.'
        : doBackend || 'Algo deu errado. Tente novamente.'
  }
}
