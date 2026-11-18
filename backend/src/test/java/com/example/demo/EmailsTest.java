package com.example.demo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import com.example.demo.models.BairroModel;
import com.example.demo.models.ContratoModel;
import com.example.demo.models.ImovelModel;
import com.example.demo.models.OfertaModel;
import com.example.demo.models.UserModel;
import com.example.demo.services.AvisoEmail;
import com.example.demo.services.AvisosCliente;
import com.example.demo.services.EmailRenderer;

// O conteúdo e o HTML dos e-mails enviados aos clientes. Também grava uma prévia de cada e-mail em
// target/emails-previa/ para abrir no navegador e ver como ficou, sem enviar nada.
class EmailsTest {

    private static final Path PREVIA = Path.of("target", "emails-previa");

    private static EmailRenderer renderer(String siteUrl) {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");
        // o mesmo motor que o Spring usa no sistema (expressoes SpEL), só que sem subir o sistema todo
        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(resolver);
        return new EmailRenderer(engine, siteUrl, "Habitare");
    }

    private OfertaModel oferta(String nomeCliente, String tipo) {
        UserModel cliente = new UserModel();
        cliente.setId(1);
        cliente.setNome(nomeCliente);
        cliente.setEmail("maria@email.com");

        ImovelModel imovel = new ImovelModel();
        imovel.setId(3);
        imovel.setTitulo("Apartamento aconchegante no centro");
        imovel.setBairro(new BairroModel(1, "Centro", "Santa Maria", "RS", "97010"));

        OfertaModel oferta = new OfertaModel();
        oferta.setId(7);
        oferta.setUsuario(cliente);
        oferta.setImovel(imovel);
        oferta.setTipo(tipo);
        oferta.setValorProposto(new BigDecimal(tipo.equals("VENDA") ? "890000" : "1500"));
        return oferta;
    }

    private ContratoModel contrato(OfertaModel oferta, String condicoes) {
        ContratoModel contrato = new ContratoModel();
        contrato.setId(12);
        contrato.setOferta(oferta);
        contrato.setCondicoes(condicoes);
        contrato.setDataAssinatura(LocalDateTime.of(2026, 11, 17, 21, 5));
        return contrato;
    }

    private Map<String, AvisoEmail> todos() {
        OfertaModel venda = oferta("Maria Souza", "VENDA");
        Map<String, AvisoEmail> avisos = new LinkedHashMap<>();
        avisos.put("1-oferta-aceita", AvisosCliente.ofertaAceita(venda));
        avisos.put("2-oferta-recusada", AvisosCliente.ofertaRecusada(venda));
        avisos.put("3-contrato-aprovado", AvisosCliente.contratoAprovado(contrato(venda, "Entrada de 20% e saldo em 12 parcelas.")));
        avisos.put("4-contrato-assinado", AvisosCliente.contratoAssinado(contrato(venda, null)));
        avisos.put("5-contrato-cancelado", AvisosCliente.contratoCancelado(contrato(oferta("Maria Souza", "ALUGUEL"), null)));
        return avisos;
    }

    @Test
    void osCincoAvisosGeramHtmlCompletoEGravamPrevia() throws Exception {
        EmailRenderer renderer = renderer("http://localhost:5173");
        Files.createDirectories(PREVIA);

        for (Map.Entry<String, AvisoEmail> e : todos().entrySet()) {
            AvisoEmail aviso = e.getValue();
            String html = renderer.html(aviso);
            Files.writeString(PREVIA.resolve(e.getKey() + ".html"), html, StandardCharsets.UTF_8);

            // nenhuma marca do template pode sobrar no e-mail (o xmlns:th da tag <html> é inofensivo)
            assertFalse(Pattern.compile("\\sth:[a-z]+\\s*=").matcher(html).find(), e.getKey() + ": sobrou atributo th:");
            assertFalse(html.contains("${"), e.getKey() + ": sobrou expressao ${...}");
            assertFalse(html.contains("<!--"), e.getKey() + ": comentario interno foi para o e-mail");

            assertTrue(html.contains("Habitare"), e.getKey() + ": falta a marca");
            assertTrue(html.contains(aviso.getTitulo()), e.getKey() + ": falta o titulo");
            assertTrue(html.contains(aviso.getSelo()), e.getKey() + ": falta o selo");
            assertTrue(html.contains("Olá, Maria Souza!"), e.getKey() + ": falta a saudacao");
            assertTrue(html.contains("Apartamento aconchegante no centro"), e.getKey() + ": falta o imovel");
            assertTrue(html.contains("Centro, Santa Maria/RS"), e.getKey() + ": falta o local");
            assertTrue(html.contains(aviso.getCorFundo()), e.getKey() + ": falta a cor do selo");
        }
    }

