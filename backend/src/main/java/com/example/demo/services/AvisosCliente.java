package com.example.demo.services;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import com.example.demo.models.ContratoModel;
import com.example.demo.models.ImovelModel;
import com.example.demo.models.OfertaModel;
import com.example.demo.services.AvisoEmail.Detalhe;
import com.example.demo.services.AvisoEmail.Tom;

// O texto de cada aviso enviado ao cliente. Só monta o conteúdo; quem envia é o NotificacaoService.
public final class AvisosCliente {

    private static final DateTimeFormatter DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm");

    private AvisosCliente() {
    }

    public static AvisoEmail ofertaAceita(OfertaModel oferta) {
        String imovel = titulo(oferta.getImovel());
        return new AvisoEmail(
                "Sua oferta foi aceita - " + imovel,
                Tom.SUCESSO,
                "Oferta aceita",
                "Boa notícia: sua oferta foi aceita!",
                saudacao(oferta),
                List.of("A imobiliária aceitou a sua oferta pelo imóvel \"" + imovel + "\".",
                        "O contrato está sendo preparado e passa pela aprovação da administração. "
                                + "Você receberá um novo e-mail assim que ele estiver liberado para assinatura."),
                dadosDaOferta(oferta),
                "Acompanhar minhas ofertas",
                "/cliente/ofertas");
    }

    public static AvisoEmail ofertaRecusada(OfertaModel oferta) {
        String imovel = titulo(oferta.getImovel());
        return new AvisoEmail(
                "Sua oferta foi recusada - " + imovel,
                Tom.NEUTRO,
                "Oferta recusada",
                "Sua oferta não foi aceita desta vez",
                saudacao(oferta),
                List.of("A imobiliária não pôde aceitar a sua oferta pelo imóvel \"" + imovel + "\".",
                        "Você pode fazer uma nova oferta ou conhecer outros imóveis disponíveis no nosso site."),
                dadosDaOferta(oferta),
                "Ver imóveis disponíveis",
                "/");
    }

    public static AvisoEmail contratoAprovado(ContratoModel contrato) {
        OfertaModel oferta = contrato.getOferta();
        String imovel = titulo(oferta.getImovel());
        List<Detalhe> detalhes = dadosDoContrato(contrato);
        if (contrato.getCondicoes() != null && !contrato.getCondicoes().isBlank()) {
            detalhes.add(new Detalhe("Condições", contrato.getCondicoes()));
        }
        return new AvisoEmail(
                "Seu contrato foi aprovado - " + imovel,
                Tom.INFO,
                "Contrato aprovado",
                "Seu contrato está pronto para assinar",
                saudacao(oferta),
                List.of("O contrato do imóvel \"" + imovel + "\" foi aprovado pela administração "
                        + "e já está liberado para assinatura.",
                        "Uma cópia em PDF segue em anexo neste e-mail. "
                                + "Para assinar, acesse o sistema e abra \"Contratos\"."),
                detalhes,
                "Assinar meu contrato",
                "/cliente/contratos");
    }

    public static AvisoEmail contratoAssinado(ContratoModel contrato) {
        OfertaModel oferta = contrato.getOferta();
        String imovel = titulo(oferta.getImovel());
        List<Detalhe> detalhes = dadosDoContrato(contrato);
        if (contrato.getDataAssinatura() != null) {
            detalhes.add(new Detalhe("Assinado em", data(contrato.getDataAssinatura())));
        }
        return new AvisoEmail(
                "Contrato assinado - " + imovel,
                Tom.SUCESSO,
                "Contrato assinado",
                "Assinatura confirmada",
                saudacao(oferta),
                List.of("Recebemos a sua assinatura no contrato do imóvel \"" + imovel + "\". Parabéns!",
                        "Uma cópia do contrato assinado segue em anexo, em PDF. Guarde-a com você."),
                detalhes,
                "Ver meus contratos",
                "/cliente/contratos");
    }

    public static AvisoEmail contratoCancelado(ContratoModel contrato) {
        OfertaModel oferta = contrato.getOferta();
        String imovel = titulo(oferta.getImovel());
        return new AvisoEmail(
                "Seu contrato foi cancelado - " + imovel,
                Tom.ERRO,
                "Contrato cancelado",
                "Seu contrato foi cancelado",
                saudacao(oferta),
                List.of("O contrato do imóvel \"" + imovel + "\" foi cancelado pela imobiliária.",
                        "Em caso de dúvidas, entre em contato conosco. "
                                + "Você pode fazer uma nova oferta quando quiser."),
                dadosDoContrato(contrato),
                "Ver imóveis disponíveis",
                "/");
    }

    // ---- partes comuns ----

    private static List<Detalhe> dadosDaOferta(OfertaModel oferta) {
        List<Detalhe> detalhes = new ArrayList<>();
        ImovelModel imovel = oferta.getImovel();
        detalhes.add(new Detalhe("Imóvel", titulo(imovel)));
        String local = local(imovel);
        if (local != null) {
            detalhes.add(new Detalhe("Local", local));
        }
        detalhes.add(new Detalhe("Modalidade", modalidade(oferta)));
        detalhes.add(new Detalhe("Sua oferta", valor(oferta)));
        return detalhes;
    }

    private static List<Detalhe> dadosDoContrato(ContratoModel contrato) {
        OfertaModel oferta = contrato.getOferta();
        List<Detalhe> detalhes = new ArrayList<>();
        detalhes.add(new Detalhe("Contrato", "nº " + contrato.getId()));
        detalhes.add(new Detalhe("Imóvel", titulo(oferta.getImovel())));
        String local = local(oferta.getImovel());
        if (local != null) {
            detalhes.add(new Detalhe("Local", local));
        }
        detalhes.add(new Detalhe("Modalidade", modalidade(oferta)));
        detalhes.add(new Detalhe("Valor acordado", valor(oferta)));
        return detalhes;
    }

    private static String saudacao(OfertaModel oferta) {
        String nome = oferta.getUsuario() == null ? null : oferta.getUsuario().getNome();
        return nome == null || nome.isBlank() ? "Olá!" : "Olá, " + nome.trim() + "!";
    }

    private static String titulo(ImovelModel imovel) {
        return imovel == null || imovel.getTitulo() == null ? "imóvel" : imovel.getTitulo();
    }

    // "Centro, Santa Maria/RS" (ou só o que existir)
    private static String local(ImovelModel imovel) {
        if (imovel == null || imovel.getBairro() == null) {
            return null;
        }
        var bairro = imovel.getBairro();
        StringBuilder sb = new StringBuilder();
        if (bairro.getNome() != null) {
            sb.append(bairro.getNome());
        }
        if (bairro.getCidade() != null) {
            sb.append(sb.length() > 0 ? ", " : "").append(bairro.getCidade());
            if (bairro.getEstado() != null) {
                sb.append("/").append(bairro.getEstado());
            }
        }
        return sb.length() == 0 ? null : sb.toString();
    }

    private static String modalidade(OfertaModel oferta) {
        return "VENDA".equals(oferta.getTipo()) ? "Venda" : "Aluguel";
    }

    private static String valor(OfertaModel oferta) {
        BigDecimal valor = oferta.getValorProposto();
        if (valor == null) {
            return "—";
        }
        String texto = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("pt-BR")).format(valor);
        return "VENDA".equals(oferta.getTipo()) ? texto : texto + " por mês";
    }

    private static String data(LocalDateTime data) {
        return DATA.format(data);
    }
}
