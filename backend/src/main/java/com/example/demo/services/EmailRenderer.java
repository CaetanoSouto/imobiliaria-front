package com.example.demo.services;

import java.time.Year;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

// Monta o e-mail: o HTML bonito (template email/aviso) e a versão em texto simples, que vai junto
// para quem lê e-mail sem HTML.
@Service
public class EmailRenderer {

    private final TemplateEngine engine;
    private final String siteUrl;
    private final String marca;

    public EmailRenderer(TemplateEngine engine,
            @Value("${app.site-url:}") String siteUrl,
            @Value("${app.nome-imobiliaria:Habitare}") String marca) {
        this.engine = engine;
        this.siteUrl = siteUrl;
        this.marca = marca;
    }

    public String html(AvisoEmail aviso) {
        Context contexto = new Context(Locale.forLanguageTag("pt-BR"));
        contexto.setVariable("aviso", aviso);
        contexto.setVariable("marca", marca);
        contexto.setVariable("link", link(aviso));
        contexto.setVariable("ano", Year.now().getValue());
        return engine.process("email/aviso", contexto);
    }

    public String texto(AvisoEmail aviso) {
        StringBuilder sb = new StringBuilder();
        sb.append(aviso.getSaudacao()).append("\n\n");
        sb.append(aviso.getTitulo()).append("\n\n");
        for (String paragrafo : aviso.getParagrafos()) {
            sb.append(paragrafo).append("\n\n");
        }
        for (AvisoEmail.Detalhe d : aviso.getDetalhes()) {
            sb.append(d.getRotulo()).append(": ").append(d.getValor()).append("\n");
        }
        String link = link(aviso);
        if (link != null) {
            sb.append("\n").append(aviso.getBotaoTexto()).append(": ").append(link).append("\n");
        }
        sb.append("\nAtenciosamente,\n").append(marca).append(" Imóveis\n");
        return sb.toString();
    }

    // Endereço completo do botão (site + caminho). Sem site configurado ou sem caminho, não há botão.
    private String link(AvisoEmail aviso) {
        if (siteUrl == null || siteUrl.isBlank() || aviso.getBotaoCaminho() == null) {
            return null;
        }
        String base = siteUrl.trim();
        while (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return base + aviso.getBotaoCaminho();
    }
}
