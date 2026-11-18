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
    private final EmailRenderer renderer;

    public NotificacaoService(EmailService emailService, EmailRenderer renderer) {
        this.emailService = emailService;
        this.renderer = renderer;
    }

    public boolean enviar(String para, AvisoEmail aviso) {
        return enviar(para, aviso, null, null);
    }

    // Com `anexo` envia o arquivo junto (ex.: o PDF do contrato). Devolve true se o e-mail saiu.
    public boolean enviar(String para, AvisoEmail aviso, String nomeAnexo, byte[] anexo) {
        if (para == null || para.isBlank()) {
            return false;
        }
        if (!emailService.configurado()) {
            log.warn("E-mail \"{}\" não enviado: SMTP não configurado (defina MAIL_USER e MAIL_PASSWORD).",
                    aviso.getAssunto());
            return false;
        }
        try {
            emailService.enviarHtml(para, aviso.getAssunto(), renderer.texto(aviso), renderer.html(aviso),
                    nomeAnexo, anexo);
            return true;
        } catch (Exception e) {
            log.warn("Falha ao enviar o e-mail \"{}\": {}", aviso.getAssunto(), e.getMessage());
            return false;
        }
    }
}