    @Test
    void osAssuntosSaoOsCombinados() {
        Map<String, AvisoEmail> avisos = todos();
        assertEquals("Sua oferta foi aceita - Apartamento aconchegante no centro", avisos.get("1-oferta-aceita").getAssunto());
        assertEquals("Sua oferta foi recusada - Apartamento aconchegante no centro", avisos.get("2-oferta-recusada").getAssunto());
        assertEquals("Seu contrato foi aprovado - Apartamento aconchegante no centro", avisos.get("3-contrato-aprovado").getAssunto());
        assertEquals("Contrato assinado - Apartamento aconchegante no centro", avisos.get("4-contrato-assinado").getAssunto());
        assertEquals("Seu contrato foi cancelado - Apartamento aconchegante no centro", avisos.get("5-contrato-cancelado").getAssunto());
    }

    @Test
    void valorSaiFormatadoEAluguelMostraPorMes() {
        EmailRenderer renderer = renderer("http://localhost:5173");
        String venda = renderer.html(AvisosCliente.ofertaAceita(oferta("Maria", "VENDA")));
        String aluguel = renderer.html(AvisosCliente.ofertaAceita(oferta("Maria", "ALUGUEL")));

        assertTrue(venda.contains("890.000,00"));
        assertTrue(venda.contains("Venda"));
        assertTrue(aluguel.contains("1.500,00 por mês"));
        assertTrue(aluguel.contains("Aluguel"));
    }

    @Test
    void textoDoClienteEhEscapadoParaNaoInjetarHtml() {
        EmailRenderer renderer = renderer("http://localhost:5173");
        String html = renderer.html(AvisosCliente.ofertaAceita(oferta("<script>alert(1)</script>", "VENDA")));

        assertTrue(html.contains("&lt;script&gt;"));
        assertFalse(html.contains("<script>alert(1)"));
    }

    @Test
    void condicoesDoContratoAparecemSoQuandoExistem() {
        OfertaModel o = oferta("Maria", "VENDA");
        EmailRenderer renderer = renderer("http://localhost:5173");

        String com = renderer.html(AvisosCliente.contratoAprovado(contrato(o, "Entrada de 20%")));
        String sem = renderer.html(AvisosCliente.contratoAprovado(contrato(o, "  ")));

        assertTrue(com.contains("Condições") && com.contains("Entrada de 20%"));
        assertFalse(sem.contains("Condições"));
    }

    @Test
    void assinaturaMostraADataDaAssinatura() {
        String html = renderer("http://localhost:5173")
                .html(AvisosCliente.contratoAssinado(contrato(oferta("Maria", "VENDA"), null)));
        assertTrue(html.contains("17/11/2026 às 21:05"));
    }

    @Test
    void oBotaoApontaParaOSiteSemBarraDuplicada() {
        EmailRenderer renderer = renderer("http://localhost:5173/");
        OfertaModel o = oferta("Maria", "VENDA");

        String aprovado = renderer.html(AvisosCliente.contratoAprovado(contrato(o, null)));
        String recusada = renderer.html(AvisosCliente.ofertaRecusada(o));

        assertTrue(aprovado.contains("href=\"http://localhost:5173/cliente/contratos\""));
        assertTrue(aprovado.contains("Assinar meu contrato"));
        assertTrue(recusada.contains("href=\"http://localhost:5173/\""));
    }

    @Test
    void semEnderecoDoSiteNaoHaBotao() {
        EmailRenderer renderer = renderer("");
        AvisoEmail aviso = AvisosCliente.contratoAprovado(contrato(oferta("Maria", "VENDA"), null));

        assertFalse(renderer.html(aviso).contains("Assinar meu contrato"));
        assertFalse(renderer.texto(aviso).contains("Assinar meu contrato"));
    }

    @Test
    void aVersaoEmTextoSimplesTemTudoQueOClientePrecisa() {
        String texto = renderer("http://localhost:5173")
                .texto(AvisosCliente.contratoAprovado(contrato(oferta("Maria Souza", "VENDA"), "Entrada de 20%")));

        assertTrue(texto.startsWith("Olá, Maria Souza!"));
        assertTrue(texto.contains("Seu contrato está pronto para assinar"));
        assertTrue(texto.contains("Imóvel: Apartamento aconchegante no centro"));
        assertTrue(texto.contains("Valor acordado:"));
        assertTrue(texto.contains("Condições: Entrada de 20%"));
        assertTrue(texto.contains("Assinar meu contrato: http://localhost:5173/cliente/contratos"));
        assertTrue(texto.contains("Habitare Imóveis"));
        assertFalse(texto.contains("<"), "o texto simples nao pode ter HTML");
    }

    @Test
    void clienteSemNomeRecebeSaudacaoSimples() {
        OfertaModel o = oferta("", "VENDA");
        assertEquals("Olá!", AvisosCliente.ofertaAceita(o).getSaudacao());
    }
}
