package com.example.demo.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

// Avisos por e-mail aos clientes (oferta aceita ou recusada, contrato aprovado, assinado ou cancelado).
// Um aviso nunca derruba a operação que o gerou: se o e-mail não sair, a operação continua valendo
// e o resultado (true/false) diz se ele saiu, para a tela poder avisar o usuário.
@Service
public class NotificacaoService {

    private static final Logger log = LoggerFactory.getLogger(NotificacaoService.class);

    private final EmailService emailService;

    public NotificacaoService(EmailService emailService) {
        this.emailService = emailService;
    }

    public boolean enviar(String para, String assunto, String corpo) {
        return enviar(para, assunto, corpo, null, null);
    }

    // Com `anexo` envia o arquivo junto (ex.: o PDF do contrato). Devolve true se o e-mail saiu.
    public boolean enviar(String para, String assunto, String corpo, String nomeAnexo, byte[] anexo) {
        if (para == null || para.isBlank()) {
            return false;
        }
        if (!emailService.configurado()) {
            log.warn("E-mail \"{}\" não enviado: SMTP não configurado (defina MAIL_USER e MAIL_PASSWORD).", assunto);
            return false;
        }
        try {
            if (anexo != null) {
                emailService.enviarComAnexo(para, assunto, corpo, nomeAnexo, anexo);
            } else {
                emailService.enviarEmailTexto(para, assunto, corpo);
            }
            return true;
        } catch (Exception e) {
            log.warn("Falha ao enviar o e-mail \"{}\": {}", assunto, e.getMessage());
            return false;
        }
    }
}
